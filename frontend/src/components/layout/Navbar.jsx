import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiMoon, FiSun, FiChevronDown, FiUser, FiSettings, FiLogOut, FiMenu } from 'react-icons/fi';
import SearchBar from '../common/SearchBar';
import Dropdown from '../common/Dropdown';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getReports } from '../../api/reportApi';
import './layout.css';

const Navbar = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getReports();
        setNotifications(
          data.slice(0, 4).map((r) => ({ id: r.id, message: `Report "${r.name}" generated (${r.format})` })),
        );
      } catch {
        setNotifications([]);
      }
    })();
  }, []);

  return (
    <header className="navbar">
      <button className="navbar-mobile-toggle" onClick={onMobileMenuToggle} aria-label="Toggle menu">
        <FiMenu />
      </button>

      <div className="navbar-search">
        <SearchBar value={search} onChange={setSearch} placeholder="Search datasets, reports, columns..." />
      </div>

      <div className="navbar-actions">
        <button className="navbar-icon-btn" onClick={toggleTheme} aria-label="Toggle dark mode">
          {isDark ? <FiSun /> : <FiMoon />}
        </button>

        <Dropdown
          trigger={
            <button className="navbar-icon-btn navbar-bell">
              <FiBell />
              <span className="navbar-badge-dot" />
            </button>
          }
        >
          <div className="navbar-notif-header">Notifications</div>
          {notifications.length > 0 ? (
            notifications.map((a) => (
              <div key={a.id} className="dropdown-item navbar-notif-item">
                {a.message}
              </div>
            ))
          ) : (
            <div className="dropdown-item navbar-notif-item">No recent activity yet.</div>
          )}
        </Dropdown>

        <Dropdown
          trigger={
            <button className="navbar-profile-trigger">
              <img src={user?.avatar} alt={user?.name} className="navbar-avatar" />
              <span className="navbar-username">{user?.name}</span>
              <FiChevronDown size={14} />
            </button>
          }
        >
          <button className="dropdown-item" onClick={() => navigate('/profile')}>
            <FiUser /> My Profile
          </button>
          <button className="dropdown-item" onClick={() => navigate('/settings')}>
            <FiSettings /> Settings
          </button>
          <div className="dropdown-divider" />
          <button className="dropdown-item" onClick={logout} style={{ color: 'var(--color-danger)' }}>
            <FiLogOut /> Logout
          </button>
        </Dropdown>
      </div>
    </header>
  );
};

export default Navbar;
