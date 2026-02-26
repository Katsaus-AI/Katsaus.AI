import React from 'react';
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
  const state = useAppState();

  return (
    <>
      {/* <ThemeSelector theme={state.theme} setTheme={state.setTheme} /> */}

      <div className="app-container">
        <Header
          dateTime={state.dateTime}
          onToggleViewingMode={state.toggleViewingMode}
          onToggleFullscreen={state.toggleFullscreen}
        />

        <div className="teletext-screen" role="application" aria-label="Teksti-TV">
          <div className="teletext-topbar" aria-hidden="true">
            <span className="teletext-topbar-left">Yle</span>
            <span className="teletext-topbar-center">100 - UUTISET</span>
            <span className="teletext-topbar-right">FI</span>
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
              />
            )}

            <StatsBar
              categoryCounts={state.categoryCounts}
              totalCount={state.messages.length}
            />
          </main>

          <div className="teletext-bottombar" aria-hidden="true">
            <span className="teletext-bottombar-left">AAKKOSELLINEN HAKEMISTO</span>
            <span className="teletext-bottombar-right">196 - 198</span>
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
