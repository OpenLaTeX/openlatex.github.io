import { lazy, Suspense, useState, type ReactNode } from 'react';
import {
  ActionIcon,
  Box,
  Burger,
  Center,
  Drawer,
  Group,
  Image,
  Loader,
  ScrollArea,
  Stack,
  Tabs,
  Text
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { FileText, PanelRight, Play } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useTranslation } from 'react-i18next';
import type { useWorkspace } from '../hooks/useWorkspace';
import type { EditorHandle } from '../types';
import { CodeEditor } from './CodeEditor';
import { ErrorPanel } from './ErrorPanel';
import { Sidebar } from './Sidebar';

const PdfViewer = lazy(() =>
  import('./PdfViewer').then((module) => ({ default: module.PdfViewer }))
);

type WorkspaceController = ReturnType<typeof useWorkspace>;

interface Props {
  workspace: WorkspaceController;
  editorRef: React.RefObject<EditorHandle | null>;
  email: string | null;
  dark: boolean;
  onAuth: () => void;
  onLogout: () => void;
  onProjects: () => void;
  onSettings: () => void;
  onCollaborators: () => void;
}

const ResizeHandle = () => (
  <PanelResizeHandle>
    <Box w={4} h="100%" bg="var(--mantine-color-default-border)" />
  </PanelResizeHandle>
);

const Pdf = ({ source }: { source: string | null }) => (
  <Suspense fallback={<Center h="100%"><Loader size="sm" /></Center>}>
    <PdfViewer source={source} />
  </Suspense>
);

export const Workspace = ({
  workspace,
  editorRef,
  email,
  dark,
  onAuth,
  onLogout,
  onProjects,
  onSettings,
  onCollaborators
}: Props) => {
  const { t } = useTranslation();
  const compact = useMediaQuery('(max-width: 64em)');
  const [drawer, setDrawer] = useState(false);
  const [tab, setTab] = useState<string | null>('editor');
  const file = workspace.project.files.find((item) => item.path === workspace.project.currentFile) ?? null;
  let editor: ReactNode = (
    <CodeEditor
      ref={editorRef}
      documentKey={`${workspace.project.key}:${file?.path ?? 'empty'}`}
      value={file?.content ?? ''}
      dark={dark}
      yText={file ? workspace.collaboration.filesMap?.get(file.path) ?? null : null}
      awareness={workspace.collaboration.awareness}
      onChange={workspace.write}
      onCompile={() => void workspace.compile()}
      onFigure={file?.type === 'tex' ? () => void workspace.insertFigure() : null}
    />
  );

  if (file && ['png', 'jpg', 'jpeg'].includes(file.type)) {
    const mimeType = file.type === 'jpg' ? 'jpeg' : file.type;
    editor = (
      <ScrollArea h="100%">
        <Center p="xl">
          <Image
            src={`data:image/${mimeType};base64,${file.content}`}
            alt={file.path}
            maw="100%"
          />
        </Center>
      </ScrollArea>
    );
  }

  if (file?.type === 'pdf') {
    editor = <Pdf source={`data:application/pdf;base64,${file.content}`} />;
  }

  const editorPane = (
    <Stack h="100%" gap={0}>
      <Group h={48} px="md" wrap="nowrap">
        <FileText size={15} />
        <Text size="sm" fw={600} truncate>{file?.path ?? t('untitled')}</Text>
      </Group>
      <Box flex={1} mih={0}>{editor}</Box>
    </Stack>
  );

  const sidebar = (
    <Sidebar
      workspace={workspace}
      email={email}
      onAuth={onAuth}
      onLogout={onLogout}
      onProjects={onProjects}
      onSettings={onSettings}
      onCollaborators={onCollaborators}
    />
  );

  const errors = workspace.errors.length > 0 && (
    <ErrorPanel errors={workspace.errors} onSelect={(line) => editorRef.current?.goToLine(line)} />
  );

  if (compact) {
    return (
      <Stack h="100dvh" gap={0}>
        <Group h={48} px="xs" justify="space-between" wrap="nowrap">
          <Burger aria-label={t('openFiles')} opened={drawer} onClick={() => setDrawer((value) => !value)} size="sm" />
          {file ? (
            <Text size="sm" fw={600} truncate>{file.path}</Text>
          ) : (
            <Image src="/assets/logo.png" alt="OpenLaTeX" h={24} w={100} fit="contain" />
          )}
          <ActionIcon aria-label={t('compile')} variant="subtle" loading={workspace.loading} onClick={() => void workspace.compile()}>
            <Play size={17} />
          </ActionIcon>
        </Group>
        <Drawer
          opened={drawer}
          onClose={() => setDrawer(false)}
          withCloseButton={false}
          size="min(100%, 280px)"
          padding={0}
        >
          {sidebar}
        </Drawer>
        <Tabs value={tab} onChange={setTab} flex={1} mih={0} keepMounted={false}>
          <Tabs.List grow>
            <Tabs.Tab value="editor" leftSection={<FileText size={14} />}>{t('editor')}</Tabs.Tab>
            <Tabs.Tab value="pdf" leftSection={<PanelRight size={14} />}>PDF</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="editor" h="calc(100% - 37px)">{editorPane}</Tabs.Panel>
          <Tabs.Panel value="pdf" h="calc(100% - 37px)"><Pdf source={workspace.pdfUrl} /></Tabs.Panel>
        </Tabs>
        {errors}
      </Stack>
    );
  }

  return (
    <Stack h="100dvh" gap={0}>
      <Box flex={1} mih={0}>
        <PanelGroup direction="horizontal" autoSaveId="openlatex-workspace">
          <Panel defaultSize={20} minSize={16} maxSize={30}>{sidebar}</Panel>
          <ResizeHandle />
          <Panel defaultSize={43} minSize={30}>{editorPane}</Panel>
          <ResizeHandle />
          <Panel defaultSize={37} minSize={20}><Pdf source={workspace.pdfUrl} /></Panel>
        </PanelGroup>
      </Box>
      {errors}
    </Stack>
  );
};
