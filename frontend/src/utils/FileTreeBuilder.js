export class FileTreeBuilder {
  static buildTree(files) {
    const root = { type: 'folder', name: '', children: [] };

    files.forEach(file => {
      this.addFileToTree(root, file);
    });

    return root.children;
  }

  static addFileToTree(root, file) {
    const parts = file.path.split('/');
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const existing = current.children.find(c => c.name === part);

      if (existing) {
        current = existing;
      } else {
        const node = this.createNode(part, isFile, file.path);
        current.children.push(node);
        current = node;
      }
    });
  }

  static createNode(name, isFile, path) {
    return {
      type: isFile ? 'file' : 'folder',
      name,
      path: isFile ? path : null,
      children: isFile ? null : []
    };
  }
}
