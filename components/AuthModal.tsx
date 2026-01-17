import React, { useState } from 'react';
import { User } from '../types';
import { X, UserPlus, LogIn, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  users: User[];
  onRegister: (newUser: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, users, onRegister }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'login') {
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        onLogin(user);
        onClose();
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng.');
      }
    } else {
      // Register
      if (!username || !password) {
        setError('Vui lòng nhập đầy đủ thông tin.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
      if (users.some(u => u.username === username)) {
        setError('Tên đăng nhập đã tồn tại.');
        return;
      }

      const newUser: User = {
        id: Date.now().toString(),
        username,
        password,
        role: 'user', // Default role is user
        createdAt: new Date().toISOString()
      };
      onRegister(newUser);
      onLogin(newUser); // Auto login after register
      onClose();
    }
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setError(null);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            {mode === 'login' ? <LogIn size={20} className="text-blue-600"/> : <UserPlus size={20} className="text-green-600"/>}
            {mode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              placeholder="Nhập tên đăng nhập"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              placeholder="Nhập mật khẩu"
            />
          </div>

          {mode === 'register' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Xác nhận mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                placeholder="Nhập lại mật khẩu"
              />
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${
              mode === 'login' 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                : 'bg-green-600 hover:bg-green-700 shadow-green-200'
            }`}
          >
            {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>

          <div className="text-center pt-2">
            {mode === 'login' ? (
              <p className="text-sm text-gray-500">
                Chưa có tài khoản?{' '}
                <button type="button" onClick={() => switchMode('register')} className="text-blue-600 font-bold hover:underline">
                  Đăng ký ngay
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Đã có tài khoản?{' '}
                <button type="button" onClick={() => switchMode('login')} className="text-blue-600 font-bold hover:underline">
                  Đăng nhập
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
