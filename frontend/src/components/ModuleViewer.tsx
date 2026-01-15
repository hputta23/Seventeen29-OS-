import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as ReactWindow from 'react-window';
const { FixedSizeList } = ReactWindow;
import { FieldRegistry, type FieldDef } from './FieldRegistry';

export default function ModuleViewer() {
    const { moduleName } = useParams();
    const [fields, setFields] = useState<FieldDef[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!moduleName) return;
        setLoading(true);
        Promise.all([
            fetch(`http://localhost:3000/api/modules/${moduleName}`).then(r => r.json()),
            fetch(`http://localhost:3000/api/records/${moduleName}`).then(r => r.json())
        ]).then(([meta, data]) => {
            setFields(meta.fields);
            setRecords(Array.isArray(data) ? data : []); // Handle null/error
            setLoading(false);
        }).catch(e => {
            console.error(e);
            setLoading(false);
        });
    }, [moduleName]);

    if (loading) return (
        <div className="glass-panel flex items-center justify-center h-[500px]">
            Loading Kernel Module: {moduleName}...
        </div>
    );

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold capitalize">{moduleName}</h2>
                    <p className="text-slate-400">Registry Browser</p>
                </div>
                <button className="glass-button bg-blue-500/20 border-blue-500/30 text-blue-200">
                    + New Entry
                </button>
            </header>

            {/* New Entry Form Area (Mockup using FieldRegistry) */}
            <div className="glass-panel p-6 rounded-xl space-y-4">
                <h3 className="text-lg font-semibold border-b border-white/10 pb-2">New Record Prototype</h3>
                <div className="grid grid-cols-2 gap-4">
                    {fields.map(f => (
                        <FieldRegistry key={f.name} field={f} value={null} onChange={() => { }} />
                    ))}
                </div>
            </div>

            <div className="glass-panel rounded-xl overflow-hidden min-h-[400px]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 uppercase text-xs font-semibold text-slate-400">
                        <tr>
                            {fields.map(f => <th key={f.name} className="px-6 py-4">{f.name}</th>)}
                            <th className="px-6 py-4">ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {records.map((r, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                {fields.map(f => (
                                    <td key={f.name} className="px-6 py-4">
                                        {typeof r[f.name] === 'object' ? JSON.stringify(r[f.name]) : r[f.name]}
                                    </td>
                                ))}
                                <td className="px-6 py-4 font-mono text-xs text-slate-500 truncate max-w-[100px]">{r.id}</td>
                            </tr>
                        ))}
                        {records.length === 0 && (
                            <tr>
                                <td colSpan={fields.length + 1} className="px-6 py-12 text-center text-slate-500">
                                    No records found in Kernel.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
