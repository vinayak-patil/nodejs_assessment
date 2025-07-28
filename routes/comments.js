const express = require('express');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { protect, authorize, isAuthor } = require('../middleware/auth');

const router = express.Router();

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public
router.get('/post/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const comments = await Comment.find({
      post: req.params.postId,
      parentComment: null, // Only top-level comments
      isApproved: true
    })
      .populate('author', 'name avatar')
      .populate({
        path: 'replies',
        match: { isApproved: true },
        populate: {
          path: 'author',
          select: 'name avatar'
        }
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Comment.countDocuments({
      post: req.params.postId,
      parentComment: null,
      isApproved: true
    });

    res.json({
      success: true,
      count: comments.length,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      data: {
        comments: comments.map(comment => ({
          id: comment._id,
          text: comment.text,
          author: {
            id: comment.author._id,
            name: comment.author.name,
            avatar: comment.author.avatar
          },
          likes: comment.likes.length,
          replies: comment.replies ? comment.replies.length : 0,
          isEdited: comment.isEdited,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Add comment to a post
// @route   POST /api/comments
// @access  Private
router.post('/', protect, [
  body('text')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment text must be between 1 and 1000 characters'),
  body('post')
    .notEmpty()
    .withMessage('Post ID is required')
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

    const { text, post: postId, parentComment } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if parent comment exists (for replies)
    if (parentComment) {
      const parentCommentDoc = await Comment.findById(parentComment);
      if (!parentCommentDoc) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }

    const comment = await Comment.create({
      text,
      post: postId,
      author: req.user.id,
      parentComment: parentComment || null
    });

    // If this is a reply, add it to parent comment's replies array
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $push: { replies: comment._id }
      });
    }

    await comment.populate('author', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: {
          id: comment._id,
          text: comment.text,
          author: {
            id: comment.author._id,
            name: comment.author.name,
            avatar: comment.author.avatar
          },
          post: comment.post,
          parentComment: comment.parentComment,
          likes: comment.likes.length,
          isApproved: comment.isApproved,
          createdAt: comment.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private (Author or Admin)
router.put('/:id', protect, isAuthor(Comment), [
  body('text')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment text must be between 1 and 1000 characters')
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

    const { text } = req.body;
    const comment = req.resource;

    comment.text = text;
    comment.isEdited = true;
    await comment.save();

    await comment.populate('author', 'name avatar');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        comment: {
          id: comment._id,
          text: comment.text,
          author: {
            id: comment.author._id,
            name: comment.author.name,
            avatar: comment.author.avatar
          },
          isEdited: comment.isEdited,
          updatedAt: comment.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private (Author or Admin)
router.delete('/:id', protect, isAuthor(Comment), async (req, res) => {
  try {
    const comment = req.resource;

    // If this is a reply, remove it from parent comment's replies array
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $pull: { replies: comment._id }
      });
    }

    await comment.remove();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Like/Unlike comment
// @route   POST /api/comments/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const userLiked = comment.likes.includes(req.user.id);

    if (userLiked) {
      // Unlike
      comment.likes = comment.likes.filter(id => id.toString() !== req.user.id);
    } else {
      // Like
      comment.likes.push(req.user.id);
    }

    await comment.save();

    res.json({
      success: true,
      message: `Comment ${userLiked ? 'unliked' : 'liked'} successfully`,
      data: {
        likes: comment.likes.length,
        isLiked: !userLiked
      }
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Approve/Disapprove comment (Admin only)
// @route   PATCH /api/comments/:id/approve
// @access  Admin
router.patch('/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { isApproved } = req.body;

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    comment.isApproved = isApproved;
    await comment.save();

    res.json({
      success: true,
      message: `Comment ${isApproved ? 'approved' : 'disapproved'} successfully`,
      data: {
        comment: {
          id: comment._id,
          isApproved: comment.isApproved
        }
      }
    });
  } catch (error) {
    console.error('Approve comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get replies for a comment
// @route   GET /api/comments/:id/replies
// @access  Public
router.get('/:id/replies', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const replies = await Comment.find({
      parentComment: req.params.id,
      isApproved: true
    })
      .populate('author', 'name avatar')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: replies.length,
      data: {
        replies: replies.map(reply => ({
          id: reply._id,
          text: reply.text,
          author: {
            id: reply.author._id,
            name: reply.author.name,
            avatar: reply.author.avatar
          },
          likes: reply.likes.length,
          isEdited: reply.isEdited,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 