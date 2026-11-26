import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

interface Stats {
  totalUsers: number;
  totalQuests: number;
  totalQuestions: number;
  totalRevenue: number;
}

interface RecentUser {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

interface RecentPayment {
  id: number;
  amount: number;
  status: string;
  created_at: string;
  user_email: string;
  quest_title: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalQuests: 0,
    totalQuestions: 0,
    totalRevenue: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data.stats);
      setRecentUsers(response.data.recentUsers);
      setRecentPayments(response.data.recentPayments);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#3B82F6' },
    { title: 'Total Quests', value: stats.totalQuests, icon: '🏆', color: '#8B5CF6' },
    { title: 'Total Questions', value: stats.totalQuestions, icon: '❓', color: '#F59E0B' },
    { title: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: '💰', color: '#10B981' },
  ];

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Overview of your quest platform</p>
      </div>

      <div className="stats-grid">
        {statCards.map((stat) => (
          <div key={stat.title} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-sections">
        <div className="section-card">
          <h2>Recent Users</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name || 'N/A'}</td>
                    <td>{user.email}</td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="section-card">
          <h2>Recent Payments</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Quest</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.user_email}</td>
                    <td>{payment.quest_title}</td>
                    <td>₹{payment.amount}</td>
                    <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;