import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

const API_BASE_URL = 'http://localhost:5001/api';

export default function SquadBuilder({ currentUser, onBack }) {
    // ============================================
    // STATE
    // ============================================
    const [view, setView] = useState('list');
    const [mySquads, setMySquads] = useState([]);
    const [managers, setManagers] = useState([]);
    const [myCards, setMyCards] = useState([]);
    const [penalties, setPenalties] = useState([]);
    const [positions, setPositions] = useState([]);

    const [squadName, setSquadName] = useState('My Dream Team');
    const [selectedManager, setSelectedManager] = useState('');
    const [formation, setFormation] = useState('4-3-3');
    const [loading, setLoading] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [currentSlot, setCurrentSlot] = useState(null);
    const [editingSquadId, setEditingSquadId] = useState(null);

    // ============================================
    // FORMATION LAYOUTS - USING ARRAYS FOR DUPLICATE POSITIONS
    // ============================================
    const FORMATIONS = useMemo(() => ({
        '4-3-3': [ 
            { position: 'GK', top: 90, left: 50 },
            { position: 'LB', top: 72, left: 15 },
            { position: 'CB', top: 75, left: 38 }, 
            { position: 'CB', top: 75, left: 62 }, 
            { position: 'RB', top: 72, left: 85 },
            { position: 'DMF', top: 55, left: 50 },
            { position: 'CMF', top: 42, left: 30 },
            { position: 'AMF', top: 42, left: 70 },
            { position: 'LWF', top: 18, left: 20 },
            { position: 'CF', top: 12, left: 50 },
            { position: 'RWF', top: 18, left: 80 }
        ],
        '4-4-2': [ 
            { position: 'GK', top: 90, left: 50 },
            { position: 'LB', top: 72, left: 15 },
            { position: 'CB', top: 75, left: 38 },
            { position: 'CB', top: 75, left: 62 },
            { position: 'RB', top: 72, left: 85 },
            { position: 'LMF', top: 48, left: 15 },
            { position: 'CMF', top: 48, left: 38 },
            { position: 'CMF', top: 48, left: 62 },
            { position: 'RMF', top: 48, left: 85 },
            { position: 'CF', top: 15, left: 40 },
            { position: 'CF', top: 15, left: 60 }
        ],
        '4-2-3-1': [ 
            { position: 'GK', top: 90, left: 50 },
            { position: 'LB', top: 72, left: 15 },
            { position: 'CB', top: 75, left: 38 },
            { position: 'CB', top: 75, left: 62 },
            { position: 'RB', top: 72, left: 85 },
            { position: 'DMF', top: 60, left: 38 },
            { position: 'DMF', top: 60, left: 62 },
            { position: 'LMF', top: 35, left: 18 },
            { position: 'AMF', top: 38, left: 50 },
            { position: 'RMF', top: 35, left: 82 },
            { position: 'CF', top: 12, left: 50 }
        ],
        '3-5-2': [ 
            { position: 'GK', top: 90, left: 50 },
            { position: 'CB', top: 75, left: 25 },
            { position: 'CB', top: 78, left: 50 },
            { position: 'CB', top: 75, left: 75 },
            { position: 'LMF', top: 45, left: 12 },
            { position: 'DMF', top: 55, left: 35 },
            { position: 'DMF', top: 55, left: 65 },
            { position: 'AMF', top: 38, left: 50 },
            { position: 'RMF', top: 45, left: 88 },
            { position: 'CF', top: 15, left: 38 },
            { position: 'SS', top: 18, left: 62 }
        ],
        '5-3-2': [ 
            { position: 'GK', top: 90, left: 50 },
            { position: 'LB', top: 72, left: 15 },
            { position: 'CB', top: 75, left: 32 },
            { position: 'CB', top: 78, left: 50 },
            { position: 'CB', top: 75, left: 68 },
            { position: 'RB', top: 72, left: 85 },
            { position: 'CMF', top: 50, left: 30 },
            { position: 'DMF', top: 55, left: 50 },
            { position: 'CMF', top: 50, left: 70 },
            { position: 'CF', top: 15, left: 38 },
            { position: 'SS', top: 18, left: 62 }
        ],
        '4-1-4-1': [ 
            { position: 'GK', top: 90, left: 50 },
            { position: 'LB', top: 72, left: 15 },
            { position: 'CB', top: 75, left: 38 },
            { position: 'CB', top: 75, left: 62 },
            { position: 'RB', top: 72, left: 85 },
            { position: 'DMF', top: 62, left: 50 },
            { position: 'LMF', top: 40, left: 15 },
            { position: 'CMF', top: 40, left: 38 },
            { position: 'CMF', top: 40, left: 62 },
            { position: 'RMF', top: 40, left: 85 },
            { position: 'CF', top: 15, left: 50 }
        ],
        '3-4-3': [ 
            { position: 'GK', top: 90, left: 50 },
            { position: 'CB', top: 75, left: 25 },
            { position: 'CB', top: 78, left: 50 },
            { position: 'CB', top: 75, left: 75 },
            { position: 'LMF', top: 48, left: 15 },
            { position: 'CMF', top: 48, left: 38 },
            { position: 'CMF', top: 48, left: 62 },
            { position: 'RMF', top: 48, left: 85 },
            { position: 'LWF', top: 18, left: 20 },
            { position: 'CF', top: 12, left: 50 },
            { position: 'RWF', top: 18, left: 80 }
        ],
        '4-5-1': [ 
            { position: 'GK', top: 90, left: 50 },
            { position: 'LB', top: 72, left: 15 },
            { position: 'CB', top: 75, left: 38 },
            { position: 'CB', top: 75, left: 62 },
            { position: 'RB', top: 72, left: 85 },
            { position: 'LMF', top: 45, left: 15 },
            { position: 'CMF', top: 50, left: 35 },
            { position: 'DMF', top: 58, left: 50 },
            { position: 'CMF', top: 50, left: 65 },
            { position: 'RMF', top: 45, left: 85 },
            { position: 'CF', top: 15, left: 50 }
        ]
    }), []);

    // ============================================
    // LINEUP STATE
    // ============================================
    const getInitialLineup = useCallback((formationKey) => {
        const formationArray = FORMATIONS[formationKey] || FORMATIONS['4-3-3'];
        const initialLineup = [];
        
        formationArray.forEach((slot, index) => {
            initialLineup.push({
                id: `${slot.position}-${index}`,
                position: slot.position,
                top: slot.top,
                left: slot.left,
                card: null
            });
        });
        
        return initialLineup;
    }, [FORMATIONS]);

    const [lineup, setLineup] = useState(() => getInitialLineup('4-3-3'));

    
    
    
    const safeGet = useCallback((obj, ...keys) => {
        if (!obj) return null;
        for (const key of keys) {
            if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
                return obj[key];
            }
        }
        return null;
    }, []);

    
    
    
    const getPositionPenalty = useCallback((naturalPos, targetRole) => {
        if (!naturalPos || !targetRole) return 0;

        const from = (naturalPos || '').toString().toUpperCase().trim();
        const to = (targetRole || '').toString().toUpperCase().trim();

        
        if (from === to) {
            return 0;
        }

       
        let penaltiesToUse = penalties && Array.isArray(penalties) && penalties.length > 0 ? penalties : [
            { FromPosition: 'GK', ToPosition: 'CB', Penalty: 20 },
            { FromPosition: 'GK', ToPosition: 'LB', Penalty: 20 },
            { FromPosition: 'GK', ToPosition: 'RB', Penalty: 20 },
            { FromPosition: 'CB', ToPosition: 'LB', Penalty: 10 },
            { FromPosition: 'CB', ToPosition: 'RB', Penalty: 10 },
            { FromPosition: 'CB', ToPosition: 'DMF', Penalty: 15 },
            { FromPosition: 'LB', ToPosition: 'CB', Penalty: 10 },
            { FromPosition: 'LB', ToPosition: 'RB', Penalty: 15 },
            { FromPosition: 'LB', ToPosition: 'LWF', Penalty: 5 },
            { FromPosition: 'RB', ToPosition: 'CB', Penalty: 10 },
            { FromPosition: 'RB', ToPosition: 'LB', Penalty: 15 },
            { FromPosition: 'RB', ToPosition: 'RWF', Penalty: 5 },
            { FromPosition: 'DMF', ToPosition: 'CMF', Penalty: 5 },
            { FromPosition: 'DMF', ToPosition: 'AMF', Penalty: 10 },
            { FromPosition: 'CMF', ToPosition: 'DMF', Penalty: 5 },
            { FromPosition: 'CMF', ToPosition: 'AMF', Penalty: 5 },
            { FromPosition: 'AMF', ToPosition: 'CMF', Penalty: 10 },
            { FromPosition: 'AMF', ToPosition: 'LWF', Penalty: 5 },
            { FromPosition: 'AMF', ToPosition: 'RWF', Penalty: 5 },
            { FromPosition: 'LWF', ToPosition: 'AMF', Penalty: 5 },
            { FromPosition: 'LWF', ToPosition: 'LB', Penalty: 10 },
            { FromPosition: 'RWF', ToPosition: 'AMF', Penalty: 5 },
            { FromPosition: 'RWF', ToPosition: 'RB', Penalty: 10 },
            { FromPosition: 'CF', ToPosition: 'SS', Penalty: 5 },
            { FromPosition: 'SS', ToPosition: 'CF', Penalty: 5 },
        ];

        
        if (penaltiesToUse && Array.isArray(penaltiesToUse) && penaltiesToUse.length > 0) {
            const penalty = penaltiesToUse.find(p => {
                if (!p) return false;
                
                const dbFrom = (p.FromPosition || p.fromposition || '').toString().toUpperCase().trim();
                const dbTo = (p.ToPosition || p.toposition || '').toString().toUpperCase().trim();
                
                return dbFrom === from && dbTo === to;
            });

            if (penalty) {
                const penaltyValue = parseInt(penalty.Penalty || penalty.penalty || 0);
                return isNaN(penaltyValue) ? 0 : penaltyValue;
            }
        }

        
        return 20;
    }, [penalties]);

    
    
    
    const getEffectiveRating = useCallback((card, assignedRole) => {
        if (!card || !assignedRole) return 0;

        const baseRating = parseInt(
            safeGet(card, 'CurrentOverallRating', 'currentoverallrating', 'BaseOverallRating', 'baseoverallrating') || 0
        );

        if (baseRating === 0 || isNaN(baseRating)) return 0;

        const naturalPos = (
            safeGet(card, 'PositionCode', 'positioncode', 'PrimaryPosition', 'primaryposition') || 'GK'
        ).toString().toUpperCase().trim();

        const penalty = getPositionPenalty(naturalPos, assignedRole);
        return Math.max(0, baseRating - penalty);
    }, [getPositionPenalty, safeGet]);

    // ============================================
    // TEAM STRENGTH CALCULATION
    // ============================================
    const totalStrength = useMemo(() => {
        return lineup.reduce((acc, slot) => {
            if (!slot || !slot.card) return acc;
            const rating = getEffectiveRating(slot.card, slot.position);
            return acc + (isNaN(rating) ? 0 : rating);
        }, 0);
    }, [lineup, getEffectiveRating]);

    const playersInSquad = useMemo(() => {
        return lineup.filter(slot => slot && slot.card).length;
    }, [lineup]);

    // ============================================
    // DATA LOADING
    // ============================================
    const refreshData = useCallback(async () => {
        if (!currentUser) return;

        setLoading(true);
        const userId = currentUser.userid || currentUser.id;

        try {
            console.log("🔄 Loading all squad builder data...");

            const [squadsRes, managersRes, cardsRes, penaltiesRes, positionsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/squads/user/${userId}`),
                axios.get(`${API_BASE_URL}/managers/list`),
                axios.get(`${API_BASE_URL}/squads/cards`),
                axios.get(`${API_BASE_URL}/squads/penalties-all`),
                axios.get(`${API_BASE_URL}/squads/positions`)
            ]);

            setMySquads(squadsRes.data || []);
            
           
            const normalizedManagers = (managersRes.data || []).map(m => ({
                ManagerID: m.ManagerID || m.managerid || m.id,
                ManagerName: m.ManagerName || m.managername || m.name || 'Unknown Manager',
                PlayStyle: m.PlayStyle || m.playstyle || 'Unknown',
                LeagueID: m.LeagueID || m.leagueID,
                ClubID: m.ClubID || m.clubID,
                NationalityID: m.NationalityID || m.nationalityID
            }));
            setManagers(normalizedManagers);
            
            setMyCards(cardsRes.data || []);
            setPenalties(penaltiesRes.data || []);
            setPositions(positionsRes.data || []);

            console.log('✅ All data loaded:', {
                squads: squadsRes.data?.length || 0,
                managers: normalizedManagers.length || 0,
                cards: cardsRes.data?.length || 0,
                penalties: penaltiesRes.data?.length || 0,
                positions: positionsRes.data?.length || 0
            });
        } catch (err) {
            console.error("❌ Failed to load data:", err);
            alert("❌ Error loading data: " + err.message);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        refreshData();
    }, [currentUser, refreshData]);

    

    const startNewSquad = useCallback(() => {
        setEditingSquadId(null);
        setSquadName('My Dream Team');
        setSelectedManager('');
        setFormation('4-3-3');
        setLineup(getInitialLineup('4-3-3'));
        setView('builder');
    }, [getInitialLineup]);

    const handleEditSquad = useCallback(async (squad) => {
    try {
        setLoading(true);
        
        const squadId = safeGet(squad, 'SquadID', 'squadid');
        const squadname = safeGet(squad, 'SquadName', 'squadname');
        const managerid = safeGet(squad, 'ManagerID', 'managerid');
        const form = safeGet(squad, 'Formation', 'formation') || '4-3-3';

        setEditingSquadId(squadId);
        setSquadName(squadname || 'My Dream Team');
        setSelectedManager(managerid || '');
        setFormation(form);

        // Fetch full squad details
        const res = await axios.get(`${API_BASE_URL}/squads/${squadId}`);
        const fullSquad = res.data;

        let newLineup = getInitialLineup(form);

        if (fullSquad.players && Array.isArray(fullSquad.players)) {
            // Track how many of each position we've already filled
            const positionCountFilled = {};

            fullSquad.players.forEach(player => {
                const assignedPos = player.assignedPosition;
                
                // Initialize counter for this position if not exists
                if (!positionCountFilled[assignedPos]) {
                    positionCountFilled[assignedPos] = 0;
                }

                // Find the Nth slot of this position (skip already filled ones)
                let count = 0;
                let slotIndex = -1;
                
                for (let i = 0; i < newLineup.length; i++) {
                    if (newLineup[i].position === assignedPos) {
                        if (count === positionCountFilled[assignedPos]) {
                            slotIndex = i;
                            break;
                        }
                        count++;
                    }
                }

                // Increment counter for next player of this position
                positionCountFilled[assignedPos]++;
                
                if (slotIndex !== -1) {
                    const matchedCard = myCards.find(c => {
                        const cCardId = safeGet(c, 'CardID', 'cardid');
                        return cCardId === player.cardId;
                    });

                    const cardData = matchedCard || {
                        CardID: player.cardId,
                        PositionCode: player.naturalPosition || 'GK',
                        PlayerName: player.playerName || 'Unknown',
                        CurrentOverallRating: player.currentOverallRating || 0,
                        BaseOverallRating: player.baseOverallRating || 0,
                        MaxOverallRating: player.maxOverallRating || 0,
                        CardType: player.cardType || 'Unknown',
                        ClubName: player.clubName || 'N/A'
                    };

                    const updatedLineup = [...newLineup];
                    updatedLineup[slotIndex] = {
                        ...updatedLineup[slotIndex],
                        card: cardData
                    };
                    newLineup = updatedLineup;
                }
            });
        }

        setLineup(newLineup);
        setView('builder');
    } catch (err) {
        console.error("❌ Error loading squad:", err);
        alert("❌ Error loading squad: " + err.message);
        setEditingSquadId(null);
    } finally {
        setLoading(false);
    }
}, [getInitialLineup, myCards, safeGet]);

    const handleFormationChange = useCallback((newFormation) => {
        setFormation(newFormation);
        if (newFormation !== 'custom') {
            setLineup(getInitialLineup(newFormation));
        }
    }, [getInitialLineup]);

    const handleSaveSquad = useCallback(async () => {
        if (!currentUser) {
            alert("❌ Please log in.");
            return;
        }
        if (!selectedManager) {
            alert("❌ Please select a manager.");
            return;
        }
        if (playersInSquad === 0) {
            alert("❌ Please add at least one player to your squad.");
            return;
        }

        const playersPayload = lineup
            .filter(slot => slot && slot.card)
            .map(slot => ({
                cardId: safeGet(slot.card, 'CardID', 'cardid'),
                position: slot.position,
                isStarting: true
            }));

        try {
            setLoading(true);

            if (editingSquadId) {
                await axios.put(`${API_BASE_URL}/squads/${editingSquadId}`, {
                    squadName: squadName.trim(),
                    formation: formation === 'custom' ? '4-3-3' : formation,
                    players: playersPayload,
                    teamStrength: totalStrength
                });
                alert("✅ Squad updated successfully!");
            } else {
                await axios.post(`${API_BASE_URL}/squads/save`, {
                    userId: currentUser.userid || currentUser.id,
                    managerId: selectedManager,
                    squadName: squadName.trim(),
                    formation: formation === 'custom' ? '4-3-3' : formation,
                    players: playersPayload,
                    teamStrength: totalStrength
                });
                alert("✅ Squad saved successfully!");
            }

            await refreshData();
            setEditingSquadId(null);
            setView('list');
        } catch (err) {
            console.error("❌ Save error:", err);
            alert("❌ Error saving squad: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    }, [currentUser, selectedManager, playersInSquad, lineup, squadName, formation, totalStrength, refreshData, safeGet, editingSquadId]);

    const handleDeleteSquad = useCallback(async (squadId) => {
        if (!window.confirm("Are you sure you want to delete this squad?")) return;

        try {
            setLoading(true);
            await axios.delete(`${API_BASE_URL}/squads/${squadId}`);
            alert("✅ Squad deleted successfully!");
            await refreshData();
        } catch (err) {
            console.error("❌ Delete error:", err);
            alert("❌ Error deleting squad: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    }, [refreshData]);

    const handleAddPlayer = useCallback((cardData) => {
        if (currentSlot === null || !cardData) return;
        
        const updatedLineup = [...lineup];
        updatedLineup[currentSlot] = {
            ...updatedLineup[currentSlot],
            card: cardData
        };
        setLineup(updatedLineup);
        setModalOpen(false);
    }, [currentSlot, lineup]);

    const handleRemovePlayer = useCallback((slotIndex) => {
        const updatedLineup = [...lineup];
        updatedLineup[slotIndex] = {
            ...updatedLineup[slotIndex],
            card: null
        };
        setLineup(updatedLineup);
    }, [lineup]);

    const onDrop = useCallback((e) => {
        const slotIndexStr = e.dataTransfer.getData("slotIndex");
        if (!slotIndexStr) return;

        const slotIndex = parseInt(slotIndexStr);
        const pitch = e.currentTarget.getBoundingClientRect();
        const newTop = Math.max(5, Math.min(95, ((e.clientY - pitch.top) / pitch.height) * 100));
        const newLeft = Math.max(5, Math.min(95, ((e.clientX - pitch.left) / pitch.width) * 100));

        setFormation('custom');
        const updatedLineup = [...lineup];
        updatedLineup[slotIndex] = {
            ...updatedLineup[slotIndex],
            top: newTop,
            left: newLeft
        };
        setLineup(updatedLineup);
    }, [lineup]);

 
    const getRoleGroup = useCallback((positionCode) => {
        if (!positions || !Array.isArray(positions) || positions.length === 0) return 'Unknown';
        
        const pos = positions.find(p => 
            p && (p.PositionCode || p.positioncode || '').toString().toUpperCase() === (positionCode || '').toString().toUpperCase()
        );
        
        return pos ? (pos.RoleGroup || pos.rolegroup || positionCode) : positionCode;
    }, [positions]);

    // ============================================
    // RENDER FUNCTIONS
    // ============================================

    const renderSquadList = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {mySquads && mySquads.length > 0 ? (
                mySquads.map(sq => {
                    const squadId = safeGet(sq, 'SquadID', 'squadid');
                    const squadName = safeGet(sq, 'SquadName', 'squadname') || 'Unnamed Squad';
                    const formation = safeGet(sq, 'Formation', 'formation') || 'N/A';
                    const playerCount = safeGet(sq, 'PlayerCount', 'playercount') || 0;
                    const teamStrength = safeGet(sq, 'TeamStrength', 'teamstrength') || 0;
                    const managerName = safeGet(sq, 'ManagerName', 'managername') || 'N/A';
                    const isFavourite = safeGet(sq, 'IsFavourite', 'isfavourite');

                    return (
                        <div key={squadId} style={{
                            background: '#1e1e1e',
                            padding: '20px',
                            borderRadius: '10px',
                            border: isFavourite ? '2px solid #ffd700' : '1px solid #333'
                        }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1em', marginBottom: '8px' }}>
                                {isFavourite && '⭐ '}{squadName}
                            </div>
                            <div style={{ color: '#aaa', fontSize: '0.9em', marginBottom: '8px' }}>
                                {formation} • 👥 {playerCount}/11 • 💪 {teamStrength}
                            </div>
                            <div style={{ fontSize: '0.8em', color: '#666', marginBottom: '12px' }}>
                                Manager: {managerName}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handleEditSquad(sq)}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        background: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        fontSize: '0.9em'
                                    }}
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteSquad(squadId)}
                                    style={{
                                        padding: '8px 12px',
                                        background: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        fontSize: '0.9em'
                                    }}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div style={{
                    gridColumn: '1/-1',
                    textAlign: 'center',
                    color: '#666',
                    padding: '40px'
                }}>
                    No squads yet. Create one to get started! 🚀
                </div>
            )}
        </div>
    );

    const renderPlayerCard = (slotIndex) => {
        const slot = lineup[slotIndex];
        
        if (!slot) return null;
        
        const { card, top, left, position } = slot;
        const displayRating = card ? getEffectiveRating(card, position) : null;
        
        const cardPositionCode = card ? (
            safeGet(card, 'PositionCode', 'positioncode') || 'GK'
        ).toString().toUpperCase() : 'GK';

        const penalty = card ? getPositionPenalty(cardPositionCode, position.toUpperCase()) : 0;
        const isPenalized = penalty > 0;

        return (
            <div
                key={slotIndex}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("slotIndex", slotIndex.toString())}
                onClick={() => {
                    setCurrentSlot(slotIndex);
                    setModalOpen(true);
                }}
                style={{
                    position: 'absolute',
                    top: `${top}%`,
                    left: `${left}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '75px',
                    height: '95px',
                    border: card ? '2px solid #0d6efd' : '2px dashed rgba(255,255,255,0.3)',
                    background: card ? 'rgba(13, 110, 253, 0.1)' : 'rgba(0,0,0,0.2)',
                    borderRadius: '5px',
                    cursor: 'grab',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isPenalized ? '0 0 10px rgba(255, 77, 77, 0.5)' : 'none',
                    transition: 'all 0.2s'
                }}
            >
                {card ? (
                    <>
                        <div style={{
                            fontWeight: 'bold',
                            color: isPenalized ? '#ff6b6b' : '#ffd700',
                            fontSize: '1.3em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                        }}>
                            {displayRating}
                            {isPenalized && (
                                <span style={{
                                    fontSize: '0.65em',
                                    color: '#ff9999',
                                    background: 'rgba(255,0,0,0.3)',
                                    padding: '2px 4px',
                                    borderRadius: '2px'
                                }}>
                                    -{penalty}
                                </span>
                            )}
                        </div>
                        <div style={{
                            fontSize: '0.6em',
                            textAlign: 'center',
                            color: '#fff',
                            fontWeight: 'bold',
                            marginTop: '2px'
                        }}>
                            {(safeGet(card, 'PlayerName', 'playername') || 'Unknown').toString().substring(0, 8)}
                        </div>
                        <div style={{
                            fontSize: '0.5em',
                            color: '#bbb',
                            marginTop: '1px'
                        }}>
                            {cardPositionCode}
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePlayer(slotIndex);
                            }}
                            style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                width: '20px',
                                height: '20px',
                                padding: 0,
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                fontSize: '0.8em',
                                fontWeight: 'bold'
                            }}
                        >
                            ✕
                        </button>
                    </>
                ) : (
                    <span style={{ fontSize: '2em', opacity: 0.3 }}>+</span>
                )}
                <div style={{
                    position: 'absolute',
                    bottom: '-18px',
                    fontSize: '0.7em',
                    fontWeight: 'bold',
                    color: '#fff',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    whiteSpace: 'nowrap'
                }}>
                    {position} ({getRoleGroup(position)})
                </div>
            </div>
        );
    };

    const renderBuilder = () => (
        <div>
            <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center',
                marginBottom: '20px',
                background: '#222',
                padding: '15px',
                borderRadius: '8px',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                <input
                    value={squadName}
                    onChange={(e) => setSquadName(e.target.value)}
                    style={{ padding: '10px', borderRadius: '4px', border: 'none', minWidth: '150px' }}
                    placeholder="Squad Name"
                />
                <select 
                    value={selectedManager} 
                    onChange={(e) => setSelectedManager(e.target.value)} 
                    style={{ padding: '10px', borderRadius: '4px', border: 'none' }}
                >
                    <option value="">Select Manager</option>
                    {managers && managers.length > 0 && managers.map(m => (
                        <option key={m.ManagerID} value={m.ManagerID}>
                            {m.ManagerName} ({m.PlayStyle})
                        </option>
                    ))}
                </select>
                <select 
                    value={formation} 
                    onChange={(e) => handleFormationChange(e.target.value)} 
                    style={{ padding: '10px', borderRadius: '4px', border: 'none' }}
                >
                    {Object.keys(FORMATIONS).map(f => (
                        <option key={f} value={f}>{f}</option>
                    ))}
                    <option value="custom">Custom</option>
                </select>
                <div style={{
                    color: playersInSquad < 11 ? '#ffaa00' : '#00ff7f',
                    fontWeight: 'bold',
                    fontSize: '1em',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px 12px',
                    borderRadius: '4px'
                }}>
                    💪 {totalStrength} | 👥 {playersInSquad}/11
                </div>
                <button
                    onClick={handleSaveSquad}
                    disabled={playersInSquad === 0 || loading}
                    style={{
                        background: playersInSquad === 0 || loading ? '#666' : '#28a745',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: playersInSquad === 0 || loading ? 'not-allowed' : 'pointer',
                        border: 'none'
                    }}
                >
                    {loading ? '⏳ Saving...' : editingSquadId ? '💾 UPDATE SQUAD' : '💾 SAVE SQUAD'}
                </button>
            </div>

            <div
                style={{
                    width: '100%',
                    maxWidth: '600px',
                    height: '800px',
                    margin: '20px auto',
                    background: 'linear-gradient(to bottom, #2e7d32, #388e3c)',
                    border: '5px solid white',
                    position: 'relative',
                    borderRadius: '4px'
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
            >
                <div style={{ position: 'absolute', top: '50%', left: '50%', width: '100px', height: '100px', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '50%', transform: 'translate(-50%,-50%)' }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '0', width: '100%', height: '2px', background: 'rgba(255,255,255,0.4)', transform: 'translateY(-50%)' }}></div>

                {lineup.map((slot, index) => renderPlayerCard(index))}
            </div>
        </div>
    );

    const renderModal = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: '#1a1a1a',
                padding: '20px',
                borderRadius: '10px',
                width: '550px',
                maxHeight: '75vh',
                overflowY: 'auto',
                border: '1px solid #333'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                    <h3 style={{ color: 'white', margin: 0 }}>
                        Select for {currentSlot !== null ? lineup[currentSlot]?.position : 'N/A'}
                        <span style={{ color: '#ffd700', marginLeft: '8px' }}>
                            ({currentSlot !== null ? lineup[currentSlot]?.position : 'N/A'} - {currentSlot !== null ? getRoleGroup(lineup[currentSlot]?.position) : 'N/A'})
                        </span>
                    </h3>
                    <button
                        onClick={() => setModalOpen(false)}
                        style={{
                            background: '#dc3545',
                            color: 'white',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: 'none',
                            fontWeight: 'bold'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {!myCards || myCards.length === 0 ? (
                    <div style={{ color: '#999', textAlign: 'center', padding: '30px' }}>
                        ❌ No cards available. Add players to your collection first.
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: '0.9em', color: '#aaa', marginBottom: '10px', padding: '10px', background: '#333', borderRadius: '4px' }}>
                            📇 {myCards.length} cards loaded
                        </div>
                        {myCards.map(c => {
                            if (!c) return null;

                            const playerName = safeGet(c, 'PlayerName', 'playername') || 'Unknown';
                            const position = (safeGet(c, 'PositionCode', 'positioncode') || 'GK').toString().toUpperCase();
                            const rating = parseInt(safeGet(c, 'CurrentOverallRating', 'currentoverallrating') || 0);
                            const cardId = safeGet(c, 'CardID', 'cardid');
                            const clubName = safeGet(c, 'ClubName', 'clubname') || 'N/A';

                            if (!cardId) return null;

                            const targetPosition = currentSlot !== null ? lineup[currentSlot]?.position : null;
                            const penalty = targetPosition ? getPositionPenalty(position, targetPosition) : 0;
                            const effectiveRating = Math.max(0, rating - penalty);
                            const isPenalized = penalty > 0;

                            return (
                                <div
                                    key={cardId}
                                    onClick={() => handleAddPlayer(c)}
                                    style={{
                                        padding: '12px',
                                        borderBottom: '1px solid #333',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: isPenalized ? '#2a1a1a' : '#2a2a2a',
                                        marginBottom: '5px',
                                        borderRadius: '4px',
                                        border: isPenalized ? '1px solid #ff6b6b' : '1px solid transparent',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = isPenalized ? '#3a2a2a' : '#333'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = isPenalized ? '#2a1a1a' : '#2a2a2a'}
                                >
                                    <div>
                                        <span style={{ color: 'white', fontWeight: 'bold' }}>
                                            {playerName} {rating > 0 && `(${rating})`}
                                        </span>
                                        <span style={{ color: '#999', fontSize: '0.85em', marginLeft: '8px' }}>
                                            {position} • {clubName}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{
                                                color: isPenalized ? '#ff6b6b' : '#00ff7f',
                                                fontWeight: 'bold',
                                                fontSize: '1.2em'
                                            }}>
                                                {effectiveRating}
                                            </div>
                                            {targetPosition && (
                                                <div style={{ fontSize: '0.75em', color: isPenalized ? '#ff9999' : '#aaa', marginTop: '2px' }}>
                                                    {targetPosition} ({getRoleGroup(targetPosition)}) {isPenalized && `(-${penalty})`}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{
                                            background: isPenalized ? '#ff6b6b20' : '#00ff7f20',
                                            padding: '6px 10px',
                                            borderRadius: '4px',
                                            fontWeight: 'bold',
                                            color: isPenalized ? '#ff6b6b' : '#00ff7f',
                                            fontSize: '1.1em',
                                            minWidth: '40px',
                                            textAlign: 'center'
                                        }}>
                                            {rating}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    // ============================================
    // MAIN RENDER
    // ============================================
    return (
        <div style={{ padding: '20px', background: '#111', color: 'white', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                <button
                    onClick={onBack}
                    style={{
                        background: '#333',
                        color: 'white',
                        padding: '10px 15px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        border: 'none',
                        fontWeight: 'bold'
                    }}
                >
                    ← Back
                </button>
                <h1 style={{ margin: 0 }}>🏟️ Squad Builder</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setView('list')}
                        style={{
                            background: view === 'list' ? '#007bff' : '#333',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: 'none'
                        }}
                    >
                        📋 My Squads
                    </button>
                    <button
                        onClick={startNewSquad}
                        style={{
                            background: view === 'builder' ? '#007bff' : '#333',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: 'none'
                        }}
                    >
                        ➕ New Build
                    </button>
                </div>
            </div>

            {loading && view === 'list' && (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                    ⏳ Loading squads...
                </div>
            )}

            {view === 'list' ? renderSquadList() : renderBuilder()}
            {modalOpen && renderModal()}
        </div>
    );
}