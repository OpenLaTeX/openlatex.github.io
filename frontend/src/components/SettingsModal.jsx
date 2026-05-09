import Modal from 'react-modal';
import { Sun, Moon, Link, X, Activity } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getApiUrl } from '../config/settings';
import './SettingsModal.css';

export default function SettingsModal({ isOpen, onClose, theme, onThemeChange, apiUrl, onApiUrlChange, autoSaveEnabled, onAutoSaveChange, autoSaveInterval, onAutoSaveIntervalChange }) {
  const { lang, setLanguage, t } = useLanguage();

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="settings-modal-content"
      overlayClassName="settings-modal-overlay"
      closeTimeoutMS={200}
    >
      <div className="settings-header">
        <h2>{t.settingsTitle}</h2>
        <button className="settings-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="settings-body">
        <div className="settings-section">
          <h3>{t.appearance}</h3>
          <div className="setting-item">
            <div className="setting-info">
              <label>{t.theme}</label>
              <span className="setting-description">
                {t.themeDesc}
              </span>
            </div>
            <div className="theme-selector">
              <button
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => onThemeChange('light')}
              >
                <Sun size={18} />
                <span>{t.light}</span>
              </button>
              <button
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => onThemeChange('dark')}
              >
                <Moon size={18} />
                <span>{t.dark}</span>
              </button>
            </div>
          </div>
          <div className="setting-item" style={{ marginTop: '16px' }}>
            <div className="setting-info">
              <label>{t.language}</label>
              <span className="setting-description">{t.languageDesc}</span>
            </div>
            <div className="theme-selector">
              <button className={`theme-option ${lang === 'fr' ? 'active' : ''}`} onClick={() => setLanguage('fr')}>FR</button>
              <button className={`theme-option ${lang === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>{t.configuration}</h3>
          <div className="setting-item" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="setting-info">
              <label htmlFor="autosave-toggle">{t.autosave}</label>
              <span className="setting-description">{t.autosaveDesc}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              {autoSaveEnabled && (
                <select
                  value={autoSaveInterval}
                  onChange={(e) => onAutoSaveIntervalChange(Number(e.target.value))}
                  style={{ fontSize: '13px', padding: '4px 6px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-panel)', color: 'var(--text-main)', cursor: 'pointer' }}
                >
                  <option value={1}>1 min</option>
                  <option value={2}>2 min</option>
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={30}>30 min</option>
                </select>
              )}
              <input
                id="autosave-toggle"
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => onAutoSaveChange(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
            </div>
          </div>
          <div className="setting-item" style={{ marginTop: '16px' }}>
            <div className="setting-info">
              <label>{t.apiUrl}</label>
              <span className="setting-description">
                {t.apiUrlDesc}
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

        <div className="settings-section">
          <h3>{t.about}</h3>
          <div className="setting-item">
            <div className="setting-info">
              <label>{t.limits}</label>
              <span className="setting-description">
                {t.limitsDesc}
              </span>
            </div>
            <ul className="limits-list">
              <li><span>10</span> {t.limitGuest}</li>
              <li><span>30</span> {t.limitAuth}</li>
              <li><span>5</span> {t.limitProjects}</li>
              <li><span>10 mb</span> {t.limitSize}</li>
            </ul>
          </div>
          <div className="setting-item setting-item--status">
            <div className="setting-info">
              <label>{t.status}</label>
              <span className="setting-description">
                {t.statusDesc}
              </span>
            </div>
            <a
              href="https://openlatex-api.blavogiez.fr/grafana/dashboards"
              target="_blank"
              rel="noopener noreferrer"
              className="status-link"
            >
              <Activity size={16} />
              <span>Grafana</span>
            </a>
          </div>
          <p className="settings-credit">
            {t.madeBy} <a href="https://github.com/blavogiez" target="_blank" rel="noopener noreferrer">Baptiste Lavogiez</a>
          </p>
        </div>
      </div>
    </Modal>
  );
}
