// scripts/rewriteArticles.js - AI-Powered Article Rewriting
require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api';
const SERPER_API_KEY = process.env.SERPER_API_KEY;

async function fetchOriginalArticles() {
  try {
    const { data } = await axios.get(`${API_BASE}/articles?type=original`);
    return data.data;
  } catch (error) {
    console.error('Error fetching articles:', error.message);
    return [];
  }
}

async function searchGoogleForArticle(title) {
  try {
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
    
    // Filter out BeyondChats domain and get top 2
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
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert content writer who creates engaging, SEO-optimized articles.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });
    
    let rewrittenContent = completion.choices[0].message.content.trim();
    
    // Add references section
    rewrittenContent += '\n\n## References\n\n';
    rewrittenContent += 'This article was informed by the following sources:\n';
    referenceUrls.forEach((url, i) => {
      rewrittenContent += `${i + 1}. ${url}\n`;
    });
    
    return rewrittenContent;
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    throw error;
  }
}

async function publishUpdatedArticle(originalId, updatedContent, references) {
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
}

async function processArticle(article) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 Processing: ${article.title}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    // Step 1: Search Google
    console.log('🔍 Searching Google for reference articles...');
    const referenceUrls = await searchGoogleForArticle(article.title);
    console.log(`✅ Found ${referenceUrls.length} reference URLs`);
    
    if (referenceUrls.length === 0) {
      console.log('⚠️  No references found, skipping...');
      return null;
    }
    
    // Step 2: Scrape references
    console.log('📄 Scraping reference content...');
    const referenceContents = await Promise.all(
      referenceUrls.map(url => scrapeReferenceContent(url))
    );
    const validReferences = referenceContents.filter(c => c.length > 100);
    console.log(`✅ Scraped ${validReferences.length} valid references`);
    
    // Step 3: Rewrite with AI
    console.log('🤖 Rewriting article with AI...');
    const rewrittenContent = await rewriteArticleWithAI(
      article,
      validReferences,
      referenceUrls
    );
    console.log('✅ Article rewritten successfully');
    
    // Step 4: Publish
    console.log('📤 Publishing updated article...');
    const published = await publishUpdatedArticle(
      article._id,
      {
        title: article.title,
        content: rewrittenContent,
        sourceUrl: article.sourceUrl
      },
      referenceUrls
    );
    console.log(`✅ Published: ${published.title}`);
    
    return published;
  } catch (error) {
    console.error(`❌ Error processing article: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting AI Article Rewriting Pipeline\n');
  
  // Fetch original articles
  const articles = await fetchOriginalArticles();
  console.log(`📚 Found ${articles.length} original articles\n`);
  
  if (articles.length === 0) {
    console.log('No articles to process. Run scraping first!');
    return;
  }
  
  const results = [];
  
  for (const article of articles) {
    const result = await processArticle(article);
    if (result) results.push(result);
    
    // Delay between articles to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Pipeline Complete!`);
  console.log(`📊 Processed: ${results.length}/${articles.length} articles`);
  console.log(`${'='.repeat(60)}`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { processArticle, main };