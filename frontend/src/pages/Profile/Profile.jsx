import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiUser, FiMail, FiShield, FiClock, FiEdit2, FiCamera } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { updateProfileRequest } from '../../api/authApi';
import '../../styles/page-layout.css';
import './profile.css';

const ROLE_BADGE = {
  Admin: 'badge-danger',
  Analyst: 'badge-info',
  Viewer: 'badge-success',
};

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({ defaultValues: { name: user?.name, email: user?.email } });

  const onSave = async (formData) => {
    const { data } = await updateProfileRequest(formData);
    updateUser(data);
    showToast('Profile updated successfully.', 'success');
    setEditing(false);
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1><FiUser style={{ verticalAlign: 'middle' }} /> User Profile</h1>
          <p className="page-subtitle">Manage your personal information and account details.</p>
        </div>
      </div>

      <div className="grid-2-1">
        <div className="card panel-card">
          <div className="panel-card-header">
            <div><h3>Profile Information</h3><span className="panel-subtitle">Update your name and email</span></div>
            {!editing && (
              <button className="btn btn-ghost" onClick={() => setEditing(true)}><FiEdit2 /> Edit</button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit(onSave)}>
              <div className="form-field">
                <label>Full Name</label>
                <div className="form-input-wrap"><FiUser /><input {...register('name', { required: true })} /></div>
              </div>
              <div className="form-field">
                <label>Email Address</label>
                <div className="form-input-wrap"><FiMail /><input type="email" {...register('email', { required: true })} /></div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="profile-info-list">
              <div><span>Full Name</span><b>{user?.name}</b></div>
              <div><span>Email</span><b>{user?.email}</b></div>
              <div><span>Role</span><b className={`badge ${ROLE_BADGE[user?.role]}`}><FiShield /> {user?.role}</b></div>
              <div><span>Last Login</span><b><FiClock style={{ verticalAlign: 'middle' }} /> {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—'}</b></div>
            </div>
          )}
        </div>

        <div className="card panel-card profile-avatar-card">
          <div className="profile-avatar-wrap">
            <img src={user?.avatar} alt={user?.name} className="profile-avatar-img" />
            <button className="profile-avatar-edit" title="Change photo"><FiCamera /></button>
          </div>
          <h3>{user?.name}</h3>
          <p className="profile-avatar-email">{user?.email}</p>
          <span className={`badge ${ROLE_BADGE[user?.role]}`}>{user?.role}</span>
        </div>
      </div>
    </div>
  );
};

export default Profile;
