import './common.css';

const Loader = ({ size = 32, label }) => {
  return (
    <div className="dqp-loader" role="status" aria-live="polite">
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        className="dqp-loader-spinner"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
          className="dqp-loader-track"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className="dqp-loader-arc"
        />
      </svg>
      {label && <span className="dqp-loader-label">{label}</span>}
    </div>
  );
};

export default Loader;
