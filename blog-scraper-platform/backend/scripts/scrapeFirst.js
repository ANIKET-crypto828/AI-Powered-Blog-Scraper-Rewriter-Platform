const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'https://ai-powered-blog-scraper-rewriter-platform.onrender.com/api';

async function scrapeArticles() {
  console.log(' Starting article scraping...\n');
  
  try {
    console.log(`📡 Sending request to: ${API_BASE}/scraper/scrape-oldest`);
    
    const { data } = await axios.post(
      `${API_BASE}/scraper/scrape-oldest`,
      {},
      { timeout: 60000 } // 60 second timeout
    );
    
    console.log('\n Scraping successful!');
    console.log(` Articles scraped: ${data.data?.length || 0}`);
    
    if (data.data && data.data.length > 0) {
      console.log('\n Scraped articles:');
      data.data.forEach((article, idx) => {
        console.log(`   ${idx + 1}. ${article.title}`);
      });
    }
    
    console.log('\n Now you can run: npm run rewrite');
    
  } catch (error) {
    console.error('\n Scraping failed!');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else if (error.request) {
      console.error('Cannot connect to backend!');
      console.error('Make sure your backend is running on:', API_BASE);
      console.error('\nStart it with: npm run dev');
    } else {
      console.error('Error:', error.message);
    }
  }
}

scrapeArticles();