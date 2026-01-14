// client/src/utils/emissionCalculators.js
import { 
  MATERIAL_EF, 
  CHEMICAL_EF, 
  TRANSPORT_EF, 
  BUSINESS_TRAVEL_ROUTES,
  COMMUTING_EF,
  WASTE_EF,
  UPSTREAM_FUEL_ENERGY_EF,
  EOL_EF,
  calculateMaterialEF,
  EMISSION_FACTORS
} from './efFactors';

/**
 * Detect if values are in tons or kg based on column headers and data magnitude
 */
const detectUnit = (data) => {
  if (!data || data.length === 0) return 'tons';
  
  const headers = Object.keys(data[0]);
  const hasKgUnit = headers.some(h => 
    h.toLowerCase().includes('(kg)') || 
    h.toLowerCase().includes('kg)') ||
    h.toLowerCase().includes('_kg')
  );
  
  const hasTonUnit = headers.some(h => 
    h.toLowerCase().includes('(ton)') || 
    h.toLowerCase().includes('(t)') ||
    h.toLowerCase().includes('_ton') ||
    h.toLowerCase().includes('tco2') ||
    h.toLowerCase().includes('t co2')
  );

  if (hasTonUnit) return 'tons';
  if (hasKgUnit) return 'kg';

  let totalValue = 0;
  let count = 0;
  
  data.forEach(row => {
    Object.values(row).forEach(val => {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        totalValue += num;
        count++;
      }
    });
  });

  const avgValue = count > 0 ? totalValue / count : 0;
  return avgValue > 10000 ? 'kg' : 'tons';
};

/**
 * SCOPE 3 - PURCHASED GOODS & SERVICES
 * Formula: Emissions = Quantity (tonnes) × EF (tCO₂e/tonne)
 * Per PDF: Section 5.1, uses Average Data Method & Spend Based Method
 */
export const calculatePurchasedGoods = (data) => {
  let totalEmissions = 0;
  const details = [];

  data.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      let value = parseFloat(row[key]) || 0;

      if (value === 0) return;

      // Check materials (Fabrics - Section 5.1.1)
      let foundMatch = false;
      Object.keys(MATERIAL_EF).forEach((material) => {
        const matKey = material.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (keyLower.includes(matKey)) {
          const ef = MATERIAL_EF[material];
          // Convert kg to tonnes if needed
          const valueInTonnes = keyLower.includes('kg') ? value / 1000 : value;
          const emission = valueInTonnes * ef; // Result in tCO₂e
          totalEmissions += emission;
          details.push({
            category: 'Fabrics',
            item: key,
            quantity: value,
            quantityUnit: keyLower.includes('kg') ? 'kg' : 'tonnes',
            ef: ef,
            efUnit: 'tCO₂e/tonne',
            emission: emission
          });
          foundMatch = true;
        }
      });

      // Check chemicals (Section 5.1.2)
      if (!foundMatch) {
        Object.keys(CHEMICAL_EF).forEach((chemical) => {
          const chemKey = chemical.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (keyLower.includes(chemKey)) {
            const ef = CHEMICAL_EF[chemical];
            const valueInTonnes = keyLower.includes('kg') ? value / 1000 : value;
            const emission = valueInTonnes * ef; // Result in tCO₂e
            totalEmissions += emission;
            details.push({
              category: 'Chemicals & Accessories',
              item: key,
              quantity: value,
              quantityUnit: keyLower.includes('kg') ? 'kg' : 'tonnes',
              ef: ef,
              efUnit: 'tCO₂e/tonne',
              emission: emission
            });
            foundMatch = true;
          }
        });
      }
    });
  });

  return {
    total: totalEmissions,
    details: details,
    unit: 'tCO₂e'
  };
};

/**
 * SCOPE 3 - CAPITAL GOODS
 * Formula: Using Spend Based Method (GZA Calculator)
 * Per PDF: Section 5.2
 */
