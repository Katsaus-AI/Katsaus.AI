/**
 * Main App component - Root of the Katsaus.AI application.
 * 
 * Architecture:
 * - Uses custom useAppState hook for centralized state management
 * - Composes UI from modular components in /components
 * - Supports multiple visual themes (teletext, youth, business, etc.)
 * - Implements different layouts for "aloitus" vs category views
 * 
 * Layout Structure:
 * 1. ThemeSelector (floating)
 * 2. Header (company name, controls, time)
 * 3. Teletext-styled screen container
 *    - Top bar (decorative)
 *    - Main content area
 *      - Page title
 *      - News list
 *      - Filter tabs
 *      - Info box (aloitus only)
 *      - Stats bar
 *    - Bottom bar (decorative)
 * 4. Footer controls (admin, fullscreen)
 * 5. Theme toggle link
 * 6. FAB (Floating Action Button for adding messages)
 * 7. Modals (message edit, info box edit)
 * 8. Exit buttons (for fullscreen/viewing modes)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppState } from './hooks/useAppState';
import { useAuth } from './hooks/useAuth';
import { getCategoryLabel } from './utils';
import {
  AuthPanel,
  ThemeSelector,
  Header,
  FilterTabs,
  NewsList,
  InfoBox,
  StatsBar,
  Fab,
  MessageModal,
  InfoboxModal,
  UserSettingsModal,
  ExitButtons,
} from './components';

/**
 * Get display title for current filter/page.
 * 
 * @param {string} filter - Current filter ('aloitus', 'all', or category name)
 * @returns {string} Uppercase page title
 */
function getFilterTitle(filter) {
  if (filter === 'aloitus') return 'PÄÄSIVU';
  if (filter === 'all') return 'KAIKKI UUTISET';
  return getCategoryLabel(filter).toUpperCase();
}

