import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Box } from '@mantine/core';
import { EditorState } from '@codemirror/state';
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  HighlightStyle,
  syntaxHighlighting
} from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { tags } from '@lezer/highlight';
import { latex } from 'codemirror-lang-latex';
import { yCollab } from 'y-codemirror.next';
import type * as Y from 'yjs';
import type { WebsocketProvider } from 'y-websocket';
import { useTranslation } from 'react-i18next';
import type { EditorHandle } from '../types';

interface Props {
  documentKey: string;
  value: string;
  dark: boolean;
  yText: Y.Text | null;
  awareness: WebsocketProvider['awareness'] | null;
  onChange: (value: string) => void;
  onCompile: () => void;
  onFigure: (() => void) | null;
}

const codeMirrorTranslationKeys = {
  'Control character': 'codeMirrorControlCharacter',
  'Selection deleted': 'codeMirrorSelectionDeleted',
  Find: 'codeMirrorFind',
  Replace: 'codeMirrorReplace',
  next: 'codeMirrorNext',
  previous: 'codeMirrorPrevious',
  all: 'codeMirrorAll',
  'match case': 'codeMirrorMatchCase',
  regexp: 'codeMirrorRegexp',
  'by word': 'codeMirrorByWord',
  replace: 'codeMirrorReplace',
  'replace all': 'codeMirrorReplaceAll',
  close: 'codeMirrorClose',
  'current match': 'codeMirrorCurrentMatch',
  'on line': 'codeMirrorOnLine',
  'replaced match on line $': 'codeMirrorReplacedMatch',
  'replaced $ matches': 'codeMirrorReplacedMatches',
  'Go to line': 'codeMirrorGoToLine',
  go: 'codeMirrorGo',
  Completions: 'codeMirrorCompletions',
  'Folded lines': 'codeMirrorFoldedLines',
  'Unfolded lines': 'codeMirrorUnfoldedLines',
  to: 'codeMirrorTo',
  'folded code': 'codeMirrorFoldedCode',
  unfold: 'codeMirrorUnfold',
  'Fold line': 'codeMirrorFoldLine',
  'Unfold line': 'codeMirrorUnfoldLine'
} as const;

const palettes = {
  light: {
    text: '#1a1a1a',
    background: '#fafafa',
    selection: '#e0e0e0',
    selectionIdle: '#eeeeee',
    activeLine: '#e8f5e9',
    gutterText: '#999999',
    gutterBorder: '#eeeeee',
    activeGutter: '#f5f5f5'
  },
  dark: {
    text: '#d4d4d4',
    background: '#141414',
    selection: '#2a2a2a',
    selectionIdle: '#1e1e1e',
    activeLine: '#1e1e1e',
    gutterText: '#858585',
    gutterBorder: '#1e1e1e',
    activeGutter: '#1e1e1e'
  }
};

const highlights = {
  light: syntaxHighlighting(HighlightStyle.define([
    { tag: [tags.keyword, tags.controlKeyword, tags.heading], color: '#7c3aed' },
    { tag: [tags.typeName, tags.string], color: '#059669' },
    { tag: [tags.tagName, tags.macroName], color: '#2563eb' },
    { tag: tags.comment, color: '#94a3b8', fontStyle: 'italic' },
    { tag: tags.number, color: '#d97706' },
    { tag: [tags.operator, tags.punctuation], color: '#64748b' },
    { tag: tags.bracket, color: '#0f172a' },
    { tag: tags.heading, fontWeight: 'bold' },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.strong, fontWeight: 'bold' }
  ])),
  dark: syntaxHighlighting(HighlightStyle.define([
    { tag: [tags.keyword, tags.controlKeyword, tags.heading], color: '#a78bfa' },
    { tag: [tags.typeName, tags.string], color: '#34d399' },
    { tag: [tags.tagName, tags.macroName], color: '#60a5fa' },
    { tag: tags.comment, color: '#64748b', fontStyle: 'italic' },
    { tag: tags.number, color: '#fbbf24' },
    { tag: [tags.operator, tags.punctuation], color: '#94a3b8' },
    { tag: tags.bracket, color: '#f8fafc' },
    { tag: tags.heading, fontWeight: 'bold' },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.strong, fontWeight: 'bold' }
  ]))
};

