import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI, salesAPI } from '../services/api';

function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [salesQuantity, setSalesQuantity] = useState(1);
  const [salesPrice, setSalesPrice] = useState('');
  const [salesMessage, setSalesMessage] = useState('');
  const navigate = useNavigate();

  // 获取所有商品
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productAPI.getAllProducts();
        setProducts(response.data);
      } catch (error) {
        console.error('获取商品失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 获取商品详情
  const fetchProductDetails = async (productId) => {
    try {
      const response = await productAPI.getProductDetails(productId);
      setProductDetails(response.data);
    } catch (error) {
      console.error('获取商品详情失败:', error);
    }
  };

  // 选择商品
  const selectProduct = (product) => {
    setSelectedProduct(product);
    fetchProductDetails(product.id);
  };

  // 取消选择商品
  const cancelSelectProduct = () => {
    setSelectedProduct(null);
    setProductDetails(null);
    setError('');
  };



  // 删除商品
  const handleDeleteProduct = async () => {
    if (!window.confirm('确定要删除这个商品吗？')) {
      return;
    }

    try {
      await productAPI.deleteProduct(selectedProduct.id);
      // 从列表中移除商品
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      // 取消选择
      cancelSelectProduct();
    } catch (error) {
      console.error('删除商品失败:', error);
      setError(error.response?.data?.message || '删除商品失败');
    }
  };





  // 切换商品显示状态
  const handleToggleShowStatus = async (checked) => {
    try {
      await productAPI.updateProductShowStatus(selectedProduct.id, checked);
      // 重新获取所有商品，更新显示状态
      const response = await productAPI.getAllProducts();
      setProducts(response.data);
      // 重新获取商品详情
      const productDetailResponse = await productAPI.getProductDetails(selectedProduct.id);
      setProductDetails(productDetailResponse.data);
      // 更新selectedProduct状态，确保开关控件即时显示更改后的状态
      const updatedProduct = productDetailResponse.data.product;
      if (updatedProduct) {
        setSelectedProduct(updatedProduct);
      }
    } catch (error) {
      console.error('更新商品显示状态失败:', error);
      setError(error.response?.data?.message || '更新商品显示状态失败');
    }
  };

  // 补录销售记录
  const handleAddSalesRecord = async () => {
    if (!salesQuantity || !salesPrice) {
      setSalesMessage('请填写数量和价格');
      return;
    }

    try {
      const totalAmount = salesQuantity * parseFloat(salesPrice);
      await salesAPI.addSale(selectedProduct.id, salesQuantity, totalAmount);
      setSalesMessage('销售记录添加成功');
      // 重置表单
      setSalesQuantity(1);
      setSalesPrice('');
      // 3秒后关闭表单
      setTimeout(() => {
        setShowSalesForm(false);
        setSalesMessage('');
      }, 3000);
    } catch (error) {
      console.error('添加销售记录失败:', error);
      setSalesMessage(error.response?.data?.message || '添加销售记录失败');
    }
  };

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>管理商品</h1>
        <div className="header-buttons">
          <button onClick={() => navigate('/')} className="button">回到首页</button>
          <button onClick={() => navigate('/admin/add-product')} className="button">添加商品</button>
          <button onClick={() => navigate('/admin/dashboard')} className="button">返回</button>
        </div>
      </div>

      <div className="admin-panel">
        {selectedProduct ? (
          // 商品详情和编辑区域
          <div className="product-details-view">
            <h2>{selectedProduct.name}</h2>
            
            <div className="product-info-grid">
              {/* 商品图片 */}
              <div className="product-image">
                <img src={selectedProduct.image_url} alt={selectedProduct.name} />
              </div>

              {/* 商品基本信息 */}
              <div className="product-info">
                <h3>商品信息</h3>
                <div className="info-item">
                  <span className="label">商品名称:</span>
                  <span>{selectedProduct.name}</span>
                </div>
                <div className="info-item">
                  <span className="label">在首页显示:</span>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={selectedProduct.show_on_home === 1} 
                      onChange={(e) => handleToggleShowStatus(e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                {/* 打印详情 */}
                {productDetails?.printingDetails && (
                  <>
                    <h3>打印详情</h3>
                    <div className="info-item">
                      <span className="label">打印时间:</span>
                      <span>{productDetails.printingDetails.print_time} 小时</span>
                    </div>
                    <div className="info-item">
                      <span className="label">功耗:</span>
                      <span>{productDetails.printingDetails.power_consumption} 度</span>
                    </div>
                    <div className="info-item">
                      <span className="label">电费:</span>
                      <span>¥{productDetails.printingDetails.electricity_cost.toFixed(2)}</span>
                    </div>
                  </>
                )}

                {/* 耗材使用情况 */}
                {productDetails?.materials && productDetails.materials.length > 0 && (
                  <>
                    <h3>耗材使用情况</h3>
                    {productDetails.materials.map((material, index) => (
                      <div key={index} className="material-usage-item">
                        <span className="label">{material.color} {material.type}:</span>
                        <span>{material.weight} 克</span>
                      </div>
                    ))}
                  </>
                )}

                {/* 成本信息 */}
                {productDetails?.pricing && (
                  <>
                    <h3>成本信息</h3>
                    <div className="info-item">
                      <span className="label">成本价:</span>
                      <span>¥{productDetails.pricing.cost_price.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="product-actions">
              <button onClick={() => navigate(`/admin/edit-product/${selectedProduct.id}`)} className="button">编辑商品</button>
              <button onClick={() => setShowSalesForm(true)} className="button">补录销售记录</button>
              <button onClick={handleDeleteProduct} className="button button-danger">删除商品</button>
              <button onClick={cancelSelectProduct} className="button">取消</button>
            </div>

            {/* 补录销售记录表单 */}
            {showSalesForm && (
              <div className="sales-form">
                <h3>补录销售记录</h3>
                {salesMessage && <div className="message">{salesMessage}</div>}
                <div className="form-row">
                  <div className="form-group">
                    <label>数量</label>
                    <input
                      type="number"
                      min="1"
                      value={salesQuantity}
                      onChange={(e) => setSalesQuantity(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>销售价格（元）</label>
                    <input
                      type="number"
                      step="0.01"
                      value={salesPrice}
                      onChange={(e) => setSalesPrice(e.target.value)}
                      placeholder={productDetails?.pricing?.selling_price || '请输入销售价格'}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button onClick={handleAddSalesRecord} className="button">确认添加</button>
                  <button onClick={() => setShowSalesForm(false)} className="button button-secondary">取消</button>
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}
          </div>
        ) : (
          // 商品列表
          <div className="product-list-container">
            <h2>商品列表</h2>
            <div className="product-list">
              {products.length === 0 ? (
                <p>暂无商品</p>
              ) : (
                products.map(product => (
                  <div
                    key={product.id}
                    className={`product-item ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                    onClick={() => selectProduct(product)}
                  >
                    <div className="product-item-info">
                      <h3>{product.name}</h3>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageProducts;
