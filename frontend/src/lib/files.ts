import type { FileType, ProjectFile } from '../types';
import { fileTypeFromPath } from '../domain/project';
import i18n from '../i18n';
import { isBinaryType } from '../types';

export const readUpload = async (file: File): Promise<ProjectFile> => {
  const type = fileTypeFromPath(file.name);
  if (!type) throw new Error(i18n.t('unsupportedFileType', { name: file.name }));
  const content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(i18n.t('cannotReadFile', { name: file.name })));
    reader.onload = () => {
      const value = String(reader.result ?? '');
      resolve(isBinaryType(type) ? value.split(',')[1] ?? '' : value);
    };
    if (isBinaryType(type)) reader.readAsDataURL(file);
    else reader.readAsText(file);
  });
  return {
    path: file.webkitRelativePath || file.name,
    content,
    type
  };
};

export interface TreeItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  fileType?: FileType;
  children?: TreeItem[];
}

export const buildTree = (files: ProjectFile[]): TreeItem[] => {
  const root: TreeItem = { id: '', name: '', path: '', type: 'folder', children: [] };
  for (const file of files) {
    let parent = root;
    const parts = file.path.split('/');
    parts.forEach((name, index) => {
      const path = parts.slice(0, index + 1).join('/');
      let item = parent.children?.find((child) => child.name === name);
      if (!item) {
        const leaf = index === parts.length - 1;
        item = {
          id: path,
          name,
          path,
          type: leaf ? 'file' : 'folder',
          fileType: leaf ? file.type : undefined,
          children: leaf ? undefined : []
        };
        parent.children?.push(item);
      }
      parent = item;
    });
  }
  return root.children ?? [];
};

export const movePath = (source: string, folder: string | null): string => {
  const name = source.split('/').pop() ?? source;
  return folder ? `${folder}/${name}` : name;
};
