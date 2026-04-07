import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import CytoscapeComponent from 'react-cytoscapejs';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('nodes');
    const [systemState, setSystemState] = useState({ nodes: [], stats: {}, logs: [] });
    const [blockchainData, setBlockchainData] = useState(null);
    const [totalShards, setTotalShards] = useState(0); // New state for Shards
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const cyRef = useRef(null);

    // Fetch System State and Shards
    useEffect(() => {
        const fetchSystemState = async () => {
            try {
                const res = await axios.get('/api/admin/system-state');
                setSystemState(res.data);
            } catch (err) {
                console.error("Failed to fetch system state", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchShardCount = async () => {
            try {
                const res = await axios.get('/api/admin/stats/shards');
                if (res.data.success) {
                    setTotalShards(res.data.totalShards);
                }
            } catch (err) {
                console.error("Failed to fetch shard count", err);
            }
        };

        const fetchBlockchainData = async () => {
            try {
                const res = await axios.get('/api/admin/blockchain');
                setBlockchainData(res.data);
            } catch (err) {
                console.error("Failed to fetch blockchain data", err);
            }
        };

        fetchSystemState();
        fetchShardCount();
        if (activeTab === 'blockchain') {
            fetchBlockchainData();
        }

        const interval = setInterval(() => {
            fetchSystemState();
            fetchShardCount();
            if (activeTab === 'blockchain') fetchBlockchainData();
        }, 3000);

        return () => clearInterval(interval);
    }, [refreshTrigger, activeTab]);

    const handleSimulateFailure = async (nodeId) => {
        try {
            await axios.post('/api/admin/simulate/node-failure', { nodeId });
        } catch (err) {
            console.error("Simulation failed", err);
        }
    };

    const handleNodeRecovery = async (nodeId) => {
        try {
            await axios.post('/api/admin/simulate/node-recovery', { nodeId });
        } catch (err) {
            console.error("Recovery failed", err);
        }
    };

    // Updated Topology Logic: Hub-and-Spoke with dynamic styling
    const elements = [
        { data: { id: 'center', label: 'Network Hub', type: 'hub' } },
        ...systemState.nodes.map(node => ({
            data: { 
                id: node.id, 
                label: node.name, 
                status: node.status 
            }
        })),
        ...systemState.nodes.map(node => ({
            data: { source: 'center', target: node.id }
        }))
    ];

    // Layout fix to prevent overlapping
    const layout = { 
        name: 'circle', 
        padding: 50, 
        radius: 150,
        animate: true,
        animationDuration: 500 
    };

    const renderNodesTab = () => (
        <>
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card">
                    <h3>Files Stored</h3>
                    <p className="stat-value">{systemState.stats.files || 0}</p>
                </div>
                <div className="card">
                    <h3>Active Replicas</h3>
                    <p className="stat-value">{systemState.stats.replicas || 0}</p>
                </div>
                <div className="card">
                    <h3>Storage Used</h3>
                    <p className="stat-value">{(systemState.stats.storageUsed / 1024).toFixed(2) || 0} KB</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div className="network-viz-container" style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', background: 'white' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Network Topology (Real-time)</h3>
                    <CytoscapeComponent
                        elements={elements}
                        style={{ width: '100%', height: '400px' }}
                        layout={layout}
                        cy={(cy) => { cyRef.current = cy; }}
                        stylesheet={[
                            {
                                selector: 'node',
                                style: {
                                    'background-color': '#3b82f6',
                                    'label': 'data(label)',
                                    'color': '#1f2937',
                                    'font-size': '12px',
                                    'text-valign': 'bottom',
                                    'text-margin-y': 8,
                                    'width': 30,
                                    'height': 30
                                }
                            },
                            {
                                selector: 'node[id = "center"]',
                                style: {
                                    'background-color': '#111827',
                                    'width': 50,
                                    'height': 50,
                                    'shape': 'diamond'
                                }
                            },
                            {
                                selector: 'node[status = "online"]',
                                style: { 'background-color': '#10b981' } // Green
                            },
                            {
                                selector: 'node[status = "offline"]',
                                style: { 'background-color': '#ef4444' } // Red
                            },
                            {
                                selector: 'edge',
                                style: { 
                                    'width': 2, 
                                    'line-color': '#cbd5e1',
                                    'curve-style': 'bezier'
                                }
                            }
                        ]}
                    />
                    <div className="node-controls" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {systemState.nodes.map(node => (
                            <button
                                key={node.id}
                                onClick={() => node.status === 'online' ? handleSimulateFailure(node.id) : handleNodeRecovery(node.id)}
                                style={{
                                    backgroundColor: node.status === 'online' ? '#ef4444' : '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.6rem 1rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                {node.status === 'online' ? `Kill ${node.name}` : `Recover ${node.name}`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="event-log" style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', height: '540px', overflowY: 'auto', background: 'white' }}>
                    <h3 style={{ borderBottom: '2px solid #f3f4f6', paddingBottom: '0.5rem' }}>System Audit Log</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {systemState.logs.map(log => (
                            <li key={log.id} style={{ marginBottom: '0.8rem', borderBottom: '1px solid #f9fafb', paddingBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <br />
                                <strong style={{
                                    fontSize: '0.85rem',
                                    color: log.type === 'CRITICAL' ? '#ef4444' :
                                           log.type === 'SUCCESS' ? '#10b981' :
                                           log.type === 'RECOVERY' ? '#3b82f6' : '#374151'
                                }}>[{log.type}]</strong> <span style={{ fontSize: '0.9rem' }}>{log.message}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );

    const renderBlockchainTab = () => {
        if (!blockchainData) return <div>Loading Blockchain Data...</div>;
        return (
            <div className="blockchain-view">
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="card">
                        <h3>Current Block</h3>
                        <p className="stat-value">#{blockchainData.network.height}</p>
                    </div>
                    <div className="card">
                        <h3>Gas Price</h3>
                        <p className="stat-value">{parseFloat(blockchainData.network.gasPrice).toFixed(2)} Gwei</p>
                    </div>
                    <div className="card">
                        <h3>Total Key Shards</h3>
                        <p className="stat-value" style={{ color: '#3b82f6' }}>{totalShards}</p> 
                    </div>
                    <div className="card">
                        <h3>Network</h3>
                        <p className="stat-value" style={{ fontSize: '1rem' }}>{blockchainData.network.name}</p>
                    </div>
                </div>

                <div className="card full-width">
                    <h3>Recent Ledger Transactions</h3>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Hash</th>
                                <th>Block</th>
                                <th>Value (ETH)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {blockchainData.blocks.slice(0, 5).map(block => (
                                <tr key={block.hash}>
                                    <td className="hash">{block.hash.substring(0, 15)}...</td>
                                    <td>{block.number}</td>
                                    <td>{parseFloat(block.gasUsed / 1000000).toFixed(4)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard-container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#111827' }}>SAN Admin Console</h1>
                    <p style={{ color: '#6b7280', margin: 0 }}>Decentralized Storage Area Network Monitoring</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setRefreshTrigger(prev => prev + 1)} className="btn-refresh">Manual Sync</button>
                    <button onClick={() => window.location.href = '/dashboard'} className="btn-secondary">Switch to User View</button>
                </div>
            </header>

            <div className="tabs" style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', borderBottom: '1px solid #e5e7eb' }}>
                <button className={`tab-btn ${activeTab === 'nodes' ? 'active' : ''}`} onClick={() => setActiveTab('nodes')}>Network Topology</button>
                <button className={`tab-btn ${activeTab === 'blockchain' ? 'active' : ''}`} onClick={() => setActiveTab('blockchain')}>Blockchain Monitor</button>
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: '5rem' }}>Synchronizing with Network...</div> : (activeTab === 'nodes' ? renderNodesTab() : renderBlockchainTab())}

            <style>{`
                .card { padding: 1.25rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .card h3 { margin: 0; font-size: 0.875rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.025em; }
                .stat-value { font-size: 1.875rem; font-weight: 700; color: #111827; margin-top: 0.5rem; }
                .tab-btn { padding: 1rem 0; border: none; background: none; font-size: 0.95rem; font-weight: 600; color: #6b7280; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s; }
                .tab-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; }
                .btn-refresh { background: #3b82f6; color: white; border: none; padding: 0.6rem 1.2rem; borderRadius: 6px; cursor: pointer; font-weight: 500; }
                .btn-secondary { background: white; color: #374151; border: 1px solid #d1d5db; padding: 0.6rem 1.2rem; borderRadius: 6px; cursor: pointer; }
                .data-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                .data-table th { text-align: left; padding: 0.75rem; border-bottom: 2px solid #f3f4f6; color: #4b5563; font-size: 0.85rem; }
                .data-table td { padding: 1rem 0.75rem; border-bottom: 1px solid #f3f4f6; font-size: 0.9rem; }
                .hash { font-family: 'Courier New', monospace; color: #2563eb; font-weight: 600; }
            `}</style>
        </div>
    );
};

export default AdminDashboard;