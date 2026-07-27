import { ActionIcon, Button, Group, Loader, Modal, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';

export const CollaboratorsModal = ({
  projectId,
  opened,
  onClose
}: {
  projectId: string | null;
  opened: boolean;
  onClose: () => void;
}) => {
  const [email, setEmail] = useState('');
  const client = useQueryClient();
  const key = ['collaborators', projectId];
  const collaborators = useQuery({
    queryKey: key,
    queryFn: () => api.collaborators(projectId as string),
    enabled: opened && Boolean(projectId)
  });
  const invite = useMutation({
    mutationFn: () => api.invite(projectId as string, email),
    onSuccess: () => {
      setEmail('');
      void client.invalidateQueries({ queryKey: key });
    },
    onError: (error) => notifications.show({ color: 'red', message: error.message })
  });
  const remove = useMutation({
    mutationFn: (value: string) => api.removeCollaborator(projectId as string, value),
    onSuccess: () => client.invalidateQueries({ queryKey: key })
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Collaborateurs">
      <Stack>
        <Group align="flex-end">
          <TextInput
            flex={1}
            type="email"
            label="Email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
          <Button
            leftSection={<UserPlus size={16} />}
            loading={invite.isPending}
            disabled={!email}
            onClick={() => invite.mutate()}
          >
            Inviter
          </Button>
        </Group>
        {collaborators.isPending && <Loader size="sm" />}
        {collaborators.data?.map((collaborator) => (
          <Group key={collaborator.email} justify="space-between">
            <Text size="sm">{collaborator.email}</Text>
            <ActionIcon aria-label={`Retirer ${collaborator.email}`} color="red" variant="subtle" onClick={() => remove.mutate(collaborator.email)}>
              <Trash2 size={16} />
            </ActionIcon>
          </Group>
        ))}
      </Stack>
    </Modal>
  );
};
