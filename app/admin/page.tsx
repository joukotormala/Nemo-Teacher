'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Lock, Shield, QrCode, Eye, EyeOff, Check, 
  AlertCircle, ArrowRight, Search, MessageSquare, 
  Calendar, Clock, Download, LogOut, RefreshCw, 
  UserCheck, Smile, BookOpen, ChevronRight, X,
  ImagePlus, Sparkles, FolderOpen, Copy, CheckCheck, Loader2, Trash2
} from 'lucide-react';

interface ParentData {
  id: string;
  name_thai: string;
  name_english: string | null;
  phone: string;
  email: string;
  language_preference: string;
  created_at: string;
  kidsCount: number;
  kids: Array<{ id: string; name_thai: string; name_english: string | null }>;
  stats: {
    conversationsCount: number;
    messagesCount: number;
    studyMinutes: number;
    lastActive: string | null;
  };
}

interface KidData {
  id: string;
  parent_id: string;
  name_thai: string;
  name_english: string | null;
  nickname_thai: string | null;
  nickname_english: string | null;
  birth_date: string;
  current_grade: string;
  school_name: string | null;
  language_preference: string;
  preferred_ai_model: string;
  created_at: string;
  parent: {
    id: string;
    name_thai: string;
    name_english: string | null;
    email: string;
  } | null;
  stats: {
    conversationsCount: number;
    messagesCount: number;
    sessionsCount: number;
    studyMinutes: number;
    lastActive: string | null;
  };
}

