const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/compile', (req, res) => {
  const { tex } = req.body;
  if (!tex) return res.status(400).json({ error: 'No tex provided' });

  const id = Date.now();
  const dir = `/tmp/latex-${id}`;
  const texFile = path.join(dir, 'input.tex');
  const pdfFile = path.join(dir, 'input.pdf');

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(texFile, tex);

  exec(`pdflatex -interaction=nonstopmode -output-directory=${dir} ${texFile}`, (error) => {
    if (error || !fs.existsSync(pdfFile)) {
      fs.rmSync(dir, { recursive: true, force: true });
      return res.status(500).json({ error: 'Compilation failed' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    const pdf = fs.readFileSync(pdfFile);
    fs.rmSync(dir, { recursive: true, force: true });
    res.send(pdf);
  });
});

app.listen(8000, () => console.log('Backend running on port 8000'));
