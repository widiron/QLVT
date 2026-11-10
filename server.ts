import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

// Đường dẫn thư mục build client
const distPath = path.resolve(__dirname, 'dist');

// Middleware phân tích JSON
app.use(express.json());

// Endpoint kiểm tra sức khỏe hệ thống (Health check) cho Cloud Run
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Phục vụ các tệp tĩnh được biên dịch từ Vite
app.use(express.static(distPath));

import fs from 'fs';

// Chuyển tiếp toàn bộ các route còn lại về index.html cho Single Page Application (SPA)
app.get('*', (_req, res) => {
  const indexPath = path.resolve(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('Ứng dụng đang khởi tạo hoặc đang trong quá trình biên dịch. Vui lòng tải lại trang sau giây lát.');
  }
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

