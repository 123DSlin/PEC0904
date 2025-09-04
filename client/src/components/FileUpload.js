import React, { useRef } from 'react';

const FileUpload = ({ onFileUpload, loading }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="card">
      <h2 className="section-title">Upload Configuration File</h2>
      
      <div
        className="upload-area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={openFileDialog}
        style={{
          border: '2px dashed #007bff',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: '#f8f9fa',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#e9ecef';
          e.target.style.borderColor = '#0056b3';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#f8f9fa';
          e.target.style.borderColor = '#007bff';
        }}
      >
        <div style={{ fontSize: '3rem', color: '#007bff', marginBottom: '20px' }}>
          📁
        </div>
        <h3>Drop your configuration file here</h3>
        <p>or click to browse</p>
        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
          Supports: Cisco, Juniper, Huawei, Arista configurations
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept=".cfg,.txt,.conf,.config"
        style={{ display: 'none' }}
        disabled={loading}
      />

      {loading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Processing configuration file...</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
