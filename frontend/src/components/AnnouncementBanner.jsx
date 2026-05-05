import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './AnnouncementBanner.css';

const ANNOUNCEMENT_MESSAGE = "Stress tests + migration cloud en cours, il peut y avoir des down.";

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return String(hash);
}

export default function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(() => {
    const storedHash = localStorage.getItem('announcementHash');
    const currentHash = hashString(ANNOUNCEMENT_MESSAGE);
    if (storedHash !== currentHash) {
      return false;
    }
    return localStorage.getItem('announcementDismissed') === 'true';
  });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('announcementDismissed', 'true');
    localStorage.setItem('announcementHash', hashString(ANNOUNCEMENT_MESSAGE));
  };

  if (!ANNOUNCEMENT_MESSAGE || dismissed) {
    return null;
  }

  return (
    <div className="announcement-banner">
      <AlertTriangle className="icon" />
      <span className="message">{ANNOUNCEMENT_MESSAGE}</span>
      <button className="close-btn" onClick={handleDismiss} aria-label="Fermer">
        <X size={16} />
      </button>
    </div>
  );
}
