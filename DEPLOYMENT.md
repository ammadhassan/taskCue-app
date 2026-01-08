# TaskCue - Deployment Guide

## Overview

This guide covers deploying TaskCue with Supabase authentication, Vercel frontend hosting, and Railway backend hosting.

## Architecture

```
User Browser → Vercel (React Frontend) → Railway (Express Backend) → OpenAI API
                    ↓
              Supabase (Auth + PostgreSQL Database)
```

## Prerequisites

Before deploying, you'll need accounts on:
- [GitHub](https://github.com) - Code repository ✅ (Already set up)
- [Supabase](https://supabase.com) - Authentication & Database ✅ (Already configured)
- [Vercel](https://vercel.com) - Frontend hosting (Free)
- [Railway](https://railway.app) - Backend hosting (Free tier available)
- [OpenAI](https://platform.openai.com) - AI API access (Optional, for AI features)

## Environment Variables

### Frontend (.env)
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_BACKEND_URL=your_railway_backend_url
```

### Backend (server/.env)
```
OPENAI_API_KEY=your_openai_api_key
PORT=3001
FRONTEND_URL=your_vercel_frontend_url
```

## Step-by-Step Deployment

### ✅ Step 1: GitHub Repository (Already Done!)

Your code is already on GitHub: `https://github.com/ammadhassan/taskCue-app`

### ✅ Step 2: Supabase Setup (Already Done!)

Your database is already configured and running. You have:
- Database tables created ✅
- RLS policies enabled ✅
- Authentication configured ✅

Get your credentials from Supabase Dashboard → Settings → API:
- **REACT_APP_SUPABASE_URL**: Your project URL
- **REACT_APP_SUPABASE_ANON_KEY**: Your anon/public key

### 🚀 Step 3: Deploy Backend to Railway

1. **Sign Up**: Go to [Railway](https://railway.app) and sign in with GitHub
2. **Create New Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select Repository**: Choose `taskCue-app`
4. **Configure Service**:
   - Railway auto-detects Node.js
   - Root directory: `./server` (IMPORTANT!)
5. **Add Environment Variables**:
   ```
   OPENAI_API_KEY=your_openai_key_here
   PORT=3001
   NODE_ENV=production
   ```
6. **Generate Domain**: Settings → Generate Domain
7. **Copy URL**: Save this URL (e.g., `https://taskcue.up.railway.app`)

**Note**: If you don't have OpenAI key yet, you can skip AI features for now.

### 🚀 Step 4: Deploy Frontend to Vercel

1. **Sign Up**: Go to [Vercel](https://vercel.com) and sign in with GitHub
2. **Import Project**: Click "Add New Project" → Select `taskCue-app`
3. **Configure Build**:
   - **Framework Preset**: Create React App
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. **Add Environment Variables**:
   ```
   REACT_APP_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
   REACT_APP_BACKEND_URL=https://taskcue.up.railway.app
   ```
   Replace with your actual Supabase credentials!
5. **Deploy**: Click "Deploy"
6. **Copy URL**: Save your URL (e.g., `https://taskcue-app.vercel.app`)

### 🔧 Step 5: Configure CORS (Backend)

Go back to Railway dashboard:
1. Add environment variable:
   ```
   FRONTEND_URL=https://taskcue-app.vercel.app
   ```
2. Railway will automatically redeploy

### 🔧 Step 6: Configure Supabase URLs

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://taskcue-app.vercel.app`
3. Add to **Redirect URLs**:
   ```
   https://taskcue-app.vercel.app
   https://taskcue-app.vercel.app/**
   ```
4. Click **Save**

## 🎉 Testing Your Deployment

1. **Open your Vercel URL** (e.g., `https://taskcue-app.vercel.app`)
2. **Sign Up**: Create a new account with your email
3. **Check Email**: Verify your account via email link
4. **Login**: Sign in with your verified account
5. **Create Tasks**: Test creating tasks manually
6. **Test Features**:
   - ✅ Create/edit/delete tasks
   - ✅ Organize tasks into folders
   - ✅ Mark tasks complete
   - ✅ Change settings (theme, notifications)
7. **Share with Friends**: Send them your Vercel URL!

## 🔧 Troubleshooting

### "Failed to fetch" or CORS errors
**Problem**: Frontend can't connect to backend
**Solution**:
- Check `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Verify `REACT_APP_BACKEND_URL` in Vercel matches Railway URL
- Check Railway logs for CORS errors
- Make sure both URLs use HTTPS

### Authentication not working
**Problem**: Can't sign up or login
**Solution**:
- Verify Supabase credentials in Vercel are correct
- Check Site URL in Supabase → Authentication → URL Configuration
- Ensure Redirect URLs include your Vercel URL
- Clear browser cache and cookies
- Check Supabase logs in dashboard

### AI task extraction fails
**Problem**: AI features don't work
**Solution**:
- This is OPTIONAL - app works fine without it
- If you want AI: Add valid `OPENAI_API_KEY` in Railway
- Check Railway logs for OpenAI errors
- Visit `https://your-railway-url.railway.app/health` to verify backend is running

### Tasks not syncing between devices
**Problem**: Changes don't appear on other devices
**Solution**:
- Check browser console for errors
- Verify Supabase connection in Network tab
- Ensure RLS policies are enabled in Supabase
- Try logging out and back in
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Deployment failed on Vercel/Railway
**Problem**: Build errors during deployment
**Solution**:
- Check build logs in Vercel/Railway dashboard
- Verify all environment variables are set correctly
- Ensure `package.json` has all dependencies
- Try redeploying after pushing a new commit

## 🔄 Updating After Deployment

**Good news**: Any changes you push to GitHub will automatically redeploy!

1. Make changes to your code locally
2. Commit: `git add . && git commit -m "Your message"`
3. Push: `git push origin main`
4. **Vercel** automatically rebuilds and deploys frontend (2-3 minutes)
5. **Railway** automatically rebuilds and deploys backend (2-3 minutes)

No manual work needed!

## 💰 Cost Estimate

**Free Tier (Perfect for sharing with friends):**
- ✅ **Vercel**: Free forever (100GB bandwidth/month)
- ✅ **Railway**: $5 free credit/month (enough for light usage)
- ✅ **Supabase**: Free (up to 50,000 users, 500MB database)
- 💵 **OpenAI** (Optional): ~$1-5/month for AI features (pay-as-you-go)

**Total: $0-5/month** depending on usage and if you use AI features.

## 🔒 Security Checklist

Before sharing with friends, verify:
- ✅ All `.env` files are in `.gitignore` (they are!)
- ✅ No API keys in GitHub repository (verified!)
- ✅ Supabase RLS policies enabled (done!)
- ✅ CORS configured correctly
- ✅ HTTPS enabled (automatic on Vercel/Railway)
- ✅ Email verification required (Supabase default)

## 👥 Sharing with Friends

Once deployed, simply share your Vercel URL with friends:

**Example**: `https://taskcue-app.vercel.app`

Each friend will:
1. Visit the URL
2. Click "Sign Up"
3. Enter their email and create password
4. Verify email
5. Start using TaskCue with their own account!

**Their data is private** - they only see their own tasks thanks to Row Level Security (RLS).

## 📱 Make it a Mobile App (Optional)

Your app is a PWA (Progressive Web App), so friends can "install" it:

**On iPhone/iPad**:
1. Open in Safari
2. Tap Share button
3. Tap "Add to Home Screen"

**On Android**:
1. Open in Chrome
2. Tap menu (3 dots)
3. Tap "Add to Home Screen"

It will work like a native app!

## 📊 Monitoring Usage

**Vercel Dashboard**: Track website visitors and bandwidth
**Railway Dashboard**: Monitor backend usage and logs
**Supabase Dashboard**: See active users and database size

All platforms send email alerts if you approach limits.

## Local Development

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Copy .env.example files
cp .env.example .env
cp server/.env.example server/.env

# Edit .env files with your credentials

# Start both servers
npm run dev
```

Visit `http://localhost:3000`
