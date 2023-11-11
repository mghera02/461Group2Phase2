import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const access_id = String(process.env.S3_);
const access_key = String(process.env.S3_);
const region = String(process.env.S3_);

// Set your AWS credentials and region
AWS.config.update({
  accessKeyId: access_id,
  secretAccessKey: access_key,
  region: region,
});

// Create an S3 instance
const s3 = new AWS.S3();
const BUCKET_NAME = "461s3bucket";

async function upload_package(package_id: number, file: Express.Multer.File) : Promise<string | null> {
    const file_content = file.buffer;
    const unique_filename = `package_ID_${package_id}`;

    const params: AWS.S3.PutObjectRequest = {
        Bucket: BUCKET_NAME,
        Key: unique_filename,
        Body: file_content,
      };
    
    try {
        await s3.upload(params).promise();
        const file_url = `https://${BUCKET_NAME}.s3.${AWS.config.region}.amazonaws.com/${unique_filename}`;
        console.log(`File uploaded successfully. URL: ${file_url}`);
    
        return file_url;
    } catch (error) {
        console.error('Error uploading file to S3:', error);
        return null;
    }
}

async function download_package(package_id: number) : Promise<Buffer | null> {
    const params = {
        Bucket: BUCKET_NAME,
        Key: `package_ID_${package_id}`
    }

    try {
        const file = await s3.getObject(params).promise();

        console.log(`File downloaded successfully.`);
        return file.Body as Buffer;
    } catch (error) {
        console.error('Error downloading file from S3:', error);
        return null;
    }
}

async function clear_s3_bucket() {
    const params = {
        Bucket: BUCKET_NAME,
    }

    try {
        const s3_objects = await s3.listObjects(params).promise();

        if (!s3_objects.Contents) {
            console.log('No S3 objects to delete!')
            return 
        }

        const delete_objects_params = {
            Bucket: BUCKET_NAME,
            Delete: { Objects: s3_objects.Contents.map(obj => ({ Key: obj.Key })) },
          };

        
    } catch (error) {
        console.error('Error deleting S3 objects:', error)
    }
}

export {
    upload_package,
    download_package,
    clear_s3_bucket,
}
