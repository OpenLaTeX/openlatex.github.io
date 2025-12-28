import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, insertNewline } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { foldGutter, syntaxHighlighting, HighlightStyle, bracketMatching, foldKeymap } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { lintKeymap } from '@codemirror/lint';
import { latex } from 'codemirror-lang-latex';

// wrapper de https://github.com/texlyre/codemirror-lang-latex
// configuration de couleurs à la VSCODE
const editorTheme = EditorView.theme({
  '&': {
    color: '#d4d4d4',
    backgroundColor: '#2d2d2d'
  },
  '.cm-content': {
    caretColor: '#d4d4d4',
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: '18px'
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#d4d4d4' },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#264f78 !important'
  },
  '.cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: '#3a3d41'
  },
  '.cm-activeLine': { backgroundColor: '#282828 !important' },
  '.cm-selectionMatch': { backgroundColor: '#3a3a3a' },
  '.cm-gutters': {
    backgroundColor: '#252525',
    color: '#858585',
    border: 'none'
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#2d2d2d'
  }
}, { dark: true });

const highlightStyle = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: '#5eb3e0' },
    { tag: tags.controlKeyword, color: '#5eb3e0' },
    { tag: tags.typeName, color: '#5eb3e0' },
    { tag: tags.tagName, color: '#5eb3e0' },
    { tag: tags.macroName, color: '#5eb3e0' },
    { tag: tags.comment, color: '#6a9955' },
    { tag: tags.string, color: '#d4d4d4' },
    { tag: tags.number, color: '#b5cea8' },
    { tag: tags.operator, color: '#d4d4d4' },
    { tag: tags.punctuation, color: '#d4d4d4' },
    { tag: tags.bracket, color: '#d4d4d4' },
    { tag: tags.heading, color: '#5eb3e0', fontWeight: 'bold' },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.strong, fontWeight: 'bold' }
  ])
);

const Editor = forwardRef(({ value, onChange, currentFile, onFigureInsert }, ref) => {
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

    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      highlightStyle,
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
      editorTheme,
      latex({
        autoCloseTags: true,
        enableLinting: true,
        enableTooltips: true
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      })
    ];

    const view = new EditorView({
      state: EditorState.create({
        doc: value || '',
        extensions
      }),
      parent: editorRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [currentFile?.path]);

  return <div ref={editorRef} style={{ flex: 1, overflow: 'auto' }} />;
});

export default Editor;
