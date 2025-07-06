import { v4 as uuidv4 } from 'uuid';

const SESSION_ID_KEY = 'bingo-session-id';
const MARKED_CELLS_KEY = 'bingo-marked-cells';

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  // ゲームごとにセッションIDを管理
  const gameId = window.location.pathname.split('/')[2]; // /game/[id] から取得
  const sessionKey = gameId ? `${SESSION_ID_KEY}-${gameId}` : SESSION_ID_KEY;
  
  let sessionId = localStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem(sessionKey, sessionId);
    console.log('Created new session ID for game:', gameId, sessionId);
  } else {
    console.log('Using existing session ID for game:', gameId, sessionId);
  }
  
  return sessionId;
}

export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_ID_KEY);
}

export function saveMarkedCells(gameId: string, markedCells: boolean[][]): void {
  if (typeof window === 'undefined') return;
  
  const key = `${MARKED_CELLS_KEY}-${gameId}`;
  localStorage.setItem(key, JSON.stringify(markedCells));
  console.log('Saved marked cells to localStorage:', key, markedCells);
}

export function getMarkedCells(gameId: string): boolean[][] | null {
  if (typeof window === 'undefined') return null;
  
  const key = `${MARKED_CELLS_KEY}-${gameId}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const markedCells = JSON.parse(saved);
      console.log('Loaded marked cells from localStorage:', key, markedCells);
      return markedCells;
    } catch (error) {
      console.error('Error parsing marked cells:', error);
      return null;
    }
  }
  return null;
}

export function clearMarkedCells(gameId: string): void {
  if (typeof window === 'undefined') return;
  
  const key = `${MARKED_CELLS_KEY}-${gameId}`;
  localStorage.removeItem(key);
  console.log('Cleared marked cells from localStorage:', key);
}