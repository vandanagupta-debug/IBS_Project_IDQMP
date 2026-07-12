import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiDatabase, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import './auth.css';

const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: 'ananya.sharma@dataforge.io', password: 'Passw0rd!', rememberMe: true } });

  const onSubmit = async (formData) => {
    setServerError('');
    try {
      const user = await login(formData);
      showToast(`Welcome back, ${user.name.split(' ')[0]}.`, 'success');
      const redirectTo = location.state?.from?.pathname || '/upload';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message || 'Something went wrong. Please try again.';
      setServerError(message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-glow" />
        <div className="auth-visual-content">
          <div className="auth-brand">
            <div className="auth-brand-icon"><FiDatabase /></div>
            <span>DataForge</span>
          </div>
          <h1 className="auth-visual-title">
            Turn raw data into<br />trusted decisions.
          </h1>
          <p className="auth-visual-sub">
            AI-powered profiling, validation, and cleaning for enterprise-scale datasets — built for teams who can't afford to guess.
          </p>

          <div className="auth-preview-card glass">
            <div className="auth-preview-row">
              <span>Overall Quality Score</span>
              <span className="badge badge-success"><FiCheckCircle /> Healthy</span>
            </div>
            <div className="auth-preview-gauge">
              <svg viewBox="0 0 120 70" className="gauge-svg">
                <path d="M10,65 A50,50 0 0,1 110,65" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" strokeLinecap="round" />
                <motion.path
                  d="M10,65 A50,50 0 0,1 110,65"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 0.874 }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                />
                <defs>
                  <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#5B93FF" />
                    <stop offset="100%" stopColor="#14B8A6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="auth-preview-score numeric">87.4%</span>
            </div>
            <div className="auth-preview-stats">
              <div><span className="numeric">128</span><small>Datasets</small></div>
              <div><span className="numeric">48.2M</span><small>Rows Scanned</small></div>
              <div><span className="numeric">3.4K</span><small>Issues Fixed</small></div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <motion.div
          className="auth-form-box"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2>Sign in to your workspace</h2>
          <p className="auth-form-subtitle">Enter your credentials to access the quality platform.</p>

          {serverError && <div className="auth-error-banner">{serverError}</div>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <div className={`form-input-wrap ${errors.email ? 'has-error' : ''}`}>
                <FiMail />
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  {...register('email', {
                    required: 'Email is required.',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address.' },
                  })}
                />
              </div>
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className={`form-input-wrap ${errors.password ? 'has-error' : ''}`}>
                <FiLock />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password', { required: 'Password is required.', minLength: { value: 6, message: 'Minimum 6 characters.' } })}
                />
                <button type="button" className="input-icon-btn" onClick={() => setShowPassword((s) => !s)} aria-label="Toggle password visibility">
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password.message}</span>}
            </div>

            <div className="auth-form-row">
              <label className="checkbox-label">
                <input type="checkbox" {...register('rememberMe')} />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
            </div>

            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
              {!isSubmitting && <FiArrowRight />}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register" className="auth-link">Create one</Link>
          </p>

          <div className="auth-demo-hint">
            Demo credentials are pre-filled — just click <b>Sign In</b>.
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
