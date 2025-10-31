const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectsRoutes = require('./routes/projects');
const compileRoutes = require('./routes/compile');
const compileGuestRoutes = require('./routes/compile-guest');
const { guestLimiter, userLimiter } = require('./middleware/rateLimiter');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

app.use('/auth', authRoutes);
app.use('/projects', projectsRoutes);
//compilation d'un projet (Utilise la base SQL)
app.use('/compile', userLimiter, compileRoutes);

//compilation sans persistance (Fonctionne à l'upload)
//si l'user loggé compile sans projet, on ne le limite pas comme un invité (nuance)
app.use('/compile-guest', (req, res, next) => {
    (req.headers.authorization?.startsWith('Bearer ') ? userLimiter : guestLimiter)(req, res, next);
}, compileGuestRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log('backend demarre sur le port', PORT);
  exec('which pdflatex && pdflatex --version', (error, stdout) => {
    if (error) {
      console.error('warning: pdflatex pas trouve');
    } else {
      console.log('pdflatex ok:', stdout.split('\n')[0]);
    }
  });
});
