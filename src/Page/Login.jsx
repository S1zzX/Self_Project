import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, CheckCircle2 } from 'lucide-react';

export default function TaskManagerLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    
    try {
      console.log('Attempting login with:', formData.email);
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (response.ok) {
        // Store tokens and user data
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        // Reload page to trigger auth state
        window.location.reload();
      } else {
        setErrors({ submit: data.error || 'Login failed' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ submit: 'Network error: Cannot connect to server. Make sure the server is running on port 3001.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand & Features */}
      <div
        className="w-full lg:w-1/2 p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600"
      >

        {/* Top-right Home button */}
        <button
          type="button"
          onClick={() => (window.location.href = '/')}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-md bg-[#2563eb] text-white hover:bg-[#1e40af] shadow-md transition-colors"
          aria-label="Go to home"
        >
          ← Home
        </button>


        {/* Decorative circles */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-float"
          style={{ background: 'black' }}
        ></div>
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-float-delayed"
          style={{ background: 'black' }}
        ></div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center animate-pulse-slow"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e3a5f 100%)' }}
            >
              <CheckCircle2 className="text-white" size={28} />
            </div>
            <span className="text-white text-2xl font-bold">TaskManager</span>
          </div>

          {/* Main Content */}
          <div className="max-w-md">
            <h1 className="text-white text-4xl font-bold mb-6 leading-tight">
              Your AI-Powered
              <br />Task Assistant
            </h1>
            <p className="text-[#f1f5f9] text-lg mb-12">
              Experience the future of productivity with TaskManager AI. Get instant organization, smart reminders, and intelligent task management.
            </p>

            {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 animate-slideInLeft" style={{ animationDelay: '0.1s' }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(37, 99, 235, 0.12)' }}
                >
                  <CheckCircle2 className="text-[#60a5fa]" size={18} />
                </div>
                <span className="text-[#f1f5f9]">Real-time task synchronization</span>
              </div>
              <div className="flex items-center gap-3 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
                <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="text-indigo-300" size={18} />
                </div>
                <span className="text-[#f1f5f9]">Advanced priority management</span>
              </div>
              <div className="flex items-center gap-3 animate-slideInLeft" style={{ animationDelay: '0.3s' }}>
                <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="text-indigo-300" size={18} />
                </div>
                <span className="text-[#f1f5f9]">Secure and private workspace</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-[#60a5fa]">© 2024 TaskManager. All rights reserved.</div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-[#f8fafc] to-[#f8fafc] animate-fadeIn">        <div className="w-full max-w-md">
          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#1e293b] mb-2">Welcome back!</h2>
            <p className="text-[#64748b]">Enter your credentials to access your account</p>
          </div>

          {/* Login Form */}
          <div className="space-y-5">
            {/* Error Message Banner */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-shake">
                {errors.submit}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg outline-none transition-all ${
                    errors.email ? 'border-red-500' : 'border-[#e2e8f0]'
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg outline-none transition-all ${
                    errors.password ? 'border-red-500' : 'border-[#e2e8f0]'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#64748b' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#64748b')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#2563eb] border-[#e2e8f0] rounded focus:ring-2 focus:ring-[#2563eb] cursor-pointer"
                />
                <span className="text-sm text-[#64748b]">Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              style={{ background: '#2563eb' }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = '#3b82f6')}
              onMouseLeave={(e) => !isLoading && (e.currentTarget.style.background = '#2563eb')}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span>→</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e2e8f0]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#f8fafc] text-[#64748b]">or continue with</span>
              </div>
              <style>{`
        @keyframes float {
                0%, 100% { transform: translateY(0px) translateX(0px); }
                50% { transform: translateY(-20px) translateX(10px); }
              }
              
              @keyframes float-delayed {
                0%, 100% { transform: translateY(0px) translateX(0px); }
                50% { transform: translateY(20px) translateX(-10px); }
              }
              
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
              
              @keyframes slideInLeft {
                from { opacity: 0; transform: translateX(-30px); }
                to { opacity: 1; transform: translateX(0); }
              }
              
              @keyframes pulse-slow {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
              }
              
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
              }
              
              .animate-float {
                animation: float 6s ease-in-out infinite;
              }
              
              .animate-float-delayed {
                animation: float-delayed 8s ease-in-out infinite;
              }
              
              .animate-fadeIn {
                animation: fadeIn 0.6s ease-out;
              }
              
              .animate-slideInLeft {
                animation: slideInLeft 0.6s ease-out both;
              }
              
              .animate-pulse-slow {
                animation: pulse-slow 3s ease-in-out infinite;
              }
              
              .animate-shake {
                animation: shake 0.5s ease-in-out;
              }
              
              input:focus {
                transform: translateY(-2px);
                transition: all 0.3s ease;
              }
              
              button:active {
                transform: scale(0.98);
              }
            `}</style>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 px-4 border border-[#e2e8f0] rounded-lg hover:bg-white hover:shadow-sm transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-sm font-medium text-[#1e293b]">Google</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 px-4 border border-[#e2e8f0] rounded-lg hover:bg-white hover:shadow-sm transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="text-sm font-medium text-[#1e293b]">GitHub</span>
              </button>
            </div>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden mt-8 flex justify-center items-center gap-2 text-[#64748b]">
            <CheckCircle2 size={20} />
            <span className="text-sm">TaskManager © 2024</span>
          </div>
        </div>
      </div>
    </div>
  );
}