import { LayoutGrid, AlertTriangle, ShieldCheck, Users, Box, Network, Hammer, GitBranch } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', path: '/' },
    { icon: AlertTriangle, label: 'Incidents', path: '/modules/incidents' },
    { icon: ShieldCheck, label: 'Risks', path: '/modules/risks' },
    { icon: Users, label: 'People', path: '/modules/people' },
    { icon: Box, label: 'Sites', path: '/modules/sites' },
    { icon: GitBranch, label: 'MOC', path: '/modules/Management_of_Change' },
    { icon: Network, label: 'Neural View', path: '/neural' },
    { icon: Hammer, label: 'Workshop', path: '/workshop' },
];

export default function Sidebar() {
    return (
        <aside className="w-64 flex flex-col h-full z-20 relative px-4 py-6">
            {/* Floating Dock Container */}
            <div className="glass-panel rounded-2xl flex-1 flex flex-col overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                    <h1 className="text-xl font-bold text-gradient-neural tracking-tight">
                        Seventeen29 OS
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Kernel v0.1.0 Active</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 relative overflow-hidden ${isActive
                                    ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-white shadow-lg shadow-cyan-900/20 border border-cyan-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 rounded-l-lg shadow-[0_0_12px_rgba(34,211,238,0.8)]"></div>
                                    )}
                                    <item.icon size={18} className={`transition-transform duration-300 ${isActive ? 'scale-110 text-cyan-300' : 'group-hover:scale-105 group-hover:text-cyan-200/70'}`} />
                                    <span className="font-medium text-sm tracking-wide">{item.label}</span>

                                    {isActive && (
                                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-cyan-500/10 to-transparent"></div>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}

                    <div className="pt-6 pb-2 px-3">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        <p className="mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                            Foundation Layers
                        </p>
                    </div>
                </nav>

                {/* User/Footer */}
                <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
                    <div className="flex items-center gap-3 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-900 to-blue-900 flex items-center justify-center text-cyan-200 font-bold border border-white/10 shadow-inner group-hover:border-cyan-500/30 transition-colors">
                                HP
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#0a0f1c] rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full border border-emerald-500/30 shadow-[0_0_6px_rgba(52,211,153,1)]"></div>
                            </div>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-slate-200 truncate group-hover:text-cyan-100 transition-colors">Headquarters</p>
                            <p className="text-[10px] text-emerald-400 font-mono">NODE_ONLINE</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
