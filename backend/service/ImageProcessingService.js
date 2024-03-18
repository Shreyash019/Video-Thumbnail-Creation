const videoProcessingService = require('./VideoProcessingService');

const image_Processing_Service = async(files) => {
    let images = [];
    let videos = [];

    files.forEach(file => {
        // Checking file type
        if(file.mimetype.startsWith('video')){
            videos.push(file)
        } else if(file.mimetype.startsWith('image')){
            images.push(file)
        }
    });

    const videoProcessing = await videoProcessingService(videos);

    return videoProcessing;
}


module.exports = image_Processing_Service;