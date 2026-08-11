import { Button, Group, NumberInput, Stack, Text, TextInput } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import type { FigureOptions } from '../types';

export const confirmDialog = (
  title: string,
  message: string,
  confirmLabel = i18n.t('confirm'),
  cancelLabel = i18n.t('cancel')
) =>
  new Promise<boolean>((resolve) => {
    let done = false;
    const finish = (value: boolean) => {
      if (done) return;
      done = true;
      resolve(value);
    };
    modals.openConfirmModal({
      title,
      children: <Text size="sm">{message}</Text>,
      labels: { confirm: confirmLabel, cancel: cancelLabel },
      onConfirm: () => finish(true),
      onCancel: () => finish(false),
      onClose: () => finish(false)
    });
  });

interface PromptProps {
  label: string;
  initial: string;
  validate?: (value: string) => string | null;
  close: (value: string | null) => void;
}

const Prompt = ({ label, initial, validate, close }: PromptProps) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(initial);
  const error = validate?.(value) ?? null;
  return (
    <Stack>
      <TextInput
        label={label}
        value={value}
        error={value ? error : null}
        onChange={(event) => setValue(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !error) close(value.trim());
        }}
        data-autofocus
      />
      <Group justify="flex-end">
        <Button variant="default" onClick={() => close(null)}>{t('cancel')}</Button>
        <Button disabled={Boolean(error)} onClick={() => close(value.trim())}>{t('confirm')}</Button>
      </Group>
    </Stack>
  );
};

export const promptDialog = (
  title: string,
  label: string,
  initial = '',
  validate?: (value: string) => string | null
) =>
  new Promise<string | null>((resolve) => {
    let done = false;
    const id = modals.open({
      title,
      onClose: () => {
        if (!done) resolve(null);
      },
      children: (
        <Prompt
          label={label}
          initial={initial}
          validate={validate}
          close={(value) => {
            done = true;
            modals.close(id);
            resolve(value);
          }}
        />
      )
    });
  });

const FigureForm = ({
  label,
  close
}: {
  label: string;
  close: (value: FigureOptions | null) => void;
}) => {
  const { t } = useTranslation();
  const [caption, setCaption] = useState('');
  const [value, setValue] = useState(label);
  const [width, setWidth] = useState<number | string>(0.8);
  return (
    <Stack>
      <TextInput label={t('captionLabel')} value={caption} onChange={(e) => setCaption(e.currentTarget.value)} data-autofocus />
      <TextInput label={t('labelLabel')} value={value} onChange={(e) => setValue(e.currentTarget.value)} />
      <NumberInput label={t('widthLabel')} min={0.1} max={2} step={0.1} value={width} onChange={setWidth} />
      <Group justify="flex-end">
        <Button variant="default" onClick={() => close(null)}>{t('cancel')}</Button>
        <Button
          disabled={!caption.trim()}
          onClick={() => close({ caption: caption.trim(), label: value.trim(), width: String(width) })}
        >
          {t('insert')}
        </Button>
      </Group>
    </Stack>
  );
};

export const figureDialog = (label: string) =>
  new Promise<FigureOptions | null>((resolve) => {
    let done = false;
    const id = modals.open({
      title: i18n.t('insertFigure'),
      onClose: () => {
        if (!done) resolve(null);
      },
      children: (
        <FigureForm
          label={label}
          close={(value) => {
            done = true;
            modals.close(id);
            resolve(value);
          }}
        />
      )
    });
  });
