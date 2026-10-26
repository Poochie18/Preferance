import { useState } from 'react';
import { SettingsProvider } from '../settings/context';
import { GameProvider, useGame } from './context/GameContext';
import { MainMenu } from './components/MainMenu/MainMenu';
import { SettingsScreen } from './components/SettingsScreen/SettingsScreen';
import { Table } from './components/Table/Table';
import { LanguageCorner } from './components/LanguageCorner/LanguageCorner';

type Screen = 'menu' | 'settings';

function AppInner() {
  const { game } = useGame();
  const [screen, setScreen] = useState<Screen>('menu');

  if (game) return <Table />;
  return (
    <>
      <LanguageCorner />
      {screen === 'settings' ? (
        <SettingsScreen onBack={() => setScreen('menu')} />
      ) : (
        <MainMenu onSettings={() => setScreen('settings')} />
      )}
    </>
  );
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
