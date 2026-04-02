import { MoodTrendChart, RiskPieChart, EngagementBarChart } from '../components/Charts';

const AdminDashboard = () => {
    // Mock Data
    const moodTrend = [
        { name: 'Mon', value: 7.2 },
        { name: 'Tue', value: 7.5 },
        { name: 'Wed', value: 6.8 },
        { name: 'Thu', value: 7.1 },
        { name: 'Fri', value: 7.4 },
        { name: 'Sat', value: 7.7 },
        { name: 'Sun', value: 7.5 },
    ];

    const riskDist = [
        { name: 'Low Risk', value: 120 },
        { name: 'Medium Risk', value: 45 },
        { name: 'High Risk', value: 12 },
    ];

    const engagement = [
        { name: 'Meditation', value: 450 },
        { name: 'Breathing', value: 320 },
        { name: 'Journal', value: 280 },
        { name: 'Focus', value: 150 },
    ];

    const alerts = [
        { user: 'usr_8172', risk: 'High', reason: '3-day low mood streak', time: '10m ago' },
        { user: 'usr_2291', risk: 'High', reason: 'Sudden mood drop ( -4 points)', time: '2h ago' },
        { user: 'usr_9901', risk: 'Med', reason: 'High usage + low improvement', time: '5h ago' },
    ];

    return (
        <div>
            <div className="header">
                <h1>Organizational Wellness</h1>
                <p style={{ color: 'var(--text-muted)' }}>Overview of Global Health Tech Org</p>
            </div>

            <div className="stats-grid">
                <div className="card stat-card">
                    <div className="stat-label">Total Users</div>
                    <div className="stat-value">1,240</div>
                    <div style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>+12% this month</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Avg Mood Score</div>
                    <div className="stat-value">7.4 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 10</span></div>
                    <div style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>Stable</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Active Today</div>
                    <div className="stat-value">842</div>
                    <div style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>68% Engagement</div>
                </div>
                <div className="card stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
                    <div className="stat-label">High Risk Alerts</div>
                    <div className="stat-value" style={{ color: 'var(--danger)' }}>12</div>
                    <div style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600 }}>Action Required</div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="card">
                    <div className="chart-title">Global Mood Trend</div>
                    <MoodTrendChart data={moodTrend} />
                </div>
                <div className="card">
                    <div className="chart-title">Risk Distribution</div>
                    <RiskPieChart data={riskDist} />
                </div>
                <div className="card" style={{ gridColumn: 'span 1' }}>
                    <div className="chart-title">Engagement by Activity</div>
                    <EngagementBarChart data={engagement} />
                </div>
                <div className="card">
                    <div className="chart-title">Recent Alerts</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {alerts.map((alert, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{alert.user}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{alert.reason}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className={`badge ${alert.risk === 'High' ? 'badge-danger' : 'badge-warning'}`}>{alert.risk}</span>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{alert.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
