import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const getAccessSecret = () => process.env.JWT_SECRET || 'dev-access-secret';
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

export const generateAccessToken = (payload) => jwt.sign(payload, getAccessSecret(), {
  expiresIn: process.env.JWT_EXPIRES_IN || '1h'
});

export const generateRefreshToken = (payload) => jwt.sign(payload, getRefreshSecret(), {
  expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
});

export const verifyAccessToken = (token) => jwt.verify(token, getAccessSecret());

export const verifyRefreshToken = (token) => jwt.verify(token, getRefreshSecret());

export const generateSessionToken = () => crypto.randomBytes(48).toString('hex');

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
