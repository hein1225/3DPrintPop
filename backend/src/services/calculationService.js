// 计算成本和利润
function calculateCostAndProfit(printTime, materialUsage, hourlyPowerConsumption, electricityPrice) {
  // 计算电费
  const powerConsumption = printTime * hourlyPowerConsumption;
  const electricityCost = powerConsumption * electricityPrice;

  // 计算耗材成本
  const materialCost = materialUsage.reduce((total, item) => {
    return total + (item.weight * item.price_per_gram);
  }, 0);

  // 计算总成本
  const costPrice = electricityCost + materialCost;

  return {
    powerConsumption,
    electricityCost,
    materialCost,
    costPrice
  };
}

// 计算利润
function calculateProfit(costPrice, sellingPrice) {
  return sellingPrice - costPrice;
}

module.exports = {
  calculateCostAndProfit,
  calculateProfit
};
