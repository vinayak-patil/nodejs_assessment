const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    res.json({
      success: true,
      count: categories.length,
      data: {
        categories: categories.map(category => ({
          id: category._id,
          name: category.name,
          description: category.description,
          createdAt: category.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: {
        category: {
          id: category._id,
          name: category.name,
          description: category.description,
          isActive: category.isActive,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Admin
router.post('/', protect, authorize('admin'), [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description cannot be more than 200 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, description } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = await Category.create({
      name,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category: {
          id: category._id,
          name: category.name,
          description: category.description,
          createdAt: category.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin
router.put('/:id', protect, authorize('admin'), [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description cannot be more than 200 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, description } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if new name conflicts with existing category
    if (name && name.toLowerCase() !== category.name.toLowerCase()) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Update fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category: {
          id: category._id,
          name: category.name,
          description: category.description,
          updatedAt: category.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has posts (you might want to implement this check)
    // For now, we'll just deactivate the category
    category.isActive = false;
    await category.save();

    res.json({
      success: true,
      message: 'Category deactivated successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 