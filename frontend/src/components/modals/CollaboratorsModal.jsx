import { useState, useEffect } from 'react';
import Modal from './Modal';
import { UserPlus, Trash2 } from 'lucide-react';
import { getApiUrl } from '../../config/settings';

export default function CollaboratorsModal({ isOpen, onClose, currentProjectId, t }) {
  const [collaborators, setCollaborators] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    if (!isOpen || !currentProjectId) return;
    fetch(`${getApiUrl()}/projects/${currentProjectId}/collaborators`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setCollaborators(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isOpen, currentProjectId]);

  const handleInvite = async () => {
    setInviteError('');
    const res = await fetch(`${getApiUrl()}/projects/${currentProjectId}/collaborators`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail })
    });
    const data = await res.json();
    if (!res.ok) { setInviteError(data.error || t.error); return; }
    setInviteEmail('');
    const updated = await fetch(`${getApiUrl()}/projects/${currentProjectId}/collaborators`, { credentials: 'include' });
    setCollaborators(await updated.json());
  };

  const handleRemove = async (email) => {
    await fetch(`${getApiUrl()}/projects/${currentProjectId}/collaborators/${encodeURIComponent(email)}`, {
      method: 'DELETE', credentials: 'include'
    });
    setCollaborators(prev => prev.filter(c => c.email !== email));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.collaboratorsTitle}>
      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
        <input
          type="email"
          placeholder={t.emailPlaceholder}
          value={inviteEmail}
          onChange={e => setInviteEmail(e.target.value)}
          style={{ flex: 1, fontSize: '13px', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-panel)', color: 'var(--text-main)' }}
        />
        <button onClick={handleInvite} className="btn-icon" style={{ flexShrink: 0 }}>
          <UserPlus size={14} />
          <span>{t.invite}</span>
        </button>
      </div>
      {inviteError && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{inviteError}</span>}
      {collaborators.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%' }}>
          {collaborators.map(c => (
            <li key={c.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: '13px' }}>
              <span>{c.email}</span>
              <button onClick={() => handleRemove(c.email)} className="btn-ghost" style={{ padding: '2px 4px' }}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
