import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/api';
import { storage } from '../lib/storage';
import type { AuthSession } from '../types';

const sessionKey = ['session'];

export const useAuth = () => {
  const client = useQueryClient();
  const hasStoredSession = Boolean(storage.email());
  const session = useQuery({
    queryKey: sessionKey,
    queryFn: api.verify,
    enabled: hasStoredSession,
    retry: false
  });

  useEffect(() => {
    if (session.isError && hasStoredSession) {
      storage.clearEmail();
    }
  }, [hasStoredSession, session.isError]);

  const login = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.login(email, password),
    onSuccess: (_value, { email }) => {
      storage.setEmail(email);
      client.setQueryData<AuthSession>(sessionKey, { email });
    }
  });

  const register = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.register(email, password)
  });

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      storage.clearEmail();
      client.setQueryData(sessionKey, null);
    }
  };

  return {
    session: session.data ?? null,
    checking: hasStoredSession && session.isPending,
    login,
    register,
    logout
  };
};
