/** Business — owned operations (grow via Team Morale) and the catalog to buy into. */
import { useGameStore } from '../../store/gameStore';
import { meets } from '../../engine/eligibility';
import { defOf, weeklyNet, valuation, capacity, competence } from '../../engine/business';
import { BUSINESSES } from '../../content/businesses';
import { moneyShort } from '../../util/money';
import { fmt1 } from '../../util/format';
import { Button, Card, Tag, ProgressBar } from '../components';
import type { BusinessInstance, GameState } from '../../state/types';
import type { BusinessDef } from '../../content/businesses';

const FIELD_STAT_LABEL: Record<string, string> = {
  reputation: 'Reputation',
  techDebt: 'Tech Debt',
  inventory: 'Inventory',
};

function OwnedBusiness({ b, game }: { b: BusinessInstance; game: GameState }) {
  const def = defOf(b);
  const hireBiz = useGameStore((s) => s.hireBiz);
  const layoffBiz = useGameStore((s) => s.layoffBiz);
  const openBizBranch = useGameStore((s) => s.openBizBranch);
  const setBizWage = useGameStore((s) => s.setBizWage);
  const setBizShare = useGameStore((s) => s.setBizShare);
  const sellBiz = useGameStore((s) => s.sellBiz);
  if (!def) return null;

  const net = weeklyNet(b, def);
  const wageStep = Math.max(10, Math.round(def.marketWage * 0.1));
  const branchCost = Math.round(def.cost * 0.3);
  const comp = competence(game, b.field);

  return (
    <Card
      title={def.name}
      owned
      tags={
        <>
          <Tag>{def.tier}</Tag>
          <Tag tone={net >= 0 ? 'pos' : 'neg'}>
            {net >= 0 ? '+' : '−'}
            {moneyShort(Math.abs(net))}/wk
          </Tag>
          <Tag tone="info">worth {moneyShort(valuation(b, def))}</Tag>
          <Tag tone={comp >= 1 ? 'pos' : 'neutral'}>
            {comp >= 1 ? 'competent owner' : 'learning the trade'}
          </Tag>
        </>
      }
    >
      <div className="biz-bar">
        <span className="biz-bar-label">Growth {Math.round(b.growth)}</span>
        <ProgressBar pct={b.growth} />
      </div>
      <div className="biz-bar">
        <span className="biz-bar-label">Morale {Math.round(b.morale)}</span>
        <ProgressBar pct={b.morale} />
      </div>
      {def.fieldStat !== 'none' && (
        <div className="biz-bar">
          <span className="biz-bar-label">
            {FIELD_STAT_LABEL[def.fieldStat]} {Math.round(b.fieldStatValue)}
          </span>
          <ProgressBar pct={b.fieldStatValue} />
        </div>
      )}

      <div className="card-desc">
        Capacity {fmt1(capacity(b, def) * 100)}% · payroll {moneyShort(b.staff * b.wagePerStaff)}/wk
      </div>

      {/* Staff */}
      <div className="biz-control">
        <span>
          Staff {b.staff}/{def.staffCap}
        </span>
        <Button disabled={b.staff <= 0} onClick={() => layoffBiz(b.id)}>
          −
        </Button>
        <Button disabled={b.staff >= def.staffCap} onClick={() => hireBiz(b.id)}>
          Hire
        </Button>
      </div>

      {/* Branches */}
      <div className="biz-control">
        <span>
          Branches {b.branches}/{def.branchCap}
        </span>
        <Button
          disabled={b.branches >= def.branchCap || game.money.cash < branchCost}
          title={game.money.cash < branchCost ? 'Not enough cash' : undefined}
          onClick={() => openBizBranch(b.id)}
        >
          Open ({moneyShort(branchCost)})
        </Button>
      </div>

      {/* Wage — drives morale vs. the market rate */}
      <div className="biz-control">
        <span>
          Wage {moneyShort(b.wagePerStaff)} (mkt {moneyShort(def.marketWage)})
        </span>
        <Button disabled={b.wagePerStaff <= 0} onClick={() => setBizWage(b.id, b.wagePerStaff - wageStep)}>
          −
        </Button>
        <Button onClick={() => setBizWage(b.id, b.wagePerStaff + wageStep)}>+</Button>
      </div>

      {/* Profit share */}
      <div className="biz-control">
        <span>Profit share {Math.round(b.profitSharePct * 100)}%</span>
        <Button
          disabled={b.profitSharePct <= 0}
          onClick={() => setBizShare(b.id, b.profitSharePct - 0.05)}
        >
          −
        </Button>
        <Button
          disabled={b.profitSharePct >= 1}
          onClick={() => setBizShare(b.id, b.profitSharePct + 0.05)}
        >
          +
        </Button>
      </div>

      <Button variant="danger" block onClick={() => sellBiz(b.id)}>
        Sell for {moneyShort(valuation(b, def))}
      </Button>
    </Card>
  );
}

function CatalogEntry({ def, game }: { def: BusinessDef; game: GameState }) {
  const openBusiness = useGameStore((s) => s.openBusiness);
  const gate = meets(game, def.req);
  const affordable = game.money.cash >= def.cost;
  const canBuy = gate.ok && affordable;
  const reason = !gate.ok ? gate.reason : !affordable ? 'Not enough cash (withdraw first)' : undefined;

  return (
    <Card
      title={def.name}
      locked={!canBuy}
      reason={reason}
      tags={
        <>
          <Tag>{def.tier}</Tag>
          <Tag tone="neg">{moneyShort(def.cost)}</Tag>
          <Tag tone="pos">up to {moneyShort(def.baseRevenue)}/wk</Tag>
        </>
      }
    >
      <Button variant={canBuy ? 'primary' : 'ghost'} block disabled={!canBuy} onClick={() => openBusiness(def.id)}>
        Open business
      </Button>
    </Card>
  );
}

export function BusinessTab() {
  const game = useGameStore((s) => s.game)!;

  return (
    <div>
      <h2 className="tab-title">Business</h2>
      <p className="tab-sub">
        A new venture starts at a loss. Grow it by matching your expertise and keeping the team happy
        — pay well and share profit to lift morale, which drives capacity and revenue.
      </p>

      {game.businesses.length > 0 && (
        <>
          <h3 className="section-title">Your businesses</h3>
          <div className="grid">
            {game.businesses.map((b) => (
              <OwnedBusiness key={b.id} b={b} game={game} />
            ))}
          </div>
        </>
      )}

      <h3 className="section-title">Open a new business</h3>
      <div className="grid">
        {BUSINESSES.map((def) => (
          <CatalogEntry key={def.id} def={def} game={game} />
        ))}
      </div>
    </div>
  );
}
