export type PlayerId = 0 | 1 | 2;

export const PLAYER_IDS: PlayerId[] = [0, 1, 2];

export function nextPlayer(p: PlayerId): PlayerId {
  return ((p + 1) % 3) as PlayerId;
}

export function playersFrom(start: PlayerId): PlayerId[] {
  const a = start;
  const b = nextPlayer(a);
  const c = nextPlayer(b);
  return [a, b, c];
}

export function otherPlayers(p: PlayerId): PlayerId[] {
  return PLAYER_IDS.filter((id) => id !== p);
}
