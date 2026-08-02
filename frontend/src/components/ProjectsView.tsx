import { Alert, Box, Button, Container, Group, Paper, SimpleGrid, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { confirmDialog } from '../lib/dialogs';
import { isBinaryType } from '../types';
import './ProjectsView.css';

export const ProjectsView = ({
  onBack,
  onOpen,
  onNew
}: {
  onBack: () => void;
  onOpen: (id: string) => Promise<boolean>;
  onNew: () => Promise<void>;
}) => {
  const { t, i18n } = useTranslation();
  const dateFormat = new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language);
  const client = useQueryClient();
  const projects = useQuery({ queryKey: ['projects'], queryFn: api.projects });
  const remove = useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => client.invalidateQueries({ queryKey: ['projects'] }),
    onError: (error) => notifications.show({
      color: 'red',
      message: t('cannotDeleteProject', { message: error.message })
    })
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
      notifications.show({
        color: 'red',
        message: t('cannotDownloadProject', {
          message: error instanceof Error ? error.message : t('error')
        })
      });
    }
  };

  return (
    <Container size={800} p={20} h="100dvh" style={{ overflowY: 'auto' }}>
      <Button variant="default" size="xs" mb={20} onClick={onBack}>{t('back')}</Button>
      <Box py={40}>
        <Title order={3} fz={20} fw={600} mb={24}>{t('myProjects')}</Title>

        {projects.isError && (
          <Alert color="red" variant="light" mb={16} className="projects-view-error">
            {t('cannotLoadProjects', { message: projects.error.message })}
          </Alert>
        )}

        <Button mb={24} onClick={() => void onNew()}>{t('newProject')}</Button>

        {projects.isPending ? (
          <Text ta="center" c="dimmed" py={40}>{t('loading')}</Text>
        ) : projects.data?.length ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={16}>
            {projects.data.map((project) => (
              <Paper key={project.pno} className="projects-view-card" withBorder radius="md" p={20}>
                <Box miw={0}>
                  <Text fz={15} fw={600} mb={6} truncate="end" title={project.name}>
                    {project.name}
                  </Text>
                  {!project.is_owner && (
                    <Text fz={11} c="var(--openlatex-accent)" mb={4}>
                      {t('sharedBy')} {project.owner_email}
                    </Text>
                  )}
                  {project.description && (
                    <Text fz={13} c="dimmed" lh={1.5} my={8} lineClamp={2}>
                      {project.description}
                    </Text>
                  )}
                  <Text fz={11} c="dimmed" mt={10}>
                    {dateFormat.format(new Date(project.created_at))}
                  </Text>
                  <Text fz={10} c="dimmed" opacity={0.6}>{project.pno.slice(0, 5)}</Text>
                </Box>

                <Group
                  className="projects-view-actions"
                  grow
                  preventGrowOverflow={false}
                  gap={8}
                  mt={16}
                  pt={16}
                  wrap="nowrap"
                >
                  <Button className="projects-view-action-button" size="xs" onClick={() => void onOpen(project.pno)}>
                    {t('open')}
                  </Button>
                  <Button
                    className="projects-view-action-button"
                    size="xs"
                    variant="default"
                    leftSection={<Download size={16} />}
                    style={{ flexGrow: 1.4 }}
                    onClick={() => void download(project.pno, project.name)}
                  >
                    {t('download')}
                  </Button>
                  {project.is_owner && (
                    <Button
                      className="projects-view-action-button"
                      size="xs"
                      variant="default"
                      loading={remove.isPending}
                      onClick={async () => {
                        const confirmed = await confirmDialog(
                          t('deleteProjectTitle'),
                          t('deleteProjectMsg', { name: project.name })
                        );
                        if (confirmed) remove.mutate(project.pno);
                      }}
                    >
                      {t('delete')}
                    </Button>
                  )}
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        ) : (
          <Paper withBorder radius="md" p="60px 20px" ta="center" className="projects-view-empty">
            <Text c="dimmed">{t('noProjects')}</Text>
          </Paper>
        )}
      </Box>
    </Container>
  );
};
