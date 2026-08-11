# Deployment & GoDaddy Domain Guide for elboon.com

This guide provides step-by-step instructions on how to host your landing page for free and map your GoDaddy domain (`elboon.com`) to it.

---

## Step 1: Host Your Landing Page

The easiest and most premium way to host a static website is using **Vercel** or **Netlify**. Both platforms integrate directly with GitHub, support automatic SSL certificates, and are 100% free for projects of this size.

### Option A: Hosting with Vercel (Recommended)
1. **Push to GitHub**:
   - Create a free account at [GitHub](https://github.com).
   - Create a new public or private repository named `elboon-landing`.
   - Push your code files (`index.html`, `style.css`, `app.js`) to this repository.
2. **Deploy to Vercel**:
   - Sign up for a free Vercel account at [vercel.com](https://vercel.com) using your GitHub login.
   - Click **Add New...** > **Project**.
   - Import your `elboon-landing` repository.
   - Leave the default settings (Framework Preset: *Other*, Root Directory: *./*).
   - Click **Deploy**. Your site will be live on a `vercel.app` subdomain in under a minute.

### Option B: Hosting with Netlify
1. **Deploy to Netlify**:
   - Sign up for a free Netlify account at [netlify.com](https://www.netlify.com).
   - You can connect your GitHub repository or simply **drag-and-drop** the project directory folder directly into the Netlify dashboard upload area.
   - Your site will instantly be deployed to a `netlify.app` subdomain.

---

## Step 2: Configure Custom Domain on Your Host

Once your site is deployed, you need to tell your host that it should listen for requests coming from `elboon.com`.

### On Vercel:
1. In your Vercel project dashboard, go to **Settings** > **Domains**.
2. Type `elboon.com` and click **Add**.
3. Vercel will ask if you want to redirect `elboon.com` to `www.elboon.com` (or vice-versa). Select the recommended option: **Redirect elboon.com to www.elboon.com**.
4. You will see a panel displaying DNS records (specifically an **A Record** for `elboon.com` and a **CNAME** for `www.elboon.com`) marked as *Invalid Configuration*. Keep this tab open.

### On Netlify:
1. In your Netlify site dashboard, go to **Site Settings** > **Domain Management** > **Custom domains**.
2. Click **Add custom domain**, enter `elboon.com`, and click **Verify**.
3. It will display a success message and show DNS setup instructions. Keep this tab open.

---

## Step 3: Update DNS Settings on GoDaddy

Now you must configure your domain on GoDaddy to point to your hosting server.

1. Log in to your [GoDaddy Control Center](https://dcc.godaddy.com/control/portfolio).
2. Locate `elboon.com` in your domain list and click on **DNS** or select the domain and choose **Manage DNS**.
3. You will see the **DNS Records** table (Zone File). Modify or add the following records:

### 1. Configure the Naked Domain (elboon.com)
Point your main domain to your hosting provider's IP address.
- **Type**: `A`
- **Name / Host**: `@` (represents your root domain)
- **Value / Points to**: 
  - If using **Vercel**: `76.76.21.21`
  - If using **Netlify**: `75.2.60.5`
- **TTL**: `Default` or `1 Hour`

*(Note: If there is an existing A Record with Name `@`, edit it rather than creating a new one.)*

### 2. Configure the WWW Subdomain (www.elboon.com)
Point the `www` subdomain to your hosting provider's dynamic DNS entry.
- **Type**: `CNAME`
- **Name / Host**: `www`
- **Value / Points to**:
  - If using **Vercel**: `cname.vercel-dns.com`
  - If using **Netlify**: `your-site-name.netlify.app` (replace with your actual Netlify site subdomain)
- **TTL**: `Default` or `1 Hour`

*(Note: If there is an existing CNAME Record with Name `www`, edit it rather than creating a new one.)*

---

## Step 4: Verify and Wait for Propagation

1. Go back to your hosting provider's dashboard (Vercel or Netlify).
2. Click **Refresh** or **Verify** on your domain settings.
3. Once the records verify, Vercel/Netlify will automatically request, generate, and configure a free Let's Encrypt **SSL (HTTPS) Certificate** for your site.
4. **DNS Propagation**: DNS updates can take anywhere from **5 minutes to a few hours** to propagate worldwide. You can check the global propagation status using online tools like [whatsmydns.net](https://www.whatsmydns.net/#A/elboon.com).

*Your landing page is now successfully configured to load on both **https://elboon.com** and **https://www.elboon.com**!*
