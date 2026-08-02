import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { getApiUrl } from '../lib/api';
import type { ProjectAction, ProjectFile, ProjectState } from '../types';
import { isBinaryType } from '../types';

const fileFromMap = (
  meta: Y.Map<string>,
  text: Y.Map<Y.Text>,
  path: string
): ProjectFile | null => {
  const raw = meta.get(path);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Pick<ProjectFile, 'type' | 'content'>;
    return {
      path,
      type: value.type,
      content: value.content ?? text.get(path)?.toString() ?? ''
    };
  } catch {
    return null;
  }
};

export const useCollaboration = (
  projectId: string | null,
  project: ProjectState,
  dispatch: React.Dispatch<ProjectAction>
) => {
  const latest = useRef(project);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [filesMap, setFilesMap] = useState<Y.Map<Y.Text> | null>(null);
  const [filesMeta, setFilesMeta] = useState<Y.Map<string> | null>(null);
  const [status, setStatus] = useState<'offline' | 'connecting' | 'connected'>('offline');

  useEffect(() => {
    latest.current = project;
  }, [project]);

  useEffect(() => {
    if (!projectId) return;
    const doc = new Y.Doc();
    const socketUrl = `${getApiUrl().replace(/^http/, 'ws').replace(/\/$/, '')}/collab`;
    const nextProvider = new WebsocketProvider(socketUrl, projectId, doc);
    const text = doc.getMap<Y.Text>('files');
    const meta = doc.getMap<string>('filesMeta');
    setProvider(nextProvider);
    setFilesMap(text);
    setFilesMeta(meta);
    setStatus('connecting');

    nextProvider.on('status', ({ status: value }: { status: string }) => {
      setStatus(value === 'connected' ? 'connected' : 'connecting');
    });

    nextProvider.on('sync', (synced: boolean) => {
      if (!synced || meta.size) return;
      doc.transact(() => {
        for (const file of latest.current.files) {
          meta.set(
            file.path,
            JSON.stringify(
              isBinaryType(file.type)
                ? { type: file.type, content: file.content }
                : { type: file.type }
            )
          );
          if (!isBinaryType(file.type)) {
            const yText = new Y.Text(file.content);
            text.set(file.path, yText);
          }
        }
      });
    });

    const observe = (event: Y.YMapEvent<string>, transaction: Y.Transaction) => {
      if (transaction.local) return;
      for (const [path, change] of event.changes.keys) {
        if (change.action === 'delete') {
          dispatch({ type: 'remove', path });
          continue;
        }
        const file = fileFromMap(meta, text, path);
        if (file) dispatch({ type: 'upsert', file });
      }
    };
    meta.observe(observe);

    const observeText = (events: Y.YEvent<Y.AbstractType<unknown>>[], transaction: Y.Transaction) => {
      if (transaction.local) return;
      const paths = new Set(events.map((event) => event.path[0]).filter((path): path is string => typeof path === 'string'));
      for (const path of paths) {
        const file = fileFromMap(meta, text, path);
        if (file) dispatch({ type: 'upsert', file });
      }
    };
    text.observeDeep(observeText);

    return () => {
      meta.unobserve(observe);
      text.unobserveDeep(observeText);
      nextProvider.destroy();
      doc.destroy();
      setProvider(null);
      setFilesMap(null);
      setFilesMeta(null);
      setStatus('offline');
    };
  }, [projectId, dispatch]);

  const setFile = (file: ProjectFile) => {
    if (!filesMap || !filesMeta) return;
    filesMeta.doc?.transact(() => {
      filesMeta.set(
        file.path,
        JSON.stringify(
          isBinaryType(file.type)
            ? { type: file.type, content: file.content }
            : { type: file.type }
        )
      );
      if (!isBinaryType(file.type)) filesMap.set(file.path, new Y.Text(file.content));
    });
  };

  const remove = (paths: string[]) => {
    filesMeta?.doc?.transact(() => {
      paths.forEach((path) => {
        filesMeta.delete(path);
        filesMap?.delete(path);
      });
    });
  };

  const rename = (from: string, to: string) => {
    if (!filesMap || !filesMeta) return;
    filesMeta.doc?.transact(() => {
      const meta = filesMeta.get(from);
      const text = filesMap.get(from);
      if (meta) filesMeta.set(to, meta);
      if (text) filesMap.set(to, new Y.Text(text.toString()));
      filesMeta.delete(from);
      filesMap.delete(from);
    });
  };

  return {
    awareness: provider?.awareness ?? null,
    filesMap,
    status,
    setFile,
    remove,
    rename
  };
};
