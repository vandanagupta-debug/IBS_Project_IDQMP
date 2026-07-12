import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiDatabase } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import '../Login/auth.css';

const Register = () => {
  const { register: registerUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (formData) => {
    setServerError('');
    try {
      const user = await registerUser(formData);
      showToast(`Account created. Welcome, ${user.name.split(' ')[0]}!`, 'success');
      navigate('/upload', { replace: true });
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Registration failed. Please try again.');
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
          <h1 className="auth-visual-title">Join a smarter<br />data workflow.</h1>
          <p className="auth-visual-sub">
            Set up your workspace in minutes and start profiling, validating, and cleaning datasets with AI assistance.
          </p>
        </div>
      </div>

      <div className="auth-form-panel">
        <motion.div className="auth-form-box" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h2>Create your account</h2>
          <p className="auth-form-subtitle">Start your free workspace on DataForge.</p>

          {serverError && <div className="auth-error-banner">{serverError}</div>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-field">
              <label htmlFor="name">Full name</label>
              <div className={`form-input-wrap ${errors.name ? 'has-error' : ''}`}>
                <FiUser />
                <input id="name" placeholder="Jane Doe" {...register('name', { required: 'Name is required.' })} />
              </div>
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <div className={`form-input-wrap ${errors.email ? 'has-error' : ''}`}>
                <FiMail />
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  {...register('email', { required: 'Email is required.', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email.' } })}
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
                  placeholder="Create a password"
                  {...register('password', { required: 'Password is required.', minLength: { value: 6, message: 'Minimum 6 characters.' } })}
                />
                <button type="button" className="input-icon-btn" onClick={() => setShowPassword((s) => !s)}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password.message}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <div className={`form-input-wrap ${errors.confirmPassword ? 'has-error' : ''}`}>
                <FiLock />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password.',
                    validate: (value) => value === watch('password') || 'Passwords do not match.',
                  })}
                />
              </div>
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
              {!isSubmitting && <FiArrowRight />}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/" className="auth-link">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