export default function App() {
  const { t } = useTranslation();
  const auth = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newsRefreshKey, setNewsRefreshKey] = useState(0);
  const canManage = Boolean(auth.profile?.isAdmin);
  const state = useAppState(auth.user, canManage, newsRefreshKey);

  const handleSaveUserSettings = async (updates) => {
    const success = await auth.savePreferences(updates);
    if (!success) return false;
    try {
      await fetch('/api/uutiset');
    } catch {
      // Refresh is still triggered even if API call fails.
    }
    setNewsRefreshKey((value) => value + 1);
    return true;
  };

  if (auth.loading && !auth.user) {
    return (
      <div className="auth-page">
        <div className="auth-page__inner">
          <p className="auth-panel__status">Ladataan kirjautumista...</p>
        </div>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <div className="auth-page">
        <div className="auth-page__inner">
          <AuthPanel auth={auth} />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Theme selector (floating overlay) */}
      <ThemeSelector 
        theme={state.theme} 
        setTheme={state.setTheme}
        themeSelectorVisible={state.themeSelectorVisible}
      />

      <div className="app-container">
        {/* Header with company name, controls, and time */}
        <Header
          dateTime={state.dateTime}
          onToggleViewingMode={state.toggleViewingMode}
          onToggleFullscreen={state.toggleFullscreen}
          userEmail={auth.user?.email || ''}
          isAdmin={canManage}
          onSignOut={auth.signOutUser}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <div className="teletext-screen" role="application" aria-label={t('app.teletext')}>
          <div className="teletext-topbar" aria-hidden="true">
            <span className="teletext-topbar-left">{t('app.topbar.yle')}</span>
            <span className="teletext-topbar-center">{t('app.topbar.news')}</span>
            <span className="teletext-topbar-right">{t('app.topbar.lang')}</span>
          </div>

          <main className="app-main">
            {/* Dynamic page title based on current filter */}
            <h1 className="page-category-title">{getFilterTitle(state.currentFilter)}</h1>
            
            {/* 
              ALOITUS VIEW: Start page with main topics and info box
              
              Shows:
              - One featured message per category (mainTopics)
              - Filter tabs for navigation
              - Info box with organization info
            */}
            {state.currentFilter === 'aloitus' && (
              <>
                <NewsList
                  currentFilter={state.currentFilter}
                  mainTopics={state.mainTopics}
                  filtered={state.filtered}
                  expandedIds={state.expandedIds}
                  toggleExpanded={state.toggleExpanded}
                  editMessage={state.editMessage}
                  deleteMessage={state.deleteMessage}
                  toggleMainTopic={state.toggleMainTopic}
                  showActions={canManage && state.adminMode}
                />
                <FilterTabs
                  currentFilter={state.currentFilter}
                  categories={state.availableCategories}
                  onFilterChange={state.setCurrentFilter}
                />
                <InfoBox
                  text={state.infoBoxText}
                  onEdit={() => state.setInfoboxModalOpen(true)}
                />
              </>
            )}

            {/* 
              CATEGORY/ALL VIEW: Full list with reorder capability
              
              Shows:
              - All messages in current category (or all messages if filter='all')
              - Filter tabs for navigation
              - No info box
            */}
            {state.currentFilter !== 'aloitus' && (
              <>
                <NewsList
                  currentFilter={state.currentFilter}
                  mainTopics={state.mainTopics}
                  filtered={state.filtered}
                  expandedIds={state.expandedIds}
                  toggleExpanded={state.toggleExpanded}
                  editMessage={state.editMessage}
                  deleteMessage={state.deleteMessage}
                  toggleMainTopic={state.toggleMainTopic}
                  showActions={canManage && state.adminMode}
                />
                <FilterTabs
                  currentFilter={state.currentFilter}
                  categories={state.availableCategories}
                  onFilterChange={state.setCurrentFilter}
                />
              </>
            )}

            {/* Message count statistics */}
            <StatsBar
              categoryCounts={state.categoryCounts}
              totalCount={state.messages.length}
            />
          </main>

          {/* Decorative bottom bar (teletext style) */}
          <div className="teletext-bottombar" aria-hidden="true">
            <span className="teletext-bottombar-left">{t('app.bottombar.index')}</span>
            <span className="teletext-bottombar-right">{t('app.bottombar.pages')}</span>
          </div>
        </div>
        
        {/* 
          Footer controls (only visible in default/teletext theme)
          
          Provides quick access to:
          - Admin mode toggle (shows edit/delete buttons)
          - Fullscreen mode toggle
          - Theme selector visibility toggle
        */}
        {state.theme === 'default' && (
          <>
            <div className="footer-controls">
              {canManage && (
                <button
                  type="button"
                  className={`footer-control-btn ${state.adminMode ? 'active' : ''}`}
                  onClick={state.toggleAdminMode}
                >
                  {state.adminMode ? 'POISTU HALLINNASTA' : 'HALLINTA'}
                </button>
              )}
              <button
                type="button"
                className="footer-control-btn"
                onClick={state.toggleFullscreen}
              >
                {state.fullscreenMode ? 'PALUU PERUSNÄKYMÄÄN' : 'KOKO NÄYTTÖ'}
              </button>
            </div>
            <div className="theme-toggle-footer">
              {!state.themeSelectorVisible ? (
                <a
                  href="#"
                  className="theme-toggle-link"
                  onClick={(e) => {
                    e.preventDefault();
                    state.toggleThemeSelector();
                  }}
                >
                  Aiemmin demonstroidut teemat
                </a>
              ) : (
                <a
                  href="#"
                  className="theme-toggle-link"
                  onClick={(e) => {
                    e.preventDefault();
                    state.toggleThemeSelector();
                  }}
                >
                  Piilota teemat
                </a>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating Action Button for adding new messages */}
      {canManage && state.adminMode && <Fab onAdd={() => state.openMessageModal()} />}

      {/* Message create/edit modal */}
      {canManage && (
        <MessageModal
          isOpen={state.messageModalOpen}
          editingMessage={state.editingMessage}
          editingId={state.editingId}
          onClose={state.closeMessageModal}
          onSubmit={state.handleMessageSubmit}
          defaultCategory={state.currentFilter}
        />
      )}

      {/* Info box edit modal */}
      {canManage && (
        <InfoboxModal
          isOpen={state.infoboxModalOpen}
          infoBoxText={state.infoBoxText}
          onClose={() => state.setInfoboxModalOpen(false)}
          onSubmit={state.handleInfoboxSubmit}
        />
      )}

      <UserSettingsModal
        isOpen={settingsOpen}
        profile={auth.profile}
        email={auth.user?.email || ''}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveUserSettings}
      />

      {/* Exit buttons for fullscreen/viewing modes */}
      <ExitButtons
        fullscreenMode={state.fullscreenMode}
        viewingMode={state.viewingMode}
        onExitFullscreen={state.toggleFullscreen}
        onExitViewing={state.toggleViewingMode}
      />
    </>
  );
}
