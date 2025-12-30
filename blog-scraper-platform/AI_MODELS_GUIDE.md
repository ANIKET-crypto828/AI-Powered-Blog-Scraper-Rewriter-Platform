# 🤖 AI Models Setup Guide

This guide explains how to replace OpenAI GPT-4 with open-source alternatives: **Mixtral 8x7B** or **Llama 3**.

---

## 📋 Available Options

### Option 1: Groq (Recommended) ⚡
- **Best for:** Llama 3 models with ultra-fast inference
- **Free tier:** Yes (limited)
- **Speed:** Fastest (500+ tokens/sec)
- **Models:** Llama 3 70B, Llama 3 8B, Mixtral 8x7B

### Option 2: Together AI 🔧
- **Best for:** Mixtral 8x7B and variety of models
- **Free tier:** Yes (limited)
- **Speed:** Fast
- **Models:** Mixtral 8x7B, Llama 3 70B, Llama 3 8B

### Option 3: OpenAI (Original) 💰
- **Best for:** Highest quality, if budget allows
- **Free tier:** No
- **Speed:** Medium
- **Models:** GPT-4o, GPT-4o-mini

---

## 🚀 Quick Start

### Step 1: Choose Your Provider

**For Llama 3 70B (Best Quality, Free):**
```bash
AI_PROVIDER=groq
AI_MODEL=llama3-70b
GROQ_API_KEY=your_key_here
```

**For Mixtral 8x7B (Long Context):**
```bash
AI_PROVIDER=groq
AI_MODEL=mixtral-8x7b
GROQ_API_KEY=your_key_here
```

**For Fast Processing:**
```bash
AI_PROVIDER=groq
AI_MODEL=llama3-8b
GROQ_API_KEY=your_key_here
```

### Step 2: Get API Keys

#### Groq (Llama 3 & Mixtral)
1. Go to https://console.groq.com/
2. Sign up with Google/GitHub
3. Navigate to "API Keys"
4. Create new API key
5. Copy key (starts with `gsk_`)

#### Together AI (Mixtral & Llama 3)
1. Go to https://api.together.xyz/
2. Sign up
3. Go to "API Keys" section
4. Create new API key
5. Copy key

### Step 3: Update `.env` File

```bash
# Choose your provider
AI_PROVIDER=groq
AI_MODEL=llama3-70b

# Add your API key
GROQ_API_KEY=gsk_your_actual_key_here

# Keep existing variables
MONGO_URI=your_mongodb_uri
SERPER_API_KEY=your_serper_key
```

### Step 4: Run the Script

```bash
cd backend
npm run scrape
```

---

## 📊 Model Comparison

| Model | Provider | Quality | Speed | Context | Cost |
|-------|----------|---------|-------|---------|------|
| **Llama 3 70B** | Groq | ⭐⭐⭐⭐⭐ | ⚡⚡⚡⚡⚡ | 8k | Free/Low |
| **Llama 3 8B** | Groq | ⭐⭐⭐⭐ | ⚡⚡⚡⚡⚡ | 8k | Free/Low |
| **Mixtral 8x7B** | Groq/Together | ⭐⭐⭐⭐ | ⚡⚡⚡⚡ | 32k | Free/Low |
| **GPT-4o-mini** | OpenAI | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | 128k | Medium |
| **GPT-4o** | OpenAI | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | 128k | High |

---

## 💡 Detailed Provider Setup

### Groq Setup (Recommended)

**Advantages:**
- ✅ Free tier available
- ✅ Extremely fast inference (500+ tokens/sec)
- ✅ Easy API (OpenAI-compatible)
- ✅ Latest Llama 3 models

**Steps:**
1. Visit https://console.groq.com/
2. Click "Sign Up" → Use Google/GitHub
3. Navigate to "API Keys" in sidebar
4. Click "Create API Key"
5. Name it (e.g., "blog-rewriter")
6. Copy the key (starts with `gsk_`)

**Configuration:**
```bash
AI_PROVIDER=groq
AI_MODEL=llama3-70b
GROQ_API_KEY=gsk_your_key_here
```

**Rate Limits:**
- Free tier: 30 requests/minute
- Paid tier: Higher limits

---

### Together AI Setup

**Advantages:**
- ✅ Free credits on signup
- ✅ Wide model selection
- ✅ Good for Mixtral
- ✅ Flexible pricing

**Steps:**
1. Visit https://api.together.xyz/
2. Sign up with email
3. Verify email
4. Go to "Settings" → "API Keys"
5. Click "Create new API key"
6. Copy the key

**Configuration:**
```bash
AI_PROVIDER=together
AI_MODEL=mixtral-8x7b
TOGETHER_API_KEY=your_key_here
```

**Rate Limits:**
- Free tier: $25 credit
- Pay-as-you-go after credits

---

### OpenAI Setup (If Needed)

**Advantages:**
- ✅ Highest quality output
- ✅ Large context window
- ✅ Most reliable

**Disadvantages:**
- ❌ Not free
- ❌ More expensive

**Steps:**
1. Visit https://platform.openai.com/
2. Sign up or log in
3. Add payment method
4. Go to "API Keys"
5. Create new secret key
6. Copy key (starts with `sk-proj-` or `sk-`)

**Configuration:**
```bash
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-proj-your_key_here
```

