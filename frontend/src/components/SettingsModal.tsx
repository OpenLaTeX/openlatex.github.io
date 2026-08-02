import { Anchor, Button, Group, Modal, SegmentedControl, Select, Stack, Switch, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Activity, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiUrl, setApiUrl } from '../lib/api';

interface Props {
  opened: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onTheme: (theme: 'light' | 'dark') => void;
  autoSave: boolean;
  onAutoSave: (enabled: boolean) => void;
  interval: number;
  onInterval: (minutes: number) => void;
}

export const SettingsModal = (props: Props) => {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState(getApiUrl());

  const saveUrl = () => {
    try {
      setApiUrl(url);
      notifications.show({ color: 'green', message: 'URL enregistrée' });
    } catch {
      notifications.show({ color: 'red', message: 'URL invalide' });
    }
  };

  return (
    <Modal opened={props.opened} onClose={props.onClose} title={t('settingsTitle')} size="lg" padding="xl">
      <Stack gap={40}>
        <Stack gap="lg">
          <Title order={3} size="sm">{t('appearance')}</Title>
          <Text size="xs" c="dimmed">{t('themeDesc')}</Text>
          <SegmentedControl
            fullWidth
            value={props.theme}
            onChange={(value) => props.onTheme(value as 'light' | 'dark')}
            data={[
              { value: 'light', label: t('light') },
              { value: 'dark', label: t('dark') }
            ]}
          />
          <SegmentedControl
            fullWidth
            value={i18n.language === 'en' ? 'en' : 'fr'}
            onChange={(value) => void i18n.changeLanguage(value)}
            data={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]}
          />
        </Stack>
        <Stack gap="lg">
          <Title order={3} size="sm">{t('configuration')}</Title>
          <Group justify="space-between">
            <div>
              <Text size="sm">{t('autosave')}</Text>
              <Text size="xs" c="dimmed">{t('autosaveDesc')}</Text>
            </div>
            <Group>
              {props.autoSave && (
                <Select
                  w={100}
                  value={String(props.interval)}
                  onChange={(value) => value && props.onInterval(Number(value))}
                  data={['1', '2', '5', '10', '30'].map((value) => ({ value, label: `${value} min` }))}
                />
              )}
              <Switch checked={props.autoSave} onChange={(event) => props.onAutoSave(event.currentTarget.checked)} />
            </Group>
          </Group>
          <Group align="flex-end">
            <TextInput
              flex={1}
              label={t('apiUrl')}
              description={t('apiUrlDesc')}
              value={url}
              onChange={(event) => setUrl(event.currentTarget.value)}
            />
            <Button variant="default" onClick={saveUrl}>Enregistrer</Button>
          </Group>
        </Stack>
        <Stack gap="lg">
          <Title order={3} size="sm">{t('about')}</Title>
          <Anchor href={`${getApiUrl()}/grafana/dashboards`} target="_blank">
            <Group gap="xs"><Activity size={16} /> Grafana <ExternalLink size={13} /></Group>
          </Anchor>
          <Text size="xs" c="dimmed">
            {t('madeBy')} <Anchor href="https://github.com/blavogiez" target="_blank">Baptiste Lavogiez</Anchor>
          </Text>
        </Stack>
      </Stack>
    </Modal>
  );
};
