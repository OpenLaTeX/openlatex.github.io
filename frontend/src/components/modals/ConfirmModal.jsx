import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import Modal from './Modal';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  const { t } = useLanguage();

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="modal-body">
        <p>{message}</p>
      </div>
      <div className="modal-actions">
        <button className="modal-button modal-button-secondary" onClick={onClose}>
          {t.cancel}
        </button>
        <button className="modal-button modal-button-primary" onClick={handleConfirm}>
          {t.confirm}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
