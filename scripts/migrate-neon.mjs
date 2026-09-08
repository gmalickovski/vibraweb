import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import pg from 'pg'

const root = fileURLToPath(new URL('..', import.meta.url))

function readEnv(path) {
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .filter(line => line && !line.startsWith('#') && line.includes('='))
      .map(line => {
        const index = line.indexOf('=')
        return [line.slice(0, index), line.slice(index + 1).replace(/^"|"$/g, '')]
      }),
  )
}

function adaptSupabaseSql(sql) {
  return sql
    .replaceAll('REFERENCES auth.users(id)', 'REFERENCES neon_auth."user"(id)')
    .replaceAll('REFERENCES auth.users (id)', 'REFERENCES neon_auth."user"(id)')
    .replaceAll('auth.uid()', 'public.current_user_id()')
    .replaceAll('DROP CONSTRAINT interpretacoes_numero_check', 'DROP CONSTRAINT IF EXISTS interpretacoes_numero_check')
    .replaceAll(' TO anon, authenticated', ' TO anonymous, authenticated')
    .replaceAll(' FROM anon, authenticated', ' FROM anonymous, authenticated')
    .replaceAll(', anon, authenticated', ', anonymous, authenticated')
    .replaceAll(' TO anon', ' TO anonymous')
    .replaceAll(' FROM anon', ' FROM anonymous')
    .replaceAll('anonymousymous', 'anonymous')
    .replaceAll('supabase_auth_admin', 'neondb_owner')
}

const env = readEnv(join(root, '.env.local'))
const connectionString = env.DATABASE_URL_UNPOOLED

if (!connectionString) {
  throw new Error('DATABASE_URL_UNPOOLED is missing from .env.local')
}

const migrations = [
  join(root, 'backend/neon/migrations/001_vibraweb_neon_baseline.sql'),
  ...readdirSync(join(root, 'backend/supabase/migrations'))
    .filter(name => name.endsWith('.sql') && name !== '005_brand_assets_bucket.sql')
    .sort()
    .map(name => join(root, 'backend/supabase/migrations', name)),
]

const client = new pg.Client({ connectionString })
await client.connect()

try {
  await client.query(`
    create schema if not exists vibraweb_meta;
    create table if not exists vibraweb_meta.neon_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `)

  for (const file of migrations) {
    const normalizedFile = file.replaceAll('\\', '/')
    const name = normalizedFile.split('/').slice(-3).join('/')
    const seen = await client.query(
      'select 1 from vibraweb_meta.neon_migrations where name = $1',
      [name],
    )
    if (seen.rowCount) {
      console.log(`skip ${name}`)
      continue
    }

    const raw = readFileSync(file, 'utf8')
    const sql = normalizedFile.includes('/backend/supabase/migrations/')
      ? adaptSupabaseSql(raw)
      : raw

    console.log(`apply ${name}`)
    await client.query('begin')
    try {
      await client.query(sql)
      await client.query(
        'insert into vibraweb_meta.neon_migrations (name) values ($1)',
        [name],
      )
      await client.query('commit')
    } catch (error) {
      await client.query('rollback')
      throw error
    }
  }
} finally {
  await client.end()
}
