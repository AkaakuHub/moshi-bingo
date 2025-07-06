'use client';

interface BingoCardProps {
  numbers: number[][];
  onCellClick: (row: number, col: number) => void;
  markedCells: boolean[][];
  isParticipant: boolean;
}

export default function BingoCard({ numbers, onCellClick, markedCells, isParticipant }: BingoCardProps) {
  // 安全性チェック
  if (!numbers || !markedCells || numbers.length !== 5 || markedCells.length !== 5) {
    return (
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 card-shadow-lg">
        <p className="text-center text-gray-600">ビンゴカードを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 card-shadow-lg sparkle-bg">
      <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
        🎯 BINGO
      </h2>
      <div className="grid grid-cols-5 gap-1 sm:gap-2 p-2 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
        {numbers.map((row, rowIndex) =>
          row.map((number, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={`
                w-12 h-12 sm:w-14 sm:h-14 text-sm sm:text-lg font-bold border-2 rounded-xl transition-all duration-300
                ${markedCells[rowIndex] && markedCells[rowIndex][colIndex] 
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white border-green-300 shadow-lg' 
                  : 'bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 border-gray-300 hover:border-indigo-300'
                }
                ${!isParticipant ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
                ${rowIndex === 2 && colIndex === 2 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-yellow-300' : ''}
                flex items-center justify-center
              `}
              onClick={() => isParticipant && onCellClick(rowIndex, colIndex)}
              disabled={!isParticipant}
            >
              {rowIndex === 2 && colIndex === 2 ? (
                <span className="text-xs font-bold leading-none">FREE</span>
              ) : (
                <span className="leading-none">
                  {number}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}