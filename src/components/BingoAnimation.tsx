'use client';

import { useEffect, useState, useCallback } from 'react';

interface BingoAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

export default function BingoAnimation({ isVisible, onComplete }: BingoAnimationProps) {
  const [animationState, setAnimationState] = useState<'hidden' | 'fireworks' | 'celebration'>('hidden');

  const handleClose = useCallback(() => {
    setAnimationState('hidden');
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (isVisible) {
      console.log('BingoAnimation: Starting animation');
      setAnimationState('fireworks');
      
      // 2秒後にお祝いフェーズに移行
      const fireworksTimer = setTimeout(() => {
        setAnimationState('celebration');
      }, 2000);
      
      // 5秒後に自動で閉じる
      const autoCloseTimer = setTimeout(() => {
        console.log('BingoAnimation: Auto closing');
        handleClose();
      }, 5000);
      
      return () => {
        clearTimeout(fireworksTimer);
        clearTimeout(autoCloseTimer);
      };
    } else {
      console.log('BingoAnimation: Hiding animation');
      setAnimationState('hidden');
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
        className="bg-white/95 backdrop-blur-md rounded-2xl p-8 text-center card-shadow-lg max-w-md mx-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 花火エフェクト */}
        {animationState === 'fireworks' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 text-2xl animate-bounce">🎆</div>
            <div className="absolute top-4 right-4 text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎇</div>
            <div className="absolute bottom-4 left-4 text-2xl animate-bounce" style={{ animationDelay: '0.4s' }}>✨</div>
            <div className="absolute bottom-4 right-4 text-2xl animate-bounce" style={{ animationDelay: '0.6s' }}>🎉</div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl animate-spin">🌟</div>
          </div>
        )}

        <div className={`transition-all duration-1000 ${
          animationState === 'fireworks' 
            ? 'text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent animate-pulse' 
            : 'text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent animate-bounce'
        }`}>
          {animationState === 'fireworks' ? 'BINGO!' : '🎉 BINGO! 🎉'}
        </div>
        
        {animationState === 'fireworks' && (
          <div className="relative w-40 h-40 mx-auto mb-6">
            <div className="w-full h-full rounded-full border-4 border-yellow-400 bg-gradient-to-br from-yellow-100 to-red-100 flex items-center justify-center text-6xl animate-ping">
              🏆
            </div>
            <div className="absolute inset-0 w-full h-full rounded-full border-4 border-red-500 bg-gradient-to-br from-red-200 to-pink-200 flex items-center justify-center text-6xl">
              🏆
            </div>
          </div>
        )}

        {animationState === 'celebration' && (
          <div className="space-y-4">
            <div className="text-6xl animate-bounce">🏆</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              おめでとうございます！
            </div>
            <div className="text-lg text-gray-700 bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-200">
              🎊 ビンゴを達成しました！ 🎊
            </div>
            <div className="grid grid-cols-4 gap-2 justify-center">
              <span className="text-2xl animate-bounce" style={{ animationDelay: '0s' }}>🎈</span>
              <span className="text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>🎁</span>
              <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎀</span>
              <span className="text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎊</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}