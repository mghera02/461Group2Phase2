const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');

const app = express();
const port = 3000;
const upload = multer({ storage: multer.memoryStorage() });

const s3 = new AWS.S3({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
}); //aws setup

app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    if (!req.file.originalname.endsWith('.zip')) {
      return res.status(400).send('Invalid file format. Please upload a zip file.');
    }
    const params = {
      Bucket: 'your-s3-bucket-name',
      Key: req.file.originalname,
      Body: req.file.buffer,
    }; //aws s3 parameters

    s3.upload(params, (err: Error | null, data: AWS.S3.ManagedUpload.SendData) => {
        if (err) {
          console.error('S3 upload error:', err);
          return res.status(500).send('An error occurred while uploading the file.');
        }
        console.log('File uploaded to S3:', data.Location);
        res.status(200).send('File uploaded successfully!');
      });     
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
