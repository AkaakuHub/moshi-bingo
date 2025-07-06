'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getOrCreateSessionId } from '@/utils/sessionUtils';

export interface Game {
  id: string;
  name: string;
  status: 'waiting' | 'playing' | 'finished';
  current_number: number | null;
  drawn_numbers: number[];
  host_id: string | null;
}

export interface User {
  id: string;
  name: string;
  role: 'host' | 'participant';
  game_id: string | null;
}

export interface BingoCard {
  id: string;
  numbers: number[][];
  marked_cells: boolean[][];
  has_bingo: boolean;
  user_id: string;
  game_id: string;
  session_id?: string; // オプショナルに変更
}

export function useSupabase() {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bingoCard, setBingoCard] = useState<BingoCard | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [cardCreated, setCardCreated] = useState(false);
  const [participants, setParticipants] = useState<User[]>([]);

  const fetchParticipants = useCallback(async () => {
    if (!currentGame) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('game_id', currentGame.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  }, [currentGame]);

  useEffect(() => {
    if (!currentGame) return;

    console.log('Setting up realtime for game:', currentGame.id);
    
    const gameChannel = supabase
      .channel('game-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${currentGame.id}`,
        },
        (payload) => {
          console.log('Game updated via realtime:', payload);
          const newGame = payload.new as Game;
          console.log('Setting new game data:', {
            id: newGame.id,
            current_number: newGame.current_number,
            drawn_numbers: newGame.drawn_numbers
          });
          setCurrentGame(newGame);
        }
      )
      .subscribe((status) => {
        console.log('Game channel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Game channel successfully subscribed');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Game channel error - falling back to polling');
          // エラーの場合はポーリングにフォールバック
          const pollInterval = setInterval(async () => {
            try {
              const { data } = await supabase
                .from('games')
                .select('*')
                .eq('id', currentGame.id)
                .single();
              if (data) {
                setCurrentGame(data);
              }
            } catch (error) {
              console.error('Polling error:', error);
            }
          }, 2000);
          
          // 10秒後にポーリング停止
          setTimeout(() => {
            clearInterval(pollInterval);
          }, 10000);
        }
      });

    const cardChannel = supabase
      .channel('card-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bingo_cards',
        },
        (payload) => {
          console.log('Card updated:', payload);
          if (payload.eventType === 'UPDATE' && bingoCard?.id === payload.new.id) {
            setBingoCard(payload.new as BingoCard);
          }
        }
      )
      .subscribe();

    const usersChannel = supabase
      .channel('users-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `game_id=eq.${currentGame.id}`,
        },
        (payload) => {
          console.log('Users updated:', payload);
          fetchParticipants();
        }
      )
      .subscribe();

    setIsConnected(true);

    return () => {
      console.log('Cleaning up channels');
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(cardChannel);
      supabase.removeChannel(usersChannel);
    };
  }, [currentGame, bingoCard?.id, fetchParticipants]);

  const createGame = async (gameName: string, hostName: string) => {
    try {
      console.log('Step 1: Creating game first...');
      
      // 最初にゲームを作成
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert([
          {
            name: gameName,
            status: 'waiting' as const,
            drawn_numbers: [],
          },
        ])
        .select()
        .single();

      if (gameError) throw gameError;
      console.log('Step 2: Game created:', gameData);

      // 次にホストユーザーを作成
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            name: hostName,
            role: 'host' as const,
            game_id: gameData.id,
          },
        ])
        .select()
        .single();

      if (userError) throw userError;
      console.log('Step 3: Host user created:', userData);

      // ゲームにhost_idを設定
      const { data: updatedGameData, error: updateError } = await supabase
        .from('games')
        .update({ host_id: userData.id })
        .eq('id', gameData.id)
        .select()
        .single();

      if (updateError) throw updateError;
      console.log('Step 4: Game updated with host_id:', updatedGameData);

      setCurrentGame(updatedGameData);
      setCurrentUser(userData);
      
      return updatedGameData;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  };

  const joinGame = async (gameId: string, playerName: string) => {
    try {
      // まずゲームが存在するかチェック
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId.trim())
        .single();

      if (gameError) {
        throw new Error('ゲームが見つかりません。ゲームIDを確認してください。');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            name: playerName.trim(),
            role: 'participant' as const,
            game_id: gameId.trim(),
          },
        ])
        .select()
        .single();

      if (userError) throw userError;

      setCurrentGame(gameData);
      setCurrentUser(userData);
      return { game: gameData, user: userData };
    } catch (error) {
      console.error('Error joining game:', error);
      throw error;
    }
  };

  const createBingoCard = useCallback(async (numbers: number[][]) => {
    const sessionId = getOrCreateSessionId();
    console.log('createBingoCard called:', {
      hasCurrentUser: !!currentUser,
      hasCurrentGame: !!currentGame,
      hasBingoCard: !!bingoCard,
      cardCreated,
      sessionId
    });

    if (!currentUser || !currentGame || bingoCard || cardCreated) {
      console.log('createBingoCard aborted - conditions not met');
      return null;
    }

    setCardCreated(true);
    try {
      const cardData = {
        user_id: currentUser.id,
        game_id: currentGame.id,
        session_id: sessionId,
        numbers,
        marked_cells: Array(5).fill(null).map(() => Array(5).fill(false)),
        has_bingo: false,
      };

      const { data, error } = await supabase
        .from('bingo_cards')
        .insert([cardData])
        .select()
        .single();

      if (error) throw error;

      console.log('New bingo card created:', data);
      setBingoCard(data);
      return data;
    } catch (error) {
      console.error('Error creating bingo card:', error);
      setCardCreated(false);
      throw error;
    }
  }, [currentUser, currentGame, bingoCard, cardCreated]);

  const updateBingoCard = async (markedCells: boolean[][], hasBingo: boolean) => {
    if (!bingoCard) return;

    try {
      const { data, error } = await supabase
        .from('bingo_cards')
        .update({
          marked_cells: markedCells,
          has_bingo: hasBingo,
        })
        .eq('id', bingoCard.id)
        .select()
        .single();

      if (error) throw error;

      setBingoCard(data);
    } catch (error) {
      console.error('Error updating bingo card:', error);
      throw error;
    }
  };

  const drawNumber = async (number: number) => {
    if (!currentGame || !currentUser || currentUser.role !== 'host') return;

    try {
      const newDrawnNumbers = [...currentGame.drawn_numbers, number];
      
      console.log('Drawing number:', number, 'for game:', currentGame.id);
      
      const { data, error } = await supabase
        .from('games')
        .update({
          current_number: number,
          drawn_numbers: newDrawnNumbers,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentGame.id)
        .select()
        .single();

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      console.log('Database updated successfully:', data);
      setCurrentGame(data);
    } catch (error) {
      console.error('Error drawing number:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (currentGame) {
      fetchParticipants();
    }
  }, [currentGame, fetchParticipants]);

  const loadGameWithUser = async (gameId: string, userId?: string) => {
    try {
      console.log('Loading game with user:', gameId, userId);
      
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError) {
        console.error('Game not found:', gameError);
        return null;
      }

      console.log('Game loaded:', gameData);
      setCurrentGame(gameData);

      // ユーザーIDが提供されている場合、そのユーザー情報も取得
      if (userId) {
        console.log('Loading user:', userId);
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('User not found:', userError);
        } else if (userData) {
          console.log('User loaded:', userData);
          // ゲームIDが一致するかチェック
          if (userData.game_id === gameId) {
            setCurrentUser(userData);
            
            // 参加者の場合、既存のビンゴカードを取得（セッションIDベースのみ）
            if (userData.role === 'participant') {
              const sessionId = getOrCreateSessionId();
              console.log('Loading existing bingo card for session:', sessionId);
              
              const { data: cardData, error: cardError } = await supabase
                .from('bingo_cards')
                .select('*')
                .eq('session_id', sessionId)
                .eq('game_id', gameId)
                .single();

              if (cardError) {
                console.log('No existing bingo card found for session:', sessionId, cardError);
                // カードが見つからない = 新規作成が必要
                setCardCreated(false);
              } else if (cardData) {
                console.log('Existing bingo card loaded for session:', sessionId, cardData);
                setBingoCard(cardData);
                setCardCreated(true); // 既存カードがある場合はフラグを設定
              }
            }
          } else {
            console.error('User does not belong to this game');
          }
        }
      }

      return gameData;
    } catch (error) {
      console.error('Error loading game:', error);
      return null;
    }
  };

  const loadGame = async (gameId: string) => {
    return loadGameWithUser(gameId);
  };

  return {
    currentGame,
    currentUser,
    bingoCard,
    isConnected,
    participants,
    createGame,
    joinGame,
    createBingoCard,
    updateBingoCard,
    drawNumber,
    fetchParticipants,
    loadGame,
    loadGameWithUser,
  };
}