import { useMemo, useState } from 'react';
import { ActionIcon, Box, Center, Group, Loader, ScrollArea, Text, Tooltip } from '@mantine/core';
import { ChevronLeft, ChevronRight, Download, FileText, ZoomIn, ZoomOut } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useElementSize } from '@mantine/hooks';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export const PdfViewer = ({ source }: { source: string | null }) => {
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const { ref, width } = useElementSize();
  const pageWidth = useMemo(() => Math.max(240, width - 32) * scale, [scale, width]);

  if (!source) {
    return (
      <Center h="100%">
        <Box ta="center" c="dimmed">
          <FileText size={44} strokeWidth={1.4} />
          <Text fz={14} mt="sm">Le document compilé apparaîtra ici.</Text>
        </Box>
      </Center>
    );
  }

  return (
    <Box ref={ref} h="100%">
      <Group justify="center" gap="xs" h={48} px="sm">
        <ActionIcon aria-label="Page précédente" variant="subtle" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
          <ChevronLeft size={16} />
        </ActionIcon>
        <Text size="xs">{page} / {pages || 1}</Text>
        <ActionIcon aria-label="Page suivante" variant="subtle" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>
          <ChevronRight size={16} />
        </ActionIcon>
        <Tooltip label="Réduire">
          <ActionIcon aria-label="Réduire" variant="subtle" onClick={() => setScale((value) => Math.max(0.5, value - 0.1))}>
            <ZoomOut size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Agrandir">
          <ActionIcon aria-label="Agrandir" variant="subtle" onClick={() => setScale((value) => Math.min(2, value + 0.1))}>
            <ZoomIn size={16} />
          </ActionIcon>
        </Tooltip>
        <ActionIcon aria-label="Télécharger le PDF" component="a" href={source} download="document.pdf" variant="subtle">
          <Download size={16} />
        </ActionIcon>
      </Group>
      <ScrollArea h="calc(100% - 48px)">
        <Center p="md" style={{ alignItems: 'flex-start' }}>
          <Document
            file={source}
            loading={<Loader size="sm" />}
            onLoadSuccess={({ numPages }) => {
              setPages(numPages);
              setPage((value) => Math.min(value, numPages));
            }}
          >
            <Page pageNumber={page} width={pageWidth} />
          </Document>
        </Center>
      </ScrollArea>
    </Box>
  );
};
