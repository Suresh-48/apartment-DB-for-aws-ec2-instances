import dotenv from "dotenv";
dotenv.config({ silent: true });

const {
  NODE_ENVIROMMENT,
  DEFAULT_EMAIL,
  EMAIL_USER,
  EMAIL_PASSWORD,
  AWS_KEY_ID,
  AWS_SECRET_KEY_ACCESS,
  AWS_BUCKET,
  AWS_REGION,
  ADMIN_EMAIL,
  APP_LOCAL_URL,
  APP_WEB_URL,

} = process.env;

export const PRODUCTION_ENV = "Production";
export const DEVELOPMENT_ENV = "Development";

// Environments
export const environments = NODE_ENVIROMMENT || DEVELOPMENT_ENV;

export const DEFAULT_EMAIL_ADDRESS = DEFAULT_EMAIL;

export const DEFAULT_ADMIN_USER = ADMIN_EMAIL;

export const EMAIL_CREDENTIALS = {
  user: EMAIL_USER,
  pass: EMAIL_PASSWORD,
};

export const awsRegion = AWS_REGION || "ap-south-1";
export const awsAccessKeyId = AWS_KEY_ID;
export const awsSecretAccessKey = AWS_SECRET_KEY_ACCESS;
export const awsBucketName = AWS_BUCKET;

export const APP_URL = environments == PRODUCTION_ENV ? APP_WEB_URL : APP_LOCAL_URL;

