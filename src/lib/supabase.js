import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const hasSupabase = Boolean(url && key)
export const supabase = hasSupabase ? createClient(url, key) : null

// Result: { ok: true, row: { nickname, save, updated_at } | null } on a
// successful query (row null = no cloud save yet), { ok: false, row: null }
// when Supabase is unconfigured or the query failed.
export async function fetchSave(nicknameKey) {
  if (!hasSupabase || !nicknameKey) return { ok: false, row: null }
  const { data, error } = await supabase
    .from('saves')
    .select('nickname, save, updated_at')
    .eq('nickname_key', nicknameKey)
    .maybeSingle()
  return error ? { ok: false, row: null } : { ok: true, row: data }
}

export async function upsertSave(nicknameKey, nickname, save) {
  if (!hasSupabase || !nicknameKey) return false
  const { error } = await supabase.from('saves').upsert({
    nickname_key: nicknameKey,
    nickname,
    save,
    updated_at: new Date().toISOString(),
  })
  return !error
}
