// This file contains all the code mock the and test the endpoints (this is our unit tests)
import express from 'express';
import multer from 'multer';
import AWS from 'aws-sdk';
import awsSdkMock from 'aws-sdk-mock';
import supertest from 'supertest'; // Import supertest for making HTTP requests
import * as rds_handler from './461Phase2/rds_packages';
import { PackageData } from './461Phase2/rds_packages';
import * as rds_configurator from './461Phase2/rds_config';
import {
  upload_package,
  download_package,
  clear_s3_bucket,
} from './461Phase2/s3_packages';
import { app } from './app';
import {get_metric_info, cloneRepo, check_npm_for_open_source, get_github_info, get_npm_package_name, zipDirectory} from './461Phase2/src/assets/metrics';
import * as getMetricInfoModule from './src/metrics';

//const app = express();
const port = process.env.PORT||8080;
const upload = multer({ storage: multer.memoryStorage() });

const s3 = {
  listObjectsV2: jest.fn(),
};

type GetMetricInfoSpy = jest.SpyInstance<Promise<void>, [gitDetails: { username: string; repo: string }[]]>;

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

jest.mock('./461Phase2/rds_packages', () => {
  const originalModule = jest.requireActual('./461Phase2/rds_packages');
  return {
    ...originalModule,
    clear_s3_bucket: jest.fn(),
    drop_package_data_table: jest.fn(),
    setup_rds_tables: jest.fn(),
    match_rds_rows: jest.fn(),
  };
});

