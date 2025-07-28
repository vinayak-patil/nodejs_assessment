const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).populate('role');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role.name)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role.name} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role.name !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Check if user is the author of a resource
exports.isAuthor = (model) => {
  return async (req, res, next) => {
    try {
      const resource = await model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if user is the author or an admin
      if (resource.author.toString() !== req.user._id.toString() && req.user.role.name !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to modify this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
}; 