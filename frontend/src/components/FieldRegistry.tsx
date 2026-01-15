import React from 'react';

// Field Definition interface
export interface FieldDef {
    name: string;
    label?: string;
    field_type: 'text' | 'number' | 'boolean' | 'datetime' | 'enum' | 'link' | 'json';
    required?: boolean;
    options?: string[]; // For Enum
    target_blueprint?: string; // For Link
    formula?: string; // For calculated fields
    logic?: any[]; // For conditional logic
    stage_id?: string; // For workflow stages
}

interface FieldProps {
    field: FieldDef;
    value: any;
    onChange: (val: any) => void;
}

// 1. Text Input Atom
const TextInput: React.FC<FieldProps> = ({ field, value, onChange }) => (
    <div className="space-y-1">
        <label className="text-xs text-slate-400 capitalize">{field.label || field.name} {field.required && '*'}</label>
        <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="w-full glass-input"
            placeholder={`Enter ${field.name}...`}
        />
    </div>
);

// 2. Number Input Atom
const NumberInput: React.FC<FieldProps> = ({ field, value, onChange }) => (
    <div className="space-y-1">
        <label className="text-xs text-slate-400 capitalize">{field.label || field.name} {field.required && '*'}</label>
        <input
            type="number"
            value={value || ''}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full glass-input font-mono"
        />
    </div>
);

// 3. Selection Atom
const SelectInput: React.FC<FieldProps> = ({ field, value, onChange }) => (
    <div className="space-y-1">
        <label className="text-xs text-slate-400 capitalize">{field.label || field.name} {field.required && '*'}</label>
        <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="w-full glass-input appearance-none bg-slate-900/50"
        >
            <option value="">Select Option</option>
            {field.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
    </div>
);

// 4. Boolean Toggle Atom
const BooleanInput: React.FC<FieldProps> = ({ field, value, onChange }) => (
    <div className="space-y-1">
        <label className="text-xs text-slate-400 capitalize flex items-center gap-2">
            <input
                type="checkbox"
                checked={value || false}
                onChange={e => onChange(e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-slate-900/50"
            />
            {field.label || field.name} {field.required && '*'}
        </label>
    </div>
);

// Registry Map
const FIELD_COMPONENTS: Record<string, React.FC<FieldProps>> = {
    text: TextInput,
    number: NumberInput,
    enum: SelectInput,
    boolean: BooleanInput,
    link: TextInput, // For now, treat as text (UUID input)
    json: TextInput, // For now, treat as text
    datetime: TextInput, // For now, treat as text
};

export function FieldRegistry({ field, value, onChange }: FieldProps) {
    const Component = FIELD_COMPONENTS[field.field_type] || TextInput; // Default to Text
    return <Component field={field} value={value} onChange={onChange} />;
}
