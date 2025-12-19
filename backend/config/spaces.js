const { S3Client } = require("@aws-sdk/client-s3");

const REGION = process.env.SPACES_REGION;
const BUCKET = process.env.SPACES_BUCKET;
const ENDPOINT = `https://${REGION}.digitaloceanspaces.com`;
const ACCESS_KEY = process.env.SPACES_KEY;
const SECRET_KEY = process.env.SPACES_SECRET;

console.log('SPACES CONFIG:', {
  REGION,
  BUCKET,
  ENDPOINT,
  ACCESS_KEY: ACCESS_KEY ? 'SET' : 'MISSING',
  SECRET_KEY: SECRET_KEY ? 'SET' : 'MISSING'
});


const s3Client = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

module.exports = { s3Client, BUCKET, REGION };