export const calculateCapitalGoods = (data) => {
  let totalEmissions = 0;
  const details = [];

  // Capital goods EF from PDF Section 5.2 (using spend-based method)
  const CAPITAL_GOODS_EF = {
    'bricks': 0.5,
    'cement': 0.9,
    'tiles': 0.4,
    'rod': 2.5,
    'steel': 2.5,
    'machinery': 1.5,
    'equipment': 1.5
  };

  data.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const value = parseFloat(row[key]) || 0;

      if (value === 0) return;

      Object.keys(CAPITAL_GOODS_EF).forEach((item) => {
        const itemKey = item.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (keyLower.includes(itemKey)) {
          const ef = CAPITAL_GOODS_EF[item];
          const emission = value * ef; // Assuming value in tonnes
          totalEmissions += emission;
          details.push({
            item: key,
            quantity: value,
            ef: ef,
            emission: emission
          });
        }
      });
    });
  });

  return {
    total: totalEmissions,
    details: details,
    unit: 'tCO₂e'
  };
};

/**
 * SCOPE 3 - UPSTREAM TRANSPORTATION
 * Formula: Emissions = Distance (km) × Weight (tonnes) × EF (tCO₂e/km.tonne)
 * Per PDF: Section 5.3, Average Data Method
 */
export const calculateUpstreamTransportation = (data) => {
  let totalEmissions = 0;
  const details = [];

  data.forEach((row) => {
    const distance = parseFloat(row.distance_km || row.distance || 0);
    const weight = parseFloat(row.weight_tonnes || row.weight_ton || row.weight || 0);
    const vehicleType = (row.vehicle_type || row.vehicle || '').toLowerCase();

    if (distance === 0 || weight === 0) return;

    // Per PDF Section 5.3: Small van (3.5-7.5 tons) = 0.00049, Large van (>17 tons) = 0.00018
    let ef = TRANSPORT_EF['van_large'].value; // Default large
    
    if (vehicleType.includes('small') || weight < 7.5) {
      ef = TRANSPORT_EF['van_small'].value;
    }

    const emission = distance * weight * ef; // Result in tCO₂e
    totalEmissions += emission;

    details.push({
      route: row.route || 'Not specified',
      distance: distance,
      distanceUnit: 'km',
      weight: weight,
      weightUnit: 'tonnes',
      vehicle: vehicleType || 'large van',
      ef: ef,
      efUnit: 'tCO₂e/km.tonne',
      emission: emission
    });
  });

  return {
    total: totalEmissions,
    details: details,
    unit: 'tCO₂e'
  };
};

/**
 * SCOPE 3 - DOWNSTREAM TRANSPORTATION & DISTRIBUTION
 * Formula: Emissions = Distance (km) × Weight (tonnes) × EF (tCO₂e/km.tonne)
 * Per PDF: Section 5.4, Average Data Method
 */
export const calculateDownstreamTransportation = (data) => {
  let totalEmissions = 0;
  const details = [];

  data.forEach((row) => {
    const distance = parseFloat(row.distance_km || row.distance || 0);
    const weight = parseFloat(row.weight_tonnes || row.weight_ton || row.weight || 0);
    const vehicleType = (row.vehicle_type || row.vehicle || '').toLowerCase();

    if (distance === 0 || weight === 0) return;

    let ef = TRANSPORT_EF['van_large'].value;
    
    if (vehicleType.includes('small') || weight < 7.5) {
      ef = TRANSPORT_EF['van_small'].value;
    }

    const emission = distance * weight * ef;
    totalEmissions += emission;

    details.push({
      route: row.route || 'Not specified',
      distance: distance,
      distanceUnit: 'km',
      weight: weight,
      weightUnit: 'tonnes',
      vehicle: vehicleType || 'large van',
      ef: ef,
      efUnit: 'tCO₂e/km.tonne',
      emission: emission
    });
  });

  return {
    total: totalEmissions,
    details: details,
    unit: 'tCO₂e'
  };
};

