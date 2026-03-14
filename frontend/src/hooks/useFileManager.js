import { useRef } from 'react';
import * as Y from 'yjs';
import { FileReaderUtil } from '../utils/FileReader';
import { validateFilePath } from '../utils/validation';

const BINARY_TYPES = ['png', 'jpg', 'jpeg', 'pdf'];

export const useFileManager = (project, setProject, showPrompt, showConfirm, filesMap = null, filesMeta = null, t) => {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const setInYjs = (path, type, content) => {
    if (!filesMap || !filesMeta) return;
    const isBinary = BINARY_TYPES.includes(type);
    filesMeta.set(path, JSON.stringify(isBinary ? { type, content } : { type }));
    if (!isBinary) {
      const yText = new Y.Text();
      if (content) yText.insert(0, content);
      filesMap.set(path, yText);
    }
  };

  const deleteFromYjs = (path) => {
    if (!filesMap || !filesMeta) return;
    filesMeta.delete(path);
    filesMap.delete(path);
  };

  const renameInYjs = (oldPath, newPath) => {
    if (!filesMap || !filesMeta) return;
    const oldMeta = filesMeta.get(oldPath);
    if (oldMeta) {
      filesMeta.set(newPath, oldMeta);
      filesMeta.delete(oldPath);
    }
    const oldYText = filesMap.get(oldPath);
    if (oldYText) {
      const newYText = new Y.Text();
      newYText.insert(0, oldYText.toString());
      filesMap.set(newPath, newYText);
      filesMap.delete(oldPath);
    }
  };

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
    const yjsUpdates = [];

    for (const file of files) {
      const content = await FileReaderUtil.readFile(file);
      const type = FileReaderUtil.getFileType(file.name);
      const path = file.webkitRelativePath || file.name;

      try {
        if (!newProject.getFile(path)) {
          newProject = newProject.addEmptyFile(path, type);
        }
        newProject = newProject.updateFileContent(path, content);
        yjsUpdates.push({ path, type, content });
      } catch (err) {
        console.error(`erreur upload ${path}:`, err);
      }
    }

    setProject(newProject);

    for (const { path, type, content } of yjsUpdates) {
      setInYjs(path, type, content);
    }

    event.target.value = '';
  };

  const handleRename = (oldPath) => {
    showPrompt(
      t.renameFileTitle,
      t.newNameLabel,
      oldPath,
      validateFilePath,
      (newPath) => {
        if (newPath !== oldPath) {
          setProject(p => p.renameFile(oldPath, newPath));
          renameInYjs(oldPath, newPath);
        }
      }
    );
  };

  const handleDelete = async (path) => {
    const confirmed = await showConfirm(
      t.deleteFileTitle,
      t.deleteFileMsg(path)
    );
    if (confirmed) {
      setProject(p => p.removeFile(path));
      deleteFromYjs(path);
    }
  };

  const handleDeleteFolder = async (folderPath) => {
    const prefix = folderPath.endsWith('/') ? folderPath : folderPath + '/';
    const filesToDelete = project.files.filter(f => f.path.startsWith(prefix));
    const fileList = filesToDelete.map(f => f.path).join('\n• ');

    const confirmed = await showConfirm(t.deleteFolderTitle, t.deleteFolderMsg(folderPath, filesToDelete.length, fileList));
    if (confirmed) {
      setProject(p => p.removeFolder(folderPath));
      for (const f of filesToDelete) {
        deleteFromYjs(f.path);
      }
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
    setInYjs(path, ext, '');
  };

  const handleMoveFile = (sourcePath, targetFolderPath) => {
    const fileName = sourcePath.split('/').pop();
    const newPath = `${targetFolderPath}/${fileName}`;
    if (sourcePath !== newPath && !project.getFile(newPath)) {
      setProject(p => p.renameFile(sourcePath, newPath));
      renameInYjs(sourcePath, newPath);
    }
  };

  const handleMoveToRoot = (sourcePath) => {
    const fileName = sourcePath.split('/').pop();
    if (sourcePath !== fileName && !project.getFile(fileName)) {
      setProject(p => p.renameFile(sourcePath, fileName));
      renameInYjs(sourcePath, fileName);
    }
  };

  return {
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
  };
};
