import React, { useState, useCallback } from 'react';
import './EnhancedTrieTreeVisualization.css';

const EnhancedTrieTreeVisualization = ({ trieData, onNodeClick }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // 节点类型到颜色的映射
  const getNodeColor = (node) => {
    if (node.isEndOfPrefix) {
      if (node.sources && node.sources.length > 0) {
        const sourceType = node.sources[0].type;
        switch (sourceType) {
          case 'static-route':
            return '#4CAF50'; // 绿色 - 静态路由
          case 'ospf':
            return '#2196F3'; // 蓝色 - OSPF
          case 'bgp':
            return '#FF9800'; // 橙色 - BGP
          case 'interface':
            return '#9C27B0'; // 紫色 - 接口
          case 'acl':
            return '#F44336'; // 红色 - 访问控制列表
          case 'route-map':
            return '#FF5722'; // 深橙色 - 路由映射
          case 'prefix-list':
            return '#795548'; // 棕色 - 前缀列表
          default:
            return '#607D8B'; // 蓝灰色 - 默认
        }
      }
      return '#4CAF50'; // 默认绿色
    }
    return '#E0E0E0'; // 灰色 - 中间节点
  };

  // 获取节点边框样式
  const getNodeBorder = (node) => {
    if (node.isEndOfPrefix && node.sources && node.sources.length > 0) {
      return '3px solid #1976D2'; // 蓝色边框 - 重要节点
    }
    return '2px solid #BDBDBD'; // 普通边框
  };

  // 获取节点阴影
  const getNodeShadow = (node) => {
    if (node.isEndOfPrefix && node.sources && node.sources.length > 0) {
      return '0 4px 8px rgba(0,0,0,0.3)'; // 重要节点有阴影
    }
    return '0 2px 4px rgba(0,0,0,0.1)'; // 普通节点轻微阴影
  };

  // 处理节点点击
  const handleNodeClick = useCallback((node, event) => {
    event.stopPropagation();
    setSelectedNode(node);
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick]);

  // 处理节点悬停
  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node);
  }, []);

  // 处理节点离开
  const handleNodeLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  // 渲染节点信息面板
  const renderNodeInfo = (node) => {
    if (!node) return null;

    return (
      <div className="node-info-panel">
        <div className="node-info-header">
          <h3>节点信息</h3>
          <button 
            className="close-btn"
            onClick={() => setSelectedNode(null)}
          >
            ×
          </button>
        </div>
        
        <div className="node-info-content">
          <div className="info-section">
            <h4>基本信息</h4>
            <p><strong>位位置:</strong> {node.bitPosition || 'N/A'}</p>
            <p><strong>前缀:</strong> {node.prefix || 'N/A'}</p>
            <p><strong>类型:</strong> {node.isEndOfPrefix ? '前缀结束节点' : '中间节点'}</p>
          </div>

          {node.sources && node.sources.length > 0 && (
            <div className="info-section">
              <h4>来源信息</h4>
              {node.sources.map((source, index) => (
                <div key={index} className="source-item">
                  <p><strong>类型:</strong> {source.type}</p>
                  {source.router && <p><strong>路由器:</strong> {source.router}</p>}
                  {source.interface && <p><strong>接口:</strong> {source.interface}</p>}
                  {source.nextHop && <p><strong>下一跳:</strong> {source.nextHop}</p>}
                  {source.description && <p><strong>描述:</strong> {source.description}</p>}
                  {source.action && <p><strong>动作:</strong> {source.action}</p>}
                  {source.protocol && <p><strong>协议:</strong> {source.protocol}</p>}
                </div>
              ))}
            </div>
          )}

          {node.origin && (
            <div className="info-section">
              <h4>来源路由器</h4>
              <p>{node.origin}</p>
            </div>
          )}

          {node.weights && node.weights.size > 0 && (
            <div className="info-section">
              <h4>路由权重</h4>
              {Array.from(node.weights.entries()).map(([router, weight]) => (
                <p key={router}><strong>{router}:</strong> {weight}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染单个节点
  const renderNode = (node, path = [], level = 0) => {
    if (!node) return null;

    const nodeColor = getNodeColor(node);
    const nodeBorder = getNodeBorder(node);
    const nodeShadow = getNodeShadow(node);
    const isSelected = selectedNode === node;
    const isHovered = hoveredNode === node;

    return (
      <div
        key={`${level}-${path.join('-')}`}
        className={`trie-node ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
        style={{
          backgroundColor: nodeColor,
          border: nodeBorder,
          boxShadow: nodeShadow,
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          zIndex: isHovered ? 10 : 1
        }}
        onClick={(e) => handleNodeClick(node, e)}
        onMouseEnter={() => handleNodeHover(node)}
        onMouseLeave={handleNodeLeave}
        title={`${node.prefix || '中间节点'} - ${node.sources ? node.sources.length : 0} 个来源`}
      >
        <div className="node-content">
          <div className="node-label">
            {node.bitPosition !== undefined ? `bit ${node.bitPosition}` : 'Root'}
          </div>
          
          {node.isEndOfPrefix && (
            <div className="node-prefix">
              {node.prefix}
            </div>
          )}
          
          {node.sources && node.sources.length > 0 && (
            <div className="node-sources">
              {node.sources.map((source, index) => (
                <div key={index} className="source-badge">
                  {source.type}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染Trie树
  const renderTrieTree = (node, path = [], level = 0) => {
    if (!node) return null;

    const children = [];
    if (node.children && node.children.length > 0) {
      node.children.forEach((child, index) => {
        const childPath = [...path, child.bit];
        children.push(
          <div key={index} className="trie-branch">
            <div className="branch-label">{child.bit}</div>
            <div className="branch-line"></div>
            {renderTrieTree(child.node, childPath, level + 1)}
          </div>
        );
      });
    }

    return (
      <div className="trie-tree">
        {renderNode(node, path, level)}
        {children.length > 0 && (
          <div className="trie-children">
            {children}
          </div>
        )}
      </div>
    );
  };

  // 渲染图例
  const renderLegend = () => {
    const legendItems = [
      { type: 'static-route', label: '静态路由', color: '#4CAF50' },
      { type: 'ospf', label: 'OSPF', color: '#2196F3' },
      { type: 'bgp', label: 'BGP', color: '#FF9800' },
      { type: 'interface', label: '接口', color: '#9C27B0' },
      { type: 'acl', label: '访问控制列表', color: '#F44336' },
      { type: 'route-map', label: '路由映射', color: '#FF5722' },
      { type: 'prefix-list', label: '前缀列表', color: '#795548' },
      { type: 'intermediate', label: '中间节点', color: '#E0E0E0' }
    ];

    return (
      <div className="trie-legend">
        <h4>图例</h4>
        <div className="legend-items">
          {legendItems.map((item, index) => (
            <div key={index} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="legend-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="enhanced-trie-visualization">
      <div className="trie-container">
        <div className="trie-header">
          <h2>Trie树可视化</h2>
          <p>点击节点查看详细信息，不同颜色代表不同的配置类型</p>
        </div>
        
        <div className="trie-content">
          <div className="trie-tree-container">
            {trieData ? renderTrieTree(trieData) : (
              <div className="no-data">暂无Trie树数据</div>
            )}
          </div>
          
          <div className="trie-sidebar">
            {renderLegend()}
            {selectedNode && renderNodeInfo(selectedNode)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTrieTreeVisualization;
