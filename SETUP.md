# Setup Guide — Supabase + Vercel

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up / sign in
2. Click **New project**
3. Name it `tiny-experiments`, set a secure DB password, choose a region close to you
4. Wait ~2 minutes for provisioning

## 2. Get API Credentials

1. In the Supabase dashboard, go to **Project Settings → API**
2. Copy the **Project URL** and **anon public key**
3. Create a `.env` file in this project root:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Run the Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Open `supabase-schema.sql` from this project
3. Paste the entire contents
4. Click **Run** — this creates all tables, triggers, and security policies

## 4. Enable Auth Providers

### Email / Password (already on by default)

### Google OAuth
1. Go to **Authentication → Providers**
2. Click **Google**
3. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project
4. Configure the OAuth consent screen
5. Create credentials → **OAuth client ID** (Web application)
6. Set **Authorized redirect URIs** to:
   `https://your-project-id.supabase.co/auth/v1/callback`
7. Copy the Client ID and Client Secret into Supabase's Google provider form
8. Save

## 5. Run Locally

```bash
cp .env.example .env
# Fill in your Supabase URL and anon key
npm run dev
```

## 6. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com), import the repo
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Vite

## 7. Update Google OAuth Redirect (after deploy)

After Vercel deploys, add your production URL to the Google OAuth redirect URIs:

```
https://your-app.vercel.app
```
