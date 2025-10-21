# Account Deletion Setup Guide

## ✅ What's Been Implemented

### 1. In-App Deletion Button
- Location: **Profile** tab → **Account Actions** section
- Features:
  - Clear warning message before deletion
  - Confirmation dialog
  - Immediate account deletion
  - Auto sign-out after deletion

### 2. Edge Function (Backend)
- Function: `delete-account`
- Deployed to Supabase
- Features:
  - Secure authentication check
  - Permanent user deletion
  - All related data cascades (due to database ON DELETE CASCADE)
  - Returns success/error status

### 3. HTML Page for Google Play
- File: `account-deletion.html`
- Professional, comprehensive page explaining:
  - What data gets deleted
  - Step-by-step deletion instructions
  - Timeline for data removal
  - Alternative email deletion method
  - GDPR compliance information

---

## 🚀 How to Provide URL to Google Play

### Step 1: Host the HTML File

Choose one of these methods:

#### Option A: GitHub Pages (Recommended)
```bash
git add account-deletion.html
git commit -m "Add account deletion page"
git push
```
Your URL will be:
```
https://YOUR_USERNAME.github.io/fakrny/account-deletion.html
```

#### Option B: Netlify Drop (30 Seconds)
1. Go to https://app.netlify.com/drop
2. Drag `account-deletion.html`
3. Get URL: `https://random-123.netlify.app/account-deletion.html`

#### Option C: Vercel
```bash
vercel --prod
```
URL: `https://fakrny.vercel.app/account-deletion.html`

---

### Step 2: Add URL to Google Play Console

1. **Go to Google Play Console**
2. **Select your app** (Fakrny)
3. **Navigate to:** Store presence → Store listing
4. **Scroll to:** Privacy Policy section
5. **Add URL in "Data deletion instructions":**
   ```
   https://your-domain.com/account-deletion.html
   ```
6. **Click Save**

---

## 📋 Google Play Requirements

Google Play requires apps that collect user data to provide:

1. ✅ **Privacy Policy URL** - Already created (`privacy-policy.html`)
2. ✅ **Account Deletion URL** - Just created (`account-deletion.html`)

Both must be publicly accessible URLs.

---

## 🔧 Technical Details

### How It Works

1. **User taps "Delete Account"** in Profile
2. **Confirmation dialog appears** with strong warning
3. **User confirms** by tapping "Delete Forever"
4. **App calls edge function** with user's auth token
5. **Edge function verifies user** using JWT
6. **Supabase deletes user** using admin API
7. **Cascade deletion** removes all related data:
   - Profile
   - Prescriptions
   - Medicines
   - Reminders
   - Logs
   - Chat history
8. **User is signed out** and redirected to login

### Database Cascade Deletion

All tables have `ON DELETE CASCADE` on foreign keys, so when the user is deleted:

```sql
profiles (id) → CASCADE DELETE →
  ├─ prescriptions
  ├─ user_medicines
  │   ├─ reminders
  │   └─ medicine_logs
  └─ chat_history
```

Everything is automatically cleaned up!

---

## 🧪 Testing Account Deletion

### Test the Flow:

1. **Create a test account:**
   ```
   Email: test@example.com
   Password: Test123!
   ```

2. **Add some data:**
   - Upload a prescription
   - Add medicines
   - Set reminders

3. **Delete the account:**
   - Profile → Delete Account
   - Confirm deletion
   - Verify you're signed out

4. **Try to login again:**
   - Should fail (account deleted)

5. **Check database:**
   ```sql
   -- All data should be gone
   SELECT * FROM profiles WHERE id = 'USER_ID';
   -- Returns empty
   ```

---

## 📧 Email Deletion Method

Users can also request deletion via email:

**To:** privacy@fakrny.app
**Subject:** Account Deletion Request
**Body:** Include registered email address

**Processing:**
- Manual review within 48 hours
- Use Supabase dashboard to delete user
- Send confirmation email

---

## 🌍 GDPR Compliance

The implementation follows GDPR requirements:

- ✅ **Right to Erasure (Article 17)**
  - Users can delete their account
  - All data is permanently removed

- ✅ **Clear Instructions**
  - Step-by-step guide provided
  - Multiple deletion methods

- ✅ **Timely Deletion**
  - Immediate account deactivation
  - Full deletion within 30 days

- ✅ **Confirmation**
  - User receives confirmation
  - Transparent process

---

## 🔗 URLs You'll Need

After hosting, you'll have two URLs for Google Play:

1. **Privacy Policy:**
   ```
   https://your-domain.com/privacy-policy.html
   ```

2. **Account Deletion:**
   ```
   https://your-domain.com/account-deletion.html
   ```

Store both in Google Play Console!

---

## ⚠️ Important Notes

1. **Test deletion thoroughly** before submitting to Google Play
2. **Keep URLs permanent** - don't change them after submission
3. **Both files are ready** - just need to host them
4. **Use same hosting** for both HTML files (consistency)
5. **SSL required** - URLs must be HTTPS (hosting services provide this automatically)

---

## ✅ Checklist Before Google Play Submission

- [ ] Host `privacy-policy.html` and get URL
- [ ] Host `account-deletion.html` and get URL
- [ ] Verify both URLs work in browser
- [ ] Test URLs on mobile device
- [ ] Test account deletion in app
- [ ] Add Privacy Policy URL to Google Play Console
- [ ] Add Account Deletion URL to Google Play Console
- [ ] Test that deleted accounts cannot login
- [ ] Verify data is actually removed from database

---

## 🎯 Quick Setup (All Methods)

### GitHub Pages
```bash
git add privacy-policy.html account-deletion.html
git commit -m "Add legal pages"
git push
# Enable Pages in repo settings
# URLs: https://username.github.io/fakrny/privacy-policy.html
#       https://username.github.io/fakrny/account-deletion.html
```

### Netlify Drop
1. Go to https://app.netlify.com/drop
2. Drag both HTML files
3. Get URLs
4. Add to Google Play Console

### Vercel
```bash
vercel --prod
# URLs: https://fakrny.vercel.app/privacy-policy.html
#       https://fakrny.vercel.app/account-deletion.html
```

---

## 📞 Support

If users have issues with account deletion:
- In-app method is instant
- Email method takes up to 48 hours
- Provide clear support at privacy@fakrny.app

---

**Your account deletion is now fully implemented and ready for Google Play submission!** 🚀

Just host the HTML file and provide the URL to Google Play Console.
