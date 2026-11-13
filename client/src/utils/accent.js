const KEY = 'accent';
export const ACCENTS = ['#2D4BFF', '#FF5A3C', '#12B981', '#14141A'];

export function applyAccent(color) {
  const root = document.documentElement;
  root.style.setProperty('--ac', color);
  root.style.setProperty('--color-accent', color);
}

export function currentAccent() {
  try {
    const c = localStorage.getItem(KEY);
    return ACCENTS.includes(c) ? c : ACCENTS[0];
  } catch {
    return ACCENTS[0];
  }
}

export function loadAccent() {
  applyAccent(currentAccent());
}

export function saveAccent(color) {
  applyAccent(color);
  try {
    localStorage.setItem(KEY, color);
  } catch {
    /* ignore */
  }
}