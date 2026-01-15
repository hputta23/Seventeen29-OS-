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
        <aside className="w-64 glass-panel border-r border-white/10 flex flex-col h-full z-10">
            <div className="p-6">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    Seventeen29 OS
                </h1>
                <p className="text-xs text-slate-400 mt-1">Kernel v0.1.0</p>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30 shadow-lg shadow-blue-900/20'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}

                <div className="pt-4 pb-2">
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Foundation
                    </p>
                </div>
            </nav>

            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30">
                        HP
                    </div>
                    <div>
                        <p className="text-sm font-medium">Headquarters</p>
                        <p className="text-xs text-emerald-400">Online</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
