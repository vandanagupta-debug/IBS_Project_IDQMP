import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiArrowRight, FiDatabase, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { forgotPasswordRequest } from '../../api/authApi';
import '../Login/auth.css';

const ForgotPassword = () => {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (formData) => {
    setServerError('');
    try {
      await forgotPasswordRequest(formData);
      setSent(true);
    } catch (err) {
      setServerError('Unable to send reset instructions. Please try again.');
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
          <h1 className="auth-visual-title">Locked out?<br />We've got you.</h1>
          <p className="auth-visual-sub">
            Enter the email tied to your workspace and we'll send secure reset instructions right away.
          </p>
        </div>
      </div>

      <div className="auth-form-panel">
        <motion.div className="auth-form-box" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {!sent ? (
            <>
              <h2>Reset your password</h2>
              <p className="auth-form-subtitle">We'll email you a link to reset it.</p>

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
                      {...register('email', { required: 'Email is required.', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email.' } })}
                    />
                  </div>
                  {errors.email && <span className="field-error">{errors.email.message}</span>}
                </div>

                <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                  {!isSubmitting && <FiArrowRight />}
                </button>
              </form>
            </>
          ) : (
            <div className="auth-success-block">
              <div className="auth-success-icon"><FiCheckCircle /></div>
              <h2>Check your inbox</h2>
              <p className="auth-form-subtitle">
                We've sent reset instructions to <b>{getValues('email')}</b>.
              </p>
            </div>
          )}

          <p className="auth-switch">
            <Link to="/" className="auth-link"><FiArrowLeft style={{ verticalAlign: 'middle' }} /> Back to sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
