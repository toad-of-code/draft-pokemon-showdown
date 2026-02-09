import { useGameStore } from './store/useGameStore';
import Home from './components/Home';
import DraftScreen from './components/draft/DraftScreen';
import BattleArena from './components/battle/BattleArena';
import GameOverScreen from './components/GameOverScreen';

function App() {
  const { gamePhase } = useGameStore();

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-yellow-500/30">
      {gamePhase === 'HOME' && <Home />}

      {gamePhase === 'DRAFT' && <DraftScreen />}

      {gamePhase === 'BATTLE' && <BattleArena />}

      {gamePhase === 'RESULT' && <GameOverScreen />}
    </div>
  );
}

export default App;
