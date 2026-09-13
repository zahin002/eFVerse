import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { autoAllocatePoints, calculateAllocatedStats, calculatePositionOVR, calculateFinalLiveOVR } from './progressionEngine';

const authAxios = axios.create({
    baseURL: 'http://localhost:5001/api',
    withCredentials: true
});

// --- UI HELPERS ---
const getStatColor = (value) => {
    if (value >= 90) return { bg: '#00f2fe', text: '#000' }; 
    if (value >= 80) return { bg: '#39ff14', text: '#000' }; 
    if (value >= 70) return { bg: '#f97316', text: '#000' }; 
    if (value >= 60) return { bg: '#facc15', text: '#000' }; 
    return { bg: '#ff4d4d', text: '#fff' }; 
};

const INITIAL_ALLOCATIONS = {
    shooting: 0, passing: 0, dribbling: 0, dexterity: 0,
    lowerBody: 0, aerial: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0
};

export default function CardTrainer({ card, onBack, onComplete }) {
    const [allocations, setAllocations] = useState(INITIAL_ALLOCATIONS);

    const [buildName, setBuildName] = useState(""); 
    const [savedBuilds, setSavedBuilds] = useState([]); 
    const [communityBuilds, setCommunityBuilds] = useState([]); 
    const [buildTab, setBuildTab] = useState('mine'); 
    const [isPublic, setIsPublic] = useState(false); 
    const [managersList, setManagersList] = useState([]);
    const [selectedManager, setSelectedManager] = useState("");
    const [positionsList, setPositionsList] = useState([]);
    const [progressionRules, setProgressionRules] = useState({});
    const [loading, setLoading] = useState(true);

    const cardTypeUpper = (card?.cardtype || '').toUpperCase();
    const isFixedCard = cardTypeUpper === 'POTW' || cardTypeUpper === 'TRENDING';
    const totalMaxPoints = isFixedCard ? 0 : (card?.totalprogressionpoints || 64);

    const baseStats = card?.stats || {
        offensiveawareness: 60, finishing: 60, ballcontrol: 60, dribbling: 60, passing: 60,
        kickingpower: 60, speed: 60, acceleration: 60, stamina: 60, balance: 60,
        physicalcontact: 60, jump: 60, defensiveawareness: 60, tackling: 60, aggression: 60,
        gkawareness: 40, gkcatching: 40, gkparrying: 40, gkreflexes: 40, gkreach: 40
    };

    const getRoleGroup = (pos) => {
        if (!pos || positionsList.length === 0) return 'MIDFIELDER';
        const rawPos = Array.isArray(pos) ? pos[0] : pos;
        const p = (typeof rawPos === 'string' ? rawPos : '').toUpperCase().trim();
        const match = positionsList.find(item => 
            ((item.positioncode || item.PositionCode || '').toUpperCase()) === p
        );
        return match ? (match.rolegroup || match.RoleGroup) : 'MIDFIELDER';
    };

    const isGK = card?.rolegroup?.toUpperCase() === 'GOALKEEPER' || 
                 getRoleGroup(card?.primaryposition || card?.positioncode) === 'GOALKEEPER';

    const transformRulesToObject = (rulesArray) => {
        const rules = {};
        if (!Array.isArray(rulesArray)) return rules;
        rulesArray.forEach(item => {
            if (!item) return;
            let programName = item.programname || item.ProgramName || '';
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
            if (!programName) return;
            
            if (!rules[programName]) {
                rules[programName] = [];
            }
            const statName = item.statname || item.StatName || '';
            if (statName) {
                rules[programName].push(statName);
            }
        });
        return rules;
    };

    const fetchBuildLists = async () => {
        if (!card?.cardid) return;
        try {
            if (!isFixedCard) {
                const currentRes = await authAxios.get(`/progression/my-build/${card.cardid}?t=${Date.now()}`);
                if (currentRes.data) {
                    setAllocations({
                        shooting: currentRes.data.shooting || 0,
                        passing: currentRes.data.passing || 0,
                        dribbling: currentRes.data.dribbling || 0,
                        dexterity: currentRes.data.dexterity || 0,
                        lowerBody: currentRes.data.lowerbody || currentRes.data.lowerBody || 0, 
                        aerial: currentRes.data.aerial || 0,
                        defending: currentRes.data.defending || 0,
                        gk1: currentRes.data.gk1 || 0,
                        gk2: currentRes.data.gk2 || 0,
                        gk3: currentRes.data.gk3 || 0
                    });
                }
            }

            const listRes = await authAxios.get(`/progression/builds/${card.cardid}?t=${Date.now()}`);
            setSavedBuilds(listRes.data || []);

            const commRes = await authAxios.get(`/progression/community-builds/${card.cardid}?t=${Date.now()}`);
            setCommunityBuilds(commRes.data || []);

            const mgrRes = await authAxios.get(`/progression/managers-with-effects?t=${Date.now()}`);
            setManagersList(mgrRes.data || []);

            const posRes = await authAxios.get('/progression/positions');
            setPositionsList(posRes.data || []);

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
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        fetchBuildLists();
    }, [card]);

    const handleLoadBuild = (build) => {
        if (isFixedCard) return;
        setAllocations({
            shooting: build.finishing || build.shooting || 0,
            passing: build.passing || 0,
            dribbling: build.dribbling || 0,
            dexterity: build.offensiveawareness || build.dexterity || 0,
            lowerBody: build.speed || build.lowerbody || build.lowerBody || 0, 
            aerial: build.jump || build.aerial || 0,
            defending: build.defensiveawareness || build.defending || 0,
            gk1: build.gkawareness || build.gk1 || 0,
            gk2: build.gkcatching || build.gk2 || 0,
            gk3: build.gkparrying || build.gk3 || 0
        });
        alert(`Loaded Concept Build: ${build.buildname}`);
    };

    const calculateLiveOVR = (customAllocations = allocations) => {
        if (isFixedCard) {
            return card.maxoverallrating || card.baseoverallrating || 95;
        }

        const position = card.primaryposition || card.positioncode || 'AMF';
        const baseStats = card.stats || {};
        const allocatedStats = calculateAllocatedStats(baseStats, customAllocations);
        const baseOvr = card.baseoverallrating || 80;

        const calculatedOvr = calculatePositionOVR(allocatedStats, position, baseStats, baseOvr);

        const mgr = selectedManager ? managersList.find(m => m.managerid.toString() === selectedManager) : null;
        const managerEffects = mgr ? (mgr.effects || []) : [];

        return calculateFinalLiveOVR({
            calculatedOvr,
            managerEffects,
            booster1: 'none',
            booster2: 'none',
            isTrendingCard: false
        });
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

    const pointsLeft = isFixedCard ? 0 : Math.max(0, totalMaxPoints - totalUsed);
    const currentLiveOVR = calculateLiveOVR(); 

    const handleIncrement = (key) => {
        if (isFixedCard) return;
        const nextLevel = allocations[key] + 1;
        if (pointsLeft >= calculateCost(nextLevel) && nextLevel <= 16) {
            setAllocations(prev => ({ ...prev, [key]: nextLevel }));
        }
    };

    const handleDecrement = (key) => {
        if (isFixedCard) return;
        if (allocations[key] > 0) {
            setAllocations(prev => ({ ...prev, [key]: prev[key] - 1 }));
        }
    };

    // --- REVERSE-ENGINEERED GREEDY AUTO ALLOCATE SOLVER (argmax ΔOVR) ---
    const handleSmartAllocate = () => {
        if (isFixedCard) return;

        const position = card.primaryposition || card.positioncode || 'AMF';
        const baseStats = card.stats || {};
        const baseOvr = card.baseoverallrating || 80;
        const maxOvr = card.maxoverallrating || 99;

        const optimizedAllocations = autoAllocatePoints(
            baseStats,
            position,
            totalMaxPoints,
            baseOvr,
            maxOvr
        );

        setAllocations(optimizedAllocations);
    };

    const handleSaveSnapshot = async () => {
        if (isFixedCard) {
            alert("POTW / Trending cards are pre-trained special editions and cannot save progression snapshots.");
            return;
        }
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

    const calculateCurrentStat = (statName) => {
        let baseVal = baseStats[statName.toLowerCase()] || 60;
        let pointsBoost = 0;

        Object.keys(allocations).forEach(programKey => {
            const pointsAllocated = allocations[programKey];
            if (pointsAllocated > 0) {
                const boostedStatsList = progressionRules[programKey] || [];
                const isMatch = boostedStatsList.some(s => s && typeof s === 'string' && s.toLowerCase() === statName.toLowerCase());
                if (isMatch) {
                    pointsBoost += pointsAllocated;
                }
            }
        });

        let managerBoost = 0;
        if (selectedManager) {
            const mgr = managersList.find(m => m.managerid.toString() === selectedManager);
            if (mgr && mgr.effects) {
                const match = mgr.effects.find(e => {
                    const effStat = e.statName || e.statname || '';
                    return effStat && typeof effStat === 'string' && effStat.toLowerCase() === statName.toLowerCase();
                });
                if (match) managerBoost = match.boost;
            }
        }

        return {
            base: baseVal,
            boost: pointsBoost + managerBoost,
            final: Math.min(99, baseVal + pointsBoost + managerBoost)
        };
    };

    const theme = {
        bg: '#0f0f13',
        panelBg: '#181820',
        text: '#ffffff',
        accent: '#00f2fe',
        border: 'rgba(255,255,255,0.08)'
    };

    const renderStatRow = (label, statKey) => {
        const data = calculateCurrentStat(statKey);
        const colors = getStatColor(data.final);
        return (
            <div key={statKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${theme.border}` }}>
                <span style={{ fontSize: '0.85em', color: '#ccc' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8em', color: '#666' }}>{data.base}</span>
                    {data.boost > 0 && (
                        <span style={{ fontSize: '0.8em', color: '#39ff14', fontWeight: 'bold' }}>
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
        <div style={{ background: theme.bg, color: theme.text, minHeight: '100vh', padding: '40px', fontFamily: "'Outfit', sans-serif" }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* --- RED BACK BUTTON AT TOP-LEFT CORNER ABOVE PANELS --- */}
                <div style={{ marginBottom: '25px' }}>
                    <button 
                        onClick={onBack} 
                        style={{ 
                            padding: '8px 18px', 
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                            color: 'white', 
                            border: 'none', 
                            cursor: 'pointer', 
                            borderRadius: '6px',
                            fontWeight: '800',
                            fontSize: '0.85em',
                            fontFamily: "'Outfit', sans-serif",
                            letterSpacing: '0.5px',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                            textTransform: 'uppercase',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            width: 'fit-content'
                        }}
                    >
                        ← BACK
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '30px' }}>
                    
                    {/* --- LEFT PANEL: SLIDERS & CONTROLS --- */}
                    <div style={{ width: '340px', background: theme.panelBg, borderRadius: '12px', padding: '20px', border: `1px solid ${theme.border}`, height: 'fit-content' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ background: '#333', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8em', fontWeight: 'bold' }}>{card.primaryposition || card.positioncode}</div>
                        <div style={{ fontSize: '0.8em', color: '#888' }}>
                            Points <span style={{color: pointsLeft === 0 ? '#38bdf8' : 'white', fontWeight: 'bold'}}>{totalUsed}</span> / {totalMaxPoints}
                        </div>
                    </div>

                    {/* POTW / TRENDING CARD BANNER */}
                    {isFixedCard && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            color: '#f87171',
                            fontSize: '0.82em',
                            fontWeight: '700',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            marginBottom: '20px'
                        }}>
                            <span>Trending & POTW players cannot undergo Level Training.</span>
                        </div>
                    )}

                    {!isFixedCard && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {Object.keys(allocations).map(key => {
                                const isGKSlider = key.startsWith('gk');
                                if (isGKSlider && !isGK) return null;
                                if (!isGKSlider && isGK && ['shooting', 'defending', 'dexterity'].includes(key)) return null;

                                const canIncr = pointsLeft >= calculateCost(allocations[key] + 1) && allocations[key] < 16;
                                const canDecr = allocations[key] > 0;
                                
                                return (
                                    <div key={key}>
                                        <div style={{ fontSize: '0.7em', textTransform: 'uppercase', color: '#aaa', marginBottom: '5px', letterSpacing: '1px' }}>
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ flex: 1, height: '4px', background: '#333', borderRadius: '2px', position: 'relative' }}>
                                                <div style={{ position: 'absolute', height: '100%', width: `${(allocations[key]/16)*100}%`, background: theme.accent, borderRadius: '2px' }} />
                                                <div style={{ position: 'absolute', left: `${(allocations[key]/16)*100}%`, top: '-6px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transform: 'translateX(-50%)', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
                                            </div>
                                            <button 
                                                onClick={() => handleDecrement(key)} 
                                                disabled={!canDecr}
                                                style={{ background: 'none', border: 'none', color: canDecr ? '#ff4d4d' : '#444', cursor: canDecr ? 'pointer' : 'default', fontSize: '1.3em', fontWeight: 'bold', width: '24px' }}
                                            >
                                                -
                                            </button>
                                            <span style={{ width: '20px', textAlign: 'center', fontWeight: 'bold' }}>{allocations[key]}</span>
                                            <button 
                                                onClick={() => handleIncrement(key)} 
                                                disabled={!canIncr} 
                                                style={{ background: 'none', border: 'none', color: canIncr ? '#39ff14' : '#444', cursor: canIncr ? 'pointer' : 'default', fontSize: '1.3em', fontWeight: 'bold', width: '24px' }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

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

                    {!isFixedCard && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '25px', paddingTop: '20px', borderTop: `1px solid ${theme.border}` }}>
                            <button 
                                onClick={() => setAllocations({ ...INITIAL_ALLOCATIONS })} 
                                style={{ flex: 1, padding: '10px', background: '#252525', color: '#888', border: '1px solid #333', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 'bold' }}
                            >
                                RESET
                            </button>
                            <button 
                                onClick={handleSmartAllocate} 
                                style={{ flex: 2, padding: '10px', background: 'linear-gradient(135deg, #28a745, #20c997)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8em', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}
                            >
                                ⚡ SMART ALLOCATE
                            </button>
                        </div>
                    )}

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

                    {!isFixedCard && (
                        <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '20px', borderBottom: `1px solid ${theme.border}` }}>
                            <input type="text" placeholder="Name your build" value={buildName} onChange={(e) => setBuildName(e.target.value)} style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: `1px solid ${theme.border}`, background: '#111', color: 'white' }} />
                            <label style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85em', color: '#aaa', cursor: 'pointer'}}><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Share this build</label>
                            <button onClick={handleSaveSnapshot} style={{ width: '100%', padding: '12px', background: '#00c6ff', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>SAVE CONCEPT</button>
                        </div>
                    )}
                </div>

                {/* --- RIGHT PANEL: LIVE STATS & OVR DISPLAY --- */}
                <div style={{ flex: 1, background: theme.panelBg, borderRadius: '12px', padding: '30px', border: `1px solid ${theme.border}` }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: `1px solid ${theme.border}` }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.8em' }}>{card.playername || "Player Profile"}</h2>
                            <div style={{ fontSize: '0.9em', color: '#888', marginTop: '4px' }}>
                                {card.cardtype} • {card.positioncode} • {card.clubname || card.club?.clubname}
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', background: 'rgba(0, 242, 254, 0.05)', padding: '15px 25px', borderRadius: '12px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
                            <div style={{ fontSize: '0.75em', textTransform: 'uppercase', color: theme.accent, letterSpacing: '1px', fontWeight: 'bold' }}>PROJECTED OVR</div>
                            <div style={{ fontSize: '3em', fontWeight: '900', color: theme.accent }}>{currentLiveOVR}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        <div>
                            <h4 style={{ color: theme.accent, borderBottom: `1px solid ${theme.border}`, paddingBottom: '8px', marginTop: 0 }}>⚽ Attack & Skill Attributes</h4>
                            {renderStatRow("Offensive Awareness", "offensiveawareness")}
                            {renderStatRow("Finishing", "finishing")}
                            {renderStatRow("Ball Control", "ballcontrol")}
                            {renderStatRow("Dribbling", "dribbling")}
                            {renderStatRow("Passing", "passing")}
                            {renderStatRow("Kicking Power", "kickingpower")}
                            {renderStatRow("Speed", "speed")}
                            {renderStatRow("Acceleration", "acceleration")}
                        </div>

                        <div>
                            <h4 style={{ color: theme.accent, borderBottom: `1px solid ${theme.border}`, paddingBottom: '8px', marginTop: 0 }}>🛡️ Defense & Physical Attributes</h4>
                            {renderStatRow("Stamina", "stamina")}
                            {renderStatRow("Balance", "balance")}
                            {renderStatRow("Physical Contact", "physicalcontact")}
                            {renderStatRow("Jump", "jump")}
                            {renderStatRow("Defensive Awareness", "defensiveawareness")}
                            {renderStatRow("Tackling", "tackling")}
                            {renderStatRow("Aggression", "aggression")}
                            {isGK && renderStatRow("GK Reflexes", "gkreflexes")}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
}