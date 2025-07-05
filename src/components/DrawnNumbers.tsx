'use client';

interface DrawnNumbersProps {
  drawnNumbers: number[];
}

export default function DrawnNumbers({ drawnNumbers }: DrawnNumbersProps) {
  return (
    <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 card-shadow-lg sparkle-bg">
      <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
        📝 抽選済み番号
      </h3>
      <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 sm:gap-2 max-h-32 overflow-y-auto p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
        {drawnNumbers.map((number, index) => (
          <div 
            key={number}
            className="text-xs sm:text-sm bg-gradient-to-br from-blue-400 to-purple-500 text-white rounded-lg px-1 sm:px-2 py-1 text-center font-bold shadow-md animate-fadeIn flex items-center justify-center min-h-[24px] sm:min-h-[28px]"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {number}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium">
          🎯 {drawnNumbers.length}/75 抽選済み
        </span>
      </div>
    </div>
  );
}