import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface Quest {
  id: number;
  title: string;
  description: string;
  price: number;
  is_paid: boolean;
  question_count: number;
}

interface Submission {
  id: number;
  quest_id: number;
  score: number;
  correct_answers: number;
  total_questions: number;
  submitted_at: string;
  quest?: Quest;
}

const MyQuests: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await api.get('/submissions/averages/0'); // This will be fixed
      // We need to fetch user's quests via payments/access
      const [accessRes, subRes] = await Promise.all([
        api.get('/payments/history'),
        api.get('/submissions/averages/0') // placeholder
      ]);

      // Get all submissions for this user
      // We'll use a different approach - fetch user's quests from payments
      const userPayments = accessRes.data.payments.filter((p: any) => p.status === 'completed');

      // Fetch submissions for each quest
      const subs = [];
      for (const payment of userPayments) {
        try {
          const subRes = await api.get(`/submissions/my/${payment.quest_id}`);
          subs.push({ ...subRes.data.submission, quest: { title: payment.quest_title } });
        } catch (e) {
          // No submission yet for this quest
          subs.push({
            id: 0,
            quest_id: payment.quest_id,
            score: 0,
            correct_answers: 0,
            total_questions: 0,
            submitted_at: '',
            quest: { title: payment.quest_title },
            notAttempted: true
          });
        }
      }
      setSubmissions(subs);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch quests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  if (loading) return <div className="loading">Loading your quests...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="my-quests-page">
      <div className="page-header">
        <h1>My Quests</h1>
      </div>
      <div className="quest-grid">
        {submissions.length === 0 ? (
          <div className="empty-state">
            <p>You haven't purchased any quests yet.</p>
            <Link to="/quests" className="btn btn-primary">Browse Quests</Link>
          </div>
        ) : (
          submissions.map((sub) => (
            <div key={sub.quest_id} className="quest-card my-quest-card">
              <div className="quest-card-header">
                <h3>{sub.quest?.title || 'Unknown Quest'}</h3>
                {sub.notAttempted ? (
                  <span className="badge pending">Not Attempted</span>
                ) : (
                  <span className="badge completed">Completed</span>
                )}
              </div>
              {sub.notAttempted ? (
                <div className="quest-actions">
                  <Link to={`/quest/${sub.quest_id}`} className="btn btn-primary btn-full">
                    Start Quest
                  </Link>
                </div>
              ) : (
                <div className="result-summary">
                  <div className="score-display">
                    <span className="score-value">{Math.round(sub.score)}%</span>
                    <span className="score-detail">{sub.correct_answers}/{sub.total_questions} correct</span>
                  </div>
                  <p className="submitted-date">Completed on {new Date(sub.submitted_at).toLocaleDateString()}</p>
                  <Link to={`/quest/${sub.quest_id}`} className="btn btn-secondary btn-full">
                    View Details
                  </Link>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyQuests;