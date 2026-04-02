import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const client = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_API_KEY || ''
    }
});

export const dashboardApi = {
    // User Analytics
    getUserMoodTrends: (userId: string) => client.get(`/trends?user_id=${userId}`),
    getUserInsights: (userId: string) => client.get(`/insights?user_id=${userId}`),
    getUserRisk: (userId: string) => client.get(`/risk?user_id=${userId}`),

    // Admin Analytics (Requires Admin Role)
    getAdminOverview: (userId: string) => client.get('/admin/overview', { headers: { 'x-user-id': userId } }),
    getRiskDistribution: (userId: string) => client.get('/admin/risk-distribution', { headers: { 'x-user-id': userId } }),
    getHighRiskAlerts: (userId: string) => client.get('/admin/high-risk-alerts', { headers: { 'x-user-id': userId } })
};
