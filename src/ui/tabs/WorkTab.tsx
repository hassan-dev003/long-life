/** Work — current role, promotion progress, and the job board. */
import { useGameStore } from '../../store/gameStore';
import { meets } from '../../engine/eligibility';
import { currentRole, nextPromotion } from '../../engine/selectors';
import { ENTRY_JOBS, TECH } from '../../content/careers';
import { moneyShort } from '../../util/money';
import { fmt1 } from '../../util/format';
import { Button, Card, Tag } from '../components';
import type { RoleDef } from '../../content/careers';

export function WorkTab() {
  const game = useGameStore((s) => s.game)!;
  const applyForJob = useGameStore((s) => s.applyForJob);
  const resign = useGameStore((s) => s.resign);

  const role = currentRole(game);
  const promo = nextPromotion(game);

  const JobCard = ({ r }: { r: RoleDef }) => {
    const isCurrent = game.career.roleId === r.id;
    const gate = meets(game, r.gate);
    return (
      <Card
        title={r.title}
        owned={isCurrent}
        locked={!gate.ok && !isCurrent}
        reason={gate.reason}
        badge={isCurrent ? <Tag tone="pos">current</Tag> : undefined}
        tags={
          <>
            <Tag tone="pos">{moneyShort(r.salaryPerWeek)}/wk</Tag>
            <Tag tone="neg">−{fmt1(r.stress.h + r.stress.hp)} stress/wk</Tag>
          </>
        }
      >
        {!isCurrent && (
          <Button
            variant={gate.ok ? 'primary' : 'ghost'}
            disabled={!gate.ok}
            block
            onClick={() => applyForJob(r.id)}
          >
            {game.career.roleId ? 'Switch to this job' : 'Take this job'}
          </Button>
        )}
      </Card>
    );
  };

  return (
    <div>
      <h2 className="tab-title">Work</h2>
      <p className="tab-sub">Salary is fixed per role — promotions raise your pay.</p>

      {role && (
        <Card
          title={`Current role: ${role.title}`}
          owned
          tags={
            <>
              <Tag tone="pos">{moneyShort(role.salaryPerWeek)}/wk</Tag>
              <Tag>{game.career.roleTenure} wks in role</Tag>
            </>
          }
        >
          {promo ? (
            <>
              <div className="card-desc">
                Next: <strong>{promo.role.title}</strong> ({moneyShort(promo.role.salaryPerWeek)}/wk)
                {promo.result.ok ? (
                  <Tag tone="pos"> ready</Tag>
                ) : (
                  <span className="card-reason"> — {promo.result.reason}</span>
                )}
              </div>
              {promo.result.ok && (
                <Button variant="primary" block onClick={() => applyForJob(promo.role.id)}>
                  Accept promotion → {promo.role.title}
                </Button>
              )}
            </>
          ) : (
            <div className="card-desc">You’re at the top of this ladder.</div>
          )}
          <Button variant="danger" onClick={resign}>
            Quit job
          </Button>
        </Card>
      )}

      <h2 className="tab-title" style={{ fontSize: 15, marginTop: 20 }}>
        Technology ladder
      </h2>
      <div className="grid">
        {TECH.roles.map((r) => (
          <JobCard key={r.id} r={r} />
        ))}
      </div>

      <h2 className="tab-title" style={{ fontSize: 15, marginTop: 20 }}>
        Entry jobs (no education)
      </h2>
      <div className="grid">
        {ENTRY_JOBS.map((r) => (
          <JobCard key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}
