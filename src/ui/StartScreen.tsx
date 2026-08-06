/** The start / new-life screen: scenario pick + perk loadout. */
import { useGameStore } from '../store/gameStore';
import { SCENARIOS } from '../content/scenarios';
import { PERKS } from '../content/perks';
import { moneyShort } from '../util/money';
import { Button, Tag } from './components';

export function StartScreen() {
  const profile = useGameStore((s) => s.profile);
  const newGame = useGameStore((s) => s.newGame);
  const togglePerk = useGameStore((s) => s.togglePerk);

  return (
    <div className="start">
      <h1>LONG LIFE</h1>
      <p className="tagline">
        Out-earn your own mortality — build a career, a fortune, and buy yourself more years, one week
        at a time.
      </p>

      {SCENARIOS.map((sc) => (
        <div key={sc.id} className="card" style={{ textAlign: 'left', marginBottom: 12 }}>
          <div className="card-title">
            <span>{sc.name}</span>
            <Tag tone="info">{sc.difficulty}</Tag>
          </div>
          <div className="card-desc">{sc.description}</div>
          <div className="tag-row">
            <Tag>age {sc.start.age}</Tag>
            <Tag tone="pos">{moneyShort(sc.start.cash)} cash</Tag>
            {sc.goal && <Tag tone="info">goal: {sc.goal.description}</Tag>}
          </div>
          <Button variant="primary" block onClick={() => newGame(sc.id)}>
            Begin this life
          </Button>
        </div>
      ))}

      {profile.unlockedPerks.length > 0 && (
        <>
          <p className="tab-sub" style={{ marginTop: 20 }}>
            Perks (toggle before you begin):
          </p>
          <div className="perk-row">
            {profile.unlockedPerks.map((id) => (
              <button
                key={id}
                className={`perk-chip ${profile.activePerks.includes(id) ? 'on' : ''}`}
                onClick={() => togglePerk(id)}
                title={PERKS[id]?.desc}
              >
                {PERKS[id]?.name ?? id}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="tab-sub" style={{ marginTop: 24 }}>
        Lives lived: {profile.stats.livesLived} · Best net worth: {moneyShort(profile.stats.bestNetWorth)}{' '}
        · Oldest age: {profile.stats.oldestAge} · Achievements: {profile.achievements.length}
      </p>
    </div>
  );
}
