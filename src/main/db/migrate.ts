import type Database from 'better-sqlite3'
import m001 from './migrations/001_initial.sql?raw'

// Add a new numbered .sql file + one line here for every future schema change.
// Never edit an old migration: installed copies have already run it.
const MIGRATIONS: { version: number; sql: string }[] = [{ version: 1, sql: m001 }]
export const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version

export function migrate(db: Database.Database): void {
  const current = db.pragma('user_version', { simple: true }) as number
  if (current > LATEST_VERSION) throw new Error('NEWER_DATA')
  for (const m of MIGRATIONS) {
    if (m.version <= current) continue
    db.transaction(() => {
      db.exec(m.sql)
      db.pragma(`user_version = ${m.version}`)
    })()
  }
}
