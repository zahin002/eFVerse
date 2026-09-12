import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

const API_BASE_URL = 'http://localhost:5001/api';

// ============================================
// SVG PITCH COMPONENT
// ============================================
const SvgPitch = () => (
    <svg
        viewBox="0 0 680 530"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        xmlns="http://www.w3.org/2000/svg"
    >
        {/* Outer boundary */}
        <rect x="20" y="12" width="640" height="506" rx="3" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />

        {/* Halfway line */}
        <line x1="20" y1="265" x2="660" y2="265" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />

        {/* Center circle */}
        <circle cx="340" cy="265" r="56" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
        {/* Center spot */}
        <circle cx="340" cy="265" r="3" fill="rgba(255,255,255,0.85)" />

        {/* === TOP HALF (attacking end) === */}
        {/* Top penalty area (18-yard box) */}
        <rect x="185" y="12" width="310" height="115" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
        {/* Top goal area (6-yard box) */}
        <rect x="255" y="12" width="170" height="46" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
        {/* Top penalty spot */}
        <circle cx="340" cy="96" r="2.5" fill="rgba(255,255,255,0.85)" />
        {/* Top penalty arc */}
        <path d="M 288 127 A 56 56 0 0 0 392 127" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
        {/* Top goal mouth */}
        <rect x="300" y="3" width="80" height="9" rx="1" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

        {/* === BOTTOM HALF (defensive end) === */}
        {/* Bottom penalty area */}
        <rect x="185" y="403" width="310" height="115" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
        {/* Bottom goal area */}
        <rect x="255" y="472" width="170" height="46" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
        {/* Bottom penalty spot */}
        <circle cx="340" cy="434" r="2.5" fill="rgba(255,255,255,0.85)" />
        {/* Bottom penalty arc */}
        <path d="M 288 403 A 56 56 0 0 1 392 403" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
        {/* Bottom goal mouth */}
        <rect x="300" y="518" width="80" height="9" rx="1" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

        {/* Corner arcs */}
        <path d="M 20 24 A 12 12 0 0 0 32 12" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
        <path d="M 648 12 A 12 12 0 0 0 660 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
        <path d="M 20 506 A 12 12 0 0 1 32 518" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
        <path d="M 648 518 A 12 12 0 0 1 660 506" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
    </svg>
);

// ============================================
// CSS KEYFRAME ANIMATIONS (injected once)
// ============================================
const AnimationStyles = () => (
    <style>{`
        @keyframes sbPulseSlot {
            0%, 100% { box-shadow: 0 0 8px rgba(0,242,254,0.15); }
            50% { box-shadow: 0 0 20px rgba(0,242,254,0.4); }
        }
        @keyframes sbSlideIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sbModalIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes sbGlow {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }
        @keyframes sbToastIn {
            from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .sb-heading-cyan {
            background: linear-gradient(135deg, #ffffff 0%, #d8e8f8 50%, #00f2fe 100%);
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            color: transparent !important;
            display: inline-block;
        }
        .sb-heading-purple {
            background: linear-gradient(135deg, #ffffff 0%, #d8c8f8 50%, #a78bfa 100%);
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            color: transparent !important;
            display: inline-block;
        }
    `}</style>
);

