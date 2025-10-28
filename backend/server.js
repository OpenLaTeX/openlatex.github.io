const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const FileManager = require('./services/FileManager');
const Compiler = require('./services/Compiler');

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

app.post('/compile', async (req, res) => {
  const { files, mainFile } = req.body;
  console.log('Compilation request:', files?.length, 'files, main:', mainFile);

  if (!files || !mainFile) {
    return res.status(400).json({ error: 'files et mainFile requis' });
  }

  const projectId = Date.now().toString();
  let workDir;

  try {
    workDir = await FileManager.createProjectDir(projectId);
    await FileManager.writeFiles(workDir, files);

    const result = await Compiler.compile(workDir, mainFile);

    if (result.success) {
      res.setHeader('Content-Type', 'application/pdf');
      res.send(result.pdf);
    } else {
      res.status(500).json({
        error: result.error,
        logs: result.logs
      });
    }
  } catch (error) {
    console.error('Erreur compilation:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (workDir) {
      await FileManager.cleanup(workDir);
    }
  }
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
