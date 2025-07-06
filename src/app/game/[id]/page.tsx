'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BingoCard from '@/components/BingoCard';
import HostPanel from '@/components/HostPanel';
import DrawAnimation from '@/components/DrawAnimation';
import ReachAnimation from '@/components/ReachAnimation';
import BingoAnimation from '@/components/BingoAnimation';
import DrawnNumbers from '@/components/DrawnNumbers';
import { generateBingoCard, checkBingo, checkReach, getMissingNumbersForReach, drawRandomNumber } from '@/utils/bingoUtils';
import { useSupabase } from '@/hooks/useSupabase';
import { saveMarkedCells, getMarkedCells } from '@/utils/sessionUtils';
import { supabase } from '@/lib/supabase';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  
  // URLパラメータからユーザーIDを取得
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const userId = searchParams?.get('userId');
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [markedCells, setMarkedCells] = useState<boolean[][]>(() => {
    const initialMarked = Array(5).fill(null).map(() => Array(5).fill(false));
    initialMarked[2][2] = true; // FREE space
    return initialMarked;
  });
  const [lastDrawnNumber, setLastDrawnNumber] = useState<number | null>(null);
  const [cardInitialized, setCardInitialized] = useState(false);
  const [cardLoading, setCardLoading] = useState(true);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [hasNumberOnCard, setHasNumberOnCard] = useState(false);
  const [hostDisplayNumber, setHostDisplayNumber] = useState<number | null>(null);
  const [showReachAnimation, setShowReachAnimation] = useState(false);
  const [showBingoAnimation, setShowBingoAnimation] = useState(false);
  const [reachMissingNumbers, setReachMissingNumbers] = useState<number[]>([]);

  const { 
    currentGame, 
    currentUser, 
    bingoCard, 
    participants,
    createBingoCard, 
    updateBingoCard, 
    drawNumber,
    loadGame,
    loadGameWithUser
  } = useSupabase();

  // URLのゲームIDでゲームをロード
  useEffect(() => {
    if (gameId && !gameLoaded) {
      // ゲームをロード
      const loadGameData = async () => {
        try {
          // まずゲームが存在するか確認
          const { data: gameData, error: gameError } = await supabase
            .from('games')
            .select('*')
            .eq('id', gameId)
            .single();
          
          if (gameError || !gameData) {
            console.error('Game not found:', gameId);
            router.push('/');
            return;
          }
          
          // ゲームが存在する場合、通常の処理
          if (userId) {
            loadGameWithUser(gameId, userId);
          } else {
            loadGame(gameId);
          }
        } catch (error) {
          console.error('Error checking game:', error);
          router.push('/');
        }
      };
      
      loadGameData();
      setGameLoaded(true);
      
      // タイムアウト設定（10秒後にエラー画面を表示）
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [gameId, userId, gameLoaded, loadGame, loadGameWithUser, router]);

  // 初期値設定とアニメーション終了後の同期
  useEffect(() => {
    if (currentUser?.role === 'host' && currentGame?.current_number) {
      if (!isDrawing) {
        setHostDisplayNumber(currentGame.current_number);
      }
    }
  }, [currentGame?.current_number, currentUser?.role, isDrawing]);

  // ゲームが見つからない場合はホームに戻る（少し遅延を入れる）
  useEffect(() => {
    if (gameLoaded && !currentGame && gameId) {
      console.log('Game not found, redirecting to home...');
      const timer = setTimeout(() => {
        router.push('/');
      }, 3000); // 3秒待ってからリダイレクト
      return () => clearTimeout(timer);
    }
  }, [gameLoaded, currentGame, gameId, router]);

  // カード読み込み状態を管理
  useEffect(() => {
    if (currentGame && currentUser && currentUser.role === 'participant') {
      // 初回のみ、少し待ってからカード読み込み完了とする
      const timer = setTimeout(() => {
        console.log('Card loading complete, setting cardLoading to false');
        setCardLoading(false);
      }, 2000); // 2秒に延長
      return () => clearTimeout(timer);
    }
  }, [currentGame, currentUser]);

  // ビンゴカード初期化または復元
  useEffect(() => {
    console.log('Card effect triggered:', {
      currentGame: !!currentGame,
      currentUser: currentUser?.role,
      bingoCard: !!bingoCard,
      cardInitialized,
      cardLoading,
      bingoCardNumbers: bingoCard?.numbers
    });

    if (currentGame && currentUser && currentUser.role === 'participant' && !cardLoading) {
      if (bingoCard) {
        // 既存のカードがある場合、localStorageからマークされたセルを復元
        console.log('Restoring existing card with numbers:', bingoCard.numbers);
        const savedMarkedCells = getMarkedCells(gameId);
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
      } else if (!cardInitialized && !bingoCard) {
        // 新規カード作成（既存カードが見つからない場合のみ）
        console.log('DEBUG: About to create new card', {
          cardInitialized,
          bingoCard,
          currentUser,
          currentGame,
          sessionId: typeof window !== 'undefined' ? localStorage.getItem(`bingo-session-id-${gameId}`) : null
        });
        setCardInitialized(true);
        const card = generateBingoCard();
        console.log('Generated new card:', card);
        const initialMarked = Array(5).fill(null).map(() => Array(5).fill(false));
        initialMarked[2][2] = true;
        setMarkedCells(initialMarked);
        createBingoCard(card);
      } else {
        console.log('Card effect - no action needed:', {
          hasBingoCard: !!bingoCard,
          cardInitialized,
          cardLoading
        });
      }
    }
  }, [currentGame, currentUser, bingoCard, cardInitialized, cardLoading, gameId, createBingoCard]);

  // 参加者側で抽選アニメーション表示 - シンプルな実装
  useEffect(() => {
    // 基本条件チェック
    if (!currentGame || !currentUser || currentUser.role !== 'participant' || !bingoCard) {
      return;
    }

    // 現在の番号が存在しない場合
    if (!currentGame.current_number) {
      return;
    }

    // 初回ロード時の処理
    if (lastDrawnNumber === null) {
      console.log('Initial load - checking if should show animation for:', currentGame.current_number);
      
      // ゲームが始まっていて、drawn_numbersに番号があれば演出を表示
      if (currentGame.drawn_numbers && currentGame.drawn_numbers.length > 0) {
        console.log('Game already started - showing animation for current number');
        setLastDrawnNumber(currentGame.current_number);
        
        // 演出を表示
        const drawnNumber = currentGame.current_number;
        let hasNumber = false;

        // カード内の番号をチェック
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            if (bingoCard.numbers[row][col] === drawnNumber) {
              hasNumber = true;
              break;
            }
          }
          if (hasNumber) break;
        }

        console.log('INITIAL ANIMATION:', {
          number: drawnNumber,
          hasNumber,
          cardNumbers: bingoCard.numbers.flat()
        });

        // 状態設定
        setHasNumberOnCard(hasNumber);
        setIsDrawing(true);
        setShowAnimation(true);

        // 自動マーク機能：初回ロード時も自動でマークする
        if (hasNumber) {
          const newMarked = [...markedCells];
          let markedSomething = false;

          for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
              if (bingoCard.numbers[row][col] === drawnNumber && !newMarked[row][col]) {
                newMarked[row][col] = true;
                markedSomething = true;
                console.log('Auto-marked cell on initial load:', row, col, drawnNumber);
              }
            }
          }

          if (markedSomething) {
            const hasBingo = checkBingo(newMarked);
            const hasReach = !hasBingo && checkReach(newMarked);
            
            setMarkedCells(newMarked);
            saveMarkedCells(gameId, newMarked);
            updateBingoCard(newMarked, hasBingo);

            // 演出の表示（リーチ・ビンゴ）
            if (hasBingo) {
              console.log('INITIAL BINGO achieved!');
              setTimeout(() => {
                setShowBingoAnimation(true);
              }, 3500);
            } else if (hasReach) {
              console.log('INITIAL REACH achieved!');
              const missingNumbers = getMissingNumbersForReach(newMarked, bingoCard.numbers);
              setReachMissingNumbers(missingNumbers);
              setTimeout(() => {
                setShowReachAnimation(true);
              }, 3500);
            }
          }
        }

        // 3秒後に必ず終了
        const animationTimeout = setTimeout(() => {
          console.log('INITIAL ANIMATION TIMEOUT - forcing end');
          setShowAnimation(false);
          setIsDrawing(false);
          setHasNumberOnCard(false);
        }, 3000);

        // クリーンアップ
        return () => {
          clearTimeout(animationTimeout);
        };
      } else {
        // ゲームがまだ始まっていない場合は番号を設定するだけ
        console.log('Game not started yet - just setting last drawn number');
        setLastDrawnNumber(currentGame.current_number);
        return;
      }
    }

    // 番号が変わった場合のみアニメーション表示
    if (currentGame.current_number !== lastDrawnNumber) {
      console.log('NEW NUMBER DETECTED:', {
        new: currentGame.current_number,
        old: lastDrawnNumber,
        isAnimating: showAnimation
      });

      // 番号を更新
      setLastDrawnNumber(currentGame.current_number);

      // 既にアニメーション中の場合は停止
      if (showAnimation || isDrawing) {
        console.log('Stopping current animation');
        setShowAnimation(false);
        setIsDrawing(false);
        setHasNumberOnCard(false);
      }

      // 新しいアニメーションを開始
      const drawnNumber = currentGame.current_number;
      let hasNumber = false;

      // カード内の番号をチェック
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (bingoCard.numbers[row][col] === drawnNumber) {
            hasNumber = true;
            break;
          }
        }
        if (hasNumber) break;
      }

      console.log('STARTING ANIMATION:', {
        number: drawnNumber,
        hasNumber,
        cardNumbers: bingoCard.numbers.flat()
      });

      // 状態設定
      setHasNumberOnCard(hasNumber);
      setIsDrawing(true);
      setShowAnimation(true);

      // 自動マーク機能：自分のカードに番号がある場合、自動でマークする
      if (hasNumber) {
        const newMarked = [...markedCells];
        let markedSomething = false;

        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            if (bingoCard.numbers[row][col] === drawnNumber && !newMarked[row][col]) {
              newMarked[row][col] = true;
              markedSomething = true;
              console.log('Auto-marked cell:', row, col, drawnNumber);
            }
          }
        }

        if (markedSomething) {
          const hasBingo = checkBingo(newMarked);
          const hasReach = !hasBingo && checkReach(newMarked);
          
          setMarkedCells(newMarked);
          saveMarkedCells(gameId, newMarked);
          updateBingoCard(newMarked, hasBingo);

          // 演出の表示（リーチ・ビンゴ）
          if (hasBingo) {
            console.log('AUTO BINGO achieved!');
            // ビンゴ演出は抽選演出後に表示（少し遅延）
            setTimeout(() => {
              setShowBingoAnimation(true);
            }, 3500);
          } else if (hasReach) {
            console.log('AUTO REACH achieved!');
            const missingNumbers = getMissingNumbersForReach(newMarked, bingoCard.numbers);
            setReachMissingNumbers(missingNumbers);
            // リーチ演出は抽選演出後に表示（少し遅延）
            setTimeout(() => {
              setShowReachAnimation(true);
            }, 3500);
          }
        }
      }

      // 3秒後に必ず終了
      const animationTimeout = setTimeout(() => {
        console.log('ANIMATION TIMEOUT - forcing end');
        setShowAnimation(false);
        setIsDrawing(false);
        setHasNumberOnCard(false);
      }, 3000);

      // クリーンアップ
      return () => {
        clearTimeout(animationTimeout);
      };
    }
  }, [currentGame?.current_number, currentUser?.role, bingoCard?.numbers, lastDrawnNumber]);

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
    const hasReach = !hasBingo && checkReach(newMarked);
    
    setMarkedCells(newMarked);
    
    // localStorageに保存
    saveMarkedCells(gameId, newMarked);
    
    // 演出の表示
    if (hasBingo) {
      console.log('BINGO achieved!');
      setShowBingoAnimation(true);
    } else if (hasReach) {
      console.log('REACH achieved!');
      const missingNumbers = getMissingNumbersForReach(newMarked, bingoCard.numbers);
      setReachMissingNumbers(missingNumbers);
      setShowReachAnimation(true);
    }
    
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
      
      // アニメーション終了を待つ
      setTimeout(() => {
        setShowAnimation(false);
        setIsDrawing(false);
      }, 3500);
    } catch {
      console.error('No more numbers to draw');
      setIsDrawing(false);
      setShowAnimation(false);
    }
  };

  const handleReachAnimationComplete = () => {
    setShowReachAnimation(false);
  };

  const handleBingoAnimationComplete = () => {
    setShowBingoAnimation(false);
  };

  if (!currentGame) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          <p className="text-lg">ゲームを読み込み中...</p>
        </div>
      </div>
    );
  }
  

  // currentUserがnullの場合の処理
  if (!currentUser) {
    // タイムアウトした場合はエラー画面を表示
    if (loadingTimeout) {
      return (
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-md mx-auto mt-20">
            <div className="bg-white rounded-2xl card-shadow-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">読み込みエラー</h2>
              <p className="text-gray-600 mb-6">
                ユーザー情報の読み込みに失敗しました。<br/>
                ゲームID: {gameId}<br/>
                {userId && `ユーザーID: ${userId}`}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary w-full mb-3"
              >
                🔄 再読み込み
              </button>
              <button
                onClick={() => router.push(`/join/${gameId}`)}
                className="btn-secondary w-full mb-3"
              >
                参加画面に移動
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full p-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                ← ホームに戻る
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // ローディング表示
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          <p className="text-lg">ユーザー情報を読み込み中...</p>
          {userId && <p className="text-sm opacity-70 mt-2">ユーザーID: {userId}</p>}
          <p className="text-xs opacity-50 mt-4">10秒でタイムアウトします</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen game-bg p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl card-shadow-lg p-6 mb-6 animate-fadeIn sparkle-bg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center animate-float neon-border">
                <span className="text-white text-2xl">{currentUser.role === 'host' ? '👑' : '🎮'}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {currentGame.name}
                </h1>
                <p className="text-gray-600 mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    currentUser.role === 'host' 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                      : 'bg-gradient-to-r from-green-400 to-blue-500 text-white'
                  }`}>
                    {currentUser.role === 'host' ? '👑 主催者' : '🎮 参加者'}
                  </span>
                  <span className="ml-3 text-lg font-semibold">{currentUser.name}</span>
                </p>
              </div>
            </div>
            
            {currentUser.role === 'host' && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-right border-2 border-gray-200">
                <p className="text-xs text-gray-500 mb-1">🎯 ゲームID</p>
                <p className="text-xs font-mono text-gray-700 mb-2 bg-white px-2 py-1 rounded">{currentGame.id}</p>
                <button
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(`${window.location.origin}/join/${currentGame.id}`);
                      alert('参加用URLをコピーしました！');
                    }
                  }}
                  className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  📋 参加用URLをコピー
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentUser.role === 'host' && (
            <>
              <HostPanel
                onDrawNumber={handleDrawNumber}
                drawnNumbers={currentGame.drawn_numbers || []}
                currentNumber={currentGame.current_number || null}
                isDrawing={isDrawing}
                displayNumber={hostDisplayNumber}
              />
              <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 card-shadow-lg sparkle-bg">
                <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  👥 参加者一覧
                </h3>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {participants.map((participant, index) => (
                    <div 
                      key={participant.id}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 animate-fadeIn"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">{participant.role === 'host' ? '👑' : '🎮'}</span>
                        </div>
                        <span className="font-semibold text-gray-800">{participant.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        participant.role === 'host' 
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                          : 'bg-gradient-to-r from-green-400 to-blue-500 text-white'
                      }`}>
                        {participant.role === 'host' ? '主催者' : '参加者'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-sm font-medium animate-pulse">
                    🎯 {participants.length}人参加中
                  </span>
                </div>
              </div>
            </>
          )}
          
          {currentUser.role === 'participant' && bingoCard && (
            <>
              <BingoCard
                numbers={bingoCard.numbers}
                onCellClick={handleCellClick}
                markedCells={markedCells}
                isParticipant={true}
              />
              <DrawnNumbers 
                drawnNumbers={currentGame.drawn_numbers || []} 
                playerNumbers={bingoCard.numbers}
              />
              {bingoCard.has_bingo && (
                <div className="lg:col-span-2 mt-6 p-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl text-center animate-bounce card-shadow-lg">
                  <span className="text-3xl font-bold text-white animate-sparkle">🎉 ビンゴ！🎉</span>
                </div>
              )}
            </>
          )}
        </div>

        <DrawAnimation
          isVisible={showAnimation}
          drawnNumber={currentUser.role === 'host' ? hostDisplayNumber : lastDrawnNumber}
          hasNumberOnCard={hasNumberOnCard}
          isParticipant={currentUser.role === 'participant'}
        />

        <ReachAnimation
          isVisible={showReachAnimation}
          onComplete={handleReachAnimationComplete}
          missingNumbers={reachMissingNumbers}
        />

        <BingoAnimation
          isVisible={showBingoAnimation}
          onComplete={handleBingoAnimationComplete}
        />
      </div>
    </div>
  );
}