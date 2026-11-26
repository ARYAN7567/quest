import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <div className="hero">
        <div className="hero-content">
          <h1>🏆 Quest Platform</h1>
          <p className="hero-subtitle">
            Test your knowledge, earn rewards, and climb the leaderboard.
            Take paid quests, answer questions, and track your progress.
          </p>
          <div className="hero-buttons">
            {user ? (
              <Link to="/quests" className="btn btn-primary btn-large">
                Browse Quests
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-large">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn btn-secondary btn-large">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">🎯</div>
          <h3>Curated Quests</h3>
          <p>Expertly crafted questions across various topics and difficulty levels.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💰</div>
          <h3>Secure Payments</h3>
          <p>Pay safely with Razorpay integration for instant quest access.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Detailed Analytics</h3>
          <p>Track your scores, compare with averages, and improve over time.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚙️</div>
          <h3>Admin Panel</h3>
          <p>Full admin dashboard to manage quests, questions, and users.</p>
        </div>
      </div>

      {!user && (
        <div className="cta-section">
          <h2>Ready to Start Your Quest Journey?</h2>
          <p>Join thousands of learners testing their skills daily.</p>
          <Link to="/register" className="btn btn-primary btn-large">
            Create Free Account
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;