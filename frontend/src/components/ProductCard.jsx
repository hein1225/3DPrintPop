function ProductCard({ product, isRecommended, isSpecial, onSell }) {
  // 直接在onClick中实现确认框，确保逻辑正确
  const handleSell = () => {
    // 使用confirm确认对话框
    if (window.confirm(`确认要售出一件"${product.name}"吗？`)) {
      onSell(product.id);
    }
  };

  return (
    <div className={`product-card ${isRecommended ? 'recommended' : ''}`}>
      <div className="product-image-container">
        <img src={product.image_url} alt={product.name} />
        {isSpecial && <div className="special-badge">特价</div>}
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <div className="price-and-stock">
          <p className="price">¥{product.selling_price?.toFixed(2) || '价格待定'}</p>
          <p className="quantity">库存: {product.quantity || 0}</p>
        </div>
        <button 
          onClick={handleSell} 
          className="sell-button"
          disabled={!product.quantity || product.quantity <= 0}
          type="button"
        >
          售出一件
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
