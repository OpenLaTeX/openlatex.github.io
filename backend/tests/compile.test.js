const express = require('express');
const request = require('supertest');

jest.mock('../compiler/lib/FileManager');
jest.mock('../compiler/lib/Compiler');

const FileManager = require('../compiler/lib/FileManager');
const Compiler = require('../compiler/lib/Compiler');

const app = express();
app.use(express.json());
app.use('/compile', require('../compiler/routes/compile'));

beforeEach(() => jest.clearAllMocks());

test('fichiers valides → POST /compile → 200 avec PDF', async () => {
  FileManager.createProjectDir.mockResolvedValue('/tmp/test');
  FileManager.writeFiles.mockResolvedValue();
  FileManager.cleanup.mockResolvedValue();
  Compiler.compile.mockResolvedValue({ success: true, pdf: Buffer.from('%PDF'), logs: '', hasErrors: false });

  const res = await request(app)
    .post('/compile')
    .send({ files: [{ path: 'main.tex', content: '\\documentclass{article}\\begin{document}Hello\\end{document}' }], mainFile: 'main.tex' });

  expect(res.status).toBe(200);
  expect(res.body.pdf).toBeDefined();
});
