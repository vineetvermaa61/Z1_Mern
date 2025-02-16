// // server/routes/upload.js
// const express = require('express');
// const multer = require('multer');
// const sharp = require('sharp');
// const axios = require('axios');
// const { TwitterApi } = require('twitter-api-v2');

// const router = express.Router();

// // Configure Multer to store file in memory
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// // Predefined sizes (can be made configurable)
// const defaultSizes = {
//   '300x250': { width: 300, height: 250 },
//   '728x90': { width: 728, height: 90 },
//   '160x600': { width: 160, height: 600 },
//   '300x600': { width: 300, height: 600 },
// };

// // Middleware to check authentication
// function ensureAuth(req, res, next) {
//   if (req.isAuthenticated()) {
//     return next();
//   } else {
//     return res.status(401).json({ error: 'User not authenticated' });
//   }
// }

// // Function to upload an image buffer to Imgur
// async function uploadToImgur(buffer) {
//   const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;
//   // Convert buffer to base64 string
//   const base64Image = buffer.toString('base64');
//   try {
//     const response = await axios.post(
//       'https://api.imgur.com/3/image',
//       { image: base64Image, type: 'base64' },
//       { headers: { Authorization: `Client-ID ${IMGUR_CLIENT_ID}` } }
//     );
//     if (response.data && response.data.success) {
//       return response.data.data.link;
//     } else {
//       throw new Error('Imgur upload failed');
//     }
//   } catch (error) {
//     console.error('Error uploading to Imgur:', error.response ? error.response.data : error.message);
//     throw error;
//   }
// }

// // POST /upload endpoint
// router.post('/', ensureAuth, upload.single('image'), async (req, res) => {
//   try {
//     if (!req.file) {
//       console.error("No file was provided in the request.");
//       return res.status(400).json({ error: 'No image file provided' });
//     }

//     console.log("File received:", req.file.originalname, req.file.mimetype, req.file.size);

//     // Use custom sizes if provided; otherwise, use defaults
//     const sizes = req.body.sizes ? JSON.parse(req.body.sizes) : defaultSizes;
//     let imgurLinks = {};

//     // Resize and upload image for each defined size
//     for (const [key, { width, height }] of Object.entries(sizes)) {
//       console.log(`Resizing image to ${key} with dimensions ${width}x${height}`);
//       const resizedBuffer = await sharp(req.file.buffer)
//         .resize(width, height)
//         .toFormat('png') // output as PNG
//         .toBuffer();
//       console.log(`Finished resizing ${key}, buffer length: ${resizedBuffer.length}`);

//       console.log(`Uploading ${key} image to Imgur...`);
//       const imgurUrl = await uploadToImgur(resizedBuffer);
//       imgurLinks[key] = imgurUrl;
//       console.log(`Uploaded ${key} image to Imgur. URL: ${imgurUrl}`);
//     }

//     // Compose tweet text containing the Imgur URLs
// let tweetText = 'Here are my resized images:\n';
// for (const [key, url] of Object.entries(imgurLinks)) {
//   tweetText += `${key}: ${url}\n`;
// }

// // Initialize Twitter client with the user’s tokens
// const userClient = new TwitterApi({
//   appKey: process.env.TWITTER_CONSUMER_KEY,
//   appSecret: process.env.TWITTER_CONSUMER_SECRET,
//   accessToken: req.user.token,
//   accessSecret: req.user.tokenSecret,
// });

// console.log("Posting tweet with text:", tweetText);
// // Use the v2 endpoint instead of v1 to post the tweet
// await userClient.v2.tweet(tweetText);


//     res.json({ message: 'Image processed and tweet posted successfully!', imgurLinks });
//   } catch (error) {
//     console.error("Error in /upload route:", error);
//     res.status(500).json({ error: error.message || 'An error occurred during processing' });
//   }
// });

// module.exports = router;




// server/routes/upload.js
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { TwitterApi } = require('twitter-api-v2');

const router = express.Router();

// Configure Multer to store file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Predefined sizes (can be made configurable)
const defaultSizes = {
  '300x250': { width: 300, height: 250 },
  '728x90': { width: 728, height: 90 },
  '160x600': { width: 160, height: 600 },
  '300x600': { width: 300, height: 600 },
};

// Middleware to check authentication
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.status(401).json({ error: 'User not authenticated' });
  }
}

// POST /upload endpoint
router.post('/', ensureAuth, upload.single('image'), async (req, res) => {
  try {
    // Check if a file was provided
    if (!req.file) {
      console.error("No file was provided in the request.");
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    console.log("File received:", req.file.originalname, req.file.mimetype, req.file.size);
    
    // Allow client to send custom sizes; otherwise use defaults
    const sizes = req.body.sizes ? JSON.parse(req.body.sizes) : defaultSizes;
    let resizedImages = {};

    // Resize image for each defined size
    for (const [key, { width, height }] of Object.entries(sizes)) {
      console.log(`Resizing image to ${key} with dimensions ${width}x${height}`);
      const resizedBuffer = await sharp(req.file.buffer)
        .resize(width, height)
        .toFormat('png') // ensure output is png
        .toBuffer();
      resizedImages[key] = resizedBuffer;
      console.log(`Finished resizing ${key}, buffer length: ${resizedBuffer.length}`);
    }

    // Initialize Twitter client with the user’s tokens
    const userClient = new TwitterApi({
      appKey: process.env.TWITTER_CONSUMER_KEY,
      appSecret: process.env.TWITTER_CONSUMER_SECRET,
      accessToken: req.user.token,
      accessSecret: req.user.tokenSecret,
    });

    // Upload each resized image to Twitter and collect media IDs
    let mediaIds = {};
    for (const [key, buffer] of Object.entries(resizedImages)) {
      console.log(`Uploading ${key} image...`);
      const mediaId = await userClient.v1.uploadMedia(buffer, { type: 'png' });
      mediaIds[key] = mediaId;
      console.log(`Uploaded ${key} image. Media ID: ${mediaId}`);
    }

    // Post one tweet attaching all images
    const allMediaIds = Object.values(mediaIds);
    console.log("Posting tweet with media IDs:", allMediaIds);
    await userClient.v1.tweet('Here are my resized images!', {
      media_ids: allMediaIds.join(','),
    });

    res.json({ message: 'Image uploaded, resized, and posted to Twitter successfully!', mediaIds });
  } catch (error) {
    // Log the full error details for debugging
    console.error("Error in /upload route:", error);
    res.status(500).json({ error: error.message || 'An error occurred during processing' });
  }
});

module.exports = router;
