import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FieldRegistry, type FieldDef } from './FieldRegistry';
import StageForm from './StageForm';

interface WorkflowStage {
    id: string;
    name: string;
    order: number;
    required_fields: string[];
}

interface WorkflowConfig {
    stages: WorkflowStage[];
}

interface ModuleMetadata {
    name: string;
    fields: FieldDef[];
    enabled_features?: string[];
    workflow?: WorkflowConfig;
}

export default function ModuleViewer() {
    const { moduleName } = useParams();
    const [metadata, setMetadata] = useState<ModuleMetadata | null>(null);
    const [fields, setFields] = useState<FieldDef[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const loadData = () => {
        if (!moduleName) return;
        setLoading(true);
        Promise.all([
            fetch(`http://localhost:3000/api/meta/${moduleName}`).then(r => r.json()),
            fetch(`http://localhost:3000/api/records/${moduleName}`).then(r => r.json())
        ]).then(([meta, data]) => {
            setMetadata(meta);
            setFields(meta.fields || []);
            setRecords(Array.isArray(data) ? data : []);
            setLoading(false);

            // Initialize form data with empty values
            const initialData: Record<string, any> = {};
            (meta.fields || []).forEach((f: FieldDef) => {
                initialData[f.name] = f.field_type === 'boolean' ? false : '';
            });
            setFormData(initialData);
        }).catch(e => {
            console.error(e);
            setLoading(false);
        });
    };

    useEffect(() => {
        loadData();
    }, [moduleName]);

    const handleFieldChange = (fieldName: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
    };

    const handleSubmit = async () => {
        if (!moduleName) return;

        setSubmitting(true);
        try {
            const response = await fetch(`http://localhost:3000/api/records/${moduleName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Reset form and reload data
                const initialData: Record<string, any> = {};
                fields.forEach(f => {
                    initialData[f.name] = f.field_type === 'boolean' ? false : '';
                });
                setFormData(initialData);
                setShowForm(false);
                loadData();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Failed to create record'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to create record');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="glass-panel flex items-center justify-center h-[500px]">
            Loading Kernel Module: {moduleName}...
        </div>
    );

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold capitalize">{moduleName?.replace(/_/g, ' ')}</h2>
                    <p className="text-slate-400">Registry Browser</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="glass-button bg-blue-500/20 border-blue-500/30 text-blue-200"
                >
                    {showForm ? '✕ Cancel' : '+ New Entry'}
                </button>
            </header>

            {/* New Entry Form - Conditional Rendering */}
            {showForm && metadata && (
                metadata.enabled_features?.includes('workflow_stages') && metadata.workflow ? (
                    <StageForm
                        fields={fields}
                        workflow={metadata.workflow}
                        formData={formData}
                        onFieldChange={handleFieldChange}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                    />
                ) : (
                    <div className="glass-panel p-6 rounded-xl space-y-4 border-2 border-blue-500/30">
                        <h3 className="text-lg font-semibold border-b border-white/10 pb-2">New Record ({fields.length} fields)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[200px]">
                            {fields.map(f => (
                                <FieldRegistry
                                    key={f.name}
                                    field={f}
                                    value={formData[f.name]}
                                    onChange={(val) => handleFieldChange(f.name, val)}
                                />
                            ))}
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-white/10">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="glass-button bg-emerald-500/20 border-emerald-500/30 text-emerald-200 px-6 py-2 disabled:opacity-50"
                            >
                                {submitting ? 'Creating...' : '✓ Create Record'}
                            </button>
                            <button
                                onClick={() => setShowForm(false)}
                                className="glass-button px-6 py-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )
            )}

            <div className="glass-panel rounded-xl overflow-hidden min-h-[400px]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 uppercase text-xs font-semibold text-slate-400">
                        <tr>
                            {fields.map(f => <th key={f.name} className="px-6 py-4">{f.label || f.name}</th>)}
                            <th className="px-6 py-4">ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {records.map((r, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                {fields.map(f => (
                                    <td key={f.name} className="px-6 py-4">
                                        {typeof r[f.name] === 'object' ? JSON.stringify(r[f.name]) : String(r[f.name] ?? '')}
                                    </td>
                                ))}
                                <td className="px-6 py-4 font-mono text-xs text-slate-500 truncate max-w-[100px]">{r.id}</td>
                            </tr>
                        ))}
                        {records.length === 0 && (
                            <tr>
                                <td colSpan={fields.length + 1} className="px-6 py-12 text-center text-slate-500">
                                    No records found in Kernel. Click "+ New Entry" to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
