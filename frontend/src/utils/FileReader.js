export class FileReaderUtil {
  static isTextFile(filename) {
    return /\.(tex|cls|sty|txt|md)$/i.test(filename);
  }

  static readFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      const isText = FileReaderUtil.isTextFile(file.name);

      if (isText) {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsText(file);
      } else {
        reader.onload = (e) => resolve(e.target.result.split(',')[1]);
        reader.readAsDataURL(file);
      }
    });
  }

  static async readFiles(files) {
    const results = [];
    for (const file of files) {
      const content = await FileReaderUtil.readFile(file);
      results.push({ file, content });
    }
    return results;
  }

  static getFileExtension(filename) {
    return filename.split('.').pop();
  }

  static getFileType(filename) {
    const ext = FileReaderUtil.getFileExtension(filename).toLowerCase();
    const types = ['tex', 'cls', 'sty', 'png', 'jpg', 'jpeg', 'pdf'];
    return types.includes(ext) ? ext : 'tex';
  }
}
