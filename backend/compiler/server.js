const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { exec } = require('child_process');
require('dotenv').config();

// Serveur de compilation, pensé pour fonctionner dans un conteneur différent du "manager" de comptes pour optimiser les performances

const compileRoutes = require('./routes/compile');
const { defaultProtectionLimiter, guestLimiter, userLimiter, tokenMiddleware } = require('./middleware/rateLimiter');

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(defaultProtectionLimiter);
app.use(tokenMiddleware);

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
app.use('/compile', (req, res, next) => {
    (req.userId ? userLimiter : guestLimiter)(req, res, next);
}, compileRoutes);

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
