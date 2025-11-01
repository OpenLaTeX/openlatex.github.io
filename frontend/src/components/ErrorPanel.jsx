import Drawer from 'react-modern-drawer';
import 'react-modern-drawer/dist/index.css';
import './ErrorPanel.css';

export const ErrorPanel = ({ errors, isOpen, onClose }) => {
  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      direction="bottom"
      size={300}
      style={{ background: '#1e1e1e' }}
      lockBackgroundScroll={false}
      enableOverlay={false}
    >
      <div className="error-panel-content">
        <div className="error-panel-header">
          <h3>Erreurs de compilation ({errors.length})</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <div className="error-panel-body">
          {errors.length === 0 ? (
            <p className="no-errors">Aucune erreur</p>
          ) : (
            errors.map((error, index) => (
              <div key={index} className="error-item">
                <div className="error-header">
                  <span className="error-type">{error.type}</span>
                  {error.line && <span className="error-line">Ligne {error.line}</span>}
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
    </Drawer>
  );
};
