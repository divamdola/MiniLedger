import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { initDatabase } from './db';
import { sendOTP, verifyOTP, authenticateToken } from './auth';
import { addLoan, getLoans, markAsRepaid, getSummary, uploadReceipt } from './loans';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.post('/api/auth/send-otp', sendOTP);
app.post('/api/auth/verify-otp', verifyOTP);

app.post('/api/loans', authenticateToken, addLoan);
app.get('/api/loans', authenticateToken, getLoans);
app.patch('/api/loans/:id/repaid', authenticateToken, markAsRepaid);
app.get('/api/loans/summary', authenticateToken, getSummary);
app.post('/api/loans/upload-receipt', authenticateToken, upload.single('receipt'), uploadReceipt);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
