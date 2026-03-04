import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { salesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import SalesStatistics from '../components/SalesStatistics';

function AdminDashboard() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // 获取销售统计数据
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await salesAPI.getSalesStatistics();
        setStatistics(response.data);
      } catch (error) {
        console.error('获取销售统计失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatistics();
  }, []);

  // 处理登出
  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  return (
    <div className="container">
      {/* 页面标题和登出按钮 */}
      <div className="admin-header">
        <h1>管理员后台</h1>
        <div className="header-buttons">
          <button onClick={() => navigate('/')} className="button">回到首页</button>
          <button onClick={handleLogout} className="button button-danger">登出</button>
        </div>
      </div>

      {/* 状态栏 */}
      <div className="status-bar">
        <div className="status-item">
          <h4>今日销售情况</h4>
          <div className="value">
            {statistics.today.sales_count || 0} 笔订单
          </div>
        </div>
        <div className="status-item">
          <h4>今日获利情况</h4>
          <div className="value">
            ¥{statistics.today.total_amount ? statistics.today.total_amount.toFixed(2) : '0.00'}
          </div>
        </div>
        <div className="status-item">
          <h4>累计销售情况</h4>
          <div className="value">
            {statistics.total.sales_count || 0} 笔订单
          </div>
        </div>
        <div className="status-item">
          <h4>累计获利情况</h4>
          <div className="value">
            ¥{statistics.total.total_amount ? statistics.total.total_amount.toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      {/* 导航栏 */}
      <div className="admin-nav">
        <Link to="/admin/add-product" className="button">添加商品</Link>
        <Link to="/admin/manage-products" className="button">管理商品</Link>
        <Link to="/admin/material-usage" className="button">耗材使用统计</Link>
        <Link to="/admin/cost-calculator" className="button">成本计算器</Link>
        <Link to="/admin/settings" className="button">设置</Link>
      </div>

      {/* 销售统计图表 */}
      <SalesStatistics statistics={statistics} />

      {/* 页脚 */}
      <footer className="footer">
        <p>© 2026 3D打印摆摊助手</p>
      </footer>
    </div>
  );
}

export default AdminDashboard;
