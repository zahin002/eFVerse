import React from 'react';

const parseNum = (val, fallback = 60) => {
    if (val === null || val === undefined) return fallback;
    const n = typeof val === 'number' ? val : parseInt(val, 10);
    return isNaN(n) ? fallback : n;
};

const getStatTierColor = (val) => {
    const v = parseNum(val, 60);
    if (v >= 90) return { labelColor: '#00f2fe', boxBg: '#00f2fe', boxText: '#000' };
    if (v >= 80) return { labelColor: '#39ff14', boxBg: '#22c55e', boxText: '#000' };
    if (v >= 70) return { labelColor: '#f97316', boxBg: '#f97316', boxText: '#000' };
    if (v >= 60) return { labelColor: '#facc15', boxBg: '#eab308', boxText: '#000' };
    return { labelColor: '#ff4d4d', boxBg: '#ef4444', boxText: '#fff' };
};

const StatRowItem = ({ label, baseVal = 60, boostedVal }) => {
    const safeBase = parseNum(baseVal, 60);
    const safeBoosted = boostedVal !== undefined ? parseNum(boostedVal, safeBase) : safeBase;
    const finalVal = Math.min(99, Math.max(40, safeBoosted));
    const boostVal = Math.max(0, finalVal - safeBase);
    const { labelColor, boxBg, boxText } = getStatTierColor(finalVal);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.88em',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, paddingRight: '10px' }}>
                <span style={{ color: labelColor, fontWeight: 'bold' }}>
                    {label}
                </span>
                {boostVal > 0 && (
                    <span style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        color: '#22c55e',
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                        fontSize: '0.7em',
                        fontWeight: '900',
                        padding: '1px 5px',
                        borderRadius: '4px'
                    }}>
                        +{boostVal}
                    </span>
                )}
            </div>
            <div style={{
                background: boxBg,
                color: boxText,
                width: '32px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '5px',
                fontWeight: '900',
                fontSize: '0.9em',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)'
            }}>
                {finalVal}
            </div>
        </div>
    );
};

export default function AttributeMatrixPanel({ stats = {}, boostedStats = {} }) {
    const getStat = (key, defaultVal, fallbackKey) => {
        let raw = stats[key];
        if (raw === undefined && fallbackKey) raw = stats[fallbackKey];
        const base = parseNum(raw, defaultVal);

        let rawBoosted = boostedStats[key];
        if (rawBoosted === undefined && fallbackKey) rawBoosted = boostedStats[fallbackKey];
        const boosted = parseNum(rawBoosted, base);

        return { baseVal: base, boostedVal: boosted };
    };

    return (
        <div style={{
            background: '#0d1118',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '24px 28px',
            color: '#e2e8f0',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '35px'
            }}>
                {/* 1. ATTACKING COLUMN */}
                <div>
                    <h4 style={{ color: '#64748b', margin: '0 0 16px 0', letterSpacing: '1.5px', textTransform: 'uppercase', fontSize: '0.82em', fontWeight: '800' }}>
                        ATTACKING
                    </h4>
                    <StatRowItem label="Offensive Awareness" {...getStat('offensiveawareness', 60)} />
                    <StatRowItem label="Ball Control" {...getStat('ballcontrol', 60)} />
                    <StatRowItem label="Dribbling" {...getStat('dribbling', 60)} />
                    <StatRowItem label="Tight Possession" {...getStat('tightpossession', 60, 'ballcontrol')} />
                    <StatRowItem label="Low Pass" {...getStat('lowpass', 60, 'passing')} />
                    <StatRowItem label="Lofted Pass" {...getStat('loftedpass', 55, 'passing')} />
                    <StatRowItem label="Finishing" {...getStat('finishing', 60)} />
                    <StatRowItem label="Heading" {...getStat('heading', 65)} />
                    <StatRowItem label="Place Kicking" {...getStat('placekicking', 68)} />
                    <StatRowItem label="Curl" {...getStat('curl', 72)} />
                </div>

                {/* 2. DEFENDING COLUMN */}
                <div>
                    <h4 style={{ color: '#64748b', margin: '0 0 16px 0', letterSpacing: '1.5px', textTransform: 'uppercase', fontSize: '0.82em', fontWeight: '800' }}>
                        DEFENDING
                    </h4>
                    <StatRowItem label="Defensive Awareness" {...getStat('defensiveawareness', 40)} />
                    <StatRowItem label="Defensive Engagement" {...getStat('defensiveengagement', 50)} />
                    <StatRowItem label="Tackling" {...getStat('tackling', 40)} />
                    <StatRowItem label="Aggression" {...getStat('aggression', 40)} />
                    <StatRowItem label="Goalkeeping" {...getStat('gkawareness', 40)} />
                    <StatRowItem label="GK Catching" {...getStat('gkcatching', 40)} />
                    <StatRowItem label="GK Parrying" {...getStat('gkparrying', 40)} />
                    <StatRowItem label="GK Reflexes" {...getStat('gkreflexes', 40)} />
                    <StatRowItem label="GK Reach" {...getStat('gkreach', 40)} />
                </div>

                {/* 3. ATHLETICISM COLUMN */}
                <div>
                    <h4 style={{ color: '#64748b', margin: '0 0 16px 0', letterSpacing: '1.5px', textTransform: 'uppercase', fontSize: '0.82em', fontWeight: '800' }}>
                        ATHLETICISM
                    </h4>
                    <StatRowItem label="Speed" {...getStat('speed', 60)} />
                    <StatRowItem label="Acceleration" {...getStat('acceleration', 60)} />
                    <StatRowItem label="Kicking Power" {...getStat('kickingpower', 60)} />
                    <StatRowItem label="Jump" {...getStat('jump', 60)} />
                    <StatRowItem label="Physical Contact" {...getStat('physicalcontact', 60)} />
                    <StatRowItem label="Balance" {...getStat('balance', 60)} />
                    <StatRowItem label="Stamina" {...getStat('stamina', 60)} />
                </div>
            </div>
        </div>
    );
}
