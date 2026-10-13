import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
export const ATTACKING_PLAYSTYLES = [
  'Goal Poacher',
  'Fox in the Box',
  'Target Man',
  'Deep-Lying Forward',
  'Creative Playmaker',
  'Roaming Flank',
  'Prolific Winger',
  'Cross Specialist',
  'Classic No. 10',
  'Hole Player',
  'Box-to-Box',
  'Anchor Man',
  'The Destroyer',
  'Orchestrator',
  'Offensive Full-back',
  'Full-back Finisher',
  'Defensive Full-back',
  'Extra Frontman',
  'Build Up',
  'Offensive GK',
  'Defensive GK',
  'Dummy Runner'
];

export const DEFENSIVE_PLAYSTYLES = [
  'Front Line Pressure',
  'Front Line Poacher',
  'Attack Outlet',
  'Pass Disruptor',
  'Box-to-Box',
  'All Action Defender',
  'Anchor Man',
  'Covering Role',
  'High Line Master',
  'The Destroyer',
  'Sweeper GK',
  'Offensive GK',
  'Defensive GK'
];

import BoosterHexagonIcon from './BoosterHexagonIcon';
import { EFOOTBALL_BOOSTERS, BOOSTER_CATEGORIES, getBoosterByName, formatStatName, getBoosterStatLabels } from './efootballBoosters';
import { getManagerPhotoUrl, registerClubLogo } from './badgeAssetEngine';
import { IoIosExit } from "react-icons/io";
import { IoMdExit } from "react-icons/io";
import { IoMdClose } from "react-icons/io";

axios.defaults.withCredentials = true;



