# Facebook Auto-Poster – Setup Guide

## 1. Create a Facebook App

1. Go to [developers.facebook.com](https://developers.facebook.com/) and log in
2. Click **My Apps** > **Create App**
3. Select **Business** type > **Next**
4. Enter app name (e.g. "BusManiak Auto-Poster"), select your Business account > **Create App**

## 2. Add Facebook Login product

1. In the App Dashboard, click **Add Product**
2. Find **Facebook Login for Business** > **Set Up**
3. Skip the quickstart wizard

## 3. Generate a Page Access Token

### Option A: Graph API Explorer (quick, short-lived)

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Click **Generate Access Token**
4. Grant permissions: `pages_manage_posts`, `pages_read_engagement`
5. Select your Page from the **Page** dropdown
6. Copy the Page Access Token

### Option B: Long-Lived Token (recommended for cron)

1. Get a short-lived User Token from Graph API Explorer (as above)
2. Exchange for long-lived user token (60 days):

```
GET https://graph.facebook.com/v22.0/oauth/access_token?
  grant_type=fb_exchange_token&
  client_id={APP_ID}&
  client_secret={APP_SECRET}&
  fb_exchange_token={SHORT_LIVED_TOKEN}
```

3. Get the Page Access Token from the long-lived user token:

```
GET https://graph.facebook.com/v22.0/me/accounts?access_token={LONG_LIVED_USER_TOKEN}
```

The `access_token` field for your page in the response is a **long-lived Page Access Token** that does not expire.

### Option C: System User (never expires, recommended for production)

1. In [Business Settings](https://business.facebook.com/settings/), go to **Users** > **System Users**
2. Create a System User with **Admin** role
3. Click **Generate Token**, select your app, grant `pages_manage_posts` and `pages_read_engagement`
4. Assign the System User to your Page with **MANAGE** permission
5. The generated token never expires

## 4. Get your Page ID

1. Go to your Facebook Page
2. Click **About** > scroll to **Page transparency**
3. Or use: `GET https://graph.facebook.com/v22.0/me/accounts?access_token={TOKEN}`
4. Copy the `id` field

## 5. Set environment variables

```bash
export FB_PAGE_ID="your_page_id"
export FB_ACCESS_TOKEN="your_page_access_token"
export OPENROUTER_KEY="your_openrouter_key"
```

Add these to your `.env` file or cron environment.

## 6. Set up cron

```bash
crontab -e
```

Add:

```
0 10 * * * cd /path/to/transformacja-zaplecza-seo && /usr/bin/python3 pipeline/fb-poster/post_to_fb.py >> pipeline/fb-poster/fb-poster.log 2>&1
```

## 7. Test

```bash
python3 pipeline/fb-poster/post_to_fb.py --dry-run
```

This will pick an article and generate the description without actually posting to Facebook.
