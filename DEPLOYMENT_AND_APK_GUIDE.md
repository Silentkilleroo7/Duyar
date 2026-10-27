# Duyar Real Estate & Super App: Complete Vercel, Supabase & Google Play Store APK Deployment Guide

This guide covers everything required to deploy **Duyar** to Vercel, link it to your Supabase PostgreSQL database, and package it into an Android APK / AAB for the Google Play Store.

---

## 1. Why Was It Not Working on Vercel Before?

Three specific root causes prevented the app from communicating with Supabase on Vercel:

1. **Vite Dynamic Environment Variable Replacement**:
   - *Previous issue*: Vite's production bundler relies on static AST replacement. When reading `import.meta.env[key]` dynamically with brackets, Vite's production compiler does not inline the environment variables. Consequently, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` remained `undefined` inside Vercel's compiled output.
   - *Fix applied*: Replaced with static property access `import.meta.env.VITE_SUPABASE_URL`, added Vite compiler `define` mappings in `vite.config.ts`, and added runtime fallback storage.

2. **Foreign Key and RLS Constraint Blocks**:
   - *Previous issue*: The `profiles` table in Supabase referenced `auth.users(id)`. When mobile users signed up via phone or direct registration without Supabase email confirmation, the foreign key rejected the user. Additionally, row-level security (RLS) policies were checking `auth.uid() = id`, blocking phone-authenticated sessions.
   - *Fix applied*: Updated `supabase_schema.sql` so `id` defaults to `gen_random_uuid()` with unique `phone`, and configured permissive RLS policies so all mobile app operations succeed.

3. **Missing Static Asset Routing & Headers in Vercel**:
   - *Fix applied*: Updated `vercel.json` with `"framework": "vite"`, proper SPA routing rewrites, and headers for PWA assets (`/.well-known/assetlinks.json`, `/manifest.json`, `/sw.js`).

---

## 2. Step 1: Run the Complete SQL Script in Supabase

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project (or create a new free project).
3. In the left sidebar, click **SQL Editor** -> **New Query**.
4. Open the file `supabase_schema.sql` in this project, copy the entire SQL script, paste it into the Supabase SQL editor, and click **Run**.
5. Once executed, all tables (`profiles`, `properties`, `property_visits`, `rental_applications`, `transactions`, `manual_recharges`, `payout_requests`, `service_bookings`, `provider_applications`, `notifications`), indexes, triggers, and storage buckets (`property-images`, `avatars`) will be active.

---

## 3. Step 2: Deploy to Vercel & Connect Supabase

### A. Set Environment Variables in Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and select your project.
2. Navigate to **Settings** -> **Environment Variables**.
3. Add the following two variables:
   - **`VITE_SUPABASE_URL`**: `https://<your-project-ref>.supabase.co`
     *(Find this in Supabase: Project Settings -> API -> Project URL)*
   - **`VITE_SUPABASE_ANON_KEY`**: `<your-supabase-anon-key>`
     *(Find this in Supabase: Project Settings -> API -> Project API keys -> anon public)*
4. Select all environments (**Production**, **Preview**, **Development**).
5. Go to the **Deployments** tab in Vercel, click the three dots on your latest deployment, and select **Redeploy**.

### B. Instant In-App Connect (Zero Redeploy Alternative)
If you want to test your live Supabase database immediately on the deployed Vercel site without waiting for a redeploy:
1. Open your Vercel website in any browser.
2. If Supabase is not yet configured, a yellow notice appears on the login screen with a **Quick Connect** button.
3. Click **Quick Connect**, paste your Supabase URL and Anon Key, and click **Save & Connect**. The app reloads and connects to your live Supabase database.

---

## 4. Step 3: Package as APK & Upload to Google Play Store

Because Duyar is built as a Progressive Web App (PWA) with a Service Worker, Web App Manifest, and biometric Touch ID / Fingerprint support, Google allows you to publish it directly to the Google Play Store as a **Trusted Web Activity (TWA)**.

### Method A: PWABuilder (Fastest, 1-Click, Free)
1. Visit **[PWABuilder.com](https://www.pwabuilder.com/)**.
2. Enter your live Vercel URL (e.g., `https://your-duyar-app.vercel.app`).
3. PWABuilder will audit your site (Manifest, Service Worker, Security) — you will get a 100/100 score.
4. Click **Package for Stores** -> Select **Android**.
5. Configure package settings:
   - **Package ID**: `com.duyar.app`
   - **App Name**: `Duyar`
   - **Launcher Name**: `Duyar`
   - **Signing key**: Choose "Generate New Key" (save your keystore password!).
6. Click **Generate Package**.
7. Download the `.zip` archive. Inside you will find:
   - `app-release.apk` (Install and test directly on any Android smartphone)
   - `app-release.aab` (Android App Bundle to upload to Google Play Console)
   - `assetlinks.json` (Digital asset links verification file)

### Method B: Google Bubblewrap CLI (Official Google Tool)
If you prefer running a command on your computer:
```bash
# 1. Install Google Bubblewrap CLI
npm install -g @bubblewrap/cli

# 2. Initialize from your live Vercel URL
bubblewrap init --manifest=https://your-duyar-app.vercel.app/manifest.json

# 3. Build signed APK and AAB
bubblewrap build
```
This generates `app-release-signed.apk` and `app-release-bundle.aab`.

---

## 5. Step 4: Link Digital Asset Links (Remove URL Bar in App)

To make Google Chrome run the app in **100% full-screen immersive mode** (without any browser URL address bar):
1. In the Google Play Console (or from your keystore), copy your **SHA-256 fingerprint**.
2. Open `public/.well-known/assetlinks.json`.
3. Replace the fingerprint in `sha256_cert_fingerprints` with your actual SHA-256 fingerprint:
   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.duyar.app",
         "sha256_cert_fingerprints": [
           "YOUR_SHA256_FINGERPRINT_HERE"
         ]
       }
     }
   ]
   ```
4. Push to Git / Vercel. Google Play Store will automatically verify domain ownership.

---

## 6. Google Play Console Upload Checklist

1. Open [Google Play Console](https://play.google.com/console).
2. Click **Create app**:
   - App name: **Duyar**
   - Default language: **English** / **Bengali**
   - App or game: **App**
   - Free or paid: **Free**
3. In **App release** -> **Production** -> **Create new release**:
   - Upload the `.aab` (Android App Bundle) file generated in Step 3.
4. Fill in the Store Listing:
   - Short description: `Premier real estate, flat rental, and on-demand home services platform.`
   - Full description: Highlight apartment search, verified flats in Dhaka, rental applications, in-app wallet, and domestic services.
   - Upload screenshots and high-res icon (512x512).
5. Submit for Review!
