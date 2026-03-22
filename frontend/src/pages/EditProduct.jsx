import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI, materialAPI } from '../services/api';

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [materials, setMaterials] = useState([{ materialId: '', weight: '' }]);
  const [printTime, setPrintTime] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [showOnHome, setShowOnHome] = useState(true);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 获取可用耗材
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await materialAPI.getAllMaterials();
        setAvailableMaterials(response.data);
      } catch (error) {
        console.error('获取耗材失败:', error);
        setError('获取耗材失败');
      }
    };
    fetchMaterials();
  }, []);

  // 获取商品详情
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await productAPI.getProductDetails(id);
        const product = response.data;
        setName(product.product.name);
        setCurrentImageUrl(product.product.image_url);
        setShowOnHome(product.product.show_on_home === 1);
        setPrintTime(product.printingDetails.print_time.toString());
        setSellingPrice(product.pricing.selling_price.toString());
        
        // 处理耗材使用情况
        const materialRows = product.materials.map(material => ({
          materialId: material.material_id.toString(),
          weight: material.weight.toString()
        }));
        setMaterials(materialRows);
      } catch (error) {
        console.error('获取商品详情失败:', error);
        setError('获取商品详情失败');
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id]);

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
    setSubmitting(true);

    // 验证表单
    if (!name) {
      setError('请输入商品名称');
      setSubmitting(false);
      return;
    }

    if (!printTime || isNaN(printTime) || parseFloat(printTime) <= 0) {
      setError('请输入有效的打印时间');
      setSubmitting(false);
      return;
    }

    if (!sellingPrice || isNaN(sellingPrice) || parseFloat(sellingPrice) <= 0) {
      setError('请输入有效的售价');
      setSubmitting(false);
      return;
    }

    // 验证耗材
    for (const material of materials) {
      if (!material.materialId || !material.weight || isNaN(material.weight) || parseFloat(material.weight) <= 0) {
        setError('请填写有效的耗材信息');
        setSubmitting(false);
        return;
      }
    }

    try {
      // 创建FormData
      const formData = new FormData();
      formData.append('name', name);
      if (image) {
        formData.append('image', image);
      }
      formData.append('printTime', printTime);
      formData.append('sellingPrice', sellingPrice);
      formData.append('showOnHome', showOnHome);
      formData.append('materials', JSON.stringify(
        materials.map(m => ({
          materialId: m.materialId,
          weight: m.weight,
          pricePerGram: availableMaterials.find(am => am.id === parseInt(m.materialId))?.price_per_gram || 0
        }))
      ));

      // 提交表单
      await productAPI.updateProduct(id, formData);

      // 跳转到商品管理页面
      navigate('/admin/manage-products');
    } catch (error) {
      console.error('更新商品失败:', error);
      setError(error.response?.data?.message || '更新商品失败');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>编辑商品</h1>
        <div className="header-buttons">
          <button onClick={() => navigate('/')} className="button">回到首页</button>
          <button onClick={() => navigate('/admin/manage-products')} className="button">返回</button>
        </div>
      </div>

      <div className="admin-panel edit-product-form">
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

          {/* 当前商品图片 */}
          <div className="form-group">
            <label>当前图片</label>
            <div className="current-image-preview">
              <img src={currentImageUrl} alt="当前商品图片" style={{ maxWidth: '200px', maxHeight: '200px' }} />
            </div>
          </div>

          {/* 商品图片 */}
          <div className="form-group">
            <label htmlFor="image">更新商品图片（可选）</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
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

          {/* 售价 */}
          <div className="form-group">
            <label htmlFor="sellingPrice">售价（元）</label>
            <input
              type="number"
              step="0.1"
              id="sellingPrice"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              required
            />
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
            <button type="submit" className="button" disabled={submitting}>
              {submitting ? '更新中...' : '更新商品'}
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

export default EditProduct;
