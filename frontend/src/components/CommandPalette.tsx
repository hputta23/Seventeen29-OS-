import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
    LayoutGrid, AlertTriangle, ShieldCheck, Users, Box, GitBranch,
    Search, Network, Hammer
} from 'lucide-react';

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm"
        // Note: cmdk does not ship with styles, so we style the wrapper here manually or via index.css
        >
            <div className="w-full max-w-2xl bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in relative">
                <div className="flex items-center px-4 border-b border-white/10">
                    <Search className="w-5 h-5 text-slate-400 mr-3" />
                    <Command.Input
                        className="w-full h-14 bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-lg font-medium"
                        placeholder="Type a command or search..."
                    />
                    <div className="text-xs text-slate-500 font-mono border border-white/10 px-2 py-1 rounded">ESC</div>
                </div>

                <Command.List className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                    <Command.Empty className="py-6 text-center text-slate-500">No results found.</Command.Empty>

                    <Command.Group heading="Navigation" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 py-2">
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/'))}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer aria-selected:bg-white/10 aria-selected:text-white transition-colors"
                        >
                            <LayoutGrid size={18} />
                            <span className="text-sm font-medium">Dashboard</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/neural'))}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer aria-selected:bg-white/10 aria-selected:text-white transition-colors"
                        >
                            <Network size={18} />
                            <span className="text-sm font-medium">Neural View</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/workshop'))}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer aria-selected:bg-white/10 aria-selected:text-white transition-colors"
                        >
                            <Hammer size={18} />
                            <span className="text-sm font-medium">Workshop</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Modules" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 py-2 pt-4">
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/modules/incidents'))}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer aria-selected:bg-white/10 aria-selected:text-white transition-colors"
                        >
                            <AlertTriangle size={18} className="text-amber-400" />
                            <span className="text-sm font-medium">Incidents</span>
                            <span className="ml-auto text-xs text-amber-500/50">12 Active</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/modules/risks'))}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer aria-selected:bg-white/10 aria-selected:text-white transition-colors"
                        >
                            <ShieldCheck size={18} className="text-emerald-400" />
                            <span className="text-sm font-medium">Risk Compliance</span>
                            <span className="ml-auto text-xs text-emerald-500/50">94%</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/modules/people'))}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer aria-selected:bg-white/10 aria-selected:text-white transition-colors"
                        >
                            <Users size={18} className="text-blue-400" />
                            <span className="text-sm font-medium">People Directory</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/modules/sites'))}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer aria-selected:bg-white/10 aria-selected:text-white transition-colors"
                        >
                            <Box size={18} className="text-purple-400" />
                            <span className="text-sm font-medium">Sites</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/modules/Management_of_Change'))}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer aria-selected:bg-white/10 aria-selected:text-white transition-colors"
                        >
                            <GitBranch size={18} className="text-pink-400" />
                            <span className="text-sm font-medium">Management of Change</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Data (Simulated Index)" className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 py-2 pt-4">
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/modules/incidents'))}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer aria-selected:bg-white/10 aria-selected:text-white transition-colors"
                        >
                            <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">#</div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">INC-2024-001: Pressure Valve Leak</span>
                                <span className="text-xs text-slate-500">Incident • High Severity</span>
                            </div>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/modules/incidents'))}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer aria-selected:bg-white/10 aria-selected:text-white transition-colors"
                        >
                            <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">#</div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">INC-2024-002: Network Outage in Sector 7</span>
                                <span className="text-xs text-slate-500">Incident • Medium Severity</span>
                            </div>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => navigate('/modules/people'))}
                            className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer aria-selected:bg-white/10 aria-selected:text-white transition-colors"
                        >
                            <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">JD</div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">John Doe</span>
                                <span className="text-xs text-slate-500">Safety Inspector • Active</span>
                            </div>
                        </Command.Item>
                    </Command.Group>

                    <div className="p-2 border-t border-white/5 mt-2">
                        <p className="text-[10px] text-center text-slate-600">
                            Seventeen29 Neural Search v1.0
                        </p>
                    </div>

                </Command.List>
            </div>
        </Command.Dialog>
    );
}
