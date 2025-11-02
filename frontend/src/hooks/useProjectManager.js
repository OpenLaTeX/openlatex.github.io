import { useState } from 'react';
import { Project } from '../models/Project';
import ProjectService from '../services/ProjectService';
import { validateProjectName } from '../utils/validation';

export const useProjectManager = (isAuthenticated, showAlert, showPrompt) => {
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [projectName, setProjectName] = useState('Nouveau projet');
  const [project, setProject] = useState(() => Project.createDefault());
  const [loading, setLoading] = useState(false);

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
              file_type: 'text/x-latex'
            }));

            if (currentProjectId) {
              await ProjectService.updateProject(currentProjectId, name, null, files);
              setProjectName(name);
              showAlert('Succès', 'Le projet a été mis à jour avec succès.');
            } else {
              const result = await ProjectService.createProject(name, null, files);
              setCurrentProjectId(result.pno);
              setProjectName(name);
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
        newProject = newProject.addEmptyFile(file.filename, 'tex');
        newProject = newProject.updateFileContent(file.filename, file.content);
      }

      setProject(newProject);
      setCurrentProjectId(data.pno);
      setProjectName(data.name);
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
    resetProject
  };
};
