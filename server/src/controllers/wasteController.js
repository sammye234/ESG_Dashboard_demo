// server/src/controllers/wasteController.js
const WasteData = require('../models/WasteData');
const File = require('../models/File');

class WasteController {
  static async getWasteFiles (req, res) {
    try {
      const files = await File.find({
        userId: req.user.id
      }).select('name originalName uploadedAt metadata data')
        .sort({ uploadedAt: -1 });

      res.json({
        success: true,
        count: files.length,
        files: files.map(f => ({
          _id: f._id,
          name: f.name,
          originalName: f.originalName,
          uploadedAt: f.uploadedAt || f.createdAt,
          rowCount: f.data?.length || 0,
          headers: f.metadata?.headers || []
        }))
      });
    } catch (err) {
      console.error('Error fetching files:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch waste files'
      });
   }
  }

  static async processWasteFile(req, res) {
    try {
      console.log('🗑️ processWasteFile called with fileId:', req.params.fileId);
      console.log('👤 User ID:', req.user.id);
      
      const file = await File.findOne({
        _id: req.params.fileId,
        userId: req.user.id
      });

      if (!file) {
        console.log('❌ File not found');
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      console.log('📁 File found:', file.name);

      if (!file.data || file.data.length === 0) {
        console.log('❌ File has no data');
        return res.status(400).json({
          success: false,
          error: 'File has no data to process'
        });
      }

      console.log('⚙️ Processing waste file:', file.name);
      console.log('📊 Row count:', file.data.length);

      const headers = file.metadata?.headers || Object.keys(file.data[0]);
      console.log('📋 Headers:', headers);

      const processedData = WasteController.processMultiBUWasteData(
        file.data, 
        headers
      );

      console.log('✅ Processed data:', {
        businessUnits: processedData.businessUnits,
        totalWaste: processedData.combined?.metrics?.totalWaste,
        monthlyDataCount: processedData.combined?.monthlyData?.length
      });

      // Store processed data
      let wasteData = await WasteData.findOne({
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

      if (wasteData) {
        console.log('📝 Updating existing waste data record');
        Object.assign(wasteData, dataToSave);
        await wasteData.save();
      } else {
        console.log('📝 Creating new waste data record');
        wasteData = new WasteData({
          userId: req.user.id,
          file: file._id,
          fileName: file.name,
          ...dataToSave
        });
        await wasteData.save();
      }

      console.log('💾 Saved waste data with ID:', wasteData._id);

      res.json({
        success: true,
        data: wasteData,
        businessUnits: processedData.businessUnits
      });
    } catch (err) {
      console.error('❌ Error processing waste file:', err);
      console.error('Stack trace:', err.stack);
      res.status(500).json({
        success: false,
        error: 'Failed to process waste data',
        message: err.message
      });
    }
  }

  static processMultiBUWasteData(rawData, headers) {
    console.log('🗑️ Processing multi-BU waste data...');

    const findColumn = (patterns) => {
      return headers.find(h => 
        patterns.some(p => new RegExp(p, 'i').test(h.trim()))
      ) || null;
    };

    const buCol = findColumn(['^bu$', 'business.*unit', 'factory']);
    const monthCol = findColumn(['^month$', 'period', 'name.*month']);
    
    // Recycle waste columns
    const jhuteCol = findColumn(['jhute.*kg', '^jhute']);
    const paddingCol = findColumn(['padding.*kg', '^padding']);
    const leftoverCol = findColumn(['leftover.*kg', '^leftover']);
    const polyPlasticCol = findColumn(['poly.*plastic.*kg', 'poly.*kg', 'plastic.*kg']);
    const cartonCol = findColumn(['carton.*kg', 'carton.*kg', '^carton', '^carton']);
    const paperCol = findColumn(['paper.*kg', '^paper']);
    const emptyConeCol = findColumn(['empty.*cone.*kg', 'paper.*cone.*kg', '^cone']);
    const patternBoardCol = findColumn(['pattern.*board.*kg', '^pattern']);
    
    // Hazardous waste columns
    const medicalCol = findColumn(['medical.*waste.*kg', '^medical']);
    const metalCol = findColumn(['metal.*kg', '^metal']);
    const electricCol = findColumn(['electric.*waste.*kg', '^electric', 'e-waste']);
    const chemicalDrumCol = findColumn(['empty.*chemical.*drum.*kg', '^chemical.*drum']);
    const etpInletCol = findColumn(['etp.*inlet.*m3', '^etp.*inlet']);
    const etpOutletCol = findColumn(['etp.*outlet.*m3', '^etp.*outlet']);
    
    // Bio-solid
    const sludgeCol = findColumn(['sludge.*kg', '^sludge']);
    const foodWasteCol = findColumn(['food.*waste.*kg', '^food']);
    
    console.log('📋 Detected columns:', {
      bu: buCol,
      month: monthCol,
      jhute: jhuteCol,
      padding: paddingCol,
      leftover: leftoverCol,
      polyPlastic: polyPlasticCol,
      carton: cartonCol,
      paper: paperCol,
      emptyCone: emptyConeCol,
      patternBoard: patternBoardCol,
      medical: medicalCol,
      metal: metalCol,
      electric: electricCol,
      chemicalDrum: chemicalDrumCol,
      etpInlet: etpInletCol,
      etpOutlet: etpOutletCol,
      sludge: sludgeCol,
      foodWaste: foodWasteCol
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
      const buValue = row[buCol] || '';
      let buStr = String(buValue).trim().toUpperCase();
      
      const monthValue = row[monthCol] || '';
      let monthStr = String(monthValue).trim();

      if (!monthStr || !buStr || monthStr.toLowerCase() === 'month' || buStr.toLowerCase() === 'bu') {
        return;
      }

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

      let month = monthStr;
      const monthMatch = monthStr.match(/^([a-z]+)[-\s]*(\d{2})?/i);
      if (monthMatch) {
        const monthName = monthMatch[1].toLowerCase();
        const year = monthMatch[2] ? `20${monthMatch[2]}` : '';
        
        if (monthNames[monthName]) {
          month = year ? `${monthNames[monthName]} ${year}` : monthNames[monthName];
        }
      }

      const jhute = parseFloat(row[jhuteCol]) || 0;
      const padding = parseFloat(row[paddingCol]) || 0;
      const leftover = parseFloat(row[leftoverCol]) || 0;
      const polyPlastic = parseFloat(row[polyPlasticCol]) || 0;
      const carton = parseFloat(row[cartonCol]) || 0;
      const paper = parseFloat(row[paperCol]) || 0;
      const emptyCone = parseFloat(row[emptyConeCol]) || 0;
      const patternBoard = parseFloat(row[patternBoardCol]) || 0;
      const medical = parseFloat(row[medicalCol]) || 0;
      const metal = parseFloat(row[metalCol]) || 0;
      const electric = parseFloat(row[electricCol]) || 0;
      const chemicalDrum = parseFloat(row[chemicalDrumCol]) || 0;
      const etpInlet = parseFloat(row[etpInletCol]) || 0;
      const etpOutlet = parseFloat(row[etpOutletCol]) || 0;
      const sludge = parseFloat(row[sludgeCol]) || 0;
      const foodWaste = parseFloat(row[foodWasteCol]) || 0;

      const preConsumer = jhute + padding + leftover;
      const packaging = polyPlastic + carton + paper + emptyCone + patternBoard;
      const recyclable = preConsumer + packaging;
      const solidHazardous = medical + metal + electric + chemicalDrum;
      const liquidHazardous = etpInlet + etpOutlet + sludge;
      const hazardous = solidHazardous + liquidHazardous;
      const bioSolid = foodWaste;
      const totalWaste = recyclable + solidHazardous + bioSolid;

      if (totalWaste === 0) {
        return;
      }

      const wasteRecord = {
        month,
        businessUnit: bu,
        recycleWaste: {
          preConsumer: {
            jhute,
            padding,
            leftover
          },
          packaging: {
            polyPlastic,
            carton,
            paper,
            emptyCone,
            patternBoard
          }
        },
        hazardousWaste: {
          solid: {
            medical,
            metal,
            electric,
            chemicalDrum
          },
          liquid: {
            etpInlet,
            etpOutlet
          }
        },
        bioSolidWaste: {
          sludge,
          foodWaste
        },
        calculated: {
          totalPreConsumer: preConsumer,
          totalPackaging: packaging,
          totalRecyclable: recyclable,
          totalHazardousSolid: solidHazardous,
          totalHazardousLiquid: liquidHazardous,
          totalHazardous: hazardous,
          totalBioSolid: bioSolid,
          totalWaste
        }
      };

      if (buData[bu]) {
        buData[bu].push(wasteRecord);
      }

      combinedMonthly.push(wasteRecord);
    });

    console.log('🗑️ BU data counts:', {
      GTL: buData.GTL.length,
      '4AL': buData['4AL'].length,
      SESL: buData.SESL.length,
      combined: combinedMonthly.length
    });

    if (combinedMonthly.length === 0) {
      throw new Error('No valid waste data found. Please check your file format.');
    }

    const combinedMetrics = WasteController.calculateMetrics(combinedMonthly);

    const byBU = {};
    Object.keys(buData).forEach(bu => {
      if (buData[bu].length > 0) {
        byBU[bu] = {
          metrics: WasteController.calculateMetrics(buData[bu]),
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
        totalWaste: 0,
        totalRecyclable: 0,
        totalHazardous: 0,
        preConsumer: 0,
        packaging: 0,
        solidHazardous: 0,
        liquidHazardous: 0,
        bioSolid: 0,
        recyclingRate: 0
      };
    }

    let totalWaste = 0, totalRecyclable = 0, totalHazardous = 0;
    let preConsumer = 0, packaging = 0, solidHazardous = 0, liquidHazardous = 0, bioSolid = 0;

    console.log('🧮 Calculating metrics from', monthlyData.length, 'months');

    monthlyData.forEach((month, index) => {
      console.log(`Month ${index + 1} (${month.month}):`, {
        totalWaste: month.calculated?.totalWaste || 0,
        totalRecyclable: month.calculated?.totalRecyclable || 0,
        totalHazardous: month.calculated?.totalHazardous || 0
      });

      totalWaste += month.calculated?.totalWaste || 0;
      totalRecyclable += month.calculated?.totalRecyclable || 0;
      totalHazardous += month.calculated?.totalHazardous || 0;
      preConsumer += month.calculated?.totalPreConsumer || 0;
      packaging += month.calculated?.totalPackaging || 0;
      solidHazardous += month.calculated?.totalHazardousSolid || 0;
      liquidHazardous += month.calculated?.totalHazardousLiquid || 0;
      bioSolid += month.calculated?.totalBioSolid || 0;
    });

    console.log('📊 Totals:', {
      totalWaste,
      totalRecyclable,
      totalHazardous,
      preConsumer,
      packaging
    });

    // ✅ Calculate recycling rate (recyclable / total waste * 100)
    const recyclingRate = totalWaste > 0 ? (totalRecyclable / totalWaste) * 100 : 0;

    console.log('♻️ Recycling Rate:', recyclingRate.toFixed(1) + '%');

    return {
      totalWaste: parseFloat(totalWaste.toFixed(2)),
      totalRecyclable: parseFloat(totalRecyclable.toFixed(2)),
      totalHazardous: parseFloat(totalHazardous.toFixed(2)),
      preConsumer: parseFloat(preConsumer.toFixed(2)),
      packaging: parseFloat(packaging.toFixed(2)),
      solidHazardous: parseFloat(solidHazardous.toFixed(2)),
      liquidHazardous: parseFloat(liquidHazardous.toFixed(2)),
      bioSolid: parseFloat(bioSolid.toFixed(2)),
      recyclingRate: parseFloat(recyclingRate.toFixed(1))
    };
  }


  static async getMetrics(req, res) {
    try {
      console.log('🗑️ getMetrics called with fileId:', req.params.fileId);
      console.log('👤 User:', req.user.username, 'Role:', req.user.role, 'BU:', req.user.businessUnit);
      
      const wasteData = await WasteData.findOne({
        file: req.params.fileId,
        userId: req.user.id
      }).populate('file', 'name originalName uploadedAt');

      if (!wasteData) {
        return res.status(404).json({
          success: false,
          error: 'Waste data not found. Please process the file first.'
        });
      }

      // ✅ Filter data based on user's access
      let filteredData = { ...wasteData.toObject() };
      
      // If user is BU user, only show their BU data
      if (!req.user.permissions.canViewAllBUs && req.user.businessUnit !== 'HQ') {
        const userBU = req.user.businessUnit;
        
        console.log(`🔒 Filtering data for BU: ${userBU}`);
        
        // Filter monthly data to only include user's BU
        filteredData.monthlyData = wasteData.monthlyData.filter(
          month => month.businessUnit === userBU
        );
        
        // Only include user's BU in factoryData
        if (wasteData.factoryData && wasteData.factoryData[userBU]) {
          filteredData.factoryData = {
            [userBU]: wasteData.factoryData[userBU]
          };
        } else {
          filteredData.factoryData = {};
        }
        
        // Recalculate metrics for filtered data only
        const buMetrics = wasteData.factoryData?.[userBU]?.metrics;
        if (buMetrics) {
          filteredData.metrics = buMetrics;
        }
        
        console.log(`✅ Filtered to ${filteredData.monthlyData.length} months for ${userBU}`);
      }

      res.json({
        success: true,
        data: filteredData,
        userAccess: {
          canViewAllBUs: req.user.permissions.canViewAllBUs,
          businessUnit: req.user.businessUnit,
          accessibleBUs: req.user.getAccessibleBUs()
        }
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

  // ✅ Add new endpoint to get user's accessible BUs
  static async getAccessibleBUs(req, res) {
    try {
      const accessibleBUs = req.user.getAccessibleBUs();
      
      res.json({
        success: true,
        data: {
          accessibleBUs,
          canViewAllBUs: req.user.permissions.canViewAllBUs,
          currentBU: req.user.businessUnit,
          role: req.user.role
        }
      });
    } catch (err) {
      console.error('❌ Error getting accessible BUs:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to get accessible BUs',
        message: err.message
      });
    }
  }

  // ✅ Add validation before file upload
  static async validateUploadAccess(req, res, next) {
    try {
      // Check if user has upload permission
      if (!req.user.permissions.canUploadData) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to upload data'
        });
      }
      
      // BU users can only upload data for their own BU
      // This validation can be added in processWasteFile
      next();
    } catch (err) {
      res.status(500).json({
        success: false,
        error: 'Upload validation failed',
        message: err.message
      });
    }
  }

  static async getLatest(req, res) {
    try {
      const userId = req.user.id;
      const { companyType } = req.query;
      
      const query = { userId };
      if (companyType) query.companyType = companyType;
      
      const latestRecord = await WasteData.findOne(query).sort({ year: -1, month: -1 });
      
      if (!latestRecord) {
        return res.status(404).json({ success: false, message: 'No waste data found' });
      }
      
      res.status(200).json({ success: true, data: latestRecord });
    } catch (error) {
      console.error('Get latest error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve latest data', error: error.message });
    }
  }

  static async deleteWasteData(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const wasteData = await WasteData.findOne({ _id: id, userId });
      
      if (!wasteData) {
        return res.status(404).json({ success: false, message: 'Waste data not found' });
      }
      
      await wasteData.deleteOne();
      
      res.status(200).json({ success: true, message: 'Waste data deleted successfully' });
    } catch (error) {
      console.error('Delete waste data error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete waste data', error: error.message });
    }
  }

  static async updateWasteData(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const wasteData = await WasteData.findOne({ _id: id, userId });
      
      if (!wasteData) {
        return res.status(404).json({ 
          success: false, 
          message: 'Waste data not found' 
        });
      }
      
      Object.assign(wasteData, req.body);
      await wasteData.save();
      
      res.status(200).json({ 
        success: true, 
        message: 'Waste data updated successfully', 
        data: wasteData 
      });
    } catch (error) {
      console.error('Update waste data error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update waste data', 
        error: error.message 
      });
    }
  }
}

module.exports = WasteController;