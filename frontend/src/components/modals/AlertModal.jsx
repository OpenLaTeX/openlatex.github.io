import React from 'react';
import Modal from './Modal';

const AlertModal = ({ isOpen, onClose, title, message }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="modal-body">
        <p>{message}</p>
      </div>
      <div className="modal-actions">
        <button className="modal-button modal-button-primary" onClick={onClose}>
          OK
        </button>
      </div>
    </Modal>
  );
};

export default AlertModal;
