// Module Imports
const express = require("express");
const path = require('path')
// const cors = require("cors");

const morgan = require("morgan");

const fileUpload = require("express-fileupload");

// Configurations
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));

const VideoProcessing = require('./service/VedioProcessing');
app.post('/file/upload', async (req, res, next) => {

    try {
        if (!req.files || !req.files.vdo) {
            return res.status(400).send('No video uploaded');
        }

        const videoFile = req.files.vdo;
        const thumbnailPath = path.join(__dirname, '/public', 'thumbnail.png');; // Path for the generated thumbnail

        await VideoProcessing.generateThumbnail(videoFile, thumbnailPath);
        res.send('Thumbnail generated successfully');
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('Internal server error');
    }
})

app.listen(5000, function () {
    console.log(`Listening on port ${5000}`);
});
