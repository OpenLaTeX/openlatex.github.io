import { ActionIcon, Anchor, Badge, Button, Container, Group, Loader, Paper, Stack, Text, Title, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FolderOpen, Plus, Trash2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { confirmDialog } from '../lib/dialogs';
import { isBinaryType } from '../types';

export const ProjectsView = ({
  onBack,
  onOpen,
  onNew
}: {
  onBack: () => void;
  onOpen: (id: string) => Promise<boolean>;
  onNew: () => Promise<void>;
}) => {
  const { t } = useTranslation();
  const client = useQueryClient();
  const projects = useQuery({ queryKey: ['projects'], queryFn: api.projects });
  const remove = useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => client.invalidateQueries({ queryKey: ['projects'] })
  });

  const download = async (id: string, name: string) => {
    try {
      const project = await api.project(id);
      const zip = new JSZip();
      project.files.forEach((file) =>
        zip.file(file.filename, file.content, isBinaryType(file.file_type) ? { base64: true } : {})
      );
      saveAs(await zip.generateAsync({ type: 'blob' }), `${name}.zip`);
    } catch (error) {
      notifications.show({ color: 'red', message: error instanceof Error ? error.message : t('error') });
    }
  };

  return (
    <Container size={760} py={32}>
      <Group justify="space-between" mb="xl">
        <div>
          <Anchor component="button" size="sm" onClick={onBack}>{t('back')}</Anchor>
          <Title order={1} mt="xs">{t('myProjects')}</Title>
        </div>
        <Button leftSection={<Plus size={16} />} onClick={() => void onNew()}>{t('newProject')}</Button>
      </Group>
      {projects.isPending && <Loader size="sm" />}
      {projects.isError && <Text c="red">{projects.error.message}</Text>}
      <Stack>
        {projects.data?.map((project) => (
          <Paper key={project.pno} withBorder radius="md" p="md">
            <Group justify="space-between" wrap="nowrap">
              <div>
                <Group gap="xs">
                  <Text fw={600}>{project.name}</Text>
                  {!project.is_owner && <Badge variant="light">{t('sharedBy')} {project.owner_email}</Badge>}
                </Group>
                <Text size="xs" c="dimmed">{new Date(project.created_at).toLocaleDateString()}</Text>
              </div>
              <Group gap="xs" wrap="nowrap">
                <Tooltip label={t('open')}>
                  <ActionIcon aria-label={t('open')} variant="light" onClick={() => void onOpen(project.pno)}>
                    <FolderOpen size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={t('download')}>
                  <ActionIcon aria-label={t('download')} variant="subtle" onClick={() => void download(project.pno, project.name)}>
                    <Download size={16} />
                  </ActionIcon>
                </Tooltip>
                {project.is_owner && (
                  <Tooltip label={t('delete')}>
                    <ActionIcon
                      aria-label={t('delete')}
                      color="red"
                      variant="subtle"
                      loading={remove.isPending}
                      onClick={async () => {
                        const confirmed = await confirmDialog(
                          t('deleteProjectTitle'),
                          t('deleteProjectMsg', { name: project.name })
                        );
                        if (confirmed) remove.mutate(project.pno);
                      }}
                    >
                      <Trash2 size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Group>
          </Paper>
        ))}
        {!projects.isPending && !projects.data?.length && <Text c="dimmed">{t('noProjects')}</Text>}
      </Stack>
    </Container>
  );
};
