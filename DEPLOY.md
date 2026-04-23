# 🚀 Deploy Sniplink to Vercel

## Option 1: Deploy from GitHub (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Sign in with your GitHub account

2. **Import Repository:**
   - Click: **"Add New"** → **"Project"**
   - Find: `elesiaann/sniplink`
   - Click: **"Import"**

3. **Configure Project:**
   - **Project Name:** `sniplink`
   - **Framework Preset:** `Other`
   - **Build Command:** `npm install`
   - **Output Directory:** `public`
   - **Install Command:** `npm install`

4. **Deploy:**
   - Click: **"Deploy"**
   - Wait for deployment (usually 1-2 minutes)

5. **Your site will be live at:**
   ```
   https://sniplink.vercel.app
   ```

## Option 2: One-Click Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Felesiaann%2Fsniplink)

## Option 3: Manual CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## ✅ After Deployment

**Test your deployment:**

1. **Home Page:** https://sniplink.vercel.app
2. **API Health:** https://sniplink.vercel.app/api/health
3. **Create a short link:** Use the form on the home page

## 🔧 Troubleshooting

**If Vercel shows 404:**
1. Check that your GitHub repo has the correct files
2. Re-deploy from Vercel dashboard
3. Wait 2 minutes for DNS propagation

**If API returns 404:**
1. Verify `vercel.json` routes are correct
2. Check `api/index.js` is in the right location
3. Re-deploy

---

**Your Sniplink is ready to go!** 🎉