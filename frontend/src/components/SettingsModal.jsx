import Modal from 'react-modal';
import { Sun, Moon, Link, X } from 'lucide-react';
import './SettingsModal.css';

export default function SettingsModal({ isOpen, onClose, theme, onThemeChange, apiUrl, onApiUrlChange }) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="settings-modal-content"
      overlayClassName="settings-modal-overlay"
      closeTimeoutMS={200}
    >
      <div className="settings-header">
        <h2>Paramètres</h2>
        <button className="settings-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="settings-body">
        <div className="settings-section">
          <h3>Apparence</h3>
          <div className="setting-item">
            <div className="setting-info">
              <label>Thème</label>
              <span className="setting-description">
                Choisir entre le mode clair et sombre
              </span>
            </div>
            <div className="theme-selector">
              <button
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => onThemeChange('light')}
              >
                <Sun size={18} />
                <span>Clair</span>
              </button>
              <button
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => onThemeChange('dark')}
              >
                <Moon size={18} />
                <span>Sombre</span>
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Configuration</h3>
          <div className="setting-item">
            <div className="setting-info">
              <label>URL API</label>
              <span className="setting-description">
                Endpoint du serveur de compilation LaTeX
              </span>
            </div>
            <div className="input-with-icon">
              <Link size={16} />
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => onApiUrlChange(e.target.value)}
                placeholder="http://localhost:8000"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
