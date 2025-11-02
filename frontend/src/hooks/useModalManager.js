import { useState } from 'react';

export const useModalManager = () => {
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', message: '', defaultValue: '', validate: null, onConfirm: null });

  const showAlert = (title, message) => {
    setAlertModal({ isOpen: true, title, message });
  };

  const closeAlert = () => {
    setAlertModal({ ...alertModal, isOpen: false });
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const showPrompt = (title, message, defaultValue, validate, onConfirm) => {
    setPromptModal({ isOpen: true, title, message, defaultValue, validate, onConfirm });
  };

  const closePrompt = () => {
    setPromptModal({ ...promptModal, isOpen: false });
  };

  return {
    alertModal,
    confirmModal,
    promptModal,
    showAlert,
    closeAlert,
    showConfirm,
    closeConfirm,
    showPrompt,
    closePrompt
  };
};
