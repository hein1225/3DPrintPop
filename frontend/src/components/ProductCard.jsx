function ProductCard({ product, isRecommended, isSpecial, onSell }) {
  // 直接在onClick中实现确认框，确保逻辑正确
  const handleSell = () => {
    // 让用户输入销售价格
    const sellingPrice = prompt(`请输入"${product.name}"的销售价格：`, product.selling_price || '');
    if (sellingPrice && !isNaN(sellingPrice) && parseFloat(sellingPrice) > 0) {
      onSell(product.id, parseFloat(sellingPrice));
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
        </div>
        <button 
          onClick={handleSell} 
          className="sell-button"
          type="button"
        >
          售出一件
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
