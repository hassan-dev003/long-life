/**
 * Work — a flat list of jobs, one card per field. Each card shows either the role
 * you currently hold in that field (with a progress bar toward the next promotion
 * and a promote button when you're ready) or the field's entry job, activated only
 * when you meet its requirement. Past and future rungs stay hidden: you climb a
 * ladder one promotion at a time, in place.
 */
import { useGameStore } from '../../store/gameStore';
import { meets, requirementProgress } from '../../engine/eligibility';
import { currentRole, nextPromotion } from '../../engine/selectors';
import { LADDERS, ladderOfRole, type FieldLadder, type RoleDef } from '../../content/careers';
import { moneyShort } from '../../util/money';
import { fmt1 } from '../../util/format';
import { Button, Card, Tag, ProgressBar } from '../components';

export function WorkTab() {
  const game = useGameStore((s) => s.game)!;
  const applyForJob = useGameStore((s) => s.applyForJob);
  const resign = useGameStore((s) => s.resign);

  const role = currentRole(game);
  const currentField = role ? ladderOfRole(role.id)?.field : undefined;
  const employed = !!role;

  const stressTag = (r: RoleDef) => <Tag tone="neg">−{fmt1(r.stress.h + r.stress.hp)} stress/wk</Tag>;

  /** The card for the field the player currently works in: role + promotion progress. */
  function CurrentFieldCard({ ladder }: { ladder: FieldLadder }) {
    const promo = nextPromotion(game);
    return (
      <Card
        title={role!.title}
        owned
        badge={<Tag tone="pos">current</Tag>}
        tags={
          <>
            <Tag>{ladder.name}</Tag>
            <Tag tone="pos">{moneyShort(role!.salaryPerWeek)}/wk</Tag>
            {stressTag(role!)}
            <Tag>{game.career.roleTenure} wks in role</Tag>
          </>
        }
      >
        {promo ? (
          <>
            <div className="biz-bar">
              <span className="biz-bar-label">
                → {promo.role.title} ({moneyShort(promo.role.salaryPerWeek)}/wk)
              </span>
              <ProgressBar pct={requirementProgress(game, promo.role.gate) * 100} />
            </div>
            {promo.result.ok ? (
              <Button variant="primary" block onClick={() => applyForJob(promo.role.id)}>
                Promote → {promo.role.title}
              </Button>
            ) : (
              <div className="card-reason">{promo.result.reason}</div>
            )}
          </>
        ) : (
          <div className="card-desc">You’re at the top of this ladder.</div>
        )}
        <Button variant="danger" onClick={resign}>
          Quit job
        </Button>
      </Card>
    );
  }

  /** The card for a field the player doesn't work in: its entry job, gated. */
  function EntryCard({ ladder }: { ladder: FieldLadder }) {
    const entry = ladder.roles[0]!;
    const gate = meets(game, entry.gate);
    return (
      <Card
        title={entry.title}
        locked={!gate.ok}
        reason={gate.reason}
        tags={
          <>
            <Tag>{ladder.name}</Tag>
            <Tag tone="pos">{moneyShort(entry.salaryPerWeek)}/wk</Tag>
            {stressTag(entry)}
          </>
        }
      >
        <Button
          variant={gate.ok ? 'primary' : 'ghost'}
          disabled={!gate.ok}
          block
          onClick={() => applyForJob(entry.id)}
        >
          {employed ? 'Switch to this job' : 'Take this job'}
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="tab-title">Work</h2>
      <p className="tab-sub">
        One job per field — take an entry role and earn each promotion in place. Salary is fixed per
        role and only rises when you’re promoted.
      </p>

      <div className="grid">
        {LADDERS.map((ladder) =>
          currentField === ladder.field ? (
            <CurrentFieldCard key={ladder.field} ladder={ladder} />
          ) : (
            <EntryCard key={ladder.field} ladder={ladder} />
          ),
        )}
      </div>
    </div>
  );
}
