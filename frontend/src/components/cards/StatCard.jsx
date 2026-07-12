import { motion } from 'framer-motion';
import './cards.css';

const StatCard = ({ icon, label, value, delta, deltaType = 'success', accent = 'primary' }) => {
  return (
    <motion.div
      className={`card stat-card accent-${accent}`}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-content">
        <span className="stat-card-label">{label}</span>
        <span className="stat-card-value numeric">{value}</span>
        {delta && <span className={`stat-card-delta delta-${deltaType}`}>{delta}</span>}
      </div>
    </motion.div>
  );
};

export default StatCard;
