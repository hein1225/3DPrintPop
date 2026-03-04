import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { isPasswordSet, loading: authLoading, login, setInitialPassword } = useAuth();
  const navigate = useNavigate();

  // 如果已经登录，跳转到管理员首页
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  // 如果认证加载完成，设置页面加载状态为false
  useEffect(() => {
    if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading]);

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('请输入密码');
      return;
    }

    if (isPasswordSet === false) {
      // 设置初始密码
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }

      const result = await setInitialPassword(password, confirmPassword);
      if (!result.success) {
        setError(result.message);
        return;
      }

      // 设置密码成功后，自动登录
      const loginResult = await login(password);
      if (!loginResult.success) {
        setError(loginResult.message);
        return;
      }

      navigate('/admin/dashboard');
    } else {
      // 登录
      const result = await login(password);
      if (!result.success) {
        setError(result.message);
        return;
      }

      navigate('/admin/dashboard');
    }
  };

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  return (
    <div className="container">
      <div className="admin-login">
        <h2>{isPasswordSet ? '管理员登录' : '设置初始密码'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {isPasswordSet === false && (
            <div className="form-group">
              <label htmlFor="confirmPassword">确认密码</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}
          
          <button type="submit" className="button">
            {isPasswordSet ? '登录' : '设置密码'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
