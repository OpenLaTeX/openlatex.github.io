import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createTheme,
  defaultVariantColorsResolver,
  MantineProvider,
  type CSSVariablesResolver,
  type VariantColorsResolver
} from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import App from './App';
import './i18n';
import { storage } from './lib/storage';

const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-body': '#ffffff',
    '--mantine-color-text': '#0f172a',
    '--mantine-color-default': '#ffffff',
    '--mantine-color-default-hover': '#f1f3f5',
    '--mantine-color-default-color': '#0f172a',
    '--mantine-color-default-border': '#94a3b8',
    '--mantine-color-dimmed': '#64748b',
    '--mantine-color-placeholder': '#94a3b8',
    '--mantine-color-anchor': '#0f172a',
    '--mantine-color-error': '#ef4444',
    '--mantine-color-success': '#10b981',
    '--openlatex-sidebar': '#f8f9fa',
    '--openlatex-accent': '#0f172a',
    '--openlatex-accent-text': '#ffffff',
    '--openlatex-accent-hover': '#334155'
  },
  dark: {
    '--mantine-color-body': '#1a1a1a',
    '--mantine-color-text': '#e5e5e5',
    '--mantine-color-default': '#242424',
    '--mantine-color-default-hover': '#333333',
    '--mantine-color-default-color': '#e5e5e5',
    '--mantine-color-default-border': '#333333',
    '--mantine-color-dimmed': '#999999',
    '--mantine-color-placeholder': '#666666',
    '--mantine-color-anchor': '#e5e5e5',
    '--mantine-color-error': '#f87171',
    '--mantine-color-success': '#10b981',
    '--openlatex-sidebar': '#242424',
    '--openlatex-accent': '#e5e5e5',
    '--openlatex-accent-text': '#1a1a1a',
    '--openlatex-accent-hover': '#cccccc'
  }
});

const variantColorResolver: VariantColorsResolver = (input) => {
  const colors = defaultVariantColorsResolver(input);
  if (input.variant !== 'filled' || (input.color && input.color !== 'navy')) {
    return colors;
  }
  return {
    ...colors,
    background: 'var(--openlatex-accent)',
    hover: 'var(--openlatex-accent-hover)',
    color: 'var(--openlatex-accent-text)',
    border: '1px solid var(--openlatex-accent)'
  };
};

const client = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 }
  }
});

const theme = createTheme({
  primaryColor: 'navy',
  defaultRadius: 'sm',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSizes: {
    xs: '11px',
    sm: '13px',
    md: '13px',
    lg: '16px',
    xl: '20px'
  },
  lineHeights: { md: '1.5' },
  variantColorResolver,
  colors: {
    navy: [
      '#f1f5f9',
      '#e2e8f0',
      '#cbd5e1',
      '#94a3b8',
      '#64748b',
      '#475569',
      '#334155',
      '#1e293b',
      '#0f172a',
      '#020617'
    ]
  },
  components: {
    Button: {
      defaultProps: { size: 'sm', variant: 'filled' }
    },
    ActionIcon: {
      defaultProps: { size: 'md' }
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        defaultColorScheme={storage.theme()}
      >
        <ModalsProvider>
          <Notifications position="top-right" />
          <App />
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
