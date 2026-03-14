import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, Edit2, Trash2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { FileTreeBuilder } from '../utils/FileTreeBuilder';
import { FileIconMapper } from '../utils/FileIconMapper';
import './FileTree.css';

function TreeNode({ node, level, currentFile, onSelect, onRename, onDelete, onDeleteFolder, onMove }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  if (node.type === 'file') {
    return (
      <div
        className="tree-node-file"
        style={{ paddingLeft: `${level * 15}px` }}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', node.path);
          e.dataTransfer.effectAllowed = 'move';
        }}
      >
        <span
          onClick={() => onSelect(node.path)}
          className={currentFile === node.path ? 'tree-file-name active' : 'tree-file-name'}
        >
          <span className="tree-file-icon">{FileIconMapper.getIcon(node.name)}</span>
          {node.name}
        </span>
        <div className="tree-file-actions">
          <button onClick={() => onRename(node.path)} className="tree-file-button" title={t.rename}>
            <Edit2 size={14} />
          </button>
          <button onClick={() => onDelete(node.path)} className="tree-file-button" title={t.delete}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tree-node-folder">
      <div
        className={`tree-folder-header${isDragOver ? ' drag-over' : ''}`}
        style={{ paddingLeft: `${level * 15}px` }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDragEnter={(e) => {
          e.stopPropagation();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          const sourcePath = e.dataTransfer.getData('text/plain');
          if (sourcePath && onMove) {
            onMove(sourcePath, node.path);
          }
        }}
      >
        <span onClick={() => setIsOpen(!isOpen)} className="tree-folder-toggle">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <Folder size={16} className="tree-folder-icon" />
        <span className="tree-folder-name">{node.name}</span>
        <button onClick={() => onDeleteFolder(node.path)} className="tree-folder-button" title={t.deleteFolder}>
          <Trash2 size={14} />
        </button>
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
              onDeleteFolder={onDeleteFolder}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTree({ files, currentFile, onSelect, onRename, onDelete, onDeleteFolder, onMove, onMoveToRoot }) {
  const tree = useMemo(() => FileTreeBuilder.buildTree(files), [files]);
  const [isRootDragOver, setIsRootDragOver] = useState(false);

  return (
    <div
      className={`file-tree${isRootDragOver ? ' drag-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDragEnter={() => setIsRootDragOver(true)}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsRootDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsRootDragOver(false);
        const sourcePath = e.dataTransfer.getData('text/plain');
        if (sourcePath && onMoveToRoot) {
          onMoveToRoot(sourcePath);
        }
      }}
    >
      {tree.map((node, i) => (
        <TreeNode
          key={i}
          node={node}
          level={0}
          currentFile={currentFile}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
          onDeleteFolder={onDeleteFolder}
          onMove={onMove}
        />
      ))}
    </div>
  );
}
