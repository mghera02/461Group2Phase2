import express from 'express';
import multer from 'multer';
import AWS from 'aws-sdk';
import cors from "cors";

const app = express();
const port = 3000;
const upload = multer({ storage: multer.memoryStorage() });

const s3 = new AWS.S3({
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
}); //aws setup

app.use(cors());

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

    s3.upload(params, (err, data) => {
        if (err) {
          console.error('S3 upload error:', err);
          return res.status(500).send('An error occurred while uploading the file.');
        }
        console.log('File uploaded to S3:', data.Location);
        res.status(200).send('File uploaded successfully!');
      });          
  } catch (error) {
    console.error('Diff Error:', error);
    res.status(500).send('An error occurred.');
  }
});

app.get('/rate/:packageId', (req, res) => {
    try {
      const packageId = req.params.packageId;

      //S3 getObject parameters
      const s3Params = {
        Bucket: 'your-s3-bucket-name',
        Key: packageId + '.json', //assuming each rate data is stored as a JSON object
      };
      s3.getObject(s3Params, (err, data) => { //request to AWS S3 to retrieve the rate information
        if (err) {
          console.error('S3 getObject error:', err);
          return res.status(500).send('An error occurred while fetching the rate data.');
        }
        // Parse the rate data from the response
        const rateData = JSON.parse(data.Body?.toString() || '');
        if (!rateData || !rateData.rate) {
          return res.status(404).send('Rate data not found.');
        }
        res.status(200).json(rateData);
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('An error occurred.');
    }
  });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
