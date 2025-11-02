import { useState, useRef } from 'react';
import { Project } from './models/Project';
import ApiService from './services/ApiService';
import AuthService from './services/AuthService';
import ProjectService from './services/ProjectService';
import FileTree from './components/FileTree';
import Auth from './components/Auth';
import ProjectList from './components/ProjectList';
import Editor from './components/Editor';
import { ErrorPanel } from './components/ErrorPanel';
import { parseLatexLogs } from './utils/LogParser';
import AlertModal from './components/modals/AlertModal';
import ConfirmModal from './components/modals/ConfirmModal';
import PromptModal from './components/modals/PromptModal';
import { validateFilename, validateProjectName } from './utils/validation';
import { getApiUrl, setApiUrl } from './config/settings';
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
  const [apiUrl, setApiUrlState] = useState(() => getApiUrl());
  const [compilationErrors, setCompilationErrors] = useState([]);
  const [showErrorPanel, setShowErrorPanel] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const editorRef = useRef(null);

  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', message: '', defaultValue: '', validate: null, onConfirm: null });

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
      setAlertModal({
        isOpen: true,
        title: 'Authentification requise',
        message: 'Vous devez vous connecter pour sauvegarder votre projet.'
      });
      setShowAuth(true);
      return;
    }

    setPromptModal({
      isOpen: true,
      title: currentProjectId ? 'Mettre à jour le projet' : 'Créer un nouveau projet',
      message: 'Nom du projet :',
      defaultValue: projectName,
      validate: validateProjectName,
      onConfirm: async (name) => {
        setLoading(true);
        try {
          const files = project.files.map(f => ({
            filename: f.path,
            content: f.content,
            file_type: 'text/x-latex'
          }));

          if (currentProjectId) {
            await ProjectService.updateProject(currentProjectId, name, null, files);
            setProjectName(name);
            setAlertModal({
              isOpen: true,
              title: 'Succès',
              message: 'Le projet a été mis à jour avec succès.'
            });
          } else {
            const result = await ProjectService.createProject(name, null, files);
            setCurrentProjectId(result.pno);
            setProjectName(name);
            setAlertModal({
              isOpen: true,
              title: 'Succès',
              message: 'Le projet a été créé avec succès.'
            });
          }
        } catch (err) {
          setAlertModal({
            isOpen: true,
            title: 'Erreur',
            message: `Impossible de sauvegarder le projet : ${err.message}`
          });
        }
        setLoading(false);
      }
    });
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
      setAlertModal({
        isOpen: true,
        title: 'Succès',
        message: 'Le projet a été chargé avec succès.'
      });
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: 'Erreur',
        message: `Impossible de charger le projet : ${err.message}`
      });
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
    setApiUrlState(newUrl);
    setApiUrl(newUrl);
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
      setAlertModal({
        isOpen: true,
        title: 'Fichier invalide',
        message: 'Veuillez sélectionner un fichier .tex pour compiler.'
      });
      return;
    }

    setLoading(true);
    setCompilationErrors([]);
    try {
      // compilation où il faut toujours envoyer les fichiers (pour être à jour au maximum)
      const compileRequest = project.toCompileRequest(project.currentFile);
      const result = await ApiService.compile(apiUrl, compileRequest.files, compileRequest.mainFile);

      setPdfUrl(result.pdfUrl);

      if (result.hasErrors) {
        const errors = parseLatexLogs(result.logs);
        setCompilationErrors(errors);
        setShowErrorPanel(true);
      }
    } catch (err) {
      const errors = parseLatexLogs(err.logs || '');
      setCompilationErrors(errors);
      setShowErrorPanel(true);
      setAlertModal({
        isOpen: true,
        title: 'Erreur de compilation',
        message: `La compilation a échoué : ${err.message}`
      });
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
    setPromptModal({
      isOpen: true,
      title: 'Renommer le fichier',
      message: 'Nouveau nom :',
      defaultValue: oldPath,
      validate: validateFilename,
      onConfirm: (newPath) => {
        if (newPath !== oldPath) {
          setProject(project.renameFile(oldPath, newPath));
        }
      }
    });
  };

  const handleDelete = (path) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer le fichier',
      message: `Êtes-vous sûr de vouloir supprimer "${path}" ? Cette action est irréversible.`,
      onConfirm: () => {
        setProject(project.removeFile(path));
      }
    });
  };

  const handleErrorClick = (lineNumber) => {
    if (editorRef.current) {
      editorRef.current.goToLine(lineNumber);
    }
  };

  if (showAuth) {
    return (
      <div>
        <button onClick={() => setShowAuth(false)}>Retour à l'éditeur</button>
        <Auth onLogin={handleLogin} />
      </div>
    );
  }

  if (showProjectList) {
    return (
      <div>
        <button onClick={() => setShowProjectList(false)}>Retour à l'éditeur</button>
        <ProjectList
          onLoadProject={handleLoadProject}
          onNewProject={handleNewProject}
          onConfirm={(title, message, callback) => {
            setConfirmModal({
              isOpen: true,
              title,
              message,
              onConfirm: callback
            });
          }}
        />

        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
          title={alertModal.title}
          message={alertModal.message}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <div style={{ marginBottom: '10px' }}>
          <strong>{projectName}</strong>
          {isAuthenticated ? (
            <button onClick={handleLogout} style={{ float: 'right' }}>Déconnexion</button>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ float: 'right' }}>Connexion</button>
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
            <button onClick={handleSaveProject} disabled={loading}>Sauvegarder</button>
            <button onClick={() => setShowProjectList(true)}>Mes projets</button>
          </>
        )}

        <button onClick={handleCompile} disabled={loading}>
          {loading ? 'Compilation...' : 'Compiler'}
        </button>

        {compilationErrors.length > 0 && (
          <button onClick={() => setShowErrorPanel(!showErrorPanel)}>
            Erreurs ({compilationErrors.length})
          </button>
        )}

        <input ref={fileInputRef} type="file" multiple style={{display:'none'}} onChange={handleUploadFiles} />
        <input ref={folderInputRef} type="file" webkitdirectory="true" style={{display:'none'}} onChange={handleUploadFiles} />

        <button onClick={() => fileInputRef.current.click()}>Importer fichiers</button>
        <button onClick={() => folderInputRef.current.click()}>Importer dossier</button>

        <h3>Fichiers</h3>
        <FileTree
          files={project.files}
          currentFile={project.currentFile}
          onSelect={handleFileSelect}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      </div>

      <div className="main-content">
        <div className="content-row">
          <div className="editor-container">
            <div className="editor-header">
              <strong>Édition : </strong>{currentFile?.path || 'Aucun fichier'}
            </div>
            <Editor
              ref={editorRef}
              value={currentFile?.content || ''}
              onChange={handleContentChange}
              currentFile={currentFile}
            />
          </div>

          <div className="pdf-viewer">
            {pdfUrl ? (
              <iframe src={pdfUrl} />
            ) : (
              <div className="pdf-placeholder">
                Cliquez sur Compiler pour générer le PDF
              </div>
            )}
          </div>
        </div>

        <ErrorPanel
          errors={compilationErrors}
          isOpen={showErrorPanel}
          onClose={() => setShowErrorPanel(false)}
          onErrorClick={handleErrorClick}
        />
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={() => setPromptModal({ ...promptModal, isOpen: false })}
        onConfirm={promptModal.onConfirm}
        title={promptModal.title}
        message={promptModal.message}
        defaultValue={promptModal.defaultValue}
        validate={promptModal.validate}
      />
    </div>
  );
}
