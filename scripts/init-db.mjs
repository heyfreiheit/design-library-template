import pg from 'pg';
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try{await client.query(`CREATE TABLE IF NOT EXISTS vault_preferences (id text PRIMARY KEY,data text NOT NULL);
CREATE TABLE IF NOT EXISTS vault_references (id text PRIMARY KEY,data text NOT NULL,created_at text NOT NULL);
CREATE TABLE IF NOT EXISTS vault_collections (id text PRIMARY KEY,data text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS vault_users (
 id uuid PRIMARY KEY,username text UNIQUE NOT NULL,name text NOT NULL,
 password_hash text NOT NULL,role text NOT NULL CHECK(role IN ('admin','member')),
 active boolean NOT NULL DEFAULT true,must_change_password boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),last_login_at timestamptz);
CREATE TABLE IF NOT EXISTS vault_sessions (
 token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES vault_users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS vault_sessions_user ON vault_sessions(user_id);
CREATE TABLE IF NOT EXISTS vault_settings (id text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS vault_rate_limits (key text PRIMARY KEY,hits integer NOT NULL,reset_at timestamptz NOT NULL);
`);console.log('Taste Vault database ready');}finally{await client.end();}
