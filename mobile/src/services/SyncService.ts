import axios from 'axios';
import { openDatabase } from '../store/db';
import { Platform } from 'react-native';

// For Android Emulator, localhost is 10.0.2.2. For iOS it's localhost.
// Replace with your LAN IP if testing on physical device.
const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export async function syncData() {
    console.log('[Sync] Starting Sync...');
    try {
        const db = await openDatabase();

        // 1. Fetch Bundle
        const response = await axios.get(`${API_URL}/api/sync/bundle`);
        const bundle = response.data;

        // 2. Process Priority 1 (Blueprints)
        console.log(`[Sync] Processing ${bundle.priority_1.blueprints.length} blueprints`);
        for (const bp of bundle.priority_1.blueprints) {
            await db.runAsync(
                `INSERT OR REPLACE INTO blueprints (id, module_name, version, data) VALUES (?, ?, ?, ?)`,
                [bp.name, bp.name, 1, JSON.stringify(bp)] // Mock version 1 for now if missing
            );
        }

        // 3. Process Priority 2 (Foundation Data)
        const sites = bundle.priority_2.sites;
        const assets = bundle.priority_2.assets;
        console.log(`[Sync] Processing ${sites.length} sites and ${assets.length} assets`);

        // Sites
        for (const site of sites) {
            await db.runAsync(
                `INSERT OR REPLACE INTO foundation_data (id, type, data, search_vector) VALUES (?, ?, ?, ?)`,
                [site.id, 'site', JSON.stringify(site), site.name]
            );
        }

        // Assets
        for (const asset of assets) {
            await db.runAsync(
                `INSERT OR REPLACE INTO foundation_data (id, type, data, search_vector) VALUES (?, ?, ?, ?)`,
                [asset.id, 'asset', JSON.stringify(asset), asset.name]
            );
        }

        console.log('[Sync] Complete!');
        return true;
    } catch (e) {
        console.error('[Sync] Error:', e);
        return false;
    }
}
