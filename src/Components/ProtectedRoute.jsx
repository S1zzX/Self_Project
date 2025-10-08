// ProtectedRoute.jsx
import { useAuth } from '../AuthContext';

export const ProtectedRoute = ({ children, requireAdmin = false, requireNonAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          padding: '24px 32px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          fontSize: '18px',
          color: '#64748b',
          textAlign: 'center',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: 'rgba(157, 178, 191, 0.2)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderWidth: '3px',
            borderStyle: 'solid',
            borderColor: '#e2e8f0',
            borderTopColor: '#526D82',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          Loading your workspace...
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          padding: '32px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: 'rgba(239, 68, 68, 0.2)',
          maxWidth: '400px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>🔒</div>
          <h2 style={{
            color: '#dc2626',
            marginBottom: '16px',
            fontSize: '24px'
          }}>Authentication Required</h2>
          <p style={{
            color: '#64748b',
            margin: '0'
          }}>Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  if (requireNonAdmin && isAdmin) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          padding: '32px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: 'rgba(245, 158, 11, 0.2)',
          maxWidth: '400px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>ℹ️</div>
          <h2 style={{
            color: '#d97706',
            marginBottom: '16px',
            fontSize: '24px'
          }}>Admin Access</h2>
          <p style={{
            color: '#64748b',
            margin: '0'
          }}>Admins can manage their profile through the Assign Account page.</p>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          padding: '32px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: 'rgba(245, 158, 11, 0.2)',
          maxWidth: '400px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>⚠️</div>
          <h2 style={{
            color: '#d97706',
            marginBottom: '16px',
            fontSize: '24px'
          }}>Access Denied</h2>
          <p style={{
            color: '#64748b',
            margin: '0'
          }}>You don't have administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return children;
};