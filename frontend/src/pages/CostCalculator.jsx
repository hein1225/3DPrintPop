import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { materialAPI, settingsAPI } from '../services/api';

function CostCalculator() {
  const [materials, setMaterials] = useState([]);
  const [settings, setSettings] = useState({
    hourly_power_consumption: '0.5',
    electricity_price: '0.6'
  });
  const [selectedMaterials, setSelectedMaterials] = useState([{ materialId: '', weight: '' }]);
  const [printTime, setPrintTime] = useState('');
  const [calculationResult, setCalculationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 获取所有耗材
        const materialsResponse = await materialAPI.getAllMaterials();
        setMaterials(materialsResponse.data);

        // 获取当前设置
        const settingsResponse = await settingsAPI.getAllSettings();
        setSettings(settingsResponse.data);
      } catch (error) {
        console.error('初始化数据失败:', error);
        setError('初始化数据失败');
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, []);

  // 添加耗材行
  const addMaterialRow = () => {
    setSelectedMaterials([...selectedMaterials, { materialId: '', weight: '' }]);
  };

  // 删除耗材行
  const removeMaterialRow = (index) => {
    if (selectedMaterials.length > 1) {
      const newMaterials = selectedMaterials.filter((_, i) => i !== index);
      setSelectedMaterials(newMaterials);
    }
  };

  // 更新耗材行
  const updateMaterialRow = (index, field, value) => {
    const newMaterials = [...selectedMaterials];
    newMaterials[index][field] = value;
    setSelectedMaterials(newMaterials);
  };

  // 计算成本
  const calculateCost = () => {
    setError('');
    setCalculationResult(null);

    if (!printTime) {
      setError('请填写所有必填字段');
      return;
    }

    const time = parseFloat(printTime);
    if (isNaN(time) || time < 0) {
      setError('请输入有效的打印时间');
      return;
    }

    // 验证耗材
    for (const material of selectedMaterials) {
      if (!material.materialId || !material.weight) {
        setError('请填写所有必填字段');
        return;
      }
      const weight = parseFloat(material.weight);
      if (isNaN(weight) || weight <= 0) {
        setError('请输入有效的耗材用量');
        return;
      }
      const foundMaterial = materials.find(m => m.id === parseInt(material.materialId));
      if (!foundMaterial) {
        setError('请选择有效的耗材');
        return;
      }
    }

    // 计算所有耗材成本
    let totalMaterialCost = 0;
    const materialCostDetails = selectedMaterials.map(m => {
      const material = materials.find(mt => mt.id === parseInt(m.materialId));
      const weight = parseFloat(m.weight);
      const cost = weight * material.price_per_gram;
      totalMaterialCost += cost;
      return {
        name: `${material.color} ${material.type}`,
        weight: weight.toFixed(1),
        pricePerGram: material.price_per_gram.toFixed(2),
        cost: cost.toFixed(2)
      };
    });

    // 计算电费
    const hourlyPower = parseFloat(settings.hourly_power_consumption) || 0.5;
    const electricityPrice = parseFloat(settings.electricity_price) || 0.6;
    const powerConsumption = time * hourlyPower;
    const electricityCost = powerConsumption * electricityPrice;

    // 计算总成本
    const totalCost = totalMaterialCost + electricityCost;

    setCalculationResult({
      materialCost: totalMaterialCost.toFixed(2),
      electricityCost: electricityCost.toFixed(2),
      totalCost: totalCost.toFixed(2),
      powerConsumption: powerConsumption.toFixed(2),
      materialCostDetails
    });
  };

  // 重置表单
  const resetForm = () => {
    setSelectedMaterials([{ materialId: '', weight: '' }]);
    setPrintTime('');
    setCalculationResult(null);
    setError('');
  };

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>成本计算器</h1>
        <div className="header-buttons">
          <button onClick={() => navigate('/')} className="button">回到首页</button>
          <button onClick={() => navigate('/admin/dashboard')} className="button">返回</button>
        </div>
      </div>

      <div className="admin-panel">
        {error && <div className="error-message">{error}</div>}

        <section className="settings-section">
          <h2>3D打印成本计算</h2>
          <p className="info-message">仅用于计算3D打印物品的成本，不需要保存。</p>

          {/* 耗材使用情况 */}
          <div className="form-group">
            <label>耗材使用情况</label>
            {selectedMaterials.map((material, index) => (
              <div key={index} className="material-row">
                <select
                  value={material.materialId}
                  onChange={(e) => updateMaterialRow(index, 'materialId', e.target.value)}
                >
                  <option value="">选择耗材</option>
                  {materials.map(availableMaterial => (
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
                />
                <button
                  type="button"
                  onClick={() => removeMaterialRow(index)}
                  disabled={selectedMaterials.length <= 1}
                  className="button button-small button-danger"
                >
                  删除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addMaterialRow}
              className="button button-small"
              style={{ marginTop: '1rem' }}
            >
              添加耗材
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="printTime">打印时间（小时）</label>
            <input
              type="number"
              step="0.1"
              id="printTime"
              value={printTime}
              onChange={(e) => setPrintTime(e.target.value)}
              placeholder="输入打印时间，单位：小时"
            />
          </div>

          <div className="form-actions">
            <button onClick={calculateCost} className="button">计算成本</button>
            <button onClick={resetForm} className="button button-secondary" style={{ marginLeft: '8px' }}>重置</button>
          </div>
        </section>

        {calculationResult && (
          <section className="settings-section">
            <h2>计算结果</h2>
            <div className="calculation-result">
              {/* 耗材成本明细 */}
              <div className="material-cost-details">
                <h3>耗材成本明细</h3>
                {calculationResult.materialCostDetails.map((detail, index) => (
                  <div key={index} className="result-item">
                    <span className="result-label">{detail.name}：</span>
                    <span className="result-value">¥{detail.cost}</span>
                    <span className="result-note">（{detail.weight}克，¥{detail.pricePerGram}/克）</span>
                  </div>
                ))}
              </div>

              {/* 耗材总成本 */}
              <div className="result-item">
                <span className="result-label">耗材总成本：</span>
                <span className="result-value">¥{calculationResult.materialCost}</span>
              </div>

              {/* 电费 */}
              <div className="result-item">
                <span className="result-label">电费：</span>
                <span className="result-value">¥{calculationResult.electricityCost}</span>
                <span className="result-note">（{calculationResult.powerConsumption}度电，{settings.electricity_price}元/度）</span>
              </div>

              {/* 总成本 */}
              <div className="result-item total-cost">
                <span className="result-label">总成本：</span>
                <span className="result-value">¥{calculationResult.totalCost}</span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default CostCalculator;