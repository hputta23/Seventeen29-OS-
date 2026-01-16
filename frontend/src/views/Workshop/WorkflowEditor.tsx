import { useState } from 'react';
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';

export interface WorkflowStage {
    id: string;
    name: string;
    order: number;
}

interface WorkflowEditorProps {
    stages: WorkflowStage[];
    onStagesChange: (stages: WorkflowStage[]) => void;
}

export default function WorkflowEditor({ stages, onStagesChange }: WorkflowEditorProps) {
    const [newStageName, setNewStageName] = useState('');

    const handleAddStage = () => {
        if (!newStageName.trim()) return;

        const newStage: WorkflowStage = {
            id: newStageName.toLowerCase().replace(/\s+/g, '_'),
            name: newStageName,
            order: stages.length + 1,
        };

        onStagesChange([...stages, newStage]);
        setNewStageName('');
    };

    const handleDeleteStage = (id: string) => {
        const updatedStages = stages
            .filter(s => s.id !== id)
            .map((s, index) => ({ ...s, order: index + 1 })); // Re-index
        onStagesChange(updatedStages);
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === stages.length - 1)
        ) return;

        const newStages = [...stages];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap
        [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];

        // Update orders
        const reordered = newStages.map((s, i) => ({ ...s, order: i + 1 }));
        onStagesChange(reordered);
    };

    return (
        <div className="flex-1 p-8 bg-slate-950/50 flex flex-col items-center overflow-y-auto">
            <div className="w-full max-w-2xl space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Workflow Builder
                    </h2>
                    <p className="text-slate-400">
                        Define the stages for your module's multistep wizard. Fields can be assigned to these stages in the Editor.
                    </p>
                </div>

                {/* Add Stage */}
                <div className="glass-panel p-4 rounded-xl flex gap-4">
                    <input
                        type="text"
                        value={newStageName}
                        onChange={(e) => setNewStageName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
                        placeholder="Stage Name (e.g., Risk Assessment)"
                        className="glass-input flex-1"
                    />
                    <button
                        onClick={handleAddStage}
                        disabled={!newStageName.trim()}
                        className="glass-button bg-blue-500/20 border-blue-500/30 text-blue-200 px-6 flex items-center gap-2 disabled:opacity-50"
                    >
                        <Plus size={18} />
                        Add Stage
                    </button>
                </div>

                {/* Stage List */}
                <div className="space-y-4">
                    {stages.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl text-slate-500">
                            No stages defined. Add one above to get started.
                        </div>
                    ) : (
                        stages.map((stage, index) => (
                            <div
                                key={stage.id}
                                className="glass-panel p-4 rounded-xl flex items-center gap-4 group animate-in slide-in-from-bottom-2"
                            >
                                <div className="p-2 text-slate-500 cursor-grab active:cursor-grabbing">
                                    <GripVertical size={20} />
                                </div>

                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold border border-blue-500/30">
                                    {stage.order}
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{stage.name}</h3>
                                    <code className="text-xs text-slate-500">ID: {stage.id}</code>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleMove(index, 'up')}
                                        disabled={index === 0}
                                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleMove(index, 'down')}
                                        disabled={index === stages.length - 1}
                                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                </div>

                                <div className="pl-4 border-l border-white/10">
                                    <button
                                        onClick={() => handleDeleteStage(stage.id)}
                                        className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
