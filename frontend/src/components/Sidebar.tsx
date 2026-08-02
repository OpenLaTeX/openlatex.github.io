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
  Users
} from 'lucide-react';
import { useRef } from 'react';
import type { TFunction } from 'i18next';
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

const saveStatus = (workspace: Workspace, t: TFunction, locale: string) => {
  if (workspace.projectId && !workspace.owner) {
    return { color: 'red', text: t('ownerOnly') };
  }
  if (workspace.lastSaved) {
    const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(workspace.lastSaved);
    return { color: 'dimmed', text: `${t('savedAt')} ${time}` };
  }
  if (workspace.project.dirty) {
    return { color: 'dimmed', text: t('unsavedChanges') };
  }
  return { color: 'dimmed', text: t('upToDate') };
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
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const projectSize = workspace.project.files.reduce((size, file) => size + file.content.length, 0);
  const status = saveStatus(workspace, t, locale);
  let projectMeta = t('newProject');
  if (workspace.projectId) {
    const size = new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'megabyte',
      unitDisplay: 'short',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(projectSize / 1_048_576);
    projectMeta = `${workspace.projectId.slice(0, 6)} · ${size}`;
  }

  return (
    <Stack h="100%" gap={0} bg="var(--openlatex-sidebar)">
      <Stack p="md" gap="sm">
        <Box
          component="a"
          href="https://github.com/OpenLaTeX/openlatex.github.io"
          target="_blank"
          rel="noreferrer"
          aria-label={t('repositoryLabel')}
        >
          <Image src="/assets/logo.png" alt="OpenLaTeX" h={54} fit="contain" />
        </Box>
        {email ? (
          <Menu width="target">
            <Menu.Target>
              <Button
                variant="default"
                fullWidth
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
              fw={400}
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
                fw={400}
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
                fw={400}
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
            <Tooltip label={t('addFile')}>
              <ActionIcon aria-label={t('addFile')} variant="subtle" size="sm" onClick={() => fileInput.current?.click()}>
                <FilePlus size={15} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t('addFolder')}>
              <ActionIcon aria-label={t('addFolder')} variant="subtle" size="sm" onClick={() => folderInput.current?.click()}>
                <FolderUp size={15} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t('newFile')}>
              <ActionIcon aria-label={t('newFile')} variant="subtle" size="sm" onClick={() => void workspace.createFile()}>
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
