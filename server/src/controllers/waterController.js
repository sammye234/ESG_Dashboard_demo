// server/src/controllers/waterController.js 
const WaterData = require('../models/WaterData');
const File = require('../models/File');

class WaterController {
  static async getWaterFiles(req, res) {
    try {
      console.log('💧 Fetching files for user:', req.user.id);
      
      const files = await File.find({
        userId: req.user.id
      }).select('name originalName uploadedAt metadata data')
        .sort({ uploadedAt: -1 });

      console.log(`📊 Found ${files.length} total files`);

      const waterFiles = files.filter(file => {
        if (!file.data || file.data.length === 0) return false;
        
        const headers = file.metadata?.headers || Object.keys(file.data[0] || {});
        const hasWaterData = headers.some(h => 
          /ground.*water|rainwater|recycled|domestic|wet.*process|boiler|wtp|cooling/i.test(h)
        );
        
        return hasWaterData;
      });

      console.log(`💧 Found ${waterFiles.length} files with water data`);

      res.json({
        success: true,
        count: waterFiles.length,
        files: waterFiles.map(f => ({
          _id: f._id,
          name: f.name,
          originalName: f.originalName,
          uploadedAt: f.uploadedAt || f.createdAt,
          rowCount: f.data?.length || 0,
          headers: f.metadata?.headers || []
        }))
      });
    } catch (err) {
      console.error('❌ Error fetching water files:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch water files',
        message: err.message
      });
    }
  }

  static async processWaterFile(req, res) {
    try {
      const file = await File.findOne({
        _id: req.params.fileId,
        userId: req.user.id
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      if (!file.data || file.data.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'File has no data to process'
        });
      }

      console.log('💧 Processing water file:', file.name);
      console.log('📊 Row count:', file.data.length);

      const headers = file.metadata?.headers || Object.keys(file.data[0]);
      console.log('📋 Headers:', headers);

      const processedData = WaterController.processEnvironmentalWaterData(
        file.data, 
        headers
      );

      console.log('✅ Processed data:', {
        businessUnits: processedData.businessUnits,
        totalSource: processedData.combined?.metrics?.totalSource
      });

      // Store processed data
      let waterData = await WaterData.findOne({
        file: file._id,
        userId: req.user.id
      });

      const dataToSave = {
        period: processedData.combined.period,
        metrics: processedData.combined.metrics,
        monthlyData: processedData.combined.monthlyData,
        factoryData: processedData.byBU,
        processedAt: new Date()
      };

      if (waterData) {
        Object.assign(waterData, dataToSave);
        await waterData.save();
      } else {
        waterData = new WaterData({
          userId: req.user.id,
          file: file._id,
          fileName: file.name,
          ...dataToSave
        });
        await waterData.save();
      }

      res.json({
        success: true,
        data: waterData,
        businessUnits: processedData.businessUnits
      });
    } catch (err) {
      console.error('❌ Error processing water file:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to process water data',
        message: err.message
      });
    }
  }

  static processEnvironmentalWaterData(rawData, headers) {
    console.log('💧 Processing Environmental CSV water data...');

    const findColumn = (patterns) => {
      return headers.find(h => 
        patterns.some(p => new RegExp(p, 'i').test(h.trim()))
      ) || null;
    };

    // Detect columns from Environmental CSV
    const buCol = findColumn(['^bu$', 'business.*unit', 'factory']);
    const monthCol = findColumn(['^month$', 'period', 'name.*month']);
    const gwCol = findColumn(['ground.*water.*m3', 'ground.*water', '^gw']);
    const rainCol = findColumn(['rainwater.*m3', 'rain.*water']);
    const recycledCol = findColumn(['recycled.*m3', 'recycled']);
    
    // Consumption columns (varies by BU)
    const boilerCol = findColumn(['boiler.*water.*m3', '^boiler']);
    const domesticCol = findColumn(['domestic.*m3', '^domestic']);
    const wetProcessCol = findColumn(['wet.*process.*m3', 'wet.*process']);
    const utilityCol = findColumn(['utility.*m3', '^utility']);
    const wtpCol = findColumn(['wtp.*backwash.*m3', 'backwash']);
    const coolingCol = findColumn(['non.*contact.*cooling.*m3', 'cooling.*water']);
    
    // Output columns
    const treatmentCol = findColumn(['treatment.*m3', '^treatment']);

    console.log('📋 Detected columns:', {
      bu: buCol,
      month: monthCol,
      gw: gwCol,
      rain: rainCol,
      recycled: recycledCol,
      boiler: boilerCol,
      domestic: domesticCol,
      wetProcess: wetProcessCol,
      utility: utilityCol,
      wtp: wtpCol,
      cooling: coolingCol,
      treatment: treatmentCol
    });

    if (!buCol || !monthCol) {
      throw new Error('Required columns (BU and Month) not found in file');
    }

    const buData = {
      GTL: [],
      '4AL': [],
      SESL: []
    };

    const combinedMonthly = [];

    const monthNames = {
      'jan': 'January', 'feb': 'February', 'mar': 'March', 
      'apr': 'April', 'may': 'May', 'jun': 'June',
      'jul': 'July', 'aug': 'August', 'sep': 'September',
      'oct': 'October', 'nov': 'November', 'dec': 'December'
    };

    rawData.forEach((row, index) => {
      // Get BU from BU column
      const buValue = row[buCol] || '';
      let buStr = String(buValue).trim().toUpperCase();
      
      // Get month from Month column
      const monthValue = row[monthCol] || '';
      let monthStr = String(monthValue).trim();

      // Skip empty or header rows
      if (!monthStr || !buStr || 
          monthStr.toLowerCase() === 'month' || 
          buStr.toLowerCase() === 'bu') {
        return;
      }

      // Identify BU
      let bu = null;
      if (buStr.includes('GTL')) {
        bu = 'GTL';
      } else if (buStr.includes('4AL')) {
        bu = '4AL';
      } else if (buStr.includes('SESL')) {
        bu = 'SESL';
      }

      if (!bu) {
        console.log(`⚠️ Unknown BU: "${buStr}" in row ${index}`);
        return;
      }

      // Format month
      let month = monthStr;
      const monthMatch = monthStr.match(/^([a-z]+)[-\s]*(\d{2})?/i);
      if (monthMatch) {
        const monthName = monthMatch[1].toLowerCase();
        const year = monthMatch[2] ? `20${monthMatch[2]}` : '';
        
        if (monthNames[monthName]) {
          month = year ? `${monthNames[monthName]} ${year}` : monthNames[monthName];
        }
      }

      // Parse source values
      const groundWater = parseFloat(row[gwCol]) || 0;
      const rainwater = parseFloat(row[rainCol]) || 0;
      const recycled = parseFloat(row[recycledCol]) || 0;
      const totalSource = groundWater + rainwater + recycled;

      // Skip if no source data
      if (totalSource === 0) {
        return;
      }

      // Parse or calculate consumption based on BU type
      let wetProcess = 0, domestic = 0, utility = 0, boilerWater = 0;
      let wtpBackwash = 0, nonContactCooling = 0;
      let totalConsumption = 0;

      // Apply BU-specific logic
      if (bu === 'GTL') {
        // GTL: Has Wet Process, Domestic, Utility
        wetProcess = parseFloat(row[wetProcessCol]) || (totalSource * 0.6);
        domestic = parseFloat(row[domesticCol]) || (totalSource * 0.1);
        utility = parseFloat(row[utilityCol]) || (totalSource * 0.3);
        totalConsumption = wetProcess + domestic + utility;
      } else if (bu === '4AL') {
        // 4AL: Has Boiler Water, Domestic
        boilerWater = parseFloat(row[boilerCol]) || 0;
        domestic = parseFloat(row[domesticCol]) || 0;
        totalConsumption = boilerWater + domestic;
      } else if (bu === 'SESL') {
        // SESL: Has Boiler Water, Domestic, WTP Backwash, Non-contact Cooling
        boilerWater = parseFloat(row[boilerCol]) || 0;
        domestic = parseFloat(row[domesticCol]) || 0;
        wtpBackwash = parseFloat(row[wtpCol]) || 0;
        nonContactCooling = parseFloat(row[coolingCol]) || 0;
        totalConsumption = boilerWater + domestic + wtpBackwash + nonContactCooling;
      }

      // Calculate outputs using formulas
      let processLoss = 0, treatment = 0, discharge = 0;

      if (bu === 'GTL') {
        processLoss = (wetProcess * 0.2) + (domestic * 0.2);
        treatment = wetProcess * 0.8;
        discharge = domestic * 0.8;
      } else if (bu === '4AL') {
        // For 4AL, use boiler water as proxy for wet process in formulas
        processLoss = (boilerWater * 0.2) + (domestic * 0.2);
        treatment = boilerWater * 0.8;
        discharge = domestic * 0.8;
      } else if (bu === 'SESL') {
        // For SESL, use boiler water + wet components
        const wetComponent = boilerWater + wtpBackwash + nonContactCooling;
        processLoss = (wetComponent * 0.2) + (domestic * 0.2);
        treatment = parseFloat(row[treatmentCol]) || (wetComponent * 0.8);
        discharge = domestic * 0.8;
      }

      const waterRecord = {
        month,
        businessUnit: bu,
        source: {
          groundWater,
          rainwater,
          recycled,
          total: totalSource
        },
        consumption: {
          boilerWater,
          domestic,
          wtpBackwash,
          nonContactCooling,
          wetProcess,
          utility,
          total: totalConsumption
        },
        processLoss,
        treatment,
        discharge,
        // Total row calculation
        totalRow: totalSource // Environmental CSV total
      };

      // Add to respective BU data
      if (buData[bu]) {
        buData[bu].push(waterRecord);
      }

      combinedMonthly.push(waterRecord);
    });

    console.log('💧 BU data counts:', {
      GTL: buData.GTL.length,
      '4AL': buData['4AL'].length,
      SESL: buData.SESL.length,
      combined: combinedMonthly.length
    });

    if (combinedMonthly.length === 0) {
      throw new Error('No valid water data found. Please check your file format.');
    }

    const combinedMetrics = WaterController.calculateMetrics(combinedMonthly);

    const byBU = {};
    Object.keys(buData).forEach(bu => {
      if (buData[bu].length > 0) {
        byBU[bu] = {
          metrics: WaterController.calculateMetrics(buData[bu]),
          monthlyData: buData[bu]
        };
      }
    });

    return {
      businessUnits: Object.keys(byBU),
      combined: {
        period: {
          start: combinedMonthly[0]?.month || 'Unknown',
          end: combinedMonthly[combinedMonthly.length - 1]?.month || 'Unknown',
          months: combinedMonthly.length
        },
        metrics: combinedMetrics,
        monthlyData: combinedMonthly
      },
      byBU
    };
  }

  static calculateMetrics(monthlyData) {
    if (monthlyData.length === 0) {
      return {
        totalSource: 0,
        totalGroundWater: 0,
        totalRainwater: 0,
        totalRecycled: 0,
        totalConsumption: 0,
        totalBoilerWater: 0,
        totalDomestic: 0,
        totalWTPBackwash: 0,
        totalNonContactCooling: 0,
        totalWetProcess: 0,
        totalUtility: 0,
        totalProcessLoss: 0,
        totalTreatment: 0,
        totalDischarge: 0,
        maxConsumption: { value: 0, month: 'N/A', businessUnit: 'N/A' },
        minConsumption: { value: 0, month: 'N/A', businessUnit: 'N/A' }
      };
    }

    let totalGW = 0, totalRain = 0, totalRecycled = 0;
    let totalBoiler = 0, totalDomestic = 0, totalWTP = 0, totalCooling = 0;
    let totalWet = 0, totalUtility = 0;
    let totalLoss = 0, totalTreatment = 0, totalDischarge = 0;

    monthlyData.forEach(month => {
      totalGW += month.source.groundWater;
      totalRain += month.source.rainwater;
      totalRecycled += month.source.recycled;
      totalBoiler += month.consumption.boilerWater;
      totalDomestic += month.consumption.domestic;
      totalWTP += month.consumption.wtpBackwash;
      totalCooling += month.consumption.nonContactCooling;
      totalWet += month.consumption.wetProcess;
      totalUtility += month.consumption.utility;
      totalLoss += month.processLoss;
      totalTreatment += month.treatment;
      totalDischarge += month.discharge;
    });

    const peakMonth = monthlyData.reduce((max, curr) => 
      curr.consumption.total > max.consumption.total ? curr : max
    , monthlyData[0]);

    const lowestMonth = monthlyData.reduce((min, curr) => 
      curr.consumption.total < min.consumption.total && curr.consumption.total > 0 ? curr : min
    , monthlyData[0]);

    return {
      totalSource: parseFloat((totalGW + totalRain + totalRecycled).toFixed(2)),
      totalGroundWater: parseFloat(totalGW.toFixed(2)),
      totalRainwater: parseFloat(totalRain.toFixed(2)),
      totalRecycled: parseFloat(totalRecycled.toFixed(2)),
      totalConsumption: parseFloat((totalBoiler + totalDomestic + totalWTP + totalCooling + totalWet + totalUtility).toFixed(2)),
      totalBoilerWater: parseFloat(totalBoiler.toFixed(2)),
      totalDomestic: parseFloat(totalDomestic.toFixed(2)),
      totalWTPBackwash: parseFloat(totalWTP.toFixed(2)),
      totalNonContactCooling: parseFloat(totalCooling.toFixed(2)),
      totalWetProcess: parseFloat(totalWet.toFixed(2)),
      totalUtility: parseFloat(totalUtility.toFixed(2)),
      totalProcessLoss: parseFloat(totalLoss.toFixed(2)),
      totalTreatment: parseFloat(totalTreatment.toFixed(2)),
      totalDischarge: parseFloat(totalDischarge.toFixed(2)),
      maxConsumption: {
        value: parseFloat(peakMonth.consumption.total.toFixed(2)),
        month: peakMonth.month,
        businessUnit: peakMonth.businessUnit || 'Unknown'
      },
      minConsumption: {
        value: parseFloat(lowestMonth.consumption.total.toFixed(2)),
        month: lowestMonth.month,
        businessUnit: lowestMonth.businessUnit || 'Unknown'
      }
    };
  }

  static async getMetrics(req, res) {
    try {
      const waterData = await WaterData.findOne({
        file: req.params.fileId,
        userId: req.user.id
      }).populate('file', 'name originalName uploadedAt');

      if (!waterData) {
        return res.status(404).json({
          success: false,
          error: 'Water data not found. Please process the file first.'
        });
      }

      res.json({
        success: true,
        data: waterData
      });
    } catch (err) {
      console.error('❌ Error fetching metrics:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch metrics',
        message: err.message
      });
    }
  }

  static async exportData(req, res) {
    try {
      res.json({ success: true, data: {} });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = WaterController;