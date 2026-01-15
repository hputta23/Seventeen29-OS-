import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// --- MOCK DB FOR WEB VERIFICATION ---
class MockWebDB {
    store: Record<string, any[]> = { blueprints: [], foundation_data: [] };

    async execAsync(sql: string) { console.log('[WebDB] exec', sql); }

    async runAsync(sql: string, params: any[]) {
        console.log('[WebDB] run', sql, params);
        // Simple mock logic for sync verification
        if (sql.includes('INSERT INTO blueprints')) {
            const data = JSON.parse(params[3]);
            this.store.blueprints.push(data);
        } else if (sql.includes('INSERT INTO foundation_data')) {
            const data = JSON.parse(params[2]);
            this.store.foundation_data.push(data);
        }
        return { changes: 1, lastInsertRowId: 1 };
    }

    async getFirstAsync<T>(sql: string) {
        if (sql.includes('COUNT(*)')) {
            const table = sql.includes('blueprints') ? 'blueprints' : 'foundation_data';
            return { count: this.store[table].length } as T;
        }
        return null; // Mock return
    }

    async getAllAsync(sql: string, params: any[]) {
        console.log('[WebDB] getAll', sql, params);
        if (sql.includes('foundation_data')) {
            // Return mock search results
            return this.store.foundation_data.slice(0, 5).map(d => ({
                data: JSON.stringify(d)
            }));
        }
        return [];
    }
}

let db: any = null;

export async function openDatabase() {
    if (db) return db;

    if (Platform.OS === 'web') {
        db = new MockWebDB();
        return db;
    }

    db = await SQLite.openDatabaseAsync('seventeen29.db');
    await initTables(db);
    return db;
}

async function initTables(database: SQLite.SQLiteDatabase) {
    try {
        await database.execAsync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS blueprints (
          id TEXT PRIMARY KEY,
          module_name TEXT NOT NULL,
          version INTEGER NOT NULL,
          data TEXT NOT NULL, -- JSON string
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS foundation_data (
          id TEXT PRIMARY KEY, 
          type TEXT NOT NULL, -- 'site', 'asset', 'person'
          data TEXT NOT NULL, -- JSON string
          search_vector TEXT -- For simple search
        );

        CREATE TABLE IF NOT EXISTS op_log (
          id TEXT PRIMARY KEY, -- UUID
          operation TEXT NOT NULL, -- 'CREATE_RECORD', 'UPDATE_FIELD'
          payload TEXT NOT NULL, -- JSON
          status TEXT DEFAULT 'PENDING', -- 'SYNCED', 'FAILED'
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);
        console.log('SQLite Tables Initialized');
    } catch (e) {
        console.warn('SQLite Init Failed (Expected on Web if not shimmed):', e);
    }
}
