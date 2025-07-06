'use client';

import { useEffect, useCallback } from 'react';

interface ReachAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
  missingNumbers?: number[]; // リーチに必要な数字
}

export default function ReachAnimation({ isVisible, onComplete, missingNumbers = [] }: ReachAnimationProps) {
  const handleClose = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (isVisible) {
      console.log('ReachAnimation: Starting animation');
      
      // 3秒後に自動で閉じる
      const timer = setTimeout(() => {
        console.log('ReachAnimation: Auto closing');
        handleClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      console.log('ReachAnimation: Hiding animation');
    }
  }, [isVisible, handleClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 animate-fadeIn"
      onClick={handleClose}
    >
      <div 
        className="bg-white/95 backdrop-blur-md rounded-2xl p-8 text-center card-shadow-lg animate-bounce max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl font-bold mb-6 bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent animate-pulse">
          リーチ！
        </div>
        
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="w-full h-full rounded-full border-4 border-yellow-400 bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center text-4xl animate-ping">
            🔥
          </div>
          <div className="absolute inset-0 w-full h-full rounded-full border-4 border-yellow-600 bg-gradient-to-br from-yellow-200 to-orange-200 flex items-center justify-center text-4xl">
            🔥
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            あと1つでビンゴ！
          </div>
          {missingNumbers.length > 0 && (
            <div className="text-sm text-gray-700 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-xs text-gray-500 mb-2">🎯 必要な番号</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {missingNumbers.map((number, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-sm rounded-full border-2 border-yellow-300 shadow-md"
                  >
                    {number}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center">
                これらの番号が出ればビンゴです！
              </div>
            </div>
          )}
          <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            🎯 次の番号に注目しよう！
          </div>
        </div>
      </div>
    </div>
  );
}