import React from 'react';
import Modal from './Modal';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="modal-body">
        <p>{message}</p>
      </div>
      <div className="modal-actions">
        <button className="modal-button modal-button-secondary" onClick={onClose}>
          Annuler
        </button>
        <button className="modal-button modal-button-primary" onClick={handleConfirm}>
          Confirmer
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
