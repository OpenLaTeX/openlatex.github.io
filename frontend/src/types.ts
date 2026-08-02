export const FILE_TYPES = ['tex', 'cls', 'sty', 'png', 'jpg', 'jpeg', 'pdf'] as const;
export const BINARY_TYPES = ['png', 'jpg', 'jpeg', 'pdf'] as const;

export type FileType = (typeof FILE_TYPES)[number];

export interface ProjectFile {
  path: string;
  content: string;
  type: FileType;
}

export interface ProjectState {
  key: string;
  name: string;
  files: ProjectFile[];
  currentFile: string | null;
  dirty: boolean;
  revision: number;
}

export type ProjectAction =
  | { type: 'replace'; name: string; files: ProjectFile[]; currentFile?: string | null }
  | { type: 'reset'; name: string }
  | { type: 'select'; path: string }
  | { type: 'write'; path: string; content: string }
  | { type: 'upsert'; file: ProjectFile }
  | { type: 'rename'; from: string; to: string }
  | { type: 'remove'; path: string }
  | { type: 'remove-folder'; path: string }
  | { type: 'saved'; revision: number; name?: string };

export interface AuthSession {
  email: string;
}

export interface ProjectSummary {
  pno: string;
  name: string;
  description: string | null;
  created_at: string;
  is_owner: boolean;
  owner_email: string;
}

export interface ProjectDto extends Omit<ProjectSummary, 'owner_email'> {
  files: Array<{
    fno: string;
    filename: string;
    content: string;
    file_type: FileType;
    created_at: string;
  }>;
}

export interface Collaborator {
  email: string;
}

export interface CompileResult {
  pdf: string;
  logs: string;
  hasErrors: boolean;
}

export interface CompilationError {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
}

export interface ImageData {
  base64: string;
  mimeType: string;
  extension: string;
}

export interface FigureOptions {
  caption: string;
  label: string;
  width: string;
}

export interface EditorHandle {
  getView: () => import('@codemirror/view').EditorView | null;
  goToLine: (line: number) => void;
}

export const isFileType = (value: string): value is FileType =>
  FILE_TYPES.includes(value.toLowerCase() as FileType);

export const isBinaryType = (type: FileType): boolean =>
  BINARY_TYPES.includes(type as (typeof BINARY_TYPES)[number]);
