const axios = require('axios');
const cheerio = require('cheerio');
const Article = require('../models/Article');

const BASE_URL = 'https://beyondchats.com/blogs';
const REQUEST_TIMEOUT = 15000; // 15 seconds
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds

// User agent to mimic a real browser
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Get the last page number from the blog listing
 */
async function getLastPageNumber() {
  try {
    console.log(' Finding last page number...');
    const { data } = await axios.get(BASE_URL, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: REQUEST_TIMEOUT
    });
    
    const $ = cheerio.load(data);
    
    // Try multiple selectors for pagination
    const selectors = [
      'a.page-link',
      '.pagination a',
      '[class*="page"] a',
      'nav a[href*="page"]'
    ];
    
    let pageNumbers = [];
    
    for (const selector of selectors) {
      const links = $(selector);
      if (links.length > 0) {
        pageNumbers = links.map((i, el) => {
          const text = $(el).text().trim();
          const href = $(el).attr('href');
          
          // Extract from text
          const textNum = parseInt(text);
          if (!isNaN(textNum)) return textNum;
          
          // Extract from href
          if (href) {
            const match = href.match(/page[=\/](\d+)/i);
            if (match) return parseInt(match[1]);
          }
          
          return null;
        }).get().filter(n => n !== null);
        
        if (pageNumbers.length > 0) break;
      }
    }
    
    const lastPage = pageNumbers.length > 0 ? Math.max(...pageNumbers) : 1;
    console.log(` Last page number: ${lastPage}`);
    
    return lastPage;
  } catch (error) {
    console.error('Error finding last page:', error.message);
    return 1; // Default to page 1 if error
  }
}

/**
 * Scrape article links from a specific page
 */
async function scrapeArticlesFromPage(pageUrl) {
  try {
    console.log(` Scraping: ${pageUrl}`);
    
    const { data } = await axios.get(pageUrl, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: REQUEST_TIMEOUT
    });
    
    const $ = cheerio.load(data);
    const articles = [];
    
    // Try multiple selectors for article cards
    const selectors = [
      '.blog-card',
      'article',
      '.post-item',
      '[class*="article"]',
      '[class*="post-card"]',
      '.card'
    ];
    
    let foundArticles = false;
    
    for (const selector of selectors) {
      const elements = $(selector);
      
      if (elements.length > 0) {
        console.log(` Found ${elements.length} articles using selector: ${selector}`);
        
        elements.each((i, elem) => {
          // Try to extract title
          const titleSelectors = ['h2', 'h3', '.title', '[class*="title"]', 'a'];
          let title = '';
          
          for (const titleSel of titleSelectors) {
            const titleEl = $(elem).find(titleSel).first();
            if (titleEl.length > 0) {
              title = titleEl.text().trim();
              if (title) break;
            }
          }
          
          // Try to extract URL
          const linkSelectors = ['a', '[href]'];
          let url = '';
          
          for (const linkSel of linkSelectors) {
            const linkEl = $(elem).find(linkSel).first();
            if (linkEl.length > 0) {
              url = linkEl.attr('href');
              if (url) break;
            }
          }
          
          // If no link in children, check element itself
          if (!url) {
            url = $(elem).attr('href');
          }
          
          // Try to extract date
          const dateSelectors = ['.date', 'time', '.published', '[class*="date"]', '[datetime]'];
          let date = null;
          
          for (const dateSel of dateSelectors) {
            const dateEl = $(elem).find(dateSel).first();
            if (dateEl.length > 0) {
              date = dateEl.attr('datetime') || dateEl.text().trim();
              if (date) break;
            }
          }
          
          // Validate and add article
          if (title && url) {
            // Make URL absolute if relative
            const fullUrl = url.startsWith('http') 
              ? url 
              : url.startsWith('/') 
                ? `https://beyondchats.com${url}`
                : `${BASE_URL}/${url}`;
            
            articles.push({
              title: title,
              url: fullUrl,
              date: date || null
            });
          }
        });
        
        if (articles.length > 0) {
          foundArticles = true;
          break;
        }
      }
    }
    
    if (!foundArticles) {
      console.log('  No articles found with standard selectors. Trying fallback...');
      
      // Fallback: Find all links and filter by URL pattern
      $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().trim();
        
        if (href && text && text.length > 10 && 
            (href.includes('/blog') || href.includes('/article') || href.includes('/post'))) {
          const fullUrl = href.startsWith('http') 
            ? href 
            : href.startsWith('/') 
              ? `https://beyondchats.com${href}`
              : `${BASE_URL}/${href}`;
          
          articles.push({
            title: text,
            url: fullUrl,
            date: null
          });
        }
      });
    }
    
    console.log(` Found ${articles.length} article links`);
    return articles;
  } catch (error) {
    console.error('Error scraping page:', error.message);
    return [];
  }
}

/**
 * Scrape the full content of an article
 */
