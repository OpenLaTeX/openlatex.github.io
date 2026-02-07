const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectsRoutes = require('./routes/projects');
const { defaultProtectionLimiter, authLimiter } = require('./middleware/rateLimiter');

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(defaultProtectionLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.use('/auth', authLimiter, authRoutes);
app.use('/projects', projectsRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log('backend demarre sur le port', PORT);
});
