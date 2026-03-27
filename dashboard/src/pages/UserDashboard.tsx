import { MoodTrendChart } from '../components/Charts';
import { Zap, Sparkles } from 'lucide-react';

const UserDashboard = () => {
    const myMood = [
        { name: '1', value: 6 },
        { name: '2', value: 7 },
        { name: '3', value: 5 },
        { name: '4', value: 4 },
        { name: '5', value: 6 },
        { name: '6', value: 8 },
        { name: '7', value: 7 },
    ];

    const insights = [
        { title: 'Goal Reached', content: 'You completed a 5-day meditation streak!', type: 'success' },
        { title: 'Pattern Detected', content: 'Your mood improves by 20% after morning sessions.', type: 'info' },
        { title: 'Recommendation', content: 'Try a "Focus" session to boost productivity.', type: 'action' },
    ];

    return (
        <div>
            <div className="header">
                <h1>Welcome Back, Vishal</h1>
                <p style={{ color: 'var(--text-muted)' }}>Your personal wellness journey today</p>
            </div>

            <div className="stats-grid">
                <div className="card stat-card">
                    <div className="stat-label">Current Mood</div>
                    <div className="stat-value">7.0 <Sparkles size={16} color="var(--warning)" style={{ display: 'inline' }} /></div>
                    <div style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>Stable Baseline</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Today's Streak</div>
                    <div className="stat-value">12 <Zap size={16} color="var(--primary)" style={{ display: 'inline' }} /></div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Days in a row</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Sessions Completed</div>
                    <div className="stat-value">48</div>
                    <div style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>Top 10% of users</div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="chart-title">Your 7-Day Mood Journey</div>
                    <MoodTrendChart data={myMood} />
                </div>

                <div className="card">
                    <div className="chart-title">Daily Insights</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {insights.map((insight, i) => (
                            <div key={i} className="insight-item" style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '1rem' }}>
                                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{insight.title}</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{insight.content}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white' }}>
                    <div className="chart-title" style={{ color: 'white' }}>Recommended Action</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Stress Relief Session</div>
                        <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>Based on your recent pattern, a 5-minute breathing exercise could help maintain your focus.</p>
                        <button style={{
                            background: 'white',
                            color: 'var(--primary)',
                            border: 'none',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            marginTop: '0.5rem'
                        }}>
                            Start Session Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
