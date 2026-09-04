import React from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, AlertTriangle, ShieldAlert, Sparkles, RefreshCw, Flame, Lock } from 'lucide-react';

interface SimulationDockProps {
  onSimulatePaymentFail: () => void;
  onSimulateAboveCap: () => void;
  onSimulateExpiry: () => void;
  onSimulateScarcity: () => void;
  isExecuting: boolean;
}

export const SimulationDock: React.FC<SimulationDockProps> = ({
  onSimulatePaymentFail,
  onSimulateAboveCap,
  onSimulateExpiry,
  onSimulateScarcity,
  isExecuting,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-4 border border-amber-500/30 shadow-xl bg-gradient-to-r from-amber-950/20 via-slate-900 to-indigo-950/20">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Hackathon Judge Simulation Studio
            </h4>
            <p className="text-[11px] text-slate-400">
              Trigger simulated failure edge cases to demonstrate bounded recovery & authority firewalls.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={onSimulatePaymentFail}
          disabled={isExecuting}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-600/20 text-slate-200 hover:text-amber-300 border border-slate-700/60 hover:border-amber-500/40 text-left transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="group-hover:text-amber-300">Payment Fail & Recovery</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-400">Tests 2-step bounded auto recovery</span>
        </button>

        <button
          onClick={onSimulateAboveCap}
          disabled={isExecuting}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-600/20 text-slate-200 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/40 text-left transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="group-hover:text-rose-300">Above-Cap Counter</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <span className="text-[10px] text-slate-400">Merchant offers ₹2,750 &gt; ₹2,700 cap</span>
        </button>

        <button
          onClick={onSimulateExpiry}
          disabled={isExecuting}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-blue-600/20 text-slate-200 hover:text-blue-300 border border-slate-700/60 hover:border-blue-500/40 text-left transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="group-hover:text-blue-300">Deal Lock Expiry</span>
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-[10px] text-slate-400">Simulates lock timeout & auto renewal</span>
        </button>

        <button
          onClick={onSimulateScarcity}
          disabled={isExecuting}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-purple-600/20 text-slate-200 hover:text-purple-300 border border-slate-700/60 hover:border-purple-500/40 text-left transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="group-hover:text-purple-300">Scarcity Mode</span>
            <Flame className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <span className="text-[10px] text-slate-400">Inventory = 1 competition mode</span>
        </button>
      </div>
    </div>
  );
};
