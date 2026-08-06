import { useState, useEffect } from 'react';
import axios from 'axios';
axios.defaults.withCredentials = true;

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('player'); 
  const [mgmtTab, setMgmtTab] = useState('database'); 
  const [message, setMessage] = useState('');
  
 
  const [helpers, setHelpers] = useState({ leagues: [], nations: [], positions: [] });
  const [playersList, setPlayersList] = useState([]); 
  const [cardsList, setCardsList] = useState([]); 
  const [managersList, setManagersList] = useState([]); 
 
  const [formTypes, setFormTypes] = useState([]); 
  const [injuryTypes, setInjuryTypes] = useState([]);
  const [statTypes, setStatTypes] = useState([]); 
  
  
  const [formClubs, setFormClubs] = useState([]); 
  const [mgmtClubs, setMgmtClubs] = useState([]);


  const [playerForm, setPlayerForm] = useState({ playername: '', age: '', leagueid: '', clubid: '', nationalityid: '', marketvalue: '' });
  const [cardForm, setCardForm] = useState({ playerid: '', cardtype: 'Standard', positioncode: '', baseoverallrating: 75, currentoverallrating: 75, maxoverallrating: 85 });
  const [managerForm, setManagerForm] = useState({ managername: '', playstyle: '', leagueid: '', clubid: '', nationalityid: '' });
  const [statsForm, setStatsForm] = useState({ cardid: '', offensiveawareness: 60, finishing: 60, ballcontrol: 60, dribbling: 60, passing: 60, kickingpower: 60, speed: 60, acceleration: 60, stamina: 60, balance: 60, physicalcontact: 60, jump: 60, defensiveawareness: 40, tackling: 40, aggression: 40, gkawareness: 40, gkcatching: 40, gkparrying: 40, gkreflexes: 40, gkreach: 40 });
  

  const [statusForm, setStatusForm] = useState({ playerid: '', formtypeid: '', injurytypeid: '' });


  const [boostForm, setBoostForm] = useState({
      managerid: '',
      boost1: { statName: '', value: 1 },
      boost2: { statName: '', value: 1 }
  });


  const [mgmtSearch, setMgmtSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]); 
  const [mgmtFilters, setMgmtFilters] = useState({ leagueId: '', clubId: '', nationId: '', cardType: '', posCode: '' });
  const [mgmtResults, setMgmtResults] = useState([]);


  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = () => {
    fetchHelpers(); fetchPlayers(); fetchCards(); fetchManagers();
    fetchFormTypes(); fetchInjuryTypes(); fetchStatTypes(); 
  };


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
    if (mgmtFilters.leagueId) axios.get(`http://localhost:5001/api/players/clubs-by-league?leagueId=${mgmtFilters.leagueId}`).then(res => setMgmtClubs(res.data));
    else setMgmtClubs([]);
  }, [mgmtFilters.leagueId]);

  const fetchHelpers = () => axios.get('http://localhost:5001/api/players/helpers').then(res => setHelpers(res.data));
  const fetchPlayers = () => axios.get('http://localhost:5001/api/players/list-players').then(res => setPlayersList(res.data));
  
  const fetchCards = () => axios.get('http://localhost:5001/api/players/list-cards').then(res => {
      setCardsList(res.data);
      if(mgmtResults.length === 0) setMgmtResults(res.data);
  });
  
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

    if (window.confirm(`⚠️ DELETE PLAYER: "${playerName}"?\n\nThis will delete the player AND ALL their cards/stats.\nThis cannot be undone.`)) {
        try {
            await axios.delete(`http://localhost:5001/api/players/delete-player/${targetId}`);
            setMessage(`✅ Player "${playerName}" deleted.`);
            fetchAllData(); handleMgmtSearch();
        } catch (err) { setMessage("❌ Error deleting player."); }
    }
  };

  const handleDeleteCard = async (id) => {
    if (window.confirm("DELETE CARD ONLY?\n\nThe Player record will remain.")) {
        try {
            await axios.delete(`http://localhost:5001/api/players/delete-card/${id}`);
            setMessage("✅ Card deleted. Player preserved.");
            fetchAllData(); handleMgmtSearch();
        } catch (err) { setMessage("❌ Error deleting card."); }
    }
  };

  const handleDeleteManager = async (id) => {
    if (window.confirm("Delete Manager?")) {
        try {
            await axios.delete(`http://localhost:5001/api/managers/delete/${id}`);
            setMessage("✅ Manager deleted.");
            fetchManagers();
        } catch (err) { setMessage("❌ Error deleting manager."); }
    }
  };


  const handlePlayerSubmit = (e) => { 
      e.preventDefault(); 

      if (!playerForm.marketvalue) {
          return setMessage('❌ Please enter a Market Value!');
      }
      axios.post('http://localhost:5001/api/players/add-player', playerForm).then(() => { 
          setMessage('✅ Player Saved!'); 
          setPlayerForm({ playername: '', age: '', leagueid: '', clubid: '', nationalityid: '', marketvalue: '' });
          fetchAllData(); 
      }); 
  };
  const handleCardSubmit = (e) => { e.preventDefault(); axios.post('http://localhost:5001/api/players/add-card', cardForm).then(() => { setMessage('✅ Card Created!'); fetchAllData(); }); };
  const handleManagerSubmit = (e) => { e.preventDefault(); axios.post('http://localhost:5001/api/managers/add', managerForm).then(() => { setMessage('✅ Manager Registered!'); fetchManagers(); }); };
