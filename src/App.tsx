/**
 * App shell — top bar (clock, hero net worth, stat meters), nav rail / bottom bar,
 * the active tab, the life log, and the blocking modals. Reads state through the
 * store's selector hooks so each piece re-renders only when its slice changes.
 */
import './ui/app.css';
import { useGameStore, type TabId } from './store/gameStore';
import { clockDisplay, netWorth } from './engine/selectors';
import { StatMeter, MoneyValue } from './ui/components';
import { StartScreen } from './ui/StartScreen';
import { Modals } from './ui/Modals';
import { LiveTab } from './ui/tabs/LiveTab';
import { WorkTab } from './ui/tabs/WorkTab';
import { LearnTab } from './ui/tabs/LearnTab';
import { BankTab } from './ui/tabs/BankTab';
import { LifeTab } from './ui/tabs/LifeTab';

const NAV: { id: TabId; label: string; icon: string }[] = [
  { id: 'live', label: 'Live', icon: '🌱' },
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'learn', label: 'Learn', icon: '🎓' },
  { id: 'bank', label: 'Bank', icon: '🏦' },
  { id: 'life', label: 'Life', icon: '✦' },
];

function Clock() {
  const game = useGameStore((s) => s.game)!;
  const { age, month, week } = clockDisplay(game);
  const dots = [1, 2, 3, 4].map((w) => (w === week ? '●' : '○'));
  return (
    <div className="topbar-clock mono">
      <span>◷ Age {age}</span>
      <span>· {month}</span>
      <span className="week-dots">
        {dots.map((d, i) => (
          <span key={i} className={i === week - 1 ? 'on' : ''}>
            {d}
          </span>
        ))}
      </span>
    </div>
  );
}

function TopBar() {
  const game = useGameStore((s) => s.game)!;
  return (
    <header className="topbar">
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <span className="wordmark">LONG LIFE</span>
        <Clock />
      </div>
      <div className="hero">
        <span className="hero-label">Net Worth</span>
        <MoneyValue value={netWorth(game)} className="hero-value" />
      </div>
      <div className="stat-row">
        <StatMeter label="Health" icon="❤" value={game.stats.health} color="var(--health)" />
        <StatMeter
          label="Happiness"
          icon="☺"
          value={game.stats.happiness}
          color="var(--happiness)"
        />
      </div>
    </header>
  );
}

function Nav() {
  const tab = useGameStore((s) => s.tab);
  const setTab = useGameStore((s) => s.setTab);
  return (
    <nav className="nav">
      {NAV.map((n) => (
        <button
          key={n.id}
          className={`nav-item ${tab === n.id ? 'active' : ''}`}
          onClick={() => setTab(n.id)}
        >
          <span className="ico">{n.icon}</span>
          {n.label}
        </button>
      ))}
    </nav>
  );
}

function TabContent() {
  const tab = useGameStore((s) => s.tab);
  switch (tab) {
    case 'live':
      return <LiveTab />;
    case 'work':
      return <WorkTab />;
    case 'learn':
      return <LearnTab />;
    case 'bank':
      return <BankTab />;
    case 'life':
      return <LifeTab />;
  }
}

function LifeLog() {
  const log = useGameStore((s) => s.game!.log);
  return (
    <div className="log">
      {[...log].reverse().map((entry, i) => (
        <div key={`${entry.week}-${i}`} className={`log-line ${entry.kind}`}>
          <span className="log-week">wk {entry.week}</span>
          <span>{entry.text}</span>
        </div>
      ))}
    </div>
  );
}

export function App() {
  const hasGame = useGameStore((s) => s.game !== null);
  if (!hasGame) return <StartScreen />;

  return (
    <div className="app">
      <TopBar />
      <div className="body">
        <Nav />
        <main className="content">
          <TabContent />
        </main>
      </div>
      <LifeLog />
      <Modals />
    </div>
  );
}
