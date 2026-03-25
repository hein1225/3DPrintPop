import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { materialAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function MaterialManagement() {
  const { isAuthenticated } = useAuth();
  const [allMaterials, setAllMaterials] = useState([]);
  const [materialUsage, setMaterialUsage] = useState({});
  const [newMaterial, setNewMaterial] = useState({
    color: '',
    type: '',
    pricePerGram: ''
  });
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // 检查认证状态
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

  // 初始化数据
  useEffect(() => {
    // 只有在用户认证后才获取数据
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const initializeData = async () => {
      try {
        // 获取所有耗材
        const materialsResponse = await materialAPI.getAllMaterials();
        setAllMaterials(materialsResponse.data);

        // 获取耗材使用统计
        const usageResponse = await materialAPI.getMaterialUsageTotal();
        setMaterialUsage(usageResponse.data);
      } catch (error) {
        console.error('初始化耗材数据失败:', error);
        setError('初始化数据失败');
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, [isAuthenticated]);

  // 处理添加耗材
  const handleAddMaterial = async () => {
    setError('');
    setSuccessMessage('');

    if (!newMaterial.color || !newMaterial.type || !newMaterial.pricePerGram) {
      setError('请填写完整的耗材信息');
      return;
    }

    try {
      await materialAPI.addMaterial(newMaterial.color, newMaterial.type, parseFloat(newMaterial.pricePerGram));
      // 重新获取耗材列表
      const materialsResponse = await materialAPI.getAllMaterials();
      setAllMaterials(materialsResponse.data);
      // 重新获取耗材使用统计
      const usageResponse = await materialAPI.getMaterialUsageTotal();
      setMaterialUsage(usageResponse.data);
      // 清空表单
      setNewMaterial({ color: '', type: '', pricePerGram: '' });
      setSuccessMessage('耗材添加成功');
    } catch (error) {
      console.error('添加耗材失败:', error);
      setError(error.response?.data?.message || '添加耗材失败');
    }
  };

  // 处理编辑耗材
  const handleEditMaterial = (material) => {
    setEditingMaterial(material);
    setNewMaterial({
      color: material.color,
      type: material.type,
      pricePerGram: material.price_per_gram.toString()
    });
  };

  // 处理保存编辑的耗材
  const handleSaveMaterial = async () => {
    setError('');
    setSuccessMessage('');

    if (!newMaterial.color || !newMaterial.type || !newMaterial.pricePerGram) {
      setError('请填写完整的耗材信息');
      return;
    }

    try {
      await materialAPI.updateMaterial(
        editingMaterial.id,
        newMaterial.color,
        newMaterial.type,
        parseFloat(newMaterial.pricePerGram)
      );
      // 重新获取耗材列表
      const materialsResponse = await materialAPI.getAllMaterials();
      setAllMaterials(materialsResponse.data);
      // 重新获取耗材使用统计
      const usageResponse = await materialAPI.getMaterialUsageTotal();
      setMaterialUsage(usageResponse.data);
      // 清空表单和编辑状态
      setNewMaterial({ color: '', type: '', pricePerGram: '' });
      setEditingMaterial(null);
      setSuccessMessage('耗材更新成功');
    } catch (error) {
      console.error('更新耗材失败:', error);
      setError(error.response?.data?.message || '更新耗材失败');
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setNewMaterial({ color: '', type: '', pricePerGram: '' });
    setEditingMaterial(null);
  };

  // 处理删除耗材
  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('确定要删除这个耗材吗？')) {
      return;
    }

    try {
      await materialAPI.deleteMaterial(id);
      // 重新获取耗材列表
      const materialsResponse = await materialAPI.getAllMaterials();
      setAllMaterials(materialsResponse.data);
      // 重新获取耗材使用统计
      const usageResponse = await materialAPI.getMaterialUsageTotal();
      setMaterialUsage(usageResponse.data);
      setSuccessMessage('耗材删除成功');
    } catch (error) {
      console.error('删除耗材失败:', error);
      setError(error.response?.data?.message || '删除耗材失败');
    }
  };

  // 获取耗材使用量
  const getMaterialUsage = (materialId) => {
    if (!materialUsage) return 0;
    return materialUsage[materialId] || 0;
  };

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>耗材管理</h1>
        <div className="header-buttons">
          <button onClick={() => navigate('/')} className="button">回到首页</button>
          <button onClick={() => navigate('/admin/dashboard')} className="button">返回后台</button>
        </div>
      </div>

      <div className="admin-panel">
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {/* 添加/编辑耗材 */}
        <section className="settings-section">
          <h2>{editingMaterial ? '编辑耗材' : '添加耗材'}</h2>
          <div className="material-form">
            <div className="form-row">
              <div className="form-group">
                <label>颜色</label>
                <input
                  type="text"
                  placeholder="如：红色"
                  value={newMaterial.color}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>材料类型</label>
                <input
                  type="text"
                  placeholder="如：PLA"
                  value={newMaterial.type}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, type: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>价格（元/克）</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="如：0.1"
                  value={newMaterial.pricePerGram}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, pricePerGram: e.target.value }))}
                />
              </div>
            </div>
            {editingMaterial ? (
              <div className="material-form-buttons">
                <button onClick={handleSaveMaterial} className="button">保存</button>
                <button onClick={handleCancelEdit} className="button button-secondary" style={{ marginLeft: '8px' }}>取消</button>
              </div>
            ) : (
              <button onClick={handleAddMaterial} className="button">添加耗材</button>
            )}
          </div>
        </section>

        {/* 现有耗材 */}
        <section className="settings-section">
          <h2>现有耗材</h2>
          <table className="materials-table">
            <thead>
              <tr>
                <th>颜色</th>
                <th>材料类型</th>
                <th>价格（元/克）</th>
                <th>使用量（克）</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {allMaterials.map(material => (
                <tr key={material.id}>
                  <td>{material.color}</td>
                  <td>{material.type}</td>
                  <td>{material.price_per_gram.toFixed(2)}</td>
                  <td>{getMaterialUsage(material.id).toFixed(2)}</td>
                  <td>
                    <button 
                      onClick={() => handleEditMaterial(material)}
                      className="button button-small"
                      style={{ marginRight: '8px' }}
                    >
                      编辑
                    </button>
                    <button 
                      onClick={() => handleDeleteMaterial(material.id)}
                      className="button button-small button-danger"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

export default MaterialManagement;