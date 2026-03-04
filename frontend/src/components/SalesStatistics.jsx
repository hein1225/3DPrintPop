function SalesStatistics({ statistics }) {
  if (!statistics) {
    return <div className="admin-panel">暂无销售数据</div>;
  }

  return (
    <div className="admin-panel">
      <h2>销售统计</h2>
      
      {/* 销售统计摘要 */}
      <div className="sales-summary">
        <h3>销售概览</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <h4>今日订单数</h4>
            <p>{statistics.today.sales_count || 0} 笔</p>
          </div>
          <div className="summary-item">
            <h4>今日销售数量</h4>
            <p>{statistics.today.total_quantity || 0} 件</p>
          </div>
          <div className="summary-item">
            <h4>今日销售金额</h4>
            <p>¥{statistics.today.total_amount ? statistics.today.total_amount.toFixed(2) : '0.00'}</p>
          </div>
          <div className="summary-item">
            <h4>累计订单数</h4>
            <p>{statistics.total.sales_count || 0} 笔</p>
          </div>
          <div className="summary-item">
            <h4>累计销售数量</h4>
            <p>{statistics.total.total_quantity || 0} 件</p>
          </div>
          <div className="summary-item">
            <h4>累计销售金额</h4>
            <p>¥{statistics.total.total_amount ? statistics.total.total_amount.toFixed(2) : '0.00'}</p>
          </div>
        </div>
      </div>

      {/* 商品销售排名 */}
      {statistics.productSales && statistics.productSales.length > 0 && (
        <div className="product-sales-ranking">
          <h3>商品销售排名</h3>
          <table className="sales-table">
            <thead>
              <tr>
                <th>商品名称</th>
                <th>销售笔数</th>
                <th>销售数量</th>
                <th>销售金额</th>
              </tr>
            </thead>
            <tbody>
              {statistics.productSales.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                  <td>{item.name}</td>
                  <td>{item.sales_count || 0}</td>
                  <td>{item.total_quantity || 0}</td>
                  <td>¥{item.total_amount ? item.total_amount.toFixed(2) : '0.00'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SalesStatistics;
