import { Link } from 'react-router-dom';
import { useQuests } from '../hooks/useQuest';
import toast from 'react-hot-toast';

const QuestList: React.FC = () => {
  const { quests, loading, error, refetch } = useQuests();

  if (loading) return <div className="loading">Loading quests...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="quest-list-page">
      <div className="page-header">
        <h1>Available Quests</h1>
      </div>
      <div className="quest-grid">
        {quests.length === 0 ? (
          <div className="empty-state">
            <p>No quests available at the moment.</p>
          </div>
        ) : (
          quests.map((quest) => (
            <Link to={`/quest/${quest.id}`} key={quest.id} className="quest-card">
              <div className="quest-card-header">
                <h3>{quest.title}</h3>
                <span className={`quest-badge ${quest.is_paid ? 'paid' : 'free'}`}>
                  {quest.is_paid ? `₹${quest.price}` : 'Free'}
                </span>
              </div>
              <p className="quest-description">{quest.description}</p>
              <div className="quest-meta">
                <span>📝 {quest.question_count} questions</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default QuestList;