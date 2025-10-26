const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  exec('which pdflatex && pdflatex --version', { timeout: 5000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Health check failed:', error.message);
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

app.post('/compile', (req, res) => {
  const { tex } = req.body;
  console.log('Compilation request received, tex length:', tex?.length || 0);

  if (!tex) return res.status(400).json({ error: 'No tex provided' });

  const id = Date.now();
  const dir = `/tmp/latex-${id}`;
  const texFile = path.join(dir, 'input.tex');
  const pdfFile = path.join(dir, 'input.pdf');

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(texFile, tex);

  const cmd = `pdflatex -interaction=nonstopmode -output-directory=${dir} ${texFile}`;
  console.log('Executing:', cmd);

  exec(cmd, { maxBuffer: 10 * 1024 * 1024, timeout: 30000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('pdflatex error:', error.message);
      console.error('stdout:', stdout);
      console.error('stderr:', stderr);
      fs.rmSync(dir, { recursive: true, force: true });
      return res.status(500).json({
        error: 'Compilation failed',
        details: error.message,
        output: stderr || stdout
      });
    }

    if (!fs.existsSync(pdfFile)) {
      console.error('PDF not generated');
      console.error('stdout:', stdout);
      console.error('stderr:', stderr);
      fs.rmSync(dir, { recursive: true, force: true });
      return res.status(500).json({
        error: 'PDF not generated',
        output: stderr || stdout
      });
    }

    console.log('PDF generated successfully');
    res.setHeader('Content-Type', 'application/pdf');
    const pdf = fs.readFileSync(pdfFile);
    fs.rmSync(dir, { recursive: true, force: true });
    res.send(pdf);
  });
});

app.listen(8000, () => {
  console.log('Backend running on port 8000');
  exec('which pdflatex && pdflatex --version', (error, stdout) => {
    if (error) {
      console.error('WARNING: pdflatex not found!');
    } else {
      console.log('pdflatex found:', stdout.split('\n')[0]);
    }
  });
});
