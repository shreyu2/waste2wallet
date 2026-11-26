import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db';

// Routes
import authRoutes from './routes/auth';
import citizenRoutes from './routes/citizen';
import adminRoutes from './routes/admin';
import stpRoutes from './routes/stp';
import collectorRoutes from './routes/collector';
import aiRoutes from './routes/ai';
import eventsRoutes from './routes/events';

dotenv.config();

const app = express();

app.use(cors());
// Increase body limit to handle base64 image payloads from AI photo upload
app.use(express.json({ limit: '10mb' }));

// Main API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/citizens', citizenRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stp', stpRoutes);
app.use('/api/collectors', collectorRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/events', eventsRoutes);

// Simple healthcheck
app.get('/', (req, res) => {
  res.send('Waste2Wallet API is running');
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(() => {
  process.exit(1);
});
