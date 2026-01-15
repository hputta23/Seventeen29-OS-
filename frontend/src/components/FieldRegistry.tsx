import React from 'react';

// Field Definition interface
export interface FieldDef {
    name: string;
    type: 'text' | 'number' | 'boolean' | 'datetime' | 'enum' | 'link';
    required: boolean;
    options?: string[]; // For Enum
}

interface FieldProps {
    field: FieldDef;
    value: any;
    onChange: (val: any) => void;
}

// 1. Text Input Atom
const TextInput: React.FC<FieldProps> = ({ field, value, onChange }) => (
    <div className="space-y-1">
        <label className="text-xs text-slate-400 capitalize">{field.name} {field.required && '*'}</label>
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
        <label className="text-xs text-slate-400 capitalize">{field.name} {field.required && '*'}</label>
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
        <label className="text-xs text-slate-400 capitalize">{field.name} {field.required && '*'}</label>
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

// Registry Map
const FIELD_COMPONENTS: Record<string, React.FC<FieldProps>> = {
    text: TextInput,
    number: NumberInput,
    enum: SelectInput,
    // Add Link, DateTime later
};

export function FieldRegistry({ field, value, onChange }: FieldProps) {
    const Component = FIELD_COMPONENTS[field.type] || TextInput; // Default to Text
    return <Component field={field} value={value} onChange={onChange} />;
}
