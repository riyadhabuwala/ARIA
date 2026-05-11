-- Create chat_conversations table for Career Coach history persistence
CREATE TABLE IF NOT EXISTS chat_conversations (
    id          TEXT PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL DEFAULT 'New Chat',
    messages_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast user-level lookups sorted by recency
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_updated
    ON chat_conversations(user_id, updated_at DESC);

-- Enable Row Level Security
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: users can only access their own conversations
CREATE POLICY "Users manage own conversations"
    ON chat_conversations
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow service role full access (used by backend)
CREATE POLICY "Service role full access"
    ON chat_conversations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
