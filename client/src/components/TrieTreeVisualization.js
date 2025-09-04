import React from 'react';

const TrieTreeVisualization = ({ treeData }) => {
  if (!treeData) return null;

  const renderNode = (node, level = 0, path = []) => {
    const indent = level * 40;
    
    return (
      <div key={`${level}-${path.join('')}`} style={{ marginLeft: indent }}>
        <div className="tree-node" style={{
          display: 'inline-block',
          padding: '8px 12px',
          margin: '4px',
          backgroundColor: node.isEndOfPrefix ? '#e3f2fd' : '#f5f5f5',
          border: node.isEndOfPrefix ? '2px solid #2196f3' : '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '0.9rem',
          minWidth: '120px',
          textAlign: 'center'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            bit {node.bitPosition}
          </div>
          
          {node.isEndOfPrefix && (
            <div style={{ fontSize: '0.8rem', color: '#1976d2' }}>
              {node.prefix}
            </div>
          )}
          
          {node.origin && (
            <div style={{ fontSize: '0.7rem', color: '#388e3c', marginTop: '4px' }}>
              origin: {node.origin}
            </div>
          )}
          
          {node.sources && node.sources.length > 0 && (
            <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
              {node.sources.map((source, idx) => (
                <div key={idx}>
                  {source.type}: {source.router}
                </div>
              ))}
            </div>
          )}

          {/* 显示权重信息 (新增) */}
          {node.weights && node.weights.size > 0 && (
            <div style={{ 
              fontSize: '0.6rem', 
              color: '#ff9800', 
              marginTop: '4px',
              backgroundColor: '#fff3e0',
              padding: '2px 4px',
              borderRadius: '3px'
            }}>
              weights: {Array.from(node.weights.entries()).map(([router, weight]) => 
                `${router}:${weight}`
              ).join(', ')}
            </div>
          )}
        </div>
        
        {node.children && node.children.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            {node.children.map((child, idx) => (
              <div key={idx} style={{ marginBottom: '10px' }}>
                <div style={{ 
                  marginLeft: '20px', 
                  fontSize: '0.8rem', 
                  color: '#666',
                  fontFamily: 'monospace'
                }}>
                  {child.bit} →
                </div>
                {renderNode(child.node, level + 1, [...path, child.bit])}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card">
      <h2 className="section-title">Trie Tree Visualization</h2>
      
      <div className="tree-container">
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fafafa', 
          borderRadius: '6px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '20px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: '#333'
          }}>
            Root Node
          </div>
          
          {renderNode(treeData)}
        </div>
      </div>
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          <strong>Legend:</strong> 
          <span style={{ color: '#2196f3' }}>Blue nodes</span> = complete prefixes, 
          <span style={{ color: '#388e3c' }}> Green</span> = origin router, 
          <span style={{ color: '#ff9800' }}> Orange</span> = routing weights
        </p>
      </div>
    </div>
  );
};

export default TrieTreeVisualization;
