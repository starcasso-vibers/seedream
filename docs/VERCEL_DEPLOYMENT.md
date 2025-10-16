# Vercel Deployment Guide

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. ARK API key from BytePlus

## Storage Setup

This application uses Vercel's cloud storage services:

- **Vercel Blob**: Stores generated images
- **Vercel KV**: Stores project metadata and image references

## Deployment Steps

### 1. Connect Your Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Select the `frontend` folder as the root directory

### 2. Configure Storage

#### Add Vercel Blob Storage

1. In your Vercel project, go to "Storage" tab
2. Click "Create Database" → "Blob"
3. Create a new Blob store (any name)
4. Vercel will automatically add `BLOB_READ_WRITE_TOKEN` to your environment

#### Add Vercel KV Storage

1. In "Storage" tab, click "Create Database" → "KV"
2. Create a new KV store (any name)
3. Vercel will automatically add KV environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### 3. Set Environment Variables

1. Go to "Settings" → "Environment Variables"
2. Add your ARK API key:
   - Name: `ARK_API_KEY`
   - Value: `cbc18d7d-7ea4-465e-80c5-ecf7ca78bc28` (or your key)
   - Environment: Production, Preview, Development

### 4. Deploy

1. Click "Deploy" button
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## Local Development with Vercel

To test with Vercel's cloud storage locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Pull environment variables
vercel env pull

# Run dev server with Vercel environment
vercel dev
```

## Migrating Existing Data

If you have existing images in `public/generated-images/`:

1. Deploy the app first
2. Use Vercel CLI to upload existing data:

```bash
# This will require a custom migration script
# Contact your developer for the migration tool
```

## Troubleshooting

### "API key not configured" error
- Verify `ARK_API_KEY` is set in Vercel environment variables
- Redeploy after adding the variable

### "KV connection failed" error
- Ensure KV database is created in Vercel Storage tab
- Check that KV environment variables are set

### "Blob upload failed" error
- Ensure Blob storage is created in Vercel Storage tab
- Check that `BLOB_READ_WRITE_TOKEN` is set

## Cost Considerations

### Vercel Blob Storage
- Free tier: 1GB storage, 100GB bandwidth/month
- Pro tier: $0.15/GB storage, $0.20/GB bandwidth

### Vercel KV Storage
- Free tier: 256MB storage, 3000 commands/month
- Pro tier: $0.20/100K commands

### ARK API
- Refer to BytePlus pricing documentation

## Performance Optimization

1. **Image CDN**: Vercel Blob provides automatic CDN distribution
2. **KV Caching**: Metadata is cached globally for fast reads
3. **Edge Functions**: API routes run on edge network for low latency

## Monitoring

Monitor your storage usage:
1. Go to "Storage" tab in Vercel Dashboard
2. View metrics for Blob and KV usage
3. Set up alerts for approaching limits
