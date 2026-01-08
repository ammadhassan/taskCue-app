# TaskCue - Quick Deployment Checklist

Follow these steps to deploy TaskCue and share it with your friends!

## ✅ Prerequisites (Already Done!)

- [x] GitHub repository created: `taskCue-app`
- [x] Supabase database configured
- [x] Local app working correctly

## 🚀 Deployment Steps

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings → API**
4. Copy these values:
   - [ ] `URL`: `https://YOUR-PROJECT.supabase.co`
   - [ ] `anon public key`: `eyJhbGciOiJIUzI1...`

### Step 2: Deploy Backend to Railway

1. Go to [Railway.app](https://railway.app)
   - [ ] Sign in with GitHub
2. Create New Project
   - [ ] Click "New Project" → "Deploy from GitHub repo"
   - [ ] Select `taskCue-app` repository
3. Add Environment Variables (click "Variables"):
   ```
   PORT=3001
   NODE_ENV=production
   ```
   - [ ] OPENAI_API_KEY (optional - leave blank for now if you don't have it)
4. Generate Domain
   - [ ] Go to Settings → Generate Domain
   - [ ] Copy Railway URL: `https://_____.up.railway.app`

### Step 3: Deploy Frontend to Vercel

1. Go to [Vercel.com](https://vercel.com)
   - [ ] Sign in with GitHub
2. Import Project
   - [ ] Click "Add New Project"
   - [ ] Select `taskCue-app` repository
3. Configure Build Settings:
   - [ ] Framework Preset: Create React App
   - [ ] Root Directory: `./`
   - [ ] Build Command: `npm run build`
   - [ ] Output Directory: `build`
4. Add Environment Variables:
   ```
   REACT_APP_SUPABASE_URL=
   REACT_APP_SUPABASE_ANON_KEY=
   REACT_APP_BACKEND_URL=
   ```
   - [ ] Paste your Supabase URL
   - [ ] Paste your Supabase anon key
   - [ ] Paste your Railway URL from Step 2
5. Deploy
   - [ ] Click "Deploy"
   - [ ] Wait 2-3 minutes for build
   - [ ] Copy Vercel URL: `https://_____.vercel.app`

### Step 4: Update Backend with Frontend URL

1. Go back to Railway Dashboard
2. Add Environment Variable:
   - [ ] `FRONTEND_URL` = Your Vercel URL (e.g., `https://taskcue-app.vercel.app`)
3. Railway will auto-redeploy (wait 1-2 minutes)

### Step 5: Configure Supabase

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Update URLs:
   - [ ] **Site URL**: Your Vercel URL
   - [ ] **Redirect URLs**: Add your Vercel URL with `/**` at the end
     ```
     https://taskcue-app.vercel.app
     https://taskcue-app.vercel.app/**
     ```
3. Click **Save**

## 🎉 Test Your Deployment!

1. Open your Vercel URL in a new browser
   - [ ] Website loads successfully
2. Sign up with a new email
   - [ ] Signup form works
   - [ ] Receive verification email
3. Verify your email and login
   - [ ] Email verification link works
   - [ ] Can login successfully
4. Test core features:
   - [ ] Create a task
   - [ ] Edit a task
   - [ ] Mark task complete
   - [ ] Create a folder
   - [ ] Delete a task
5. Test on another device
   - [ ] Open same URL on phone/tablet
   - [ ] Login with same account
   - [ ] Tasks sync between devices

## 👥 Share with Friends!

**Your TaskCue URL**: `https://_____.vercel.app` (write yours here)

Send this link to your friends! They can:
1. Visit the URL
2. Click "Sign Up"
3. Create their own account
4. Use TaskCue with their own private tasks

## 📊 Monitor Your App

- **Vercel Dashboard**: See visitor stats and bandwidth usage
- **Railway Dashboard**: Monitor backend health and logs
- **Supabase Dashboard**: Track user signups and database size

## 🐛 Troubleshooting

### Can't login/signup?
- Check Supabase Site URL and Redirect URLs are correct
- Clear browser cache and try again
- Check browser console for errors (F12)

### "Failed to fetch" errors?
- Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Check Railway logs for CORS errors
- Make sure Railway deployment succeeded

### Tasks not syncing?
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for Supabase errors
- Verify you're logged into the same account on both devices

## 💰 Cost

Your deployment is **FREE** for personal use:
- Vercel: Free (100GB bandwidth/month)
- Railway: $5 free credit/month
- Supabase: Free (50,000 users)

**Total: $0/month** 🎉

## 🔄 Future Updates

To deploy updates:
1. Make changes locally
2. Commit: `git add . && git commit -m "Update message"`
3. Push: `git push origin main`
4. Vercel and Railway auto-deploy! (2-3 minutes)

---

**Need help?** Check `DEPLOYMENT.md` for detailed troubleshooting!
