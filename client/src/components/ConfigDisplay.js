import React from 'react';

const ConfigDisplay = ({ configData }) => {
  if (!configData) return null;

  const { hostname, staticRoutes, accessLists, prefixLists, interfaces, bgpNetworks, namedAcls } = configData;

  return (
    <div className="card">
      <h2 className="section-title">Configuration Analysis Results</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{hostname}</div>
          <div className="stat-label">Router Hostname</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{staticRoutes.length}</div>
          <div className="stat-label">Static Routes</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{accessLists.length}</div>
          <div className="stat-label">Standard ACLs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{namedAcls ? namedAcls.length : 0}</div>
          <div className="stat-label">Named ACLs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{prefixLists.length}</div>
          <div className="stat-label">Prefix Lists</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{interfaces.length}</div>
          <div className="stat-label">Interfaces</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{bgpNetworks.length}</div>
          <div className="stat-label">BGP Networks</div>
        </div>
      </div>

      {staticRoutes.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Static Routes</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Prefix</th>
                <th>Interface</th>
                <th>Next Hop</th>
              </tr>
            </thead>
            <tbody>
              {staticRoutes.map((route, index) => (
                <tr key={index}>
                  <td><code>{route.prefix}</code></td>
                  <td>{route.interface}</td>
                  <td>{route.nextHop || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {bgpNetworks.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>BGP Network Announcements</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Prefix</th>
                <th>Mask</th>
              </tr>
            </thead>
            <tbody>
              {bgpNetworks.map((network, index) => (
                <tr key={index}>
                  <td><code>{network.prefix}</code></td>
                  <td>{network.mask}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {namedAcls && namedAcls.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Named Access Control Lists</h3>
          

          
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Direction/Type</th>
                <th>Description</th>
                <th>Rules</th>
                <th>Applied Interfaces</th>
              </tr>
            </thead>
            <tbody>
              {namedAcls.map((acl, index) => (
                <tr key={index}>
                  <td><code>{acl.name}</code></td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem',
                      backgroundColor: (acl.direction === 'IN' || (acl.direction === 'extended' && acl.name.includes('_IN'))) ? '#e3f2fd' : 
                                   (acl.direction === 'OUT' || (acl.direction === 'extended' && acl.name.includes('_OUT'))) ? '#f3e5f5' : '#f5f5f5',
                      color: (acl.direction === 'IN' || (acl.direction === 'extended' && acl.name.includes('_IN'))) ? '#1976d2' : 
                           (acl.direction === 'OUT' || (acl.direction === 'extended' && acl.name.includes('_OUT'))) ? '#7b1fa2' : '#666666'
                    }}>
                      {acl.direction === 'extended' ? 
                        (acl.name.includes('_IN') ? 'IN' : 
                         acl.name.includes('_OUT') ? 'OUT' : 
                         acl.direction) : 
                        acl.direction}
                    </span>
                  </td>
                  <td>{acl.description}</td>
                  <td>{acl.rules.length} rules</td>
                  <td>
                    {configData.interfaces && configData.interfaces
                      .filter(iface => iface.appliedAcls && iface.appliedAcls.some(appliedAcl => appliedAcl.aclName === acl.name))
                      .map(iface => {
                        const appliedAcl = iface.appliedAcls.find(appliedAcl => appliedAcl.aclName === acl.name);
                        return (
                          <div key={iface.name} style={{ marginBottom: '4px' }}>
                            <code>{iface.name}</code>
                            <span style={{ 
                              marginLeft: '8px',
                              padding: '2px 6px', 
                              borderRadius: '8px', 
                              fontSize: '0.7rem',
                              backgroundColor: appliedAcl.direction === 'in' ? '#e8f5e8' : '#fff3e0',
                              color: appliedAcl.direction === 'in' ? '#2e7d32' : '#f57c00'
                            }}>
                              {appliedAcl.direction.toUpperCase()}
                            </span>
                          </div>
                        );
                      })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* 显示命名 ACL 的详细规则 */}
          {namedAcls.map((acl, aclIndex) => (
            <div key={aclIndex} style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>
                {acl.name} ({acl.direction}) - Rules
              </h4>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Protocol</th>
                    <th>Source</th>
                    <th>Destination</th>
                  </tr>
                </thead>
                <tbody>
                  {acl.rules.map((rule, ruleIndex) => (
                    <tr key={ruleIndex}>
                      <td>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.8rem',
                          backgroundColor: rule.action === 'permit' ? '#e8f5e8' : '#ffebee',
                          color: rule.action === 'permit' ? '#2e7d32' : '#c62828'
                        }}>
                          {rule.action.toUpperCase()}
                        </span>
                      </td>
                      <td><code>{rule.protocol}</code></td>
                      <td>
                        {rule.source.type === 'any' ? 'any' : 
                         rule.source.type === 'prefix' ? <code>{rule.source.value}</code> :
                         rule.source.type === 'ip' ? <code>{rule.source.value}</code> :
                         rule.source.value || rule.source.type}
                      </td>
                      <td>
                        {rule.destination ? 
                          (rule.destination.type === 'any' ? 'any' : 
                           rule.destination.type === 'prefix' ? <code>{rule.destination.value}</code> :
                           rule.destination.type === 'ip' ? <code>{rule.destination.value}</code> :
                           rule.destination.value || rule.destination.type) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {accessLists.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Standard Access Control Lists</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Action</th>
                <th>Prefix</th>
                <th>Wildcard</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {accessLists.map((acl, index) => (
                <tr key={index}>
                  <td>{acl.number}</td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem',
                      backgroundColor: acl.action === 'permit' ? '#e8f5e8' : '#ffebee',
                      color: acl.action === 'permit' ? '#2e7d32' : '#c62828'
                    }}>
                      {acl.action.toUpperCase()}
                    </span>
                  </td>
                  <td><code>{acl.prefix}</code></td>
                  <td>{acl.wildcard || 'N/A'}</td>
                  <td>{acl.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {prefixLists.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Prefix Lists</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Action</th>
                <th>Prefix</th>
              </tr>
            </thead>
            <tbody>
              {prefixLists.map((prefixList, index) => (
                <tr key={index}>
                  <td>{prefixList.name}</td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem',
                      backgroundColor: prefixList.action === 'permit' ? '#e8f5e8' : '#ffebee',
                      color: prefixList.action === 'permit' ? '#2e7d32' : '#c62828'
                    }}>
                      {prefixList.action.toUpperCase()}
                    </span>
                  </td>
                  <td><code>{prefixList.prefix}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {interfaces.length > 0 && (
        <div>
          <h3>Interfaces</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Interface</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {interfaces.map((iface, index) => (
                <tr key={index}>
                  <td>{iface.name}</td>
                  <td><code>{iface.ipAddress}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ConfigDisplay;
