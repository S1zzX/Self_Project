// AuthContext.jsx - Updated with updateUser function
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refs to hold the latest token values so apiRequest can stay stable
  const accessTokenRef = useRef(accessToken);
  const refreshTokenRef = useRef(refreshToken);

  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);
  useEffect(() => { refreshTokenRef.current = refreshToken; }, [refreshToken]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');

    if (storedAccessToken && storedRefreshToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        // keep refs in sync immediately so callbacks can read them
        accessTokenRef.current = storedAccessToken;
        refreshTokenRef.current = storedRefreshToken;
        setUser(parsedUser);
        
        // Verify token is still valid
        verifyToken(storedAccessToken);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        clearAuth();
      }
    }
    setLoading(false);
  }, []);

  const verifyToken = useCallback(async (token) => {
    try {
      const response = await fetch('http://localhost:3001/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        await refreshAccessToken();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        const { user: userData, accessToken: newAccessToken, refreshToken: newRefreshToken } = data;
        
    // Store in state and refs so other callbacks can read immediately
    setUser(userData);
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    accessTokenRef.current = newAccessToken;
    refreshTokenRef.current = newRefreshToken;

    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);

    // Set up token refresh timer
    setupTokenRefresh(newAccessToken);
        
        return { success: true, user: userData };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error: could not reach server' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const tokenToRemove = refreshTokenRef.current || refreshToken;
      if (tokenToRemove) {
        await fetch('http://localhost:3001/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokenToRemove })
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    clearAuth();
  }, [refreshToken]);

  const clearAuth = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    clearTimeout(window.tokenRefreshTimeout);
  };

  const setupTokenRefresh = useCallback((token) => {
    try {
      // Decode JWT to get expiration time (without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;

      // Refresh token 1 minute before expiry
      const refreshTime = Math.max(timeUntilExpiry - 60000, 30000); // Min 30 seconds

      clearTimeout(window.tokenRefreshTimeout);
      window.tokenRefreshTimeout = setTimeout(() => {
        refreshAccessToken();
      }, refreshTime);
    } catch (error) {
      console.error('Error setting up token refresh:', error);
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const currentRefresh = refreshTokenRef.current;
    if (!currentRefresh) {
      clearAuth();
      return null;
    }

    try {
      const response = await fetch('http://localhost:3001/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefresh })
      });

      const data = await response.json();

      if (response.ok) {
        const { accessToken: newAccessToken, user: userData } = data;

        setAccessToken(newAccessToken);
        setUser(userData);
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        accessTokenRef.current = newAccessToken;

        setupTokenRefresh(newAccessToken);
        return newAccessToken;
      } else {
        clearAuth();
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuth();
      return null;
    }
  }, [setupTokenRefresh]);

  // ✅ NEW: Function to update user data
  const updateUser = useCallback((updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  }, [user]);

  // API request wrapper with automatic token refresh
  const apiRequest = useCallback(async (url, options = {}) => {
    const makeRequest = async (token) => {
      const headers = {
        ...options.headers
      };

      // Only set JSON content-type if body is not FormData
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const effectiveToken = token || accessTokenRef.current;
      if (effectiveToken) {
        headers['Authorization'] = `Bearer ${effectiveToken}`;
      }

      try {
        return await fetch(url, {
          ...options,
          headers
        });
      } catch (err) {
        // Network-level errors (server down, CORS, etc.)
        console.error('Network request failed:', err, url, options);
        throw err;
      }
    };

    // Try with current access token (from ref)
    let response = await makeRequest();

    // If token expired (401), try to refresh using the stable refreshAccessToken
    if (response && response.status === 401 && refreshTokenRef.current) {
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        response = await makeRequest(newAccessToken);
      }
    }

    return response;
  }, [refreshAccessToken]);

  const value = useMemo(() => ({
    user,
    accessToken,
    token: accessToken,  // Add alias for socket connection
    loading,
    login,
    logout,
    apiRequest,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.userType === 'admin'
  }), [user, accessToken, loading, login, logout, apiRequest, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};