import React from 'react';
import { getLevelCost } from './progressionEngine';
import shootingIcon from './assets/progression_icons/shooting.png';
import passingIcon from './assets/progression_icons/passing.png';
import dribblingIcon from './assets/progression_icons/dribbling.png';
import dexterityIcon from './assets/progression_icons/dexterity.png';
import lowerbodyIcon from './assets/progression_icons/lowerbody.png';
import aerialIcon from './assets/progression_icons/aerial.png';
import defendingIcon from './assets/progression_icons/defending.png';
import gk1Icon from './assets/progression_icons/gk1.png';
import gk2Icon from './assets/progression_icons/gk2.png';
import gk3Icon from './assets/progression_icons/gk3.png';

// ---- Inline icons (Konami / eFHUB official style) ----
const TargetIcon = ({ size = 22 }) => (
    <img 
        src={shootingIcon} 
        alt="Shooting" 
        style={{ width: size, height: size, minWidth: size, borderRadius: '50%', objectFit: 'contain', display: 'block', verticalAlign: 'middle' }} 
    />
);

const BallIcon = ({ size = 22 }) => (
    <img 
        src={passingIcon} 
        alt="Passing" 
        style={{ width: size, height: size, minWidth: size, borderRadius: '50%', objectFit: 'contain', display: 'block', verticalAlign: 'middle' }} 
    />
);

const TriangleIcon = ({ size = 22 }) => (
    <img 
        src={dribblingIcon} 
        alt="Dribbling" 
        style={{ width: size, height: size, minWidth: size, borderRadius: '50%', objectFit: 'contain', display: 'block', verticalAlign: 'middle' }} 
    />
);

const ShuffleIcon = ({ size = 22 }) => (
    <img 
        src={dexterityIcon} 
        alt="Dexterity" 
        style={{ width: size, height: size, minWidth: size, borderRadius: '50%', objectFit: 'contain', display: 'block', verticalAlign: 'middle' }} 
    />
);

const BootIcon = ({ size = 22 }) => (
    <img 
        src={lowerbodyIcon} 
        alt="Lower Body Strength" 
        style={{ width: size, height: size, minWidth: size, borderRadius: '50%', objectFit: 'contain', display: 'block', verticalAlign: 'middle' }} 
    />
);

const DoubleUpIcon = ({ size = 22 }) => (
    <img 
        src={aerialIcon} 
        alt="Aerial Strength" 
        style={{ width: size, height: size, minWidth: size, borderRadius: '50%', objectFit: 'contain', display: 'block', verticalAlign: 'middle' }} 
    />
);

const ShieldIcon = ({ size = 22 }) => (
    <img 
        src={defendingIcon} 
        alt="Defending" 
        style={{ width: size, height: size, minWidth: size, borderRadius: '50%', objectFit: 'contain', display: 'block', verticalAlign: 'middle' }} 
    />
);

const GloveIcon = ({ size = 22, number = 1 }) => {
    const iconSrc = number === 2 ? gk2Icon : (number === 3 ? gk3Icon : gk1Icon);
    return (
        <img 
            src={iconSrc} 
            alt={`GK ${number}`} 
            style={{ width: size, height: size, minWidth: size, borderRadius: '50%', objectFit: 'contain', display: 'block', verticalAlign: 'middle' }} 
        />
    );
};

// ---- Category icon map ----
const CATEGORY_ICONS = {
    shooting:  <TargetIcon size={22} />,
    passing:   <BallIcon size={22} />,
    dribbling: <TriangleIcon size={22} />,
    dexterity: <ShuffleIcon size={22} />,
    lowerBody: <BootIcon size={22} />,
    aerial:    <DoubleUpIcon size={22} />,
    defending: <ShieldIcon size={22} />,
    gk1:       <GloveIcon size={22} number={1} />,
    gk2:       <GloveIcon size={22} number={2} />,
    gk3:       <GloveIcon size={22} number={3} />,
};

// ---- Main Component ----
const INITIAL_ALLOCATIONS = {
    shooting: 0, passing: 0, dribbling: 0, dexterity: 0,
    lowerBody: 0, aerial: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0
};

