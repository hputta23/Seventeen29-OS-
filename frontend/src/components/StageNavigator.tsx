import { Check } from 'lucide-react';

interface Stage {
    id: string;
    name: string;
    order: number;
    required_fields: string[];
}

interface StageNavigatorProps {
    stages: Stage[];
    currentStageIndex: number;
    onStageChange: (index: number) => void;
    completedStages: Set<number>;
}

export default function StageNavigator({ stages, currentStageIndex, onStageChange, completedStages }: StageNavigatorProps) {
    return (
        <div className="glass-panel rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between gap-2">
                {stages.map((stage, index) => {
                    const isActive = index === currentStageIndex;
                    const isCompleted = completedStages.has(index);
                    const isAccessible = index <= currentStageIndex || isCompleted;

                    return (
                        <div key={stage.id} className="flex items-center flex-1">
                            <button
                                onClick={() => isAccessible && onStageChange(index)}
                                disabled={!isAccessible}
                                className={`
                                    flex-1 px-4 py-3 rounded-lg transition-all duration-200
                                    ${isActive
                                        ? 'bg-blue-500/30 border-2 border-blue-400 text-blue-100 shadow-lg shadow-blue-900/30'
                                        : isCompleted
                                            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200'
                                            : isAccessible
                                                ? 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                                                : 'bg-white/5 border border-white/5 text-slate-600 cursor-not-allowed'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    {isCompleted && <Check size={16} className="text-emerald-400" />}
                                    <span className="text-sm font-medium">
                                        {stage.order}. {stage.name}
                                    </span>
                                </div>
                            </button>
                            {index < stages.length - 1 && (
                                <div className={`w-8 h-0.5 mx-1 ${isCompleted ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