/**
 * SCOPE 3 - BUSINESS TRAVEL
 * Formula: Emissions = Trips × Employees × EF per trip (tCO₂e)
 * Per PDF: Section 5.5, Supplier Specific Method
 * Reference: https://applications.icao.int/icec/Home/Index
 */
export const calculateBusinessTravel = (data) => {
  let totalEmissions = 0;
  const details = [];

  data.forEach((row) => {
    const route = (row.route || '').toLowerCase().replace(/[^a-z]/g, '');
    const trips = parseFloat(row.trips || row.num_trips || 1);
    const employees = parseFloat(row.employees || row.num_employees || 1);

    let emission = 0;
    let routeName = 'Custom';
    let efPerTrip = 0;

    // Check predefined routes from PDF Section 5.5
    Object.keys(BUSINESS_TRAVEL_ROUTES).forEach((key) => {
      if (route.includes(key.replace('dhaka_', ''))) {
        const routeData = BUSINESS_TRAVEL_ROUTES[key];
        efPerTrip = routeData.emission_per_trip;
        emission = efPerTrip * trips * employees;
        routeName = routeData.name;
      }
    });

    // Custom route calculation by distance
    if (emission === 0 && row.distance_km) {
      const distance = parseFloat(row.distance_km);
      const flightType = (row.flight_type || 'international').toLowerCase();
      const efPerKm = flightType === 'domestic' 
        ? BUSINESS_TRAVEL_ROUTES.custom.emission_per_km_domestic
        : BUSINESS_TRAVEL_ROUTES.custom.emission_per_km;
      
      emission = distance * efPerKm * trips * employees; // Already in tCO₂e
      routeName = `Custom Route (${distance} km)`;
      efPerTrip = distance * efPerKm;
    }

    if (emission > 0) {
      totalEmissions += emission;
      details.push({
        route: routeName,
        trips: trips,
        employees: employees,
        efPerTrip: efPerTrip,
        efUnit: 'tCO₂e/trip/employee',
        emission: emission
      });
    }
  });

  return {
    total: totalEmissions,
    details: details,
    unit: 'tCO₂e'
  };
};

/**
 * SCOPE 3 - EMPLOYEE COMMUTING
 * Formula: Emissions = Employees × Avg Distance (km) × Days × EF (kgCO₂e/km) / 1000
 * Per PDF: Section 5.6, Supplier Specific Method
 */
export const calculateEmployeeCommuting = (data) => {
  let totalEmissions = 0;
  const details = [];

  data.forEach((row) => {
    const employees = parseFloat(row.num_employees || row.employees || 0);
    const distance = parseFloat(row.avg_distance_km || row.distance_km || row.distance || 0);
    const method = (row.commute_method || row.method || 'bus').toLowerCase().replace(/[^a-z]/g, '');
    const days = parseFloat(row.days_per_year || row.days || 250); // Default 250 working days

    if (employees === 0 || distance === 0) return;

    // Find matching commute method from PDF Section 5.6
    let ef = COMMUTING_EF['public_bus']; // Default
    Object.keys(COMMUTING_EF).forEach((key) => {
      const keyClean = key.replace(/[^a-z]/g, '');
      if (method.includes(keyClean)) {
        ef = COMMUTING_EF[key];
      }
    });

    // EF is in kgCO₂e/km, so convert to tCO₂e
    const emission = (employees * distance * days * ef) / 1000;
    totalEmissions += emission;

    details.push({
      commuteMethod: method,
      employees: employees,
      avgDistance: distance,
      distanceUnit: 'km',
      daysPerYear: days,
      ef: ef,
      efUnit: 'kgCO₂e/km',
      emission: emission
    });
  });

  return {
    total: totalEmissions,
    details: details,
    unit: 'tCO₂e'
  };
};

/**
 * SCOPE 3 - WASTE GENERATION
 * Formula: Emissions = Amount (tonnes) × EF (tCO₂e/tonne)
 * Per PDF: Section 5.7, Average Data Method
 */
