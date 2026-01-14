// client/src/pages/Dashboard.js - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Upload, LayoutGrid, Beaker, X, AlertCircle, FileText, Activity, Droplets, Trash2, Users, Shield } from 'lucide-react';
import RGL, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { parseFile, detectSheetTypes } from '../utils/fileParser';
import { useAuth } from '../hooks/useAuth';
import { useWidgets } from '../hooks/useWidgets';
import { Header, SidebarMenu } from '../components/common';
import { Widget, AddWidgetModal, MaterialCalculatorWidget } from '../components/widgets';
import { 
  IntensityChart, 
  ScopeComparisonChart, 
  ScopePieChart, 
  WaterSankeyChart
} from '../components/charts';
import CustomChartBuilder from '../components/charts/CustomChartBuilder';
import { calculateEmissionsFromCSV, calculateCarbonEmissions, calculateEmissionsWithUnit } from '../utils/emissionCalculators';
import config from '../config';
import api from '../services/api';
import WaterDashboard from './WaterDashboard';

const ReactGridLayout = WidthProvider(RGL);

//unit selector (kg/tons)
const UnitSelector = ({ onUnitChange, detectedUnit }) => {
  const [selectedUnit, setSelectedUnit] = useState('auto');

  const handleChange = (e) => {
    const unit = e.target.value;
    setSelectedUnit(unit);
    onUnitChange(unit);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-2">Data Unit Detection</h3>
          <p className="text-sm text-blue-800 mb-3">
            System detected: <strong>{detectedUnit || 'Not yet detected'}</strong>
          </p>
          
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-blue-900">
              Override unit:
            </label>
            <select
              value={selectedUnit}
              onChange={handleChange}
              className="px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="auto">Auto-detect (Recommended)</option>
              <option value="tons">Force Tons (t CO₂e)</option>
              <option value="kg">Force Kilograms (kg CO₂e)</option>
            </select>
          </div>

          <p className="text-xs text-blue-600 mt-2">
            💡 If calculations look wrong, try changing the unit manually
          </p>
        </div>
      </div>
    </div>
  );
};

