import './layout.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <span>© {new Date().getFullYear()} DataForge. All rights reserved.</span>
      <span className="app-footer-links">
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <a href="#">Documentation</a>
        <span className="app-footer-version numeric">v1.0.0</span>
      </span>
    </footer>
  );
};

export default Footer;
