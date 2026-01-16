import { useState, useEffect } from 'react';

// Mock API for modules (since we haven't implemented GET /api/modules/list yet)
const AVAILABLE_MODULES = ['incidents', 'risks', 'sites', 'people'];

// Mock Field Schema for Feeder Mapping
const MOCK_SCHEMAS: Record<string, any[]> = {
    sites: [
        { name: 'id', type: 'uuid' },
        { name: 'name', type: 'text' },
        { name: 'location', type: 'text' },
        { name: 'coordinates', type: 'json' },
    ],
    people: [
        { name: 'id', type: 'uuid' },
        { name: 'full_name', type: 'text' },
        { name: 'clearance_level', type: 'number' },
    ]
};

export function Inspector({ selectedField, workflowStages = [], onUpdate }: { selectedField: any, workflowStages?: any[], onUpdate?: (updates: any) => void }) {
    if (!selectedField) {
        return (
            <aside className="w-80 border-l border-white/10 bg-black/20 backdrop-blur-md flex items-center justify-center p-8 text-center">
                <div className="text-white/30">
                    <p>Select a component on the canvas to configure its properties.</p>
                </div>
            </aside>
        );
    }

    return (
        <aside className="w-80 border-l border-white/10 bg-black/20 backdrop-blur-md flex flex-col">
            <div className="p-4 border-b border-white/10">
                <h2 className="font-semibold text-white/90">Properties</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/50 border border-white/5">
                        {selectedField.type}
                    </span>
                </div>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto">
                {/* Common Properties */}
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-white/40">Field Label</label>
                    <input
                        type="text"
                        className="glass-input w-full"
                        defaultValue={selectedField.label}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-white/40">Field Key</label>
                    <input
                        type="text"
                        className="glass-input w-full font-mono text-sm"
                        defaultValue={selectedField.name}
                        onChange={(e) => onUpdate?.({ name: e.target.value })}
                    />
                </div>


                {/* WORKFLOW CONFIGURATION */}
                {workflowStages.length > 0 && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg space-y-2">
                        <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                            Workflow Stage
                        </h3>
                        <select
                            className="glass-input w-full text-sm"
                            value={selectedField.stage_id || ''}
                            onChange={(e) => onUpdate?.({ stage_id: e.target.value })}
                        >
                            <option value="">(No Stage - Show in all?)</option>
                            {workflowStages.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* NEURAL HANDSHAKE DESIGNER */}
                {selectedField.type === 'relationship' && (
                    <NeuralHandshakeConfig field={selectedField} />
                )}

                {/* Common Toggles */}
                {selectedField.type !== 'relationship' && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="rounded bg-white/10 border-white/20"
                                checked={selectedField.required || false}
                                onChange={(e) => onUpdate?.({ required: e.target.checked })}
                            />
                            <span className="text-sm text-slate-300">Required Field</span>
                        </label>
                    </div>
                )}

                {selectedField.type === 'number' && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <label className="text-xs uppercase font-bold text-white/40">Formula (WASM)</label>
                        <textarea
                            className="glass-input w-full h-24 font-mono text-xs mt-1"
                            placeholder="(severity * frequency) / 100"
                        />
                    </div>
                )}
            </div>
        </aside >
    );
}

function NeuralHandshakeConfig({ field }: { field: any }) {
    const [targetModule, setTargetModule] = useState<string>('');
    const [feederField, setFeederField] = useState<string>('');

    const targetSchema = MOCK_SCHEMAS[targetModule] || [];

    return (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                🕸️ Neural Handshake
            </h3>

            <div className="space-y-2">
                <label className="text-xs text-blue-200/50 block">Target Module</label>
                <select
                    className="glass-input w-full"
                    onChange={e => setTargetModule(e.target.value)}
                    value={targetModule}
                >
                    <option value="">Select Module...</option>
                    {AVAILABLE_MODULES.map(m => (
                        <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                    ))}
                </select>
            </div>

            {targetModule && (
                <div className="space-y-2">
                    <label className="text-xs text-blue-200/50 block">Feeder Field (Source)</label>
                    <div className="space-y-1">
                        {targetSchema.map(f => {
                            // Type Guarding Logic
                            // If our relationship field is effectively a "Link" (usually UUID storage),
                            // we usually want the ID. 
                            // But maybe we want to map a display value?
                            // For a Relationship, strictly speaking we store the Link ID.
                            // But usually we want to Select based on 'name'.
                            const isCompatible = true; // For now.
                            return (
                                <div
                                    key={f.name}
                                    onClick={() => setFeederField(f.name)}
                                    className={`
                                        p-2 rounded text-xs flex justify-between cursor-pointer border
                                        ${feederField === f.name
                                            ? 'bg-blue-500/20 border-blue-400 text-white'
                                            : 'bg-black/20 border-white/5 text-white/60 hover:bg-white/5'}
                                    `}
                                >
                                    <span>{f.name}</span>
                                    <span className="font-mono text-[10px] opacity-50">{f.type}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {targetModule && (
                <div className="text-[10px] text-blue-300/50 pt-2 border-t border-blue-500/20">
                    <p>Status: {feederField ? '✅ Linked' : '⚠️ Pending Handshake'}</p>
                </div>
            )}
        </div>
    )
}
