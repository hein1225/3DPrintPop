import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI, salesAPI } from '../services/api';

function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [sellingPrice, setSellingPrice] = useState('');
  const [restockQuantity, setRestockQuantity] = useState('1');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [restocking, setRestocking] = useState(false);
  const [error, setError] = useState('');
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
      setSellingPrice(response.data.pricing.selling_price);
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
    setSellingPrice('');
    setError('');
  };

  // 更新商品售价
  const handleUpdatePrice = async () => {
    if (!sellingPrice || isNaN(sellingPrice) || parseFloat(sellingPrice) <= 0) {
      setError('请输入有效的售价');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      await productAPI.updateProductPrice(selectedProduct.id, parseFloat(sellingPrice));
      // 重新获取商品详情
      await fetchProductDetails(selectedProduct.id);
    } catch (error) {
      console.error('更新售价失败:', error);
      setError(error.response?.data?.message || '更新售价失败');
    } finally {
      setUpdating(false);
    }
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

  // 补货商品
  const handleRestockProduct = async () => {
    if (!restockQuantity || isNaN(restockQuantity) || parseInt(restockQuantity) <= 0) {
      setError('请输入有效的补货数量');
      return;
    }

    setRestocking(true);
    setError('');

    try {
      await productAPI.restockProduct(selectedProduct.id, parseInt(restockQuantity));
      // 重新获取所有商品，更新数量
      const response = await productAPI.getAllProducts();
      setProducts(response.data);
      // 重新获取商品详情
      await fetchProductDetails(selectedProduct.id);
      // 重置补货数量
      setRestockQuantity('1');
    } catch (error) {
      console.error('补货失败:', error);
      setError(error.response?.data?.message || '补货失败');
    } finally {
      setRestocking(false);
    }
  };

  // 记录销售
  const handleRecordSale = async () => {
    if (!productDetails) return;

    try {
      await salesAPI.addSale(selectedProduct.id, 1, parseFloat(sellingPrice));
      alert('销售记录添加成功');
    } catch (error) {
      console.error('添加销售记录失败:', error);
      setError(error.response?.data?.message || '添加销售记录失败');
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
                  <span className="label">库存数量:</span>
                  <span>{selectedProduct.quantity || 0}</span>
                </div>
                
                {/* 补货功能 */}
                <h3>补货管理</h3>
                <div className="restock-section">
                  <div className="price-input">
                    <input
                      type="number"
                      min="1"
                      value={restockQuantity}
                      onChange={(e) => setRestockQuantity(e.target.value)}
                      placeholder="输入补货数量"
                    />
                    <button onClick={handleRestockProduct} disabled={restocking}>
                      {restocking ? '补货中...' : '补货'}
                    </button>
                  </div>
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

                {/* 定价信息 */}
                {productDetails?.pricing && (
                  <>
                    <h3>定价信息</h3>
                    <div className="info-item">
                      <span className="label">成本价:</span>
                      <span>¥{productDetails.pricing.cost_price.toFixed(2)}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">售价:</span>
                      <div className="price-input">
                        <input
                          type="number"
                          step="0.1"
                          value={sellingPrice}
                          onChange={(e) => setSellingPrice(e.target.value)}
                        />
                        <button onClick={handleUpdatePrice} disabled={updating}>
                          {updating ? '更新中...' : '更新售价'}
                        </button>
                      </div>
                    </div>
                    <div className="info-item">
                      <span className="label">利润:</span>
                      <span>¥{(parseFloat(sellingPrice) - productDetails.pricing.cost_price).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="product-actions">
              <button onClick={handleRecordSale} className="button">记录销售</button>
              <button onClick={() => navigate(`/admin/edit-product/${selectedProduct.id}`)} className="button">编辑商品</button>
              <button onClick={handleDeleteProduct} className="button button-danger">删除商品</button>
              <button onClick={cancelSelectProduct} className="button">取消</button>
            </div>

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
                      <p className="product-stock">库存: {product.quantity || 0}</p>
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
