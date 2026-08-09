/** Legacy — achievements earned this life and across all lives, plus perks & stats. */
import { useGameStore } from '../../store/gameStore';
import { ACHIEVEMENTS } from '../../content/achievements';
import { PERKS } from '../../content/perks';
import { moneyShort } from '../../util/money';
import { ageYears } from '../../engine/selectors';
import { Tag } from '../components';

export function LegacyTab() {
  const game = useGameStore((s) => s.game)!;
  const profile = useGameStore((s) => s.profile);

  // Earned = achieved this run OR banked on the account.
  const earned = new Set<string>([...game.progress.runAchievements, ...profile.achievements]);
  const earnedCount = ACHIEVEMENTS.filter((a) => earned.has(a.id)).length;

  return (
    <div>
      <h2 className="tab-title">Legacy</h2>
      <p className="tab-sub">
        What you’ve made of your lives. Achievements and perks persist across runs.
      </p>

      {/* This life */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">
          <span>This life</span>
          <Tag tone="info">age {ageYears(game)}</Tag>
        </div>
        <div className="tag-row">
          <Tag tone="pos">peak {moneyShort(game.progress.peakNet)}</Tag>
          <Tag>⏳ {game.elixir.count} elixir{game.elixir.count === 1 ? '' : 's'}</Tag>
          <Tag>{game.progress.goalsMet.length} goal{game.progress.goalsMet.length === 1 ? '' : 's'} met</Tag>
        </div>
      </div>

      {/* Achievements */}
      <h2 className="tab-title" style={{ fontSize: 15 }}>
        Achievements <span style={{ color: 'var(--text-muted)' }}>· {earnedCount}/{ACHIEVEMENTS.length}</span>
      </h2>
      <div className="grid" style={{ marginTop: 8 }}>
        {ACHIEVEMENTS.map((a) => {
          const has = earned.has(a.id);
          return (
            <div key={a.id} className={`card ${has ? 'owned' : 'locked'}`}>
              <div className="card-title">
                <span>
                  {has ? a.emoji : '🔒'} {a.name}
                </span>
                {has && <Tag tone="pos">earned</Tag>}
              </div>
              <div className="card-desc">{a.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Perks */}
      <h2 className="tab-title" style={{ fontSize: 15, marginTop: 20 }}>
        Perks
      </h2>
      {profile.unlockedPerks.length === 0 ? (
        <p className="tab-sub">None unlocked yet — meet goals to earn perks you can toggle on next run.</p>
      ) : (
        <div className="grid" style={{ marginTop: 8 }}>
          {profile.unlockedPerks.map((id) => (
            <div key={id} className="card owned">
              <div className="card-title">
                <span>{PERKS[id]?.name ?? id}</span>
                {profile.activePerks.includes(id) && <Tag tone="pos">active</Tag>}
              </div>
              <div className="card-desc">{PERKS[id]?.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* Lifetime */}
      <h2 className="tab-title" style={{ fontSize: 15, marginTop: 20 }}>
        Across all lives
      </h2>
      <div className="tag-row" style={{ marginTop: 8 }}>
        <Tag>lives lived {profile.stats.livesLived}</Tag>
        <Tag tone="pos">best net {moneyShort(profile.stats.bestNetWorth)}</Tag>
        <Tag>oldest age {profile.stats.oldestAge}</Tag>
        <Tag>{profile.achievements.length} banked achievements</Tag>
      </div>
    </div>
  );
}
