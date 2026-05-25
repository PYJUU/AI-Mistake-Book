import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, PenTool, LogOut, Plus, Settings } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Questions from './pages/Questions';
import AddQuestion from './pages/AddQuestion';
import Practice from './pages/Practice';
import SettingsPage from './pages/Settings';
import { cn } from './lib/utils';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [navigate, token]);
  
  if (!token) return null;
  return <>{children}</>;
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navs = [
    { name: '总览', path: '/', icon: LayoutDashboard },
    { name: '题库管理', path: '/questions', icon: BookOpen },
    { name: '开始训练', path: '/practice', icon: PenTool },
    { name: 'AI 配置', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      <aside className="w-64 border-r border-gray-200 bg-gray-100 flex flex-col hidden md:flex">
        <div className="p-6 pb-2">
          <Link to="/" className="flex items-center gap-3 font-bold text-xl tracking-tight">
            <span className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center text-sm shadow-sm">📚</span>
            错题本
          </Link>
        </div>
        <div className="px-4 py-6 flex-1 space-y-1">
          {navs.map((n) => {
            const isActive = location.pathname === n.path;
            const Icon = n.icon;
            return (
              <Link key={n.path} to={n.path} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors",
                isActive ? "bg-gray-200 text-gray-900" : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900"
              )}>
                <Icon size={20} className={isActive ? "text-gray-900" : "text-gray-400"} />
                {n.name}
              </Link>
            )
          })}
          
          <div className="pt-6 mt-6 border-t border-gray-100">
            <Link to="/add" className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-bold bg-black text-white hover:opacity-90 transition-colors shadow-sm"
              )}>
                <Plus size={20} />
                录入新题目
              </Link>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="flex flex-row items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl w-full transition-colors">
             <LogOut size={18}/> 登出系统
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-12">
        {children}
      </main>

      {/* Mobile nav placeholder */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around p-3 pb-safe">
        {navs.map(n => {
           const isActive = location.pathname === n.path;
           const Icon = n.icon;
           return (
             <Link key={n.path} to={n.path} className={cn(
               "flex flex-col items-center gap-1 p-2 rounded-lg",
               isActive ? "text-black" : "text-gray-400"
             )}>
               <Icon size={24}/>
               <span className="text-[10px] font-medium">{n.name}</span>
             </Link>
           )
        })}
        <Link to="/add" className="flex flex-col items-center gap-1 p-2 text-blue-600 rounded-lg">
          <div className="bg-blue-100 p-1 rounded-full"><Plus size={20}/></div>
          <span className="text-[10px] font-medium text-blue-600">录入</span>
        </Link>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/questions" element={<Questions />} />
                <Route path="/add" element={<AddQuestion />} />
                <Route path="/practice" element={<Practice />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