export const calculateWaste = (data) => {
  let totalEmissions = 0;
  const details = [];

  data.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      let value = parseFloat(row[key]) || 0;

      if (value === 0) return;

      // Match waste types from PDF Section 5.7
      Object.keys(WASTE_EF).forEach((wasteType) => {
        const wasteKey = wasteType.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (keyLower.includes(wasteKey)) {
          const ef = WASTE_EF[wasteType];
          // Convert kg to tonnes if needed
          const valueInTonnes = keyLower.includes('kg') ? value / 1000 : value;
          const emission = valueInTonnes * ef; // Result in tCO₂e
          totalEmissions += emission;
          details.push({
            wasteType: key,
            amount: value,
            amountUnit: keyLower.includes('kg') ? 'kg' : 'tonnes',
            ef: ef,
            efUnit: 'tCO₂e/tonne',
            emission: emission
          });
        }
      });
    });
  });

  return {
    total: totalEmissions,
    details: details,
    unit: 'tCO₂e'
  };
};

/**
 * SCOPE 3 - FUEL & ENERGY RELATED ACTIVITIES (Upstream)
 * Formula: Emissions = Fuel Used × Upstream EF (kgCO₂e/unit) / 1000
 * Per PDF: Section 5.8, Average Data Method
 */
export const calculateUpstreamFuelEnergy = (data) => {
  let totalEmissions = 0;
  const details = [];

  data.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const value = parseFloat(row[key]) || 0;

      if (value === 0) return;

      // Match fuel types from PDF Section 5.8
      Object.keys(UPSTREAM_FUEL_ENERGY_EF).forEach((fuel) => {
        const fuelKey = fuel.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (keyLower.includes(fuelKey)) {
          const ef = UPSTREAM_FUEL_ENERGY_EF[fuel];
          const emission = (value * ef) / 1000; // Convert kgCO₂e to tCO₂e
          totalEmissions += emission;
          details.push({
            fuel: key,
            amount: value,
            amountUnit: fuel === 'upstream_electricity' || fuel === 't_d_loss' ? 'kWh' : 'litres',
            ef: ef,
            efUnit: 'kgCO₂e/unit',
            emission: emission
          });
        }
      });
    });
  });

  return {
    total: totalEmissions,
    details: details,
    unit: 'tCO₂e'
  };
};

/**
 * SCOPE 3 - END-OF-LIFE TREATMENT OF SOLD PRODUCTS
 * Formula: Emissions = Weight (kg) × EF (kgCO₂e/kg) / 1000
 * Per PDF: Section 5.9, Average Data Method
 */
export const calculateEndOfLife = (data) => {
  let totalEmissions = 0;
  const details = [];

  data.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const value = parseFloat(row[key]) || 0;

      if (value === 0) return;

      // Match material types from PDF Section 5.9
      Object.keys(EOL_EF).forEach((material) => {
        const matKey = material.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (keyLower.includes(matKey) || keyLower.includes('eol')) {
          const ef = EOL_EF[material];
          const emission = (value * ef) / 1000; // Convert kgCO₂e to tCO₂e
          totalEmissions += emission;
          details.push({
            material: key,
            weight: value,
            weightUnit: 'kg',
            ef: ef,
            efUnit: 'kgCO₂e/kg',
            emission: emission
          });
        }
      });
    });
  });

  return {
    total: totalEmissions,
    details: details,
    unit: 'tCO₂e'
  };
};

/**
 * MASTER SCOPE 3 CALCULATOR
 * Calculates all Scope 3 categories per PDF methodology
 */
