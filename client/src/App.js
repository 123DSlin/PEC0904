import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import FileUpload from './components/FileUpload';
import ConfigDisplay from './components/ConfigDisplay';
import TrieTreeVisualization from './components/TrieTreeVisualization';
import PECDisplay from './components/PECDisplay';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
            <TrieTreeVisualization treeData={analysisResult.trieTree} />
            <PECDisplay pecs={analysisResult.pecs} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
