import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { notifications } from '@mantine/notifications';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as Y from 'yjs';
import { useTranslation } from 'react-i18next';
import { createProject, fileTypeFromPath, projectReducer, validatePath, validateProjectName } from '../domain/project';
import { api, ApiError } from '../lib/api';
import { confirmDialog, figureDialog, promptDialog } from '../lib/dialogs';
import { readUpload } from '../lib/files';
import { figureDefaults, figureLatex, parseLatexLogs, readClipboardImage } from '../lib/latex';
import { storage } from '../lib/storage';
import type { EditorHandle, ProjectFile } from '../types';
import { isBinaryType } from '../types';
import { useCollaboration } from './useCollaboration';

interface Options {
  authenticated: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  editorRef: React.RefObject<EditorHandle | null>;
  openAuth: () => void;
}

const initialProject = (name: string) => {
  const draft = storage.draft();
  if (!draft?.files?.length) return createProject(name);
  return {
    ...createProject(draft.name || name),
    files: draft.files,
    currentFile: draft.currentFile,
    dirty: false
  };
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Une erreur est survenue';

export const useWorkspace = ({
  authenticated,
  autoSave,
  autoSaveInterval,
  editorRef,
  openAuth
}: Options) => {
  const { t } = useTranslation();
  const last = storage.lastProject();
  const [project, dispatch] = useReducer(projectReducer, t('newProject'), initialProject);
  const [projectId, setProjectId] = useState<string | null>(
    storage.draft()?.files?.length && last?.pno ? last.pno : null
  );
  const [owner, setOwner] = useState(last?.isOwner ?? false);
  const [loading, setLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<ReturnType<typeof parseLatexLogs>>([]);
  const projectRef = useRef(project);
  const saving = useRef(false);
  const collaboration = useCollaboration(projectId, project, dispatch);

  useEffect(() => {
    projectRef.current = project;
    const files = project.files.map((file) => {
      const yText = collaboration.filesMap?.get(file.path);
      return yText && !isBinaryType(file.type)
        ? { ...file, content: yText.toString() }
        : file;
    });
    storage.saveDraft({ ...project, files });
  }, [project, collaboration.filesMap]);

  const files = useCallback(
    () =>
      projectRef.current.files.map((file) => {
        const yText = collaboration.filesMap?.get(file.path);
        return yText && !isBinaryType(file.type)
          ? { ...file, content: yText.toString() }
          : file;
      }),
    [collaboration.filesMap]
  );

  const persist = useCallback(
    async (name = projectRef.current.name, quiet = false) => {
      if (!projectId || !owner || saving.current) return;
      const snapshot = files();
      const revision = projectRef.current.revision;
      saving.current = true;
      try {
        await api.updateProject(projectId, name, snapshot);
        dispatch({ type: 'saved', name, revision });
        setLastSaved(new Date());
        if (!quiet) notifications.show({ color: 'green', message: t('projectUpdated') });
      } catch (error) {
        notifications.show({ color: 'red', message: t('cannotSave', { message: errorMessage(error) }) });
      } finally {
        saving.current = false;
      }
    },
    [files, owner, projectId, t]
  );

  useEffect(() => {
    if (!projectId || !authenticated || !owner || !autoSave) return;
    const timer = window.setInterval(() => {
      if (projectRef.current.dirty) void persist(projectRef.current.name, true);
    }, autoSaveInterval * 60_000);
    return () => window.clearInterval(timer);
  }, [authenticated, autoSave, autoSaveInterval, owner, persist, projectId]);

  const save = async () => {
    if (!authenticated) {
      openAuth();
      return;
    }
    if (projectId && !owner) return;
    const name = await promptDialog(
      projectId ? t('updateProjectTitle') : t('createProjectTitle'),
      t('projectNameLabel'),
      project.name,
      validateProjectName
    );
    if (!name) return;
    setLoading(true);
    const snapshot = files();
    const revision = projectRef.current.revision;
    try {
      if (projectId) {
        await api.updateProject(projectId, name, snapshot);
      } else {
        const result = await api.createProject(name, snapshot);
        setProjectId(result.pno);
        setOwner(true);
        storage.saveLastProject({ pno: result.pno, name, isOwner: true });
      }
      dispatch({ type: 'saved', name, revision });
      setLastSaved(new Date());
      notifications.show({ color: 'green', message: projectId ? t('projectUpdated') : t('projectCreated') });
    } catch (error) {
      notifications.show({ color: 'red', message: t('cannotSave', { message: errorMessage(error) }) });
    } finally {
      setLoading(false);
    }
  };

  const load = async (id: string) => {
    if (project.dirty && !(await confirmDialog(t('loadConfirmTitle'), t('loadConfirmMsg')))) return false;
    setLoading(true);
    try {
      const value = await api.project(id);
      const nextFiles = value.files.map((file) => ({
        path: file.filename,
        content: file.content,
        type: file.file_type
      }));
      dispatch({ type: 'replace', name: value.name, files: nextFiles });
      setProjectId(value.pno);
      setOwner(value.is_owner);
      setPdfUrl(null);
      setErrors([]);
      storage.saveLastProject({ pno: value.pno, name: value.name, isOwner: value.is_owner });
      return true;
    } catch (error) {
      notifications.show({ color: 'red', message: t('cannotLoad', { message: errorMessage(error) }) });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reset = async (force = false) => {
    if (!force && project.dirty && !(await confirmDialog(t('newConfirmTitle'), t('newConfirmMsg')))) return;
    dispatch({ type: 'reset', name: t('newProject') });
    setProjectId(null);
    setOwner(false);
    setPdfUrl(null);
    setErrors([]);
    storage.saveLastProject(null);
  };

  const compile = async () => {
    const current = project.files.find((file) => file.path === project.currentFile);
    if (current?.type !== 'tex') {
      notifications.show({ color: 'red', message: t('invalidFileMsg') });
      return;
    }
    setLoading(true);
    setErrors([]);
    try {
      const result = await api.compile(files(), current.path);
      setPdfUrl(`data:application/pdf;base64,${result.pdf}`);
      if (result.hasErrors) setErrors(parseLatexLogs(result.logs));
    } catch (error) {
      const logs = error instanceof ApiError ? String(error.data?.logs ?? '') : '';
      setErrors(parseLatexLogs(logs));
      notifications.show({ color: 'red', message: t('compilationErrorMsg', { message: errorMessage(error) }) });
    } finally {
      setLoading(false);
    }
  };

  const upload = async (list: FileList) => {
    const loaded: ProjectFile[] = [];
    for (const file of Array.from(list)) {
      try {
        loaded.push(await readUpload(file));
      } catch (error) {
        notifications.show({ color: 'red', message: errorMessage(error) });
      }
    }
    const duplicates = loaded.filter((file) => project.files.some((item) => item.path === file.path));
    if (duplicates.length && !(await confirmDialog('Remplacer les fichiers', `${duplicates.length} fichier(s) existe(nt) déjà.`))) return;
    loaded.forEach((file) => {
      dispatch({ type: 'upsert', file });
      collaboration.setFile(file);
    });
  };

  const createFile = async () => {
    const path = await promptDialog('Nouveau fichier', 'Chemin', '', validatePath);
    if (!path || project.files.some((file) => file.path === path)) return;
    const type = fileTypeFromPath(path);
    if (!type || isBinaryType(type)) {
      notifications.show({ color: 'red', message: 'Utilisez un fichier .tex, .cls ou .sty' });
      return;
    }
    const file = { path, type, content: '' };
    dispatch({ type: 'upsert', file });
    dispatch({ type: 'select', path });
    collaboration.setFile(file);
  };

  const rename = async (path: string) => {
    const next = await promptDialog(t('renameFileTitle'), t('newNameLabel'), path, validatePath);
    if (!next || next === path || project.files.some((file) => file.path === next)) return;
    dispatch({ type: 'rename', from: path, to: next });
    collaboration.rename(path, next);
  };

  const remove = async (path: string) => {
    if (!(await confirmDialog(t('deleteFileTitle'), t('deleteFileMsg', { path })))) return;
    dispatch({ type: 'remove', path });
    collaboration.remove([path]);
  };

  const removeFolder = async (path: string) => {
    const paths = project.files.filter((file) => file.path.startsWith(`${path}/`)).map((file) => file.path);
    if (!(await confirmDialog(t('deleteFolderTitle'), t('deleteFolderMsg', { path, count: paths.length })))) return;
    dispatch({ type: 'remove-folder', path });
    collaboration.remove(paths);
  };

  const move = (from: string, to: string) => {
    if (from === to || project.files.some((file) => file.path === to)) return;
    dispatch({ type: 'rename', from, to });
    collaboration.rename(from, to);
  };

  const download = async () => {
    const zip = new JSZip();
    files().forEach((file) => zip.file(file.path, file.content, isBinaryType(file.type) ? { base64: true } : {}));
    saveAs(await zip.generateAsync({ type: 'blob' }), `${project.name}.zip`);
  };

  const insertFigure = async () => {
    try {
      const image = await readClipboardImage();
      const view = editorRef.current?.getView();
      if (!image || !view || !project.currentFile) {
        notifications.show({ color: 'red', message: image ? t('editorUnavailable') : t('noImageMsg') });
        return;
      }
      const cursor = view.state.selection.main.head;
      const imageName = `image-${Date.now()}.${image.extension}`;
      const defaults = figureDefaults(view.state.doc.toString(), cursor, imageName);
      const options = await figureDialog(defaults.label);
      if (!options) return;
      const yText = collaboration.filesMap?.get(project.currentFile);
      const relative = yText ? Y.createRelativePositionFromTypeIndex(yText, cursor) : null;
      let position = cursor;
      if (relative && yText?.doc) {
        position = Y.createAbsolutePositionFromRelativePosition(relative, yText.doc)?.index ?? cursor;
      }
      view.dispatch({ changes: { from: position, insert: figureLatex(defaults.path, options) } });
      const file = {
        path: defaults.path,
        content: image.base64,
        type: image.extension === 'jpg' ? 'jpg' as const : 'png' as const
      };
      dispatch({ type: 'upsert', file });
      collaboration.setFile(file);
    } catch (error) {
      notifications.show({ color: 'red', message: t('clipboardError', { message: errorMessage(error) }) });
    }
  };

  return {
    project,
    projectId,
    owner,
    loading,
    lastSaved,
    pdfUrl,
    errors,
    collaboration,
    save,
    load,
    reset,
    compile,
    upload,
    createFile,
    rename,
    remove,
    removeFolder,
    move,
    download,
    insertFigure,
    select: (path: string) => dispatch({ type: 'select', path }),
    write: (content: string) => {
      if (project.currentFile) dispatch({ type: 'write', path: project.currentFile, content });
    }
  };
};
