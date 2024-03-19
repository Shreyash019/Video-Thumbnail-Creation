// Module Imports
const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/.env" });
const path = require('path');
const cloudinary = require("cloudinary").v2;
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

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

const file_Processing_Service = require('./service/fileProcessing/ImageProcessingService');

app.post('/file/upload', async (req, res, next) => {

    try {
        if (!req.files || !req.files.uploadFile) {
            return res.status(400).send('No video uploaded');
        }

        const response = await file_Processing_Service(req.files.uploadFile, 'n8vt8vbbyv8')

        console.log(response)

        res.status(200).json({
            success: true,
            message: 'Processed Files',
            data: response
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('Internal server error');
    }
})

app.listen(5000, function () {
    console.log(`Listening on port ${5000}`);
});
