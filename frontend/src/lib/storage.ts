import type { ProjectState } from '../types';

const read = <T>(name: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(name);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (name: string, value: unknown): boolean => {
  try {
    localStorage.setItem(name, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const storage = {
  email: () => localStorage.getItem('userEmail') ?? '',
  setEmail: (email: string) => localStorage.setItem('userEmail', email),
  clearEmail: () => localStorage.removeItem('userEmail'),
  draft: () =>
    read<Pick<ProjectState, 'name' | 'files' | 'currentFile'> | null>('projectDraft', null),
  saveDraft: (project: ProjectState) =>
    write('projectDraft', {
      name: project.name,
      files: project.files,
      currentFile: project.currentFile,
      timestamp: Date.now()
    }),
  lastProject: () =>
    read<{ pno: string; name: string; isOwner: boolean } | null>('lastProject', null),
  saveLastProject: (value: { pno: string; name: string; isOwner: boolean } | null) =>
    value ? write('lastProject', value) : localStorage.removeItem('lastProject'),
  theme: () => (localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'),
  setTheme: (theme: 'light' | 'dark') => localStorage.setItem('theme', theme),
  language: () => localStorage.getItem('language') ?? '',
  setLanguage: (language: string) => localStorage.setItem('language', language),
  autoSave: () => localStorage.getItem('autoSave') !== 'false',
  setAutoSave: (enabled: boolean) => localStorage.setItem('autoSave', String(enabled)),
  autoSaveInterval: () => {
    const value = Number(localStorage.getItem('autoSaveInterval'));
    return [1, 2, 5, 10, 30].includes(value) ? value : 2;
  },
  setAutoSaveInterval: (minutes: number) =>
    localStorage.setItem('autoSaveInterval', String(minutes))
};
