'use client';

interface HostPanelProps {
  onDrawNumber: () => void;
  drawnNumbers: number[];
  currentNumber: number | null;
  isDrawing: boolean;
  displayNumber?: number | null;
}

export default function HostPanel({ onDrawNumber, drawnNumbers, currentNumber, isDrawing, displayNumber }: HostPanelProps) {
  return (
    <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 card-shadow-lg sparkle-bg">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent">
        👑 主催者画面
      </h2>
      
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center animate-float">
          <span className="text-4xl font-bold text-white">
            {isDrawing ? (displayNumber || '?') : (currentNumber || '?')}
          </span>
        </div>
        <button 
          className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
            isDrawing 
              ? 'bg-gray-300 cursor-not-allowed opacity-50' 
              : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white hover:scale-105 animate-glow'
          }`}
          onClick={onDrawNumber}
          disabled={isDrawing}
        >
          {isDrawing ? '🎰 けどけどん...' : '🎲 抽選開始'}
        </button>
      </div>

      <div className="border-t-2 border-gray-200 pt-6">
        <p className="text-lg font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          📝 抽選済み番号
        </p>
        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 sm:gap-2 max-h-32 overflow-y-auto p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
          {drawnNumbers.map((number, index) => (
            <div 
              key={number}
              className="text-xs sm:text-sm bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-lg px-1 sm:px-2 py-1 text-center font-bold shadow-md animate-fadeIn flex items-center justify-center min-h-[24px] sm:min-h-[28px]"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {number}
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-sm font-medium">
            🎯 {drawnNumbers.length}/75 抽選済み
          </span>
        </div>
      </div>
    </div>
  );
}