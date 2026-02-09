import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Terminal, Cpu } from 'lucide-react';

const NeuralLink: React.FC = () => {
    const { battleLog } = useGameStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [battleLog]);

    return (
        <div className="w-full h-full bg-slate-900 border-l border-slate-700 flex flex-col font-mono text-xs md:text-sm">
            <div className="bg-slate-800 p-2 border-b border-slate-700 flex items-center gap-2 text-cyan-400">
                <Cpu className="w-4 h-4" />
                <span className="font-bold tracking-wider">NEURAL LINK v3.0</span>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600"
            >
                {battleLog.length === 0 && (
                    <div className="text-slate-500 italic">No activity detected...</div>
                )}
                {battleLog.map((log, index) => (
                    <div key={index} className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <span className="text-slate-600 select-none">{'>'}</span>
                        <span className="text-cyan-100">{log}</span>
                    </div>
                ))}
            </div>

            <div className="bg-slate-950 p-2 border-t border-slate-800 flex items-center gap-2 text-slate-500 text-[10px] uppercase">
                <Terminal className="w-3 h-3" />
                <span>System Online</span>
                <span className="flex-1 text-right animate-pulse text-green-500">●</span>
            </div>
        </div>
    );
};

export default NeuralLink;
