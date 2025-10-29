import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Project } from './models/Project';
import ApiService from './services/ApiService';
import AuthService from './services/AuthService';
import ProjectService from './services/ProjectService';
import FileTree from './components/FileTree';
import Auth from './components/Auth';
import ProjectList from './components/ProjectList';
import './App.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(AuthService.isAuthenticated());
  const [showAuth, setShowAuth] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projectName, setProjectName] = useState('Nouveau projet');

  const [project, setProject] = useState(() => Project.createDefault());
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('apiUrl') || 'http://159.65.196.71:8000');
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const currentFile = project.currentFile ? project.getFile(project.currentFile) : null;

  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowAuth(false);
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setCurrentProjectId(null);
    setProject(Project.createDefault());
    setProjectName('Nouveau projet');
  };

  const handleSaveProject = async () => {
    if (!isAuthenticated) {
      alert('connectez vous pour sauvegarder');
      setShowAuth(true);
      return;
    }

    const name = prompt('nom du projet', projectName);
    if (!name) return;

    setLoading(true);
    try {
      const files = project.files.map(f => ({
        filename: f.path,
        content: f.content,
        file_type: 'text/x-latex'
      }));

      if (currentProjectId) {
        await ProjectService.updateProject(currentProjectId, name, null, files);
        alert('projet mis a jour');
      } else {
        const result = await ProjectService.createProject(name, null, files);
        setCurrentProjectId(result.pno);
        setProjectName(name);
        alert('projet cree');
      }
    } catch (err) {
      alert('erreur: ' + err.message);
    }
    setLoading(false);
  };

  const handleLoadProject = async (pno) => {
    setLoading(true);
    try {
      const data = await ProjectService.getProject(pno);
      let newProject = new Project([]);

      for (const file of data.files) {
        newProject = newProject.addEmptyFile(file.filename, 'tex');
        newProject = newProject.updateFileContent(file.filename, file.content);
      }

      setProject(newProject);
      setCurrentProjectId(data.pno);
      setProjectName(data.name);
      setShowProjectList(false);
      alert('projet charge');
    } catch (err) {
      alert('erreur: ' + err.message);
    }
    setLoading(false);
  };

  const handleNewProject = () => {
    setProject(Project.createDefault());
    setCurrentProjectId(null);
    setProjectName('Nouveau projet');
    setShowProjectList(false);
  };

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
    if (!project.currentFile || !project.currentFile.endsWith('.tex')) {
      alert('selectionnez un fichier .tex');
      return;
    }

    setLoading(true);
    try {
      let blob;

      if (currentProjectId && isAuthenticated) {
        blob = await ApiService.compileSaved(apiUrl, currentProjectId, project.currentFile);
      } else {
        const compileRequest = project.toCompileRequest(project.currentFile);
        blob = await ApiService.compileGuest(apiUrl, compileRequest.files, compileRequest.mainFile);
      }

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
        console.error(`erreur upload ${path}:`, err);
      }
    }

    setProject(newProject);
    event.target.value = '';
  };

  const handleRename = (oldPath) => {
    const newPath = prompt('nouveau nom', oldPath);
    if (!newPath || newPath === oldPath) return;
    setProject(project.renameFile(oldPath, newPath));
  };

  const handleDelete = (path) => {
    if (confirm(`supprimer ${path} ?`)) {
      setProject(project.removeFile(path));
    }
  };

  if (showAuth) {
    return (
      <div>
        <button onClick={() => setShowAuth(false)}>retour editeur</button>
        <Auth onLogin={handleLogin} />
      </div>
    );
  }

  if (showProjectList) {
    return (
      <div>
        <button onClick={() => setShowProjectList(false)}>retour editeur</button>
        <ProjectList onLoadProject={handleLoadProject} onNewProject={handleNewProject} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <div style={{ marginBottom: '10px' }}>
          <strong>{projectName}</strong>
          {isAuthenticated ? (
            <button onClick={handleLogout} style={{ float: 'right' }}>logout</button>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ float: 'right' }}>connexion</button>
          )}
        </div>

        <input
          className="api-url-input"
          type="text"
          value={apiUrl}
          onChange={(e) => handleApiUrlChange(e.target.value)}
          placeholder="URL API"
        />

        {isAuthenticated && (
          <>
            <button onClick={handleSaveProject} disabled={loading}>save</button>
            <button onClick={() => setShowProjectList(true)}>projets</button>
          </>
        )}

        <button onClick={handleCompile} disabled={loading}>
          {loading ? 'compilation...' : 'compiler'}
        </button>

        <input ref={fileInputRef} type="file" multiple style={{display:'none'}} onChange={handleUploadFiles} />
        <input ref={folderInputRef} type="file" webkitdirectory="true" style={{display:'none'}} onChange={handleUploadFiles} />

        <button onClick={() => fileInputRef.current.click()}>upload fichiers</button>
        <button onClick={() => folderInputRef.current.click()}>upload dossier</button>

        <h3>fichiers</h3>
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
          <strong>edition: </strong>{currentFile?.path || 'aucun fichier'}
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
            cliquez sur compiler pour generer le pdf
          </div>
        )}
      </div>
    </div>
  );
}
