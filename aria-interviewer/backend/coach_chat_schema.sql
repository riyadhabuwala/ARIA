CREATE TABLE IF NOT EXISTS coach_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  last_message_preview TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own coach conversations"
  ON coach_conversations FOR ALL
  USING (auth.uid()::text = user_id);

CREATE INDEX IF NOT EXISTS idx_coach_conversations_user
  ON coach_conversations(user_id);

CREATE TABLE IF NOT EXISTS coach_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES coach_conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own coach messages"
  ON coach_messages FOR ALL
  USING (auth.uid()::text = user_id);

CREATE INDEX IF NOT EXISTS idx_coach_messages_user
  ON coach_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_coach_messages_conversation
  ON coach_messages(conversation_id);
