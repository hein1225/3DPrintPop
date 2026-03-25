import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesAPI } from '../services/api';

function SalesRecords() {
  const [sales, setSales] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSales, setSelectedSales] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState('single'); // 'single' or 'batch'
  const [singleSaleId, setSingleSaleId] = useState(null);
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

  // 处理单个复选框点击
  const handleCheckboxChange = (saleId) => {
    setSelectedSales(prev => {
      if (prev.includes(saleId)) {
        return prev.filter(id => id !== saleId);
      } else {
        return [...prev, saleId];
      }
    });
  };

  // 处理全选复选框点击
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSales(sales.map(sale => sale.id));
    } else {
      setSelectedSales([]);
    }
  };

  // 处理单个删除
  const handleDeleteSingle = (saleId) => {
    setSingleSaleId(saleId);
    setDeleteMode('single');
    setShowConfirm(true);
  };

  // 处理批量删除
  const handleDeleteBatch = () => {
    if (selectedSales.length === 0) return;
    setDeleteMode('batch');
    setShowConfirm(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    try {
      if (deleteMode === 'single' && singleSaleId) {
        await salesAPI.deleteSale(singleSaleId);
        setSales(prev => prev.filter(sale => sale.id !== singleSaleId));
      } else if (deleteMode === 'batch') {
        await salesAPI.deleteSales(selectedSales);
        setSales(prev => prev.filter(sale => !selectedSales.includes(sale.id)));
        setSelectedSales([]);
      }
      setShowConfirm(false);
    } catch (error) {
      console.error('删除销售记录失败:', error);
      setError('删除销售记录失败');
      setShowConfirm(false);
    }
  };

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>销售记录</h1>
        <div className="header-buttons">
          {selectedSales.length > 0 && (
            <button 
              onClick={handleDeleteBatch} 
              className="button delete-button"
              style={{ backgroundColor: '#dc3545', marginRight: '10px' }}
            >
              批量删除 ({selectedSales.length})
            </button>
          )}
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
                  <th>
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedSales.length === sales.length && sales.length > 0}
                    />
                  </th>
                  <th>销售日期</th>
                  <th>商品名称</th>
                  <th>数量</th>
                  <th>销售价格</th>
                  <th>成本价</th>
                  <th>利润</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <input 
                        type="checkbox" 
                        onChange={() => handleCheckboxChange(sale.id)}
                        checked={selectedSales.includes(sale.id)}
                      />
                    </td>
                    <td>{new Date(sale.sale_date).toLocaleString()}</td>
                    <td>{sale.product_name}</td>
                    <td>{sale.quantity}</td>
                    <td>¥{sale.total_amount.toFixed(2)}</td>
                    <td>¥{sale.cost_price.toFixed(2)}</td>
                    <td>¥{(sale.total_amount - sale.cost_price).toFixed(2)}</td>
                    <td>
                      <button 
                        onClick={() => handleDeleteSingle(sale.id)}
                        className="button delete-button"
                        style={{ backgroundColor: '#dc3545', padding: '4px 8px', fontSize: '12px' }}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 确认删除对话框 */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>确认删除</h3>
            <p>{deleteMode === 'single' ? '确定要删除这条销售记录吗？' : `确定要删除选中的 ${selectedSales.length} 条销售记录吗？`}</p>
            <div className="modal-buttons">
              <button onClick={() => setShowConfirm(false)} className="button">取消</button>
              <button onClick={confirmDelete} className="button" style={{ backgroundColor: '#dc3545' }}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesRecords;