export default function Dashboard() {
    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-3xl font-bold">System Overview</h2>
                <p className="text-slate-400">Welcome to specific Safety OS.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Active Incidents</h3>
                    <p className="text-4xl font-bold mt-2">12</p>
                    <div className="mt-4 text-xs text-amber-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        3 Unmitigated Hazards
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Risk Compliance</h3>
                    <p className="text-4xl font-bold mt-2">94%</p>
                    <div className="mt-4 text-xs text-emerald-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        System Healthy
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Neural Links</h3>
                    <p className="text-4xl font-bold mt-2">853</p>
                    <div className="mt-4 text-xs text-blue-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        Auto-propagating
                    </div>
                </div>
            </div>

            {/* Dynamic Feed Placeholder */}
            <div className="glass-panel rounded-xl p-6 min-h-[400px]">
                <h3 className="text-lg font-semibold mb-4">Live Neural Activity</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/5">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <div className="flex-1">
                                <p className="text-sm">Propagation Event: <span className="text-blue-300">Incident #2491</span> linked to <span className="text-emerald-300">Risk Assessment #RA-09</span></p>
                                <p className="text-xs text-slate-500 mt-1">Status Auto-Updated: REQUIRES_REVIEW</p>
                            </div>
                            <span className="text-xs text-slate-500">Now</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