export const calculateScope3Total = (csvData) => {
  const scope3Breakdown = {
    purchased_goods: calculatePurchasedGoods(csvData).total,
    capital_goods: calculateCapitalGoods(csvData).total,
    upstream_transport: calculateUpstreamTransportation(csvData).total,
    downstream_transport: calculateDownstreamTransportation(csvData).total,
    business_travel: calculateBusinessTravel(csvData).total,
    employee_commuting: calculateEmployeeCommuting(csvData).total,
    waste: calculateWaste(csvData).total,
    fuel_energy_related: calculateUpstreamFuelEnergy(csvData).total,
    end_of_life: calculateEndOfLife(csvData).total
  };

  const total = Object.values(scope3Breakdown).reduce((sum, val) => sum + val, 0);

  return {
    breakdown: scope3Breakdown,
    total: total,
    unit: 'tCO₂e',
    percentages: {
      purchased_goods: total > 0 ? ((scope3Breakdown.purchased_goods / total) * 100).toFixed(2) : 0,
      capital_goods: total > 0 ? ((scope3Breakdown.capital_goods / total) * 100).toFixed(2) : 0,
      upstream_transport: total > 0 ? ((scope3Breakdown.upstream_transport / total) * 100).toFixed(2) : 0,
      downstream_transport: total > 0 ? ((scope3Breakdown.downstream_transport / total) * 100).toFixed(2) : 0,
      business_travel: total > 0 ? ((scope3Breakdown.business_travel / total) * 100).toFixed(2) : 0,
      employee_commuting: total > 0 ? ((scope3Breakdown.employee_commuting / total) * 100).toFixed(2) : 0,
      waste: total > 0 ? ((scope3Breakdown.waste / total) * 100).toFixed(2) : 0,
      fuel_energy_related: total > 0 ? ((scope3Breakdown.fuel_energy_related / total) * 100).toFixed(2) : 0,
      end_of_life: total > 0 ? ((scope3Breakdown.end_of_life / total) * 100).toFixed(2) : 0
    }
  };
};

/**
 * SCOPE 1 & 2 CALCULATIONS (Unchanged from original)
 */
export const calculateEmissions = (data) => {
  let scope1Total = 0;
  let scope2Total = 0;
  let scope3Total = 0;

  const unit = detectUnit(data);
  console.log(`🔍 Detected unit: ${unit}`);

  data.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const value = parseFloat(row[key]) || 0;

      if (value === 0) return;

      if (keyLower.includes('ghgscope1') || keyLower.includes('scope1')) {
        scope1Total += value;
        return;
      } 
      if (keyLower.includes('ghgscope2') || keyLower.includes('scope2')) {
        scope2Total += value;
        return;
      } 
      if (keyLower.includes('ghgscope3') || keyLower.includes('scope3')) {
        scope3Total += value;
        return;
      }

      if (
        keyLower.includes('diesel') || 
        keyLower.includes('gasboiler') ||
        keyLower.includes('gasgenerator') ||
        keyLower.includes('naturalgas') ||
        keyLower.includes('lpg') ||
        keyLower.includes('petrol') ||
        keyLower.includes('gasoline') ||
        keyLower.includes('fueloil') ||
        keyLower.includes('direct') ||
        keyLower.includes('combustion')
      ) {
        scope1Total += value;
      }
      else if (
        keyLower.includes('electricity') || 
        keyLower.includes('reb') ||
        keyLower.includes('solar') ||
        keyLower.includes('grid') ||
        keyLower.includes('steam') ||
        keyLower.includes('heating') ||
        keyLower.includes('cooling')
      ) {
        scope2Total += value;
      }
      else if (
        keyLower.includes('waste') ||
        keyLower.includes('metalwaste') ||
        keyLower.includes('electricwaste') ||
        keyLower.includes('foodwaste') ||
        keyLower.includes('dyes') ||
        keyLower.includes('chemical') ||
        keyLower.includes('auxiliary') ||
        keyLower.includes('basicchemical') ||
        keyLower.includes('zdhc') ||
        keyLower.includes('transport') ||
        keyLower.includes('distribution') ||
        keyLower.includes('travel') ||
        keyLower.includes('commute') ||
        keyLower.includes('lease') ||
        keyLower.includes('franchise')
      ) {
        scope3Total += value;
      }
    });
  });

  const conversionFactor = unit === 'kg' ? 1000 : 1;
  
  const scope1Tons = scope1Total / conversionFactor;
  const scope2Tons = scope2Total / conversionFactor;
  const scope3Tons = scope3Total / conversionFactor;
  const totalTons = scope1Tons + scope2Tons + scope3Tons;

  console.log('📊 Emission Calculation Results:');
  console.log(`   Unit detected: ${unit}`);
  console.log(`   Scope 1: ${scope1Tons.toFixed(2)} t CO₂e`);
  console.log(`   Scope 2: ${scope2Tons.toFixed(2)} t CO₂e`);
  console.log(`   Scope 3: ${scope3Tons.toFixed(2)} t CO₂e`);
  console.log(`   Total: ${totalTons.toFixed(2)} t CO₂e`);

  return {
    scope1: scope1Tons,
    scope2: scope2Tons,
    scope3: scope3Tons,
    total: totalTons,
    unit: unit
  };
};

