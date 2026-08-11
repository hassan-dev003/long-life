/** Business — owned operations (grow via Team Morale) and the catalog to buy into. */
import { useGameStore } from '../../store/gameStore';
import { meets } from '../../engine/eligibility';
import { defOf, valuation, competence, businessFlow } from '../../engine/business';
import {
  BUSINESSES,
  WAGE_TIERS,
  PROFIT_SHARE_TIERS,
  type WageTier,
} from '../../content/businesses';
import { moneyShort } from '../../util/money';
import { Button, Card, Tag, ProgressBar } from '../components';
import type { BusinessInstance, GameState } from '../../state/types';
import type { BusinessDef } from '../../content/businesses';

const FIELD_STAT_LABEL: Record<string, string> = {
  reputation: 'Reputation',
  techDebt: 'Tech Debt',
  inventory: 'Inventory',
};
const FIELD_STAT_HELP: Record<string, string> = {
  reputation: 'Good service lifts revenue. Rises with morale.',
  techDebt: 'Debt from growing fast drags revenue until the product matures.',
  inventory: 'Stock-outs cap revenue. Rises with morale.',
};

/** The wage tier whose ratio the current wage is closest to. */
function activeWageTier(wage: number, marketWage: number): WageTier {
  const ratio = marketWage > 0 ? wage / marketWage : 1;
  return WAGE_TIERS.reduce((best, t) =>
    Math.abs(t.ratio - ratio) < Math.abs(best.ratio - ratio) ? t : best,
  );
}

function OwnedBusiness({ b, game }: { b: BusinessInstance; game: GameState }) {
  const def = defOf(b);
  const hireBiz = useGameStore((s) => s.hireBiz);
  const layoffBiz = useGameStore((s) => s.layoffBiz);
  const openBizBranch = useGameStore((s) => s.openBizBranch);
  const setBizWage = useGameStore((s) => s.setBizWage);
  const setBizShare = useGameStore((s) => s.setBizShare);
  const sellBiz = useGameStore((s) => s.sellBiz);
  if (!def) return null;

  const flow = businessFlow(b, def);
  const branchCost = Math.round(def.cost * 0.3);
  const comp = competence(game, b.field);
  const wageTier = activeWageTier(b.wagePerStaff, def.marketWage);

  const Bar = ({ label, value, help }: { label: string; value: number; help: string }) => (
    <div className="biz-bar" title={help}>
      <span className="biz-bar-label">
        {label} {Math.round(value)}
      </span>
      <ProgressBar pct={value} />
    </div>
  );

  return (
    <Card
      title={def.name}
      owned
      tags={
        <>
          <Tag>{def.tier}</Tag>
          <Tag tone={flow.net >= 0 ? 'pos' : 'neg'}>
            {flow.net >= 0 ? '+' : '−'}
            {moneyShort(Math.abs(flow.net))}/wk
          </Tag>
          <Tag tone="info">worth {moneyShort(valuation(b, def))}</Tag>
          <Tag tone={comp >= 1 ? 'pos' : 'neutral'}>
            {comp >= 1 ? 'competent owner' : 'learning the trade'}
          </Tag>
        </>
      }
    >
      <Bar label="Growth" value={b.growth} help="Business maturity (0–100). Higher = more of the revenue realized. Climbs each week, faster with owner competence and high morale." />
      <Bar label="Morale" value={b.morale} help="Team morale (0–100). Set by wage + profit share. Drives growth, capacity, and staff retention." />
      {def.fieldStat !== 'none' && (
        <Bar
          label={FIELD_STAT_LABEL[def.fieldStat]!}
          value={b.fieldStatValue}
          help={FIELD_STAT_HELP[def.fieldStat]!}
        />
      )}

      {/* Weekly cash-flow breakdown */}
      <div className="biz-flow">
        <div className="rowline">
          <span>Revenue</span>
          <span className="mono pos">+{moneyShort(flow.revenue)}</span>
        </div>
        <div className="rowline">
          <span>Running cost{b.staff > 0 ? ` (incl. ${moneyShort(b.staff * b.wagePerStaff)} payroll)` : ''}</span>
          <span className="mono neg">−{moneyShort(flow.runningCost)}</span>
        </div>
        {flow.profitShare > 0 && (
          <div className="rowline">
            <span>Profit share to team</span>
            <span className="mono neg">−{moneyShort(flow.profitShare)}</span>
          </div>
        )}
        <div className="rowline" style={{ fontWeight: 600 }}>
          <span>Your weekly take</span>
          <span className={`mono ${flow.net >= 0 ? 'pos' : 'neg'}`}>
            {flow.net >= 0 ? '+' : '−'}
            {moneyShort(Math.abs(flow.net))}
          </span>
        </div>
      </div>

      {/* Staff & branches */}
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

      {/* Wage policy — sets morale vs. the market rate */}
      <div className="biz-choice-label">Wage — {moneyShort(b.wagePerStaff)}/staff (market {moneyShort(def.marketWage)})</div>
      <div className="biz-tiers">
        {WAGE_TIERS.map((t) => (
          <Button
            key={t.id}
            variant={t.id === wageTier.id ? 'primary' : 'ghost'}
            onClick={() => setBizWage(b.id, Math.round(def.marketWage * t.ratio))}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Profit share — a slice of profit to the team, for morale */}
      <div className="biz-choice-label">Profit share to team</div>
      <div className="biz-tiers">
        {PROFIT_SHARE_TIERS.map((t) => (
          <Button
            key={t.id}
            variant={Math.abs(t.pct - b.profitSharePct) < 0.001 ? 'primary' : 'ghost'}
            onClick={() => setBizShare(b.id, t.pct)}
          >
            {t.label}
          </Button>
        ))}
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
  const reason = !gate.ok ? gate.reason : !affordable ? 'Not enough cash' : undefined;

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

  // Don't re-offer a business you already own; it returns to the list if you sell it.
  const owned = new Set(game.businesses.map((b) => b.defId));
  const available = BUSINESSES.filter((def) => !owned.has(def.id));

  return (
    <div>
      <h2 className="tab-title">Business</h2>
      <p className="tab-sub">
        A new venture opens at a loss and grows to profit. <strong>Growth</strong> is its maturity —
        it climbs each week, faster when your education/experience match the field and when
        <strong> morale</strong> is high. Morale is set by how you <strong>pay</strong> and the{' '}
        <strong>profit share</strong> you give the team: generous pay and sharing profit lift morale
        (faster growth, more revenue) but cost you each week. Extract instead and morale erodes,
        growth stalls, and staff walk.
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

      {available.length > 0 && (
        <>
          <h3 className="section-title">Open a new business</h3>
          <div className="grid">
            {available.map((def) => (
              <CatalogEntry key={def.id} def={def} game={game} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
