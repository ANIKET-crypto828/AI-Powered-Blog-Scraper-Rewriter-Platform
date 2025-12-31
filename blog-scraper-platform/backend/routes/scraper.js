const express = require('express');
const router = express.Router();
const { 
  scrapeOldestArticles, 
  scrapeArticlesByPage,
  testScraping 
} = require('../services/scraperService');
const Article = require('../models/Article');

// ============================================
// SCRAPE OLDEST ARTICLES (Main Route)
// ============================================
router.post('/scrape-oldest', async (req, res) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log(' SCRAPING OLDEST ARTICLES');
    console.log('='.repeat(60));
    
    const articles = await scrapeOldestArticles();
    
    if (!articles || articles.length === 0) {
      console.log(' No articles were scraped');
      return res.status(404).json({
        success: false,
        message: 'No articles found. The website structure may have changed.',
        data: []
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(` SCRAPING COMPLETE - ${articles.length} articles processed`);
    console.log('='.repeat(60) + '\n');
    
    res.json({
      success: true,
      message: `Successfully scraped ${articles.length} articles`,
      data: articles,
      meta: {
        count: articles.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('\n SCRAPING FAILED:', error.message);
    res.status(500).json({
      success: false,
      error: 'Scraping failed',
      message: error.message
    });
  }
});

// ============================================
// SCRAPE SPECIFIC PAGE
// ============================================
router.post('/scrape-page', async (req, res) => {
  try {
    const { pageNumber } = req.body;
    
    // Validate page number
    if (!pageNumber || pageNumber < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page number',
        message: 'Please provide a valid page number (must be >= 1)'
      });
    }
    
    console.log(`\n Scraping page ${pageNumber}...`);
    
    const articles = await scrapeArticlesByPage(pageNumber);
    
    if (!articles || articles.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No articles found on page ${pageNumber}`,
        data: []
      });
    }
    
    console.log(` Page ${pageNumber} complete - ${articles.length} articles\n`);
    
    res.json({
      success: true,
      message: `Successfully scraped ${articles.length} articles from page ${pageNumber}`,
      data: articles,
      meta: {
        count: articles.length,
        pageNumber,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(' Page scraping error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Page scraping failed',
      message: error.message
    });
  }
});

// ============================================
// TEST SCRAPING (Without Saving)
// ============================================
router.get('/test', async (req, res) => {
  try {
    console.log('\n Testing scraping functionality...\n');
    
    const result = await testScraping();
    
    console.log(' Test complete\n');
    
    res.json({
      success: true,
      message: 'Scraping test completed successfully',
      data: result
    });
  } catch (error) {
    console.error(' Test failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Test scraping failed',
      message: error.message
    });
  }
});

// ============================================
// GET SCRAPING STATUS & STATISTICS
// ============================================
router.get('/status', async (req, res) => {
  try {
    const [
      totalArticles, 
      recentArticles, 
      oldestArticle, 
      newestArticle
    ] = await Promise.all([
      Article.countDocuments({ type: 'original', isActive: true }),
      Article.find({ type: 'original', isActive: true })
        .sort({ scrapedAt: -1 })
        .limit(5)
        .select('title sourceUrl scrapedAt'),
      Article.findOne({ type: 'original', isActive: true })
        .sort({ scrapedAt: 1 })
        .select('title scrapedAt'),
      Article.findOne({ type: 'original', isActive: true })
        .sort({ scrapedAt: -1 })
        .select('title scrapedAt')
    ]);
    
    res.json({
      success: true,
      data: {
        totalScraped: totalArticles,
        lastScraped: newestArticle ? {
          title: newestArticle.title,
          date: newestArticle.scrapedAt
        } : null,
        firstScraped: oldestArticle ? {
          title: oldestArticle.title,
          date: oldestArticle.scrapedAt
        } : null,
        recentArticles: recentArticles.map(article => ({
          id: article._id,
          title: article.title,
          url: article.sourceUrl,
          scrapedAt: article.scrapedAt
        }))
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(' Error fetching status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scraping status',
      message: error.message
    });
  }
});

// ============================================
// BATCH SCRAPING (Multiple Pages)
// ============================================
router.post('/scrape-batch', async (req, res) => {
  try {
    const { startPage = 1, endPage = 3 } = req.body;
    
    // Validate page range
    if (startPage < 1 || endPage < startPage) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page range',
        message: 'startPage must be >= 1 and endPage must be >= startPage'
      });
    }
    
    // Limit batch size to prevent abuse
    if (endPage - startPage > 10) {
      return res.status(400).json({
        success: false,
        error: 'Page range too large',
        message: 'Maximum 10 pages can be scraped at once'
      });
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(` BATCH SCRAPING - Pages ${startPage} to ${endPage}`);
    console.log('='.repeat(60) + '\n');
    
    const allArticles = [];
    const errors = [];
    
    // Scrape each page in sequence
    for (let page = startPage; page <= endPage; page++) {
      try {
        console.log(`\n Scraping page ${page}/${endPage}...`);
        const articles = await scrapeArticlesByPage(page);
        allArticles.push(...articles);
        console.log(` Page ${page} complete - ${articles.length} articles`);
        
        // Delay between pages to be respectful
        if (page < endPage) {
          console.log(' Waiting 3 seconds before next page...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.error(` Error on page ${page}:`, error.message);
        errors.push({ 
          page, 
          error: error.message 
        });
      }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(` BATCH COMPLETE - ${allArticles.length} total articles`);
    console.log('='.repeat(60) + '\n');
    
    res.json({
      success: true,
      message: `Batch scraping completed. Scraped ${allArticles.length} articles from ${endPage - startPage + 1} pages`,
      data: allArticles,
      meta: {
        totalArticles: allArticles.length,
        pagesScraped: endPage - startPage + 1,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(' Batch scraping error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Batch scraping failed',
      message: error.message
    });
  }
});

// ============================================
// CLEAR ALL SCRAPED ARTICLES (Dangerous!)
// ============================================
router.delete('/clear-scraped', async (req, res) => {
  try {
    const { confirm } = req.body;
    
    // Require confirmation to prevent accidental deletion
    if (confirm !== 'DELETE_ALL_SCRAPED') {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required',
        message: 'To delete all scraped articles, send: { "confirm": "DELETE_ALL_SCRAPED" }'
      });
    }
    
    const result = await Article.deleteMany({ type: 'original' });
    
    console.log(`  Deleted ${result.deletedCount} scraped articles`);
    
    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} scraped articles`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error(' Error clearing scraped articles:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to clear scraped articles',
      message: error.message
    });
  }
});

// ============================================
// HEALTH CHECK FOR SCRAPER
// ============================================
router.get('/health', async (req, res) => {
  try {
    const scrapedCount = await Article.countDocuments({ 
      type: 'original', 
      isActive: true 
    });
    
    res.json({
      success: true,
      status: 'operational',
      data: {
        scrapedArticles: scrapedCount,
        lastCheck: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;