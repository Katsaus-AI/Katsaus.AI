import { useEffect, useMemo, useState } from 'react';

const SCRAPER_OPTIONS = [
  { id: 'jyu', label: 'JYU uutiset' },
  { id: 'aalto', label: 'Aalto-yliopisto' },
  { id: 'helsinki', label: 'Helsingin yliopisto' },
  { id: 'tampere', label: 'Tampereen yliopisto' },
  { id: 'turku', label: 'Turun yliopisto' },
  { id: 'oulu', label: 'Oulun yliopisto' },
  { id: 'uef', label: 'Ita-Suomen yliopisto' },
  { id: 'lut', label: 'LUT-yliopisto' },
  { id: 'abo-akademi', label: 'Abo Akademi' },
  { id: 'hanken', label: 'Hanken' },
  { id: 'lapland', label: 'Lapin yliopisto' },
  { id: 'vaasa', label: 'Vaasan yliopisto' },
  { id: 'uniarts', label: 'Taideyliopisto' },
  { id: 'atlassian', label: 'Atlassian' },
  { id: 'yle', label: 'YLE uutiset' },
  { id: 'bbc', label: 'BBC World News' },
];

function toScraperSet(value) {
  if (Array.isArray(value)) return new Set(value);
  if (typeof value === 'string' && value.trim()) {
    return new Set(value.split(',').map((item) => item.trim()).filter(Boolean));
  }
  return new Set(['jyu']);
}

export function UserSettingsModal({ isOpen, profile, email, onClose, onSave }) {
  const [displayName, setDisplayName] = useState('');
  const [orgId, setOrgId] = useState('default-org');
  const [selectedScrapers, setSelectedScrapers] = useState(new Set(['jyu']));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDisplayName(profile?.displayName || '');
    setOrgId(profile?.orgId || 'default-org');
    setSelectedScrapers(toScraperSet(profile?.desiredScrapers));
    setSaving(false);
    setMessage('');
  }, [isOpen, profile]);

  const selectedList = useMemo(() => [...selectedScrapers], [selectedScrapers]);

  const toggleScraper = (scraperId) => {
    setSelectedScrapers((current) => {
      const next = new Set(current);
      if (next.has(scraperId)) next.delete(scraperId);
      else next.add(scraperId);
      return next.size > 0 ? next : new Set(['jyu']);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const success = await onSave({
      displayName: displayName.trim() || email,
      orgId: orgId.trim() || 'default-org',
      desiredScrapers: selectedList,
    });
    setSaving(false);
    setMessage(success ? 'Asetukset tallennettu.' : 'Asetusten tallennus epäonnistui.');
    if (success) {
      setTimeout(() => onClose(), 350);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal"
      id="user-settings-modal"
      style={{ display: 'flex' }}
      onClick={(event) => event.target.id === 'user-settings-modal' && onClose()}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Käyttäjäasetukset</h2>
          <button type="button" className="modal-close" aria-label="Sulje" onClick={onClose}>
            &times;
          </button>
        </div>
        <form className="auth-panel__form" onSubmit={handleSubmit}>
          <div className="auth-panel__user">
            <strong>{email}</strong>
            <span>{profile?.isAdmin ? 'Admin' : 'Käyttäjä'}</span>
          </div>
          <label>
            Näyttönimi
            <input type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </label>
          <label>
            Organisaatiokoodi
            <input type="text" value={orgId} onChange={(event) => setOrgId(event.target.value)} />
          </label>
          <fieldset className="auth-panel__fieldset">
            <legend>Näytettävät scraperit</legend>
            {SCRAPER_OPTIONS.map((option) => (
              <label key={option.id} className="auth-panel__checkbox">
                <input
                  type="checkbox"
                  checked={selectedScrapers.has(option.id)}
                  onChange={() => toggleScraper(option.id)}
                />
                {option.label}
              </label>
            ))}
          </fieldset>
          {message && <p className="auth-panel__message">{message}</p>}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>
              Peruuta
            </button>
            <button type="submit" className="btn-submit" disabled={saving}>
              {saving ? 'Tallennetaan...' : 'Tallenna'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}