export const calculateCarbonEmissions = (data) => {
  let scope1Carbon = 0;
  let scope2Carbon = 0;
  let scope3Carbon = 0;

  console.log('🧮 Starting carbon emission calculation with EF...');

  data.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const value = parseFloat(row[key]) || 0;
      
      if (value === 0) return;
      
      Object.keys(EMISSION_FACTORS.scope1).forEach(factor => {
        if (keyLower.includes(factor)) {
          const ef = EMISSION_FACTORS.scope1[factor].value;
          const emission = value * ef;
          scope1Carbon += emission;
          console.log(`  Scope 1: ${key} = ${value} × ${ef} = ${emission.toFixed(2)} kg CO₂e`);
        }
      });
      
      Object.keys(EMISSION_FACTORS.scope2).forEach(factor => {
        if (keyLower.includes(factor)) {
          let ef = EMISSION_FACTORS.scope2[factor].value;
          let activityValue = value;
          
          if ((factor === 'electricity' || factor === 'reb') && keyLower.includes('mwh')) {
            activityValue = value * 1000;
            console.log(`  ⚡ Converted ${value} MWh to ${activityValue} kWh`);
          }
          
          const emission = activityValue * ef;
          scope2Carbon += emission;
          console.log(`  Scope 2: ${key} = ${activityValue} × ${ef} = ${emission.toFixed(2)} kg CO₂e`);
        }
      });
    });
  });

  const scope1Tons = scope1Carbon / 1000;
  const scope2Tons = scope2Carbon / 1000;
  const scope3Tons = scope3Carbon / 1000;
  const totalTons = scope1Tons + scope2Tons + scope3Tons;

  console.log('✅ Carbon Emission Results (with EF):');
  console.log(`   Scope 1: ${scope1Tons.toFixed(4)} t CO₂e`);
  console.log(`   Scope 2: ${scope2Tons.toFixed(4)} t CO₂e`);
  console.log(`   Scope 3: ${scope3Tons.toFixed(4)} t CO₂e`);
  console.log(`   Total: ${totalTons.toFixed(4)} t CO₂e`);

  return {
    scope1: scope1Tons,
    scope2: scope2Tons,
    scope3: scope3Tons,
    total: totalTons
  };
};

export const calculateEmissionsWithUnit = (data, forceUnit = 'auto') => {
  if (forceUnit === 'kg') {
    const result = calculateEmissions(data);
    return {
      ...result,
      scope1: result.scope1 / 1000,
      scope2: result.scope2 / 1000,
      scope3: result.scope3 / 1000,
      total: result.total / 1000
    };
  }
  
  return calculateEmissions(data);
};

export const calculateEmissionsFromCSV = calculateEmissions;

const emissionCalculators = {
  calculateEmissions,
  calculateCarbonEmissions,
  calculateEmissionsFromCSV,
  calculateEmissionsWithUnit,
  calculateScope3Total,
  calculatePurchasedGoods,
  calculateCapitalGoods,
  calculateUpstreamTransportation,
  calculateDownstreamTransportation,
  calculateBusinessTravel,
  calculateEmployeeCommuting,
  calculateWaste,
  calculateUpstreamFuelEnergy,
  calculateEndOfLife,
  detectUnit
};

export default emissionCalculators;