import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';

const ProfilePage = () => {
    const { updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_new_password: '',
    });

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        role: '',
        location: '',
        age: '',
        gender: '',
        phone: '',
        bio: '',
        created_at: '',
    });

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const response = await userService.getProfile();
            const user = response.data.user;
            setProfile({
                name: user.name || '',
                email: user.email || '',
                role: user.role || '',
                location: user.location || '',
                age: user.age || '',
                gender: user.gender || '',
                phone: user.phone || '',
                bio: user.bio || '',
                created_at: user.created_at || '',
            });
            setError('');
        } catch (err) {
            setError('Failed to load profile');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!profile.name.trim()) {
            setError('Name is required');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const response = await userService.updateProfile({
                name: profile.name,
                location: profile.location,
                age: profile.age,
                gender: profile.gender,
                phone: profile.phone,
                bio: profile.bio,
            });
            const updatedUser = response.data.user;
            updateUser({ name: updatedUser.name });
            setSuccess('Profile saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to update profile';
            setError(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_new_password) {
            setError('All password fields are required');
            return;
        }

        if (passwordForm.new_password !== passwordForm.confirm_new_password) {
            setError('New password and confirm password must match');
            return;
        }

        setPasswordSaving(true);
        setError('');
        setSuccess('');

        try {
            await userService.changePassword(
                passwordForm.current_password,
                passwordForm.new_password,
                passwordForm.confirm_new_password
            );

            setPasswordForm({
                current_password: '',
                new_password: '',
                confirm_new_password: '',
            });
            setSuccess('Password changed successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to change password');
        } finally {
            setPasswordSaving(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen={false} />;
    }

    return (
        <div className="container mt-4">
            <BackLink to="/dashboard" label="Back to Dashboard" />
            <h1 style={{ color: '#003594' }}>My Profile</h1>

            {error && (
                <div 
                    className="alert alert-danger" 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                        borderRadius: 0,
                        margin: 0,
                    }}
                >
                    {error}
                </div>
            )}
            {success && (
                <div 
                    className="alert alert-success" 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                        borderRadius: 0,
                        margin: 0,
                    }}
                >
                    {success}
                </div>
            )}

            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                {/* Read-only Info */}
                <div className="card" style={{ marginBottom: '24px' }}>
                    <div className="card-body">
                        <h2 style={{ marginTop: 0, color: '#003594' }}>Account Info</h2>
                        <div className="responsive-three-col-grid" style={{ gap: '16px' }}>
                            <div>
                                <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>Email</p>
                                <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>{profile.email}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>Role</p>
                                <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', textTransform: 'capitalize' }}>{profile.role}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>Member Since</p>
                                <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>
                                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editable Profile Form */}
                <div className="card">
                    <div className="card-body">
                        <h2 style={{ marginTop: 0, color: '#003594' }}>Edit Profile</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={profile.name}
                                    onChange={handleChange}
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div className="responsive-two-col-grid" style={{ gap: '16px' }}>
                                <div className="form-group">
                                    <label>Age</label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={profile.age}
                                        onChange={handleChange}
                                        min="1"
                                        max="150"
                                        placeholder="Enter your age"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Gender</label>
                                    <select
                                        name="gender"
                                        value={profile.gender}
                                        onChange={handleChange}
                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '1rem' }}
                                    >
                                        <option value="">Select gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>

                            <div className="responsive-two-col-grid" style={{ gap: '16px' }}>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={profile.phone}
                                        onChange={handleChange}
                                        placeholder="Enter your phone number"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={profile.location}
                                        onChange={handleChange}
                                        placeholder="City, Country"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Bio</label>
                                <textarea
                                    name="bio"
                                    value={profile.bio}
                                    onChange={handleChange}
                                    placeholder="Tell us about yourself..."
                                    rows="4"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-success"
                                disabled={saving}
                                style={{ width: '100%', padding: '12px' }}
                            >
                                {saving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="card" style={{ marginTop: '24px' }}>
                    <div className="card-body">
                        <h2 style={{ marginTop: 0, color: '#003594' }}>Change Password</h2>
                        <p style={{ color: '#666', marginTop: 0 }}>
                            Enter your current password, then set a new password.
                        </p>

                        <form onSubmit={handlePasswordSubmit}>
                            <div className="form-group">
                                <label>Current Password *</label>
                                <input
                                    type="password"
                                    name="current_password"
                                    value={passwordForm.current_password}
                                    onChange={handlePasswordChange}
                                    autoComplete="current-password"
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div className="responsive-two-col-grid" style={{ gap: '16px' }}>
                                <div className="form-group">
                                    <label>New Password *</label>
                                    <input
                                        type="password"
                                        name="new_password"
                                        value={passwordForm.new_password}
                                        onChange={handlePasswordChange}
                                        autoComplete="new-password"
                                        required
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Confirm New Password *</label>
                                    <input
                                        type="password"
                                        name="confirm_new_password"
                                        value={passwordForm.confirm_new_password}
                                        onChange={handlePasswordChange}
                                        autoComplete="new-password"
                                        required
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={passwordSaving}
                                style={{ width: '100%', padding: '12px' }}
                            >
                                {passwordSaving ? 'Updating Password...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
