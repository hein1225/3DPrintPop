import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

function HomePassword({ onPasswordVerified }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [passwordRequired, setPasswordRequired] = useState(false);

  useEffect(() => {
    // 检查是否需要密码
    const checkPasswordStatus = async () => {
      try {
        const response = await settingsAPI.checkHomePasswordStatus();
        setPasswordRequired(response.data.passwordSet);
        
        // 如果不需要密码，直接验证通过
        if (!response.data.passwordSet) {
          onPasswordVerified();
        }
      } catch (err) {
        console.error('检查密码状态失败:', err);
        // 出错时默认允许访问
        onPasswordVerified();
      } finally {
        setLoading(false);
      }
    };

    checkPasswordStatus();
  }, [onPasswordVerified]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('请输入密码');
      return;
    }

    try {
      const response = await settingsAPI.verifyHomePassword(password);
      if (response.data.valid) {
        // 密码正确，保存到本地存储，设置30分钟过期
        const now = Date.now();
        localStorage.setItem('homePageAccess', 'granted');
        localStorage.setItem('homePageAccessTime', now.toString());
        onPasswordVerified();
      } else {
        setError('密码错误');
      }
    } catch (err) {
      console.error('验证密码失败:', err);
      setError('验证密码失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="password-container">
        <div className="password-form">
          <h2>加载中...</h2>
        </div>
      </div>
    );
  }

  if (!passwordRequired) {
    return null;
  }

  return (
    <div className="password-container">
      <div className="password-form">
        <h2>3D打印助手</h2>
        <p>请输入访问密码</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="button">
            进入
          </button>
        </form>
      </div>
    </div>
  );
}

export default HomePassword;