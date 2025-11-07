-- Discord Election Bot Database Schema

-- Таблица Discord серверов
CREATE TABLE IF NOT EXISTS servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    member_count INTEGER NOT NULL DEFAULT 0,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица администраторов бота на серверах
CREATE TABLE IF NOT EXISTS bot_admins (
    id SERIAL PRIMARY KEY,
    server_id TEXT NOT NULL REFERENCES servers(id),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(server_id, user_id)
);

-- Таблица выборов
CREATE TABLE IF NOT EXISTS elections (
    id TEXT PRIMARY KEY,
    server_id TEXT NOT NULL REFERENCES servers(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'registration', 'voting', 'completed', 'failed')),
    
    assigned_roles TEXT[] NOT NULL,
    candidate_roles TEXT[] NOT NULL DEFAULT '{}',
    voter_roles TEXT[] NOT NULL DEFAULT '{}',
    
    duration INTEGER NOT NULL,
    registration_duration INTEGER NOT NULL,
    term_duration INTEGER NOT NULL,
    days_before_term_end INTEGER NOT NULL DEFAULT 2,
    
    min_votes_threshold_percent INTEGER NOT NULL DEFAULT 20,
    server_member_count INTEGER NOT NULL,
    keep_old_roles BOOLEAN NOT NULL DEFAULT FALSE,
    auto_start BOOLEAN NOT NULL DEFAULT TRUE,
    retry_on_fail BOOLEAN NOT NULL DEFAULT TRUE,
    max_voting_attempts INTEGER NOT NULL DEFAULT 2,
    
    registration_attempts INTEGER NOT NULL DEFAULT 0,
    voting_attempts INTEGER NOT NULL DEFAULT 0,
    total_votes INTEGER NOT NULL DEFAULT 0,
    
    registration_start_date TIMESTAMP,
    registration_end_date TIMESTAMP,
    voting_start_date TIMESTAMP,
    voting_end_date TIMESTAMP,
    term_end_date TIMESTAMP,
    
    current_winner TEXT,
    winner_user_id TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица кандидатов
CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    election_id TEXT NOT NULL REFERENCES elections(id),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '👤',
    speech TEXT NOT NULL,
    votes INTEGER NOT NULL DEFAULT 0,
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица голосов
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    election_id TEXT NOT NULL REFERENCES elections(id),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    candidate_id TEXT NOT NULL REFERENCES candidates(id),
    voted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(election_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_elections_server_id ON elections(server_id);
CREATE INDEX IF NOT EXISTS idx_elections_status ON elections(status);
CREATE INDEX IF NOT EXISTS idx_candidates_election_id ON candidates(election_id);
CREATE INDEX IF NOT EXISTS idx_votes_election_id ON votes(election_id);
CREATE INDEX IF NOT EXISTS idx_bot_admins_server_id ON bot_admins(server_id);
