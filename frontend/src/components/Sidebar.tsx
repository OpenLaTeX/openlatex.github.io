import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Image,
  Menu,
  Stack,
  Text,
  Tooltip
} from '@mantine/core';
import {
  ChevronDown,
  Download,
  FilePlus,
  Files,
  FolderOpen,
  FolderUp,
  LogOut,
  Play,
  Save,
  Settings,
  User,
  Users
} from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { useWorkspace } from '../hooks/useWorkspace';
import { FileTree } from './FileTree';

type Workspace = ReturnType<typeof useWorkspace>;

interface Props {
  workspace: Workspace;
  email: string | null;
  onAuth: () => void;
  onLogout: () => void;
  onProjects: () => void;
  onSettings: () => void;
  onCollaborators: () => void;
}

const saveStatus = (workspace: Workspace, savedLabel: string) => {
  if (workspace.projectId && !workspace.owner) {
    return { color: 'red', text: 'Seul le propriétaire peut sauvegarder' };
  }
  if (workspace.lastSaved) {
    const time = workspace.lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { color: 'dimmed', text: `${savedLabel} ${time}` };
  }
  if (workspace.project.dirty) {
    return { color: 'dimmed', text: 'Modifications non sauvegardées' };
  }
  return { color: 'dimmed', text: 'À jour' };
};

export const Sidebar = ({
  workspace,
  email,
  onAuth,
  onLogout,
  onProjects,
  onSettings,
  onCollaborators
}: Props) => {
  const { t } = useTranslation();
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const projectSize = workspace.project.files.reduce((size, file) => size + file.content.length, 0);
  const status = saveStatus(workspace, t('savedAt'));
  let projectMeta = t('newProject');
  if (workspace.projectId) {
    projectMeta = `${workspace.projectId.slice(0, 6)} · ${(projectSize / 1_048_576).toFixed(2)} Mo`;
  }

  return (
    <Stack h="100%" gap={0} bg="var(--openlatex-sidebar)">
      <Stack p="md" gap="sm">
        <Image src="/assets/logo.png" alt="OpenLaTeX" h={54} fit="contain" />
        {email ? (
          <Menu width="target">
            <Menu.Target>
              <Button
                variant="default"
                fullWidth
                leftSection={<User size={16} />}
                rightSection={<ChevronDown size={14} />}
                justify="space-between"
              >
                <Text fz={12} truncate>{email}</Text>
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<LogOut size={14} />} onClick={onLogout}>
                {t('logout')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        ) : (
          <Button variant="default" fullWidth onClick={onAuth}>{t('signIn')}</Button>
        )}
      </Stack>
      <Divider />
      <Stack p="md" gap="xs">
        <Text fz={10} fw={700} c="dimmed">{t('actions').toUpperCase()}</Text>
        <Group grow gap="xs">
          <Button
            size="xs"
            fz={12}
            radius={6}
            leftSection={<Play size={14} />}
            loading={workspace.loading}
            onClick={() => void workspace.compile()}
          >
            {t('compile')}
          </Button>
          <Button
            size="xs"
            fz={12}
            radius={6}
            variant="default"
            leftSection={<Save size={14} />}
            disabled={Boolean(workspace.projectId && !workspace.owner)}
            onClick={() => void workspace.save()}
          >
            {t('save')}
          </Button>
        </Group>
        <Text size="xs" c={status.color}>{status.text}</Text>
      </Stack>
      <Divider />
      <Stack p="md" gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Box miw={0}>
            <Text size="sm" fw={600} truncate>{workspace.project.name}</Text>
            <Text size="xs" c="dimmed">{projectMeta}</Text>
          </Box>
          <Text size="xs" c={workspace.collaboration.status === 'connected' ? 'green' : 'dimmed'}>
            {workspace.collaboration.status === 'connected' ? '●' : '○'}
          </Text>
        </Group>
        {email && (
          <Stack gap={4}>
            <Button
              size="compact-xs"
              variant="subtle"
              justify="flex-start"
              leftSection={<FolderOpen size={14} />}
              onClick={onProjects}
            >
              {t('openProject')}
            </Button>
            {workspace.projectId && (
              <Button
                size="compact-xs"
                variant="subtle"
                justify="flex-start"
                leftSection={<Download size={14} />}
                onClick={() => void workspace.download()}
              >
                {t('exportZip')}
              </Button>
            )}
            {workspace.projectId && workspace.owner && (
              <Button
                size="compact-xs"
                variant="subtle"
                justify="flex-start"
                leftSection={<Users size={14} />}
                onClick={onCollaborators}
              >
                {t('inviteCollaborator')}
              </Button>
            )}
          </Stack>
        )}
      </Stack>
      <Divider />
      <Stack flex={1} mih={0} p="sm" gap="xs">
        <Group justify="space-between">
          <Text fz={10} fw={700} c="dimmed">{t('files').toUpperCase()}</Text>
          <Group gap={2}>
            <Tooltip label="Ajouter des fichiers">
              <ActionIcon aria-label="Ajouter des fichiers" variant="subtle" size="sm" onClick={() => fileInput.current?.click()}>
                <FilePlus size={15} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Ajouter un dossier">
              <ActionIcon aria-label="Ajouter un dossier" variant="subtle" size="sm" onClick={() => folderInput.current?.click()}>
                <FolderUp size={15} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Nouveau fichier">
              <ActionIcon aria-label="Nouveau fichier" variant="subtle" size="sm" onClick={() => void workspace.createFile()}>
                <Files size={15} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
        <input
          ref={fileInput}
          hidden
          type="file"
          multiple
          onChange={(event) => {
            if (event.currentTarget.files) void workspace.upload(event.currentTarget.files);
            event.currentTarget.value = '';
          }}
        />
        <input
          ref={folderInput}
          hidden
          type="file"
          multiple
          {...{ webkitdirectory: '' }}
          onChange={(event) => {
            if (event.currentTarget.files) void workspace.upload(event.currentTarget.files);
            event.currentTarget.value = '';
          }}
        />
        <FileTree
          files={workspace.project.files}
          current={workspace.project.currentFile}
          onSelect={workspace.select}
          onRename={(path) => void workspace.rename(path)}
          onRemove={(path) => void workspace.remove(path)}
          onRemoveFolder={(path) => void workspace.removeFolder(path)}
          onMove={workspace.move}
        />
      </Stack>
      <Divider />
      <Box p="sm">
        <Button
          variant="subtle"
          color="gray"
          fullWidth
          justify="flex-start"
          leftSection={<Settings size={15} />}
          onClick={onSettings}
        >
          {t('settings')}
        </Button>
      </Box>
    </Stack>
  );
};
