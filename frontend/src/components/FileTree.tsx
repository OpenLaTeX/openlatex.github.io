import type { NodeRendererProps } from 'react-arborist';
import { Tree } from 'react-arborist';
import { ActionIcon, Box, Group, Menu, Text, ThemeIcon } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import {
  ChevronRight,
  File,
  FileCode,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2
} from 'lucide-react';
import { buildTree, movePath, type TreeItem } from '../lib/files';
import type { ProjectFile } from '../types';

interface Props {
  files: ProjectFile[];
  current: string | null;
  onSelect: (path: string) => void;
  onRename: (path: string) => void;
  onRemove: (path: string) => void;
  onRemoveFolder: (path: string) => void;
  onMove: (from: string, to: string) => void;
}

const indent = 32;

const icon = (item: TreeItem, isOpen: boolean) => {
  if (item.type === 'folder') {
    return (
      <Box component="span" pos="relative" display="inline-flex">
        {isOpen ? <FolderOpen size={15} /> : <Folder size={15} />}
        {!isOpen && (
          <ChevronRight
            size={8}
            strokeWidth={3}
            style={{ position: 'absolute', right: -3, bottom: -1 }}
          />
        )}
      </Box>
    );
  }
  if (['png', 'jpg', 'jpeg'].includes(item.fileType ?? '')) return <FileImage size={15} />;
  if (item.fileType === 'pdf') return <FileText size={15} />;
  if (['cls', 'sty'].includes(item.fileType ?? '')) return <FileCode size={15} />;
  return <File size={15} />;
};

const TreeNode = ({
  node,
  style,
  dragHandle,
  onRename,
  onRemove,
  onRemoveFolder
}: NodeRendererProps<TreeItem> & Pick<Props, 'onRename' | 'onRemove' | 'onRemoveFolder'>) => {
  return (
    <Group
      ref={dragHandle}
      gap={4}
      wrap="nowrap"
      style={{
        ...style,
        paddingLeft: 12 + node.level * indent,
        paddingRight: 12
      }}
      onClick={() => node.isInternal ? node.toggle() : node.handleClick()}
    >
      <Group
        gap={10}
        flex={1}
        px={6}
        py={4}
        wrap="nowrap"
        bg={node.isSelected ? 'var(--openlatex-accent)' : undefined}
        c={node.isSelected ? 'var(--openlatex-accent-text)' : undefined}
      >
        <ThemeIcon
          size="xs"
          variant="transparent"
          color={node.isSelected ? 'var(--openlatex-accent-text)' : 'gray'}
        >
          {icon(node.data, node.isOpen)}
        </ThemeIcon>
        <Text fz={13} fw={node.isSelected ? 600 : 400} truncate flex={1}>
          {node.data.name}
        </Text>
      </Group>
      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon
            aria-label="Actions du fichier"
            size="xs"
            variant="transparent"
            color="gray"
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal size={14} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          {node.isLeaf && (
            <Menu.Item leftSection={<Pencil size={14} />} onClick={() => onRename(node.data.path)}>
              Renommer
            </Menu.Item>
          )}
          <Menu.Item
            color="red"
            leftSection={<Trash2 size={14} />}
            onClick={() => {
              if (node.isLeaf) onRemove(node.data.path);
              else onRemoveFolder(node.data.path);
            }}
          >
            Supprimer
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
};

export const FileTree = (props: Props) => {
  const { ref, height, width } = useElementSize();
  return (
    <Box ref={ref} h="100%" mih={180}>
      <Tree<TreeItem>
        data={buildTree(props.files)}
        width={width || 260}
        height={height || 300}
        rowHeight={32}
        indent={indent}
        selection={props.current ?? undefined}
        disableMultiSelection
        onActivate={(node) => {
          if (node.isLeaf) props.onSelect(node.data.path);
          else node.toggle();
        }}
        onMove={({ dragNodes, parentNode }) => {
          const source = dragNodes[0]?.data.path;
          if (!source) return;
          props.onMove(source, movePath(source, parentNode?.data.path ?? null));
        }}
      >
        {(nodeProps) => <TreeNode {...nodeProps} {...props} />}
      </Tree>
    </Box>
  );
};
