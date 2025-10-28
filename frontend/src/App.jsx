import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Project } from './models/Project';
import ApiService from './services/ApiService';
import FileTree from './components/FileTree';
import './App.css';

export default function App() {
  const [project, setProject] = useState(() => Project.createDefault());
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('apiUrl') || 'http://159.65.196.71:8000');
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const currentFile = project.currentFile
    ? project.getFile(project.currentFile)
    : null;

  const handleApiUrlChange = (newUrl) => {
    setApiUrl(newUrl);
    localStorage.setItem('apiUrl', newUrl);
  };

  const handleFileSelect = (path) => {
    setProject(project.setCurrentFile(path));
  };

  const handleContentChange = (newContent) => {
    if (project.currentFile) {
      setProject(project.updateFileContent(project.currentFile, newContent));
    }
  };

  const handleCompile = async () => {
    if (!project.currentFile) {
      alert('Sélectionnez un fichier à compiler');
      return;
    }

    if (!project.currentFile.endsWith('.tex')) {
      alert('Sélectionnez un fichier .tex à compiler');
      return;
    }

    setLoading(true);
    try {
      const compileRequest = project.toCompileRequest(project.currentFile);
      const blob = await ApiService.compile(apiUrl, compileRequest.files, compileRequest.mainFile);
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      alert('erreur: ' + err.message);
    }
    setLoading(false);
  };

  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      const isText = /\.(tex|cls|sty|txt|md)$/i.test(file.name);

      if (isText) {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsText(file);
      } else {
        reader.onload = (e) => resolve(e.target.result.split(',')[1]);
        reader.readAsDataURL(file);
      }
    });
  };

  const handleUploadFiles = async (event) => {
    const files = Array.from(event.target.files);
    let newProject = project;

    for (const file of files) {
      const content = await readFile(file);
      const ext = file.name.split('.').pop();
      const types = ['tex', 'cls', 'sty', 'png', 'jpg', 'pdf'];
      const type = types.includes(ext) ? ext : 'tex';
      const path = file.webkitRelativePath || file.name;

      try {
        newProject = newProject.addEmptyFile(path, type);
        newProject = newProject.updateFileContent(path, content);
      } catch (err) {
        console.error(`Erreur upload ${path}:`, err);
      }
    }

    setProject(newProject);
    event.target.value = '';
  };

  const handleRename = (oldPath) => {
    const newPath = prompt('Nouveau nom', oldPath);
    if (!newPath || newPath === oldPath) return;
    setProject(project.renameFile(oldPath, newPath));
  };

  const handleDelete = (path) => {
    if (confirm(`Supprimer ${path} ?`)) {
      setProject(project.removeFile(path));
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <input
          className="api-url-input"
          type="text"
          value={apiUrl}
          onChange={(e) => handleApiUrlChange(e.target.value)}
          placeholder="URL API"
        />
        <button onClick={handleCompile} disabled={loading}>
          {loading ? 'Compilation...' : 'Compiler'}
        </button>

        <input ref={fileInputRef} type="file" multiple style={{display:'none'}} onChange={handleUploadFiles} />
        <input ref={folderInputRef} type="file" webkitdirectory="true" style={{display:'none'}} onChange={handleUploadFiles} />

        <button onClick={() => fileInputRef.current.click()}>Upload Fichiers</button>
        <button onClick={() => folderInputRef.current.click()}>Upload Dossier</button>

        <h3>Fichiers</h3>
        <FileTree
          files={project.files}
          currentFile={project.currentFile}
          onSelect={handleFileSelect}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      </div>

      <div className="editor-container">
        <div className="editor-header">
          <strong>Édition: </strong>{currentFile?.path || 'Aucun fichier sélectionné'}
        </div>
        <Editor
          height="100%"
          language="latex"
          value={currentFile?.content || ''}
          onChange={handleContentChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14
          }}
        />
      </div>

      <div className="pdf-viewer">
        {pdfUrl ? (
          <iframe src={pdfUrl} />
        ) : (
          <div className="pdf-placeholder">
            Cliquez sur "Compiler" pour générer le PDF
          </div>
        )}
      </div>
    </div>
  );
}
