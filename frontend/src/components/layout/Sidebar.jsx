import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiUploadCloud, FiBarChart2, FiCheckSquare, FiActivity,
  FiTarget, FiZap, FiTool, FiPieChart, FiFileText, FiSettings,
  FiUser, FiLogOut, FiChevronsLeft, FiChevronsRight, FiDatabase,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import './layout.css';

const NAV_ITEMS = [
  { to: '/upload', label: 'Dataset Upload', icon: <FiUploadCloud /> },
  { to: '/profiling', label: 'Data Profiling', icon: <FiBarChart2 /> },
  { to: '/validation', label: 'Data Validation', icon: <FiCheckSquare /> },
  { to: '/anomaly', label: 'AI Anomaly Detection', icon: <FiActivity /> },
  { to: '/quality-score', label: 'Quality Score', icon: <FiTarget /> },
  { to: '/suggestions', label: 'AI Suggestions', icon: <FiZap /> },
  { to: '/cleaning', label: 'Data Cleaning', icon: <FiTool /> },
  { to: '/visualization', label: 'Visualizations', icon: <FiPieChart /> },
  { to: '/reports', label: 'Reports', icon: <FiFileText /> },
  { to: '/settings', label: 'Settings', icon: <FiSettings /> },
  { to: '/profile', label: 'User Profile', icon: <FiUser /> },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const { logout } = useAuth();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <FiDatabase />
        </div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">DataForge</span>
            <span className="sidebar-brand-tag">Quality Platform</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav scroll-thin">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="sidebar-active-pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="sidebar-link-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-link sidebar-logout" onClick={logout} title={collapsed ? 'Logout' : undefined}>
          <span className="sidebar-link-icon"><FiLogOut /></span>
          {!collapsed && <span className="sidebar-link-label">Logout</span>}
        </button>
        <button className="sidebar-collapse-btn" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