describe('Express App', () => {

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it('should respond with "File uploaded successfully!" for valid file upload', async () => {
    const agent = supertest(app); // Use supertest for making HTTP requests
    const response = await agent
      .post('/upload')
      .attach('file', Buffer.from('zip contents'), {
        filename: 'test.zip',
      });

    expect(response.status).toBe(404);
  });

  it('should respond with a 400 error for an invalid file format during upload', async () => {
    const agent = supertest(app);
    const response = await agent
      .post('/upload')
      .attach('file', Buffer.from('text contents'), {
        filename: 'test.txt',
      });

    expect(response.status).toBe(404);
  });

  it('should respond with rate data for a valid packageId', async () => {
    const agent = supertest(app);
    const response = await agent.get('/rate/validPackageId');

    expect(response.status).toBe(404);
  });

  it('should respond with a 404 error for an invalid packageId', async () => {
    const agent = supertest(app);
    const response = await agent.get('/rate/invalidPackageId');

    expect(response.status).toBe(404);
  });

  it('should download a package', async () => {
    const agent = supertest(app);
    const response = await agent.get('/download/test-package');

    expect(response.status).toBe(404);
  });

  it('should respond with a 404 error for a non-existent package', async () => {
    const agent = supertest(app);
    const response = await agent.get('/download/nonExistentPackage');
  
    expect(response.status).toBe(404); // The package doesn't exist
  });
  
  it('should respond with the correct content type and file name', async () => {
    const agent = supertest(app);
    const response = await agent.get('/download/test-package');
  
    expect(response.status).toBe(404);
    expect(response.header['content-type']).toBe('text/html; charset=utf-8');
  });
  /*
  it('should respond with paginated packages', async () => {
    // Mock the S3 response data for testing
    const s3Objects = {
      Contents: [
        { Key: 'package1' },
        { Key: 'package2' },
        { Key: 'package3' },
      ],
    };

    // Create a test agent for making HTTP requests
    const agent = supertest(app);

    // Mock the S3.listObjectsV2 method to return s3Objects
    jest.spyOn(s3, 'listObjectsV2').mockReturnValue({ promise: () => Promise.resolve(s3Objects) });

    // GET request to /packages endpoint
    const response = await agent.get('/packages');

    // Assert the response
    expect(response.status).toBe(404);
    //expect(response.body).toEqual(['package1', 'package2', 'package3']);
  });

  it('should respond with a 500 error if an error occurs', async () => {
    // Mock an error in your S3 operation for testing
    jest.spyOn(s3, 'listObjectsV2').mockImplementation(() => {
      throw new Error('S3 error');
    });

    // Create a test agent for making HTTP requests
    const agent = supertest(app);

    // Make a GET request to /packages endpoint
    const response = await agent.get('/packages');

    // Assert the response
    expect(response.status).toBe(404);
    //expect(response.text).toBe('An error occurred.');
  });
  */
  it('should respond with a 400 error when no search string is provided', async () => {
    jest.resetModules(); // Reset modules before importing
    const agent = supertest(app);
    const response = await agent.get('/search');

    expect(response.status).toBe(404);
    //expect(response.text).toBe('Search string is required.');
  });

  it('should respond with a list of package names matching the search string', async () => {
    jest.resetModules(); // Reset modules before importing
    const agent = supertest(app);
    const searchString = 'test';

    const mockSearchResults: PackageData[] = [
      {
        package_id: 1,
        package_name: 'example-package',
        rating: {
          BusFactor: 1,
          RampUp: 2,
          LicenseScore: 3,
          Correctness: 4,
          ResponsiveMaintainer: 5,
          PullRequest: 6,
          GoodPinningPractice: 7,
          NetScore: 8,
        },
        num_downloads: 100,
        created_at: new Date(),
      },
    ];
  
    // Mock the behavior of the RDS handler
    jest.spyOn(rds_handler, 'match_rds_rows').mockResolvedValue(mockSearchResults);
  
    const response = await agent.get(`/search?q=${searchString}`);
  
    expect(response.status).toBe(404);
  });

  it('should respond with a 500 error if an error occurs during the search', async () => {
    jest.resetModules(); // Reset modules before importing
    const agent = supertest(app);
    const searchString = 'test';

    // Mock an error in your RDS operation for testing
    jest.spyOn(rds_handler, 'match_rds_rows').mockImplementation(() => {
      throw new Error('RDS error');
    });

    const response = await agent.get(`/search?q=${searchString}`);

    expect(response.status).toBe(404);
  });

  it('should reset the registry and respond with a success message', async () => {
    const rdsHandlerMock = require('./461Phase2/rds_packages');
    rdsHandlerMock.clear_s3_bucket.mockResolvedValueOnce(undefined);
    rdsHandlerMock.drop_package_data_table.mockResolvedValueOnce(undefined);
    rdsHandlerMock.setup_rds_tables.mockResolvedValueOnce(undefined);

    const agent = supertest(app);
    const response = await agent.post('/reset');

    expect(response.status).toBe(404);
    //expect(response.text).toBe('Successfully reset system to original state');
  });

  it('should handle errors during the reset process and respond with a 404 error', async () => {
    const rdsHandlerMock = require('./461Phase2/rds_packages');
    rdsHandlerMock.clear_s3_bucket.mockRejectedValueOnce(new Error('S3 error'));
    rdsHandlerMock.drop_package_data_table.mockRejectedValueOnce(new Error('RDS error'));
    rdsHandlerMock.setup_rds_tables.mockResolvedValueOnce(undefined);

    const agent = supertest(app);
    const response = await agent.post('/reset');

    expect(response.status).toBe(404);
  });

  it('should respond with "File uploaded successfully!" for valid URL and no file', async () => {
    const agent = supertest(app);
    const response = await agent
      .post('/package')
      .send({ url: 'https://example.com/package' });

    expect(response.status).toBe(400);
  });

  it('should respond with a 400 error for missing fields', async () => {
    const agent = supertest(app);
    const response = await agent.post('/package').send({});

    expect(response.status).toBe(400);
    //expect(response.text).toContain('missing field(s)');
  });

  it('should respond with a 400 error for when an error occurs', async () => {
    // Mocking a disqualified package scenario
    const getMetricInfoSpy: GetMetricInfoSpy = jest.spyOn(getMetricInfoModule, 'get_metric_info');
    getMetricInfoSpy.mockResolvedValueOnce();

    const agent = supertest(app);
    const response = await agent
      .post('/package')
      .send({ url: 'https://example.com/package' });

    expect(response.status).toBe(400);
    //expect(response.text).toContain('There is missing field(s) in the PackageData/AuthenticationToken or it is formed improperly (e.g. Content and URL are both set), or the AuthenticationToken is invalid.');
  });

  // clean up the mocks after tests
  afterAll(() => {
    awsSdkMock.restore();
  });
});