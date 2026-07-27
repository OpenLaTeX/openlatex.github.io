import type { FileType, ProjectAction, ProjectFile, ProjectState } from '../types';
import { isFileType } from '../types';

const defaultContent = `\\documentclass{article}
\\begin{document}
Hello LaTeX!
\\end{document}`;

const key = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

export const createProject = (name: string): ProjectState => ({
  key: key(),
  name,
  files: [{ path: 'main.tex', content: defaultContent, type: 'tex' }],
  currentFile: 'main.tex',
  dirty: false,
  revision: 0
});

export const preferredFile = (files: ProjectFile[], current?: string | null): string | null => {
  if (current && files.some((file) => file.path === current)) return current;
  if (files.some((file) => file.path === 'main.tex')) return 'main.tex';
  return files[0]?.path ?? null;
};

export const fileTypeFromPath = (path: string): FileType | null => {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  return isFileType(extension) ? extension : null;
};

export const projectReducer = (state: ProjectState, action: ProjectAction): ProjectState => {
  if (action.type === 'replace') {
    return {
      key: key(),
      name: action.name,
      files: action.files,
      currentFile: preferredFile(action.files, action.currentFile),
      dirty: false,
      revision: 0
    };
  }

  if (action.type === 'reset') return createProject(action.name);
  if (action.type === 'saved') {
    return {
      ...state,
      name: action.name ?? state.name,
      dirty: state.revision === action.revision ? false : state.dirty
    };
  }

  if (action.type === 'select') {
    return state.files.some((file) => file.path === action.path)
      ? { ...state, currentFile: action.path }
      : state;
  }

  if (action.type === 'write') {
    return {
      ...state,
      files: state.files.map((file) =>
        file.path === action.path ? { ...file, content: action.content } : file
      ),
      dirty: true,
      revision: state.revision + 1
    };
  }

  if (action.type === 'upsert') {
    const exists = state.files.some((file) => file.path === action.file.path);
    return {
      ...state,
      files: exists
        ? state.files.map((file) => (file.path === action.file.path ? action.file : file))
        : [...state.files, action.file],
      currentFile: state.currentFile ?? action.file.path,
      dirty: true,
      revision: state.revision + 1
    };
  }

  if (action.type === 'rename') {
    if (state.files.some((file) => file.path === action.to)) return state;
    return {
      ...state,
      files: state.files.map((file) =>
        file.path === action.from ? { ...file, path: action.to } : file
      ),
      currentFile: state.currentFile === action.from ? action.to : state.currentFile,
      dirty: true,
      revision: state.revision + 1
    };
  }

  const prefix = action.type === 'remove-folder' ? `${action.path.replace(/\/$/, '')}/` : null;
  const files = state.files.filter((file) =>
    prefix ? !file.path.startsWith(prefix) : file.path !== action.path
  );

  return {
    ...state,
    files,
    currentFile: preferredFile(files, state.currentFile),
    dirty: true,
    revision: state.revision + 1
  };
};

export const validatePath = (path: string): string | null => {
  const value = path.trim();
  if (!value) return 'Le chemin ne peut pas être vide';
  if (value.length > 512 || value.split('/').some((part) => !part || part === '.' || part === '..')) {
    return 'Chemin invalide';
  }
  if (/[<>:"\\|?*]/.test(value) || [...value].some((char) => char.charCodeAt(0) < 32)) {
    return 'Le chemin contient des caractères invalides';
  }
  return null;
};

export const validateProjectName = (name: string): string | null => {
  const value = name.trim();
  if (!value) return 'Le nom du projet ne peut pas être vide';
  if (value.length > 100) return 'Le nom ne doit pas dépasser 100 caractères';
  if (/[<>:"/\\|?*]/.test(value) || [...value].some((char) => char.charCodeAt(0) < 32)) {
    return 'Le nom contient des caractères invalides';
  }
  return null;
};
