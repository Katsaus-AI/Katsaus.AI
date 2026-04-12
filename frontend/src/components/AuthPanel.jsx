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

export function AuthPanel({ auth }) {
  const { user, profile, loading, error, signIn, signUp, signOutUser, savePreferences, requestPasswordReset } = auth;
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgId, setOrgId] = useState('default-org');
  const [displayName, setDisplayName] = useState('');
  const [selectedScrapers, setSelectedScrapers] = useState(new Set(['jyu']));
  const [localMessage, setLocalMessage] = useState('');

  useEffect(() => {
    if (!profile) return;
    setOrgId(profile.orgId || 'default-org');
    setDisplayName(profile.displayName || '');
    setSelectedScrapers(toScraperSet(profile.desiredScrapers));
  }, [profile]);

  const selectedList = useMemo(() => [...selectedScrapers], [selectedScrapers]);

  const toggleScraper = (scraperId) => {
    setSelectedScrapers((current) => {
      const next = new Set(current);
      if (next.has(scraperId)) next.delete(scraperId);
      else next.add(scraperId);
      return next.size > 0 ? next : new Set(['jyu']);
    });
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setLocalMessage('');
    const success = await signIn(email.trim(), password);
    if (success) setLocalMessage('Kirjautuminen onnistui.');
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setLocalMessage('');
    const user = await signUp(email.trim(), password, {
      orgId: orgId.trim() || 'default-org',
      displayName: displayName.trim() || email.trim(),
      desiredScrapers: selectedList,
    });
    if (user) setLocalMessage('Tili luotu ja profiili tallennettu.');
  };

  const handleSavePreferences = async (event) => {
    event.preventDefault();
    setLocalMessage('');
    const success = await savePreferences({
      orgId: orgId.trim() || 'default-org',
      displayName: displayName.trim() || user.email,
      desiredScrapers: selectedList,
    });
    if (success) setLocalMessage('Asetukset tallennettu.');
  };

  const handlePasswordReset = async () => {
    setLocalMessage('');
    const success = await requestPasswordReset(email.trim());
    if (success) setLocalMessage('Salasanan palautuslähetys lähetetty, jos osoite löytyy.');
  };

  return (
    <section className="auth-panel" aria-label="Kirjautuminen ja käyttäjäasetukset">
      <div className="auth-panel__header">
        <div>
          <p className="auth-panel__eyebrow">Käyttäjäkohtaiset scraperit</p>
          <h2>{user ? 'Profiili' : 'Kirjaudu sisään'}</h2>
        </div>
        {loading && <span className="auth-panel__status">Ladataan...</span>}
      </div>

      {error && <p className="auth-panel__error">{error}</p>}
      {localMessage && <p className="auth-panel__message">{localMessage}</p>}

      {!user ? (
        <>
          <div className="auth-panel__mode-switch" role="tablist" aria-label="Kirjautuminen tai rekisteröinti">
            <button
              type="button"
              className={mode === 'signin' ? 'active' : ''}
              onClick={() => setMode('signin')}
            >
              Kirjaudu
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => setMode('signup')}
            >
              Rekisteröidy
            </button>
          </div>

          {mode === 'signin' ? (
            <form className="auth-panel__form" onSubmit={handleSignIn}>
              <label>
                Sähköposti
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label>
                Salasana
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </label>
              <div className="auth-panel__actions">
                <button type="submit">Kirjaudu</button>
                <button type="button" className="secondary" onClick={handlePasswordReset}>
                  Unohditko salasanan?
                </button>
              </div>
            </form>
          ) : (
            <form className="auth-panel__form" onSubmit={handleSignUp}>
              <label>
                Sähköposti
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label>
                Salasana
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </label>
              <label>
                Näyttönimi
                <input type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </label>
              <label>
                Organisaatiokoodi
                <input type="text" value={orgId} onChange={(event) => setOrgId(event.target.value)} placeholder="org-alpha" />
              </label>
              <fieldset className="auth-panel__fieldset">
                <legend>Haluamasi scraperit</legend>
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
              <div className="auth-panel__actions">
                <button type="submit">Luo tili</button>
              </div>
            </form>
          )}
        </>
      ) : (
        <form className="auth-panel__form" onSubmit={handleSavePreferences}>
          <div className="auth-panel__user">
            <strong>{user.email}</strong>
            <span>{profile?.orgId || orgId}</span>
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
            <legend>Haluamasi scraperit</legend>
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
          <div className="auth-panel__actions">
            <button type="submit">Tallenna asetukset</button>
            <button type="button" className="secondary" onClick={signOutUser}>
              Kirjaudu ulos
            </button>
          </div>
        </form>
      )}
    </section>
  );
}