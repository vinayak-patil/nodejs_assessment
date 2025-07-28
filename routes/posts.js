const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Category = require('../models/Category');
const { protect, authorize, isAuthor } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    let query = { status: 'published' };
    
    if (req.query.category) {
      const category = await Category.findOne({ 
        $or: [
          { _id: req.query.category },
          { name: req.query.category }
        ]
      });
      if (category) {
        query.category = category._id;
      }
    }

    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const posts = await Post.find(query)
      .populate('author', 'name avatar')
      .populate('category', 'name')
      .populate({
        path: 'comments',
        match: { isApproved: true },
        populate: {
          path: 'author',
          select: 'name avatar'
        }
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      count: posts.length,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      data: {
        posts: posts.map(post => ({
          id: post._id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          author: {
            id: post.author._id,
            name: post.author.name,
            avatar: post.author.avatar
          },
          category: {
            id: post.category._id,
            name: post.category.name
          },
          tags: post.tags,
          featuredImage: post.featuredImage,
          viewCount: post.viewCount,
          isFeatured: post.isFeatured,
          commentsCount: post.comments ? post.comments.length : 0,
          comments: post.comments ? post.comments.slice(0, 3) : [], // Show only first 3 comments
          createdAt: post.createdAt,
          updatedAt: post.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar bio')
      .populate('category', 'name')
      .populate({
        path: 'comments',
        match: { isApproved: true },
        populate: {
          path: 'author',
          select: 'name avatar'
        }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Increment view count
    post.viewCount += 1;
    await post.save();

    res.json({
      success: true,
      data: {
        post: {
          id: post._id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          author: {
            id: post.author._id,
            name: post.author.name,
            avatar: post.author.avatar,
            bio: post.author.bio
          },
          category: {
            id: post.category._id,
            name: post.category.name
          },
          tags: post.tags,
          featuredImage: post.featuredImage,
          viewCount: post.viewCount,
          isFeatured: post.isFeatured,
          commentsCount: post.comments ? post.comments.length : 0,
          comments: post.comments || [],
          createdAt: post.createdAt,
          updatedAt: post.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
router.post('/', protect, [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
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

    const { title, content, excerpt, category, tags, featuredImage, status } = req.body;

    // Find category
    const categoryDoc = await Category.findOne({
      $or: [
        { _id: category },
        { name: { $regex: new RegExp(`^${category}$`, 'i') } }
      ]
    });

    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    const post = await Post.create({
      title,
      content,
      excerpt,
      category: categoryDoc._id,
      author: req.user.id,
      tags: tags || [],
      featuredImage,
      status: status || 'published'
    });

    await post.populate('author', 'name avatar');
    await post.populate('category', 'name');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post: {
          id: post._id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          author: {
            id: post.author._id,
            name: post.author.name,
            avatar: post.author.avatar
          },
          category: {
            id: post.category._id,
            name: post.category.name
          },
          tags: post.tags,
          featuredImage: post.featuredImage,
          status: post.status,
          createdAt: post.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private (Author or Admin)
router.put('/:id', protect, isAuthor(Post), [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters')
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

    const { title, content, excerpt, category, tags, featuredImage, status } = req.body;
    const post = req.resource;

    // Update category if provided
    if (category) {
      const categoryDoc = await Category.findOne({
        $or: [
          { _id: category },
          { name: { $regex: new RegExp(`^${category}$`, 'i') } }
        ]
      });

      if (!categoryDoc) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
      post.category = categoryDoc._id;
    }

    // Update other fields
    if (title) post.title = title;
    if (content) post.content = content;
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (tags !== undefined) post.tags = tags;
    if (featuredImage !== undefined) post.featuredImage = featuredImage;
    if (status) post.status = status;

    await post.save();
    await post.populate('author', 'name avatar');
    await post.populate('category', 'name');

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: {
        post: {
          id: post._id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          author: {
            id: post.author._id,
            name: post.author.name,
            avatar: post.author.avatar
          },
          category: {
            id: post.category._id,
            name: post.category.name
          },
          tags: post.tags,
          featuredImage: post.featuredImage,
          status: post.status,
          updatedAt: post.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private (Author or Admin)
router.delete('/:id', protect, isAuthor(Post), async (req, res) => {
  try {
    const post = req.resource;
    await post.remove();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get posts by category
// @route   GET /api/posts/category/:categoryId
// @access  Public
router.get('/category/:categoryId', async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const posts = await Post.find({ 
      category: req.params.categoryId,
      status: 'published'
    })
      .populate('author', 'name avatar')
      .populate('category', 'name')
      .populate({
        path: 'comments',
        match: { isApproved: true },
        populate: {
          path: 'author',
          select: 'name avatar'
        }
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Post.countDocuments({ 
      category: req.params.categoryId,
      status: 'published'
    });

    res.json({
      success: true,
      count: posts.length,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      data: {
        category: {
          id: category._id,
          name: category.name,
          description: category.description
        },
        posts: posts.map(post => ({
          id: post._id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          author: {
            id: post.author._id,
            name: post.author.name,
            avatar: post.author.avatar
          },
          category: {
            id: post.category._id,
            name: post.category.name
          },
          tags: post.tags,
          featuredImage: post.featuredImage,
          viewCount: post.viewCount,
          isFeatured: post.isFeatured,
          commentsCount: post.comments ? post.comments.length : 0,
          createdAt: post.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get posts by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get trending posts (top 5 with most comments)
// @route   GET /api/posts/trending
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const trendingPosts = await Post.aggregate([
      {
        $match: { status: 'published' }
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $addFields: {
          commentsCount: { $size: '$comments' },
          author: { $arrayElemAt: ['$author', 0] },
          category: { $arrayElemAt: ['$category', 0] }
        }
      },
      {
        $sort: { commentsCount: -1, viewCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          id: '$_id',
          title: 1,
          content: 1,
          excerpt: 1,
          author: {
            id: '$author._id',
            name: '$author.name',
            avatar: '$author.avatar'
          },
          category: {
            id: '$category._id',
            name: '$category.name'
          },
          tags: 1,
          featuredImage: 1,
          viewCount: 1,
          isFeatured: 1,
          commentsCount: 1,
          createdAt: 1
        }
      }
    ]);

    res.json({
      success: true,
      count: trendingPosts.length,
      data: {
        posts: trendingPosts
      }
    });
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 