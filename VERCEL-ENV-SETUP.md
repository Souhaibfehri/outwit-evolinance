# 🚀 VERCEL ENVIRONMENT VARIABLES SETUP

## 🎯 **COPY THESE TO VERCEL DASHBOARD**

Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

---

## 🗄️ **SUPABASE VARIABLES (Required)**

```bash
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL
https://your-project-id.supabase.co

# Supabase Anonymous Key  
NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (Keep Secret!)
SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🗃️ **DATABASE VARIABLES (Required)**

```bash
# Database Connection URL
DATABASE_URL
postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres

# Direct Database URL (Same as above)
DIRECT_URL
postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
```

---

## 🔐 **AUTHENTICATION VARIABLES (Required)**

```bash
# NextAuth Secret (Generate at: https://generate-secret.vercel.app/32)
NEXTAUTH_SECRET
your_32_character_random_secret_here

# Your Live App URL
NEXTAUTH_URL
https://your-app-name.vercel.app
```

---

## 🤖 **OPTIONAL VARIABLES**

```bash
# OpenAI API Key (For AI Coach Features)
OPENAI_API_KEY
sk-your_openai_key_here

# App URL (Same as NEXTAUTH_URL)
NEXT_PUBLIC_APP_URL
https://your-app-name.vercel.app

# Environment
NODE_ENV
production
```

---

## 🎯 **WHERE TO GET EACH VALUE:**

### **🗄️ Supabase Credentials:**
1. Go to **https://supabase.com** → Your Project
2. **Settings** → **API**
3. Copy: URL, anon key, service_role key

### **🗃️ Database URL:**
1. **Settings** → **Database** 
2. **Connection string** → **URI**
3. Replace `[YOUR-PASSWORD]` with your actual password

### **🔐 NextAuth Secret:**
1. Visit: **https://generate-secret.vercel.app/32**
2. Copy the generated secret

### **🌐 App URL:**
1. Your Vercel app URL (e.g., `https://outwit-budget.vercel.app`)

---

## ⚡ **QUICK SETUP STEPS:**

1. **Copy your local environment variables** (from your `.env.local` file)
2. **Add each one to Vercel** (Settings → Environment Variables)
3. **Set Environment to**: Production, Preview, and Development
4. **Update NEXTAUTH_URL** to your live Vercel URL
5. **Click Save** after each variable
6. **Redeploy** your app

---

## 🎉 **AFTER SETUP:**

Your app will have:
- ✅ **User registration/login**
- ✅ **Data persistence** 
- ✅ **All features working**
- ✅ **Production database**

---

## 🚨 **IMPORTANT NOTES:**

- **Never commit** `.env` files to Git
- **Keep service_role key secret** (server-side only)
- **Use your live domain** for NEXTAUTH_URL
- **All variables are case-sensitive**

**After adding these variables, redeploy and your app will be fully functional!** 🚀✨
