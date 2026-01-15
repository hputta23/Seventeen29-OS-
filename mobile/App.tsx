import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import { openDatabase } from './src/store/db';
import { syncData } from './src/services/SyncService';
import { searchAssets } from './src/services/NeuralService';
import { logOperation } from './src/services/OpLogService';

export default function App() {
  const [status, setStatus] = useState('Idle');
  const [stats, setStats] = useState({ blueprints: 0, foundation: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [opLogId, setOpLogId] = useState<string | null>(null);

  useEffect(() => {
    refreshStats();
  }, []);

  async function refreshStats() {
    const db = await openDatabase();
    const bpResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM blueprints');
    const fdResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM foundation_data');

    setStats({
      blueprints: bpResult?.count || 0,
      foundation: fdResult?.count || 0
    });
  }

  async function handleSync() {
    setStatus('Syncing...');
    const result = await syncData();
    setStatus(result ? 'Sync Complete ✅' : 'Sync Failed ❌');
    await refreshStats();
  }

  async function handleSearch() {
    if (!searchQuery) return;
    const results = await searchAssets(searchQuery);
    setSearchResults(results);
  }

  async function handleLink(asset: any) {
    const opId = await logOperation('LINK_ENTITY', { target_id: asset.id, target_model: asset.model });
    setOpLogId(opId);
    setStatus(`Linked to ${asset.name} (Op: ${opId.slice(0, 8)}...)`);
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Seventeen29 Mobile</Text>
        <Text style={styles.subtitle}>Offline Neural Shell</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Device Status</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Blueprints:</Text>
          <Text style={styles.value}>{stats.blueprints}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Foundation:</Text>
          <Text style={styles.value}>{stats.foundation}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSync}>
        <Text style={styles.buttonText}>🔄 Synchronize</Text>
      </TouchableOpacity>

      <View style={[styles.card, { marginTop: 24 }]}>
        <Text style={styles.cardTitle}>Neural Handshake (Offline)</Text>
        <TextInput
          style={styles.input}
          placeholder="Search Assets (e.g. Truck)..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSearch}>
          <Text style={styles.secondaryButtonText}>Create Neural Link</Text>
        </TouchableOpacity>

        {searchResults.map((item) => (
          <TouchableOpacity key={item.id} onPress={() => handleLink(item)} style={styles.resultItem}>
            <Text style={styles.resultText}>{item.name}</Text>
            <Text style={styles.resultSubText}>{item.location}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTitle: {
    color: '#60a5fa',
    fontWeight: '600',
    marginBottom: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: '#cbd5e1',
  },
  value: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    marginTop: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  secondaryButtonText: { color: '#94a3b8' },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  resultItem: {
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)'
  },
  resultText: { color: 'white', fontWeight: 'bold' },
  resultSubText: { color: '#94a3b8', fontSize: 12 },
  status: {
    marginTop: 24,
    color: '#94a3b8',
    textAlign: 'center'
  }
});
