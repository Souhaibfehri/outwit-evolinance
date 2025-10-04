# 🎯 YOUR EXACT VERCEL ENVIRONMENT VARIABLES

## 📋 **COPY THESE TO VERCEL DASHBOARD**

Go to: **https://vercel.com/dashboard** → **outwit-budget** → **Settings** → **Environment Variables**

---

## 🔑 **ADD THESE VARIABLES ONE BY ONE:**

### **1. Supabase URL**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: [COPY FROM YOUR LOCAL .env FILE]
Environment: Production, Preview, Development
```

### **2. Supabase Anonymous Key**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [COPY FROM YOUR LOCAL .env FILE]
Environment: Production, Preview, Development
```

### **3. Supabase Service Role Key**
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [COPY FROM YOUR LOCAL .env FILE]
Environment: Production, Preview, Development
```

### **4. Database URL**
```
Name: DATABASE_URL
Value: [COPY FROM YOUR LOCAL .env FILE]
Environment: Production, Preview, Development
```

### **5. Direct URL (Same as Database URL)**
```
Name: DIRECT_URL
Value: [COPY FROM YOUR LOCAL .env FILE - SAME AS DATABASE_URL]
Environment: Production, Preview, Development
```

### **6. NextAuth Secret**
```
Name: NEXTAUTH_SECRET
Value: [COPY FROM YOUR LOCAL .env FILE]
Environment: Production, Preview, Development
```

### **7. NextAuth URL (UPDATED FOR PRODUCTION)**
```
Name: NEXTAUTH_URL
Value: https://outwit-budget-547fshonj-souhaibfehrii-7168s-projects.vercel.app
Environment: Production, Preview, Development
```

### **8. App URL (SAME AS NEXTAUTH_URL)**
```
Name: NEXT_PUBLIC_APP_URL
Value: https://outwit-budget-547fshonj-souhaibfehrii-7168s-projects.vercel.app
Environment: Production, Preview, Development
```

---

## ⚡ **QUICK STEPS:**

1. **Open your local .env file**
2. **Open Vercel Dashboard** in another tab
3. **Copy each variable** from local → Vercel
4. **Use the exact values above** for NEXTAUTH_URL and NEXT_PUBLIC_APP_URL
5. **Click Save** after each variable
6. **Go to Deployments** → **Redeploy**

---

## 🎉 **AFTER ADDING VARIABLES:**

Your app at **https://outwit-budget-547fshonj-souhaibfehrii-7168s-projects.vercel.app** will have:
- ✅ **Working authentication**
- ✅ **Database connection**
- ✅ **User registration/login**
- ✅ **Data persistence**

---

## 🚨 **IMPORTANT:**
- **Don't change** the Supabase values - use exactly what's in your local .env
- **Only update** NEXTAUTH_URL and NEXT_PUBLIC_APP_URL to your Vercel URL
- **Set Environment** to all three: Production, Preview, Development

**Go add these variables and your app will be fully functional!** 🚀✨
