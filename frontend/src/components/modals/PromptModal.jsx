import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import Modal from './Modal';

const PromptModal = ({ isOpen, onClose, onConfirm, title, message, defaultValue = '', validate }) => {
  const { t } = useLanguage();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError('');
    }
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    if (validate) {
      const validationError = validate(value);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    onConfirm(value);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="modal-body">
        <p>{message}</p>
        <input
          type="text"
          className="modal-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={handleKeyPress}
          autoFocus
        />
        {error && <div className="modal-error">{error}</div>}
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

export default PromptModal;
