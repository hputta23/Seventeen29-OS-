import { openDatabase } from '../store/db';
import * as Crypto from 'expo-crypto';

export type OperationType = 'CREATE_RECORD' | 'UPDATE_FIELD' | 'LINK_ENTITY';

export async function logOperation(op: OperationType, payload: any) {
    const db = await openDatabase();
    const id = Crypto.randomUUID();

    await db.runAsync(
        `INSERT INTO op_log (id, operation, payload, status) VALUES (?, ?, ?, 'PENDING')`,
        [id, op, JSON.stringify(payload)]
    );

    console.log(`[OpLog] Logged ${op} - ${id}`);
    return id;
}

export async function getPendingOperations() {
    const db = await openDatabase();
    const results = await db.getAllAsync(
        `SELECT * FROM op_log WHERE status = 'PENDING' ORDER BY created_at ASC`
    );
    return results.map((r: any) => ({
        ...r,
        payload: JSON.parse(r.payload)
    }));
}

export async function markOperationSynced(id: string) {
    const db = await openDatabase();
    await db.runAsync(
        `UPDATE op_log SET status = 'SYNCED' WHERE id = ?`,
        [id]
    );
}
