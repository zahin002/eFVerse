import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiCamera, FiShare2, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import html2canvas from 'html2canvas';
import SmartSearch from './SmartSearch';
import PositionRatingsPitch from './PositionRatingsPitch';
import BoosterHexagonIcon from './BoosterHexagonIcon';
import { getBoosterByName, getBoosterTypeColor } from './efootballBoosters';

// 26 Konami Canonical Attributes + 4 Physical Model Metrics (as shown in Reference Image 1)
const COMPARISON_ATTRIBUTES = [
    { key: 'offensiveawareness', label: 'Attacking Awareness' },
    { key: 'ballcontrol', label: 'Ball Control' },
    { key: 'dribbling', label: 'Dribbling' },
    { key: 'tightpossession', label: 'Tight Possession' },
    { key: 'lowpass', label: 'Low Pass' },
    { key: 'loftedpass', label: 'Lofted Pass' },
    { key: 'finishing', label: 'Finishing' },
    { key: 'heading', label: 'Heading' },
    { key: 'placekicking', label: 'Set Piece Taking' },
    { key: 'curl', label: 'Curl' },
    { key: 'defensiveawareness', label: 'Defensive Awareness' },
    { key: 'tackling', label: 'Tackling' },
    { key: 'defensiveengagement', label: 'Defensive Engagement' },
    { key: 'aggression', label: 'Aggression' },
    { key: 'gkawareness', label: 'GK Awareness' },
    { key: 'gkcatching', label: 'GK Catching' },
    { key: 'gkparrying', label: 'GK Parrying' },
    { key: 'gkreflexes', label: 'GK Reflexes' },
    { key: 'gkreach', label: 'GK Reach' },
    { key: 'speed', label: 'Speed' },
    { key: 'acceleration', label: 'Acceleration' },
    { key: 'kickingpower', label: 'Kicking Power' },
    { key: 'jump', label: 'Jumping' },
    { key: 'physicalcontact', label: 'Physical Contact' },
    { key: 'balance', label: 'Balance' },
    { key: 'stamina', label: 'Stamina' },
    // 4 Model Metrics shown below Stamina in Reference Image 1
    { key: 'armlength', label: 'Arm Length', isModelMetric: true },
    { key: 'shoulderwidth', label: 'Shoulder Width', isModelMetric: true },
    { key: 'necklength', label: 'Neck Length', isModelMetric: true },
    { key: 'chestmeasurement', label: 'Chest Measurement', isModelMetric: true }
];

const getStatTier = (val) => {
    const n = parseInt(val, 10) || 0;
    // Single-digit model metrics (scale 1 - 14) as in Image 1: 9 is green, 5-8 is yellow, <=4 is red
    if (n < 20) {
        if (n >= 9) return { bg: '#22c55e', text: '#000' };
        if (n >= 5) return { bg: '#facc15', text: '#000' };
        return { bg: '#ef4444', text: '#000' };
    }
    // Konami standard tiers for player stats (40-99)
    if (n >= 90) return { bg: '#00f2fe', text: '#000' };
    if (n >= 80) return { bg: '#22c55e', text: '#000' };
    if (n >= 70) return { bg: '#facc15', text: '#000' };
    return { bg: '#ef4444', text: '#000' };
};

const PLAYSTYLE_OPTIONS = [
    { key: 'possession_game', label: 'Possession Game' },
    { key: 'quick_counter', label: 'Quick Counter' },
    { key: 'long_ball_counter', label: 'Long Ball Counter' },
    { key: 'out_wide', label: 'Out Wide' },
    { key: 'long_ball', label: 'Long Ball' }
];

// Helper to extract best playstyle and highest proficiency
const getBestPlaystyle = (mgr) => {
    if (!mgr) return { key: 'possession_game', label: 'Possession Game', val: 85 };
    let best = { key: 'possession_game', label: 'Possession Game', val: mgr.possession_game || 50 };
    PLAYSTYLE_OPTIONS.forEach(ps => {
        const v = mgr[ps.key] || 50;
        if (v > best.val) {
            best = { key: ps.key, label: ps.label, val: v };
        }
    });
    return best;
};

// Helper to format boost display strings like "Lofted Pass +1" into "+1 LOFTED PASS"
const parseBoostBadges = (mgr) => {
    if (!mgr) return [];
    const badges = [];
    if (mgr.boosts_display) {
        mgr.boosts_display.split(',').forEach(part => {
            const trimmed = part.trim();
            if (!trimmed) return;
            // Match pattern like "Lofted Pass +1" or "+1 Lofted Pass"
            const match = trimmed.match(/^([a-zA-Z\s]+)\s*\+?(\d+)$/i) || trimmed.match(/^\+?(\d+)\s*([a-zA-Z\s]+)$/i);
            if (match) {
                const stat = (isNaN(Number(match[1])) ? match[1] : match[2]).trim().toUpperCase();
                const val = !isNaN(Number(match[1])) ? match[1] : match[2];
                badges.push(`+${val} ${stat}`);
            } else {
                badges.push(trimmed.toUpperCase());
            }
        });
    } else if (Array.isArray(mgr.effects) && mgr.effects.length > 0) {
        mgr.effects.forEach(eff => {
            const name = (eff.statName || 'STAT').replace(/([A-Z])/g, ' $1').trim().toUpperCase();
            const boost = eff.boost || eff.value || 1;
            badges.push(`+${boost} ${name}`);
        });
    }
    return badges;
};

