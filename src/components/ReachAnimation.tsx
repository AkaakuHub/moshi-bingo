'use client';

import { useEffect, useState } from 'react';

interface ReachAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

export default function ReachAnimation({ isVisible, onComplete }: ReachAnimationProps) {
  const [animationState, setAnimationState] = useState<'hidden' | 'showing'>('hidden');

  const handleClose = () => {
    setAnimationState('hidden');
    onComplete();
  };

  useEffect(() => {
    if (isVisible) {
      console.log('ReachAnimation: Starting animation');
      setAnimationState('showing');
      
      // 3秒後に自動で閉じる
      const timer = setTimeout(() => {
        console.log('ReachAnimation: Auto closing');
        handleClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      console.log('ReachAnimation: Hiding animation');
      setAnimationState('hidden');
    }
  }, [isVisible]);

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
          <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            🎯 次の番号に注目しよう！
          </div>
        </div>
      </div>
    </div>
  );
}