const BoosterTypeSelect = ({ value, onChange, label = "Booster Type", accentColor = 'rgba(0, 242, 254, 0.4)' }) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const options = [
        { value: 'ALL', label: 'All Booster Types', type: null, color: '#e2e8f0' },
        { value: 'SPECIAL', label: 'Special / Named', type: 'SPECIAL', color: '#a855f7' },
        { value: 'STANDARD', label: 'Standard', type: 'STANDARD', color: '#38bdf8' },
        { value: 'TOTAL_PACKAGE', label: 'Total Package', type: 'CRAFTABLE', color: '#fbbf24' },
        { value: 'POTW', label: 'POTW', type: 'POTW', color: '#22c55e' }
    ];

    const currentOpt = options.find(o => o.value === (value || 'ALL')) || options[0];

    return (
        <div ref={containerRef} style={{ position: 'relative', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.62em', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                {label}
            </label>
            <div
                onClick={() => setOpen(!open)}
                style={{
                    background: '#121214',
                    border: `1px solid ${currentOpt.value !== 'ALL' ? currentOpt.color : accentColor}`,
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '0.75em',
                    fontWeight: 'bold',
                    color: currentOpt.color,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    userSelect: 'none',
                    boxShadow: open ? `0 0 8px ${currentOpt.color}44` : 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {currentOpt.type ? (
                        <BoosterHexagonIcon type={currentOpt.type} size={18} />
                    ) : (
                        <span style={{ width: '18px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>✦</span>
                    )}
                    <span>{currentOpt.label}</span>
                </div>
                <span style={{ fontSize: '9px', color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
            </div>

            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: '#141822',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.85)',
                    zIndex: 9999,
                    overflow: 'hidden'
                }}>
                    {options.map(opt => (
                        <div
                            key={opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setOpen(false);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 12px',
                                fontSize: '0.78em',
                                fontWeight: 'bold',
                                color: opt.color,
                                cursor: 'pointer',
                                background: opt.value === currentOpt.value ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                transition: 'background 0.12s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = opt.value === currentOpt.value ? 'rgba(255, 255, 255, 0.1)' : 'transparent'}
                        >
                            {opt.type ? (
                                <BoosterHexagonIcon type={opt.type} size={20} />
                            ) : (
                                <span style={{ width: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>✦</span>
                            )}
                            <span>{opt.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const parseBoosterHelper = (str, defaultVal = 4) => {
    if (!str || str.toLowerCase() === 'none' || str.toLowerCase() === 'no booster') {
        return { name: 'none', val: 0 };
    }
    if (str.toLowerCase() === 'craftable slot') return { name: 'Craftable Slot', val: 0 };
    const match = str.match(/\+(\d+)/);
    const val = match ? parseInt(match[1], 10) : defaultVal;
    let clean = str.replace(/\+\d+/, '').trim();
    const bObj = getBoosterByName(clean);
    if (bObj) {
        clean = bObj.name;
    }
    return { name: clean, val: val };
};

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('player'); 
  const [mgmtTab, setMgmtTab] = useState('database'); 
  
  const [message, setMessage] = useState('');
  const [dialog, setDialog] = useState(null);

  // Sync admin tab with browser URL & history
  useEffect(() => {
    const handlePopState = () => {
      const path = (window.location.pathname || '').toLowerCase();
      if (path.startsWith('/admin/')) {
        const tab = path.split('/admin/')[1]?.split('/')[0];
        if (['player', 'card', 'stats', 'status', 'manager', 'boosts', 'clubs'].includes(tab)) {
          setActiveTab(tab);
        }
      } else if (path === '/admin') {
        setActiveTab('player');
      }
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabSelect = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'clubs') { setMgmtTab('clubs'); fetchClubs(); }
    setMessage('');
    const targetPath = `/admin/${tabKey}`;
    if (window.location.pathname.toLowerCase() !== targetPath) {
      window.history.pushState({ path: targetPath }, '', targetPath);
    }
  };

 
  const [helpers, setHelpers] = useState({ leagues: [], nations: [], positions: [] });
  const [playersList, setPlayersList] = useState([]); 
  const [cardsList, setCardsList] = useState([]); 
  const [managersList, setManagersList] = useState([]); 
 
  const [formTypes, setFormTypes] = useState([]); 
  const [injuryTypes, setInjuryTypes] = useState([]);
  const [statTypes, setStatTypes] = useState([]); 
  
  
  const [formClubs, setFormClubs] = useState([]); 
  const [mgmtClubs, setMgmtClubs] = useState([]);

  const [clubsList, setClubsList] = useState([]);
  const [clubSearch, setClubSearch] = useState('');
  const [clubLeagueFilter, setClubLeagueFilter] = useState('');
  const [clubForm, setClubForm] = useState({ clubname: '', leagueid: '', logourl: '' });
  const [editingClub, setEditingClub] = useState(null);



  const [playerForm, setPlayerForm] = useState({ playername: '', age: '', leagueid: '', clubid: '', nationalityid: '' });
  const [cardForm, setCardForm] = useState({ 
      playerid: '', 
      cardtype: 'Standard', 
      positioncode: '', 
      baseoverallrating: 75, 
      currentoverallrating: 75, 
      maxoverallrating: 85, 
      gpcost: '', 
      cardimageurl: '',
      attacking_playstyle: 'Goal Poacher',
      defensive_playstyle: '',
      attacking_playstyle_icon: '',
      defensive_playstyle_icon: ''
  });
  const [managerForm, setManagerForm] = useState({
      managername: '',
      playstyle: 'Possession Game',
      leagueid: '',
      clubid: '',
      nationalityid: '',
      possession_game: 89,
      quick_counter: 70,
      long_ball_counter: 70,
      out_wide: 65,
      long_ball: 60
  });
  const [statsForm, setStatsForm] = useState({ cardid: '', offensiveawareness: 60, finishing: 60, ballcontrol: 60, dribbling: 60, passing: 60, kickingpower: 60, speed: 60, acceleration: 60, stamina: 60, balance: 60, physicalcontact: 60, jump: 60, defensiveawareness: 40, tackling: 40, aggression: 40, gkawareness: 40, gkcatching: 40, gkparrying: 40, gkreflexes: 40, gkreach: 40 });
  

  const [statusForm, setStatusForm] = useState({ playerid: '', formtypeid: '', injurytypeid: '' });


  const [boostForm, setBoostForm] = useState({
      managerid: '',
      boost1: { statName: '', value: 1 },
      boost2: { statName: '', value: 1 },
      linkup_type: '',
      linkup_centerpiece: '',
      linkup_keyman: '',
      linkup_positions: ''
  });


  const [mgmtSearch, setMgmtSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]); 
  const [mgmtFilters, setMgmtFilters] = useState({ leagueId: '', clubId: '', nationId: '', cardType: '', posCode: '' });
  const [mgmtResults, setMgmtResults] = useState([]);

  // --- MANAGERS TAB FILTERS ---
  // Same idea as the Players "Database Filter" above, but for the Managers list.
  // Instead of "cardType" (which only makes sense for player cards) we filter by "playstyle".
  const [managerSearch, setManagerSearch] = useState('');
  const [managerFilters, setManagerFilters] = useState({ leagueId: '', clubId: '', nationId: '', playstyle: '' });
  const [managerFilterClubs, setManagerFilterClubs] = useState([]); // clubs list scoped to managerFilters.leagueId


  const [editingCard, setEditingCard] = useState(null);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [editModalError, setEditModalError] = useState('');
  const [editModalSuccess, setEditModalSuccess] = useState('');
  const [editModalSubTab, setEditModalSubTab] = useState('card');
  const [editForm, setEditForm] = useState({
      cardtype: 'Standard',
      positioncode: 'AMF',
      baseoverallrating: 80,
      currentoverallrating: 80,
      maxoverallrating: 90,
      primarypositions: '',
      secondarypositions: '',
      booster1: 'Off the ball +4',
      booster2: 'Technique +3',
      booster1_name: 'Off the ball',
      booster1_val: 4,
      booster1_type: 'ALL',
      booster2_name: 'Technique',
      booster2_val: 3,
      booster2_type: 'ALL',
      tierbadge: 'S+',
      livecondition: 'B',
      gpcost: '',
      skills: '',
      comskills: '',
      // Player Model Metrics
      height: 180,
      weight: 75,
      preferredfoot: 'Right',
      playstyle: 'Hole Player',
      attacking_playstyle: 'Goal Poacher',
      defensive_playstyle: '',
      attacking_playstyle_icon: '',
      defensive_playstyle_icon: '',
      armlength: 12,
      shoulderwidth: 5,
      necklength: 4,
      chestmeasurement: 6,
      necksize: 7,
      shoulderheight: 11,
      leglength: 14,
      thighsize: 5,
      waistsize: 9,
      armsize: 5,
      calfsize: 3
  });

  // MANAGER EDIT STATE
  const [editingManager, setEditingManager] = useState(null);
  const [editManagerClubs, setEditManagerClubs] = useState([]);
  const [editManagerForm, setEditManagerForm] = useState({
      managername: '',
      playstyle: 'Possession Game',
      leagueid: '',
      clubid: '',
      nationalityid: '',
      possession_game: 89,
      quick_counter: 70,
      long_ball_counter: 70,
      out_wide: 65,
      long_ball: 60,
      linkup_type: '',
      linkup_centerpiece: '',
      linkup_keyman: '',
      linkup_positions: '',
      boost1_stat: '',
      boost1_val: 1,
      boost2_stat: '',
      boost2_val: 1
  });

  const handleOpenEditManager = async (manager) => {
      try {
          let b1 = { statName: '', value: 1 };
          let b2 = { statName: '', value: 1 };
          try {
              const res = await axios.get(`http://localhost:5001/api/managers/boosts/${manager.managerid}`);
              if (res.data && res.data.length > 0) {
                  b1 = { statName: res.data[0].statname || '', value: res.data[0].boostvalue || 1 };
                  if (res.data.length > 1) {
                      b2 = { statName: res.data[1].statname || '', value: res.data[1].boostvalue || 1 };
                  }
              }
          } catch (e) {
              console.warn("Could not fetch boosts for edit:", e);
          }

          setEditingManager(manager);
          setEditManagerForm({
              managername: manager.managername || '',
              playstyle: manager.playstyle || 'Possession Game',
              leagueid: manager.leagueid || '',
              clubid: manager.clubid || '',
              nationalityid: manager.nationalityid || '',
              possession_game: manager.possession_game || 89,
              quick_counter: manager.quick_counter || 70,
              long_ball_counter: manager.long_ball_counter || 70,
              out_wide: manager.out_wide || 65,
              long_ball: manager.long_ball || 60,
              linkup_type: manager.linkup_type || '',
              linkup_centerpiece: manager.linkup_centerpiece || '',
              linkup_keyman: manager.linkup_keyman || '',
              linkup_positions: manager.linkup_positions || '',
              boost1_stat: b1.statName,
              boost1_val: b1.value,
              boost2_stat: b2.statName,
              boost2_val: b2.value
          });
      } catch (err) {
          console.error("Error opening edit manager:", err);
          setMessage("❌ Error opening Edit Manager window.");
      }
  };

  const handleSaveEditManager = async (e) => {
      e.preventDefault();
      if (!editingManager) return;
      const boosts = [];
      if (editManagerForm.boost1_stat) boosts.push({ statName: editManagerForm.boost1_stat, value: editManagerForm.boost1_val });
      if (editManagerForm.boost2_stat) boosts.push({ statName: editManagerForm.boost2_stat, value: editManagerForm.boost2_val });

      try {
          await axios.put(`http://localhost:5001/api/managers/update/${editingManager.managerid}`, {
              ...editManagerForm,
              boosts
          });
          setMessage(`✅ Manager "${editManagerForm.managername}" updated successfully!`);
          setEditingManager(null);
          fetchManagers();
      } catch (err) {
          console.error("Error saving manager edit:", err);
          setMessage("❌ Error updating manager.");
      }
  };

  const handleOpenEditCard = async (cardItem) => {
    try {
        const res = await axios.get(`http://localhost:5001/api/players/view-card/${cardItem.cardid}`);
        const c = res.data;
        const p = c.player || {};
        const m = p.modelMetrics || {};
        
        setEditingCard(c);
        setEditModalSubTab('card');
        setEditForm({
            cardtype: c.cardtype || 'Standard',
            positioncode: c.positioncode || c.primaryposition || 'AMF',
            baseoverallrating: c.baseoverallrating || 80,
            currentoverallrating: c.currentoverallrating || 80,
            maxoverallrating: c.maxoverallrating || 90,
            maxlevel: c.maxlevel || 32,
            progressionpoints: c.progressionpoints || 62,
            primarypositions: Array.isArray(c.primarypositions) ? c.primarypositions.join(', ') : '',
            secondarypositions: Array.isArray(c.secondarypositions) ? c.secondarypositions.join(', ') : '',
            booster1: c.booster1 || 'Off the ball +4',
            booster2: c.booster2 || 'Technique +3',
            booster1_name: parseBoosterHelper(c.booster1 || 'none', 4).name,
            booster1_val: parseBoosterHelper(c.booster1 || 'none', 4).val,
            booster1_type: c.booster1_type || ((c.cardtype === 'POTW' || c.cardtype === 'Trending') ? 'POTW' : 'STANDARD'),
            booster2_name: parseBoosterHelper(c.booster2 || 'none', 3).name,
            booster2_val: parseBoosterHelper(c.booster2 || 'none', 3).val,
            booster2_type: c.booster2_type || ((c.cardtype === 'POTW' || c.cardtype === 'Trending') ? 'POTW' : 'STANDARD'),
            tierbadge: c.tierbadge || 'S+',
            livecondition: c.livecondition || 'B',
            gpcost: c.gpcost || '',
            cardimageurl: c.cardimageurl || c.imageurl || '',
            // FIXED: Fall back to '' so placeholders show when array is empty or undefined
            skills: Array.isArray(c.skills) ? c.skills.join(', ') : (c.skills || ''),
            comskills: Array.isArray(c.comskills) ? c.comskills.join(', ') : (c.comskills || ''),
            height: p.height || 180,
            weight: p.weight || 75,
            preferredfoot: p.preferredfoot || 'Right',
            playstyle: c.attacking_playstyle || p.attacking_playstyle || p.playstyle || 'Goal Poacher',
            attacking_playstyle: c.attacking_playstyle || p.attacking_playstyle || p.playstyle || 'Goal Poacher',
            defensive_playstyle: c.defensive_playstyle || p.defensive_playstyle || '',
            attacking_playstyle_icon: c.attacking_playstyle_icon || p.attacking_playstyle_icon || '',
            defensive_playstyle_icon: c.defensive_playstyle_icon || p.defensive_playstyle_icon || '',
            armlength: m.armlength || 12,
            shoulderwidth: m.shoulderwidth || 5,
            necklength: m.necklength || 4,
            chestmeasurement: m.chestmeasurement || 6,
            necksize: m.necksize || 7,
            shoulderheight: m.shoulderheight || 11,
            leglength: m.leglength || 14,
            thighsize: m.thighsize || 5,
            waistsize: m.waistsize || 9,
            armsize: m.armsize || 5,
            calfsize: m.calfsize || 3
        });
    } catch (err) {
        console.error("Error opening edit card:", err);
        setMessage("❌ Error opening Edit Card window.");
    }
};

  const handleSaveEditCard = async (e) => {
      e.preventDefault();
      if (!editingCard) return;
      try {
          // 1. Update Card attributes & skills & boosters
          const b1Formatted = (!editForm.booster1_name || editForm.booster1_name === 'none') 
              ? 'none' 
              : `${editForm.booster1_name} +${editForm.booster1_val || 4}`;
          const b2Formatted = (!editForm.booster2_name || editForm.booster2_name === 'none') 
              ? 'none' 
              : (editForm.booster2_name === 'Craftable Slot' 
                  ? 'Craftable Slot' 
                  : `${editForm.booster2_name} +${editForm.booster2_val || 3}`);
          
          const isTrendingCardType = (editForm.cardtype || '').toUpperCase() === 'POTW' || (editForm.cardtype || '').toUpperCase() === 'TRENDING';
           const defType = isTrendingCardType ? 'POTW' : 'STANDARD';
           const finalB1Type = (editForm.booster1_type && editForm.booster1_type !== 'ALL') ? editForm.booster1_type : defType;
           const finalB2Type = (editForm.booster2_type && editForm.booster2_type !== 'ALL') ? editForm.booster2_type : defType;

           const payload = {
               ...editForm,
               booster1: b1Formatted,
               booster2: b2Formatted,
               booster1_type: finalB1Type,
               booster2_type: finalB2Type
           };
          await axios.put(`http://localhost:5001/api/players/update-card/${editingCard.cardid}`, payload);
          // 2. Update Player 3D model & physics metrics
          if (editingCard.playerid || editingCard.player?.playerid) {
              const pid = editingCard.playerid || editingCard.player?.playerid;
              await axios.put(`http://localhost:5001/api/players/update-player-model/${pid}`, editForm);
          }
          setMessage(`✅ Card #${editingCard.cardid} & Player 3D Model updated successfully!`);
          setEditingCard(null);
          fetchAllData();
          handleMgmtSearch();
      } catch (err) {
          console.error("Error saving card edits:", err);
          setMessage("❌ Error updating card.");
      }
  };

  const fetchAllData = () => {
    fetchHelpers(); fetchPlayers(); fetchCards(); fetchManagers(); fetchClubs();
    fetchFormTypes(); fetchInjuryTypes(); fetchStatTypes(); 
  };

  // INITIAL COMPONENT MOUNT - FETCH EVERYTHING
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchFormTypes = async () => { try { const res = await axios.get('http://localhost:5001/api/forms/types'); setFormTypes(res.data); } catch (err) { console.error(err); } };
  const fetchInjuryTypes = async () => { try { const res = await axios.get('http://localhost:5001/api/injuries/types'); setInjuryTypes(res.data); } catch (err) { console.error(err); } };
  const fetchStatTypes = async () => { try { const res = await axios.get('http://localhost:5001/api/managers/stats'); setStatTypes(res.data); } catch (err) { console.error(err); } };

  
  useEffect(() => {
    if (mgmtSearch.trim().length < 2) { setSuggestions([]); return; }
    const delay = setTimeout(async () => {
      try { const res = await axios.get(`http://localhost:5001/api/players/suggestions?term=${mgmtSearch.trim()}`); setSuggestions(res.data); } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(delay);
  }, [mgmtSearch]);


  useEffect(() => {
    const targetLeague = activeTab === 'player' ? playerForm.leagueid : (activeTab === 'manager' ? managerForm.leagueid : null);
    if (targetLeague) axios.get(`http://localhost:5001/api/players/clubs-by-league?leagueId=${targetLeague}`).then(res => setFormClubs(res.data));
    else setFormClubs([]);
  }, [playerForm.leagueid, managerForm.leagueid, activeTab]);

  useEffect(() => {
    if (editManagerForm.leagueid) axios.get(`http://localhost:5001/api/players/clubs-by-league?leagueId=${editManagerForm.leagueid}`).then(res => setEditManagerClubs(res.data));
    else setEditManagerClubs([]);
  }, [editManagerForm.leagueid]);

  useEffect(() => {
    if (mgmtFilters.leagueId) axios.get(`http://localhost:5001/api/players/clubs-by-league?leagueId=${mgmtFilters.leagueId}`).then(res => setMgmtClubs(res.data));
    else setMgmtClubs([]);
  }, [mgmtFilters.leagueId]);

  // Load clubs for the Managers filter's "Select Club" dropdown, same pattern as the Players filter above.
  useEffect(() => {
    if (managerFilters.leagueId) axios.get(`http://localhost:5001/api/players/clubs-by-league?leagueId=${managerFilters.leagueId}`).then(res => setManagerFilterClubs(res.data));
    else setManagerFilterClubs([]);
  }, [managerFilters.leagueId]);

  const fetchHelpers = () => axios.get('http://localhost:5001/api/players/helpers').then(res => setHelpers(res.data));
  const fetchPlayers = () => axios.get('http://localhost:5001/api/players/list-players').then(res => setPlayersList(res.data));
  
  const fetchCards = () => axios.get('http://localhost:5001/api/players/list-cards').then(res => {
      setCardsList(res.data);
      setMgmtResults(prev => {
          if (!mgmtSearch.trim() && !mgmtFilters.leagueId && !mgmtFilters.clubId && !mgmtFilters.nationId && !mgmtFilters.cardType) {
              return res.data;
          }
          return prev.length === 0 ? res.data : prev;
      });
  });
  
  
  const fetchClubs = () => axios.get('http://localhost:5001/api/players/clubs').then(res => setClubsList(res.data)).catch(err => console.error(err));

  const handleClubSubmit = async (e) => {
    e.preventDefault();
    if (!clubForm.clubname || !clubForm.clubname.trim()) {
      setMessage('Error: Club name is required.');
      return;
    }
    try {
      if (editingClub) {
        await axios.put(`http://localhost:5001/api/players/update-club/${editingClub.clubid}`, clubForm);
        setMessage(`Club "${clubForm.clubname}" updated successfully.`);
      } else {
        await axios.post('http://localhost:5001/api/players/add-club', clubForm);
        setMessage(`Club "${clubForm.clubname}" registered successfully.`);
      }
      registerClubLogo(clubForm.clubname, clubForm.logourl);
      setEditingClub(null);
      setClubForm({ clubname: '', leagueid: '', logourl: '' });
      fetchClubs();
      fetchHelpers();
    } catch (err) {
      console.error('Error saving club:', err);
      setMessage(err.response?.data?.error || 'Failed to save club.');
    }
  };

  const handleDeleteClub = (clubid, clubname) => {
    setDialog({
      title: 'Delete Club',
      message: `Are you sure you want to delete club "${clubname}"?`,
      onConfirm: async () => {
        try {
          await axios.delete(`http://localhost:5001/api/players/delete-club/${clubid}`);
          setMessage(`Club "${clubname}" deleted.`);
          fetchClubs();
          fetchHelpers();
        } catch (err) {
          console.error('Error deleting club:', err);
          setMessage(err.response?.data?.error || 'Failed to delete club.');
        }
      }
    });
  };

  const filteredClubs = useMemo(() => {
    return clubsList.filter(c => {
      const matchesName = !clubSearch.trim() || c.clubname.toLowerCase().includes(clubSearch.toLowerCase().trim());
      const matchesLeague = !clubLeagueFilter || String(c.leagueid) === String(clubLeagueFilter);
      return matchesName && matchesLeague;
    });
  }, [clubsList, clubSearch, clubLeagueFilter]);

  const fetchManagers = () => axios.get('http://localhost:5001/api/managers/list').then(res => setManagersList(res.data));

  const handleMgmtSearch = async () => {
    const params = new URLSearchParams({ ...mgmtFilters, name: mgmtSearch }).toString();
    const res = await axios.get(`http://localhost:5001/api/players/smart-search?${params}`);
    setMgmtResults(res.data);
  };

  const handleDeletePlayer = async (id, playerName) => {
    let targetId = id;
    if (!targetId) { const found = playersList.find(p => p.playername === playerName); if (found) targetId = found.playerid; }
    if (!targetId) return setMessage("❌ Error: Could not find Player ID.");

    setDialog({
        type: 'danger',
        title: ' DELETE PLAYER & ALL DATA',
        message: `Are you sure you want to delete player "${playerName}"?\n\nThis will delete the player record and ALL associated cards and stats. This cannot be undone.`,
        confirmText: 'Delete Player (All)',
        onConfirm: async () => {
            try {
                await axios.delete(`http://localhost:5001/api/players/delete-player/${targetId}`);
                setMessage(` Player "${playerName}" deleted.`);
                fetchAllData(); handleMgmtSearch();
            } catch (err) { 
                const errMsg = err.response?.data?.error || err.message || "Unknown error";
                setMessage(` Error deleting player: ${errMsg}`); 
            }
        },
        onCancel: () => {}
    });
  };

  const handleDeleteCard = async (id) => {
    setDialog({
        type: 'danger',
        title: ' DELETE CARD ONLY',
        message: 'Are you sure you want to delete this card version?\n\nThe overall player record will remain intact.',
        confirmText: 'Delete Card',
        onConfirm: async () => {
            try {
                await axios.delete(`http://localhost:5001/api/players/delete-card/${id}`);
                setMessage(" Card deleted. Player preserved.");
                fetchAllData(); handleMgmtSearch();
            } catch (err) { 
                const errMsg = err.response?.data?.error || err.message || "Unknown error";
                setMessage(` Error deleting card: ${errMsg}`); 
            }
        },
        onCancel: () => {}
    });
  };

  const handleDeleteManager = async (id, name) => {
    setDialog({
        type: 'danger',
        title: ' DELETE MANAGER',
        message: `Are you sure you want to delete Manager "${name || id}"?`,
        confirmText: 'Delete Manager',
        onConfirm: async () => {
            try {
                await axios.delete(`http://localhost:5001/api/managers/delete/${id}`);
                setMessage(` Manager "${name || id}" deleted successfully.`);
                fetchManagers();
            } catch (err) { 
                const errMsg = err.response?.data?.error || err.message || "Unknown error";
                setMessage(` Error deleting manager: ${errMsg}`); 
            }
        },
        onCancel: () => {}
    });
  };


  const handlePlayerSubmit = async (e) => { 
      e.preventDefault(); 
      try {
          await axios.post('http://localhost:5001/api/players/add-player', playerForm);
          setMessage(' Player Saved!'); 
          setPlayerForm({ playername: '', age: '', leagueid: '', clubid: '', nationalityid: '' });
          fetchAllData(); 
      } catch (err) {
          const errMsg = err.response?.data?.error || err.message || 'Unknown error';
          setMessage(` Error adding player: ${errMsg}`);
      }
  };
  const handleManagerSubmit = async (e) => {
      e.preventDefault();
      try {
          const token = localStorage.getItem('token');
          const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
          await axios.post('http://localhost:5001/api/managers/add', managerForm, config);
          setMessage(' Manager Registered successfully!');
          setManagerForm({
              managername: '',
              playstyle: 'Possession Game',
              leagueid: '',
              clubid: '',
              nationalityid: '',
              possession_game: 89,
              quick_counter: 70,
              long_ball_counter: 70,
              out_wide: 65,
              long_ball: 60
          });
          fetchManagers();
      } catch (err) {
          console.error(err);
          setMessage(' Error: ' + (err.response?.data?.error || err.message));
      }
  }; 

  const handleCardSubmit = async (e) => { 
      e.preventDefault(); 
      try {
          await axios.post('http://localhost:5001/api/players/add-card', cardForm);
          setMessage(' Card Created!'); 
          setCardForm({ playerid: '', cardtype: 'Standard', positioncode: '', baseoverallrating: 75, currentoverallrating: 75, maxoverallrating: 85, gpcost: '', cardimageurl: '' });
          fetchAllData(); 
      } catch (err) {
          const errMsg = err.response?.data?.error || err.message || 'Unknown error';
          setMessage(` Error creating card: ${errMsg}`);
      }
  };

  const handleStatsSubmit = async (e) => { 
      e.preventDefault(); 
      try {
          await axios.post('http://localhost:5001/api/players/add-stats', statsForm);
          setMessage(' Stats Saved!'); 
      } catch (error) {
          const dbErrorMessage = error.response?.data?.error || "Error saving stats";
          setMessage(dbErrorMessage.replace('error: ', '')); 
      }
  };


  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if(!statusForm.playerid || !statusForm.formtypeid) {
        return setMessage(" Error: Player and Form are required.");
    }
    try {
        await axios.put('http://localhost:5001/api/players/update-status', {
            playerId: statusForm.playerid,
            formId: statusForm.formtypeid,
            injuryId: statusForm.injurytypeid 
        });
        setMessage(" Status Updated & Market Value Recalculated!");
        setStatusForm({ playerid: '', formtypeid: '', injurytypeid: '' }); 
    } catch (err) {
        console.error(err);
        setMessage(" Update Failed. Check console.");
    }
  };


  const handleManagerSelectForBoost = async (mgrId) => {
      if (!mgrId) {
          setBoostForm({
              managerid: '',
              boost1: { statName: '', value: 1 },
              boost2: { statName: '', value: 1 },
              linkup_type: '',
              linkup_centerpiece: '',
              linkup_keyman: '',
              linkup_positions: ''
          });
          return;
      }
      const mgr = managersList.find(m => m.managerid.toString() === mgrId.toString()) || {};
      let b1 = { statName: '', value: 1 };
      let b2 = { statName: '', value: 1 };

      try {
          const res = await axios.get(`http://localhost:5001/api/managers/boosts/${mgrId}`);
          if (res.data && res.data.length > 0) {
              b1 = { statName: res.data[0].statname || '', value: res.data[0].boostvalue || 1 };
              if (res.data.length > 1) {
                  b2 = { statName: res.data[1].statname || '', value: res.data[1].boostvalue || 1 };
              }
          }
      } catch (e) {
          console.warn("Could not prefill boosts:", e);
      }

      setBoostForm({
          managerid: mgrId,
          boost1: b1,
          boost2: b2,
          linkup_type: mgr.linkup_type || '',
          linkup_centerpiece: mgr.linkup_centerpiece || '',
          linkup_keyman: mgr.linkup_keyman || '',
          linkup_positions: mgr.linkup_positions || ''
      });
  };

  const handleBoostSubmit = async (e) => {
      e.preventDefault();
      if (!boostForm.managerid) return setMessage(" Select a manager.");
      
      if (boostForm.boost1.statName && boostForm.boost2.statName && boostForm.boost1.statName === boostForm.boost2.statName) {
          return setMessage(" You cannot assign the same stat twice to one manager.");
      }

      const boostsArray = [];
      if (boostForm.boost1.statName) boostsArray.push(boostForm.boost1);
      if (boostForm.boost2.statName) boostsArray.push(boostForm.boost2);

      try {
          await axios.post('http://localhost:5001/api/managers/boosts', {
              managerid: boostForm.managerid,
              boosts: boostsArray,
              linkup_type: boostForm.linkup_type,
              linkup_centerpiece: boostForm.linkup_centerpiece,
              linkup_keyman: boostForm.linkup_keyman,
              linkup_positions: boostForm.linkup_positions
          });
          setMessage(" Manager Booster & Link-Up Philosophy assigned successfully!");
          fetchManagers();
      } catch (err) {
          setMessage(" Failed to assign manager booster.");
      }
  };

const handleCardSelectForStats = async (e) => {
    const selectedId = e.target.value;
    if(!selectedId) return;
    try {
        const res = await axios.get(`http://localhost:5001/api/players/calculate-stats/${selectedId}`);
       
        setStatsForm(prev => ({ 
            ...prev, 
            cardid: selectedId, 
            ...res.data 
        }));
        setMessage(" Stats Generated based on Role!");
    } catch (err) { 
        setMessage(" Error: " + (err.response?.data?.error || "Could not generate stats")); 
    }
};

  // Filters the already-fetched managersList in the browser (no extra API call needed,
  // since /api/managers/list returns every manager up front). Mirrors handleMgmtSearch,
  // but works locally because there's no dedicated "manager search" backend route.
  const filteredManagers = managersList.filter(m => {
      const nameMatches = !managerSearch.trim() || (m.managername || '').toLowerCase().includes(managerSearch.trim().toLowerCase());
      const playstyleMatches = !managerFilters.playstyle || m.playstyle === managerFilters.playstyle;
      const nationMatches = !managerFilters.nationId || String(m.nationalityid) === String(managerFilters.nationId);
      const leagueMatches = !managerFilters.leagueId || String(m.leagueid) === String(managerFilters.leagueId);
      const clubMatches = !managerFilters.clubId || String(m.clubid) === String(managerFilters.clubId);
      return nameMatches && playstyleMatches && nationMatches && leagueMatches && clubMatches;
  });

  const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: 'white', width: '100%' };

  return (
    <div className="admin-shell" style={{ background: '#121212', color: '#e0e0e0', minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

        .admin-shell { padding: 40px; }
        @media (max-width: 640px) { .admin-shell { padding: 20px 16px; } }

        .admin-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 50px; }
        @media (max-width: 960px) { .admin-grid { grid-template-columns: 1fr; gap: 24px; } }

        .tabs-row { display: flex; gap: 10px; margin-bottom: 30px; flex-wrap: wrap; }

        /* Buttons: gentle hover / active / disabled feedback, no color changes */
        .admin-shell button { transition: transform 0.15s ease, filter 0.15s ease, box-shadow 0.15s ease; }
        .admin-shell button:hover:not(:disabled) { filter: brightness(1.12); box-shadow: 0 4px 12px rgba(0,0,0,0.35); }
        .admin-shell button:active:not(:disabled) { transform: scale(0.97); box-shadow: none; }
        .admin-shell button:disabled { cursor: not-allowed; opacity: 0.55; filter: none; box-shadow: none; }

        /* Inputs/selects: clearer focus state and disabled affordance */
        .admin-shell input, .admin-shell select, .admin-shell textarea {
          transition: box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .admin-shell input:focus, .admin-shell select:focus, .admin-shell textarea:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(0,242,254,0.35);
          border-color: #00f2fe;
        }
        .admin-shell input:disabled, .admin-shell select:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        /* List cards: subtle lift on hover */
        .admin-shell li.hover-card { transition: transform 0.15s ease, box-shadow 0.15s ease; cursor: default; }
        .admin-shell li.hover-card:hover { transform: translateY(-4px); box-shadow: 0 6px 16px rgba(0,0,0,0.4); }

        .modal-overlay { animation: fadeIn 0.15s ease; }
        .modal-box { animation: fadeIn 0.2s ease; }
      `}</style>
      <h2 style={{ marginBottom: '25px', borderLeft: '4px solid #00f2fe', paddingLeft: '15px' }}> Registry & Management Hub</h2>

      <div className="tabs-row">
        {[
          { key: 'player', label: '1. ADD PLAYER' },
          { key: 'card', label: '2. ADD CARD' },
          { key: 'stats', label: '3. ADD STATS' },
          { key: 'status', label: '4. UPDATE STATUS' },
          { key: 'manager', label: '5. ADD MANAGER' },
          { key: 'boosts', label: '6. MANAGER BOOSTER' },
          { key: 'clubs', label: '7. CLUBS' }
        ].map(item => (
            <button className="click-btn"
              key={item.key} 
              onClick={() => handleTabSelect(item.key)} 
              style={{ 
                padding: '12px 24px', 
                background: activeTab === item.key ? '#00f2fe' : '#6a6969', 
                color: 'black', 
                border: 'none', 
                cursor: 'pointer', 
                borderRadius: '4px', 
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
                {item.label}
            </button>
        ))}
      </div>

      {message && <div style={{ padding: '12px', background: '#1e1e1e', border: '1px solid #333', marginBottom: '20px', borderRadius: '4px', color: message.includes('Error') || message.includes('Failed') || message.includes('cannot') ? '#ff4d4d' : '#4dff4d', fontWeight: 'bold' }}>{message}</div>}

      <div className="admin-grid">
        
 
        <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '8px', border: '1px solid #333' }}>
          
          {activeTab === 'player' && (
            <form onSubmit={handlePlayerSubmit} style={{ display: 'grid', gap: '20px' }}>
            <h3 style={{ margin: 0, color: '#00f2fe'}}>Register Entity</h3>
                <input placeholder="Name" value={playerForm.playername} onChange={e=>setPlayerForm({...playerForm, playername: e.target.value})} style={inputStyle} required />
                <input placeholder="Age" type="number" value={playerForm.age} onChange={e=>setPlayerForm({...playerForm, age: e.target.value})} style={inputStyle} required />

                <select value={playerForm.nationalityid} onChange={e=>setPlayerForm({...playerForm, nationalityid: e.target.value})} style={inputStyle} required>
                    <option value="">Nationality</option>
                    {helpers.nations.map(n => <option key={n.nationalityid} value={n.nationalityid}>{n.countryname}</option>)}
                </select>
                <select value={playerForm.leagueid} onChange={e => setPlayerForm({ ...playerForm, leagueid: e.target.value, clubid: '' })} style={inputStyle} required>
                    <option value="">League</option>
                    {helpers.leagues.map(l => <option key={l.leagueid} value={l.leagueid}>{l.leaguename}</option>)}
                </select>
                <select value={playerForm.clubid} onChange={e => setPlayerForm({ ...playerForm, clubid: e.target.value })} style={inputStyle} disabled={!playerForm.leagueid} required>
                    <option value="">{playerForm.leagueid ? 'Select Club' : 'Select League first...'}</option>
                    {formClubs.map(c => <option key={c.clubid} value={c.clubid}>{c.clubname}</option>)}
                </select>
                <button className="click-btn" type="submit" style={{ ...inputStyle, background: '#00f2fe', fontWeight: 'bold', border: 'none', color: '#000', cursor: 'pointer', padding:'15px' }}>Register Player</button>
            </form>
          )}

          {activeTab === 'card' && (
            <form onSubmit={handleCardSubmit} style={{ display: 'grid', gap: '15px' }}>
                <h3 style={{ margin: 0, color: '#00f2fe'}}>Initialize Card</h3>
                <select value={cardForm.playerid} onChange={e=>setCardForm({...cardForm, playerid: e.target.value})} style={inputStyle} required>
                    <option value="">Select Player...</option>
                    {playersList.map(p => <option key={p.playerid} value={p.playerid}>{p.playername}</option>)}
                </select>
                <select value={cardForm.cardtype} onChange={e=>setCardForm({...cardForm, cardtype: e.target.value, gpcost: e.target.value === 'Standard' ? cardForm.gpcost : ''})} style={inputStyle}>
                    <option value="Standard">Standard</option>
                    <option value="Featured">Featured</option>
                    <option value="Trending">Trending</option>
                    <option value="Legend">Legend</option>
                    <option value="Epic">Epic</option>
                    <option value="Highlight">Highlight</option>
                    <option value="Bigtime">Bigtime</option>
                    <option value="Showtime">Showtime</option>
                </select>
                <select value={cardForm.positioncode} onChange={e=>setCardForm({...cardForm, positioncode: e.target.value})} style={inputStyle} required>
                    <option value="">Position...</option>
                    {helpers.positions.map(pos => <option key={pos.positioncode} value={pos.positioncode}>{pos.positioncode}</option>)}
                </select>
                <div style={{display:'flex', gap:'10px'}}>
                    <div style={{flex:1}}><label style={{fontSize:'0.7em'}}>Base OVR</label> <input type="number" value={cardForm.baseoverallrating} onChange={e=> setCardForm({...cardForm, baseoverallrating: parseInt(e.target.value), currentoverallrating: Math.max(parseInt(e.target.value), cardForm.currentoverallrating)})} style={inputStyle} /></div>
                    <div style={{flex:1}}><label style={{fontSize:'0.7em'}}>Current OVR</label> <input type="number" value={cardForm.currentoverallrating} onChange={e=>setCardForm({...cardForm, currentoverallrating: parseInt(e.target.value)})} style={inputStyle} /></div>
                </div>

                {/* Price in GP Coin ONLY for Standard player cards */}
                {cardForm.cardtype === 'Standard' && (
                    <div>
                        <label style={{ fontSize: '0.7em', color: '#00f2fe', fontWeight: 'bold' }}>PRICE (GP COIN)</label>
                        <input 
                            placeholder="Price in GP (e.g. 180000)" 
                            type="number" 
                            min="0"
                            value={cardForm.gpcost} 
                            onChange={e => setCardForm({ ...cardForm, gpcost: e.target.value })} 
                            style={{ ...inputStyle, border: '1px solid #00f2fe' }} 
                            required
                        />
                    </div>
                )}

                {/* Card Image URL (Optional) */}
                <div>
                    <label style={{ fontSize: '0.7em', color: '#00f2fe', fontWeight: 'bold' }}>CARD IMAGE URL</label>
                    <input 
                        placeholder="Card Image URL (e.g. https://.../mbappe.png)" 
                        type="url" 
                        value={cardForm.cardimageurl || ''} 
                        onChange={e => setCardForm({ ...cardForm, cardimageurl: e.target.value })} 
                        style={{ ...inputStyle, border: '1px solid rgba(0, 242, 254, 0.4)' }} 
                    />
                </div>

                <button className="click-btn" type="submit" style={{ ...inputStyle, background: '#00f2fe', fontWeight: 'bold', border: 'none', color: '#000', cursor: 'pointer', padding:'15px' }}>Create Entity</button>
            </form>
          )}

          {activeTab === 'manager' && (
            <form onSubmit={handleManagerSubmit} style={{ display: 'grid', gap: '16px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '6px' }}>
                <h3 style={{ margin: 0, color: '#00f2fe' }}>Register Manager</h3>

                {/* BASIC INFO */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                    <input placeholder="Manager Name (e.g. Pep Guardiola)" value={managerForm.managername} onChange={e=>setManagerForm({...managerForm, managername: e.target.value})} style={inputStyle} required />
                    <select value={managerForm.playstyle} onChange={e=>setManagerForm({...managerForm, playstyle: e.target.value})} style={inputStyle} required>
                        <option value="Possession Game">Possession Game</option>
                        <option value="Quick Counter">Quick Counter</option>
                        <option value="Long Ball Counter">Long Ball Counter</option>
                        <option value="Out Wide">Out Wide</option>
                        <option value="Long Ball">Long Ball</option>
                    <option value="Overload">Overload</option>
                    </select>
                </div>

                {/* MANAGER IMAGE URL */}
                <div>
                    <label style={{ fontSize: '0.7em', color: '#aaa', display: 'block', marginBottom: '4px' }}>Manager Image URL</label>
                    <input 
                        placeholder="https://... Image URL for manager photo" 
                        value={managerForm.managerimageurl || ''} 
                        onChange={e => setManagerForm({...managerForm, managerimageurl: e.target.value})} 
                        style={inputStyle} 
                    />
                </div>

                {/* AFFILIATIONS (OPTIONAL) */}
                <div style={{ background: '#222', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '0.75em', color: '#00f2fe', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>Affiliations</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        <select value={managerForm.nationalityid} onChange={e=>setManagerForm({...managerForm, nationalityid: e.target.value})} style={inputStyle}>
                            <option value="">Nationality</option>
                            {helpers.nations.map(n => <option key={n.nationalityid} value={n.nationalityid}>{n.countryname}</option>)}
                        </select>
                        <select value={managerForm.leagueid} onChange={e => setManagerForm({ ...managerForm, leagueid: e.target.value, clubid: '' })} style={inputStyle}>
                            <option value="">League</option>
                            {helpers.leagues.map(l => <option key={l.leagueid} value={l.leagueid}>{l.leaguename}</option>)}
                        </select>
                        <select value={managerForm.clubid} onChange={e => setManagerForm({ ...managerForm, clubid: e.target.value })} style={inputStyle} disabled={!managerForm.leagueid}>
                            <option value="">{managerForm.leagueid ? 'Club' : 'Select League first...'}</option>
                            {formClubs.map(c => <option key={c.clubid} value={c.clubid}>{c.clubname}</option>)}
                        </select>
                    </div>
                </div>

                {/* 5 PLAYSTYLE PROFICIENCY RATINGS */}
                <div style={{ background: '#222', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '0.75em', color: '#00f2fe', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>Tactical Playstyle Proficiencies</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                        <div>
                            <label style={{ fontSize: '0.62em', color: '#aaa', display: 'block' }}>Possession</label>
                            <input type="number" min="40" max="99" value={managerForm.possession_game} onChange={e=>setManagerForm({...managerForm, possession_game: parseInt(e.target.value) || 50})} style={{ ...inputStyle, padding: '6px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.62em', color: '#aaa', display: 'block' }}>Quick Counter</label>
                            <input type="number" min="40" max="99" value={managerForm.quick_counter} onChange={e=>setManagerForm({...managerForm, quick_counter: parseInt(e.target.value) || 50})} style={{ ...inputStyle, padding: '6px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.62em', color: '#aaa', display: 'block' }}>Long Ball Ctr</label>
                            <input type="number" min="40" max="99" value={managerForm.long_ball_counter} onChange={e=>setManagerForm({...managerForm, long_ball_counter: parseInt(e.target.value) || 50})} style={{ ...inputStyle, padding: '6px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.62em', color: '#aaa', display: 'block' }}>Out Wide</label>
                            <input type="number" min="40" max="99" value={managerForm.out_wide} onChange={e=>setManagerForm({...managerForm, out_wide: parseInt(e.target.value) || 50})} style={{ ...inputStyle, padding: '6px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.62em', color: '#aaa', display: 'block' }}>Long Ball</label>
                            <input type="number" min="40" max="99" value={managerForm.long_ball} onChange={e=>setManagerForm({...managerForm, long_ball: parseInt(e.target.value) || 50})} style={{ ...inputStyle, padding: '6px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.62em', color: '#aaa', display: 'block' }}>Overload</label>
                            <input type="number" min="40" max="99" value={managerForm.overload} onChange={e=>setManagerForm({...managerForm, overload: parseInt(e.target.value) || 50})} style={{ ...inputStyle, padding: '6px' }} />
                        </div>
                    </div>
                </div>

                <button className="click-btn" type="submit" style={{ ...inputStyle, background: '#00f2fe', fontWeight: 'bold', border: 'none', color: '#000', cursor: 'pointer', padding:'15px' }}>
                    REGISTER MANAGER
                </button>
            </form>
          )}

          {activeTab === 'stats' && (
             <form onSubmit={handleStatsSubmit} style={{ display: 'grid', gap: '15px' }}>
                <h3 style={{ margin: 0, color: '#00f2fe'}}>Assign Attributes</h3>
                <select onChange={handleCardSelectForStats} style={inputStyle} required>
    <option value="">Select Card (Auto-Calculate)...</option>
    {/* 👇 CHANGED: Added .filter(c => c.cardid) so players without cards don't show up here */}
    {cardsList.filter(c => c.cardid).map(c => <option key={c.cardid} value={c.cardid}>{c.playername || c.player?.playername} (OVR-{c.baseoverallrating})</option>)}
</select>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                    {Object.keys(statsForm).map((key) => key !== 'cardid' && (
                        <div key={key}>
                            <label style={{fontSize:'0.6em', color:'#aaa', textTransform:'uppercase'}}>{key.replace('gk', 'GK ')}</label>
                            <input type="number" value={statsForm[key]} onChange={e=>setStatsForm({...statsForm, [key]: e.target.value})} style={{...inputStyle, padding:'8px'}} />
                        </div>
                    ))}
                </div>
                <button className="click-btn" type="submit" style={{ ...inputStyle, background: '#00f2fe', fontWeight: 'bold', border: 'none', color: '#000', cursor: 'pointer', padding:'15px' }}>Commit Stats</button>
            </form>
          )}

          {activeTab === 'status' && (
            <form onSubmit={handleStatusSubmit} style={{ display: 'grid', gap: '20px' }}>
                <h3 style={{ margin: 0, color: '#00f2fe' }}>Update Player Status</h3>
                <p style={{fontSize:'0.8em', color:'#aaa'}}>
                    This action updates the Player's Form and Injury status. 
                    <b> Market Value is automatically recalculated</b> based on these factors.
                </p>

                {/* 1. SELECT PLAYER */}
                <select value={statusForm.playerid} onChange={e=>setStatusForm({...statusForm, playerid: e.target.value})} style={inputStyle} required>
                    <option value="">Select Player...</option>
                    {playersList.map(p => <option key={p.playerid} value={p.playerid}>{p.playername}</option>)}
                </select>

                {/* 2. SELECT FORM */}
                <select value={statusForm.formtypeid} onChange={e=>setStatusForm({...statusForm, formtypeid: e.target.value})} style={inputStyle} required>
                    <option value="">Select New Form...</option>
                    {formTypes.map(f => <option key={f.formtypeid} value={f.formtypeid}>{f.formname} (x{f.multiplier})</option>)}
                </select>

                {/* 3. SELECT INJURY  */}
                <select value={statusForm.injurytypeid} onChange={e=>setStatusForm({...statusForm, injurytypeid: e.target.value})} style={inputStyle}>
                    <option value="" >Healthy (No Injury)</option>
                    {injuryTypes.map(i => <option key={i.injurytypeid} value={i.injurytypeid}>{i.injuryname} (x{i.defaultmultiplier})</option>)}
                </select>

                <button className="click-btn" type="submit" style={{ ...inputStyle, background: '#00f2fe', fontWeight: 'bold', border: 'none', color: '#000', cursor: 'pointer', padding:'15px' }}>
                    UPDATE STATUS
                </button>
            </form>
          )}

          {/* --- MANAGER BOOSTER TAB --- */}
          {activeTab === 'boosts' && (
            <form onSubmit={handleBoostSubmit} style={{ display: 'grid', gap: '18px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '6px' }}>
                <h3 style={{ margin: 0, color: '#00ffff' }}>Assign Manager Booster & Link-Up</h3>
                <p style={{fontSize:'0.8em', color:'#aaa', margin: 0}}>
                    Select a manager to assign up to <b>two unique stat boosters</b> (Value: 1 to 3) and an optional <b>Link-Up Philosophy</b>.
                </p>

                {/* Select Manager */}
                <select value={boostForm.managerid} onChange={e => handleManagerSelectForBoost(e.target.value)} style={inputStyle} required>
                    <option value="">Select Manager...</option>
                    {managersList.map(m => <option key={m.managerid} value={m.managerid}>{m.managername} ({m.playstyle})</option>)}
                </select>

                {/* STAT BOOSTERS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {/* BOOST 1 */}
                    <div style={{ padding: '14px', background: '#252525', borderRadius: '8px', border: '1px solid #444' }}>
                        <h4 style={{margin: '0 0 8px 0', color: '#00f2fe', fontSize: '0.85em', textTransform: 'uppercase'}}>Booster Slot 1</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                            <select value={boostForm.boost1.statName} onChange={e=>setBoostForm({...boostForm, boost1: { ...boostForm.boost1, statName: e.target.value }})} style={inputStyle}>
                                <option value="">Select Stat...</option>
                                {statTypes.map(s => {
                                    const formatted = s.statname.replace(/([A-Z])/g, ' $1').replace(/^Gk\b/i, 'GK').trim();
                                    return <option key={s.statname} value={s.statname}>{formatted}</option>;
                                })}
                            </select>
                            <input type="number" min="1" max="3" value={boostForm.boost1.value} onChange={e=>setBoostForm({...boostForm, boost1: { ...boostForm.boost1, value: parseInt(e.target.value) || 1 }})} style={inputStyle} placeholder="Val" disabled={!boostForm.boost1.statName} />
                        </div>
                    </div>

                    {/* BOOST 2 */}
                    <div style={{ padding: '14px', background: '#252525', borderRadius: '8px', border: '1px solid #444' }}>
                        <h4 style={{margin: '0 0 8px 0', color: '#00f2fe', fontSize: '0.85em', textTransform: 'uppercase'}}>Booster Slot 2</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                            <select value={boostForm.boost2.statName} onChange={e=>setBoostForm({...boostForm, boost2: { ...boostForm.boost2, statName: e.target.value }})} style={inputStyle}>
                                <option value="">Select Stat...</option>
                                {statTypes.map(s => {
                                    const formatted = s.statname.replace(/([A-Z])/g, ' $1').replace(/^Gk\b/i, 'GK').trim();
                                    return <option key={s.statname} value={s.statname}>{formatted}</option>;
                                })}
                            </select>
                            <input type="number" min="1" max="3" value={boostForm.boost2.value} onChange={e=>setBoostForm({...boostForm, boost2: { ...boostForm.boost2, value: parseInt(e.target.value) || 1 }})} style={inputStyle} placeholder="Val" disabled={!boostForm.boost2.statName} />
                        </div>
                    </div>
                </div>

                {/* LINK-UP PHILOSOPHY (OPTIONAL) */}
                <div style={{ background: '#252525', padding: '14px', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.4)' }}>
                    <div style={{ fontSize: '0.8em', color: '#fbbf24', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}> Link-Up Philosophy</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <input placeholder="Link-up Type (e.g. Breakthrough Pass A)" value={boostForm.linkup_type} onChange={e=>setBoostForm({...boostForm, linkup_type: e.target.value})} style={inputStyle} />
                        <input placeholder="Positions (e.g. AMF, CF)" value={boostForm.linkup_positions} onChange={e=>setBoostForm({...boostForm, linkup_positions: e.target.value})} style={inputStyle} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input placeholder="Center Piece (e.g. Creative Playmaker)" value={boostForm.linkup_centerpiece} onChange={e=>setBoostForm({...boostForm, linkup_centerpiece: e.target.value})} style={inputStyle} />
                        <input placeholder="Key Man (e.g. Goal Poacher)" value={boostForm.linkup_keyman} onChange={e=>setBoostForm({...boostForm, linkup_keyman: e.target.value})} style={inputStyle} />
                    </div>
                </div>

                <button className="click-btn" type="submit" style={{ ...inputStyle, background: '#00f2f2', fontWeight: 'bold', border: 'none', color: '#000', cursor: 'pointer', padding:'14px' }}>
                    SAVE MANAGER BOOSTER & LINK-UP
                </button>
            </form>
          )}

        </div>

        {/* RIGHT COLUMN */}
<div style={{ background: '#1e1e1e', padding: '25px', borderRadius: '8px', border: '1px solid #333', maxHeight: '85vh', overflowY: 'auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: '0.8em', color: '#888' }}>Management</h4>
        <div style={{ background: '#6a6969', borderRadius: '4px', display: 'flex', padding: '2px' }}>
            <button onClick={() => setMgmtTab('database')} style={{ background: mgmtTab === 'database' ? '#00f2fe' : 'none', color: '#000', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.75em', fontWeight: 'bold' }}>PLAYERS</button>
            <button onClick={() => { setMgmtTab('managers'); fetchManagers(); }} style={{ background: mgmtTab === 'managers' ? '#00f2fe' : 'none', color: '#000', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.75em', fontWeight: 'bold' }}>MANAGERS</button>
            <button onClick={() => { setMgmtTab('clubs'); fetchClubs(); }} style={{ background: mgmtTab === 'clubs' ? '#00f2fe' : 'none', color: '#000', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.75em', fontWeight: 'bold' }}>CLUBS</button>
          {/* ({managersList.length}) */}
        </div>
    </div>

    {mgmtTab === 'database' && (
        <div style={{ display: 'grid', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
            <input placeholder="Search Name..." value={mgmtSearch} onChange={e => setMgmtSearch(e.target.value)} style={{ ...inputStyle, background: '#222' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
                <select value={mgmtFilters.nationId} onChange={e => setMgmtFilters({...mgmtFilters, nationId: e.target.value})} style={inputStyle}>
                    <option value="">Any Nationality</option>
                    {helpers.nations.map(n => <option key={n.nationalityid} value={n.nationalityid}>{n.countryname}</option>)}
                </select>
                <select value={mgmtFilters.cardType} onChange={e => setMgmtFilters({...mgmtFilters, cardType: e.target.value})} style={inputStyle}>
                    <option value="">Any Card Type</option>
                    <option value="Standard">Standard</option>
                    <option value="Featured">Featured</option>
                    <option value="Trending">Trending</option>
                    <option value="Legend">Legend</option>
                    <option value="Epic">Epic</option>
                    <option value="Highlight">Highlight</option>
                    <option value="Bigtime">Bigtime</option>
                    <option value="Showtime">Showtime</option>
                </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <select value={mgmtFilters.leagueId} onChange={e => setMgmtFilters({...mgmtFilters, leagueId: e.target.value, clubId: ''})} style={inputStyle}>
                    <option value="">Any League</option>
                    {helpers.leagues.map(l => <option key={l.leagueid} value={l.leagueid}>{l.leaguename}</option>)}
                </select>
                <select value={mgmtFilters.clubId} onChange={e => setMgmtFilters({...mgmtFilters, clubId: e.target.value})} style={inputStyle} disabled={!mgmtFilters.leagueId}>
                    <option value="">Select Club</option>
                    {mgmtClubs.map(c => <option key={c.clubid} value={c.clubid}>{c.clubname}</option>)}
                </select>
            </div>
            <button onClick={handleMgmtSearch} style={{ ...inputStyle, background: '#00f2fe', fontWeight: 'bold', border: 'none', color: '#000', cursor: 'pointer', padding:'15px' }}>Apply Database Filter</button>
        </div>
    )}

    {/* MANAGERS FILTER PANEL - ONLY NAME SEARCH */}
    {mgmtTab === 'managers' && (
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
            <input 
                placeholder="Search Manager Name..." 
                value={managerSearch} 
                onChange={e => setManagerSearch(e.target.value)} 
                style={{ ...inputStyle, background: '#222' }} 
            />
        </div>
    )}

    <ul style={{ listStyle: 'none', padding: 0 }}>
        {mgmtTab === 'database' && [...mgmtResults].sort((a, b) => (b.cardid || 0) - (a.cardid || 0) || (b.playerid || 0) - (a.playerid || 0)).map(item => (
            <li
                key={item.cardid || `player-${item.playerid}`}
                className="hover-card"
                style={{ padding: '15px', borderBottom: '1px solid #333', background: '#252525', marginBottom: '8px', borderRadius: '4px' }}
            >
                <div style={{marginBottom: '10px'}}>
                    <div style={{fontWeight: 'bold', color: '#fff'}}>{item.player?.playername || item.playername}</div>
                    <div style={{fontSize: '0.7em', color: '#aaa'}}>
                        {item.cardtype} {item.cardid ? `• ${item.baseoverallrating} OVR` : ''}
                    </div>
                </div>
                <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                    {item.cardid && (
                        <>
                            <button onClick={() => handleOpenEditCard(item)} style={{ flex: 1, background: '#00f2fe', color: '#000', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8em' }}> Edit Card</button>
                            <button onClick={() => handleDeleteCard(item.cardid)} style={{ flex: 1, background: '#444', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em' }}>Delete Card</button>
                        </>
                    )}
                    <button onClick={() => handleDeletePlayer(item.playerid || item.player?.playerid, item.player?.playername || item.playername)} style={{ flex: 1, background: '#fc001992', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8em' }}>Delete Player (All)</button>
                </div>
            </li>
        ))}

        {mgmtTab === 'managers' && (
            filteredManagers.length > 0 ? (
                filteredManagers.map(item => (
                    <li
                        key={item.managerid}
                        className="hover-card"
                        style={{ padding: '14px', borderBottom: '1px solid #333', background: '#252525', marginBottom: '10px', borderRadius: '8px', border: '1px solid #3a3a3c' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img
                                    src={getManagerPhotoUrl(item.managername, item.managerimageurl || item.imageurl)}
                                    alt={item.managername}
                                    style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover', border: '1.5px solid #00f2fe', background: '#18181b' }}
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://secure.gravatar.com/avatar/unknown?d=mp'; }}
                                />
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.05em' }}>{item.managername}</div>
                                    <div style={{ fontSize: '0.75em', color: '#00f2fe', marginTop: '2px' }}>
                                        {item.playstyle} • Pos: {item.possession_game || 50} | QC: {item.quick_counter || 50} | LBC: {item.long_ball_counter || 50} | OW: {item.out_wide || 50} | LB: {item.long_ball || 50} | OL: {item.overload || 50}
                                    </div>
                                </div>
                            </div>
                            <span style={{ fontSize: '0.7em', color: '#888', background: '#18181b', padding: '2px 6px', borderRadius: '4px' }}>#{item.managerid}</span>
                        </div>

                        <div style={{ fontSize: '0.72em', color: '#aaa', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div><b>Boosts:</b> <span style={{ color: item.boosts_display ? '#00f2fe' : '#666' }}>{item.boosts_display || 'None'}</span></div>
                            <div><b>Link-Up:</b> <span style={{ color: item.linkup_type ? '#fbbf24' : '#666' }}>{item.linkup_type ? `${item.linkup_type} (${item.linkup_positions || 'All'})` : 'None'}</span></div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleOpenEditManager(item)} style={{ flex: 1, background: '#00f2fe', color: '#000', border: 'none', padding: '7px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8em' }}>
                                 Edit Manager
                            </button>
                            <button onClick={() => handleDeleteManager(item.managerid, item.managername)} style={{ flex: 1, background: '#fc001992', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8em' }}>
                                 Delete Manager
                            </button>
                        </div>
                    </li>
                ))
            ) : (
                <div style={{ color: '#888', textAlign: 'center', padding: '30px 10px', fontStyle: 'italic' }}>
                    {managersList.length === 0
                        ? 'No managers found in database.'
                        : 'No managers match the current search/filters.'}
                </div>
            )
        )}
    </ul>
        </div>
      </div>

      {/* EDIT CARD MODAL */}
      {editingCard && (
        <div
            className="modal-overlay"
            onClick={() => setEditingCard(null)}
            style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <div
                className="modal-box"
                onClick={(e) => e.stopPropagation()}
                style={{
                background: '#18181b', border: '1px solid #00f2fe',
                borderRadius: '12px', padding: '25px', width: '100%', maxWidth: '550px',
                color: '#fff', boxShadow: '0 10px 40px rgba(0,242,254,0.3)',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#00f2fe' }}> Edit Card & Player Model (#{editingCard.cardid})</h3>
                    <button onClick={() => setEditingCard(null)} style={{ background: 'none', border: 'none', color: '#44e1ef', fontSize: '2em', cursor: 'pointer' }}><IoMdClose />
</button>
                </div>

                {/* MODAL NAVIGATION TABS */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <button 
                        type="button" 
                        onClick={() => setEditModalSubTab('card')}
                        style={{
                            flex: 1, padding: '8px 12px', borderRadius: '6px', border: 'none',
                            background: editModalSubTab === 'card' ? '#00f2fe' : '#27272a',
                            color: editModalSubTab === 'card' ? '#000' : '#fff',
                            fontWeight: '900', fontSize: '0.8em', cursor: 'pointer'
                        }}
                    >
                         Card, Skills & Boosters
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setEditModalSubTab('model')}
                        style={{
                            flex: 1, padding: '8px 12px', borderRadius: '6px', border: 'none',
                            background: editModalSubTab === 'model' ? '#00f2fe' : '#27272a',
                            color: editModalSubTab === 'model' ? '#000' : '#fff',
                            fontWeight: '900', fontSize: '0.8em', cursor: 'pointer'
                        }}
                    >
                         3D Model & Physics Metrics
                    </button>
                </div>

                <form onSubmit={handleSaveEditCard} noValidate style={{ display: 'grid', gap: '14px' }}>
                    
                    {/* TAB 1: CARD, SKILLS & BOOSTERS */}
                    {editModalSubTab === 'card' && (
                        <>
                            <div>
                                <label style={{ fontSize: '0.75em', color: '#aaa', textTransform: 'uppercase' }}>Card Type</label>
                                <select value={editForm.cardtype} onChange={e => setEditForm({...editForm, cardtype: e.target.value})} style={inputStyle}>
                                    <option value="Standard">Standard</option>
                                    <option value="Featured">Featured</option>
                                    <option value="Trending">Trending</option>
                                    <option value="Legend">Legend</option>
                                    <option value="Epic">Epic</option>
                                    <option value="Highlight">Highlight</option>
                                    <option value="Bigtime">Bigtime</option>
                                    <option value="Showtime">Showtime</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75em', color: '#aaa', textTransform: 'uppercase' }}>Main Position Code</label>
                                <select value={editForm.positioncode} onChange={e => setEditForm({...editForm, positioncode: e.target.value})} style={inputStyle}>
                                    {helpers.positions.map(pos => <option key={pos.positioncode} value={pos.positioncode}>{pos.positioncode}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7em', color: '#aaa' }}>Base OVR</label>
                                    <input type="number" value={editForm.baseoverallrating} onChange={e => setEditForm({...editForm, baseoverallrating: parseInt(e.target.value)})} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7em', color: '#aaa' }}>Current OVR</label>
                                    <input type="number" value={editForm.currentoverallrating} onChange={e => setEditForm({...editForm, currentoverallrating: parseInt(e.target.value)})} style={inputStyle} />
                                </div>
                                {/* <div>
                                    <label style={{ fontSize: '0.7em', color: '#aaa' }}>Max OVR</label>
                                    <input type="number" value={editForm.maxoverallrating} onChange={e => setEditForm({...editForm, maxoverallrating: parseInt(e.target.value)})} style={inputStyle} />
                                </div> */}
                                <div>
                                    <label style={{ fontSize: '0.7em', color: '#00f2fe', fontWeight: 'bold' }}>Level Cap</label>
                                    <input type="number" value={editForm.maxlevel} onChange={e => setEditForm({...editForm, maxlevel: parseInt(e.target.value)})} style={{ ...inputStyle, border: '1px solid #00f2fe' }} placeholder="32" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7em', color: '#00f2fe', fontWeight: 'bold' }}>Prog. Points</label>
                                    <input type="number" value={editForm.progressionpoints} onChange={e => setEditForm({...editForm, progressionpoints: parseInt(e.target.value)})} style={{ ...inputStyle, border: '1px solid #00f2fe' }} placeholder="62" />
                                </div>
                            </div>

                            {/* PRICE (GP COIN) ONLY FOR STANDARD CARDS IN EDIT MODAL */}
                            {editForm.cardtype === 'Standard' && (
                                <div>
                                    <label style={{ fontSize: '0.75em', color: '#00f2fe', fontWeight: 'bold' }}>PRICE (GP COIN)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={editForm.gpcost || ''} 
                                        onChange={e => setEditForm({ ...editForm, gpcost: e.target.value })} 
                                        style={{ ...inputStyle, border: '1px solid #00f2fe' }} 
                                        placeholder="Price in GP (e.g. 180000)" 
                                    />
                                </div>
                            )}

                            {/* CARD IMAGE URL (OPTIONAL) IN EDIT MODAL */}
                            <div>
                                <label style={{ fontSize: '0.75em', color: '#00f2fe', fontWeight: 'bold' }}>CARD IMAGE URL</label>
                                <input 
                                    type="url" 
                                    placeholder="Card Image URL (e.g. https://.../mbappe.png)" 
                                    value={editForm.cardimageurl || ''} 
                                    onChange={e => setEditForm({ ...editForm, cardimageurl: e.target.value })} 
                                    style={{ ...inputStyle, border: '1px solid rgba(0, 242, 254, 0.4)' }} 
                                />
                            </div>

                            {/* PRIMARY PITCH POSITIONS (GREEN GLOW 100%) */}
                            <div>
                                <label style={{ fontSize: '0.75em', color: '#00e676',  textTransform: 'uppercase' }}>
                                     Primary Pitch Positions 
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. AMF, CMF or RWF, AMF, SS, RMF" 
                                    value={editForm.primarypositions} 
                                    onChange={e => setEditForm({...editForm, primarypositions: e.target.value})} 
                                    style={{ ...inputStyle, border: '1px solid #00e676' }} 
                                />
                                {/* <div style={{ fontSize: '0.68em', color: '#64748b', marginTop: '3px' }}>
                                    Comma separated positions that display 100% rating with green glow.
                                </div> */}
                            </div>

                            {/* SECONDARY POSITION BOOSTERS (BLUE GLOW) */}
                            <div>
                                <label style={{ fontSize: '0.75em', color: '#00b0ff',textTransform: 'uppercase' }}>
                                     Position Boosters / Full Affinity 
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. LMF, RMF, SS" 
                                    value={editForm.secondarypositions} 
                                    onChange={e => setEditForm({...editForm, secondarypositions: e.target.value})} 
                                    style={{ ...inputStyle, border: '1px solid #00b0ff' }} 
                                />
                                {/* <div style={{ fontSize: '0.68em', color: '#64748b', marginTop: '3px' }}>
                                    Comma separated secondary positions compatible with position boosters.
                                </div> */}
                            </div>

                            {/* BASE PLAYER SKILLS LIST */}
                            <div>
                                <label style={{ fontSize: '0.75em', color: '#38bdf8', textTransform: 'uppercase' }}>
                                     Base Player Skills List 
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Double Touch, First Time Shot, One Touch Pass, Long Range Shooting, Blitz Curler"
                                    value={editForm.skills} 
                                    onChange={e => setEditForm({...editForm, skills: e.target.value})} 
                                    style={{ ...inputStyle, border: '1px solid #38bdf8' }} 
                                />
                            </div>

                            {/* COM SKILLS LIST */}
                            <div>
                                <label style={{ fontSize: '0.75em', color: '#a855f7', textTransform: 'uppercase' }}>
                                    COM Playing Styles / Skills 
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Mazing Run, Long Ball Expert, Speeding Bullet" 
                                    value={editForm.comskills} 
                                    onChange={e => setEditForm({...editForm, comskills: e.target.value})} 
                                    style={{ ...inputStyle, border: '1px solid #a855f7' }} 
                                />
                            </div>

                            {/* BOOSTERS SECTION */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#1c1c20', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                                {/* BOOSTER 1 */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <label style={{ fontSize: '0.7em', color: '#00f2fe', textTransform: 'uppercase', fontWeight: 'bold' }}>Booster 1</label>
                                        {editForm.booster1_type && editForm.booster1_type !== 'ALL' && BOOSTER_CATEGORIES[editForm.booster1_type] && (
                                            <span style={{ fontSize: '0.62em', color: BOOSTER_CATEGORIES[editForm.booster1_type].color, fontWeight: 'bold', background: 'rgba(0,0,0,0.4)', padding: '1px 5px', borderRadius: '4px' }}>
                                                {BOOSTER_CATEGORIES[editForm.booster1_type].name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Booster 1 Type Selector */}
                                    <BoosterTypeSelect
                                        value={editForm.booster1_type || 'ALL'}
                                        onChange={newType => {
                                            const defVal = (newType !== 'ALL' && BOOSTER_CATEGORIES[newType]) 
                                                ? BOOSTER_CATEGORIES[newType].maxBoost 
                                                : editForm.booster1_val;
                                            setEditForm(prev => ({
                                                ...prev,
                                                booster1_type: newType,
                                                booster1_val: defVal || 4
                                            }));
                                        }}
                                        accentColor="rgba(0, 242, 254, 0.4)"
                                    />

                                    {/* Booster 1 Name & Boost Value */}
                                    <label style={{ fontSize: '0.62em', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Booster Name & Value</label>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <select 
                                            value={editForm.booster1_name || 'none'} 
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val === 'none') {
                                                    setEditForm(prev => ({
                                                        ...prev,
                                                        booster1_name: 'none',
                                                        booster1_val: 0
                                                    }));
                                                } else {
                                                    const bObj = getBoosterByName(val);
                                                    const defVal = (bObj && BOOSTER_CATEGORIES[bObj.category]) 
                                                        ? BOOSTER_CATEGORIES[bObj.category].maxBoost 
                                                        : 4;
                                                    setEditForm(prev => ({
                                                        ...prev,
                                                        booster1_name: val,
                                                        booster1_type: (prev.booster1_type && prev.booster1_type !== 'ALL') ? prev.booster1_type : (bObj ? bObj.category : 'ALL'),
                                                        booster1_val: (prev.booster1_val && prev.booster1_val > 0) ? prev.booster1_val : defVal
                                                    }));
                                                }
                                            }} 
                                            style={{ ...inputStyle, flex: 1, fontSize: '0.8em' }}
                                        >
                                            <option value="none">No Booster</option>
                                            {[...EFOOTBALL_BOOSTERS].sort((a, b) => a.name.localeCompare(b.name)).map(b => (
                                                <option key={`adm-b1-${b.name}`} value={b.name}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                        <select 
                                            value={editForm.booster1_name === 'none' ? 0 : (editForm.booster1_val || 4)} 
                                            onChange={e => setEditForm({...editForm, booster1_val: parseInt(e.target.value, 10)})} 
                                            style={{ ...inputStyle, width: '64px', fontWeight: 'bold', color: editForm.booster1_name === 'none' ? '#64748b' : '#00f2fe' }}
                                            disabled={editForm.booster1_name === 'none'}
                                            title="Stat Boost Value"
                                        >
                                            {editForm.booster1_name === 'none' ? (
                                                <option value={0}>0</option>
                                            ) : (
                                                [1, 2, 3, 4, 5].map(v => (
                                                    <option key={`b1-val-${v}`} value={v}>+{v}</option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                    {editForm.booster1_name && editForm.booster1_name !== 'none' && (() => {
                                        const b = getBoosterByName(editForm.booster1_name);
                                        if (!b) return null;
                                        return (
                                            <div style={{ fontSize: '0.65em', color: '#94a3b8', marginTop: '3px' }}>
                                                Stats: {getBoosterStatLabels(b)}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* BOOSTER 2 */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <label style={{ fontSize: '0.7em', color: '#f97316', textTransform: 'uppercase', fontWeight: 'bold' }}>Booster 2</label>
                                        {editForm.booster2_type && editForm.booster2_type !== 'ALL' && BOOSTER_CATEGORIES[editForm.booster2_type] && (
                                            <span style={{ fontSize: '0.62em', color: BOOSTER_CATEGORIES[editForm.booster2_type].color, fontWeight: 'bold', background: 'rgba(0,0,0,0.4)', padding: '1px 5px', borderRadius: '4px' }}>
                                                {BOOSTER_CATEGORIES[editForm.booster2_type].name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Booster 2 Type Selector */}
                                    <BoosterTypeSelect
                                        value={editForm.booster2_type || 'ALL'}
                                        onChange={newType => {
                                            const defVal = (newType !== 'ALL' && BOOSTER_CATEGORIES[newType]) 
                                                ? BOOSTER_CATEGORIES[newType].maxBoost 
                                                : editForm.booster2_val;
                                            setEditForm(prev => ({
                                                ...prev,
                                                booster2_type: newType,
                                                booster2_val: defVal || 3
                                            }));
                                        }}
                                        accentColor="rgba(249, 115, 22, 0.4)"
                                    />

                                    {/* Booster 2 Name & Boost Value */}
                                    <label style={{ fontSize: '0.62em', color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Booster Name & Value</label>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <select 
                                            value={editForm.booster2_name || 'none'} 
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val === 'none') {
                                                    setEditForm(prev => ({
                                                        ...prev,
                                                        booster2_name: 'none',
                                                        booster2_val: 0
                                                    }));
                                                } else if (val === 'Craftable Slot') {
                                                    setEditForm(prev => ({
                                                        ...prev,
                                                        booster2_name: 'Craftable Slot',
                                                        booster2_val: 0
                                                    }));
                                                } else {
                                                    const bObj = getBoosterByName(val);
                                                    const defVal = (bObj && BOOSTER_CATEGORIES[bObj.category]) 
                                                        ? BOOSTER_CATEGORIES[bObj.category].maxBoost 
                                                        : 3;
                                                    setEditForm(prev => ({
                                                        ...prev,
                                                        booster2_name: val,
                                                        booster2_type: (prev.booster2_type && prev.booster2_type !== 'ALL') ? prev.booster2_type : (bObj ? bObj.category : 'ALL'),
                                                        booster2_val: (prev.booster2_val && prev.booster2_val > 0) ? prev.booster2_val : defVal
                                                    }));
                                                }
                                            }} 
                                            style={{ ...inputStyle, flex: 1, fontSize: '0.8em' }}
                                        >
                                            <option value="none">No Booster</option>
                                            <option value="Craftable Slot" style={{ color: '#fbbf24', fontWeight: 'bold' }}>Open Booster Craft</option>
                                            {[...EFOOTBALL_BOOSTERS].sort((a, b) => a.name.localeCompare(b.name)).map(b => (
                                                <option key={`adm-b2-${b.name}`} value={b.name}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                        <select 
                                            value={(editForm.booster2_name === 'none' || editForm.booster2_name === 'Craftable Slot') ? 0 : (editForm.booster2_val || 3)} 
                                            onChange={e => setEditForm({...editForm, booster2_val: parseInt(e.target.value, 10)})} 
                                            style={{ ...inputStyle, width: '64px', fontWeight: 'bold', color: (editForm.booster2_name === 'none' || editForm.booster2_name === 'Craftable Slot') ? '#64748b' : '#f97316' }}
                                            disabled={editForm.booster2_name === 'none' || editForm.booster2_name === 'Craftable Slot'}
                                            title="Stat Boost Value"
                                        >
                                            {(editForm.booster2_name === 'none' || editForm.booster2_name === 'Craftable Slot') ? (
                                                <option value={0}>0</option>
                                            ) : (
                                                [1, 2, 3, 4, 5].map(v => (
                                                    <option key={`b2-val-${v}`} value={v}>+{v}</option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                    {editForm.booster2_name && editForm.booster2_name !== 'none' && editForm.booster2_name !== 'Craftable Slot' && (() => {
                                        const b = getBoosterByName(editForm.booster2_name);
                                        if (!b) return null;
                                        return (
                                            <div style={{ fontSize: '0.65em', color: '#94a3b8', marginTop: '3px' }}>
                                                Stats: {getBoosterStatLabels(b)}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </>
                    )}

                    {/* TAB 2: 3D MODEL & PHYSICS METRICS */}
                    {editModalSubTab === 'model' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7em', color: '#aaa' }}>Height (cm)</label>
                                    <input type="number" value={editForm.height} onChange={e => setEditForm({...editForm, height: parseInt(e.target.value)})} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7em', color: '#aaa' }}>Weight (kg)</label>
                                    <input type="number" value={editForm.weight} onChange={e => setEditForm({...editForm, weight: parseInt(e.target.value)})} style={inputStyle} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.7em', color: '#aaa' }}>Preferred Foot</label>
                                <select value={editForm.preferredfoot} onChange={e => setEditForm({...editForm, preferredfoot: e.target.value})} style={inputStyle}>
                                    <option value="Right">Right</option>
                                    <option value="Left">Left</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7em', color: '#f43f5e', fontWeight: 'bold' }}>Attacking Playstyle</label>
                                    <select 
                                        value={editForm.attacking_playstyle || editForm.playstyle} 
                                        onChange={e => setEditForm({...editForm, attacking_playstyle: e.target.value, playstyle: e.target.value})} 
                                        style={inputStyle}
                                    >
                                        {ATTACKING_PLAYSTYLES.map(ps => <option key={ps} value={ps}>{ps}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7em', color: '#06b6d4', fontWeight: 'bold' }}>Defensive Playstyle</label>
                                    <select 
                                        value={editForm.defensive_playstyle || ''} 
                                        onChange={e => setEditForm({...editForm, defensive_playstyle: e.target.value})} 
                                        style={inputStyle}
                                    >
                                        <option value="">-- None --</option>
                                        {DEFENSIVE_PLAYSTYLES.map(ps => <option key={ps} value={ps}>{ps}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.75em', color: '#38bdf8', fontWeight: 'bold', marginTop: '10px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
                                3D Model Physics & Proportions (cm/index)
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <div><label style={{ fontSize: '0.65em', color: '#aaa' }}>Arm Length</label><input type="number" value={editForm.armlength} onChange={e => setEditForm({...editForm, armlength: parseInt(e.target.value)})} style={inputStyle} /></div>
                                <div><label style={{ fontSize: '0.65em', color: '#aaa' }}>Shoulder Width</label><input type="number" value={editForm.shoulderwidth} onChange={e => setEditForm({...editForm, shoulderwidth: parseInt(e.target.value)})} style={inputStyle} /></div>
                                <div><label style={{ fontSize: '0.65em', color: '#aaa' }}>Neck Length</label><input type="number" value={editForm.necklength} onChange={e => setEditForm({...editForm, necklength: parseInt(e.target.value)})} style={inputStyle} /></div>
                                <div><label style={{ fontSize: '0.65em', color: '#aaa' }}>Chest Measurement</label><input type="number" value={editForm.chestmeasurement} onChange={e => setEditForm({...editForm, chestmeasurement: parseInt(e.target.value)})} style={inputStyle} /></div>
                                <div><label style={{ fontSize: '0.65em', color: '#aaa' }}>Neck Size</label><input type="number" value={editForm.necksize} onChange={e => setEditForm({...editForm, necksize: parseInt(e.target.value)})} style={inputStyle} /></div>
                                <div><label style={{ fontSize: '0.65em', color: '#aaa' }}>Shoulder Height</label><input type="number" value={editForm.shoulderheight} onChange={e => setEditForm({...editForm, shoulderheight: parseInt(e.target.value)})} style={inputStyle} /></div>
                                <div><label style={{ fontSize: '0.65em', color: '#aaa' }}>Leg Length</label><input type="number" value={editForm.leglength} onChange={e => setEditForm({...editForm, leglength: parseInt(e.target.value)})} style={inputStyle} /></div>
                                <div><label style={{ fontSize: '0.65em', color: '#aaa' }}>Thigh Size</label><input type="number" value={editForm.thighsize} onChange={e => setEditForm({...editForm, thighsize: parseInt(e.target.value)})} style={inputStyle} /></div>
                                <div><label style={{ fontSize: '0.65em', color: '#aaa' }}>Waist Size</label><input type="number" value={editForm.waistsize} onChange={e => setEditForm({...editForm, waistsize: parseInt(e.target.value)})} style={inputStyle} /></div>
                                <div><label style={{ fontSize: '0.65em', color: '#aaa' }}>Arm Size</label><input type="number" value={editForm.armsize} onChange={e => setEditForm({...editForm, armsize: parseInt(e.target.value)})} style={inputStyle} /></div>
                                <div><label style={{ fontSize: '0.65em', color: '#aaa' }}>Calf Size</label><input type="number" value={editForm.calfsize} onChange={e => setEditForm({...editForm, calfsize: parseInt(e.target.value)})} style={inputStyle} /></div>
                            </div>
                        </>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button type="submit" style={{ flex: 1, padding: '12px', background: '#00f2fe', color: '#000', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer' }}>
                             Save All Changes
                        </button>
                        <button type="button" onClick={() => setEditingCard(null)} style={{ padding: '12px 20px', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* EDIT MANAGER MODAL */}
      {editingManager && (
        <div
            className="modal-overlay"
            onClick={() => setEditingManager(null)}
            style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <div
                className="modal-box"
                onClick={(e) => e.stopPropagation()}
                style={{
                background: '#18181b', border: '1px solid #00f2fe',
                borderRadius: '12px', padding: '25px', width: '100%', maxWidth: '560px',
                color: '#fff', boxShadow: '0 10px 40px rgba(0,242,254,0.3)',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#00f2fe' }}> Edit Manager: {editingManager.managername} (#{editingManager.managerid})</h3>
                    <button onClick={() => setEditingManager(null)} style={{ background: 'none', border: 'none', color: '#44e1ef', fontSize: '2em', cursor: 'pointer' }}><IoMdClose />
</button>
                </div>

                <form onSubmit={handleSaveEditManager} style={{ display: 'grid', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={{ fontSize: '0.7em', color: '#aaa' }}>Manager Name</label>
                            <input value={editManagerForm.managername} onChange={e => setEditManagerForm({...editManagerForm, managername: e.target.value})} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7em', color: '#aaa' }}>Primary Playstyle</label>
                            <select value={editManagerForm.playstyle} onChange={e => setEditManagerForm({...editManagerForm, playstyle: e.target.value})} style={inputStyle} required>
                                <option value="Possession Game">Possession Game</option>
                                <option value="Quick Counter">Quick Counter</option>
                                <option value="Long Ball Counter">Long Ball Counter</option>
                                <option value="Out Wide">Out Wide</option>
                                <option value="Long Ball">Long Ball</option>
                    <option value="Overload">Overload</option>
                            </select>
                        </div>
                    </div>

                    {/* MANAGER IMAGE URL */}
                    <div>
                        <label style={{ fontSize: '0.7em', color: '#aaa', display: 'block', marginBottom: '4px' }}>Manager Image URL</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input 
                                placeholder="https://... Image URL for manager photo" 
                                value={editManagerForm.managerimageurl || ''} 
                                onChange={e => setEditManagerForm({...editManagerForm, managerimageurl: e.target.value})} 
                                style={{ ...inputStyle, flex: 1 }} 
                            />
                            {editManagerForm.managerimageurl && (
                                <img 
                                    src={editManagerForm.managerimageurl} 
                                    alt="Preview" 
                                    style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1.5px solid #00f2fe' }}
                                    onError={e => { e.target.style.display = 'none'; }}
                                />
                            )}
                        </div>
                    </div>

                    {/* AFFILIATIONS */}
                    <div style={{ background: '#222', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                        <div style={{ fontSize: '0.72em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 'bold' }}>Affiliations</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            <select value={editManagerForm.nationalityid} onChange={e => setEditManagerForm({...editManagerForm, nationalityid: e.target.value})} style={inputStyle}>
                                <option value="">Nationality</option>
                                {helpers.nations.map(n => <option key={n.nationalityid} value={n.nationalityid}>{n.countryname}</option>)}
                            </select>
                            <select value={editManagerForm.leagueid} onChange={e => setEditManagerForm({ ...editManagerForm, leagueid: e.target.value, clubid: '' })} style={inputStyle}>
                                <option value="">League</option>
                                {helpers.leagues.map(l => <option key={l.leagueid} value={l.leagueid}>{l.leaguename}</option>)}
                            </select>
                            <select value={editManagerForm.clubid} onChange={e => setEditManagerForm({ ...editManagerForm, clubid: e.target.value })} style={inputStyle} disabled={!editManagerForm.leagueid}>
                                <option value="">{editManagerForm.leagueid ? 'Club' : 'Select League first...'}</option>
                                {editManagerClubs.map(c => <option key={c.clubid} value={c.clubid}>{c.clubname}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* 5 PLAYSTYLES */}
                    <div style={{ background: '#222', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                        <div style={{ fontSize: '0.72em', color: '#00f2fe', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 'bold' }}>Tactical Playstyle Proficiencies</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                            <div><label style={{ fontSize: '0.6em', color: '#aaa' }}>Possession</label><input type="number" min="40" max="99" value={editManagerForm.possession_game} onChange={e => setEditManagerForm({...editManagerForm, possession_game: parseInt(e.target.value) || 50})} style={{ ...inputStyle, padding: '6px' }} /></div>
                            <div><label style={{ fontSize: '0.6em', color: '#aaa' }}>QC</label><input type="number" min="40" max="99" value={editManagerForm.quick_counter} onChange={e => setEditManagerForm({...editManagerForm, quick_counter: parseInt(e.target.value) || 50})} style={{ ...inputStyle, padding: '6px' }} /></div>
                            <div><label style={{ fontSize: '0.6em', color: '#aaa' }}>LBC</label><input type="number" min="40" max="99" value={editManagerForm.long_ball_counter} onChange={e => setEditManagerForm({...editManagerForm, long_ball_counter: parseInt(e.target.value) || 50})} style={{ ...inputStyle, padding: '6px' }} /></div>
                            <div><label style={{ fontSize: '0.6em', color: '#aaa' }}>Out Wide</label><input type="number" min="40" max="99" value={editManagerForm.out_wide} onChange={e => setEditManagerForm({...editManagerForm, out_wide: parseInt(e.target.value) || 50})} style={{ ...inputStyle, padding: '6px' }} /></div>
                            <div><label style={{ fontSize: '0.6em', color: '#aaa' }}>Long Ball</label><input type="number" min="40" max="99" value={editManagerForm.long_ball} onChange={e => setEditManagerForm({...editManagerForm, long_ball: parseInt(e.target.value) || 50})} style={{ ...inputStyle, padding: '6px' }} /></div>
                            <div><label style={{ fontSize: '0.6em', color: '#aaa' }}>Overload</label><input type="number" min="40" max="99" value={editManagerForm.overload} onChange={e => setEditManagerForm({...editManagerForm, overload: parseInt(e.target.value) || 50})} style={{ ...inputStyle, padding: '6px' }} /></div>
                        </div>
                    </div>

                    {/* BOOSTERS */}
                    <div style={{ background: '#222', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                        <div style={{ fontSize: '0.72em', color: '#ff4d79', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 'bold' }}>Stat Boosters</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '6px' }}>
                                <select value={editManagerForm.boost1_stat} onChange={e => setEditManagerForm({...editManagerForm, boost1_stat: e.target.value})} style={inputStyle}>
                                    <option value="">Boost 1 (None)</option>
                                    {statTypes.map(s => {
                                        const formatted = s.statname.replace(/([A-Z])/g, ' $1').replace(/^Gk\b/i, 'GK').trim();
                                        return <option key={s.statname} value={s.statname}>{formatted}</option>;
                                    })}
                                </select>
                                <input type="number" min="1" max="3" value={editManagerForm.boost1_val} onChange={e => setEditManagerForm({...editManagerForm, boost1_val: parseInt(e.target.value) || 1})} style={inputStyle} disabled={!editManagerForm.boost1_stat} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '6px' }}>
                                <select value={editManagerForm.boost2_stat} onChange={e => setEditManagerForm({...editManagerForm, boost2_stat: e.target.value})} style={inputStyle}>
                                    <option value="">Boost 2 (None)</option>
                                    {statTypes.map(s => {
                                        const formatted = s.statname.replace(/([A-Z])/g, ' $1').replace(/^Gk\b/i, 'GK').trim();
                                        return <option key={s.statname} value={s.statname}>{formatted}</option>;
                                    })}
                                </select>
                                <input type="number" min="1" max="3" value={editManagerForm.boost2_val} onChange={e => setEditManagerForm({...editManagerForm, boost2_val: parseInt(e.target.value) || 1})} style={inputStyle} disabled={!editManagerForm.boost2_stat} />
                            </div>
                        </div>
                    </div>

                    {/* LINK-UP */}
                    <div style={{ background: '#222', padding: '10px', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.4)' }}>
                        <div style={{ fontSize: '0.72em', color: '#fbbf24', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 'bold' }}> Link-Up Philosophy</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                            <input placeholder="Type (e.g. Breakthrough Pass A)" value={editManagerForm.linkup_type} onChange={e => setEditManagerForm({...editManagerForm, linkup_type: e.target.value})} style={inputStyle} />
                            <input placeholder="Positions (e.g. AMF, CF)" value={editManagerForm.linkup_positions} onChange={e => setEditManagerForm({...editManagerForm, linkup_positions: e.target.value})} style={inputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <input placeholder="Center Piece" value={editManagerForm.linkup_centerpiece} onChange={e => setEditManagerForm({...editManagerForm, linkup_centerpiece: e.target.value})} style={inputStyle} />
                            <input placeholder="Key Man" value={editManagerForm.linkup_keyman} onChange={e => setEditManagerForm({...editManagerForm, linkup_keyman: e.target.value})} style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button type="submit" style={{ flex: 1, padding: '12px', background: '#00f2fe', color: '#000', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer' }}>
                             Save Manager Updates
                        </button>
                        <button type="button" onClick={() => setEditingManager(null)} style={{ padding: '12px 20px', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* CUSTOM DIALOG POPUP WINDOW */}
      {dialog && (
        <div
            className="modal-overlay"
            onClick={() => { if (dialog.onCancel) dialog.onCancel(); setDialog(null); }}
            style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, padding: '20px', fontFamily: "'Outfit', sans-serif"
        }}>
            <div
                className="modal-box"
                onClick={(e) => e.stopPropagation()}
                style={{
                background: '#111722',
                border: dialog.type === 'danger' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(0, 242, 254, 0.4)',
                borderRadius: '16px',
                padding: '30px',
                maxWidth: '450px',
                width: '100%',
                color: '#fff',
                boxShadow: dialog.type === 'danger' ? '0 10px 40px rgba(239, 68, 68, 0.25)' : '0 10px 40px rgba(0, 242, 254, 0.25)',
                textAlign: 'center',
                animation: 'fadeIn 0.2s ease'
            }}>
                <div style={{ fontSize: '3em', marginBottom: '15px' }}>
                    {dialog.type === 'danger' ? '⚠️' : 'ℹ️'}
                </div>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1.4em', fontWeight: '900', color: dialog.type === 'danger' ? '#ef4444' : '#00f2fe' }}>
                    {dialog.title}
                </h3>
                <p style={{ margin: '0 0 25px 0', color: '#94a3b8', fontSize: '0.95em', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {dialog.message}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
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
                    <button 
                        onClick={() => {
                            if (dialog.onConfirm) dialog.onConfirm();
                            setDialog(null);
                        }}
                        style={{
                            flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                            background: dialog.type === 'danger' 
                                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                                : 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                            color: dialog.type === 'danger' ? '#fff' : '#000',
                            fontWeight: 'bold', cursor: 'pointer', transition: '0.2s',
                            boxShadow: dialog.type === 'danger' ? '0 4px 14px rgba(239, 68, 68, 0.4)' : '0 4px 14px rgba(0, 242, 254, 0.3)'
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