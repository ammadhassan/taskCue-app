# Advanced Notification Features - Implementation Guide

## ✅ Completed Features

### 1. Calendar Export (.ics)
**Status:** ✅ Fully implemented

**Features:**
- Export single task to calendar (button on each task)
- Export all tasks to calendar (header button)
- Export folder-specific tasks to calendar
- Compatible with: Google Calendar, Apple Calendar, Outlook, etc.

**Files Created/Modified:**
- `src/services/calendarService.js` - Calendar generation logic
- `src/components/TaskItem.jsx` - Added "📅 Calendar" button per task
- `src/App.js` - Added "Export to Calendar" button in header

**How to Use:**
1. Click "📅 Calendar" button on any task with a due date/time
2. Or click "📅 Export to Calendar" in header to export all tasks
3. .ics file downloads automatically
4. Open the file to add to your calendar app

---

### 2. Email Notifications
**Status:** ✅ Backend ready, needs frontend integration

**Backend Endpoint:** `POST /api/send-email`

**Features:**
- Send task reminder emails
- Beautifully formatted HTML emails
- Includes task details, due date, time, folder

**Setup Required:**
1. Add to `server/.env`:
   ```bash
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=your-app-specific-password
   ```

2. **Get Gmail App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Sign in to your Google account
   - Click "Generate" for "Mail" app
   - Copy the 16-character password
   - Use this as `EMAIL_PASSWORD`

**Files Modified:**
- `server/index.js` - Added email endpoint using nodemailer

**Next Steps:**
- Update SettingsModal to add email field
- Update notificationService to send emails at task due time
- Add "Send Test Email" button in settings

---

## 📋 Pending Features

### 3. SMS/Text Notifications
**Status:** ⏳ Not started

**What's Needed:**
- Tw

ilio account (costs ~$0.0079 per SMS)
- Twilio credentials in `.env`
- Backend endpoint for SMS
- Phone number in settings

**Implementation Plan:**
1. Install Twilio: `npm install twilio`
2. Add Twilio endpoint to `server/index.js`
3. Add phone number field to SettingsModal
4. Integrate with notificationService

**Estimated Cost:**
- Twilio: $0.0079 per SMS
- For 20 reminders/day = ~$5/month

---

### 4. Settings UI Updates
**Status:** ⏳ Partially done

**What's Needed:**
- Add "Notification Method" selector (Browser/Email/SMS/All)
- Add email input field
- Add phone number input field
- Add "Send Test Email" button
- Add "Send Test SMS" button

**Wireframe:**
```
┌─────────────────────────────────────┐
│ Notification Settings               │
├─────────────────────────────────────┤
│ ○ Browser Notifications             │
│ ○ Email Notifications                │
│ ○ SMS Notifications                  │
│ ○ All Methods                        │
├─────────────────────────────────────┤
│ Email: [input field]  [Test Email]  │
│ Phone: [input field]  [Test SMS]    │
└─────────────────────────────────────┘
```

---

## 🚀 Quick Test - Calendar Export

**Try this now:**

1. Add a task with a due date and time
2. Click the "📅 Calendar" button on the task
3. A .ics file downloads
4. Open the file - it should open your calendar app
5. The task is added with a 15-minute reminder!

---

## 📧 Email Setup Instructions

### For Gmail Users:

1. **Enable 2-Factor Authentication** (if not already enabled)
   - Go to: https://myaccount.google.com/security
   - Find "2-Step Verification"
   - Follow setup instructions

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (Custom name)"
   - Enter: "Task Assistant"
   - Click "Generate"
   - Copy the 16-character password (like: `abcd efgh ijkl mnop`)

3. **Add to server/.env:**
   ```bash
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop  # No spaces!
   ```

4. **Restart backend server:**
   ```bash
   npm run server
   ```

### For Other Email Providers:

**Outlook/Hotmail:**
```javascript
service: 'hotmail'
```

**Yahoo:**
```javascript
service: 'yahoo'
```

**Custom SMTP:**
```javascript
host: 'smtp.your-provider.com',
port: 587,
secure: false, // true for 465
auth: {
  user: 'your-email',
  pass: 'your-password'
}
```

---

## 📱 SMS Setup Instructions (When Ready)

### Twilio Setup:

1. **Create Twilio Account:**
   - Go to: https://www.twilio.com/try-twilio
   - Sign up (free trial includes $15 credit)

2. **Get Credentials:**
   - Account SID: Found on dashboard
   - Auth Token: Found on dashboard
   - Phone Number: Get a free trial number

3. **Add to server/.env:**
   ```bash
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. **Cost:**
   - SMS to US: $0.0079/message
   - Free trial: $15 credit (~1,900 messages)

---

## 🔔 Notification Methods Comparison

| Method | Cost | Setup Time | Reliability | Best For |
|--------|------|------------|-------------|----------|
| **Browser** | Free | 1 min | High | Desktop users, real-time |
| **Calendar** | Free | 1 min | High | All users, persistent reminders |
| **Email** | Free | 5 min | Very High | All users, detailed reminders |
| **SMS** | $0.0079/msg | 10 min | Highest | Mobile users, urgent tasks |

---

## 🎯 Recommended Setup

**For Personal Use (Free):**
1. ✅ Browser notifications (already working)
2. ✅ Calendar export (just implemented!)
3. ✅ Email notifications (setup Gmail app password)

**For Professional Use:**
1. Browser notifications
2. Calendar export
3. Email notifications
4. SMS for high-priority tasks only

---

## 📝 Next Steps

1. **Test Calendar Export** (ready now!)
   - Add a task with date/time
   - Click "📅 Calendar" button
   - Verify it opens in your calendar

2. **Setup Email** (5 minutes)
   - Get Gmail app password
   - Add to `server/.env`
   - I'll integrate with settings UI

3. **Decide on SMS** (optional)
   - Do you want SMS notifications?
   - If yes, I'll add Twilio integration

**Which would you like me to complete next?**
