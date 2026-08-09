/** Bank — safe interest, automation toggles, and the Elixir (the longevity spine). */
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { bankRate } from '../../engine/economy';
import { elixirAffordable } from '../../engine/selectors';
import { moneyShort } from '../../util/money';
import { Button, Card, Tag, ProgressBar, MoneyValue, Toggle } from '../components';

export function BankTab() {
  const game = useGameStore((s) => s.game)!;
  const bankDeposit = useGameStore((s) => s.bankDeposit);
  const bankWithdraw = useGameStore((s) => s.bankWithdraw);
  const updateBanking = useGameStore((s) => s.updateBanking);
  const purchaseElixir = useGameStore((s) => s.purchaseElixir);
  const [amount, setAmount] = useState('');

  const autoPct = game.banking.autoDepositPct;

  const amt = Math.max(0, Math.floor(Number(amount) || 0));
  const rate = bankRate(game.money.bank);
  const canElixir = elixirAffordable(game);
  const liquid = game.money.cash + game.money.bank;
  const elixirPct = Math.min(100, (liquid / game.elixir.price) * 100);

  return (
    <div>
      <h2 className="tab-title">Bank</h2>
      <p className="tab-sub">The safe, low-yield option. Interest compounds every week.</p>

      <div className="grid">
        <Card
          title="Accounts"
          tags={
            <>
              <Tag>rate {(rate * 100).toFixed(2)}%/wk</Tag>
            </>
          }
        >
          <div className="rowline">
            <span>Cash</span>
            <MoneyValue value={game.money.cash} sign />
          </div>
          <div className="rowline">
            <span>Bank</span>
            <MoneyValue value={game.money.bank} />
          </div>
          <div className="rowline">
            <span>Interest earned</span>
            <MoneyValue value={game.money.bankInterestEarned} />
          </div>

          <div className="field-inline" style={{ marginTop: 10 }}>
            <input
              className="num"
              type="number"
              min={0}
              placeholder="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="field-inline">
            <Button disabled={amt <= 0} onClick={() => bankDeposit(amt)}>
              Deposit
            </Button>
            <Button disabled={amt <= 0} onClick={() => bankWithdraw(amt)}>
              Withdraw
            </Button>
          </div>
        </Card>

        <Card
          title="Automation"
          desc="Route part of every paycheck to the bank, and cover upkeep from savings when cash runs short."
        >
          <div className="rowline" style={{ borderBottom: 'none' }}>
            <span>Auto-deposit of each paycheck</span>
            <span className="mono" style={{ color: 'var(--accent)' }}>
              {autoPct}%
            </span>
          </div>
          <input
            className="slider"
            type="range"
            min={0}
            max={100}
            step={5}
            value={autoPct}
            onChange={(e) => updateBanking({ autoDepositPct: Number(e.target.value) })}
            aria-label="Auto-deposit percentage"
          />
          <div style={{ marginTop: 10 }}>
            <Toggle
              on={game.banking.payUpkeepFromBank}
              onChange={(v) => updateBanking({ payUpkeepFromBank: v })}
              label="Pay upkeep from bank when cash is short"
            />
          </div>
        </Card>

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
            {canElixir ? 'You can afford it.' : `${moneyShort(liquid)} / ${moneyShort(game.elixir.price)}`}
          </div>
          <Button variant="primary" block disabled={!canElixir} onClick={purchaseElixir}>
            Drink the Elixir
          </Button>
        </Card>
      </div>
    </div>
  );
}
