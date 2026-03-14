import { useState, useEffect, useRef } from 'react';
import { Project } from '../models/Project';
import ProjectService from '../services/ProjectService';
import { validateProjectName } from '../utils/validation';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { UserStorage } from '../storage/UserStorage';

export const useProjectManager = (isAuthenticated, showAlert, showPrompt, autoSaveEnabled = true, autoSaveInterval = 2, t) => {
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projectName, setProjectName] = useState(() => {
    const draft = UserStorage.getProjectDraft();
    return (draft && draft.name) || t.newProject;
  });
  const [project, setProject] = useState(() => {
    const draft = UserStorage.getProjectDraft();
    if (draft && draft.files && draft.files.length > 0) {
      let restoredProject = Project.createEmpty();
      for (const file of draft.files) {
        restoredProject = restoredProject.addEmptyFile(file.path, file.type);
        restoredProject = restoredProject.updateFileContent(file.path, file.content);
      }
      if (draft.currentFile) {
        restoredProject.currentFile = draft.currentFile;
      }
      return restoredProject;
    }
    return Project.createDefault();
  });
  const [loading, setLoading] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const quotaErrorShown = useRef(false);
  const skipDraftSaveRef = useRef(false);
  const projectRef = useRef(project);
  const projectNameRef = useRef(projectName);

  useEffect(() => { projectRef.current = project; }, [project]);
  useEffect(() => { projectNameRef.current = projectName; }, [projectName]);

  useEffect(() => {
    if (currentProjectId) {
      UserStorage.saveLastProject(currentProjectId, projectNameRef.current);
    }
  }, [currentProjectId]);

  useEffect(() => {
    if (skipDraftSaveRef.current) {
      skipDraftSaveRef.current = false;
      return;
    }
    if (project.files.length > 0) {
      const success = UserStorage.saveProjectDraft(project);
      if (!success && !quotaErrorShown.current) {
        quotaErrorShown.current = true;
        showAlert(t.localStorageErrorTitle, t.localStorageErrorMsg);
      } else if (success) {
        quotaErrorShown.current = false;
      }
    }
  }, [project]);

  const filesMapsRef = useRef(null);

  const resolveFiles = () =>
    projectRef.current.files.map(f => {
      const isBinary = ['png', 'jpg', 'jpeg', 'pdf'].includes(f.type);
      const yText = !isBinary && filesMapsRef.current ? filesMapsRef.current.get(f.path) : null;
      return { path: f.path, type: f.type, content: yText ? yText.toString() : f.content };
    });

  useEffect(() => {
    if (!currentProjectId || !isAuthenticated || !autoSaveEnabled || !isOwner) return;
    const interval = setInterval(async () => {
      try {
        const files = resolveFiles().map(f => ({ filename: f.path, content: f.content, file_type: f.type }));
        await ProjectService.updateProject(currentProjectId, projectNameRef.current, null, files);
        setLastSavedAt(new Date());
      } catch {}
    }, autoSaveInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentProjectId, isAuthenticated, autoSaveEnabled, autoSaveInterval, isOwner]);

  const handleSaveProject = async () => {
    if (!isAuthenticated) {
      showAlert(t.authRequired, t.authRequiredMsg);
      return { requiresAuth: true };
    }

    if (currentProjectId && !isOwner) {
      showAlert(t.accessDenied, t.accessDeniedMsg);
      return { success: false };
    }

    return new Promise((resolve) => {
      showPrompt(
        currentProjectId ? t.updateProjectTitle : t.createProjectTitle,
        t.projectNameLabel,
        projectName,
        validateProjectName,
        async (name) => {
          setLoading(true);
          try {
            const files = resolveFiles().map(f => ({ filename: f.path, content: f.content, file_type: f.type }));

            if (currentProjectId) {
              await ProjectService.updateProject(currentProjectId, name, null, files);
              setProjectName(name);
              setLastSavedAt(new Date());
              UserStorage.clearProjectDraft();
              showAlert(t.success, t.projectUpdated);
            } else {
              const result = await ProjectService.createProject(name, null, files);
              setCurrentProjectId(result.pno);
              setProjectName(name);
              setLastSavedAt(new Date());
              UserStorage.clearProjectDraft();
              showAlert(t.success, t.projectCreated);
            }
            resolve({ success: true });
          } catch (err) {
            showAlert(t.error, t.cannotSave(err.message));
            resolve({ success: false });
          }
          setLoading(false);
        }
      );
    });
  };

  const handleLoadProject = async (pno) => {
    setLoading(true);
    try {
      const data = await ProjectService.getProject(pno);
      let newProject = new Project([]);

      for (const file of data.files) {
        newProject = newProject.addEmptyFile(file.filename, file.file_type);
        newProject = newProject.updateFileContent(file.filename, file.content);
      }

      setProject(newProject);
      setCurrentProjectId(data.pno);
      setProjectName(data.name);
      setIsOwner(data.is_owner || false);
      setLastSavedAt(new Date());
      UserStorage.clearProjectDraft();
      showAlert(t.success, t.projectLoaded);
      return { success: true };
    } catch (err) {
      showAlert(t.error, t.cannotLoad(err.message));
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = () => {
    setProject(Project.createDefault());
    setCurrentProjectId(null);
    setProjectName(t.newProject);
    setIsOwner(false);
    UserStorage.saveLastProject(null, null);
  };

  const resetProject = () => {
    skipDraftSaveRef.current = true;
    setCurrentProjectId(null);
    setProject(Project.createDefault());
    setProjectName(t.newProject);
    setIsOwner(false);
  };

  const handleMergeWithProject = async (pno) => {
    setLoading(true);
    try {
      const data = await ProjectService.getProject(pno);
      const currentPaths = new Set(projectRef.current.files.map(f => f.path));
      let merged = projectRef.current;
      for (const f of data.files) {
        if (!currentPaths.has(f.filename)) {
          merged = merged.addEmptyFile(f.filename, f.file_type);
          merged = merged.updateFileContent(f.filename, f.content);
        }
      }
      setProject(merged);
      setCurrentProjectId(data.pno);
      setProjectName(data.name);
      setIsOwner(data.is_owner || false);
      setLastSavedAt(null);
      UserStorage.clearProjectDraft();
      return { success: true };
    } catch (err) {
      showAlert(t.error, t.cannotMerge(err.message));
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadProject = async () => {
    try {
      if (!project.files || project.files.length === 0) {
        showAlert(t.error, t.noFilesToDownload);
        return;
      }

      const zip = new JSZip();

      resolveFiles().forEach(f => {
        const isBinary = ['png', 'jpg', 'jpeg', 'pdf'].includes(f.type);
        zip.file(f.path, f.content, isBinary ? { base64: true } : {});
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${projectName}.zip`);
      showAlert(t.success, t.projectDownloaded);
    } catch (err) {
      showAlert(t.error, t.cannotDownload(err.message));
    }
  };

  return {
    currentProjectId,
    projectName,
    project,
    loading,
    lastSavedAt,
    setProject,
    setLoading,
    handleSaveProject,
    handleLoadProject,
    handleNewProject,
    resetProject,
    handleDownloadProject,
    handleMergeWithProject,
    filesMapsRef,
    resolveFiles,
    isOwner
  };
};
