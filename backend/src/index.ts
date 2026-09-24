import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Register our API routes
app.use('/api', apiRoutes);

// Only start the server if we are NOT running tests.
// Supertest binds to the app automatically during tests.
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Tesla Pool API running on port ${PORT}`);
  });
}

export default app; // Exported for Supertest!
