// backend/routes/articles.js
const express = require('express');
const router = express.Router();
const Article = require('../models/Article');

// ============================================
// GET ALL ARTICLES - With Filtering & Pagination
// ============================================
router.get('/', async (req, res) => {
  try {
    const { 
      type,           // Filter by 'original' or 'updated'
      limit = 50,     // Results per page
      page = 1,       // Page number
      search,         // Search query
      sortBy = 'createdAt', // Sort field
      order = 'desc'  // Sort order
    } = req.query;
    
    // Build query object
    const query = { isActive: true };
    
    if (type && ['original', 'updated'].includes(type)) {
      query.type = type;
    }
    
    // Handle search if provided
    if (search) {
      query.$text = { $search: search };
    }
    
    // Build sort object
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };
    
    // Execute query with pagination
    const articles = await Article.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean(); // Convert to plain JavaScript objects for better performance
    
    // Get total count for pagination
    const total = await Article.countDocuments(query);
    
    res.json({
      success: true,
      data: articles,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching articles:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch articles',
      message: error.message 
    });
  }
});

// ============================================
// GET SINGLE ARTICLE BY ID
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ 
        success: false, 
        error: 'Article not found',
        message: `No article found with ID: ${req.params.id}`
      });
    }
    
    if (!article.isActive) {
      return res.status(410).json({
        success: false,
        error: 'Article deleted',
        message: 'This article is no longer available'
      });
    }
    
    res.json({ 
      success: true, 
      data: article
    });
  } catch (error) {
    console.error('❌ Error fetching article:', error);
    
    // Handle invalid MongoDB ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid article ID',
        message: 'The provided ID format is invalid'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch article',
      message: error.message 
    });
  }
});

// ============================================
// CREATE NEW ARTICLE
// ============================================
router.post('/', async (req, res) => {
  try {
    const { title, content, sourceUrl, references, type, publishedDate } = req.body;
    
    // Validate required fields
    if (!title || !content || !sourceUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'title, content, and sourceUrl are required'
      });
    }
    
    // Check for duplicate sourceUrl
    const existingArticle = await Article.findOne({ 
      sourceUrl,
      isActive: true 
    });
    
    if (existingArticle) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate article',
        message: 'An article with this source URL already exists',
        existingArticle: {
          id: existingArticle._id,
          title: existingArticle.title
        }
      });
    }
    
    // Create new article
    const article = new Article({
      title,
      content,
      sourceUrl,
      references: references || [],
      type: type || 'original',
      publishedDate: publishedDate || null
    });
    
    await article.save();
    
    console.log(`✅ Article created: ${article.title}`);
    
    res.status(201).json({ 
      success: true, 
      data: article,
      message: 'Article created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating article:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: messages.join(', '),
        details: error.errors
      });
    }
    
    res.status(400).json({ 
      success: false, 
      error: 'Failed to create article',
      message: error.message 
    });
  }
});

// ============================================
// UPDATE ARTICLE
// ============================================
router.put('/:id', async (req, res) => {
  try {
    // Define allowed update fields
    const allowedUpdates = ['title', 'content', 'sourceUrl', 'references', 'type', 'publishedDate'];
    const updates = {};
    
    // Filter only allowed fields from request body
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update',
        message: `Allowed fields: ${allowedUpdates.join(', ')}`
      });
    }
    
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      updates,
      { 
        new: true,              // Return updated document
        runValidators: true     // Run schema validators
      }
    );
    
    if (!article) {
      return res.status(404).json({ 
        success: false, 
        error: 'Article not found',
        message: `No article found with ID: ${req.params.id}`
      });
    }
    
    console.log(`✅ Article updated: ${article.title}`);
    
    res.json({ 
      success: true, 
      data: article,
      message: 'Article updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating article:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: messages.join(', ')
      });
    }
    
    // Handle invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid article ID',
        message: 'The provided ID format is invalid'
      });
    }
    
    res.status(400).json({ 
      success: false, 
      error: 'Failed to update article',
      message: error.message 
    });
  }
});

// ============================================
// DELETE ARTICLE (Soft Delete)
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ 
        success: false, 
        error: 'Article not found',
        message: `No article found with ID: ${req.params.id}`
      });
    }
    
    // Soft delete - just mark as inactive
    article.isActive = false;
    await article.save();
    
    console.log(`🗑️  Article soft deleted: ${article.title}`);
    
    res.json({ 
      success: true, 
      message: 'Article deleted successfully',
      data: {
        id: article._id,
        title: article.title
      }
    });
  } catch (error) {
    console.error('❌ Error deleting article:', error);
    
    // Handle invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid article ID',
        message: 'The provided ID format is invalid'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete article',
      message: error.message 
    });
  }
});

// ============================================
// BONUS: GET STATISTICS
// ============================================
router.get('/stats/summary', async (req, res) => {
  try {
    const [totalArticles, originalCount, updatedCount, totalReferences] = await Promise.all([
      Article.countDocuments({ isActive: true }),
      Article.countDocuments({ type: 'original', isActive: true }),
      Article.countDocuments({ type: 'updated', isActive: true }),
      Article.aggregate([
        { $match: { isActive: true } },
        { $project: { refCount: { $size: { $ifNull: ['$references', []] } } } },
        { $group: { _id: null, total: { $sum: '$refCount' } } }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalArticles,
        original: originalCount,
        updated: updatedCount,
        references: totalReferences[0]?.total || 0,
        conversionRate: totalArticles > 0 
          ? `${((updatedCount / totalArticles) * 100).toFixed(1)}%`
          : '0%'
      }
    });
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

module.exports = router;