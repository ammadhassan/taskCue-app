# Backend Server Startup Instructions

## Why You Need the Backend Server

The Task Assistant uses a backend Express server to proxy API calls to HuggingFace. This is necessary to avoid CORS (Cross-Origin Resource Sharing) browser security restrictions that prevent direct API calls from the frontend.

**Architecture:**
```
Frontend (React on :3000) → Backend (Express on :3001) → HuggingFace API
```

---

## Quick Start

### Option 1: Run Backend and Frontend Together

```bash
npm run dev
```

This starts both servers concurrently:
- Backend server on http://localhost:3001
- Frontend React app on http://localhost:3000

### Option 2: Run Separately (Recommended for Debugging)

**Terminal 1 - Backend:**
```bash
npm run server
```

Wait for this message:
```
🚀 Task Assistant Backend running on http://localhost:3001
✅ CORS enabled for http://localhost:3000
📡 Ready to proxy HuggingFace API requests
```

**Terminal 2 - Frontend:**
```bash
npm start
```

---

## Troubleshooting

### Error: "Backend server is not running"

**Symptom:** Frontend shows error message:
```
❌ Backend server is not running!

Please start it in a separate terminal:
1. Open a new terminal
2. Run: npm run server
3. Wait for "Task Assistant Backend running" message
4. Then try again
```

**Solution:** The backend server is not running. Start it with:
```bash
npm run server
```

### Error: "Port 3001 already in use"

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:** Another process is using port 3001. Either:

1. **Find and kill the process:**
   ```bash
   # macOS/Linux
   lsof -ti:3001 | xargs kill -9

   # Windows
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   ```

2. **Or change the port in server/.env:**
   ```bash
   PORT=3002
   ```
   Then update frontend's `REACT_APP_BACKEND_URL` in `.env`:
   ```bash
   REACT_APP_BACKEND_URL=http://localhost:3002
   ```

### Error: "HuggingFace API key not configured"

**Symptom:**
```
HuggingFace API key not configured on server
```

**Solution:** Check `server/.env` file exists with:
```bash
HUGGINGFACE_API_KEY=your_actual_key_here
PORT=3001
```

### Error: "Request timeout"

**Symptom:**
```
AI request timed out. Please try again with simpler input.
```

**Possible causes:**
1. HuggingFace API is slow or overloaded
2. Model is still loading (cold start)
3. Network connectivity issues

**Solution:**
- Try again in a few seconds
- Simplify your input text
- Check HuggingFace API status: https://status.huggingface.co/

---

## Verifying Backend is Running

### 1. Check Backend Console Logs

You should see:
```
🚀 Task Assistant Backend running on http://localhost:3001
✅ CORS enabled for http://localhost:3000
📡 Ready to proxy HuggingFace API requests
```

### 2. Test Health Endpoint

Open browser or use curl:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","message":"Task Assistant Backend is running"}
```

### 3. Watch for Request Logs

When you extract tasks, you should see:
```
📤 [SERVER] Forwarding request to HuggingFace API...
✅ [SERVER] Received response from HuggingFace
```

---

## Environment Variables

### Frontend (.env in root)
```bash
REACT_APP_BACKEND_URL=http://localhost:3001
```

### Backend (server/.env)
```bash
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
PORT=3001
```

---

## Development Workflow

1. **Start backend first** (Terminal 1):
   ```bash
   npm run server
   ```
   Wait for "Backend running" message

2. **Then start frontend** (Terminal 2):
   ```bash
   npm start
   ```

3. **Test task extraction:**
   - Enter text: "buy milk tomorrow"
   - Click "Extract with AI"
   - Check both consoles for logs

**Backend should log:**
```
📤 [SERVER] Forwarding request to HuggingFace API...
✅ [SERVER] Received response from HuggingFace
```

**Frontend should log:**
```
🤖 [LLM] Sending to AI for task extraction: "buy milk tomorrow"
🤖 [LLM] Raw AI response: [...]
✅ [LLM] Successfully extracted 1 tasks
```

---

## Security Notes

- The backend server runs on localhost only (not exposed to internet)
- API key is stored server-side in `server/.env` (not in frontend code)
- CORS is enabled only for `http://localhost:3000` (frontend origin)
- Never commit `.env` files to git (already in .gitignore)

---

## Production Deployment

For production, you'll need to:

1. **Deploy backend separately** (e.g., Railway, Render, Heroku)
2. **Set environment variable** `HUGGINGFACE_API_KEY` on the server
3. **Update frontend** `.env` with production backend URL:
   ```bash
   REACT_APP_BACKEND_URL=https://your-backend.railway.app
   ```
4. **Update CORS** in server/index.js to allow your production frontend domain

---

## Quick Reference

| Command | What it does |
|---------|-------------|
| `npm run server` | Start backend only |
| `npm start` | Start frontend only |
| `npm run dev` | Start both (recommended) |
| `curl http://localhost:3001/health` | Test backend health |

**Both servers must be running for task extraction to work!**
