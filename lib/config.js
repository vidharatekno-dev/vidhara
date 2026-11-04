/**
 * Central configuration — single source of truth for server.js and Vercel functions.
 */
require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production' || Boolean(process.env.VERCEL);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const SESSION_SECRET = process.env.SESSION_SECRET || '';
const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS || 24);
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

module.exports = {
  NODE_ENV,
  IS_PROD,
  GOOGLE_CLIENT_ID,
  SESSION_SECRET,
  SESSION_TTL_HOURS,
  ADMIN_API_KEY
};
