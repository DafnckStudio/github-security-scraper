# 📱 Telegram Bot - Quick Setup Guide

## ✅ Current Status

- **Bot Name:** GitFinder
- **Username:** @Gitfinderbot
- **Token:** ✓ Configured in `.env`
- **Chat ID:** ⚠️ **NEEDS TO BE CONFIGURED**

---

## 🚀 Next Steps (5 minutes)

### Step 1: Interact with the Bot

Choose ONE option:

#### Option A: Direct Message (Simplest) 
1. Open Telegram on your phone
2. Search for: **@Gitfinderbot**
3. Send any message (e.g., `/start` or `hello`)
4. Continue to Step 2

#### Option B: Private Channel (Recommended for Production)
1. Create a new **Private Channel** on Telegram
   - Menu → New Channel
   - Name: `GitHub Security Alerts` (or any name)
   - Type: **Private** 🔒
2. Add **@Gitfinderbot** as administrator
   - Channel Settings → Administrators → Add Administrator
   - Give it permission to **Post Messages**
3. Post a message in the channel
4. Continue to Step 2

---

### Step 2: Get Your Chat ID

Run this command in your terminal:

```bash
cd /Users/hacker/Desktop/github/github-security-scraper
npm run get-chat-id
```

The script will display your Chat ID, something like:
- Direct message: `123456789` (positive number)
- Channel: `-1001234567890` (negative number starting with -100)

---

### Step 3: Update .env File

#### Option A: Automatically (if only one chat found)

The script will show you a command to run:
```bash
# Copy-paste the command shown by the script
echo "TELEGRAM_CHAT_ID=YOUR_CHAT_ID" >> .env
```

#### Option B: Manually

1. Open the `.env` file:
```bash
nano .env
```

2. Find the line:
```env
TELEGRAM_CHAT_ID=
```

3. Add your Chat ID:
```env
TELEGRAM_CHAT_ID=-1001234567890
```

4. Save and exit (Ctrl+X, then Y, then Enter)

---

### Step 4: Test the Connection

Run the scraper to test notifications:

```bash
npm run scraper:start
```

You should receive a test notification in Telegram! 📱

---

## 📊 Expected Notifications

Once configured, you'll receive notifications for:

### 🔴 Critical Findings
```
🔴 CRITICAL - private_key

🔍 Repository: user/repo
📁 File: .env
🔑 Pattern: PRIVATE_KEY=0x***

👤 Owner: username
⏰ Discovered: Oct 8, 2025 15:30

🔗 View file
```

### 📊 Scan Summaries
```
🔍 Scan Completed

📊 Summary
Scan ID    : abc12345
Results    : 42
Findings   : 15
Status     : Completed ✅
```

### 🚨 Bulk Alerts
```
🚨 15 New Findings Detected!

📊 By Severity:
🔴 Critical : 8
🟠 High     : 5
🟡 Medium   : 2

🔍 Top 5:
1. 🔴 private_key - user/repo1
2. 🔴 api_key - user/repo2
...
```

---

## 🔧 Troubleshooting

### Problem: "No messages found"
**Solution:** Make sure you've sent a message to @Gitfinderbot or added it to a channel

### Problem: "TELEGRAM_BOT_TOKEN not found"
**Solution:** Make sure the `.env` file exists in the project root

### Problem: "Chat not found" when testing
**Solution:** 
1. Run `npm run get-chat-id` again to verify the Chat ID
2. Make sure the Chat ID is correctly added to `.env`
3. If using a channel, ensure the bot is an administrator

### Problem: "Forbidden: bot was blocked by the user"
**Solution:** 
- If direct message: Unblock the bot in Telegram
- If channel: Check bot permissions in channel settings

---

## 🎯 Quick Commands Reference

```bash
# Get your Chat ID
npm run get-chat-id

# Test the scraper (will send test notification)
npm run scraper:start

# Run continuous scraping
npm run scraper:continuous

# Verify entire setup
npm run verify
```

---

## 📝 Configuration Summary

Your `.env` file should have:

```env
# Telegram Configuration
TELEGRAM_NOTIFICATIONS=true
TELEGRAM_BOT_TOKEN=8328189888:AAG5FSkEIMqgTxOuPEuJKzfTQ_iDfo0H__I
TELEGRAM_CHAT_ID=YOUR_CHAT_ID_HERE  # ← Add this!
```

---

## 🔒 Security Notes

- ✅ The bot token is already in `.env` (git-ignored)
- ✅ Use a **private** channel (not public)
- ✅ Only share the bot token with trusted team members
- ✅ If compromised, create a new bot with @BotFather

---

## ✅ Setup Checklist

- [x] Bot created (@Gitfinderbot)
- [x] Token added to `.env`
- [ ] Sent message to bot OR added to channel
- [ ] Got Chat ID with `npm run get-chat-id`
- [ ] Added Chat ID to `.env`
- [ ] Tested with `npm run scraper:start`
- [ ] Received test notification in Telegram

---

**Once all steps are complete, you're ready to receive real-time security alerts! 🎉**

Need help? Check the full documentation: `docs/TELEGRAM_SETUP.md`
