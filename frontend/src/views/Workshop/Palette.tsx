import { useDraggable } from '@dnd-kit/core';

import { MathField } from './MathField';

// Mock Field Types
const FIELD_TYPES = [
    { type: 'text', label: 'Text Input', icon: 'abcd' },
    { type: 'number', label: 'Number / Metric', icon: '#' },
    { type: 'select', label: 'Dropdown Selection', icon: '▼' },
    { type: 'date', label: 'Date / Time', icon: '📅' },
    // { type: 'formula', label: 'Math Formula (WASM)', icon: 'ƒ' },
    { type: 'neural', label: 'Neural Link', icon: '🔗' },
    { type: 'relationship', label: 'Data Link', icon: '⛓️' },
];

export function Palette() {
    return (
        <aside className="w-64 border-r border-white/10 flex flex-col bg-black/20 backdrop-blur-md">
            <div className="p-4 border-b border-white/10">
                <h2 className="font-semibold text-white/90">Component Parts</h2>
                <p className="text-xs text-white/50">Drag to manufacture</p>
            </div>

            {/* WASM Verification Area (Hidden)
            <div className="p-4 border-b border-white/10">
                <MathField />
            </div>
            */}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {FIELD_TYPES.map(field => (
                    <DraggableSource key={field.type} field={field} />
                ))}
            </div>
        </aside>
    );
}

function DraggableSource({ field }: { field: any }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `palette-${field.type}`,
        data: { type: 'field-source', fieldType: field.type }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className="glass-panel p-3 flex items-center gap-3 cursor-grab hover:bg-white/10 active:cursor-grabbing transition-colors"
        >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-mono text-sm text-cyan-400">
                {field.icon}
            </div>
            <span className="text-sm font-medium text-slate-200">{field.label}</span>
        </div>
    );
}
