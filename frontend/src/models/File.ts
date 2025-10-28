import { IFile, FileType, FILE_TYPES } from '../types';

export class File implements IFile {
    constructor(
        public path: string,
        public content: string,
        public type: FileType
    ) {}

    isImage(): boolean {
        return ['png', 'jpg', 'pdf'].includes(this.type);
    }

    isText(): boolean {
        return ['tex', 'cls', 'sty'].includes(this.type);
    }

    getExtension(): string {
        return this.path.split('.').pop() || '';
    }

    static fromUpload(file: globalThis.File, content: string): File {
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (!this.isValidFileType(ext)) {
            throw new Error(`Type de fichier non supporté: ${ext}. Types acceptés: ${FILE_TYPES.join(', ')}`);
        }

        return new File(file.name, content, ext as FileType);
    }

    private static isValidFileType(ext: string | undefined): ext is FileType {
        return ext !== undefined && (FILE_TYPES as readonly string[]).includes(ext);
    }
}
