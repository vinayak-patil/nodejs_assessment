const express = require('express');
const User = require('../models/User');
const { protect, authorize, isAdmin } = require('../middleware/auth');

const router = express.Router();

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('role')
      .select('-password');

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          bio: user.bio,
          avatar: user.avatar,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Admin
router.get('/', protect, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const users = await User.find()
      .populate('role')
      .select('-password')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.json({
      success: true,
      count: users.length,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      data: {
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          bio: user.bio,
          avatar: user.avatar,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Admin
router.get('/:id', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('role')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          bio: user.bio,
          avatar: user.avatar,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
router.put('/me', protect, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          avatar: user.avatar,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Deactivate/Activate user (Admin only)
// @route   PATCH /api/users/:id/status
// @access  Admin
router.patch('/:id/status', protect, isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 