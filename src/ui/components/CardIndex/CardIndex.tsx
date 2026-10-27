import { RANK_LABEL, type Card } from '../../../engine/model/card';

/** Rank above suit, like the corner index of a real card: narrow enough to stay readable in a tightly fanned hand. */
export function CardIndex({ card }: { card: Card }) {
  return (
    <span className="card-index">
      <span>{RANK_LABEL[card.rank]}</span>
      <span>{card.suit}</span>
    </span>
  );
}
