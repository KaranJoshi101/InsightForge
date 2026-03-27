import React, { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [banning, setBanning] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

    const fetchUsers = useCallback(async (page = 1, search = '') => {
        try {
            setLoading(true);
            const response = await userService.getAllUsers(page, 20, search);
            setUsers(response.data.users || []);
            setPagination(response.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
            setError('');
        } catch (err) {
            setError('Failed to load users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(1, searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchUsers]);

    const handleBan = async (userId) => {
        if (!window.confirm('Are you sure you want to ban this user?')) return;
        try {
            setBanning(userId);
            await userService.banUser(userId);
            setUsers(users.map((u) => (u.id === userId ? { ...u, is_banned: true } : u)));
            setSuccess('User banned successfully');
            setError('');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to ban user');
        } finally {
            setBanning(null);
        }
    };

    const handleUnban = async (userId) => {
        if (!window.confirm('Are you sure you want to unban this user?')) return;
        try {
            setBanning(userId);
            await userService.unbanUser(userId);
            setUsers(users.map((u) => (u.id === userId ? { ...u, is_banned: false } : u)));
            setSuccess('User unbanned successfully');
            setError('');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to unban user');
        } finally {
            setBanning(null);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Permanently delete this banned user? This action cannot be undone.')) return;
        try {
            setDeleting(userId);
            await userService.deleteUser(userId);
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            setPagination((prev) => ({
                ...prev,
                total: Math.max(0, (prev.total || 0) - 1),
            }));

            if (selectedUser?.id === userId) {
                setSelectedUser(null);
            }

            setSuccess('User deleted permanently');
            setError('');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete user');
        } finally {
            setDeleting(null);
        }
    };

    if (loading && users.length === 0) {
        return <LoadingSpinner fullScreen={false} />;
    }

    return (
        <div className="container mt-4">
            <BackLink to="/admin" label="Back to Admin" />
            <h1 style={{ color: '#003594', marginBottom: '24px' }}>Users Management</h1>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Search */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-body">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <p style={{ margin: '8px 0 0 0', color: '#888', fontSize: '0.85rem' }}>
                        Showing {users.length} of {pagination.total} users
                    </p>
                </div>
            </div>

            {/* Users Table */}
            {users.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: '#666' }}>No users found</p>
                </div>
            ) : (
                <table className="card">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td style={{ padding: '12px' }}>{user.id}</td>
                                <td style={{ padding: '12px' }}>
                                    <strong>{user.name}</strong>
                                </td>
                                <td style={{ padding: '12px' }}>{user.email}</td>
                                <td style={{ padding: '12px' }}>
                                    <span
                                        style={{
                                            backgroundColor: user.role === 'admin' ? '#e8f0fe' : '#E8E9EE',
                                            color: user.role === 'admin' ? '#003594' : '#555',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        {user.role}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <span
                                        style={{
                                            backgroundColor: user.is_banned ? '#fde8e8' : '#e8f8f0',
                                            color: user.is_banned ? '#922b21' : '#1a6e42',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        {user.is_banned ? 'Banned' : 'Active'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <button
                                        onClick={() => setSelectedUser(user)}
                                        className="btn btn-primary"
                                        style={{ padding: '4px 8px', fontSize: '0.85rem', marginRight: '4px' }}
                                    >
                                        View
                                    </button>
                                    {user.role !== 'admin' && (
                                        user.is_banned ? (
                                            <button
                                                onClick={() => handleUnban(user.id)}
                                                className="btn btn-success"
                                                disabled={banning === user.id}
                                                style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                                            >
                                                {banning === user.id ? 'Unbanning...' : 'Unban'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleBan(user.id)}
                                                className="btn btn-danger"
                                                disabled={banning === user.id}
                                                style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                                            >
                                                {banning === user.id ? 'Banning...' : 'Ban'}
                                            </button>
                                        )
                                    )}
                                    {user.role !== 'admin' && user.is_banned && (
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="btn btn-danger"
                                            disabled={deleting === user.id || banning === user.id}
                                            style={{ padding: '4px 8px', fontSize: '0.85rem', marginLeft: '4px', backgroundColor: '#922b21' }}
                                        >
                                            {deleting === user.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                    <button
                        className="btn"
                        style={{ color: '#003594' }}
                        disabled={pagination.page <= 1}
                        onClick={() => fetchUsers(pagination.page - 1, searchQuery)}
                    >
                        Previous
                    </button>
                    <span style={{ padding: '8px 12px' }}>
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                        className="btn"
                        style={{ color: '#003594' }}
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => fetchUsers(pagination.page + 1, searchQuery)}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* User Detail Modal */}
            {selectedUser && (
                <div
                    onClick={() => setSelectedUser(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            padding: '32px',
                            maxWidth: '500px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#003594' }}>User Profile</h2>
                            <button
                                onClick={() => setSelectedUser(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#666',
                                    padding: '4px 8px',
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                            <span style={{
                                backgroundColor: selectedUser.role === 'admin' ? '#e8f0fe' : '#E8E9EE',
                                color: selectedUser.role === 'admin' ? '#003594' : '#555',
                                padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold',
                            }}>
                                {selectedUser.role}
                            </span>
                            <span style={{
                                backgroundColor: selectedUser.is_banned ? '#fde8e8' : '#e8f8f0',
                                color: selectedUser.is_banned ? '#922b21' : '#1a6e42',
                                padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold',
                            }}>
                                {selectedUser.is_banned ? 'Banned' : 'Active'}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Name</p>
                                <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>{selectedUser.name}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Email</p>
                                <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>{selectedUser.email}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Age</p>
                                <p style={{ margin: '4px 0 0 0' }}>{selectedUser.age || 'Not provided'}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Gender</p>
                                <p style={{ margin: '4px 0 0 0' }}>{selectedUser.gender || 'Not provided'}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Phone</p>
                                <p style={{ margin: '4px 0 0 0' }}>{selectedUser.phone || 'Not provided'}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Location</p>
                                <p style={{ margin: '4px 0 0 0' }}>{selectedUser.location || 'Not provided'}</p>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Bio</p>
                                <p style={{ margin: '4px 0 0 0' }}>{selectedUser.bio || 'Not provided'}</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Member Since</p>
                                <p style={{ margin: '4px 0 0 0' }}>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;
