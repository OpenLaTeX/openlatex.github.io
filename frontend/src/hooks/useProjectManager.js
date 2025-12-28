import { useState, useEffect } from 'react';
import { Project } from '../models/Project';
import ProjectService from '../services/ProjectService';
import { validateProjectName } from '../utils/validation';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { UserStorage } from '../storage/UserStorage';

export const useProjectManager = (isAuthenticated, showAlert, showPrompt) => {
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projectName, setProjectName] = useState(() => {
    const draft = UserStorage.getProjectDraft();
    return (draft && draft.name) || 'Nouveau projet';
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

  useEffect(() => {
    if (project.files.length > 0) {
      const success = UserStorage.saveProjectDraft(project);
      if (!success) {
        showAlert('Erreur localStorage', 'Impossible de sauvegarder le brouillon localement (quota dépassé). Sauvegardez votre projet sur le serveur pour ne pas perdre vos modifications.');
      }
    }
  }, [project, showAlert]);

  const handleSaveProject = async () => {
    if (!isAuthenticated) {
      showAlert('Authentification requise', 'Vous devez vous connecter pour sauvegarder votre projet.');
      return { requiresAuth: true };
    }

    return new Promise((resolve) => {
      showPrompt(
        currentProjectId ? 'Mettre à jour le projet' : 'Créer un nouveau projet',
        'Nom du projet :',
        projectName,
        validateProjectName,
        async (name) => {
          setLoading(true);
          try {
            const files = project.files.map(f => ({
              filename: f.path,
              content: f.content,
              file_type: f.type
            }));

            if (currentProjectId) {
              await ProjectService.updateProject(currentProjectId, name, null, files);
              setProjectName(name);
              UserStorage.clearProjectDraft();
              showAlert('Succès', 'Le projet a été mis à jour avec succès.');
            } else {
              const result = await ProjectService.createProject(name, null, files);
              setCurrentProjectId(result.pno);
              setProjectName(name);
              UserStorage.clearProjectDraft();
              showAlert('Succès', 'Le projet a été créé avec succès.');
            }
            resolve({ success: true });
          } catch (err) {
            showAlert('Erreur', `Impossible de sauvegarder le projet : ${err.message}`);
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
      UserStorage.clearProjectDraft();
      showAlert('Succès', 'Le projet a été chargé avec succès.');
      return { success: true };
    } catch (err) {
      showAlert('Erreur', `Impossible de charger le projet : ${err.message}`);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = () => {
    setProject(Project.createDefault());
    setCurrentProjectId(null);
    setProjectName('Nouveau projet');
  };

  const resetProject = () => {
    setCurrentProjectId(null);
    setProject(Project.createDefault());
    setProjectName('Nouveau projet');
  };

  const handleDownloadProject = async () => {
    try {
      if (!project.files || project.files.length === 0) {
        showAlert('Erreur', 'Aucun fichier à télécharger');
        return;
      }

      const zip = new JSZip();

      project.files.forEach(file => {
        if (file.path && file.content !== undefined) {
          const isBinary = ['png', 'jpg', 'pdf'].includes(file.type);
          zip.file(file.path, file.content, isBinary ? { base64: true } : {});
        }
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${projectName}.zip`);
      showAlert('Succès', 'Projet téléchargé avec succès');
    } catch (err) {
      showAlert('Erreur', `Impossible de télécharger le projet : ${err.message}`);
    }
  };

  return {
    currentProjectId,
    projectName,
    project,
    loading,
    setProject,
    setLoading,
    handleSaveProject,
    handleLoadProject,
    handleNewProject,
    resetProject,
    handleDownloadProject
  };
};
