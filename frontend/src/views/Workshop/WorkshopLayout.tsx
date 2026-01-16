import { useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { Palette } from './Palette';
import { Canvas } from './Canvas';
import { Inspector } from './Inspector';
import WorkflowEditor, { type WorkflowStage } from './WorkflowEditor';
import { Network } from 'lucide-react';

export default function WorkshopLayout() {
    // Draft State
    const [canvasItems, setCanvasItems] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'edit' | 'workflow' | 'preview'>('edit');
    const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);

    // Metadata State
    const [blueprintName, setBlueprintName] = useState('Untitled Blueprint');
    const [isEditingName, setIsEditingName] = useState(false);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && over.id === 'canvas-droppable') {
            // Check if it's a new item from palette
            if (active.data.current?.type === 'field-source') {
                const fieldType = active.data.current.fieldType;
                const newItem = {
                    id: crypto.randomUUID(),
                    type: fieldType,
                    label: `New ${fieldType} Field`,
                    name: `field_${Date.now()}`, // Temporary internal name
                };
                setCanvasItems([...canvasItems, newItem]);
                setSelectedId(newItem.id);
            }
        }
    };

    const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const template = e.target.value;
        if (template === 'clean') {
            setCanvasItems([]);
            setBlueprintName('New Module');
        } else if (template === 'incident') {
            setBlueprintName('Incident Report');
            // Mock Template Data
            setCanvasItems([
                { id: '1', type: 'text', label: 'Title', name: 'title' },
                { id: '2', type: 'textarea', label: 'Description', name: 'description' },
                { id: '3', type: 'select', label: 'Severity', name: 'severity' },
            ]);
        } else if (template === 'risk') {
            setBlueprintName('Risk Assessment');
            // Mock Template Data
            setCanvasItems([
                { id: '1', type: 'text', label: 'Hazard', name: 'hazard' },
                { id: '2', type: 'number', label: 'Risk Score', name: 'risk_score' },
            ]);
        }
    };

    const handleRemoveItem = (id: string) => {
        setCanvasItems(items => items.filter(item => item.id !== id));
        if (selectedId === id) {
            setSelectedId(null);
        }
    };

    const selectedItem = canvasItems.find(i => i.id === selectedId);

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-200">
                {/* Header Toolbar */}
                <div className="absolute top-0 left-64 right-0 h-16 border-b border-white/10 bg-slate-900/50 backdrop-blur z-10 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        {isEditingName ? (
                            <input
                                autoFocus
                                value={blueprintName}
                                onChange={(e) => setBlueprintName(e.target.value)}
                                onBlur={() => setIsEditingName(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                                className="bg-white/5 border border-blue-500/50 rounded px-2 py-1 text-lg font-bold text-white focus:outline-none min-w-[200px]"
                            />
                        ) : (
                            <h1
                                onClick={() => setIsEditingName(true)}
                                className="font-bold text-lg hover:text-blue-400 cursor-pointer border border-transparent hover:border-white/5 rounded px-2 py-1 transition-colors flex items-center gap-2"
                                title="Click to rename"
                            >
                                {blueprintName}
                            </h1>
                        )}

                        <div className="h-6 w-px bg-white/10 mx-2"></div>

                        <select
                            onChange={handleTemplateSelect}
                            className="bg-black/20 border border-white/10 rounded-md px-2 py-1 text-xs text-slate-400 focus:outline-none focus:border-blue-500 cursor-pointer hover:bg-white/5"
                        >
                            <option value="">Select Template...</option>
                            <option value="clean">Blank Draft</option>
                            <option value="incident">Template: Incident</option>
                            <option value="risk">Template: Risk</option>
                        </select>

                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 ml-2">DRAFT</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="glass-panel p-1 flex rounded-lg">
                            <button
                                onClick={() => setViewMode('edit')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'edit' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => setViewMode('workflow')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${viewMode === 'workflow' ? 'bg-purple-500/20 text-purple-200 shadow-sm border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                <Network size={12} />
                                Workflow
                            </button>
                            <button
                                onClick={() => setViewMode('preview')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'preview' ? 'bg-indigo-500/50 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                Preview
                            </button>
                        </div>

                        <button
                            className="glass-button bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30"
                            onClick={() => {
                                // Simplified Publish Logic for Prototype
                                const payload = {
                                    name: "new_module_" + Date.now(), // Random name for now
                                    fields: canvasItems.map(item => ({
                                        name: item.name,
                                        label: item.label,
                                        field_type: item.type,
                                        required: item.required || false,
                                        stage_id: item.stage_id || null
                                    })),
                                    enabled_features: workflowStages.length > 0 ? ['workflow_stages'] : [],
                                    workflow: workflowStages.length > 0 ? {
                                        stages: workflowStages.map(s => ({
                                            ...s,
                                            required_fields: canvasItems
                                                .filter(c => c.stage_id === s.id && c.required)
                                                .map(c => c.name)
                                        }))
                                    } : null
                                };

                                console.log("Publishing Payload:", payload);
                                fetch('http://localhost:3000/api/modules', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(payload)
                                }).then(res => res.json()).then(data => {
                                    alert(`Module Published! \nID: ${data.id || 'Success'}`);
                                });
                            }}
                        >
                            Publish to Kernel
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex w-full pt-16">
                    {viewMode === 'workflow' ? (
                        <div className="flex w-full">
                            <div className="w-64 border-r border-white/10 p-4 bg-slate-900/50">
                                <h3 className="font-semibold text-slate-400 mb-4">Tips</h3>
                                <ul className="text-sm text-slate-500 space-y-2 list-disc list-inside">
                                    <li>Define stages in order.</li>
                                    <li>Switch back to "Edit" to assign fields to these stages.</li>
                                    <li>Required fields in a stage will block progress in the wizard.</li>
                                </ul>
                            </div>
                            <WorkflowEditor stages={workflowStages} onStagesChange={setWorkflowStages} />
                        </div>
                    ) : (
                        <>
                            <Palette />
                            <Canvas items={canvasItems} previewMode={viewMode === 'preview'} onRemoveItem={handleRemoveItem} />
                            <Inspector
                                selectedField={selectedItem}
                                workflowStages={workflowStages}
                                onUpdate={(updates) => {
                                    setCanvasItems(items => items.map(i =>
                                        i.id === selectedId ? { ...i, ...updates } : i
                                    ));
                                }}
                            />
                        </>
                    )}
                </div>
            </div>
        </DndContext>
    );
}
