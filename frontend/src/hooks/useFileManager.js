import { useRef } from 'react';
import { FileReaderUtil } from '../utils/FileReader';
import { validateFilename } from '../utils/validation';

export const useFileManager = (project, setProject, showPrompt, showConfirm) => {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleFileSelect = (path) => {
    setProject(p => p.setCurrentFile(path));
  };

  const handleContentChange = (newContent) => {
    if (project.currentFile) {
      setProject(p => p.updateFileContent(p.currentFile, newContent));
    }
  };

  const handleUploadFiles = async (event) => {
    const files = Array.from(event.target.files);
    let newProject = project;

    for (const file of files) {
      const content = await FileReaderUtil.readFile(file);
      const type = FileReaderUtil.getFileType(file.name);
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
    showPrompt(
      'Renommer le fichier',
      'Nouveau nom :',
      oldPath,
      validateFilename,
      (newPath) => {
        if (newPath !== oldPath) {
          setProject(p => p.renameFile(oldPath, newPath));
        }
      }
    );
  };

  const handleDelete = async (path) => {
    const confirmed = await showConfirm(
      'Supprimer le fichier',
      `Êtes-vous sûr de vouloir supprimer "${path}" ? Cette action est irréversible.`
    );
    if (confirmed) {
      setProject(p => p.removeFile(path));
    }
  };

  const handleDeleteFolder = async (folderPath) => {
    const prefix = folderPath.endsWith('/') ? folderPath : folderPath + '/';
    const filesToDelete = project.files.filter(f => f.path.startsWith(prefix));
    const fileList = filesToDelete.map(f => f.path).join('\n• ');
    const message = `Êtes-vous sûr de vouloir supprimer le dossier "${folderPath}" ?\n\nFichiers qui seront supprimés (${filesToDelete.length}) :\n• ${fileList}\n\nCette action est irréversible.`;

    const confirmed = await showConfirm('Supprimer le dossier', message);
    if (confirmed) {
      setProject(p => p.removeFolder(folderPath));
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const triggerFolderUpload = () => {
    folderInputRef.current?.click();
  };

  const handleCreateItem = ({ type, fileName, folderName }) => {
    const ext = fileName.split('.').pop();
    const path = type === 'folder' ? `${folderName}/${fileName}` : fileName;
    setProject(p => p.addEmptyFile(path, ext));
  };

  const handleMoveFile = (sourcePath, targetFolderPath) => {
    const fileName = sourcePath.split('/').pop();
    const newPath = `${targetFolderPath}/${fileName}`;
    if (sourcePath !== newPath && !project.getFile(newPath)) {
      setProject(p => p.renameFile(sourcePath, newPath));
    }
  };

  const handleMoveToRoot = (sourcePath) => {
    const fileName = sourcePath.split('/').pop();
    if (sourcePath !== fileName && !project.getFile(fileName)) {
      setProject(p => p.renameFile(sourcePath, fileName));
    }
  };

  return {
    fileInputRef,
    folderInputRef,
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
  };
};
