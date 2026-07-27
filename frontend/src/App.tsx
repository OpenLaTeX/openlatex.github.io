import { Center, Loader, useMantineColorScheme } from '@mantine/core';
import { useHotkeys } from 'react-hotkeys-hook';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthView } from './components/AuthView';
import { CollaboratorsModal } from './components/CollaboratorsModal';
import { ProjectsView } from './components/ProjectsView';
import { SettingsModal } from './components/SettingsModal';
import { Workspace } from './components/Workspace';
import { useAuth } from './hooks/useAuth';
import { useWorkspace } from './hooks/useWorkspace';
import { confirmDialog } from './lib/dialogs';
import { storage } from './lib/storage';
import type { EditorHandle } from './types';

type View = 'workspace' | 'auth' | 'projects';

export default function App() {
  const { t } = useTranslation();
  const auth = useAuth();
  const editorRef = useRef<EditorHandle>(null);
  const [view, setView] = useState<View>('workspace');
  const [settings, setSettings] = useState(false);
  const [collaborators, setCollaborators] = useState(false);
  const [autoSave, setAutoSaveState] = useState(storage.autoSave);
  const [interval, setIntervalState] = useState(storage.autoSaveInterval);
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const workspace = useWorkspace({
    authenticated: Boolean(auth.session),
    autoSave,
    autoSaveInterval: interval,
    editorRef,
    openAuth: () => setView('auth')
  });

  useHotkeys('mod+enter', () => void workspace.compile(), {
    preventDefault: true,
    enableOnFormTags: false
  });

  if (auth.checking) {
    return <Center h="100dvh"><Loader size="sm" /></Center>;
  }

  if (view === 'auth') {
    return <AuthView auth={auth} onBack={() => setView('workspace')} />;
  }

  if (view === 'projects') {
    return (
      <ProjectsView
        onBack={() => setView('workspace')}
        onOpen={async (id) => {
          const loaded = await workspace.load(id);
          if (loaded) setView('workspace');
          return loaded;
        }}
        onNew={async () => {
          await workspace.reset();
          setView('workspace');
        }}
      />
    );
  }

  const logout = async () => {
    if (
      workspace.project.dirty &&
      !(await confirmDialog(t('logoutConfirmTitle'), t('logoutConfirmMsg')))
    ) return;
    await auth.logout();
    await workspace.reset(true);
  };

  return (
    <>
      <Workspace
        workspace={workspace}
        editorRef={editorRef}
        email={auth.session?.email ?? null}
        dark={colorScheme === 'dark'}
        onAuth={() => setView('auth')}
        onLogout={() => void logout()}
        onProjects={() => setView('projects')}
        onSettings={() => setSettings(true)}
        onCollaborators={() => setCollaborators(true)}
      />
      <SettingsModal
        opened={settings}
        onClose={() => setSettings(false)}
        theme={colorScheme === 'dark' ? 'dark' : 'light'}
        onTheme={(theme) => {
          storage.setTheme(theme);
          setColorScheme(theme);
        }}
        autoSave={autoSave}
        onAutoSave={(enabled) => {
          storage.setAutoSave(enabled);
          setAutoSaveState(enabled);
        }}
        interval={interval}
        onInterval={(minutes) => {
          storage.setAutoSaveInterval(minutes);
          setIntervalState(minutes);
        }}
      />
      <CollaboratorsModal
        projectId={workspace.projectId}
        opened={collaborators}
        onClose={() => setCollaborators(false)}
      />
    </>
  );
}
