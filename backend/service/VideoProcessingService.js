const cloudinary = require("cloudinary").v2;
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
ffmpeg.setFfmpegPath('C:\\ffmpeg-2024-03-11-git-3d1860ec8d-full_build\\bin\\ffmpeg.exe');
ffmpeg.setFfprobePath('C:\\ffmpeg-2024-03-11-git-3d1860ec8d-full_build\\bin\\ffprobe.exe');

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

const cloud_Thumbnail_Generator = async (videoUrl) => {
    try {

        // Get video dimensions
        const { width, height } = await getVideoDimensions(videoUrl);
        // Fetch video duration
        const videoDuration = await getVideoDuration(videoUrl);

        // Calculate the time offset for 10% of the video duration
        const timeOffset = videoDuration * 0.5;
        console.log(timeOffset)

        // Define output folder for the thumbnail
        const outputFolder = path.resolve(__dirname, 'public');

        // Ensure that the output folder exists
        if (!fs.existsSync(outputFolder)) {
            fs.mkdirSync(outputFolder, { recursive: true });
        }

        console.log('Inside try block', videoUrl);
        const thumbnailPath = path.join(outputFolder, 'thumbnail.png');
        console.log('Thumbnail path:', thumbnailPath);

        const thumbnailBuffer = await new Promise((resolve, reject) => {
            ffmpeg(videoUrl)
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .inputOptions('-ss', timeOffset) // Seek to the 10% frame
                .outputOptions(['-vframes 1', '-vf', `scale=${width}:${height}`])
                // .outputOptions(['-vframes 1', `-vf scale=${width}:${height}`])
                .output(thumbnailPath) // Specify the output file path directly
                .run();
        });


        // await new Promise((resolve, reject) => {
        //     ffmpeg(videoUrl)
        //     // .setFfmpegPath('/path/to/ffmpeg') // Update with the correct path to ffmpeg executable
        //     .input(videoUrl)
        //     .on('end', () => resolve())
        //     .on('error', (err) => reject(err))
        //     .outputOptions('-vf', 'thumbnail,scale=320:240')
        //     .outputOptions('-frames:v 1')
        //     .output(thumbnailPath);
        // });

        console.log('Thumbnail generated successfully!');

        // Upload thumbnail to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(thumbnailPath, {
            folder: 'thumbnails'
        });

        // Extract URL and public ID from the upload result
        const thumbnailUrl = uploadResult.secure_url;
        const thumbnailPublicId = uploadResult.public_id;

        // Return the URL and public ID of the uploaded thumbnail
        return { url: thumbnailUrl, public_id: thumbnailPublicId };
    } catch (error) {
        console.error('Error generating thumbnail:', error);
        return null;
    }
}


async function processVideo(video) {
    const thumbnailUrl = await cloud_Thumbnail_Generator(video.url);
    if (thumbnailUrl) {
        video.thumbnailUrl = thumbnailUrl;
    }
    return video;
}

async function processVideos(videoArray) {
    const processedVideos = [];
    for (const video of videoArray) {
        const processedVideo = await processVideo(video);
        processedVideos.push(processedVideo);
    }
    return processedVideos;
}

const videoProcessingService = async (files) => {
    try {
        const videos = await cloud_Video_Uploader(files);
        const processedVideos = await processVideos(videos.results);
        console.log('Processed videos:', processedVideos);
        return { success: true, message: 'Video processing completed', processedVideos };
    } catch (error) {
        console.error('Error processing videos:', error);
        return { success: false, message: 'An error occurred during video processing' };
    }
}

module.exports = videoProcessingService;