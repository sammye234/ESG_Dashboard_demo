// client/src/components/charts/IntensityChart.js
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getValueFromRow, getProductionValue, detectColumns } from '../../utils/columnDetector';


const getDefaultData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({ month, intensity: 0 }));
};


const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-800">{data.month}</p>
        <p className="text-sm text-gray-600">
          Intensity: <span className="font-bold text-green-600">
            {data.intensity.toFixed(6)}
          </span> kg CO₂e/{data.unit || 'unit'}
        </p>
        {data.totalEmissions !== undefined && data.totalEmissions > 0 && (
          <>
            <p className="text-xs text-gray-500 mt-1">
              Emissions: {data.totalEmissions.toFixed(2)} kg CO₂e
            </p>
            <p className="text-xs text-gray-500">
              Production: {data.production.toFixed(2)} {data.unit}
            </p>
          </>
        )}
      </div>
    );
  }
  return null;
};


const findColumnValue = (row, possibleNames) => {
  if (!row) return null;
  
  for (const name of possibleNames) {

    if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
      return parseFloat(row[name]);
    }
    
   
    const keys = Object.keys(row);
    const matchedKey = keys.find(key => 
      String(key).toLowerCase().replace(/[\s\-_\(\)]/g, '') === 
      String(name).toLowerCase().replace(/[\s\-_\(\)]/g, '')
    );
    
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && row[matchedKey] !== '') {
      return parseFloat(row[matchedKey]);
    }
  }
  
  return null;
};


