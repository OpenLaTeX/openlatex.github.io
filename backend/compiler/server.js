const express = require('express');
const cookieParser = require('cookie-parser');
const { exec } = require('child_process');
require('dotenv').config();
// Serveur de compilation, pensé pour fonctionner dans un conteneur différent du "manager" de comptes pour optimiser les performances

const promClient = require('prom-client');
const compileRoutes = require('./routes/compile');
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

const { defaultProtectionLimiter: protectionLimiter, guestLimiter: guestRateLimiter } = require('./middleware/rateLimiter');

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

app.use(protectionLimiter);

app.get('/health', (req, res) => {
  exec('which pdflatex && pdflatex --version', { timeout: 5000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('health check echoue:', error.message);
      console.error('stderr:', stderr);
      return res.status(500).json({
        status: 'unhealthy',
        error: 'pdflatex not found or not working',
        details: stderr
      });
    }
    res.json({
      status: 'healthy',
      pdflatex: stdout.split('\n')[0]
    });
  });
});

// compilation avec rate limiting: 10/min pour users authentifies, 3/min pour invites
app.use('/compile', guestRateLimiter, compileRoutes);

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log('compile-server demarre sur le port', PORT);
  exec('which pdflatex && pdflatex --version', (error, stdout) => {
    if (error) {
      console.error('warning: pdflatex pas trouve');
    } else {
      console.log('pdflatex ok:', stdout.split('\n')[0]);
    }
  });
});
