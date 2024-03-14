const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { promisify } = require('util');
const ffprobe = promisify(ffmpeg.ffprobe);
const path = require('path');

async function generateThumbnail(videoFile, thumbnailPath, seekTime = '50%') {
    try {
        // Save the uploaded video file
        const videoPath = path.join(__dirname, '../public', videoFile.name);
        // const videoPath = `uploads/${videoFile.name}`;
        await videoFile.mv(videoPath);

        // Get video duration
        const duration = await getVideoDuration(videoPath);
        // Get video dimensions
        const dimensions = await getVideoDimensions(videoPath);

        // Calculate seek time
        const targetSeekTime = Math.min(duration * parseFloat(seekTime) / 100, duration - 1);

        // Generate thumbnail
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .on('error', reject)
                .on('end', () => resolve())
                .screenshots({
                    timestamps: [targetSeekTime],
                    folder: path.dirname(thumbnailPath),
                    filename: path.basename(thumbnailPath, path.extname(thumbnailPath)) + '.png',
                    size: `${dimensions.width}x${dimensions.height}`,
                });
        });

        console.log('Thumbnail generated successfully:', thumbnailPath);
        return thumbnailPath;
    } catch (error) {
        console.error('Error generating thumbnail:', error);
        throw error;
    }
}

async function getVideoDuration(videoPath) {
    try {
        const probeData = await ffprobe(videoPath);
        if (probeData && probeData.format && probeData.format.duration) {
            const duration = parseFloat(probeData.format.duration);
            return duration;
        } else {
            throw new Error('Duration not found in probe data');
        }
    } catch (error) {
        console.error('Error getting video duration:', error);
        throw error;
    }
}

async function getVideoDimensions(videoPath) {
    try {
        const probeData = await ffprobe(videoPath);
        if (probeData && probeData.streams && probeData.streams.length > 0) {
            const videoStream = probeData.streams.find(stream => stream.codec_type === 'video');
            if (videoStream && videoStream.width && videoStream.height) {
                return { width: videoStream.width, height: videoStream.height };
            }
        }
        throw new Error('Video dimensions not found');
    } catch (err) {
        console.error('Error getting video dimensions:', err);
        throw err; // Re-throw error for handling
    }
}

module.exports = {
    // videoThumbnail
    generateThumbnail
};
