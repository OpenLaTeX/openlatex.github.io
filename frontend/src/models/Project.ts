import { IProject, IFile, CompileRequest, FileType } from '../types';
import { File } from './File';

export class Project implements IProject {
    files: IFile[] = [];
    currentFile: string | null = null;

    private constructor() {}

    static createDefault(): Project {
        const project = new Project();
        project.files.push(new File('main.tex', project.getDefaultContent(), 'tex'));
        project.currentFile = 'main.tex';
        return project;
    }

    static createEmpty(): Project {
        return new Project();
    }

    addFile(file: IFile): Project {
        if (this.getFile(file.path)) {
            throw new Error(`Un fichier existe déjà à: ${file.path}`);
        }
        const newProject = this.clone();
        newProject.files.push(file);
        return newProject;
    }

    removeFile(path: string): Project {
        const newProject = this.clone();
        newProject.files = newProject.files.filter(f => f.path !== path);
        if (newProject.currentFile === path) {
            newProject.currentFile = newProject.files[0]?.path || null;
        }
        return newProject;
    }

    removeFolder(folderPath: string): Project {
        const newProject = this.clone();
        const prefix = folderPath.endsWith('/') ? folderPath : folderPath + '/';
        newProject.files = newProject.files.filter(f => !f.path.startsWith(prefix));
        if (newProject.currentFile && newProject.currentFile.startsWith(prefix)) {
            newProject.currentFile = newProject.files[0]?.path || null;
        }
        return newProject;
    }

    getFile(path: string): IFile | undefined {
        return this.files.find(f => f.path === path);
    }

    setCurrentFile(path: string): Project {
        if (!this.getFile(path)) {
            throw new Error(`Fichier introuvable: ${path}`);
        }
        const newProject = this.clone();
        newProject.currentFile = path;
        return newProject;
    }

    updateFileContent(path: string, content: string): Project {
        const fileIndex = this.files.findIndex(f => f.path === path);
        if (fileIndex === -1) {
            throw new Error(`Fichier introuvable: ${path}`);
        }
        const newProject = this.clone();
        newProject.files[fileIndex] = {
            ...newProject.files[fileIndex],
            content
        };
        return newProject;
    }

    addEmptyFile(path: string, type: FileType): Project {
        if (this.getFile(path)) {
            throw new Error(`Un fichier existe déjà à: ${path}`);
        }
        const newProject = this.clone();
        newProject.files.push(new File(path, '', type));
        return newProject;
    }

    renameFile(oldPath: string, newPath: string): Project {
        const fileIndex = this.files.findIndex(f => f.path === oldPath);
        if (fileIndex === -1) {
            throw new Error(`Fichier introuvable: ${oldPath}`);
        }
        if (this.getFile(newPath)) {
            throw new Error(`Un fichier existe déjà à: ${newPath}`);
        }
        const newProject = this.clone();
        newProject.files[fileIndex] = {
            ...newProject.files[fileIndex],
            path: newPath
        };
        if (newProject.currentFile === oldPath) {
            newProject.currentFile = newPath;
        }
        return newProject;
    }

    private clone(): Project {
        const newProject = Project.createEmpty();
        newProject.files = [...this.files];
        newProject.currentFile = this.currentFile;
        return newProject;
    }

    toCompileRequest(mainFile: string): CompileRequest {
        return {
            files: this.files.map(f => ({ path: f.path, content: f.content })),
            mainFile
        };
    }

    private getDefaultContent(): string {
        return `\\documentclass{article}
\\begin{document}
Hello LaTeX!
\\end{document}`;
    }
}
