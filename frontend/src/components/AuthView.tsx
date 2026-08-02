import { Anchor, Button, Container, Image, Paper, PasswordInput, SegmentedControl, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { useAuth } from '../hooks/useAuth';

type Auth = ReturnType<typeof useAuth>;

export const AuthView = ({ auth, onBack }: { auth: Auth; onBack: () => void }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => /^\S+@\S+$/.test(value) ? null : 'Email invalide',
      password: (value) => value.length >= 8 ? null : '8 caractères minimum'
    }
  });

  const submit = form.onSubmit(async (values) => {
    try {
      if (mode === 'register') {
        await auth.register.mutateAsync(values);
        notifications.show({ color: 'navy', message: t('accountCreated') });
        setMode('login');
        return;
      }
      await auth.login.mutateAsync(values);
      onBack();
    } catch (error) {
      notifications.show({
        color: 'red',
        message: error instanceof Error ? error.message : t('error')
      });
    }
  });

  return (
    <Container size={420} py={48}>
      <Anchor component="button" size="sm" onClick={onBack}>{t('back')}</Anchor>
      <Image
        src="/assets/logo.png"
        alt="OpenLaTeX"
        h={54}
        maw={260}
        mx="auto"
        mt="lg"
        mb="xl"
        fit="contain"
      />
      <Paper withBorder shadow="sm" radius="md" p="xl">
        <form onSubmit={submit}>
          <Stack>
            <SegmentedControl
              fullWidth
              value={mode}
              onChange={(value) => setMode(value as 'login' | 'register')}
              data={[
                { value: 'login', label: t('login') },
                { value: 'register', label: t('register') }
              ]}
            />
            <TextInput
              label="Email"
              type="email"
              autoComplete="email"
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label={t('password')}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              {...form.getInputProps('password')}
            />
            <Button type="submit" loading={auth.login.isPending || auth.register.isPending}>
              {mode === 'login' ? t('loginButton') : t('createAccount')}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};
