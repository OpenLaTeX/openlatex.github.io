import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { getApiUrl } from '../config/settings';

export const useCollaboration = (projectId) => {
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [filesMap, setFilesMap] = useState(null);

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

    setFilesMap(ydoc.getMap('files'));

    return () => {
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      setIsConnected(false);
      setFilesMap(null);
    };
  }, [projectId]);

  return {
    ydoc: ydocRef.current,
    provider: providerRef.current,
    awareness: providerRef.current?.awareness ?? null,
    filesMap,
    isConnected
  };
};
