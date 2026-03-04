import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { materialAPI } from '../services/api';

function MaterialUsage() {
  const [materialUsage, setMaterialUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 获取耗材使用总量
  useEffect(() => {
    const fetchMaterialUsage = async () => {
      try {
        const response = await materialAPI.getMaterialUsageTotal();
        setMaterialUsage(response.data);
      } catch (error) {
        console.error('获取耗材使用情况失败:', error);
        setError('获取耗材使用情况失败');
      } finally {
        setLoading(false);
      }
    };
    fetchMaterialUsage();
  }, []);

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>耗材使用统计</h1>
        <button onClick={() => navigate('/admin/dashboard')} className="button">返回</button>
      </div>

      <div className="admin-panel">
        {error && <div className="error-message">{error}</div>}

        {materialUsage.length === 0 ? (
          <p>暂无耗材使用数据</p>
        ) : (
          <div className="material-usage-list">
            <h2>耗材使用总量</h2>
            <table className="material-usage-table">
              <thead>
                <tr>
                  <th>颜色</th>
                  <th>材料类型</th>
                  <th>使用总量（克）</th>
                </tr>
              </thead>
              <tbody>
                {materialUsage.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'even' : 'odd'}>
                    <td>{item.color}</td>
                    <td>{item.type}</td>
                    <td>{item.total_weight ? item.total_weight.toFixed(2) : '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default MaterialUsage;
