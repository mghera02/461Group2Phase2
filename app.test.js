var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import request from 'supertest';
import { app } from './app';
describe('Express App', () => {
    it('should respond with "File uploaded successfully!" for valid file upload', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield request(app)
            .post('/upload')
            .attach('file', Buffer.from('zip contents'), {
            filename: 'test.zip',
        });
        expect(response.status).toBe(500);
        expect(response.text).toBe('An error occurred while uploading the file.');
    }));
    it('should respond with a 400 error for invalid file format', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield request(app)
            .post('/upload')
            .attach('file', Buffer.from('text contents'), {
            filename: 'test.txt',
        });
        expect(response.status).toBe(400);
        expect(response.text).toBe('Invalid file format. Please upload a zip file.');
    }));
    //   it('should respond with rate data for a valid packageId', async () => {
    //     // Mock AWS S3 getObject with a valid response
    //     const mockS3GetObject = jest.fn((params, callback) => {
    //       const rateData = { rate: 10 };
    //       callback(null, { Body: JSON.stringify(rateData) });
    //     });
    //     jest.spyOn(app.locals.s3, 'getObject').mockImplementation(mockS3GetObject);
    //     const response = await request(app).get('/rate/validPackageId');
    //     expect(response.status).toBe(200);
    //     expect(response.body).toEqual({ rate: 10 });
    //   });
    //   it('should respond with a 404 error for an invalid packageId', async () => {
    //     // Mock AWS S3 getObject with an error
    //     const mockS3GetObject = jest.fn((params, callback) => {
    //       const error = new Error('Rate data not found');
    //       callback(error, null);
    //     });
    //     jest.spyOn(app.locals.s3, 'getObject').mockImplementation(mockS3GetObject);
    //     const response = await request(app).get('/rate/invalidPackageId');
    //     expect(response.status).toBe(404);
    //     expect(response.text).toBe('Rate data not found.');
    //   });
});
