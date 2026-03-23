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

import React from 'react';
import { useAppState } from './hooks/useAppState';
import { getCategoryLabel } from './utils';
import {
  ThemeSelector,
  Header,
  FilterTabs,
  NewsList,
  InfoBox,
  StatsBar,
  Fab,
  MessageModal,
  InfoboxModal,
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
  // Centralized state management via custom hook
  const state = useAppState();

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
          adminMode={state.adminMode}
          onToggleAdminMode={state.toggleAdminMode}
        />

        {/* Main teletext-styled screen */}
        <div className="teletext-screen" role="application" aria-label="Teksti-TV">
          {/* Decorative top bar (teletext style) */}
          <div className="teletext-topbar" aria-hidden="true">
            <span className="teletext-topbar-left">Yle</span>
            <span className="teletext-topbar-center">100 - UUTISET</span>
            <span className="teletext-topbar-right">FI</span>
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
                />
                <FilterTabs
                  currentFilter={state.currentFilter}
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
              
              Future feature: Drag-and-drop reordering via onReorder callback
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
                  {/* 
                    onReorder callback for future drag-and-drop feature.
                    
                    When drag-and-drop is implemented:
                    1. Moves message from index 'from' to index 'to' within category
                    2. Preserves message order in other categories
                    3. Updates messages array to reflect new order
                    
                    Implementation notes:
                    - Only active on category pages (not 'aloitus')
                    - Uses array splice to reorder messages
                    - Merges reordered category messages with unchanged messages from other categories
                  */}
                  onReorder={(from, to) => {
                    // Only allow reordering on category pages
                    if (state.currentFilter === 'aloitus') return;
                    
                    // Get messages in current category
                    const catMsgs = state.filtered.slice();
                    
                    // Remove message from old position
                    const [moved] = catMsgs.splice(from, 1);
                    
                    // Insert message at new position
                    catMsgs.splice(to, 0, moved);
                    
                    // Get messages from other categories (unchanged)
                    const otherMsgs = state.messages.filter(m => m.category !== state.currentFilter);
                    
                    // Update messages array with new order
                    state.setMessages([...otherMsgs, ...catMsgs]);
                  }}
                />
                <FilterTabs
                  currentFilter={state.currentFilter}
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
            <span className="teletext-bottombar-left">AAKKOSELLINEN HAKEMISTO</span>
            <span className="teletext-bottombar-right">196 - 198</span>
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
              <button
                type="button"
                className={`footer-control-btn ${state.adminMode ? 'active' : ''}`}
                onClick={state.toggleAdminMode}
              >
                {state.adminMode ? 'POISTU HALLINNASTA' : 'HALLINTA'}
              </button>
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
      <Fab onAdd={() => state.openMessageModal()} />

      {/* Message create/edit modal */}
      <MessageModal
        isOpen={state.messageModalOpen}
        editingMessage={state.editingMessage}
        editingId={state.editingId}
        onClose={state.closeMessageModal}
        onSubmit={state.handleMessageSubmit}
        defaultCategory={state.currentFilter}
      />

      {/* Info box edit modal */}
      <InfoboxModal
        isOpen={state.infoboxModalOpen}
        infoBoxText={state.infoBoxText}
        onClose={() => state.setInfoboxModalOpen(false)}
        onSubmit={state.handleInfoboxSubmit}
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
