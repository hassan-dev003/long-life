/** Learn — the education spine (with major choice) and current enrollment. */
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { meets } from '../../engine/eligibility';
import { targetCredential } from '../../engine/instant';
import { ALL_PROGRAMS, MAJORS, MAJOR_LABEL } from '../../content/education';
import { moneyShort } from '../../util/money';
import { Button, Card, Tag, ProgressBar } from '../components';
import type { Major, Requirement } from '../../state/types';

/** Mirror of the engine's enrollment prerequisite, for display. */
function enrollReq(programId: string, major: Major): Requirement | undefined {
  if (programId === 'master') return { kind: 'credential', id: `degree:${major}` };
  if (programId === 'phd') return { kind: 'credential', id: `master:${major}` };
  return ALL_PROGRAMS.find((p) => p.id === programId)?.req;
}

export function LearnTab() {
  const game = useGameStore((s) => s.game)!;
  const enrollProgram = useGameStore((s) => s.enrollProgram);
  const [major, setMajor] = useState<Major>('cs');

  const enrolled = game.education.enrolled;

  return (
    <div>
      <h2 className="tab-title">Learn</h2>
      <p className="tab-sub">
        School → Diploma → Degree → Master’s → PhD. One enrollment at a time.
      </p>

      {enrolled && (
        <Card
          title={`Enrolled: ${enrolled.id}`}
          owned
          tags={<Tag>{enrolled.progress}/{enrolled.weeks} weeks</Tag>}
        >
          <ProgressBar pct={(enrolled.progress / enrolled.weeks) * 100} />
          <div className="card-desc">Use “Study” on the Live tab to make progress.</div>
        </Card>
      )}

      <div className="field-inline" style={{ margin: '12px 0' }}>
        <label style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Major for degrees:</label>
        <select className="sel" value={major} onChange={(e) => setMajor(e.target.value as Major)}>
          {MAJORS.map((m) => (
            <option key={m} value={m}>
              {MAJOR_LABEL[m]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid">
        {ALL_PROGRAMS.map((p) => {
          const usesMajor = !!p.grantsMajorChoice;
          const credId = targetCredential(p, usesMajor ? major : undefined);
          const owned = game.education.credentials.includes(credId);
          const req = enrollReq(p.id, major);
          const gate = meets(game, req);
          const affordable = game.money.cash + game.money.bank >= p.cost;
          const canEnroll = !owned && !enrolled && gate.ok && affordable;
          const reason = !gate.ok ? gate.reason : !affordable ? 'Can’t afford tuition' : undefined;

          return (
            <Card
              key={p.id}
              title={usesMajor ? `${p.name} · ${MAJOR_LABEL[major]}` : p.name}
              owned={owned}
              locked={!owned && !canEnroll}
              reason={reason}
              badge={owned ? <Tag tone="pos">earned</Tag> : undefined}
              tags={
                <>
                  <Tag tone="neg">{moneyShort(p.cost)}</Tag>
                  <Tag>{p.weeks} wks</Tag>
                </>
              }
            >
              {!owned && (
                <Button
                  variant={canEnroll ? 'primary' : 'ghost'}
                  block
                  disabled={!canEnroll}
                  onClick={() => enrollProgram(p.id, usesMajor ? major : undefined)}
                >
                  Enroll
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
