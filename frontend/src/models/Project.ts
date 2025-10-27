import { IProject, IFile, CompileRequest } from '../types';
import { File } from './File';

export class Project implements IProject {
    files: IFile[] = [];
    mainFile: string = 'main.tex';
    currentFile: string | null = null;

    constructor() {
        this.files.push(new File('main.tex', this.getDefaultContent(), 'tex'));
        this.currentFile = 'main.tex';
    }

    addFile(file: IFile): void {
        if (this.getFile(file.path)) {
            throw new Error(`Un fichier existe déjà à: ${file.path}`);
        }
        this.files.push(file);
    }

    removeFile(path: string): void {
        if (path === this.mainFile) {
            throw new Error('Impossible de supprimer le fichier principal');
        }
        this.files = this.files.filter(f => f.path !== path);
        if (this.currentFile === path) {
            this.currentFile = this.files[0]?.path || null;
        }
    }

    getFile(path: string): IFile | undefined {
        return this.files.find(f => f.path === path);
    }

    setCurrentFile(path: string): void {
        if (!this.getFile(path)) {
            throw new Error(`Fichier introuvable: ${path}`);
        }
        this.currentFile = path;
    }

    updateFileContent(path: string, content: string): void {
        const file = this.getFile(path);
        if (!file) {
            throw new Error(`Fichier introuvable: ${path}`);
        }
        file.content = content;
    }

    toCompileRequest(): CompileRequest {
        return {
            files: this.files.map(f => ({ path: f.path, content: f.content })),
            mainFile: this.mainFile
        };
    }

    private getDefaultContent(): string {
        return `\\documentclass{article}
\\begin{document}
Hello LaTeX!
\\end{document}`;
    }
}
