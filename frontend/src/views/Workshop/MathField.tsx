import { useEffect, useState } from 'react';
import init, { evaluate_formula } from 'calc-engine';

export function MathField() {
    const [formula, setFormula] = useState('2 * 5 + 1');
    const [result, setResult] = useState<number | string>('...');
    const [isWasmReady, setIsWasmReady] = useState(false);

    useEffect(() => {
        init().then(() => {
            setIsWasmReady(true);
        }).catch(err => {
            console.error("WASM init failed", err);
            setResult('Error loading WASM');
        });
    }, []);

    useEffect(() => {
        if (!isWasmReady) return;

        // Mock Context
        const context = JSON.stringify({
            severity: 5,
            likelihood: 4,
            risk_base: 10
        });

        try {
            const val = evaluate_formula(formula, context);
            setResult(val);
        } catch (e) {
            setResult("Error");
        }
    }, [formula, isWasmReady]);

    if (!isWasmReady) return <div className="text-xs text-slate-500">Loading math engine...</div>;

    return (
        <div className="glass-panel p-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-300">WASM Math Engine</h3>

            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="text-xs text-slate-500 block mb-1">Formula</label>
                    <input
                        className="glass-input w-full font-mono text-sm"
                        value={formula}
                        onChange={e => setFormula(e.target.value)}
                    />
                </div>
                <div className="w-24">
                    <label className="text-xs text-slate-500 block mb-1">Result (O(1))</label>
                    <div className="glass-input bg-emerald-500/10 text-emerald-400 font-mono text-sm flex items-center h-[34px] px-3">
                        {result}
                    </div>
                </div>
            </div>
            <p className="text-[10px] text-slate-500">
                Context: severity=5, likelihood=4, risk_base=10
            </p>
        </div>
    );
}
