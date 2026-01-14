// server/src/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  
  //RBAC
  role: {
    type: String,
    enum: ['hq_admin', 'hq_manager', 'bu_manager', 'bu_user'],
    default: 'bu_user',
    required: true
  },
  
  // BU
  businessUnit: {
    type: String,
    enum: ['HQ', 'GTL', '4AL', 'SESL', null],
    default: null,
    required: function() {
      // BU is required for BU users, optional for HQ users
      return this.role === 'bu_manager' || this.role === 'bu_user';
    }
  },
  

  organization: {
    type: String,
    default: 'Default Company',
    required: true
  },
  
  
  permissions: {
    canViewAllBUs: { type: Boolean, default: false },
    canUploadData: { type: Boolean, default: true },
    canDeleteData: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canExportReports: { type: Boolean, default: true }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// set permissions based on role
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-set permissions based on role
  if (this.isModified('role')) {
    switch(this.role) {
      case 'hq_admin':
        this.permissions = {
          canViewAllBUs: true,
          canUploadData: true,
          canDeleteData: true,
          canManageUsers: true,
          canExportReports: true
        };
        this.businessUnit = 'HQ';
        break;
        
      case 'hq_manager':
        this.permissions = {
          canViewAllBUs: true,
          canUploadData: true,
          canDeleteData: false,
          canManageUsers: false,
          canExportReports: true
        };
        this.businessUnit = 'HQ';
        break;
        
      case 'bu_manager':
        this.permissions = {
          canViewAllBUs: false,
          canUploadData: true,
          canDeleteData: true,
          canManageUsers: false,
          canExportReports: true
        };
        break;
        
      case 'bu_user':
        this.permissions = {
          canViewAllBUs: false,
          canUploadData: true,
          canDeleteData: false,
          canManageUsers: false,
          canExportReports: false
        };
        break;
    }
  }
  
  next();
});

UserSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// check if user can access a specific BU's data
UserSchema.methods.canAccessBU = function(businessUnit) {
  // HQ users can access all BUs
  if (this.permissions.canViewAllBUs) {
    return true;
  }
  
  // BU users can only access their own BU
  return this.businessUnit === businessUnit;
};


UserSchema.methods.getAccessibleBUs = function() {
  if (this.permissions.canViewAllBUs) {
    return ['GTL', '4AL', 'SESL'];
  }
  
  return [this.businessUnit];
};

module.exports = mongoose.model('User', UserSchema);