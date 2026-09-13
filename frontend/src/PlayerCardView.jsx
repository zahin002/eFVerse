import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import ComparePlayers from './ComparePlayers';
import SmartSearch from './SmartSearch';
import PositionRatingsPitch from './PositionRatingsPitch';
import PlayerSkillsPanel from './PlayerSkillsPanel';
import AttributeMatrixPanel from './AttributeMatrixPanel';
import ProgressionSlidersPanel from './ProgressionSlidersPanel';
import { getCountryFlagUrl, getTournamentBadgeUrl, getClubLogoUrl } from './badgeAssetEngine';
import { EFOOTBALL_BOOSTERS, getBoosterByName, getBoosterCategoryColor } from './efootballBoosters';
import { autoAllocatePoints, calculateAllocatedStats, calculatePositionOVR, getLevelCost } from './progressionEngine';
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

axios.defaults.withCredentials = true;

const HexagonBadge = ({ color = '#38bdf8', onClick, title }) => (
    <svg 
        width="24" 
        height="24" 
        viewBox="0 0 100 100" 
        onClick={onClick}
        title={title}
        style={{ 
            display: 'inline-block', 
            verticalAlign: 'middle', 
            filter: `drop-shadow(0 0 6px ${color})`,
            cursor: onClick ? 'pointer' : 'default',
            transition: 'transform 0.15s ease'
        }}
        onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = 'scale(1.15)'; }}
        onMouseLeave={e => { if (onClick) e.currentTarget.style.transform = 'scale(1)'; }}
    >
        <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" fill="#1b2230" stroke={color} strokeWidth="7" />
        <path d="M40,35 C40,35 60,32 60,45 C60,58 40,55 40,55 M40,48 L55,48" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" />
    </svg>
);

const DoubleBoosterLogo = ({ color1 = '#38bdf8', color2 = '#f97316', onBooster1Click, onBooster2Click }) => (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
        <HexagonBadge color={color1} onClick={onBooster1Click} title="Click to select Booster 1" />
        <HexagonBadge color={color2 || '#f97316'} onClick={onBooster2Click} title="Click to select Booster 2" />
    </div>
);

// Progression category icons (Konami / eFHUB official style)
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

