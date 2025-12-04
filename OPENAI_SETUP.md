# OpenAI API Setup Guide

## 🔑 How to Get Your OpenAI API Key

Follow these steps to get your OpenAI API key and set up the Task Assistant:

---

## Step 1: Create OpenAI Account

1. **Visit:** https://platform.openai.com/signup
2. **Sign up** with:
   - Email address, OR
   - Google account, OR
   - Microsoft account
3. **Verify your email** (check your inbox for verification link)
4. **Complete profile** (name, organization if applicable)

---

## Step 2: Add Payment Method

⚠️ **Important:** OpenAI requires a payment method even though you get $5 free credit.

1. Go to: https://platform.openai.com/settings/organization/billing/overview
2. Click **"Add payment method"**
3. Enter your credit card details
4. **Don't worry:** You won't be charged until you use up your $5 free credit

**What you get:**
- $5 free credit for new accounts
- With GPT-4o-mini, that's ~6,000 task extractions!
- Credit expires after 3 months

---

## Step 3: Generate API Key

1. **Navigate to API Keys page:**
   - Visit: https://platform.openai.com/api-keys
   - Or: Dashboard → API Keys (left sidebar)

2. **Create new key:**
   - Click **"+ Create new secret key"**
   - Give it a name like: `Task Assistant`
   - (Optional) Set permissions: "All" is fine for now
   - Click **"Create secret key"**

3. **Copy your API key:**
   - It will look like: `sk-proj-abc123...`
   - ⚠️ **IMPORTANT:** Copy it immediately! You can only see it once.
   - If you lose it, you'll need to create a new one

---

## Step 4: Add API Key to Your Project

1. **Open the file:** `server/.env`

2. **Replace the placeholder** with your actual key:
   ```bash
   # server/.env
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   PORT=3001
   ```

3. **Save the file**

---

## Step 5: Start the Server

1. **Open terminal** in the project directory

2. **Start the backend server:**
   ```bash
   npm run server
   ```

3. **You should see:**
   ```
   🚀 Task Assistant Backend running on http://localhost:3001
   ✅ CORS enabled for http://localhost:3000
   📡 Ready to proxy OpenAI API requests
   ```

4. **In another terminal, start the frontend:**
   ```bash
   npm start
   ```

---

## Step 6: Test Task Extraction

1. **Open the app** in your browser (should auto-open at http://localhost:3000)

2. **Try extracting tasks:**
   - Enter: `"buy milk tomorrow"`
   - Click **"Extract with AI"**

3. **Expected result:**
   - Backend console shows:
     ```
     📤 [SERVER] Forwarding request to OpenAI API...
     ✅ [SERVER] Received response from OpenAI
     ```
   - Frontend shows extracted task with date and folder

---

## 💰 Pricing & Usage

### GPT-4o-mini Costs

| Metric | Price |
|--------|-------|
| **Input** | $0.150 per 1M tokens |
| **Output** | $0.600 per 1M tokens |
| **Per extraction** | ~$0.0008 (less than 1/10th of a cent!) |

### Example Budget

With $5 free credit:
- **~6,000 task extractions**
- If you extract 20 tasks per day = **300 days of free usage!**

### Monitor Your Usage

1. Visit: https://platform.openai.com/usage
2. See your usage dashboard
3. Set up usage limits if desired

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep your API key in the `server/.env` file (already in `.gitignore`)
- Use environment variables (never hardcode keys)
- Regenerate keys if accidentally exposed
- Set usage limits in OpenAI dashboard

### ❌ DON'T:
- Never commit `.env` files to git
- Never share your API key publicly
- Never hardcode API keys in your source code
- Never expose API keys in client-side JavaScript

---

## 🐛 Troubleshooting

### Error: "OpenAI API key not configured"

**Problem:** API key not found or invalid

**Solutions:**
1. Check `server/.env` file exists in the `server/` directory
2. Verify key is not `your_openai_api_key_here`
3. Make sure key starts with `sk-proj-` or `sk-`
4. Restart the backend server after adding key

---

### Error: "Insufficient quota"

**Problem:** You've used up your $5 free credit

**Solutions:**
1. Check usage at: https://platform.openai.com/usage
2. Add more credits in billing settings
3. Consider using a cheaper model (though GPT-4o-mini is already cheapest!)

---

### Error: "Invalid API key"

**Problem:** API key is malformed or revoked

**Solutions:**
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Replace the old key in `server/.env`
4. Restart backend server

---

### Error: "Rate limit exceeded"

**Problem:** Too many requests in short time

**Solutions:**
1. Wait a few seconds between requests
2. Check your rate limits at: https://platform.openai.com/account/rate-limits
3. Upgrade to paid tier for higher limits (after free credit)

---

## 📊 API Key Dashboard

Monitor your API key usage:

1. **Usage page:** https://platform.openai.com/usage
   - See costs per day/month
   - View request counts
   - Track token usage

2. **API keys page:** https://platform.openai.com/api-keys
   - View all your keys
   - Revoke compromised keys
   - Create new keys

3. **Billing page:** https://platform.openai.com/settings/organization/billing/overview
   - Check remaining credit
   - Add payment methods
   - Set usage limits

---

## 🎯 Next Steps After Setup

Once your API key is working:

1. **Test with complex inputs:**
   - `"I need to write I need to send an email to Johannes in 10 minutes and call a friend"`
   - `"buy milk, eggs, and bread this weekend"`
   - `"meeting at 2pm then email the team"`

2. **Verify smart features:**
   - Multiple task extraction
   - Date/time parsing
   - Folder categorization (Work/Personal/Shopping)

3. **Customize settings:**
   - Adjust default timing in app settings
   - Enable/disable notifications
   - Change folder names

---

## 🆘 Need Help?

**OpenAI Resources:**
- Documentation: https://platform.openai.com/docs
- API Reference: https://platform.openai.com/docs/api-reference
- Community Forum: https://community.openai.com/
- Status Page: https://status.openai.com/

**Project Issues:**
- Check backend console for detailed errors
- Check frontend browser console
- Review error messages (now much more helpful!)

---

## ✅ Setup Complete!

You're all set! Your Task Assistant is now powered by OpenAI's GPT-4o-mini, which provides:

- **Excellent accuracy** for task extraction
- **Very low cost** (~$0.0008 per request)
- **Fast response times** (1-2 seconds)
- **Reliable API** with great uptime
- **6,000+ free extractions** with $5 credit

Happy task managing! 🎉
