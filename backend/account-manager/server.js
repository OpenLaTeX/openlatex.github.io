const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const promClient = require('prom-client');
const authRoutes = require('./routes/auth');
const projectsRoutes = require('./routes/projects');
const { defaultProtectionLimiter, authLimiter } = require('./middleware/rateLimiter');

promClient.collectDefaultMetrics();

const httpDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP (en secondes)',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
});

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
  });
  next();
});

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
