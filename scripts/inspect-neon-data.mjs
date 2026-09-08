import { readFileSync } from 'node:fs'
import pg from 'pg'

const root = new URL('..', import.meta.url)

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

const env = readEnv(new URL('.env.local', root))
const client = new pg.Client({ connectionString: env.DATABASE_URL_UNPOOLED || env.DATABASE_URL })

await client.connect()

try {
  const counts = await client.query(`
    select 'admin_audit_log' as table_name, count(*)::int from public.admin_audit_log
    union all select 'interpretacoes', count(*)::int from public.interpretacoes
    union all select 'global_templates', count(*)::int from public.global_templates
    union all select 'global_settings', count(*)::int from public.global_settings
    union all select 'billing_plans', count(*)::int from public.billing_plans
    union all select 'sample_client', count(*)::int from public.sample_client
    union all select 'user_profiles', count(*)::int from public.user_profiles
    union all select 'user_interpretations', count(*)::int from public.user_interpretations
    union all select 'analyses', count(*)::int from public.analyses
    order by table_name
  `)

  const publicTables = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
    order by table_name
  `)

  const migrations = await client.query(`
    select name, applied_at
    from vibraweb_meta.neon_migrations
    order by name
  `).catch(() => ({ rows: [] }))

  const users = await client.query(`
    select
      u.id,
      u.email,
      u.name,
      p.plan,
      p.role,
      p.consultant_name,
      p.updated_at
    from neon_auth."user" u
    left join public.user_profiles p on p.id = u.id
    order by u."createdAt"
  `)

  const templates = await client.query(`
    select slug, name, is_active, is_system, sort_order
    from public.global_templates
    order by sort_order, name
  `)

  console.log(JSON.stringify({
    publicTables: publicTables.rows,
    counts: counts.rows,
    users: users.rows,
    templates: templates.rows,
    migrations: migrations.rows,
  }, null, 2))
} finally {
  await client.end()
}
