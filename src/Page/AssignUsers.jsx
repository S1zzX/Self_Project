import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Edit2, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '../AuthContext';

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
        alert('User added successfully!');
      } else {
        const err = await response.json();
        alert('Error: ' + err.error);
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    }
  };

  const deleteUser = async (userId) => {
    if (!isAdmin) return;
    
    if (userId === user.id) {
      alert('You cannot delete your own account');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const response = await apiRequest(`http://localhost:3001/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        alert('User deleted successfully!');
      } else {
        const err = await response.json();
        alert('Failed to delete user: ' + err.error);
      }
    } catch (error) {
      alert('Network error: ' + error.message);
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
        alert('User updated successfully!');
      } else {
        const err = await response.json();
        alert('Failed to update user: ' + err.error);
      }
    } catch (error) {
      alert('Network error: ' + error.message);
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
        
        alert('Profile image uploaded successfully!');
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      alert('Error uploading image: ' + error.message);
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
        
        alert('Profile image removed successfully!');
      } else {
        alert('Failed to remove image');
      }
    } catch (error) {
      alert('Error removing image: ' + error.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-full mx-auto p-6 bg-white/95 min-h-screen">
        <div className="text-center p-12 bg-red-100 rounded-xl border-2 border-red-200">
          <h2 className="text-red-600 mb-4 text-xl font-semibold">Access Denied</h2>
          <p className="text-slate-500">You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-6 bg-white/95 min-h-screen font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2563eb] to-[#8b5cf6] rounded-xl p-6 text-white mb-8 shadow-xl">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Users size={32} /> User Management
        </h1>
        <p className="opacity-90">Add, edit, and manage user accounts</p>
      </div>

      {/* Add User Section */}
      <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] p-6 rounded-xl border-2 border-[#e2e8f0] mb-8">
        <h2 className="text-slate-800 mb-5 flex items-center gap-2 text-xl font-semibold">
          <UserPlus size={24} /> Add New User
        </h2>
        <div className="flex gap-3 flex-wrap items-start">
          <div className="flex flex-col flex-1 min-w-[300px]">
            <input
              type="text"
              value={newUser.name}
              onChange={e => handleNewUserChange('name', e.target.value)}
              placeholder="Full Name (required)"
              className={`px-4 py-3 border-2 rounded-lg text-base outline-none transition-all bg-white ${
                validationErrors.name 
                  ? 'border-red-600 focus:ring-2 focus:ring-red-200' 
                  : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }`}
              maxLength={50}
            />
            {validationErrors.name && (
              <div className="text-red-600 text-sm font-medium mt-1">{validationErrors.name}</div>
            )}
          </div>
          
          <div className="flex flex-col flex-1 min-w-[300px]">
            <input
              type="email"
              value={newUser.email}
              onChange={e => handleNewUserChange('email', e.target.value)}
              placeholder="Email Address (required)"
              className={`px-4 py-3 border-2 rounded-lg text-base outline-none transition-all bg-white ${
                validationErrors.email 
                  ? 'border-red-600 focus:ring-2 focus:ring-red-200' 
                  : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }`}
            />
            {validationErrors.email && (
              <div className="text-red-600 text-sm font-medium mt-1">{validationErrors.email}</div>
            )}
          </div>
          
          <div className="flex flex-col flex-1 min-w-[300px]">
            <input
              type="password"
              value={newUser.password}
              onChange={e => handleNewUserChange('password', e.target.value)}
              placeholder="Password (min. 6 chars, 1 upper, 1 lower, 1 number)"
              className={`px-4 py-3 border-2 rounded-lg text-base outline-none transition-all bg-white ${
                validationErrors.password 
                  ? 'border-red-600 focus:ring-2 focus:ring-red-200' 
                  : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }`}
              maxLength={100}
            />
            {validationErrors.password && (
              <div className="text-red-600 text-sm font-medium mt-1">{validationErrors.password}</div>
            )}
          </div>
          
          <div className="flex flex-col flex-1 min-w-[300px]">
            <select
              value={newUser.userType}
              onChange={e => handleNewUserChange('userType', e.target.value)}
              className={`px-4 py-3 border-2 rounded-lg text-base outline-none transition-all bg-white ${
                validationErrors.userType 
                  ? 'border-red-600 focus:ring-2 focus:ring-red-200' 
                  : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }`}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {validationErrors.userType && (
              <div className="text-red-600 text-sm font-medium mt-1">{validationErrors.userType}</div>
            )}
          </div>
          
          <button 
            onClick={addUser}
            className="flex items-center justify-center gap-2 w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-gradient-to-r from-[#2563eb] to-[#8b5cf6] hover:from-[#1e3a5f] hover:to-[#5b21b6] border border-white/30 text-white font-semibold cursor-pointer transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
          >
            <UserPlus size={20} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {/* Users List */}
      <div>
        <h2 className="text-slate-800 mb-5 text-2xl font-semibold">Existing Users ({users.length})</h2>
        {users.length === 0 ? (
          <div className="text-center py-12 text-[#64748b] bg-[#f8fafc]/60 rounded-xl my-6 border-2 border-dashed border-[#e2e8f0]">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-lg mb-1 text-slate-800 font-medium">No users found</p>
            <p className="text-sm text-slate-500">Add your first user above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {users.map(userItem => (
              <div 
                key={userItem.id} 
                className="bg-white/95 border-2 border-[#e2e8f0] rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-start gap-4 relative overflow-hidden min-h-[100px]"
              >
                {editingId === userItem.id ? (
                  <div className="w-full flex flex-col gap-3">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#2563eb] to-[#8b5cf6] rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
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

                      <div className="flex gap-4">
                        <input
                          type="file"
                          accept="image/*"
                          id={`edit-avatar-${editingId}`}
                          className="hidden"
                          onChange={(e) => handleProfileImageUpload(e, editingId)}
                        />

                        <label 
                          htmlFor={`edit-avatar-${editingId}`} 
                          className="px-3 py-1.5 text-sm font-medium rounded-md bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white cursor-pointer hover:bg-gradient-to-br from-[#2563eb] to-[#8b5cf6] transition-all"
                        >
                          Change
                        </label>

                        {editingUser.profile_image && (
                          <button
                            type="button"
                            className="px-3 py-1.5 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-all"
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
                        className={`w-full px-3 py-2 border-2 rounded-md text-sm outline-none transition-all ${
                          editValidationErrors.name 
                            ? 'border-red-600 focus:ring-2 focus:ring-red-200' 
                            : 'border-[#e2e8f0] focus:border-[#2563eb] focus:ring-2 focus:ring-[#e6f0ff]'
                        }`}
                        placeholder="Full Name (required)"
                        maxLength={50}
                      />
                      {editValidationErrors.name && (
                        <div className="text-red-600 text-sm font-medium mt-1">{editValidationErrors.name}</div>
                      )}
                    </div>
                    
                    <div className="flex flex-col">
                      <input
                        type="email"
                        value={editingUser.email}
                        onChange={e => handleEditUserChange('email', e.target.value)}
                        className={`w-full px-3 py-2 border-2 rounded-md text-sm outline-none transition-all ${
                          editValidationErrors.email 
                            ? 'border-red-600 focus:ring-2 focus:ring-red-200' 
                            : 'border-[#e2e8f0] focus:border-[#2563eb] focus:ring-2 focus:ring-[#e6f0ff]'
                        }`}
                        placeholder="Email Address (required)"
                      />
                      {editValidationErrors.email && (
                        <div className="text-red-600 text-sm font-medium mt-1">{editValidationErrors.email}</div>
                      )}
                    </div>
                    
                    <div className="flex flex-col">
                      <input
                        type="password"
                        value={editingUser.password}
                        onChange={e => handleEditUserChange('password', e.target.value)}
                        className={`w-full px-3 py-2 border-2 rounded-md text-sm outline-none transition-all ${
                          editValidationErrors.password 
                            ? 'border-red-600 focus:ring-2 focus:ring-red-200' 
                            : 'border-[#e2e8f0] focus:border-[#2563eb] focus:ring-2 focus:ring-[#e6f0ff]'
                        }`}
                        placeholder="New Password (leave blank to keep current)"
                        maxLength={100}
                      />
                      {editValidationErrors.password && (
                        <div className="text-red-600 text-sm font-medium mt-1">{editValidationErrors.password}</div>
                      )}
                    </div>
                    
                    <div className="flex flex-col">
                      <select
                        value={editingUser.userType}
                        onChange={e => handleEditUserChange('userType', e.target.value)}
                        className={`w-full px-3 py-2 border-2 rounded-md text-sm outline-none transition-all ${
                          editValidationErrors.userType 
                            ? 'border-red-600 focus:ring-2 focus:ring-red-200' 
                            : 'border-[#e2e8f0] focus:border-[#2563eb] focus:ring-2 focus:ring-[#e6f0ff]'
                        }`}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      {editValidationErrors.userType && (
                        <div className="text-red-600 text-sm font-medium mt-1">{editValidationErrors.userType}</div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 justify-end mt-2">
                      <button 
                        onClick={saveEdit} 
                        className="px-3 py-2 bg-white/95 border border-black/10 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 text-green-600 hover:bg-green-50 hover:border-green-600"
                      >
                        <Check size={16} /> Save
                      </button>
                      <button 
                        onClick={cancelEdit} 
                        className="px-3 py-2 bg-white/95 border border-black/10 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 text-slate-600 hover:bg-slate-50 hover:border-slate-600"
                      >
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-gradient-to-br from-[#2563eb] to-[#8b5cf6] rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
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

                    <div className="flex-1 flex flex-col gap-1 min-w-0 pr-20">
                      <h3 className="m-0 text-[#1e293b] text-lg leading-tight break-words">{userItem.name}</h3>
                      <p className="m-0 text-[#64748b] text-sm leading-tight break-words">{userItem.email}</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase w-fit ${
                        userItem.userType === 'admin' 
                          ? 'bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white' 
                          : 'bg-[#f1f5f9] text-[#1e293b]'
                      }`}>
                        {userItem.userType.toUpperCase()}
                      </span>
                      {userItem.id === user.id && (
                        <span className="block text-xs text-teal-600 font-bold mt-1">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="flex mt-2.5 gap-2 flex-shrink-0 absolute top-5 right-12 z-10">
                      <button 
                        onClick={() => startEditing(userItem)} 
                        className="p-2 bg-white/95 border border-black/10 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 text-[#2563eb] hover:bg-[#f1f5f9] hover:border-[#2563eb]"
                        title="Edit User"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteUser(userItem.id)} 
                        className="p-2 bg-white/95 border border-black/10 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 text-red-600 hover:bg-red-50 hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}