import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiSettings, FiMoon, FiSun, FiMail, FiGlobe, FiLock, FiKey, FiCopy, FiRefreshCw } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { changePasswordRequest } from '../../api/authApi';
import '../../styles/page-layout.css';
import './settings.css';

const Settings = () => {
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [dashboardNotifs, setDashboardNotifs] = useState(true);
  const [language, setLanguage] = useState('en');
  const [apiKey, setApiKey] = useState('dqp_live_sk_8f2a9c1e4b7d3f5a6e9c2b1a8d7f3e5c');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onChangePassword = async (formData) => {
    await changePasswordRequest(formData);
    showToast('Password changed successfully.', 'success');
    reset();
  };

  const regenerateKey = () => {
    const newKey = 'dqp_live_sk_' + Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 10);
    setApiKey(newKey);
    showToast('API key regenerated. Update your integrations.', 'warning');
  };

  const copyKey = () => {
    navigator.clipboard?.writeText(apiKey);
    showToast('API key copied to clipboard.', 'info');
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1><FiSettings style={{ verticalAlign: 'middle' }} /> Settings</h1>
          <p className="page-subtitle">Manage your workspace preferences, security, and integrations.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card panel-card">
          <div className="panel-card-header"><div><h3>Appearance</h3><span className="panel-subtitle">Personalize how DataForge looks</span></div></div>
          <div className="settings-row">
            <div className="settings-row-label">
              <span className="settings-row-icon">{isDark ? <FiMoon /> : <FiSun />}</span>
              <div>
                <p>Dark Mode</p>
                <span>Switch between light and dark theme</span>
              </div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={isDark} onChange={toggleTheme} />
              <span className="switch-track" />
            </label>
          </div>

          <div className="settings-row">
            <div className="settings-row-label">
              <span className="settings-row-icon"><FiGlobe /></span>
              <div>
                <p>Language</p>
                <span>Choose your preferred interface language</span>
              </div>
            </div>
            <select className="settings-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>

        <div className="card panel-card">
          <div className="panel-card-header"><div><h3>Notifications</h3><span className="panel-subtitle">Choose how you'd like to be notified</span></div></div>
          <div className="settings-row">
            <div className="settings-row-label">
              <span className="settings-row-icon"><FiMail /></span>
              <div>
                <p>Email Notifications</p>
                <span>Receive alerts and reports via email</span>
              </div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={emailNotifs} onChange={() => setEmailNotifs((v) => !v)} />
              <span className="switch-track" />
            </label>
          </div>
          <div className="settings-row">
            <div className="settings-row-label">
              <span className="settings-row-icon"><FiSettings /></span>
              <div>
                <p>Summary Notifications</p>
                <span>Show in-app alerts on the notification bell</span>
              </div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={dashboardNotifs} onChange={() => setDashboardNotifs((v) => !v)} />
              <span className="switch-track" />
            </label>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card panel-card">
          <div className="panel-card-header"><div><h3><FiLock style={{ verticalAlign: 'middle' }} /> Change Password</h3><span className="panel-subtitle">Update your account password</span></div></div>
          <form onSubmit={handleSubmit(onChangePassword)}>
            <div className="form-field">
              <label>Current Password</label>
              <div className={`form-input-wrap ${errors.currentPassword ? 'has-error' : ''}`}>
                <input type="password" placeholder="Enter current password" {...register('currentPassword', { required: 'Required.' })} />
              </div>
              {errors.currentPassword && <span className="field-error">{errors.currentPassword.message}</span>}
            </div>
            <div className="form-field">
              <label>New Password</label>
              <div className={`form-input-wrap ${errors.newPassword ? 'has-error' : ''}`}>
                <input type="password" placeholder="Enter new password" {...register('newPassword', { required: 'Required.', minLength: { value: 6, message: 'Minimum 6 characters.' } })} />
              </div>
              {errors.newPassword && <span className="field-error">{errors.newPassword.message}</span>}
            </div>
            <div className="form-field">
              <label>Confirm New Password</label>
              <div className={`form-input-wrap ${errors.confirmNewPassword ? 'has-error' : ''}`}>
                <input type="password" placeholder="Re-enter new password" {...register('confirmNewPassword', { validate: (v) => v === watch('newPassword') || 'Passwords do not match.' })} />
              </div>
              {errors.confirmNewPassword && <span className="field-error">{errors.confirmNewPassword.message}</span>}
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Password'}</button>
          </form>
        </div>

        <div className="card panel-card">
          <div className="panel-card-header"><div><h3><FiKey style={{ verticalAlign: 'middle' }} /> API Keys</h3><span className="panel-subtitle">Use this key to authenticate API requests</span></div></div>
          <div className="api-key-box">
            <code>{apiKey}</code>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="btn btn-ghost" onClick={copyKey}><FiCopy /> Copy</button>
            <button className="btn btn-danger-outline" onClick={regenerateKey}><FiRefreshCw /> Regenerate</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