export default function ProgressionSlidersPanel({
    primaryPosition = 'AMF',
    levelCap = 32,
    maxPoints = 62,
    allocations = INITIAL_ALLOCATIONS,
    onAllocationChange,
    onSmartAllocate,
    onMaxAllocate,
    onReset
}) {
    const totalUsed = Object.values(allocations).reduce((sum, lvl) => {
        for (let i = 1; i <= lvl; i++) sum += getLevelCost(i);
        return sum;
    }, 0);

    const pointsRemaining = Math.max(0, maxPoints - totalUsed);

    const handleIncrement = (key) => {
        const currentLvl = allocations[key] || 0;
        if (currentLvl >= 16) return;
        const cost = getLevelCost(currentLvl + 1);
        if (pointsRemaining >= cost) {
            onAllocationChange({
                ...allocations,
                [key]: currentLvl + 1
            });
        }
    };

    const handleDecrement = (key) => {
        const currentLvl = allocations[key] || 0;
        if (currentLvl > 0) {
            onAllocationChange({
                ...allocations,
                [key]: currentLvl - 1
            });
        }
    };

    const categories = [
        { key: 'shooting', label: 'SHOOTING' },
        { key: 'passing', label: 'PASSING' },
        { key: 'dribbling', label: 'DRIBBLING' },
        { key: 'dexterity', label: 'DEXTERITY' },
        { key: 'lowerBody', label: 'LOWER BODY STRENGTH' },
        { key: 'aerial', label: 'AERIAL STRENGTH' },
        { key: 'defending', label: 'DEFENDING' },
        { key: 'gk1', label: 'GK 1' },
        { key: 'gk2', label: 'GK 2' },
        { key: 'gk3', label: 'GK 3' }
    ];

    return (
        <div style={{
            background: '#0d1117',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '14px',
            width: '270px',
            boxSizing: 'border-box',
            fontFamily: "'Outfit', sans-serif",
            color: '#fff'
        }}>
            {/* TOP ACTION BAR */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <select 
                    value={primaryPosition}
                    disabled
                    style={{
                        background: '#161b22',
                        color: '#00f2fe',
                        border: '1px solid rgba(0, 242, 254, 0.3)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.75em',
                        fontWeight: '900',
                        outline: 'none'
                    }}
                >
                    <option value={primaryPosition}>{primaryPosition}</option>
                </select>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={onReset}
                        style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '0.7em',
                            fontWeight: '900',
                            cursor: 'pointer'
                        }}
                    >
                        RESET
                    </button>
                    <button
                        type="button"
                        onClick={onSmartAllocate || onMaxAllocate}
                        style={{
                            background: '#00f2fe',
                            color: '#000',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '3px 12px',
                            fontSize: '0.7em',
                            fontWeight: '900',
                            cursor: 'pointer',
                            boxShadow: '0 0 8px rgba(0, 242, 254, 0.4)'
                        }}
                    >
                        MAX
                    </button>
                </div>
            </div>

            {/* LEVEL CAP & POINTS HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72em', color: '#94a3b8', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span>Level Cap <strong style={{ color: '#fff' }}>{levelCap}</strong></span>
                <span>Points <strong style={{ color: '#00f2fe' }}>{totalUsed}</strong> / {maxPoints}</span>
            </div>

            {/* CATEGORY SLIDERS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {categories.map(({ key, label }) => {
                    const currentLvl = allocations[key] || 0;
                    const nextCost = getLevelCost(currentLvl + 1);
                    const canAdd = currentLvl < 16 && pointsRemaining >= nextCost;
                    const active = currentLvl > 0;

                    return (
                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {/* Label row with icon */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '24px' }}>
                                <div style={{
                                    width: '22px',
                                    height: '22px',
                                    minWidth: '22px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {CATEGORY_ICONS[key]}
                                </div>
                                <span style={{
                                    fontSize: '0.66em',
                                    color: active ? '#fff' : '#94a3b8',
                                    fontWeight: '800',
                                    letterSpacing: '0.5px',
                                    lineHeight: 1
                                }}>
                                    {label}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* Track / Slider Bar */}
                                <div style={{
                                    flex: 1,
                                    height: '6px',
                                    background: '#161b22',
                                    borderRadius: '3px',
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        width: `${(currentLvl / 16) * 100}%`,
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #00f2fe, #38bdf8)',
                                        borderRadius: '3px',
                                        transition: 'width 0.15s ease'
                                    }} />
                                </div>

                                {/* Controls */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleDecrement(key)}
                                        disabled={currentLvl <= 0}
                                        style={{
                                            background: currentLvl > 0 ? '#1f2937' : '#111722',
                                            color: currentLvl > 0 ? '#fff' : '#475569',
                                            border: 'none',
                                            borderRadius: '4px',
                                            width: '18px',
                                            height: '18px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.8em',
                                            fontWeight: 'bold',
                                            cursor: currentLvl > 0 ? 'pointer' : 'default'
                                        }}
                                    >
                                        -
                                    </button>

                                    <span style={{
                                        fontSize: '0.78em',
                                        fontWeight: '900',
                                        color: currentLvl > 0 ? '#00f2fe' : '#94a3b8',
                                        width: '16px',
                                        textAlign: 'center'
                                    }}>
                                        {currentLvl}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => handleIncrement(key)}
                                        disabled={!canAdd}
                                        style={{
                                            background: canAdd ? '#1f2937' : '#111722',
                                            color: canAdd ? '#00f2fe' : '#475569',
                                            border: 'none',
                                            borderRadius: '4px',
                                            width: '18px',
                                            height: '18px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.8em',
                                            fontWeight: 'bold',
                                            cursor: canAdd ? 'pointer' : 'default'
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