const editorTheme = (dark: boolean) => {
  const mode = dark ? 'dark' : 'light';
  const colors = palettes[mode];
  return EditorView.theme({
    '&': {
      height: '100%',
      color: colors.text,
      backgroundColor: colors.background
    },
    '.cm-scroller': { overflow: 'auto' },
    '.cm-content': {
      fontFamily: '"JetBrains Mono", "Fira Code", Consolas, Monaco, monospace',
      fontSize: '14px',
      caretColor: colors.text
    },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: colors.text },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: `${colors.selection} !important`
    },
    '.cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: colors.selectionIdle
    },
    '.cm-activeLine': { backgroundColor: `${colors.activeLine} !important` },
    '.cm-selectionMatch': { backgroundColor: colors.selection },
    '.cm-gutters': {
      backgroundColor: colors.background,
      color: colors.gutterText,
      borderRight: `1px solid ${colors.gutterBorder}`
    },
    '.cm-activeLineGutter': {
      backgroundColor: colors.activeGutter,
      color: colors.text
    },
    '.cm-lineNumbers .cm-gutterElement': {
      paddingLeft: '12px',
      paddingRight: '12px'
    }
  }, { dark });
};

export const CodeEditor = forwardRef<EditorHandle, Props>(
  ({ documentKey, value, dark, yText, awareness, onChange, onCompile, onFigure }, ref) => {
    const { t } = useTranslation();
    const phrases = useMemo(() => Object.fromEntries(
      Object.entries(codeMirrorTranslationKeys).map(([phrase, key]) => [phrase, t(key)])
    ), [t]);
    const host = useRef<HTMLDivElement>(null);
    const view = useRef<EditorView | null>(null);
    const callbacks = useRef({ onChange, onCompile, onFigure });
    const valueRef = useRef(value);
    callbacks.current = { onChange, onCompile, onFigure };
    valueRef.current = value;

    useImperativeHandle(ref, () => ({
      getView: () => view.current,
      goToLine: (number) => {
        if (!view.current) return;
        const line = view.current.state.doc.line(
          Math.max(1, Math.min(number, view.current.state.doc.lines))
        );
        view.current.dispatch({
          selection: { anchor: line.from },
          scrollIntoView: true
        });
        view.current.focus();
      }
    }));

    useEffect(() => {
      if (!host.current) return;
      const mode = dark ? 'dark' : 'light';
      const shortcuts = [
        { key: 'Mod-Enter', run: () => (callbacks.current.onCompile(), true) },
        ...(callbacks.current.onFigure
          ? [{ key: 'Mod-Shift-v', run: () => (callbacks.current.onFigure?.(), true) }]
          : [])
      ];
      const extensions = [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        EditorState.phrases.of(phrases),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        EditorView.lineWrapping,
        keymap.of([
          ...shortcuts,
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap
        ]),
        editorTheme(dark),
        highlights[mode],
        latex(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) callbacks.current.onChange(update.state.doc.toString());
        }),
        ...(yText && awareness ? [yCollab(yText, awareness)] : [])
      ];
      const next = new EditorView({
        state: EditorState.create({
          doc: yText?.toString() ?? valueRef.current,
          extensions
        }),
        parent: host.current
      });
      view.current = next;
      return () => {
        next.destroy();
        view.current = null;
      };
    }, [documentKey, dark, yText, awareness, phrases]);

    return <Box ref={host} h="100%" style={{ overflow: 'hidden' }} />;
  }
);

CodeEditor.displayName = 'CodeEditor';
