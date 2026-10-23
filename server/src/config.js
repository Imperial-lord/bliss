import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5001;

export const CLIENT_ORIGINS = process.env.CLIENT_ORIGINS 
  ? process.env.CLIENT_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
