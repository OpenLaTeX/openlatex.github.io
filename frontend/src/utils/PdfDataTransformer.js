export class PdfDataTransformer {
  static toDataUrl(base64Data) {
    return `data:application/pdf;base64,${base64Data}`;
  }

  static fromDataUrl(dataUrl) {
    return dataUrl.replace('data:application/pdf;base64,', '');
  }
}
