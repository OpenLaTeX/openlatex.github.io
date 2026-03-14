import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import Modal from './Modal';

const CreateItemModal = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useLanguage();
  const [itemType, setItemType] = useState('file');
  const [fileName, setFileName] = useState('');
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setItemType('file');
      setFileName('');
      setFolderName('');
      setError('');
    }
  }, [isOpen]);

  const validate = () => {
    if (!fileName.trim()) {
      return t.validateFileRequired;
    }
    if (!fileName.includes('.')) {
      return t.validateFileExtension;
    }
    const ext = fileName.split('.').pop().toLowerCase();
    if (!['tex', 'cls', 'sty'].includes(ext)) {
      return t.validateFileExtUnsupported;
    }
    if (itemType === 'folder') {
      if (!folderName.trim()) {
        return t.validateFolderRequired;
      }
      if (folderName.includes('/')) {
        return t.validateFolderSlash;
      }
    }
    return null;
  };

  const handleConfirm = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    onConfirm({ type: itemType, fileName: fileName.trim(), folderName: folderName.trim() });
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.newItem}>
      <div className="modal-body">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            className={`modal-button ${itemType === 'file' ? 'modal-button-primary' : 'modal-button-secondary'}`}
            onClick={() => setItemType('file')}
            style={{ flex: 1 }}
          >
            {t.fileTab}
          </button>
          <button
            type="button"
            className={`modal-button ${itemType === 'folder' ? 'modal-button-primary' : 'modal-button-secondary'}`}
            onClick={() => setItemType('folder')}
            style={{ flex: 1 }}
          >
            {t.folderTab}
          </button>
        </div>

        {itemType === 'folder' && (
          <>
            <p style={{ marginBottom: '4px' }}>{t.folderNameLabel}</p>
            <input
              type="text"
              className="modal-input"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="mon-dossier"
              autoFocus
            />
          </>
        )}

        <p style={{ marginBottom: '4px', marginTop: itemType === 'folder' ? '12px' : '0' }}>
          {t.fileNameLabel}
        </p>
        <input
          type="text"
          className="modal-input"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="fichier.tex"
          autoFocus={itemType === 'file'}
        />

        {error && <div className="modal-error">{error}</div>}
      </div>
      <div className="modal-actions">
        <button className="modal-button modal-button-secondary" onClick={onClose}>
          {t.cancel}
        </button>
        <button className="modal-button modal-button-primary" onClick={handleConfirm}>
          {t.create}
        </button>
      </div>
    </Modal>
  );
};

export default CreateItemModal;
