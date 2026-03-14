import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { getApiUrl } from '../config/settings';

export const useCollaboration = (projectId, project, setProject) => {
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [synced, setSynced] = useState(false);
  const [filesMap, setFilesMap] = useState(null);
  const [filesMeta, setFilesMeta] = useState(null);

  const latestProjectRef = useRef(project);
  useEffect(() => { latestProjectRef.current = project; }, [project]);

  const initializedForProjectRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const wsUrl = getApiUrl().replace(/^https/, 'wss') + '/collab';
    const provider = new WebsocketProvider(wsUrl, projectId, ydoc, { connect: true });
    providerRef.current = provider;

    provider.on('status', ({ status }) => {
      setIsConnected(status === 'connected');
    });

    provider.on('sync', (isSynced) => {
      if (isSynced) setSynced(true);
    });

    setFilesMap(ydoc.getMap('files'));
    setFilesMeta(ydoc.getMap('filesMeta'));

    return () => {
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      setIsConnected(false);
      setSynced(false);
      setFilesMap(null);
      setFilesMeta(null);
    };
  }, [projectId]);

  useEffect(() => {
    if (!filesMap || !filesMeta || !synced || !projectId) return;
    if (initializedForProjectRef.current === projectId) return;
    initializedForProjectRef.current = projectId;
    if (filesMeta.size > 0) return;

    for (const file of latestProjectRef.current.files) {
      const isBinary = ['png', 'jpg', 'jpeg', 'pdf'].includes(file.type);
      filesMeta.set(file.path, JSON.stringify(isBinary ? { type: file.type, content: file.content } : { type: file.type }));
      if (!isBinary && !filesMap.has(file.path)) {
        const yText = new Y.Text();
        if (file.content) yText.insert(0, file.content);
        filesMap.set(file.path, yText);
      }
    }
  }, [synced, projectId, filesMap, filesMeta]);

  useEffect(() => {
    if (!filesMeta || !filesMap) return;
    const handler = (event, transaction) => {
      if (transaction.local) return;
      setProject(prev => {
        let updated = prev;
        for (const [path, change] of event.changes.keys) {
          if (change.action === 'add') {
            if (!updated.getFile(path)) {
              const meta = JSON.parse(filesMeta.get(path) || '{}');
              const type = meta.type || path.split('.').pop() || 'tex';
              updated = updated.addEmptyFile(path, type);
              const content = meta.content || filesMap.get(path)?.toString() || '';
              if (content) updated = updated.updateFileContent(path, content);
            }
          } else if (change.action === 'delete') {
            updated = updated.removeFile(path);
          }
        }
        return updated;
      });
    };
    filesMeta.observe(handler);
    return () => filesMeta.unobserve(handler);
  }, [filesMeta, filesMap]);

  return {
    provider: providerRef.current,
    awareness: providerRef.current?.awareness ?? null,
    filesMap,
    filesMeta,
    synced,
    isConnected
  };
};
