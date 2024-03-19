const videoProcessingService = require('./VideoProcessingService');

const file_Processing_Service = async(files, user) => {
    let images = [];
    let videos = [];

    if(Array.isArray(files)){
        files.forEach(file => {
            // Checking file type
            if(file.mimetype.startsWith('video')){
                videos.push(file)
            } else if(file.mimetype.startsWith('image')){
                images.push(file)
            }
        });
    } else {
        if(files.mimetype.startsWith('video')){
            videos.push(files)
        } else if(files.mimetype.startsWith('image')){
            images.push(files)
        };
    }

    const videoProcessing = await videoProcessingService(videos, user);

    return videoProcessing;
}


module.exports = file_Processing_Service;