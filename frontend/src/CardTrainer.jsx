import React, { useState, useEffect } from 'react';
import axios from 'axios';

const authAxios = axios.create({
    baseURL: 'http://localhost:5001/api',
    withCredentials: true
});

// --- UI HELPERS ---
const getStatColor = (value) => {
    if (value >= 90) return { bg: '#00d2d3', text: '#000' }; 
    if (value >= 80) return { bg: '#39ff14', text: '#000' }; 
    if (value >= 70) return { bg: '#f1c40f', text: '#000' }; 
    return { bg: '#ff4d4d', text: '#fff' }; 
};

export default function CardTrainer({ card, onBack, onComplete }) {
    const [allocations, setAllocations] = useState({
        shooting: 0, passing: 0, dribbling: 0, dexterity: 0,
        lowerBody: 0, aerial: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0
    });

    const [buildName, setBuildName] = useState(""); 
    const [savedBuilds, setSavedBuilds] = useState([]); 
    const [communityBuilds, setCommunityBuilds] = useState([]); 
    const [buildTab, setBuildTab] = useState('mine'); 
    const [isPublic, setIsPublic] = useState(false); 
    const [managersList, setManagersList] = useState([]);
    const [selectedManager, setSelectedManager] = useState("");
    const [positionsList, setPositionsList] = useState([]);
    const [progressionRules, setProgressionRules] = useState({}); // ✅ STATE FOR RULES
    const [loading, setLoading] = useState(true);

    const baseStats = card?.stats || {
        offensiveawareness: 60, finishing: 60, ballcontrol: 60, dribbling: 60, passing: 60,
        kickingpower: 60, speed: 60, acceleration: 60, stamina: 60, balance: 60,
        physicalcontact: 60, jump: 60, defensiveawareness: 60, tackling: 60, aggression: 60,
        gkawareness: 40, gkcatching: 40, gkparrying: 40, gkreflexes: 40, gkreach: 40
    };

    const getRoleGroup = (pos) => {
        if (!pos || positionsList.length === 0) return 'MIDFIELDER';
        const p = pos.toUpperCase().trim();
        const match = positionsList.find(item => 
            (item.positioncode || item.PositionCode || '').toUpperCase() === p
        );
        return match ? (match.rolegroup || match.RoleGroup) : 'MIDFIELDER';
    };

    const isGK = card.rolegroup?.toUpperCase() === 'GOALKEEPER' || 
                 getRoleGroup(card.primaryposition || card.positioncode) === 'GOALKEEPER';

    
    const transformRulesToObject = (rulesArray) => {
    const rules = {};
    rulesArray.forEach(item => {
        let programName = item.programname || item.ProgramName;
        
        
        const nameMap = {
            'Lower Body Strength': 'lowerBody',
            'Aerial Strength': 'aerial',
            'Shooting': 'shooting',
            'Passing': 'passing',
            'Dribbling': 'dribbling',
            'Dexterity': 'dexterity',
            'Defending': 'defending',
            'GK 1': 'gk1',
            'GK 2': 'gk2',
            'GK 3': 'gk3'
        };
        
        programName = nameMap[programName] || programName.toLowerCase();
        
        if (!rules[programName]) {
            rules[programName] = [];
        }
        const statName = item.statname || item.StatName;
        rules[programName].push(statName);
    });
    return rules;
};

    const fetchBuildLists = async () => {
        if (!card?.cardid) return;
        try {
            const currentRes = await authAxios.get(`/progression/my-build/${card.cardid}?t=${Date.now()}`);
            if (currentRes.data) {
                setAllocations({
                    shooting: currentRes.data.shooting || 0,
                    passing: currentRes.data.passing || 0,
                    dribbling: currentRes.data.dribbling || 0,
                    dexterity: currentRes.data.dexterity || 0,
                    lowerBody: currentRes.data.lowerbody || 0, 
                    aerial: currentRes.data.aerial || 0,
                    defending: currentRes.data.defending || 0,
                    gk1: currentRes.data.gk1 || 0,
                    gk2: currentRes.data.gk2 || 0,
                    gk3: currentRes.data.gk3 || 0
                });
            }

            const listRes = await authAxios.get(`/progression/builds/${card.cardid}?t=${Date.now()}`);
            setSavedBuilds(listRes.data || []);

            const commRes = await authAxios.get(`/progression/community-builds/${card.cardid}?t=${Date.now()}`);
            setCommunityBuilds(commRes.data || []);

            const mgrRes = await authAxios.get(`/progression/managers-with-effects?t=${Date.now()}`);
            setManagersList(mgrRes.data || []);

            const posRes = await authAxios.get('/progression/positions');
            setPositionsList(posRes.data || []);

            // ✅ FETCH PROGRESSION RULES FROM DATABASE
            const rulesRes = await authAxios.get('/progression/rules');
            const transformedRules = transformRulesToObject(rulesRes.data);
            setProgressionRules(transformedRules);

        } catch (err) {
            console.log("Error loading data:", err);
            
            setProgressionRules({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBuildLists();
    }, [card]);

    const handleLoadBuild = (build) => {
        setAllocations({
            shooting: build.finishing || build.shooting || 0,
            passing: build.passing || 0,
            dribbling: build.dribbling || 0,
            dexterity: build.offensiveawareness || build.dexterity || 0,
            lowerBody: build.speed || build.lowerbody || 0, 
            aerial: build.jump || build.aerial || 0,
            defending: build.defensiveawareness || build.defending || 0,
            gk1: build.gkawareness || build.gk1 || 0,
            gk2: build.gkcatching || build.gk2 || 0,
            gk3: build.gkparrying || build.gk3 || 0
        });
        alert(`Loaded Concept Build: ${build.buildname}`);
    };

    const calculateLiveOVR = () => {
        const { shooting, passing, dribbling, dexterity, lowerBody, aerial, defending, gk1, gk2, gk3 } = allocations;
        let rawBoost = 0;
        const role = card.rolegroup?.toUpperCase() || getRoleGroup(card.primaryposition || card.positioncode);

        if (role === 'FORWARD') rawBoost = (shooting * 0.45) + (dexterity * 0.3) + (dribbling * 0.15) + (lowerBody * 0.1);
        else if (role === 'WINGER') rawBoost = (dribbling * 0.35) + (lowerBody * 0.3) + (passing * 0.2) + (dexterity * 0.15);
        else if (role === 'MIDFIELDER') rawBoost = (passing * 0.4) + (dribbling * 0.25) + (defending * 0.15) + (lowerBody * 0.2);
        else if (role === 'DEFENDER') rawBoost = (defending * 0.55) + (aerial * 0.25) + (lowerBody * 0.1) + (dexterity * 0.1);
        else if (role === 'GOALKEEPER') rawBoost = (gk1 * 0.4) + (gk2 * 0.3) + (gk3 * 0.3);

        const baseOvr = card.baseoverallrating || 80;
        const maxOvr = card.maxoverallrating || 99;
        let organicBoost = rawBoost * 2.8;

        let managerOvrBonus = 0;
        if (selectedManager) {
            const mgr = managersList.find(m => m.managerid.toString() === selectedManager);
            if (mgr && mgr.effects && mgr.effects.length > 0) {
                const totalStatsBoosted = mgr.effects.reduce((sum, eff) => sum + eff.boost, 0);
                managerOvrBonus = totalStatsBoosted * 0.15; 
            }
        }

        const projectedOVR = Math.round(baseOvr + organicBoost + managerOvrBonus);
        const ultimateMax = maxOvr + (managerOvrBonus > 0 ? 1 : 0);
        return Math.max(baseOvr, Math.min(projectedOVR, ultimateMax));
    };

    const calculateCost = (currentLevel) => {
        if (currentLevel <= 4) return 1;
        if (currentLevel <= 8) return 2;
        if (currentLevel <= 12) return 3;
        return 4;
    };

    const totalUsed = Object.values(allocations).reduce((sum, lvl) => {
        for (let i = 1; i <= lvl; i++) sum += calculateCost(i);
        return sum;
    }, 0);

    const pointsLeft = (card.totalprogressionpoints || 64) - totalUsed;
    const currentLiveOVR = calculateLiveOVR(); 

    const handleIncrement = (key) => {
        const nextLevel = allocations[key] + 1;
        if (pointsLeft >= calculateCost(nextLevel) && nextLevel <= 16) {
            setAllocations(prev => ({ ...prev, [key]: nextLevel }));
        }
    };

    const handleDecrement = (key) => {
        if (allocations[key] > 0) setAllocations(prev => ({ ...prev, [key]: prev[key] - 1 }));
    };

    const handleSmartAllocate = () => {
        let currentAllocations = { shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBody: 0, aerial: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
        let pointsRemaining = card.totalprogressionpoints || 64;

        const role = card.rolegroup?.toUpperCase() || getRoleGroup(card.primaryposition || card.positioncode);
        let weights = {};

        if (role === 'FORWARD') weights = { shooting: 0.45, dexterity: 0.3, dribbling: 0.15, lowerBody: 0.1 };
        else if (role === 'WINGER') weights = { dribbling: 0.35, lowerBody: 0.3, passing: 0.2, dexterity: 0.15 };
        else if (role === 'MIDFIELDER') weights = { passing: 0.4, dribbling: 0.25, lowerBody: 0.2, defending: 0.15 };
        else if (role === 'DEFENDER') weights = { defending: 0.55, aerial: 0.25, lowerBody: 0.1, dexterity: 0.1 };
        else if (role === 'GOALKEEPER') weights = { gk1: 0.4, gk2: 0.3, gk3: 0.3 };

        let canAllocate = true;
        
        while (canAllocate && pointsRemaining > 0) {
            canAllocate = false;
            let bestKey = null;
            let bestROI = -1;

            for (const [key, weight] of Object.entries(weights)) {
                const currentLevel = currentAllocations[key];
                if (currentLevel < 16) {
                    const cost = calculateCost(currentLevel + 1);
                    if (pointsRemaining >= cost) {
                        const roi = weight / cost; 
                        if (roi > bestROI) {
                            bestROI = roi;
                            bestKey = key;
                        }
                    }
                }
            }

            if (bestKey) {
                const cost = calculateCost(currentAllocations[bestKey] + 1);
                currentAllocations[bestKey] += 1;
                pointsRemaining -= cost;
                canAllocate = true;
            }
        }
        
        setAllocations(currentAllocations);
    };

    const handleSaveSnapshot = async () => {
        if (!buildName.trim()) {
            alert("Please enter a name for this build.");
            return;
        }
        try {
            const res = await authAxios.post('/progression/save-snapshot', {
                cardId: card.cardid,
                buildName: buildName,
                points: allocations,
                isPublic: isPublic 
            });
            alert(res.data.message);
            setBuildName(""); 
            setIsPublic(false); 
            fetchBuildLists(); 
        } catch (err) {
            alert("Error saving snapshot: " + (err.response?.data?.error || err.message));
        }
    };

    const handleReaction = async (e, buildId, reactionType) => {
        e.stopPropagation(); 
        try {
            await authAxios.post('/progression/react', { buildId, reaction: reactionType });
            fetchBuildLists(); 
        } catch (err) {
            alert("Error applying reaction: " + (err.response?.data?.error || err.message));
        }
    };

    
    const getLiveStat = (statKey) => {
    let baseVal = baseStats[statKey] || 40;
    let boost = 0;
    
    
    const normalizedStatKey = statKey.toLowerCase();
    
   
    Object.entries(progressionRules).forEach(([sliderKey, affectedStats]) => {
        if (affectedStats && Array.isArray(affectedStats)) {
           
            const lowerCaseStats = affectedStats.map(s => s.toLowerCase());
            if (lowerCaseStats.includes(normalizedStatKey)) {
                boost += allocations[sliderKey] || 0;
            }
        }
    });

    let mgrBoost = 0;
    if (selectedManager) {
        const mgr = managersList.find(m => m.managerid.toString() === selectedManager);
        if (mgr && mgr.effects) {
            const effect = mgr.effects.find(e => e.statName === statKey.toLowerCase());
            if (effect) mgrBoost = effect.boost;
        }
    }

    return { base: baseVal, boost: boost, mgrBoost: mgrBoost, final: Math.min(baseVal + boost + mgrBoost, 99) };
};
    const theme = { bg: '#11151c', panelBg: '#1a1f2b', border: '#2a3241', text: '#e0e0e0', accent: '#00d2d3' };

    const StatRow = ({ label, statKey }) => {
        const data = getLiveStat(statKey);
        const colors = getStatColor(data.final);
        const isBoosted = data.boost > 0 || data.mgrBoost > 0;

        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${theme.border}` }}>
                <span style={{ color: isBoosted ? theme.accent : theme.text, fontSize: '0.85em', fontWeight: '500' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    
                    {data.mgrBoost > 0 && (
                        <span title="Manager Boost" style={{ background: '#a78bfa', color: '#000', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7em', fontWeight: 'bold' }}>
                            👔 +{data.mgrBoost}
                        </span>
                    )}

                    {data.boost > 0 && (
                        <span title="Training Boost" style={{ background: '#39ff14', color: '#000', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7em', fontWeight: 'bold' }}>
                            +{data.boost}
                        </span>
                    )}

                    <span style={{ background: colors.bg, color: colors.text, width: '28px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85em' }}>
                        {data.final}
                    </span>
                </div>
            </div>
        );
    };

    if (loading) return <div style={{background: theme.bg, color: 'white', minHeight: '100vh', padding: '50px', textAlign:'center'}}>Loading Interface...</div>;

    return (
        <div style={{ background: theme.bg, color: theme.text, minHeight: '100vh', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* --- LEFT PANEL: SLIDERS & CONTROLS --- */}
                <div style={{ width: '320px', background: theme.panelBg, borderRadius: '12px', padding: '20px', border: `1px solid ${theme.border}`, height: 'fit-content' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ background: '#333', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8em', fontWeight: 'bold' }}>{card.primaryposition || card.positioncode}</div>
                        <div style={{ fontSize: '0.8em', color: '#888' }}>Points <span style={{color: 'white', fontWeight: 'bold'}}>{totalUsed}</span> / {card.totalprogressionpoints}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {Object.keys(allocations).map(key => {
                          
                            const isGKSlider = key.startsWith('gk');
                            if (isGKSlider && !isGK) return null;
                            if (!isGKSlider && isGK && ['shooting', 'defending', 'dexterity'].includes(key)) return null;

                            const canIncr = pointsLeft >= calculateCost(allocations[key] + 1) && allocations[key] < 16;
                            
                            return (
                                <div key={key}>
                                    <div style={{ fontSize: '0.7em', textTransform: 'uppercase', color: '#aaa', marginBottom: '5px', letterSpacing: '1px' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ flex: 1, height: '4px', background: '#333', borderRadius: '2px', position: 'relative' }}>
                                            <div style={{ position: 'absolute', height: '100%', width: `${(allocations[key]/16)*100}%`, background: theme.accent, borderRadius: '2px' }} />
                                            <div style={{ position: 'absolute', left: `${(allocations[key]/16)*100}%`, top: '-6px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transform: 'translateX(-50%)', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
                                        </div>
                                        <button onClick={() => handleDecrement(key)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.2em' }}>-</button>
                                        <span style={{ width: '20px', textAlign: 'center', fontWeight: 'bold' }}>{allocations[key]}</span>
                                        <button onClick={() => handleIncrement(key)} disabled={!canIncr} style={{ background: 'none', border: 'none', color: canIncr ? 'white' : '#555', cursor: canIncr ? 'pointer' : 'default', fontSize: '1.2em' }}>+</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: `1px solid ${theme.border}` }}>
                        <div style={{ fontSize: '0.7em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: '10px', letterSpacing: '1px', fontWeight: 'bold' }}>👔 Manager Tactical Boost</div>
                        <select 
                            value={selectedManager} 
                            onChange={(e) => setSelectedManager(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#111', color: 'white', border: `1px solid ${theme.border}`, outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="">-- No Manager Assigned --</option>
                            {managersList.map(mgr => (
                                <option key={mgr.managerid} value={mgr.managerid}>
                                    {mgr.managername} ({mgr.playstyle})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '25px', paddingTop: '20px', borderTop: `1px solid ${theme.border}` }}>
                        <button 
                            onClick={() => setAllocations({ shooting:0, passing:0, dribbling:0, dexterity:0, lowerBody:0, aerial:0, defending:0, gk1:0, gk2:0, gk3:0 })} 
                            style={{ flex: 1, padding: '10px', background: '#252525', color: '#888', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 'bold' }}
                        >
                            RESET
                        </button>
                        <button 
                            onClick={handleSmartAllocate} 
                            style={{ flex: 2, padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}
                        >
                            ⚡ SMART ALLOCATE
                        </button>
                    </div>

                    <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: `1px solid ${theme.border}` }}>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <button onClick={() => setBuildTab('mine')} style={{ flex: 1, padding: '8px', background: buildTab === 'mine' ? theme.accent : '#222', color: buildTab === 'mine' ? '#000' : '#888', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8em', transition: '0.2s' }}>MY BUILDS</button>
                            <button onClick={() => setBuildTab('community')} style={{ flex: 1, padding: '8px', background: buildTab === 'community' ? theme.accent : '#222', color: buildTab === 'community' ? '#000' : '#888', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8em', transition: '0.2s' }}>COMMUNITY</button>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                            {buildTab === 'mine' && savedBuilds.map(build => (
                                <button key={build.buildid} onClick={() => handleLoadBuild(build)} style={{ background: '#111', color: theme.accent, border: `1px solid #333`, borderRadius: '6px', padding: '8px 12px', fontSize: '0.8em', cursor: 'pointer', width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.borderColor = theme.accent} onMouseOut={(e) => e.currentTarget.style.borderColor = '#333'}>
                                    <span>{build.buildname}</span>
                                </button>
                            ))}
                            {buildTab === 'mine' && savedBuilds.length === 0 && <div style={{color: '#666', fontSize:'0.8em', width:'100%', textAlign:'center', fontStyle: 'italic'}}>No personal builds saved yet.</div>}

                            {buildTab === 'community' && communityBuilds.map(build => (
                                <div key={build.buildid} style={{ display: 'flex', gap: '5px', width: '100%', alignItems: 'stretch' }}>
                                    <button 
                                        onClick={() => handleLoadBuild(build)} 
                                        style={{ flex: 1, background: '#111', color: '#39ff14', border: `1px solid #333`, borderRadius: '6px', padding: '8px 12px', fontSize: '0.8em', cursor: 'pointer', textAlign: 'left', transition: '0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                                    >
                                        <div style={{fontWeight: 'bold', marginBottom: '3px'}}>{build.buildname}</div>
                                        <div style={{color: '#666', fontSize:'0.85em'}}>by {build.username}</div>
                                    </button>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '45px' }}>
                                        <button onClick={(e) => handleReaction(e, build.buildid, 'LIKE')} style={{ flex: 1, background: build.my_reaction === 'LIKE' ? '#39ff14' : '#222', color: build.my_reaction === 'LIKE' ? '#000' : '#888', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7em', fontWeight: 'bold' }}>👍 {build.likes || 0}</button>
                                        <button onClick={(e) => handleReaction(e, build.buildid, 'DISLIKE')} style={{ flex: 1, background: build.my_reaction === 'DISLIKE' ? '#ff4d4d' : '#222', color: build.my_reaction === 'DISLIKE' ? '#fff' : '#888', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7em', fontWeight: 'bold' }}>👎 {build.dislikes || 0}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '20px', borderBottom: `1px solid ${theme.border}` }}>
                        <input type="text" placeholder="Name your build" value={buildName} onChange={(e) => setBuildName(e.target.value)} style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: `1px solid ${theme.border}`, background: '#111', color: 'white' }} />
                        <label style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85em', color: '#aaa', cursor: 'pointer'}}><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Share this build</label>
                        <button onClick={handleSaveSnapshot} style={{ width: '100%', padding: '12px', background: '#00c6ff', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>SAVE CONCEPT</button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button onClick={onBack} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Back</button>
                    </div>
                </div>

                {/* --- RIGHT PANEL: STAT GRID --- */}
                <div style={{ flex: 1, background: theme.panelBg, borderRadius: '12px', padding: '30px', border: `1px solid ${theme.border}` }}>
                    
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5em', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{card.playername} <span style={{fontSize: '0.6em', color: '#888', fontWeight: 'normal'}}>| Player Progression</span></span>
                        <span style={{ fontSize: '1.2em', color: theme.accent, background: '#111', padding: '5px 15px', borderRadius: '8px', border: `1px solid ${theme.accent}` }}>
                            OVR: <span style={{color: 'white'}}>{currentLiveOVR}</span>
                            {selectedManager && <span style={{color: '#a78bfa', fontSize: '0.7em', marginLeft: '8px'}}>+Mgr</span>}
                        </span>
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '40px' }}>
                        <div>
                            <h4 style={{ color: '#888', fontSize: '0.75em', letterSpacing: '1px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '8px' }}>ATTACKING</h4>
                            <StatRow label="Offensive Awareness" statKey="offensiveawareness" />
                            <StatRow label="Ball Control" statKey="ballcontrol" />
                            <StatRow label="Dribbling" statKey="dribbling" />
                            <StatRow label="Passing" statKey="passing" />
                            <StatRow label="Finishing" statKey="finishing" />
                        </div>

                        <div>
                            <h4 style={{ color: '#888', fontSize: '0.75em', letterSpacing: '1px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '8px' }}>DEFENDING & GK</h4>
                            <StatRow label="Defensive Awareness" statKey="defensiveawareness" />
                            <StatRow label="Tackling" statKey="tackling" />
                            <StatRow label="Aggression" statKey="aggression" />
                            
                            {/*Correctly Renders GK stats for GK cards */}
                            {isGK && (
                                <div style={{ marginTop: '15px' }}>
                                    <StatRow label="GK Awareness" statKey="gkawareness" />
                                    <StatRow label="GK Catching" statKey="gkcatching" />
                                    <StatRow label="GK Parrying" statKey="gkparrying" />
                                    <StatRow label="GK Reflexes" statKey="gkreflexes" />
                                    <StatRow label="GK Reach" statKey="gkreach" />
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 style={{ color: '#888', fontSize: '0.75em', letterSpacing: '1px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '8px' }}>ATHLETICISM</h4>
                            <StatRow label="Speed" statKey="speed" />
                            <StatRow label="Acceleration" statKey="acceleration" />
                            <StatRow label="Kicking Power" statKey="kickingpower" />
                            <StatRow label="Jump" statKey="jump" />
                            <StatRow label="Physical Contact" statKey="physicalcontact" />
                            <StatRow label="Balance" statKey="balance" />
                            <StatRow label="Stamina" statKey="stamina" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}