import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface Payment {
  id: number;
  user_id: number;
  quest_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  quest_title: string;
}

const PaymentHistory: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await api.get('/payments/history');
      setPayments(response.data.payments);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'status-success';
      case 'pending': return 'status-pending';
      case 'failed': return 'status-failed';
      default: return '';
    }
  };

  if (loading) return <div className="loading">Loading payment history...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="payment-history-page">
      <div className="page-header">
        <h1>Payment History</h1>
      </div>
      <div className="table-container">
        {payments.length === 0 ? (
          <div className="empty-state">
            <p>No payments found.</p>
          </div>
        ) : (
          <table className="payment-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Quest</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Order ID</th>
                <th>Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{new Date(payment.created_at).toLocaleString()}</td>
                  <td>{payment.quest_title}</td>
                  <td>₹{payment.amount}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>{payment.razorpay_order_id}</td>
                  <td>{payment.razorpay_payment_id || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;