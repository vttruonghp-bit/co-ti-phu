import { useEffect } from 'react';
import { useHotSeat } from './game/useHotSeat';
import { GameScreen } from './screens/GameScreen';
import { SetupScreen } from './screens/SetupScreen';

export function App() {
  const hotSeat = useHotSeat();
  const { load } = hotSeat;

  // Chỉ khi phát triển: ?scenario=ten nạp sẵn một tình huống để xem nhanh từng màn.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const name = new URLSearchParams(location.search).get('scenario');
    if (!name) return;
    void import('./dev/scenarios').then(({ SCENARIOS }) => {
      const make = SCENARIOS[name];
      if (make) load(make());
      else console.warn(`Không có tình huống ${name}`, Object.keys(SCENARIOS));
    });
  }, [load]);

  if (!hotSeat.current) return <SetupScreen onStart={hotSeat.start} />;
  return (
    <GameScreen hotSeat={hotSeat.current} dispatch={hotSeat.dispatch} onNewGame={hotSeat.quit} />
  );
}