interface OverallStats {
  totalParents: number;
  totalKids: number;
  totalConversations: number;
  totalMessages: number;
  totalStudyMinutes: number;
}

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Setup / QR code state
  const [showSetup, setShowSetup] = useState(false);
  const [setupPassword, setSetupPassword] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupData, setSetupData] = useState<{ secret: string; qrUrl: string; otpauthUri: string } | null>(null);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Dashboard state
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [parentsList, setParentsList] = useState<ParentData[]>([]);
  const [kidsList, setKidsList] = useState<KidData[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [dataError, setDataError] = useState('');
  const [activeTab, setActiveTab] = useState<'parents' | 'kids' | 'illustrations'>('parents');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected user details modal
  const [selectedParent, setSelectedParent] = useState<ParentData | null>(null);
  const [selectedKid, setSelectedKid] = useState<KidData | null>(null);

  // Illustrations tab state
  const [illustrations, setIllustrations] = useState<{ path: string; name: string; folder: string }[]>([]);
  const [illLoading, setIllLoading] = useState(false);
  const [illGenConcept, setIllGenConcept] = useState('');
  const [illGenFolder, setIllGenFolder] = useState('generated');
  const [illGenPrompt, setIllGenPrompt] = useState('');
  const [illGenerating, setIllGenerating] = useState(false);
  const [illResult, setIllResult] = useState<{ path: string; mapEntry: string } | null>(null);
  const [illError, setIllError] = useState('');
  const [illCopied, setIllCopied] = useState(false);
  const [illElapsed, setIllElapsed] = useState(0);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'kid' | 'parent'; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAdminDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: deleteConfirm.type, id: deleteConfirm.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Delete failed');
      setDeleteConfirm(null);
      // Remove from local lists instantly, then refresh
      if (deleteConfirm.type === 'kid') {
        setKidsList(prev => prev.filter(k => k.id !== deleteConfirm.id));
      } else {
        setParentsList(prev => prev.filter(p => p.id !== deleteConfirm.id));
        setKidsList(prev => prev.filter(k => k.parent?.id !== deleteConfirm.id));
      }
      fetchDashboardData();
    } catch (err: any) {
      alert('Delete failed: ' + (err?.message ?? 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Tick elapsed seconds while generating
  useEffect(() => {
    if (!illGenerating) { setIllElapsed(0); return; }
    setIllElapsed(0);
    const interval = setInterval(() => setIllElapsed(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [illGenerating]);


  const fetchIllustrations = async () => {
    setIllLoading(true);
    try {
      const res = await fetch('/api/admin/illustrations');
      if (res.ok) {
        const data = await res.json();
        setIllustrations(data.illustrations ?? []);
      }
    } catch {}
    finally { setIllLoading(false); }
  };

  const generateIllustration = async () => {
    if (!illGenConcept.trim() || !illGenPrompt.trim()) return;
    setIllGenerating(true);
    setIllResult(null);
    setIllError('');
    try {
      const res = await fetch('/api/admin/illustrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: illGenConcept, folder: illGenFolder, prompt: illGenPrompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIllError(data.error ?? 'Generation failed');
      } else {
        setIllResult({ path: data.path, mapEntry: data.mapEntry });
        fetchIllustrations();
      }
    } catch (e: any) {
      setIllError(e.message ?? 'Network error');
    } finally {
      setIllGenerating(false);
    }
  };

  // 1. Check if user is already logged in on mount
  useEffect(() => {
    fetchDashboardData(true);
  }, []);

  const fetchDashboardData = async (initialCheck = false) => {
    if (initialCheck) {
      setIsCheckingSession(true);
    } else {
      setIsFetchingData(true);
    }
    setDataError('');

    try {
      const response = await fetch('/api/admin/data');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
          setParentsList(data.parentsList);
          setKidsList(data.kidsList);
          setIsAuthenticated(true);
        } else {
          if (!initialCheck) {
            setDataError(data.error || 'Failed to load dashboard data');
          }
        }
      } else {
        if (!initialCheck) {
          setDataError('Failed to retrieve dashboard metrics.');
        }
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      if (!initialCheck) {
        setDataError('A network error occurred while fetching dashboard metrics.');
      }
    } finally {
      setIsCheckingSession(false);
      setIsFetchingData(false);
    }
  };

  // 2. Handle Login Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginCode || loginCode.length !== 6 || isNaN(Number(loginCode))) {
      setLoginError('Please enter a valid 6-digit code');
      return;
    }

    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/admin/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: loginCode }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setLoginCode('');
        fetchDashboardData();
      } else {
        setLoginError(data.error || 'Incorrect security code. Please check your authenticator app.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Network error. Failed to verify security code.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 3. Handle setup password verification
  const handleSetupVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupPassword) {
      setSetupError('Please enter the configuration password');
      return;
    }

    setSetupError('');
    setIsVerifyingPassword(true);
    setSetupData(null);

    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: setupPassword }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSetupData({
          secret: data.secret,
          qrUrl: data.qrUrl,
          otpauthUri: data.otpauthUri
        });
      } else {
        setSetupError(data.error || 'Incorrect setup password. Access denied.');
      }
    } catch (err) {
      console.error('Setup verify error:', err);
      setSetupError('Network error occurred during validation.');
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  // 4. Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setIsAuthenticated(false);
    setStats(null);
    setParentsList([]);
    setKidsList([]);
  };

  // 5. CSV Export
  const exportToCSV = (type: 'parents' | 'kids') => {
    let headers: string[] = [];
    let rows: string[][] = [];
    
    if (type === 'parents') {
      headers = ['Name (TH)', 'Name (EN)', 'Email', 'Phone', 'Language', 'Kids Count', 'Total Conversations', 'Total Messages', 'Study Minutes', 'Last Active'];
      rows = parentsList.map(p => [
        p.name_thai || '',
        p.name_english || '',
        p.email || '',
        p.phone || '',
        p.language_preference || '',
        p.kidsCount.toString(),
        p.stats.conversationsCount.toString(),
        p.stats.messagesCount.toString(),
        p.stats.studyMinutes.toString(),
        p.stats.lastActive || 'N/A'
      ]);
    } else {
      headers = ['Name (TH)', 'Name (EN)', 'Nickname (TH)', 'Nickname (EN)', 'Grade', 'AI Model', 'Parent Email', 'Conversations', 'Messages', 'Study Minutes', 'Last Active'];
      rows = kidsList.map(k => [
        k.name_thai || '',
        k.name_english || '',
        k.nickname_thai || '',
        k.nickname_english || '',
        k.current_grade || '',
        k.preferred_ai_model || '',
        k.parent?.email || '',
        k.stats.conversationsCount.toString(),
        k.stats.messagesCount.toString(),
        k.stats.studyMinutes.toString(),
        k.stats.lastActive || 'N/A'
      ]);
    }
    
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nemo_admin_${type}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 6. Filter lists by query
  const filteredParents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return parentsList;
    return parentsList.filter(p => 
      (p.name_thai && p.name_thai.toLowerCase().includes(query)) ||
      (p.name_english && p.name_english.toLowerCase().includes(query)) ||
      (p.email && p.email.toLowerCase().includes(query)) ||
      (p.phone && p.phone.includes(query))
    );
  }, [parentsList, searchQuery]);

  const filteredKids = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return kidsList;
    return kidsList.filter(k => 
      (k.name_thai && k.name_thai.toLowerCase().includes(query)) ||
      (k.name_english && k.name_english.toLowerCase().includes(query)) ||
      (k.nickname_thai && k.nickname_thai.toLowerCase().includes(query)) ||
      (k.nickname_english && k.nickname_english.toLowerCase().includes(query)) ||
      (k.parent && k.parent.email && k.parent.email.toLowerCase().includes(query))
    );
  }, [kidsList, searchQuery]);

  // Loading Screen for Session Checking
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium animate-pulse">Initializing Secure Admin Portal...</p>
        </div>
      </div>
    );
  }

  // --- RENDER 1: Authentication / 2FA screen ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-zinc-900 to-slate-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-9 h-9 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Nemo Admin Security
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            Secure verification required to access user metrics.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="bg-slate-900/60 border border-zinc-800 backdrop-blur-xl py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
            
            {/* OTP Verification Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-zinc-300 mb-2">
                  Authenticator Code
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="otp"
                    id="otp"
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="block w-full pl-10 pr-3 py-3 border border-zinc-700 rounded-xl bg-slate-950/70 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-center tracking-[0.5em] text-xl"
                    required
                  />
                </div>
                {loginError && (
                  <div className="mt-2 flex items-center gap-1.5 text-rose-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Verify and Access</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-zinc-800 pt-6">
              <button
                onClick={() => {
                  setShowSetup(!showSetup);
                  setSetupError('');
                  setSetupData(null);
                  setSetupPassword('');
                }}
                className="w-full text-center text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1.5 transition"
              >
                <QrCode className="w-4 h-4" />
                {showSetup ? 'Hide Setup QR Code' : 'Setup 2FA / Show QR Code'}
              </button>

              {/* Secure 2FA QR Code Setup Accordion */}
              {showSetup && (
                <div className="mt-4 p-4 rounded-xl bg-slate-950/50 border border-zinc-800/80 space-y-4">
                  {!setupData ? (
                    <form onSubmit={handleSetupVerify} className="space-y-3">
                      <p className="text-xs text-zinc-400">
                        Enter the setup password configured in your environment to view your Google Authenticator setup credentials.
                      </p>
                      <div>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={setupPassword}
                            onChange={(e) => setSetupPassword(e.target.value)}
                            placeholder="Setup Password"
                            className="w-full pl-3 pr-10 py-2 text-sm border border-zinc-700 rounded-lg bg-slate-900 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {setupError && (
                          <div className="mt-1 flex items-center gap-1.5 text-rose-400 text-xs">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{setupError}</span>
                          </div>
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={isVerifyingPassword}
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-lg transition"
                      >
                        {isVerifyingPassword ? 'Verifying...' : 'Reveal Credentials'}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center space-y-4 flex flex-col items-center">
                      <div className="bg-white p-2 rounded-xl border border-zinc-200">
                        {/* QR Code image generated via Google chart api / qrserver api */}
                        <img 
                          src={setupData.qrUrl} 
                          alt="Authenticator Setup QR" 
                          className="w-40 h-40"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (setupData && !target.src.includes('api.qrserver.com')) {
                              target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.otpauthUri)}`;
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-zinc-300">Scan QR Code</p>
                        <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
                          Scan this image in Google Authenticator or Microsoft Authenticator. If you cannot scan, you can manually enter the secret:
                        </p>
                        <code className="block bg-slate-900 px-2 py-1.5 rounded border border-zinc-800 font-mono text-indigo-400 text-xs break-all select-all mt-1">
                          {setupData.secret}
                        </code>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 text-xs bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-900/40">
                        <Check className="w-3.5 h-3.5" />
                        <span>Ready for authentication codes</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- RENDER 2: Main Dashboard view ---
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Header Panel */}
      <header className="border-b border-zinc-800/80 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg bg-gradient-to-r from-indigo-200 via-white to-cyan-200 bg-clip-text text-transparent">AI Teacher Nemo</span>
                <span className="ml-2 text-xs font-semibold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-900/50">Admin Console</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchDashboardData()}
                disabled={isFetchingData}
                className="p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 transition disabled:opacity-50"
                title="Refresh stats"
              >
                <RefreshCw className={`w-4 h-4 ${isFetchingData ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-400 hover:text-white rounded-lg bg-rose-950/20 hover:bg-rose-600 border border-rose-900/30 hover:border-rose-500 transition-all duration-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Error notification if DB fetch failed */}
        {dataError && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-200 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <div className="flex-1 font-medium">{dataError}</div>
            <button 
              onClick={() => fetchDashboardData()} 
              className="text-xs underline hover:text-white font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* --- SECTION 1: Stats summary grid --- */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="bg-slate-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group shadow-lg shadow-black/10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition duration-300"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">Parents</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-900/50 flex items-center justify-center">
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">{stats?.totalParents ?? 0}</div>
            <p className="text-[10px] text-zinc-500 mt-2 font-medium">Registered parent profiles</p>
          </div>

          <div className="bg-slate-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group shadow-lg shadow-black/10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition duration-300"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">Kids / Students</span>
              <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-900/50 flex items-center justify-center">
                <Smile className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">{stats?.totalKids ?? 0}</div>
            <p className="text-[10px] text-zinc-500 mt-2 font-medium">Active learner profiles</p>
          </div>

          <div className="bg-slate-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group shadow-lg shadow-black/10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition duration-300"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">Conversations</span>
              <div className="w-8 h-8 rounded-lg bg-pink-950/60 border border-pink-900/50 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-pink-400" />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">{stats?.totalConversations ?? 0}</div>
            <p className="text-[10px] text-zinc-500 mt-2 font-medium">Total generated topics</p>
          </div>

          <div className="bg-slate-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group shadow-lg shadow-black/10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition duration-300"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">Messages Sent</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-900/50 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">{stats?.totalMessages ?? 0}</div>
            <p className="text-[10px] text-zinc-500 mt-2 font-medium">Tutor questions & replies</p>
          </div>

          <div className="bg-slate-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden group shadow-lg shadow-black/10 col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition duration-300"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">Learning Time</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-900/50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">
              {stats?.totalStudyMinutes ? Math.round(stats.totalStudyMinutes) : 0} <span className="text-sm font-semibold text-zinc-400">min</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 font-medium">Aggregated focus duration</p>
          </div>

        </section>

        {/* --- SECTION 2: Filter Toolbar & Search --- */}
        <section className="bg-slate-900/40 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-xl flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg shadow-black/5">
          {/* Tab toggles */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-zinc-800/80 w-full md:w-auto">
            <button
              onClick={() => { setActiveTab('parents'); setSearchQuery(''); }}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                activeTab === 'parents' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Parents ({filteredParents.length})</span>
            </button>
            <button
              onClick={() => { setActiveTab('kids'); setSearchQuery(''); }}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                activeTab === 'kids' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Smile className="w-3.5 h-3.5" />
              <span>Kids ({filteredKids.length})</span>
            </button>
            <button
              onClick={() => { setActiveTab('illustrations'); setSearchQuery(''); fetchIllustrations(); }}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                activeTab === 'illustrations' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span>Illustrations</span>
            </button>
          </div>

          {/* Search filter input */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'parents' ? 'Search by name, email, phone...' : 'Search by name, nickname, parent email...'}
              className="block w-full pl-9 pr-3 py-2 text-xs border border-zinc-850 rounded-xl bg-slate-950 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Export Action Button — only relevant for parents/kids tabs */}
          {activeTab !== 'illustrations' && (
          <button
            onClick={() => exportToCSV(activeTab as 'parents' | 'kids')}
            disabled={activeTab === 'parents' ? parentsList.length === 0 : kidsList.length === 0}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-slate-950 hover:bg-zinc-900 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition duration-200 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export to CSV</span>
          </button>
          )}
        </section>

        {/* --- SECTION 3: Aggregated lists table --- */}
        <section className="bg-slate-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
          {/* RENDER TAB 1: Parents View */}
          {activeTab === 'parents' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-800/80 font-sans text-left">
                <thead className="bg-slate-950/60 text-zinc-400 text-[11px] font-bold tracking-wider uppercase">
                  <tr>
                    <th scope="col" className="px-6 py-4">Name (TH / EN)</th>
                    <th scope="col" className="px-6 py-4">Contact Details</th>
                    <th scope="col" className="px-6 py-4 text-center">Kids Count</th>
                    <th scope="col" className="px-6 py-4 text-center">Convs</th>
                    <th scope="col" className="px-6 py-4 text-center">Total Messages</th>
                    <th scope="col" className="px-6 py-4 text-center">Duration</th>
                    <th scope="col" className="px-6 py-4">Last Activity</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/60 bg-transparent text-sm text-zinc-300">
                  {filteredParents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-zinc-500 font-medium">
                        No parent records found matching the query.
                      </td>
                    </tr>
                  ) : (
                    filteredParents.map((parent) => (
                      <tr key={parent.id} className="hover:bg-white/5 transition-all duration-150">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{parent.name_thai}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{parent.name_english || 'No English Name'}</div>
                        </td>
                        <td className="px-6 py-4 space-y-0.5">
                          <div className="text-zinc-200 text-xs font-mono">{parent.email}</div>
                          <div className="text-zinc-500 text-xs font-mono">{parent.phone}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-950/40 text-indigo-400 border border-indigo-900/30">
                            {parent.kidsCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-xs">{parent.stats.conversationsCount}</td>
                        <td className="px-6 py-4 text-center font-mono text-xs text-zinc-400">{parent.stats.messagesCount}</td>
                        <td className="px-6 py-4 text-center font-mono text-xs text-zinc-400">
                          {Math.round(parent.stats.studyMinutes)}m
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-500">
                          {parent.stats.lastActive ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                              <span>{new Date(parent.stats.lastActive).toLocaleDateString()}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-600 font-medium">Never</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => setSelectedParent(parent)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
                            >
                              <span>Inspect Kids</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: 'parent', id: parent.id, name: parent.name_thai || parent.name_english || parent.email })}
                              className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                              title="Delete parent and all their students"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* RENDER TAB 2: Kids View */}
          {activeTab === 'kids' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-800/80 font-sans text-left">
                <thead className="bg-slate-950/60 text-zinc-400 text-[11px] font-bold tracking-wider uppercase">
                  <tr>
                    <th scope="col" className="px-6 py-4">Kid (Name / Nickname)</th>
                    <th scope="col" className="px-6 py-4">Grade & Model</th>
                    <th scope="col" className="px-6 py-4">Parent Link</th>
                    <th scope="col" className="px-6 py-4 text-center">Convs</th>
                    <th scope="col" className="px-6 py-4 text-center">Total Messages</th>
                    <th scope="col" className="px-6 py-4 text-center">Sessions</th>
                    <th scope="col" className="px-6 py-4 text-center">Duration</th>
                    <th scope="col" className="px-6 py-4">Last Activity</th>
                    <th scope="col" className="px-6 py-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/60 bg-transparent text-sm text-zinc-300">
                  {filteredKids.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-zinc-500 font-medium">
                        No kids records found matching the query.
                      </td>
                    </tr>
                  ) : (
                    filteredKids.map((kid) => (
                      <tr key={kid.id} className="hover:bg-white/5 transition-all duration-150">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{kid.name_thai}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">
                            {kid.name_english || 'No EN Name'} 
                            {(kid.nickname_thai || kid.nickname_english) && (
                              <span className="ml-1 text-indigo-400/85">
                                ({[kid.nickname_thai, kid.nickname_english].filter(Boolean).join(' / ')})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                            Grade {kid.current_grade}
                          </span>
                          <div className="text-[10px] text-zinc-500 font-mono">{kid.preferred_ai_model || 'Llama 3.1 8B'}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-zinc-400">
                          {kid.parent ? (
                            <div>
                              <div className="text-zinc-300">{kid.parent.name_thai || kid.parent.name_english}</div>
                              <div className="text-[10px] text-zinc-500 mt-0.5">{kid.parent.email}</div>
                            </div>
                          ) : (
                            <span className="text-zinc-650 font-medium">Unlinked</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-xs">{kid.stats.conversationsCount}</td>
                        <td className="px-6 py-4 text-center font-mono text-xs text-zinc-400">{kid.stats.messagesCount}</td>
                        <td className="px-6 py-4 text-center font-mono text-xs text-zinc-400">{kid.stats.sessionsCount}</td>
                        <td className="px-6 py-4 text-center font-mono text-xs text-indigo-400">
                          {Math.round(kid.stats.studyMinutes)}m
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-500">
                          {kid.stats.lastActive ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                              <span>{new Date(kid.stats.lastActive).toLocaleDateString()}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-600 font-medium">Never</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => setSelectedKid(kid)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-350 transition"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: 'kid', id: kid.id, name: kid.name_thai || kid.name_english || 'this student' })}
                              className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                              title="Delete student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* RENDER TAB 3: Illustrations */}
          {activeTab === 'illustrations' && (
            <div className="p-6 space-y-6">

              {/* Generator form */}
              <div className="bg-slate-950/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Generate New Illustration</h3>
                  <span className="text-[10px] text-zinc-500 ml-1">powered by Pollinations FLUX · free · no API key needed</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Concept / Filename</label>
                    <input
                      type="text"
                      value={illGenConcept}
                      onChange={e => setIllGenConcept(e.target.value)}
                      disabled={illGenerating}
                      placeholder="e.g. skeleton"
                      className="w-full px-3 py-2 text-xs border border-zinc-700 rounded-xl bg-slate-950 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Folder</label>
                    <select
                      value={illGenFolder}
                      onChange={e => setIllGenFolder(e.target.value)}
                      disabled={illGenerating}
                      className="w-full px-3 py-2 text-xs border border-zinc-700 rounded-xl bg-slate-950 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <option value="generated">generated</option>
                      <option value="science/biology">science/biology</option>
                      <option value="science/physics">science/physics</option>
                      <option value="science/chemistry">science/chemistry</option>
                      <option value="science/ecosystems">science/ecosystems</option>
                      <option value="science/experiments">science/experiments</option>
                      <option value="science/space&earth">science/space&earth</option>
                      <option value="math">math</option>
                      <option value="lab_tech">lab_tech</option>
                      <option value="reading">reading</option>
                      <option value="english">english</option>
                      <option value="thai">thai</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Image Prompt</label>
                    <input
                      type="text"
                      value={illGenPrompt}
                      onChange={e => setIllGenPrompt(e.target.value)}
                      disabled={illGenerating}
                      placeholder="e.g. A clear labeled diagram of the human skeletal system..."
                      className="w-full px-3 py-2 text-xs border border-zinc-700 rounded-xl bg-slate-950 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  onClick={generateIllustration}
                  disabled={illGenerating || !illGenConcept.trim() || !illGenPrompt.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {illGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {illGenerating ? `Generating image — ${illElapsed}s elapsed…` : 'Generate & Save Illustration'}
                </button>

                {/* Live progress bar shown while generating */}
                {illGenerating && (
                  <div className="space-y-1.5">
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${Math.min(95, (illElapsed / 30) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      {illElapsed < 5 ? 'Connecting to image generator…' :
                       illElapsed < 12 ? 'Generating your illustration with FLUX AI…' :
                       illElapsed < 25 ? 'Almost there, rendering details…' :
                       'Finalising and saving image…'}
                    </p>
                  </div>
                )}

                {illError && (
                  <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-950/30 border border-rose-900/40 px-3 py-2 rounded-xl">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {illError}
                  </div>
                )}

                {illResult && (
                  <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <Check className="w-4 h-4" />
                      Illustration saved! Add this to ILLUSTRATION_MAP in page.tsx:
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-slate-900 text-indigo-300 text-xs font-mono px-3 py-2 rounded-xl border border-zinc-800 select-all">
                        {illResult.mapEntry}
                      </code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(illResult.mapEntry); setIllCopied(true); setTimeout(() => setIllCopied(false), 2000); }}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition"
                        title="Copy"
                      >
                        {illCopied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                      </button>
                    </div>
                    <img src={illResult.path} alt="Generated" className="rounded-xl max-h-48 object-contain border border-zinc-800" />
                  </div>
                )}
              </div>

              {/* Existing illustrations grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-sm font-bold text-white">Existing Illustrations ({illustrations.length})</h3>
                  </div>
                  <button onClick={fetchIllustrations} disabled={illLoading} className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition">
                    <RefreshCw className={`w-3 h-3 ${illLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                {illLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {illustrations.map(ill => (
                      <div key={ill.path} className="group bg-slate-900/60 border border-zinc-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all">
                        <div className="aspect-square bg-zinc-950 flex items-center justify-center overflow-hidden">
                          <img
                            src={ill.path}
                            alt={ill.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-[10px] font-bold text-zinc-300 truncate">{ill.name}</p>
                          <p className="text-[9px] text-zinc-600 truncate">{ill.folder}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </section>

      </main>

      {/* --- MODAL 1: Parent Kids inspector --- */}
      {selectedParent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="bg-slate-950/60 px-6 py-4 border-b border-zinc-800/80 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Linked Kids Profiles</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Parent: {selectedParent.name_thai} ({selectedParent.email})</p>
              </div>
              <button 
                onClick={() => setSelectedParent(null)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              {selectedParent.kidsCount === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-xs">
                  This parent profile does not have any linked kids yet.
                </div>
              ) : (
                selectedParent.kids.map((k) => {
                  // Find full kid data to display metrics
                  const fullKid = kidsList.find(item => item.id === k.id);
                  return (
                    <div key={k.id} className="p-4 rounded-2xl bg-slate-950 border border-zinc-850 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-semibold text-white">{k.name_thai}</div>
                          <div className="text-xs text-zinc-500">{k.name_english || 'No EN Name'}</div>
                        </div>
                        {fullKid && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-900 text-zinc-300 rounded border border-zinc-850">
                            Grade {fullKid.current_grade}
                          </span>
                        )}
                      </div>
                      
                      {fullKid && (
                        <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2 rounded-xl text-center border border-zinc-900/50">
                          <div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Convs</div>
                            <div className="text-sm font-bold mt-0.5 text-zinc-200">{fullKid.stats.conversationsCount}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Messages</div>
                            <div className="text-sm font-bold mt-0.5 text-zinc-200">{fullKid.stats.messagesCount}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Minutes</div>
                            <div className="text-sm font-bold mt-0.5 text-indigo-400">{Math.round(fullKid.stats.studyMinutes)}m</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-950/60 border-t border-zinc-800/80 text-right">
              <button
                onClick={() => setSelectedParent(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-xl transition"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Kid detailed inspector --- */}
      {selectedKid && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative font-sans">
            
            {/* Modal Header */}
            <div className="bg-slate-950/60 px-6 py-4 border-b border-zinc-800/80 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Student Usage Breakdown</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Student ID: {selectedKid.id}</p>
              </div>
              <button 
                onClick={() => setSelectedKid(null)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[450px] overflow-y-auto">
              {/* Profile card */}
              <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-2xl border border-zinc-855">
                <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-900 flex items-center justify-center">
                  <Smile className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedKid.name_thai} ({selectedKid.name_english || 'No EN Name'})</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Grade {selectedKid.current_grade} • School: {selectedKid.school_name || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Study Stats Breakdown Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-4 rounded-xl border border-zinc-850/80">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Conversations Started</span>
                  <div className="text-xl font-black text-zinc-200 mt-1 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    <span>{selectedKid.stats.conversationsCount} topics</span>
                  </div>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-xl border border-zinc-850/80">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total Messages Sent</span>
                  <div className="text-xl font-black text-zinc-200 mt-1 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-pink-400" />
                    <span>{selectedKid.stats.messagesCount} msgs</span>
                  </div>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-xl border border-zinc-850/80">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Study Sessions</span>
                  <div className="text-xl font-black text-zinc-200 mt-1 flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>{selectedKid.stats.sessionsCount} sessions</span>
                  </div>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-xl border border-zinc-850/80">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total Focused Time</span>
                  <div className="text-xl font-black text-indigo-400 mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>{Math.round(selectedKid.stats.studyMinutes)} minutes</span>
                  </div>
                </div>
              </div>

              {/* Meta information */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-zinc-850 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">AI Tutor model preference</span>
                  <span className="font-semibold text-zinc-300">{selectedKid.preferred_ai_model || 'Llama 3.1 8B'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Language configuration</span>
                  <span className="font-semibold text-zinc-300 uppercase">{selectedKid.language_preference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Registration date</span>
                  <span className="font-semibold text-zinc-300">
                    {selectedKid.created_at ? new Date(selectedKid.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Latest active date</span>
                  <span className="font-semibold text-indigo-400">
                    {selectedKid.stats.lastActive ? new Date(selectedKid.stats.lastActive).toLocaleString() : 'No activity logged'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-950/60 border-t border-zinc-800/80 text-right">
              <button
                onClick={() => setSelectedKid(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-xl transition"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Confirm Delete</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {deleteConfirm.type === 'parent'
                    ? 'This will also delete all their students.'
                    : 'This will permanently remove this student.'}
                </p>
              </div>
            </div>
            <div className="bg-slate-950/60 border border-zinc-800 rounded-xl px-4 py-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">
                {deleteConfirm.type === 'parent' ? 'Parent' : 'Student'}
              </p>
              <p className="text-sm font-semibold text-white">{deleteConfirm.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-zinc-700 hover:bg-zinc-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
