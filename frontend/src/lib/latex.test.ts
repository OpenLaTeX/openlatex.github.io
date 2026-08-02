import { describe, expect, it } from 'vitest';
import { figureDefaults, figureLatex, parseLatexLogs } from './latex';

describe('latex', () => {
  it('extracts compilation errors and line numbers', () => {
    const errors = parseLatexLogs('! Undefined control sequence.\nl.12 \\\\unknown');
    expect(errors).toEqual([
      { type: 'error', message: 'Undefined control sequence.', line: 12 }
    ]);
  });

  it('builds a figure path from the current section', () => {
    const source = '\\section{Résultats}\\subsection{Mesures}';
    expect(figureDefaults(source, source.length, 'image.png').path).toBe(
      'figures/r-sultats/mesures/image.png'
    );
  });

  it('escapes captions in generated figures', () => {
    const latex = figureLatex('figures/image.png', {
      caption: 'A & B',
      label: 'fig-image',
      width: '0.8'
    });
    expect(latex).toContain('\\caption{A \\& B}');
  });
});
