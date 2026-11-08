// Tiny localStorage wrapper. Storage can be missing or blocked, so every call is guarded.
const KEY = 'brie-cloverleaf-v1';
const DEFAULTS = { muted: false, bestClovers: 0, bestTreats: 0, bestTime: 0, friendsEver: [], plays: 0 };

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeSave(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode or blocked storage: progress just isn't kept */
  }
}
