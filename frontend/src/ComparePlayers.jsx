import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCalendar, FiGlobe, FiShield, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
axios.defaults.withCredentials = true;

export default function ComparePlayers({ cardId1, cardId2, onBack }) {
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showGkStats, setShowGkStats] = useState(false);

    useEffect(() => {
        fetchComparison();
    }, [cardId1, cardId2]);

    const fetchComparison = async () => {
        try {
            const res = await axios.get(`http://localhost:5001/api/players/compare/${cardId1}/${cardId2}`);
            setComparison(res.data);
        } catch (error) {
            console.error("Comparison failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const STAT_CONFIG = {
        offensiveawareness: { label: 'Offensive Awareness' },
        finishing: { label: 'Finishing' },
        ballcontrol: { label: 'Ball Control' },
        dribbling: { label: 'Dribbling' },
        passing: { label: 'Passing' },
        kickingpower: { label: 'Kicking Power' },
        speed: { label: 'Sprint Speed' },
        acceleration: { label: 'Acceleration' },
        stamina: { label: 'Stamina' },
        balance: { label: 'Balance' },
        physicalcontact: { label: 'Physical Contact' },
        jump: { label: 'Jumping' },
        defensiveawareness: { label: 'Defensive Awareness' },
        tackling: { label: 'Tackling' },
        aggression: { label: 'Aggression' },
        gkawareness: { label: 'GK Awareness' },
        gkcatching: { label: 'GK Catching' },
        gkparrying: { label: 'GK Parrying' },
        gkreflexes: { label: 'GK Reflexes' },
        gkreach: { label: 'GK Reach' }
    };

    const statGroups = [
        {
            name: 'ATTACKING & PLAYMAKING',
            color: '#00f2fe',
            stats: ['offensiveawareness', 'finishing', 'ballcontrol', 'dribbling', 'passing']
        },
        {
            name: 'SPEED, POWER & AGILITY',
            color: '#FFD700',
            stats: ['speed', 'acceleration', 'kickingpower', 'stamina', 'balance']
        },
        {
            name: 'DEFENDING & PHYSICALITY',
            color: '#00FF87',
            stats: ['defensiveawareness', 'tackling', 'aggression', 'physicalcontact', 'jump']
        },
        {
            name: 'GOALKEEPING ATTRIBUTES',
            color: '#a78bfa',
            isGk: true,
            stats: ['gkawareness', 'gkcatching', 'gkparrying', 'gkreflexes', 'gkreach']
        }
    ];

    const getTierTheme = (type) => {
        switch (type) {
            case 'Legendary':
            case 'Legend':
            case 'Epic':
                return {
                    accent: '#FFD700',
                    bg: 'linear-gradient(145deg, rgba(255,215,0,0.12) 0%, rgba(20,16,5,0.7) 100%)',
                    border: '1px solid rgba(255,215,0,0.35)',
                    badgeBg: 'rgba(255,200,0,0.18)',
                    badgeBorder: '1px solid rgba(255,200,0,0.4)',
                    glow: '0 8px 32px rgba(255,215,0,0.18)'
                };
            case 'POTW':
            case 'Trending':
                return {
                    accent: '#00FF87',
                    bg: 'linear-gradient(145deg, rgba(0,255,135,0.12) 0%, rgba(5,20,12,0.7) 100%)',
                    border: '1px solid rgba(0,255,135,0.35)',
                    badgeBg: 'rgba(0,255,135,0.18)',
                    badgeBorder: '1px solid rgba(0,255,135,0.4)',
                    glow: '0 8px 32px rgba(0,255,135,0.18)'
                };
            default:
                return {
                    accent: '#00f2fe',
                    bg: 'linear-gradient(145deg, rgba(0,242,254,0.12) 0%, rgba(8,16,28,0.7) 100%)',
                    border: '1px solid rgba(0,242,254,0.35)',
                    badgeBg: 'rgba(0,242,254,0.15)',
                    badgeBorder: '1px solid rgba(0,242,254,0.35)',
                    glow: '0 8px 32px rgba(0,242,254,0.18)'
                };
        }
    };

    const getStatColor = (val) => {
        const num = parseInt(val) || 0;
        if (num >= 90) return '#00f2fe';
        if (num >= 80) return '#00FF87';
        if (num >= 70) return '#FFD700';
        return '#94a3b8';
    };

    if (loading) {
        return (
            <div style={{ padding: '80px 20px', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <FiRefreshCw size={36} color="#00f2fe" style={{ marginBottom: '20px', animation: 'spin 1.5s linear infinite' }} />
                <h2 style={{ color: '#00f2fe', fontWeight: '800', marginBottom: '8px' }}>Loading Comparison...</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.95em' }}>Comparing player statistics and ratings...</p>
            </div>
        );
    }

    if (!comparison || !comparison.player1 || !comparison.player2) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '600px', margin: '60px auto', background: 'rgba(15,23,42,0.6)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <FiAlertCircle size={40} color="#ff4d4d" style={{ marginBottom: '16px' }} />
                <h3 style={{ color: '#ff4d4d', margin: '0 0 10px 0' }}>Comparison Unavailable</h3>
                <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Could not load data for one or both players. They may not have configured statistics.</p>
                <button onClick={onBack} className="see-all-btn">← Back to Card</button>
            </div>
        );
    }

    const { player1, player2 } = comparison;
    const theme1 = getTierTheme(player1.cardType);
    const theme2 = getTierTheme(player2.cardType);

    // Calculate total wins
    const statsKeys = Object.keys(player1.stats || {});
    const p1Wins = statsKeys.filter(k => (player1.stats[k] || 0) > (player2.stats[k] || 0)).length;
    const p2Wins = statsKeys.filter(k => (player2.stats[k] || 0) > (player1.stats[k] || 0)).length;
    const ties = statsKeys.filter(k => (player1.stats[k] || 0) === (player2.stats[k] || 0)).length;

    // Detect if both players are outfield players (GK stats all default 40)
    const bothAreOutfield = (player1.stats.gkawareness <= 40 && player2.stats.gkawareness <= 40);

    // Dominance ratio
    const totalContested = p1Wins + p2Wins;
    const p1Percent = totalContested > 0 ? Math.round((p1Wins / totalContested) * 100) : 50;
    const p2Percent = 100 - p1Percent;

    return (
        <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '24px 20px 80px',
            fontFamily: "'Outfit', 'Space Grotesk', system-ui, sans-serif",
            color: '#e2e8f0',
            position: 'relative'
        }}>
            {/* Top Navigation Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <button
                    onClick={onBack}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#e2e8f0',
                        borderRadius: '999px',
                        padding: '10px 22px',
                        fontSize: '0.9em',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,242,254,0.12)'; e.currentTarget.style.borderColor = '#00f2fe'; e.currentTarget.style.color = '#00f2fe'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#e2e8f0'; }}
                >
                    ← Back to Card Details
                </button>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.82em',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: '700'
                }}>
                    <span>eFVerse</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
                    <span style={{ color: '#00f2fe' }}>Player Comparison</span>
                </div>
            </div>

            {/* Title Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(0,242,254,0.08)',
                    border: '1px solid rgba(0,242,254,0.25)',
                    borderRadius: '999px',
                    padding: '6px 18px',
                    fontSize: '0.8em',
                    fontWeight: '800',
                    color: '#00f2fe',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '14px'
                }}>
                    PLAYER COMPARISON
                </div>
                <h1 style={{
                    fontSize: 'clamp(2em, 4vw, 3.2em)',
                    fontWeight: '900',
                    margin: '0 0 10px 0',
                    background: 'linear-gradient(135deg, #ffffff 0%, #d8e8f8 50%, #00f2fe 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px'
                }}>
                    Compare Players
                </h1>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '1em' }}>
                    Side-by-side attribute comparison
                </p>
            </div>

            {/* ===================== HERO VERSUS SECTION ===================== */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 1fr) auto minmax(280px, 1fr)',
                gap: '24px',
                alignItems: 'center',
                marginBottom: '40px'
            }}>
                {/* PLAYER 1 CARD */}
                <div style={{
                    background: theme1.bg,
                    border: theme1.border,
                    borderRadius: '24px',
                    padding: '28px 24px',
                    boxShadow: theme1.glow,
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(16px)',
                    transition: 'transform 0.3s ease'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: `linear-gradient(90deg, ${theme1.accent}, transparent)`
                    }} />

                    {/* Top Row Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{
                            fontSize: '0.72em',
                            fontWeight: '800',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: theme1.badgeBg,
                            color: theme1.accent,
                            border: theme1.badgeBorder
                        }}>
                            {player1.cardType || 'Standard'}
                        </span>
                        <span style={{
                            fontSize: '0.85em',
                            fontWeight: '900',
                            color: theme1.accent,
                            background: 'rgba(0,0,0,0.4)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                            {player1.position || 'N/A'}
                        </span>
                    </div>

                    {/* OVR & Name */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '8px' }}>
                        <div style={{
                            fontSize: '3.6em',
                            fontWeight: '900',
                            lineHeight: 1,
                            color: theme1.accent,
                            textShadow: `0 0 24px ${theme1.accent}50`,
                            letterSpacing: '-2px'
                        }}>
                            {player1.rating || '—'}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.72em', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px' }}>BASE OVR</div>
                            <div style={{
                                fontSize: '1.45em',
                                fontWeight: '900',
                                color: '#fff',
                                lineHeight: 1.2,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {player1.name}
                            </div>
                        </div>
                    </div>

                    {/* Meta Chips */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        fontSize: '0.82em',
                        color: '#94a3b8'
                    }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <FiCalendar size={12} /> {player1.age} yrs
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <FiGlobe size={12} /> {player1.nation || 'Unknown'}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <FiShield size={12} /> {player1.club || 'Free Agent'}
                        </span>
                    </div>

                    {/* Win Pill */}
                    <div style={{
                        marginTop: '16px',
                        background: p1Wins >= p2Wins ? 'rgba(0,255,135,0.12)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${p1Wins >= p2Wins ? 'rgba(0,255,135,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '10px',
                        padding: '8px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.82em',
                        fontWeight: '800'
                    }}>
                        <span style={{ color: p1Wins >= p2Wins ? '#00FF87' : '#94a3b8' }}>
                            {p1Wins > p2Wins ? 'Leading' : p1Wins === p2Wins ? 'Tied' : 'Trailing'}
                        </span>
                        <span style={{
                            color: '#fff',
                            background: p1Wins >= p2Wins ? 'rgba(0,255,135,0.2)' : 'rgba(255,255,255,0.1)',
                            padding: '2px 8px',
                            borderRadius: '6px'
                        }}>
                            {p1Wins} Stats Won
                        </span>
                    </div>
                </div>

                {/* CENTER VS BADGE & SCOREBOARD */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ff0844 0%, #ff4e50 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '900',
                        fontSize: '1.3em',
                        color: '#fff',
                        boxShadow: '0 0 30px rgba(255,8,68,0.5)',
                        border: '3px solid rgba(255,255,255,0.2)',
                        letterSpacing: '1px'
                    }}>
                        VS
                    </div>

                    <div style={{
                        background: 'rgba(15,23,42,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '14px',
                        padding: '10px 18px',
                        textAlign: 'center',
                        backdropFilter: 'blur(12px)'
                    }}>
                        <div style={{ fontSize: '0.7em', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                            STATS WON
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4em', fontWeight: '900' }}>
                            <span style={{ color: theme1.accent }}>{p1Wins}</span>
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8em' }}>:</span>
                            <span style={{ color: theme2.accent }}>{p2Wins}</span>
                        </div>
                        {ties > 0 && (
                            <div style={{ fontSize: '0.72em', color: '#FFD700', marginTop: '2px', fontWeight: '700' }}>
                                {ties} Tied
                            </div>
                        )}
                    </div>
                </div>

                {/* PLAYER 2 CARD */}
                <div style={{
                    background: theme2.bg,
                    border: theme2.border,
                    borderRadius: '24px',
                    padding: '28px 24px',
                    boxShadow: theme2.glow,
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(16px)',
                    transition: 'transform 0.3s ease'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: `linear-gradient(90deg, transparent, ${theme2.accent})`
                    }} />

                    {/* Top Row Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{
                            fontSize: '0.85em',
                            fontWeight: '900',
                            color: theme2.accent,
                            background: 'rgba(0,0,0,0.4)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                            {player2.position || 'N/A'}
                        </span>
                        <span style={{
                            fontSize: '0.72em',
                            fontWeight: '800',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: theme2.badgeBg,
                            color: theme2.accent,
                            border: theme2.badgeBorder
                        }}>
                            {player2.cardType || 'Standard'}
                        </span>
                    </div>

                    {/* OVR & Name */}
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '14px', marginBottom: '8px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.72em', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px' }}>BASE OVR</div>
                            <div style={{
                                fontSize: '1.45em',
                                fontWeight: '900',
                                color: '#fff',
                                lineHeight: 1.2,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {player2.name}
                            </div>
                        </div>
                        <div style={{
                            fontSize: '3.6em',
                            fontWeight: '900',
                            lineHeight: 1,
                            color: theme2.accent,
                            textShadow: `0 0 24px ${theme2.accent}50`,
                            letterSpacing: '-2px'
                        }}>
                            {player2.rating || '—'}
                        </div>
                    </div>

                    {/* Meta Chips */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end',
                        gap: '8px',
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        fontSize: '0.82em',
                        color: '#94a3b8'
                    }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <FiCalendar size={12} /> {player2.age} yrs
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <FiGlobe size={12} /> {player2.nation || 'Unknown'}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <FiShield size={12} /> {player2.club || 'Free Agent'}
                        </span>
                    </div>

                    {/* Win Pill */}
                    <div style={{
                        marginTop: '16px',
                        background: p2Wins >= p1Wins ? 'rgba(0,255,135,0.12)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${p2Wins >= p1Wins ? 'rgba(0,255,135,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '10px',
                        padding: '8px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.82em',
                        fontWeight: '800'
                    }}>
                        <span style={{
                            color: '#fff',
                            background: p2Wins >= p1Wins ? 'rgba(0,255,135,0.2)' : 'rgba(255,255,255,0.1)',
                            padding: '2px 8px',
                            borderRadius: '6px'
                        }}>
                            {p2Wins} Stats Won
                        </span>
                        <span style={{ color: p2Wins >= p1Wins ? '#00FF87' : '#94a3b8' }}>
                            {p2Wins > p1Wins ? 'Leading' : p2Wins === p1Wins ? 'Tied' : 'Trailing'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Matchup Dominance Ratio Bar */}
            <div style={{
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '16px 24px',
                marginBottom: '40px',
                backdropFilter: 'blur(12px)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82em', fontWeight: '800', marginBottom: '8px' }}>
                    <span style={{ color: theme1.accent }}>{player1.name} ({p1Percent}%)</span>
                    <span style={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>OVERALL STAT SHARE</span>
                    <span style={{ color: theme2.accent }}>({p2Percent}%) {player2.name}</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{
                        width: `${p1Percent}%`,
                        background: `linear-gradient(90deg, ${theme1.accent}, ${theme1.accent}dd)`,
                        boxShadow: `0 0 12px ${theme1.accent}80`,
                        transition: 'width 0.6s ease'
                    }} />
                    <div style={{
                        width: `${p2Percent}%`,
                        background: `linear-gradient(90deg, ${theme2.accent}dd, ${theme2.accent})`,
                        boxShadow: `0 0 12px ${theme2.accent}80`,
                        transition: 'width 0.6s ease'
                    }} />
                </div>
            </div>

            {/* ===================== STAT COMPARISON GROUPS ===================== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {statGroups.map(group => {
                    const isGkGroup = group.isGk;

                    // Calculate mini-scores for this group
                    const groupP1Wins = group.stats.filter(k => (player1.stats[k] || 0) > (player2.stats[k] || 0)).length;
                    const groupP2Wins = group.stats.filter(k => (player2.stats[k] || 0) > (player1.stats[k] || 0)).length;

                    // If it's a GK group and both players are outfield (default 40s), allow toggling
                    if (isGkGroup && bothAreOutfield && !showGkStats) {
                        return (
                            <div
                                key={group.name}
                                style={{
                                    background: 'rgba(15,23,42,0.4)',
                                    border: '1px dashed rgba(255,255,255,0.1)',
                                    borderRadius: '16px',
                                    padding: '16px 24px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => setShowGkStats(true)}
                                onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'}
                                onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.9em', fontWeight: '800', color: '#a78bfa' }}>
                                            Goalkeeper Attributes (Hidden)
                                        </div>
                                        <div style={{ fontSize: '0.78em', color: '#64748b' }}>
                                            Both players are outfielders with default baseline ratings (40 OVR)
                                        </div>
                                    </div>
                                </div>
                                <button style={{
                                    background: 'rgba(167,139,250,0.12)',
                                    border: '1px solid rgba(167,139,250,0.3)',
                                    color: '#a78bfa',
                                    padding: '6px 14px',
                                    borderRadius: '8px',
                                    fontSize: '0.8em',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}>
                                    Show Attributes ▼
                                </button>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={group.name}
                            style={{
                                background: 'rgba(10, 15, 26, 0.75)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '20px',
                                padding: '24px 28px',
                                backdropFilter: 'blur(16px)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                            }}
                        >
                            {/* Group Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '20px',
                                paddingBottom: '14px',
                                borderBottom: '1px solid rgba(255,255,255,0.06)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: '1.05em',
                                        fontWeight: '900',
                                        letterSpacing: '1px',
                                        color: group.color
                                    }}>
                                        {group.name}
                                    </h3>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        fontSize: '0.8em',
                                        fontWeight: '800',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        padding: '4px 12px',
                                        borderRadius: '999px',
                                        color: '#94a3b8'
                                    }}>
                                        <span style={{ color: theme1.accent }}>{groupP1Wins}</span>
                                        {' '}-{' '}
                                        <span style={{ color: theme2.accent }}>{groupP2Wins}</span>
                                    </div>
                                    {isGkGroup && bothAreOutfield && (
                                        <button
                                            onClick={() => setShowGkStats(false)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#64748b',
                                                cursor: 'pointer',
                                                fontSize: '0.78em',
                                                fontWeight: '700'
                                            }}
                                        >
                                            Hide ▲
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Stat Rows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {group.stats.map(statKey => {
                                    const meta = STAT_CONFIG[statKey] || { label: statKey };
                                    const val1 = parseInt(player1.stats[statKey]) || 0;
                                    const val2 = parseInt(player2.stats[statKey]) || 0;
                                    const diff = Math.abs(val1 - val2);
                                    const p1WinsStat = val1 > val2;
                                    const p2WinsStat = val2 > val1;
                                    const isTie = val1 === val2;

                                    return (
                                        <div
                                            key={statKey}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'minmax(120px, 1fr) 56px minmax(180px, 240px) 56px minmax(120px, 1fr)',
                                                alignItems: 'center',
                                                gap: '14px',
                                                padding: '8px 12px',
                                                borderRadius: '12px',
                                                background: p1WinsStat ? 'rgba(0,242,254,0.02)' : p2WinsStat ? 'rgba(0,255,135,0.02)' : 'transparent',
                                                transition: 'background 0.2s ease'
                                            }}
                                        >
                                            {/* PLAYER 1 BAR (LEFT) */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end',
                                                gap: '8px',
                                                width: '100%'
                                            }}>
                                                {p1WinsStat && diff > 0 && (
                                                    <span style={{
                                                        fontSize: '0.72em',
                                                        fontWeight: '800',
                                                        color: '#00FF87',
                                                        background: 'rgba(0,255,135,0.12)',
                                                        border: '1px solid rgba(0,255,135,0.25)',
                                                        borderRadius: '4px',
                                                        padding: '1px 5px'
                                                    }}>
                                                        +{diff}
                                                    </span>
                                                )}
                                                <div style={{
                                                    flex: 1,
                                                    height: '10px',
                                                    background: 'rgba(255,255,255,0.06)',
                                                    borderRadius: '6px',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    justifyContent: 'flex-end'
                                                }}>
                                                    <div style={{
                                                        width: `${Math.min(100, Math.max(5, (val1 / 99) * 100))}%`,
                                                        height: '100%',
                                                        background: p1WinsStat
                                                            ? `linear-gradient(270deg, ${theme1.accent}, ${theme1.accent}aa)`
                                                            : 'rgba(255,255,255,0.18)',
                                                        boxShadow: p1WinsStat ? `0 0 10px ${theme1.accent}80` : 'none',
                                                        borderRadius: '6px',
                                                        transition: 'width 0.4s ease'
                                                    }} />
                                                </div>
                                            </div>

                                            {/* PLAYER 1 VALUE */}
                                            <div style={{
                                                fontSize: '1.2em',
                                                fontWeight: '900',
                                                textAlign: 'center',
                                                color: p1WinsStat ? theme1.accent : isTie ? '#FFD700' : '#64748b',
                                                textShadow: p1WinsStat ? `0 0 12px ${theme1.accent}60` : 'none'
                                            }}>
                                                {val1}
                                            </div>

                                            {/* CENTER STAT NAME */}
                                            <div style={{
                                                textAlign: 'center',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                borderRadius: '8px',
                                                padding: '6px 12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <span style={{
                                                    fontSize: '0.84em',
                                                    fontWeight: '700',
                                                    color: '#cbd5e1',
                                                    letterSpacing: '0.3px',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {meta.label}
                                                </span>
                                            </div>

                                            {/* PLAYER 2 VALUE */}
                                            <div style={{
                                                fontSize: '1.2em',
                                                fontWeight: '900',
                                                textAlign: 'center',
                                                color: p2WinsStat ? theme2.accent : isTie ? '#FFD700' : '#64748b',
                                                textShadow: p2WinsStat ? `0 0 12px ${theme2.accent}60` : 'none'
                                            }}>
                                                {val2}
                                            </div>

                                            {/* PLAYER 2 BAR (RIGHT) */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-start',
                                                gap: '8px',
                                                width: '100%'
                                            }}>
                                                <div style={{
                                                    flex: 1,
                                                    height: '10px',
                                                    background: 'rgba(255,255,255,0.06)',
                                                    borderRadius: '6px',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    justifyContent: 'flex-start'
                                                }}>
                                                    <div style={{
                                                        width: `${Math.min(100, Math.max(5, (val2 / 99) * 100))}%`,
                                                        height: '100%',
                                                        background: p2WinsStat
                                                            ? `linear-gradient(90deg, ${theme2.accent}, ${theme2.accent}aa)`
                                                            : 'rgba(255,255,255,0.18)',
                                                        boxShadow: p2WinsStat ? `0 0 10px ${theme2.accent}80` : 'none',
                                                        borderRadius: '6px',
                                                        transition: 'width 0.4s ease'
                                                    }} />
                                                </div>
                                                {p2WinsStat && diff > 0 && (
                                                    <span style={{
                                                        fontSize: '0.72em',
                                                        fontWeight: '800',
                                                        color: '#00FF87',
                                                        background: 'rgba(0,255,135,0.12)',
                                                        border: '1px solid rgba(0,255,135,0.25)',
                                                        borderRadius: '4px',
                                                        padding: '1px 5px'
                                                    }}>
                                                        +{diff}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ===================== SUMMARY ===================== */}
            <div style={{
                marginTop: '48px',
                background: 'rgba(10, 16, 28, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px',
                padding: '36px 32px',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(255,215,0,0.1)',
                        border: '1px solid rgba(255,215,0,0.3)',
                        borderRadius: '999px',
                        padding: '4px 16px',
                        fontSize: '0.78em',
                        fontWeight: '800',
                        color: '#FFD700',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '8px'
                    }}>
                        COMPARISON SUMMARY
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.6em', fontWeight: '900', color: '#fff' }}>
                        Key Differences & Highlights
                    </h3>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '24px',
                    marginBottom: '28px'
                }}>
                    {/* Player 1 Highlights Card */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${theme1.accent}30`,
                        borderRadius: '16px',
                        padding: '22px',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <div style={{ fontSize: '1.05em', fontWeight: '900', color: theme1.accent }}>
                                {player1.name} Highlights
                            </div>
                        </div>
                        <div style={{ fontSize: '0.88em', color: '#94a3b8', lineHeight: 1.6 }}>
                            Leads in <strong style={{ color: '#fff' }}>{p1Wins}</strong> stats.
                            {player1.stats.speed > player2.stats.speed && ' Higher sprint speed and acceleration.'}
                            {player1.stats.finishing > player2.stats.finishing && ' Better finishing inside the box.'}
                            {player1.stats.dribbling > player2.stats.dribbling && ' Sharper dribbling and ball control.'}
                            {player1.stats.passing > player2.stats.passing && ' Better passing and distribution.'}
                            {player1.stats.defensiveawareness > player2.stats.defensiveawareness && ' Higher defensive awareness and positioning.'}
                            {player1.stats.tackling > player2.stats.tackling && ' Stronger tackling and ball winning.'}
                            {player1.stats.physicalcontact > player2.stats.physicalcontact && ' Better physical contact and balance.'}
                            {player1.stats.stamina > player2.stats.stamina && ' Higher stamina over 90 minutes.'}
                        </div>
                    </div>

                    {/* Player 2 Highlights Card */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${theme2.accent}30`,
                        borderRadius: '16px',
                        padding: '22px',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <div style={{ fontSize: '1.05em', fontWeight: '900', color: theme2.accent }}>
                                {player2.name} Highlights
                            </div>
                        </div>
                        <div style={{ fontSize: '0.88em', color: '#94a3b8', lineHeight: 1.6 }}>
                            Leads in <strong style={{ color: '#fff' }}>{p2Wins}</strong> stats.
                            {player2.stats.speed > player1.stats.speed && ' Higher sprint speed and acceleration.'}
                            {player2.stats.finishing > player1.stats.finishing && ' Better finishing inside the box.'}
                            {player2.stats.dribbling > player1.stats.dribbling && ' Sharper dribbling and ball control.'}
                            {player2.stats.passing > player1.stats.passing && ' Better passing and distribution.'}
                            {player2.stats.tackling > player1.stats.tackling && ' Stronger tackling and ball winning.'}
                            {player2.stats.defensiveawareness > player1.stats.defensiveawareness && ' Higher defensive awareness and positioning.'}
                            {player2.stats.physicalcontact > player1.stats.physicalcontact && ' Better physical contact and balance.'}
                            {player2.stats.stamina > player1.stats.stamina && ' Higher stamina over 90 minutes.'}
                        </div>
                    </div>
                </div>

                {/* Final Recommendation Box */}
                <div style={{
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(0,242,254,0.06) 0%, rgba(167,139,250,0.06) 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '20px 24px'
                }}>
                    <div style={{ fontSize: '0.95em', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
                        {p1Wins > p2Wins ? (
                            <span>Overall: <span style={{ color: theme1.accent }}>{player1.name}</span> leads with {p1Wins} stats to {p2Wins}.</span>
                        ) : p2Wins > p1Wins ? (
                            <span>Overall: <span style={{ color: theme2.accent }}>{player2.name}</span> leads with {p2Wins} stats to {p1Wins}.</span>
                        ) : (
                            <span>Tied: Both players are level with {p1Wins} stats each.</span>
                        )}
                    </div>
                    <div style={{ fontSize: '0.84em', color: '#94a3b8' }}>
                        Choose the player that best fits your squad and tactical playstyle.
                    </div>
                </div>
            </div>
        </div>
    );
}