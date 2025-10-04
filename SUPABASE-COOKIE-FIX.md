# 🍪 Supabase Cookie Size Fix Guide

## The Problem
When you log in with GitHub, Supabase creates **10 large cookies** (28KB total) that cause **HTTP ERROR 431**.

## 🎯 Solution: Fix Supabase Dashboard Settings

### Step 1: Access Your Supabase Project
1. Go to: **https://supabase.com/dashboard**
2. Log in with: `souhaibfehri@hotmail.com` (your Supabase account)
3. Select project: **outwit-budget** (project ID: `sddjvxvvlqhbgkgmfypb`)

### Step 2: Fix Auth Settings
1. Click **"Authentication"** in left sidebar
2. Click **"Settings"** tab
3. Scroll to **"Security and Sessions"**

#### Change These Settings:

**JWT Expiry:**
```
Current: 604800 (1 week)
Change to: 3600 (1 hour)
```

**Refresh Token Rotation:**
```
Current: ENABLED
Change to: DISABLED
```

**Session Timeout:**
```
Current: 604800 (1 week)  
Change to: 3600 (1 hour)
```

4. Click **"Save"** at the bottom

### Step 3: Fix GitHub OAuth Settings
1. Still in **Authentication**, click **"Providers"**
2. Click **"GitHub"**
3. Scroll to **"Scopes"** section

#### Reduce OAuth Scopes:
```
Current: read:user, user:email, read:org
Change to: user:email (ONLY)
```

This reduces metadata from GitHub, reducing cookie size.

4. Click **"Save"**

### Step 4: Advanced - Storage Method (Optional)
1. In **Authentication → Settings**
2. Look for **"Cookie Options"** or **"Storage Method"**
3. If available, set:
   ```
   Storage Method: localStorage (not cookies)
   Cookie Max Age: 3600
   Cookie SameSite: lax
   ```

### Step 5: Clear Existing Sessions
1. Go to **Authentication → Users**
2. For each user, click the 3 dots → **"Sign Out User"**
3. This forces fresh sessions with new settings

## 🧪 Test the Fix

After making these changes:

1. **Clear your browser cookies/cache**
2. **Go to your app**: http://localhost:3002/test-auth
3. **Login with GitHub**
4. **Check cookie count**: Should be 1-2 cookies instead of 10
5. **Check cookie size**: Should be <4KB instead of 28KB

## ✅ Expected Results

**Before Fix:**
- 🔴 10 cookies (28KB)
- 🔴 HTTP ERROR 431
- 🔴 Redirect loops

**After Fix:**
- ✅ 1-2 cookies (<4KB)
- ✅ No HTTP 431 errors
- ✅ Smooth authentication

## ⚠️ Trade-offs

**Shorter Session (1 hour):**
- Users re-login every hour instead of weekly
- More secure (shorter exposure)
- Smaller cookies

**If you want longer sessions:**
- Keep the localStorage-only approach (already in your code)
- Users stay logged in longer
- Zero cookies (all in localStorage)

## 🆘 If Settings Aren't Visible

If you can't find these settings in the Supabase dashboard:

1. **Your localStorage approach is already working** (no cookies)
2. Just make sure to clear all existing browser cookies
3. Use Incognito/Private mode for testing
4. The fix in `lib/supabase/client.ts` already prevents cookie creation

## 📞 Need Help?

If you still see 10 cookies after:
1. Clearing browser data
2. Using Incognito mode
3. Making Supabase changes

Then the issue is likely:
- Old cookies still in browser (clear again)
- Supabase caching (wait 5-10 minutes)
- Need to restart Supabase project (Dashboard → Settings → Restart Project)

## 🚀 Your Code Already Has the Fix!

The changes in your code (`lib/supabase/client.ts`) **already prevent cookie creation** by forcing localStorage. The Supabase dashboard changes are just extra protection.

**Test now with the localStorage approach and you should be good to go!** 🎉

