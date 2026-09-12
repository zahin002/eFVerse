import { useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;
export default function SmartSearch({ onCardClick }) {
    
    const [helpers, setHelpers] = useState({ leagues: [], nations: [], positions: [] });
    const [filteredClubs, setFilteredClubs] = useState([]); 
    
  
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    
   
    const initialFilters = {
        leagueId: null, 
        clubId: null, 
        nationId: null, 
        cardType: null, 
        posCode: null,
        offAware: null, finishing: null, ballCtrl: null, dribbling: null, passing: null,
        kickPwr: null, speed: null, accel: null, stamina: null, balance: null,
        physCont: null, jump: null, defAware: null, tackling: null, aggression: null,
        gkAware: null, gkCatch: null, gkParry: null, gkReflex: null, gkReach: null
    };

    const [filters, setFilters] = useState(initialFilters);

  
    useEffect(() => {
        const fetchHelpers = async () => {
            try {
                const res = await axios.get('http://localhost:5001/api/players/helpers');
                setHelpers(res.data);
            } catch (err) {
                console.error("Helper Fetch Error:", err);
            }
        };
        fetchHelpers();
    }, []); 

   
    useEffect(() => {
        if (filters.leagueId) {
            
            axios.get(`http://localhost:5001/api/players/clubs-by-league?leagueId=${filters.leagueId}`)
                 .then(res => {
                     setFilteredClubs(res.data);
                 })
                 .catch(err => console.error("SQL Dependency Error:", err));
        } else {
            setFilteredClubs([]); 
        }
    }, [filters.leagueId]);

   
    useEffect(() => {
        if (searchTerm.trim().length < 2) {
            setSuggestions([]);
            return;
        }
        const delay = setTimeout(async () => {
            try {
                const res = await axios.get(`http://localhost:5001/api/players/suggestions?term=${searchTerm.trim()}`);
                setSuggestions(res.data);
            } catch (err) { console.error(err); }
        }, 300);
        return () => clearTimeout(delay);
    }, [searchTerm]);

   
    const handleSearch = async () => {
        try {
            const activeParams = {};
            
            if (searchTerm.trim().length > 0) activeParams.name = searchTerm.trim();

            Object.keys(filters).forEach(key => {
                const val = filters[key];
                if (val !== null && val !== '') {
                    activeParams[key] = val;
                }
            });

            const params = new URLSearchParams(activeParams).toString();
            console.log("📡 Executing Search with active criteria:", activeParams);

            const res = await axios.get(`http://localhost:5001/api/players/smart-search?${params}`);
            setSearchResults(res.data);
            setHasSearched(true);
        } catch (err) { 
            console.error("Search Failed", err); 
            setSearchResults([]);
            setHasSearched(true);
        }
    };

    const handleReset = () => {
        setSearchTerm('');
        setFilters(initialFilters);
        setSearchResults([]);
        setFilteredClubs([]);
        setHasSearched(false);
    };

    const inputStyle = { padding: '10px', background: '#333', color: 'white', border: '1px solid #444', borderRadius: '5px', width: '100%', marginBottom: '10px' };

    return (
        <div style={{ color: 'white', marginTop: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '30px', textAlign: 'left' }}>
                
                {/* --- FILTER SIDEBAR --- */}
                <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px', height: 'fit-content', border: '1px solid #333' }}>
                    <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>🔍 Smart Filter</h3>
                    
                    {/* Name Input */}
                    <div style={{ position: 'relative' }}>
                        <input 
                            style={inputStyle} 
                            placeholder="Player Name (Optional)..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                        {suggestions.length > 0 && (
                            <ul style={{ position: 'absolute', top: '40px', left: 0, width: '100%', background: '#222', border: '1px solid #444', zIndex: 10, listStyle: 'none', padding: 0, borderRadius: '5px' }}>
                                {suggestions.map(name => (
                                    <li key={name} onClick={() => { setSearchTerm(name); setSuggestions([]); }} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #333' }}>{name}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/**/}
                    <select 
                        value={filters.leagueId || ''} 
                        style={inputStyle} 
                        onChange={e => setFilters({...filters, leagueId: e.target.value || null, clubId: null})}
                    >
                        <option value="">Any League</option>
                        {helpers.leagues.map(l => <option key={l.leagueid} value={l.leagueid}>{l.leaguename}</option>)}
                    </select>

                    {/**/}
                    <select 
                        value={filters.clubId || ''} 
                        style={{...inputStyle, opacity: !filters.leagueId ? 0.6 : 1}} 
                        disabled={!filters.leagueId}
                        onChange={e => setFilters({...filters, clubId: e.target.value || null})}
                    >
                        <option value="">{filters.leagueId ? 'Any Club' : 'Select League first...'}</option>
                        {filteredClubs.map(c => (
                            <option key={c.clubid} value={c.clubid}>
                                {c.clubname}
                            </option>
                        ))}
                    </select>

                    {/* PLAYER TYPE TAG BADGES (MATCHING EFHUB DESIGNS) */}
                    <div style={{ marginBottom: '15px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: '0.8em', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span>Player Type</span>
                            {filters.cardType && (
                                <span onClick={() => setFilters({ ...filters, cardType: null })} style={{ color: '#ff4d4d', cursor: 'pointer', fontSize: '0.85em' }}>Clear</span>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {['Normal', 'Featured', 'Trending', 'Legend', 'Epic', 'Highlight', 'Bigtime', 'Showtime'].map(type => {
                                const active = filters.cardType === type || 
                                              (filters.cardType === 'Standard' && type === 'Normal') || 
                                              (filters.cardType === 'POTW' && type === 'Trending') || 
                                              (filters.cardType === 'Legendary' && type === 'Legend');
                                return (
                                    <button 
                                        key={type}
                                        type="button"
                                        onClick={() => setFilters({ ...filters, cardType: active ? null : type })}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: active ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                                            fontSize: '0.85em',
                                            fontWeight: '700',
                                            fontFamily: "'Outfit', sans-serif",
                                            cursor: 'pointer',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            background: active ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.3) 0%, rgba(56, 189, 248, 0.2) 100%)' : 'rgba(255, 255, 255, 0.04)',
                                            color: active ? '#38bdf8' : '#cbd5e1',
                                            boxShadow: active ? '0 0 12px rgba(56, 189, 248, 0.35)' : 'none',
                                            transform: active ? 'scale(1.02)' : 'none'
                                        }}
                                    >
                                        {type}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <select value={filters.posCode || ''} style={inputStyle} onChange={e => setFilters({...filters, posCode: e.target.value || null})}>
                        <option value="">Any Position</option>
                        {helpers.positions.map(p => <option key={p.positioncode} value={p.positioncode}>{p.positioncode}</option>)}
                    </select>

                    {/* Stats Sliders */}
                    <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '10px', paddingRight: '10px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                        <p style={{ fontSize: '0.8em', color: '#888', marginBottom: '10px' }}>Attributes (Range: Max - 10)</p>
                        {Object.keys(filters).map(key => {
                            if (['leagueId', 'clubId', 'nationId', 'cardType', 'posCode'].includes(key)) return null;
                            const isActive = filters[key] !== null;
                            return (
                                <div key={key} style={{ marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <label style={{ fontSize: '0.7em', textTransform: 'uppercase', color: isActive ? '#4dff4d' : '#888' }}>
                                            {key} {isActive ? `(${filters[key] - 10}-${filters[key]})` : '(Off)'}
                                        </label>
                                        {isActive && <span onClick={() => setFilters({...filters, [key]: null})} style={{ color: '#ff4d4d', cursor: 'pointer', fontSize: '0.9em' }}>✕</span>}
                                    </div>
                                    <input type="range" min="40" max="99" value={filters[key] || 40} onChange={e => setFilters({...filters, [key]: parseInt(e.target.value)})} style={{ width: '100%', cursor: 'pointer', opacity: isActive ? 1 : 0.3 }} />
                                </div>
                            );
                        })}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button onClick={handleSearch} style={{ flex: 2, padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Search</button>
                        <button onClick={handleReset} style={{ flex: 1, padding: '12px', background: '#444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Clear</button>
                    </div>
                </div>

                {/* --- RESULTS GRID --- */}
                <div>
                    <h3 style={{ marginTop: 0 }}>Results ({searchResults.length})</h3>
                    {!hasSearched ? (
                        <div style={{ padding: '80px 40px', textAlign: 'center', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '15px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <div style={{ fontSize: '2.5em', marginBottom: '12px' }}>🔍</div>
                            <h4 style={{ color: '#fff', marginBottom: '8px', fontWeight: '800' }}>Search for eFVerse Players</h4>
                            <p style={{ margin: 0, fontSize: '0.9em', color: '#64748b' }}>Enter a player name or apply smart filters, then click Search to display matching cards.</p>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div style={{ padding: '80px 40px', textAlign: 'center', color: '#f87171', background: 'rgba(248, 113, 113, 0.02)', borderRadius: '15px', border: '1px dashed rgba(248, 113, 113, 0.2)' }}>
                            <div style={{ fontSize: '2.5em', marginBottom: '12px' }}>⚠️</div>
                            <h4 style={{ color: '#f87171', marginBottom: '8px', fontWeight: '800' }}>No Matches Found</h4>
                            <p style={{ margin: 0, fontSize: '0.9em', color: '#64748b' }}>Try adjusting your filters or checking your spelling.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                            {searchResults.map(card => (
                                <div key={card.cardid} style={{ background: '#222', padding: '25px', borderRadius: '15px', border: '1px solid #333', textAlign: 'center', transition: 'all 0.3s ease' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1em', marginBottom: '5px' }}>{card.playername}</div>
                                    <div style={{ fontSize: '2.8em', fontWeight: '900', color: card.baserating >= 80 ? '#00ff00' : '#ffff00', margin: '10px 0' }}>{card.baserating}</div>
                                    <div style={{ color: '#aaa', fontSize: '0.9em', fontWeight: 'bold' }}>{card.cardtype}</div>
                                    <div style={{ color: '#888', fontSize: '0.7em', marginTop: '5px' }}>{card.positioncode}</div>
                                    <button onClick={() => onCardClick(card.cardid)} style={{ marginTop: '20px', width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>View Stats</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}