// =========================================================================
// MANAGER PICKER COMPONENT (Matches Reference Images 1 & 2 Exactly)
// =========================================================================
function ManagerPicker({
    selectedMgrId,
    onSelectManager,
    managersList,
    playstyleKey,
    onSelectPlaystyle,
    sliderVal,
    onSliderChange
}) {
    const [isGridOpen, setIsGridOpen] = useState(false);
    const [isPlaystyleDropdownOpen, setIsPlaystyleDropdownOpen] = useState(false);

    const selectedMgr = managersList.find(m => m.managerid?.toString() === selectedMgrId?.toString());
    const boostBadges = parseBoostBadges(selectedMgr);

    const currentPlaystyleObj = PLAYSTYLE_OPTIONS.find(p => p.key === playstyleKey) || PLAYSTYLE_OPTIONS[0];
    const currentPlaystyleProf = selectedMgr ? (selectedMgr[currentPlaystyleObj.key] || sliderVal) : sliderVal;

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '0.74em', color: '#64748b', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                MANAGER
            </div>

            {/* ---------------------------------------------------- */}
            {/* 1. MAIN SELECTOR BOX (Closed state: shows No Manager or Selected Manager) */}
            {/* ---------------------------------------------------- */}
            <div
                onClick={() => {
                    setIsGridOpen(!isGridOpen);
                    setIsPlaystyleDropdownOpen(false);
                }}
                style={{
                    background: '#131924',
                    border: isGridOpen ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.15s ease',
                    boxShadow: isGridOpen ? '0 0 12px rgba(59, 130, 246, 0.25)' : 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    {selectedMgr ? (
                        <div style={{
                            position: 'relative',
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#1c2433',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            flexShrink: 0
                        }}>
                            <img
                                src={selectedMgr.managerimageurl || selectedMgr.imageurl}
                                alt={selectedMgr.managername}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={e => { e.currentTarget.style.display = 'none'; }}
                            />
                            
                        </div>
                    ) : (
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            background: '#1c2433',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            flexShrink: 0
                        }} />
                    )}

                    <div style={{
                        color: selectedMgr ? '#ffffff' : '#94a3b8',
                        fontWeight: '800',
                        fontSize: '0.92em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {selectedMgr ? selectedMgr.managername : 'No Manager'}
                    </div>
                </div>

                <div style={{ color: '#94a3b8', fontSize: '0.8em', flexShrink: 0, marginLeft: '8px' }}>
                    {isGridOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* 2. MANAGER GRID DROPDOWN (Reference Image 2) */}
            {/* ---------------------------------------------------- */}
            {isGridOpen && (
                <div style={{
                    position: 'absolute',
                    top: selectedMgr ? '52px' : '62px',
                    left: 0,
                    right: 0,
                    background: '#0d131f',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '12px',
                    padding: '12px',
                    zIndex: 1000,
                    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.9)',
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '10px'
                    }}>
                        {/* Option 1: No Manager Tile */}
                        <div
                            onClick={() => {
                                onSelectManager('');
                                setIsGridOpen(false);
                            }}
                            style={{
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}
                        >
                            <div style={{
                                width: '100%',
                                aspectRatio: '1',
                                borderRadius: '10px',
                                background: '#171e2c',
                                border: !selectedMgr ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease'
                            }}>
                                <FiX size={22} color={!selectedMgr ? '#60a5fa' : '#64748b'} />
                            </div>
                            <div style={{
                                fontSize: '0.72em',
                                color: !selectedMgr ? '#60a5fa' : '#94a3b8',
                                fontWeight: '700',
                                marginTop: '5px',
                                textAlign: 'center'
                            }}>
                                No Manager
                            </div>
                        </div>

                        {/* Options 2..N: Manager Cards Grid */}
                        {managersList.map(mgr => {
                            const isSelected = selectedMgr?.managerid?.toString() === mgr.managerid?.toString();
                            const best = getBestPlaystyle(mgr);

                            return (
                                <div
                                    key={mgr.managerid}
                                    onClick={() => {
                                        onSelectManager(mgr.managerid);
                                        onSelectPlaystyle(best.key);
                                        onSliderChange(best.val);
                                        setIsGridOpen(false);
                                    }}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{
                                        position: 'relative',
                                        width: '100%',
                                        aspectRatio: '1',
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        background: '#1a2232',
                                        border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.4)' : 'none',
                                        transition: 'transform 0.15s ease'
                                    }}>
                                        <img
                                            src={mgr.managerimageurl || mgr.imageurl}
                                            alt={mgr.managername}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={e => { e.currentTarget.style.display = 'none'; }}
                                        />

                                        {/* Top-Right Green Proficiency Badge (e.g. 90, 89, 88) */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '3px',
                                            right: '3px',
                                            background: '#22c55e',
                                            color: '#000000',
                                            fontSize: '10px',
                                            fontWeight: '900',
                                            borderRadius: '4px',
                                            padding: '1px 4px',
                                            lineHeight: 1.1,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                        }}>
                                            {best.val}
                                        </div>

                                        
                                    </div>

                                    <div style={{
                                        fontSize: '0.72em',
                                        color: isSelected ? '#60a5fa' : '#e2e8f0',
                                        fontWeight: '800',
                                        marginTop: '5px',
                                        textAlign: 'center',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        width: '100%'
                                    }}>
                                        {mgr.managername}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* 3. AFTER CHOOSING MANAGER DETAILS (Reference Image 1) */}
            {/* ---------------------------------------------------- */}
            {selectedMgr && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Playstyle Selector Box */}
                    <div style={{ position: 'relative' }}>
                        <div
                            onClick={() => setIsPlaystyleDropdownOpen(!isPlaystyleDropdownOpen)}
                            style={{
                                background: '#131924',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}
                        >
                            <span style={{ fontSize: '0.84em', color: '#f1f5f9', fontWeight: '800' }}>
                                {currentPlaystyleObj.label} ({currentPlaystyleProf})
                            </span>
                            <span style={{ color: '#94a3b8', fontSize: '0.75em' }}>
                                {isPlaystyleDropdownOpen ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                            </span>
                        </div>

                        {/* Playstyle Dropdown List */}
                        {isPlaystyleDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '40px',
                                left: 0,
                                right: 0,
                                background: '#0f172a',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '8px',
                                padding: '4px',
                                zIndex: 900,
                                boxShadow: '0 10px 24px rgba(0,0,0,0.8)'
                            }}>
                                {PLAYSTYLE_OPTIONS.map(ps => {
                                    const prof = selectedMgr[ps.key] || 50;
                                    const isCurrent = ps.key === playstyleKey;
                                    return (
                                        <div
                                            key={ps.key}
                                            onClick={() => {
                                                onSelectPlaystyle(ps.key);
                                                onSliderChange(prof);
                                                setIsPlaystyleDropdownOpen(false);
                                            }}
                                            style={{
                                                padding: '7px 10px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.8em',
                                                fontWeight: '800',
                                                color: isCurrent ? '#00f2fe' : '#cbd5e1',
                                                background: isCurrent ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                            onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                                            onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <span>{ps.label}</span>
                                            <span style={{ color: '#94a3b8' }}>{prof}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Manager Boost Badges (Orange/Golden Pills: e.g. +1 LOFTED PASS) */}
                    {boostBadges.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                            {boostBadges.map((badge, bIdx) => (
                                <div
                                    key={bIdx}
                                    style={{
                                        background: 'rgba(245, 158, 11, 0.12)',
                                        border: '1px solid rgba(245, 158, 11, 0.28)',
                                        color: '#f59e0b',
                                        fontSize: '0.74em',
                                        fontWeight: '900',
                                        letterSpacing: '0.6px',
                                        padding: '5px 12px',
                                        borderRadius: '999px',
                                        display: 'inline-block',
                                        alignSelf: 'flex-start'
                                    }}
                                >
                                    {badge}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Manager Proficiency Slider (MANAGER [=======O] 89) */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginTop: '4px',
                        background: '#131924',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                        <span style={{
                            fontSize: '0.76em',
                            color: '#94a3b8',
                            fontWeight: '900',
                            letterSpacing: '0.8px',
                            minWidth: '68px'
                        }}>
                            MANAGER
                        </span>

                        <input
                            type="range"
                            min="50"
                            max="99"
                            value={sliderVal}
                            onChange={e => onSliderChange(Number(e.target.value))}
                            style={{
                                flex: 1,
                                accentColor: '#ea580c',
                                cursor: 'pointer',
                                height: '6px'
                            }}
                        />

                        <span style={{
                            fontSize: '0.96em',
                            color: '#ffffff',
                            fontWeight: '900',
                            minWidth: '22px',
                            textAlign: 'right'
                        }}>
                            {sliderVal}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// =========================================================================
// MAIN COMPARE PLAYERS COMPONENT
// =========================================================================
export default function ComparePlayers({ cardId1: initialId1, cardId2: initialId2, onBack }) {
    const [id1, setId1] = useState(initialId1);
    const [id2, setId2] = useState(initialId2);

    const [card1, setCard1] = useState(null);
    const [card2, setCard2] = useState(null);
    const [loading, setLoading] = useState(true);

    // Boosters state
    const [booster1On1, setBooster1On1] = useState(true);
    const [booster2On1, setBooster2On1] = useState(true);
    const [booster1On2, setBooster1On2] = useState(true);
    const [booster2On2, setBooster2On2] = useState(true);

    // Managers state
    const [managersList, setManagersList] = useState([]);
    const [mgr1, setMgr1] = useState('');
    const [mgr2, setMgr2] = useState('');
    const [playstyle1, setPlaystyle1] = useState('possession_game');
    const [playstyle2, setPlaystyle2] = useState('possession_game');
    const [slider1, setSlider1] = useState(89);
    const [slider2, setSlider2] = useState(89);

    // Player switcher modal state
    const [searchTarget, setSearchTarget] = useState(null); // 'player1' or 'player2'

    // Screenshot & Share state
    const [capturing, setCapturing] = useState(false);
    const [copied, setCopied] = useState(false);
    const containerRef = useRef(null);

    // Fetch Card Data & Managers List
    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const fetchAll = async () => {
            try {
                const [r1, r2, rMgr] = await Promise.all([
                    axios.get(`http://localhost:5001/api/players/view-card/${id1}`),
                    axios.get(`http://localhost:5001/api/players/view-card/${id2}`),
                    axios.get('http://localhost:5001/api/progression/managers-with-effects')
                ]);

                if (isMounted) {
                    setCard1(r1.data);
                    setCard2(r2.data);
                    const mgrs = Array.isArray(rMgr.data) ? rMgr.data : [];
                    setManagersList(mgrs);

                    // If default managers not chosen, pick Cesc Fabregas or highest manager as sample if desired
                    setLoading(false);
                }
            } catch (err) {
                console.error("Comparison load error:", err);
                if (isMounted) setLoading(false);
            }
        };

        fetchAll();
        return () => { isMounted = false; };
    }, [id1, id2]);

    // Calculate live boosted stats for a card
    const calculateStats = (cardData, selectedMgrId, b1Active, b2Active, mgrSliderValue) => {
        if (!cardData) return {};
        const raw = cardData.stats || cardData.playerStats || {};
        const playerObj = cardData.player || cardData;
        const res = {};

        COMPARISON_ATTRIBUTES.forEach(attr => {
            const k = attr.key;
            if (attr.isModelMetric) {
                // Physical model metrics from player table
                let mVal = parseInt(playerObj[k], 10);
                if (isNaN(mVal)) {
                    if (k === 'armlength') mVal = 5;
                    else if (k === 'shoulderwidth') mVal = 9;
                    else if (k === 'necklength') mVal = 6;
                    else if (k === 'chestmeasurement') mVal = 9;
                    else mVal = 7;
                }
                res[k] = mVal;
            } else {
                let val = parseInt(raw[k], 10);
                if (isNaN(val)) {
                    if (k === 'tightpossession') val = parseInt(raw.ballcontrol, 10) || 60;
                    else if (k === 'lowpass' || k === 'loftedpass') val = parseInt(raw.passing, 10) || 60;
                    else if (k === 'defensiveengagement') val = parseInt(raw.defensiveawareness, 10) || 50;
                    else val = 50;
                }
                res[k] = val;
            }
        });

        // Add manager baseline proficiency boosts (>= 85 gives +2, >= 70 gives +1)
        if (selectedMgrId && mgrSliderValue) {
            const baseBonus = mgrSliderValue >= 88 ? 2 : (mgrSliderValue >= 70 ? 1 : 0);
            COMPARISON_ATTRIBUTES.forEach(attr => {
                if (!attr.isModelMetric && res[attr.key] !== undefined) {
                    res[attr.key] = Math.min(99, res[attr.key] + baseBonus);
                }
            });
        }

        // Add specific manager booster effects (e.g. +1 Lofted Pass, +1 Defensive Engagement)
        if (selectedMgrId) {
            const mgrObj = managersList.find(m => m.managerid?.toString() === selectedMgrId?.toString());
            if (mgrObj && Array.isArray(mgrObj.effects)) {
                mgrObj.effects.forEach(eff => {
                    const cleanStat = (eff.statKey || eff.statName || '').toLowerCase().replace(/[\s_\-]+/g, '');
                    const boostVal = parseInt(eff.boost || eff.value, 10) || 0;
                    if (res[cleanStat] !== undefined) {
                        res[cleanStat] = Math.min(99, res[cleanStat] + boostVal);
                    }
                });
            }
        }

        // Add Booster 1
        if (b1Active && cardData.booster1 && cardData.booster1.toLowerCase() !== 'none') {
            const bObj = getBoosterByName(cardData.booster1);
            if (bObj && Array.isArray(bObj.stats)) {
                const bValMatch = cardData.booster1.match(/\+(\d+)/);
                const bVal = bValMatch ? parseInt(bValMatch[1], 10) : (parseInt(cardData.booster1_val, 10) || 4);
                bObj.stats.forEach(st => {
                    const clean = st.toLowerCase().replace(/[\s_\-]+/g, '');
                    if (res[clean] !== undefined) {
                        res[clean] = Math.min(99, res[clean] + bVal);
                    }
                });
            }
        }

        // Add Booster 2
        if (b2Active && cardData.booster2 && cardData.booster2.toLowerCase() !== 'none' && cardData.booster2 !== 'Craftable Slot') {
            const bObj = getBoosterByName(cardData.booster2);
            if (bObj && Array.isArray(bObj.stats)) {
                const bValMatch = cardData.booster2.match(/\+(\d+)/);
                const bVal = bValMatch ? parseInt(bValMatch[1], 10) : (parseInt(cardData.booster2_val, 10) || 3);
                bObj.stats.forEach(st => {
                    const clean = st.toLowerCase().replace(/[\s_\-]+/g, '');
                    if (res[clean] !== undefined) {
                        res[clean] = Math.min(99, res[clean] + bVal);
                    }
                });
            }
        }

        return res;
    };

    const stats1 = calculateStats(card1, mgr1, booster1On1, booster2On1, slider1);
    const stats2 = calculateStats(card2, mgr2, booster1On2, booster2On2, slider2);

    // Compute live Overall Rating
    const ovr1 = Math.min(105, (card1?.overallrating || card1?.baseoverallrating || 90) + (booster1On1 ? 2 : 0) + (mgr1 ? 1 : 0));
    const ovr2 = Math.min(105, (card2?.overallrating || card2?.baseoverallrating || 90) + (booster1On2 ? 2 : 0) + (mgr2 ? 1 : 0));

    // Calculate Radar Chart Values (SHT, PAS, PHY, DEF, DRI, SPD)
    const getRadarStats = (st) => {
        if (!st) return { sht: 70, pas: 70, phy: 70, def: 70, dri: 70, spd: 70 };
        const sht = Math.round(((st.finishing || 70) * 0.6 + (st.kickingpower || 70) * 0.4));
        const pas = Math.round(((st.lowpass || 70) * 0.55 + (st.loftedpass || 70) * 0.45));
        const dri = Math.round(((st.dribbling || 70) * 0.4 + (st.ballcontrol || 70) * 0.35 + (st.tightpossession || 70) * 0.25));
        const spd = Math.round(((st.speed || 70) * 0.6 + (st.acceleration || 70) * 0.4));
        const def = Math.round(((st.defensiveawareness || 50) * 0.35 + (st.tackling || 50) * 0.35 + (st.aggression || 50) * 0.3));
        const phy = Math.round(((st.physicalcontact || 70) * 0.4 + (st.balance || 70) * 0.3 + (st.stamina || 70) * 0.3));
        return { sht, pas, phy, def, dri, spd };
    };

    const radar1 = getRadarStats(stats1);
    const radar2 = getRadarStats(stats2);

    // Render Dual-Polygon SVG Hexagon Radar Chart
    const renderRadarChart = () => {
        const cx = 130;
        const cy = 110;
        const R = 72;

        const categories = [
            { key: 'sht', label: 'SHT', angle: -Math.PI / 2 },
            { key: 'pas', label: 'PAS', angle: -Math.PI / 6 },
            { key: 'phy', label: 'PHY', angle: Math.PI / 6 },
            { key: 'def', label: 'DEF', angle: Math.PI / 2 },
            { key: 'dri', label: 'DRI', angle: (5 * Math.PI) / 6 },
            { key: 'spd', label: 'SPD', angle: (-5 * Math.PI) / 6 }
        ];

        const normalize = (v) => Math.max(0.2, Math.min(1.0, (v - 40) / 60));

        const makePoints = (data) => {
            return categories.map(cat => {
                const norm = normalize(data[cat.key] || 70);
                const r = R * norm;
                const x = cx + r * Math.cos(cat.angle);
                const y = cy + r * Math.sin(cat.angle);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(' ');
        };

        const gridLevels = [0.33, 0.66, 1.0];

        return (
            <svg width="260" height="220" viewBox="0 0 260 220" style={{ overflow: 'visible', margin: '0 auto', display: 'block' }}>
                {/* Background Web Rings */}
                {gridLevels.map((lvl, lIdx) => {
                    const pts = categories.map(cat => {
                        const x = cx + (R * lvl) * Math.cos(cat.angle);
                        const y = cy + (R * lvl) * Math.sin(cat.angle);
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                    }).join(' ');
                    return (
                        <polygon
                            key={lIdx}
                            points={pts}
                            fill={lIdx === 2 ? 'rgba(15, 23, 42, 0.4)' : 'transparent'}
                            stroke="rgba(255, 255, 255, 0.12)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Web Spokes */}
                {categories.map((cat, idx) => {
                    const x = cx + R * Math.cos(cat.angle);
                    const y = cy + R * Math.sin(cat.angle);
                    return (
                        <line
                            key={idx}
                            x1={cx}
                            y1={cy}
                            x2={x}
                            y2={y}
                            stroke="rgba(255, 255, 255, 0.1)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Player 1 Polygon (Cyan) */}
                <polygon
                    points={makePoints(radar1)}
                    fill="rgba(0, 242, 254, 0.22)"
                    stroke="#00f2fe"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />

                {/* Player 2 Polygon (Orange) */}
                <polygon
                    points={makePoints(radar2)}
                    fill="rgba(249, 115, 22, 0.22)"
                    stroke="#f97316"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />

                {/* Category Labels */}
                {categories.map((cat, idx) => {
                    const labelR = R + 16;
                    const x = cx + labelR * Math.cos(cat.angle);
                    const y = cy + labelR * Math.sin(cat.angle);
                    return (
                        <text
                            key={idx}
                            x={x}
                            y={y + 4}
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize="10"
                            fontWeight="800"
                            fontFamily="'Outfit', sans-serif"
                            letterSpacing="0.5px"
                        >
                            {cat.label}
                        </text>
                    );
                })}
            </svg>
        );
    };

    // Calculate Physical / Reach Metrics
    const getPhysicalMetrics = (cardData, st) => {
        if (!cardData) return { legRadius: '160.0', armRadius: '150.0', jumpHeight: '230.0', torso: '48.0', legHeight: 165 };
        const p = cardData.player || cardData;
        const m = p.modelMetrics || {};
        const h = p.height || 175;
        const w = p.weight || 70;
        const leg = m.leglength || p.leglength || 10;
        const arm = m.armlength || p.armlength || 8;
        const chest = m.chestmeasurement || p.chestmeasurement || 5;

        const legRadius = ((h * 0.52 + leg * 2.1 + (st.tackling || 50) * 0.16)).toFixed(1);
        const armRadius = ((h * 0.46 + arm * 1.8 + (st.balance || 50) * 0.14)).toFixed(1);
        const jumpHeight = ((h + (st.jump || 50) * 0.72 + (h > 180 ? 8 : 4))).toFixed(1);
        const torso = ((w * 0.34 + (st.physicalcontact || 50) * 0.22 + chest * 0.9)).toFixed(1);
        const legHeight = Math.round(h * 0.51 + leg * 2.3 + 48);

        return { legRadius, armRadius, jumpHeight, torso, legHeight };
    };

    const phys1 = getPhysicalMetrics(card1, stats1);
    const phys2 = getPhysicalMetrics(card2, stats2);

    // Screenshot feature
    const handleScreenshot = async () => {
        if (!containerRef.current || capturing) return;
        setCapturing(true);
        try {
            const canvas = await html2canvas(containerRef.current, {
                backgroundColor: '#0a0d14',
                scale: 2,
                useCORS: true
            });
            const link = document.createElement('a');
            const name1 = (card1?.playername || 'Player1').replace(/\s+/g, '_');
            const name2 = (card2?.playername || 'Player2').replace(/\s+/g, '_');
            link.download = `Compare_${name1}_vs_${name2}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Screenshot capture error:', err);
        } finally {
            setCapturing(false);
        }
    };

    // Share link feature
    const handleShare = () => {
        try {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (e) {
            console.warn('Clipboard write error:', e);
        }
    };

    const handleSelectNewCard = (newCardId) => {
        if (searchTarget === 'player1') {
            setId1(newCardId);
        } else if (searchTarget === 'player2') {
            setId2(newCardId);
        }
        setSearchTarget(null);
    };

    if (loading && (!card1 || !card2)) {
        return (
            <div style={{ background: '#0a0d14', color: '#94a3b8', padding: '80px 20px', textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}>
                <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#00f2fe' }}>Loading Player Comparison...</div>
            </div>
        );
    }

    const p1 = card1?.player || card1 || {};
    const p2 = card2?.player || card2 || {};

    const p1Img = card1?.cardimageurl || card1?.imageurl || p1.imageurl;
    const p2Img = card2?.cardimageurl || card2?.imageurl || p2.imageurl;

    const p1Skills = Array.isArray(card1?.skills) ? card1.skills : (typeof card1?.skills === 'string' ? card1.skills.split(',').map(s=>s.trim()).filter(Boolean) : []);
    const p2Skills = Array.isArray(card2?.skills) ? card2.skills : (typeof card2?.skills === 'string' ? card2.skills.split(',').map(s=>s.trim()).filter(Boolean) : []);

    const p1SkillsLower = p1Skills.map(s => s.toLowerCase());
    const p2SkillsLower = p2Skills.map(s => s.toLowerCase());

    return (
        <div ref={containerRef} style={{
            background: '#0a0d14',
            color: '#e2e8f0',
            padding: '24px 20px 40px',
            fontFamily: "'Outfit', sans-serif",
            maxWidth: '1280px',
            margin: '0 auto',
            minHeight: '100vh',
            boxSizing: 'border-box'
        }}>
            {/* ======================================================== */}
            {/* TOP BAR / ACTIONS HEADER (Marked in Reference Image 2)   */}
            {/* ======================================================== */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '28px',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                {/* Left Mini Header Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        position: 'relative',
                        width: '42px',
                        height: '52px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        background: '#151d2a',
                        border: '1px solid rgba(0, 242, 254, 0.3)',
                        flexShrink: 0
                    }}>
                        {p1Img ? (
                            <img src={p1Img} alt={p1.playername} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.currentTarget.style.display = 'none'} />
                        ) : null}
                        <button
                            onClick={() => setSearchTarget('player1')}
                            title="Change Player 1"
                            style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.7)',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0
                            }}
                        >
                            <FiX size={10} />
                        </button>
                    </div>
                    <div>
                        <div style={{ fontWeight: '900', color: '#fff', fontSize: '0.95em', letterSpacing: '0.5px' }}>
                            {(p1.playername || 'PLAYER 1').toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.72em', color: '#84cc16', fontWeight: '800', letterSpacing: '0.5px', marginTop: '1px' }}>
                            {(card1?.attacking_playstyle || card1?.playstyle || p1.playstyle || 'CREATIVE PLAYMAKER').toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Center Action Buttons: [ SCREENSHOT ] [ SHARE ] CLEAR [ ✕ ] */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: '#131924',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '999px',
                    padding: '4px 10px',
                    gap: '10px'
                }}>
                    <button
                        onClick={handleScreenshot}
                        disabled={capturing}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: capturing ? '#4ade80' : '#cbd5e1',
                            fontSize: '0.74em',
                            fontWeight: '800',
                            letterSpacing: '0.8px',
                            cursor: capturing ? 'wait' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 6px'
                        }}
                    >
                        <FiCamera size={14} style={{ marginRight: 2 }} />
                        {capturing ? 'CAPTURING...' : 'SCREENSHOT'}
                    </button>

                    <span style={{ color: 'rgba(255, 255, 255, 0.15)', fontSize: '0.8em' }}>|</span>

                    <button
                        onClick={handleShare}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: copied ? '#4ade80' : '#cbd5e1',
                            fontSize: '0.74em',
                            fontWeight: '800',
                            letterSpacing: '0.8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 6px'
                        }}
                    >
                        <FiShare2 size={13} style={{ marginRight: 2 }} />
                        {copied ? 'COPIED!' : 'SHARE'}
                    </button>

                    <span style={{ color: 'rgba(255, 255, 255, 0.15)', fontSize: '0.8em' }}>|</span>

                    <button
                        onClick={onBack}
                        title="Close / Clear Comparison"
                        style={{
                            background: 'rgba(239, 68, 68, 0.18)',
                            border: '1.5px solid #ef4444',
                            borderRadius: '999px',
                            color: '#ffffff',
                            fontSize: '0.74em',
                            fontWeight: '900',
                            letterSpacing: '0.8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            boxShadow: '0 0 10px rgba(239, 68, 68, 0.35)',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.boxShadow = '0 0 14px rgba(239, 68, 68, 0.6)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                            e.currentTarget.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.35)';
                        }}
                    >
                        <span>CLEAR</span>
                        <span style={{
                            background: '#ef4444',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FiX size={11} color="#ffffff" />
                        </span>
                    </button>
                </div>

                {/* Right Mini Header Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '900', color: '#fff', fontSize: '0.95em', letterSpacing: '0.5px' }}>
                            {(p2.playername || 'PLAYER 2').toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.72em', color: '#84cc16', fontWeight: '800', letterSpacing: '0.5px', marginTop: '1px' }}>
                            {(card2?.attacking_playstyle || card2?.playstyle || p2.playstyle || 'CREATIVE PLAYMAKER').toUpperCase()}
                        </div>
                    </div>
                    <div style={{
                        position: 'relative',
                        width: '42px',
                        height: '52px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        background: '#151d2a',
                        border: '1px solid rgba(249, 115, 22, 0.3)',
                        flexShrink: 0
                    }}>
                        {p2Img ? (
                            <img src={p2Img} alt={p2.playername} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.currentTarget.style.display = 'none'} />
                        ) : null}
                        <button
                            onClick={() => setSearchTarget('player2')}
                            title="Change Player 2"
                            style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.7)',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0
                            }}
                        >
                            <FiX size={10} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Switcher Drawer Modal */}
            {searchTarget && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.85)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '40px 20px',
                    overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1000px', margin: '0 auto 20px', width: '100%' }}>
                        <h2 style={{ color: '#00f2fe', margin: 0, fontWeight: '900' }}>
                            Select Replacement for {searchTarget === 'player1' ? (p1.playername || 'Player 1') : (p2.playername || 'Player 2')}
                        </h2>
                        <button
                            onClick={() => setSearchTarget(null)}
                            style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                            Close <FiX size={14} />
                        </button>
                    </div>
                    <SmartSearch onCardClick={handleSelectNewCard} />
                </div>
            )}

            {/* ======================================================== */}
            {/* 3-COLUMN MAIN LAYOUT (Left Player, Center, Right Player) */}
            {/* ======================================================== */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 320px) 1fr minmax(280px, 320px)',
                gap: '24px',
                alignItems: 'start'
            }}>
                {/* ---------------------------------------------------- */}
                {/* LEFT COLUMN: PLAYER 1 */}
                {/* ---------------------------------------------------- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Header: Name + Playstyle */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: '900', color: '#fff', fontSize: '1.25em', letterSpacing: '0.8px' }}>
                            {(p1.playername || 'PLAYER 1').toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.84em', color: '#84cc16', fontWeight: '800', letterSpacing: '0.5px', marginTop: '4px' }}>
                            {(card1?.attacking_playstyle || card1?.playstyle || p1.playstyle || 'CREATIVE PLAYMAKER').toUpperCase()}
                        </div>
                    </div>

                    {/* Big Card Display */}
                    <div style={{
                        position: 'relative',
                        width: '230px',
                        height: '330px',
                        margin: '0 auto',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: '#151d2a',
                        border: '2px solid rgba(0, 242, 254, 0.4)',
                        boxShadow: '0 10px 30px rgba(0, 242, 254, 0.15)'
                    }}>
                        {p1Img ? (
                            <img src={p1Img} alt={p1.playername} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.currentTarget.style.display = 'none'} />
                        ) : null}

                        {/* Top-Left OVR + Position Badge */}
                        <div style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            lineHeight: 1
                        }}>
                            <div style={{ fontSize: '2em', fontWeight: '900', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
                                {ovr1}
                            </div>
                            <div style={{ fontSize: '0.9em', fontWeight: '900', color: '#00f2fe', textShadow: '0 2px 4px rgba(0,0,0,0.9)', letterSpacing: '1px' }}>
                                {card1?.positioncode || p1.registeredposition || 'CF'}
                            </div>
                        </div>

                        {/* Bottom Name Banner */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '16px 10px 10px',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.05em', fontWeight: '900', color: '#fff', letterSpacing: '0.5px' }}>
                                {p1.playername}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                                {'★★★★★'.split('').map((s, i) => (
                                    <span key={i} style={{ color: '#eab308', fontSize: '11px' }}>{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Biometrics (HT, WT, AGE) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        <div style={{ background: '#131924', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68em', color: '#64748b', fontWeight: '800' }}>HT</div>
                            <div style={{ fontSize: '0.92em', fontWeight: '900', color: '#fff', marginTop: '2px' }}>{p1.height || 170}cm</div>
                        </div>
                        <div style={{ background: '#131924', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68em', color: '#64748b', fontWeight: '800' }}>WT</div>
                            <div style={{ fontSize: '0.92em', fontWeight: '900', color: '#fff', marginTop: '2px' }}>{p1.weight || 67}kg</div>
                        </div>
                        <div style={{ background: '#131924', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68em', color: '#64748b', fontWeight: '800' }}>AGE</div>
                            <div style={{ fontSize: '0.92em', fontWeight: '900', color: '#fff', marginTop: '2px' }}>{p1.age || 20}</div>
                        </div>
                    </div>

                    {/* BOOSTERS SECTION */}
                    <div>
                        <div style={{ fontSize: '0.74em', color: '#64748b', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                            BOOSTERS
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {/* Booster 1 */}
                            <div
                                onClick={() => setBooster1On1(!booster1On1)}
                                style={{
                                    background: '#131924',
                                    border: booster1On1 ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                <BoosterHexagonIcon size={22} color={getBoosterTypeColor(card1?.booster1_type, card1?.booster1)} disabled={!booster1On1} />
                                <span style={{ fontSize: '0.84em', color: booster1On1 ? '#fff' : '#64748b', fontWeight: '800' }}>
                                    {card1?.booster1 && card1.booster1.toLowerCase() !== 'none' ? (card1.booster1.includes('+') ? card1.booster1 : `${card1.booster1} +4`) : 'Booster 1 — None'}
                                </span>
                            </div>

                            {/* Booster 2 */}
                            <div
                                onClick={() => setBooster2On1(!booster2On1)}
                                style={{
                                    background: '#131924',
                                    border: booster2On1 ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                <BoosterHexagonIcon size={22} color={getBoosterTypeColor(card1?.booster2_type, card1?.booster2)} disabled={!booster2On1 || !card1?.booster2 || card1.booster2.toLowerCase() === 'none' || card1.booster2 === 'Craftable Slot'} />
                                <span style={{ fontSize: '0.84em', color: booster2On1 ? '#fff' : '#64748b', fontWeight: '800' }}>
                                    {card1?.booster2 && card1.booster2.toLowerCase() !== 'none' && card1.booster2 !== 'Craftable Slot' ? card1.booster2 : 'Booster 2 — None'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* MANAGER SECTION (Exact UX from Reference Images 1 & 2) */}
                    <ManagerPicker
                        selectedMgrId={mgr1}
                        onSelectManager={setMgr1}
                        managersList={managersList}
                        playstyleKey={playstyle1}
                        onSelectPlaystyle={setPlaystyle1}
                        sliderVal={slider1}
                        onSliderChange={setSlider1}
                    />

                    {/* POSITIONS SECTION (OUR APP'S TACTICAL PITCH HEATMAP) */}
                    <div>
                        <div style={{ fontSize: '0.74em', color: '#64748b', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                            POSITIONS
                        </div>
                        <div style={{
                            background: '#131922',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '12px',
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <PositionRatingsPitch
                                baseOvr={ovr1}
                                primaryPosition={card1?.positioncode || 'AMF'}
                                playstyle={card1?.attacking_playstyle || card1?.playstyle || p1.playstyle}
                                attackingPlaystyle={card1?.attacking_playstyle || card1?.playstyle || p1.playstyle}
                                defensivePlaystyle={card1?.defensive_playstyle}
                                boostedStats={stats1}
                                customPrimaryPositions={card1?.primarypositions || []}
                                customSecondaryPositions={card1?.secondarypositions || []}
                            />
                        </div>
                    </div>

                    {/* SKILLS SECTION */}
                    <div>
                        <div style={{ fontSize: '0.74em', color: '#64748b', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                            SKILLS
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {p1Skills.map((sk, idx) => {
                                const isUnique = !p2SkillsLower.includes(sk.toLowerCase());
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            background: isUnique ? 'rgba(74, 222, 128, 0.12)' : '#131924',
                                            border: isUnique ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                                            color: isUnique ? '#4ade80' : '#94a3b8',
                                            fontSize: '0.72em',
                                            fontWeight: '800',
                                            letterSpacing: '0.5px',
                                            padding: '4px 10px',
                                            borderRadius: '999px',
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        {sk}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* CENTER COLUMN: RADAR CHART, ATTRIBUTES, PHYSICAL     */}
                {/* ---------------------------------------------------- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Top Hexagonal Radar Comparison Chart */}
                    <div style={{
                        background: '#101520',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '16px 12px',
                        textAlign: 'center'
                    }}>
                        {renderRadarChart()}
                    </div>

                    {/* 26 Attributes Comparison Table + 4 Physical Model Metrics */}
                    <div style={{
                        background: '#101520',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '12px 14px'
                    }}>
                        {COMPARISON_ATTRIBUTES.map(attr => {
                            const v1 = stats1[attr.key] !== undefined ? stats1[attr.key] : 50;
                            const v2 = stats2[attr.key] !== undefined ? stats2[attr.key] : 50;
                            const diff = v1 - v2;

                            const t1 = getStatTier(v1);
                            const t2 = getStatTier(v2);

                            return (
                                <div
                                    key={attr.key}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '36px 34px 1fr 34px 36px',
                                        alignItems: 'center',
                                        padding: '4px 0',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                        fontSize: '0.82em'
                                    }}
                                >
                                    {/* Left Diff Badge */}
                                    <div style={{
                                        textAlign: 'right',
                                        paddingRight: '6px',
                                        fontWeight: '900',
                                        fontSize: '0.85em',
                                        color: diff > 0 ? '#22c55e' : diff < 0 ? '#ef4444' : 'transparent'
                                    }}>
                                        {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : ''}
                                    </div>

                                    {/* Left Stat Box */}
                                    <div style={{
                                        background: t1.bg,
                                        color: t1.text,
                                        fontWeight: '900',
                                        fontSize: '0.9em',
                                        width: '32px',
                                        height: '24px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: v1 > v2 ? '0 0 8px rgba(34, 197, 94, 0.4)' : 'none'
                                    }}>
                                        {v1}
                                    </div>

                                    {/* Stat Name Center with Winner Dots */}
                                    <div style={{
                                        textAlign: 'center',
                                        color: '#cbd5e1',
                                        fontWeight: '700',
                                        fontSize: '0.88em',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        padding: '0 8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}>
                                        {v1 > v2 ? <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} /> : <span style={{ width: '5px', height: '5px' }} />}
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{attr.label}</span>
                                        {v2 > v1 ? <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} /> : <span style={{ width: '5px', height: '5px' }} />}
                                    </div>

                                    {/* Right Stat Box */}
                                    <div style={{
                                        background: t2.bg,
                                        color: t2.text,
                                        fontWeight: '900',
                                        fontSize: '0.9em',
                                        width: '32px',
                                        height: '24px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: v2 > v1 ? '0 0 8px rgba(34, 197, 94, 0.4)' : 'none'
                                    }}>
                                        {v2}
                                    </div>

                                    {/* Right Diff Badge */}
                                    <div style={{
                                        textAlign: 'left',
                                        paddingLeft: '6px',
                                        fontWeight: '900',
                                        fontSize: '0.85em',
                                        color: diff < 0 ? '#22c55e' : diff > 0 ? '#ef4444' : 'transparent'
                                    }}>
                                        {diff < 0 ? `+${Math.abs(diff)}` : diff > 0 ? `-${diff}` : ''}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Physical Reach & Coverage Metrics */}
                    <div style={{
                        background: '#101520',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '16px 20px'
                    }}>
                        {[
                            { label: 'LEG COVERAGE RADIUS', v1: phys1.legRadius, v2: phys2.legRadius },
                            { label: 'ARM COVERAGE RADIUS', v1: phys1.armRadius, v2: phys2.armRadius },
                            { label: 'JUMPING HEIGHT', v1: phys1.jumpHeight, v2: phys2.jumpHeight },
                            { label: 'TORSO COLLISION', v1: phys1.torso, v2: phys2.torso },
                            { label: 'LEG LENGTH BASED HEIGHT', v1: phys1.legHeight, v2: phys2.legHeight }
                        ].map((m, idx) => {
                            const n1 = parseFloat(m.v1);
                            const n2 = parseFloat(m.v2);
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '70px 1fr 70px',
                                        alignItems: 'center',
                                        padding: '6px 0',
                                        borderBottom: idx < 4 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                                        fontSize: '0.8em',
                                        fontWeight: '800'
                                    }}
                                >
                                    <div style={{ color: n1 >= n2 ? '#4ade80' : '#94a3b8', textAlign: 'left' }}>
                                        {m.v1}
                                    </div>
                                    <div style={{ color: '#cbd5e1', textAlign: 'center', fontSize: '0.84em', letterSpacing: '0.5px' }}>
                                        {m.label}
                                    </div>
                                    <div style={{ color: n2 >= n1 ? '#4ade80' : '#94a3b8', textAlign: 'right' }}>
                                        {m.v2}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer Logo */}
                    <div style={{ textAlign: 'center', padding: '12px 0 0' }}>
                        <span style={{ fontSize: '1.2em', fontWeight: '900', color: '#334155', letterSpacing: '2px' }}>
                            eFVerse
                        </span>
                    </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* RIGHT COLUMN: PLAYER 2 */}
                {/* ---------------------------------------------------- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Header: Name + Playstyle */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: '900', color: '#fff', fontSize: '1.25em', letterSpacing: '0.8px' }}>
                            {(p2.playername || 'PLAYER 2').toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.84em', color: '#84cc16', fontWeight: '800', letterSpacing: '0.5px', marginTop: '4px' }}>
                            {(card2?.attacking_playstyle || card2?.playstyle || p2.playstyle || 'CREATIVE PLAYMAKER').toUpperCase()}
                        </div>
                    </div>

                    {/* Big Card Display */}
                    <div style={{
                        position: 'relative',
                        width: '230px',
                        height: '330px',
                        margin: '0 auto',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: '#151d2a',
                        border: '2px solid rgba(249, 115, 22, 0.4)',
                        boxShadow: '0 10px 30px rgba(249, 115, 22, 0.15)'
                    }}>
                        {p2Img ? (
                            <img src={p2Img} alt={p2.playername} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.currentTarget.style.display = 'none'} />
                        ) : null}

                        {/* Top-Left OVR + Position Badge */}
                        <div style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            lineHeight: 1
                        }}>
                            <div style={{ fontSize: '2em', fontWeight: '900', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
                                {ovr2}
                            </div>
                            <div style={{ fontSize: '0.9em', fontWeight: '900', color: '#f97316', textShadow: '0 2px 4px rgba(0,0,0,0.9)', letterSpacing: '1px' }}>
                                {card2?.positioncode || p2.registeredposition || 'CF'}
                            </div>
                        </div>

                        {/* Bottom Name Banner */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '16px 10px 10px',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.05em', fontWeight: '900', color: '#fff', letterSpacing: '0.5px' }}>
                                {p2.playername}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                                {'★★★★★'.split('').map((s, i) => (
                                    <span key={i} style={{ color: '#eab308', fontSize: '11px' }}>{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Biometrics (HT, WT, AGE) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        <div style={{ background: '#131924', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68em', color: '#64748b', fontWeight: '800' }}>HT</div>
                            <div style={{ fontSize: '0.92em', fontWeight: '900', color: '#fff', marginTop: '2px' }}>{p2.height || 170}cm</div>
                        </div>
                        <div style={{ background: '#131924', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68em', color: '#64748b', fontWeight: '800' }}>WT</div>
                            <div style={{ fontSize: '0.92em', fontWeight: '900', color: '#fff', marginTop: '2px' }}>{p2.weight || 67}kg</div>
                        </div>
                        <div style={{ background: '#131924', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.68em', color: '#64748b', fontWeight: '800' }}>AGE</div>
                            <div style={{ fontSize: '0.92em', fontWeight: '900', color: '#fff', marginTop: '2px' }}>{p2.age || 20}</div>
                        </div>
                    </div>

                    {/* BOOSTERS SECTION */}
                    <div>
                        <div style={{ fontSize: '0.74em', color: '#64748b', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                            BOOSTERS
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {/* Booster 1 */}
                            <div
                                onClick={() => setBooster1On2(!booster1On2)}
                                style={{
                                    background: '#131924',
                                    border: booster1On2 ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                <BoosterHexagonIcon size={22} color={getBoosterTypeColor(card2?.booster1_type, card2?.booster1)} disabled={!booster1On2} />
                                <span style={{ fontSize: '0.84em', color: booster1On2 ? '#fff' : '#64748b', fontWeight: '800' }}>
                                    {card2?.booster1 && card2.booster1.toLowerCase() !== 'none' ? (card2.booster1.includes('+') ? card2.booster1 : `${card2.booster1} +4`) : 'Booster 1 — None'}
                                </span>
                            </div>

                            {/* Booster 2 */}
                            <div
                                onClick={() => setBooster2On2(!booster2On2)}
                                style={{
                                    background: '#131924',
                                    border: booster2On2 ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                <BoosterHexagonIcon size={22} color={getBoosterTypeColor(card2?.booster2_type, card2?.booster2)} disabled={!booster2On2 || !card2?.booster2 || card2.booster2.toLowerCase() === 'none' || card2.booster2 === 'Craftable Slot'} />
                                <span style={{ fontSize: '0.84em', color: booster2On2 ? '#fff' : '#64748b', fontWeight: '800' }}>
                                    {card2?.booster2 && card2.booster2.toLowerCase() !== 'none' && card2.booster2 !== 'Craftable Slot' ? card2.booster2 : 'Booster 2 — None'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* MANAGER SECTION (Exact UX from Reference Images 1 & 2) */}
                    <ManagerPicker
                        selectedMgrId={mgr2}
                        onSelectManager={setMgr2}
                        managersList={managersList}
                        playstyleKey={playstyle2}
                        onSelectPlaystyle={setPlaystyle2}
                        sliderVal={slider2}
                        onSliderChange={setSlider2}
                    />

                    {/* POSITIONS SECTION (OUR APP'S TACTICAL PITCH HEATMAP) */}
                    <div>
                        <div style={{ fontSize: '0.74em', color: '#64748b', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                            POSITIONS
                        </div>
                        <div style={{
                            background: '#131922',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '12px',
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <PositionRatingsPitch
                                baseOvr={ovr2}
                                primaryPosition={card2?.positioncode || 'AMF'}
                                playstyle={card2?.attacking_playstyle || card2?.playstyle || p2.playstyle}
                                attackingPlaystyle={card2?.attacking_playstyle || card2?.playstyle || p2.playstyle}
                                defensivePlaystyle={card2?.defensive_playstyle}
                                boostedStats={stats2}
                                customPrimaryPositions={card2?.primarypositions || []}
                                customSecondaryPositions={card2?.secondarypositions || []}
                            />
                        </div>
                    </div>

                    {/* SKILLS SECTION */}
                    <div>
                        <div style={{ fontSize: '0.74em', color: '#64748b', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                            SKILLS
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {p2Skills.map((sk, idx) => {
                                const isUnique = !p1SkillsLower.includes(sk.toLowerCase());
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            background: isUnique ? 'rgba(74, 222, 128, 0.12)' : '#131924',
                                            border: isUnique ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                                            color: isUnique ? '#4ade80' : '#94a3b8',
                                            fontSize: '0.72em',
                                            fontWeight: '800',
                                            letterSpacing: '0.5px',
                                            padding: '4px 10px',
                                            borderRadius: '999px',
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        {sk}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
