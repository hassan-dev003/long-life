/** Lifestyle — spend that shapes wellbeing: residence, food, clothes, subscriptions. */
import { useGameStore } from '../../store/gameStore';
import { HOME_TIERS, FOOD_TIERS, CLOTHES_TIERS, SUBSCRIPTIONS } from '../../content/lifestyle';
import { moneyShort } from '../../util/money';
import { Button, Card, Tag } from '../components';

export function LifeTab() {
  const game = useGameStore((s) => s.game)!;
  const chooseResidence = useGameStore((s) => s.chooseResidence);
  const chooseFood = useGameStore((s) => s.chooseFood);
  const chooseClothes = useGameStore((s) => s.chooseClothes);
  const toggleSub = useGameStore((s) => s.toggleSub);

  const residenceTier =
    game.lifestyle.residence.kind === 'rented' ? game.lifestyle.residence.tier : null;

  return (
    <div>
      <h2 className="tab-title">Lifestyle</h2>
      <p className="tab-sub">Where you live, what you eat, how you dress, and what you subscribe to.</p>

      <h3 className="section-title">Home</h3>
      <div className="grid">
        {HOME_TIERS.map((h) => {
          const active = residenceTier === h.id;
          return (
            <Card
              key={h.id}
              title={h.name}
              owned={active}
              badge={active ? <Tag tone="pos">living here</Tag> : undefined}
              tags={
                <>
                  <Tag tone="neg">{h.upkeepPerWeek ? `${moneyShort(h.upkeepPerWeek)}/wk` : 'free'}</Tag>
                  {h.h > 0 && <Tag>+{h.h}❤</Tag>}
                  {h.hp > 0 && <Tag>+{h.hp}☺</Tag>}
                </>
              }
            >
              {!active && (
                <Button block onClick={() => chooseResidence(h.id)}>
                  Move in
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <h3 className="section-title">Food</h3>
      <div className="grid">
        {FOOD_TIERS.map((f) => {
          const active = game.lifestyle.food === f.id;
          return (
            <Card
              key={f.id}
              title={f.name}
              owned={active}
              badge={active ? <Tag tone="pos">current</Tag> : undefined}
              tags={
                <>
                  <Tag tone="neg">{moneyShort(f.costPerWeek)}/wk</Tag>
                  {f.h !== 0 && <Tag>{f.h > 0 ? '+' : ''}{f.h}❤</Tag>}
                  {f.hp > 0 && <Tag>+{f.hp}☺</Tag>}
                </>
              }
            >
              {!active && (
                <Button block onClick={() => chooseFood(f.id)}>
                  Switch
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <h3 className="section-title">Clothes</h3>
      <div className="grid">
        {CLOTHES_TIERS.map((c) => {
          const active = game.lifestyle.clothes === c.id;
          const canAfford = active || game.money.cash >= c.cost;
          return (
            <Card
              key={c.id}
              title={c.name}
              owned={active}
              badge={active ? <Tag tone="pos">wearing</Tag> : undefined}
              tags={
                <>
                  <Tag tone="neg">{moneyShort(c.cost)}</Tag>
                  <Tag tone="neg">{moneyShort(c.upkeepPerWeek)}/wk</Tag>
                  {c.hp > 0 && <Tag>+{c.hp}☺</Tag>}
                </>
              }
            >
              {!active && (
                <Button
                  block
                  disabled={!canAfford}
                  title={!canAfford ? 'Not enough cash' : undefined}
                  onClick={() => chooseClothes(c.id)}
                >
                  Buy
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <h3 className="section-title">Subscriptions</h3>
      <div className="grid">
        {SUBSCRIPTIONS.map((sub) => {
          const active = game.lifestyle.subscriptions.includes(sub.id);
          const canAfford = active || sub.cost === 0 || game.money.cash >= sub.cost;
          return (
            <Card
              key={sub.id}
              title={sub.name}
              owned={active}
              badge={active ? <Tag tone="pos">active</Tag> : undefined}
              tags={
                <>
                  {sub.cost > 0 && <Tag tone="neg">{moneyShort(sub.cost)} signup</Tag>}
                  <Tag tone="neg">{moneyShort(sub.upkeepPerWeek)}/wk</Tag>
                  {sub.h && <Tag>+{sub.h}❤</Tag>}
                  {sub.hp && <Tag>+{sub.hp}☺</Tag>}
                  {sub.insurance && <Tag tone="info">insurance</Tag>}
                </>
              }
            >
              <Button
                variant={active ? 'danger' : 'ghost'}
                block
                disabled={!canAfford}
                title={!canAfford ? 'Not enough cash' : undefined}
                onClick={() => toggleSub(sub.id)}
              >
                {active ? 'Cancel' : 'Subscribe'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
