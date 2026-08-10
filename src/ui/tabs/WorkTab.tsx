/**
 * Work — a flat list of jobs, one card per field. Every card has the same shape:
 * title, a field subtitle, then a salary/stress tag row — so cards stay aligned
 * whatever the field name's length. A field shows one of three states:
 *   • active   — the role you're working now, with promotion progress + promote.
 *   • resume   — the highest role you've reached here before (switching resumes it,
 *                keeping the rung and its saved tenure).
 *   • entry    — the field's entry job, activated only when you meet its requirement.
 */
import { useGameStore } from '../../store/gameStore';
import { meets } from '../../engine/eligibility';
import { currentRole, nextPromotion, promotionProgress } from '../../engine/selectors';
import { LADDERS, ladderOfRole, ROLE_BY_ID, type FieldLadder, type RoleDef } from '../../content/careers';
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

  const payStress = (r: RoleDef) => (
    <>
      <Tag tone="pos">{moneyShort(r.salaryPerWeek)}/wk</Tag>
      <Tag tone="neg">−{fmt1(r.stress.h + r.stress.hp)} stress/wk</Tag>
    </>
  );

  /** The card for the field the player currently works in: role + promotion progress. */
  function CurrentFieldCard({ ladder }: { ladder: FieldLadder }) {
    const promo = nextPromotion(game);
    return (
      <Card
        title={role!.title}
        desc={ladder.name}
        owned
        badge={<Tag tone="pos">current</Tag>}
        tags={payStress(role!)}
      >
        {promo ? (
          <>
            <div className="card-desc">
              Next promotion: <strong>{promo.role.title}</strong>
            </div>
            <ProgressBar pct={(promotionProgress(game) ?? 0) * 100} />
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
        <Button variant="danger" block onClick={resign}>
          Quit job
        </Button>
      </Card>
    );
  }

  /** A field you've worked before: your highest role there, ready to resume. */
  function ResumeCard({ ladder, savedRole }: { ladder: FieldLadder; savedRole: RoleDef }) {
    return (
      <Card
        title={savedRole.title}
        desc={ladder.name}
        badge={<Tag>reached</Tag>}
        tags={payStress(savedRole)}
      >
        <Button variant="primary" block onClick={() => applyForJob(savedRole.id)}>
          Switch to this job
        </Button>
      </Card>
    );
  }

  /** A field you've never worked: its entry job, gated. */
  function EntryCard({ ladder }: { ladder: FieldLadder }) {
    const entry = ladder.roles[0]!;
    const gate = meets(game, entry.gate);
    return (
      <Card title={entry.title} desc={ladder.name} locked={!gate.ok} reason={gate.reason} tags={payStress(entry)}>
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

  function FieldCard({ ladder }: { ladder: FieldLadder }) {
    if (currentField === ladder.field) return <CurrentFieldCard ladder={ladder} />;
    const savedId = game.career.fieldRole[ladder.field];
    const savedRole = savedId ? ROLE_BY_ID[savedId] : undefined;
    if (savedRole) return <ResumeCard ladder={ladder} savedRole={savedRole} />;
    return <EntryCard ladder={ladder} />;
  }

  return (
    <div>
      <h2 className="tab-title">Work</h2>
      <p className="tab-sub">
        One job per field — take an entry role and earn each promotion in place. Switch fields freely;
        your rank and time served in each are kept for when you return.
      </p>

      <div className="grid">
        {LADDERS.map((ladder) => (
          <FieldCard key={ladder.field} ladder={ladder} />
        ))}
      </div>
    </div>
  );
}
