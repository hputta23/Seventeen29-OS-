import { openDatabase } from '../store/db';

export async function searchAssets(query: string) {
    const db = await openDatabase();
    // Using LIKE for simple search vector matching
    const results = await db.getAllAsync(
        `SELECT data FROM foundation_data WHERE type = ? AND search_vector LIKE ? LIMIT 10`,
        ['asset', `%${query}%`]
    );

    return results.map((r: any) => JSON.parse(r.data));
}

export async function searchSites(query: string) {
    const db = await openDatabase();
    const results = await db.getAllAsync(
        `SELECT data FROM foundation_data WHERE type = ? AND search_vector LIKE ? LIMIT 10`,
        ['site', `%${query}%`]
    );
    return results.map((r: any) => JSON.parse(r.data));
}

export async function validateOfflineHandshake(sourceId: string, targetId: string) {
    // Logic to check if a link is valid based on local constraints
    // For now, simpler existence check
    const db = await openDatabase();
    const target = await db.getFirstAsync(
        `SELECT id FROM foundation_data WHERE id = ?`,
        [targetId]
    );
    return !!target;
}
