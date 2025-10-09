import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Edit2, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '../AuthContext';

// ==================== TOAST NOTIFICATION COMPONENT ====================
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
      icon: <Check size={20} className="text-white" />
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500 to-rose-600',
      icon: <X size={20} className="text-white" />
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      icon: <Users size={20} className="text-white" />
    }
  };

  const style = styles[type] || styles.success;

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-slideInRight">
      <div className={`${style.bg} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[320px] max-w-[500px] transform transition-all duration-300 hover:scale-105`}>
        <div className="flex-shrink-0 animate-bounce">{style.icon}</div>
        <p className="flex-1 m-0 text-sm font-medium">{message}</p>
        <button 
          onClick={onClose}
          className="flex-shrink-0 hover:bg-white/20 rounded-full p-1 transition-all duration-300 hover:rotate-90 hover:scale-110"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function AssignUsers({ user }) {
  const { apiRequest, isAdmin, updateUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    userType: 'user' 
  });
  const [editingUser, setEditingUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [editValidationErrors, setEditValidationErrors] = useState({});
  const [toast, setToast] = useState(null);
  
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchUsers = async () => {
      try {
        const response = await apiRequest('http://localhost:3001/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          const error = await response.json();
          console.error('Error fetching users:', error);
          setUsers([]);
        }
      } catch (error) {
        console.error('Network error fetching users:', error);
        setUsers([]);
      }
    };

    fetchUsers();
  }, [isAdmin, apiRequest]);

  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return `http://localhost:3001/${imagePath.replace(/^\/+/, '')}`;
  };

  const validateUser = (userData, isEditing = false) => {
    const errors = {};
    
    if (!userData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (userData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters long';
    } else if (userData.name.trim().length > 50) {
      errors.name = 'Full name must be less than 50 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(userData.name.trim())) {
      errors.name = 'Full name should only contain letters and spaces';
    }
    
    if (!userData.email.trim()) {
      errors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email.trim())) {
        errors.email = 'Please enter a valid email address';
      } else {
        const existingUser = users.find(u => 
          u.email.toLowerCase() === userData.email.toLowerCase() && 
          (!isEditing || u.id !== editingId)
        );
        if (existingUser) {
          errors.email = 'Email address already exists';
        }
      }
    }
    
    if (!isEditing && !userData.password.trim()) {
      errors.password = 'Password is required';
    } else if (userData.password && userData.password.trim()) {
      if (userData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
      } else if (userData.password.length > 100) {
        errors.password = 'Password must be less than 100 characters';
      } else if (!/(?=.*[a-z])/.test(userData.password)) {
        errors.password = 'Password must contain at least one lowercase letter';
      } else if (!/(?=.*[A-Z])/.test(userData.password)) {
        errors.password = 'Password must contain at least one uppercase letter';
      } else if (!/(?=.*\d)/.test(userData.password)) {
        errors.password = 'Password must contain at least one number';
      }
    }
    
    if (!['user', 'admin'].includes(userData.userType)) {
      errors.userType = 'Please select a valid user type';
    }
    
    return errors;
  };

  const handleNewUserChange = (field, value) => {
    const updatedUser = { ...newUser, [field]: value };
    setNewUser(updatedUser);
    const errors = validateUser(updatedUser);
    setValidationErrors(errors);
  };

  const handleEditUserChange = (field, value) => {
    const updatedUser = { ...editingUser, [field]: value };
    setEditingUser(updatedUser);
    const errors = validateUser(updatedUser, true);
    setEditValidationErrors(errors);
  };

  const addUser = async () => {
    if (!isAdmin) return;
    
    const errors = validateUser(newUser);
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    try {
      const response = await apiRequest('http://localhost:3001/users', {
        method: 'POST',
        body: JSON.stringify({ 
          ...newUser, 
          name: newUser.name.trim(),
          email: newUser.email.trim().toLowerCase()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers([...users, { 
          id: data.id, 
          name: data.name, 
          email: data.email, 
          userType: data.userType,
          profile_image: data.profile_image || null  
        }]);

        setNewUser({ name: '', email: '', password: '', userType: 'user' });
        setValidationErrors({});
        showToast('User added successfully!', 'success');
      } else {
        const err = await response.json();
        showToast('Error: ' + err.error, 'error');
      }
    } catch (error) {
      showToast('Network error: ' + error.message, 'error');
    }
  };

  const deleteUser = async (userId) => {
    if (!isAdmin) return;
    
    if (userId === user.id) {
      showToast('You cannot delete your own account', 'error');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const response = await apiRequest(`http://localhost:3001/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        showToast('User deleted successfully!', 'success');
      } else {
        const err = await response.json();
        showToast('Failed to delete user: ' + err.error, 'error');
      }
    } catch (error) {
      showToast('Network error: ' + error.message, 'error');
    }
  };

  const startEditing = (userToEdit) => {
    if (!isAdmin) return;
    setEditingId(userToEdit.id);
    setEditingUser({ ...userToEdit, password: '' });
    setEditValidationErrors({});
  };

  const saveEdit = async () => {
    if (!isAdmin || !editingUser) return;
    
    const errors = validateUser(editingUser, true);
    setEditValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    const payload = { 
      ...editingUser, 
      name: editingUser.name.trim(),
      email: editingUser.email.trim().toLowerCase()
    };
    if (!payload.password || !payload.password.trim()) {
      delete payload.password;
    }

    try {
      const response = await apiRequest(`http://localhost:3001/users/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const updated = await response.json();

        const updatedUserWithProps = {
          ...updated,
          id: editingId,
          profile_image: updated.profile_image || editingUser.profile_image || null
        };

        setUsers(users.map(u => u.id === editingId ? updatedUserWithProps : u));
        
        if (editingId === user.id) {
          updateUser(updatedUserWithProps);
        }
        
        setEditingId(null);
        setEditingUser(null);
        setEditValidationErrors({});
        showToast('User updated successfully!', 'success');
      } else {
        const err = await response.json();
        showToast('Failed to update user: ' + err.error, 'error');
      }
    } catch (error) {
      showToast('Network error: ' + error.message, 'error');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingUser(null);
    setEditValidationErrors({});
  };

  const handleProfileImageUpload = async (e, userId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const response = await apiRequest(`http://localhost:3001/users/${userId}/profile-image`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const updated = { ...editingUser, profile_image: data.imagePath };
        setEditingUser(updated);
        setUsers(users.map(u => u.id === userId ? updated : u));
        
        if (userId === user.id) {
          updateUser({ profileImage: data.imagePath });
        }

        showToast('Profile image uploaded successfully!', 'success');
      } else {
        showToast('Failed to upload image', 'error');
      }
    } catch (error) {
      showToast('Error uploading image: ' + error.message, 'error');
    }
  };

  const handleProfileImageRemove = async (userId) => {
    try {
      const response = await apiRequest(`http://localhost:3001/users/${userId}/profile-image`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const updated = { ...editingUser, profile_image: null };
        setEditingUser(updated);
        setUsers(users.map(u => u.id === userId ? updated : u));
        
        if (userId === user.id) {
          updateUser({ profileImage: null });
        }
        
        showToast('Profile image removed successfully!', 'success');

      } else {
        showToast('Failed to remove image', 'error');
      }
    } catch (error) {
      showToast('Error removing image: ' + error.message, 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-full mx-auto p-6 bg-white/95 min-h-screen">
        <div className="text-center p-12 bg-red-100 rounded-xl border-2 border-red-200 animate-shake">
          <h2 className="text-red-600 mb-4 text-xl font-semibold">Access Denied</h2>
          <p className="text-slate-500">You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Custom Keyframes */}
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }

        .animate-slideInDown {
          animation: slideInDown 0.4s ease-out;
        }

        .animate-slideInUp {
          animation: slideInUp 0.4s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>

      <div className="max-w-full mx-auto p-6 bg-white/95 min-h-screen font-sans animate-fadeIn">
        {/* Toast Notification */}
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-[#2563eb] to-[#8b5cf6] rounded-xl p-6 text-white mb-8 shadow-xl animate-slideInDown relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 relative z-10">
            <Users size={32} className="animate-bounce" /> User Management
          </h1>
          <p className="opacity-90 relative z-10">Add, edit, and manage user accounts</p>
        </div>

        {/* Add User Section */}
        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] p-6 rounded-xl border-2 border-[#e2e8f0] mb-8 animate-slideInUp shadow-lg hover:shadow-xl transition-all duration-300">
          <h2 className="text-slate-800 mb-5 flex items-center gap-2 text-xl font-semibold">
            <UserPlus size={24} className="transition-transform duration-300 hover:scale-110 hover:rotate-12" /> Add New User
          </h2>
          <div className="flex gap-3 flex-wrap items-start">
            <div className="flex flex-col flex-1 min-w-[300px]">
              <input
                type="text"
                value={newUser.name}
                onChange={e => handleNewUserChange('name', e.target.value)}
                placeholder="Full Name (required)"
                className={`px-4 py-3 border-2 rounded-lg text-base outline-none transition-all duration-300 bg-white transform hover:scale-[1.01] focus:scale-[1.02] ${
                  validationErrors.name 
                    ? 'border-red-600 focus:ring-2 focus:ring-red-200 animate-shake' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                }`}
                maxLength={50}
              />
              {validationErrors.name && (
                <div className="text-red-600 text-sm font-medium mt-1 animate-slideInDown">{validationErrors.name}</div>
              )}
            </div>
            
            <div className="flex flex-col flex-1 min-w-[300px]">
              <input
                type="email"
                value={newUser.email}
                onChange={e => handleNewUserChange('email', e.target.value)}
                placeholder="Email Address (required)"
                className={`px-4 py-3 border-2 rounded-lg text-base outline-none transition-all duration-300 bg-white transform hover:scale-[1.01] focus:scale-[1.02] ${
                  validationErrors.email 
                    ? 'border-red-600 focus:ring-2 focus:ring-red-200 animate-shake' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                }`}
              />
              {validationErrors.email && (
                <div className="text-red-600 text-sm font-medium mt-1 animate-slideInDown">{validationErrors.email}</div>
              )}
            </div>
            
            <div className="flex flex-col flex-1 min-w-[300px]">
              <input
                type="password"
                value={newUser.password}
                onChange={e => handleNewUserChange('password', e.target.value)}
                placeholder="Password (min. 6 chars, 1 upper, 1 lower, 1 number)"
                className={`px-4 py-3 border-2 rounded-lg text-base outline-none transition-all duration-300 bg-white transform hover:scale-[1.01] focus:scale-[1.02] ${
                  validationErrors.password 
                    ? 'border-red-600 focus:ring-2 focus:ring-red-200 animate-shake' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                }`}
                maxLength={100}
              />
              {validationErrors.password && (
                <div className="text-red-600 text-sm font-medium mt-1 animate-slideInDown">{validationErrors.password}</div>
              )}
            </div>
            
            <div className="flex flex-col flex-1 min-w-[300px]">
              <select
                value={newUser.userType}
                onChange={e => handleNewUserChange('userType', e.target.value)}
                className={`px-4 py-3 border-2 rounded-lg text-base outline-none transition-all duration-300 bg-white transform hover:scale-[1.01] focus:scale-[1.02] ${
                  validationErrors.userType 
                    ? 'border-red-600 focus:ring-2 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                }`}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              {validationErrors.userType && (
                <div className="text-red-600 text-sm font-medium mt-1 animate-slideInDown">{validationErrors.userType}</div>
              )}
            </div>
            
            <button 
              onClick={addUser}
              className="flex items-center justify-center gap-2 w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-gradient-to-r from-[#2563eb] to-[#8b5cf6] hover:from-[#1e3a5f] hover:to-[#5b21b6] border border-white/30 text-white font-semibold cursor-pointer transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:scale-110 hover:rotate-12 active:scale-95 group relative overflow-hidden"
            >
              <UserPlus size={20} strokeWidth={2.4} className="relative z-10 transition-transform duration-300 group-hover:rotate-180" />
              <span className="absolute inset-0 bg-white/20 rounded-full transition-transform duration-500 scale-0 group-hover:scale-150" />
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="animate-slideInUp" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
          <h2 className="text-slate-800 mb-5 text-2xl font-semibold flex items-center gap-2">
            Existing Users 
            <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-[#2563eb] to-[#8b5cf6] text-white rounded-full text-sm font-bold animate-pulse">
              {users.length}
            </span>
          </h2>
          {users.length === 0 ? (
            <div className="text-center py-12 text-[#64748b] bg-[#f8fafc]/60 rounded-xl my-6 border-2 border-dashed border-[#e2e8f0] animate-pulse">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-lg mb-1 text-slate-800 font-medium">No users found</p>
              <p className="text-sm text-slate-500">Add your first user above to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {users.map((userItem, index) => (
                <div 
                  key={userItem.id} 
                  className="bg-white/95 border-2 border-[#e2e8f0] rounded-xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex items-start gap-4 relative overflow-hidden min-h-[100px] group"
                  style={{ 
                    animation: `scaleIn 0.4s ease-out ${index * 0.1}s backwards` 
                  }}
                >
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  {editingId === userItem.id ? (
                    <div className="w-full flex flex-col gap-3 relative z-10 animate-scaleIn">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#2563eb] to-[#8b5cf6] rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 transition-all duration-300 hover:scale-110 hover:rotate-12 shadow-lg">
                          {editingUser.profile_image ? (
                            <img
                              src={getProfileImageUrl(editingUser.profile_image)}
                              alt={editingUser.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            editingUser.name?.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            id={`edit-avatar-${editingId}`}
                            className="hidden"
                            onChange={(e) => handleProfileImageUpload(e, editingId)}
                          />

                          <label 
                            htmlFor={`edit-avatar-${editingId}`} 
                            className="px-3 py-1.5 text-sm font-medium rounded-md bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
                          >
                            Change
                          </label>

                          {editingUser.profile_image && (
                            <button
                              type="button"
                              className="px-3 py-1.5 text-sm font-medium rounded-md bg-red-600 text-white transition-all duration-300 hover:bg-red-700 hover:scale-105 hover:shadow-lg active:scale-95"
                              onClick={() => handleProfileImageRemove(editingId)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <input
                          type="text"
                          value={editingUser.name}
                          onChange={e => handleEditUserChange('name', e.target.value)}
                          className={`w-full px-3 py-2 border-2 rounded-md text-sm outline-none transition-all duration-300 transform hover:scale-[1.01] focus:scale-[1.02] ${
                            editValidationErrors.name 
                              ? 'border-red-600 focus:ring-2 focus:ring-red-200 animate-shake' 
                              : 'border-[#e2e8f0] focus:border-[#2563eb] focus:ring-2 focus:ring-[#e6f0ff]'
                          }`}
                          placeholder="Full Name (required)"
                          maxLength={50}
                        />
                        {editValidationErrors.name && (
                          <div className="text-red-600 text-sm font-medium mt-1 animate-slideInDown">{editValidationErrors.name}</div>
                        )}
                      </div>
                      
                      <div className="flex flex-col">
                        <input
                          type="email"
                          value={editingUser.email}
                          onChange={e => handleEditUserChange('email', e.target.value)}
                          className={`w-full px-3 py-2 border-2 rounded-md text-sm outline-none transition-all duration-300 transform hover:scale-[1.01] focus:scale-[1.02] ${
                            editValidationErrors.email 
                              ? 'border-red-600 focus:ring-2 focus:ring-red-200 animate-shake' 
                              : 'border-[#e2e8f0] focus:border-[#2563eb] focus:ring-2 focus:ring-[#e6f0ff]'
                          }`}
                          placeholder="Email Address (required)"
                        />
                        {editValidationErrors.email && (
                          <div className="text-red-600 text-sm font-medium mt-1 animate-slideInDown">{editValidationErrors.email}</div>
                        )}
                      </div>
                      
                      <div className="flex flex-col">
                        <input
                          type="password"
                          value={editingUser.password}
                          onChange={e => handleEditUserChange('password', e.target.value)}
                          className={`w-full px-3 py-2 border-2 rounded-md text-sm outline-none transition-all duration-300 transform hover:scale-[1.01] focus:scale-[1.02] ${
                            editValidationErrors.password 
                              ? 'border-red-600 focus:ring-2 focus:ring-red-200 animate-shake' 
                              : 'border-[#e2e8f0] focus:border-[#2563eb] focus:ring-2 focus:ring-[#e6f0ff]'
                          }`}
                          placeholder="New Password (leave blank to keep current)"
                          maxLength={100}
                        />
                        {editValidationErrors.password && (
                          <div className="text-red-600 text-sm font-medium mt-1 animate-slideInDown">{editValidationErrors.password}</div>
                        )}
                      </div>
                      
                      <div className="flex flex-col">
                        <select
                          value={editingUser.userType}
                          onChange={e => setEditingUser({ ...editingUser, userType: e.target.value })}
                          disabled={user.id === editingUser.id && user.userType === 'admin'}
                          className={`w-full px-3 py-2 border-2 rounded-md text-sm outline-none transition-all duration-300 border-[#e2e8
                            f0] focus:border-[#2563eb] focus:ring-2 focus:ring-[#e6f0ff] ${user.id === editingUser.id && user.userType === 'admin' ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>

                        {/* Show warning message */}
                        {user.id === editingUser.id && user.userType === 'admin' && (
                          <p className="text-sm text-amber-600 mt-1 animate-pulse">
                            ⚠️ You cannot change your own admin role
                          </p>
                        )}
                        {editValidationErrors.userType && (
                          <div className="text-red-600 text-sm font-medium mt-1 animate-slideInDown">{editValidationErrors.userType}</div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 justify-end mt-2">
                        <button 
                          onClick={saveEdit} 
                          className="px-3 py-2 bg-white/95 border border-black/10 rounded-lg cursor-pointer transition-all duration-300 flex items-center justify-center gap-1 text-green-600 hover:bg-green-50 hover:border-green-600 hover:scale-105 hover:shadow-md active:scale-95"
                        >
                          <Check size={16} className="transition-transform duration-300 hover:rotate-12" /> Save
                        </button>
                        <button 
                          onClick={cancelEdit} 
                          className="px-3 py-2 bg-white/95 border border-black/10 rounded-lg cursor-pointer transition-all duration-300 flex items-center justify-center gap-1 text-slate-600 hover:bg-slate-50 hover:border-slate-600 hover:scale-105 hover:shadow-md active:scale-95"
                        >
                          <X size={16} className="transition-transform duration-300 hover:rotate-90" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-gradient-to-br from-[#2563eb] to-[#8b5cf6] rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-lg group-hover:shadow-xl">
                        {userItem.profile_image ? (
                          <img
                            src={getProfileImageUrl(userItem.profile_image)}
                            alt={userItem.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          userItem.name?.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="flex-1 flex flex-col gap-1 min-w-0 pr-20 relative z-10">
                        <h3 className="m-0 text-[#1e293b] text-lg leading-tight break-words transition-colors duration-300 group-hover:text-[#2563eb]">
                          {userItem.name}
                        </h3>
                        <p className="m-0 text-[#64748b] text-sm leading-tight break-words">
                          {userItem.email}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase w-fit transition-all duration-300 hover:scale-105 ${
                          userItem.userType === 'admin' 
                            ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white shadow-md hover:shadow-lg' 
                            : 'bg-[#f1f5f9] text-[#1e293b] hover:bg-[#e2e8f0]'
                        }`}>
                          {userItem.userType.toUpperCase()}
                        </span>
                        {userItem.id === user.id && (
                          <span className="block text-xs text-teal-600 font-bold mt-1 animate-pulse">
                            (You)
                          </span>
                        )}
                      </div>
                      
                      <div className="flex mt-2.5 gap-2 flex-shrink-0 absolute top-5 right-5 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={() => startEditing(userItem)} 
                          className="p-2 bg-white/95 border border-black/10 rounded-lg cursor-pointer transition-all duration-300 flex items-center justify-center gap-1 text-[#2563eb] hover:bg-[#f1f5f9] hover:border-[#2563eb] hover:scale-110 hover:rotate-12 hover:shadow-md active:scale-95"
                          title="Edit User"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => deleteUser(userItem.id)} 
                          className="p-2 bg-white/95 border border-black/10 rounded-lg cursor-pointer transition-all duration-300 flex items-center justify-center gap-1 text-red-600 hover:bg-red-50 hover:border-red-600 hover:scale-110 hover:rotate-12 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:rotate-0"
                          title="Delete User"
                          disabled={userItem.id === user.id}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}