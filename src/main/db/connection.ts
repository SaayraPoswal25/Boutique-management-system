import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import { dbPath } from '../paths'
import { migrate } from './migrate'

let db: Database.Database | null = null

/** Opens (and if needed creates / upgrades) the database. WAL + foreign keys are what make
 *  power cuts safe (BK-5) and cascading deletes work. */
export function openDb(): Database.Database {
  mkdirSync(dirname(dbPath()), { recursive: true })
  const d = new Database(dbPath())
  try {
    d.pragma('journal_mode = WAL')
    d.pragma('foreign_keys = ON')
    migrate(d)
  } catch (e) {
    d.close()
    throw e
  }
  db = d
  return d
}
export function getDb(): Database.Database {
  if (!db) throw new Error('Database is not open')
  return db
}
export function closeDb(): void {
  db?.close()
  db = null
}
