import { Button, Group, NumberInput, Stack, Text, TextInput } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useState } from 'react';
import type { FigureOptions } from '../types';

export const confirmDialog = (
  title: string,
  message: string,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler'
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
        <Button variant="default" onClick={() => close(null)}>Annuler</Button>
        <Button disabled={Boolean(error)} onClick={() => close(value.trim())}>Confirmer</Button>
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
  const [caption, setCaption] = useState('');
  const [value, setValue] = useState(label);
  const [width, setWidth] = useState<number | string>(0.8);
  return (
    <Stack>
      <TextInput label="Légende" value={caption} onChange={(e) => setCaption(e.currentTarget.value)} data-autofocus />
      <TextInput label="Label" value={value} onChange={(e) => setValue(e.currentTarget.value)} />
      <NumberInput label="Largeur" min={0.1} max={2} step={0.1} value={width} onChange={setWidth} />
      <Group justify="flex-end">
        <Button variant="default" onClick={() => close(null)}>Annuler</Button>
        <Button
          disabled={!caption.trim()}
          onClick={() => close({ caption: caption.trim(), label: value.trim(), width: String(width) })}
        >
          Insérer
        </Button>
      </Group>
    </Stack>
  );
};

export const figureDialog = (label: string) =>
  new Promise<FigureOptions | null>((resolve) => {
    let done = false;
    const id = modals.open({
      title: 'Insérer une figure',
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
