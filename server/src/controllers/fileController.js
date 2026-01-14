// server/src/controllers/fileController.js
const File = require('../models/File');
const Papa = require('papaparse');
const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');

/**
 * Upload file with multi-sheet Excel support and automatic type detection
 */
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user.id;
    const { folderId } = req.body;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    console.log('📤 Uploading file:', req.file.originalname, 'Folder:', folderId || 'root');

    let parsedData = [];
    let headers = [];
    let allSheets = [];
    let fileType = 'general';

    // Parse CSV
    if (fileExtension === '.csv') {
      const fileContent = await fs.readFile(req.file.path, 'utf8');
      const parsed = Papa.parse(fileContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });

      parsedData = parsed.data;
      headers = parsed.meta.fields || [];

      console.log('✅ CSV parsed:', parsedData.length, 'rows');

      fileType = detectFileType(headers);
    }
    // Parse Excel (multi-sheet)
    else if (['.xlsx', '.xls'].includes(fileExtension)) {
      const workbook = XLSX.readFile(req.file.path);
      console.log('📊 Excel sheets found:', workbook.SheetNames);

      allSheets = workbook.SheetNames.map(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        const sheetHeaders = sheetData.length > 0 ? Object.keys(sheetData[0]) : [];

        console.log(`  ✅ Sheet "${sheetName}": ${sheetData.length} rows`);

        return {
          name: sheetName,
          data: sheetData,
          headers: sheetHeaders,
          rows: sheetData.length,
          columns: sheetHeaders.length
        };
      });

      // Use first sheet as main data for backward compatibility
      if (allSheets.length > 0) {
        parsedData = allSheets[0].data;
        headers = allSheets[0].headers;
      }

      // Detect type using all headers from all sheets
      const allHeaders = allSheets.flatMap(s => s.headers);
      fileType = detectFileType(allHeaders);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type. Only CSV, XLSX, XLS allowed.'
      });
    }

    console.log('🔍 Detected file type:', fileType);

    // Save to database
    const fileRecord = await File.create({
      userId,
      name: req.file.originalname,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      type: fileExtension.substring(1), // csv, xlsx, xls
      mimeType: req.file.mimetype,
      parentId: folderId || null,
      data: parsedData,
      sheets: allSheets.length > 0 ? allSheets : undefined,
      metadata: {
        rows: parsedData.length,
        columns: headers.length,
        headers,
        sheets: allSheets.length > 0 ? allSheets.map(s => s.name) : undefined,
        totalSheets: allSheets.length || 1,
        uploadedAt: new Date().toISOString(),
        type: fileType  // ← Important for dashboard filtering
      }
    });

    console.log('✅ File saved to DB:', fileRecord._id);

    res.status(201).json({
      success: true,
      message: 'File uploaded and parsed successfully',
      file: {
        ...fileRecord.toObject(),
        id: fileRecord._id.toString()
      }
    });
  } catch (error) {
    console.error('❌ Upload error:', error);

    // Clean up uploaded file if something went wrong
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
};

/**
 * Helper: Detect file type from headers
 */
const detectFileType = (headers) => {
  if (!headers || headers.length === 0) return 'general';

  const lowerHeaders = headers.map(h => h.toLowerCase());

  if (lowerHeaders.some(h => /waste|jhute|padding|leftover|poly|cartoon|paper|cone|pattern/i.test(h))) {
    return 'waste';
  }
  if (lowerHeaders.some(h => /water|etp|inlet|outlet|sludge/i.test(h))) {
    return 'water';
  }
  if (lowerHeaders.some(h => /energy|electricity|fuel|kwh/i.test(h))) {
    return 'energy';
  }
  if (lowerHeaders.some(h => /emission|scope|ghg|co2|carbon/i.test(h))) {
    return 'emissions';
  }
  if (lowerHeaders.length > 15) {
    return 'combined';
  }

  return 'general';
};
/**
 * Get file content for CSV editor
 */
exports.getFileContent = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.fileId,
      userId: req.user.id
    }).lean();

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Return parsed data
    res.json({
      success: true,
      data: file.data || [],
      headers: file.metadata?.headers || [],
      fileName: file.name
    });
  } catch (error) {
    console.error('❌ Get file content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file content',
      error: error.message
    });
  }
};

/**
 * Get all files (root or folder)
 */
