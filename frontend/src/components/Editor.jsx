import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { EditorState } from '@codemirror/state';
import { yCollab } from 'y-codemirror.next';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, insertNewline } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { foldGutter, syntaxHighlighting, HighlightStyle, bracketMatching, foldKeymap } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { lintKeymap } from '@codemirror/lint';
import { latex } from 'codemirror-lang-latex';

const lightTheme = EditorView.theme({
  '&': {
    color: '#1a1a1a',
    backgroundColor: '#fafafa'
  },
  '.cm-content': {
    caretColor: '#1a1a1a',
    fontFamily: '"JetBrains Mono", "Fira Code", Consolas, Monaco, monospace',
    fontSize: '14px'
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#1a1a1a' },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#e0e0e0 !important'
  },
  '.cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#eeeeee'
  },
  '.cm-activeLine': { backgroundColor: '#e8f5e9 !important' },
  '.cm-selectionMatch': { backgroundColor: '#e0e0e0' },
  '.cm-gutters': {
    backgroundColor: '#fafafa',
    color: '#999999',
    borderRight: '1px solid #eeeeee'
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#f5f5f5',
    color: '#1a1a1a'
  },
  '.cm-lineNumbers .cm-gutterElement': {
    paddingLeft: '12px',
    paddingRight: '12px'
  }
}, { dark: false });

const darkTheme = EditorView.theme({
  '&': {
    color: '#d4d4d4',
    backgroundColor: '#141414'
  },
  '.cm-content': {
    caretColor: '#d4d4d4',
    fontFamily: '"JetBrains Mono", "Fira Code", Consolas, Monaco, monospace',
    fontSize: '14px'
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#d4d4d4' },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#2a2a2a !important'
  },
  '.cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#1e1e1e'
  },
  '.cm-activeLine': { backgroundColor: '#1e1e1e !important' },
  '.cm-selectionMatch': { backgroundColor: '#2a2a2a' },
  '.cm-gutters': {
    backgroundColor: '#141414',
    color: '#858585',
    borderRight: '1px solid #1e1e1e'
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4'
  },
  '.cm-lineNumbers .cm-gutterElement': {
    paddingLeft: '12px',
    paddingRight: '12px'
  }
}, { dark: true });

const lightHighlightStyle = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: '#7c3aed' },
    { tag: tags.controlKeyword, color: '#7c3aed' },
    { tag: tags.typeName, color: '#059669' },
    { tag: tags.tagName, color: '#2563eb' },
    { tag: tags.macroName, color: '#2563eb' },
    { tag: tags.comment, color: '#94a3b8', fontStyle: 'italic' },
    { tag: tags.string, color: '#059669' },
    { tag: tags.number, color: '#d97706' },
    { tag: tags.operator, color: '#64748b' },
    { tag: tags.punctuation, color: '#64748b' },
    { tag: tags.bracket, color: '#0f172a' },
    { tag: tags.heading, color: '#7c3aed', fontWeight: 'bold' },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.strong, fontWeight: 'bold' }
  ])
);

const darkHighlightStyle = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: '#a78bfa' },
    { tag: tags.controlKeyword, color: '#a78bfa' },
    { tag: tags.typeName, color: '#34d399' },
    { tag: tags.tagName, color: '#60a5fa' },
    { tag: tags.macroName, color: '#60a5fa' },
    { tag: tags.comment, color: '#64748b', fontStyle: 'italic' },
    { tag: tags.string, color: '#34d399' },
    { tag: tags.number, color: '#fbbf24' },
    { tag: tags.operator, color: '#94a3b8' },
    { tag: tags.punctuation, color: '#94a3b8' },
    { tag: tags.bracket, color: '#f8fafc' },
    { tag: tags.heading, color: '#a78bfa', fontWeight: 'bold' },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.strong, fontWeight: 'bold' }
  ])
);

const Editor = forwardRef(({ value, onChange, currentFile, onFigureInsert, theme, yText, awareness }, ref) => {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const onFigureInsertRef = useRef(onFigureInsert);

  useEffect(() => {
    onFigureInsertRef.current = onFigureInsert;
  }, [onFigureInsert]);

  useImperativeHandle(ref, () => ({
    goToLine: (lineNumber) => {
      if (!viewRef.current) return;
      const view = viewRef.current;
      const line = view.state.doc.line(Math.min(lineNumber, view.state.doc.lines));
      view.dispatch({
        selection: { anchor: line.from },
        scrollIntoView: true
      });
      view.focus();
    },
    getView: () => viewRef.current
  }));

  useEffect(() => {
    if (!editorRef.current) return;

    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const customKeymap = [];

    if (onFigureInsertRef.current && currentFile?.type === 'tex') {
      customKeymap.push({
        key: 'Ctrl-Shift-v',
        run: () => {
          onFigureInsertRef.current?.();
          return true;
        }
      });
    }

    const filteredDefaultKeymap = defaultKeymap.filter(
      binding => binding.key !== 'Enter' && binding.key !== 'Shift-Enter'
    );

    const isDark = theme === 'dark';
    const currentTheme = isDark ? darkTheme : lightTheme;
    const currentHighlightStyle = isDark ? darkHighlightStyle : lightHighlightStyle;

    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      currentHighlightStyle,
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      EditorView.lineWrapping,
      keymap.of([
        ...customKeymap,
        ...closeBracketsKeymap,
        ...filteredDefaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
        { key: 'Enter', run: insertNewline },
        { key: 'Shift-Enter', run: insertNewline }
      ]),
      currentTheme,
      latex({
        autoCloseTags: true,
        enableLinting: true,
        enableTooltips: true
      }),
      ...(yText
        ? [yCollab(yText, awareness)]
        : [EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }
          })]
      )
    ];

    const view = new EditorView({
      state: EditorState.create({
        doc: yText ? yText.toString() : (value || ''),
        extensions
      }),
      parent: editorRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [currentFile?.path, theme, yText]);

  return <div ref={editorRef} style={{ flex: 1, overflow: 'auto' }} />;
});

export default Editor;
