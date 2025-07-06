export function generateBingoCard(): number[][] {
  const card: number[][] = [];
  
  // B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
  const ranges = [
    { min: 1, max: 15 },   // B
    { min: 16, max: 30 },  // I
    { min: 31, max: 45 },  // N
    { min: 46, max: 60 },  // G
    { min: 61, max: 75 }   // O
  ];

  for (let col = 0; col < 5; col++) {
    const column: number[] = [];
    const usedNumbers = new Set<number>();
    
    for (let row = 0; row < 5; row++) {
      if (col === 2 && row === 2) {
        column.push(0); // FREE space
        continue;
      }
      
      let num: number;
      do {
        num = Math.floor(Math.random() * (ranges[col].max - ranges[col].min + 1)) + ranges[col].min;
      } while (usedNumbers.has(num));
      
      usedNumbers.add(num);
      column.push(num);
    }
    
    card.push(column);
  }

  // Transpose to get correct row/column format
  const transposed: number[][] = [];
  for (let row = 0; row < 5; row++) {
    transposed[row] = [];
    for (let col = 0; col < 5; col++) {
      transposed[row][col] = card[col][row];
    }
  }
  
  return transposed;
}

export function checkBingo(markedCells: boolean[][]): boolean {
  // Check rows
  for (let row = 0; row < 5; row++) {
    if (markedCells[row].every(cell => cell)) {
      return true;
    }
  }
  
  // Check columns
  for (let col = 0; col < 5; col++) {
    if (markedCells.every(row => row[col])) {
      return true;
    }
  }
  
  // Check diagonals
  if (markedCells.every((row, i) => row[i])) {
    return true;
  }
  
  if (markedCells.every((row, i) => row[4 - i])) {
    return true;
  }
  
  return false;
}

export function checkReach(markedCells: boolean[][]): boolean {
  // Check rows for reach (4 out of 5 marked)
  for (let row = 0; row < 5; row++) {
    const markedCount = markedCells[row].filter(cell => cell).length;
    if (markedCount === 4) {
      return true;
    }
  }
  
  // Check columns for reach
  for (let col = 0; col < 5; col++) {
    const markedCount = markedCells.filter(row => row[col]).length;
    if (markedCount === 4) {
      return true;
    }
  }
  
  // Check diagonal (top-left to bottom-right) for reach
  const diagonal1Count = markedCells.filter((row, i) => row[i]).length;
  if (diagonal1Count === 4) {
    return true;
  }
  
  // Check diagonal (top-right to bottom-left) for reach
  const diagonal2Count = markedCells.filter((row, i) => row[4 - i]).length;
  if (diagonal2Count === 4) {
    return true;
  }
  
  return false;
}

export function drawRandomNumber(excludeNumbers: number[]): number {
  const availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1)
    .filter(num => !excludeNumbers.includes(num));
  
  if (availableNumbers.length === 0) {
    throw new Error('No more numbers to draw');
  }
  
  return availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
}