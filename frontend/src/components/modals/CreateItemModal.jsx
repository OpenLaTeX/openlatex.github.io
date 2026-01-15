import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const CreateItemModal = ({ isOpen, onClose, onConfirm }) => {
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
      return 'Le nom du fichier est requis';
    }
    if (!fileName.includes('.')) {
      return 'Le fichier doit avoir une extension (ex: .tex)';
    }
    const ext = fileName.split('.').pop().toLowerCase();
    if (!['tex', 'cls', 'sty'].includes(ext)) {
      return 'Extension non supportée. Utilisez .tex, .cls ou .sty';
    }
    if (itemType === 'folder') {
      if (!folderName.trim()) {
        return 'Le nom du dossier est requis';
      }
      if (folderName.includes('/')) {
        return 'Le nom du dossier ne peut pas contenir /';
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
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau">
      <div className="modal-body">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            className={`modal-button ${itemType === 'file' ? 'modal-button-primary' : 'modal-button-secondary'}`}
            onClick={() => setItemType('file')}
            style={{ flex: 1 }}
          >
            Fichier
          </button>
          <button
            type="button"
            className={`modal-button ${itemType === 'folder' ? 'modal-button-primary' : 'modal-button-secondary'}`}
            onClick={() => setItemType('folder')}
            style={{ flex: 1 }}
          >
            Dossier
          </button>
        </div>

        {itemType === 'folder' && (
          <>
            <p style={{ marginBottom: '4px' }}>Nom du dossier :</p>
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
          Nom du fichier :
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
          Annuler
        </button>
        <button className="modal-button modal-button-primary" onClick={handleConfirm}>
          Créer
        </button>
      </div>
    </Modal>
  );
};

export default CreateItemModal;
