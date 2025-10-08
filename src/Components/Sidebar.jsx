import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Users, LogOut, User, MessageCircle, X } from 'lucide-react';
import NotificationBell from './NotificationBell';

function Sidebar({ userType, user, onSelect, selected, onLogout, visible }) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleNavigation = (page) => {
    if (onSelect) onSelect(page);
    if (page === 'home') navigate('/');
    else if (page === 'dashboard') navigate('/dashboard');
    else if (page === 'assign') navigate('/assignuser');
    else if (page === 'profile') navigate('/profile');
    else if (page === 'chat') navigate('/chat');
    if (isMobile) setMobileOpen(false);
  };

  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    return `http://localhost:3001/${imagePath.replace(/^\/+/, '')}`;
  };

  const shouldShowSidebar = !isMobile ? true : mobileOpen;

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          style={{
            position: 'fixed',
            left: 12,
            top: 12,
            zIndex: 110,
            width: 44,
            height: 40,
            background: '#1e293b',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(2,6,23,0.35)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ width: 18, height: 2, background: '#fff', display: 'block' }} />
            <span style={{ width: 18, height: 2, background: '#fff', display: 'block' }} />
            <span style={{ width: 18, height: 2, background: '#fff', display: 'block' }} />
          </div>
        </button>
      )}

      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.32)',
            zIndex: 190
          }}
        />
      )}

      {shouldShowSidebar && (
        <aside
          aria-hidden={!shouldShowSidebar}
            style={{
            width: isMobile ? '72%' : '300px',
            maxWidth: isMobile ? 400 : 'none',
            background: '#111827',
            height: '100vh',
            padding: '24px',
            boxSizing: 'border-box',
            borderRightWidth: '3px',
            borderRightStyle: 'solid',
            borderRightColor: 'rgba(37,99,235,0.12)',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: isMobile ? 200 : 100,
            boxShadow: isMobile ? '12px 0 36px rgba(2,6,23,0.45)' : '6px 0 18px rgba(2,6,23,0.12)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              style={{
                position: 'absolute',
                right: 12,
                top: 12,
                zIndex: 220,
                width: 36,
                height: 36,
                background: 'transparent',
                color: '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          )}

          {/* Company Logo */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              padding: '16px 0',
              borderBottomWidth: '2px',
              borderBottomStyle: 'solid',
              borderBottomColor: 'rgba(37,99,235,0.08)'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '28px',
                marginBottom: '12px',
                boxShadow: '0 6px 18px rgba(37,99,235,0.22)',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'rgba(241,245,249,0.04)',
                transition: 'all 0.3s ease',
                fontWeight: 'bold'
              }}
            >
              <i className="fa fa-code" />
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#f1f5f9',
                textAlign: 'center',
                letterSpacing: '0.5px'
              }}
            >
              TaskManager
            </div>
          </div>

          {/* Notification Bell */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '24px',
              paddingBottom: '20px',
              borderBottomWidth: '2px',
              borderBottomStyle: 'solid',
              borderBottomColor: 'rgba(37,99,235,0.08)'
            }}
          >
            <NotificationBell />
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 0 }}>
            {visible && (
              <>
                <NavButton icon={<ClipboardList size={20} />} label="Dashboard" active={selected === 'dashboard'} onClick={() => handleNavigation('dashboard')} />
                <NavButton icon={<MessageCircle size={20} />} label="Messages" active={selected === 'chat'} onClick={() => handleNavigation('chat')} />

                {userType === 'admin' && (
                  <NavButton icon={<Users size={20} />} label="Assign Account" active={selected === 'assign'} onClick={() => handleNavigation('assign')} isAdmin />
                )}

                {userType !== 'admin' && <NavButton icon={<User size={20} />} label="Profile" active={selected === 'profile'} onClick={() => handleNavigation('profile')} />}
              </>
            )}
          </div>

          {/* User Profile Section */}
          <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '16px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 12px 36px rgba(2,6,23,0.14), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)', opacity: 0.6 }} />

              <div
                style={{
                  width: '48px',
                  height: '48px',
                  background: user?.profileImage ? `url(${getProfileImageUrl(user.profileImage)})` : '#2563eb',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '18px',
                  margin: '0 auto 16px auto',
                  boxShadow: '0 6px 18px rgba(37,99,235,0.22), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: 'rgba(255, 255, 255, 0.06)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {!user?.profileImage && (user?.name?.charAt(0)?.toUpperCase() || 'U')}
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '16px', marginBottom: '8px', letterSpacing: '0.5px', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #2563eb 100%)', color: 'white', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', padding: '6px 12px', borderRadius: '20px', display: 'inline-block', boxShadow: '0 2px 8px rgba(139,92,246,0.18)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                  {user?.userType || 'user'}
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={async () => {
                  try {
                    const maybePromise = onLogout();
                    if (maybePromise && typeof maybePromise.then === 'function') await maybePromise;
                  } catch (err) {
                    console.error('Error during logout:', err);
                  }
                }}
                style={{
                  width: '100%',
                  background: '#ef4444',
                  color: 'white',
                  borderWidth: 0,
                  borderStyle: 'none',
                  borderRadius: '12px',
                  padding: '14px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 6px 18px rgba(239,68,68,0.22), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
                  transition: 'all 0.24s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <LogOut size={18} />
                Logout
              </button>
            )}
          </div>
        </aside>
      )}
    </>
  );
}

function NavButton({ icon, label, active, onClick, isAdmin }) {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyle = {
    background: isAdmin ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: isAdmin ? 'rgba(139, 92, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
    color: '#f1f5f9',
    fontWeight: active ? '700' : '500',
    fontSize: '16px',
    textAlign: 'left',
    cursor: 'pointer',
    padding: '14px 18px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transform: (active || isHovered) ? 'translateX(6px)' : 'translateX(0)'
  };

  const activeStyle = active
    ? {
        background: isAdmin ? '#8b5cf6' : '#3b82f6',
        color: '#ffffff',
        boxShadow: '0 4px 12px rgba(93,140,207,0.4)',
        borderColor: isAdmin ? '#9DB2BF' : '#60a5fa'
      }
    : {};

  const hoverStyle = isHovered && !active ? { background: isAdmin ? 'rgba(157, 178, 191, 0.1)' : 'rgba(93,140,207,0.12)', borderColor: isAdmin ? '#9DB2BF' : '#60a5fa', boxShadow: '0 2px 8px rgba(93,140,207,0.18)' } : {};

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ ...baseStyle, ...activeStyle, ...hoverStyle }}
    >
  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '3px', background: active ? '#ffffff' : '#60a5fa', transform: active || isHovered ? 'scaleY(1)' : 'scaleY(0)', transition: 'transform 0.3s ease' }} />
      {icon}
      {label}
    </button>
  );
}

export default Sidebar;