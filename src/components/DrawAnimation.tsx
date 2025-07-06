'use client';

import { useEffect, useState } from 'react';

interface DrawAnimationProps {
  isVisible: boolean;
  drawnNumber: number | null;
  onComplete: () => void;
  hasNumberOnCard?: boolean;
  isParticipant?: boolean;
}

export default function DrawAnimation({ isVisible, drawnNumber, onComplete, hasNumberOnCard = false, isParticipant = false }: DrawAnimationProps) {
  const [animationState, setAnimationState] = useState<'hidden' | 'spinning' | 'reveal'>('hidden');

  // 発表演出中は手動で閉じることができない（固定時間で自動終了のみ）

  useEffect(() => {
    if (isVisible) {
      console.log('DrawAnimation: Starting animation');
      setAnimationState('spinning');
      
      // 2秒後にrevealフェーズに移行
      const revealTimer = setTimeout(() => {
        console.log('DrawAnimation: Switching to reveal');
        setAnimationState('reveal');
      }, 2000);
      
      // 3秒後に自動でアニメーション終了
      const completeTimer = setTimeout(() => {
        console.log('DrawAnimation: Animation complete, calling onComplete');
        setAnimationState('hidden');
        onComplete();
      }, 3000);
      
      return () => {
        clearTimeout(revealTimer);
        clearTimeout(completeTimer);
      };
    } else {
      console.log('DrawAnimation: Hiding animation');
      setAnimationState('hidden');
    }
  }, [isVisible, onComplete]);

  if (!isVisible || drawnNumber === null) {
    console.log('DrawAnimation: Not visible or no number', { isVisible, drawnNumber });
    return null;
  }

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 animate-fadeIn"
      // 発表演出中は外クリックで閉じない
    >
      <div 
        className="bg-white/95 backdrop-blur-md rounded-2xl p-8 text-center card-shadow-lg animate-fadeIn max-w-sm mx-4"
      >
        <div className="text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          けどけどん！
        </div>
        
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className={`
            w-full h-full rounded-full border-4 
            flex items-center justify-center text-3xl font-bold
            transition-all duration-300 ease-in-out
            ${animationState === 'spinning' ? 'animate-spin border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50' : ''}
            ${animationState === 'reveal' ? 'animate-pulse-scale bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-600 shadow-lg' : 'bg-white border-gray-300'}
          `}>
            {animationState === 'reveal' ? drawnNumber : '?'}
          </div>
          
          {animationState === 'spinning' && (
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-200 animate-spin"></div>
          )}
        </div>

        {animationState === 'spinning' && (
          <div className="text-lg animate-pulse text-gray-600">抽選中...</div>
        )}
        
        {animationState === 'reveal' && (
          <div className="space-y-2">
            <div className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {drawnNumber}番が出ました！
            </div>
            {isParticipant && (
              <div className={`text-base font-semibold p-3 rounded-lg ${
                hasNumberOnCard 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                {hasNumberOnCard ? (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">🎯</span>
                    <span>あなたのカードにあります！</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">📝</span>
                    <span>あなたのカードにはありません</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}