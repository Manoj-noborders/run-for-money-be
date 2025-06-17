const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

class S3Uploader {
    constructor() {
        this.s3Client = new S3Client({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            },
            region: process.env.AWS_REGION || 'ap-southeast-1'
        });
    }

    async uploadFile(file, userId, duelId) {
        const bucketPrefix = process.env.NODE_ENV || 'local';
        const key = `${bucketPrefix}/game-logs/${userId}/${duelId}/${uuidv4()}-${file.name?.trim()}`;

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: file.data,
            ContentType: file.mimetype,
            ContentLength: file.size,
            // ACL: 'public-read',
        };

        try {
            const command = new PutObjectCommand(params);
            await this.s3Client.send(command);

            return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
        } catch (error) {
            console.error('S3 Upload Error:', error);
            throw error;
        }
    }
}

module.exports = new S3Uploader();