import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          🏆 Quest Platform
        </Link>
        <div className="nav-links">
          <Link to="/quests" className={location.pathname === '/quests' ? 'active' : ''}>
            Quests
          </Link>
          {user && (
            <>
              <Link to="/my-quests" className={location.pathname === '/my-quests' ? 'active' : ''}>
                My Quests
              </Link>
              <Link to="/payment-history" className={location.pathname === '/payment-history' ? 'active' : ''}>
                Payments
              </Link>
            </>
          )}
        </div>
        <div className="nav-auth">
          {user ? (
            <div className="user-menu">
              <span>Welcome, {user.name || user.email}</span>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;