---

## 🎯 Model Selection Guide

### Choose Llama 3 70B if:
- ✅ You want highest quality open-source
- ✅ You need free/low-cost solution
- ✅ Speed is important
- ✅ 8k context is sufficient

### Choose Llama 3 8B if:
- ✅ You want fastest processing
- ✅ Cost is primary concern
- ✅ Quality can be slightly lower
- ✅ Processing many articles

### Choose Mixtral 8x7B if:
- ✅ You need longer context (32k)
- ✅ You want good quality/speed balance
- ✅ Articles are very long
- ✅ Multiple references to process

### Choose GPT-4o-mini if:
- ✅ Budget allows (~$0.75/article)
- ✅ You want highest quality
- ✅ Context window matters
- ✅ Reliability is critical

---

## 💰 Cost Estimates

### Per Article Rewriting (Approximate)

**Groq (Llama 3 70B):**
- Input: ~5,000 tokens
- Output: ~2,500 tokens
- **Cost: FREE** (within limits) or ~$0.005/article

**Together (Mixtral 8x7B):**
- Input: ~5,000 tokens
- Output: ~2,500 tokens
- **Cost: ~$0.005/article**

**OpenAI (GPT-4o-mini):**
- Input: ~5,000 tokens @ $0.15/M
- Output: ~2,500 tokens @ $0.60/M
- **Cost: ~$0.0023/article**

**OpenAI (GPT-4o):**
- Input: ~5,000 tokens @ $5/M
- Output: ~2,500 tokens @ $15/M
- **Cost: ~$0.06/article**

### For 5 Articles:
- Groq: **FREE** or $0.025
- Together: **$0.025**
- OpenAI Mini: **$0.012**
- OpenAI: **$0.30**

---

## 🔧 Switching Between Models

You can easily switch models by changing `.env`:

```bash
# Switch to Llama 3 70B
AI_PROVIDER=groq
AI_MODEL=llama3-70b
GROQ_API_KEY=gsk_xxx

# Switch to Mixtral
AI_PROVIDER=groq
AI_MODEL=mixtral-8x7b
GROQ_API_KEY=gsk_xxx

# Switch back to OpenAI
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-xxx
```

No code changes needed!

---

## 🐛 Troubleshooting

### Error: "API key not found"
**Solution:** Check your `.env` file has the correct key for your provider.

```bash
# For Groq
GROQ_API_KEY=gsk_your_key_here

# For Together
TOGETHER_API_KEY=your_key_here

# For OpenAI
OPENAI_API_KEY=sk-proj-your_key_here
```

### Error: "Rate limit exceeded"
**Solution:** 
- Wait a few seconds between articles
- Increase delay in script: `setTimeout(resolve, 10000)` (10s)
- Upgrade to paid tier

### Error: "Invalid model name"
**Solution:** Check model name matches provider:

**Groq models:**
- `llama3-70b` or `llama3-70b-8192`
- `llama3-8b` or `llama3-8b-8192`
- `mixtral-8x7b` or `mixtral-8x7b-32768`

**Together models:**
- `mixtral-8x7b` (uses full name internally)
- `llama3-70b` (uses full name internally)

### Poor Quality Output
**Solution:**
- Try Llama 3 70B instead of 8B
- Increase `max_tokens` to 3000+
- Adjust `temperature` (0.5-0.9)
- Check reference quality

---

## 📈 Performance Tips

### 1. Optimize Prompt
- Keep original content under 3000 chars
- Limit references to 2 sources
- Be specific in instructions

### 2. Batch Processing
- Process articles in batches
- Use appropriate delays (3-5s)
- Monitor rate limits

### 3. Quality Control
- Review first few outputs
- Adjust temperature if needed
- Test different models

### 4. Cost Optimization
- Use Llama 3 8B for simpler rewrites
- Reserve Llama 3 70B for complex content
- Batch similar articles

---

## ✅ Verification Checklist

Before running the script, verify:

- [ ] `.env` file has `AI_PROVIDER` set
- [ ] `.env` file has `AI_MODEL` set
- [ ] Correct API key is set for chosen provider
- [ ] API key is valid (test with curl)
- [ ] `SERPER_API_KEY` is set for Google search
- [ ] `MONGO_URI` is configured
- [ ] Backend server is running
- [ ] Original articles exist in database

---

## 🎉 Quick Test

Test your configuration:

```bash
# 1. Check environment variables
echo $AI_PROVIDER
echo $AI_MODEL

# 2. Test API connection (Groq example)
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"

# 3. Run the script
npm run scrape
```

---

## 📚 Additional Resources

- **Groq Documentation:** https://console.groq.com/docs
- **Together AI Docs:** https://docs.together.ai/
- **Llama 3 Model Card:** https://huggingface.co/meta-llama/Meta-Llama-3-70B-Instruct
- **Mixtral Model Card:** https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1

---

## 🤝 Support

**Having issues?**
1. Check error messages carefully
2. Verify API keys are correct
3. Test with smaller batches first
4. Check rate limits
5. Review logs for details

**Need help?**
- Open an issue on GitHub
- Check provider documentation
- Review example configurations above

---

**Recommendation:** Start with **Groq + Llama 3 70B** for the best balance of quality, speed, and cost! 🚀