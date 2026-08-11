/** Bank — safe interest and the automation controls. */
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { bankRate } from '../../engine/economy';
import { Button, Card, Tag, MoneyValue, Toggle } from '../components';

export function BankTab() {
  const game = useGameStore((s) => s.game)!;
  const bankDeposit = useGameStore((s) => s.bankDeposit);
  const bankWithdraw = useGameStore((s) => s.bankWithdraw);
  const updateBanking = useGameStore((s) => s.updateBanking);
  const [amount, setAmount] = useState('');

  const autoPct = game.banking.autoDepositPct;
  const amt = Math.max(0, Math.floor(Number(amount) || 0));
  const rate = bankRate(game.money.bank);

  return (
    <div>
      <h2 className="tab-title">Bank</h2>
      <p className="tab-sub">The safe, low-yield option. Interest compounds every week.</p>

      <div className="grid">
        <Card title="Accounts" tags={<Tag>rate {(rate * 100).toFixed(2)}%/wk</Tag>}>
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
          desc="Route part of all income to the bank, and optionally pay all weekly expenses straight from savings."
        >
          <div className="rowline" style={{ borderBottom: 'none' }}>
            <span>Auto-deposit of all income</span>
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
              label="Pay weekly expenses from bank"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
