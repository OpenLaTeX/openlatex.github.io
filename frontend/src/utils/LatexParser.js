export class LatexParser {
  static findSectionHierarchy(content, cursorPosition) {
    const beforeCursor = content.substring(0, cursorPosition);
    const lines = beforeCursor.split('\n');

    const hierarchy = {
      section: null,
      subsection: null,
      subsubsection: null
    };

    const regexSection = /\\section\{([^}]+)\}/;
    const regexSubsection = /\\subsection\{([^}]+)\}/;
    const regexSubsubsection = /\\subsubsection\{([^}]+)\}/;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();

      if (!hierarchy.subsubsection) {
        const match = line.match(regexSubsubsection);
        if (match) hierarchy.subsubsection = match[1].trim();
      }
      if (!hierarchy.subsection) {
        const match = line.match(regexSubsection);
        if (match) hierarchy.subsection = match[1].trim();
      }
      if (!hierarchy.section) {
        const match = line.match(regexSection);
        if (match) {
          hierarchy.section = match[1].trim();
          break;
        }
      }
    }

    return hierarchy;
  }

  static sanitizeForPath(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static buildFolderPath(hierarchy) {
    const parts = ['figures'];

    if (hierarchy.section) {
      parts.push(this.sanitizeForPath(hierarchy.section));
    }
    if (hierarchy.subsection) {
      parts.push(this.sanitizeForPath(hierarchy.subsection));
    }
    if (hierarchy.subsubsection) {
      parts.push(this.sanitizeForPath(hierarchy.subsubsection));
    }

    return parts.join('/');
  }

  static generateLabel(hierarchy, imageName) {
    const parts = ['fig'];

    if (hierarchy.section) {
      parts.push(this.sanitizeForPath(hierarchy.section));
    }
    if (hierarchy.subsection) {
      parts.push(this.sanitizeForPath(hierarchy.subsection));
    }

    const baseName = imageName.replace(/\.[^.]+$/, '');
    parts.push(this.sanitizeForPath(baseName));

    return parts.join('-');
  }
}
