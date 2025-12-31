const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Article title is required'],
    trim: true,
    maxlength: [500, 'Title cannot exceed 500 characters']
  },
  content: {
    type: String,
    required: [true, 'Article content is required'],
    minlength: [50, 'Content must be at least 50 characters']
  },
  sourceUrl: {
    type: String,
    required: [true, 'Source URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Please provide a valid URL starting with http:// or https://'
    }
  },
  references: [{
    type: String,
    trim: true
  }],
  type: {
    type: String,
    enum: {
      values: ['original', 'updated'],
      message: 'Type must be either original or updated'
    },
    default: 'original',
    required: true
  },
  publishedDate: {
    type: Date,
    default: null
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  },
  wordCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
articleSchema.index({ type: 1, createdAt: -1 });
articleSchema.index({ sourceUrl: 1 });
articleSchema.index({ title: 'text', content: 'text' });
articleSchema.index({ isActive: 1 });

// Virtual field to calculate reading time
articleSchema.virtual('readingTime').get(function() {
  if (!this.content) return 0;
  const words = this.content.split(/\s+/).length;
  return Math.ceil(words / 200);
});

// Pre-save middleware to calculate word count (async version)
articleSchema.pre('save', async function() {
  if (this.content) {
    this.wordCount = this.content.split(/\s+/).filter(word => word.length > 0).length;
  }
});

// Static method to find articles by type
articleSchema.statics.findByType = function(type) {
  return this.find({ type, isActive: true }).sort({ createdAt: -1 });
};

// Static method to search articles
articleSchema.statics.searchArticles = function(query) {
  return this.find(
    { $text: { $search: query }, isActive: true },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
};

// Instance method to get article summary
articleSchema.methods.getSummary = function(maxLength = 200) {
  if (this.content.length <= maxLength) {
    return this.content;
  }
  return this.content.substring(0, maxLength).trim() + '...';
};

// Instance method to mark as inactive
articleSchema.methods.softDelete = function() {
  this.isActive = false;
  return this.save();
};

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;