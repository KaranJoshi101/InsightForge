import React, { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';
import LoadingSpinner from '../components/LoadingSpinner';
import BackLink from '../components/BackLink';
import Button from '../components/ui/Button';
import Card, { CardBody, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';

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
        <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
            <BackLink to="/admin" label="Back to Admin" />
            <Card>
                <CardHeader>
                    <h1 className="text-2xl font-semibold text-slate-900">Users Management</h1>
                    <p className="mt-1 text-sm text-slate-500">View users, update account status, and manage access.</p>
                </CardHeader>
            </Card>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

            <Card>
                <CardBody>
                    <Input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <p className="mt-2 text-xs text-slate-500">
                        Showing {users.length} of {pagination.total} users
                    </p>
                </CardBody>
            </Card>

            {users.length === 0 ? (
                <Card>
                    <CardBody>
                        <p className="text-sm text-slate-600">No users found</p>
                    </CardBody>
                </Card>
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                                <th className="px-4 py-3">ID</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Joined</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-slate-100 transition-all duration-200 hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-600">{user.id}</td>
                                    <td className="px-4 py-3 text-slate-800">
                                        <strong>{user.name}</strong>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{user.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={[
                                            'rounded-md border px-2 py-1 text-xs font-medium',
                                            user.role === 'admin'
                                                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                                : 'border-slate-200 bg-slate-50 text-slate-700',
                                        ].join(' ')}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={[
                                            'rounded-md border px-2 py-1 text-xs font-medium',
                                            user.is_banned
                                                ? 'border-red-200 bg-red-50 text-red-700'
                                                : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                                        ].join(' ')}>
                                            {user.is_banned ? 'Banned' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-2">
                                            <Button onClick={() => setSelectedUser(user)} variant="outline" size="sm">
                                                View
                                            </Button>
                                            {user.role !== 'admin' && (
                                                user.is_banned ? (
                                                    <Button
                                                        onClick={() => handleUnban(user.id)}
                                                        variant="solid"
                                                        size="sm"
                                                        disabled={banning === user.id}
                                                    >
                                                        {banning === user.id ? 'Unbanning...' : 'Unban'}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleBan(user.id)}
                                                        variant="danger"
                                                        size="sm"
                                                        disabled={banning === user.id}
                                                    >
                                                        {banning === user.id ? 'Banning...' : 'Ban'}
                                                    </Button>
                                                )
                                            )}
                                            {user.role !== 'admin' && Boolean(user.is_banned) && (
                                                <Button
                                                    onClick={() => handleDelete(user.id)}
                                                    variant="danger"
                                                    size="sm"
                                                    disabled={deleting === user.id || banning === user.id}
                                                >
                                                    {deleting === user.id ? 'Deleting...' : 'Delete'}
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </Card>
            )}

            {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <Button
                        variant="outline"
                        disabled={pagination.page <= 1}
                        onClick={() => fetchUsers(pagination.page - 1, searchQuery)}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-slate-600">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                        variant="outline"
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => fetchUsers(pagination.page + 1, searchQuery)}
                    >
                        Next
                    </Button>
                </div>
            )}

            {selectedUser && (
                <div
                    onClick={() => setSelectedUser(null)}
                    className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-md"
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">User Profile</h2>
                            <Button onClick={() => setSelectedUser(null)} variant="outline" size="sm">Close</Button>
                        </div>

                        <div className="mb-5 flex gap-2">
                            <span className={[
                                'rounded-md border px-2 py-1 text-xs font-medium',
                                selectedUser.role === 'admin'
                                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                    : 'border-slate-200 bg-slate-50 text-slate-700',
                            ].join(' ')}>
                                {selectedUser.role}
                            </span>
                            <span className={[
                                'rounded-md border px-2 py-1 text-xs font-medium',
                                selectedUser.is_banned
                                    ? 'border-red-200 bg-red-50 text-red-700'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                            ].join(' ')}>
                                {selectedUser.is_banned ? 'Banned' : 'Active'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-slate-500">Name</p>
                                <p className="mt-1 text-sm font-semibold text-slate-800">{selectedUser.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Email</p>
                                <p className="mt-1 text-sm font-semibold text-slate-800">{selectedUser.email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Age</p>
                                <p className="mt-1 text-sm text-slate-700">{selectedUser.age || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Gender</p>
                                <p className="mt-1 text-sm text-slate-700">{selectedUser.gender || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Phone</p>
                                <p className="mt-1 text-sm text-slate-700">{selectedUser.phone || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Location</p>
                                <p className="mt-1 text-sm text-slate-700">{selectedUser.location || 'Not provided'}</p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-xs text-slate-500">Bio</p>
                                <p className="mt-1 text-sm text-slate-700">{selectedUser.bio || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Member Since</p>
                                <p className="mt-1 text-sm text-slate-700">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;
