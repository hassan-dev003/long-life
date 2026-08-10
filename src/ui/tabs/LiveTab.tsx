/** Live — the week-advancing hub. Every action here spends one week (the Elixir is instant). */
import { useGameStore } from '../../store/gameStore';
import { work, study, activity } from '../../engine/actions';
import { currentRole, elixirAffordable } from '../../engine/selectors';
import { ACTIVITIES } from '../../content/activities';
import { moneyShort } from '../../util/money';
import { Button, Card, Tag, ProgressBar } from '../components';

export function LiveTab() {
  const game = useGameStore((s) => s.game)!;
  const advance = useGameStore((s) => s.advance);
  const purchaseElixir = useGameStore((s) => s.purchaseElixir);
  const blocked =
    !!game.pendingEvent ||
    !!game.pendingGoal ||
    game.pendingBankruptcyWarning ||
    game.status !== 'alive';

  const role = currentRole(game);
  const enrolled = game.education.enrolled;
  const canElixir = elixirAffordable(game);
  const elixirPct = Math.min(100, (game.money.cash / game.elixir.price) * 100);

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
        {ACTIVITIES.map((a) => {
          // Free activities (Rest/Walk/Meditate) are always available — vital for
          // clawing back out of debt.
          const unaffordable = a.cost > 0 && game.money.cash < a.cost;
          return (
            <button
              key={a.id}
              className="act"
              disabled={blocked || unaffordable}
              title={unaffordable ? 'Not enough cash' : undefined}
              onClick={() => advance(activity(a.id))}
            >
              <span className="act-emoji">{a.emoji}</span>
              <span className="act-name">{a.name}</span>
              <div className="tag-row">
                {a.cost > 0 ? (
                  <Tag tone="neg">−{moneyShort(a.cost)}</Tag>
                ) : (
                  <Tag tone="pos">free</Tag>
                )}
                {a.h > 0 && <Tag>+{a.h}❤</Tag>}
                {a.hp > 0 && <Tag>+{a.hp}☺</Tag>}
              </div>
            </button>
          );
        })}
      </div>

      <h2 className="tab-title" style={{ fontSize: 15, marginTop: 20 }}>
        Longevity
      </h2>
      <p className="tab-sub">The only way to buy more life against aging.</p>
      <div className="grid">
        <Card
          title="⏳ The Elixir"
          owned={game.elixir.count > 0}
          tags={
            <>
              <Tag tone="neg">{moneyShort(game.elixir.price)}</Tag>
              <Tag>drunk ×{game.elixir.count}</Tag>
            </>
          }
          desc="Turn the clock back ten years and restore health. Each one costs far more than the last."
        >
          <ProgressBar pct={elixirPct} />
          <div className="card-desc">
            {canElixir
              ? 'You can afford it (paid from cash).'
              : `${moneyShort(game.money.cash)} / ${moneyShort(game.elixir.price)} cash`}
          </div>
          <Button
            variant="primary"
            block
            disabled={blocked || !canElixir}
            onClick={purchaseElixir}
          >
            Drink the Elixir
          </Button>
        </Card>
      </div>
    </div>
  );
}
