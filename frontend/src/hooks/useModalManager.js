import { useState } from 'react';

export const useModalManager = () => {
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, resolver: null });
  const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', message: '', defaultValue: '', validate: null, onConfirm: null });
  const [figureModal, setFigureModal] = useState({ isOpen: false, imageData: null, defaultLabel: '', defaultCaption: '', onConfirm: null });
  const [createItemModal, setCreateItemModal] = useState({ isOpen: false, onConfirm: null });

  const showAlert = (title, message) => {
    setAlertModal({ isOpen: true, title, message });
  };

  const closeAlert = () => {
    setAlertModal({ ...alertModal, isOpen: false });
  };

  const showConfirm = (title, message) => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          resolve(true);
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, resolver: null });
        },
        resolver: resolve
      });
    });
  };

  const closeConfirm = () => {
    if (confirmModal.resolver) confirmModal.resolver(false);
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const showPrompt = (title, message, defaultValue, validate, onConfirm) => {
    setPromptModal({ isOpen: true, title, message, defaultValue, validate, onConfirm });
  };

  const closePrompt = () => {
    setPromptModal({ ...promptModal, isOpen: false });
  };

  const showFigureInsert = (imageData, defaultLabel, defaultCaption, onConfirm) => {
    setFigureModal({ isOpen: true, imageData, defaultLabel, defaultCaption, onConfirm });
  };

  const closeFigureInsert = () => {
    setFigureModal({ ...figureModal, isOpen: false });
  };

  const showCreateItem = (onConfirm) => {
    setCreateItemModal({ isOpen: true, onConfirm });
  };

  const closeCreateItem = () => {
    setCreateItemModal({ ...createItemModal, isOpen: false });
  };

  return {
    alertModal,
    confirmModal,
    promptModal,
    figureModal,
    createItemModal,
    showAlert,
    closeAlert,
    showConfirm,
    closeConfirm,
    showPrompt,
    closePrompt,
    showFigureInsert,
    closeFigureInsert,
    showCreateItem,
    closeCreateItem
  };
};
