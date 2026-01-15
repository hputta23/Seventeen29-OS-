import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FieldRegistry, type FieldDef } from './FieldRegistry';
import StageNavigator from './StageNavigator';

interface Stage {
    id: string;
    name: string;
    order: number;
    required_fields: string[];
}

interface WorkflowConfig {
    stages: Stage[];
}

interface StageFormProps {
    fields: FieldDef[];
    workflow: WorkflowConfig;
    formData: Record<string, any>;
    onFieldChange: (fieldName: string, value: any) => void;
    onSubmit: () => void;
    submitting: boolean;
}

export default function StageForm({ fields, workflow, formData, onFieldChange, onSubmit, submitting }: StageFormProps) {
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [completedStages, setCompletedStages] = useState<Set<number>>(new Set());
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const currentStage = workflow.stages[currentStageIndex];
    const currentStageFields = fields.filter(f => f.stage_id === currentStage.id);

    // Validate current stage
    const validateStage = (): boolean => {
        const errors: string[] = [];

        for (const fieldName of currentStage.required_fields) {
            const value = formData[fieldName];
            if (value === null || value === undefined || value === '') {
                const field = fields.find(f => f.name === fieldName);
                errors.push(`${field?.label || fieldName} is required`);
            }
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleNext = () => {
        if (validateStage()) {
            setCompletedStages(prev => new Set([...prev, currentStageIndex]));
            setValidationErrors([]);
            if (currentStageIndex < workflow.stages.length - 1) {
                setCurrentStageIndex(currentStageIndex + 1);
            }
        }
    };

    const handlePrevious = () => {
        if (currentStageIndex > 0) {
            setValidationErrors([]);
            setCurrentStageIndex(currentStageIndex - 1);
        }
    };

    const handleStageChange = (index: number) => {
        setValidationErrors([]);
        setCurrentStageIndex(index);
    };

    const handleFinalSubmit = () => {
        if (validateStage()) {
            onSubmit();
        }
    };

    const isLastStage = currentStageIndex === workflow.stages.length - 1;

    return (
        <div className="space-y-6">
            {/* Stage Navigator */}
            <StageNavigator
                stages={workflow.stages}
                currentStageIndex={currentStageIndex}
                onStageChange={handleStageChange}
                completedStages={completedStages}
            />

            {/* Current Stage Form */}
            <div className="glass-panel p-6 rounded-xl space-y-4">
                <div className="border-b border-white/10 pb-3">
                    <h3 className="text-2xl font-bold text-blue-200">
                        {currentStage.name}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        Step {currentStage.order} of {workflow.stages.length}
                        {currentStageFields.length > 0 && ` • ${currentStageFields.length} fields`}
                    </p>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <p className="text-red-200 font-semibold mb-2">Please complete the following:</p>
                        <ul className="list-disc list-inside text-red-300 text-sm space-y-1">
                            {validationErrors.map((error, i) => (
                                <li key={i}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Stage Fields */}
                {currentStageFields.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[200px]">
                        {currentStageFields.map(field => (
                            <FieldRegistry
                                key={field.name}
                                field={field}
                                value={formData[field.name]}
                                onChange={(val) => onFieldChange(field.name, val)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400">
                        <p className="text-lg">Review and finalize your submission</p>
                        <p className="text-sm mt-2">All required information has been collected</p>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t border-white/10">
                    <button
                        onClick={handlePrevious}
                        disabled={currentStageIndex === 0}
                        className="glass-button px-6 py-2 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Previous
                    </button>

                    {isLastStage ? (
                        <button
                            onClick={handleFinalSubmit}
                            disabled={submitting}
                            className="glass-button bg-emerald-500/20 border-emerald-500/30 text-emerald-200 px-6 py-2 disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting ? 'Creating...' : '✓ Submit MOC'}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="glass-button bg-blue-500/20 border-blue-500/30 text-blue-200 px-6 py-2 flex items-center gap-2"
                        >
                            Next
                            <ArrowRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
