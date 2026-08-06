/** Blocking modals: goal celebration, event choice, and death/breakdown. */
import { useGameStore } from '../store/gameStore';
import { EVENT_BY_ID } from '../content/events';
import { ageYears } from '../engine/selectors';
import { moneyShort } from '../util/money';
import { Button, Modal } from './components';

export function GoalModal() {
  const game = useGameStore((s) => s.game)!;
  const ackGoal = useGameStore((s) => s.ackGoal);
  if (!game.pendingGoal) return null;
  return (
    <Modal celebrate>
      <h2>🎉 Goal reached!</h2>
      <p>{game.pendingGoal.description}</p>
      <p>Your life continues — keep going.</p>
      <div className="modal-actions">
        <Button variant="primary" onClick={ackGoal}>
          Keep living
        </Button>
      </div>
    </Modal>
  );
}

export function EventModal() {
  const game = useGameStore((s) => s.game)!;
  const chooseEvent = useGameStore((s) => s.chooseEvent);
  if (!game.pendingEvent) return null;

  const event = EVENT_BY_ID[game.pendingEvent.eventId];
  if (!event?.choices) return null;

  return (
    <Modal>
      <h2>{event.severity === 'catastrophic' ? '⚠️ ' : ''}A decision</h2>
      <p>{event.prompt ?? 'Something has happened. How do you respond?'}</p>
      <div className="modal-actions">
        {event.choices.map((c) => (
          <Button key={c.id} variant="primary" onClick={() => chooseEvent(c.id)}>
            {c.label}
          </Button>
        ))}
      </div>
    </Modal>
  );
}

export function DeathModal() {
  const game = useGameStore((s) => s.game)!;
  const endRunToMenu = useGameStore((s) => s.endRunToMenu);
  if (game.status === 'alive') return null;

  const dead = game.status === 'dead';
  return (
    <Modal>
      <h2>{dead ? '💀 Your body gave out' : '🕯️ Your mind gave out'}</h2>
      <p>
        This life has ended at age {ageYears(game)}. Peak net worth {moneyShort(game.progress.peakNet)};
        {game.elixir.count} Elixir{game.elixir.count === 1 ? '' : 's'} drunk. Perks and achievements
        carry on.
      </p>
      <div className="modal-actions">
        <Button variant="primary" onClick={endRunToMenu}>
          Begin a new life
        </Button>
      </div>
    </Modal>
  );
}

export function Modals() {
  const game = useGameStore((s) => s.game);
  if (!game) return null;
  // Death takes precedence, then goal, then event.
  if (game.status !== 'alive') return <DeathModal />;
  if (game.pendingGoal) return <GoalModal />;
  if (game.pendingEvent) return <EventModal />;
  return null;
}
