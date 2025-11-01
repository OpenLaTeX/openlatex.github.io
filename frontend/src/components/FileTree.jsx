import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Image, FileCode, File, Edit2, Trash2 } from 'lucide-react';
import './FileTree.css';

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();

  if (ext === 'tex' || ext === 'bib') {
    return <FileText size={16} />;
  }
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
    return <Image size={16} />;
  }
  if (ext === 'cls' || ext === 'sty' || ext === 'bst') {
    return <FileCode size={16} />;
  }
  return <File size={16} />;
}

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
      <div className="tree-node-file" style={{ paddingLeft: `${level * 15}px` }}>
        <span
          onClick={() => onSelect(node.path)}
          className={currentFile === node.path ? 'tree-file-name active' : 'tree-file-name'}
        >
          <span className="tree-file-icon">{getFileIcon(node.name)}</span>
          {node.name}
        </span>
        <div className="tree-file-actions">
          <button onClick={() => onRename(node.path)} className="tree-file-button" title="Renommer">
            <Edit2 size={14} />
          </button>
          <button onClick={() => onDelete(node.path)} className="tree-file-button" title="Supprimer">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tree-node-folder">
      <div className="tree-folder-header" style={{ paddingLeft: `${level * 15}px` }}>
        <span onClick={() => setIsOpen(!isOpen)} className="tree-folder-toggle">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <Folder size={16} className="tree-folder-icon" />
        <span className="tree-folder-name">{node.name}</span>
      </div>
      {isOpen && (
        <div className="tree-folder-children">
          {node.children.map((child, i) => (
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
      )}
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