export default function SquadBuilder({ currentUser, onBack }) {
    // ============================================
    // STATE
    // ============================================
    const [view, setView] = useState('list'); // 'list' | 'builder' | 'community'
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

    // Community Squads State
    const [communitySquads, setCommunitySquads] = useState([]);
    const [communityLoading, setCommunityLoading] = useState(false);
    const [communityViewSquad, setCommunityViewSquad] = useState(null); // for viewing details of a community squad

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

    // Sync squad builder view with browser URL & history
    useEffect(() => {
        const initialPath = window.location.pathname.toLowerCase();
        if (initialPath.includes('/squad-builder/pitch') || initialPath.includes('/squad-builder/edit')) {
            setView('builder');
        } else {
            setView('list');
        }

        const handlePopState = () => {
            const currentPath = window.location.pathname.toLowerCase();
            if (currentPath.includes('/squad-builder/pitch') || currentPath.includes('/squad-builder/edit')) {
                setView('builder');
            } else if (currentPath === '/squad-builder' || currentPath === '/squad-builder/') {
                setView('list');
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Modal Search & Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [positionFilter, setPositionFilter] = useState('all');

    // ============================================
    // FORMATION LAYOUTS (top% = Y on pitch, left% = X)
    // Only the top half of the pitch is used (GK at bottom, forwards at top)
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

    // Full used maps (for all slots, not excluding currentSlot) — used for modal filtering
    const allUsedCardIds = useMemo(() => {
        const set = new Set();
        lineup.forEach((slot) => {
            if (slot && slot.card) {
                const cId = safeGet(slot.card, 'CardID', 'cardid');
                if (cId) set.add(cId.toString());
            }
        });
        return set;
    }, [lineup, safeGet]);

    const allUsedPlayerIds = useMemo(() => {
        const set = new Set();
        lineup.forEach((slot) => {
            if (slot && slot.card) {
                const pId = safeGet(slot.card, 'PlayerID', 'playerid');
                if (pId) set.add(pId.toString());
            }
        });
        return set;
    }, [lineup, safeGet]);

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
        if (!window.location.pathname.toLowerCase().includes('/squad-builder/pitch')) {
            window.history.pushState({ squadView: 'builder' }, '', '/squad-builder/pitch');
        }
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
            window.history.pushState({ squadView: 'builder', squadId }, '', `/squad-builder/edit/${squadId}`);
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

    // ============================================
    // POSITION ZONE VALIDATION
    // ============================================
    const validateZoneCaps = useCallback(() => {
        const filledSlots = lineup.filter(s => s && s.card);
        let gk = 0, def = 0, mid = 0, fwd = 0;
        filledSlots.forEach(s => {
            const p = (s.position || '').toUpperCase();
            if (p === 'GK') gk++;
            else if (['CB', 'LB', 'RB'].includes(p)) def++;
            else if (['DMF', 'CMF', 'AMF', 'LMF', 'RMF'].includes(p)) mid++;
            else if (['CF', 'SS', 'LWF', 'RWF'].includes(p)) fwd++;
        });

        if (gk > 1) return 'Only 1 GK allowed';
        if (def > 5) return 'Maximum 5 defenders allowed';
        if (mid > 6) return 'Maximum 6 midfielders allowed';
        if (fwd > 3) return 'Maximum 3 forwards allowed';
        if (filledSlots.length > 11) return 'Maximum 11 starters allowed';
        return null;
    }, [lineup]);

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

        // Zone validation
        const zoneError = validateZoneCaps();
        if (zoneError) {
            notify('error', `Invalid formation: ${zoneError}`);
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
            if (window.location.pathname.toLowerCase() !== '/squad-builder') {
                window.history.replaceState({ squadView: 'list' }, '', '/squad-builder');
            }
        } catch (err) {
            console.error("Save error:", err);
            notify('error', "Error saving squad: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    }, [currentUser, selectedManager, playersInSquad, lineup, squadName, formation, totalStrength, refreshData, safeGet, editingSquadId, notify, validateZoneCaps]);

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

    // ============================================
    // COMMUNITY SHARING HANDLERS
    // ============================================
    const fetchCommunitySquads = useCallback(async () => {
        try {
            setCommunityLoading(true);
            const res = await axios.get(`${API_BASE_URL}/squads/community/all`);
            setCommunitySquads(res.data || []);
        } catch (err) {
            console.error("Failed to load community squads:", err);
            notify('error', "Failed to load community squads.");
        } finally {
            setCommunityLoading(false);
        }
    }, [notify]);

    const handleShareSquad = useCallback(async (squadId) => {
        if (!currentUser) {
            notify('warning', "Please sign in to share squads.");
            return;
        }
        try {
            setLoading(true);
            await axios.post(`${API_BASE_URL}/squads/${squadId}/share`);
            await refreshData();
            notify('success', "🌍 Squad shared to the community!");
        } catch (err) {
            console.error("Share error:", err);
            notify('error', "Error sharing squad: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    }, [currentUser, refreshData, notify]);

    const handleUnshareSquad = useCallback(async (squadId) => {
        if (!currentUser) return;
        try {
            setLoading(true);
            await axios.post(`${API_BASE_URL}/squads/${squadId}/unshare`);
            await refreshData();
            notify('info', "🔒 Squad removed from community.");
        } catch (err) {
            console.error("Unshare error:", err);
            notify('error', "Error unsharing squad: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    }, [currentUser, refreshData, notify]);

    const handleShareCurrentSquad = useCallback(async () => {
        if (!editingSquadId) {
            notify('warning', "Please save the squad first before sharing.");
            return;
        }
        const squad = mySquads.find(s => {
            const sid = safeGet(s, 'SquadID', 'squadid');
            return sid && sid.toString() === editingSquadId.toString();
        });
        const isShared = squad && (safeGet(squad, 'IsSharedToCommunity', 'issharedtocommunity') === true);
        if (isShared) {
            await handleUnshareSquad(editingSquadId);
        } else {
            await handleShareSquad(editingSquadId);
        }
    }, [editingSquadId, mySquads, safeGet, handleShareSquad, handleUnshareSquad, notify]);

    const handleViewCommunitySquad = useCallback(async (squadId) => {
        try {
            setCommunityLoading(true);
            const res = await axios.get(`${API_BASE_URL}/squads/${squadId}`);
            setCommunityViewSquad(res.data);
        } catch (err) {
            console.error("Error loading community squad details:", err);
            notify('error', "Failed to load squad details.");
        } finally {
            setCommunityLoading(false);
        }
    }, [notify]);

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

    const getZonePosition = useCallback((top, left) => {
        // GK is fixed to slot 0 — outfield players dragged here get CB
        if (top >= 85) return 'CB';
        if (top >= 68) {
            if (left < 25) return 'LB';
            if (left > 75) return 'RB';
            return 'CB';
        }
        if (top >= 35) {
            if (left < 22) return 'LMF';
            if (left > 78) return 'RMF';
            if (top >= 55) return 'DMF';
            if (top <= 44) return 'AMF';
            return 'CMF';
        }
        // Forwards (top < 35)
        if (left < 25) return 'LWF';
        if (left > 75) return 'RWF';
        if (top < 16) return 'CF';
        return 'SS';
    }, []);

    // Helper: classify a position into its zone
    const getPositionZone = useCallback((pos) => {
        const p = (pos || '').toUpperCase();
        if (p === 'GK') return 'GK';
        if (['CB', 'LB', 'RB'].includes(p)) return 'DEF';
        if (['DMF', 'CMF', 'AMF', 'LMF', 'RMF'].includes(p)) return 'MID';
        if (['CF', 'SS', 'LWF', 'RWF'].includes(p)) return 'FWD';
        return 'UNKNOWN';
    }, []);

    const ZONE_MAX = useMemo(() => ({ GK: 1, DEF: 5, MID: 6, FWD: 4 }), []);
    const ZONE_LABELS = useMemo(() => ({ GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' }), []);

    // Sub-position caps within each zone
    const SUB_POS_MAX = useMemo(() => ({
        // Forwards: CF+SS ≤ 3, LWF ≤ 1, RWF ≤ 1, zone total ≤ 4
        LWF: 1, RWF: 1,
        // Midfielders: AMF ≤ 3, LMF ≤ 1, RMF ≤ 1, zone total ≤ 6
        AMF: 3, LMF: 1, RMF: 1,
        // Defenders: LB ≤ 1, RB ≤ 1, zone total ≤ 5
        LB: 1, RB: 1,
    }), []);

    // Validate whether a specific position can accept one more player
    const validatePositionDrop = useCallback((newPos, slotIndex) => {
        const targetZone = getPositionZone(newPos);
        const currentZone = getPositionZone(lineup[slotIndex]?.position);
        const currentPos = (lineup[slotIndex]?.position || '').toUpperCase();

        // Count existing positions (excluding the dragged slot)
        const counts = {};
        let zoneCount = 0;
        lineup.forEach((slot, idx) => {
            if (idx === slotIndex) return;
            const pos = (slot.position || '').toUpperCase();
            counts[pos] = (counts[pos] || 0) + 1;
            if (getPositionZone(pos) === targetZone) zoneCount++;
        });

        // 1. Zone total cap (only if moving to a different zone)
        if (currentZone !== targetZone && zoneCount >= ZONE_MAX[targetZone]) {
            return `⚠️ ${ZONE_LABELS[targetZone]} zone is full! Maximum ${ZONE_MAX[targetZone]} players allowed.`;
        }

        // 2. Sub-position cap (check even within the same zone — e.g. moving a CB to LB)
        if (newPos !== currentPos) {
            // Individual position caps (LWF, RWF, LMF, RMF, LB, RB, AMF)
            if (SUB_POS_MAX[newPos] !== undefined && (counts[newPos] || 0) >= SUB_POS_MAX[newPos]) {
                return `⚠️ Maximum ${SUB_POS_MAX[newPos]} ${newPos} allowed!`;
            }

            // Forward central cap: CF + SS ≤ 3
            if (newPos === 'CF' || newPos === 'SS') {
                const centralFwdCount = (counts['CF'] || 0) + (counts['SS'] || 0);
                if (centralFwdCount >= 3) {
                    return `⚠️ Maximum 3 central forwards (CF + SS) allowed!`;
                }
            }

            // Midfielder central cap: CMF + DMF ≤ 5
            if (newPos === 'CMF' || newPos === 'DMF') {
                const centralMidCount = (counts['CMF'] || 0) + (counts['DMF'] || 0);
                if (centralMidCount >= 5) {
                    return `⚠️ Maximum 5 central midfielders (CMF + DMF) allowed!`;
                }
            }
        }

        return null; // No violation
    }, [lineup, getPositionZone, ZONE_MAX, ZONE_LABELS, SUB_POS_MAX]);

    const onDrop = useCallback((e) => {
        const slotIndexStr = e.dataTransfer.getData("slotIndex");
        if (!slotIndexStr) return;

        const slotIndex = parseInt(slotIndexStr);
        // GK (index 0) cannot be dragged
        if (slotIndex === 0) return;

        const pitch = e.currentTarget.getBoundingClientRect();
        const newTop = Math.max(10, Math.min(90, ((e.clientY - pitch.top) / pitch.height) * 100));
        const newLeft = Math.max(10, Math.min(90, ((e.clientX - pitch.left) / pitch.width) * 100));
        const newPos = getZonePosition(newTop, newLeft);

        // --- Real-time zone + sub-position capacity enforcement ---
        const violation = validatePositionDrop(newPos, slotIndex);
        if (violation) {
            notify('warning', violation);
            return; // reject the drop
        }

        setFormation('custom');
        const updatedLineup = [...lineup];
        updatedLineup[slotIndex] = {
            ...updatedLineup[slotIndex],
            top: newTop,
            left: newLeft,
            position: newPos
        };
        setLineup(updatedLineup);
    }, [lineup, getZonePosition, getPositionZone, ZONE_MAX, ZONE_LABELS, notify]);

    // ============================================
    // STYLING HELPERS
    // ============================================
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
        <div key="squad-list-view" style={{ animation: 'sbSlideIn 0.4s ease-out' }}>
            {/* Page Title — only shown in list view */}
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
                <div>
                    <h1 key="squad-list-title" className="sb-heading-cyan" style={{
                        fontSize: 'clamp(2.2em, 4vw, 3.2em)',
                        fontWeight: '900',
                        margin: '0 0 8px 0',
                        letterSpacing: '-0.5px'
                    }}>
                        Your Tactical Roster
                    </h1>
                </div>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '1em' }}>
                    Manage, edit, and optimize your saved custom matchday squads
                </p>
            </div>

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
                                    overflow: 'hidden',
                                    animation: 'sbSlideIn 0.4s ease-out'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.4)';
                                    e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.5), 0 0 24px rgba(0, 242, 254, 0.15)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.4)';
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
                                    {/* Share/Unshare Toggle */}
                                    {(() => {
                                        const isShared = safeGet(sq, 'IsSharedToCommunity', 'issharedtocommunity') === true;
                                        return (
                                            <button
                                                onClick={() => isShared ? handleUnshareSquad(squadId) : handleShareSquad(squadId)}
                                                style={{
                                                    padding: '10px 14px',
                                                    background: isShared
                                                        ? 'rgba(167, 139, 250, 0.12)'
                                                        : 'rgba(167, 139, 250, 0.08)',
                                                    color: isShared ? '#c4b5fd' : '#a78bfa',
                                                    border: `1px solid ${isShared ? 'rgba(167, 139, 250, 0.4)' : 'rgba(167, 139, 250, 0.2)'}`,
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.82em',
                                                    fontWeight: '700',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = isShared ? 'rgba(167, 139, 250, 0.2)' : 'rgba(167, 139, 250, 0.15)'}
                                                onMouseLeave={e => e.currentTarget.style.background = isShared ? 'rgba(167, 139, 250, 0.12)' : 'rgba(167, 139, 250, 0.08)'}
                                                title={isShared ? 'Remove from Community' : 'Share to Community'}
                                            >
                                                {isShared ? '🔒' : '🌍'}
                                            </button>
                                        );
                                    })()}
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
    // RENDER: COMMUNITY BUILDS VIEW
    // ============================================
    const renderCommunityView = () => {
        // If viewing a specific community squad
        if (communityViewSquad) {
            const sq = communityViewSquad;
            const formKey = sq.formation || '4-3-3';
            const initialSlots = getInitialLineup(formKey);
            const communityLineup = initialSlots.map(s => ({ ...s }));

            // Map saved players to formation slots
            if (sq.players && Array.isArray(sq.players)) {
                const positionCountFilled = {};

                sq.players.forEach(player => {
                    const assignedPos = player.assignedPosition;
                    if (!positionCountFilled[assignedPos]) {
                        positionCountFilled[assignedPos] = 0;
                    }

                    let count = 0;
                    let slotIndex = -1;
                    for (let i = 0; i < communityLineup.length; i++) {
                        if (communityLineup[i].position === assignedPos) {
                            if (count === positionCountFilled[assignedPos]) {
                                slotIndex = i;
                                break;
                            }
                            count++;
                        }
                    }
                    positionCountFilled[assignedPos]++;

                    // Fallback to first empty slot if position count exceeded or mismatch
                    if (slotIndex === -1) {
                        slotIndex = communityLineup.findIndex(s => !s.card);
                    }

                    if (slotIndex !== -1) {
                        const cardData = {
                            CardID: player.cardId,
                            PlayerID: player.playerId,
                            PositionCode: player.naturalPosition || player.assignedPosition || 'GK',
                            PlayerName: player.playerName || 'Unknown',
                            CurrentOverallRating: player.currentOverallRating || player.baseOverallRating || 0,
                            BaseOverallRating: player.baseOverallRating || 0,
                            CardType: player.cardType || 'Standard',
                            ClubName: player.clubName || 'N/A'
                        };

                        communityLineup[slotIndex] = {
                            ...communityLineup[slotIndex],
                            card: cardData
                        };
                    }
                });
            }

            // Helper to render read-only card slot
            const renderReadOnlyCard = (slot, slotIndex) => {
                const { top, left, position, card } = slot;
                const posColor = getPositionColor(position);

                // Unfilled slot - dashed outline matching builder
                if (!card) {
                    return (
                        <div
                            key={`comm-slot-${slotIndex}`}
                            style={{
                                position: 'absolute',
                                top: `${top}%`,
                                left: `${left}%`,
                                transform: 'translate(-50%, -50%)',
                                width: '50px',
                                height: '62px',
                                border: `1.5px dashed ${posColor.border}`,
                                background: 'rgba(8, 14, 24, 0.8)',
                                borderRadius: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                backdropFilter: 'blur(8px)',
                                boxSizing: 'border-box',
                                zIndex: 10,
                                userSelect: 'none'
                            }}
                        >
                            <span style={{
                                fontSize: '0.55em',
                                fontWeight: '900',
                                color: posColor.color,
                                background: posColor.bg,
                                padding: '1px 5px',
                                borderRadius: '3px',
                                letterSpacing: '0.5px'
                            }}>
                                {position}
                            </span>
                            <span style={{ fontSize: '0.9em', color: posColor.color, opacity: 0.7, lineHeight: 1 }}>+</span>
                            <span style={{ fontSize: '0.45em', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                                {posColor.label}
                            </span>
                        </div>
                    );
                }

                // Filled slot - authentic card with tier color, position, penalty, and rating
                const cardType = card.CardType || card.cardType || 'Standard';
                const tier = getCardTierColor(cardType);
                const cardPos = (card.PositionCode || 'GK').toString().toUpperCase();
                const penalty = getPositionPenalty(cardPos, (position || '').toUpperCase());
                const effectiveRating = getEffectiveRating(card, position);
                const playerName = card.PlayerName || 'Unknown';

                return (
                    <div
                        key={`comm-slot-${slotIndex}`}
                        style={{
                            position: 'absolute',
                            top: `${top}%`,
                            left: `${left}%`,
                            transform: 'translate(-50%, -50%)',
                            width: '54px',
                            height: '68px',
                            background: tier.bg,
                            border: penalty > 0 ? '2px solid rgba(255, 77, 77, 0.7)' : `2px solid ${tier.border}`,
                            borderRadius: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 3px',
                            boxShadow: penalty > 0
                                ? '0 0 14px rgba(255, 77, 77, 0.35), 0 4px 12px rgba(0,0,0,0.5)'
                                : `${tier.shadow}, 0 4px 12px rgba(0,0,0,0.5)`,
                            backdropFilter: 'blur(10px)',
                            transition: 'transform 0.2s ease',
                            boxSizing: 'border-box',
                            zIndex: 20,
                            cursor: 'default',
                            userSelect: 'none'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
                            e.currentTarget.style.zIndex = '30';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                            e.currentTarget.style.zIndex = '20';
                        }}
                        title={`${playerName} | Natural: ${cardPos} | Role: ${position} | Rating: ${effectiveRating}`}
                    >
                        {/* Top: Position & Penalty */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <span style={{
                                fontSize: '0.48em',
                                fontWeight: '900',
                                color: posColor.color,
                                background: 'rgba(0,0,0,0.5)',
                                padding: '1px 3px',
                                borderRadius: '3px'
                            }}>
                                {position}
                            </span>
                            {penalty > 0 && (
                                <span style={{
                                    fontSize: '0.45em',
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
                            fontSize: '1.2em',
                            fontWeight: '900',
                            lineHeight: 1,
                            color: penalty > 0 ? '#ff6b6b' : tier.accent,
                            textShadow: `0 0 12px ${penalty > 0 ? '#ff4d4d' : tier.accent}80`
                        }}>
                            {effectiveRating}
                        </div>

                        {/* Bottom: Player Name */}
                        <div style={{
                            width: '100%',
                            textAlign: 'center',
                            fontSize: '0.48em',
                            fontWeight: '800',
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            background: 'rgba(0,0,0,0.45)',
                            borderRadius: '3px',
                            padding: '2px 3px'
                        }}>
                            {playerName}
                        </div>
                    </div>
                );
            };

            return (
                <div style={{ animation: 'sbSlideIn 0.4s ease-out' }}>
                    {/* Back Button */}
                    <button
                        onClick={() => setCommunityViewSquad(null)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#94a3b8',
                            borderRadius: '999px',
                            padding: '8px 18px',
                            fontSize: '0.85em',
                            fontWeight: '700',
                            cursor: 'pointer',
                            marginBottom: '16px',
                            transition: 'all 0.25s ease'
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.1)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'; e.currentTarget.style.color = '#a78bfa'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8'; }}
                    >
                        ← Back to Community
                    </button>

                    {/* Squad Header Info */}
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '1.6em', fontWeight: '900', color: '#fff', margin: '0 0 8px 0' }}>
                            {sq.squadName}
                        </h2>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '0.82em', color: '#94a3b8' }}>
                            <span style={{ background: 'rgba(167,139,250,0.12)', padding: '5px 14px', borderRadius: '8px', border: '1px solid rgba(167,139,250,0.3)', color: '#c4b5fd', fontWeight: '800' }}>
                                📐 {sq.formation}
                            </span>
                            <span style={{ background: 'rgba(0,242,254,0.08)', padding: '5px 14px', borderRadius: '8px', border: '1px solid rgba(0,242,254,0.3)', color: '#00f2fe', fontWeight: '800' }}>
                                💪 {sq.teamStrength} OVR
                            </span>
                            {sq.manager && sq.manager.managerName && (
                                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '5px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontWeight: '700' }}>
                                    👔 {sq.manager.managerName}
                                </span>
                            )}
                            {sq.username && (
                                <span style={{ background: 'rgba(255,255,255,0.04)', padding: '5px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                                    👤 {sq.username}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Full Pitch View Matching Builder Pitch */}
                    <div style={{ position: 'relative', width: '100%', maxWidth: '700px', margin: '0 auto' }}>
                        <div style={{
                            width: '100%',
                            paddingBottom: '78%',
                            position: 'relative',
                            background: 'repeating-linear-gradient(90deg, #2b8423 0px, #2b8423 50px, #3ba630 50px, #3ba630 100px)',
                            borderRadius: '16px',
                            border: '3px solid rgba(255, 255, 255, 0.45)',
                            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7), 0 0 35px rgba(59, 166, 48, 0.25)',
                            overflow: 'hidden'
                        }}>
                            {/* Ambient Stadium Lighting & Turf Vibrancy */}
                            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.15) 100%)', pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 15%, rgba(255,255,255,0.14) 0%, transparent 60%)', pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 85%, rgba(255,255,255,0.12) 0%, transparent 55%)', pointerEvents: 'none' }} />

                            {/* SVG Pitch Markings */}
                            <SvgPitch />

                            {/* Render Formation Card Slots (Read-Only) */}
                            {communityLineup.map((slot, index) => renderReadOnlyCard(slot, index))}
                        </div>
                    </div>

                    {/* Read-Only Indicator */}
                    <div style={{
                        textAlign: 'center',
                        margin: '12px auto 0',
                        fontSize: '0.75em',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}>
                        <span style={{ color: '#a78bfa' }}>👁️</span> Community Squad Build · Read-Only View
                    </div>
                </div>
            );
        }

        // Community list
        return (
            <div key="community-view" style={{ animation: 'sbSlideIn 0.4s ease-out' }}>
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(167,139,250,0.08)',
                        border: '1px solid rgba(167,139,250,0.25)',
                        borderRadius: '999px',
                        padding: '6px 18px',
                        fontSize: '0.8em',
                        fontWeight: '800',
                        color: '#a78bfa',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '12px'
                    }}>
                        🌍 COMMUNITY HUB
                    </div>
                    <div>
                        <h1 key="community-title" className="sb-heading-purple" style={{
                            fontSize: 'clamp(2.2em, 4vw, 3.2em)',
                            fontWeight: '900',
                            margin: '0 0 8px 0',
                            letterSpacing: '-0.5px'
                        }}>
                            Community Squad Builds
                        </h1>
                    </div>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '1em' }}>
                        Browse tactical squads shared by the community
                    </p>
                </div>

                {communityLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: '2em', marginBottom: '12px', animation: 'sbGlow 1.5s ease-in-out infinite' }}>⏳</div>
                        Loading community squads...
                    </div>
                ) : communitySquads.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                        {communitySquads.map(sq => {
                            const squadId = sq.squadid;
                            const name = sq.squadname || 'Tactical XI';
                            const form = sq.formation || '4-3-3';
                            const playerCount = sq.playercount || 0;
                            const strength = sq.teamstrength || 0;
                            const username = sq.username || 'Anonymous';
                            const managerName = sq.managername || 'Unknown';
                            const sharedAt = sq.sharedat ? new Date(sq.sharedat).toLocaleDateString() : '';

                            return (
                                <div
                                    key={squadId}
                                    style={{
                                        background: 'rgba(10, 16, 28, 0.75)',
                                        border: '1px solid rgba(167, 139, 250, 0.15)',
                                        borderRadius: '20px',
                                        padding: '24px',
                                        backdropFilter: 'blur(16px)',
                                        boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        animation: 'sbSlideIn 0.4s ease-out'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.45)';
                                        e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.5), 0 0 24px rgba(167, 139, 250, 0.15)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.15)';
                                        e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.4)';
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #a78bfa, #7c3aed)' }} />

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <div>
                                                <span style={{
                                                    fontSize: '0.72em',
                                                    fontWeight: '800',
                                                    padding: '3px 8px',
                                                    borderRadius: '4px',
                                                    background: 'rgba(167, 139, 250, 0.12)',
                                                    color: '#a78bfa',
                                                    border: '1px solid rgba(167, 139, 250, 0.25)',
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
                                            <div style={{ background: 'rgba(167,139,250,0.08)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(167,139,250,0.15)' }}>
                                                👤 <strong style={{ color: '#c4b5fd' }}>{username}</strong>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                👥 <strong style={{ color: '#fff' }}>{playerCount}/11</strong> Starters
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                👔 <strong style={{ color: '#fff' }}>{managerName}</strong>
                                            </div>
                                            {sharedAt && (
                                                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                    📅 {sharedAt}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                        <button
                                            onClick={() => handleViewCommunitySquad(squadId)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 16px',
                                                background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                                                color: '#fff',
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
                                            👁️ View Squad
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
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
                            background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)',
                            border: '1px solid rgba(167,139,250,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5em',
                            margin: '0 auto 20px'
                        }}>
                            🌍
                        </div>
                        <h2 style={{ fontSize: '1.8em', fontWeight: '900', color: '#fff', margin: '0 0 10px 0' }}>
                            No Community Squads Yet
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.95em', lineHeight: 1.6, marginBottom: '32px' }}>
                            Be the first to share your squad build with the community! Open any of your saved squads and click the 🌍 Share button.
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // ============================================
    // RENDER: PITCH PLAYER TOKEN
    // ============================================
    const renderPlayerCard = (slotIndex) => {
        const slot = lineup[slotIndex];
        if (!slot) return null;

        const { card, top, left, position } = slot;
        const posColor = getPositionColor(position);
        const isGK = slotIndex === 0;

        if (!card) {
            // Empty Slot — pulsing invitation
            return (
                <div
                    key={`slot-${slotIndex}`}
                    draggable={!isGK}
                    onDragStart={(e) => {
                        if (isGK) { e.preventDefault(); return; }
                        e.dataTransfer.setData("slotIndex", slotIndex.toString());
                    }}
                    onClick={() => {
                        setCurrentSlot(slotIndex);
                        setModalOpen(true);
                    }}
                    style={{
                        position: 'absolute',
                        top: `${top}%`,
                        left: `${left}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '50px',
                        height: '62px',
                        border: `1.5px dashed ${posColor.border}`,
                        background: 'rgba(8, 14, 24, 0.8)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        backdropFilter: 'blur(8px)',
                        animation: 'sbPulseSlot 2.5s ease-in-out infinite',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        zIndex: 10
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
                        e.currentTarget.style.borderColor = posColor.color;
                        e.currentTarget.style.background = 'rgba(8, 14, 24, 0.95)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                        e.currentTarget.style.borderColor = posColor.border;
                        e.currentTarget.style.background = 'rgba(8, 14, 24, 0.8)';
                    }}
                >
                    <span style={{
                        fontSize: '0.55em',
                        fontWeight: '900',
                        color: posColor.color,
                        background: posColor.bg,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        letterSpacing: '0.5px'
                    }}>
                        {position}
                    </span>
                    <span style={{ fontSize: '0.9em', color: posColor.color, opacity: 0.7, lineHeight: 1 }}>+</span>
                    <span style={{ fontSize: '0.45em', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                        {posColor.label}
                    </span>
                </div>
            );
        }

        // Filled Slot — premium micro-card
        const cardType = card.cardtype || card.CardType || 'Standard';
        const tier = getCardTierColor(cardType);
        const cardPos = (safeGet(card, 'PositionCode', 'positioncode') || 'GK').toString().toUpperCase();
        const penalty = getPositionPenalty(cardPos, position.toUpperCase());
        const effectiveRating = getEffectiveRating(card, position);
        const playerName = safeGet(card, 'PlayerName', 'playername') || 'Unknown';

        return (
            <div
                key={`slot-${slotIndex}`}
                draggable={!isGK}
                onDragStart={(e) => {
                    if (isGK) { e.preventDefault(); return; }
                    e.dataTransfer.setData("slotIndex", slotIndex.toString());
                }}
                onClick={() => {
                    setCurrentSlot(slotIndex);
                    setModalOpen(true);
                }}
                style={{
                    position: 'absolute',
                    top: `${top}%`,
                    left: `${left}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '54px',
                    height: '68px',
                    background: tier.bg,
                    border: penalty > 0 ? '2px solid rgba(255, 77, 77, 0.7)' : `2px solid ${tier.border}`,
                    borderRadius: '10px',
                    cursor: isGK ? 'pointer' : 'grab',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 3px',
                    boxShadow: penalty > 0
                        ? '0 0 14px rgba(255, 77, 77, 0.35), 0 4px 12px rgba(0,0,0,0.5)'
                        : `${tier.shadow}, 0 4px 12px rgba(0,0,0,0.5)`,
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxSizing: 'border-box',
                    zIndex: 20
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.12)';
                    e.currentTarget.style.zIndex = '30';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                    e.currentTarget.style.zIndex = '20';
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
                        top: '-6px',
                        right: '-6px',
                        width: '15px',
                        height: '15px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        color: '#fff',
                        border: '2px solid #0a0f1d',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.5em',
                        fontWeight: '900',
                        zIndex: 5,
                        lineHeight: 1,
                        padding: 0
                    }}
                    title="Remove Player"
                >
                    ✕
                </button>

                {/* Top: Position & Penalty */}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{
                        fontSize: '0.48em',
                        fontWeight: '900',
                        color: posColor.color,
                        background: 'rgba(0,0,0,0.5)',
                        padding: '1px 3px',
                        borderRadius: '3px'
                    }}>
                        {position}
                    </span>
                    {penalty > 0 && (
                        <span style={{
                            fontSize: '0.45em',
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
                    fontSize: '1.2em',
                    fontWeight: '900',
                    lineHeight: 1,
                    color: penalty > 0 ? '#ff6b6b' : tier.accent,
                    textShadow: `0 0 12px ${penalty > 0 ? '#ff4d4d' : tier.accent}80`
                }}>
                    {effectiveRating}
                </div>

                {/* Bottom: Player Name */}
                <div style={{
                    width: '100%',
                    textAlign: 'center',
                    fontSize: '0.48em',
                    fontWeight: '800',
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    background: 'rgba(0,0,0,0.45)',
                    borderRadius: '3px',
                    padding: '2px 3px'
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
        <div style={{ animation: 'sbSlideIn 0.35s ease-out' }}>
            {/* Editing In-Place Banner */}
            {editingSquadId && (
                <div style={{
                    background: 'linear-gradient(90deg, rgba(0, 242, 254, 0.1), rgba(0, 255, 135, 0.1))',
                    border: '1px solid rgba(0, 255, 135, 0.3)',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    fontSize: '0.82em',
                    color: '#fff'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🔄</span>
                        <span>Editing: <strong style={{ color: '#00FF87' }}>"{squadName}"</strong> — save will replace in place</span>
                    </div>
                    <button
                        onClick={startNewSquad}
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#94a3b8',
                            borderRadius: '6px',
                            padding: '3px 10px',
                            fontSize: '0.85em',
                            cursor: 'pointer'
                        }}
                    >
                        ➕ New
                    </button>
                </div>
            )}

            {/* Compact Control Bar */}
            <div style={{
                background: 'rgba(10, 16, 28, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '12px 18px',
                marginBottom: '16px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 28px rgba(0,0,0,0.4)'
            }}>
                {/* Squad Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '160px', flex: 1 }}>
                    <input
                        value={squadName}
                        onChange={(e) => setSquadName(e.target.value)}
                        placeholder="Squad Name"
                        style={{
                            background: 'rgba(15, 23, 42, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '8px',
                            color: '#fff',
                            padding: '8px 12px',
                            fontSize: '0.88em',
                            fontWeight: '700',
                            width: '100%',
                            outline: 'none',
                            fontFamily: "'Outfit', sans-serif"
                        }}
                    />
                </div>

                {/* Manager Select */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.72em', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>MGR:</span>
                    <select
                        value={selectedManager}
                        onChange={(e) => setSelectedManager(e.target.value)}
                        style={{
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '8px',
                            color: '#fff',
                            padding: '8px 10px',
                            fontSize: '0.82em',
                            fontWeight: '700',
                            outline: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif",
                            maxWidth: '200px'
                        }}
                    >
                        <option value="">Select Manager</option>
                        {managers && managers.map(m => (
                            <option key={m.ManagerID} value={m.ManagerID}>
                                {m.ManagerName} ({m.PlayStyle})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Formation Select */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.72em', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>FRM:</span>
                    <select
                        value={formation}
                        onChange={(e) => handleFormationChange(e.target.value)}
                        style={{
                            background: 'rgba(15, 23, 42, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '8px',
                            color: '#fff',
                            padding: '8px 10px',
                            fontSize: '0.82em',
                            fontWeight: '700',
                            outline: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Outfit', sans-serif"
                        }}
                    >
                        {Object.keys(FORMATIONS).map(f => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                        <option value="custom">Custom (Drag)</option>
                    </select>
                </div>

                {/* Strength + Starters + Save */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        background: 'rgba(0, 242, 254, 0.08)',
                        border: '1px solid rgba(0, 242, 254, 0.25)',
                        borderRadius: '8px',
                        padding: '5px 12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.6em', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>STR</div>
                        <div style={{ fontSize: '1.05em', fontWeight: '900', color: '#00f2fe' }}>💪 {totalStrength}</div>
                    </div>

                    <div style={{
                        background: playersInSquad === 11 ? 'rgba(0, 255, 135, 0.08)' : 'rgba(255, 209, 102, 0.08)',
                        border: `1px solid ${playersInSquad === 11 ? 'rgba(0, 255, 135, 0.25)' : 'rgba(255, 209, 102, 0.25)'}`,
                        borderRadius: '8px',
                        padding: '5px 12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.6em', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>XI</div>
                        <div style={{ fontSize: '1.05em', fontWeight: '900', color: playersInSquad === 11 ? '#00FF87' : '#ffd166' }}>
                            {playersInSquad}/11
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSaveSquad}
                        disabled={playersInSquad === 0 || loading}
                        style={{
                            padding: '10px 18px',
                            background: playersInSquad === 0 || loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #00FF87 0%, #00a855 100%)',
                            color: playersInSquad === 0 || loading ? '#64748b' : '#000',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '900',
                            fontSize: '0.82em',
                            cursor: playersInSquad === 0 || loading ? 'not-allowed' : 'pointer',
                            boxShadow: playersInSquad === 0 || loading ? 'none' : '0 0 16px rgba(0,255,135,0.35)',
                            transition: 'all 0.25s ease',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {loading ? '⏳...' : editingSquadId ? '💾 Update' : '💾 Save'}
                    </button>

                    {/* Share to Community Button — only show when editing an existing saved squad */}
                    {editingSquadId && (() => {
                        const squad = mySquads.find(s => {
                            const sid = safeGet(s, 'SquadID', 'squadid');
                            return sid && sid.toString() === editingSquadId.toString();
                        });
                        const isShared = squad && (safeGet(squad, 'IsSharedToCommunity', 'issharedtocommunity') === true);
                        return (
                            <button
                                onClick={handleShareCurrentSquad}
                                disabled={loading}
                                style={{
                                    padding: '10px 16px',
                                    background: isShared
                                        ? 'rgba(255, 77, 77, 0.12)'
                                        : 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                                    color: isShared ? '#ff9999' : '#fff',
                                    border: isShared ? '1px solid rgba(255, 77, 77, 0.3)' : 'none',
                                    borderRadius: '8px',
                                    fontWeight: '800',
                                    fontSize: '0.78em',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    boxShadow: isShared ? 'none' : '0 0 14px rgba(167, 139, 250, 0.35)',
                                    transition: 'all 0.25s ease',
                                    whiteSpace: 'nowrap',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                {isShared ? '🔒 Unshare' : '🌍 Share'}
                            </button>
                        );
                    })()}
                </div>
            </div>

            {/* ===================== SVG PITCH ===================== */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '700px', margin: '0 auto' }}>
                <div
                    style={{
                        width: '100%',
                        paddingBottom: '78%', /* ~5:4 taller pitch for more vertical room */
                        position: 'relative',
                        background: 'repeating-linear-gradient(90deg, #2b8423 0px, #2b8423 50px, #3ba630 50px, #3ba630 100px)',
                        borderRadius: '16px',
                        border: '3px solid rgba(255, 255, 255, 0.45)',
                        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7), 0 0 35px rgba(59, 166, 48, 0.25)',
                        overflow: 'hidden'
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                >
                    {/* Ambient Stadium Lighting & Turf Vibrancy */}
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.15) 100%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 15%, rgba(255,255,255,0.14) 0%, transparent 60%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 85%, rgba(255,255,255,0.12) 0%, transparent 55%)', pointerEvents: 'none' }} />

                    {/* SVG Pitch Markings */}
                    <SvgPitch />

                    {/* Render Formation Slots */}
                    {lineup.map((slot, index) => renderPlayerCard(index))}
                </div>
            </div>

            {/* GK Lock Indicator */}
            <div style={{
                textAlign: 'center',
                margin: '10px auto 0',
                fontSize: '0.72em',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
            }}>
                <span style={{ color: '#a78bfa' }}>🔒</span> GK position is fixed · Drag outfield players to customize positions
            </div>
        </div>
    );

    // ============================================
    // RENDER: PLAYER SELECTION MODAL
    // ============================================
    const targetSlot = currentSlot !== null ? lineup[currentSlot] : null;
    const targetPos = targetSlot?.position || 'CF';

    // Filter cards for modal — EXCLUDE already-used cards instead of showing them as locked
    const filteredCards = useMemo(() => {
        if (!myCards || myCards.length === 0) return [];
        return myCards.filter(card => {
            if (!card) return false;

            // Exclude cards already placed in the squad
            const cardId = safeGet(card, 'CardID', 'cardid');
            const playerId = safeGet(card, 'PlayerID', 'playerid');

            // Don't exclude the card in the current slot (so user can see/re-select it)
            const currentSlotCard = currentSlot !== null ? lineup[currentSlot]?.card : null;
            const currentSlotCardId = currentSlotCard ? safeGet(currentSlotCard, 'CardID', 'cardid') : null;

            if (cardId && cardId.toString() !== currentSlotCardId?.toString()) {
                if (allUsedCardIds.has(cardId.toString())) return false;
            }
            if (playerId && cardId?.toString() !== currentSlotCardId?.toString()) {
                if (allUsedPlayerIds.has(playerId.toString())) return false;
            }

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
    }, [myCards, searchQuery, positionFilter, targetPos, safeGet, allUsedCardIds, allUsedPlayerIds, currentSlot, lineup]);

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
                background: 'linear-gradient(180deg, #0c1222 0%, #0a0f1d 100%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '580px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 40px rgba(0, 242, 254, 0.08)',
                overflow: 'hidden',
                animation: 'sbModalIn 0.3s ease-out'
            }}>
                {/* Modal Header */}
                <div style={{
                    padding: '18px 22px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(0, 242, 254, 0.03)'
                }}>
                    <div>
                        <div style={{ fontSize: '0.68em', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            STARTING XI SELECTION
                        </div>
                        <h3 style={{ margin: '3px 0 0 0', fontSize: '1.25em', fontWeight: '900', color: '#fff' }}>
                            Select for <span style={{ color: getPositionColor(targetPos).color }}>{targetPos}</span>
                        </h3>
                    </div>
                    <button
                        onClick={() => { setModalOpen(false); setSearchQuery(''); }}
                        style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.06)',
                            color: '#94a3b8',
                            border: '1px solid rgba(255,255,255,0.1)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9em',
                            fontWeight: '900',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,77,0.2)'; e.currentTarget.style.color = '#ff4d4d'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Search & Filter Toolbar */}
                <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 Search players by name..."
                        style={{
                            width: '100%',
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '9px 12px',
                            color: '#fff',
                            fontSize: '0.88em',
                            outline: 'none',
                            marginBottom: '10px',
                            boxSizing: 'border-box',
                            fontFamily: "'Outfit', sans-serif"
                        }}
                    />

                    {/* Position Filter Pills */}
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'exact', label: targetPos },
                            { id: 'FWD', label: 'FWD' },
                            { id: 'MID', label: 'MID' },
                            { id: 'DEF', label: 'DEF' },
                            { id: 'GK', label: 'GK' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setPositionFilter(f.id)}
                                style={{
                                    background: positionFilter === f.id ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.03)',
                                    color: positionFilter === f.id ? '#00f2fe' : '#64748b',
                                    border: `1px solid ${positionFilter === f.id ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                                    borderRadius: '6px',
                                    padding: '3px 10px',
                                    fontSize: '0.72em',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cards List */}
                <div style={{ padding: '12px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {filteredCards.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '36px 20px', color: '#475569' }}>
                            <div style={{ fontSize: '2em', marginBottom: '8px', opacity: 0.5 }}>🔍</div>
                            <div style={{ fontWeight: '700' }}>No available players found</div>
                            <div style={{ fontSize: '0.82em', marginTop: '4px' }}>All matching cards are already in your XI</div>
                        </div>
                    ) : (
                        filteredCards.map(c => {
                            const playerName = safeGet(c, 'PlayerName', 'playername') || 'Unknown';
                            const cardPos = (safeGet(c, 'PositionCode', 'positioncode') || 'GK').toString().toUpperCase();
                            const rating = parseInt(safeGet(c, 'CurrentOverallRating', 'currentoverallrating') || 0);
                            const cardId = safeGet(c, 'CardID', 'cardid');
                            const clubName = safeGet(c, 'ClubName', 'clubname') || 'Free Agent';
                            const cardType = c.cardtype || c.CardType || 'Standard';
                            const tier = getCardTierColor(cardType);

                            const penalty = targetPos ? getPositionPenalty(cardPos, targetPos) : 0;
                            const effectiveRating = Math.max(40, rating - penalty);
                            const isExact = cardPos === targetPos;

                            return (
                                <div
                                    key={cardId}
                                    onClick={() => handleAddPlayer(c)}
                                    style={{
                                        background: 'rgba(255,255,255,0.025)',
                                        border: isExact
                                            ? '1px solid rgba(0, 255, 135, 0.25)'
                                            : '1px solid rgba(255,255,255,0.06)',
                                        borderLeft: `3px solid ${tier.accent}`,
                                        borderRadius: '10px',
                                        padding: '10px 14px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        animation: 'sbSlideIn 0.3s ease-out'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'rgba(0, 242, 254, 0.06)';
                                        e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.3)';
                                        e.currentTarget.style.borderLeftColor = tier.accent;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                                        e.currentTarget.style.borderColor = isExact ? 'rgba(0, 255, 135, 0.25)' : 'rgba(255,255,255,0.06)';
                                        e.currentTarget.style.borderLeftColor = tier.accent;
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                        {/* Card Type Pill */}
                                        <span style={{
                                            fontSize: '0.6em',
                                            fontWeight: '800',
                                            color: tier.accent,
                                            border: `1px solid ${tier.border}`,
                                            padding: '2px 5px',
                                            borderRadius: '3px',
                                            textTransform: 'uppercase',
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0
                                        }}>
                                            {cardType}
                                        </span>

                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: '800', color: '#fff', fontSize: '0.92em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {playerName}
                                            </div>
                                            <div style={{ fontSize: '0.72em', color: '#64748b', marginTop: '1px' }}>
                                                <strong style={{ color: '#94a3b8' }}>{cardPos}</strong> · {clubName}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ratings & Synergy */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{
                                                fontSize: '1.15em',
                                                fontWeight: '900',
                                                color: penalty > 0 ? '#ff6b6b' : '#00FF87'
                                            }}>
                                                {effectiveRating}
                                            </div>
                                            <div style={{ fontSize: '0.62em', fontWeight: '800', color: penalty > 0 ? '#ff6b6b' : '#00FF87' }}>
                                                {penalty > 0 ? `-${penalty}` : '✨ SYNC'}
                                            </div>
                                        </div>

                                        <button style={{
                                            padding: '6px 12px',
                                            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                                            color: '#000',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontWeight: '900',
                                            fontSize: '0.72em',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            transition: 'opacity 0.15s'
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                        >
                                            Select
                                        </button>
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
            padding: '16px 20px 60px',
            fontFamily: "'Outfit', 'Space Grotesk', system-ui, sans-serif",
            color: '#e2e8f0',
            position: 'relative'
        }}>
            <AnimationStyles />

            {/* Unified Top Navigation Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <button
                    onClick={() => {
                        if (view === 'builder') {
                            if (window.history.length > 1 && window.location.pathname.toLowerCase().includes('/squad-builder/')) {
                                window.history.back();
                            } else {
                                setView('list');
                                window.history.replaceState({ squadView: 'list' }, '', '/squad-builder');
                            }
                        } else if (view === 'community') {
                            setCommunityViewSquad(null);
                            setView('list');
                        } else {
                            onBack();
                        }
                    }}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8',
                        borderRadius: '999px',
                        padding: '8px 18px',
                        fontSize: '0.85em',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,242,254,0.1)'; e.currentTarget.style.borderColor = 'rgba(0,242,254,0.4)'; e.currentTarget.style.color = '#00f2fe'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                    {view === 'builder' ? '← Tactical Roster' : view === 'community' ? '← My Squads' : '← Home'}
                </button>

                {/* Tab Pill Buttons */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => {
                            if (view === 'builder') {
                                if (window.history.length > 1 && window.location.pathname.toLowerCase().includes('/squad-builder/')) {
                                    window.history.back();
                                } else {
                                    setView('list');
                                    window.history.replaceState({ squadView: 'list' }, '', '/squad-builder');
                                }
                            } else {
                                setCommunityViewSquad(null);
                                setView('list');
                            }
                        }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: view === 'list' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255,255,255,0.03)',
                            color: view === 'list' ? '#00f2fe' : '#64748b',
                            border: `1px solid ${view === 'list' ? 'rgba(0, 242, 254, 0.35)' : 'rgba(255,255,255,0.08)'}`,
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontWeight: '800',
                            fontSize: '0.82em',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        📋 Squads ({mySquads.length})
                    </button>
                    <button
                        onClick={() => {
                            setCommunityViewSquad(null);
                            setView('community');
                            fetchCommunitySquads();
                        }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: view === 'community' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255,255,255,0.03)',
                            color: view === 'community' ? '#a78bfa' : '#64748b',
                            border: `1px solid ${view === 'community' ? 'rgba(167, 139, 250, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontWeight: '800',
                            fontSize: '0.82em',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        🌍 Community
                    </button>
                    <button
                        onClick={startNewSquad}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: view === 'builder' ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' : 'rgba(255,255,255,0.03)',
                            color: view === 'builder' ? '#000' : '#94a3b8',
                            border: view === 'builder' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontWeight: '800',
                            fontSize: '0.82em',
                            cursor: 'pointer',
                            boxShadow: view === 'builder' ? '0 0 16px rgba(0, 242, 254, 0.3)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        ➕ New XI
                    </button>
                </div>
            </div>

            {/* In-App Floating Toast Notification Popup */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 20px',
                    borderRadius: '14px',
                    backdropFilter: 'blur(20px)',
                    background: notification.type === 'success'
                        ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.95) 0%, rgba(2, 44, 34, 0.95) 100%)'
                        : notification.type === 'error'
                            ? 'linear-gradient(135deg, rgba(127, 29, 29, 0.95) 0%, rgba(69, 10, 10, 0.95) 100%)'
                            : notification.type === 'info'
                                ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
                                : 'linear-gradient(135deg, rgba(120, 53, 15, 0.95) 0%, rgba(69, 26, 3, 0.95) 100%)',
                    border: `1.5px solid ${notification.type === 'success'
                            ? '#00FF87'
                            : notification.type === 'error'
                                ? '#ef4444'
                                : notification.type === 'info'
                                    ? '#00f2fe'
                                    : '#ffd166'
                        }`,
                    boxShadow: `0 12px 32px rgba(0,0,0,0.5), 0 0 20px ${notification.type === 'success'
                            ? 'rgba(0, 255, 135, 0.3)'
                            : notification.type === 'error'
                                ? 'rgba(239, 68, 68, 0.3)'
                                : notification.type === 'info'
                                    ? 'rgba(0, 242, 254, 0.3)'
                                    : 'rgba(255, 209, 102, 0.3)'
                        }`,
                    color: '#fff',
                    fontSize: '0.88em',
                    fontWeight: '700',
                    maxWidth: '85vw',
                    animation: 'sbToastIn 0.35s ease-out'
                }}>
                    <span style={{ fontSize: '1.15em' }}>
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
                            color: 'rgba(255,255,255,0.6)',
                            cursor: 'pointer',
                            fontSize: '0.9em',
                            fontWeight: '900',
                            padding: '0 0 0 8px',
                            marginLeft: '4px'
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Main Content */}
            {view === 'list' ? renderSquadList() : view === 'community' ? renderCommunityView() : renderBuilder()}
            {modalOpen && renderModal()}
        </div>
    );
}