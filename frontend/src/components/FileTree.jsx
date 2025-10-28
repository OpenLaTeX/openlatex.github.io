import { useState } from 'react';

function buildTree(files) {
  const root = { type: 'folder', name: '', children: [] };

  files.forEach(file => {
    const parts = file.path.split('/');
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const existing = current.children.find(c => c.name === part);

      if (existing) {
        current = existing;
      } else {
        const node = {
          type: isFile ? 'file' : 'folder',
          name: part,
          path: isFile ? file.path : null,
          children: isFile ? null : []
        };
        current.children.push(node);
        current = node;
      }
    });
  });

  return root.children;
}

function TreeNode({ node, level, currentFile, onSelect, onRename, onDelete }) {
  const [isOpen, setIsOpen] = useState(true);

  if (node.type === 'file') {
    return (
      <div className="tree-file" style={{ paddingLeft: `${level * 15}px` }}>
        <span onClick={() => onSelect(node.path)} className={currentFile === node.path ? 'active' : ''}>
          - {node.name}
        </span>
        <button onClick={() => onRename(node.path)}>rename</button>
        <button onClick={() => onDelete(node.path)}>del</button>
      </div>
    );
  }

  return (
    <div className="tree-folder">
      <div style={{ paddingLeft: `${level * 15}px` }}>
        <span onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? 'v' : '>'} {node.name}
        </span>
      </div>
      {isOpen && node.children.map((child, i) => (
        <TreeNode
          key={i}
          node={child}
          level={level + 1}
          currentFile={currentFile}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default function FileTree({ files, currentFile, onSelect, onRename, onDelete }) {
  const tree = buildTree(files);

  return (
    <div className="file-tree">
      {tree.map((node, i) => (
        <TreeNode
          key={i}
          node={node}
          level={0}
          currentFile={currentFile}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
