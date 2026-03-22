import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesAPI } from '../services/api';

function SalesRecords() {
  const [sales, setSales] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 获取销售记录和统计数据
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        // 获取销售统计
        const statsResponse = await salesAPI.getSalesStatistics();
        setStatistics(statsResponse.data);

        // 获取销售记录
        const salesResponse = await salesAPI.getAllSales();
        setSales(salesResponse.data);
      } catch (error) {
        console.error('获取销售数据失败:', error);
        setError('获取销售数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchSalesData();
  }, []);

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>销售记录</h1>
        <div className="header-buttons">
          <button onClick={() => navigate('/')} className="button">回到首页</button>
          <button onClick={() => navigate('/admin/dashboard')} className="button">返回</button>
        </div>
      </div>

      <div className="admin-panel">
        {error && <div className="error-message">{error}</div>}

        {/* 销售统计 */}
        {statistics && (
          <div className="sales-summary">
            <h2>销售统计</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <h4>总销售额</h4>
                <p>¥{(statistics.total.total_amount || 0).toFixed(2)}</p>
              </div>
              <div className="summary-item">
                <h4>总销售数量</h4>
                <p>{statistics.total.total_quantity || 0}</p>
              </div>
              <div className="summary-item">
                <h4>今日销售额</h4>
                <p>¥{(statistics.today.total_amount || 0).toFixed(2)}</p>
              </div>
              <div className="summary-item">
                <h4>今日销售数量</h4>
                <p>{statistics.today.total_quantity || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* 销售记录 */}
        <h2>销售记录</h2>
        <div className="sales-records">
          {sales.length === 0 ? (
            <p>暂无销售记录</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>销售日期</th>
                  <th>商品名称</th>
                  <th>数量</th>
                  <th>销售价格</th>
                  <th>成本价</th>
                  <th>利润</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.sale_date).toLocaleString()}</td>
                    <td>{sale.product_name}</td>
                    <td>{sale.quantity}</td>
                    <td>¥{sale.total_amount.toFixed(2)}</td>
                    <td>¥{sale.cost_price.toFixed(2)}</td>
                    <td>¥{(sale.total_amount - sale.cost_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default SalesRecords;