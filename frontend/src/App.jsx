import { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, Download } from 'lucide-react';
import FileTree from './components/FileTree';
import Auth from './components/Auth';
import ProjectList from './components/ProjectList';
import Editor from './components/Editor';
import ImageViewer from './components/ImageViewer';
import { ErrorPanel } from './components/ErrorPanel';
import AlertModal from './components/modals/AlertModal';
import ConfirmModal from './components/modals/ConfirmModal';
import PromptModal from './components/modals/PromptModal';
import FigureInsertModal from './components/modals/FigureInsertModal';
import PdfViewer from './components/PdfViewer';
import { getApiUrl, setApiUrl } from './config/settings';
import { UserStorage } from './storage/UserStorage';
import { useAuthentication } from './hooks/useAuthentication';
import { useModalManager } from './hooks/useModalManager';
import { useProjectManager } from './hooks/useProjectManager';
import { useFileManager } from './hooks/useFileManager';
import { useCompilation } from './hooks/useCompilation';
import { useFigureManager } from './hooks/useFigureManager';
import './App.css';

export default function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const [apiUrl, setApiUrlState] = useState(() => getApiUrl());
  const { sidebarWidth: initialSidebarWidth, pdfWidth: initialPdfWidth } = UserStorage.getPanelWidths();
  const [sidebarWidth, setSidebarWidth] = useState(initialSidebarWidth);
  const [pdfWidth, setPdfWidth] = useState(initialPdfWidth);
  const editorRef = useRef(null);
  const isResizing = useRef(false);
  const isSidebarResizing = useRef(false);

  const {
    alertModal,
    confirmModal,
    promptModal,
    figureModal,
    showAlert,
    closeAlert,
    showConfirm,
    closeConfirm,
    showPrompt,
    closePrompt,
    showFigureInsert,
    closeFigureInsert
  } = useModalManager();

  const {
    isAuthenticated,
    userEmail,
    isVerifying,
    showUserDropdown,
    dropdownRef,
    handleLogin: authLogin,
    handleLogout: authLogout,
    toggleUserDropdown,
    setOnSessionExpired
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
    resetProject,
    handleDownloadProject
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

  const editorViewRef = useRef(null);

  const { handleFigureInsert } = useFigureManager(project, setProject, editorViewRef, showFigureInsert, showAlert);

  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  useEffect(() => {
    if (!pdfUrl) {
      setPdfBlobUrl(null);
      return;
    }

    const base64toBlob = (data) => {
      const base64WithoutPrefix = data.substr('data:application/pdf;base64,'.length);
      const bytes = atob(base64WithoutPrefix);
      let length = bytes.length;
      let out = new Uint8Array(length);
      while (length--) {
        out[length] = bytes.charCodeAt(length);
      }
      return new Blob([out], { type: 'application/pdf' });
    };

    const blob = base64toBlob(pdfUrl);
    const url = URL.createObjectURL(blob);
    setPdfBlobUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [pdfUrl]);

  const currentFile = project.currentFile ? project.getFile(project.currentFile) : null;

  useEffect(() => {
    if (editorRef.current) {
      editorViewRef.current = editorRef.current.getView();
    }
  }, [currentFile]);

  const handleLogin = (email) => {
    authLogin(email);
    setShowAuth(false);
  };

  const handleLogout = async () => {
    const hasUnsavedFiles = project.files.length > 0 && !currentProjectId;

    if (hasUnsavedFiles) {
      const confirmed = await showConfirm(
        'Déconnexion',
        'Vous avez des fichiers non sauvegardés. Continuer ?'
      );
      if (!confirmed) return;
    }

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
    const hasUnsavedChanges = project.files.length > 0 && !currentProjectId;

    if (hasUnsavedChanges) {
      const confirmed = await showConfirm(
        'Charger projet',
        'Vous avez des fichiers non sauvegardés. Continuer ?'
      );
      if (!confirmed) return;
    }

    await loadProject(pno);
    setShowProjectList(false);
  };

  const handleNewProject = async () => {
    const hasUnsavedFiles = project.files.length > 0 && !currentProjectId;

    if (hasUnsavedFiles) {
      const confirmed = await showConfirm(
        'Nouveau projet',
        'Vous avez des fichiers non sauvegardés. Continuer ?'
      );
      if (!confirmed) return;
    }

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

  const handleResizeStart = () => {
    isResizing.current = true;
  };

  const handleSidebarResizeStart = () => {
    isSidebarResizing.current = true;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isSidebarResizing.current) {
        const newWidth = e.clientX;
        setSidebarWidth(Math.max(200, Math.min(500, newWidth)));
      }
      if (isResizing.current) {
        const newWidth = window.innerWidth - e.clientX;
        setPdfWidth(Math.max(300, Math.min(1200, newWidth)));
      }
    };

    const handleMouseUp = () => {
      if (isSidebarResizing.current || isResizing.current) {
        UserStorage.savePanelWidths(sidebarWidth, pdfWidth);
      }
      isSidebarResizing.current = false;
      isResizing.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [sidebarWidth, pdfWidth]);

  useEffect(() => {
    setOnSessionExpired(() => {
      showAlert('Session expirée', 'Votre session a expiré. Veuillez vous reconnecter.');
      setShowAuth(true);
    });
  }, []);

  if (isVerifying) {
    return (
      <div className="app-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Vérification de session...</div>
      </div>
    );
  }

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
      <div className="sidebar" style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}>
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
            {currentProjectId && (
              <button onClick={handleDownloadProject} disabled={loading}>
                <Download size={16} /> Download
              </button>
            )}
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

      <div className="resize-handle-sidebar" onMouseDown={handleSidebarResizeStart} />

      <div className="main-content">
        <div className="content-row">
          <div className="editor-container">
            <div className="editor-header">
              <strong>Édition : </strong>{currentFile?.path || 'Aucun fichier'}
            </div>
            {currentFile && ['png', 'jpg', 'jpeg'].includes(currentFile.type) ? (
              <ImageViewer
                content={currentFile.content}
                fileName={currentFile.path}
              />
            ) : currentFile?.type === 'pdf' ? (
              <PdfViewer
                pdfUrl={`data:application/pdf;base64,${currentFile.content}`}
              />
            ) : (
              <Editor
                ref={editorRef}
                value={currentFile?.content || ''}
                onChange={handleContentChange}
                currentFile={currentFile}
                onFigureInsert={currentFile?.type === 'tex' ? handleFigureInsert : null}
              />
            )}
          </div>

          <div className="resize-handle" onMouseDown={handleResizeStart} />

          <div className="pdf-viewer" style={{ width: `${pdfWidth}px` }}>
            {pdfBlobUrl ? (
              <PdfViewer pdfUrl={pdfBlobUrl} />
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

      <FigureInsertModal
        isOpen={figureModal.isOpen}
        onClose={closeFigureInsert}
        onConfirm={figureModal.onConfirm}
        imageData={figureModal.imageData}
        defaultLabel={figureModal.defaultLabel}
        defaultCaption={figureModal.defaultCaption}
      />
    </div>
  );
}
