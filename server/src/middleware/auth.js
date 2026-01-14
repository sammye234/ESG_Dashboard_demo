// server/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

// Authenticate JWT token and attach full user object
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
   
    const user = await User.findById(decoded.id).select('+password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false,
        error: 'User not found or inactive' 
      });
    }
    
    
    req.userId = user._id;
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      businessUnit: user.businessUnit,
      organization: user.organization,
      permissions: user.permissions,
      canAccessBU: (bu) => user.canAccessBU(bu),
      getAccessibleBUs: () => user.getAccessibleBUs()
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired' 
      });
    }
    return res.status(403).json({ 
      success: false,
      error: 'Invalid token' 
    });
  }
};

// Check if user can view all BUs (HQ only)
const requireHQAccess = (req, res, next) => {
  if (!req.user || !req.user.permissions.canViewAllBUs) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. HQ access required.'
    });
  }
  next();
};

//Check if user can access specific BU
const requireBUAccess = (businessUnit) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // HQ users can access all BUs
    if (req.user.permissions.canViewAllBUs) {
      return next();
    }
    
    // BU users can only access their own BU
    if (req.user.businessUnit !== businessUnit) {
      return res.status(403).json({
        success: false,
        error: `Access denied. You can only access ${req.user.businessUnit} data.`
      });
    }
    
    next();
  };
};

// Check upload permission
const requireUploadPermission = (req, res, next) => {
  if (!req.user || !req.user.permissions.canUploadData) {
    return res.status(403).json({
      success: false,
      error: 'Upload permission denied'
    });
  }
  next();
};

// check delete permission
const requireDeletePermission = (req, res, next) => {
  if (!req.user || !req.user.permissions.canDeleteData) {
    return res.status(403).json({
      success: false,
      error: 'Delete permission denied'
    });
  }
  next();
};

// check admin permission
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'hq_admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

// Optional authentication
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive) {
        req.userId = user._id;
        req.user = {
          id: user._id,
          role: user.role,
          businessUnit: user.businessUnit,
          permissions: user.permissions
        };
      }
    } catch (error) {
      console.log('Invalid token in optional auth:', error.message);
    }
  }

  next();
};

const protect = authenticateToken;

module.exports = {
  authenticateToken,
  protect,
  optionalAuth,
  requireHQAccess,
  requireBUAccess,
  requireUploadPermission,
  requireDeletePermission,
  requireAdmin
};