export default function PlayerCardView({ data, onBack, onTrain, onSelectCard }) {

    const player = data.player || {};
    const stats = data.stats || {};
    const baseoverallrating = data.baseoverallrating || 80;
    const cardtype = data.cardtype || 'Standard';
    const cardTypeUpper = (cardtype || '').toUpperCase();
    const isTrendingCard = cardTypeUpper === 'POTW' || cardTypeUpper === 'TRENDING';
    const primaryposition = (data.positioncode || data.primaryposition || data.PositionCode || player.positioncode || player.position || 'AMF').toUpperCase();
    const playerid = data.playerid;
    const cardid = data.cardid;

    const [currentUser, setCurrentUser] = useState(null);
    const [compareMode, setCompareMode] = useState(false);
    const [compareCardId, setCompareCardId] = useState(null);
    const [isSaved, setIsSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [showManagerDropdown, setShowManagerDropdown] = useState(false);

    const fullPageRef = useRef(null);
    const managerDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (managerDropdownRef.current && !managerDropdownRef.current.contains(event.target)) {
                setShowManagerDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleShareLink = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(window.location.href);
        } else {
            const dummy = document.createElement('input');
            document.body.appendChild(dummy);
            dummy.value = window.location.href;
            dummy.select();
            document.execCommand('copy');
            document.body.removeChild(dummy);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadScreenshot = async () => {
        if (!fullPageRef.current || capturing) return;

        try {
            setCapturing(true);
            const canvas = await html2canvas(fullPageRef.current, {
                useCORS: true,
                backgroundColor: '#0a0d14',
                scale: 2,
                logging: false,
            });

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `eFVerse_${(player.playername || 'player').replace(/\s+/g, '_')}.png`;
            link.click();
        } catch (err) {
            console.error('Screenshot generation failed:', err);
        } finally {
            setCapturing(false);
        }
    };

    // Manager and Booster selection states
    const [managersList, setManagersList] = useState([]);
    const [selectedManagerId, setSelectedManagerId] = useState("");
    const [booster1, setBooster1] = useState(data.booster1 || "Technique +4");
    const [booster2, setBooster2] = useState(data.booster2 || "Hard Worker +3");
    const [booster2Level, setBooster2Level] = useState(3);
    const [booster2Category, setBooster2Category] = useState('STANDARD');
    const [showBooster2TypeMenu, setShowBooster2TypeMenu] = useState(false);
    const [otherVersions, setOtherVersions] = useState([]);

    const INITIAL_ALLOCATIONS = {
        shooting: 0, passing: 0, dribbling: 0, dexterity: 0,
        lowerBody: 0, aerial: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0
    };
    const [allocations, setAllocations] = useState(INITIAL_ALLOCATIONS);

    const booster1Ref = useRef(null);
    const booster2Ref = useRef(null);

    const BOOSTER_TYPES = [
        {
            id: 'POTW',
            name: 'Green Booster (POTW)',
            color: '#22c55e',
            maxBoost: 3,
            desc: 'Form-based, caps at +3 (A form)'
        },
        {
            id: 'STANDARD',
            name: 'Blue Booster (Standard)',
            color: '#38bdf8',
            maxBoost: 3,
            desc: 'Usually +2 (or +3), always activated'
        },
        {
            id: 'TOTAL_PACKAGE',
            name: 'Yellow/Brown (Total Package)',
            color: '#eab308',
            maxBoost: 3,
            desc: 'Boosts all stats up to +3 with full league team'
        },
        {
            id: 'SPECIAL',
            name: 'Purple Booster (Special/Named)',
            color: '#a855f7',
            maxBoost: 4,
            desc: 'Big Time / Special cards (+4, always activated)'
        }
    ];

    const handleBooster1Click = () => {
        if (booster1Ref.current) {
            booster1Ref.current.focus();
            if (booster1Ref.current.showPicker) booster1Ref.current.showPicker();
        }
    };

    const handleBooster2Click = () => {
        setShowBooster2TypeMenu(prev => !prev);
    };

    const getEffectiveBooster2Color = () => {
        const matched = BOOSTER_TYPES.find(t => t.id === booster2Category);
        return matched ? matched.color : getBoosterCategoryColor(booster2, true);
    };

    const handleSmartAllocate = () => {
        if (isTrendingCard) return;
        const rawPos = primaryposition || player.primaryposition || 'AMF';
        const pos = Array.isArray(rawPos) ? rawPos[0] : (typeof rawPos === 'string' ? rawPos : 'AMF');
        const maxPts = data.progressionpoints || 62;
        const optimized = autoAllocatePoints(stats, pos, maxPts);
        setAllocations(optimized);
    };

    const handleResetAllocations = () => {
        setAllocations(INITIAL_ALLOCATIONS);
    };

    useEffect(() => {
        if (playerid) {
            axios.get(`http://localhost:5001/api/players/other-versions?playerid=${playerid}&cardid=${cardid}`)
                .then(res => setOtherVersions(res.data || []))
                .catch(err => console.error("Error fetching other versions:", err));
        }
    }, [playerid, cardid]);

    const [showBuildsModal, setShowBuildsModal] = useState(false);
    const [buildsModalTab, setBuildsModalTab] = useState('community');
    const [myBuildsList, setMyBuildsList] = useState([]);
    const [communityBuildsList, setCommunityBuildsList] = useState([]);
    const [buildSortFilter, setBuildSortFilter] = useState('top_voted');
    const [buildPositionFilter, setBuildPositionFilter] = useState('ALL');
    const [saveBuildForm, setSaveBuildForm] = useState({ name: '', isPublic: false });
    const [dialog, setDialog] = useState(null);

    const handleOpenBuildsModal = async (tab) => {
        setBuildsModalTab(tab);
        setShowBuildsModal(true);
        if (cardid) {
            try {
                const resMine = await axios.get(`http://localhost:5001/api/progression/builds/${cardid}`);
                setMyBuildsList(resMine.data || []);
            } catch (err) {
                console.error("Error fetching my builds:", err);
            }
            try {
                const resComm = await axios.get(`http://localhost:5001/api/progression/community-builds/${cardid}`);
                setCommunityBuildsList(resComm.data || []);
            } catch (err) {
                console.error("Error fetching community builds:", err);
            }
        }
    };

    const handleReaction = async (buildId, type) => {
        try {
            await axios.post('http://localhost:5001/api/progression/react', { buildId, reactionType: type });
            handleOpenBuildsModal(buildsModalTab);
        } catch (err) {
            console.error("Error reacting to build:", err);
            setDialog({
                type: 'info',
                title: ' Sign In Required',
                message: 'Please sign in to react to progression builds.',
                confirmText: 'OK'
            });
        }
    };

    const handleDeleteBuild = async (buildId) => {
        setDialog({
            type: 'danger',
            title: 'DELETE BUILD',
            message: 'Are you sure you want to delete this custom progression build? This cannot be undone.',
            confirmText: 'Delete Build',
            onConfirm: async () => {
                try {
                    await axios.delete(`http://localhost:5001/api/progression/build/${buildId}`);
                    handleOpenBuildsModal(buildsModalTab);
                } catch (err) {
                    console.error("Error deleting build:", err);
                    setDialog({
                        type: 'danger',
                        title: 'Error',
                        message: 'Failed to delete build.',
                        confirmText: 'OK'
                    });
                }
            },
            onCancel: () => {}
        });
    };

    const handleToggleBuildPrivacy = async (buildId, currentStatus) => {
        try {
            await axios.put(`http://localhost:5001/api/progression/build-privacy/${buildId}`, { isPublic: !currentStatus });
            handleOpenBuildsModal(buildsModalTab);
        } catch (err) {
            console.error("Error toggling build privacy:", err);
            setDialog({
                type: 'danger',
                title: 'Error',
                message: 'Failed to toggle build privacy.',
                confirmText: 'OK'
            });
        }
    };

    const handleSaveCustomBuild = async () => {
        if (!currentUser) {
            setDialog({
                type: 'info',
                title: ' Sign In Required',
                message: 'Please sign in to save builds.',
                confirmText: 'OK'
            });
            return;
        }
        if (!saveBuildForm.name.trim()) {
            setDialog({
                type: 'info',
                title: 'Missing Title',
                message: 'Please enter a build name.',
                confirmText: 'OK'
            });
            return;
        }
        try {
            const buildPayload = {
                cardId: cardid,
                buildName: saveBuildForm.name.trim(),
                isPublic: saveBuildForm.isPublic,
                managerId: selectedManagerId ? parseInt(selectedManagerId, 10) : null,
                points: {
                    shooting: allocations.shooting || 0,
                    passing: allocations.passing || 0,
                    dribbling: allocations.dribbling || 0,
                    dexterity: allocations.dexterity || 0,
                    lowerBody: allocations.lowerBody || 0,
                    aerial: allocations.aerial || 0,
                    defending: allocations.defending || 0,
                    gk1: allocations.gk1 || 0,
                    gk2: allocations.gk2 || 0,
                    gk3: allocations.gk3 || 0
                }
            };
            await axios.post('http://localhost:5001/api/progression/save-snapshot', buildPayload);
            setSaveBuildForm({ name: '', isPublic: false });
            handleOpenBuildsModal('mine');
            setDialog({
                type: 'success',
                title: 'Build Saved',
                message: `Concept build "${buildPayload.buildName}" saved successfully!`,
                confirmText: 'OK'
            });
        } catch (err) {
            console.error("Error saving build:", err);
            setDialog({
                type: 'danger',
                title: 'Error',
                message: "Failed to save build: " + (err.response?.data?.error || err.message),
                confirmText: 'OK'
            });
        }
    };

    const handleLoadBuild = (build) => {
        setAllocations({
            shooting: build.finishing || build.shooting || 0,
            passing: build.passing || 0,
            dribbling: build.dribbling || 0,
            dexterity: build.offensiveawareness || build.dexterity || 0,
            lowerBody: build.speed || build.lowerbody || build.lowerBody || 0, 
            aerial: build.jump || build.aerial || 0,
            defending: build.defensiveawareness || build.defending || 0,
            gk1: build.gk1 || build.gkawareness || 0,
            gk2: build.gk2 || build.gkcatching || 0,
            gk3: build.gk3 || build.gkparrying || 0
        });
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Error parsing user data from local storage", error);
            }
        }
        // Fetch managers list for the dropdown
        axios.get("http://localhost:5001/api/progression/managers-with-effects")
            .then(res => {
                const list = res.data || [];
                console.log("✅ Managers loaded:", list.length, list.map(m => m.managername));
                setManagersList(list);
            })
            .catch(err => {
                console.error("❌ Error fetching managers (progression endpoint):", err.message);
                // Fallback: try the /api/managers/list endpoint
                axios.get("http://localhost:5001/api/managers/list")
                    .then(res2 => {
                        const list2 = res2.data || [];
                        console.log("✅ Managers loaded (fallback):", list2.length);
                        setManagersList(list2);
                    })
                    .catch(err2 => console.error("❌ Fallback managers fetch also failed:", err2.message));
            });
    }, []);

    const [reviews, setReviews] = useState([]);
    const [showReviews, setShowReviews] = useState(false);

    const [reviewForm, setReviewForm] = useState({
        matchesPlayed: '', matchesWon: '', goals: '', assists: '', cleanSheets: '', averageRating: ''
    });

    const refreshAllData = () => {
        if (cardid) {
            axios.get(`http://localhost:5001/api/reviews/${cardid}`)
                .then(res => setReviews(res.data))
                .catch(err => console.error("Error fetching reviews:", err));
        }
    };

    useEffect(() => {
        refreshAllData();
    }, [playerid, cardid]);

    const handleSaveCardToggle = () => {
        setIsSaved(!isSaved);
    };

    const handleCompareSelect = (otherCardId) => {
        setCompareCardId(otherCardId);
    };

    if (compareMode && compareCardId) {
        return (
            <ComparePlayers
                cardId1={cardid}
                cardId2={compareCardId}
                onBack={() => {
                    setCompareMode(false);
                    setCompareCardId(null);
                }}
            />
        );
    }

    const getCardStyle = (type) => {
        const baseStyle = { padding: '20px', borderRadius: '14px', position: 'relative', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', width: '220px' };
        switch (type) {
            case 'Legendary':
            case 'Legend':
            case 'Epic':
                return { ...baseStyle, background: 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)', border: '3px solid #fffacd', boxShadow: '0 0 25px rgba(255, 215, 0, 0.7)', color: '#3e2723', textShadow: 'none' };
            case 'POTW':
            case 'Trending':
                return { ...baseStyle, background: 'linear-gradient(135deg, #134e5e 0%, #71b280 50%, #00ff00 100%)', border: '3px solid #00ff00', boxShadow: '0 0 25px rgba(0, 255, 0, 0.6)' };
            default:
                return { ...baseStyle, background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', border: '2px solid #4ca1af', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' };
        }
    };

    const getStatColor = (val) => val >= 90 ? '#00f2fe' : val >= 80 ? '#39ff14' : val >= 70 ? '#f97316' : val >= 60 ? '#facc15' : '#ff4d4d';

    const displayRating = isTrendingCard
        ? (data.baseoverallrating || data.currentoverallrating || baseoverallrating)
        : (data.currentoverallrating || baseoverallrating);

    const allocatedStats = calculateAllocatedStats(stats, allocations);

    const getBoostedStats = () => {
        const boosted = {
            offensiveawareness: parseInt(allocatedStats.offensiveawareness, 10) || 60,
            ballcontrol: parseInt(allocatedStats.ballcontrol, 10) || 60,
            dribbling: parseInt(allocatedStats.dribbling, 10) || 60,
            tightpossession: parseInt(allocatedStats.tightpossession, 10) || parseInt(allocatedStats.ballcontrol, 10) || 60,
            lowpass: parseInt(allocatedStats.lowpass, 10) || parseInt(allocatedStats.passing, 10) || 60,
            loftedpass: parseInt(allocatedStats.loftedpass, 10) || (allocatedStats.passing ? parseInt(allocatedStats.passing, 10) - 5 : 55),
            finishing: parseInt(allocatedStats.finishing, 10) || 60,
            heading: parseInt(allocatedStats.heading, 10) || 65,
            placekicking: parseInt(allocatedStats.placekicking, 10) || 68,
            curl: parseInt(allocatedStats.curl, 10) || 72,
            defensiveawareness: parseInt(allocatedStats.defensiveawareness, 10) || 40,
            defensiveengagement: parseInt(allocatedStats.defensiveengagement, 10) || 50,
            tackling: parseInt(allocatedStats.tackling, 10) || 40,
            aggression: parseInt(allocatedStats.aggression, 10) || 40,
            gkawareness: parseInt(allocatedStats.gkawareness, 10) || 40,
            gkcatching: parseInt(allocatedStats.gkcatching, 10) || 40,
            gkparrying: parseInt(allocatedStats.gkparrying, 10) || 40,
            gkreflexes: parseInt(allocatedStats.gkreflexes, 10) || 40,
            gkreach: parseInt(allocatedStats.gkreach, 10) || 40,
            speed: parseInt(allocatedStats.speed, 10) || 60,
            acceleration: parseInt(allocatedStats.acceleration, 10) || 60,
            kickingpower: parseInt(allocatedStats.kickingpower, 10) || 60,
            jump: parseInt(allocatedStats.jump, 10) || 60,
            physicalcontact: parseInt(allocatedStats.physicalcontact, 10) || 60,
            balance: parseInt(allocatedStats.balance, 10) || 60,
            stamina: parseInt(allocatedStats.stamina, 10) || 60,
        };

        const addVal = (st, val) => {
            boosted[st] = (parseInt(boosted[st], 10) || 60) + val;
        };

        if (selectedManagerId) {
            const mgr = managersList.find(m => m.managerid.toString() === selectedManagerId);
            if (mgr && mgr.effects) {
                mgr.effects.forEach(eff => {
                    const rawName = (eff.statName || eff.statname || eff.stat_name || eff.stat || '').toLowerCase().replace(/[\s_\-]+/g, '');
                    const val = parseInt(eff.boost || eff.boostvalue || eff.value, 10) || 0;
                    if (!val) return;

                    if (rawName === 'lowpass' || rawName === 'shortpass' || rawName === 'groundpass') addVal('lowpass', val);
                    else if (rawName === 'loftedpass' || rawName === 'longpass' || rawName === 'longball' || rawName === 'highpass' || rawName === 'flypass') addVal('loftedpass', val);
                    else if (rawName === 'passing') { addVal('lowpass', val); addVal('loftedpass', val); }
                    else if (rawName === 'ballcontrol') addVal('ballcontrol', val);
                    else if (rawName === 'dribbling' || rawName === 'dribble') addVal('dribbling', val);
                    else if (rawName === 'tightpossession') addVal('tightpossession', val);
                    else if (rawName === 'finishing' || rawName === 'shooting' || rawName === 'finish') addVal('finishing', val);
                    else if (rawName === 'heading' || rawName === 'head') addVal('heading', val);
                    else if (rawName === 'placekicking' || rawName === 'freekick') addVal('placekicking', val);
                    else if (rawName === 'curl' || rawName === 'curve') addVal('curl', val);
                    else if (rawName === 'kickingpower' || rawName === 'shotpower') addVal('kickingpower', val);
                    else if (rawName === 'defensiveawareness' || rawName === 'defawareness' || rawName === 'defendingawareness') addVal('defensiveawareness', val);
                    else if (rawName === 'defensiveengagement' || rawName === 'defengagement') addVal('defensiveengagement', val);
                    else if (rawName === 'tackling' || rawName === 'tackle') addVal('tackling', val);
                    else if (rawName === 'aggression' || rawName === 'aggr') addVal('aggression', val);
                    else if (rawName === 'defending') { addVal('defensiveawareness', val); addVal('defensiveengagement', val); addVal('tackling', val); addVal('aggression', val); }
                    else if (rawName === 'speed' || rawName === 'lowerbody' || rawName === 'pace') addVal('speed', val);
                    else if (rawName === 'acceleration' || rawName === 'accel') addVal('acceleration', val);
                    else if (rawName === 'stamina' || rawName === 'stam') addVal('stamina', val);
                    else if (rawName === 'jump' || rawName === 'jumping' || rawName === 'aerial') addVal('jump', val);
                    else if (rawName === 'physicalcontact' || rawName === 'physicality' || rawName === 'bodycontact') addVal('physicalcontact', val);
                    else if (rawName === 'balance') addVal('balance', val);
                    else if (rawName === 'offensiveawareness' || rawName === 'attackingawareness' || rawName === 'offawareness') addVal('offensiveawareness', val);
                    else if (rawName === 'gkawareness' || rawName === 'goalkeeping') addVal('gkawareness', val);
                    else if (rawName === 'gkcatching') addVal('gkcatching', val);
                    else if (rawName === 'gkparrying') addVal('gkparrying', val);
                    else if (rawName === 'gkreflexes' || rawName === 'reflexes') addVal('gkreflexes', val);
                    else if (rawName === 'gkreach' || rawName === 'reach') addVal('gkreach', val);
                    else if (rawName === 'gkall') { addVal('gkawareness', val); addVal('gkcatching', val); addVal('gkparrying', val); addVal('gkreflexes', val); addVal('gkreach', val); }
                    else if (boosted[rawName] !== undefined) addVal(rawName, val);
                });
            }
        }

        const applyBoosterToStats = (bStr, forcedVal = null, defaultVal = 3) => {
            if (!bStr || bStr.toLowerCase() === 'none') return;
            const match = bStr.match(/\+(\d+)/);
            const val = forcedVal !== null ? forcedVal : (match ? parseInt(match[1], 10) : defaultVal);
            const boosterObj = getBoosterByName(bStr);
            if (boosterObj && boosterObj.stats) {
                boosterObj.stats.forEach(st => {
                    if (boosted[st] !== undefined) {
                        addVal(st, val);
                    }
                });
            }
        };

        if (!isTrendingCard) {
            applyBoosterToStats(booster1, null, 4);
            applyBoosterToStats(booster2, booster2Level, 3);
        }

        return boosted;
    };

    const boostedStats = getBoostedStats();

    const getBoostedOvr = () => {
        const pos = primaryposition || player.primaryposition || 'AMF';
        const baseOvr = data.baseoverallrating || data.currentoverallrating || 87;
        const maxOvr = data.maxoverallrating || 98;

        const totalPointsAllocated = Object.keys(allocations).reduce((sum, k) => {
            const lvl = allocations[k] || 0;
            for (let i = 1; i <= lvl; i++) sum += getLevelCost(i);
            return sum;
        }, 0);

        const calculatedProgressionOvr = isTrendingCard
            ? baseOvr
            : calculatePositionOVR(allocatedStats, pos, baseOvr, maxOvr, allocations);

        let extra = 0;
        if (selectedManagerId) {
            const mgr = managersList.find(m => m.managerid.toString() === selectedManagerId);
            if (mgr && mgr.effects) {
                extra += Math.round(mgr.effects.reduce((sum, eff) => sum + (eff.boost || eff.boostvalue || 0), 0) * 0.5) || 2;
            }
        }

        // Booster OVR additions apply ONLY to non-trending cards
        if (!isTrendingCard && (totalPointsAllocated > 0 || selectedManagerId)) {
            if (booster1 !== 'none') extra += 3;
            if (booster2 !== 'none') extra += 2;
        }

        return Math.min(105, calculatedProgressionOvr + extra);
    };

    const boostedOvr = getBoostedOvr();

    const selectedManager = managersList.find(m => m.managerid.toString() === selectedManagerId);
    const managerAffinity = selectedManager 
        ? (selectedManager.managername.toLowerCase().includes("flick") ? 88 : 85)
        : 70;

    const starCount = boostedOvr >= 95 ? 5 : boostedOvr >= 88 ? 4 : boostedOvr >= 80 ? 3 : 2;
    const starsString = '⭐'.repeat(starCount);

    const bioPillBoxStyle = {
        background: '#131822',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        padding: '8px 12px',
        textAlign: 'center',
        minWidth: '70px'
    };

    const countryName = player.nationality?.countryname || player.countryname || 'France';
    const clubName = player.club?.clubname || player.clubname || 'Real Madrid';

    // Guard after all hooks — safe to return early here
    if (!data || !data.player) {
        return (
            <div style={{ background: '#0a0d14', color: 'white', padding: '60px', textAlign: 'center', borderRadius: '16px', maxWidth: '600px', margin: '50px auto', fontFamily: "'Outfit', sans-serif" }}>
                <h3 style={{ color: '#ef4444', fontSize: '1.4em', marginBottom: '10px' }}>Card Details Unavailable</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9em', marginBottom: '20px' }}>Unable to load player card stats from database.</p>
                <button onClick={onBack} style={{ padding: '10px 22px', background: '#00f2fe', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer' }}>
                    ← Return to Command Center
                </button>
            </div>
        );
    }

    return (
        <div ref={fullPageRef} style={{ background: '#0a0d14', color: 'white', padding: '25px 35px', borderRadius: '16px', maxWidth: '1250px', margin: '0 auto', fontFamily: "'Outfit', sans-serif" }}>

            <div data-html2canvas-ignore="true" style={{ display: 'flex', alignItems: 'center', paddingBottom: '16px', marginBottom: '25px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', flexWrap: 'wrap', width: '100%' }}>
                <button
                    onClick={onBack}
                    style={{
                        padding: '6px 14px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        fontWeight: '800',
                        fontSize: '0.8em',
                        textTransform: 'uppercase',
                        width: 'fit-content',
                        display: 'inline-flex',
                        alignItems: 'center',
                        flexShrink: 0
                    }}
                >
                    ← BACK
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap', justifyContent: 'center', flex: 1, marginRight: '90px' }}>
                    <span style={{ color: '#fff', fontSize: '0.85em', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.5px' }} onClick={() => setCompareMode(true)}>COMPARE</span>
<<<<<<< Updated upstream
                    {!isTrendingCard && (
                        <>
                            <span style={{ color: '#fff', fontSize: '0.85em', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.5px' }} onClick={() => handleOpenBuildsModal('mine')}>MY BUILDS</span>
                            <span style={{ color: '#fff', fontSize: '0.85em', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.5px' }} onClick={() => handleOpenBuildsModal('community')}>COMMUNITY BUILDS</span>
                            <span style={{ color: '#fff', fontSize: '0.85em', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.5px' }} onClick={() => handleOpenBuildsModal('save')}>SAVE BUILD</span>
                        </>
                    )}
=======
                    <span style={{ color: '#fff', fontSize: '0.85em', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.5px' }} onClick={() => handleOpenBuildsModal('mine')}>MY BUILDS</span>
                    <span style={{ color: '#fff', fontSize: '0.85em', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.5px' }} onClick={() => handleOpenBuildsModal('community')}>COMMUNITY BUILDS</span>
                    <span style={{ color: '#fff', fontSize: '0.85em', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.5px' }} onClick={() => handleOpenBuildsModal('save')}>SAVE BUILD</span>
>>>>>>> Stashed changes
                    <span style={{ color: copied ? '#4ade80' : '#fff', fontSize: '0.85em', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.5px', transition: 'color 0.2s ease' }} onClick={handleShareLink}>
                        {copied ? 'COPIED!' : 'SHARE'}
                    </span>
                    <span style={{ color: capturing ? '#4ade80' : '#fff', fontSize: '0.85em', fontWeight: 'bold', cursor: capturing ? 'wait' : 'pointer', letterSpacing: '0.5px', transition: 'color 0.2s ease' }} onClick={handleDownloadScreenshot}>
                        {capturing ? 'CAPTURING...' : 'SCREENSHOT'}
                    </span>
                </div>
            </div>

            {compareMode && !compareCardId && (
                <div style={{ marginBottom: '30px', background: '#161616', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: '#e0a800' }}>Select Player Card to Compare Against</h3>
                        <button onClick={() => setCompareMode(false)} style={{ background: '#333', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                    <SmartSearch onCardClick={handleCompareSelect} />
                </div>
            )}

            {!compareMode && (
                <>
                    {/* 2. MAIN HEADER LAYOUT */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '30px', marginBottom: '25px', alignItems: 'start' }}>

                        {/* LEFT GROUP: badges | card | bio pills — all inline */}
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '14px' }}>

                            {/* LEFT BADGE COLUMN — 4 items, space-between, matching card height */}
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', height: '320px', paddingTop: '8px', paddingBottom: '8px' }}>
                                {/* Country Flag */}
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)', flexShrink: 0 }}>
                                    <img src={getCountryFlagUrl(countryName, player.nationality?.flagurl)} alt={countryName} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} title={countryName} onError={(e) => { e.target.onerror = null; e.target.src = 'https://flagcdn.com/w40/fr.png'; }} />
                                </div>
                                {/* Club Logo */}
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)', flexShrink: 0 }}>
                                    <img src={getClubLogoUrl(clubName, player.club?.logourl)} alt={clubName} style={{ width: '32px', height: '32px', objectFit: 'contain' }} title={clubName} onError={(e) => { e.target.onerror = null; e.target.src = '/images/club_default.svg'; }} />
                                </div>
                                {/* Tournament Badge */}
                                <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)', flexShrink: 0 }}>
                                    <img src={getTournamentBadgeUrl(data.eventname, player.league?.leaguename, cardtype)} alt="Tournament Badge" style={{ width: '32px', height: '32px', objectFit: 'contain' }} title={data.eventname || 'Tournament Badge'} onError={(e) => { e.target.onerror = null; e.target.src = '/images/world_cup.svg'; }} />
                                </div>
                                {/* Manager Boost Badge */}
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: selectedManagerId ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${selectedManagerId ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: selectedManagerId ? '0 0 10px rgba(167,139,250,0.3)' : 'inset 0 2px 4px rgba(0,0,0,0.4)', color: selectedManagerId ? '#a78bfa' : '#94a3b8', fontWeight: '900', fontSize: '1.1em' }} title="Manager Boost Level">
                                    {managerAffinity}
                                </div>
                            </div>

                            {/* PLAYER CARD + BOOSTERS */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <div style={getCardStyle(cardtype)}>
                                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#f97316', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: '900', fontSize: '0.75em' }}>S+</div>
                                    <h1 style={{ fontSize: '3.8em', margin: 0, lineHeight: 1, color: getStatColor(boostedOvr) }}>{boostedOvr}</h1>
                                    <h3 style={{ margin: '4px 0', fontSize: '1.3em', color: '#fff' }}>{primaryposition}</h3>
                                    <h2 style={{ margin: '8px 0 2px 0', fontSize: '1.5em', textAlign: 'center', color: '#fff' }}>{player.playername}</h2>
                                    <div style={{ fontSize: '0.85em', margin: '4px 0' }}>{starsString}</div>
                                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: '#22c55e', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: '900', fontSize: '0.75em' }}>B</div>
                                </div>
                                {/* Boosters Row - Compact 220px Width Matching Card (Disabled for POTW / Trending cards) */}
                                {!isTrendingCard && (
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'space-between', background: '#111722', padding: '5px 6px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', width: '220px', boxSizing: 'border-box', position: 'relative' }}>
                                        <select 
                                            ref={booster1Ref}
                                            value={booster1} 
                                            onChange={(e) => setBooster1(e.target.value)} 
                                            style={{ 
                                                background: '#0d1117', 
                                                color: getBoosterCategoryColor(booster1), 
                                                border: `1px solid ${getBoosterCategoryColor(booster1)}`, 
                                                borderRadius: '6px', 
                                                padding: '3px 4px', 
                                                fontSize: '0.68em', 
                                                fontWeight: 'bold', 
                                                outline: 'none', 
                                                cursor: 'pointer',
                                                maxWidth: '72px',
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            <option value="none">No Boost 1</option>
                                            {EFOOTBALL_BOOSTERS.map(b => (
                                                <option key={`b1-${b.name}`} value={`${b.name} +4`}>
                                                    {b.name} +4
                                                </option>
                                            ))}
                                        </select>

                                        <DoubleBoosterLogo 
                                            color1={getBoosterCategoryColor(booster1)} 
                                            color2={getEffectiveBooster2Color()} 
                                            onBooster1Click={handleBooster1Click}
                                            onBooster2Click={handleBooster2Click}
                                        />

                                        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                                            <select 
                                                ref={booster2Ref}
                                                value={booster2} 
                                                onChange={(e) => setBooster2(e.target.value)} 
                                                style={{ 
                                                    background: '#0d1117', 
                                                    color: getEffectiveBooster2Color(), 
                                                    border: `1px solid ${getEffectiveBooster2Color()}`, 
                                                    borderRadius: '6px', 
                                                    padding: '3px 4px', 
                                                    fontSize: '0.68em', 
                                                    fontWeight: 'bold', 
                                                    outline: 'none', 
                                                    cursor: 'pointer',
                                                    maxWidth: '72px',
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                <option value="none">No Boost 2</option>
                                                {EFOOTBALL_BOOSTERS.map(b => (
                                                    <option key={`b2-${b.name}`} value={`${b.name} +3`}>{b.name} +{booster2Level}</option>
                                                ))}
                                            </select>

                                            {/* 3 DOTS BOOSTER 2 LEVEL SELECTOR (+1, +2, +3) */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center', background: '#0d1117', padding: '3px 2px', borderRadius: '4px' }} title="Booster 2 Level (+1, +2, +3)">
                                                {[1, 2, 3].map(lvl => (
                                                    <button
                                                        key={lvl}
                                                        type="button"
                                                        title={`Set Level +${lvl}`}
                                                        onClick={() => setBooster2Level(lvl)}
                                                        style={{
                                                            width: '5px',
                                                            height: '5px',
                                                            borderRadius: '50%',
                                                            border: 'none',
                                                            padding: 0,
                                                            cursor: 'pointer',
                                                            background: lvl <= booster2Level ? getEffectiveBooster2Color() : 'rgba(255,255,255,0.18)',
                                                            boxShadow: lvl <= booster2Level ? `0 0 4px ${getEffectiveBooster2Color()}` : 'none',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        {/* CLICKABLE 2ND HEXAGON BOOSTER CATEGORY SELECTION POPOVER MENU */}
                                        {showBooster2TypeMenu && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '42px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                width: '270px',
                                                background: '#0d1117',
                                                border: '1px solid rgba(56, 189, 248, 0.4)',
                                                borderRadius: '12px',
                                                padding: '10px',
                                                boxShadow: '0 10px 30px rgba(0,0,0,0.9)',
                                                zIndex: 200,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                    <span style={{ fontSize: '0.75em', fontWeight: '900', color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        Select Booster 2 Category
                                                    </span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setShowBooster2TypeMenu(false)}
                                                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.9em', cursor: 'pointer', fontWeight: 'bold' }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>

                                                {BOOSTER_TYPES.map(type => (
                                                    <div
                                                        key={type.id}
                                                        onClick={() => {
                                                            setBooster2Category(type.id);
                                                            setBooster2Level(type.maxBoost);
                                                            setShowBooster2TypeMenu(false);
                                                        }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            padding: '6px 8px',
                                                            borderRadius: '8px',
                                                            background: booster2Category === type.id ? 'rgba(255,255,255,0.08)' : '#111722',
                                                            border: `1px solid ${booster2Category === type.id ? type.color : 'rgba(255,255,255,0.06)'}`,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.borderColor = type.color}
                                                        onMouseLeave={e => e.currentTarget.style.borderColor = booster2Category === type.id ? type.color : 'rgba(255,255,255,0.06)'}
                                                    >
                                                        <HexagonBadge color={type.color} />
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontSize: '0.78em', fontWeight: '900', color: type.color }}>
                                                                {type.name}
                                                            </span>
                                                            <span style={{ fontSize: '0.62em', color: '#94a3b8' }}>
                                                                {type.desc}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* RIGHT BIO PILLS COLUMN — 5 items, space-between, matching card height */}
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'stretch', height: '320px', paddingTop: '8px', paddingBottom: '8px' }}>
                                <div style={bioPillBoxStyle}>
                                    <div style={{ fontSize: '0.65em', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Height</div>
                                    <div style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{player.height || 178}cm</div>
                                </div>
                                <div style={bioPillBoxStyle}>
                                    <div style={{ fontSize: '0.65em', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Weight</div>
                                    <div style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{player.weight || 75}kg</div>
                                </div>
                                <div style={bioPillBoxStyle}>
                                    <div style={{ fontSize: '0.65em', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Age</div>
                                    <div style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{player.age || 27}</div>
                                </div>
                                <div style={bioPillBoxStyle}>
                                    <div style={{ fontSize: '0.65em', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Foot</div>
                                    <div style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{player.preferredfoot || 'Right'}</div>
                                </div>
                                <div style={bioPillBoxStyle}>
                                    <div style={{ fontSize: '0.65em', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Condition</div>
                                    <div style={{ fontSize: '0.9em', fontWeight: '900', color: '#22c55e', marginTop: '2px' }}>B</div>
                                </div>
                            </div>

                        </div>

                        {/* CENTER SECTION: PLAYER NAME, RATE BUTTON & MANAGER SELECTOR */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingLeft: '10px' }}>
                            <div>
                                <h1 style={{ margin: '0 0 4px 0', fontSize: '2.5em', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#fff' }}>
                                    {player.playername}
                                </h1>

                                <div style={{ color: '#00f2fe', fontSize: '0.9em', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                    {player.playstyle || 'GOAL POACHER'}
                                </div>



                                {/* MANAGER SELECTOR — custom manager card UI */}
                                {(() => {
                                    const selectedManager = managersList.find(m => m.managerid?.toString() === selectedManagerId?.toString());
                                    return (
                                        <div 
                                            ref={managerDropdownRef}
                                            style={{ marginTop: '14px', background: '#111722', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '14px', padding: '12px 14px', width: '100%', maxWidth: '300px', boxShadow: '0 4px 15px rgba(0,0,0,0.4)', position: 'relative' }}
                                        >
                                            <div style={{ fontSize: '0.65em', color: '#a78bfa', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px' }}>Manager Boost</div>
                                            
                                            {/* MANAGER CARD ROW (CLICKABLE TRIGGER) */}
                                            <div 
                                                onClick={() => setShowManagerDropdown(!showManagerDropdown)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#0d1117', border: `1px solid ${showManagerDropdown ? 'rgba(167,139,250,0.6)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '10px', padding: '8px 10px', position: 'relative', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: showManagerDropdown ? '0 0 12px rgba(167,139,250,0.3)' : 'none' }}
                                            >
                                                {/* MANAGER AVATAR FRAME */}
                                                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                                                    {selectedManager?.imageurl ? (
                                                        <img src={selectedManager.imageurl} alt={selectedManager.managername} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                            <circle cx="12" cy="7" r="4"></circle>
                                                        </svg>
                                                    )}
                                                </div>

                                                {/* MANAGER NAME & PLAYSTYLE INFO */}
                                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                                    <div style={{ fontSize: '0.9em', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {selectedManager ? selectedManager.managername : 'Select Manager'}
                                                    </div>
                                                    <div style={{ fontSize: '0.75em', color: selectedManager ? '#a78bfa' : '#64748b', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {selectedManager ? selectedManager.playstyle : 'Tap to select manager'}
                                                    </div>
                                                </div>

                                                {/* DROPDOWN CHEVRON */}
                                                <div style={{ color: showManagerDropdown ? '#a78bfa' : '#64748b', fontSize: '0.75em', transition: 'transform 0.2s ease', transform: showManagerDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                                    ▼
                                                </div>
                                            </div>

                                            {/* CUSTOM DARK DROPDOWN MENU — ALWAYS OPENS BELOW */}
                                            {showManagerDropdown && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    right: 0,
                                                    marginTop: '6px',
                                                    background: '#0d1117',
                                                    border: '1px solid rgba(167, 139, 250, 0.4)',
                                                    borderRadius: '12px',
                                                    padding: '6px',
                                                    maxHeight: '230px',
                                                    overflowY: 'auto',
                                                    zIndex: 9999,
                                                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
                                                    fontFamily: "'Outfit', sans-serif"
                                                }}>
                                                    {/* NO MANAGER OPTION */}
                                                    <div
                                                        onClick={() => {
                                                            setSelectedManagerId('');
                                                            setShowManagerDropdown(false);
                                                        }}
                                                        style={{
                                                            padding: '8px 10px',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.82em',
                                                            fontWeight: '700',
                                                            color: !selectedManagerId ? '#a78bfa' : '#94a3b8',
                                                            background: !selectedManagerId ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                                                            marginBottom: '4px',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(167, 139, 250, 0.12)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = !selectedManagerId ? 'rgba(167, 139, 250, 0.15)' : 'transparent'}
                                                    >
                                                        -- No Manager --
                                                    </div>

                                                    {/* MANAGER OPTIONS LIST */}
                                                    {managersList.map(mgr => {
                                                        const isSelected = selectedManagerId?.toString() === mgr.managerid?.toString();
                                                        return (
                                                            <div
                                                                key={mgr.managerid}
                                                                onClick={() => {
                                                                    setSelectedManagerId(mgr.managerid.toString());
                                                                    setShowManagerDropdown(false);
                                                                }}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '10px',
                                                                    padding: '8px 10px',
                                                                    borderRadius: '8px',
                                                                    cursor: 'pointer',
                                                                    background: isSelected ? 'rgba(167, 139, 250, 0.2)' : 'transparent',
                                                                    border: isSelected ? '1px solid rgba(167, 139, 250, 0.4)' : '1px solid transparent',
                                                                    marginBottom: '4px',
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                                onMouseEnter={e => {
                                                                    if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                                                }}
                                                                onMouseLeave={e => {
                                                                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                                                                }}
                                                            >
                                                                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', fontSize: '0.8em', flexShrink: 0 }}>
<<<<<<< Updated upstream
                                                                    {mgr.imageurl ? <img src={mgr.imageurl} alt="" style={{ width: '100%', height: '100%', borderRadius: '6px', objectFit: 'cover' }} /> : '👔'}
=======
                                                                    {mgr.imageurl ? <img src={mgr.imageurl} alt="" style={{ width: '100%', height: '100%', borderRadius: '6px', objectFit: 'cover' }} /> : (
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                                            <circle cx="12" cy="7" r="4"></circle>
                                                                        </svg>
                                                                    )}
>>>>>>> Stashed changes
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                                                    <span style={{ fontSize: '0.85em', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {mgr.managername}
                                                                    </span>
                                                                    <span style={{ fontSize: '0.7em', color: '#a78bfa', fontWeight: '600' }}>
                                                                        {mgr.playstyle}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

<<<<<<< Updated upstream
                                            {/* BOOST EFFECTS DISPLAY */}
                                            {selectedManager && (
                                                <div style={{ marginTop: '8px', fontSize: '0.72em', color: '#a78bfa', fontWeight: '600' }}>
                                                    Boosts: {selectedManager.effects?.length > 0
                                                        ? selectedManager.effects.map(e => {
                                                            const name = (e.statName || e.statname || 'Unknown');
                                                            const label = name.charAt(0).toUpperCase() + name.slice(1);
                                                            return `${label} +${e.boost}`;
                                                        }).join(', ')
                                                        : 'No stat effects assigned'}
                                                </div>
                                            )}
=======
                                             {/* BOOST EFFECTS DISPLAY */}
                                             {selectedManager && (
                                                 <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                     {selectedManager.effects?.length > 0 ? (
                                                         selectedManager.effects.map((e, idx) => {
                                                             const rawName = (e.statName || e.statname || e.stat_name || e.stat || 'Unknown').trim();
                                                             const statMap = {
                                                                 offensiveawareness: 'Offensive Awareness',
                                                                 attackingawareness: 'Offensive Awareness',
                                                                 ballcontrol: 'Ball Control',
                                                                 dribbling: 'Dribbling',
                                                                 tightpossession: 'Tight Possession',
                                                                 lowpass: 'Low Pass',
                                                                 shortpass: 'Low Pass',
                                                                 groundpass: 'Low Pass',
                                                                 loftedpass: 'Lofted Pass',
                                                                 longpass: 'Lofted Pass',
                                                                 longball: 'Lofted Pass',
                                                                 highpass: 'Lofted Pass',
                                                                 passing: 'Passing',
                                                                 finishing: 'Finishing',
                                                                 shooting: 'Finishing',
                                                                 heading: 'Heading',
                                                                 placekicking: 'Place Kicking',
                                                                 freekick: 'Place Kicking',
                                                                 curl: 'Curl',
                                                                 curve: 'Curl',
                                                                 defensiveawareness: 'Defensive Awareness',
                                                                 defensiveengagement: 'Defensive Engagement',
                                                                 tackling: 'Tackling',
                                                                 aggression: 'Aggression',
                                                                 defending: 'Defending',
                                                                 gkawareness: 'Goalkeeping',
                                                                 goalkeeping: 'Goalkeeping',
                                                                 gkcatching: 'GK Catching',
                                                                 gkparrying: 'GK Parrying',
                                                                 gkreflexes: 'GK Reflexes',
                                                                 gkreach: 'GK Reach',
                                                                 speed: 'Speed',
                                                                 acceleration: 'Acceleration',
                                                                 kickingpower: 'Kicking Power',
                                                                 shotpower: 'Kicking Power',
                                                                 jump: 'Jump',
                                                                 jumping: 'Jump',
                                                                 physicalcontact: 'Physical Contact',
                                                                 physicality: 'Physical Contact',
                                                                 balance: 'Balance',
                                                                 stamina: 'Stamina'
                                                             };
                                                             const key = rawName.toLowerCase().replace(/[\s_\-]+/g, '');
                                                             const boostVal = e.boost || e.boostvalue || e.value || 0;
                                                             const label = statMap[key] || (rawName.charAt(0).toUpperCase() + rawName.slice(1));
                                                             return (
                                                                 <div key={idx} style={{ fontSize: '0.78em', color: '#22c55e', fontWeight: '800', letterSpacing: '0.3px' }}>
                                                                     {label} +{boostVal}
                                                                 </div>
                                                             );
                                                         })
                                                     ) : (
                                                         <div style={{ fontSize: '0.72em', color: '#94a3b8', fontWeight: '600' }}>
                                                             No stat effects assigned
                                                         </div>
                                                     )}
                                                 </div>
                                             )}
>>>>>>> Stashed changes
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* RIGHT SECTION: TACTICAL POSITION RATINGS BLOCK GRID */}
                            <PositionRatingsPitch 
                                baseOvr={boostedOvr} 
                                primaryPosition={primaryposition} 
                                playstyle={player.playstyle}
                                boostedStats={boostedStats}
                                customPrimaryPositions={data.primarypositions}
                                customSecondaryPositions={data.secondarypositions}
                            />

                    </div>

                    {/* LOWER SECTION: STATS / PROGRESSION SLIDERS / ATTRIBUTES */}
                    <div>
                        {!showReviews ? (
                            <>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginTop: '25px' }}>
                                    {/* EMBEDDED PROGRESSION SLIDERS PANEL (LEFT) WITH SECTION HEADER */}
                                    <div style={{ width: '270px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
<<<<<<< Updated upstream
                                        {isTrendingCard ? (
                                            <>
                                                <div style={{
                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                    color: '#94a3b8',
                                                    borderRadius: '8px',
                                                    padding: '8px 14px',
                                                    fontWeight: '900',
                                                    fontSize: '0.82em',
                                                    letterSpacing: '0.5px',
                                                    textAlign: 'center',
                                                    textTransform: 'uppercase',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px'
                                                }}>
                                                    LEVEL TRAINING (LOCKED)
                                                </div>
=======
                                        <div style={{
                                            background: '#00f2fe',
                                            color: '#000',
                                            borderRadius: '8px',
                                            padding: '8px 14px',
                                            fontWeight: '900',
                                            fontSize: '0.82em',
                                            letterSpacing: '0.5px',
                                            textAlign: 'center',
                                            textTransform: 'uppercase',
                                            boxShadow: '0 0 12px rgba(0, 242, 254, 0.4)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}>
                                            PLAYER PROGRESSION
                                        </div>
>>>>>>> Stashed changes

                                                <div style={{
                                                    background: '#0d1117',
                                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                                    borderRadius: '12px',
                                                    padding: '16px',
                                                    width: '270px',
                                                    boxSizing: 'border-box',
                                                    fontFamily: "'Outfit', sans-serif",
                                                    color: '#fff',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '14px'
                                                }}>
                                                    <div style={{
                                                        background: 'rgba(239, 68, 68, 0.08)',
                                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                                        borderRadius: '8px',
                                                        padding: '12px 14px',
                                                        color: '#f87171',
                                                        fontSize: '0.82em',
                                                        fontWeight: '700',
                                                        textAlign: 'center',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        <span>Trending & POTW players cannot undergo Level Training.</span>
                                                    </div>

                                                    {/* Card specifications badge block */}
                                                    <div style={{
                                                        background: 'rgba(255, 255, 255, 0.02)',
                                                        border: '1px solid rgba(255, 255, 255, 0.06)',
                                                        borderRadius: '10px',
                                                        padding: '12px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '10px'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78em' }}>
                                                            <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>EDITION</span>
                                                            <span style={{ color: '#00ff87', fontWeight: '900', background: 'rgba(0, 255, 135, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0, 255, 135, 0.2)' }}>
                                                                {cardtype.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78em' }}>
                                                            <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>MAX LEVEL</span>
                                                            <span style={{ color: '#fff', fontWeight: '900' }}>1 / 1</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78em' }}>
                                                            <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>TRAINING STATUS</span>
                                                            <span style={{ color: '#eab308', fontWeight: '900' }}>PRE-TRAINED</span>
                                                        </div>
                                                    </div>

                                                    <div style={{
                                                        fontSize: '0.74em',
                                                        color: '#64748b',
                                                        lineHeight: '1.45',
                                                        textAlign: 'center',
                                                        padding: '0 4px'
                                                    }}>
                                                        POTW and Trending cards are pre-trained with fixed optimal attributes upon release and cannot be manually trained.
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{
                                                    background: '#00f2fe',
                                                    color: '#000',
                                                    borderRadius: '8px',
                                                    padding: '8px 14px',
                                                    fontWeight: '900',
                                                    fontSize: '0.82em',
                                                    letterSpacing: '0.5px',
                                                    textAlign: 'center',
                                                    textTransform: 'uppercase',
                                                    boxShadow: '0 0 12px rgba(0, 242, 254, 0.4)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px'
                                                }}>
                                                    PLAYER PROGRESSION
                                                </div>

                                                <ProgressionSlidersPanel
                                                    primaryPosition={primaryposition}
                                                    levelCap={data.maxlevel || 32}
                                                    maxPoints={data.progressionpoints || 62}
                                                    allocations={allocations}
                                                    onAllocationChange={setAllocations}
                                                    onSmartAllocate={handleSmartAllocate}
                                                    onReset={handleResetAllocations}
                                                />
                                            </>
                                        )}
                                    </div>

                                    {/* 3-COLUMN CATEGORIZED ATTRIBUTE MATRIX (ATTACKING, DEFENDING, ATHLETICISM) (RIGHT) */}
                                    <div style={{ flex: 1 }}>
                                        <AttributeMatrixPanel stats={stats} boostedStats={boostedStats} />
                                    </div>
                                </div>

                                {/* PLAYER SKILLS, COM SKILLS, 3D MODEL & ENGINE PHYSICS PANEL */}
                                <PlayerSkillsPanel cardData={data} playerBio={player} stats={stats} />

                                {/* OTHER VERSIONS OF THIS PLAYER SECTION */}
                                <div data-html2canvas-ignore="true" style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.25em', fontWeight: '900', color: '#fff', letterSpacing: '0.5px' }}>
                                            Other Versions of {player.playername}
                                        </h3>
                                        <span style={{ fontSize: '0.85em', color: '#64748b', fontWeight: 'bold' }}>
                                            {otherVersions.length > 0 ? `${otherVersions.length} versions available` : '0 versions available'}
                                        </span>
                                    </div>

                                    {otherVersions.length > 0 ? (
                                        <div style={{
                                            display: 'flex',
                                            gap: '14px',
                                            overflowX: 'auto',
                                            paddingBottom: '12px',
                                            scrollbarWidth: 'thin'
                                        }}>
                                            {otherVersions.map(vCard => (
                                                <div 
                                                    key={vCard.cardid}
                                                    onClick={() => {
                                                        if (onSelectCard) onSelectCard(vCard.cardid);
                                                    }}
                                                    style={{
                                                        minWidth: '125px',
                                                        width: '125px',
                                                        background: 'linear-gradient(180deg, #182232 0%, #0d1117 100%)',
                                                        border: '1px solid rgba(56, 189, 248, 0.3)',
                                                        borderRadius: '10px',
                                                        padding: '10px',
                                                        cursor: 'pointer',
                                                        transition: 'transform 0.2s ease, borderColor 0.2s ease',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        position: 'relative'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#00f2fe'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)'; }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '6px' }}>
                                                        <span style={{ fontSize: '1.05em', fontWeight: '900', color: '#00f2fe' }}>{vCard.baseoverallrating}</span>
                                                        <span style={{ fontSize: '0.7em', fontWeight: 'bold', color: '#fff', background: '#1e293b', padding: '1px 5px', borderRadius: '4px' }}>{vCard.positioncode}</span>
                                                    </div>

                                                    <div style={{
                                                        width: '78px',
                                                        height: '92px',
                                                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                                        borderRadius: '8px',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginBottom: '8px'
                                                    }}>
                                                        <div style={{ fontSize: '0.65em', color: '#a78bfa', fontWeight: 'bold' }}>{vCard.cardtype}</div>
                                                        <div style={{ fontSize: '0.75em', fontWeight: '900', color: '#fff', textAlign: 'center', margin: '4px 0' }}>{vCard.playername}</div>
                                                    </div>

                                                    <div style={{ fontSize: '0.75em', fontWeight: 'bold', color: '#cbd5e1', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {vCard.playername}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.88em', color: '#64748b', fontStyle: 'italic', padding: '12px 0' }}>
                                            No other versions available for this player.
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div style={{ background: '#141414', padding: '25px', borderRadius: '15px', border: '1px solid #222' }}>
                                <h3 style={{ marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '10px' }}>⭐ Community Reviews ({reviews.length})</h3>

                                {currentUser && (
                                    <form style={{ marginBottom: '25px', background: '#1c1c1c', padding: '20px', borderRadius: '10px' }}>
                                        <h4 style={{ margin: '0 0 15px 0' }}>Post Card Review</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <input className="input-modern" type="number" placeholder="Matches Played" value={reviewForm.matchesPlayed} onChange={e => setReviewForm({ ...reviewForm, matchesPlayed: e.target.value })} required />
                                            <input className="input-modern" type="number" placeholder="Matches Won" value={reviewForm.matchesWon} onChange={e => setReviewForm({ ...reviewForm, matchesWon: e.target.value })} />
                                            <input className="input-modern" type="number" placeholder="Goals Scored" value={reviewForm.goals} onChange={e => setReviewForm({ ...reviewForm, goals: e.target.value })} />
                                            <input className="input-modern" type="number" placeholder="Assists" value={reviewForm.assists} onChange={e => setReviewForm({ ...reviewForm, assists: e.target.value })} />
                                            <input className="input-modern" type="number" placeholder="Clean Sheets" value={reviewForm.cleanSheets} onChange={e => setReviewForm({ ...reviewForm, cleanSheets: e.target.value })} />
                                            <input className="input-modern" type="number" step="0.1" max="10" placeholder="Rating (1-10)" value={reviewForm.averageRating} onChange={e => setReviewForm({ ...reviewForm, averageRating: e.target.value })} required />
                                        </div>
                                        <button type="submit" className="glowing-btn" style={{ width: '100%', marginTop: '15px' }}>Save Review</button>
                                    </form>
                                )}

                                {reviews.length === 0 ? <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '15px' }}>No reviews posted for this card yet.</div> : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {reviews.map(r => (
                                            <div key={r.reviewid} style={{ background: '#1c1c1c', padding: '15px', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '6px' }}>
                                                    <span style={{ color: '#00f2fe' }}>{r.username}</span>
                                                    <span style={{ color: '#4ade80' }}>⭐ {r.averagerating} / 10</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
            {/* BUILDS & COMMUNITY BUILDS MODAL (2-Column Rich eFHUB Style) */}
            {showBuildsModal && (() => {
                const getBuildAllocations = (b) => ({
                    shooting: b.finishing || b.shooting || 0,
                    passing: b.passing || 0,
                    dribbling: b.dribbling || 0,
                    dexterity: b.offensiveawareness || b.dexterity || 0,
                    lowerBody: b.speed || b.lowerbody || b.lowerBody || 0,
                    aerial: b.jump || b.aerial || 0,
                    defending: b.defensiveawareness || b.defending || 0,
                    gk1: b.gk1 || b.gkawareness || 0,
                    gk2: b.gk2 || b.gkcatching || 0,
                    gk3: b.gk3 || b.gkparrying || 0,
                });

                const renderBuildCardItem = (b, isMine = false) => {
                    const bAlloc = getBuildAllocations(b);
                    const bStats = calculateAllocatedStats(stats, bAlloc);

                    // Add manager effects if manager assigned to this build
                    const buildManagerId = b.managerid || b.ManagerID || b.manager_id;
                    const cardManager = managersList.find(m => 
                        (buildManagerId && String(m.managerid || m.ManagerID) === String(buildManagerId)) || 
                        (b.managername && (m.managername || m.managerName || '').toLowerCase() === String(b.managername).toLowerCase())
                    );
                    if (cardManager && (cardManager.statname || cardManager.statName)) {
                        const effStat = (cardManager.statname || cardManager.statName || '').toLowerCase();
                        const effVal = parseInt(cardManager.effectvalue || cardManager.effectValue || 2, 10);
                        if (effStat && bStats[effStat] !== undefined) {
                            bStats[effStat] = (parseInt(bStats[effStat], 10) || 60) + effVal;
                        }
                    }

                    const bOvr = calculatePositionOVR(bStats, primaryposition, baseoverallrating, data.maxoverallrating || 100, bAlloc);
                    const totalAllocatedPts = Object.values(bAlloc).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);
                    const isGk = primaryposition === 'GK';

                    const allocPills = [
                        { label: 'Finishing', icon: <TargetIcon size={22} />, val: bAlloc.shooting },
                        { label: 'Passing', icon: <BallIcon size={22} />, val: bAlloc.passing },
                        { label: 'Dribbling', icon: <TriangleIcon size={22} />, val: bAlloc.dribbling },
                        { label: 'Dexterity', icon: <ShuffleIcon size={22} />, val: bAlloc.dexterity },
                        { label: 'Lower Body', icon: <BootIcon size={22} />, val: bAlloc.lowerBody },
                        { label: 'Aerial Strength', icon: <DoubleUpIcon size={22} />, val: bAlloc.aerial },
                        { label: 'Defending', icon: <ShieldIcon size={22} />, val: bAlloc.defending },
                    ].filter(item => item.val > 0);

                    const gkPills = [
                        { label: 'GK 1', icon: <GloveIcon size={22} number={1} />, val: bAlloc.gk1 },
                        { label: 'GK 2', icon: <GloveIcon size={22} number={2} />, val: bAlloc.gk2 },
                        { label: 'GK 3', icon: <GloveIcon size={22} number={3} />, val: bAlloc.gk3 },
                    ].filter(item => item.val > 0);

                    const activePills = isGk ? gkPills : allocPills;

                    // Full attributes list matching eFHUB reference image 4
                    const attackingStatsList = [
                        { key: 'offensiveawareness', label: 'Attacking Awareness' },
                        { key: 'ballcontrol', label: 'Ball Control' },
                        { key: 'dribbling', label: 'Dribbling' },
                        { key: 'tightpossession', label: 'Tight Possession' },
                        { key: 'lowpass', label: 'Low Pass' },
                        { key: 'loftedpass', label: 'Lofted Pass' },
                        { key: 'finishing', label: 'Finishing' },
                        { key: 'heading', label: 'Heading' },
                        { key: 'placekicking', label: 'Set Piece Taking' },
                        { key: 'curl', label: 'Curl' },
                    ];

                    const athleticismStatsList = [
                        { key: 'speed', label: 'Speed' },
                        { key: 'acceleration', label: 'Acceleration' },
                        { key: 'kickingpower', label: 'Kicking Power' },
                        { key: 'jump', label: 'Jumping' },
                        { key: 'physicalcontact', label: 'Physical Contact' },
                        { key: 'balance', label: 'Balance' },
                        { key: 'stamina', label: 'Stamina' },
                    ];

                    const defendingStatsList = [
                        { key: 'defensiveawareness', label: 'Defensive Awareness' },
                        { key: 'defensiveengagement', label: 'Defensive Engagement' },
                        { key: 'tackling', label: 'Tackling' },
                        { key: 'aggression', label: 'Aggression' },
                        { key: 'gkawareness', label: 'Goalkeeping', isGkOnly: true },
                        { key: 'gkcatching', label: 'GK Catching', isGkOnly: true },
                        { key: 'gkparrying', label: 'GK Parrying', isGkOnly: true },
                        { key: 'gkreflexes', label: 'GK Reflexes', isGkOnly: true },
                        { key: 'gkreach', label: 'GK Reach', isGkOnly: true },
                    ];

                    const renderStatRow = (label, valKey, isGkOnly = false) => {
                        const isInactive = isGkOnly && !isGk;
                        const val = bStats[valKey] !== undefined ? bStats[valKey] : (stats[valKey] || 40);

                        let badgeBg = '#161e2b';
                        let badgeColor = '#475569';
                        let nameColor = '#475569';

                        if (!isInactive) {
                            const numVal = parseInt(val, 10);
                            if (numVal >= 90) {
                                badgeBg = '#00f2fe';
                                badgeColor = '#000';
                                nameColor = '#00f2fe';
                            } else if (numVal >= 80) {
                                badgeBg = '#22c55e';
                                badgeColor = '#000';
                                nameColor = '#4ade80';
                            } else if (numVal >= 70) {
                                badgeBg = '#eab308';
                                badgeColor = '#000';
                                nameColor = '#facc15';
                            } else {
                                badgeBg = '#ef4444';
                                badgeColor = '#fff';
                                nameColor = '#ef4444';
                            }
                        }

                        return (
                            <div key={label} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.73em',
                                marginBottom: '3px',
                                lineHeight: '1.2'
                            }}>
                                <span style={{
                                    color: isInactive ? '#334155' : nameColor,
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    paddingRight: '4px'
                                }}>
                                    {label}
                                </span>
                                <span style={{
                                    background: isInactive ? '#151d2a' : badgeBg,
                                    color: isInactive ? '#475569' : badgeColor,
                                    fontWeight: '900',
                                    fontSize: '0.9em',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    minWidth: '24px',
                                    textAlign: 'center',
                                    flexShrink: 0
                                }}>
                                    {val}
                                </span>
                            </div>
                        );
                    };

                    const rawSkills = data.skills || player.skills || [];
                    const skillsList = Array.isArray(rawSkills) 
                        ? rawSkills 
                        : (typeof rawSkills === 'string' ? rawSkills.split(',').map(s => s.trim()).filter(Boolean) : []);

                    const managerName = b.managername || cardManager?.managername || cardManager?.managerName || (buildManagerId ? `Manager #${buildManagerId}` : 'Default Manager');

                    return (
                        <div key={b.buildid || Math.random()} style={{
                            background: 'linear-gradient(135deg, #121824 0%, #0a0e17 100%)',
                            borderRadius: '14px',
                            border: '1px solid rgba(0, 242, 254, 0.2)',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                            position: 'relative'
                        }}>
                            {/* Top header row: Centered OVR Rating + Position */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        background: 'linear-gradient(135deg, #00f2fe 0%, #00b0ff 100%)',
                                        color: '#000',
                                        fontWeight: '900',
                                        fontSize: '1.25em',
                                        minWidth: '42px',
                                        height: '42px',
                                        padding: '0 4px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justify: 'center',
                                        textAlign: 'center',
                                        lineHeight: '1',
                                        flexShrink: 0,
                                        boxShadow: '0 0 10px rgba(0,242,254,0.3)',
                                        boxSizing: 'border-box'
                                    }}>
                                        <span style={{ width: '100%', textAlign: 'center', display: 'block', margin: 0, padding: 0, lineHeight: '1' }}>
                                            {bOvr}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                            background: '#22c55e',
                                            color: '#000',
                                            padding: '3px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.82em',
                                            fontWeight: '900',
                                            lineHeight: '1'
                                        }}>
                                            {primaryposition}
                                        </span>
                                        <span style={{ fontWeight: '900', fontSize: '1.05em', color: '#fff' }}>
                                            {b.buildname || 'Custom Build'}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ fontSize: '0.78em', color: '#94a3b8', fontWeight: 'bold' }}>
                                        by <span style={{ color: '#00f2fe' }}>{b.username || 'Community'}</span>
                                    </div>

                                    {isMine && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <button 
                                                onClick={() => handleToggleBuildPrivacy(b.buildid, b.ispublic)}
                                                style={{ background: '#1e293b', color: b.ispublic ? '#4ade80' : '#94a3b8', border: '1px solid #334155', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72em', fontWeight: 'bold', cursor: 'pointer' }}
                                            >
                                                {b.ispublic ? 'Public' : 'Private'}
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteBuild(b.buildid)}
                                                style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef4444aa', width: '24px', height: '24px', borderRadius: '4px', fontSize: '0.8em', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Delete Build"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Category Allocations Row */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: '#080c14', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                {activePills.length === 0 ? (
                                    <span style={{ fontSize: '0.75em', color: '#64748b', fontStyle: 'italic' }}>No points allocated</span>
                                ) : (
                                    activePills.map((pill, idx) => (
                                        <span key={idx} title={pill.label} style={{
                                            background: '#141c2b',
                                            color: '#cbd5e1',
                                            border: '1px solid rgba(0,242,254,0.2)',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '0.78em',
                                            fontWeight: '900',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            lineHeight: 1
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: '22px', height: '22px' }}>{pill.icon}</span>
                                            <span style={{ color: '#00f2fe', fontWeight: '900', minWidth: '14px', textAlign: 'center' }}>{pill.val}</span>
                                        </span>
                                    ))
                                )}
                            </div>

                            {/* Full 3-Column Attributes Grid matching playercard order: ATTACKING, DEFENDING, ATHLETICISM */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: '#070a12', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                {/* Column 1: ATTACKING */}
                                <div>
                                    <div style={{ fontSize: '0.7em', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: '900', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '3px' }}>
                                        ATTACKING
                                    </div>
                                    {attackingStatsList.map(s => renderStatRow(s.label, s.key))}
                                </div>

                                {/* Column 2: DEFENDING */}
                                <div>
                                    <div style={{ fontSize: '0.7em', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: '900', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '3px' }}>
                                        DEFENDING
                                    </div>
                                    {defendingStatsList.map(s => renderStatRow(s.label, s.key, s.isGkOnly))}
                                </div>

                                {/* Column 3: ATHLETICISM */}
                                <div>
                                    <div style={{ fontSize: '0.7em', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8', fontWeight: '900', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '3px' }}>
                                        ATHLETICISM
                                    </div>
                                    {athleticismStatsList.map(s => renderStatRow(s.label, s.key))}
                                </div>
                            </div>

                            {/* Manager row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 0' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                                <span style={{ fontSize: '0.82em', fontWeight: 'bold', color: '#cbd5e1' }}>
                                    {managerName}
                                </span>
                            </div>

                            {/* Skills Row */}
                            {skillsList.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {skillsList.map((skill, idx) => (
                                        <span key={idx} style={{
                                            background: '#162032',
                                            color: '#94a3b8',
                                            border: '1px solid #28374d',
                                            padding: '3px 8px',
                                            borderRadius: '5px',
                                            fontSize: '0.73em',
                                            fontWeight: 'bold'
                                        }}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Footer Action Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '4px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button 
                                        onClick={() => handleReaction(b.buildid, 'LIKE')} 
                                        style={{ background: b.my_reaction === 'LIKE' ? '#22c55e22' : '#0f172a', color: b.my_reaction === 'LIKE' ? '#4ade80' : '#888', border: '1px solid #334155', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75em', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                        </svg>
                                        <span>{b.likes || 0}</span>
                                    </button>
                                    <button 
                                        onClick={() => handleReaction(b.buildid, 'DISLIKE')} 
                                        style={{ background: b.my_reaction === 'DISLIKE' ? '#ef444422' : '#0f172a', color: b.my_reaction === 'DISLIKE' ? '#ef4444' : '#888', border: '1px solid #334155', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75em', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
                                        </svg>
                                        <span>{b.dislikes || 0}</span>
                                    </button>
                                </div>

                                <button 
                                    onClick={() => { handleLoadBuild(b); setShowBuildsModal(false); }}
                                    style={{ background: 'linear-gradient(135deg, #00f2fe 0%, #00b0ff 100%)', color: '#000', border: 'none', padding: '7px 16px', borderRadius: '6px', fontWeight: '900', fontSize: '0.8em', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0, 242, 254, 0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                                >
                                    TRY BUILD
                                </button>
                            </div>
                        </div>
                    );
                };

                const proAlloc = autoAllocatePoints(stats, primaryposition, data.progressionpoints || 62);
                const proBuildObj = {
                    buildid: 'pro_auto_1',
                    buildname: 'Official Auto Allocation (Max OVR)',
                    username: 'eFVerse Pro AI',
                    likes: 99,
                    dislikes: 0,
                    finishing: proAlloc.shooting,
                    passing: proAlloc.passing,
                    dribbling: proAlloc.dribbling,
                    offensiveawareness: proAlloc.dexterity,
                    speed: proAlloc.lowerBody,
                    jump: proAlloc.aerial,
                    defensiveawareness: proAlloc.defending,
                    gk1: proAlloc.gk1,
                    gk2: proAlloc.gk2,
                    gk3: proAlloc.gk3
                };

                const filteredCommunityBuilds = communityBuildsList.filter(b => {
                    if (buildPositionFilter !== 'ALL' && primaryposition !== buildPositionFilter) return false;
                    return true;
                }).sort((a, b) => {
                    if (buildSortFilter === 'top_voted') return (b.likes || 0) - (a.likes || 0);
                    if (buildSortFilter === 'highest_ovr') {
                        const allocA = getBuildAllocations(a);
                        const allocB = getBuildAllocations(b);
                        const statsA = calculateAllocatedStats(stats, allocA);
                        const statsB = calculateAllocatedStats(stats, allocB);
                        const ovrA = calculatePositionOVR(statsA, primaryposition, baseoverallrating, data.maxoverallrating || 100, allocA);
                        const ovrB = calculatePositionOVR(statsB, primaryposition, baseoverallrating, data.maxoverallrating || 100, allocB);
                        return ovrB - ovrA;
                    }
                    return 0;
                });

                return (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <div style={{ background: '#0b0f19', width: '100%', maxWidth: '1050px', borderRadius: '18px', border: '1px solid rgba(0, 242, 254, 0.3)', padding: '24px', color: '#fff', boxShadow: '0 12px 50px rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            
                            {/* Modal Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    {player.imageurl && (
                                        <img src={player.imageurl} alt={player.playername} style={{ width: '42px', height: '52px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(0, 242, 254, 0.4)' }} />
                                    )}
                                    <div>
                                        <div style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '1px', color: '#00f2fe', fontWeight: 'bold' }}>
                                            PROGRESSION BUILDS
                                        </div>
                                        <h2 style={{ margin: 0, fontSize: '1.4em', fontWeight: '900', color: '#fff' }}>
                                            {player.playername || 'Player Builds'}
                                        </h2>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setShowBuildsModal(false)}
                                    style={{ background: '#1e293b', color: '#94a3b8', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Modal Top Tabs */}
                            <div style={{ display: 'flex', gap: '10px', background: '#060910', padding: '6px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <button 
                                    onClick={() => setBuildsModalTab('community')}
                                    style={{ flex: 1, padding: '10px', background: buildsModalTab === 'community' ? 'linear-gradient(135deg, #00f2fe 0%, #00b0ff 100%)' : 'transparent', color: buildsModalTab === 'community' ? '#000' : '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '0.85em', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    <span>COMMUNITY ({communityBuildsList.length})</span>
                                </button>
                                <button 
                                    onClick={() => setBuildsModalTab('mine')}
                                    style={{ flex: 1, padding: '10px', background: buildsModalTab === 'mine' ? 'linear-gradient(135deg, #00f2fe 0%, #00b0ff 100%)' : 'transparent', color: buildsModalTab === 'mine' ? '#000' : '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '0.85em', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    <span>MY BUILDS ({myBuildsList.length})</span>
                                </button>
                                <button 
                                    onClick={() => setBuildsModalTab('save')}
                                    style={{ flex: 1, padding: '10px', background: buildsModalTab === 'save' ? '#22c55e' : 'transparent', color: buildsModalTab === 'save' ? '#000' : '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '0.85em', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    <span>SAVE CONCEPT</span>
                                </button>
                            </div>

                            {/* Sub Header Filters Bar (for community, pro, mine) */}
                            {buildsModalTab !== 'save' && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#090d16', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <select 
                                            value={buildPositionFilter} 
                                            onChange={(e) => setBuildPositionFilter(e.target.value)}
                                            style={{ background: '#131a26', color: '#fff', border: '1px solid #334155', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8em', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="ALL">ALL POSITIONS</option>
                                            <option value={primaryposition}>{primaryposition}</option>
                                        </select>

                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button 
                                                onClick={() => setBuildSortFilter('top_voted')}
                                                style={{ background: buildSortFilter === 'top_voted' ? '#00f2fe22' : 'transparent', color: buildSortFilter === 'top_voted' ? '#00f2fe' : '#94a3b8', border: buildSortFilter === 'top_voted' ? '1px solid #00f2fe' : '1px solid #334155', padding: '5px 12px', borderRadius: '6px', fontSize: '0.78em', fontWeight: 'bold', cursor: 'pointer' }}
                                            >
                                                TOP VOTED
                                            </button>
                                            <button 
                                                onClick={() => setBuildSortFilter('highest_ovr')}
                                                style={{ background: buildSortFilter === 'highest_ovr' ? '#00f2fe22' : 'transparent', color: buildSortFilter === 'highest_ovr' ? '#00f2fe' : '#94a3b8', border: buildSortFilter === 'highest_ovr' ? '1px solid #00f2fe' : '1px solid #334155', padding: '5px 12px', borderRadius: '6px', fontSize: '0.78em', fontWeight: 'bold', cursor: 'pointer' }}
                                            >
                                                HIGHEST OVR
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '0.78em', color: '#64748b', fontStyle: 'italic' }}>
                                        Click "TRY BUILD" to preview stats live
                                    </div>
                                </div>
                            )}

                            {/* Tab 1: COMMUNITY BUILDS (2-Column Grid) */}
                            {buildsModalTab === 'community' && (
                                <div style={{ maxHeight: '480px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {filteredCommunityBuilds.length === 0 ? (
                                        <div style={{ color: '#64748b', textAlign: 'center', padding: '50px 20px', fontStyle: 'italic' }}>
                                            No community builds published for this card yet.<br/>Be the first to save and share your build with the eFVerse community!
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '16px' }}>
                                            {filteredCommunityBuilds.map(b => renderBuildCardItem(b, false))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 3: MY BUILDS (2-Column Grid) */}
                            {buildsModalTab === 'mine' && (
                                <div style={{ maxHeight: '480px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {myBuildsList.length === 0 ? (
                                        <div style={{ color: '#64748b', textAlign: 'center', padding: '50px 20px', fontStyle: 'italic' }}>
                                            No custom progression builds saved for this card yet.<br/>Click "SAVE CONCEPT" to save your custom build!
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '16px' }}>
                                            {myBuildsList.map(b => renderBuildCardItem(b, true))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 4: SAVE CONCEPT FORM */}
                            {buildsModalTab === 'save' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85em', color: '#94a3b8', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Build Title / Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Max Dribbling & Speed Concept" 
                                            value={saveBuildForm.name} 
                                            onChange={(e) => setSaveBuildForm(prev => ({ ...prev, name: e.target.value }))}
                                            style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #334155', background: '#0a0d14', color: '#fff', fontSize: '0.9em', outline: 'none' }} 
                                        />
                                    </div>

                                    {/* SHARE WITH COMMUNITY CHECKBOX */}
                                    <div style={{ background: '#0a0d14', padding: '14px', borderRadius: '10px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9em', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={saveBuildForm.isPublic} 
                                                onChange={(e) => setSaveBuildForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                                                style={{ width: '18px', height: '18px', accentColor: '#00f2fe', cursor: 'pointer' }}
                                            />
                                            <span>Share this build with eFVerse Community</span>
                                        </label>
                                        <div style={{ fontSize: '0.78em', color: '#64748b', marginTop: '6px', paddingLeft: '30px' }}>
                                            {saveBuildForm.isPublic 
                                                ? "Public: Your custom build will be saved in 'MY BUILDS' AND published to 'COMMUNITY BUILDS' for all eFVerse users!"
                                                : "Private: Your build will only be saved in your personal 'MY BUILDS'."}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleSaveCustomBuild}
                                        style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #00f2fe 0%, #00b0ff 100%)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '0.95em', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)' }}
                                    >
                                        SAVE & PUBLISH BUILD
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                );
            })()}
      {dialog && (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, padding: '20px', fontFamily: "'Outfit', sans-serif"
        }}>
            <div style={{
                background: '#111722',
                border: dialog.type === 'danger' ? '1px solid rgba(239, 68, 68, 0.4)' : dialog.type === 'success' ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(0, 242, 254, 0.4)',
                borderRadius: '16px',
                padding: '30px',
                maxWidth: '450px',
                width: '100%',
                color: '#fff',
                boxShadow: dialog.type === 'danger' ? '0 10px 40px rgba(239, 68, 68, 0.25)' : dialog.type === 'success' ? '0 10px 40px rgba(74, 222, 128, 0.25)' : '0 10px 40px rgba(0, 242, 254, 0.25)',
                textAlign: 'center',
                animation: 'fadeIn 0.2s ease'
            }}>
                <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
                    {dialog.type === 'danger' ? (
                        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    ) : dialog.type === 'success' ? (
                        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    ) : (
                        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    )}
                </div>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1.4em', fontWeight: '900', color: dialog.type === 'danger' ? '#ef4444' : dialog.type === 'success' ? '#4ade80' : '#00f2fe' }}>
                    {dialog.title}
                </h3>
                <p style={{ margin: '0 0 25px 0', color: '#94a3b8', fontSize: '0.95em', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {dialog.message}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    {dialog.onCancel && (
                        <button 
                            onClick={() => {
                                if (dialog.onCancel) dialog.onCancel();
                                setDialog(null);
                            }}
                            style={{
                                flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #334155',
                                background: 'transparent', color: '#94a3b8', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s'
                            }}
                        >
                            Cancel
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            if (dialog.onConfirm) dialog.onConfirm();
                            setDialog(null);
                        }}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                            background: dialog.type === 'danger' 
                                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                                : dialog.type === 'success' ? 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' : 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                            color: dialog.type === 'danger' || dialog.type === 'success' ? '#fff' : '#000',
                            fontWeight: 'bold', cursor: 'pointer', transition: '0.2s',
                            boxShadow: dialog.type === 'danger' ? '0 4px 14px rgba(239, 68, 68, 0.4)' : dialog.type === 'success' ? '0 4px 14px rgba(34, 197, 94, 0.4)' : '0 4px 14px rgba(0, 242, 254, 0.3)'
                        }}
                    >
                        {dialog.confirmText || 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
      )}

        </div>
    );
}