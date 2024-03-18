const ffmpeg = require('fluent-ffmpeg');
const AWS = require('aws-sdk'); // For AWS S3
const cloudinary = require('cloudinary').v2; // For Cloudinary

// Configure AWS SDK
AWS.config.update({ region: 'your-region', accessKeyId: 'your-access-key-id', secretAccessKey: 'your-secret-access-key' });
const s3 = new AWS.S3();

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'your-cloud-name',
  api_key: 'your-api-key',
  api_secret: 'your-api-secret'
});

// Function to generate thumbnail from video URL
async function generateThumbnailAndUploadToCloud(videoUrl, cloudService) {
  try {
    // Generate thumbnail using ffmpeg
    const thumbnailBuffer = await new Promise((resolve, reject) => {
      ffmpeg(videoUrl)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .screenshots({
          count: 1, // Number of screenshots to take
          filename: 'thumbnail.png', // Filename for the thumbnail
          folder: '/tmp' // Folder to save the thumbnail
        });
    });

    // Upload thumbnail to cloud storage
    let thumbnailUrl;
    if (cloudService === 'AWS') {
      const uploadResult = await s3.upload({
        Bucket: 'your-bucket-name',
        Key: 'thumbnail.png',
        Body: thumbnailBuffer,
        ACL: 'public-read'
      }).promise();
      thumbnailUrl = uploadResult.Location;
    } else if (cloudService === 'Cloudinary') {
      const uploadResult = await cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
        if (error) {
          throw error;
        }
        thumbnailUrl = result.secure_url;
      }).end(thumbnailBuffer);
    }

    console.log('Thumbnail generated and uploaded successfully!');
    return thumbnailUrl;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
}

// Function to process a single video object
async function processVideo(video) {
  const thumbnailUrl = await generateThumbnailAndUploadToCloud(video.url, 'AWS'); // Replace 'AWS' with 'Cloudinary' if needed
  if (thumbnailUrl) {
    video.thumbnailUrl = thumbnailUrl;
  }
  return video;
}

// Function to process an array of video objects
async function processVideos(videoArray) {
  const processedVideos = [];
  for (const video of videoArray) {
    const processedVideo = await processVideo(video);
    processedVideos.push(processedVideo);
  }
  return processedVideos;
}

// Example array of video objects
const videoArray = [
  { public_id: '123456789', url: 'https://your-cloud-service-provider.com/video1.mp4', name: 'video1.mp4' },
  { public_id: '987654321', url: 'https://your-cloud-service-provider.com/video2.mp4', name: 'video2.mp4' }
];

// Process the array of video objects
processVideos(videoArray).then((processedVideos) => {
  console.log('Processed videos:', processedVideos);
}).catch((error) => {
  console.error('Error processing videos:', error);
});


const cloud_Thumbnail_Generatora = async (videoUrl) => {
  console.log(videoUrl)
  try {
      console.log("@@@@@@@@".videoUrl)
      // const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
      // console.log("#######". videoResponse)
      // const videoBuffer = Buffer.from(videoResponse.data);
      // console.log("$$$$$$$". videoBuffer)

      // if (videoBuffer.length === 0) {
      //     throw new Error('Empty video file');
      // }

      // const thumbnailBuffer = await new Promise((resolve, reject) => {
      //     ffmpeg(videoBuffer)
      //         .on('end', () => resolve())
      //         .on('error', (err) => reject(err))
      //         .outputOptions(['-vframes 1', '-vf scale=320:240'])
      //         .screenshot({
      //             count: 1,
      //             filename: 'thumbnail.png',
      //             folder: '/public'
      //         });
      // });

      // // const uploadResult = await cloudinary.uploader.upload('thumbnail.png', {
      // //     resource_type: 'image',
      // //     folder: 'thumbnails'
      // // });

      // console.log('Thumbnail generated and uploaded successfully!');
      // return uploadResult.secure_url;
      return 'trsaf'
  } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
  }
}
