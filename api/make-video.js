const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const axios = require('axios');

module.exports = async function handler(req, res) {
  // Enable CORS for n8n
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageUrl, audioUrl, duration = 8, companyName = 'Company', day = 1 } = req.body;

  if (!imageUrl || !audioUrl) {
    return res.status(400).json({ 
      error: 'Missing required fields: imageUrl and audioUrl are required' 
    });
  }

  try {
    const tempDir = tmpdir();
    const outputPath = path.join(tempDir, `meme_video_${Date.now()}.mp4`);
    const imagePath = path.join(tempDir, `meme_${Date.now()}.jpg`);
    const audioPath = path.join(tempDir, `audio_${Date.now()}.mp3`);

    // Download image and audio files
    console.log('Downloading files...');
    
    const [imageResponse, audioResponse] = await Promise.all([
      axios.get(imageUrl, { responseType: 'stream' }),
      axios.get(audioUrl, { responseType: 'stream' })
    ]);

    // Save files to temp directory
    const imageStream = fs.createWriteStream(imagePath);
    const audioStream = fs.createWriteStream(audioPath);

    imageResponse.data.pipe(imageStream);
    audioResponse.data.pipe(audioStream);

    await Promise.all([
      new Promise((resolve, reject) => {
        imageStream.on('finish', resolve);
        imageStream.on('error', reject);
      }),
      new Promise((resolve, reject) => {
        audioStream.on('finish', resolve);
        audioStream.on('error', reject);
      })
    ]);

    console.log('Files downloaded, starting video generation...');

    // Generate video with FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg()
        .setFfmpegPath(ffmpegPath)
        .addInput(imagePath)
        .inputOptions(['-loop', '1', '-t', duration.toString()])
        .addInput(audioPath)
        .outputOptions([
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-pix_fmt', 'yuv420p',
          '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,zoompan=z=\'min(zoom+0.0015,1.5)\':d=125',
          '-shortest',
          '-movflags', '+faststart'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Processing: ' + progress.percent + '% done');
        })
        .on('end', () => {
          console.log('Video generation completed');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });

    // Read the generated video file
    const videoBuffer = fs.readFileSync(outputPath);

    // Clean up temp files
    [imagePath, audioPath, outputPath].forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupErr) {
        console.warn('Failed to cleanup file:', filePath, cleanupErr);
      }
    });

    // Return the video file
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${companyName}_meme_day${day}.mp4"`);
    res.setHeader('Content-Length', videoBuffer.length);
    res.send(videoBuffer);

  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({ 
      error: 'Failed to generate video', 
      details: error.message 
    });
  }
}
