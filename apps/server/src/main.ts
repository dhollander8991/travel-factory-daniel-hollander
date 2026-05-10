import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import requestRoutes from './routes/requestRoutes';
import chatRoutes from './routes/chatRoutes';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:4200',
      'http://localhost:4201',
      'http://localhost:5173',
      'http://localhost:5174',
    ],
    credentials: true,
  })
);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', requestRoutes);
app.use('/api/v1', chatRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Temporary — lists all registered routes for debugging
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    console.log('Route:', middleware.route.path);
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach((handler: any) => {
      if (handler.route) {
        console.log('Route:', handler.route.path);
      }
    });
  }
});



app.use('/api/v1', requestRoutes);

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected successfully');
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });