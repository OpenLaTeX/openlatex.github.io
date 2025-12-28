export interface IFile {
    path: string ;
    content: string ;
    type: FileType ;
}

export const FILE_TYPES = ['tex', 'cls', 'sty', 'png', 'jpg', 'jpeg', 'pdf'] as const;

export type FileType = typeof FILE_TYPES[number];

export interface IProject {
    files: IFile[];
    currentFile: string | null;
}

export interface CompileRequest {
    files: { path: string; content: string }[];
    mainFile: string;
}

export interface CompileResponse {
    success: boolean;
    pdf?: Blob;
    error?: string;
    logs?: string;
}