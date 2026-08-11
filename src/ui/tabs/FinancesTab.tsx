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
            <Tag tone={fin.net >= 0 ? 'pos' : 'neg'}>
              net {fin.net >= 0 ? '+' : ''}
              {fin.net}/wk
            </Tag>
          }
        >
          <div className="fin-section">Income</div>
          <Row label={fin.role ? `Salary — ${fin.role.title}` : 'Salary — no job'} value={fin.salary} sign />
          <Row label="Bank interest" value={fin.interest} sign />
          {fin.businesses.map((b) => (
            <Row key={b.id} label={`Business — ${b.name}`} value={b.net} sign />
          ))}
          <div className="rowline fin-subtotal">
            <span>Total income</span>
            <MoneyValue value={fin.totalIncome} sign />
          </div>

          <div className="fin-section" style={{ marginTop: 8 }}>
            Costs
          </div>
          <Row label={`Home — ${residenceName}`} value={-fin.upkeep.residence} sign />
          <Row label="Food" value={-fin.upkeep.food} sign />
          {fin.upkeep.clothes > 0 && <Row label="Clothes" value={-fin.upkeep.clothes} sign />}
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
          <div className="rowline fin-subtotal">
            <span>Total costs</span>
            <MoneyValue value={-fin.totalCosts} sign />
          </div>

          <div className="rowline fin-net">
            <span>Weekly net</span>
            <MoneyValue value={fin.net} sign />
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
          <div className="rowline" style={{ borderBottom: 'none' }}>
            <span>Interest earned</span>
            <MoneyValue value={game.money.bankInterestEarned} />
          </div>
        </Card>
      </div>
    </div>
  );
}
