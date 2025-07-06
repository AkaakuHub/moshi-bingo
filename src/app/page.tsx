'use client';

import { useState, useEffect } from 'react';
import BingoCard from '@/components/BingoCard';
import HostPanel from '@/components/HostPanel';
import DrawAnimation from '@/components/DrawAnimation';
import DrawnNumbers from '@/components/DrawnNumbers';
import { generateBingoCard, checkBingo, drawRandomNumber } from '@/utils/bingoUtils';
import { useSupabase } from '@/hooks/useSupabase';
import { saveMarkedCells, getMarkedCells } from '@/utils/sessionUtils';

export default function Home() {
  const [gameStep, setGameStep] = useState<'select' | 'setup' | 'game'>('select');
  const [userType, setUserType] = useState<'host' | 'participant' | null>(null);
  const [userName, setUserName] = useState('');
  const [gameName, setGameName] = useState('');
  const [gameId, setGameId] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [markedCells, setMarkedCells] = useState<boolean[][]>(() => {
    const initialMarked = Array(5).fill(null).map(() => Array(5).fill(false));
    initialMarked[2][2] = true; // FREE space
    return initialMarked;
  });
  const [lastDrawnNumber, setLastDrawnNumber] = useState<number | null>(null);
  const [cardInitialized, setCardInitialized] = useState(false);
  const [hasNumberOnCard, setHasNumberOnCard] = useState(false);
  const [hostDisplayNumber, setHostDisplayNumber] = useState<number | null>(null);

  const { 
    currentGame, 
    currentUser, 
    bingoCard, 
    participants,
    createGame, 
    joinGame, 
    createBingoCard, 
    updateBingoCard, 
    drawNumber 
  } = useSupabase();

  useEffect(() => {
    if (currentGame && currentUser && gameStep !== 'game') {
      setGameStep('game');
    }
  }, [currentGame, currentUser, gameStep]);

  // 初期値設定とアニメーション終了後の同期
  useEffect(() => {
    if (currentUser?.role === 'host' && currentGame?.current_number) {
      if (!isDrawing) {
        setHostDisplayNumber(currentGame.current_number);
      }
    }
  }, [currentGame?.current_number, currentUser?.role, isDrawing]);

  useEffect(() => {
    if (currentGame && currentUser && currentUser.role === 'participant' && gameStep === 'game') {
      if (bingoCard) {
        // 既存のカードがある場合、localStorageからマークされたセルを復元
        console.log('Restoring existing card with numbers:', bingoCard.numbers);
        const savedMarkedCells = getMarkedCells(currentGame.id);
        if (savedMarkedCells) {
          console.log('Restoring marked cells from localStorage:', savedMarkedCells);
          setMarkedCells(savedMarkedCells);
        } else {
          console.log('No saved marked cells, using initial state');
          const initialMarked = Array(5).fill(null).map(() => Array(5).fill(false));
          initialMarked[2][2] = true; // FREE space
          setMarkedCells(initialMarked);
        }
        if (!cardInitialized) {
          setCardInitialized(true);
        }
      } else if (!cardInitialized) {
        // 新規カード作成
        setCardInitialized(true);
        const card = generateBingoCard();
        const initialMarked = Array(5).fill(null).map(() => Array(5).fill(false));
        initialMarked[2][2] = true;
        setMarkedCells(initialMarked);
        createBingoCard(card);
      }
    }
  }, [currentGame, currentUser, bingoCard, gameStep, cardInitialized, createBingoCard]);

  // 参加者側で抽選アニメーション表示
  useEffect(() => {
    if (currentGame && currentUser?.role === 'participant' && currentGame.current_number && bingoCard) {
      // 新しい番号が抽選されたかチェック（リロード時は表示しない）
      if (currentGame.current_number !== lastDrawnNumber && lastDrawnNumber !== null) {
        console.log('Participant sees new number:', currentGame.current_number);
        setLastDrawnNumber(currentGame.current_number);
        
        // 既にアニメーション中の場合は一旦キャンセル
        if (showAnimation) {
          console.log('Animation already playing, resetting...');
          setShowAnimation(false);
          setIsDrawing(false);
        }
        
        // 少し待ってから新しいアニメーションを開始（確実に表示させるため）
        setTimeout(() => {
          // 自分のカードに該当番号があるかチェック
          const drawnNumber = currentGame.current_number;
          let hasNumber = false;
          
          for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
              if (bingoCard.numbers[row][col] === drawnNumber) {
                hasNumber = true;
                break;
              }
            }
            if (hasNumber) break;
          }
          
          console.log('Starting animation for number:', drawnNumber, 'hasNumber:', hasNumber);
          setHasNumberOnCard(hasNumber);
          setIsDrawing(true);
          setShowAnimation(true);
          
          // 固定時間（4秒）後に必ずアニメーションを終了
          const animationTimer = setTimeout(() => {
            console.log('Animation complete');
            setShowAnimation(false);
            setIsDrawing(false);
            setHasNumberOnCard(false); // リセット
          }, 4000); // 4秒間確実に表示
          
          // クリーンアップ関数でタイマーをクリア
          return () => clearTimeout(animationTimer);
        }, 100); // 100ms待機してから開始
      } else if (lastDrawnNumber === null) {
        // 初回ロード時は現在の番号を設定するだけ
        setLastDrawnNumber(currentGame.current_number);
      }
    }
  }, [currentGame?.current_number, currentUser?.role, bingoCard, lastDrawnNumber, showAnimation, currentGame]);

  const handleStartGame = async () => {
    if (!userName.trim()) return;

    try {
      if (userType === 'host') {
        if (!gameName.trim()) return;
        console.log('Creating game...');
        const result = await createGame(gameName.trim(), userName.trim());
        if (result) {
          console.log('Game created, redirecting...', result);
          // 直接結果を使って遷移
          window.location.href = `/game/${result.id}?userId=${result.host_id}`;
        }
      } else {
        if (!gameId.trim()) return;
        console.log('Joining game...');
        const result = await joinGame(gameId.trim(), userName.trim());
        if (result) {
          console.log('Joined game, redirecting...', result);
          // 直接結果を使って遷移
          window.location.href = `/game/${result.game.id}?userId=${result.user.id}`;
        }
      }
    } catch (error) {
      console.error('Error starting game:', error);
      alert('エラーが発生しました: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!bingoCard || !currentGame) return;
    if (row === 2 && col === 2) return;
    
    const number = bingoCard.numbers[row][col];
    if (!currentGame.drawn_numbers.includes(number)) return;
    
    // 既にマークされている場合はクリックを無効にする
    if (markedCells[row][col]) return;
    
    const newMarked = [...markedCells];
    newMarked[row][col] = true;
    
    const hasBingo = checkBingo(newMarked);
    setMarkedCells(newMarked);
    
    // localStorageに保存
    saveMarkedCells(currentGame.id, newMarked);
    
    // Supabaseのビンゴ状態のみ更新
    updateBingoCard(newMarked, hasBingo);
  };

  const handleDrawNumber = async () => {
    if (isDrawing || !currentGame) return;
    
    setIsDrawing(true);
    setShowAnimation(true);
    
    try {
      const newNumber = drawRandomNumber(currentGame.drawn_numbers);
      
      // 主催者側のローカル表示用の数字を設定
      setHostDisplayNumber(newNumber);
      
      // 即座にDBを更新（参加者にすぐ伝わる）
      await drawNumber(newNumber);
      
      // DrawAnimationコンポーネント内で3秒後に自動終了される
    } catch {
      console.error('No more numbers to draw');
      setIsDrawing(false);
      setShowAnimation(false);
    }
  };


  if (gameStep === 'select') {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fadeIn">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-3xl">🎯</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">もしもしビンゴ</h1>
            <p className="text-white/80">リアルタイム ビンゴゲーム</p>
          </div>
          
          <div className="space-y-4">
            <button 
              className={`w-full p-6 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                userType === 'host' 
                  ? 'bg-white text-indigo-600 shadow-lg' 
                  : 'bg-white/10 text-white border-2 border-white/30 hover:bg-white/20'
              }`}
              onClick={() => { setUserType('host'); setGameStep('setup'); }}
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">👑</span>
                <span>主催者として参加</span>
              </div>
              <p className="text-sm opacity-70 mt-1">ゲームを作成して管理</p>
            </button>
            
            <button 
              className={`w-full p-6 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                userType === 'participant' 
                  ? 'bg-white text-indigo-600 shadow-lg' 
                  : 'bg-white/10 text-white border-2 border-white/30 hover:bg-white/20'
              }`}
              onClick={() => { setUserType('participant'); setGameStep('setup'); }}
            >
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">🎮</span>
                <span>参加者として参加</span>
              </div>
              <p className="text-sm opacity-70 mt-1">既存のゲームに参加</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameStep === 'setup') {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 card-shadow-lg animate-fadeIn">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">{userType === 'host' ? '👑' : '🎮'}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {userType === 'host' ? 'ゲーム作成' : 'ゲーム参加'}
              </h2>
              <p className="text-gray-600 text-sm">
                {userType === 'host' ? '新しいビンゴゲームを作成します' : '既存のゲームに参加します'}
              </p>
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
                />
              </div>
              
              {userType === 'host' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ゲーム名</label>
                  <input
                    type="text"
                    placeholder="ゲーム名を入力してください"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ゲームID</label>
                  <input
                    type="text"
                    placeholder="主催者から教えてもらったID"
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    例: f245cee7-4f52-42b1-999a-87bb990a6b0f
                  </p>
                </div>
              )}
              
              <button
                onClick={handleStartGame}
                disabled={
                  !userName.trim() || 
                  (userType === 'host' && !gameName.trim()) || 
                  (userType === 'participant' && !gameId.trim())
                }
                className="w-full btn-primary text-lg py-4 mt-6"
              >
                {userType === 'host' ? '🎯 ゲームを作成' : '🚀 ゲームに参加'}
              </button>
              
              <button
                onClick={() => setGameStep('select')}
                className="w-full p-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                ← 戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">{currentGame?.name || 'ビンゴゲーム'}</h1>
          <p className="text-sm text-gray-600">
            {currentUser?.role === 'host' ? '主催者' : '参加者'} | {currentUser?.name}
          </p>
          {currentUser?.role === 'host' && (
            <p className="text-xs text-gray-500 mt-2">ゲームID: {currentGame?.id}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentUser?.role === 'host' && (
            <>
              <HostPanel
                onDrawNumber={handleDrawNumber}
                drawnNumbers={currentGame?.drawn_numbers || []}
                currentNumber={currentGame?.current_number || null}
                isDrawing={isDrawing}
                displayNumber={hostDisplayNumber}
              />
              <div className="border rounded p-4 bg-white">
                <h3 className="text-lg font-bold mb-3">参加者一覧</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {participants.map((participant) => (
                    <div 
                      key={participant.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="font-medium">{participant.name}</span>
                      <span className="text-xs text-gray-600">
                        {participant.role === 'host' ? '主催者' : '参加者'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-center">
                  <span className="text-xs text-gray-600">
                    {participants.length}人参加中
                  </span>
                </div>
              </div>
            </>
          )}
          
          {currentUser?.role === 'participant' && bingoCard && (
            <>
              <BingoCard
                numbers={bingoCard.numbers}
                onCellClick={handleCellClick}
                markedCells={markedCells}
                isParticipant={true}
              />
              <DrawnNumbers drawnNumbers={currentGame?.drawn_numbers || []} />
              {bingoCard.has_bingo && (
                <div className="lg:col-span-2 mt-4 p-4 bg-green-100 rounded text-center">
                  <span className="text-xl">🎉 ビンゴ！</span>
                </div>
              )}
            </>
          )}
        </div>

        <DrawAnimation
          isVisible={showAnimation}
          drawnNumber={currentUser?.role === 'host' ? hostDisplayNumber : lastDrawnNumber}
          onComplete={() => {
            setShowAnimation(false);
            setIsDrawing(false);
          }}
          hasNumberOnCard={hasNumberOnCard}
          isParticipant={currentUser?.role === 'participant'}
        />
      </div>
    </div>
  );
}
