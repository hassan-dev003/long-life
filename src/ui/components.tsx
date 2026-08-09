/** Presentational components shared across tabs. Fed by props; no store access. */
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { moneyShort, money as moneyExact } from '../util/money';

// ── MoneyValue ────────────────────────────────────────────────────────────────
export function MoneyValue({
  value,
  sign = false,
  className = '',
}: {
  value: number;
  sign?: boolean; // color by sign
  className?: string;
}) {
  const cls = sign ? (value > 0 ? 'pos' : value < 0 ? 'neg' : '') : '';
  return (
    <span className={`money ${cls} ${className}`} title={moneyExact(value)}>
      {moneyShort(value)}
    </span>
  );
}

// ── Tag ───────────────────────────────────────────────────────────────────────
export function Tag({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'pos' | 'neg' | 'info';
}) {
  const cls = tone === 'neutral' ? '' : tone;
  return <span className={`tag ${cls}`}>{children}</span>;
}

// ── StatMeter ─────────────────────────────────────────────────────────────────
export function StatMeter({
  label,
  icon,
  value,
  color,
}: {
  label: string;
  icon: string;
  value: number;
  color: string;
}) {
  const danger = value <= 0;
  const warn = !danger && value < 20;
  const cls = danger ? 'danger' : warn ? 'warn' : '';
  return (
    <div className={`meter ${cls}`}>
      <div className="meter-head">
        <span className="meter-name">
          <span>{icon}</span>
          {label}
        </span>
        <span className={`meter-val mono`}>
          {danger || warn ? '⚠ ' : ''}
          {Math.round(value)}
        </span>
      </div>
      <div className="meter-track">
        <div
          className="meter-fill"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="progress">
      <span style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({
  children,
  onClick,
  variant = 'ghost',
  disabled = false,
  block = false,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  block?: boolean;
  title?: string;
}) {
  return (
    <button
      className={`btn ${variant} ${block ? 'block' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({
  title,
  badge,
  desc,
  reason,
  tags,
  locked = false,
  owned = false,
  children,
}: {
  title: ReactNode;
  badge?: ReactNode;
  desc?: ReactNode;
  reason?: string;
  tags?: ReactNode;
  locked?: boolean;
  owned?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`card ${locked ? 'locked' : ''} ${owned ? 'owned' : ''}`}>
      <div className="card-title">
        <span>{title}</span>
        {badge}
      </div>
      {desc && <div className="card-desc">{desc}</div>}
      {tags && <div className="tag-row">{tags}</div>}
      {locked && reason && <div className="card-reason">🔒 {reason}</div>}
      {children}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
}) {
  return (
    <button
      className={`toggle ${on ? 'on' : ''}`}
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
    >
      <span className="track">
        <span className="knob" />
      </span>
      {label}
    </button>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({
  children,
  celebrate = false,
}: {
  children: ReactNode;
  celebrate?: boolean;
}) {
  // Portal to <body> so the fixed overlay centers on the viewport regardless of
  // where it's rendered (e.g. inside the top bar, which has a backdrop-filter that
  // would otherwise become the containing block).
  return createPortal(
    <div className="overlay">
      <div className={`modal ${celebrate ? 'celebrate' : ''}`}>{children}</div>
    </div>,
    document.body,
  );
}
