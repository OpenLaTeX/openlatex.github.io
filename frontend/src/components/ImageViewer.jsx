export default function ImageViewer({ content, fileName }) {
  if (!content) {
    return <div className="image-viewer-empty">Aucune image sélectionnée</div>;
  }

  const isBase64 = content.startsWith('data:image');
  const src = isBase64 ? content : `data:image/png;base64,${content}`;

  return (
    <div className="image-viewer">
      <img src={src} alt={fileName} style={{ maxWidth: '100%', height: 'auto' }} />
    </div>
  );
}
