import { useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { Palette } from './Palette';
import { Canvas } from './Canvas';
import { Inspector } from './Inspector';

export default function WorkshopLayout() {
    // Draft State
    const [canvasItems, setCanvasItems] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState(false);

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

    const selectedItem = canvasItems.find(i => i.id === selectedId);

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-200">
                {/* Header Toolbar */}
                <div className="absolute top-0 left-64 right-0 h-16 border-b border-white/10 bg-slate-900/50 backdrop-blur z-10 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <h1 className="font-bold text-lg">Untitled Blueprint *</h1>
                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">DRAFT</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="glass-panel p-1 flex rounded-lg">
                            <button
                                onClick={() => setPreviewMode(false)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!previewMode ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => setPreviewMode(true)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${previewMode ? 'bg-indigo-500/50 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                Preview
                            </button>
                        </div>

                        <button className="glass-button bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30">
                            Publish to Kernel
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex w-full pt-16">
                    <Palette />
                    <Canvas items={canvasItems} previewMode={previewMode} />
                    <Inspector selectedField={selectedItem} />
                </div>
            </div>
        </DndContext>
    );
}
