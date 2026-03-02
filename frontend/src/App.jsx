import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppState } from './hooks/useAppState';
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

export default function App() {
  const { t } = useTranslation();
  const state = useAppState();

  return (
    <>
      <ThemeSelector theme={state.theme} setTheme={state.setTheme} />

      <div className="app-container">
        <Header
          dateTime={state.dateTime}
          onToggleViewingMode={state.toggleViewingMode}
          onToggleFullscreen={state.toggleFullscreen}
        />

        <div className="teletext-screen" role="application" aria-label={t('app.teletext')}>
          <div className="teletext-topbar" aria-hidden="true">
            <span className="teletext-topbar-left">{t('app.topbar.yle')}</span>
            <span className="teletext-topbar-center">{t('app.topbar.news')}</span>
            <span className="teletext-topbar-right">{t('app.topbar.lang')}</span>
          </div>

          <main className="app-main">
            <FilterTabs
              currentFilter={state.currentFilter}
              onFilterChange={state.setCurrentFilter}
            />

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
                <InfoBox
                  text={state.infoBoxText}
                  onEdit={() => state.setInfoboxModalOpen(true)}
                />
              </>
            )}

            {state.currentFilter !== 'aloitus' && (
              <NewsList
                currentFilter={state.currentFilter}
                mainTopics={state.mainTopics}
                filtered={state.filtered}
                expandedIds={state.expandedIds}
                toggleExpanded={state.toggleExpanded}
                editMessage={state.editMessage}
                deleteMessage={state.deleteMessage}
                toggleMainTopic={state.toggleMainTopic}
                onReorder={(from, to) => {
                  // Päivitä järjestys vain kategoriasivuilla
                  if (state.currentFilter === 'aloitus') return;
                  const catMsgs = state.filtered.slice();
                  const [moved] = catMsgs.splice(from, 1);
                  catMsgs.splice(to, 0, moved);
                  // Päivitä messages-järjestys
                  const otherMsgs = state.messages.filter(m => m.category !== state.currentFilter);
                  state.setMessages([...otherMsgs, ...catMsgs]);
                }}
              />
            )}

            <StatsBar
              categoryCounts={state.categoryCounts}
              totalCount={state.messages.length}
            />
          </main>

          <div className="teletext-bottombar" aria-hidden="true">
            <span className="teletext-bottombar-left">{t('app.bottombar.index')}</span>
            <span className="teletext-bottombar-right">{t('app.bottombar.pages')}</span>
          </div>
        </div>
      </div>

      <Fab onAdd={() => state.openMessageModal()} />

      <MessageModal
        isOpen={state.messageModalOpen}
        editingMessage={state.editingMessage}
        editingId={state.editingId}
        onClose={state.closeMessageModal}
        onSubmit={state.handleMessageSubmit}
        defaultCategory={state.currentFilter}
      />

      <InfoboxModal
        isOpen={state.infoboxModalOpen}
        infoBoxText={state.infoBoxText}
        onClose={() => state.setInfoboxModalOpen(false)}
        onSubmit={state.handleInfoboxSubmit}
      />

      <ExitButtons
        fullscreenMode={state.fullscreenMode}
        viewingMode={state.viewingMode}
        onExitFullscreen={state.toggleFullscreen}
        onExitViewing={state.toggleViewingMode}
      />
    </>
  );
}
