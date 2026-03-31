import * as dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  BASE_URL: process.env.BASE_URL ,
  API_URL: process.env.API_URL,
};