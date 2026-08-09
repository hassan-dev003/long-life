/** Learn — the education spine (with major choice), off-spine auxiliaries, and current enrollment. */
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { meets } from '../../engine/eligibility';
import { targetCredential } from '../../engine/instant';
import { SPINE, AUXILIARIES, MAJORS, MAJOR_LABEL, type EducationProgram } from '../../content/education';
import { moneyShort } from '../../util/money';
import { Button, Card, Tag, ProgressBar } from '../components';
import type { Major, Requirement } from '../../state/types';

/** Mirror of the engine's enrollment prerequisite, for display. */
function enrollReq(programId: string, major: Major): Requirement | undefined {
  if (programId === 'master') return { kind: 'credential', id: `degree:${major}` };
  if (programId === 'phd') return { kind: 'credential', id: `master:${major}` };
  return [...SPINE, ...AUXILIARIES].find((p) => p.id === programId)?.req;
}

function ProgramCard({ program, major }: { program: EducationProgram; major: Major }) {
  const game = useGameStore((s) => s.game)!;
  const enrollProgram = useGameStore((s) => s.enrollProgram);
  const enrolled = game.education.enrolled;

  const usesMajor = !!program.grantsMajorChoice;
  const credId = targetCredential(program, usesMajor ? major : undefined);
  const owned = game.education.credentials.includes(credId);
  const req = enrollReq(program.id, major);
  const gate = meets(game, req);
  const affordable = game.money.cash >= program.cost;
  const canEnroll = !owned && !enrolled && gate.ok && affordable;
  const reason = !gate.ok
    ? gate.reason
    : !affordable
      ? 'Not enough cash (withdraw from bank first)'
      : undefined;

  return (
    <Card
      title={usesMajor ? `${program.name} · ${MAJOR_LABEL[major]}` : program.name}
      owned={owned}
      locked={!owned && !canEnroll}
      reason={reason}
      badge={owned ? <Tag tone="pos">earned</Tag> : undefined}
      tags={
        <>
          <Tag tone="neg">{program.cost > 0 ? moneyShort(program.cost) : 'free'}</Tag>
          <Tag>{program.weeks} wks</Tag>
        </>
      }
    >
      {!owned && (
        <Button
          variant={canEnroll ? 'primary' : 'ghost'}
          block
          disabled={!canEnroll}
          onClick={() => enrollProgram(program.id, usesMajor ? major : undefined)}
        >
          Enroll
        </Button>
      )}
    </Card>
  );
}

export function LearnTab() {
  const game = useGameStore((s) => s.game)!;
  const [major, setMajor] = useState<Major>('cs');

  const enrolled = game.education.enrolled;

  return (
    <div>
      <h2 className="tab-title">Learn</h2>
      <p className="tab-sub">
        The spine runs School → Diploma → Degree → Master’s → PhD; auxiliary tracks branch off to
        unlock specific careers. One enrollment at a time.
      </p>

      {enrolled && (
        <Card
          title={`Enrolled: ${enrolled.id}`}
          owned
          tags={
            <Tag>
              {enrolled.progress}/{enrolled.weeks} weeks
            </Tag>
          }
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

      <h3 className="section-title">Degree spine</h3>
      <div className="grid">
        {SPINE.map((p) => (
          <ProgramCard key={p.id} program={p} major={major} />
        ))}
      </div>

      <h3 className="section-title">Auxiliary tracks</h3>
      <p className="tab-sub">Off-spine credentials that unlock specific professional fields.</p>
      <div className="grid">
        {AUXILIARIES.map((p) => (
          <ProgramCard key={p.id} program={p} major={major} />
        ))}
      </div>
    </div>
  );
}
