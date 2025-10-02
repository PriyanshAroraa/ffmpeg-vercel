# FFmpeg Meme Video API on Vercel

This project provides a serverless API endpoint for generating meme videos using FFmpeg, designed to work with n8n automation workflows.

## Features

- ✅ Generates 1080x1920 videos (perfect for TikTok/YouTube Shorts)
- ✅ Combines meme images with background music
- ✅ Adds smooth zoom-in effect
- ✅ Works with n8n.cloud (no self-hosting needed)
- ✅ Automatic cleanup of temporary files
- ✅ CORS enabled for cross-origin requests

## Quick Deploy to Vercel

1. **Fork/Clone this repository**
2. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```
3. **Deploy**:
   ```bash
   vercel --prod
   ```
4. **Get your API URL**: `https://your-project-name.vercel.app/api/make-video`

## API Usage

### Endpoint
```
POST https://your-project-name.vercel.app/api/make-video
```

### Request Body
```json
{
  "imageUrl": "https://example.com/meme.jpg",
  "audioUrl": "https://example.com/music.mp3",
  "duration": 8,
  "companyName": "Your Company",
  "day": 1
}
```

### Parameters
- `imageUrl` (required): Direct URL to meme image
- `audioUrl` (required): Direct URL to background music
- `duration` (optional): Video duration in seconds (default: 8)
- `companyName` (optional): For filename (default: "Company")
- `day` (optional): For filename (default: 1)

### Response
Returns a video file (MP4) with proper headers for download.

## n8n Integration

Replace your FFmpeg Execute Command node with an HTTP Request node:

**Node Type**: HTTP Request
**Method**: POST
**URL**: `https://your-project-name.vercel.app/api/make-video`
**Body**:
```json
{
  "imageUrl": "{{$json.meme_image_url}}",
  "audioUrl": "{{$json.music_url}}",
  "duration": 8,
  "companyName": "{{$json.company_name}}",
  "day": "{{$json.day}}"
}
```
**Response Format**: File (Binary)
**Binary Property**: data

## Technical Details

- Uses `ffmpeg-static` for serverless FFmpeg binary
- Downloads files to `/tmp` directory
- Generates videos with zoom-pan effect
- Automatically cleans up temporary files
- 60-second timeout (Vercel Pro/Enterprise)

## Cost

- **Vercel Free**: 100GB-hours/month
- **Vercel Pro**: $20/month for unlimited
- Each video generation uses ~0.1-0.5 GB-hours depending on duration

## Troubleshooting

1. **Timeout errors**: Upgrade to Vercel Pro for 60-second limit
2. **File size issues**: Ensure input files are reasonable size (<10MB each)
3. **CORS errors**: API includes CORS headers for n8n integration

## Example n8n Workflow

1. Form Trigger → Company info
2. OpenAI → Generate meme ideas
3. RapidAPI → Find meme templates
4. RapidAPI → Generate meme image
5. **HTTP Request → This Vercel API** (replaces FFmpeg)
6. YouTube → Upload video

Perfect for automated meme marketing campaigns! 🚀
