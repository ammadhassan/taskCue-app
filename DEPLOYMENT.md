# Task Assistant - Deployment Guide

## Overview

This guide covers deploying the Task Assistant application with Supabase authentication, Vercel frontend hosting, and Railway backend hosting.

## Architecture

```
User Browser → Vercel (React Frontend) → Railway (Express Backend) → OpenAI API
                    ↓
              Supabase (Auth + PostgreSQL Database)
```

## Prerequisites

Before deploying, you'll need accounts on:
- [GitHub](https://github.com) - Code repository
- [Supabase](https://supabase.com) - Authentication & Database
- [Vercel](https://vercel.com) - Frontend hosting
- [Railway](https://railway.app) - Backend hosting
- [OpenAI](https://platform.openai.com) - AI API access

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

### 1. Create GitHub Repository

```bash
# Navigate to project directory
cd task-assistant-cra

# Verify git is initialized
git status

# Create repository on GitHub (https://github.com/new)
# Name: task-assistant (or your choice)
# Make it PRIVATE (contains sensitive configuration)

# Add remote origin
git remote add origin https://github.com/YOUR-USERNAME/task-assistant.git

# Push to GitHub
git push -u origin main
```

### 2. Set Up Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name:** task-assistant
   - **Database Password:** (generate strong password - save it!)
   - **Region:** Choose closest to your location
4. Wait for database provisioning (~2 minutes)
5. Go to **Settings → API**
6. Copy:
   - **URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbG...`
7. Go to **SQL Editor** and run the schema from `SUPABASE_SCHEMA.sql` (see below)

### 3. Deploy Backend to Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `task-assistant` repository
5. Railway will auto-detect Node.js
6. Click "Add variables" and add:
   ```
   OPENAI_API_KEY=sk-...
   PORT=3001
   ```
7. Click "Deploy"
8. Once deployed, go to "Settings" → "Generate Domain"
9. Copy your Railway URL (e.g., `https://task-assistant.up.railway.app`)

### 4. Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
5. Add environment variables:
   ```
   REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbG...
   REACT_APP_BACKEND_URL=https://task-assistant.up.railway.app
   ```
6. Click "Deploy"
7. Wait for deployment to complete
8. Copy your Vercel URL (e.g., `https://task-assistant.vercel.app`)

### 5. Update CORS Configuration

Go back to Railway dashboard:
1. Add environment variable:
   ```
   FRONTEND_URL=https://task-assistant.vercel.app
   ```
2. Railway will auto-redeploy

### 6. Configure Supabase Email Settings

1. In Supabase Dashboard, go to **Authentication → URL Configuration**
2. Set **Site URL:** `https://task-assistant.vercel.app`
3. Add **Redirect URLs:**
   ```
   https://task-assistant.vercel.app
   https://task-assistant.vercel.app/**
   ```

## Testing Deployment

1. Open your Vercel URL
2. Try signing up with your email
3. Check email for verification link
4. Login after verification
5. Test creating tasks
6. Test AI task extraction
7. Test notifications
8. Open in another browser/device to verify sync

## Troubleshooting

### "Failed to fetch" errors
- Check CORS configuration in Railway
- Verify FRONTEND_URL matches your Vercel URL
- Check browser console for exact error

### Authentication not working
- Verify Supabase URL and anon key are correct
- Check Site URL in Supabase settings
- Clear browser cache and try again

### AI task extraction fails
- Verify OPENAI_API_KEY is set in Railway
- Check Railway logs for errors
- Ensure backend is running (visit Railway URL/health)

### Tasks not syncing
- Check Supabase connection
- Verify RLS policies are enabled
- Check browser console for errors

## Updating After Deployment

Any changes pushed to GitHub `main` branch will automatically trigger:
- **Vercel:** Automatic frontend redeploy
- **Railway:** Automatic backend redeploy

## Cost Estimate

**Free Tier (Your Usage):**
- Vercel: Free (100GB bandwidth)
- Railway: Free ($5 credit/month)
- Supabase: Free (50K users, 500MB DB)
- OpenAI: ~$1-5/month (pay per use)

**Total: ~$1-5/month**

## Security Checklist

- [ ] All .env files are in .gitignore
- [ ] API keys rotated (new keys generated)
- [ ] Supabase RLS policies enabled
- [ ] CORS configured correctly
- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] Email verification enabled in Supabase

## Support

For issues or questions:
- Check logs in Vercel/Railway dashboards
- Review Supabase logs in dashboard
- Check browser console for frontend errors

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
