import { useState } from 'react';
import Editor from '@monaco-editor/react';

const API_URL = 'http://159.65.196.71:8000';

export default function App() {
  const [tex, setTex] = useState('\\documentclass{article}\\n\\begin{document}\\nHello LaTeX!\\n\\end{document}');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const compile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tex })
      });
      if (!res.ok) throw new Error('Compilation failed');
      const blob = await res.blob();
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <button onClick={compile} disabled={loading} style={{ padding: 10, margin: 10 }}>
          {loading ? 'Compiling...' : 'Compile'}
        </button>
        <Editor
          height="100%"
          defaultLanguage="latex"
          value={tex}
          onChange={setTex}
          theme="vs-dark"
        />
      </div>
      <div style={{ flex: 1 }}>
        {pdfUrl && <iframe src={pdfUrl} style={{ width: '100%', height: '100%', border: 'none' }} />}
      </div>
    </div>
  );
}
