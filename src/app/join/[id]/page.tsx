'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useSupabase } from '@/hooks/useSupabase';

export default function JoinPage() {
  const params = useParams();
  const gameId = params.id as string;
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { joinGame } = useSupabase();

  const handleJoinGame = async () => {
    if (!userName.trim()) return;

    setIsLoading(true);
    try {
      const result = await joinGame(gameId, userName.trim());
      if (result) {
        window.location.href = `/game/${gameId}?userId=${result.user.id}`;
      }
    } catch (error) {
      console.error('Error joining game:', error);
      alert('エラーが発生しました: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 card-shadow-lg animate-fadeIn">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎮</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">ビンゴゲームに参加</h1>
            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">ゲームID</p>
              <p className="text-sm font-mono text-gray-700 break-all">{gameId}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">あなたの名前</label>
              <input
                type="text"
                placeholder="名前を入力してください"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                disabled={isLoading}
              />
            </div>
            
            <button
              onClick={handleJoinGame}
              disabled={!userName.trim() || isLoading}
              className="w-full btn-primary text-lg py-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>参加中...</span>
                </div>
              ) : (
                '🚀 ゲームに参加'
              )}
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full p-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              disabled={isLoading}
            >
              ← ホームに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}