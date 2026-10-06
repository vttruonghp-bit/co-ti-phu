import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useHotSeat } from './game/useHotSeat';
import { ConnectionBanner, ResumeScreen } from './online/Connection';
import { codeFromUrl, dropCodeFromUrl } from './online/storage';
import { useOnline } from './online/useOnline';
import { GameScreen } from './screens/GameScreen';
import { HomeScreen } from './screens/HomeScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { SetupScreen } from './screens/SetupScreen';

/** Khi không ở trong phòng online: màn đầu, hoặc chơi chung một máy. */
type Local = 'home' | 'hotseat';

export function App() {
  const hotSeat = useHotSeat();
  const online = useOnline();
  const { load } = hotSeat;
  // Mã phòng trong đường dẫn mời (?phong=CODE), bỏ đi khi đã vào phòng đó.
  const [invite, setInvite] = useState(codeFromUrl);
  // Tải lại trang giữa ván chơi chung thì vào thẳng ván đó như trước.
  const [local, setLocal] = useState<Local>(() =>
    hotSeat.current && !invite && !online.ticket ? 'hotseat' : 'home',
  );

  // Chỉ khi phát triển: ?scenario=ten nạp sẵn một tình huống để xem nhanh từng màn.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const name = new URLSearchParams(location.search).get('scenario');
    if (!name) return;
    void import('./dev/scenarios').then(({ SCENARIOS }) => {
      const make = SCENARIOS[name];
      if (!make) return console.warn(`Không có tình huống ${name}`, Object.keys(SCENARIOS));
      load(make());
      setLocal('hotseat');
    });
  }, [load]);

  // Vé cũ (lưu từ lần trước) trỏ tới phòng khác phòng được mời: xét một lần khi vào lại được.
  const [staleCode] = useState(() => {
    const code = online.ticket?.code;
    return invite && code && code !== invite ? code : null;
  });
  const staleChecked = useRef(false);
  const { forget, leave } = online;
  const roomCode = online.room?.code;
  const roomPhase = online.room?.phase;
  useEffect(() => {
    if (!roomCode || !invite) return;
    if (roomCode !== staleCode) {
      // Đã vào phòng được mời (hoặc phòng tự tạo, tự vào): mã mời đã dùng xong.
      dropCodeFromUrl();
      setInvite(null);
      return;
    }
    if (staleChecked.current) return;
    staleChecked.current = true;
    // Ván cũ đã xong, phòng chờ cũ: bỏ đi để về màn đầu với mã mời điền sẵn.
    // Ván cũ đang chơi dở: chơi tiếp, giữ mã mời cho lúc bấm Ván mới.
    if (roomPhase === 'ended') forget();
    else if (roomPhase === 'lobby') void leave();
  }, [roomCode, roomPhase, invite, staleCode, forget, leave]);

  let page: ReactNode;
  const { ticket, room, view } = online;
  if (ticket) {
    if (!room || (room.phase !== 'lobby' && !view)) {
      page = <ResumeScreen code={ticket.code} status={online.status} onAbandon={online.abandon} />;
    } else if (room.phase === 'lobby' || !view) {
      page = (
        <LobbyScreen
          room={room}
          meId={ticket.playerId}
          onProfile={online.profile}
          onCapacity={online.capacity}
          onStart={online.start}
          onLeave={online.leave}
        />
      );
    } else {
      page = (
        <GameScreen
          view={view}
          dispatch={online.action}
          onNewGame={online.forget}
          mode={{
            kind: 'online',
            meId: ticket.playerId,
            seats: room.seats,
            connected: online.status === 'online',
          }}
        />
      );
    }
  } else if (local === 'hotseat') {
    const home = () => setLocal('home');
    page = hotSeat.current ? (
      <GameScreen
        view={hotSeat.current}
        dispatch={hotSeat.dispatch}
        onNewGame={hotSeat.quit}
        onHome={home}
      />
    ) : (
      <SetupScreen onStart={hotSeat.start} onBack={home} />
    );
  } else {
    page = (
      <HomeScreen
        inviteCode={invite}
        notice={online.notice}
        onDismissNotice={online.clearNotice}
        onCreate={online.create}
        onJoin={online.join}
        hotSeatGame={hotSeat.current?.game ?? null}
        onHotSeat={() => setLocal('hotseat')}
      />
    );
  }

  return (
    <>
      {page}
      {ticket && room && <ConnectionBanner status={online.status} />}
    </>
  );
}
