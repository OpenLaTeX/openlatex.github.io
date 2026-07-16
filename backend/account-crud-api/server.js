const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const promClient = require('prom-client');
const authRoutes = require('./routes/auth');
const projectsRoutes = require('./routes/projects');
const { defaultProtectionLimiter, authLimiter } = require('./middleware/rateLimiter');

promClient.collectDefaultMetrics();

const uptimeGauge = new promClient.Gauge({
  name: 'process_uptime_seconds',
  help: 'Durée de fonctionnement du process en secondes',
});
setInterval(() => uptimeGauge.set(process.uptime()), 10000);

const httpDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP (en secondes)',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
});

const app = express();
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

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Project exceeds the 10 MB limit' });
  }
  next(err);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log('backend demarre sur le port', PORT);
});
