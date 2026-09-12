import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

const API_BASE_URL = 'http://localhost:5001/api';

export default function SquadBuilder({ currentUser, onBack }) {
    // ============================================
    // STATE
    // ============================================
    const [view, setView] = useState('list'); // 'list' | 'builder'
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

    // In-App Toast Notification State
    const [notification, setNotification] = useState(null); // { type: 'success'|'error'|'warning'|'info', message: string }

    const notify = useCallback((type, message) => {
        setNotification({ type, message });
    }, []);

    useEffect(() => {
        if (!notification) return;
        const timer = setTimeout(() => {
            setNotification(null);
        }, 3800);
        return () => clearTimeout(timer);
    }, [notification]);

    // Modal Search & Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [positionFilter, setPositionFilter] = useState('all');

    // ============================================
    // FORMATION LAYOUTS
    // ============================================
    const FORMATIONS = useMemo(() => ({
        '4-3-3': [
            { position: 'GK', top: 90, left: 50 },
            { position: 'LB', top: 73, left: 14 },
            { position: 'CB', top: 76, left: 37 },
            { position: 'CB', top: 76, left: 63 },
            { position: 'RB', top: 73, left: 86 },
            { position: 'DMF', top: 57, left: 50 },
            { position: 'CMF', top: 44, left: 28 },
            { position: 'AMF', top: 44, left: 72 },
            { position: 'LWF', top: 20, left: 18 },
            { position: 'CF', top: 12, left: 50 },
            { position: 'RWF', top: 20, left: 82 }
        ],
        '4-4-2': [
            { position: 'GK', top: 90, left: 50 },
            { position: 'LB', top: 73, left: 14 },
            { position: 'CB', top: 76, left: 37 },
            { position: 'CB', top: 76, left: 63 },
            { position: 'RB', top: 73, left: 86 },
            { position: 'LMF', top: 48, left: 14 },
            { position: 'CMF', top: 49, left: 37 },
            { position: 'CMF', top: 49, left: 63 },
            { position: 'RMF', top: 48, left: 86 },
            { position: 'CF', top: 15, left: 37 },
            { position: 'CF', top: 15, left: 63 }
        ],
        '4-2-3-1': [
            { position: 'GK', top: 90, left: 50 },
            { position: 'LB', top: 73, left: 14 },
            { position: 'CB', top: 76, left: 37 },
            { position: 'CB', top: 76, left: 63 },
            { position: 'RB', top: 73, left: 86 },
            { position: 'DMF', top: 61, left: 36 },
            { position: 'DMF', top: 61, left: 64 },
            { position: 'LMF', top: 38, left: 16 },
            { position: 'AMF', top: 38, left: 50 },
            { position: 'RMF', top: 38, left: 84 },
            { position: 'CF', top: 14, left: 50 }
        ],
        '3-5-2': [
            { position: 'GK', top: 90, left: 50 },
            { position: 'CB', top: 76, left: 24 },
            { position: 'CB', top: 79, left: 50 },
            { position: 'CB', top: 76, left: 76 },
            { position: 'LMF', top: 47, left: 12 },
            { position: 'DMF', top: 57, left: 35 },
            { position: 'DMF', top: 57, left: 65 },
            { position: 'AMF', top: 40, left: 50 },
            { position: 'RMF', top: 47, left: 88 },
            { position: 'CF', top: 16, left: 36 },
            { position: 'SS', top: 18, left: 64 }
        ],
        '5-3-2': [
            { position: 'GK', top: 90, left: 50 },
            { position: 'LB', top: 73, left: 12 },
            { position: 'CB', top: 76, left: 31 },
            { position: 'CB', top: 79, left: 50 },
            { position: 'CB', top: 76, left: 69 },
            { position: 'RB', top: 73, left: 88 },
            { position: 'CMF', top: 51, left: 28 },
            { position: 'DMF', top: 56, left: 50 },
            { position: 'CMF', top: 51, left: 72 },
            { position: 'CF', top: 16, left: 36 },
            { position: 'SS', top: 18, left: 64 }
        ],
        '4-1-4-1': [
            { position: 'GK', top: 90, left: 50 },
            { position: 'LB', top: 73, left: 14 },
            { position: 'CB', top: 76, left: 37 },
            { position: 'CB', top: 76, left: 63 },
            { position: 'RB', top: 73, left: 86 },
            { position: 'DMF', top: 62, left: 50 },
            { position: 'LMF', top: 42, left: 14 },
            { position: 'CMF', top: 43, left: 37 },
            { position: 'CMF', top: 43, left: 63 },
            { position: 'RMF', top: 42, left: 86 },
            { position: 'CF', top: 15, left: 50 }
        ],
        '3-4-3': [
            { position: 'GK', top: 90, left: 50 },
            { position: 'CB', top: 76, left: 24 },
            { position: 'CB', top: 79, left: 50 },
            { position: 'CB', top: 76, left: 76 },
            { position: 'LMF', top: 49, left: 14 },
            { position: 'CMF', top: 49, left: 37 },
            { position: 'CMF', top: 49, left: 63 },
            { position: 'RMF', top: 49, left: 86 },
            { position: 'LWF', top: 19, left: 18 },
            { position: 'CF', top: 12, left: 50 },
            { position: 'RWF', top: 19, left: 82 }
        ],
        '4-5-1': [
            { position: 'GK', top: 90, left: 50 },
            { position: 'LB', top: 73, left: 14 },
            { position: 'CB', top: 76, left: 37 },
            { position: 'CB', top: 76, left: 63 },
            { position: 'RB', top: 73, left: 86 },
            { position: 'LMF', top: 46, left: 14 },
            { position: 'CMF', top: 51, left: 33 },
            { position: 'DMF', top: 59, left: 50 },
            { position: 'CMF', top: 51, left: 67 },
            { position: 'RMF', top: 46, left: 86 },
            { position: 'CF', top: 15, left: 50 }
        ]
    }), []);

    const getInitialLineup = useCallback((formationKey) => {
        const formationArray = FORMATIONS[formationKey] || FORMATIONS['4-3-3'];
        return formationArray.map((slot, index) => ({
            id: `${slot.position}-${index}`,
            position: slot.position,
            top: slot.top,
            left: slot.left,
            card: null
        }));
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
        const from = naturalPos.toString().toUpperCase().trim();
        const to = targetRole.toString().toUpperCase().trim();
        if (from === to) return 0;

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

        const penalty = penaltiesToUse.find(p => {
            if (!p) return false;
            const dbFrom = (p.FromPosition || p.fromposition || '').toString().toUpperCase().trim();
            const dbTo = (p.ToPosition || p.toposition || '').toString().toUpperCase().trim();
            return dbFrom === from && dbTo === to;
        });

        if (penalty) {
            const val = parseInt(penalty.Penalty || penalty.penalty || 0);
            return isNaN(val) ? 0 : val;
        }
        return 15;
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
        return Math.max(40, baseRating - penalty);
    }, [getPositionPenalty, safeGet]);

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

    // Track which cards are already assigned to other starting XI positions
    const usedCardMap = useMemo(() => {
        const map = new Map();
        lineup.forEach((slot, idx) => {
            if (slot && slot.card && idx !== currentSlot) {
                const cId = safeGet(slot.card, 'CardID', 'cardid');
                if (cId) {
                    map.set(cId.toString(), slot.position);
                }
            }
        });
        return map;
    }, [lineup, currentSlot, safeGet]);

    // Track which real players are deployed (preventing fielding duplicate versions of the same player)
    const usedPlayerMap = useMemo(() => {
        const map = new Map();
        lineup.forEach((slot, idx) => {
            if (slot && slot.card && idx !== currentSlot) {
                const pId = safeGet(slot.card, 'PlayerID', 'playerid');
                if (pId) {
                    map.set(pId.toString(), slot.position);
                }
            }
        });
        return map;
    }, [lineup, currentSlot, safeGet]);

    const refreshData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        const userId = currentUser.userid || currentUser.id;

        try {
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
                PlayStyle: m.PlayStyle || m.playstyle || 'Possession Game'
            }));
            setManagers(normalizedManagers);
            setMyCards(cardsRes.data || []);
            setPenalties(penaltiesRes.data || []);
            setPositions(positionsRes.data || []);
        } catch (err) {
            console.error("Failed to load squad data:", err);
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
        setSelectedManager(managers[0]?.ManagerID || '');
        setFormation('4-3-3');
        setLineup(getInitialLineup('4-3-3'));
        setView('builder');
    }, [getInitialLineup, managers]);

    const handleEditSquad = useCallback(async (squad) => {
        try {
            setLoading(true);
            const squadId = safeGet(squad, 'SquadID', 'squadid');
            const squadname = safeGet(squad, 'SquadName', 'squadname');
            const managerid = safeGet(squad, 'ManagerID', 'managerid');
            const form = safeGet(squad, 'Formation', 'formation') || '4-3-3';

            setEditingSquadId(squadId);
            setSquadName(squadname || 'My Dream Team');
            setFormation(form);

            const res = await axios.get(`${API_BASE_URL}/squads/${squadId}`);
            const fullSquad = res.data;

            const finalManagerId = managerid || fullSquad?.manager?.managerId || fullSquad?.managerId;
            setSelectedManager(finalManagerId ? finalManagerId.toString() : '');

            let newLineup = getInitialLineup(form);

            if (fullSquad.players && Array.isArray(fullSquad.players)) {
                const positionCountFilled = {};

                fullSquad.players.forEach(player => {
                    const assignedPos = player.assignedPosition;
                    if (!positionCountFilled[assignedPos]) {
                        positionCountFilled[assignedPos] = 0;
                    }

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
                    positionCountFilled[assignedPos]++;

                    if (slotIndex !== -1) {
                        const matchedCard = myCards.find(c => {
                            const cCardId = safeGet(c, 'CardID', 'cardid');
                            return cCardId === player.cardId || (cCardId && player.cardId && cCardId.toString() === player.cardId.toString());
                        });

                        const cardData = matchedCard || {
                            CardID: player.cardId,
                            PlayerID: player.playerId,
                            PositionCode: player.naturalPosition || 'GK',
                            PlayerName: player.playerName || 'Unknown',
                            CurrentOverallRating: player.currentOverallRating || 0,
                            BaseOverallRating: player.baseOverallRating || 0,
                            CardType: player.cardType || 'Standard',
                            ClubName: player.clubName || 'N/A'
                        };

                        newLineup[slotIndex] = {
                            ...newLineup[slotIndex],
                            card: cardData
                        };
                    }
                });
            }

            setLineup(newLineup);
            setView('builder');
        } catch (err) {
            console.error("Error loading squad:", err);
            notify('error', "Error loading squad: " + err.message);
            setEditingSquadId(null);
        } finally {
            setLoading(false);
        }
    }, [getInitialLineup, myCards, safeGet, notify]);

    const handleFormationChange = useCallback((newFormation) => {
        setFormation(newFormation);
        if (newFormation !== 'custom') {
            setLineup(getInitialLineup(newFormation));
        }
    }, [getInitialLineup]);

    const handleSaveSquad = useCallback(async () => {
        if (!currentUser) {
            notify('warning', "Please sign in to save your squad.");
            return;
        }
        if (!selectedManager) {
            notify('warning', "Please select a tactical manager.");
            return;
        }
        if (playersInSquad === 0) {
            notify('warning', "Please add at least one player to your starting lineup.");
            return;
        }

        const playersPayload = lineup
            .filter(slot => slot && slot.card)
            .map(slot => ({
                cardId: safeGet(slot.card, 'CardID', 'cardid'),
                position: slot.position,
                isStarting: true
            }));

        // Strict duplicate validation
        const cardIds = playersPayload.map(p => p.cardId);
        if (new Set(cardIds).size !== cardIds.length) {
            notify('error', "Each player card can only be used once in your squad.");
            return;
        }

        try {
            setLoading(true);
            if (editingSquadId) {
                await axios.put(`${API_BASE_URL}/squads/${editingSquadId}`, {
                    squadName: squadName.trim(),
                    formation: formation === 'custom' ? '4-3-3' : formation,
                    players: playersPayload,
                    teamStrength: totalStrength,
                    managerId: selectedManager
                });
                notify('success', `✨ Tactical Squad "${squadName.trim()}" successfully updated!`);
            } else {
                await axios.post(`${API_BASE_URL}/squads/save`, {
                    userId: currentUser.userid || currentUser.id,
                    managerId: selectedManager,
                    squadName: squadName.trim(),
                    formation: formation === 'custom' ? '4-3-3' : formation,
                    players: playersPayload,
                    teamStrength: totalStrength
                });
                notify('success', `⭐ Tactical Squad "${squadName.trim()}" saved to your account!`);
            }

            await refreshData();
            setEditingSquadId(null);
            setView('list');
        } catch (err) {
            console.error("Save error:", err);
            notify('error', "Error saving squad: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    }, [currentUser, selectedManager, playersInSquad, lineup, squadName, formation, totalStrength, refreshData, safeGet, editingSquadId, notify]);

    const handleDeleteSquad = useCallback(async (squadId) => {
        if (!window.confirm("Are you sure you want to permanently delete this squad?")) return;
        try {
            setLoading(true);
            await axios.delete(`${API_BASE_URL}/squads/${squadId}`);
            await refreshData();
            notify('info', "Tactical squad deleted successfully.");
        } catch (err) {
            console.error("Delete error:", err);
            notify('error', "Error deleting squad: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    }, [refreshData, notify]);

    const handleAddPlayer = useCallback((cardData) => {
        if (currentSlot === null || !cardData) return;

        const cardId = safeGet(cardData, 'CardID', 'cardid');
        const playerId = safeGet(cardData, 'PlayerID', 'playerid');
        const playerName = safeGet(cardData, 'PlayerName', 'playername') || 'Player';

        if (cardId && usedCardMap.has(cardId.toString())) {
            notify('warning', `⚠️ ${playerName} is already deployed at ${usedCardMap.get(cardId.toString())}! Each card can only be used once.`);
            return;
        }

        if (playerId && usedPlayerMap.has(playerId.toString())) {
            notify('warning', `⚠️ ${playerName} is already active in your starting XI (${usedPlayerMap.get(playerId.toString())})! A player cannot be selected twice.`);
            return;
        }

        const slotPosition = lineup[currentSlot]?.position || 'Squad';
        const updatedLineup = [...lineup];
        updatedLineup[currentSlot] = {
            ...updatedLineup[currentSlot],
            card: cardData
        };
        setLineup(updatedLineup);
        setModalOpen(false);
        setSearchQuery('');
        notify('success', `✨ Added ${playerName} to ${slotPosition}!`);
    }, [currentSlot, lineup, usedCardMap, usedPlayerMap, safeGet, notify]);

    const handleRemovePlayer = useCallback((slotIndex) => {
        const removedPlayerName = safeGet(lineup[slotIndex]?.card, 'PlayerName', 'playername');
        const slotPos = lineup[slotIndex]?.position || 'XI';
        const updatedLineup = [...lineup];
        updatedLineup[slotIndex] = {
            ...updatedLineup[slotIndex],
            card: null
        };
        setLineup(updatedLineup);
        if (removedPlayerName) {
            notify('info', `Removed ${removedPlayerName} from ${slotPos}`);
        }
    }, [lineup, safeGet, notify]);

    const onDrop = useCallback((e) => {
        const slotIndexStr = e.dataTransfer.getData("slotIndex");
        if (!slotIndexStr) return;

        const slotIndex = parseInt(slotIndexStr);
        const pitch = e.currentTarget.getBoundingClientRect();
        const newTop = Math.max(10, Math.min(90, ((e.clientY - pitch.top) / pitch.height) * 100));
        const newLeft = Math.max(10, Math.min(90, ((e.clientX - pitch.left) / pitch.width) * 100));

        setFormation('custom');
        const updatedLineup = [...lineup];
        updatedLineup[slotIndex] = {
            ...updatedLineup[slotIndex],
            top: newTop,
            left: newLeft
        };
        setLineup(updatedLineup);
    }, [lineup]);

    const getPositionColor = (pos) => {
        const p = (pos || '').toUpperCase();
        if (['CF', 'SS', 'LWF', 'RWF'].includes(p)) return { color: '#ff4d6d', bg: 'rgba(255, 77, 109, 0.15)', border: 'rgba(255, 77, 109, 0.4)', label: 'FWD' };
        if (['AMF', 'CMF', 'DMF', 'LMF', 'RMF'].includes(p)) return { color: '#ffd166', bg: 'rgba(255, 209, 102, 0.15)', border: 'rgba(255, 209, 102, 0.4)', label: 'MID' };
        if (['CB', 'LB', 'RB'].includes(p)) return { color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.15)', border: 'rgba(0, 242, 254, 0.4)', label: 'DEF' };
        if (p === 'GK') return { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.4)', label: 'GK' };
        return { color: '#94a3b8', bg: 'rgba(255, 255, 255, 0.1)', border: 'rgba(255, 255, 255, 0.2)', label: 'POS' };
    };

    const getCardTierColor = (cardType) => {
        switch (cardType) {
            case 'Legendary':
            case 'Legend':
            case 'Epic':
                return { accent: '#FFD700', bg: 'linear-gradient(145deg, #261e06 0%, #171203 100%)', border: 'rgba(255, 215, 0, 0.6)', shadow: '0 0 16px rgba(255, 215, 0, 0.35)' };
            case 'POTW':
            case 'Trending':
                return { accent: '#00FF87', bg: 'linear-gradient(145deg, #052413 0%, #03140a 100%)', border: 'rgba(0, 255, 135, 0.6)', shadow: '0 0 16px rgba(0, 255, 135, 0.35)' };
            default:
                return { accent: '#00f2fe', bg: 'linear-gradient(145deg, #071f30 0%, #04101a 100%)', border: 'rgba(0, 242, 254, 0.5)', shadow: '0 0 16px rgba(0, 242, 254, 0.3)' };
        }
    };

    // ============================================
    // RENDER: SAVED SQUADS LIST VIEW
    // ============================================
    const renderSquadList = () => (
        <div>
            {mySquads && mySquads.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {mySquads.map(sq => {
                        const squadId = safeGet(sq, 'SquadID', 'squadid');
                        const name = safeGet(sq, 'SquadName', 'squadname') || 'Tactical XI';
                        const form = safeGet(sq, 'Formation', 'formation') || '4-3-3';
                        const playerCount = safeGet(sq, 'PlayerCount', 'playercount') || 0;
                        const strength = safeGet(sq, 'TeamStrength', 'teamstrength') || 0;
                        const managerName = safeGet(sq, 'ManagerName', 'managername') || 'Default Manager';

                        return (
                            <div
                                key={squadId}
                                style={{
                                    background: 'rgba(10, 16, 28, 0.75)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '20px',
                                    padding: '24px',
                                    backdropFilter: 'blur(16px)',
                                    boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.4)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                }}
                            >
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #00f2fe, #a78bfa)' }} />

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <span style={{
                                                fontSize: '0.72em',
                                                fontWeight: '800',
                                                padding: '3px 8px',
                                                borderRadius: '4px',
                                                background: 'rgba(0, 242, 254, 0.12)',
                                                color: '#00f2fe',
                                                border: '1px solid rgba(0, 242, 254, 0.25)',
                                                letterSpacing: '0.8px',
                                                textTransform: 'uppercase'
                                            }}>
                                                {form} FORMATION
                                            </span>
                                            <h3 style={{ margin: '8px 0 0 0', fontSize: '1.25em', fontWeight: '900', color: '#fff' }}>
                                                {name}
                                            </h3>
                                        </div>
                                        <div style={{
                                            fontSize: '1.4em',
                                            fontWeight: '900',
                                            color: '#ffd166',
                                            textShadow: '0 0 16px rgba(255, 209, 102, 0.4)',
                                            lineHeight: 1
                                        }}>
                                            {strength} <span style={{ fontSize: '0.5em', color: '#94a3b8' }}>OVR</span>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '10px',
                                        margin: '16px 0 20px',
                                        fontSize: '0.82em',
                                        color: '#94a3b8'
                                    }}>
                                        <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            👥 <strong style={{ color: '#fff' }}>{playerCount}/11</strong> Starters
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            👔 <strong style={{ color: '#fff' }}>{managerName}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <button
                                        onClick={() => handleEditSquad(sq)}
                                        style={{
                                            flex: 1,
                                            padding: '10px 16px',
                                            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                                            color: '#000',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: '800',
                                            cursor: 'pointer',
                                            fontSize: '0.88em',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            transition: 'opacity 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                    >
                                        ✏️ Open & Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSquad(squadId)}
                                        style={{
                                            padding: '10px 14px',
                                            background: 'rgba(255, 77, 77, 0.1)',
                                            color: '#ff4d4d',
                                            border: '1px solid rgba(255, 77, 77, 0.25)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.9em',
                                            fontWeight: 'bold',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 77, 77, 0.2)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)'}
                                        title="Delete Squad"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Sleek Empty State */
                <div style={{
                    maxWidth: '640px',
                    margin: '40px auto',
                    background: 'rgba(10, 16, 28, 0.75)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '24px',
                    padding: '60px 40px',
                    textAlign: 'center',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
                }}>
                    <div style={{
                        width: '84px',
                        height: '84px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(0,242,254,0.15) 0%, transparent 70%)',
                        border: '1px solid rgba(0,242,254,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5em',
                        margin: '0 auto 20px'
                    }}>
                        🏟️
                    </div>
                    <h2 style={{ fontSize: '1.8em', fontWeight: '900', color: '#fff', margin: '0 0 10px 0' }}>
                        No Saved Squads Yet
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.95em', lineHeight: 1.6, marginBottom: '32px' }}>
                        Build your custom starting XI with tactical managers, accurate position synergy, and real-time team strength calculation.
                    </p>
                    <button
                        onClick={startNewSquad}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                            color: '#000',
                            fontWeight: '800',
                            fontSize: '1em',
                            padding: '14px 32px',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 0 24px rgba(0, 242, 254, 0.4)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        ✨ Create Your First Squad
                    </button>
                </div>
            )}
        </div>
    );

    // ============================================
    // RENDER: PITCH PLAYER TOKEN
    // ============================================
    const renderPlayerCard = (slotIndex) => {
        const slot = lineup[slotIndex];
        if (!slot) return null;

        const { card, top, left, position } = slot;
        const posColor = getPositionColor(position);

        if (!card) {
            // Empty Slot
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
                        width: '82px',
                        height: '104px',
                        border: `1.5px dashed ${posColor.border}`,
                        background: 'rgba(8, 14, 24, 0.75)',
                        borderRadius: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        zIndex: 10
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.08)';
                        e.currentTarget.style.borderColor = posColor.color;
                        e.currentTarget.style.boxShadow = `0 8px 24px ${posColor.color}40`;
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                        e.currentTarget.style.borderColor = posColor.border;
                        e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.4)';
                    }}
                >
                    <span style={{
                        fontSize: '0.72em',
                        fontWeight: '900',
                        color: posColor.color,
                        background: posColor.bg,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        marginBottom: '6px'
                    }}>
                        {position}
                    </span>
                    <span style={{ fontSize: '1.4em', color: posColor.color, opacity: 0.8, lineHeight: 1 }}>+</span>
                    <span style={{ fontSize: '0.62em', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginTop: '6px' }}>
                        {posColor.label}
                    </span>
                </div>
            );
        }

        // Filled Slot
        const cardType = card.cardtype || card.CardType || 'Standard';
        const tier = getCardTierColor(cardType);
        const cardPos = (safeGet(card, 'PositionCode', 'positioncode') || 'GK').toString().toUpperCase();
        const penalty = getPositionPenalty(cardPos, position.toUpperCase());
        const effectiveRating = getEffectiveRating(card, position);
        const playerName = safeGet(card, 'PlayerName', 'playername') || 'Unknown';

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
                    width: '84px',
                    height: '108px',
                    background: tier.bg,
                    border: penalty > 0 ? '2px solid #ff4d4d' : `2px solid ${tier.border}`,
                    borderRadius: '14px',
                    cursor: 'grab',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 6px',
                    boxShadow: penalty > 0 ? '0 0 16px rgba(255, 77, 77, 0.4)' : tier.shadow,
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxSizing: 'border-box',
                    zIndex: 20
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
                    e.currentTarget.style.zIndex = 30;
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                    e.currentTarget.style.zIndex = 20;
                }}
            >
                {/* Remove Cross Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePlayer(slotIndex);
                    }}
                    style={{
                        position: 'absolute',
                        top: '-7px',
                        right: '-7px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        color: '#fff',
                        border: '2px solid #000',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7em',
                        fontWeight: '900',
                        zIndex: 5
                    }}
                    title="Remove Player"
                >
                    ✕
                </button>

                {/* Top: Position & Penalty */}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{
                        fontSize: '0.62em',
                        fontWeight: '900',
                        color: posColor.color,
                        background: 'rgba(0,0,0,0.5)',
                        padding: '1px 5px',
                        borderRadius: '4px'
                    }}>
                        {position}
                    </span>
                    {penalty > 0 && (
                        <span style={{
                            fontSize: '0.6em',
                            fontWeight: '800',
                            color: '#ff4d4d',
                            background: 'rgba(255,77,77,0.2)',
                            padding: '1px 4px',
                            borderRadius: '3px'
                        }}>
                            -{penalty}
                        </span>
                    )}
                </div>

                {/* Center: Big OVR */}
                <div style={{
                    fontSize: '1.85em',
                    fontWeight: '900',
                    lineHeight: 1,
                    color: penalty > 0 ? '#ff6b6b' : tier.accent,
                    textShadow: `0 0 14px ${penalty > 0 ? '#ff4d4d' : tier.accent}80`
                }}>
                    {effectiveRating}
                </div>

                {/* Bottom: Player Name */}
                <div style={{
                    width: '100%',
                    textAlign: 'center',
                    fontSize: '0.7em',
                    fontWeight: '800',
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: '4px',
                    padding: '2px 4px'
                }}>
                    {playerName}
                </div>
            </div>
        );
    };

    // ============================================
    // RENDER: PITCH & BUILDER SCREEN
    // ============================================
    const renderBuilder = () => (
        <div>
            {/* Editing In-Place Banner */}
            {editingSquadId && (
                <div style={{
                    background: 'linear-gradient(90deg, rgba(0, 242, 254, 0.12), rgba(0, 255, 135, 0.12))',
                    border: '1px solid rgba(0, 255, 135, 0.35)',
                    borderRadius: '12px',
                    padding: '10px 18px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    fontSize: '0.88em',
                    color: '#fff'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🔄</span>
                        <span>Editing existing squad: <strong style={{ color: '#00FF87' }}>"{squadName}"</strong> (Saving will replace and update this squad in place)</span>
                    </div>
                    <button
                        onClick={startNewSquad}
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#94a3b8',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.8em',
                            cursor: 'pointer'
                        }}
                    >
                        ➕ Switch to New Squad
                    </button>
                </div>
            )}

            {/* Top Control Bar (Builder Deck) */}
            <div style={{
                background: 'rgba(10, 16, 28, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '20px 24px',
                marginBottom: '28px',
                display: 'flex',
                gap: '16px',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 12px 36px rgba(0,0,0,0.4)'
            }}>
                {/* Squad Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px', flex: 1 }}>
                    <span style={{ fontSize: '1.1em' }}>✏️</span>
                    <input
                        value={squadName}
                        onChange={(e) => setSquadName(e.target.value)}
                        placeholder="Squad Name (e.g. Invincibles XI)"
                        style={{
                            background: 'rgba(15, 23, 42, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '10px',
                            color: '#fff',
                            padding: '10px 14px',
                            fontSize: '0.95em',
                            fontWeight: '700',
                            width: '100%',
                            outline: 'none',
                            fontFamily: "'Outfit', sans-serif"
                        }}
                    />
                </div>

                {/* Manager Select */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8em', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Manager:</span>
                    <select
                        value={selectedManager}
                        onChange={(e) => setSelectedManager(e.target.value)}
                        style={{
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '10px',
                            color: '#fff',
                            padding: '10px 14px',
                            fontSize: '0.9em',
                            fontWeight: '700',
                            outline: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif"
                        }}
                    >
                        <option value="">Select Tactical Manager</option>
                        {managers && managers.map(m => (
                            <option key={m.ManagerID} value={m.ManagerID}>
                                {m.ManagerName} ({m.PlayStyle})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Formation Select */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8em', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Formation:</span>
                    <select
                        value={formation}
                        onChange={(e) => handleFormationChange(e.target.value)}
                        style={{
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '10px',
                            color: '#fff',
                            padding: '10px 14px',
                            fontSize: '0.9em',
                            fontWeight: '700',
                            outline: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif"
                        }}
                    >
                        {Object.keys(FORMATIONS).map(f => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                        <option value="custom">Custom (Drag & Drop)</option>
                    </select>
                </div>

                {/* Team Strength & Starters Counter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        background: 'rgba(0, 242, 254, 0.1)',
                        border: '1px solid rgba(0, 242, 254, 0.3)',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.68em', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>TEAM STRENGTH</div>
                        <div style={{ fontSize: '1.25em', fontWeight: '900', color: '#00f2fe' }}>💪 {totalStrength}</div>
                    </div>

                    <div style={{
                        background: playersInSquad === 11 ? 'rgba(0, 255, 135, 0.1)' : 'rgba(255, 209, 102, 0.1)',
                        border: `1px solid ${playersInSquad === 11 ? 'rgba(0, 255, 135, 0.3)' : 'rgba(255, 209, 102, 0.3)'}`,
                        borderRadius: '10px',
                        padding: '8px 16px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.68em', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>STARTERS</div>
                        <div style={{ fontSize: '1.25em', fontWeight: '900', color: playersInSquad === 11 ? '#00FF87' : '#ffd166' }}>
                            👥 {playersInSquad}/11
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSaveSquad}
                        disabled={playersInSquad === 0 || loading}
                        style={{
                            padding: '12px 24px',
                            background: playersInSquad === 0 || loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #00FF87 0%, #00a855 100%)',
                            color: playersInSquad === 0 || loading ? '#64748b' : '#000',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '900',
                            fontSize: '0.9em',
                            cursor: playersInSquad === 0 || loading ? 'not-allowed' : 'pointer',
                            boxShadow: playersInSquad === 0 || loading ? 'none' : '0 0 20px rgba(0,255,135,0.4)',
                            transition: 'all 0.25s ease'
                        }}
                    >
                        {loading ? '⏳ Saving...' : editingSquadId ? '💾 Update & Replace Squad' : '💾 Save New Squad'}
                    </button>
                </div>
            </div>

            {/* ===================== REALISTIC CYBER-STADIUM PITCH ===================== */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '720px', margin: '0 auto' }}>
                <div
                    style={{
                        width: '100%',
                        height: '840px',
                        margin: '0 auto',
                        background: 'repeating-linear-gradient(180deg, #103b17 0px, #103b17 56px, #14461b 56px, #14461b 112px)',
                        borderRadius: '24px',
                        border: '3px solid rgba(255, 255, 255, 0.4)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 255, 135, 0.15)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                >
                    {/* Stadium Grass Ambient Lighting / Floodlights */}
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 10%, rgba(255,255,255,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 90%, rgba(255,255,255,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />

                    {/* Halfway Line */}
                    <div style={{ position: 'absolute', top: '50%', left: '0', width: '100%', height: '2px', background: 'rgba(255,255,255,0.45)', transform: 'translateY(-50%)' }} />

                    {/* Center Circle & Spot */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '130px', height: '130px', border: '2px solid rgba(255,255,255,0.45)', borderRadius: '50%', transform: 'translate(-50%,-50%)' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '8px', height: '8px', background: 'rgba(255,255,255,0.7)', borderRadius: '50%', transform: 'translate(-50%,-50%)' }} />

                    {/* Top Goal Area (6-yard box) */}
                    <div style={{ position: 'absolute', top: '0', left: '50%', width: '140px', height: '48px', border: '2px solid rgba(255,255,255,0.45)', borderTop: 'none', transform: 'translateX(-50%)' }} />

                    {/* Top Penalty Area (18-yard box) */}
                    <div style={{ position: 'absolute', top: '0', left: '50%', width: '320px', height: '130px', border: '2px solid rgba(255,255,255,0.45)', borderTop: 'none', transform: 'translateX(-50%)' }} />
                    {/* Top Penalty Spot */}
                    <div style={{ position: 'absolute', top: '96px', left: '50%', width: '6px', height: '6px', background: 'rgba(255,255,255,0.7)', borderRadius: '50%', transform: 'translateX(-50%)' }} />
                    {/* Top Penalty Arc (D-box) */}
                    <div style={{ position: 'absolute', top: '90px', left: '50%', width: '80px', height: '45px', border: '2px solid rgba(255,255,255,0.45)', borderTop: 'none', borderRadius: '0 0 50px 50px', transform: 'translateX(-50%)' }} />

                    {/* Bottom Goal Area (6-yard box) */}
                    <div style={{ position: 'absolute', bottom: '0', left: '50%', width: '140px', height: '48px', border: '2px solid rgba(255,255,255,0.45)', borderBottom: 'none', transform: 'translateX(-50%)' }} />

                    {/* Bottom Penalty Area (18-yard box) */}
                    <div style={{ position: 'absolute', bottom: '0', left: '50%', width: '320px', height: '130px', border: '2px solid rgba(255,255,255,0.45)', borderBottom: 'none', transform: 'translateX(-50%)' }} />
                    {/* Bottom Penalty Spot */}
                    <div style={{ position: 'absolute', bottom: '96px', left: '50%', width: '6px', height: '6px', background: 'rgba(255,255,255,0.7)', borderRadius: '50%', transform: 'translateX(-50%)' }} />
                    {/* Bottom Penalty Arc (D-box) */}
                    <div style={{ position: 'absolute', bottom: '90px', left: '50%', width: '80px', height: '45px', border: '2px solid rgba(255,255,255,0.45)', borderBottom: 'none', borderRadius: '50px 50px 0 0', transform: 'translateX(-50%)' }} />

                    {/* Corner Arcs */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '20px', height: '20px', borderRight: '2px solid rgba(255,255,255,0.45)', borderBottom: '2px solid rgba(255,255,255,0.45)', borderRadius: '0 0 20px 0' }} />
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '20px', height: '20px', borderLeft: '2px solid rgba(255,255,255,0.45)', borderBottom: '2px solid rgba(255,255,255,0.45)', borderRadius: '0 0 0 20px' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '20px', height: '20px', borderRight: '2px solid rgba(255,255,255,0.45)', borderTop: '2px solid rgba(255,255,255,0.45)', borderRadius: '0 20px 0 0' }} />
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '20px', height: '20px', borderLeft: '2px solid rgba(255,255,255,0.45)', borderTop: '2px solid rgba(255,255,255,0.45)', borderRadius: '20px 0 0 0' }} />

                    {/* Render Formation Slots */}
                    {lineup.map((slot, index) => renderPlayerCard(index))}
                </div>
            </div>
        </div>
    );

    // ============================================
    // RENDER: PLAYER SELECTION MODAL
    // ============================================
    const targetSlot = currentSlot !== null ? lineup[currentSlot] : null;
    const targetPos = targetSlot?.position || 'CF';

    // Filter cards for modal
    const filteredCards = useMemo(() => {
        if (!myCards || myCards.length === 0) return [];
        return myCards.filter(card => {
            if (!card) return false;
            const name = (safeGet(card, 'PlayerName', 'playername') || '').toLowerCase();
            const pos = (safeGet(card, 'PositionCode', 'positioncode') || '').toUpperCase();
            const matchesQuery = !searchQuery || name.includes(searchQuery.toLowerCase());

            if (!matchesQuery) return false;
            if (positionFilter === 'all') return true;
            if (positionFilter === 'exact') return pos === targetPos;
            if (positionFilter === 'FWD') return ['CF', 'SS', 'LWF', 'RWF'].includes(pos);
            if (positionFilter === 'MID') return ['AMF', 'CMF', 'DMF', 'LMF', 'RMF'].includes(pos);
            if (positionFilter === 'DEF') return ['CB', 'LB', 'RB'].includes(pos);
            if (positionFilter === 'GK') return pos === 'GK';
            return true;
        });
    }, [myCards, searchQuery, positionFilter, targetPos, safeGet]);

    const renderModal = () => (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: '#0a0f1d',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '620px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
                overflow: 'hidden'
            }}>
                {/* Modal Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <div style={{ fontSize: '0.75em', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            STARTING XI SELECTION
                        </div>
                        <h3 style={{ margin: '4px 0 0 0', fontSize: '1.4em', fontWeight: '900', color: '#fff' }}>
                            Select Player for <span style={{ color: getPositionColor(targetPos).color }}>{targetPos}</span>
                        </h3>
                    </div>
                    <button
                        onClick={() => { setModalOpen(false); setSearchQuery(''); }}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.08)',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1em',
                            fontWeight: '900'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Search & Filter Toolbar */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search players by name..."
                        style={{
                            width: '100%',
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            color: '#fff',
                            fontSize: '0.9em',
                            outline: 'none',
                            marginBottom: '12px',
                            boxSizing: 'border-box'
                        }}
                    />

                    {/* Position Filter Pills */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[
                            { id: 'all', label: 'All Cards' },
                            { id: 'exact', label: `Exact (${targetPos})` },
                            { id: 'FWD', label: 'Forwards' },
                            { id: 'MID', label: 'Midfielders' },
                            { id: 'DEF', label: 'Defenders' },
                            { id: 'GK', label: 'Goalkeepers' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setPositionFilter(f.id)}
                                style={{
                                    background: positionFilter === f.id ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.04)',
                                    color: positionFilter === f.id ? '#00f2fe' : '#94a3b8',
                                    border: `1px solid ${positionFilter === f.id ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                                    borderRadius: '6px',
                                    padding: '4px 10px',
                                    fontSize: '0.75em',
                                    fontWeight: '800',
                                    cursor: 'pointer'
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cards List */}
                <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredCards.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                            <div style={{ fontSize: '2em', marginBottom: '8px' }}>🔍</div>
                            No matching players found for this criteria.
                        </div>
                    ) : (
                        filteredCards.map(c => {
                            const playerName = safeGet(c, 'PlayerName', 'playername') || 'Unknown';
                            const cardPos = (safeGet(c, 'PositionCode', 'positioncode') || 'GK').toString().toUpperCase();
                            const rating = parseInt(safeGet(c, 'CurrentOverallRating', 'currentoverallrating') || 0);
                            const cardId = safeGet(c, 'CardID', 'cardid');
                            const playerId = safeGet(c, 'PlayerID', 'playerid');
                            const clubName = safeGet(c, 'ClubName', 'clubname') || 'Free Agent';
                            const cardType = c.cardtype || c.CardType || 'Standard';
                            const tier = getCardTierColor(cardType);

                            const isCardUsed = cardId ? usedCardMap.has(cardId.toString()) : false;
                            const isPlayerUsed = playerId ? usedPlayerMap.has(playerId.toString()) : false;
                            const isAlreadyUsed = isCardUsed || isPlayerUsed;
                            const deployedSlot = isCardUsed 
                                ? usedCardMap.get(cardId.toString()) 
                                : (isPlayerUsed ? usedPlayerMap.get(playerId.toString()) : null);

                            const penalty = targetPos ? getPositionPenalty(cardPos, targetPos) : 0;
                            const effectiveRating = Math.max(40, rating - penalty);
                            const isExact = cardPos === targetPos;

                            return (
                                <div
                                    key={cardId}
                                    onClick={isAlreadyUsed ? undefined : () => handleAddPlayer(c)}
                                    style={{
                                        background: isAlreadyUsed ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.03)',
                                        border: isAlreadyUsed 
                                            ? '1px dashed rgba(255, 255, 255, 0.12)' 
                                            : isExact 
                                            ? '1px solid rgba(0, 255, 135, 0.3)' 
                                            : '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: isAlreadyUsed ? 'not-allowed' : 'pointer',
                                        opacity: isAlreadyUsed ? 0.5 : 1,
                                        filter: isAlreadyUsed ? 'grayscale(0.65)' : 'none',
                                        transition: 'all 0.2s ease',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={e => {
                                        if (!isAlreadyUsed) {
                                            e.currentTarget.style.background = 'rgba(0, 242, 254, 0.08)';
                                            e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.4)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isAlreadyUsed) {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                            e.currentTarget.style.borderColor = isExact ? 'rgba(0, 255, 135, 0.3)' : 'rgba(255,255,255,0.08)';
                                        }
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {/* Card Type Pill */}
                                        <span style={{
                                            fontSize: '0.65em',
                                            fontWeight: '800',
                                            color: tier.accent,
                                            border: `1px solid ${tier.border}`,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            textTransform: 'uppercase'
                                        }}>
                                            {cardType}
                                        </span>

                                        {isAlreadyUsed && (
                                            <span style={{
                                                fontSize: '0.65em',
                                                fontWeight: '900',
                                                color: '#ffd166',
                                                background: 'rgba(255, 209, 102, 0.15)',
                                                border: '1px solid rgba(255, 209, 102, 0.35)',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                letterSpacing: '0.5px'
                                            }}>
                                                🔒 IN SQUAD ({deployedSlot})
                                            </span>
                                        )}

                                        <div>
                                            <div style={{ fontWeight: '800', color: '#fff', fontSize: '1em' }}>
                                                {playerName}
                                            </div>
                                            <div style={{ fontSize: '0.78em', color: '#94a3b8', marginTop: '2px' }}>
                                                Natural: <strong style={{ color: '#fff' }}>{cardPos}</strong> • {clubName}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ratings & Synergy */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{
                                                fontSize: '1.25em',
                                                fontWeight: '900',
                                                color: penalty > 0 ? '#ff6b6b' : '#00FF87'
                                            }}>
                                                {effectiveRating} <span style={{ fontSize: '0.65em', color: '#94a3b8' }}>OVR</span>
                                            </div>
                                            <div style={{ fontSize: '0.72em', fontWeight: '800', color: penalty > 0 ? '#ff6b6b' : '#00FF87' }}>
                                                {penalty > 0 ? `-${penalty} Pos Penalty` : '✨ 100% Synergy'}
                                            </div>
                                        </div>

                                        {isAlreadyUsed ? (
                                            <div style={{
                                                padding: '8px 12px',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                color: '#94a3b8',
                                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                                borderRadius: '8px',
                                                fontWeight: '800',
                                                fontSize: '0.75em',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                🔒 In XI ({deployedSlot})
                                            </div>
                                        ) : (
                                            <button style={{
                                                padding: '8px 14px',
                                                background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                                                color: '#000',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontWeight: '900',
                                                fontSize: '0.8em',
                                                cursor: 'pointer'
                                            }}>
                                                Select
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );

    // ============================================
    // MAIN COMPONENT RETURN
    // ============================================
    return (
        <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '20px 20px 80px',
            fontFamily: "'Outfit', 'Space Grotesk', system-ui, sans-serif",
            color: '#e2e8f0',
            position: 'relative'
        }}>
            {/* Unified Top Navigation Header (Single Clean Back Button) */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
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
                    ← Return to Home Hub
                </button>

                {/* Tab Pill Buttons */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={() => setView('list')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: view === 'list' ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.04)',
                            color: view === 'list' ? '#00f2fe' : '#94a3b8',
                            border: `1px solid ${view === 'list' ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                            padding: '10px 20px',
                            borderRadius: '12px',
                            fontWeight: '800',
                            fontSize: '0.9em',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        📋 My Saved Squads ({mySquads.length})
                    </button>
                    <button
                        onClick={startNewSquad}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: view === 'builder' ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' : 'rgba(255,255,255,0.04)',
                            color: view === 'builder' ? '#000' : '#e2e8f0',
                            border: view === 'builder' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            fontWeight: '800',
                            fontSize: '0.9em',
                            cursor: 'pointer',
                            boxShadow: view === 'builder' ? '0 0 20px rgba(0, 242, 254, 0.35)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        ➕ New Starting XI
                    </button>
                </div>
            </div>

            {/* Page Title */}
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
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
                    marginBottom: '12px'
                }}>
                    🏟️ TACTICAL MASTERPIECE STUDIO
                </div>
                <h1 style={{
                    fontSize: 'clamp(2.2em, 4vw, 3.2em)',
                    fontWeight: '900',
                    margin: '0 0 8px 0',
                    background: 'linear-gradient(135deg, #ffffff 0%, #d8e8f8 50%, #00f2fe 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px'
                }}>
                    {view === 'list' ? 'Your Tactical Roster' : editingSquadId ? 'Edit Tactical Squad' : 'Build Custom Starting XI'}
                </h1>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '1em' }}>
                    {view === 'list'
                        ? 'Manage, edit, and optimize your saved custom matchday squads'
                        : 'Deploy 11 starters onto the pitch, assign manager playstyles, and eliminate position penalties'}
                </p>
            </div>

            {/* In-App Floating Toast Notification Popup */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: '28px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 24px',
                    borderRadius: '16px',
                    backdropFilter: 'blur(20px)',
                    background: notification.type === 'success'
                        ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.95) 0%, rgba(2, 44, 34, 0.95) 100%)'
                        : notification.type === 'error'
                        ? 'linear-gradient(135deg, rgba(127, 29, 29, 0.95) 0%, rgba(69, 10, 10, 0.95) 100%)'
                        : notification.type === 'info'
                        ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
                        : 'linear-gradient(135deg, rgba(120, 53, 15, 0.95) 0%, rgba(69, 26, 3, 0.95) 100%)',
                    border: `1.5px solid ${
                        notification.type === 'success'
                            ? '#00FF87'
                            : notification.type === 'error'
                            ? '#ef4444'
                            : notification.type === 'info'
                            ? '#00f2fe'
                            : '#ffd166'
                    }`,
                    boxShadow: `0 16px 40px rgba(0,0,0,0.6), 0 0 28px ${
                        notification.type === 'success'
                            ? 'rgba(0, 255, 135, 0.4)'
                            : notification.type === 'error'
                            ? 'rgba(239, 68, 68, 0.4)'
                            : notification.type === 'info'
                            ? 'rgba(0, 242, 254, 0.4)'
                            : 'rgba(255, 209, 102, 0.4)'
                    }`,
                    color: '#fff',
                    fontSize: '0.95em',
                    fontWeight: '700',
                    maxWidth: '90vw'
                }}>
                    <span style={{ fontSize: '1.25em' }}>
                        {notification.type === 'success'
                            ? '✅'
                            : notification.type === 'error'
                            ? '❌'
                            : notification.type === 'info'
                            ? 'ℹ️'
                            : '⚠️'}
                    </span>
                    <span>{notification.message}</span>
                    <button
                        onClick={() => setNotification(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                            fontSize: '1em',
                            fontWeight: '900',
                            padding: '0 0 0 10px',
                            marginLeft: '8px'
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Main Content */}
            {view === 'list' ? renderSquadList() : renderBuilder()}
            {modalOpen && renderModal()}
        </div>
    );
}