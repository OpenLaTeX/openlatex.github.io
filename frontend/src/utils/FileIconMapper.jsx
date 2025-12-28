import { FileText, Image, FileCode, File } from 'lucide-react';

export class FileIconMapper {
  static getIcon(filename) {
    const ext = this.getExtension(filename);
    return this.iconMap[ext] || <File size={16} />;
  }

  static getExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  static iconMap = {
    'tex': <FileText size={16} />,
    'bib': <FileText size={16} />,
    'png': <Image size={16} />,
    'jpg': <Image size={16} />,
    'jpeg': <Image size={16} />,
    'cls': <FileCode size={16} />,
    'sty': <FileCode size={16} />,
    'bst': <FileCode size={16} />
  };
}
