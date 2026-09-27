import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api', apiRoutes);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`API running on port ${PORT}`));
}

export default app;
