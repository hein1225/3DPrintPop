import { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

// 创建认证上下文
const AuthContext = createContext(null);

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isPasswordSet, setIsPasswordSet] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初始化检查密码状态
  useEffect(() => {
    checkPasswordStatus();
  }, []);

  // 检查密码设置状态
  const checkPasswordStatus = async () => {
    try {
      const response = await authAPI.checkPasswordStatus();
      setIsPasswordSet(response.data.passwordSet);
    } catch (error) {
      console.error('检查密码状态失败:', error);
      setIsPasswordSet(false);
    } finally {
      setLoading(false);
    }
  };

  // 登录
  const login = async (password) => {
    try {
      const response = await authAPI.login(password);
      const newToken = response.data.token;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || '登录失败'
      };
    }
  };

  // 设置初始密码
  const setInitialPassword = async (password, confirmPassword) => {
    try {
      await authAPI.setInitialPassword(password, confirmPassword);
      setIsPasswordSet(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || '设置密码失败'
      };
    }
  };

  // 登出
  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  // 上下文值
  const value = {
    token,
    isAuthenticated: !!token,
    isPasswordSet,
    loading,
    login,
    setInitialPassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义钩子，用于访问认证上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
