import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Activity,
  Bot,
  BrainCircuit,
  Settings
} from 'lucide-react';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';

function App() {
  const [view, setView] = useState<'admin' | 'user'>('admin');

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo">
          <BrainCircuit size={32} />
          <span>DrMindit</span>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-item ${view === 'admin' ? 'active' : ''}`}
            onClick={() => setView('admin')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <Users size={20} />
            Organization
          </button>
          <button
            className={`nav-item ${view === 'user' ? 'active' : ''}`}
            onClick={() => setView('user')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <LayoutDashboard size={20} />
            My Wellness
          </button>
          <a href="#" className="nav-item">
            <Bot size={20} />
            AI Companion
          </a>
          <a href="#" className="nav-item">
            <Activity size={20} />
            Analytics
          </a>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <a href="#" className="nav-item">
            <Settings size={20} />
            Settings
          </a>
        </div>
      </aside>

      <main className="main-content">
        {view === 'admin' ? <AdminDashboard /> : <UserDashboard />}
      </main>
    </div>
  );
}

export default App;
