import React from 'react';
import { calculateEffectivePositionOVR, getAffinityTier as getEngineAffinityTier } from './progressionEngine';

export default function PositionRatingsPitch({ 
    baseOvr, 
    primaryPosition, 
    playstyle, 
    customPrimaryPositions, 
    customSecondaryPositions,
    boostedStats,
    trainedStats = {}
}) {
    const liveStats = boostedStats || trainedStats || {};
    const cardPos = (primaryPosition || 'AMF').toUpperCase().trim();

    const getAffinityTier = (targetPos) => {
        return getEngineAffinityTier(cardPos, targetPos, customPrimaryPositions, customSecondaryPositions);
    };

    const getPositionRating = (targetPos) => {
        if (!cardPos || !targetPos) return baseOvr;
        const tPos = targetPos.toUpperCase().trim();
        if (tPos === cardPos) return baseOvr;

        return calculateEffectivePositionOVR({
            trainedStats: liveStats,
            primaryPosition: cardPos,
            targetPosition: tPos,
            baseOvr,
            customPrimaryPositions,
            customSecondaryPositions
        });
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
