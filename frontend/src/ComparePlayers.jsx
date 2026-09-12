import React, { useState, useEffect } from 'react';
import axios from 'axios';
axios.defaults.withCredentials = true;

export default function ComparePlayers({ cardId1, cardId2, onBack }) {
    const [comparison, setComparison] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const getWinnerStyle = (val1, val2) => {
        if (val1 > val2) return { color: '#4dff4d', fontWeight: 'bold' };
        if (val2 > val1) return { color: '#ff4d4d', fontWeight: 'bold' };
        return { color: '#ffff00' };
    };

    const statGroups = [
        { name: 'ATTACKING', stats: ['offensiveawareness', 'finishing', 'ballcontrol', 'dribbling', 'passing'] },
        { name: 'POWER', stats: ['kickingpower', 'speed', 'acceleration', 'stamina', 'balance'] },
        { name: 'DEFENDING', stats: ['physicalcontact', 'jump', 'defensiveawareness', 'tackling', 'aggression'] },
        { name: 'GOALKEEPER', stats: ['gkawareness', 'gkcatching', 'gkparrying', 'gkreflexes', 'gkreach'] }
    ];

    const formatStatName = (stat) => {
        return stat.replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace('gk', 'GK ');
    };

    if (loading) return <div style={styles.loading}>Loading comparison...</div>;
    if (!comparison) return <div style={styles.error}>Failed to load comparison</div>;

    const { player1, player2 } = comparison;

    return (
        <div style={styles.container}>
            <button onClick={onBack} style={styles.backBtn}>← Back</button>
            
            <h1 style={styles.title}>Player Comparison</h1>
            
            {/* Player Headers */}
            <div style={styles.headerRow}>
                <div style={styles.playerHeader}>
                    <h2>{player1.name}</h2>
                    <div style={styles.playerMeta}>
                        <span>{player1.age} yrs • {player1.nation} • {player1.club}</span>
                        <div style={styles.cardBadge}>{player1.cardType}</div>
                        <div style={styles.rating}>OVR {player1.rating}</div>
                    </div>
                </div>
                
                <div style={styles.vsCircle}>VS</div>
                
                <div style={styles.playerHeader}>
                    <h2>{player2.name}</h2>
                    <div style={styles.playerMeta}>
                        <span>{player2.age} yrs • {player2.nation} • {player2.club}</span>
                        <div style={styles.cardBadge}>{player2.cardType}</div>
                        <div style={styles.rating}>OVR {player2.rating}</div>
                    </div>
                </div>
            </div>
            
            {/* Stat Comparison */}
            <div style={styles.statsContainer}>
                {statGroups.map(group => (
                    <div key={group.name} style={styles.statGroup}>
                        <h3 style={styles.groupTitle}>{group.name}</h3>
                        
                        {group.stats.map(stat => (
                            <div key={stat} style={styles.statRow}>
                                <div style={styles.statLabel}>{formatStatName(stat)}</div>
                                
                                {/* */}
                                <div style={{...styles.statValueLeft, ...getWinnerStyle(player1.stats[stat], player2.stats[stat])}}>
                                    {player1.stats[stat]}
                                </div>
                                
                                <div style={styles.statBar}>
                                    <div style={{
                                        width: `${(player1.stats[stat] / 99) * 100}%`,
                                        height: '8px',
                                        background: player1.stats[stat] > player2.stats[stat] ? '#4dff4d' : '#888',
                                        borderRadius: '4px'
                                    }} />
                                </div>
                                
                                <div style={styles.statBar}>
                                    <div style={{
                                        width: `${(player2.stats[stat] / 99) * 100}%`,
                                        height: '8px',
                                        background: player2.stats[stat] > player1.stats[stat] ? '#ff4d4d' : '#888',
                                        borderRadius: '4px'
                                    }} />
                                </div>
                                
                                {/**/}
                                <div style={{...styles.statValueRight, ...getWinnerStyle(player2.stats[stat], player1.stats[stat])}}>
                                    {player2.stats[stat]}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            
            {/**/}
            <div style={styles.summary}>
                <h3>Summary</h3>
                <p>
                    {player1.name} wins in {Object.keys(player1.stats).filter(stat => 
                        player1.stats[stat] > player2.stats[stat]
                    ).length} categories
                </p>
                <p>
                    {player2.name} wins in {Object.keys(player2.stats).filter(stat => 
                        player2.stats[stat] > player1.stats[stat]
                    ).length} categories
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: '30px',
        background: '#111',
        color: 'white',
        minHeight: '100vh',
        fontFamily: 'Arial'
    },
    loading: {
        padding: '30px',
        textAlign: 'center',
        color: '#888'
    },
    error: {
        padding: '30px',
        textAlign: 'center',
        color: '#ff4d4d'
    },
    backBtn: {
        padding: '10px 20px',
        background: '#333',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginBottom: '20px'
    },
    title: {
        textAlign: 'center',
        marginBottom: '40px',
        color: '#e0a800'
    },
    headerRow: {
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: '30px',
        alignItems: 'center',
        marginBottom: '50px'
    },
    playerHeader: {
        textAlign: 'center',
        padding: '20px',
        background: '#1a1a1a',
        borderRadius: '10px',
        border: '1px solid #333'
    },
    playerMeta: {
        color: '#aaa',
        fontSize: '0.9em',
        marginTop: '10px'
    },
    cardBadge: {
        display: 'inline-block',
        padding: '4px 12px',
        background: '#007bff',
        borderRadius: '20px',
        fontSize: '0.8em',
        marginTop: '10px'
    },
    rating: {
        fontSize: '2em',
        fontWeight: 'bold',
        color: '#e0a800',
        marginTop: '10px'
    },
    vsCircle: {
        width: '60px',
        height: '60px',
        background: '#ff4d4d',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '1.2em'
    },
    statsContainer: {
        maxWidth: '800px',
        margin: '0 auto'
    },
    statGroup: {
        marginBottom: '30px',
        padding: '20px',
        background: '#1a1a1a',
        borderRadius: '10px'
    },
    groupTitle: {
        color: '#888',
        fontSize: '0.9em',
        marginBottom: '15px',
        borderBottom: '1px solid #333',
        paddingBottom: '5px'
    },
    statRow: {
        display: 'grid',
        gridTemplateColumns: '80px 40px 1fr 1fr 40px',
        gap: '10px',
        alignItems: 'center',
        marginBottom: '10px'
    },
    statLabel: {
        fontSize: '0.8em',
        color: '#aaa'
    },
    statValueLeft: {
        textAlign: 'right',
        fontWeight: 'bold'
    },
    statValueRight: {
        textAlign: 'left',
        fontWeight: 'bold'
    },
    statBar: {
        height: '8px',
        background: '#333',
        borderRadius: '4px'
    },
    summary: {
        textAlign: 'center',
        marginTop: '40px',
        padding: '20px',
        background: '#1a1a1a',
        borderRadius: '10px'
    }
};