require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

const API_BASE = process.env.API_BASE_URL || 'https://ai-powered-blog-scraper-rewriter-platform.onrender.com/api';
const SERPER_API_KEY = process.env.SERPER_API_KEY;

// Configure which AI model to use
const AI_PROVIDER = process.env.AI_PROVIDER || 'groq';
const AI_MODEL = process.env.AI_MODEL || 'llama-3.1-70b-versatile';

// API Configuration with UPDATED models
const API_CONFIGS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    key: process.env.OPENAI_API_KEY,
    models: {
      'gpt-4o': 'gpt-4o',
      'gpt-4o-mini': 'gpt-4o-mini',
      'gpt-4-turbo': 'gpt-4-turbo-preview',
      'gpt-3.5-turbo': 'gpt-3.5-turbo'
    }
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    models: {
      // Updated Groq models (as of 2024)
      'llama-3.1-70b': 'llama-3.1-70b-versatile',
      'llama-3.1-8b': 'llama-3.1-8b-instant',
      'llama-3.2-90b': 'llama-3.2-90b-text-preview',
      'mixtral-8x7b': 'mixtral-8x7b-32768',
      'gemma-7b': 'gemma-7b-it'
    }
  },
  together: {
    url: 'https://api.together.xyz/v1/chat/completions',
    key: process.env.TOGETHER_API_KEY,
    models: {
      'mixtral-8x7b': 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'llama-3.1-70b': 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      'llama-3.1-8b': 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'
    }
  }
};

async function fetchOriginalArticles() {
  try {
    console.log(`\n🔍 Fetching articles from: ${API_BASE}/articles?type=original`);
    
    const { data } = await axios.get(`${API_BASE}/articles?type=original`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(` API Response received`);
    console.log(` Total articles: ${data.data?.length || 0}`);
    
    if (data.success && data.data) {
      return data.data;
    }
    
    console.warn(' API returned success but no data array');
    return [];
  } catch (error) {
    console.error('\n Error fetching articles:');
    console.error('Error Type:', error.constructor.name);
    console.error('Message:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Is your backend running on', API_BASE, '?');
    } else {
      console.error('Request setup error:', error.message);
    }
    
    return [];
  }
}

