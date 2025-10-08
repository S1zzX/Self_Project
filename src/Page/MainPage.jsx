import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Target, Award, TrendingUp, CheckCircle, ArrowRight, Briefcase, Globe } from 'lucide-react';
import TaskManager from "./DashBoard.jsx";
import AssignUsers from "./AssignUsers.jsx";
import Sidebar from "../Components/Sidebar.jsx";
import Chat from "./Chat.jsx";
import UserProfile from "./UserProfile.jsx"; 

// =====================
// Company Introduction Section
// =====================
function CompanyIntro({ user, setSidebarVisible, onGetStarted }) {
  const stats = [
    { icon: <Users size={32} />, value: "500+", label: "Team Members" },
    { icon: <Target size={32} />, value: "1000+", label: "Projects Completed" },
    { icon: <Award size={32} />, value: "50+", label: "Awards Won" },
    { icon: <TrendingUp size={32} />, value: "99%", label: "Client Satisfaction" }
  ];

  const features = [
    {
      icon: <CheckCircle size={40} />,
      title: "Project Excellence",
      description: "We deliver high-quality solutions with attention to detail and commitment to excellence in every project we undertake."
    },
    {
      icon: <Users size={40} />,
      title: "Expert Team",
      description: "Our diverse team of professionals brings years of experience and innovative thinking to solve complex business challenges."
    },
    {
      icon: <Globe size={40} />,
      title: "Global Reach",
      description: "Serving clients worldwide with localized expertise and understanding of different markets and business cultures."
    },
    {
      icon: <Briefcase size={40} />,
      title: "Business Solutions",
      description: "From startups to enterprises, we provide scalable solutions that grow with your business and adapt to market changes."
    }
  ];

  return (
    <div className="max-w-full m-0 bg-white/95 min-h-screen">
      {/* Header Section */}
      <div
        className="relative text-white py-20 px-10 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #2563eb 0%, #1e3a5f 100%)'
        }}
      >
        {/* Background Pattern */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 20% 50%, rgba(37,99,235,0.10) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(241,245,249,0.06) 0%, transparent 50%),
                        radial-gradient(circle at 40% 80%, rgba(37,99,235,0.05) 0%, transparent 50%)`
          }}
        />

        <div className="relative z-[2]">
          <div
            className="w-30 h-30 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white/20"
            style={{
              background: '#2563eb',
              boxShadow: '0 8px 24px rgba(37,99,235,0.22)'
            }}
          >
            <i className="fa fa-code" style={{ fontSize: '48px', color: '#f8fafc' }}></i>
          </div>

          <h1 className="text-5xl font-bold mb-4" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)' }}>
            TaskFlow Solutions
          </h1>
          <p className="text-2xl font-light mb-6 opacity-90 text-[#f1f5f9]">
            Transforming Business Operations Through Innovation
          </p>
          <p className="text-lg leading-relaxed max-w-3xl mx-auto mb-8 opacity-90 text-[#f1f5f9]">
            {user ? `Welcome, ${user.name}! We're` : "We're"} a leading technology company specializing in
            digital transformation, project management solutions, and business process optimization.
          </p>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="py-20 px-10 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#2563eb] mb-12">Our Impact in Numbers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl py-10 px-6 text-center border-2"
                style={{
                  borderColor: 'rgba(37,99,235,0.08)',
                  boxShadow: '0 8px 24px rgba(39, 55, 77, 0.06)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 16px 32px rgba(39, 55, 77, 0.12)';
                  e.currentTarget.style.borderColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(39, 55, 77, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(37,99,235,0.08)';
                }}
              >
                <div className="text-[#2563eb] mb-4 flex justify-center">{stat.icon}</div>
                <div className="text-5xl font-bold text-[#1e293b] mb-2">{stat.value}</div>
                <div className="text-lg text-slate-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-10 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#1e293b] mb-6">Why Choose TaskFlow Solutions?</h2>
          <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto mb-12">
            We combine cutting-edge technology with deep industry expertise to deliver
            solutions that drive real business results.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl py-10 px-6 text-center border-2"
                style={{
                  borderColor: 'rgba(37,99,235,0.06)',
                  boxShadow: '0 8px 24px rgba(39, 55, 77, 0.06)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 16px 32px rgba(39, 55, 77, 0.12)';
                  e.currentTarget.style.borderColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(39, 55, 77, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(37,99,235,0.06)';
                }}
              >
                <div className="text-[#2563eb] mb-6 flex justify-center">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-[#1e293b] mb-4">{feature.title}</h3>
                <p className="text-base text-slate-600 leading-relaxed m-0">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div
        className="py-20 px-10"
        style={{
          background: 'rgba(226, 232, 240, 0.14)'
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#1e293b] mb-8">Our Mission</h2>
          <p
            className="text-xl leading-relaxed text-slate-600 italic m-0 p-8 bg-white rounded-2xl border-l-4"
            style={{ boxShadow: '0 8px 24px rgba(39, 55, 77, 0.06)', borderColor: 'rgba(37,99,235,0.12)' }}
          >
            "To empower businesses with innovative technology solutions that streamline operations,
            enhance productivity, and drive sustainable growth in an ever-evolving digital landscape."
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div
        className="py-20 px-10 text-center"
        style={{
          background: '#2563eb'
        }}
      >
        <div className="max-w-3xl mx-auto text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-lg leading-relaxed mb-10 opacity-90">
            Let's discuss how TaskFlow Solutions can help you achieve your business goals
            through innovative technology and strategic planning.
          </p>
          <button
            className="inline-flex items-center gap-3 text-white border-none rounded-xl px-8 py-4 text-lg font-semibold cursor-pointer transition-all duration-300"
            style={{
              background: '#1e3a5f',
              boxShadow: '0 8px 24px rgba(37,99,235,0.12)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,99,235,0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1e3a5f';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.12)';
            }}
            onClick={() => {
              if (onGetStarted) {
                // Landing page mode - navigate to login
                onGetStarted();
              } else if (user) {
                // Logged-in mode - show sidebar
                setSidebarVisible(true);
                try {
                  const key = user?.id ? `sidebarVisible_${user.id}` : 'sidebarVisible_global';
                  localStorage.setItem(key, 'true');
                } catch (e) {
                  localStorage.setItem('sidebarVisible', 'true');
                }
              }
            }}
          >
            Get Started Today <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================
// Main Page Layout
// =====================
export default function MainPage({ user, onLogout, selectedPage, onUserChange, isLanding, onGetStarted }) {
  // Only use useLocation if not in landing mode
  const location = !isLanding && typeof window !== 'undefined' ? useLocation() : null;

  const [selected, setSelected] = useState(() => {
    if (isLanding) return 'home';
    if (selectedPage) return selectedPage;
    // derive from location pathname when available
    const path = location?.pathname || '/';
    if (path === '/dashboard' || path === '/') return 'dashboard';
    if (path === '/assignuser') return 'assign';
    if (path === '/profile') return 'profile';
    if (path === '/chat') return 'chat';
    return 'dashboard';
  });

  const [sidebarVisible, setSidebarVisible] = useState(() => {
    if (isLanding) return false;
    try {
      const key = user?.id ? `sidebarVisible_${user.id}` : 'sidebarVisible_global';
      const saved = localStorage.getItem(key);
      return saved !== null ? saved === 'true' : true;
    } catch (e) {
      return true;
    }
  });

  // track mobile viewport to avoid applying large left margin on small screens
  const [isMobileViewport, setIsMobileViewport] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isLanding) {
      setSidebarVisible(false);
      return;
    }
    try {
      const key = user?.id ? `sidebarVisible_${user.id}` : 'sidebarVisible_global';
      const saved = localStorage.getItem(key);
      setSidebarVisible(saved !== null ? saved === 'true' : true);
    } catch (e) {
      setSidebarVisible(true);
    }
  }, [user, isLanding]);

  useEffect(() => {
    if (isLanding) return;
    if (selectedPage) {
      setSelected(selectedPage);
      return;
    }
    if (location) {
      const path = location.pathname;
      if (path === '/dashboard' || path === '/') setSelected('dashboard');
      else if (path === '/assignuser') setSelected('assign');
      else if (path === '/profile') setSelected('profile');
      else if (path === '/chat') setSelected('chat');
      else setSelected('dashboard');
    }
  }, [location?.pathname, selectedPage, isLanding, location]);

  // Landing page mode - no router, no sidebar
  if (isLanding) {
    return <CompanyIntro user={null} setSidebarVisible={() => {}} onGetStarted={onGetStarted} />;
  }

  // Authenticated mode
  return (
    <div 
      className="flex min-h-screen"
      style={{
        background: '#DDE6ED'
      }}
    >
      <div 
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: isMobileViewport ? 0 : '300px' }}
      >
        {selected === 'home' && (
          <CompanyIntro user={user} setSidebarVisible={setSidebarVisible} />
        )}
        {selected === 'dashboard' && <TaskManager user={user} />}
        {selected === 'assign' && user?.userType === 'admin' && <AssignUsers user={user} />}
        {selected === 'profile' && <UserProfile user={user} onUserChange={onUserChange} />}
        {selected === 'chat' && <Chat user={user} />}
      </div>

      <Sidebar
        userType={user?.userType}
        user={user}
        onSelect={setSelected}
        selected={selected}
        onLogout={onLogout}
        visible={sidebarVisible}
      />
    </div>
  );
}