exports.getFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const { folderId } = req.query;

    const query = {
      userId,
      parentId: folderId || null
    };

    const files = await File.find(query)
      .sort({ type: -1, name: 1 })
      .select('name originalName type size mimeType createdAt updatedAt parentId path data metadata sheets')
      .lean();

    res.json({
      success: true,
      count: files.length,
      files: files.map(f => ({
        ...f,
        id: f._id.toString(),
        _id: f._id.toString()
      }))
    });
  } catch (error) {
    console.error('❌ Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files',
      error: error.message
    });
  }
};

/**
 * Get single file by ID (with all sheets)
 */
exports.getFileById = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // toObject() to include virtuals
    const fileObj = file.toObject({ virtuals: true });

      res.json({
        success: true,
        data: fileObj, 
        id: file._id.toString()
      });
    } catch (error) {
      console.error('Get file error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch file',
        error: error.message
      });
    }
  };

/**
 * Delete file
 */
exports.deleteFile = async (req, res) => {
  try {
    // ✅ Change from req.params.fileId to req.params.id
    const fileId = req.params.id || req.params.fileId;  // Support both
    const userId = req.user.id;

    const file = await File.findOne({ 
      _id: fileId,  // ✅ Use fileId variable
      userId: userId 
    });

    if (!file) {
      return res.status(404).json({ 
        success: false,
        error: 'File not found' 
      });
    }

    await File.findByIdAndDelete(fileId);  // ✅ Use fileId variable

    const filePath = path.join(__dirname, '../../uploads', userId.toString(), file.path);
    
    try {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        await fs.rm(filePath, { recursive: true, force: true });
      } else {
        await fs.unlink(filePath);
      }
    } catch (fsError) {
      console.log('⚠️ Physical file already deleted:', fsError.message);
    }

    if (file.type === 'folder') {
      await File.deleteMany({ parentId: fileId });  // ✅ Use fileId variable
    }

    res.json({ 
      success: true,
      message: 'File deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Delete file error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete file', 
      details: error.message 
    });
  }
};


/**
 * Create a new folder
 */
exports.createFolder = async (req, res) => {
  try {
    const { folderName, parentId } = req.body;
    const userId = req.user.id;

    console.log('📁 Creating folder:', folderName, 'Parent:', parentId);

    if (!folderName) {
      return res.status(400).json({ 
        success: false,
        error: 'Folder name is required' 
      });
    }

    let folderPath = folderName;
    if (parentId) {
      const parentFolder = await File.findOne({ _id: parentId, userId: userId });
      if (parentFolder) {
        folderPath = `${parentFolder.path}/${folderName}`;
      }
    }

    const folder = new File({
      name: folderName,
      type: 'folder',
      userId: userId,
      parentId: parentId || null,
      path: folderPath,
      size: 0
    });

    await folder.save();

    const physicalPath = path.join(__dirname, '../../uploads', userId.toString(), folderPath);
    await fs.mkdir(physicalPath, { recursive: true });

    console.log('✅ Folder created:', folder._id, 'Path:', folderPath);

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      folder: {
        ...folder.toObject(),
        id: folder._id.toString()
      }
    });
  } catch (error) {
    console.error('❌ Create folder error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create folder', 
      details: error.message 
    });
  }
};

/**
 * Update file content
 */
exports.updateFileContent = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { content, data, headers } = req.body;
    const userId = req.user.id;

    const file = await File.findOne({ _id: fileId, userId: userId });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (data) {
      file.data = data;
      if (headers) {
        file.metadata = file.metadata || {};
        file.metadata.headers = headers;
        file.metadata.rows = data.length;
        file.metadata.columns = headers.length;
      }
    }

    if (content) {
      const filePath = path.join(__dirname, '../../uploads', userId.toString(), file.path);
      await fs.writeFile(filePath, content, 'utf-8');
      
      const stats = await fs.stat(filePath);
      file.size = stats.size;
    }

    file.updatedAt = new Date();
    await file.save();

    res.json({ 
      success: true,
      message: 'File updated successfully', 
      file: {
        ...file.toObject(),
        id: file._id.toString()
      }
    });
  } catch (error) {
    console.error('❌ Update file error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update file', 
      details: error.message 
    });
  }
};


/**
 * Get files in a specific folder
 */
exports.getFilesByFolder = async (req, res) => {
  try {
    const files = await File.find({
      userId: req.user.id,
      parentId: req.params.folderId
    }).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      count: files.length,
      files: files.map(f => ({
        ...f,
        id: f._id.toString()
      }))
    });
  } catch (error) {
    console.error('❌ Get folder files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folder files',
      error: error.message
    });
  }
};