//dashboard navigation component
const DashboardNavigation = ({ currentView, onViewChange }) => (
  <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border-b-4 border-blue-500">
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onViewChange('main')}
        className={`px-5 py-2.5 rounded-lg font-medium transition flex items-center gap-2 ${
          currentView === 'main'
            ? 'bg-blue-500 text-white shadow-lg'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        Overview
      </button>
      
      
      
      <button
        disabled
        className="px-5 py-2.5 rounded-lg font-medium bg-gray-50 text-gray-400 cursor-not-allowed flex items-center gap-2 border-2 border-dashed border-gray-300"
        title="Coming Soon"
      >
        <Users className="w-4 h-4" />
        Social
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">Soon</span>
      </button>
      
      <button
        disabled
        className="px-5 py-2.5 rounded-lg font-medium bg-gray-50 text-gray-400 cursor-not-allowed flex items-center gap-2 border-2 border-dashed border-gray-300"
        title="Coming Soon"
      >
        <Shield className="w-4 h-4" />
        Governance
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">Soon</span>
      </button>
    </div>
  </div>
);
const parseWaterDataUniversal = (sheetData) => {
  if (!sheetData || sheetData.length === 0) return null;

  
  const metrics = {
    // Source 
    totalGroundWater: 0,
    totalRainwater: 0,
    totalRecycled: 0,
    totalSource: 0,
    
    // Consumption
    totalWetProcess: 0,
    totalBoilerWater: 0,
    totalDomestic: 0,
    totalUtility: 0,
    totalConsumption: 0,
    
    // Output
    totalProcessLoss: 0,
    totalTreatment: 0,
    totalDischarge: 0,
    totalBackwash: 0,
    totalCoolingWater: 0,
    
    
    monthlyData: [],
    
   
    maxConsumption: { value: 0, month: '' },
    minConsumption: { value: Infinity, month: '' },
    
    // Factory type detect korbe
    factoryType: 'unknown'
  };

  // Detect factory type based on columns
  const firstRow = sheetData[0] || {};
  const columns = Object.keys(firstRow);
  
  if (columns.some(c => c.toLowerCase().includes('boiler'))) {
    metrics.factoryType = '4A';
  } else if (columns.some(c => c.toLowerCase().includes('wet process'))) {
    metrics.factoryType = 'SESL/GT';
  }

  console.log('🏭 Detected factory type:', metrics.factoryType);

  
  sheetData.forEach(row => {
    const month = row['Name of the Month'] || row['Month'] || row['month'];
    
   
    if (!month || 
        month.toLowerCase().includes('name') || 
        month.toLowerCase().includes('month') ||
        typeof month !== 'string') {
      return;
    }

   
    const groundWater = parseFloat(row['GW'] || row['Ground Water'] || row['GroundWater'] || 0);
    const rainwater = parseFloat(row['Rainwater'] || row['Rain Water'] || row['Rainwater'] || 0);
    const recycled = parseFloat(row['Recycled'] || row['Recycled Water'] || 0);
    const sourceTotal = parseFloat(row['Total'] || 0) || (groundWater + rainwater + recycled);

   //consumption same for Gt and sesl
    const wetProcess = parseFloat(row['Wet Process'] || row['WetProcess'] || 0);
    const domestic = parseFloat(row['Domestic'] || row['Domestic Use'] || 0);
    const utility = parseFloat(row['Utility'] || row['Total Utility'] || 0);
    
    // 4A
    const boilerWater = parseFloat(row['Boiler Water'] || row['BoilerWater'] || 0);
    
    
    const consumptionTotal = parseFloat(
      row['Total Comsumption'] || 
      row['Total Consumption'] || 
      row['TotalConsumption'] || 
      0
    ) || (wetProcess + domestic + utility + boilerWater);

   
    const processLoss = parseFloat(row['Process Loss(m3)'] || row['ProcessLoss'] || row['Process Loss'] || 0);
    const treatment = parseFloat(row['Treatment(m3)'] || row['Treatment'] || 0);
    const discharge = parseFloat(row['Discharge(m3)'] || row['Discharge'] || 0);
    const backwash = parseFloat(row['WTP Backwash(m3)'] || row['Backwash'] || 0);
    const coolingWater = parseFloat(row['Non-contact Cooling Water(m3)'] || row['Cooling Water'] || 0);

    
    if (sourceTotal === 0 && consumptionTotal === 0) {
      return;
    }

   
    metrics.totalGroundWater += groundWater;
    metrics.totalRainwater += rainwater;
    metrics.totalRecycled += recycled;
    metrics.totalSource += sourceTotal;
    
    metrics.totalWetProcess += wetProcess;
    metrics.totalBoilerWater += boilerWater;
    metrics.totalDomestic += domestic;
    metrics.totalUtility += utility;
    metrics.totalConsumption += consumptionTotal;
    
    metrics.totalProcessLoss += processLoss;
    metrics.totalTreatment += treatment;
    metrics.totalDischarge += discharge;
    metrics.totalBackwash += backwash;
    metrics.totalCoolingWater += coolingWater;

    // Track max/min
    if (consumptionTotal > metrics.maxConsumption.value) {
      metrics.maxConsumption = { value: consumptionTotal, month };
    }
    if (consumptionTotal < metrics.minConsumption.value && consumptionTotal > 0) {
      metrics.minConsumption = { value: consumptionTotal, month };
    }

    
    metrics.monthlyData.push({
      month,
      source: {
        groundWater,
        rainwater,
        recycled,
        total: sourceTotal
      },
      consumption: {
        wetProcess,
        boilerWater,
        domestic,
        utility,
        total: consumptionTotal
      },
      other: {
        processLoss,
        treatment,
        discharge,
        backwash,
        coolingWater
      }
    });
  });

 
  metrics.ground = metrics.totalGroundWater;
  metrics.rainwater = metrics.totalRainwater;
  metrics.recycled = metrics.totalRecycled;
  metrics.factoryProduction = metrics.totalWetProcess + metrics.totalBoilerWater;
  metrics.domesticUse = metrics.totalDomestic;
  metrics.utilityUse = metrics.totalUtility;
  metrics.processLoss = metrics.totalProcessLoss;
  metrics.effluent = metrics.totalTreatment;
  metrics.discharge = metrics.totalDischarge;

  console.log('📊 Water Metrics Summary:');
  console.log('  - Total Source:', metrics.totalSource.toFixed(2), 'm³');
  console.log('  - Total Consumption:', metrics.totalConsumption.toFixed(2), 'm³');
  console.log('  - Months with data:', metrics.monthlyData.length);

  return metrics;
};
//main dash -- front page
const Dashboard = ({ onNavigate, onLogout }) => {
 
  const [dashboardView, setDashboardView] = useState('main');
  
      
  const { user } = useAuth();
  const { 
    widgets, 
    loading: widgetsLoading,
    error: widgetsError,
    updateWidget, 
    deleteWidget, 
    createWidget,
    updateWidgetLayout,
    refreshData
  } = useWidgets();
  
  const [showSidebar, setShowSidebar] = useState(false);
  const [showDebug, setShowDebug] = useState(config.features.enableDebugMode);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showMaterialCalc, setShowMaterialCalc] = useState(false);
  const [csvData, setCsvData] = useState(null);
  const [emissionsData, setEmissionsData] = useState(null);
  const [productionData, setProductionData] = useState(null);
  const [intensityData, setIntensityData] = useState(null);
  const [wasteData, setWasteData] = useState(null);
  const [waterData, setWaterData] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]); 
  const [currentFile, setCurrentFile] = useState(null); 
  const [unitOverride, setUnitOverride] = useState('auto');
  const [detectedUnit, setDetectedUnit] = useState(null);
  const fetchWaterData = async (fileId) => {
        try {
          const response = await fetch(`/api/water/data/${fileId}`);
          const result = await response.json();
          
          if (result.success) {
            setWaterData(result.metrics);
          } else {
            console.error('Failed to load water data:', result.error);
          }
        } catch (error) {
          console.error('Error fetching water data:', error);
        }
      };
  
  useEffect(() => {
    fetchUploadedFiles();
    refreshData();
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      const response = await api.get('/files');
      const files = response.data.files || response.data || [];
      console.log('📂 Loaded files:', files.length);
      setUploadedFiles(files);
    } catch (error) {
      console.error('❌ Error fetching files:', error);
    }
  };
  
const parseWaterDataFromSheet = (sheetData) => {
  if (!sheetData || sheetData.length === 0) return null;

  let totalGW = 0, totalRain = 0, totalRecycled = 0;
  let totalWetProcess = 0, totalDomestic = 0, totalUtility = 0;
  let totalProcessLoss = 0, totalTreatment = 0, totalDischarge = 0;
  const monthlyData = [];

  sheetData.forEach(row => {
   
    const month = row['Name of the Month'] || row['Month'];
    if (!month || month.toLowerCase().includes('name')) return;

  
    const gw = parseFloat(row['GW'] || row['Ground Water'] || 0);
    const rain = parseFloat(row['Rainwater'] || 0);
    const recycled = parseFloat(row['Recycled'] || 0);
    const wet = parseFloat(row['Wet Process'] || 0);
    const domestic = parseFloat(row['Domestic'] || 0);
    const utility = parseFloat(row['Utility'] || 0);
    const loss = parseFloat(row['Process Loss(m3)'] || 0);
    const treatment = parseFloat(row['Treatment(m3)'] || 0);
    const discharge = parseFloat(row['Discharge(m3)'] || 0);

    totalGW += gw;
    totalRain += rain;
    totalRecycled += recycled;
    totalWetProcess += wet;
    totalDomestic += domestic;
    totalUtility += utility;
    totalProcessLoss += loss;
    totalTreatment += treatment;
    totalDischarge += discharge;

    monthlyData.push({
      month,
      source: { groundWater: gw, rainwater: rain, recycled, total: gw + rain + recycled },
      consumption: { wetProcess: wet, domestic, utility, total: wet + domestic + utility },
      processLoss: loss,
      treatment,
      discharge
    });
  });

  return {
    ground: totalGW,
    rainwater: totalRain,
    recycled: totalRecycled,
    factoryProduction: totalWetProcess,
    domesticUse: totalDomestic,
    utilityUse: totalUtility,
    processLoss: totalProcessLoss,
    effluent: totalTreatment,
    discharge: totalDischarge,
    monthlyData,
    totalSource: totalGW + totalRain + totalRecycled,
    totalConsumption: totalWetProcess + totalDomestic + totalUtility
  };
};

  const parseWaterData = (data) => {
    if (!data || data.length === 0) return null;

    let ground = 0, rainwater = 0, recycled = 0;
    let production = 0, domestic = 0, utility = 0;
    let processLoss = 0, effluent = 0;

    data.forEach(row => {
      
      ground += parseFloat(row['Ground Water'] || row['Ground_Water'] || 0);
      rainwater += parseFloat(row['Rainwater'] || row['Rain_water'] || 0);
      recycled += parseFloat(row['Recycled'] || row['Recycled_Water'] || 0);
      production += parseFloat(row['Total Comsumption'] || row['Total_Consumption'] || 0);
      domestic += parseFloat(row['Domestic'] || row['Domestic_Use'] || 0);
    });

    return {
      ground,
      rainwater,
      recycled,
      factoryProduction: production,
      domesticUse: domestic,
      utilityUse: utility,
      processLoss,
      effluent
    };
  };

  // Parse Waste Data from CSV
  const parseWasteData = (data) => {
    if (!data || data.length === 0) return null;

    let totalWaste = 0, recycled = 0, hazardous = 0;

    data.forEach(row => {
      const jhute = parseFloat(row['Jhute(Kg)'] || row['Jhute'] || 0);
      const padding = parseFloat(row['Padding (Kg)'] || row['Padding'] || 0);
      const plastic = parseFloat(row['Poly/Plastic(Kg)'] || row['Plastic'] || 0);
      const carton = parseFloat(row['Cartoon(Kg)'] || row['Carton'] || 0);
      const medical = parseFloat(row['Medical Waste(Kg)'] || 0);
      
      totalWaste += jhute + padding + plastic + carton;
      recycled += jhute + padding + plastic + carton;
      hazardous += medical;
    });

    return {
      total: totalWaste,
      recycled,
      landfill: totalWaste - recycled,
      hazardous,
      recyclingRate: totalWaste > 0 ? (recycled / totalWaste * 100) : 0,
      trend: -5.8
    };
  };

  // Handle CSV file upload


  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      console.log('📤 Uploading file:', file.name);
      
      // Parse file
      const parsedData = await parseFile(file);
      console.log('✅ File parsed successfully!');
      console.log('📊 Sheets:', parsedData.sheetNames);
      
      // Detect sheet types
      const sheetTypes = detectSheetTypes(parsedData);
      console.log('🎯 Sheet detection:', sheetTypes);

      // Extract data
      const emissions = sheetTypes.emissions 
        ? parsedData.sheets[sheetTypes.emissions]
        : parsedData.defaultSheet;
      
      const production = sheetTypes.production
        ? parsedData.sheets[sheetTypes.production]
        : emissions;
      
      const intensity = sheetTypes.intensity
        ? parsedData.sheets[sheetTypes.intensity]
        : null;

      // Set state
      setCsvData(emissions);
      setEmissionsData(emissions);
      setProductionData(production);
      setIntensityData(intensity);
      setCurrentFile({
        name: file.name,
        type: parsedData.type,
        sheets: parsedData.sheetNames,
        uploadedAt: new Date()
      });

      // Calculate emissions
      const calculatedEmissions = unitOverride === 'auto' 
        ? calculateEmissionsFromCSV(emissions)
        : calculateEmissionsWithUnit(emissions, unitOverride);
      
      setDetectedUnit(calculatedEmissions.unit || 'tons');
      
      const carbonEmissions = calculateCarbonEmissions(emissions);
      
      console.log('📊 Calculated Emissions:', calculatedEmissions);

      // Update widgets
      updateWidgetValues(calculatedEmissions, carbonEmissions);
      // Check for water and waste sheets
      const waterSheet = parsedData.sheets['Water'] || 
                      parsedData.sheets['Water Consumption'] || 
                      parsedData.sheets['Water Consumption-2025'] ||
                      Object.keys(parsedData.sheets).find(key => 
                        key.toLowerCase().includes('water')
                      );

      if (waterSheet) {
        console.log('💧 Water sheet found, parsing data...');
        
        // Use the universal parser
        const parsedWater = parseWaterDataUniversal(waterSheet);
        
        if (parsedWater) {
          setWaterData(parsedWater);
          console.log('✅ Water data parsed:', parsedWater);
          console.log('  - Total Source:', parsedWater.totalSource);
          console.log('  - Total Consumption:', parsedWater.totalConsumption);
          console.log('  - Factory Type:', parsedWater.factoryType);
        } else {
          console.error('❌ Failed to parse water data');
        }
      }
      const wasteSheet = parsedData.sheets['Waste'] || 
                        parsedData.sheets['Wastage Report'] || 
                        parsedData.sheets['Wastage Report-2025'];

      if (wasteSheet) {
        const parsedWaste = parseWasteData(wasteSheet);
        setWasteData(parsedWaste);
        console.log('♻️ Waste data parsed:', parsedWaste);
      }
    
     
      const savedFileResponse = await saveFileToBackend(file, parsedData, sheetTypes);
      

      if (savedFileResponse && savedFileResponse.file) {
        const fileId = savedFileResponse.file._id || savedFileResponse.file.id;
        console.log('✅ File saved with ID:', fileId);
        
      
        if (file.name.toLowerCase().includes('water') || 
            parsedData.sheetNames.some(s => s.toLowerCase().includes('water'))) {
          
          console.log('💧 Water file detected, fetching water data...');
          await fetchWaterData(fileId);
        }
      } else {
        console.warn('⚠️ File save was cancelled or failed');
      }

 
      const detectionInfo = [
        '✅ File uploaded successfully!',
        '',
        `📄 File: ${parsedData.fileName}`,
        `📊 Type: ${parsedData.type.toUpperCase()}`,
        `📋 Sheets: ${parsedData.sheetNames.join(', ')}`,
        '',
        '🔍 Detected Data:',
        `  • Emissions: ${sheetTypes.emissions || 'Sheet 1'}`,
        `  • Production: ${sheetTypes.production || 'Sheet 1'}`,
        `  • Intensity: ${sheetTypes.intensity || 'Will calculate'}`,
        '',
        `📈 Total Emissions: ${calculatedEmissions.total.toFixed(2)} ${calculatedEmissions.unit}`
      ].join('\n');

      alert(detectionInfo);
      
    } catch (error) {
      console.error('❌ File upload error:', error);
      alert(`❌ Error: ${error.message}\n\nPlease check your file format.`);
    }
  };
 
      

  const saveFileToBackend = async (file, parsedData, sheetTypes) => {
    try {
      
      const existingFiles = await api.get('/files');
      const duplicate = existingFiles.data.files.find(f => 
        f.originalName === file.name && 
        f.size === file.size
      );

      if (duplicate) {
        const shouldReplace = window.confirm(
          `A file named "${file.name}" already exists.\n\n` +
          `Do you want to replace it?`
        );

        if (!shouldReplace) {
          console.log('⚠️ File upload cancelled - duplicate found');
          return null; 
        }

        await api.delete(`/files/${duplicate._id}`);
        console.log('🗑️ Old file deleted');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({
        fileName: file.name,
        fileType: parsedData.type,
        sheets: parsedData.sheetNames,
        sheetTypes: sheetTypes,
        uploadedAt: new Date().toISOString()
      }));

      const response = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('✅ File saved to database:', response.data);
      
      await fetchUploadedFiles();
      
      return response.data; 
      
    } catch (error) {
      console.error('❌ Error saving file to backend:', error);
      return null;
    }
  };


  const handleUnitChange = (newUnit) => {
    setUnitOverride(newUnit);
    if (emissionsData) {
      const emissions = newUnit === 'auto' 
        ? calculateEmissionsFromCSV(emissionsData)
        : calculateEmissionsWithUnit(emissionsData, newUnit);
      
      setDetectedUnit(emissions.unit || newUnit);
      const carbonEmissions = calculateCarbonEmissions(emissionsData);
      updateWidgetValues(emissions, carbonEmissions);
      
      alert(`Recalculated with unit: ${newUnit === 'auto' ? emissions.unit : newUnit}`);
    }
  };

  const updateWidgetValues = async (emissions, carbonEmissions) => {
    const updates = [
      { i: 'scope1', value: Math.round(emissions.scope1) },
      { i: 'scope2', value: Math.round(emissions.scope2) },
      { i: 'scope3', value: Math.round(emissions.scope3) },
      { i: 'total', value: emissions.total.toFixed(2) }
    ];

    console.log('🔄 Updating widgets with values:', updates);

    for (const update of updates) {
      const widget = widgets.find(w => w.i === update.i);
      if (widget) {
        await updateWidget(widget._id || widget.id, { value: update.value });
      }
    }

    await refreshData();
  };

  const handleLayoutChange = async (layout) => {
    console.log('📐 Layout changed:', layout);
    await updateWidgetLayout(layout);
  };

  const handleRemoveWidget = async (id) => {
    if (window.confirm('Remove this widget?')) {
      await deleteWidget(id);
    }
  };

  const handleColorChange = async (id, color) => {
    await updateWidget(id, { color });
  };

  const handleRename = async (id, title) => {
    await updateWidget(id, { title });
  };

  const handleAddWidget = async (widgetData) => {
    const newWidget = {
      i: `widget-${Date.now()}`,
      x: 0,
      y: Infinity,
      w: 4,
      h: 2,
      title: widgetData.title,
      value: widgetData.value,
      unit: widgetData.unit,
      color: widgetData.color
    };
    
    await createWidget(newWidget);
  };

  const handleResetWidgets = async () => {
    if (window.confirm('Reset dashboard to default widgets?')) {
      try {
        await api.post('/widgets/reset');
        await refreshData();
        
        if (csvData) {
          const emissions = calculateEmissionsFromCSV(csvData);
          const carbonEmissions = calculateCarbonEmissions(csvData);
          await updateWidgetValues(emissions, carbonEmissions);
        }
        
        alert('✅ Widgets reset successfully!');
      } catch (error) {
        console.error('❌ Reset error:', error);
        alert('Failed to reset widgets');
      }
    }
  };

  const headerActions = [
    {
      label: 'Upload Files',
      icon: Upload,
      className: 'px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition flex items-center gap-2',
      onClick: () => document.getElementById('csv-upload').click()
    },
    {
      label: showDebug ? 'Hide Debug' : 'Show Debug',
      icon: Beaker,
      className: 'px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition flex items-center gap-2',
      onClick: () => setShowDebug(!showDebug)
    },
    {
      label: 'Reset Widgets',
      icon: LayoutGrid,
      className: 'px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition flex items-center gap-2',
      onClick: handleResetWidgets
    }
  ];

  // Show loading state
  if (widgetsLoading && widgets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (widgetsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800">❌ Error loading widgets: {widgetsError}</p>
          <button
            onClick={refreshData}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
      <SidebarMenu
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onNavigate={onNavigate}
        onShowMaterialCalc={() => setShowMaterialCalc(true)}
        onShowAddWidget={() => setShowAddWidget(true)}
      />

      <Header
        title="ESG Dashboard"
        subtitle={`Welcome, ${user?.username || user?.email}`}
        onMenuClick={() => setShowSidebar(true)}
        actions={headerActions}
        onLogout={onLogout}
      />

      <input
        id="csv-upload"
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
      />

      <main className="p-8">
        {/* Dashboard Navigation */}
        <DashboardNavigation 
          currentView={dashboardView}
          onViewChange={setDashboardView}
        />

        {/* Current File Info */}
        {currentFile && (
          <div className="bg-white rounded-lg shadow p-4 mb-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">📄 Current File:</p>
                <p className="font-semibold text-gray-800">{currentFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentFile.type.toUpperCase()} • {currentFile.sheets.length} sheet(s) • 
                  Uploaded {currentFile.uploadedAt.toLocaleTimeString()}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </div>
        )}

        {/* Debug Panel */}
        {showDebug && (
          <div className="bg-gray-800 text-white rounded-lg p-4 mb-6 text-xs font-mono max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-2">🔍 Debug Info</h3>
            <p><strong>Current View:</strong> {dashboardView}</p>
            <p><strong>Widgets Count:</strong> {widgets.length}</p>
            <p><strong>CSV Loaded:</strong> {csvData ? 'Yes' : 'No'}</p>
            <p><strong>Water Data:</strong> {waterData ? 'Loaded' : 'No'}</p>
            <p><strong>Waste Data:</strong> {wasteData ? 'Loaded' : 'No'}</p>
          </div>
        )}

        {/* Main Overview */}
        {dashboardView === 'main' && (
          <>
            {!csvData && (
              <div className="bg-gradient-to-r from-blue-50 via-green-50 to-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-6">
                <p className="text-blue-800 font-medium text-lg mb-2">
                  📊 <strong>Quick Start:</strong> Upload your CSV or Excel file
                </p>
                <p className="text-blue-700 text-sm">
                  Your file should contain sheets named: "GHG Emission", "Water Consumption", "Wastage Report"
                </p>
              </div>
            )}

            {csvData && (
              <UnitSelector 
                onUnitChange={handleUnitChange}
                detectedUnit={detectedUnit}
              />
            )}

            {/* Widgets Grid */}
            {widgets.length > 0 ? (
              <ReactGridLayout
                className="layout"
                layout={widgets}
                cols={config.gridLayout.cols}
                rowHeight={config.gridLayout.rowHeight}
                onLayoutChange={handleLayoutChange}
                isDraggable={config.gridLayout.isDraggable}
                isResizable={config.gridLayout.isResizable}
                draggableCancel=".no-drag"
              >
                {widgets.map((widget) => (
                  <div key={widget.i}>
                    <Widget
                      id={widget._id || widget.id}
                      title={widget.title}
                      value={widget.value}
                      unit={widget.unit}
                      color={widget.color}
                      onRemove={handleRemoveWidget}
                      onColorChange={handleColorChange}
                      onRename={handleRename}
                    />
                  </div>
                ))}
              </ReactGridLayout>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center mb-6">
                <LayoutGrid className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No widgets found.</p>
                <button
                  onClick={handleResetWidgets}
                  className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                >
                  Load Default Widgets
                </button>
              </div>
            )}

            {/* Charts */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Analytics & Visualizations
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ScopeComparisonChart 
                  scope1={widgets.find(w => w.i === 'scope1')?.value || 0}
                  scope2={widgets.find(w => w.i === 'scope2')?.value || 0}
                />

                <ScopePieChart
                  scope1={widgets.find(w => w.i === 'scope1')?.value || 0}
                  scope2={widgets.find(w => w.i === 'scope2')?.value || 0}
                  scope3={widgets.find(w => w.i === 'scope3')?.value || 0}
                />
              </div>

              <div className="mb-6">
                <IntensityChart 
                  emissionsData={emissionsData}
                  productionData={productionData}
                  intensityData={intensityData}
                />
              </div>

              <div className="mb-6">
                <CustomChartBuilder />
              </div>
            </div>
          </>
        )}

        {/* Emissions View */}
        {dashboardView === 'emissions' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Activity className="w-8 h-8 text-red-500" />
              Detailed Emissions Analysis
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ScopeComparisonChart 
                scope1={widgets.find(w => w.i === 'scope1')?.value || 0}
                scope2={widgets.find(w => w.i === 'scope2')?.value || 0}
              />

              <ScopePieChart
                scope1={widgets.find(w => w.i === 'scope1')?.value || 0}
                scope2={widgets.find(w => w.i === 'scope2')?.value || 0}
                scope3={widgets.find(w => w.i === 'scope3')?.value || 0}
              />
            </div>

            <IntensityChart 
              emissionsData={emissionsData}
              productionData={productionData}
              intensityData={intensityData}
            />
          </div>
        )}

        {/* Water View */}
        {dashboardView === 'water' && (
          <WaterDashboard 
            onBack={() => setDashboardView('main')} 
            waterData={waterData}  
          />
        )}
        {/* Water Sankey Chart */}
        <div className="mb-6">
          <WaterSankeyChart waterData={waterData} /> 
        </div>

        {/* Waste View */}
        {dashboardView === 'waste' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Trash2 className="w-8 h-8 text-orange-500" />
              Waste Management Dashboard
            </h2>
            {wasteData ? (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-100 p-5 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Waste</p>
                    <p className="text-2xl font-bold text-gray-800">{wasteData.total.toFixed(0)} kg</p>
                  </div>
                  <div className="bg-green-100 p-5 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Recycled</p>
                    <p className="text-2xl font-bold text-green-600">{wasteData.recycled.toFixed(0)} kg</p>
                  </div>
                  <div className="bg-orange-100 p-5 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Landfill</p>
                    <p className="text-2xl font-bold text-orange-600">{wasteData.landfill.toFixed(0)} kg</p>
                  </div>
                  <div className="bg-red-100 p-5 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Hazardous</p>
                    <p className="text-2xl font-bold text-red-600">{wasteData.hazardous.toFixed(0)} kg</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">
                    ♻️ <strong>Recycling Rate:</strong> {wasteData.recyclingRate.toFixed(1)}%
                  </p>
                  <p className="text-blue-700 text-sm mt-1">
                    Trend: {wasteData.trend > 0 ? '📈' : '📉'} {Math.abs(wasteData.trend)}% vs last period
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800">📊 No waste data available. Upload a file with "Wastage Report" sheet.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Widget Modal */}
      {showAddWidget && (
        <AddWidgetModal
          onAdd={handleAddWidget}
          onClose={() => setShowAddWidget(false)}
        />
      )}

      {/* Material Calculator Modal */}
      {showMaterialCalc && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" 
          onClick={() => setShowMaterialCalc(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Material EF Calculator</h2>
              <button
                onClick={() => setShowMaterialCalc(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <MaterialCalculatorWidget />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;