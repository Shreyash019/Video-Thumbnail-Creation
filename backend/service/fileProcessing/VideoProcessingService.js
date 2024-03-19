const cloudinary = require("cloudinary").v2;
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
ffmpeg.setFfmpegPath('C:\\ffmpeg-2024-03-11-git-3d1860ec8d-full_build\\bin\\ffmpeg.exe');
ffmpeg.setFfprobePath('C:\\ffmpeg-2024-03-11-git-3d1860ec8d-full_build\\bin\\ffprobe.exe');

// Video Upload To Cloud Service
const cloud_Video_Uploader = async (files, folder = 'temporary') => {
    try {
        if (!files || files.length === 0) {
            return { success: false, message: 'No files provided' };
        }
        const promises = files.map(file => new Promise((resolve, reject) => {
            let tempImg = {
                fileType: file.mimetype.split('/')[0].toLowerCase(),
                name: file.name,
                public_id: undefined,
                url: undefined
            }
            if (tempImg.fileType === 'video') {
                cloudinary.uploader.upload_stream({ folder, resource_type: 'video' },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        }
                        tempImg.public_id = result.public_id;
                        tempImg.url = result.url;
                        resolve(tempImg);
                    }
                ).end(file.data);
            }
        })
        );
        const results = await Promise.all(promises);
        return { success: true, results };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'An error occurred during upload' };
    }
}

// Function For Getting Video Dimensions
const getVideoDimensions = async (videoUrl) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoUrl, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                const width = metadata.streams[0].width;
                const height = metadata.streams[0].height;
                resolve({ width, height });
            }
        });
    });
};

// Function For Getting  Video Duration
const getVideoDuration = (videoUrl) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoUrl, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                const durationInSeconds = metadata.format.duration;
                resolve(durationInSeconds);
            }
        });
    });
};

// Function For Generating Thumbnail For Video
const cloud_Thumbnail_Generator = async (videoUrl, folder = 'socio', user = 'temporary', timeFrame = 1) => {
    try {

        // Get video dimensions
        const { width, height } = await getVideoDimensions(videoUrl);
        // Fetch video duration
        const videoDuration = await getVideoDuration(videoUrl);

        // Calculate the time offset for the video duration
        const timeOffset = timeFrame !== 1 ? timeFrame : videoDuration ? videoDuration * 0.5 : 1;

        // Define output folder for the thumbnail
        const outputFolder = path.resolve(__dirname, 'public');

        // Ensure that the output folder exists
        if (!fs.existsSync(outputFolder)) {
            fs.mkdirSync(outputFolder, { recursive: true });
        }

        const thumbnailPath = path.join(outputFolder, `${user}.png`);

        const thumbnailBuffer = await new Promise((resolve, reject) => {
            ffmpeg(videoUrl)
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .inputOptions('-ss', timeOffset) // Seek to the 10% frame
                .outputOptions(['-vframes 1', '-vf', `scale=${width}:${height}`])
                .output(thumbnailPath)
                .run();
        });

        // Upload thumbnail to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(thumbnailPath, {
            folder: folder
        });

        // Extract URL and public ID from the upload result
        const thumbnailUrl = uploadResult.secure_url;
        const thumbnailPublicId = uploadResult.public_id;

        // Delete local thumbnail file after successful upload
        fs.unlinkSync(thumbnailPath);


        // Return the URL and public ID of the uploaded thumbnail
        return { url: thumbnailUrl, public_id: thumbnailPublicId };
    } catch (error) {
        return null;
    }
}

// Function For Processing Single Video
async function processVideo(video, folder = 'socio', user = 'temporary') {
    const thumbnailUrl = await cloud_Thumbnail_Generator(video.url, folder, user);
    if (thumbnailUrl) {
        video.thumbnailUrl = thumbnailUrl;
    }
    return video;
}

// Function For Processing Video Array
async function processVideos(videoArray, folder = 'socio', user = 'temporary') {
    const processedVideos = [];
    for (const video of videoArray) {
        const processedVideo = await processVideo(video, folder, user);
        processedVideos.push(processedVideo);
    }
    return processedVideos;
}

// Video Processing Video Entry Point
const videoProcessingService = async (files, user = 'temporary') => {
    try {
        // Validate user ID
        if (user && typeof user !== 'string') {
            return res.status(400).json({ success: false, message: `Provide user unique ID!` })
        }

        // Define folder path based on user ID
        const folder = user ? 'socio/' + user : 'socio/';

        // Upload videos to Cloudinary
        const videos = await cloud_Video_Uploader(files, folder);

        // Process uploaded videos
        const processedVideos = await processVideos(videos.results, folder, user);

        // Return success message and processed videos
        return { success: true, message: 'Video processing completed', processedVideos };
    } catch (error) {
        // Return error message if any exception occurs
        return { success: false, message: 'An error occurred during video processing' };
    }
}

module.exports = videoProcessingService;