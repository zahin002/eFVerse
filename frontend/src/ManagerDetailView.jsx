import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getManagerPhotoUrl } from './badgeAssetEngine';
import { CiFlag1 } from "react-icons/ci";

axios.defaults.withCredentials = true;

export default function ManagerDetailView({ data, onBack }) {
    const [boosts, setBoosts] = useState([]);

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [data?.managerid]);

    useEffect(() => {
        if (data && data.managerid) {
            axios.get(`http://localhost:5001/api/managers/boosts/${data.managerid}`)
                .then(res => {
                    setBoosts(res.data);
                })
                .catch(err => console.error("Error fetching boosts:", err));
        }
    }, [data]);

    if (!data) return null;

    const playstyles = [
        { name: 'Possession', val: data.possession_game || 50 },
        { name: 'Quick Counter', val: data.quick_counter || 50 },
        { name: 'Long Ball Ctr', val: data.long_ball_counter || 50 },
        { name: 'Out Wide', val: data.out_wide || 50 },
        { name: 'Long Ball', val: data.long_ball || 50 }
    ];

    const getScoreColor = (val) => {
        if (val >= 85) return '#00f2fe';
        if (val >= 70) return '#4ade80';
        return '#f59e0b';
    };

    const getScoreGradient = (val) => {
        if (val >= 85) return 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)';
        if (val >= 70) return 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)';
        return 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
    };

    return (
        <div style={{
            padding: '24px 0 60px 0',
            background: 'transparent',
            minHeight: '100vh',
            color: 'white',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div style={{ maxWidth: '840px', margin: '0 auto', padding: '0 16px' }}>
                {/* Back Button */}
                <button
                    onClick={onBack}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#e2e8f0',
                        cursor: 'pointer',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        fontWeight: '700',
                        fontSize: '0.88em',
                        letterSpacing: '0.5px',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(0, 242, 254, 0.12)';
                        e.currentTarget.style.borderColor = '#00f2fe';
                        e.currentTarget.style.color = '#00f2fe';
                        e.currentTarget.style.transform = 'translateX(-3px)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.color = '#e2e8f0';
                        e.currentTarget.style.transform = 'translateX(0)';
                    }}
                >
                    <span style={{ fontSize: '1.1em' }}>←</span> Return to Hub
                </button>

                {/* Profile Card Container */}
                <div style={{
                    background: 'rgba(15, 21, 37, 0.75)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    padding: '36px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 242, 254, 0.05)'
                }}>
                    {/* Header: Manager Portrait & Title */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        paddingBottom: '28px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        marginBottom: '32px'
                    }}>
                        {/* Portrait Frame */}
                        <div style={{
                            position: 'relative',
                            width: '88px',
                            height: '88px',
                            flexShrink: 0,
                            borderRadius: '20px',
                            padding: '3px',
                            background: 'linear-gradient(135deg, #00f2fe 0%, #a855f7 100%)',
                            boxShadow: '0 8px 24px rgba(0, 242, 254, 0.25)'
                        }}>
                            <img
                                src={getManagerPhotoUrl(data.managername)}
                                alt={data.managername}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '17px',
                                    objectFit: 'cover',
                                    display: 'block',
                                    background: '#0a0f1d'
                                }}
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://secure.gravatar.com/avatar/unknown?d=mp'; }}
                            />
                        </div>

                        {/* Title & Badges */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(0, 242, 254, 0.1)',
                                border: '1px solid rgba(0, 242, 254, 0.25)',
                                color: '#00f2fe',
                                fontSize: '0.72em',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                padding: '3px 10px',
                                borderRadius: '999px',
                                marginBottom: '8px'
                            }}>
                                 Tactical Profile
                            </div>

                            <h1 style={{
                                margin: '0 0 6px 0',
                                fontSize: 'clamp(1.8em, 3.5vw, 2.5em)',
                                fontWeight: '900',
                                background: 'linear-gradient(135deg, #ffffff 0%, #d8e8f8 60%, #00f2fe 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.5px'
                            }}>
                                {data.managername}
                            </h1>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{
                                    fontSize: '0.82em',
                                    fontWeight: '700',
                                    color: '#94a3b8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                     {data.countryname || 'International'}
                                </span>
                                <span style={{ color: '#475569' }}>•</span>
                                <span style={{
                                    fontSize: '0.82em',
                                    fontWeight: '700',
                                    color: '#38bdf8',
                                    background: 'rgba(56, 189, 248, 0.1)',
                                    padding: '2px 8px',
                                    borderRadius: '6px'
                                }}>
                                    {data.playstyle}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Manager Spec Cards Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '16px',
                        marginBottom: '32px'
                    }}>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '14px',
                            padding: '16px 18px',
                            transition: 'all 0.2s ease'
                        }}>
                            <div style={{ color: '#64748b', fontSize: '0.74em', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                                 Tactical Playstyle
                            </div>
                            <div style={{ fontSize: '1.15em', fontWeight: '800', color: '#00f2fe' }}>
                                {data.playstyle}
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '14px',
                            padding: '16px 18px',
                            transition: 'all 0.2s ease'
                        }}>
                            <div style={{ color: '#64748b', fontSize: '.78em', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                                 Primary Nationality
                            </div>
                            <div style={{ fontSize: '1.15em', fontWeight: '800', color: '#fff' }}>
                                {data.countryname || 'International'}
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '14px',
                            padding: '16px 18px',
                            transition: 'all 0.2s ease'
                        }}>
                            <div style={{ color: '#64748b', fontSize: '0.74em', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                                 Current Club
                            </div>
                            <div style={{ fontSize: '1.15em', fontWeight: '800', color: '#fff' }}>
                                {data.clubname || 'Unattached'}
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '14px',
                            padding: '16px 18px',
                            transition: 'all 0.2s ease'
                        }}>
                            <div style={{ color: '#64748b', fontSize: '0.74em', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
                                 League Association
                            </div>
                            <div style={{ fontSize: '1.15em', fontWeight: '800', color: '#fff' }}>
                                {data.leaguename || 'None'}
                            </div>
                        </div>
                    </div>

                    {/* Tactical Playstyle Proficiencies */}
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '14px'
                        }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>
                                 Tactical Playstyle Proficiencies
                            </div>
                            <div style={{ fontSize: '0.75em', color: '#64748b' }}>
                                High proficiency boosts team overall chemistry
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                            gap: '12px'
                        }}>
                            {playstyles.map((ps, idx) => {
                                const isPeak = ps.val >= 85;
                                const col = getScoreColor(ps.val);
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            background: isPeak ? 'rgba(0, 242, 254, 0.06)' : 'rgba(255, 255, 255, 0.025)',
                                            border: isPeak ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                                            borderRadius: '14px',
                                            padding: '14px 12px',
                                            textAlign: 'center',
                                            boxShadow: isPeak ? '0 0 16px rgba(0, 242, 254, 0.15)' : 'none',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.72em', color: isPeak ? '#38bdf8' : '#94a3b8', fontWeight: '700', marginBottom: '6px' }}>
                                            {ps.name}
                                        </div>
                                        <div style={{
                                            fontSize: '1.6em',
                                            fontWeight: '900',
                                            color: col,
                                            lineHeight: 1.1,
                                            marginBottom: '8px',
                                            textShadow: isPeak ? `0 0 12px ${col}60` : 'none'
                                        }}>
                                            {ps.val}
                                        </div>
                                        {/* Meter Bar */}
                                        <div style={{
                                            width: '100%',
                                            height: '4px',
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            borderRadius: '2px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${Math.min(100, Math.max(0, ps.val))}%`,
                                                height: '100%',
                                                background: getScoreGradient(ps.val),
                                                borderRadius: '2px'
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Link-Up Philosophy Display */}
                    {data.linkup_type && (
                        <div style={{
                            marginBottom: '32px',
                            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(20, 26, 44, 0.9) 100%)',
                            border: '1.5px solid rgba(251, 191, 36, 0.35)',
                            borderRadius: '16px',
                            padding: '22px 24px',
                            boxShadow: '0 8px 24px rgba(251, 191, 36, 0.08)'
                        }}>
                            <div style={{
                                color: '#fbbf24',
                                fontSize: '0.85em',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                 Link-Up Philosophy: <span style={{ color: '#fff' }}>{data.linkup_type}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.7em', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Center Piece</div>
                                    <div style={{ fontSize: '1.05em', fontWeight: '800', color: '#38bdf8', marginTop: '4px' }}>{data.linkup_centerpiece || 'N/A'}</div>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.7em', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Key Man</div>
                                    <div style={{ fontSize: '1.05em', fontWeight: '800', color: '#a78bfa', marginTop: '4px' }}>{data.linkup_keyman || 'N/A'}</div>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.7em', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Active Positions</div>
                                    <div style={{ fontSize: '1.05em', fontWeight: '800', color: '#34d399', marginTop: '4px' }}>{data.linkup_positions || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Stat Boosters (Vibrant Glow Design) */}
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '14px'
                        }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>
                                 Active Stat Boosters
                            </div>
                            <div style={{ fontSize: '0.75em', color: '#64748b' }}>
                                Applied to starting squad members
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '16px'
                        }}>
                            {boosts.length > 0 ? (
                                boosts.map((boost, index) => {
                                    const colors = index === 0
                                        ? { accent: '#ff4d79', border: 'rgba(255, 77, 121, 0.28)', tag: 'rgba(255, 77, 121, 0.12)' }
                                        : { accent: '#00f2fe', border: 'rgba(0, 242, 254, 0.28)', tag: 'rgba(0, 242, 254, 0.12)' };

                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                position: 'relative',
                                                background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.85) 0%, rgba(12, 16, 26, 0.9) 100%)',
                                                borderRadius: '16px',
                                                border: `1px solid ${colors.border}`,
                                                padding: '18px 22px',
                                                overflow: 'hidden',
                                                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                transition: 'all 0.25s ease'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.borderColor = colors.accent;
                                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.45)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.borderColor = colors.border;
                                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.35)';
                                            }}
                                        >
                                            {/* Left Column: Booster Tag & Stat Name */}
                                            <div>
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    color: colors.accent,
                                                    background: colors.tag,
                                                    border: `1px solid ${colors.border}`,
                                                    fontSize: '0.72em',
                                                    fontWeight: '800',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.8px',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    marginBottom: '8px'
                                                }}>
                                                     Booster {index + 1}
                                                </div>
                                                <div style={{
                                                    fontSize: '1.25em',
                                                    fontWeight: '800',
                                                    color: '#ffffff',
                                                    letterSpacing: '-0.2px'
                                                }}>
                                                    {boost.statname}
                                                </div>
                                            </div>

                                            {/* Right Column: Clean Boost Value Badge */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                minWidth: '56px',
                                                height: '52px',
                                                padding: '4px 14px',
                                                borderRadius: '12px',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                border: `1px solid ${colors.border}`,
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
                                            }}>
                                                <span style={{
                                                    fontSize: '1.85em',
                                                    fontWeight: '900',
                                                    color: colors.accent,
                                                    lineHeight: 1
                                                }}>
                                                    +{boost.boostvalue}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{
                                    gridColumn: '1 / -1',
                                    color: '#64748b',
                                    fontStyle: 'italic',
                                    textAlign: 'center',
                                    padding: '28px',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '12px',
                                    border: '1px dashed rgba(255, 255, 255, 0.08)'
                                }}>
                                    No tactical stat boosters currently assigned to this manager.
                                </div>
                            )}
                        </div>

                        {boosts.length > 0 && (
                            <p style={{
                                textAlign: 'center',
                                color: '#64748b',
                                fontSize: '0.8em',
                                marginTop: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}>
                                <span></span> The above player stats will automatically receive boosts when this manager leads your starting lineup.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}