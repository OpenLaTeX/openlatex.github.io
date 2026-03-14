import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import Modal from './Modal';

const previewStyle = {
  background: '#1e1e1e',
  border: '1px solid #444',
  borderRadius: '4px',
  padding: '12px',
  marginBottom: '16px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};

const imageStyle = {
  maxWidth: '100%',
  maxHeight: '300px',
  objectFit: 'contain'
};

const inputGroupStyle = { marginBottom: '12px' };

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '500',
  marginBottom: '4px'
};

const FigureInsertModal = ({ isOpen, onClose, onConfirm, imageData, defaultLabel, defaultCaption = '' }) => {
  const { t } = useLanguage();
  const [caption, setCaption] = useState(defaultCaption);
  const [label, setLabel] = useState(defaultLabel);
  const [width, setWidth] = useState('0.8');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCaption(defaultCaption);
      setLabel(defaultLabel);
      setWidth('0.8');
      setError('');
    }
  }, [isOpen, defaultLabel, defaultCaption]);

  const handleConfirm = () => {
    if (!caption.trim()) {
      return;
    }
    const widthNum = parseFloat(width);
    if (isNaN(widthNum) || widthNum <= 0 || widthNum > 2) {
      setError(t.widthError);
      return;
    }
    onConfirm({ caption: caption.trim(), label: label.trim(), width });
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleConfirm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.insertFigure}>
      <div className="modal-body">
        {imageData && (
          <div style={previewStyle}>
            <img
              src={`data:${imageData.mimeType};base64,${imageData.base64}`}
              alt="Preview"
              style={imageStyle}
            />
          </div>
        )}

        <div style={inputGroupStyle}>
          <label style={labelStyle}>
            {t.captionLabel}
          </label>
          <input
            type="text"
            className="modal-input"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t.figureDescPlaceholder}
            autoFocus
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>
            {t.labelLabel}
          </label>
          <input
            type="text"
            className="modal-input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="fig:section-image"
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>
            {t.widthLabel}
          </label>
          <input
            type="text"
            className="modal-input"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="0.8"
          />
        </div>
        {error && <div className="modal-error">{error}</div>}
      </div>

      <div className="modal-actions">
        <button className="modal-button modal-button-secondary" onClick={onClose}>
          {t.cancel}
        </button>
        <button
          className="modal-button modal-button-primary"
          onClick={handleConfirm}
          disabled={!caption.trim()}
        >
          {t.insert}
        </button>
      </div>
    </Modal>
  );
};

export default FigureInsertModal;
