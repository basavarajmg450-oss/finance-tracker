import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { ShieldCheck, Database, HardDrive, Lock, Server } from 'lucide-react';

export const Settings = () => {
  const { user } = useAuth();
  const { currency } = useCurrency();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System & Application Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Academic project architecture specifications, database configuration, and security parameters
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            <span>MongoDB Architecture & Persistence</span>
          </h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Active Collections</span>
              <strong className="text-slate-900 font-semibold mt-0.5 block">
                users, transactions, budgets, financialgoals, goalcontributions, recurringtransactions
              </strong>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Compound Indexing</span>
              <strong className="text-slate-900 font-semibold mt-0.5 block">
                {'{ userId: 1, category: 1, month: 1, year: 1 }'} (Enforced unique budgets)
              </strong>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Security & Data Isolation Controls</span>
          </h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span><strong>Password Hashing:</strong> Bcrypt with salted rounds (plain-text never stored)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span><strong>Token Authentication:</strong> JWT via Bearer Authorization & HttpOnly Cookies</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span><strong>NoSQL Injection Safeguard:</strong> Query sanitization stripping '$' and '.' operator keys</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span><strong>CSV Injection Shield:</strong> Prepends single quote to cells beginning with '=', '+', '-', '@'</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
