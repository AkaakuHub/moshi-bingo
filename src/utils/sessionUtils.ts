import { v4 as uuidv4 } from 'uuid';

const SESSION_ID_KEY = 'bingo-session-id';
const MARKED_CELLS_KEY = 'bingo-marked-cells';

export function getOrCreateSessionId(gameId?: string): string {
  if (typeof window === 'undefined') return '';
  
  // ゲームごとにセッションIDを管理
  const currentGameId = gameId || window.location.pathname.split('/')[2]; // /game/[id] から取得
  const sessionKey = currentGameId ? `${SESSION_ID_KEY}-${currentGameId}` : SESSION_ID_KEY;
  
  let sessionId = localStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem(sessionKey, sessionId);
    console.log('Created new session ID for game:', currentGameId, sessionId);
  } else {
    console.log('Using existing session ID for game:', currentGameId, sessionId);
  }
  
  return sessionId;
}

export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_ID_KEY);
}

export function saveMarkedCells(gameId: string, markedCells: boolean[][]): void {
  if (typeof window === 'undefined') return;
  
  const sessionId = getOrCreateSessionId(gameId);
  const key = `${MARKED_CELLS_KEY}-${gameId}-${sessionId}`;
  localStorage.setItem(key, JSON.stringify(markedCells));
  console.log('Saved marked cells to localStorage:', key, markedCells);
}

export function getMarkedCells(gameId: string): boolean[][] | null {
  if (typeof window === 'undefined') return null;
  
  const sessionId = getOrCreateSessionId(gameId);
  const key = `${MARKED_CELLS_KEY}-${gameId}-${sessionId}`;
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
  
  const sessionId = getOrCreateSessionId(gameId);
  const key = `${MARKED_CELLS_KEY}-${gameId}-${sessionId}`;
  localStorage.removeItem(key);
  console.log('Cleared marked cells from localStorage:', key);
}