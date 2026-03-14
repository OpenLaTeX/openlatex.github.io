import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import './ErrorPanel.css';

const getErrorIcon = (type) => {
  if (type === 'error') return <AlertCircle size={16} />;
  if (type === 'warning') return <AlertTriangle size={16} />;
  return <Info size={16} />;
};

const getErrorClass = (type) => {
  if (type === 'warning') return 'error-type-warning';
  return 'error-type-error';
};

export const ErrorPanel = ({ errors, isOpen, onClose, onErrorClick }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="error-panel">
      <div className="error-panel-header">
        <h3>{t.compilationErrors(errors.length)}</h3>
        <button onClick={onClose} className="close-btn">
          <X size={16} />
        </button>
      </div>
      <div className="error-panel-body">
        {errors.length === 0 ? (
          <p className="no-errors">{t.noErrors}</p>
        ) : (
          errors.map((error, index) => (
            <div
              key={index}
              className="error-item"
              onClick={() => error.line && onErrorClick && onErrorClick(error.line)}
              style={{ cursor: error.line ? 'pointer' : 'default' }}
            >
              <div className="error-header">
                <span className={`error-type ${getErrorClass(error.type)}`}>
                  {getErrorIcon(error.type)}
                  <span className="error-type-text">{error.type}</span>
                </span>
                {error.line && <span className="error-line">{t.line} {error.line}</span>}
              </div>
              <div className="error-message">{error.message}</div>
              {error.context.length > 0 && (
                <div className="error-context">
                  {error.context.slice(0, 2).map((ctx, i) => (
                    <div key={i}>{ctx}</div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
