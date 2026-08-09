/** Finances — a weekly cash-flow forecast and a balance sheet. */
import { useGameStore } from '../../store/gameStore';
import { financials, netWorth } from '../../engine/selectors';
import { SUBSCRIPTION_BY_ID, HOME_TIER_BY_ID } from '../../content/lifestyle';
import { Card, MoneyValue, Tag } from '../components';

function Row({ label, value, sign = false }: { label: string; value: number; sign?: boolean }) {
  return (
    <div className="rowline">
      <span>{label}</span>
      <MoneyValue value={value} sign={sign} />
    </div>
  );
}

export function FinancesTab() {
  const game = useGameStore((s) => s.game)!;
  const fin = financials(game);

  const residenceName =
    game.lifestyle.residence.kind === 'rented'
      ? (HOME_TIER_BY_ID[game.lifestyle.residence.tier]?.name ?? 'Home')
      : 'Home (owned)';

  return (
    <div>
      <h2 className="tab-title">Finances</h2>
      <p className="tab-sub">
        Your weekly cash flow and balance sheet. Income lands the week you work; costs are billed every
        week.
      </p>

      <div className="grid">
        {/* Weekly cash flow */}
        <Card
          title="Weekly cash flow"
          tags={
            <>
              <Tag tone={fin.netWorking >= 0 ? 'pos' : 'neg'}>
                net working {fin.netWorking >= 0 ? '+' : ''}
                {fin.netWorking}
              </Tag>
            </>
          }
        >
          <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Income
          </div>
          <Row label={fin.role ? `Salary — ${fin.role.title}` : 'Salary — no job'} value={fin.salary} sign />
          <Row label="Bank interest" value={fin.interest} sign />

          <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 8 }}>
            Costs
          </div>
          <Row label={`Home — ${residenceName}`} value={-fin.upkeep.residence} sign />
          <Row label="Food" value={-fin.upkeep.food} sign />
          {game.lifestyle.subscriptions.length > 0 ? (
            game.lifestyle.subscriptions.map((id) => (
              <Row
                key={id}
                label={SUBSCRIPTION_BY_ID[id]?.name ?? id}
                value={-(SUBSCRIPTION_BY_ID[id]?.upkeepPerWeek ?? 0)}
                sign
              />
            ))
          ) : (
            <Row label="Subscriptions" value={0} sign />
          )}

          <div className="rowline" style={{ borderTop: '1px solid var(--border-strong)', borderBottom: 'none', marginTop: 4, fontWeight: 600 }}>
            <span>Net — a week you work</span>
            <MoneyValue value={fin.netWorking} sign />
          </div>
          <div className="rowline" style={{ borderBottom: 'none' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Net — a week you rest</span>
            <MoneyValue value={fin.netIdle} sign />
          </div>
        </Card>

        {/* Balance sheet */}
        <Card title="Balances">
          <Row label="Cash" value={game.money.cash} sign />
          <Row label="Bank" value={game.money.bank} />
          <div className="rowline" style={{ fontWeight: 600 }}>
            <span>Net worth</span>
            <MoneyValue value={netWorth(game)} />
          </div>
          <Row label="Lifetime earned" value={game.money.lifetimeEarned} />
          <Row label="Interest earned" value={game.money.bankInterestEarned} />
          <div className="rowline" style={{ borderBottom: 'none' }}>
            <span>Elixir price (next)</span>
            <MoneyValue value={game.elixir.price} />
          </div>
        </Card>
      </div>
    </div>
  );
}