async function scrapeArticleContent(url) {
  try {
    console.log(` Scraping content from: ${url}`);
    
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: REQUEST_TIMEOUT
    });
    
    const $ = cheerio.load(data);
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, .ads, .advertisement, .comments, .sidebar, .menu, .navigation').remove();
    
    // Try multiple selectors for main content
    const contentSelectors = [
      '.article-content',
      '.post-content',
      'article',
      'main',
      '.content',
      '[class*="article"]',
      '[class*="post"]',
      '[class*="content"]'
    ];
    
    let content = '';
    
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        content = element.text().trim();
        if (content.length > 200) { // Minimum viable content length
          break;
        }
      }
    }
    
    // If still no content, try body
    if (!content || content.length < 200) {
      content = $('body').text().trim();
    }
    
    // Clean up content
    content = content
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/\n+/g, '\n') // Multiple newlines to single
      .trim()
      .substring(0, 50000); // Limit to 50k characters
    
    if (!content || content.length < 100) {
      console.log('  Content extraction yielded minimal text');
      return 'Content could not be properly extracted from the source.';
    }
    
    console.log(` Extracted ${content.length} characters`);
    return content;
  } catch (error) {
    console.error(`Error scraping content from ${url}:`, error.message);
    return 'Content unavailable due to scraping error.';
  }
}

/**
 * Main function to scrape the 5 oldest articles
 */
async function scrapeOldestArticles() {
  try {
    console.log(' Starting scraping process for oldest articles...');
    
    // Find the last page
    const lastPage = await getLastPageNumber();
    const lastPageUrl = lastPage > 1 ? `${BASE_URL}?page=${lastPage}` : BASE_URL;
    
    console.log(` Scraping last page: ${lastPageUrl}`);
    
    // Get article links from the last page
    const articleLinks = await scrapeArticlesFromPage(lastPageUrl);
    
    if (articleLinks.length === 0) {
      console.log(' No articles found on the last page');
      return [];
    }
    
    console.log(` Found ${articleLinks.length} article links`);
    
    // Take only the first 5 (assuming they're the oldest)
    const oldestFive = articleLinks.slice(0, 5);
    const scrapedArticles = [];
    
    for (const [index, link] of oldestFive.entries()) {
      console.log(`\n [${index + 1}/5] Processing: ${link.title}`);
      
      // Check if article already exists
      const existingArticle = await Article.findOne({ sourceUrl: link.url });
      
      if (existingArticle) {
        console.log(`  Article already exists in database`);
        scrapedArticles.push(existingArticle);
        continue;
      }
      
      // Scrape the full content
      const content = await scrapeArticleContent(link.url);
      
      // Create and save article
      const article = new Article({
        title: link.title,
        content,
        sourceUrl: link.url,
        type: 'original',
        publishedDate: link.date ? new Date(link.date) : null
      });
      
      await article.save();
      scrapedArticles.push(article);
      
      console.log(` Saved article: ${link.title}`);
      console.log(`   Word count: ${article.wordCount}`);
      console.log(`   Reading time: ${article.readingTime} min`);
      
      // Respectful delay between requests
      if (index < oldestFive.length - 1) {
        console.log(` Waiting ${DELAY_BETWEEN_REQUESTS}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }
    }
    
    console.log(`\n Scraping complete! Processed ${scrapedArticles.length} articles`);
    return scrapedArticles;
  } catch (error) {
    console.error(' Scraping failed:', error);
    throw error;
  }
}

/**
 * Scrape articles from a specific page number
 */
async function scrapeArticlesByPage(pageNumber) {
  try {
    const pageUrl = pageNumber > 1 ? `${BASE_URL}?page=${pageNumber}` : BASE_URL;
    const articleLinks = await scrapeArticlesFromPage(pageUrl);
    
    if (articleLinks.length === 0) {
      return [];
    }
    
    const scrapedArticles = [];
    
    for (const [index, link] of articleLinks.entries()) {
      console.log(`\n [${index + 1}/${articleLinks.length}] Processing: ${link.title}`);
      
      // Check if exists
      const existingArticle = await Article.findOne({ sourceUrl: link.url });
      if (existingArticle) {
        console.log(`  Already exists`);
        scrapedArticles.push(existingArticle);
        continue;
      }
      
      // Scrape content
      const content = await scrapeArticleContent(link.url);
      
      // Save article
      const article = new Article({
        title: link.title,
        content,
        sourceUrl: link.url,
        type: 'original',
        publishedDate: link.date ? new Date(link.date) : null
      });
      
      await article.save();
      scrapedArticles.push(article);
      
      console.log(` Saved: ${link.title}`);
      
      // Delay
      if (index < articleLinks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }
    }
    
    return scrapedArticles;
  } catch (error) {
    console.error('Error scraping page:', error);
    throw error;
  }
}

/**
 * Test scraping without saving to database
 */
async function testScraping() {
  try {
    console.log(' Testing scraping functionality...');
    
    const lastPage = await getLastPageNumber();
    const testPageUrl = `${BASE_URL}?page=${lastPage}`;
    
    const articleLinks = await scrapeArticlesFromPage(testPageUrl);
    
    if (articleLinks.length > 0) {
      const testArticle = articleLinks[0];
      console.log(' Testing content extraction on first article...');
      const content = await scrapeArticleContent(testArticle.url);
      
      return {
        lastPage,
        articlesFound: articleLinks.length,
        sampleArticle: {
          title: testArticle.title,
          url: testArticle.url,
          contentLength: content.length,
          contentPreview: content.substring(0, 200) + '...'
        }
      };
    }
    
    return {
      lastPage,
      articlesFound: 0,
      message: 'No articles found for testing'
    };
  } catch (error) {
    console.error('Test scraping failed:', error);
    throw error;
  }
}

module.exports = {
  scrapeOldestArticles,
  scrapeArticlesByPage,
  testScraping,
  scrapeArticleContent
};