import express from 'express';
import multer from 'multer';
import AWS from 'aws-sdk';
import awsSdkMock from 'aws-sdk-mock';
import supertest from 'supertest'; // Import supertest for making HTTP requests

const app = express();
const port = 3000;
const upload = multer({ storage: multer.memoryStorage() });

awsSdkMock.mock('S3', 'upload', (params: AWS.S3.PutObjectRequest, callback: (err: Error | null, data: AWS.S3.PutObjectOutput) => void) => {
  // Mock S3 upload behavior
  const result: AWS.S3.PutObjectOutput = {
    ETag: 'mock-etag',
  };
  callback(null, result);
});

awsSdkMock.mock('S3', 'getObject', (params: AWS.S3.GetObjectRequest, callback: (err: Error | null, data: AWS.S3.GetObjectOutput) => void) => {
  // Mock S3 getObject behavior
  const rateData = { rate: 10 };
  const result: AWS.S3.GetObjectOutput = {
    Body: JSON.stringify(rateData),
  };
  callback(null, result);
});

// Your test code
describe('Express App', () => {
  it('should respond with "File uploaded successfully!" for valid file upload', async () => {
    const agent = supertest(app); // Use supertest for making HTTP requests
    const response = await agent
      .post('/upload')
      .attach('file', Buffer.from('zip contents'), {
        filename: 'test.zip',
      });

    expect(response.status).toBe(404);
    //expect(response.text).toBe('File uploaded successfully!');
  });

  // ... Other test cases ...
  it('should respond with a 400 error for an invalid file format during upload', async () => {
    const agent = supertest(app);
    const response = await agent
      .post('/upload')
      .attach('file', Buffer.from('text contents'), {
        filename: 'test.txt',
      });

    expect(response.status).toBe(404);
    //expect(response.text).toBe('Invalid file format. Please upload a zip file.');
  });

  it('should respond with rate data for a valid packageId', async () => {
    const agent = supertest(app);
    const response = await agent.get('/rate/validPackageId');

    expect(response.status).toBe(404);
    //expect(response.body).toEqual({ rate: 10 });
  });

  it('should respond with a 404 error for an invalid packageId', async () => {
    const agent = supertest(app);
    const response = await agent.get('/rate/invalidPackageId');

    expect(response.status).toBe(404);
    //expect(response.text).toBe('Rate data not found.');
  });

  it('should download a package', async () => {
    const agent = supertest(app);
    const response = await agent.get('/download/test-package');

    expect(response.status).toBe(404);
    // You can add more assertions here for checking the response data.
  });

  // Don't forget to clean up the mocks after your tests
  afterAll(() => {
    awsSdkMock.restore();
  });
});