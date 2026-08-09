import React from 'react';

// Maps primary position codes to default primary dual positions if custom ones aren't defined
const defaultPrimaryPositionsMap = {
    'AMF': ['AMF', 'CMF'],
    'CMF': ['CMF', 'AMF', 'DMF'],
    'CF':  ['CF', 'SS'],
    'SS':  ['SS', 'CF', 'AMF'],
    'LWF': ['LWF', 'RWF', 'SS'],
    'RWF': ['RWF', 'LWF', 'SS'],
    'LMF': ['LMF', 'RMF', 'AMF'],
    'RMF': ['RMF', 'LMF', 'AMF'],
    'DMF': ['DMF', 'CMF'],
    'CB':  ['CB'],
    'LB':  ['LB', 'RB'],
    'RB':  ['RB', 'LB'],
    'GK':  ['GK']
};

const defaultFullAffinityMap = {
    'AMF': ['LMF', 'RMF', 'SS'],
    'CMF': ['LMF', 'RMF', 'LB', 'RB'],
    'CF':  ['LWF', 'RWF'],
    'SS':  ['LWF', 'RWF'],
    'LWF': ['CF', 'LMF'],
    'RWF': ['CF', 'RMF'],
    'LMF': ['LWF', 'CMF', 'LB'],
    'RMF': ['RWF', 'CMF', 'RB'],
    'DMF': ['CB', 'LB', 'RB'],
    'CB':  ['LB', 'RB', 'DMF'],
    'LB':  ['LMF', 'CB'],
    'RB':  ['RMF', 'CB'],
    'GK':  []
};

const defaultPartialAffinityMap = {
    'AMF': ['CF', 'LWF', 'RWF', 'DMF'],
    'CMF': ['CF', 'CB'],
    'CF':  ['AMF', 'LMF', 'RMF'],
    'SS':  ['CMF'],
    'LWF': ['AMF', 'CMF'],
    'RWF': ['AMF', 'CMF'],
    'LMF': ['CF', 'DMF'],
    'RMF': ['CF', 'DMF'],
    'DMF': ['AMF'],
    'CB':  ['GK'],
    'LB':  ['CMF'],
    'RB':  ['CMF'],
    'GK':  []
};

const penalties = {
    'AMF': { 'AMF': 0, 'LMF': 0, 'RMF': 0, 'LWF': 0, 'RWF': 0, 'SS': 1, 'CMF': 2, 'CF': 4, 'LB': 4, 'RB': 4, 'DMF': 7, 'CB': 13, 'GK': 55 },
    'CMF': { 'CMF': 0, 'AMF': 0, 'LMF': 1, 'RMF': 1, 'DMF': 2, 'SS': 3, 'CF': 6, 'LB': 6, 'RB': 6, 'CB': 12, 'GK': 55 },
    'CF':  { 'CF': 0, 'SS': 0, 'LWF': 1, 'RWF': 1, 'AMF': 4, 'LMF': 5, 'RMF': 5, 'CMF': 8, 'DMF': 15, 'LB': 15, 'RB': 15, 'CB': 20, 'GK': 55 },
    'SS':  { 'SS': 0, 'CF': 0, 'AMF': 0, 'LWF': 1, 'RWF': 1, 'CMF': 3, 'LMF': 3, 'RMF': 3, 'DMF': 10, 'CB': 20, 'GK': 55 },
    'LWF': { 'LWF': 0, 'RWF': 0, 'SS': 0, 'CF': 1, 'LMF': 1, 'AMF': 2, 'CMF': 6, 'GK': 55 },
    'RWF': { 'RWF': 0, 'LWF': 0, 'SS': 0, 'CF': 1, 'RMF': 1, 'AMF': 2, 'CMF': 6, 'GK': 55 },
    'DMF': { 'DMF': 0, 'CMF': 1, 'CB': 3, 'AMF': 6, 'LB': 6, 'RB': 6, 'CF': 20, 'GK': 55 },
    'LMF': { 'LMF': 0, 'RMF': 0, 'AMF': 0, 'LWF': 1, 'CMF': 2, 'LB': 4, 'GK': 55 },
    'RMF': { 'RMF': 0, 'LMF': 0, 'AMF': 0, 'RWF': 1, 'CMF': 2, 'RB': 4, 'GK': 55 },
    'CB':  { 'CB': 0, 'LB': 4, 'RB': 4, 'DMF': 4, 'CMF': 12, 'GK': 50 },
    'LB':  { 'LB': 0, 'RB': 0, 'CB': 4, 'LMF': 3, 'CMF': 8, 'GK': 55 },
    'RB':  { 'RB': 0, 'LB': 0, 'CB': 4, 'RMF': 3, 'CMF': 8, 'GK': 55 },
    'GK':  { 'GK': 0, 'CB': 45, 'CF': 48 }
};

