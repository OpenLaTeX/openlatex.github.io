import type { CompilationError, FigureOptions, ImageData } from '../types';

export const parseLatexLogs = (logs: string): CompilationError[] => {
  const errors: CompilationError[] = [];
  let current: CompilationError | null = null;
  for (const line of logs.split('\n')) {
    if (line.startsWith('!')) {
      if (current) errors.push(current);
      current = { type: 'error', message: line.slice(1).trim() };
      continue;
    }
    const match = current && line.match(/^l\.(\d+)/);
    if (match && current) current.line = Number(match[1]);
  }
  if (current) errors.push(current);
  return errors;
};

export const readClipboardImage = async (): Promise<ImageData | null> => {
  const items = await navigator.clipboard.read();
  for (const item of items) {
    const mimeType = item.types.find((type) => type.startsWith('image/'));
    if (!mimeType) continue;
    const blob = await item.getType(mimeType);
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Lecture du presse-papiers impossible'));
      reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
      reader.readAsDataURL(blob);
    });
    return {
      base64,
      mimeType,
      extension: mimeType.includes('jpeg') ? 'jpg' : 'png'
    };
  }
  return null;
};

const slug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const figureDefaults = (content: string, cursor: number, imageName: string) => {
  const source = content.slice(0, cursor);
  const section = [...source.matchAll(/\\section\{([^}]+)\}/g)].pop()?.[1];
  const subsection = [...source.matchAll(/\\subsection\{([^}]+)\}/g)].pop()?.[1];
  const parts = ['figures', section, subsection].filter(Boolean).map((part) => slug(String(part)));
  return {
    path: `${parts.join('/')}/${imageName}`,
    label: ['fig', section, subsection, imageName.split('.')[0]]
      .filter(Boolean)
      .map((part) => slug(String(part)))
      .join('-')
  };
};

const escapeLatex = (value: string) =>
  value
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}]/g, '\\$&')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');

export const figureLatex = (path: string, options: FigureOptions) => `\\begin{figure}[h]
\\centering
\\includegraphics[width=${options.width}\\textwidth]{${path}}
\\caption{${escapeLatex(options.caption)}}
\\label{${options.label}}
\\end{figure}
`;
