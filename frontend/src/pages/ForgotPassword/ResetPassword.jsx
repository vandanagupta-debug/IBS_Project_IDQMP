import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiArrowRight, FiDatabase } from 'react-icons/fi';
import { resetPasswordRequest } from '../../api/authApi';
import { useToast } from '../../contexts/ToastContext';
import '../Login/auth.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (formData) => {
    await resetPasswordRequest({ token: 'mock-token', newPassword: formData.password });
    showToast('Password reset successfully. Please sign in.', 'success');
    navigate('/', { replace: true });
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
          <h1 className="auth-visual-title">Choose a new<br />password.</h1>
          <p className="auth-visual-sub">Make it strong — at least 6 characters, ideally a mix of letters, numbers, and symbols.</p>
        </div>
      </div>

      <div className="auth-form-panel">
        <motion.div className="auth-form-box" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h2>Set a new password</h2>
          <p className="auth-form-subtitle">Your new password must be different from previous ones.</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-field">
              <label htmlFor="password">New password</label>
              <div className={`form-input-wrap ${errors.password ? 'has-error' : ''}`}>
                <FiLock />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  {...register('password', { required: 'Password is required.', minLength: { value: 6, message: 'Minimum 6 characters.' } })}
                />
                <button type="button" className="input-icon-btn" onClick={() => setShowPassword((s) => !s)}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password.message}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword">Confirm new password</label>
              <div className={`form-input-wrap ${errors.confirmPassword ? 'has-error' : ''}`}>
                <FiLock />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password.',
                    validate: (value) => value === watch('password') || 'Passwords do not match.',
                  })}
                />
              </div>
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
              {!isSubmitting && <FiArrowRight />}
            </button>
          </form>

          <p className="auth-switch">
            <Link to="/" className="auth-link">Back to sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