const handleStatsSubmit = async (e) => { 
      e.preventDefault(); 
      try {
          await axios.post('http://localhost:5001/api/players/add-stats', statsForm);
          setMessage('✅ Stats Saved!'); 
      } catch (error) {
          
          const dbErrorMessage = error.response?.data?.error || "Error saving stats";
          setMessage(dbErrorMessage.replace('error: ', '')); 
      }
  };


  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    
    if(!statusForm.playerid || !statusForm.formtypeid) {
        return setMessage("❌ Error: Player and Form are required.");
    }

    try {
        await axios.put('http://localhost:5001/api/players/update-status', {
            playerId: statusForm.playerid,
            formId: statusForm.formtypeid,
            injuryId: statusForm.injurytypeid 
        });

        setMessage("✅ Status Updated & Market Value Recalculated!");
        setStatusForm({ playerid: '', formtypeid: '', injurytypeid: '' }); 
    } catch (err) {
        console.error(err);
        setMessage("❌ Update Failed. Check console.");
    }
  };


  const handleBoostSubmit = async (e) => {
      e.preventDefault();
      if (!boostForm.managerid) return setMessage("❌ Select a manager.");
      
      if (boostForm.boost1.statName && boostForm.boost2.statName && boostForm.boost1.statName === boostForm.boost2.statName) {
          return setMessage("❌ You cannot assign the same stat twice to one manager.");
      }

      const boostsArray = [];
      if (boostForm.boost1.statName) boostsArray.push(boostForm.boost1);
      if (boostForm.boost2.statName) boostsArray.push(boostForm.boost2);

      try {
          await axios.post('http://localhost:5001/api/managers/boosts', {
              managerid: boostForm.managerid,
              boosts: boostsArray
          });
          setMessage("✅ Manager Boosts assigned successfully!");
          setBoostForm({ managerid: '', boost1: { statName: '', value: 1 }, boost2: { statName: '', value: 1 } });
      } catch (err) {
          setMessage("❌ Failed to assign boosts.");
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
        setMessage("✅ Stats Generated based on Role!");
    } catch (err) { 
        setMessage("❌ Error: " + (err.response?.data?.error || "Could not generate stats")); 
    }
};

  const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: 'white', width: '100%' };

  return (
    <div style={{ padding: '40px', background: '#121212', color: '#e0e0e0', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '25px', borderLeft: '4px solid #007bff', paddingLeft: '15px' }}>🛠️ Registry & Management Hub</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {['player', 'card', 'stats', 'manager', 'status', 'boosts'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setMessage(''); }} style={{ padding: '12px 24px', background: activeTab === tab ? '#007bff' : '#333', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
                {tab === 'status' ? '5. Update Status (Market Value)' : tab === 'boosts' ? '6. Manager Boosts' : tab === 'stats' ? '3. Add Stats' : `${['player', 'card', 'stats', 'manager'].indexOf(tab) + 1}. Add ${tab.toUpperCase()}`}
            </button>
        ))}
      </div>

      {message && <div style={{ padding: '12px', background: '#1e1e1e', border: '1px solid #333', marginBottom: '20px', borderRadius: '4px', color: message.includes('Error') || message.includes('Failed') || message.includes('cannot') ? '#ff4d4d' : '#4dff4d', fontWeight: 'bold' }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '50px' }}>
        
 
        <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '8px', border: '1px solid #333' }}>
          
          {activeTab === 'player' && (
            <form onSubmit={handlePlayerSubmit} style={{ display: 'grid', gap: '20px' }}>
                <h3>Register Entity</h3>
                <input placeholder="Name" value={playerForm.playername} onChange={e=>setPlayerForm({...playerForm, playername: e.target.value})} style={inputStyle} required />
                <input placeholder="Age" type="number" value={playerForm.age} onChange={e=>setPlayerForm({...playerForm, age: e.target.value})} style={inputStyle} required />
                
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <span style={{color:'#00ff00', fontSize:'1.2em'}}>$</span>
                    <input 
                        placeholder="Market Value (Million €)" 
                        type="number" 
                        step="0.01" 
                        value={playerForm.marketvalue} 
                        onChange={e=>setPlayerForm({...playerForm, marketvalue: e.target.value})} 
                        style={inputStyle} 
                        required
                    />
                </div>

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
                <button type="submit" style={{ ...inputStyle, background: '#28a745', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Register Player</button>
            </form>
          )}

          {activeTab === 'card' && (
            <form onSubmit={handleCardSubmit} style={{ display: 'grid', gap: '15px' }}>
                <h3>Initialize Card</h3>
                <select value={cardForm.playerid} onChange={e=>setCardForm({...cardForm, playerid: e.target.value})} style={inputStyle} required>
                    <option value="">Select Player...</option>
                    {playersList.map(p => <option key={p.playerid} value={p.playerid}>{p.playername}</option>)}
                </select>
                <select value={cardForm.cardtype} onChange={e=>setCardForm({...cardForm, cardtype: e.target.value})} style={inputStyle}>
                    <option value="Standard">Standard</option><option value="Legendary">Legendary</option><option value="POTW">POTW</option>
                </select>
                <select value={cardForm.positioncode} onChange={e=>setCardForm({...cardForm, positioncode: e.target.value})} style={inputStyle} required>
                    <option value="">Position...</option>
                    {helpers.positions.map(pos => <option key={pos.positioncode} value={pos.positioncode}>{pos.positioncode}</option>)}
                </select>
                <div style={{display:'flex', gap:'10px'}}>
                    <div style={{flex:1}}><label style={{fontSize:'0.7em'}}>Base OVR</label> <input type="number" value={cardForm.baseoverallrating} onChange={e=> setCardForm({...cardForm, baseoverallrating: parseInt(e.target.value), currentoverallrating: Math.max(parseInt(e.target.value), cardForm.currentoverallrating)})} style={inputStyle} /></div>
                    <div style={{flex:1}}><label style={{fontSize:'0.7em'}}>Current OVR</label> <input type="number" value={cardForm.currentoverallrating} onChange={e=>setCardForm({...cardForm, currentoverallrating: parseInt(e.target.value)})} style={inputStyle} /></div>
                    <div style={{flex:1}}><label style={{fontSize:'0.7em'}}>Max OVR</label> <input type="number" value={cardForm.maxoverallrating} onChange={e=>setCardForm({...cardForm, maxoverallrating: parseInt(e.target.value)})} style={inputStyle} /></div>
                </div>
                <button type="submit" style={{ ...inputStyle, background: '#28a745', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Create Entity</button>
            </form>
          )}

          {activeTab === 'manager' && (
            <form onSubmit={handleManagerSubmit} style={{ display: 'grid', gap: '20px' }}>
                <h3>Register Manager</h3>
                <input placeholder="Name" value={managerForm.managername} onChange={e=>setManagerForm({...managerForm, managername: e.target.value})} style={inputStyle} required />
                <select value={managerForm.playstyle} onChange={e=>setManagerForm({...managerForm, playstyle: e.target.value})} style={inputStyle} required>
                    <option value="">Select Playstyle...</option>
                    <option value="Possession">Possession</option><option value="Long Ball Counter">Long Ball Counter</option><option value="Quick Counter">Quick Counter</option><option value="Long Ball">Long Ball</option><option value="Out Wide">Out Wide</option>
                </select>
                <select value={managerForm.nationalityid} onChange={e=>setManagerForm({...managerForm, nationalityid: e.target.value})} style={inputStyle} required>
                    <option value="">Nationality</option>
                    {helpers.nations.map(n => <option key={n.nationalityid} value={n.nationalityid}>{n.countryname}</option>)}
                </select>
                <select value={managerForm.leagueid} onChange={e => setManagerForm({ ...managerForm, leagueid: e.target.value, clubid: '' })} style={inputStyle} required>
                    <option value="">League</option>
                    {helpers.leagues.map(l => <option key={l.leagueid} value={l.leagueid}>{l.leaguename}</option>)}
                </select>
                <select value={managerForm.clubid} onChange={e => setManagerForm({ ...managerForm, clubid: e.target.value })} style={inputStyle} disabled={!managerForm.leagueid} required>
                    <option value="">{managerForm.leagueid ? 'Select Club' : 'Select League first...'}</option>
                    {formClubs.map(c => <option key={c.clubid} value={c.clubid}>{c.clubname}</option>)}
                </select>
                <button type="submit" style={{ ...inputStyle, background: '#28a745', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Register Manager</button>
            </form>
          )}

          {activeTab === 'stats' && (
             <form onSubmit={handleStatsSubmit} style={{ display: 'grid', gap: '15px' }}>
                <h3>Assign Attributes</h3>
                <select onChange={handleCardSelectForStats} style={inputStyle} required>
    <option value="">Select Card (Auto-Calculate)...</option>
    {/* 👇 CHANGED: Added .filter(c => c.cardid) so players without cards don't show up here */}
    {cardsList.filter(c => c.cardid).map(c => <option key={c.cardid} value={c.cardid}>{c.playername || c.player?.playername} ({c.baseoverallrating})</option>)}
</select>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                    {Object.keys(statsForm).map((key) => key !== 'cardid' && (
                        <div key={key}>
                            <label style={{fontSize:'0.6em', color:'#aaa', textTransform:'uppercase'}}>{key.replace('gk', 'GK ')}</label>
                            <input type="number" value={statsForm[key]} onChange={e=>setStatsForm({...statsForm, [key]: e.target.value})} style={{...inputStyle, padding:'8px'}} />
                        </div>
                    ))}
                </div>
                <button type="submit" style={{ ...inputStyle, background: '#28a745', border: 'none', fontWeight: 'bold' }}>Commit Stats</button>
            </form>
          )}

          {activeTab === 'status' && (
            <form onSubmit={handleStatusSubmit} style={{ display: 'grid', gap: '20px' }}>
                <h3 style={{ margin: 0, color: '#e0a800' }}>Update Player Status & Market Value</h3>
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
                    <option value="">Medical Status (Optional)...</option>
                    <option value="" style={{color: '#4dff4d', fontWeight:'bold'}}>🟢 HEALTHY (No Injury)</option>
                    {injuryTypes.map(i => <option key={i.injurytypeid} value={i.injurytypeid}>{i.injuryname} (x{i.defaultmultiplier})</option>)}
                </select>

                <button type="submit" style={{ ...inputStyle, background: '#007bff', fontWeight: 'bold', border: 'none', color: '#fff', cursor: 'pointer', padding:'15px' }}>
                    UPDATE STATUS & RECALCULATE VALUE
                </button>
            </form>
          )}

          {/* --- NEW MANAGER BOOST TAB --- */}
          {activeTab === 'boosts' && (
            <form onSubmit={handleBoostSubmit} style={{ display: 'grid', gap: '20px' }}>
                <h3 style={{ margin: 0, color: '#00ffff' }}>Assign Manager Stat Boosters</h3>
                <p style={{fontSize:'0.8em', color:'#aaa'}}>
                    Select a manager and assign up to <b>two unique stat boosts</b> (Value: 1 to 3).
                </p>

                {/* Select Manager */}
                <select value={boostForm.managerid} onChange={e=>setBoostForm({...boostForm, managerid: e.target.value})} style={inputStyle} required>
                    <option value="">Select Manager...</option>
                    {managersList.map(m => <option key={m.managerid} value={m.managerid}>{m.managername} ({m.playstyle})</option>)}
                </select>

                {/* BOOST 1 */}
                <div style={{ padding: '15px', background: '#252525', borderRadius: '8px', border: '1px solid #444' }}>
                    <h4 style={{margin: '0 0 10px 0', color: '#fff'}}>Slot 1</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                        <select value={boostForm.boost1.statName} onChange={e=>setBoostForm({...boostForm, boost1: { ...boostForm.boost1, statName: e.target.value }})} style={inputStyle}>
                            <option value="">Select Stat to Boost...</option>
                            {statTypes.map(s => <option key={s.statname} value={s.statname}>{s.statname}</option>)}
                        </select>
                        <input type="number" min="1" max="3" value={boostForm.boost1.value} onChange={e=>setBoostForm({...boostForm, boost1: { ...boostForm.boost1, value: parseInt(e.target.value) }})} style={inputStyle} placeholder="Value" disabled={!boostForm.boost1.statName} />
                    </div>
                </div>

                {/* BOOST 2 */}
                <div style={{ padding: '15px', background: '#252525', borderRadius: '8px', border: '1px solid #444' }}>
                    <h4 style={{margin: '0 0 10px 0', color: '#fff'}}>Slot 2 (Optional)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                        <select value={boostForm.boost2.statName} onChange={e=>setBoostForm({...boostForm, boost2: { ...boostForm.boost2, statName: e.target.value }})} style={inputStyle}>
                            <option value="">Select Stat to Boost...</option>
                            {statTypes.map(s => <option key={s.statname} value={s.statname}>{s.statname}</option>)}
                        </select>
                        <input type="number" min="1" max="3" value={boostForm.boost2.value} onChange={e=>setBoostForm({...boostForm, boost2: { ...boostForm.boost2, value: parseInt(e.target.value) }})} style={inputStyle} placeholder="Value" disabled={!boostForm.boost2.statName} />
                    </div>
                </div>

                <button type="submit" style={{ ...inputStyle, background: '#00ffff', fontWeight: 'bold', border: 'none', color: '#000', cursor: 'pointer', padding:'15px' }}>
                    SAVE BOOSTS
                </button>
            </form>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ background: '#1e1e1e', padding: '25px', borderRadius: '8px', border: '1px solid #333', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, textTransform: 'uppercase', fontSize: '0.8em', color: '#888' }}>Management</h4>
                <div style={{ background: '#2a2a2a', borderRadius: '4px', display: 'flex', padding: '2px' }}>
                    <button onClick={() => setMgmtTab('database')} style={{ background: mgmtTab === 'database' ? '#444' : 'none', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.7em' }}>DATABASE</button>
                    <button onClick={() => setMgmtTab('managers')} style={{ background: mgmtTab === 'managers' ? '#444' : 'none', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.7em' }}>MANAGERS</button>
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
                            <option value="POTW">POTW</option><option value="Legendary">Legendary</option><option value="Standard">Standard</option>
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
                    <button onClick={handleMgmtSearch} style={{ ...inputStyle, background: '#007bff', fontWeight: 'bold', border: 'none' }}>Apply Database Filter</button>
                </div>
            )}

            <ul style={{ listStyle: 'none', padding: 0 }}>
                {mgmtTab === 'database' && mgmtResults.map(item => ( 
                    <li key={item.cardid || `player-${item.playerid}`} style={{ padding: '15px', borderBottom: '1px solid #333', background: '#252525', marginBottom: '8px', borderRadius: '4px' }}> 
        <div style={{marginBottom: '10px'}}>
            <div style={{fontWeight: 'bold', color: '#fff'}}>{item.player?.playername || item.playername}</div>
            <div style={{fontSize: '0.7em', color: '#aaa'}}>
                {item.cardtype} {item.cardid ? `• ${item.baseoverallrating} OVR` : ''}
            </div>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
            {/* 👇 CHANGED: Conditionally render Delete Card button ONLY if card exists */}
            {item.cardid && (
                <button onClick={() => handleDeleteCard(item.cardid)} style={{ flex: 1, background: '#444', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em' }}>Delete Card</button>
            )}
            <button onClick={() => handleDeletePlayer(item.playerid || item.player?.playerid, item.player?.playername || item.playername)} style={{ flex: 1, background: '#dc3545', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8em' }}>Delete Player (All)</button>
        </div>
    </li>
                ))}

                {mgmtTab === 'managers' && managersList.map(item => ( 
                    <li key={item.managerid} style={{ padding: '15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#252525', marginBottom: '5px' }}> 
                        <div><b>👔 {item.managername}</b><div style={{fontSize:'0.7em', color:'#aaa'}}>{item.playstyle}</div></div> 
                        <button onClick={() => handleDeleteManager(item.managerid)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button> 
                    </li> 
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
}