import { useState, useRef } from 'react';
import { User, ChevronDown } from 'lucide-react';
import FileTree from './components/FileTree';
import Auth from './components/Auth';
import ProjectList from './components/ProjectList';
import Editor from './components/Editor';
import { ErrorPanel } from './components/ErrorPanel';
import AlertModal from './components/modals/AlertModal';
import ConfirmModal from './components/modals/ConfirmModal';
import PromptModal from './components/modals/PromptModal';
import { getApiUrl, setApiUrl } from './config/settings';
import { useAuthentication } from './hooks/useAuthentication';
import { useModalManager } from './hooks/useModalManager';
import { useProjectManager } from './hooks/useProjectManager';
import { useFileManager } from './hooks/useFileManager';
import { useCompilation } from './hooks/useCompilation';
import './App.css';

export default function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const [apiUrl, setApiUrlState] = useState(() => getApiUrl());
  const editorRef = useRef(null);

  const {
    alertModal,
    confirmModal,
    promptModal,
    showAlert,
    closeAlert,
    showConfirm,
    closeConfirm,
    showPrompt,
    closePrompt
  } = useModalManager();

  const {
    isAuthenticated,
    userEmail,
    showUserDropdown,
    dropdownRef,
    handleLogin: authLogin,
    handleLogout: authLogout,
    toggleUserDropdown
  } = useAuthentication();

  const {
    currentProjectId,
    projectName,
    project,
    loading,
    setProject,
    setLoading,
    handleSaveProject: saveProject,
    handleLoadProject: loadProject,
    handleNewProject: newProject,
    resetProject
  } = useProjectManager(isAuthenticated, showAlert, showPrompt);

  const {
    fileInputRef,
    folderInputRef,
    handleFileSelect,
    handleContentChange,
    handleUploadFiles,
    handleRename,
    handleDelete,
    triggerFileUpload,
    triggerFolderUpload
  } = useFileManager(project, setProject, showPrompt, showConfirm);

  const {
    pdfUrl,
    compilationErrors,
    showErrorPanel,
    setShowErrorPanel,
    handleCompile
  } = useCompilation(project, apiUrl, showAlert, setLoading);

  const currentFile = project.currentFile ? project.getFile(project.currentFile) : null;

  const handleLogin = (email) => {
    authLogin(email);
    setShowAuth(false);
  };

  const handleLogout = () => {
    authLogout();
    resetProject();
  };

  const handleSaveProject = async () => {
    const result = await saveProject();
    if (result && result.requiresAuth) {
      setShowAuth(true);
    }
  };

  const handleLoadProject = async (pno) => {
    await loadProject(pno);
    setShowProjectList(false);
  };

  const handleNewProject = () => {
    newProject();
    setShowProjectList(false);
  };

  const handleApiUrlChange = (newUrl) => {
    setApiUrlState(newUrl);
    setApiUrl(newUrl);
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
          onConfirm={showConfirm}
        />

        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={closeAlert}
          title={alertModal.title}
          message={alertModal.message}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirm}
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
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong>{projectName}</strong>
          {isAuthenticated ? (
            <div className="user-dropdown-container" ref={dropdownRef}>
              <button
                className="user-dropdown-trigger"
                onClick={toggleUserDropdown}
              >
                <User size={16} />
                <span>{userEmail}</span>
                <ChevronDown size={14} />
              </button>
              {showUserDropdown && (
                <div className="user-dropdown-menu">
                  <button className="user-dropdown-item" onClick={handleLogout}>
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
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

        <button onClick={triggerFileUpload}>Importer fichiers</button>
        <button onClick={triggerFolderUpload}>Importer dossier</button>

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
        onClose={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={closePrompt}
        onConfirm={promptModal.onConfirm}
        title={promptModal.title}
        message={promptModal.message}
        defaultValue={promptModal.defaultValue}
        validate={promptModal.validate}
      />
    </div>
  );
}