async function searchGoogleForArticle(title) {
  try {
    if (!SERPER_API_KEY) {
      console.warn(' SERPER_API_KEY not set, skipping Google search');
      return [];
    }
    
    const { data } = await axios.post(
      'https://google.serper.dev/search',
      {
        q: title,
        num: 10
      },
      {
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const results = (data.organic || [])
      .filter(r => !r.link.includes('beyondchats.com'))
      .slice(0, 2)
      .map(r => r.link);
    
    return results;
  } catch (error) {
    console.error('Google search error:', error.message);
    return [];
  }
}

async function scrapeReferenceContent(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(data);
    $('script, style, nav, footer, .ads').remove();
    
    const content = $('article, .post-content, .article-content, main, .content')
      .first()
      .text()
      .trim()
      .replace(/\s+/g, ' ')
      .substring(0, 5000);
    
    return content || '';
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return '';
  }
}

async function rewriteWithRetry(original, references, referenceUrls, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await rewriteArticleWithAI(original, references, referenceUrls);
    } catch (error) {
      // Check if it's a rate limit error
      if (error.response?.status === 429) {
        const waitTime = error.response?.data?.error?.message?.match(/(\d+\.?\d*)\s*s/)?.[1];
        const delay = waitTime ? parseFloat(waitTime) * 1000 + 1000 : 10000; // Add 1s buffer
        
        console.log(` Rate limit hit. Waiting ${(delay/1000).toFixed(1)}s before retry ${attempt}/${maxRetries}...`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // If not rate limit or max retries reached, throw error
      throw error;
    }
  }
}

async function rewriteArticleWithAI(original, references, referenceUrls) {
  const prompt = `You are an expert content writer. Rewrite the following article to improve its structure, readability, and SEO quality.

ORIGINAL ARTICLE:
${original.content.substring(0, 3000)}

REFERENCE ARTICLES FOR CONTEXT:
${references.map((ref, i) => `Reference ${i + 1}:\n${ref.substring(0, 2000)}`).join('\n\n')}

INSTRUCTIONS:
- Maintain the core message and facts from the original
- Improve formatting with clear headings and sections
- Enhance readability and flow
- Make it SEO-friendly with natural keyword usage
- DO NOT plagiarize from references
- Keep the tone professional and engaging
- Aim for 800-1200 words

Return ONLY the rewritten article content without any preamble or metadata.`;

  try {
    const config = API_CONFIGS[AI_PROVIDER];
    
    if (!config) {
      throw new Error(`Invalid AI_PROVIDER: ${AI_PROVIDER}. Options: openai, groq, together`);
    }
    
    if (!config.key) {
      throw new Error(`API key not found for ${AI_PROVIDER}. Set ${AI_PROVIDER.toUpperCase()}_API_KEY in .env`);
    }
    
    const modelName = config.models[AI_MODEL] || AI_MODEL;
    
    console.log(`   Using: ${AI_PROVIDER} - ${modelName}`);
    
    const requestBody = {
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are an expert content writer who creates engaging, SEO-optimized articles.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2500,
      temperature: 0.7
    };
    
    if (AI_PROVIDER === 'together') {
      requestBody.top_p = 0.9;
      requestBody.top_k = 50;
      requestBody.repetition_penalty = 1.1;
    } else if (AI_PROVIDER === 'groq') {
      requestBody.top_p = 0.9;
    }
    
    const response = await axios.post(
      config.url,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${config.key}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    let rewrittenContent = response.data.choices[0].message.content.trim();
    
    // Add references section
    rewrittenContent += '\n\n## References\n\n';
    rewrittenContent += 'This article was informed by the following sources:\n';
    referenceUrls.forEach((url, i) => {
      rewrittenContent += `${i + 1}. ${url}\n`;
    });
    
    return rewrittenContent;
  } catch (error) {
    console.error(`${AI_PROVIDER.toUpperCase()} API error:`, error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/*async function publishUpdatedArticle(originalId, updatedContent, references) {
  try {
    const { data } = await axios.post(`${API_BASE}/articles`, {
      title: `[UPDATED] ${updatedContent.title}`,
      content: updatedContent.content,
      sourceUrl: updatedContent.sourceUrl,
      references,
      type: 'updated'
    });
    
    return data.data;
  } catch (error) {
    console.error('Error publishing article:', error.message);
    throw error;
  }
}*/

//Create with a modified sourceUrl to avoid conflict
async function publishUpdatedArticle(originalId, updatedContent, references) {
  try {
    const { data } = await axios.post(`${API_BASE}/articles`, {
      title: updatedContent.title, // Remove [UPDATED] prefix since type handles this
      content: updatedContent.content,
      sourceUrl: `${updatedContent.sourceUrl}#updated`, // Make URL unique
      references,
      type: 'updated'
    });
    
    return data.data;
  } catch (error) {
    console.error('Error publishing article:', error.response?.data || error.message);
    throw error;
  }
}

/*async function processArticle(article) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(` Processing: ${article.title}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    // Step 1: Search Google
    console.log(' Searching Google for reference articles...');
    const referenceUrls = await searchGoogleForArticle(article.title);
    console.log(` Found ${referenceUrls.length} reference URLs`);
    
    if (referenceUrls.length === 0) {
      console.log(' No references found, skipping...');
      return null;
    }
    
    // Step 2: Scrape references
    console.log(' Scraping reference content...');
    const referenceContents = await Promise.all(
      referenceUrls.map(url => scrapeReferenceContent(url))
    );
    const validReferences = referenceContents.filter(c => c.length > 100);
    console.log(` Scraped ${validReferences.length} valid references`);
    
    // Step 3: Rewrite with AI
    console.log(' Rewriting article with AI...');
    const rewrittenContent = await rewriteArticleWithAI(
      article,
      validReferences,
      referenceUrls
    );
    console.log(' Article rewritten successfully');
    
    // Step 4: Publish
    console.log(' Publishing updated article...');
    const published = await publishUpdatedArticle(
      article._id,
      {
        title: article.title,
        content: rewrittenContent,
        sourceUrl: article.sourceUrl
      },
      referenceUrls
    );
    console.log(` Published: ${published.title}`);
    
    return published;
  } catch (error) {
    console.error(` Error processing article: ${error.message}`);
    return null;
  }
}*/

async function processArticle(article) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(` Processing: ${article.title}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    // Step 1: Search Google
    console.log(' Searching Google for reference articles...');
    const referenceUrls = await searchGoogleForArticle(article.title);
    console.log(` Found ${referenceUrls.length} reference URLs`);
    
    if (referenceUrls.length === 0) {
      console.log(' No references found, skipping...');
      return null;
    }
    
    // Step 2: Scrape references
    console.log(' Scraping reference content...');
    const referenceContents = await Promise.all(
      referenceUrls.map(url => scrapeReferenceContent(url))
    );
    const validReferences = referenceContents.filter(c => c.length > 100);
    console.log(` Scraped ${validReferences.length} valid references`);
    
    // Step 3: Rewrite with AI (with retry logic)
    console.log(' Rewriting article with AI...');
    const rewrittenContent = await rewriteWithRetry(
      article,
      validReferences,
      referenceUrls
    );
    console.log(' Article rewritten successfully');
    
    // Step 4: Publish
    console.log(' Publishing updated article...');
    const published = await publishUpdatedArticle(
      article._id,
      {
        title: article.title,
        content: rewrittenContent,
        sourceUrl: article.sourceUrl
      },
      referenceUrls
    );
    console.log(` Published: ${published.title}`);
    
    return published;
  } catch (error) {
    console.error(` Error processing article: ${error.message}`);
    return null;
  }
}


async function checkBackendConnection() {
  try {
    console.log('\n🔌 Checking backend connection...');
    const healthUrl = API_BASE.replace('/api', '/health');
    const { data } = await axios.get(healthUrl, { timeout: 5000 });
    console.log(' Backend is running:', data);
    return true;
  } catch (error) {
    console.error(' Cannot connect to backend!');
    console.error('   Make sure your backend is running on:', API_BASE);
    console.error('   Start it with: npm run dev');
    return false;
  }
}

async function main() {
  console.log(' Starting AI Article Rewriting Pipeline');
  console.log(` Provider: ${AI_PROVIDER.toUpperCase()}`);
  console.log(` Model: ${AI_MODEL}`);
  console.log(` API Base: ${API_BASE}`);
  
  // Check backend connection first
  const backendConnected = await checkBackendConnection();
  if (!backendConnected) {
    console.log('\n Please start your backend server first!');
    console.log('   Run: npm run dev (in the backend directory)');
    return;
  }
  
  // Fetch original articles
  const articles = await fetchOriginalArticles();
  console.log(` Found ${articles.length} original articles\n`);
  
  if (articles.length === 0) {
    console.log('\n No original articles found in database!');
    console.log('\n To fix this, run the scraper first:');
    console.log('   1. POST to https://ai-powered-blog-scraper-rewriter-platform.onrender.com/api/scraper/scrape-oldest');
    console.log('   2. Or use: curl -X POST https://ai-powered-blog-scraper-rewriter-platform.onrender.com/api/scraper/scrape-oldest');
    console.log('\n You can also run scraping from your frontend or API testing tool.');
    return;
  }
  
  const results = [];
  
  for (const article of articles) {
    const result = await processArticle(article);
    if (result) results.push(result);
    
    // Delay between articles
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(` Pipeline Complete!`);
  console.log(` Processed: ${results.length}/${articles.length} articles`);
  console.log(`${'='.repeat(60)}`);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n Fatal Error:', error);
    process.exit(1);
  });
}

module.exports = { processArticle, main };