import { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, Download, Save, FolderOpen, Play, AlertCircle, FileUp, FolderUp, Settings, FileText, LogOut, Plus, Menu, X, Users } from 'lucide-react';
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
import CreateItemModal from './components/modals/CreateItemModal';
import PdfViewer from './components/PdfViewer';
import SettingsModal from './components/SettingsModal';
import CollaboratorsModal from './components/modals/CollaboratorsModal';
import { getApiUrl, setApiUrl } from './config/settings';
import { UserStorage } from './storage/UserStorage';
import { useAuthentication } from './hooks/useAuthentication';
import { useModalManager } from './hooks/useModalManager';
import { useProjectManager } from './hooks/useProjectManager';
import { useFileManager } from './hooks/useFileManager';
import { useCompilation } from './hooks/useCompilation';
import { useFigureManager } from './hooks/useFigureManager';
import { useCollaboration } from './hooks/useCollaboration';
import { useLanguage } from './i18n/LanguageContext';
import AnnouncementBanner from './components/AnnouncementBanner';
import './App.css';

export default function App() {
  const { t } = useLanguage();
  const [showAuth, setShowAuth] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [apiUrl, setApiUrlState] = useState(() => getApiUrl());
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => localStorage.getItem('autoSave') !== 'false');
  const [autoSaveInterval, setAutoSaveInterval] = useState(() => Number(localStorage.getItem('autoSaveInterval')) || 2);
  const { sidebarWidth: initialSidebarWidth, pdfWidth: initialPdfWidth } = UserStorage.getPanelWidths();
  const [sidebarWidth, setSidebarWidth] = useState(initialSidebarWidth);
  const [pdfWidth, setPdfWidth] = useState(initialPdfWidth);
  const editorRef = useRef(null);
  const isResizing = useRef(false);
  const isSidebarResizing = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const formatLastSaved = (date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    return t.savedAgo(diff);
  };

  const {
    alertModal,
    confirmModal,
    promptModal,
    figureModal,
    createItemModal,
    showAlert,
    closeAlert,
    showConfirm,
    closeConfirm,
    showPrompt,
    closePrompt,
    showFigureInsert,
    closeFigureInsert,
    showCreateItem,
    closeCreateItem
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
    lastSavedAt,
    setProject,
    setLoading,
    handleSaveProject: saveProject,
    handleLoadProject: loadProject,
    handleNewProject: newProject,
    resetProject,
    handleDownloadProject,
    filesMapsRef,
    resolveFiles,
    isOwner
  } = useProjectManager(isAuthenticated, showAlert, showPrompt, autoSaveEnabled, autoSaveInterval, t);

  const { filesMap, filesMeta, awareness, isConnected, synced } = useCollaboration(currentProjectId, project, setProject);

  useEffect(() => {
    filesMapsRef.current = filesMap;
  }, [filesMap]);

  const {
    fileInputRef,
    folderInputRef,
    setInYjs,
    handleFileSelect,
    handleContentChange,
    handleUploadFiles,
    handleRename,
    handleDelete,
    handleDeleteFolder,
    triggerFileUpload,
    triggerFolderUpload,
    handleCreateItem,
    handleMoveFile,
    handleMoveToRoot
  } = useFileManager(project, setProject, showPrompt, showConfirm, filesMap, filesMeta, t);

  const {
    pdfUrl,
    compilationErrors,
    showErrorPanel,
    setShowErrorPanel,
    handleCompile
  } = useCompilation(project, resolveFiles, apiUrl, showAlert, setLoading, t);

  const editorViewRef = useRef(null);

  const { handleFigureInsert } = useFigureManager(project, setProject, editorViewRef, showFigureInsert, showAlert, t, setInYjs, filesMap);

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentFile = project.currentFile ? project.getFile(project.currentFile) : null;

  useEffect(() => {
    if (editorRef.current) {
      editorViewRef.current = editorRef.current.getView();
    }
  }, [currentFile]);

  const handleLogin = (email) => {
    authLogin(email);
    closeAlert();
    setShowAuth(false);
  };

  const handleLogout = async () => {
    const hasUnsavedFiles = project.files.length > 0 && !currentProjectId;

    if (hasUnsavedFiles) {
      const confirmed = await showConfirm(
        t.logoutConfirmTitle,
        t.logoutConfirmMsg
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
        t.loadConfirmTitle,
        t.loadConfirmMsg
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
        t.newConfirmTitle,
        t.newConfirmMsg
      );
      if (!confirmed) return;
    }

    newProject();
    setShowProjectList(false);
  };

  const handleAutoSaveChange = (enabled) => {
    setAutoSaveEnabled(enabled);
    localStorage.setItem('autoSave', enabled ? 'true' : 'false');
  };

  const handleAutoSaveIntervalChange = (minutes) => {
    setAutoSaveInterval(minutes);
    localStorage.setItem('autoSaveInterval', minutes);
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
        setSidebarWidth(Math.max(200, Math.min(500, e.clientX)));
      }
      if (isResizing.current) {
        setPdfWidth(Math.max(300, Math.min(1200, window.innerWidth - e.clientX)));
      }
    };

    const handleMouseUp = () => {
      isSidebarResizing.current = false;
      isResizing.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    UserStorage.savePanelWidths(sidebarWidth, pdfWidth);
  }, [sidebarWidth, pdfWidth]);

  useEffect(() => {
    setOnSessionExpired(() => {
      showAlert(t.sessionExpiredTitle, t.sessionExpiredMsg);
      setShowAuth(true);
    });
  }, [t]);


  if (showAuth) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
        <button onClick={() => setShowAuth(false)} className="btn-icon" style={{marginBottom: '20px'}}>
          {t.back}
        </button>
        <Auth onLogin={handleLogin} />
      </div>
    );
  }

  if (showProjectList) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', height: '100vh', overflowY: 'auto' }}>
        <button onClick={() => setShowProjectList(false)} className="btn-icon" style={{marginBottom: '20px'}}>
          {t.back}
        </button>
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

  const projectSizeMB = currentProjectId
    ? (project.files.reduce((acc, f) =>
        acc + (['png', 'jpg', 'jpeg', 'pdf'].includes(f.type)
          ? f.content.length * 0.75
          : f.content.length)
      , 0) / (1024 * 1024)).toFixed(2)
    : null;

  return (
    <div className="app-container">
      <AnnouncementBanner />
      {isMobile && (
        <>
          <div className="mobile-header">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <span>{currentFile?.path || 'OpenLatex'}</span>
            <button className="hamburger-btn" onClick={handleCompile} disabled={loading}>
              <Play size={20} />
            </button>
          </div>
          <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />
        </>
      )}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={isMobile ? {} : { width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}>
        <div className="sidebar-header">
          <a href="https://github.com/OpenLaTeX/openlatex.github.io" target="_blank" rel="noopener noreferrer" className="app-logo">
            <img src="/assets/logo.png" alt="OpenLatex" className="app-logo-image" />
          </a>

          {isAuthenticated ? (
            <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
              <div className="user-profile-badge" onClick={toggleUserDropdown}>
                <div className="user-avatar">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <span className="user-email">{userEmail}</span>
                  <span className="user-role">{t.connected}</span>
                </div>
                <ChevronDown size={14} className="text-muted" />
              </div>

              {showUserDropdown && (
                <div className="user-dropdown-menu">
                  <button className="user-dropdown-item" onClick={handleLogout}>
                    <LogOut size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    {t.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="login-link" onClick={() => setShowAuth(true)}>
              {t.signIn}
            </button>
          )}
        </div>

        <div className="file-tree-container">
          <div className="sidebar-section">
            <h3>{t.actions}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={handleCompile} disabled={loading} className="btn-icon btn-primary" title={`${t.compile} (Ctrl+Enter)`}>
                <Play size={14} />
                <span>{t.compile}</span>
              </button>
              <button onClick={handleSaveProject} disabled={loading || !isAuthenticated || (!!currentProjectId && !isOwner)} className="btn-icon" title={!isOwner && currentProjectId ? t.ownerOnly : t.save}>
                <Save size={14} />
                <span>{t.save}</span>
              </button>
            </div>
            {currentProjectId && (
              <span style={{ fontSize: '11px', color: !isOwner ? 'var(--danger)' : 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {!isOwner
                  ? t.ownerOnly
                  : !autoSaveEnabled
                    ? t.autoSaveDisabled
                    : lastSavedAt
                      ? `${t.savedAt} ${formatLastSaved(lastSavedAt)}`
                      : null}
              </span>
            )}
            {compilationErrors.length > 0 && (
              <button onClick={() => setShowErrorPanel(!showErrorPanel)} className="btn-icon" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', marginTop: '8px', width: '100%' }}>
                <AlertCircle size={14} />
                <span>{t.errorsCount(compilationErrors.length)}</span>
              </button>
            )}
          </div>

          <div className="sidebar-section">
            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={projectName}>
              {projectName.length > 15 ? projectName.slice(0, 40) + '...' : projectName}
              {currentProjectId && (
                <small style={{ display: 'block', fontSize: '10px', fontWeight: '400', color: 'var(--text-faint)', opacity: 0.6 }}>{currentProjectId.slice(0, 5)} · {projectSizeMB} Mo</small>
              )}
            </div>

            {isAuthenticated && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button onClick={() => setShowProjectList(true)} className="btn-icon btn-ghost" style={{ justifyContent: 'flex-start' }}>
                  <FolderOpen size={14} />
                  <span>{t.openProject}</span>
                </button>
                {currentProjectId && (
                  <button onClick={handleDownloadProject} disabled={loading} className="btn-icon btn-ghost" style={{ justifyContent: 'flex-start' }}>
                    <Download size={14} />
                    <span>{t.exportZip}</span>
                  </button>
                )}
                {currentProjectId && isOwner && (
                  <button onClick={() => setShowCollaborators(true)} className="btn-icon btn-ghost" style={{ justifyContent: 'flex-start' }}>
                    <Users size={14} />
                    <span>{t.inviteCollaborator}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="sidebar-section" style={{ borderBottom: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3>{t.files}</h3>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={triggerFileUpload} className="btn-ghost" title={t.addFile} style={{ padding: '4px' }}>
                  <FileUp size={14} />
                </button>
                <button onClick={triggerFolderUpload} className="btn-ghost" title={t.addFolder} style={{ padding: '4px' }}>
                  <FolderUp size={14} />
                </button>
                <button onClick={() => showCreateItem(handleCreateItem)} className="btn-ghost" title={t.newItem} style={{ padding: '4px' }}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
            
            <input ref={fileInputRef} type="file" multiple style={{display:'none'}} onChange={handleUploadFiles} />
            <input ref={folderInputRef} type="file" webkitdirectory="true" style={{display:'none'}} onChange={handleUploadFiles} />

            <FileTree
              files={project.files}
              currentFile={project.currentFile}
              onSelect={handleFileSelect}
              onRename={handleRename}
              onDelete={handleDelete}
              onDeleteFolder={handleDeleteFolder}
              onMove={handleMoveFile}
              onMoveToRoot={handleMoveToRoot}
            />
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="btn-icon btn-ghost" onClick={() => setShowSettings(true)} style={{ justifyContent: 'flex-start', width: '100%', marginBottom: '8px' }}>
            <Settings size={14} />
            <span>{t.settings}</span>
          </button>
        </div>
      </div>

      <div className="resize-handle-sidebar" onMouseDown={handleSidebarResizeStart} />

      <div className="main-content">
        <div className="content-row">
          <div className="editor-container">
            <div className="editor-header">
              <div className="file-path-breadcrumb">
                <FileText size={14} />
                <span>/</span>
                <span className="file-name-active">{currentFile?.path || t.untitled}</span>
              </div>
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
                theme={theme}
                yText={filesMap && currentFile ? filesMap.get(currentFile.path) ?? null : null}
                awareness={awareness}
              />
            )}
          </div>

          <div className="resize-handle" onMouseDown={handleResizeStart} />

          <div className="pdf-viewer" style={{ width: `${pdfWidth}px` }}>
            {pdfBlobUrl ? (
              <PdfViewer pdfUrl={pdfBlobUrl} />
            ) : (
              <div className="pdf-placeholder">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '16px', opacity: 0.5 }}>
                    <FileText size={48} />
                  </div>
                  <p>{t.compiledDocPlaceholder}</p>
                </div>
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

      <CreateItemModal
        isOpen={createItemModal.isOpen}
        onClose={closeCreateItem}
        onConfirm={createItemModal.onConfirm}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        theme={theme}
        onThemeChange={setTheme}
        apiUrl={apiUrl}
        onApiUrlChange={handleApiUrlChange}
        autoSaveEnabled={autoSaveEnabled}
        onAutoSaveChange={handleAutoSaveChange}
        autoSaveInterval={autoSaveInterval}
        onAutoSaveIntervalChange={handleAutoSaveIntervalChange}
      />

      <CollaboratorsModal
        isOpen={showCollaborators}
        onClose={() => setShowCollaborators(false)}
        currentProjectId={currentProjectId}
        t={t}
      />
    </div>
  );
}
