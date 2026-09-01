'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Zap,
  ShieldCheck,
  FileText,
  RefreshCw,
  Play,
  Search,
  Sparkles,
  Database,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { CopilotDrawer } from '@/components/copilot/CopilotDrawer';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [processingEngine, setProcessingEngine] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const links = [
    { href: '/dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { href: '/transactions', label: t.navTransactions, icon: Receipt },
    { href: '/decisions', label: t.navDecisions, icon: Zap },
    { href: '/policy', label: t.navPolicy, icon: ShieldCheck },
    { href: '/audit', label: t.navAudit, icon: FileText },
  ];

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLoadBatch = async () => {
    setLoadingBatch(true);
    try {
      const res = await api<{ count: number }>('/batch/load', { method: 'POST' });
      showToast(`Batch loaded successfully: ${res.count} transactions.`);
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Batch load failed');
    } finally {
      setLoadingBatch(false);
    }
  };

  const handleProcessEngine = async () => {
    setProcessingEngine(true);
    try {
      const res = await api<{ processed: number }>('/batch/process', { method: 'POST', body: JSON.stringify({ limit: 200 }) });
      showToast(`AI Pipeline finished: Processed ${res.processed} transactions.`);
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Pipeline execution failed');
    } finally {
      setProcessingEngine(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      router.push(`/transactions?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#090d16] text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#1e2d4a] bg-[#0c1220]/90 backdrop-blur-xl flex flex-col fixed inset-y-0 left-0 z-30">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#1e2d4a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 p-[1.5px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-[#0c1220] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-white tracking-tight">RecoverIQ</h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{t.subBrand}</p>
            </div>
          </div>
        </div>

        {/* Live Engine Status Banner */}
        <div className="mx-4 mt-4 p-3 rounded-xl bg-slate-900/80 border border-[#1e2d4a] flex items-center gap-3">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">{t.aiAgentTitle}</p>
            <p className="text-[10px] text-slate-400">{t.aiAgentSubtitle}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            {t.navTitle}
          </p>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-blue-400 border border-blue-500/30 shadow-md shadow-blue-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Console Footer */}
        <div className="p-4 border-t border-[#1e2d4a] bg-[#090d16]/50">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" /> Razorpay Track 03
            </span>
            <span className="font-mono text-[10px] text-slate-400">DECIDE·GOVERN</span>
          </div>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="flex-1 pl-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#1e2d4a] bg-[#0c1220]/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-[#131b2e] border border-[#1e2d4a] focus:border-blue-500/60 text-xs rounded-xl pl-9 pr-4 py-2 text-slate-200 placeholder-slate-400 focus:outline-none transition-colors"
            />
          </form>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Notification Toast */}
            {notification && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{notification}</span>
              </div>
            )}

            {/* Language Selector Dropdown */}
            <LanguageSelector />

            {/* Quick Action: Load Batch */}
            <button
              onClick={handleLoadBatch}
              disabled={loadingBatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#131b2e] hover:bg-[#1b263f] border border-[#1e2d4a] text-slate-200 hover:text-white transition-all disabled:opacity-50"
              title="Load synthetic transactions into SQLite"
            >
              <Database className={`w-3.5 h-3.5 ${loadingBatch ? 'animate-spin text-blue-400' : 'text-indigo-400'}`} />
              <span>{loadingBatch ? t.loadingBatch : t.loadBatch}</span>
            </button>

            {/* Quick Action: Run AI Pipeline */}
            <button
              onClick={handleProcessEngine}
              disabled={processingEngine}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
              title="Execute full EV recovery decision pipeline"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${processingEngine ? 'animate-spin' : ''}`} />
              <span>{processingEngine ? t.runningEngine : t.runEngine}</span>
            </button>

            {/* Razorpay Mode Pill */}
            <div className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono font-semibold">
              {t.demoMode}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>

      {/* Global Floating AI Operations Copilot */}
      <CopilotDrawer />
    </div>
  );
}
