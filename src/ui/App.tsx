import { GameProvider, useGame } from './context/GameContext';
import { NewGameScreen } from './components/NewGameScreen/NewGameScreen';
import { Table } from './components/Table/Table';

function AppInner() {
  const { game } = useGame();
  return game ? <Table /> : <NewGameScreen />;
}

export default function App() {
  return (
    <GameProvider>
      <AppInner />
    </GameProvider>
  );
}