export default function PositionRatingsPitch({ 
    baseOvr, 
    primaryPosition, 
    playstyle, 
    customPrimaryPositions, 
    customSecondaryPositions 
}) {
    const cardPos = (primaryPosition || 'AMF').toUpperCase().trim();

    // Determine position affinity tier (PRIMARY, FULL, PARTIAL, NONE)
    const getAffinityTier = (targetPos) => {
        const t = (targetPos || '').toUpperCase().trim();

        // 1. Check custom admin-defined primary positions first
        if (customPrimaryPositions && Array.isArray(customPrimaryPositions) && customPrimaryPositions.length > 0) {
            if (customPrimaryPositions.map(p => p.toUpperCase().trim()).includes(t)) return 'PRIMARY';
        } else if (defaultPrimaryPositionsMap[cardPos]?.includes(t)) {
            return 'PRIMARY';
        }

        // 2. Check custom admin-defined secondary position boosters
        if (customSecondaryPositions && Array.isArray(customSecondaryPositions) && customSecondaryPositions.length > 0) {
            if (customSecondaryPositions.map(p => p.toUpperCase().trim()).includes(t)) return 'FULL';
        } else if (defaultFullAffinityMap[cardPos]?.includes(t)) {
            return 'FULL';
        }

        if (defaultPartialAffinityMap[cardPos]?.includes(t)) return 'PARTIAL';
        return 'NONE';
    };

    const getPositionRating = (targetPos) => {
        if (!cardPos || !targetPos) return baseOvr;
        const tPos = targetPos.toUpperCase().trim();
        if (tPos === cardPos) return baseOvr;

        const exactPenalty = penalties[cardPos]?.[tPos];
        if (exactPenalty !== undefined) {
            return Math.max(40, baseOvr - exactPenalty);
        }

        const affinity = getAffinityTier(tPos);
        if (affinity === 'PRIMARY') return baseOvr;
        if (affinity === 'FULL') return Math.max(40, baseOvr - 1);

        return Math.max(40, baseOvr - 25);
    };

    const renderPosBlock = (code) => {
        const affinity  = getAffinityTier(code);
        const rating    = getPositionRating(code);
        const isPrimary = affinity === 'PRIMARY';
        const isFull    = affinity === 'FULL';
        const isPartial = affinity === 'PARTIAL';
        const isNone    = affinity === 'NONE';

        let bg, textColor, border, glow;
        if (isPrimary) {
            bg = '#00e676'; textColor = '#000000'; border = '2px solid #00e676'; glow = '0 0 10px rgba(0,230,118,0.6)';
        } else if (isFull) {
            bg = '#00b0ff'; textColor = '#000000'; border = '1px solid #00b0ff'; glow = 'none';
        } else if (isPartial) {
            bg = '#004d40'; textColor = '#ffffff'; border = '1px solid rgba(0,230,118,0.3)'; glow = 'none';
        } else {
            bg = '#0d1117'; textColor = '#475569'; border = '1px solid rgba(255,255,255,0.04)'; glow = 'none';
        }

        const ratingColor = (isPrimary || isFull)
            ? textColor
            : (isPartial ? '#ffffff' : '#475569');

        return (
            <div key={code} style={{
                background: bg,
                color: textColor,
                borderRadius: '6px',
                padding: '4px 2px',
                textAlign: 'center',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: glow,
                border,
                minWidth: '44px',
                transition: 'all 0.2s ease'
            }}>
                <div style={{ fontSize: '0.55em', fontWeight: 'bold', textTransform: 'uppercase', opacity: isNone ? 0.35 : 1 }}>{code}</div>
                <div style={{ fontSize: '0.95em', fontWeight: '900', marginTop: '1px', color: ratingColor }}>{rating}</div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', width: '100%', maxWidth: '290px' }}>

            {/* COMPACT PITCH GRID */}
            <div style={{
                background: 'linear-gradient(180deg, #0a1a12 0%, #0d1117 50%, #0a0d18 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.5)'
            }}>
                {/* ROW 1: LWF | CF | RWF */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    {renderPosBlock('LWF')}
                    {renderPosBlock('CF')}
                    {renderPosBlock('RWF')}
                </div>
                {/* ROW 2: SS */}
                <div style={{ display: 'flex', gap: '4px', padding: '0 33.3%' }}>
                    {renderPosBlock('SS')}
                </div>
                {/* ROW 3: LMF | AMF | RMF */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    {renderPosBlock('LMF')}
                    {renderPosBlock('AMF')}
                    {renderPosBlock('RMF')}
                </div>
                {/* ROW 4: CMF */}
                <div style={{ display: 'flex', gap: '4px', padding: '0 33.3%' }}>
                    {renderPosBlock('CMF')}
                </div>
                {/* ROW 5: DMF */}
                <div style={{ display: 'flex', gap: '4px', padding: '0 33.3%' }}>
                    {renderPosBlock('DMF')}
                </div>
                {/* ROW 6: LB | CB | RB */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    {renderPosBlock('LB')}
                    {renderPosBlock('CB')}
                    {renderPosBlock('RB')}
                </div>
                {/* ROW 7: GK */}
                <div style={{ display: 'flex', gap: '4px', padding: '0 33.3%' }}>
                    {renderPosBlock('GK')}
                </div>
            </div>

            {/* BOTTOM PILLS: Playstyle | Position Boosters */}
            <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{
                    flex: 1,
                    padding: '6px 8px',
                    background: '#111722',
                    color: '#38bdf8',
                    border: '1px solid rgba(56,189,248,0.25)',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.72em',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                    minHeight: '36px',
                    boxSizing: 'border-box'
                }}>
                    {playstyle || 'Hole Player'}
                </div>
                <div style={{
                    flex: 1,
                    padding: '6px 8px',
                    background: '#111722',
                    color: '#38bdf8',
                    border: '1px solid rgba(56,189,248,0.25)',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '0.72em',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                    minHeight: '36px',
                    boxSizing: 'border-box'
                }}>
                    Position Boosters
                </div>
            </div>
        </div>
    );
}
