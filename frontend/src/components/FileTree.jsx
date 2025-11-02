import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, Edit2, Trash2 } from 'lucide-react';
import { FileTreeBuilder } from '../utils/FileTreeBuilder';
import { FileIconMapper } from '../utils/FileIconMapper';
import './FileTree.css';

function TreeNode({ node, level, currentFile, onSelect, onRename, onDelete }) {
  const [isOpen, setIsOpen] = useState(true);

  if (node.type === 'file') {
    return (
      <div className="tree-node-file" style={{ paddingLeft: `${level * 15}px` }}>
        <span
          onClick={() => onSelect(node.path)}
          className={currentFile === node.path ? 'tree-file-name active' : 'tree-file-name'}
        >
          <span className="tree-file-icon">{FileIconMapper.getIcon(node.name)}</span>
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
  const tree = useMemo(() => FileTreeBuilder.buildTree(files), [files]);

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