const IntensityChart = ({ emissionsData, productionData, intensityData }) => {
  
  const chartData = useMemo(() => {
    // ✅ PRIORITY 1: Use pre-calculated intensity data if available
    if (intensityData && intensityData.length > 0) {
      console.log('📊 Using pre-calculated intensity data from separate sheet');
      
      return intensityData.map(row => {
        const month = row.Month || row.month || '';
        const intensity = parseFloat(
          row['Emission_Intensity(tCO2/pc)'] ||
          row['Emission_Intensity'] || 
          row['Intensity'] || 
          row['emission_intensity'] ||
          row['intensity'] || 
          0
        );
        
        const totalEmissions = parseFloat(
          row['Total_Emissions'] || 
          row['total_emissions'] || 
          row['TotalEmissions'] ||
          0
        );
        
        const production = parseFloat(
          row['Production'] || 
          row['Pcs'] || 
          row['pcs'] ||
          row['Kg'] || 
          row['kg'] ||
          row['Weight(Kg)'] ||
          0
        );
        
        const unit = row['Unit'] || row['unit'] || 'pc';
        
        console.log(`  ${month}: Intensity=${intensity} (pre-calculated)`);
        
        return {
          month: month.toString().substring(0, 3),
          intensity: parseFloat(intensity.toFixed(6)),
          totalEmissions: totalEmissions,
          production: production,
          unit: unit
        };
      });
    }

    // ✅ PRIORITY 2: Calculate from emissions + production data
    console.log('🔢 Calculating intensity from emissions + production data');
    
    if (!emissionsData && !productionData) {
      console.log('⚠️ No data provided to IntensityChart');
      return getDefaultData();
    }

    // Use whichever data is available (they might be the same sheet)
    const dataSource = productionData || emissionsData;
    
    if (!dataSource || dataSource.length === 0) {
      console.log('⚠️ Data source is empty');
      return getDefaultData();
    }

    // Auto-detect column names using smart detector
    console.log('🔍 Auto-detecting column names...');
    const detectedCols = detectColumns(dataSource);
    console.log('✅ Detected columns:', detectedCols);

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    
    return months.map(month => {
    // Find data for this month - convert to string first
    let emissionRow = emissionsData?.find(row => {
      const rowMonth = String(row.Month || row.month || '').toLowerCase();
      const targetMonth = String(month).toLowerCase();
      return rowMonth === targetMonth;
    });
    
    let productionRow = productionData?.find(row => {
      const rowMonth = String(row.Month || row.month || '').toLowerCase();
      const targetMonth = String(month).toLowerCase();
      return rowMonth === targetMonth;
    });
    

      
      // If using same sheet for both, use the same row
      if (!productionRow && dataSource === emissionsData) {
        productionRow = emissionRow;
      }
      if (!emissionRow && dataSource === productionData) {
        emissionRow = productionRow;
      }
      
      const row = emissionRow || productionRow;
      
      if (!row) {
        console.log(`⚠️ No data found for ${month}`);
        return { 
          month: month.substring(0, 3),
          intensity: 0, 
          unit: 'N/A',
          totalEmissions: 0,
          production: 0
        };
      }

      // ✅ Check if intensity is already in the same row (pre-calculated)
      const preCalculatedIntensity = findColumnValue(row, [
        'Emission_Intensity(tCO2/pc)', 'Emission_Intensity', 'emission_intensity',
        'EmissionIntensity', 'Intensity', 'intensity', 'Carbon_Intensity',
        'carbon_intensity', 'CarbonIntensity'
      ]);

      if (preCalculatedIntensity !== null && !isNaN(preCalculatedIntensity) && preCalculatedIntensity > 0) {
        const productionVal = getProductionValue(row);
        const totalEmissions = getValueFromRow(row, 'totalEmissions') || 
                               findColumnValue(row, ['Total_Emissions', 'total_emissions', 'TotalEmissions']) || 
                               0;
        
        console.log(`✅ ${month}: Using pre-calculated intensity = ${preCalculatedIntensity}`);
        
        return {
          month: month.substring(0, 3),
          intensity: parseFloat(preCalculatedIntensity.toFixed(6)),
          unit: productionVal.unit || 'pc',
          totalEmissions: totalEmissions,
          production: productionVal.value
        };
      }

      // ✅ Calculate intensity from Total_Emissions and Production
      // Try smart detector first
      let totalEmissions = getValueFromRow(row, 'totalEmissions');
      
      // Fallback to manual detection if smart detector fails
      if (totalEmissions === null || isNaN(totalEmissions)) {
        totalEmissions = findColumnValue(row, [
          'Total_Emissions', 'total_emissions', 'TotalEmissions',
          'Total Emissions', 'total emissions', 'Emissions',
          'CO2_Total', 'co2_total', 'CO2Total'
        ]) || 0;
      }
      
      // Get production value (priority: kg > pcs > USD)
      let production = 0;
      let unit = '';
      
      // Try smart detector first
      const smartProduction = getProductionValue(row);
      if (smartProduction.value > 0) {
        production = smartProduction.value;
        unit = smartProduction.unit;
      } else {
        // Fallback to manual detection
        // ✅ Priority 1: Weight(Kg)
        const kg = findColumnValue(row, [
          'Weight(Kg)', 'weight(kg)', 'Production_Kg', 'production_kg',
          'Weight_Kg', 'weight_kg', 'WeightKg', 'weightkg', 'Kg', 'kg'
        ]);
        
        if (kg !== null && !isNaN(kg) && kg > 0) {
          production = kg;
          unit = 'kg';
        }
        // ✅ Priority 2: Pcs
        else {
          const pcs = findColumnValue(row, [
            'Pcs', 'pcs', 'Production_Pcs', 'production_pcs',
            'ProductionPcs', 'productionpcs', 'Pieces', 'pieces',
            'Units', 'units', 'Quantity', 'quantity'
          ]);
          
          if (pcs !== null && !isNaN(pcs) && pcs > 0) {
            production = pcs;
            unit = 'pcs';
          }
          // ✅ Priority 3: USD
          else {
            const usd = findColumnValue(row, [
              'USD', 'usd', 'Revenue', 'revenue', 'Sales_USD', 'sales_usd',
              'SalesUSD', 'salesusd', 'Sales', 'sales', 'Value', 'value', 
              'sales usd', 'sales USD'
            ]);
            
            if (usd !== null && !isNaN(usd) && usd > 0) {
              production = usd;
              unit = 'USD';
            }
          }
        }
      }
      
      // Calculate intensity (handle division by zero)
      const intensity = production > 0 ? totalEmissions / production : 0;
      
      console.log(`📊 ${month}: Emissions=${totalEmissions}, Production=${production} ${unit}, Intensity=${intensity.toFixed(6)}`);
      
      return {
        month: month.substring(0, 3),
        intensity: parseFloat(intensity.toFixed(6)),
        totalEmissions,
        production,
        unit
      };
    });
  }, [emissionsData, productionData, intensityData]);

  // Calculate statistics (only from valid data)
  const validIntensities = chartData.filter(d => d.intensity > 0).map(d => d.intensity);
  const avgIntensity = validIntensities.length > 0 
    ? validIntensities.reduce((sum, val) => sum + val, 0) / validIntensities.length 
    : 0;
  const minIntensity = validIntensities.length > 0 
    ? Math.min(...validIntensities) 
    : 0;
  const maxIntensity = validIntensities.length > 0 
    ? Math.max(...validIntensities) 
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Emission Intensity (kg CO₂e per product)
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Monthly emission intensity across all products
      </p>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            label={{ value: 'kg CO₂e', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="intensity" 
            stroke="#10B981" 
            strokeWidth={2}
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Emission Intensity"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Average Intensity</p>
          <p className="text-lg font-bold text-green-600">
            {avgIntensity.toFixed(6)}
          </p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Min Intensity</p>
          <p className="text-lg font-bold text-blue-600">
            {minIntensity.toFixed(6)}
          </p>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Max Intensity</p>
          <p className="text-lg font-bold text-orange-600">
            {maxIntensity.toFixed(6)}
          </p>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
        💡 <strong>How it works:</strong>
        <br/>
        <strong>Priority 1:</strong> Uses pre-calculated intensity from dedicated sheet (if uploaded)
        <br/>
        <strong>Priority 2:</strong> Calculates intensity = Total_Emissions ÷ Production
        <br/>
        <strong>Production Priority:</strong> kg → pcs → USD (uses whichever is available)
        <br/>
        <strong>Smart Detection:</strong> Recognizes ANY column naming style (underscores, dashes, parentheses, etc.)
      </div>
    </div>
  );
};

export default IntensityChart;