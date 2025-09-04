import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import FileUpload from './components/FileUpload';
import ConfigDisplay from './components/ConfigDisplay';
import TrieTreeVisualization from './components/TrieTreeVisualization';
import EnhancedTrieTreeVisualization from './components/EnhancedTrieTreeVisualization';
import PECDisplay from './components/PECDisplay';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visualizationType, setVisualizationType] = useState('enhanced');

  const handleFileUpload = async (file) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('config', file);
      
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setAnalysisResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze configuration file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Network Configuration Analyzer</h1>
        <p>Upload router configuration files to extract prefixes and analyze Packet Equivalence Classes (PECs)</p>
      </header>

      <div className="container">
        <FileUpload onFileUpload={handleFileUpload} loading={loading} />
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {loading && (
          <div className="card">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading-spinner"></div>
              <p>Analyzing configuration file...</p>
            </div>
          </div>
        )}

        {analysisResult && (
          <>
            <ConfigDisplay configData={analysisResult.configData} />
            
            {/* 选择可视化组件 */}
            <div className="visualization-toggle">
              <h2>选择可视化方式</h2>
              <div className="toggle-buttons">
                <button 
                  className="toggle-btn active" 
                  onClick={() => setVisualizationType('enhanced')}
                >
                  🎨 增强版Trie树
                </button>
                <button 
                  className="toggle-btn" 
                  onClick={() => setVisualizationType('basic')}
                >
                  📊 基础版Trie树
                </button>
              </div>
            </div>
            
            {visualizationType === 'enhanced' ? (
              <EnhancedTrieTreeVisualization 
                trieData={analysisResult.trieTree} 
                onNodeClick={(node) => console.log('Node clicked:', node)}
              />
            ) : (
              <TrieTreeVisualization treeData={analysisResult.trieTree} />
            )}
            
            <PECDisplay pecs={analysisResult.pecs} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
