import React, { useState, useEffect, useRef } from 'react';
import { EFOOTBALL_SKILLS, getSkillDescription } from './efootballSkills';

export default function PlayerSkillsPanel({ cardData, playerBio, stats }) {
    const cardId = cardData?.cardid || playerBio?.playerid || 'default';
    
    // Check card type for Trending / POTW restriction
    const cardType = (cardData?.cardtype || '').toUpperCase();
    const isTrendingCard = cardType === 'POTW' || cardType === 'TRENDING';

    const [skillsList] = useState(
        cardData?.skills || ['Double Touch', 'First Time Shot', 'One Touch Pass', 'Long Range Shooting', 'Blitz Curler']
    );

    // Initialize 5 additional skill slots from localStorage or cardData
    const [additionalSkills, setAdditionalSkills] = useState(() => {
        try {
            const saved = localStorage.getItem(`ef_add_skills_${cardId}`);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error("Error reading saved additional skills", e);
        }
        return cardData?.additionalSkills || ['', '', '', '', ''];
    });

    const [activeAddSlot, setActiveAddSlot] = useState(null);
    const [skillSearch, setSkillSearch] = useState('');
    const [hoveredSkill, setHoveredSkill] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, title: '', desc: '' });

    // Save to localStorage when additionalSkills change
    useEffect(() => {
        if (cardId && cardId !== 'default') {
            try {
                localStorage.setItem(`ef_add_skills_${cardId}`, JSON.stringify(additionalSkills));
            } catch (e) {
                console.error("Error saving additional skills", e);
            }
        }
    }, [additionalSkills, cardId]);

    const addedCount = additionalSkills.filter(s => Boolean(s && s.trim())).length;

    const comSkills = cardData?.comskills || ['Mazing Run', 'Long Ball Expert'];
    const metrics = playerBio?.modelMetrics || {
        armlength: 12, shoulderwidth: 5, necklength: 4, chestmeasurement: 6,
        necksize: 7, shoulderheight: 11, leglength: 14, thighsize: 5,
        waistsize: 9, armsize: 5, calfsize: 3
    };

    const height = playerBio?.height || 186;
    const jump = stats?.jump || 69;
    const physical = stats?.physicalcontact || 82;

    // Derived physics engine metrics
    const legCoverage = (height * 0.941 + (metrics.leglength || 14) * 0.6).toFixed(1);
    const armCoverage = (height * 0.88 + (metrics.armlength || 11) * 0.935).toFixed(1);
    const jumpingHeight = (height + jump * 1.0884).toFixed(1);
    const torsoCollision = (physical * 0.6464).toFixed(1);
    const legBasedHeight = Math.round(height + (metrics.leglength || 14) * 0.5);

    const modelLabels = [
        { key: 'armlength', label: 'Arm Length' },
        { key: 'shoulderwidth', label: 'Shoulder Width' },
        { key: 'necklength', label: 'Neck Length' },
        { key: 'chestmeasurement', label: 'Chest Measurement' },
        { key: 'necksize', label: 'Neck Size' },
        { key: 'shoulderheight', label: 'Shoulder Height' },
        { key: 'leglength', label: 'Leg Length' },
        { key: 'thighsize', label: 'Thigh Size' },
        { key: 'waistsize', label: 'Waist Size' },
        { key: 'armsize', label: 'Arm Size' },
        { key: 'calfsize', label: 'Calf Size' }
    ];

    const getModelTier = (val) => {
        if (val >= 12) return { labelColor: '#00f2fe', bg: '#00f2fe', text: '#000' };
        if (val >= 9) return { labelColor: '#39ff14', bg: '#22c55e', text: '#000' };
        if (val >= 7) return { labelColor: '#f97316', bg: '#f97316', text: '#000' };
        if (val >= 5) return { labelColor: '#facc15', bg: '#eab308', text: '#000' };
        return { labelColor: '#ff4d4d', bg: '#ef4444', text: '#fff' };
    };

    // Calculate skills that player already possesses (base + other additional slots)
    const getOwnedSkills = (targetSlotIdx) => {
        const baseSet = new Set(skillsList.map(s => s.toLowerCase().trim()));
        additionalSkills.forEach((s, idx) => {
            if (idx !== targetSlotIdx && s && s.trim()) {
                baseSet.add(s.toLowerCase().trim());
            }
        });
        return baseSet;
    };

    // Filter available eFootball skills for selection (excluding owned skills)
    const getAvailableSkillsForSlot = (targetSlotIdx) => {
        const owned = getOwnedSkills(targetSlotIdx);
        return EFOOTBALL_SKILLS.filter(skillObj => {
            const isOwned = owned.has(skillObj.name.toLowerCase().trim());
            if (isOwned) return false;
            if (skillSearch.trim()) {
                const query = skillSearch.toLowerCase().trim();
                return skillObj.name.toLowerCase().includes(query) || skillObj.description.toLowerCase().includes(query);
            }
            return true;
        });
    };

    const handleSelectSkill = (slotIndex, skillName) => {
        const updated = [...additionalSkills];
        updated[slotIndex] = skillName;
        setAdditionalSkills(updated);
        setActiveAddSlot(null);
        setSkillSearch('');
    };

    const handleRemoveSkill = (slotIndex) => {
        const updated = [...additionalSkills];
        updated[slotIndex] = '';
        setAdditionalSkills(updated);
    };

    const handleMouseEnterSkill = (e, name, desc) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY - 10,
            title: name,
            desc: desc || getSkillDescription(name)
        });
        setHoveredSkill(name);
    };

    const handleMouseLeaveSkill = () => {
        setHoveredSkill(null);
    };

    const boxStyle = {
        background: '#0a0d14',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '20px 24px',
        color: '#e2e8f0',
        fontFamily: "'Outfit', sans-serif"
    };

    const badgeStyle = {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '6px',
        padding: '6px 12px',
        fontSize: '0.85em',
        fontWeight: '600',
        display: 'inline-block',
        margin: '4px',
        cursor: 'help',
        transition: 'all 0.2s ease'
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginTop: '25px', position: 'relative' }}>
            
            {/* FLOATING SKILL TOOLTIP */}
            {hoveredSkill && (
                <div style={{
                    position: 'fixed',
                    top: Math.max(10, tooltipPos.y - 70),
                    left: Math.min(window.innerWidth - 320, Math.max(10, tooltipPos.x)),
                    zIndex: 9999,
                    background: '#111722',
                    border: '1px solid #38bdf8',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    maxWidth: '300px',
                    boxShadow: '0 8px 30px rgba(0, 242, 254, 0.3)',
                    pointerEvents: 'none'
                }}>
                    <div style={{ color: '#00f2fe', fontWeight: '900', fontSize: '0.9em', marginBottom: '3px' }}>
                        {tooltipPos.title}
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.78em', lineHeight: 1.4 }}>
                        {tooltipPos.desc}
                    </div>
                </div>
            )}

            {/* COLUMN 1: BASE SKILLS, ADDITIONAL SKILLS & COM SKILLS */}
            <div style={boxStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8em', fontWeight: '800' }}>
                        BASE PLAYER SKILLS ({skillsList.length})
                    </h4>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                    {skillsList.map((skill, idx) => (
                        <span 
                            key={idx} 
                            style={badgeStyle}
                            onMouseEnter={(e) => handleMouseEnterSkill(e, skill)}
                            onMouseLeave={handleMouseLeaveSkill}
                        >
                            {skill}
                        </span>
                    ))}
                </div>

                {/* 5 ADDITIONAL SKILLS SLOTS */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, color: '#38bdf8', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8em', fontWeight: '800' }}>
                            ADDITIONAL SKILLS {isTrendingCard ? '(LOCKED)' : `${addedCount}/5`}
                        </h4>
                        {!isTrendingCard && (
                            <span style={{ fontSize: '0.7em', color: '#64748b', fontWeight: '600' }}>
                                Up to 5 slots
                            </span>
                        )}
                    </div>

                    {isTrendingCard ? (
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
                            <span>Trending & POTW players cannot undergo Skill Training.</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                            {[0, 1, 2, 3, 4].map(slotIdx => {
                                const skillName = additionalSkills[slotIdx];
                                const isSelecting = activeAddSlot === slotIdx;
                                const availableSkills = getAvailableSkillsForSlot(slotIdx);

                                return (
                                    <div key={slotIdx} style={{ position: 'relative' }}>
                                        {isSelecting ? (
                                            <div style={{
                                                background: '#0d1117',
                                                border: '1px solid #38bdf8',
                                                borderRadius: '8px',
                                                padding: '10px',
                                                boxShadow: '0 6px 20px rgba(0,0,0,0.8)',
                                                zIndex: 100
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '0.75em', color: '#38bdf8', fontWeight: '900', textTransform: 'uppercase' }}>
                                                        Select Skill (Slot {slotIdx + 1})
                                                    </span>
                                                    <button 
                                                        onClick={() => { setActiveAddSlot(null); setSkillSearch(''); }}
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85em' }}
                                                    >
                                                        ✕ Cancel
                                                    </button>
                                                </div>

                                                <input 
                                                    type="text" 
                                                    placeholder="🔍 Search 54 eFootball Skills..." 
                                                    value={skillSearch} 
                                                    onChange={e => setSkillSearch(e.target.value)} 
                                                    style={{ width: '100%', padding: '7px 10px', background: '#161b22', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '0.82em', marginBottom: '8px', outline: 'none' }}
                                                    autoFocus
                                                />

                                                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {availableSkills.length === 0 ? (
                                                        <div style={{ fontSize: '0.78em', color: '#64748b', fontStyle: 'italic', padding: '8px', textAlign: 'center' }}>
                                                            No matching unlearned skills available.
                                                        </div>
                                                    ) : (
                                                        availableSkills.map(skillObj => (
                                                            <div 
                                                                key={skillObj.name}
                                                                onClick={() => handleSelectSkill(slotIdx, skillObj.name)}
                                                                style={{
                                                                    padding: '7px 10px',
                                                                    background: 'rgba(255,255,255,0.03)',
                                                                    borderRadius: '5px',
                                                                    cursor: 'pointer',
                                                                    transition: 'background 0.15s ease',
                                                                    borderBottom: '1px solid rgba(255,255,255,0.02)'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                                            >
                                                                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.82em' }}>
                                                                    {skillObj.name}
                                                                </div>
                                                                <div style={{ color: '#94a3b8', fontSize: '0.72em', marginTop: '2px', lineHeight: 1.3 }}>
                                                                    {skillObj.description}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        ) : skillName ? (
                                            <div 
                                                style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center', 
                                                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(0, 242, 254, 0.05) 100%)', 
                                                    border: '1px solid rgba(56, 189, 248, 0.35)', 
                                                    padding: '7px 12px', 
                                                    borderRadius: '8px', 
                                                    fontSize: '0.85em',
                                                    boxShadow: '0 2px 8px rgba(0, 242, 254, 0.1)',
                                                    minHeight: '38px',
                                                    boxSizing: 'border-box'
                                                }}
                                                onMouseEnter={(e) => handleMouseEnterSkill(e, skillName)}
                                                onMouseLeave={handleMouseLeaveSkill}
                                            >
                                                <span style={{ color: '#fff', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: '10px' }}>
                                                    {skillName}
                                                </span>
                                                <button 
                                                    onClick={() => handleRemoveSkill(slotIdx)} 
                                                    style={{ 
                                                        background: 'rgba(239, 68, 68, 0.12)', 
                                                        border: '1px solid rgba(239, 68, 68, 0.35)', 
                                                        color: '#ef4444', 
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '6px', 
                                                        cursor: 'pointer', 
                                                        fontSize: '0.8em', 
                                                        fontWeight: '900',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)'; }}
                                                    title="Remove skill"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => { setActiveAddSlot(slotIdx); setSkillSearch(''); }} 
                                                style={{ 
                                                    width: '100%', 
                                                    background: 'rgba(255, 255, 255, 0.02)', 
                                                    border: '1px dashed rgba(56, 189, 248, 0.3)', 
                                                    color: '#38bdf8', 
                                                    padding: '8px 12px', 
                                                    borderRadius: '8px', 
                                                    cursor: 'pointer', 
                                                    fontSize: '0.82em', 
                                                    fontWeight: '700',
                                                    textAlign: 'left',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)'; e.currentTarget.style.borderColor = '#38bdf8'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)'; }}
                                            >
                                                <span>+ Add Skill Slot {slotIdx + 1}</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#a78bfa', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8em', fontWeight: '800' }}>
                        COM SKILLS
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {comSkills.map((cSkill, idx) => (
                            <span 
                                key={idx} 
                                style={{ ...badgeStyle, borderColor: 'rgba(167, 139, 250, 0.3)', color: '#a78bfa' }}
                                onMouseEnter={(e) => handleMouseEnterSkill(e, cSkill, "Computer AI gameplay skill pattern.")}
                                onMouseLeave={handleMouseLeaveSkill}
                            >
                                {cSkill}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* COLUMN 2: PLAYER MODEL */}
            <div style={boxStyle}>
                <h4 style={{ margin: '0 0 14px 0', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8em', fontWeight: '800' }}>
                    PLAYER MODEL
                </h4>
                
                {modelLabels.map(({ key, label }) => {
                    const val = metrics[key] || 5;
                    const { labelColor, bg, text } = getModelTier(val);

                    return (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.88em' }}>
                            <span style={{ color: labelColor, fontWeight: 'bold' }}>{label}</span>
                            <span style={{ background: bg, color: text, padding: '2px 8px', borderRadius: '4px', fontWeight: '900', fontSize: '0.9em', minWidth: '24px', textAlign: 'center' }}>{val}</span>
                        </div>
                    );
                })}
            </div>

            {/* COLUMN 3: PHYSICS */}
            <div style={boxStyle}>
                <h4 style={{ margin: '0 0 14px 0', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8em', fontWeight: '800' }}>
                    PHYSICS
                </h4>

                {[
                    { label: 'LEG COVERAGE RADIUS', val: legCoverage, max: 200 },
                    { label: 'ARM COVERAGE RADIUS', val: armCoverage, max: 200 },
                    { label: 'JUMPING HEIGHT', val: jumpingHeight, max: 300 },
                    { label: 'TORSO COLLISION', val: torsoCollision, max: 100 },
                    { label: 'LEG LENGTH BASED HEIGHT', val: legBasedHeight, max: 220 }
                ].map((p, idx) => (
                    <div key={idx} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8em', marginBottom: '5px' }}>
                            <span style={{ color: '#64748b', fontWeight: 'bold', letterSpacing: '0.5px' }}>{p.label}</span>
                            <span style={{ color: '#fff', fontWeight: '900', fontSize: '1.05em' }}>{p.val}</span>
                        </div>
                        <div style={{ height: '8px', width: '100%', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, (p.val / p.max) * 100)}%`, background: 'linear-gradient(90deg, #a855f7, #ec4899)', borderRadius: '4px' }} />
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
