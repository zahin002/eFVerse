import React, { useState, useEffect } from 'react';
import axios from 'axios';
axios.defaults.withCredentials = true;

export default function ManagerDetailView({ data, onBack }) {

    const [boosts, setBoosts] = useState([]);

    useEffect(() => {
        if (data && data.managerid) {
            axios.get(`http://localhost:5001/api/managers/boosts/${data.managerid}`)
                 .then(res => {
                     setBoosts(res.data);
                 })
                 .catch(err => console.error("Error fetching boosts:", err));
        }
    }, [data]);

    
    const containerStyle = { 
        padding: '20px 0 40px 0', 
        background: 'transparent', 
        minHeight: '100vh', 
        color: 'white', 
        fontFamily: "'Outfit', sans-serif" 
    };
    const profileCardStyle = { 
        background: 'rgba(17, 24, 39, 0.7)', 
        backdropFilter: 'blur(16px)', 
        WebkitBackdropFilter: 'blur(16px)', 
        borderRadius: '16px', 
        padding: '40px', 
        maxWidth: '800px', 
        margin: '0 auto', 
        border: '1px solid rgba(255, 255, 255, 0.05)', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)' 
    };
    const labelStyle = { 
        color: '#94a3b8', 
        fontSize: '0.8em', 
        textTransform: 'uppercase', 
        letterSpacing: '1px', 
        marginBottom: '5px' 
    };
    const valueStyle = { 
        fontSize: '1.3em', 
        fontWeight: 'bold', 
        marginBottom: '25px', 
        color: '#00f2fe' 
    };
    const backBtnStyle = { 
        padding: '10px 20px', 
        background: 'transparent', 
        border: '1px solid rgba(255, 255, 255, 0.2)', 
        color: 'white', 
        cursor: 'pointer', 
        borderRadius: '8px', 
        marginBottom: '30px', 
        fontWeight: '700', 
        fontFamily: "'Outfit', sans-serif", 
        textTransform: 'uppercase', 
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)' 
    };

  
    const boosterContainerStyle = { 
        display: 'flex', 
        gap: '20px', 
        marginTop: '20px',
        padding: '30px',
        background: '#151517', 
        borderRadius: '10px',
        border: '1px solid #2a2a2a'
    };
    
    const boosterCardStyle = { 
        flex: 1, 
        background: '#222224', 
        borderRadius: '8px', 
        padding: '20px', 
        position: 'relative',
        minHeight: '100px',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
    };

    return (
        <div style={containerStyle}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <button onClick={onBack} style={backBtnStyle}>← Return to Hub</button>
                
                <div style={profileCardStyle}>
                    <div style={{ borderLeft: '5px solid #007bff', paddingLeft: '20px', marginBottom: '40px' }}>
                        <h1 style={{ margin: 0, fontSize: '2.5em', color: '#e6e600' }}>{data.managername}</h1>
                        <p style={{ color: '#aaa', margin: '5px 0' }}>Professional Tactical Profile</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        <div>
                            <div style={labelStyle}>Tactical Playstyle</div>
                            <div style={valueStyle}>{data.playstyle}</div>

                            <div style={labelStyle}>Primary Nationality</div>
                            <div style={valueStyle}>{data.countryname || 'International'}</div>
                        </div>

                        <div>
                            <div style={labelStyle}>Current Club Assignment</div>
                            <div style={valueStyle}>{data.clubname || 'Unattached'}</div>

                            <div style={labelStyle}>League Association</div>
                            <div style={valueStyle}>{data.leaguename || 'None'}</div>
                        </div>
                    </div>

                    {/* --- PLAYSTYLE PROFICIENCIES METERS --- */}
                    <div style={{ marginTop: '30px' }}>
                        <div style={labelStyle}>Tactical Playstyle Proficiencies</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '10px' }}>
                            {[
                                { name: 'Possession', val: data.possession_game || 50 },
                                { name: 'Quick Counter', val: data.quick_counter || 50 },
                                { name: 'Long Ball Ctr', val: data.long_ball_counter || 50 },
                                { name: 'Out Wide', val: data.out_wide || 50 },
                                { name: 'Long Ball', val: data.long_ball || 50 }
                            ].map((ps, idx) => (
                                <div key={idx} style={{ background: '#151517', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '12px 10px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.72em', color: '#94a3b8', marginBottom: '6px' }}>{ps.name}</div>
                                    <div style={{ fontSize: '1.4em', fontWeight: '900', color: ps.val >= 85 ? '#00f2fe' : ps.val >= 70 ? '#4ade80' : '#f59e0b' }}>
                                        {ps.val}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- LINK-UP SYSTEM DISPLAY --- */}
                    {data.linkup_type && (
                        <div style={{ marginTop: '30px', background: '#151517', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '10px', padding: '20px' }}>
                            <div style={{ color: '#fbbf24', fontSize: '0.85em', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🔗 Link-Up Philosophy: <span style={{ color: '#fff' }}>{data.linkup_type}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                <div>
                                    <div style={{ fontSize: '0.7em', color: '#888', textTransform: 'uppercase' }}>Center Piece</div>
                                    <div style={{ fontSize: '1.05em', fontWeight: 'bold', color: '#38bdf8', marginTop: '3px' }}>{data.linkup_centerpiece || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7em', color: '#888', textTransform: 'uppercase' }}>Key Man</div>
                                    <div style={{ fontSize: '1.05em', fontWeight: 'bold', color: '#a78bfa', marginTop: '3px' }}>{data.linkup_keyman || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7em', color: '#888', textTransform: 'uppercase' }}>Active Positions</div>
                                    <div style={{ fontSize: '1.05em', fontWeight: 'bold', color: '#34d399', marginTop: '3px' }}>{data.linkup_positions || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ---BOOSTER DISPLAY --- */}
                    <div style={{ marginTop: '30px' }}>
                        <div style={labelStyle}>Active Stat Boosters</div>
                        
                        <div style={boosterContainerStyle}>
                            {boosts.length > 0 ? (
                                boosts.map((boost, index) => (
                                    <div key={index} style={boosterCardStyle}>
                                        <div style={{ color: '#ff4d79', fontSize: '0.85em', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>
                                            Booster {index + 1}
                                        </div>
                                        <div style={{ fontSize: '1.3em', color: '#fff', fontWeight: '500' }}>
                                            {boost.statname}
                                        </div>
                                        
                                        <div style={{ position: 'absolute', bottom: '10px', right: '20px', fontSize: '3em', fontWeight: '900', color: '#fff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                                            +{boost.boostvalue}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ color: '#666', fontStyle: 'italic', width: '100%', textAlign: 'center' }}>
                                    No tactical boosters assigned to this manager.
                                </div>
                            )}
                        </div>
                        {boosts.length > 0 && (
                            <p style={{textAlign: 'center', color: '#666', fontSize: '0.8em', marginTop: '10px'}}>
                                The above Player Stats will be boosted when this manager is selected.
                            </p>
                        )}
                    </div>

                    <div style={{ marginTop: '40px', padding: '20px', background: '#252525', borderRadius: '8px', border: '1px dashed #444', textAlign: 'center' }}>
                        <p style={{ color: '#888', margin: 0, fontSize: '0.9em' }}>
                            SQL Registry ID: <b>{data.managerid}</b>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}