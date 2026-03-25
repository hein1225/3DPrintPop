import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI, materialAPI } from '../services/api';

function AddProduct() {
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [materials, setMaterials] = useState([{ materialId: '', weight: '' }]);
  const [printTime, setPrintTime] = useState('');
  const [showOnHome, setShowOnHome] = useState(true);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 获取可用耗材
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await materialAPI.getAllMaterials();
        setAvailableMaterials(response.data);
      } catch (error) {
        console.error('获取耗材失败:', error);
      }
    };
    fetchMaterials();
  }, []);

  // 添加耗材行
  const addMaterialRow = () => {
    setMaterials([...materials, { materialId: '', weight: '' }]);
  };

  // 删除耗材行
  const removeMaterialRow = (index) => {
    if (materials.length > 1) {
      const newMaterials = materials.filter((_, i) => i !== index);
      setMaterials(newMaterials);
    }
  };

  // 更新耗材行
  const updateMaterialRow = (index, field, value) => {
    const newMaterials = [...materials];
    newMaterials[index][field] = value;
    setMaterials(newMaterials);
  };

  // 处理图片上传
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 验证表单
    if (!name) {
      setError('请输入商品名称');
      setLoading(false);
      return;
    }

    if (!image) {
      setError('请上传商品图片');
      setLoading(false);
      return;
    }

    if (!printTime || isNaN(printTime) || parseFloat(printTime) <= 0) {
      setError('请输入有效的打印时间');
      setLoading(false);
      return;
    }

    // 验证耗材
    for (const material of materials) {
      if (!material.materialId || !material.weight || isNaN(material.weight) || parseFloat(material.weight) <= 0) {
        setError('请填写有效的耗材信息');
        setLoading(false);
        return;
      }
    }

    try {
      // 创建FormData
      const formData = new FormData();
      formData.append('name', name);
      formData.append('image', image);
      formData.append('printTime', printTime);
      formData.append('showOnHome', showOnHome);
      formData.append('materials', JSON.stringify(
        materials.map(m => ({
          materialId: m.materialId,
          weight: m.weight,
          pricePerGram: availableMaterials.find(am => am.id === parseInt(m.materialId))?.price_per_gram || 0
        }))
      ));

      // 提交表单
      await productAPI.addProduct(formData);

      // 跳转到商品管理页面
      navigate('/admin/manage-products');
    } catch (error) {
      console.error('添加商品失败:', error);
      setError(error.response?.data?.message || '添加商品失败');
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="admin-header">
        <h1>添加商品</h1>
        <div className="header-buttons">
          <button onClick={() => navigate('/')} className="button">回到首页</button>
          <button onClick={() => navigate('/admin/manage-products')} className="button">返回</button>
        </div>
      </div>

      <div className="admin-panel">
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {/* 商品名称 */}
          <div className="form-group">
            <label htmlFor="name">商品名称</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* 商品图片 */}
          <div className="form-group">
            <label htmlFor="image">商品图片</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
            {image && <p>{image.name}</p>}
          </div>

          {/* 打印时间 */}
          <div className="form-group">
            <label htmlFor="printTime">打印时间（小时）</label>
            <input
              type="number"
              id="printTime"
              step="0.1"
              value={printTime}
              onChange={(e) => setPrintTime(e.target.value)}
              required
            />
          </div>

          {/* 耗材使用情况 */}
          <div className="form-group">
            <label>耗材使用情况</label>
            {materials.map((material, index) => (
              <div key={index} className="material-row">
                <select
                  value={material.materialId}
                  onChange={(e) => updateMaterialRow(index, 'materialId', e.target.value)}
                  required
                >
                  <option value="">选择耗材</option>
                  {availableMaterials.map(availableMaterial => (
                    <option key={availableMaterial.id} value={availableMaterial.id}>
                      {availableMaterial.color} {availableMaterial.type} (¥{availableMaterial.price_per_gram.toFixed(2)}/克)
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.1"
                  placeholder="使用量（克）"
                  value={material.weight}
                  onChange={(e) => updateMaterialRow(index, 'weight', e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => removeMaterialRow(index)}
                  disabled={materials.length <= 1}
                >
                  删除
                </button>
              </div>
            ))}
            <button type="button" onClick={addMaterialRow} className="button">
              添加耗材
            </button>
          </div>



          {/* 在首页显示 */}
          <div className="form-group">
            <label htmlFor="showOnHome">在首页显示</label>
            <label className="switch">
              <input 
                type="checkbox" 
                id="showOnHome"
                checked={showOnHome} 
                onChange={(e) => setShowOnHome(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          {/* 提交按钮 */}
          <div className="form-actions">
            <button type="submit" className="button" disabled={loading}>
              {loading ? '添加中...' : '添加商品'}
            </button>
            <button type="button" onClick={() => navigate('/admin/manage-products')} className="button">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProduct;
