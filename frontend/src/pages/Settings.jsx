import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsAPI, productAPI, materialAPI, authAPI } from '../services/api';

function Settings() {
  const [allProducts, setAllProducts] = useState([]);
  const [settings, setSettings] = useState({
    hourly_power_consumption: '0.5',
    electricity_price: '0.6',
    home_page_title: '3D打印助手'
  });
  const [homePassword, setHomePassword] = useState('');
  const [confirmHomePassword, setConfirmHomePassword] = useState('');
  const [homePasswordError, setHomePasswordError] = useState('');
  const [homePasswordSuccess, setHomePasswordSuccess] = useState('');
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [specialProducts, setSpecialProducts] = useState([]);
  const [validDate, setValidDate] = useState('');
  const [backupFiles, setBackupFiles] = useState([]);
  const [uploadedBackupFile, setUploadedBackupFile] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 获取所有商品
        const productsResponse = await productAPI.getAllProducts();
        setAllProducts(productsResponse.data);

        // 获取当前设置
        const settingsResponse = await settingsAPI.getAllSettings();
        setSettings(settingsResponse.data);

        // 获取备份文件列表
        const backupsResponse = await settingsAPI.getBackupFiles();
        setBackupFiles(backupsResponse.data);
      } catch (error) {
        console.error('初始化设置数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, []);

  // 处理设置更新
  const handleSettingsUpdate = async () => {
    setError('');
    setSuccessMessage('');

    try {
      await settingsAPI.updateSettings(settings);
      setSuccessMessage('设置更新成功');
    } catch (error) {
      console.error('更新设置失败:', error);
      setError(error.response?.data?.message || '更新设置失败');
    }
  };

  // 处理推荐商品设置
  const handleSetRecommended = async () => {
    setError('');
    setSuccessMessage('');

    try {
      await settingsAPI.setRecommended(recommendedProducts);
      setSuccessMessage('今日推荐设置成功');
    } catch (error) {
      console.error('设置推荐商品失败:', error);
      setError(error.response?.data?.message || '设置推荐商品失败');
    }
  };

  // 处理特价商品设置
  const handleSetSpecial = async () => {
    setError('');
    setSuccessMessage('');

    try {
      await settingsAPI.setSpecial(specialProducts);
      setSuccessMessage('今日特价设置成功');
    } catch (error) {
      console.error('设置特价商品失败:', error);
      setError(error.response?.data?.message || '设置特价商品失败');
    }
  };



  // 处理修改密码
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('请填写所有密码字段');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('新密码和确认密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('新密码长度至少为6个字符');
      return;
    }

    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      // 调用修改密码的API
      await authAPI.changePassword(currentPassword, newPassword);
      setPasswordSuccess('密码修改成功');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error('修改密码失败:', error);
      setPasswordError(error.response?.data?.message || '修改密码失败');
    } finally {
      setChangingPassword(false);
    }
  };

  // 处理设置主页密码
  const handleSetHomePassword = async () => {
    if (!homePassword || !confirmHomePassword) {
      setHomePasswordError('请填写所有密码字段');
      return;
    }

    if (homePassword !== confirmHomePassword) {
      setHomePasswordError('新密码和确认密码不一致');
      return;
    }

    if (homePassword.length < 6) {
      setHomePasswordError('密码长度至少为6个字符');
      return;
    }

    setHomePasswordError('');
    setHomePasswordSuccess('');

    try {
      await settingsAPI.setHomePassword(homePassword);
      setHomePasswordSuccess('主页密码设置成功');
      setHomePassword('');
      setConfirmHomePassword('');
      // 清除本地存储中的访问权限，用户下次需要重新输入密码
      localStorage.removeItem('homePageAccess');
    } catch (error) {
      console.error('设置主页密码失败:', error);
      setHomePasswordError(error.response?.data?.message || '设置主页密码失败');
    }
  };

  // 处理备份数据库
  const handleBackupDatabase = async () => {
    setError('');
    setSuccessMessage('');

    try {
      await settingsAPI.backupDatabase();
      // 重新获取备份文件列表
      const backupsResponse = await settingsAPI.getBackupFiles();
      setBackupFiles(backupsResponse.data);
      setSuccessMessage('数据库备份成功');
    } catch (error) {
      console.error('备份数据库失败:', error);
      setError(error.response?.data?.message || '备份数据库失败');
    }
  };

  // 处理备份文件下载
  const handleDownloadBackup = async (timestamp) => {
    try {
      // 调用下载备份的API
      const response = await settingsAPI.downloadBackup(timestamp);
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${timestamp}.db`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载备份失败:', error);
      setError(error.response?.data?.message || '下载备份失败');
    }
  };

  // 处理删除备份文件
  const handleDeleteBackup = async (timestamp) => {
    if (!window.confirm('确定要删除这个备份文件吗？此操作不可恢复！')) {
      return;
    }

    try {
      await settingsAPI.deleteBackup(timestamp);
      // 重新获取备份文件列表
      const backupsResponse = await settingsAPI.getBackupFiles();
      setBackupFiles(backupsResponse.data);
      setSuccessMessage('备份文件删除成功');
    } catch (error) {
      console.error('删除备份失败:', error);
      setError(error.response?.data?.message || '删除备份失败');
    }
  };

  // 从现有备份还原数据库
  const handleRestoreFromBackup = async (timestamp) => {
    if (!window.confirm('确定要从这个备份还原数据库吗？这将覆盖当前所有数据！')) {
      return;
    }

    try {
      await settingsAPI.restoreDatabase(timestamp);
      setSuccessMessage('数据库还原成功');
      // 刷新页面以获取最新数据
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('还原数据库失败:', error);
      setError(error.response?.data?.message || '还原数据库失败');
    }
  };

  // 处理上传备份文件
  const handleUploadBackup = (file) => {
    if (file) {
      setUploadedBackupFile(file);
      setSuccessMessage('备份文件已选择，点击还原数据库开始还原');
    }
  };

  // 处理还原数据库
  const handleRestoreDatabase = async () => {
    setError('');
    setSuccessMessage('');

    if (!uploadedBackupFile) {
      setError('请先选择备份文件');
      return;
    }

    if (!window.confirm('确定要还原数据库吗？这将覆盖当前所有数据！')) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('backupFile', uploadedBackupFile);
      
      await settingsAPI.restoreDatabaseFromFile(formData);
      setSuccessMessage('数据库还原成功');
      // 刷新页面以获取最新数据
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('还原数据库失败:', error);
      setError(error.response?.data?.message || '还原数据库失败');
    }
  };

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>设置</h1>
        <div className="header-buttons">
          <button onClick={() => navigate('/')} className="button">回到首页</button>
          <button onClick={() => navigate('/admin/dashboard')} className="button">返回</button>
        </div>
      </div>

      <div className="admin-panel">
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {/* 今日推荐和特价设置 */}
        <section className="settings-section">
          <h2>商品推荐设置</h2>

          <div className="form-group">
            <label>今日推荐商品</label>
            <div className="product-select-container">
              {allProducts.map(product => (
                <div key={product.id} className="product-select-item">
                  <input
                    type="checkbox"
                    id={`recommended-${product.id}`}
                    value={product.id}
                    checked={recommendedProducts.includes(product.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRecommendedProducts([...recommendedProducts, parseInt(e.target.value)]);
                      } else {
                        setRecommendedProducts(recommendedProducts.filter(id => id !== parseInt(e.target.value)));
                      }
                    }}
                  />
                  <label htmlFor={`recommended-${product.id}`}>{product.name}</label>
                </div>
              ))}
            </div>
            <button onClick={handleSetRecommended} className="button">保存今日推荐</button>
          </div>

          <div className="form-group">
            <label>今日特价商品</label>
            <div className="product-select-container">
              {allProducts.map(product => (
                <div key={product.id} className="product-select-item">
                  <input
                    type="checkbox"
                    id={`special-${product.id}`}
                    value={product.id}
                    checked={specialProducts.includes(product.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSpecialProducts([...specialProducts, parseInt(e.target.value)]);
                      } else {
                        setSpecialProducts(specialProducts.filter(id => id !== parseInt(e.target.value)));
                      }
                    }}
                  />
                  <label htmlFor={`special-${product.id}`}>{product.name}</label>
                </div>
              ))}
            </div>
            <button onClick={handleSetSpecial} className="button">保存今日特价</button>
          </div>
        </section>

        {/* 基本设置 */}
        <section className="settings-section">
          <h2>基本设置</h2>
          
          <div className="form-group">
            <label htmlFor="homePageTitle">主页标题</label>
            <textarea
              id="homePageTitle"
              value={settings.home_page_title || '3D打印摆摊助手'}
              onChange={(e) => setSettings(prev => ({ ...prev, home_page_title: e.target.value }))}
              placeholder="输入主页标题，支持换行"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="hourlyPowerConsumption">平均每小时功耗（度）</label>
            <input
              type="number"
              step="0.1"
              id="hourlyPowerConsumption"
              value={settings.hourly_power_consumption || '0.5'}
              onChange={(e) => setSettings(prev => ({ ...prev, hourly_power_consumption: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="electricityPrice">电价（元/度）</label>
            <input
              type="number"
              step="0.1"
              id="electricityPrice"
              value={settings.electricity_price || '0.6'}
              onChange={(e) => setSettings(prev => ({ ...prev, electricity_price: e.target.value }))}
            />
          </div>

          <button onClick={handleSettingsUpdate} className="button">保存基本设置</button>
        </section>



        {/* 数据备份与还原 */}
        <section className="settings-section">
          <h2>数据备份与还原</h2>
          
          <div className="backup-section">
            <h3>备份数据库</h3>
            <button onClick={handleBackupDatabase} className="button">创建备份</button>
            {backupFiles.length > 0 && (
              <div className="backup-files">
                <h4>现有备份</h4>
                <table className="backup-table">
                  <thead>
                    <tr>
                      <th>备份时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupFiles.map(file => (
                      <tr key={file.timestamp}>
                        <td>{new Date(file.timestamp).toLocaleString()}</td>
                        <td>
                          <button 
                            onClick={() => handleRestoreFromBackup(file.timestamp)}
                            className="button"
                          >
                            还原
                          </button>
                          <button 
                            onClick={() => handleDownloadBackup(file.timestamp)}
                            className="button"
                            style={{ marginLeft: '8px' }}
                          >
                            下载
                          </button>
                          <button 
                            onClick={() => handleDeleteBackup(file.timestamp)}
                            className="button button-danger"
                            style={{ marginLeft: '8px' }}
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="restore-section">
            <h3>还原数据库</h3>
            <div className="restore-upload">
              <input
                type="file"
                accept=".db"
                onChange={(e) => handleUploadBackup(e.target.files[0])}
              />
              <button onClick={handleRestoreDatabase} className="button button-danger">还原数据库</button>
            </div>
          </div>
        </section>

        {/* 修改密码 */}
        <section className="settings-section">
          <h2>修改密码</h2>
          <div className="change-password-form">
            {passwordError && <div className="error-message">{passwordError}</div>}
            {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
            
            <div className="form-group">
              <label htmlFor="currentPassword">当前密码</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="newPassword">新密码</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmNewPassword">确认新密码</label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </div>
            </div>
            
            <button onClick={handleChangePassword} className="button" disabled={changingPassword}>
              {changingPassword ? '修改中...' : '修改密码'}
            </button>
          </div>
        </section>

        {/* 主页访问密码设置 */}
        <section className="settings-section">
          <h2>主页访问密码设置</h2>
          <div className="change-password-form">
            <p className="warning-message">
              <strong>注意：</strong>设置主页密码后，所有访问者需要输入密码才能查看主页内容。清除密码可以移除访问限制。
            </p>
            {homePasswordError && <div className="error-message">{homePasswordError}</div>}
            {homePasswordSuccess && <div className="success-message">{homePasswordSuccess}</div>}
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="homePassword">新密码</label>
                <input
                  type="password"
                  id="homePassword"
                  value={homePassword}
                  onChange={(e) => setHomePassword(e.target.value)}
                  placeholder="请设置主页访问密码"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmHomePassword">确认新密码</label>
                <input
                  type="password"
                  id="confirmHomePassword"
                  value={confirmHomePassword}
                  onChange={(e) => setConfirmHomePassword(e.target.value)}
                  placeholder="请确认主页访问密码"
                />
              </div>
            </div>
            
            <button onClick={handleSetHomePassword} className="button">
              设置主页密码
            </button>
          </div>
        </section>

        {/* 数据重置 */}
        <section className="settings-section">
          <h2>数据重置</h2>
          <div className="reset-data-section">
            <p className="warning-message">
              <strong>警告：</strong>此操作将删除所有商品、耗材、销售记录和推荐设置数据，但会保留管理员密码和打印参数设置。请谨慎操作！
            </p>
            <button 
              onClick={async () => {
                if (window.confirm('确定要重置所有数据吗？此操作不可恢复！')) {
                  try {
                    await settingsAPI.resetDatabase();
                    setSuccessMessage('数据重置成功');
                    setError('');
                    // 刷新页面
                    setTimeout(() => {
                      window.location.reload();
                    }, 1500);
                  } catch (error) {
                    console.error('重置数据失败:', error);
                    setError(error.response?.data?.message || '重置数据失败');
                    setSuccessMessage('');
                  }
                }
              }} 
              className="button button-danger"
            >
              重置所有数据
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Settings;
