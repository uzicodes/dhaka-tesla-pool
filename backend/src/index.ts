import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import apiRoutes from './routes/api.routes';

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// GET /api/users?email=test@test.com
app.get('/api/users', async (req, res) => {
  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email query parameter is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

export default app;
