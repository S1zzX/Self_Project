// UserProfile.jsx - Converted to Tailwind CSS
import React, { useState, useEffect } from 'react';
import { User as UserIcon, Lock, Mail, Save, Eye, EyeOff, Camera, X } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function UserProfile({ user, onUserChange }) {
  const { apiRequest } = useAuth();

  // Local state
  const [isLoading, setIsLoading] = useState(false);

  // Account form state
  const [accountData, setAccountData] = useState({ name: '', email: '' });
  const [accountErrors, setAccountErrors] = useState({});
  const [accountSuccess, setAccountSuccess] = useState('');

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize from prop user
  useEffect(() => {
    setAccountData({
      name: user?.name || '',
      email: user?.email || ''
    });
  }, [user]);

  // Build full image URL from saved backend path
  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return `http://localhost:3001/${imagePath.replace(/^\/+/, '')}`;
  };

  // -------------------------
  // Image handlers (instant upload)
  // -------------------------
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await apiRequest(
        `http://localhost:3001/users/${user.id}/profile-image`,
        { method: 'POST', body: formData }
      );

      if (response.ok) {
        const data = await response.json();
        const currentUser = JSON.parse(localStorage.getItem('user')) || {};
        const newUser = { ...currentUser, profileImage: data.imagePath };
        localStorage.setItem('user', JSON.stringify(newUser));
        
        if (typeof onUserChange === 'function') {
          onUserChange(newUser);
        }

        setAccountSuccess('Profile image updated successfully.');
        setTimeout(() => setAccountSuccess(''), 2500);
      } else {
        const err = await response.json().catch(() => ({}));
        setAccountErrors({ submit: err.error || 'Failed to upload image' });
      }
    } catch (err) {
      setAccountErrors({ submit: 'Network error: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageDelete = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const response = await apiRequest(`http://localhost:3001/users/${user.id}/profile-image`, {
        method: 'DELETE'
      });
      if (response.ok) {
        const currentUser = JSON.parse(localStorage.getItem('user')) || {};
        const newUser = { ...currentUser, profileImage: null };
        localStorage.setItem('user', JSON.stringify(newUser));
        
        if (typeof onUserChange === 'function') {
          onUserChange(newUser);
        }

        setAccountSuccess('Profile image removed successfully.');
        setTimeout(() => setAccountSuccess(''), 2500);
      } else {
        const err = await response.json().catch(() => ({}));
        setAccountErrors({ submit: err.error || 'Failed to delete image' });
      }
    } catch (err) {
      setAccountErrors({ submit: 'Network error: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  // Account update handlers
  // -------------------------
  const validateAccount = () => {
    const errors = {};
    if (!accountData.name.trim()) errors.name = 'Name is required';
    else if (accountData.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    if (!accountData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(accountData.email)) errors.email = 'Invalid email';
    return errors;
  };

  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    setAccountSuccess('');
    const errors = validateAccount();
    setAccountErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);
    try {
      const response = await apiRequest(`http://localhost:3001/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: accountData.name.trim(),
          email: accountData.email.trim().toLowerCase(),
          userType: user?.userType || 'user'
        })
      });

      if (response.ok) {
        const updated = await response.json();
        const currentUser = JSON.parse(localStorage.getItem('user')) || {};
        const newUser = { 
          ...currentUser, 
          name: updated.name || accountData.name.trim(), 
          email: updated.email || accountData.email.trim().toLowerCase() 
        };
        localStorage.setItem('user', JSON.stringify(newUser));
        
        if (typeof onUserChange === 'function') {
          onUserChange(newUser);
        }

        setAccountSuccess('Account updated successfully.');
        setTimeout(() => setAccountSuccess(''), 2500);
      } else {
        const err = await response.json().catch(() => ({}));
        setAccountErrors({ submit: err.error || 'Failed to update account' });
      }
    } catch (err) {
      setAccountErrors({ submit: 'Network error: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  // Password update handlers
  // -------------------------
  const validatePassword = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password required';
    } else if (passwordData.currentPassword.trim() === '') {
      errors.currentPassword = 'Current password cannot be empty or just spaces';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password required';
    } else if (passwordData.newPassword.trim() === '') {
      errors.newPassword = 'New password cannot be empty or just spaces';
    } else {
      if (passwordData.newPassword.length < 6) {
        errors.newPassword = 'Must be >= 6 chars';
      } else if (!/[A-Z]/.test(passwordData.newPassword)) {
        errors.newPassword = 'Must include an uppercase letter';
      } else if (!/[a-z]/.test(passwordData.newPassword)) {
        errors.newPassword = 'Must include a lowercase letter';
      } else if (!/\d/.test(passwordData.newPassword)) {
        errors.newPassword = 'Must include a number';
      }
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm password';
    } else if (passwordData.confirmPassword.trim() === '') {
      errors.confirmPassword = 'Confirm password cannot be empty or just spaces';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordErrors({});
    
    const errors = validatePassword();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3001/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: user?.name,
          email: user?.email,
          password: passwordData.newPassword.trim(),
          userType: user?.userType,
          currentPassword: passwordData.currentPassword.trim()
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        if (response.status === 401) {
          setPasswordErrors({ currentPassword: 'Current password is incorrect' });
        } else {
          setPasswordErrors({ submit: err.error || 'Failed to update password' });
        }
        setIsLoading(false);
        return;
      }
      setPasswordSuccess('Password updated successfully.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 3000);

    } catch (err) {
      setPasswordErrors({ submit: 'Network error: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // helper for live password requirement UI
  const checkPasswordRequirements = (pw) => ({
    length: pw.length >= 6,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /\d/.test(pw)
  });

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white/95 min-h-screen">
      {/* Header / Avatar */}
      <div 
        className="relative rounded-2xl p-12 text-white mb-8 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)',
          boxShadow: '0 10px 40px rgba(37,99,235,0.12)'
        }}
      >
        {/* Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'rgba(255, 255, 255, 0.05)'
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-4 mb-6">
          <div
            className="w-30 h-30 rounded-full flex items-center justify-center text-5xl font-bold transition-all duration-300 hover:scale-105"
            style={{
              background: user?.profileImage 
                ? `url(${getProfileImageUrl(user.profileImage)})` 
                : 'linear-gradient(135deg,#2563eb,#8b5cf6)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: '#ffffff',
              boxShadow: '0 10px 30px rgba(37,99,235,0.08)',
              borderWidth: '4px',
              borderStyle: 'solid',
              borderColor: 'rgba(255, 255, 255, 0.18)'
            }}
          >
            {!user?.profileImage && (user?.name?.charAt(0).toUpperCase() || 'U')}
          </div>

          {/* Image Upload Controls */}
          <div className="flex gap-3 items-center flex-wrap justify-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="profile-image-upload"
              disabled={isLoading}
            />
            
            <label 
              htmlFor="profile-image-upload" 
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 bg-white/95 text-[#2563eb] hover:bg-white hover:-translate-y-0.5 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Camera size={18} />
              {user?.profileImage ? 'Change' : 'Upload'}
            </label>

            {user?.profileImage && (
              <button 
                onClick={handleImageDelete} 
                disabled={isLoading} 
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 bg-red-600/90 text-white hover:bg-red-600 hover:-translate-y-0.5 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <X size={18} />
                Remove
              </button>
            )}
          </div>
        </div>

        <h1 className="relative z-10 text-3xl font-bold mb-2 drop-shadow-md text-white">
          {user?.name || 'User'}
        </h1>
        <p className="relative z-10 opacity-90 text-base mb-3 text-white/90">
          {user?.email || 'user@example.com'}
        </p>
        <span 
          className="relative z-10 inline-block px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide border"
          style={{
            background: user?.userType === 'admin' 
              ? 'rgba(255, 255, 255, 0.14)'
              : 'rgba(255, 255, 255, 0.06)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            boxShadow: '0 4px 16px rgba(37,99,235,0.06)'
          }}
        >
          {user?.userType?.toUpperCase() || 'USER'}
        </span>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-6">
        {/* Account Information */}
        <div className="bg-white border-2 border-[#e2e8f0] rounded-2xl p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center gap-3 text-xl font-bold text-[#2563eb] mb-7 pb-4 border-b-2 border-[#e2e8f0]">
            <UserIcon size={20} />
            Account Information
          </div>

          <div className="mb-6">
            <label className="block font-semibold text-[#1e293b] mb-2 text-sm uppercase tracking-wide">
              Full Name
            </label>
            <div className="relative flex items-center w-full">
              <UserIcon size={18} className="absolute left-3.5 text-[#64748b] pointer-events-none" style={{ paddingTop: '11px' }} />
              <input
                className={`w-full py-3.5 px-12 border-2 rounded-lg text-base transition-all duration-300 bg-white ${
                  accountErrors.name 
                    ? 'border-red-600 shadow-[0_0_0_4px_rgba(220,38,38,0.1)]' 
                    : 'border-[#e2e8f0] focus:border-[#2563eb] focus:shadow-[0_0_0_8px_rgba(37,99,235,0.06)]'
                } focus:outline-none`}
                type="text"
                value={accountData.name}
                onChange={(e) => { 
                  setAccountData({ ...accountData, name: e.target.value }); 
                  setAccountErrors({ ...accountErrors, name: '' }); 
                }}
                placeholder="Enter your full name"
              />
            </div>
            {accountErrors.name && (
              <span className="text-red-600 text-xs mt-1.5 block font-medium">
                {accountErrors.name}
              </span>
            )}
          </div>

          <div className="mb-6">
            <label className="block font-semibold text-[#1e293b] mb-2 text-sm uppercase tracking-wide">
              Email Address
            </label>
            <div className="relative flex items-center w-full">
              <Mail size={18} className="absolute left-3.5 text-[#64748b] pointer-events-none" style={{ paddingTop: '11px' }} />
              <input
                className={`w-full py-3.5 px-12 border-2 rounded-lg text-base transition-all duration-300 bg-white ${
                  accountErrors.email 
                    ? 'border-red-600 shadow-[0_0_0_4px_rgba(220,38,38,0.1)]' 
                    : 'border-[#e2e8f0] focus:border-[#2563eb] focus:shadow-[0_0_0_8px_rgba(37,99,235,0.06)]'
                } focus:outline-none`}
                type="email"
                value={accountData.email}
                onChange={(e) => { 
                  setAccountData({ ...accountData, email: e.target.value }); 
                  setAccountErrors({ ...accountErrors, email: '' }); 
                }}
                placeholder="Enter your email"
              />
            </div>
            {accountErrors.email && (
              <span className="text-red-600 text-xs mt-1.5 block font-medium">
                {accountErrors.email}
              </span>
            )}
          </div>

          {accountErrors.submit && (
            <div className="text-red-600 text-sm mb-3 font-medium">
              {accountErrors.submit}
            </div>
          )}
          {accountSuccess && (
            <div className="text-green-600 text-sm mb-3 bg-green-600/10 py-3.5 px-4 rounded-lg border border-green-600/25 font-medium">
              {accountSuccess}
            </div>
          )}

          <div className="flex gap-3 justify-end mt-7 pt-6 border-t-2 border-[#e2e8f0]">
            <button 
              className="px-7 py-3.5 rounded-lg text-base font-semibold transition-all duration-300 bg-slate-200/50 text-slate-600 border-2 border-slate-200/80 hover:bg-slate-200/80 hover:border-[#2563eb] hover:text-[#2563eb] hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0"
              type="button" 
              onClick={() => { 
                setAccountData({ name: user?.name || '', email: user?.email || ''}); 
                setAccountErrors({}); 
              }}
            >
              Cancel
            </button>
            <button 
              className="flex items-center gap-2 px-7 py-3.5 rounded-lg text-base font-semibold text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: 'linear-gradient(135deg,#2563eb,#8b5cf6)',
                boxShadow: '0 6px 18px rgba(37,99,235,0.16)'
              }}
              type="button" 
              disabled={isLoading} 
              onClick={handleAccountUpdate}
            >
              <Save size={16} />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white border-2 border-[#e2e8f0] rounded-2xl p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center gap-3 text-xl font-bold text-[#2563eb] mb-7 pb-4 border-b-2 border-[#e2e8f0]">
            <Lock size={20} />
            Change Password
          </div>

          <div className="mb-6">
            <label className="block font-semibold text-[#1e293b] mb-2 text-sm uppercase tracking-wide">
              Current Password
            </label>
            <div className="relative flex items-center w-full">
              <Lock size={18} className="absolute left-3.5 text-[#64748b] pointer-events-none" style={{ paddingTop: '11px' }} />
              <input
                className={`w-full py-3.5 px-12 border-2 rounded-lg text-base transition-all duration-300 bg-white ${
                  passwordErrors.currentPassword 
                    ? 'border-red-600 shadow-[0_0_0_4px_rgba(220,38,38,0.1)]' 
                    : 'border-[#e2e8f0] focus:border-[#2563eb] focus:shadow-[0_0_0_8px_rgba(37,99,235,0.06)]'
                } focus:outline-none`}
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => { 
                  setPasswordData({ ...passwordData, currentPassword: e.target.value }); 
                  setPasswordErrors({ ...passwordErrors, currentPassword: '' }); 
                }}
                placeholder="Enter current password"
              />
              <button 
                type="button" 
                className="absolute right-3.5 bg-transparent border-none text-[#2563eb] cursor-pointer p-1.5 rounded-md transition-all duration-300 flex items-center justify-center w-8 h-8 hover:text-[#2563eb] hover:bg-[#2563eb]/10"
                style={{ marginTop: '10px' }}
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <span className="text-red-600 text-xs mt-1.5 block font-medium">
                {passwordErrors.currentPassword}
              </span>
            )}
          </div>

          <div className="mb-6">
            <label className="block font-semibold text-[#1e293b] mb-2 text-sm uppercase tracking-wide">
              New Password
            </label>
            <div className="relative flex items-center w-full">
              <Lock size={18} className="absolute left-3.5 text-[#64748b] pointer-events-none" style={{ paddingTop: '11px' }} />
              <input
                className={`w-full py-3.5 px-12 border-2 rounded-lg text-base transition-all duration-300 bg-white ${
                  passwordErrors.newPassword 
                    ? 'border-red-600 shadow-[0_0_0_4px_rgba(220,38,38,0.1)]' 
                    : 'border-[#e2e8f0] focus:border-[#2563eb] focus:shadow-[0_0_0_8px_rgba(37,99,235,0.06)]'
                } focus:outline-none`}
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => { 
                  setPasswordData({ ...passwordData, newPassword: e.target.value }); 
                  setPasswordErrors({ ...passwordErrors, newPassword: '' }); 
                }}
                placeholder="Enter new password"
              />
              <button 
                type="button" 
                className="absolute right-3.5 bg-transparent border-none text-[#2563eb] cursor-pointer p-1.5 rounded-md transition-all duration-300 flex items-center justify-center w-8 h-8 hover:text-[#2563eb] hover:bg-[#2563eb]/10"
                style={{ marginTop: '10px' }}
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <span className="text-red-600 text-xs mt-1.5 block font-medium">
                {passwordErrors.newPassword}
              </span>
            )}

            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4 mt-3 text-xs text-[#64748b]">
              <strong className="text-[#2563eb] block mb-2.5 text-sm">
                Password Requirements:
              </strong>
              <ul className="m-0 pl-5">
                <li className={`my-1.5 leading-relaxed transition-all duration-300 ${
                  checkPasswordRequirements(passwordData.newPassword).length 
                    ? 'text-green-600 font-semibold bg-green-600/8 py-1 px-1.5 rounded-md -ml-1.5 pl-1.5' 
                    : ''
                }`}>
                  {checkPasswordRequirements(passwordData.newPassword).length && '✓ '}
                  At least 6 characters long
                </li>
                <li className={`my-1.5 leading-relaxed transition-all duration-300 ${
                  checkPasswordRequirements(passwordData.newPassword).uppercase 
                    ? 'text-green-600 font-semibold bg-green-600/8 py-1 px-1.5 rounded-md -ml-1.5 pl-1.5' 
                    : ''
                }`}>
                  {checkPasswordRequirements(passwordData.newPassword).uppercase && '✓ '}
                  Contains at least one uppercase letter
                </li>
                <li className={`my-1.5 leading-relaxed transition-all duration-300 ${
                  checkPasswordRequirements(passwordData.newPassword).lowercase 
                    ? 'text-green-600 font-semibold bg-green-600/8 py-1 px-1.5 rounded-md -ml-1.5 pl-1.5' 
                    : ''
                }`}>
                  {checkPasswordRequirements(passwordData.newPassword).lowercase && '✓ '}
                  Contains at least one lowercase letter
                </li>
                <li className={`my-1.5 leading-relaxed transition-all duration-300 ${
                  checkPasswordRequirements(passwordData.newPassword).number 
                    ? 'text-green-600 font-semibold bg-green-600/8 py-1 px-1.5 rounded-md -ml-1.5 pl-1.5' 
                    : ''
                }`}>
                  {checkPasswordRequirements(passwordData.newPassword).number && '✓ '}
                  Contains at least one number
                </li>
              </ul>
            </div>
          </div>

            <div className="mb-6">
            <label className="block font-semibold text-[#1e293b] mb-2 text-sm uppercase tracking-wide">
              Confirm New Password
            </label>
            <div className="relative flex items-center w-full">
              <Lock size={18} className="absolute left-3.5 text-[#64748b] pointer-events-none" style={{ paddingTop: '11px' }} />
              <input
                className={`w-full py-3.5 px-12 border-2 rounded-lg text-base transition-all duration-300 bg-white ${
                  passwordErrors.confirmPassword 
                    ? 'border-red-600 shadow-[0_0_0_4px_rgba(220,38,38,0.1)]' 
                    : 'border-[#e2e8f0] focus:border-[#2563eb] focus:shadow-[0_0_0_8px_rgba(37,99,235,0.06)]'
                } focus:outline-none`}
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => { 
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value }); 
                  setPasswordErrors({ ...passwordErrors, confirmPassword: '' }); 
                }}
                placeholder="Confirm new password"
              />
              <button 
                type="button" 
                className="absolute right-3.5 bg-transparent border-none text-[#2563eb] cursor-pointer p-1.5 rounded-md transition-all duration-300 flex items-center justify-center w-8 h-8 hover:text-[#2563eb] hover:bg-[#2563eb]/10"
                style={{ marginTop: '10px' }}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <span className="text-red-600 text-xs mt-1.5 block font-medium">
                {passwordErrors.confirmPassword}
              </span>
            )}
          </div>

          {passwordErrors.submit && (
            <div className="text-red-600 text-sm mb-3 font-medium">
              {passwordErrors.submit}
            </div>
          )}
          {passwordSuccess && (
            <div className="text-green-600 text-sm mb-3 bg-green-600/10 py-3.5 px-4 rounded-lg border border-green-600/25 font-medium">
              {passwordSuccess}
            </div>
          )}

          <div className="flex gap-3 justify-end mt-7 pt-6 border-t-2 border-[#e2e8f0]">
            <button 
              type="button" 
              className="px-7 py-3.5 rounded-lg text-base font-semibold transition-all duration-300 bg-slate-200/50 text-slate-600 border-2 border-slate-200/80 hover:bg-slate-200/80 hover:border-[#2563eb] hover:text-[#2563eb] hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0"
              onClick={() => setPasswordData({ 
                currentPassword: '', 
                newPassword: '', 
                confirmPassword: '' 
              })}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="flex items-center gap-2 px-7 py-3.5 rounded-lg text-base font-semibold text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: 'linear-gradient(135deg,#2563eb,#8b5cf6)',
                boxShadow: '0 6px 18px rgba(37,99,235,0.16)'
              }}
              disabled={isLoading} 
              onClick={handlePasswordUpdate}
            >
              <Save size={16} />
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}