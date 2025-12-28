export class FigureTemplate {
  static escapeLatex(text) {
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/[&%$#_{}]/g, '\\$&')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}');
  }

  static generate(imagePath, caption, label, width = '0.8') {
    const escapedCaption = this.escapeLatex(caption);
    return `\\begin{figure}[h]
\\centering
\\includegraphics[width=${width}\\textwidth]{${imagePath}}
\\caption{${escapedCaption}}
\\label{${label}}
\\end{figure}
`;
  }
}
