import { useRef } from 'react';
import { ClipboardUtil } from '../utils/ClipboardUtil';
import { LatexParser } from '../utils/LatexParser';
import { FigureTemplate } from '../utils/FigureTemplate';

export const useFigureManager = (project, setProject, editorViewRef, showFigureInsert, showAlert, t, setInYjs) => {
  const timestampCounter = useRef(0);

  const handleFigureInsert = async () => {
    try {
      const imageData = await ClipboardUtil.readImageFromClipboard();

      if (!imageData) {
        showAlert(t.noImageTitle, t.noImageMsg);
        return;
      }

      const view = editorViewRef.current;
      if (!view) {
        showAlert(t.error, t.editorUnavailable);
        return;
      }

      const cursorPosition = view.state.selection.main.head;
      const content = view.state.doc.toString();

      const hierarchy = LatexParser.findSectionHierarchy(content, cursorPosition);
      const folderPath = LatexParser.buildFolderPath(hierarchy);

      const timestamp = Date.now();
      const uniqueId = timestampCounter.current++;
      const imageName = `image-${timestamp}-${uniqueId}`;
      const imageFileName = `${imageName}.${imageData.extension}`;
      const imagePath = `${folderPath}/${imageFileName}`;

      const defaultLabel = LatexParser.generateLabel(hierarchy, imageName);
      const defaultCaption = '';

      showFigureInsert(imageData, defaultLabel, defaultCaption, ({ caption, label, width }) => {
        try {
          let newProject = project.addEmptyFile(imagePath, imageData.extension);
          newProject = newProject.updateFileContent(imagePath, imageData.base64);

          const latexCode = FigureTemplate.generate(imagePath, caption, label, width);

          view.dispatch({
            changes: {
              from: cursorPosition,
              to: cursorPosition,
              insert: latexCode
            }
          });

          const finalContent = view.state.doc.toString();
          if (project.currentFile) {
            newProject = newProject.updateFileContent(project.currentFile, finalContent);
          }

          setProject(newProject);
          if (setInYjs) setInYjs(imagePath, imageData.extension, imageData.base64);
        } catch (err) {
          showAlert(t.error, t.figureInsertError(err.message));
        }
      });

    } catch (err) {
      showAlert(t.error, t.clipboardError(err.message));
    }
  };

  return {
    handleFigureInsert
  };
};
