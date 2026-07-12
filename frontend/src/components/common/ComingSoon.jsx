import { FiTool } from 'react-icons/fi';

const ComingSoon = ({ title }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: 14 }}>
    <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
      <FiTool />
    </div>
    <h2 style={{ fontSize: 20 }}>{title}</h2>
    <p style={{ color: 'var(--color-gray)', fontSize: 14, maxWidth: 360 }}>
      This module is generated in the next batch. Say "Continue" to build it out.
    </p>
  </div>
);

export default ComingSoon;
