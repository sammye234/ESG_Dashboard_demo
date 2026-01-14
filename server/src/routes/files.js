// server/src/routes/files.js 
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getFiles,
  getFileById,
  getFileContent,
  createFolder,
  uploadFile,
  updateFileContent,
  deleteFile,
  getFilesByFolder
} = require('../controllers/fileController');
const { protect } = require('../middleware/auth');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /csv|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.includes('spreadsheet');
    
    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

router.use(protect);


router.post('/upload', upload.single('file'), uploadFile);

router.post('/folder', createFolder);

router.get('/folder/:folderId', getFilesByFolder);

router.get('/download/:id', async (req, res) => {
  try {
    const File = require('../models/File');
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

    const filePath = file.path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false,
        message: 'File not found on server' 
      });
    }

    res.download(filePath, file.originalName || file.name);
  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to download file',
      error: error.message 
    });
  }
});

router.get('/:fileId/content', getFileContent);

router.get('/', getFiles);

// File operations by ID
router.route('/:id')
  .get(getFileById)
  .put(updateFileContent)
  .delete(deleteFile);

module.exports = router;