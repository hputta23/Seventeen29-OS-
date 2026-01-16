import { AlertTriangle, ShieldCheck, Users, Box, GitBranch, Search } from 'lucide-react';

export default function Dashboard() {
    const triggerSearch = () => {
        // Dispatch keyboard shortcut to open Command Palette
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true }));
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">System Overview</h2>
                    <p className="text-slate-400 mt-1">Welcome to specific Safety OS.</p>
                </div>

                {/* Visual Search Trigger */}
                <button
                    onClick={triggerSearch}
                    className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 w-full md:w-96 text-left"
                >
                    <Search className="text-slate-400 group-hover:text-cyan-400 transition-colors" size={20} />
                    <span className="text-slate-400 group-hover:text-slate-200 text-sm font-medium transition-colors">Search anything...</span>
                    <div className="ml-auto flex gap-1">
                        <kbd className="hidden md:inline-flex h-6 items-center gap-1 rounded border border-white/10 bg-black/20 px-2 font-mono text-[10px] text-slate-400 group-hover:text-cyan-400 transition-colors">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>
                </button>
            </header>

            {/* Modules Grid */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Modules</h3>
                    <div className="h-px bg-white/10 flex-1 ml-4"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { title: 'Incidents', icon: 'AlertTriangle', count: '12', color: 'text-amber-400', link: '/modules/incidents' },
                        { title: 'Risks', icon: 'ShieldCheck', count: '94%', color: 'text-emerald-400', link: '/modules/risks' },
                        { title: 'People', icon: 'Users', count: '108', color: 'text-blue-400', link: '/modules/people' },
                        { title: 'Sites', icon: 'Box', count: '4', color: 'text-purple-400', link: '/modules/sites' },
                        { title: 'MOC', icon: 'GitBranch', count: 'Active', color: 'text-pink-400', link: '/modules/Management_of_Change' },
                    ].map((mod) => (
                        <a
                            key={mod.title}
                            href={mod.link}
                            className="glass-panel p-4 rounded-xl hover:bg-white/5 transition-all duration-300 group cursor-pointer border hover:border-white/20"
                        >
                            <div className="flex flex-col items-center text-center gap-3">
                                <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center ${mod.color} group-hover:scale-110 transition-transform`}>
                                    {/* Quick Icon Placeholder since we can't dynamically import easily without lookup map */}
                                    <span className="font-bold text-lg">{mod.title.charAt(0)}</span>
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm">{mod.title}</h4>
                                    <p className="text-xs text-slate-400 mt-1">{mod.count}</p>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </section>

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
