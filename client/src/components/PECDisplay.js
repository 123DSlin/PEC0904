import React, { useState } from 'react';

const PECDisplay = ({ pecs }) => {
  const [exportFormat, setExportFormat] = useState('json');
  const [showStats, setShowStats] = useState(false);

  if (!pecs || pecs.length === 0) return null;

  const handleExport = () => {
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (exportFormat) {
      case 'json':
        content = JSON.stringify(pecs, null, 2);
        filename = 'pecs.json';
        mimeType = 'application/json';
        break;
      case 'csv':
        content = convertToCSV();
        filename = 'pecs.csv';
        mimeType = 'text/csv';
        break;
      case 'txt':
        content = convertToText();
        filename = 'pecs.txt';
        mimeType = 'text/plain';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = () => {
    const headers = ['ID', 'Prefix', 'Prefix Length', 'Source Types', 'Router', 'Description'];
    const rows = pecs.map(pec => [
      pec.id,
      pec.prefix,
      pec.characteristics.prefixLength,
      pec.characteristics.sourceTypes.join(';'),
      pec.sources[0]?.router || 'N/A',
      pec.description
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  };

  const convertToText = () => {
    let text = 'Packet Equivalence Classes (PECs)\n';
    text += '=====================================\n\n';
    
    pecs.forEach(pec => {
      text += `PEC ${pec.id}: ${pec.prefix}\n`;
      text += `  Prefix Length: ${pec.characteristics.prefixLength} bits\n`;
      text += `  Source Types: ${pec.characteristics.sourceTypes.join(', ')}\n`;
      text += `  Router: ${pec.sources[0]?.router || 'N/A'}\n`;
      text += `  Description: ${pec.description}\n`;
      text += '\n';
    });
    
    return text;
  };

  const getPECStats = () => {
    const stats = {
      totalPECs: pecs.length,
      prefixLengthDistribution: {},
      sourceTypeDistribution: {},
      routerDistribution: {}
    };

    pecs.forEach(pec => {
      const length = pec.characteristics.prefixLength;
      stats.prefixLengthDistribution[length] = (stats.prefixLengthDistribution[length] || 0) + 1;
      
      pec.characteristics.sourceTypes.forEach(type => {
        stats.sourceTypeDistribution[type] = (stats.sourceTypeDistribution[type] || 0) + 1;
      });
      
      if (pec.sources[0] && pec.sources[0].router) {
        const router = pec.sources[0].router;
        stats.routerDistribution[router] = (stats.routerDistribution[router] || 0) + 1;
      }
    });

    return stats;
  };

  const stats = getPECStats();

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="section-title">Packet Equivalence Classes (PECs)</h2>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
          
          <select 
            value={exportFormat} 
            onChange={(e) => setExportFormat(e.target.value)}
            className="form-control"
            style={{ width: 'auto', margin: 0 }}
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="txt">Text</option>
          </select>
          
          <button className="btn" onClick={handleExport}>
            Export
          </button>
        </div>
      </div>

      {showStats && (
        <div className="stats-grid" style={{ marginBottom: '30px' }}>
          <div className="stat-card">
            <div className="stat-number">{stats.totalPECs}</div>
            <div className="stat-label">Total PECs</div>
          </div>
          
          {Object.entries(stats.prefixLengthDistribution).map(([length, count]) => (
            <div key={length} className="stat-card">
              <div className="stat-number">{count}</div>
              <div className="stat-label">/{length} prefixes</div>
            </div>
          ))}
        </div>
      )}

      <div className="pec-grid">
        {pecs.map((pec) => (
          <div key={pec.id} className="pec-card">
            <div className="pec-id">PEC {pec.id}</div>
            <div className="pec-prefix">{pec.prefix}</div>
            
            <div className="pec-details">
              <div><strong>Prefix Length:</strong> {pec.characteristics.prefixLength} bits</div>
              <div><strong>Source Types:</strong> {pec.characteristics.sourceTypes.join(', ')}</div>
              <div><strong>Router:</strong> {pec.sources[0]?.router || 'N/A'}</div>
              {pec.sources[0]?.interface && (
                <div><strong>Interface:</strong> {pec.sources[0].interface}</div>
              )}
              {pec.sources[0]?.nextHop && (
                <div><strong>Next Hop:</strong> {pec.sources[0].nextHop}</div>
              )}
              <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#888' }}>
                {pec.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          <strong>Note:</strong> Each PEC represents a group of packets that receive identical forwarding treatment
        </p>
      </div>
    </div>
  );
};

export default PECDisplay;
