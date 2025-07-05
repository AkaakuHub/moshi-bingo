# Supabase データベーススキーマ設計

## テーブル構成

### games テーブル
- id: UUID (Primary Key)
- created_at: timestamp
- updated_at: timestamp
- host_id: UUID (外部キー: users.id)
- name: text (ゲーム名)
- status: text (waiting, playing, finished)
- current_number: integer (現在抽選された番号)
- drawn_numbers: jsonb (抽選済み番号の配列)

### users テーブル
- id: UUID (Primary Key)
- created_at: timestamp
- name: text (ユーザー名)
- role: text (host, participant)
- game_id: UUID (外部キー: games.id)

### bingo_cards テーブル
- id: UUID (Primary Key)
- created_at: timestamp
- user_id: UUID (外部キー: users.id)
- game_id: UUID (外部キー: games.id)
- numbers: jsonb (5x5の番号配列)
- marked_cells: jsonb (マーク済みセルの配列)
- has_bingo: boolean (ビンゴ達成フラグ)

### game_events テーブル
- id: UUID (Primary Key)
- created_at: timestamp
- game_id: UUID (外部キー: games.id)
- event_type: text (number_drawn, bingo_achieved, game_started, game_finished)
- data: jsonb (イベント関連データ)

## Row Level Security (RLS) ポリシー

### games テーブル
- SELECT: 全ユーザーが自分が参加しているゲームを閲覧可能
- INSERT: 認証済みユーザーのみ作成可能
- UPDATE: ゲームの主催者のみ更新可能
- DELETE: ゲームの主催者のみ削除可能

### users テーブル
- SELECT: 全ユーザーが同じゲームの参加者を閲覧可能
- INSERT: 認証済みユーザーのみ作成可能
- UPDATE: 自分の情報のみ更新可能
- DELETE: 自分の情報のみ削除可能

### bingo_cards テーブル
- SELECT: カードの所有者のみ閲覧可能
- INSERT: カードの所有者のみ作成可能
- UPDATE: カードの所有者のみ更新可能
- DELETE: カードの所有者のみ削除可能

## リアルタイム機能

### Supabase Realtime サブスクリプション
- games テーブルの変更を監視（抽選番号の更新）
- game_events テーブルの変更を監視（ゲームイベント）
- bingo_cards テーブルの変更を監視（ビンゴ達成）

## SQL作成スクリプト

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    host_id UUID,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
    current_number INTEGER,
    drawn_numbers JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT NOW(),
    name TEXT NOT NULL,
    role TEXT DEFAULT 'participant' CHECK (role IN ('host', 'participant')),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE bingo_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    numbers JSONB NOT NULL,
    marked_cells JSONB DEFAULT '[]'::jsonb,
    has_bingo BOOLEAN DEFAULT FALSE
);

CREATE TABLE game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP DEFAULT NOW(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb
);

-- Add foreign key for games.host_id
ALTER TABLE games ADD CONSTRAINT fk_games_host_id 
    FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- Create policies (simplified for anonymous access)
CREATE POLICY "Allow all access to games" ON games FOR ALL USING (true);
CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all access to bingo_cards" ON bingo_cards FOR ALL USING (true);
CREATE POLICY "Allow all access to game_events" ON game_events FOR ALL USING (true);
```