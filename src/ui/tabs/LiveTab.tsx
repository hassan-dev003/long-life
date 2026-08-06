/** Live — the week-advancing hub. Every action here spends one week. */
import { useGameStore } from '../../store/gameStore';
import { work, study, activity } from '../../engine/actions';
import { currentRole } from '../../engine/selectors';
import { ACTIVITIES } from '../../content/activities';
import { moneyShort } from '../../util/money';
import { Button, Tag } from '../components';

export function LiveTab() {
  const game = useGameStore((s) => s.game)!;
  const advance = useGameStore((s) => s.advance);
  const blocked = !!game.pendingEvent || !!game.pendingGoal || game.status !== 'alive';

  const role = currentRole(game);
  const enrolled = game.education.enrolled;

  return (
    <div>
      <h2 className="tab-title">This week</h2>
      <p className="tab-sub">Every choice advances your life by one week.</p>

      <div className="week-actions">
        <Button
          variant="primary"
          disabled={blocked || !role}
          onClick={() => advance(work())}
          title={role ? `Work as ${role.title}` : 'You have no job'}
        >
          💼 Work {role ? `(+${moneyShort(role.salaryPerWeek)})` : ''}
        </Button>
        <Button
          variant="primary"
          disabled={blocked || !enrolled}
          onClick={() => advance(study())}
          title={enrolled ? 'Study toward your credential' : 'You are not enrolled'}
        >
          🎓 Study {enrolled ? `(${enrolled.progress}/${enrolled.weeks})` : ''}
        </Button>
      </div>

      <h2 className="tab-title" style={{ fontSize: 15 }}>
        Leisure
      </h2>
      <p className="tab-sub">Rest and recover — each is a week well spent.</p>
      <div className="act-grid">
        {ACTIVITIES.map((a) => (
          <button
            key={a.id}
            className="act"
            disabled={blocked}
            onClick={() => advance(activity(a.id))}
          >
            <span className="act-emoji">{a.emoji}</span>
            <span className="act-name">{a.name}</span>
            <div className="tag-row">
              {a.cost > 0 ? <Tag tone="neg">−{moneyShort(a.cost)}</Tag> : <Tag tone="pos">free</Tag>}
              {a.h > 0 && <Tag>+{a.h}❤</Tag>}
              {a.hp > 0 && <Tag>+{a.hp}☺</Tag>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
