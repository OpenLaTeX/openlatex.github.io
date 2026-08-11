import { Alert, ScrollArea, Stack, Text } from '@mantine/core';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CompilationError } from '../types';

export const ErrorPanel = ({
  errors,
  onSelect
}: {
  errors: CompilationError[];
  onSelect: (line: number) => void;
}) => {
  const { t } = useTranslation();
  return (
    <ScrollArea h={Math.min(220, 72 + errors.length * 52)} p="sm">
      <Stack gap="xs">
        {errors.map((error, index) => (
          <Alert
            key={`${error.message}-${index}`}
            icon={<AlertCircle size={16} />}
            color="red"
            variant="light"
            onClick={() => error.line && onSelect(error.line)}
            style={{ cursor: error.line ? 'pointer' : 'default' }}
          >
            <Text size="xs">{error.message}{error.line ? ` · ${t('lineInline')} ${error.line}` : ''}</Text>
          </Alert>
        ))}
      </Stack>
    </ScrollArea>
  );
};
