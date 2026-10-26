import { useState } from 'react';
import { SettingsProvider } from '../settings/context';
import { GameProvider, useGame } from './context/GameContext';
import { MainMenu } from './components/MainMenu/MainMenu';
import { SettingsScreen } from './components/SettingsScreen/SettingsScreen';
import { NewGameScreen } from './components/NewGameScreen/NewGameScreen';
import { Table } from './components/Table/Table';

type Screen = 'menu' | 'settings' | 'newGame';

function AppInner() {
  const { game } = useGame();
  const [screen, setScreen] = useState<Screen>('menu');

  if (game) return <Table />;
  if (screen === 'settings') return <SettingsScreen onBack={() => setScreen('menu')} />;
  if (screen === 'newGame') return <NewGameScreen onBack={() => setScreen('menu')} />;
  return <MainMenu onNewGame={() => setScreen('newGame')} onSettings={() => setScreen('settings')} />;
}

export default function App() {
  return (
    <SettingsProvider>
      <GameProvider>
        <AppInner />
      </GameProvider>
    </SettingsProvider>
  );
}
