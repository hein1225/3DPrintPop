import { useState, useEffect } from 'react';
import { productAPI, settingsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import HomePassword from '../components/HomePassword';

function Home() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [specialProducts, setSpecialProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [homePageTitle, setHomePageTitle] = useState('3D打印助手');
  const [passwordVerified, setPasswordVerified] = useState(false);

  // 获取所有商品
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productAPI.getAllProducts();
        setProducts(response.data);
      } catch (error) {
        console.error('获取商品失败:', error);
      }
    };
    fetchProducts();
  }, []);

  // 检查本地存储，看是否已经有访问权限，以及是否超时
  useEffect(() => {
    const hasAccess = localStorage.getItem('homePageAccess');
    const accessTime = localStorage.getItem('homePageAccessTime');
    
    if (hasAccess === 'granted' && accessTime) {
      const now = Date.now();
      const accessTimestamp = parseInt(accessTime);
      const thirtyMinutes = 30 * 60 * 1000; // 30分钟，单位毫秒
      
      // 检查是否在30分钟内
      if (now - accessTimestamp < thirtyMinutes) {
        setPasswordVerified(true);
      } else {
        // 超时，清除本地存储
        localStorage.removeItem('homePageAccess');
        localStorage.removeItem('homePageAccessTime');
      }
    }
  }, []);

  // 获取今日推荐和特价以及设置
  useEffect(() => {
    // 只有密码验证通过后才获取数据
    if (!passwordVerified) return;

    const fetchRecommendationsAndSettings = async () => {
      try {
        // 获取推荐商品
        const response = await settingsAPI.getRecommendations();
        setRecommendedProducts(response.data.recommended || []);
        setSpecialProducts(response.data.special || []);
        
        // 获取设置
        const settingsResponse = await settingsAPI.getAllSettings();
        if (settingsResponse.data.home_page_title) {
          setHomePageTitle(settingsResponse.data.home_page_title);
        }
      } catch (error) {
        console.error('获取推荐商品或设置失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendationsAndSettings();
  }, [passwordVerified]);

  // 过滤搜索结果
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 处理售出一件商品
  const handleSellOne = async (productId) => {
    try {
      await productAPI.sellOneProduct(productId);
      // 更新商品列表
      const response = await productAPI.getAllProducts();
      setProducts(response.data);
      setMessage('商品售出成功');
      setMessageType('success');
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('售出商品失败:', error);
      setMessage('售出商品失败，请重试');
      setMessageType('error');
      setTimeout(() => {
        setMessage('');
      }, 3000);
    }
  };

  // 检查商品是否为特价
  const isSpecialProduct = (productId) => {
    return specialProducts.some(product => product.id === productId);
  };

  // 检查商品是否为推荐
  const isRecommendedProduct = (productId) => {
    return recommendedProducts.some(product => product.id === productId);
  };

  // 密码未验证通过，显示密码输入界面
  if (!passwordVerified) {
    return <HomePassword onPasswordVerified={() => setPasswordVerified(true)} />;
  }

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  return (
    <div className="home">
      {/* 页面标题 */}
      <header className="container">
        <h1 className="home-title" dangerouslySetInnerHTML={{ __html: homePageTitle.replace(/\n/g, '<br/>') }} />
      </header>

      {/* 搜索栏 */}
      <div className="container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="搜索商品..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        {/* 所有商品，推荐商品排在第一位 */}
        <section>
          <h2>商品列表</h2>
          <div className="product-grid">
          {filteredProducts.length > 0 ? (
            // 先显示推荐商品，再显示普通商品
            [...filteredProducts
              .filter(product => isRecommendedProduct(product.id))
              .map(product => ({
                ...product,
                isRecommended: true
              })),
            ...filteredProducts
              .filter(product => !isRecommendedProduct(product.id))
              .map(product => ({
                ...product,
                isRecommended: false
              }))]
              .map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isRecommended={product.isRecommended}
                  isSpecial={isSpecialProduct(product.id)}
                  onSell={handleSellOne}
                />
              ))
          ) : (
            <p>没有找到匹配的商品</p>
          )}
        </div>
      </section>
      </div>
      {/* 页脚 */}
      <footer className="footer">
        <p>© 2026 3D打印助手</p>
        <p>
          <a href="/admin/login" className="admin-link">管理员入口</a>
        </p>
      </footer>
    </div>
  );
}

export default Home;
