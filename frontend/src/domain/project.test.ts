import { describe, expect, it } from 'vitest';
import { createProject, fileTypeFromPath, projectReducer, validatePath, validateProjectName } from './project';

describe('project', () => {
  it('creates a usable default project', () => {
    const project = createProject('Nouveau projet');
    expect(project.currentFile).toBe('main.tex');
    expect(project.files[0]?.content).toContain('\\documentclass');
  });

  it('writes and renames a file immutably', () => {
    const initial = createProject('Projet');
    const written = projectReducer(initial, { type: 'write', path: 'main.tex', content: 'Hello' });
    const renamed = projectReducer(written, { type: 'rename', from: 'main.tex', to: 'document.tex' });
    expect(initial.files[0]?.content).not.toBe('Hello');
    expect(renamed.currentFile).toBe('document.tex');
    expect(renamed.dirty).toBe(true);
  });

  it('selects main.tex when a project is loaded', () => {
    const project = projectReducer(createProject('A'), {
      type: 'replace',
      name: 'B',
      files: [
        { path: 'notes.tex', type: 'tex', content: '' },
        { path: 'main.tex', type: 'tex', content: '' }
      ]
    });
    expect(project.currentFile).toBe('main.tex');
  });

  it('validates names and paths', () => {
    expect(validatePath('../secret.tex')).not.toBeNull();
    expect(validatePath('chapters/main.tex')).toBeNull();
    expect(validateProjectName('')).not.toBeNull();
    expect(validateProjectName('Mémoire')).toBeNull();
  });

  it('keeps edits made after a save started dirty', () => {
    const initial = createProject('Projet');
    const snapshot = initial.revision;
    const changed = projectReducer(initial, { type: 'write', path: 'main.tex', content: 'Nouveau contenu' });
    const saved = projectReducer(changed, { type: 'saved', revision: snapshot });
    expect(saved.dirty).toBe(true);
  });

  it('recognizes uppercase LaTeX extensions', () => {
    expect(fileTypeFromPath('MAIN.TEX')).toBe('tex');
  });
});
