import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardView } from './components/DashboardView';
import { ProjectView } from './components/ProjectView';
import { KanbanBoard } from './components/KanbanBoard';
import { 
  Activity, FolderKanban, LogOut, ShieldAlert, CheckCircle, 
  Menu, X, ShieldCheck, Sparkles, Laptop, Compass, Milestone
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, token, loading, login, signup, logout, errorMsg, successMsg } = useAuth();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects'>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auth Page Fields
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) return;

    setAuthSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name, role);
      }
      // Reset forms
      setEmail('');
      setPassword('');
      setName('');
    } catch (err) {
      console.error(err);
    } finally {
      setAuthSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-obsidian)' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(140, 82, 255, 0.15)',
          borderTopColor: 'var(--accent-violet)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // --- UNAUTHENTICATED LOGIN/SIGNUP STATE ---
  if (!token || !user) {
    return (
      <div className="auth-wrapper">
        <div style={{ display: 'flex', width: '100%', maxWidth: '960px', minHeight: '560px', boxShadow: 'var(--shadow-card)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          
          {/* Left panel: Modern Promotional Cyber banner */}
          <div className="promotional-panel" style={{
            flex: 1.1,
            background: 'linear-gradient(135deg, #110e26 0%, #07050d 100%)',
            borderRight: 'var(--border-glass)',
            padding: '4rem 3rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Glowing orb */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(140, 82, 255, 0.08)', filter: 'blur(80px)' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.06)', filter: 'blur(80px)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 1 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-cyan) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(140,82,255,0.3)' }}>
                <Activity size={20} color="#fff" />
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit', background: 'linear-gradient(135deg, #fff 0%, var(--accent-violet) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AetherTask
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', zIndex: 1, margin: '4rem 0' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, fontFamily: 'Outfit' }}>
                Track Tasks. <span style={{ color: 'var(--accent-cyan)' }}>Collaborate.</span> Deliver Faster.
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
                Track tasks, collaborate with teams, and deliver projects faster with AetherTask.
              </p>
            </div>

            {/* Micro Feature badges */}
            <div style={{ display: 'flex', gap: '1.5rem', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <Laptop size={14} color="var(--accent-violet)" />
                <span>Task Tracking</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <Compass size={14} color="var(--accent-cyan)" />
                <span>Team Collaboration</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <Milestone size={14} color="var(--accent-emerald)" />
                <span>Faster Delivery</span>
              </div>
            </div>
          </div>

          {/* Right panel: Auth Card */}
          <div className="glass-panel auth-card" style={{ flex: 0.9, background: 'var(--bg-panel-solid)', border: 'none', borderRadius: 0, margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="auth-header">
              <div className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</div>
              <div className="auth-subtitle">
                {isLogin ? 'Sign in to track your tasks and team projects' : 'Start collaborating and delivering projects faster'}
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="e.g. Elena Rostova" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="input-control" 
                  placeholder="e.g. elena@aether.org" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="input-control" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">Workspace Level Role</label>
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => setRole('MEMBER')}>
                      <input 
                        type="radio"
                        id="role-member"
                        name="authRole" 
                        value="MEMBER"
                        checked={role === 'MEMBER'}
                        onChange={() => setRole('MEMBER')}
                        style={{ cursor: 'pointer', accentColor: 'var(--accent-violet)', width: '16px', height: '16px' }}
                      />
                      <label htmlFor="role-member" style={{ cursor: 'pointer', userSelect: 'none' }}>Member</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => setRole('ADMIN')}>
                      <input 
                        type="radio"
                        id="role-admin"
                        name="authRole" 
                        value="ADMIN"
                        checked={role === 'ADMIN'}
                        onChange={() => setRole('ADMIN')}
                        style={{ cursor: 'pointer', accentColor: 'var(--accent-violet)', width: '16px', height: '16px' }}
                      />
                      <label htmlFor="role-admin" style={{ cursor: 'pointer', userSelect: 'none' }}>Workspace Administrator</label>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    ⓘ Note: The very first registered account is always promoted to System Admin.
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={authSubmitting}>
                {authSubmitting ? 'Signing in...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="auth-footer">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="auth-toggle-link" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Sign up free' : 'Sign in'}
              </span>
            </div>
          </div>
        </div>

        {/* Global Notifications inside Auth View */}
        {errorMsg && (
          <div className="alert-toast error">
            <ShieldAlert size={18} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="alert-toast success">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    );
  }

  // --- AUTHENTICATED SYSTEM DASHBOARD ---
  return (
    <div className="app-container">
      
      {/* Mobile Top Header */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} color="var(--accent-violet)" />
          <span style={{ fontWeight: 800, fontFamily: 'Outfit', fontSize: '1.15rem' }}>AetherTask</span>
        </div>
        <button className="menu-trigger" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
          {mobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Floating Sidebar */}
      <aside className={`sidebar ${mobileSidebarOpen ? 'active' : ''}`}>
        {/* Logo block */}
        <div className="sidebar-logo">
          <Activity size={24} color="var(--accent-violet)" style={{ filter: 'drop-shadow(0 0 8px rgba(140,82,255,0.4))' }} />
          <span>AetherTask</span>
        </div>

        {/* Menu Navigation */}
        <ul className="sidebar-menu">
          <li>
            <div 
              className={`sidebar-link ${activeTab === 'dashboard' && !selectedProjectId ? 'active' : ''}`}
              onClick={() => {
                setSelectedProjectId(null);
                setActiveTab('dashboard');
                setMobileSidebarOpen(false);
              }}
            >
              <Laptop />
              <span>Telemetry Hub</span>
            </div>
          </li>
          <li>
            <div 
              className={`sidebar-link ${activeTab === 'projects' || selectedProjectId ? 'active' : ''}`}
              onClick={() => {
                setSelectedProjectId(null);
                setActiveTab('projects');
                setMobileSidebarOpen(false);
              }}
            >
              <FolderKanban />
              <span>Project Directory</span>
            </div>
          </li>
        </ul>

        {/* Workspace info & User Profile block at footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', maxWidth: '170px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {user.role === 'ADMIN' ? (
                <>
                  <ShieldCheck size={12} color="var(--accent-cyan)" />
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>System Admin</span>
                </>
              ) : user.role === 'MEMBER' ? (
                <span>Workspace Member</span>
              ) : (
                <span>{user.role}</span>
              )}
            </div>
          </div>
          
          <button 
            onClick={logout} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-rose)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            title="Log out session"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="main-content">
        {selectedProjectId ? (
          <KanbanBoard 
            projectId={selectedProjectId} 
            onBack={() => setSelectedProjectId(null)} 
          />
        ) : activeTab === 'dashboard' ? (
          <DashboardView onViewProject={(id) => setSelectedProjectId(id)} />
        ) : (
          <ProjectView onSelectProject={(id) => setSelectedProjectId(id)} />
        )}
      </main>

      {/* Global Alerts / Toasts */}
      {errorMsg && (
        <div className="alert-toast error">
          <ShieldAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="alert-toast success">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
