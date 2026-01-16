import { useDroppable } from '@dnd-kit/core';
import { FieldRegistry } from '../../components/FieldRegistry';

interface CanvasProps {
    items: any[];
    previewMode: boolean;
    onRemoveItem: (id: string) => void;
}

export function Canvas({ items, previewMode, onRemoveItem }: CanvasProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'canvas-droppable',
    });

    return (
        <main className="flex-1 bg-gradient-to-br from-slate-900 to-slate-950 p-8 overflow-y-auto flex justify-center relative">
            {/* Dot Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />

            <div
                ref={setNodeRef}
                className={`
                    w-full max-w-2xl min-h-[800px] border-2 rounded-xl transition-all duration-300
                    ${isOver ? 'border-blue-500/50 bg-blue-500/5' : 'border-dashed border-white/10 bg-white/5'}
                    backdrop-blur-sm p-8
                `}
            >
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-white/20 pointer-events-none">
                        <div className="text-6xl mb-4">⚒️</div>
                        <p className="text-lg">Drag components here to build</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <CanvasItem
                                key={item.id || index}
                                item={item}
                                previewMode={previewMode}
                                onRemove={() => onRemoveItem(item.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

function CanvasItem({ item, previewMode, onRemove }: { item: any, previewMode: boolean, onRemove: () => void }) {
    if (previewMode) {
        // Render Actual UI Component
        // Mocking a field definition for the registry
        const fieldDef = {
            name: item.name,
            label: item.label,
            type: convertType(item.type),
            options: item.options,
            required: false // Mock default
        };
        return (
            <div className="relative group">
                <FieldRegistry field={fieldDef} value={null} onChange={() => { }} />
                {/* Overlay to prevent interaction in preview if needed, or allow it for testing */}
            </div>
        );
    }

    // Render Abstract Box (Edit Mode)
    return (
        <div className="glass-panel p-4 flex items-center gap-4 group hover:border-blue-500/30 cursor-pointer transition-all">
            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-white/50">
                {getIcon(item.type)}
            </div>
            <div className="flex-1">
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="text-xs text-white/40 font-mono">{item.name}</div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="text-xs text-red-400 hover:text-red-300 hover:underline px-2 py-1"
                >
                    Remove
                </button>
            </div>
        </div>
    );
}

function convertType(type: string): "text" | "number" | "enum" {
    // Simple mapping for now
    if (type === 'number') return 'number';
    if (type === 'select') return 'enum';
    return 'text';
}

function getIcon(type: string) {
    switch (type) {
        case 'text': return 'Aa';
        case 'number': return '#';
        case 'relationship': return '🔗';
        default: return '?';
    }
}
