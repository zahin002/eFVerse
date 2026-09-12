import { useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

const STAT_LABELS = {
    offAware:  'Off. Awareness',
    finishing: 'Finishing',
    ballCtrl:  'Ball Control',
    dribbling: 'Dribbling',
    passing:   'Passing',
    kickPwr:   'Kicking Power',
    speed:     'Speed',
    accel:     'Acceleration',
    stamina:   'Stamina',
    balance:   'Balance',
    physCont:  'Physical Contact',
    jump:      'Jump',
    defAware:  'Def. Awareness',
    tackling:  'Tackling',
    aggression:'Aggression',
    gkAware:   'GK Awareness',
    gkCatch:   'GK Catching',
    gkParry:   'GK Parrying',
    gkReflex:  'GK Reflexes',
    gkReach:   'GK Reach',
};

const CARD_TYPES = [
    { label: 'Standard', value: 'Standard', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
    { label: 'Legendary', value: 'Legendary', color: '#FFD700', bg: 'rgba(255,200,0,0.12)', border: 'rgba(255,200,0,0.3)' },
    { label: 'POTW', value: 'POTW', color: '#00FF87', bg: 'rgba(0,255,135,0.12)', border: 'rgba(0,255,135,0.3)' },
];

const getCardColors = (cardtype) => {
    if (cardtype === 'Legendary') return { color: '#FFD700', bg: 'linear-gradient(160deg,#1a1200,#2c1f00)', border: 'rgba(255,200,0,0.35)', glow: 'rgba(255,180,0,0.25)' };
    if (cardtype === 'POTW')      return { color: '#00FF87', bg: 'linear-gradient(160deg,#001a0f,#002818)', border: 'rgba(0,255,135,0.3)',  glow: 'rgba(0,255,135,0.2)'  };
    return                               { color: '#00f2fe', bg: 'linear-gradient(160deg,#080d16,#0d1629)', border: 'rgba(0,180,254,0.2)',  glow: 'rgba(0,140,200,0.15)' };
};

const css = `
  .ss-input {
    width: 100%; padding: 11px 14px;
    background: rgba(10,15,25,0.7);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; color: #e2e8f0;
    font-family: 'Outfit', sans-serif; font-size: 0.92em; font-weight: 500;
    transition: border 0.2s, box-shadow 0.2s;
    outline: none;
  }
  .ss-input:focus {
    border-color: #00f2fe;
    box-shadow: 0 0 0 3px rgba(0,242,254,0.12);
    background: rgba(10,15,30,0.9);
  }
  .ss-select {
    appearance: none; -webkit-appearance: none;
    width: 100%; padding: 11px 14px;
    background: rgba(10,15,25,0.7);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; color: #e2e8f0;
    font-family: 'Outfit', sans-serif; font-size: 0.92em; font-weight: 500;
    cursor: pointer; outline: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center;
    transition: border 0.2s;
  }
  .ss-select:focus { border-color: #00f2fe; box-shadow: 0 0 0 3px rgba(0,242,254,0.12); }
  .ss-select:disabled { opacity: 0.45; cursor: not-allowed; }

  .ss-type-pill {
    padding: 7px 0; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);
    font-size: 0.78em; font-weight: 800; letter-spacing: 0.5px;
    font-family: 'Outfit', sans-serif;
    cursor: pointer; transition: all 0.2s ease;
    background: rgba(255,255,255,0.03); color: #94a3b8;
    text-align: center; text-transform: uppercase;
  }
  .ss-type-pill:hover { border-color: rgba(255,255,255,0.2); color: #fff; }

  .ss-slider {
    -webkit-appearance: none; appearance: none;
    width: 100%; height: 4px; border-radius: 2px;
    outline: none; cursor: pointer;
    background: rgba(255,255,255,0.08);
    transition: opacity 0.2s;
  }
  .ss-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 14px; height: 14px; border-radius: 50%;
    background: #00f2fe; cursor: pointer;
    box-shadow: 0 0 8px rgba(0,242,254,0.6);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .ss-slider::-webkit-slider-thumb:hover {
    transform: scale(1.3);
    box-shadow: 0 0 14px rgba(0,242,254,0.9);
  }
  .ss-slider.active { background: linear-gradient(to right, rgba(0,242,254,0.25), rgba(0,242,254,0.1)); }

  .ss-search-btn {
    flex: 2; padding: 13px;
    background: linear-gradient(135deg, #00f2fe, #4facfe);
    color: #000; border: none; border-radius: 10px;
    font-weight: 900; font-size: 0.95em; letter-spacing: 0.5px;
    font-family: 'Outfit', sans-serif;
    cursor: pointer; transition: all 0.25s;
    box-shadow: 0 0 16px rgba(0,242,254,0.3);
  }
  .ss-search-btn:hover {
    box-shadow: 0 0 28px rgba(0,242,254,0.55);
    transform: translateY(-1px);
  }
  .ss-clear-btn {
    flex: 1; padding: 13px;
    background: rgba(255,255,255,0.05);
    color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
    font-weight: 700; font-size: 0.9em;
    font-family: 'Outfit', sans-serif;
    cursor: pointer; transition: all 0.2s;
  }
  .ss-clear-btn:hover { background: rgba(255,77,77,0.1); border-color: rgba(255,77,77,0.3); color: #ff4d4d; }

  .ss-result-card {
    border-radius: 16px; overflow: hidden; cursor: pointer;
    transition: transform 0.25s cubic-bezier(0.25,0.8,0.25,1), box-shadow 0.25s;
    position: relative;
  }
  .ss-result-card:hover { transform: translateY(-6px) scale(1.02); }
  .ss-result-card::after {
    content: ''; position: absolute;
    top: 0; left: -75%; width: 50%; height: 100%;
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
    transform: skewX(-20deg); transition: left 0.55s ease; pointer-events: none;
  }
  .ss-result-card:hover::after { left: 130%; }

  .ss-view-btn {
    width: 100%; padding: 10px; margin-top: 14px;
    border: none; border-radius: 8px;
    font-weight: 800; font-size: 0.8em; letter-spacing: 0.5px;
    font-family: 'Outfit', sans-serif; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s;
  }

  .ss-suggestion-item {
    padding: 10px 14px; cursor: pointer;
    font-size: 0.9em; font-weight: 500; color: #e2e8f0;
    transition: background 0.15s;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .ss-suggestion-item:last-child { border-bottom: none; }
  .ss-suggestion-item:hover { background: rgba(0,242,254,0.08); color: #00f2fe; }

  .ss-section-label {
    font-size: 0.7em; font-weight: 800; text-transform: uppercase;
    letter-spacing: 1px; color: #64748b; margin-bottom: 10px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .ss-section-label a {
    font-size: 0.9em; color: #ff4d4d; cursor: pointer;
    font-weight: 700; letter-spacing: 0;
  }
  .ss-section-label a:hover { color: #ff7070; }

  @keyframes ss-fadein {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ss-animate { animation: ss-fadein 0.4s ease both; }
`;

export default function SmartSearch({ onCardClick }) {

    const [helpers, setHelpers] = useState({ leagues: [], nations: [], positions: [] });
    const [filteredClubs, setFilteredClubs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const initialFilters = {
        leagueId: null, clubId: null, nationId: null, cardType: null, posCode: null,
        offAware: null, finishing: null, ballCtrl: null, dribbling: null, passing: null,
        kickPwr: null, speed: null, accel: null, stamina: null, balance: null,
        physCont: null, jump: null, defAware: null, tackling: null, aggression: null,
        gkAware: null, gkCatch: null, gkParry: null, gkReflex: null, gkReach: null
    };
    const [filters, setFilters] = useState(initialFilters);

    useEffect(() => {
        axios.get('http://localhost:5001/api/players/helpers')
            .then(res => setHelpers(res.data))
            .catch(err => console.error('Helper Fetch Error:', err));
    }, []);

    useEffect(() => {
        if (filters.leagueId) {
            axios.get(`http://localhost:5001/api/players/clubs-by-league?leagueId=${filters.leagueId}`)
                .then(res => setFilteredClubs(res.data))
                .catch(err => console.error('Club Fetch Error:', err));
        } else {
            setFilteredClubs([]);
        }
    }, [filters.leagueId]);

    useEffect(() => {
        if (searchTerm.trim().length < 2) { setSuggestions([]); return; }
        const delay = setTimeout(async () => {
            try {
                const res = await axios.get(`http://localhost:5001/api/players/suggestions?term=${searchTerm.trim()}`);
                setSuggestions(res.data);
            } catch (err) { console.error(err); }
        }, 300);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const activeParams = {};
            if (searchTerm.trim().length > 0) activeParams.name = searchTerm.trim();
            Object.keys(filters).forEach(key => {
                const val = filters[key];
                if (val !== null && val !== '') activeParams[key] = val;
            });
            const params = new URLSearchParams(activeParams).toString();
            const res = await axios.get(`http://localhost:5001/api/players/smart-search?${params}`);
            setSearchResults(res.data);
            setHasSearched(true);
        } catch (err) {
            console.error('Search Failed', err);
            setSearchResults([]);
            setHasSearched(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setSearchTerm('');
        setFilters(initialFilters);
        setSearchResults([]);
        setFilteredClubs([]);
        setHasSearched(false);
        setSuggestions([]);
    };

    const activeStatCount = Object.keys(filters).filter(k =>
        !['leagueId','clubId','nationId','cardType','posCode'].includes(k) && filters[k] !== null
    ).length;

    return (
        <>
            <style>{css}</style>
            <div style={{ color: 'white' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>

                    {/* ===================== FILTER SIDEBAR ===================== */}
                    <div style={{
                        background: 'rgba(8,12,22,0.85)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '18px',
                        padding: '20px',
                        position: 'sticky',
                        top: '90px',
                    }}>
                        {/* Sidebar Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: 'linear-gradient(135deg, rgba(0,242,254,0.15), rgba(79,172,254,0.1))',
                                border: '1px solid rgba(0,242,254,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1em'
                            }}>🔍</div>
                            <div>
                                <div style={{ fontWeight: '800', fontSize: '0.95em', color: '#fff' }}>Smart Filter</div>
                                <div style={{ fontSize: '0.7em', color: '#64748b', fontWeight: '500' }}>
                                    {activeStatCount > 0 ? `${activeStatCount} stat filter${activeStatCount > 1 ? 's' : ''} active` : 'No filters applied'}
                                </div>
                            </div>
                        </div>

                        {/* Player Name Autocomplete */}
                        <div style={{ position: 'relative', marginBottom: '12px' }}>
                            <input
                                className="ss-input"
                                placeholder="🔍 Search player name..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                            {suggestions.length > 0 && (
                                <ul style={{
                                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%',
                                    background: 'rgba(8,14,26,0.97)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(0,242,254,0.2)',
                                    borderRadius: '10px', zIndex: 50,
                                    listStyle: 'none', padding: '4px 0', margin: 0,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                                }}>
                                    {suggestions.map(name => (
                                        <li key={name} className="ss-suggestion-item"
                                            onClick={() => { setSearchTerm(name); setSuggestions([]); }}>
                                            {name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* League */}
                        <div style={{ marginBottom: '10px' }}>
                            <select className="ss-select"
                                value={filters.leagueId || ''}
                                onChange={e => setFilters({ ...filters, leagueId: e.target.value || null, clubId: null })}>
                                <option value="">⚽ Any League</option>
                                {helpers.leagues.map(l => <option key={l.leagueid} value={l.leagueid}>{l.leaguename}</option>)}
                            </select>
                        </div>

                        {/* Club (dependent on league) */}
                        <div style={{ marginBottom: '16px' }}>
                            <select className="ss-select"
                                value={filters.clubId || ''}
                                disabled={!filters.leagueId}
                                onChange={e => setFilters({ ...filters, clubId: e.target.value || null })}>
                                <option value="">{filters.leagueId ? '🏟 Any Club' : '🏟 Select league first'}</option>
                                {filteredClubs.map(c => <option key={c.clubid} value={c.clubid}>{c.clubname}</option>)}
                            </select>
                        </div>

                        {/* Card Type Pills */}
                        <div style={{ marginBottom: '16px' }}>
                            <div className="ss-section-label">
                                <span>Card Type</span>
                                {filters.cardType && <a onClick={() => setFilters({ ...filters, cardType: null })}>Clear</a>}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                {CARD_TYPES.map(({ label, value, color, bg, border }) => {
                                    const active = filters.cardType === value;
                                    return (
                                        <button key={value} className="ss-type-pill"
                                            onClick={() => setFilters({ ...filters, cardType: active ? null : value })}
                                            style={active ? {
                                                background: bg, color, border: `1px solid ${border}`,
                                                boxShadow: `0 0 10px ${border}`,
                                            } : {}}>
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Position */}
                        <div style={{ marginBottom: '16px' }}>
                            <select className="ss-select"
                                value={filters.posCode || ''}
                                onChange={e => setFilters({ ...filters, posCode: e.target.value || null })}>
                                <option value="">🎯 Any Position</option>
                                {helpers.positions.map(p => <option key={p.positioncode} value={p.positioncode}>{p.positioncode}</option>)}
                            </select>
                        </div>

                        {/* Stat Sliders */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                            <div className="ss-section-label">
                                <span>Minimum Attributes</span>
                                {activeStatCount > 0 && <a onClick={() => {
                                    const reset = { ...filters };
                                    Object.keys(STAT_LABELS).forEach(k => reset[k] = null);
                                    setFilters(reset);
                                }}>Clear all ({activeStatCount})</a>}
                            </div>
                            <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {Object.keys(STAT_LABELS).map(key => {
                                    const isActive = filters[key] !== null;
                                    const val = filters[key] || 40;
                                    return (
                                        <div key={key}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                                <label style={{
                                                    fontSize: '0.72em', fontWeight: '700', textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    color: isActive ? '#00f2fe' : '#475569',
                                                    cursor: 'pointer'
                                                }}
                                                    onClick={() => !isActive && setFilters({ ...filters, [key]: 70 })}>
                                                    {STAT_LABELS[key]}
                                                </label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {isActive && (
                                                        <>
                                                            <span style={{
                                                                background: 'rgba(0,242,254,0.1)', border: '1px solid rgba(0,242,254,0.25)',
                                                                color: '#00f2fe', borderRadius: '5px', padding: '1px 7px',
                                                                fontSize: '0.75em', fontWeight: '800'
                                                            }}>{val}+</span>
                                                            <span onClick={() => setFilters({ ...filters, [key]: null })}
                                                                style={{ color: '#475569', cursor: 'pointer', fontSize: '0.85em', lineHeight: 1 }}
                                                                title="Remove filter">✕</span>
                                                        </>
                                                    )}
                                                    {!isActive && (
                                                        <span style={{ color: '#2d3748', fontSize: '0.7em', fontWeight: '600' }}>OFF</span>
                                                    )}
                                                </div>
                                            </div>
                                            <input
                                                type="range" min="40" max="99"
                                                value={val}
                                                className={`ss-slider${isActive ? ' active' : ''}`}
                                                style={{ opacity: isActive ? 1 : 0.25 }}
                                                onChange={e => setFilters({ ...filters, [key]: parseInt(e.target.value) })}
                                                onClick={() => !isActive && setFilters({ ...filters, [key]: val })}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                            <button className="ss-search-btn" onClick={handleSearch} disabled={isLoading}>
                                {isLoading ? '⏳ Searching...' : '⚡ Search'}
                            </button>
                            <button className="ss-clear-btn" onClick={handleReset}>Reset</button>
                        </div>
                    </div>

                    {/* ===================== RESULTS PANEL ===================== */}
                    <div>
                        {/* Results header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.05em', color: '#fff' }}>
                                    Results
                                </h3>
                                {hasSearched && (
                                    <span style={{
                                        background: searchResults.length > 0 ? 'rgba(0,242,254,0.1)' : 'rgba(248,113,113,0.1)',
                                        border: `1px solid ${searchResults.length > 0 ? 'rgba(0,242,254,0.25)' : 'rgba(248,113,113,0.25)'}`,
                                        color: searchResults.length > 0 ? '#00f2fe' : '#f87171',
                                        borderRadius: '999px', padding: '2px 12px',
                                        fontSize: '0.78em', fontWeight: '800'
                                    }}>{searchResults.length} found</span>
                                )}
                            </div>
                            {hasSearched && searchResults.length > 0 && (
                                <span style={{ fontSize: '0.78em', color: '#64748b' }}>Click any card to view full stats</span>
                            )}
                        </div>

                        {/* States */}
                        {!hasSearched && !isLoading && (
                            <div className="ss-animate" style={{
                                padding: '70px 40px', textAlign: 'center',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '18px', border: '1px dashed rgba(255,255,255,0.08)'
                            }}>
                                <div style={{ fontSize: '2.8em', marginBottom: '14px', opacity: 0.6 }}>🔍</div>
                                <h4 style={{ color: '#fff', marginBottom: '8px', fontWeight: '800', fontSize: '1.05em' }}>Search for eFVerse Players</h4>
                                <p style={{ margin: '0 auto', fontSize: '0.88em', color: '#475569', maxWidth: '320px' }}>
                                    Enter a player name or apply filters on the left, then hit <strong style={{ color: '#00f2fe' }}>⚡ Search</strong> to find matching cards.
                                </p>
                            </div>
                        )}

                        {isLoading && (
                            <div className="ss-animate" style={{
                                padding: '70px 40px', textAlign: 'center',
                                background: 'rgba(0,242,254,0.02)',
                                borderRadius: '18px', border: '1px solid rgba(0,242,254,0.08)'
                            }}>
                                <div style={{ fontSize: '2.5em', marginBottom: '14px', animation: 'ss-fadein 0.5s ease infinite alternate' }}>⚡</div>
                                <h4 style={{ color: '#00f2fe', marginBottom: '8px', fontWeight: '800' }}>Scanning Database...</h4>
                                <p style={{ margin: 0, fontSize: '0.88em', color: '#475569' }}>Running smart search against all player cards</p>
                            </div>
                        )}

                        {hasSearched && !isLoading && searchResults.length === 0 && (
                            <div className="ss-animate" style={{
                                padding: '70px 40px', textAlign: 'center',
                                background: 'rgba(248,113,113,0.03)',
                                borderRadius: '18px', border: '1px dashed rgba(248,113,113,0.2)'
                            }}>
                                <div style={{ fontSize: '2.5em', marginBottom: '14px' }}>⚠️</div>
                                <h4 style={{ color: '#f87171', marginBottom: '8px', fontWeight: '800' }}>No Matches Found</h4>
                                <p style={{ margin: 0, fontSize: '0.88em', color: '#475569' }}>Try relaxing your stat thresholds or using a different name.</p>
                            </div>
                        )}

                        {hasSearched && !isLoading && searchResults.length > 0 && (
                            <div className="ss-animate" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '14px' }}>
                                {searchResults.map((card, idx) => {
                                    const { color, bg, border, glow } = getCardColors(card.cardtype);
                                    return (
                                        <div key={card.cardid} className="ss-result-card"
                                            onClick={() => onCardClick(card.cardid)}
                                            style={{
                                                background: bg,
                                                border: `1px solid ${border}`,
                                                boxShadow: `0 4px 20px ${glow}`,
                                                animation: `ss-fadein 0.35s ease ${idx * 0.04}s both`
                                            }}>
                                            <div style={{ padding: '16px 16px 14px' }}>
                                                {/* Type Badge */}
                                                <span style={{
                                                    display: 'inline-block',
                                                    fontSize: '0.58em', fontWeight: '800', textTransform: 'uppercase',
                                                    letterSpacing: '1.2px', padding: '2px 7px', borderRadius: '4px',
                                                    background: `${color}18`, color, border: `1px solid ${color}40`,
                                                    marginBottom: '10px'
                                                }}>{card.cardtype || 'Standard'}</span>

                                                {/* OVR */}
                                                <div style={{
                                                    fontSize: '3em', fontWeight: '900', lineHeight: 1,
                                                    color, textShadow: `0 0 20px ${color}60`,
                                                    letterSpacing: '-2px', marginBottom: '3px'
                                                }}>{card.baseoverallrating || '—'}</div>

                                                {/* Position */}
                                                <div style={{
                                                    fontSize: '0.72em', fontWeight: '800', textTransform: 'uppercase',
                                                    color, opacity: 0.65, letterSpacing: '1px', marginBottom: '10px'
                                                }}>{card.player?.primaryposition || 'N/A'}</div>

                                                {/* Name */}
                                                <div style={{
                                                    fontWeight: '800', fontSize: '0.88em', color: '#fff',
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                                }}>{card.player?.playername || 'Unknown'}</div>

                                                {/* Club / League */}
                                                {card.clubname && (
                                                    <div style={{
                                                        fontSize: '0.7em', color: '#475569', fontWeight: '500',
                                                        marginTop: '4px',
                                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                                    }}>{card.clubname}</div>
                                                )}

                                                {/* View Stats btn */}
                                                <button className="ss-view-btn" style={{
                                                    background: `${color}15`, color,
                                                    border: `1px solid ${color}35`,
                                                }}>
                                                    View Stats →
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}