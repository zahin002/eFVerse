import { useState, useEffect } from 'react'
import axios from 'axios'
import AdminPanel from './AdminPanel'
import PlayerCardView from './PlayerCardView';
import SmartSearch from './SmartSearch';
import ManagerDetailView from './ManagerDetailView';
import SquadBuilder from './SquadBuilder'; 
import CardTrainer from './CardTrainer'; 
import { getManagerPhotoUrl } from './badgeAssetEngine'; 

axios.defaults.withCredentials = true;

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Unauthorized API call:", error.response.config?.url);
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

function App() {
  const [view, setView] = useState('login') 
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'USER' })
  const [message, setMessage] = useState("")
  const [user, setUser] = useState(null)
  
  // --- AUTH MODAL STATE ---
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalPrompt, setAuthModalPrompt] = useState("");
  
  // --- USER DASHBOARD STATES ---
  const [userTab, setUserTab] = useState('cards'); 
  const [showSquadBuilder, setShowSquadBuilder] = useState(false); 
  const [selectedCard, setSelectedCard] = useState(null); 
  const [selectedManager, setSelectedManager] = useState(null); 
  const [trainingCard, setTrainingCard] = useState(null); 
  const [allCards, setAllCards] = useState([]); 
  const [loadingCards, setLoadingCards] = useState(true);
  const [allManagers, setAllManagers] = useState([]); 
  const [topRated, setTopRated] = useState([]);
  const [topScorers, setTopScorers] = useState([]); 
  const [injuryProne, setInjuryProne] = useState([]); 
  const [consistentPlayers, setConsistentPlayers] = useState([]); 
  const [recentForms, setRecentForms] = useState([]); 
  const [topMarketValues, setTopMarketValues] = useState([]); 
  const [mostLikedBuilds, setMostLikedBuilds] = useState([]); 
  const [statMode, setStatMode] = useState(null); 

  // STATES FOR SQL-BASED FILTERING & SORTING
  const [cardFilter, setCardFilter] = useState('all'); 
  const [cardSort, setCardSort] = useState('default'); 

  const fetchStats = async () => {
    try {
        const res = await axios.get('http://localhost:5001/api/players/top-rated');
        setTopRated(res.data);
    } catch (err) {
        console.error("Error fetching top rated stats:", err);
    }
  };

  // FETCH LETHAL SCORERS (RANKED BY GPG)
  const fetchTopScorers = async () => {
    try {
        const res = await axios.get('http://localhost:5001/api/players/top-scorers');
        setTopScorers(res.data);
    } catch (err) {
        console.error("Error fetching top scorers:", err);
    }
  };

  // FETCH FUNCTION FOR INJURY PRONE PLAYERS
  const fetchInjuryStats = async () => {
    try {
        const res = await axios.get('http://localhost:5001/api/players/injury-prone');
        setInjuryProne(res.data);
    } catch (err) {
        console.error("Error fetching injury stats:", err);
    }
  };

  //  FETCH FUNCTION FOR CONSISTENT PLAYERS (A FORM TOTALS)
  const fetchConsistencyStats = async () => {
    try {
        const res = await axios.get('http://localhost:5001/api/players/consistent');
        setConsistentPlayers(res.data);
    } catch (err) {
        console.error("Error fetching consistency stats:", err);
    }
  };

  //  FETCH FUNCTION FOR RECENT HOT FORMS (BY DATE)
  const fetchRecentForms = async () => {
    try {
        const res = await axios.get('http://localhost:5001/api/players/recent-hot-form');
        setRecentForms(res.data);
    } catch (err) {
        console.error("Error fetching recent forms:", err);
    }
  };

  //  NEW FETCH FUNCTION FOR MARKET VALUE ANALYSIS
  const fetchMarketStats = async () => {
    try {
        const res = await axios.get('http://localhost:5001/api/players/top-market-value');
        setTopMarketValues(res.data);
    } catch (err) {
        console.error("Error fetching market stats:", err);
    }
  };

  const fetchMostLikedBuilds = async () => {
    try {
        const res = await axios.get('http://localhost:5001/api/progression/top-liked-builds');
        console.log("SERVER RESPONSE:", res.data); 
        setMostLikedBuilds(res.data);
    } catch (err) {
        console.error("Error fetching most liked builds:", err);
    }
  };

  // Load the non-sensitive UI data (name, role) on page refresh
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user session");
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // ==========================================
  // 🔐 LOGIN & REGISTRATION
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("Processing...")

    const endpoint = view === 'login' ? '/api/auth/login' : '/api/auth/register'
    const apiUrl = `http://localhost:5001${endpoint}`
    
    try {
      const response = await axios.post(apiUrl, formData)
      setMessage(response.data.message)
      
      if (view === 'login') {
        const userData = response.data.user || response.data;
        
        localStorage.setItem('user', JSON.stringify(userData)); 
        setUser(userData); 
        setShowAuthModal(false); // Automatically close modal on login
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setMessage("Error: " + errorMsg);
    }
  }

  // --- REAL GOOGLE OAUTH IDENTITY SERVICES SDK INIT ---
  useEffect(() => {
    if (user) return;

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '332236932706-n0hbs20bt41gjs3nn623ookkhfca67mq.apps.googleusercontent.com';

    const setupGoogleGSI = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response) => {
              try {
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const payload = JSON.parse(jsonPayload);
                const res = await axios.post('http://localhost:5001/api/auth/google', {
                  email: payload.email,
                  name: payload.name || payload.email.split('@')[0]
                });

                setMessage(res.data.message);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                setUser(res.data.user);
                setShowAuthModal(false); // Automatically close modal on sign-in
              } catch (err) {
                const errorMsg = err.response?.data?.error || err.message;
                setMessage("Google Sign-In Error: " + errorMsg);
              }
            }
          });

          const btnDiv = document.getElementById('googleSignInBtn');
          if (btnDiv) {
            btnDiv.innerHTML = '';
            window.google.accounts.id.renderButton(btnDiv, {
              theme: 'filled_blue',
              size: 'large',
              width: 320,
              text: 'continue_with',
              shape: 'pill'
            });
          }

          // Google GSI Initialized cleanly
        } catch (e) {
          console.warn("GSI setup error:", e);
        }
      }
    };

    const timer = setTimeout(setupGoogleGSI, 500);
    return () => clearTimeout(timer);
  }, [user, view]);

  const handleGoogleSignIn = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  const executeGoogleAuth = async (email, name) => {
    setMessage("Connecting to Google Account...");
    try {
      const response = await axios.post('http://localhost:5001/api/auth/google', { email, name });
      setMessage(response.data.message);

      const userData = response.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setShowAuthModal(false); // Automatically close modal
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setMessage("Google Sign-In Error: " + errorMsg);
    }
  };

  // ==========================================
  // 🚪 SECURE LOGOUT
  // ==========================================
  const handleLogout = async () => {
    try {
       
        await axios.post('http://localhost:5001/api/auth/logout');
    } catch (err) {
        console.error("Server logout failed:", err);
    } finally {
       
        localStorage.removeItem('user'); 
        setUser(null); 
        setSelectedCard(null); 
        setSelectedManager(null);
        setTrainingCard(null); 
        setShowSquadBuilder(false); 
    }
  };

  
  useEffect(() => {
    if (!user || user.role === 'USER') {
        setLoadingCards(true);
        axios.get(`http://localhost:5001/api/players/list-cards?filter=${cardFilter}&sort=${cardSort}`)
             .then(res => {
                 setAllCards(res.data);
                 setLoadingCards(false);
             })
             .catch(err => {
                 console.error("Error fetching cards:", err);
                 setLoadingCards(false);
             });
        
        axios.get('http://localhost:5001/api/managers/list')
             .then(res => setAllManagers(res.data))
             .catch(err => console.error("Error fetching managers:", err));
    }
  }, [user, cardFilter, cardSort]); 

  // --- CLEAN MOUNT (START AT HOME DASHBOARD) ---
  useEffect(() => {
    sessionStorage.removeItem('activeCardId');
    if (window.location.hash) {
      window.location.hash = '';
    }
  }, []);

  // --- BROWSER HISTORY & BACK BUTTON POPSTATE INTEGRATION ---
  const pushStateNav = () => {
    try {
      window.history.pushState({ modal: true }, '');
    } catch (e) {
      console.warn("History push failed:", e);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (trainingCard) {
        setTrainingCard(null);
      } else if (selectedCard) {
        setSelectedCard(null);
      } else if (selectedManager) {
        setSelectedManager(null);
      } else if (statMode) {
        setStatMode(null);
      } else if (showSquadBuilder) {
        setShowSquadBuilder(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [trainingCard, selectedCard, selectedManager, statMode, showSquadBuilder]);

  const handleCardClick = async (cardId) => {
    if (!cardId || cardId === 'null' || cardId === 'undefined') {
      alert("This player does not have a configured card registry entry.");
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5001/api/players/view-card/${cardId}`);
      setSelectedCard(res.data);
      pushStateNav();
    } catch (err) { 
      console.error("Error loading card details", err); 
    }
  };

  const handleGoHome = () => {
    setSelectedCard(null);
    setSelectedManager(null);
    setTrainingCard(null);
    setShowSquadBuilder(false);
    setStatMode(null);
    setUserTab('cards');
    sessionStorage.removeItem('activeCardId');
    if (window.location.hash) {
      window.location.hash = '';
    }
  };

  const getRegistryCards = () => {
      const uniquePlayersMap = {};
      allCards.forEach(card => {
          const pid = card.playerid;
          if (!uniquePlayersMap[pid]) {
              uniquePlayersMap[pid] = card;
          } else {
              const currentOvr = parseInt(card.baseoverallrating) || 0;
              const storedOvr = parseInt(uniquePlayersMap[pid].baseoverallrating) || 0;
              if (currentOvr > storedOvr) {
                  uniquePlayersMap[pid] = card;
              }
          }
      });
      const uniqueCards = Object.values(uniquePlayersMap);
      uniqueCards.sort((a, b) => b.playerid - a.playerid);
      const latest10Cards = uniqueCards.slice(0, 10);
      latest10Cards.sort((a, b) => {
          const ratingA = parseInt(a.baseoverallrating) || 0;
          const ratingB = parseInt(b.baseoverallrating) || 0;
          return ratingB - ratingA;
      });
      return latest10Cards;
  };

  const getCardStyle = (type) => {
    const baseStyle = {
        padding: '20px', 
        borderRadius: '16px', 
        cursor: 'pointer', 
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '240px'
    };

    switch (type) {
        case 'Legendary':
        case 'Legend':
        case 'Epic':
        case 'Bigtime':
        case 'Big Time':
            return {
                ...baseStyle,
                background: 'linear-gradient(135deg, rgba(191, 149, 63, 0.2) 0%, rgba(252, 246, 186, 0.1) 50%, rgba(179, 135, 40, 0.2) 100%)', 
                border: '1px solid rgba(255, 215, 0, 0.5)',
                boxShadow: '0 8px 32px 0 rgba(191, 149, 63, 0.3)',
                color: '#fff' 
            };
        case 'POTW':
        case 'Trending':
            return {
                ...baseStyle,
                background: 'linear-gradient(135deg, rgba(19, 78, 94, 0.3) 0%, rgba(113, 178, 128, 0.2) 100%)', 
                border: '1px solid rgba(0, 255, 135, 0.4)',
                boxShadow: '0 8px 32px 0 rgba(0, 255, 135, 0.25)',
            };
        case 'Featured':
        case 'Highlight':
        case 'Showtime':
        case 'Show Time':
            return {
                ...baseStyle,
                background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.3) 0%, rgba(0, 242, 254, 0.2) 100%)', 
                border: '1px solid rgba(168, 85, 247, 0.5)',
                boxShadow: '0 8px 32px 0 rgba(168, 85, 247, 0.3)',
            };
        default: 
            return {
                ...baseStyle,
                background: 'linear-gradient(135deg, rgba(35, 37, 38, 0.6) 0%, rgba(65, 67, 69, 0.4) 100%)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
            };
    }
  };

  // --- INJECTED CSS FOR NEXT-GEN EFFECTS ---
  const injectedStyles = `
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #07090e; color: #e2e8f0; font-family: 'Outfit', 'Space Grotesk', system-ui, sans-serif; overflow-x: hidden; }
    
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #0a0f16; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #334155; }

    .input-modern {
        font-family: 'Outfit', sans-serif;
        font-weight: 600;
        letter-spacing: 0.5px;
    }
    .input-modern::placeholder {
        font-family: 'Outfit', sans-serif;
        font-weight: 500;
        color: #64748b;
    }

    .glass-panel {
        background: rgba(17, 24, 39, 0.7);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
    }

    .nav-pill {
        padding: 12px 28px;
        border-radius: 30px;
        font-weight: 600;
        letter-spacing: 0.5px;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 1px solid transparent;
    }
    .nav-pill.active {
        background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
        color: #000;
        box-shadow: 0 0 20px rgba(0, 242, 254, 0.4);
    }
    .nav-pill.inactive {
        background: rgba(255,255,255,0.03);
        color: #94a3b8;
        border: 1px solid rgba(255,255,255,0.1);
    }
    .nav-pill.inactive:hover {
        background: rgba(255,255,255,0.08);
        color: #fff;
    }

    .glowing-btn {
        background: linear-gradient(45deg, #00f2fe, #4facfe);
        color: #000;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
        border: none;
        border-radius: 12px;
        padding: 16px 32px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 0 15px rgba(0, 242, 254, 0.3);
    }
    .glowing-btn:hover {
        box-shadow: 0 0 30px rgba(0, 242, 254, 0.6);
        transform: translateY(-2px);
    }

    .player-card:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 20px 40px rgba(0,0,0,0.6) !important;
    }
    .player-card::before {
        content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
        background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%);
        transform: skewX(-25deg); transition: all 0.7s ease;
    }
    .player-card:hover::before { left: 200%; }

    .record-btn {
        width: 100%; padding: 14px; margin-bottom: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);
        cursor: pointer; font-weight: 600; text-align: left; transition: all 0.2s ease;
        display: flex; align-items: center; gap: 10px;
    }
    .record-btn:hover { transform: translateX(5px); background: rgba(255,255,255,0.08) !important; }

    .modern-table { width: 100%; border-collapse: collapse; text-align: left; }
    .modern-table th { padding: 18px 15px; color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 0.8em; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .modern-table td { padding: 16px 15px; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s; }
    .modern-table tr:hover td { background: rgba(255,255,255,0.02); }

    .input-modern {
        width: 100%; padding: 14px 16px; background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white;
        transition: all 0.3s; font-size: 1em;
    }
    .input-modern:focus { outline: none; border-color: #00f2fe; box-shadow: 0 0 10px rgba(0, 242, 254, 0.2); background: rgba(15, 23, 42, 0.9); }
  `;

  // ==========================================
  // RENDER: WELCOME / DASHBOARD SCREENS
  // ==========================================
  // ==========================================
  // RENDER: WELCOME / DASHBOARD SCREENS
  // ==========================================
  if (showSquadBuilder && !user) {
      setShowSquadBuilder(false);
      setAuthModalPrompt("Please sign in to build and save custom tactical squads.");
      setShowAuthModal(true);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
      <style>{injectedStyles}</style>

      {/* Ambient Dashboard Background Glows */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(0,242,254,0.05) 0%, transparent 70%)', zIndex: -1, pointerEvents: 'none' }}></div>
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)', zIndex: -1, pointerEvents: 'none' }}></div>

      {/* --- TOP NAVIGATION BAR --- */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5vw', borderBottom: '1px solid rgba(255,255,255,0.05)', borderRadius: 0, position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div onClick={handleGoHome} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <img src="/logo.png" alt="eFVerse Logo" style={{ width: '36px', height: '36px', borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 242, 254, 0.3)' }} />
                  <div style={{ background: 'linear-gradient(45deg, #00f2fe, #4facfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.5em', fontWeight: '900', letterSpacing: '1px' }}>eFVerse</div>
              </div>
              <div style={{ padding: '4px 10px', background: user?.role === 'ADMIN' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(0, 242, 254, 0.1)', color: user?.role === 'ADMIN' ? '#ff4d4d' : '#00f2fe', borderRadius: '4px', fontSize: '0.75em', fontWeight: 'bold', border: `1px solid ${user?.role === 'ADMIN' ? 'rgba(255, 77, 77, 0.3)' : 'rgba(0, 242, 254, 0.3)'}` }}>
                  {user ? user.role : 'GUEST'}
              </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {user ? (
                <>
                  <span style={{ color: '#94a3b8', fontWeight: '500' }}>Welcome back, <span style={{ color: '#fff' }}>{user.username}</span></span>
                  <button onClick={handleLogout} style={{ background: 'transparent', color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.3)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>Logout</button>
                </>
              ) : (
                <button onClick={() => { setAuthModalPrompt("Sign in to eFVerse to save custom squads, builds, and post card reviews!"); setShowAuthModal(true); }} className="glowing-btn" style={{ padding: '8px 22px', fontSize: '0.9em' }}>
                  Sign In / Register
                </button>
              )}
          </div>
      </div>

        {/* --- MAIN CONTENT AREA (FULL WIDTH PADDING) --- */}
        <div style={{ flex: 1, padding: '40px 5vw', width: '100%' }}>
            {showSquadBuilder ? (
                <SquadBuilder currentUser={user} onBack={() => setShowSquadBuilder(false)} />
            ) : trainingCard ? (
                <CardTrainer 
                    card={trainingCard} 
                    onBack={() => setTrainingCard(null)} 
                    onComplete={() => {
                        setTrainingCard(null);
                        axios.get('http://localhost:5001/api/players/list-cards').then(res => setAllCards(res.data));
                    }} 
                />
            ) : selectedCard ? (
                <PlayerCardView 
                    data={selectedCard} 
                    onBack={() => setSelectedCard(null)} 
                    onSelectCard={handleCardClick} 
                    onTrain={(cardData) => { setTrainingCard(cardData); pushStateNav(); }} 
                />
            ) : selectedManager ? (
                <ManagerDetailView data={selectedManager} onBack={() => setSelectedManager(null)} />
            ) : (
                <>
                    {user?.role === 'ADMIN' && (
                        <div className="glass-panel" style={{ padding: '30px' }}>
                            <AdminPanel /> 
                        </div>
                    )}

                    {(!user || user.role === 'USER') && (
                        <>
                    {/* HERO ACTION SECTION */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                        <div>
                            <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5em', fontWeight: '800' }}>Command Center</h1>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '1.1em' }}>Explore player stats, manager philosophies, and custom build progressions.</p>
                        </div>
                        <button className="glowing-btn" onClick={() => {
                            if (!user) {
                                setAuthModalPrompt("Please sign in to build and save custom tactical squads.");
                                setShowAuthModal(true);
                                return;
                            }
                            setShowSquadBuilder(true);
                        }}>
                            + Create New Squad
                        </button>
                    </div>

                    {/* PILL NAVIGATION */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                        <button className={`nav-pill ${userTab === 'cards' ? 'active' : 'inactive'}`} onClick={() => setUserTab('cards')}>Player Database</button>
                        <button className={`nav-pill ${userTab === 'managers' ? 'active' : 'inactive'}`} onClick={() => setUserTab('managers')}>Manager Registry</button>
                        <button className={`nav-pill ${userTab === 'records' ? 'active' : 'inactive'}`} onClick={() => { setUserTab('records'); setStatMode(null); }}>Statistical Records</button>
                    </div>

                    {/* TAB CONTENT: CARDS */}
                    {userTab === 'cards' && (
                        <div style={{ animation: 'fadeIn 0.4s ease' }}>
                            {/* SMART SEARCH STRETCHES TO FILL WIDTH */}
                            <div className="glass-panel" style={{ padding: '30px', marginBottom: '40px', width: '100%' }}>
                                <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '1.2em' }}>Smart Search Intelligence</h3>
                                <SmartSearch onCardClick={handleCardClick} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <div>
                                    <h2 style={{ color: '#fff', fontSize: '1.8em', fontWeight: '900', margin: '0 0 6px 0', fontFamily: "'Outfit', sans-serif" }}>🔥 Trending Player Collections & Packs</h2>
                                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95em' }}>Explore featured eFootball card packs, Legendary highlights, and POTW selections.</p>
                                </div>

                                {/* SORTING & FILTERING CONTROLS */}
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <select className="input-modern" value={cardFilter} onChange={e => setCardFilter(e.target.value)} style={{ width: 'auto', padding: '10px 14px', fontSize: '0.9em' }}>
                                        <option value="all">All Card Types</option>
                                        <option value="cards_only">Configured Cards Only</option>
                                        <option value="no_cards">Unconfigured Players</option>
                                    </select>
                                    
                                    <select className="input-modern" value={cardSort} onChange={e => setCardSort(e.target.value)} style={{ width: 'auto', padding: '10px 14px', fontSize: '0.9em' }}>
                                        <option value="default">Default Order</option>
                                        <option value="ovr_desc">Rating: High to Low</option>
                                        <option value="ovr_asc">Rating: Low to High</option>
                                    </select>
                                </div>
                            </div>

                            {loadingCards ? (
                                <div className="glass-panel" style={{ padding: '80px 30px', textAlign: 'center', color: '#00f2fe', borderRadius: '16px', border: '1px solid rgba(0, 242, 254, 0.2)', width: '100%' }}>
                                    <div style={{ fontSize: '3em', marginBottom: '16px', display: 'inline-block' }}>⚽</div>
                                    <h3 style={{ color: '#fff', fontSize: '1.4em', fontWeight: '900', margin: '0 0 8px 0', fontFamily: "'Outfit', sans-serif" }}>Loading eFVerse Database...</h3>
                                    <p style={{ margin: 0, fontSize: '0.95em', color: '#94a3b8', fontFamily: "'Outfit', sans-serif" }}>
                                        Fetching eFootball player card collections and tactical ratings...
                                    </p>
                                </div>
                            ) : allCards.length === 0 ? (
                                <div className="glass-panel" style={{ padding: '60px 30px', textAlign: 'center', color: '#64748b', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', width: '100%' }}>
                                    <div style={{ fontSize: '2.5em', marginBottom: '12px', background: 'linear-gradient(45deg, #00f2fe, #4facfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⚽</div>
                                    <h3 style={{ color: '#e2e8f0', fontSize: '1.3em', fontWeight: '800', margin: '0 0 8px 0', fontFamily: "'Outfit', sans-serif" }}>No Player Cards Found</h3>
                                    <p style={{ margin: 0, fontSize: '0.95em', color: '#94a3b8', fontFamily: "'Outfit', sans-serif" }}>
                                        Featured card collections will appear here automatically as soon as player card data is loaded.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '35px', width: '100%' }}>
                                    {/* PACK COLLECTION 1: LEGENDARY / EPIC HIGHLIGHTS */}
                                    {allCards.filter(c => c.cardtype === 'Legendary').length > 0 && (
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                                                <h3 style={{ margin: 0, color: '#ffd700', fontSize: '1.4em', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>👑 Legendary & Epic Stars 2026</h3>
                                            </div>
                                            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '10px 5px', scrollbarWidth: 'thin' }}>
                                                {allCards.filter(c => c.cardtype === 'Legendary').map(card => (
                                                    <div key={card.cardid || `player-${card.playerid}`} className="player-card glass-panel" onClick={() => handleCardClick(card.cardid)} style={{ ...getCardStyle(card.cardtype), minWidth: '200px', maxWidth: '220px', flexShrink: 0 }}>
                                                        <div style={{ textAlign: 'left' }}>
                                                            <h3 style={{margin: '0', fontSize: '1.1em', fontWeight: '800', textShadow: '0 2px 4px rgba(0,0,0,0.8)', color: '#fff'}}>{card.player?.playername || 'Unknown'}</h3>
                                                            <div style={{ fontSize: '0.75em', color: '#ffd700', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>{card.cardtype}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '15px 0' }}>
                                                            <div style={{ fontSize: '3em', fontWeight: '900', lineHeight: '1', textShadow: '0 4px 10px rgba(0,0,0,0.6)', color: '#ffd700' }}>
                                                                {card.baseoverallrating}
                                                            </div>
                                                            <div style={{ fontSize: '1.1em', fontWeight: '800', color: '#fff' }}>
                                                                {card.positioncode || card.player?.primaryposition}
                                                            </div>
                                                        </div>
                                                        <div style={{ marginTop: 'auto', padding: '8px 0 0 0', borderTop: '1px solid rgba(255,215,0,0.2)', fontSize: '0.8em', fontWeight: '700', color: '#ffd700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                            View Stats →
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* PACK COLLECTION 2: POTW (PLAYER OF THE WEEK) */}
                                    {allCards.filter(c => c.cardtype === 'POTW').length > 0 && (
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                                                <h3 style={{ margin: 0, color: '#00ff87', fontSize: '1.4em', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>⚡ POTW: Player of the Week</h3>
                                            </div>
                                            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '10px 5px', scrollbarWidth: 'thin' }}>
                                                {allCards.filter(c => c.cardtype === 'POTW').map(card => (
                                                    <div key={card.cardid || `player-${card.playerid}`} className="player-card glass-panel" onClick={() => handleCardClick(card.cardid)} style={{ ...getCardStyle(card.cardtype), minWidth: '200px', maxWidth: '220px', flexShrink: 0 }}>
                                                        <div style={{ textAlign: 'left' }}>
                                                            <h3 style={{margin: '0', fontSize: '1.1em', fontWeight: '800', textShadow: '0 2px 4px rgba(0,0,0,0.8)', color: '#fff'}}>{card.player?.playername || 'Unknown'}</h3>
                                                            <div style={{ fontSize: '0.75em', color: '#00ff87', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>{card.cardtype}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '15px 0' }}>
                                                            <div style={{ fontSize: '3em', fontWeight: '900', lineHeight: '1', textShadow: '0 4px 10px rgba(0,0,0,0.6)', color: '#00ff87' }}>
                                                                {card.baseoverallrating}
                                                            </div>
                                                            <div style={{ fontSize: '1.1em', fontWeight: '800', color: '#fff' }}>
                                                                {card.positioncode || card.player?.primaryposition}
                                                            </div>
                                                        </div>
                                                        <div style={{ marginTop: 'auto', padding: '8px 0 0 0', borderTop: '1px solid rgba(0,255,135,0.2)', fontSize: '0.8em', fontWeight: '700', color: '#00ff87', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                            View Stats →
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* PACK COLLECTION 3: GLOBAL PLAYER REGISTRY */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                                            <h3 style={{ margin: 0, color: '#00f2fe', fontSize: '1.4em', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>⚽ Player Database Registry</h3>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px', width: '100%' }}>
                                            {getRegistryCards().map(card => (
                                                <div key={card.cardid || `player-${card.playerid}`} className="player-card glass-panel" onClick={() => handleCardClick(card.cardid)} style={getCardStyle(card.cardtype)}>
                                                    <div style={{ textAlign: 'left' }}>
                                                        <h3 style={{margin: '0', fontSize: '1.1em', fontWeight: '700', textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>{card.player?.playername || 'Unknown'}</h3>
                                                        <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.7)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{card.cardtype}</div>
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                                                        <div style={{ fontSize: '3.5em', fontWeight: '900', lineHeight: '1', textShadow: '0 4px 10px rgba(0,0,0,0.4)', color: card.cardtype === 'Legendary' ? '#ffd700' : '#fff' }}>
                                                            {card.baseoverallrating}
                                                        </div>
                                                        <div style={{ fontSize: '1.2em', fontWeight: '800', opacity: 0.9 }}>
                                                            {card.positioncode || card.player?.primaryposition}
                                                        </div>
                                                    </div>

                                                    <div style={{ marginTop: 'auto', padding: '10px 0 0 0', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85em', fontWeight: '600', color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                        View Stats →
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT: MANAGERS */}
                    {userTab === 'managers' && (
                        <div style={{ animation: 'fadeIn 0.4s ease' }}>
                            <div className="glass-panel" style={{ padding: '30px', width: '100%' }}>
                                <h2 style={{ margin: '0 0 25px 0', color: '#fff' }}>Tactical Manager Registry</h2>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px', width: '100%' }}>
                                    {allManagers.map(mgr => {
                                        const getRatingColor = (val) => {
                                            if (val >= 90) return '#00f2fe'; // cyan
                                            if (val >= 80) return '#4ade80'; // green
                                            if (val >= 70) return '#facc15'; // yellow
                                            if (val >= 60) return '#f97316'; // orange
                                            return '#f87171'; // red
                                        };
                                        const getRatingTextCol = (val) => {
                                            return '#000000';
                                        };
                                        const parseBoosts = (boostsStr) => {
                                            if (!boostsStr) return [];
                                            return boostsStr.split(',').map(s => s.trim()).filter(Boolean);
                                        };
                                        const boostsList = parseBoosts(mgr.boosts_display);

                                        return (
                                            <div key={mgr.managerid} onClick={() => setSelectedManager(mgr)} className="glass-panel player-card" style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: '#121620', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', transition: 'all 0.3s ease' }}>
                                                {/* Header Row */}
                                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
                                                    {/* Manager Portrait with overlay badges */}
                                                    <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                                                        <img 
                                                            src={getManagerPhotoUrl(mgr.managername)} 
                                                            alt={mgr.managername} 
                                                            style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255, 255, 255, 0.15)' }} 
                                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://secure.gravatar.com/avatar/unknown?d=mp'; }}
                                                        />
                                                        {/* Green shirts badge overlay */}
                                                        <div style={{
                                                            background: '#090d16',
                                                            border: '1px solid rgba(255,255,255,0.15)',
                                                            borderRadius: '6px',
                                                            padding: '2px 6px',
                                                            position: 'absolute',
                                                            bottom: '-6px',
                                                            left: '50%',
                                                            transform: 'translateX(-50%)',
                                                            display: 'flex',
                                                            gap: '3px',
                                                            zIndex: 2,
                                                            fontSize: '0.65em',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                                                        }}>
                                                            <span style={{ color: '#00ff87', textShadow: '0 0 2px #00ff87' }}>👕</span>
                                                            <span style={{ color: '#00ff87', textShadow: '0 0 2px #00ff87' }}>👕</span>
                                                        </div>
                                                    </div>

                                                    {/* Info column */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <h3 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '1.2em', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mgr.managername}</h3>
                                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                            {boostsList.map((b, bIdx) => (
                                                                <span key={bIdx} style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#38bdf8', borderRadius: '6px', padding: '2px 8px', fontSize: '0.7em', fontWeight: '800', letterSpacing: '0.2px' }}>
                                                                    {b}
                                                                </span>
                                                            ))}
                                                            {boostsList.length === 0 && (
                                                                <span style={{ color: '#64748b', fontSize: '0.75em', fontStyle: 'italic' }}>No boosts</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Playstyle Ratings and Progress Bars */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {[
                                                        { label: 'Possession Game', val: mgr.possession_game || 50 },
                                                        { label: 'Long Ball Counter', val: mgr.long_ball_counter || 50 },
                                                        { label: 'Quick Counter', val: mgr.quick_counter || 50 },
                                                        { label: 'Long Ball', val: mgr.long_ball || 50 },
                                                        { label: 'Out Wide', val: mgr.out_wide || 50 }
                                                    ].map((pItem, pIdx) => {
                                                        const color = getRatingColor(pItem.val);
                                                        const textCol = getRatingTextCol(pItem.val);
                                                        return (
                                                            <div key={pIdx} style={{ display: 'flex', flexDirection: 'column' }}>
                                                                {/* Label row */}
                                                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                                                    <div style={{ background: color, color: textCol, width: '28px', height: '20px', borderRadius: '4px', fontSize: '0.78em', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                        {pItem.val}
                                                                    </div>
                                                                    <div style={{ color: color, fontSize: '0.85em', fontWeight: '800', marginLeft: '10px' }}>
                                                                        {pItem.label}
                                                                    </div>
                                                                </div>
                                                                {/* Bar channel */}
                                                                <div style={{ width: '100%', height: '4px', background: '#0a0d14', borderRadius: '2px', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${pItem.val}%`, height: '100%', background: color, borderRadius: '2px' }} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {allManagers.length === 0 && <p style={{ color: '#94a3b8', gridColumn: '1/-1' }}>No tactical managers found in the SQL registry.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: RECORDS */}
                    {userTab === 'records' && (
                        <div style={{ display: 'flex', gap: '30px', animation: 'fadeIn 0.4s ease', alignItems: 'flex-start', width: '100%' }}>
                            
                            {/* RECORDS SIDEBAR */}
                            <div className="glass-panel" style={{ width: '280px', padding: '20px', flexShrink: 0, position: 'sticky', top: '100px' }}>
                                <h4 style={{ color: '#94a3b8', margin: '0 0 20px 0', fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '1px' }}>Data Categories</h4>
                                
                                <button className="record-btn" onClick={() => { setStatMode('top-rated'); fetchStats(); }} style={{ background: statMode === 'top-rated' ? 'rgba(0, 242, 254, 0.1)' : 'transparent', color: statMode === 'top-rated' ? '#00f2fe' : '#e2e8f0', borderColor: statMode === 'top-rated' ? '#00f2fe' : 'rgba(255,255,255,0.05)' }}>
                                    ⭐ Top 10 Rated
                                </button>
                                <button className="record-btn" onClick={() => { setStatMode('top-scorers'); fetchTopScorers(); }} style={{ background: statMode === 'top-scorers' ? 'rgba(74, 222, 128, 0.1)' : 'transparent', color: statMode === 'top-scorers' ? '#4ade80' : '#e2e8f0', borderColor: statMode === 'top-scorers' ? '#4ade80' : 'rgba(255,255,255,0.05)' }}>
                                    ⚽ Goalscorers (GPG)
                                </button>
                                <button className="record-btn" onClick={() => { setStatMode('injury-prone'); fetchInjuryStats(); }} style={{ background: statMode === 'injury-prone' ? 'rgba(248, 113, 113, 0.1)' : 'transparent', color: statMode === 'injury-prone' ? '#f87171' : '#e2e8f0', borderColor: statMode === 'injury-prone' ? '#f87171' : 'rgba(255,255,255,0.05)' }}>
                                    🏥 Medical Reports
                                </button>
                                <button className="record-btn" onClick={() => { setStatMode('consistent'); fetchConsistencyStats(); }} style={{ background: statMode === 'consistent' ? 'rgba(96, 165, 250, 0.1)' : 'transparent', color: statMode === 'consistent' ? '#60a5fa' : '#e2e8f0', borderColor: statMode === 'consistent' ? '#60a5fa' : 'rgba(255,255,255,0.05)' }}>
                                    📈 Consistency Kings
                                </button>
                                <button className="record-btn" onClick={() => { setStatMode('recent-forms'); fetchRecentForms(); }} style={{ background: statMode === 'recent-forms' ? 'rgba(250, 204, 21, 0.1)' : 'transparent', color: statMode === 'recent-forms' ? '#facc15' : '#e2e8f0', borderColor: statMode === 'recent-forms' ? '#facc15' : 'rgba(255,255,255,0.05)' }}>
                                    🔥 Live Hot Form
                                </button>
                                <button className="record-btn" onClick={() => { setStatMode('market-value'); fetchMarketStats(); }} style={{ background: statMode === 'market-value' ? 'rgba(232, 121, 249, 0.1)' : 'transparent', color: statMode === 'market-value' ? '#e879f9' : '#e2e8f0', borderColor: statMode === 'market-value' ? '#e879f9' : 'rgba(255,255,255,0.05)' }}>
                                    💎 Market Value
                                </button>
                                <button className="record-btn" onClick={() => { setStatMode('liked-builds'); fetchMostLikedBuilds(); }} style={{ background: statMode === 'liked-builds' ? 'rgba(167, 139, 250, 0.1)' : 'transparent', color: statMode === 'liked-builds' ? '#a78bfa' : '#e2e8f0', borderColor: statMode === 'liked-builds' ? '#a78bfa' : 'rgba(255,255,255,0.05)' }}>
                                    🏆 Favored Builds
                                </button>
                            </div>

                            {/* RECORDS TABLE DISPLAY */}
                            <div className="glass-panel" style={{ flex: 1, padding: '40px', minHeight: '600px', width: '100%' }}>
                                {statMode && (
                                    <button 
                                        onClick={() => setStatMode(null)}
                                        style={{ 
                                            padding: '8px 18px', 
                                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                                            color: 'white', 
                                            border: '1px solid rgba(239, 68, 68, 0.6)', 
                                            cursor: 'pointer', 
                                            borderRadius: '8px',
                                            fontWeight: '800',
                                            fontSize: '0.8em',
                                            fontFamily: "'Outfit', sans-serif",
                                            letterSpacing: '0.5px',
                                            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                                            textTransform: 'uppercase',
                                            marginBottom: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        ← BACK TO HUB
                                    </button>
                                )}
                                {!statMode ? (
                                    <div style={{ textAlign: 'center', marginTop: '150px', color: '#94a3b8' }}>
                                        <div style={{ fontSize: '4em', marginBottom: '20px' }}>📊</div>
                                        <h3 style={{ color: '#fff', fontSize: '1.5em' }}>Analytics Hub</h3>
                                        <p>Select a data category from the sidebar to generate a report.</p>
                                    </div>
                                ) : statMode === 'top-rated' ? (
                                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                        <h2 style={{ color: '#00f2fe', margin: '0 0 20px 0', fontSize: '1.8em' }}>⭐ Global Top 10 Rated</h2>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="modern-table">
                                                <thead><tr><th>Rank</th><th>Player Name</th><th>OVR</th><th style={{textAlign: 'center'}}>Avg. Rating</th><th style={{textAlign: 'center'}}>Reviews</th></tr></thead>
                                                <tbody>
                                                    {topRated.map((item, index) => (
                                                        <tr key={item.cardid} onClick={() => handleCardClick(item.cardid)} style={{ cursor: 'pointer' }}>
                                                            <td style={{ fontWeight: 'bold', color: '#94a3b8' }}>#{index + 1}</td>
                                                            <td style={{ color: '#fff', fontWeight: 'bold' }}>{item.playername}</td>
                                                            <td style={{ color: '#fff' }}><span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '4px' }}>{item.baseoverallrating}</span></td>
                                                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#00f2fe' }}>{item.communityrating}</td>
                                                            <td style={{ textAlign: 'center', color: '#94a3b8' }}>{item.reviewcount}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : statMode === 'top-scorers' ? (
                                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                        <h2 style={{ color: '#4ade80', margin: '0 0 20px 0', fontSize: '1.8em' }}>⚽ Golden Boot: Efficiency (GPG)</h2>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="modern-table">
                                                <thead><tr><th>Rank</th><th>Player</th><th style={{textAlign: 'center'}}>Efficiency</th><th style={{textAlign: 'center'}}>Goals</th><th style={{textAlign: 'center'}}>Matches</th></tr></thead>
                                                <tbody>
                                                    {topScorers.map((item, index) => (
                                                        <tr key={item.cardid} onClick={() => handleCardClick(item.cardid)} style={{ cursor: 'pointer' }}>
                                                            <td style={{ fontWeight: 'bold', color: index === 0 ? '#ffd700' : '#94a3b8' }}>{index === 0 ? '👑' : `#${index + 1}`}</td>
                                                            <td style={{ color: '#fff', fontWeight: 'bold' }}>{item.playername}</td>
                                                            <td style={{ textAlign: 'center' }}><span style={{ background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', padding: '4px 12px', borderRadius: '6px', fontWeight: 'bold' }}>{item.max_gpg} GPG</span></td>
                                                            <td style={{ textAlign: 'center', color: '#fff' }}>{item.total_goals}</td>
                                                            <td style={{ textAlign: 'center', color: '#94a3b8' }}>{item.total_matches}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : statMode === 'injury-prone' ? (
                                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                        <h2 style={{ color: '#f87171', margin: '0 0 20px 0', fontSize: '1.8em' }}>🏥 Medical Report: High Risk</h2>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="modern-table">
                                                <thead><tr><th>Rank</th><th>Player</th><th style={{textAlign: 'center'}}>Total Injuries</th><th style={{textAlign: 'center'}}>Reliability Status</th></tr></thead>
                                                <tbody>
                                                    {injuryProne.map((item, index) => (
                                                        <tr key={item.cardid} onClick={() => handleCardClick(item.cardid)} style={{ cursor: 'pointer' }}>
                                                            <td style={{ fontWeight: 'bold', color: '#94a3b8' }}>#{index + 1}</td>
                                                            <td style={{ color: '#fff', fontWeight: 'bold' }}>{item.playername}</td>
                                                            <td style={{ textAlign: 'center', color: '#f87171', fontWeight: 'bold' }}>{item.injury_count} Records</td>
                                                            <td style={{ textAlign: 'center' }}><span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.85em', fontWeight: 'bold', background: item.injury_count > 5 ? 'rgba(248, 113, 113, 0.2)' : 'rgba(250, 204, 21, 0.2)', color: item.injury_count > 5 ? '#f87171' : '#facc15' }}>{item.injury_count > 5 ? 'CRITICAL RISK' : 'FRAGILE'}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : statMode === 'consistent' ? (
                                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                        <h2 style={{ color: '#60a5fa', margin: '0 0 20px 0', fontSize: '1.8em' }}>📈 Form Consistency Kings</h2>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="modern-table">
                                                <thead><tr><th>Rank</th><th>Player</th><th style={{textAlign: 'center'}}>Peak "A" Form Count</th></tr></thead>
                                                <tbody>
                                                    {consistentPlayers.map((item, index) => (
                                                        <tr key={item.cardid} onClick={() => handleCardClick(item.cardid)} style={{ cursor: 'pointer' }}>
                                                            <td style={{ fontWeight: 'bold', color: '#94a3b8' }}>#{index + 1}</td>
                                                            <td style={{ color: '#fff', fontWeight: 'bold' }}>{item.playername}</td>
                                                            <td style={{ textAlign: 'center' }}><span style={{ background: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa', padding: '4px 12px', borderRadius: '6px', fontWeight: 'bold' }}>{item.a_form_count} Weeks</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : statMode === 'recent-forms' ? (
                                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                        <h2 style={{ color: '#facc15', margin: '0 0 20px 0', fontSize: '1.8em' }}>🔥 Live Hot Form Updates</h2>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="modern-table">
                                                <thead><tr><th>Last Updated</th><th>Player</th><th style={{textAlign: 'center'}}>Condition</th></tr></thead>
                                                <tbody>
                                                    {recentForms.map((item, index) => (
                                                        <tr key={item.cardid} onClick={() => handleCardClick(item.cardid)} style={{ cursor: 'pointer' }}>
                                                            <td style={{ color: '#94a3b8' }}>{new Date(item.last_updated).toLocaleDateString()}</td>
                                                            <td style={{ color: '#fff', fontWeight: 'bold' }}>{item.playername}</td>
                                                            <td style={{ textAlign: 'center' }}><span style={{ background: item.formname === 'A' ? '#4ade80' : '#38bdf8', color: '#000', padding: '4px 16px', borderRadius: '6px', fontWeight: '900' }}>{item.formname}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : statMode === 'market-value' ? (
                                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                        <h2 style={{ color: '#e879f9', margin: '0 0 20px 0', fontSize: '1.8em' }}>💎 Top 10 Market Value</h2>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="modern-table">
                                                <thead><tr><th>Rank</th><th>Player</th><th style={{textAlign: 'right'}}>Avg. Value</th><th style={{textAlign: 'center'}}>Base OVR</th></tr></thead>
                                                <tbody>
                                                    {topMarketValues.map((item, index) => (
                                                        <tr key={item.cardid} onClick={() => handleCardClick(item.cardid)} style={{ cursor: 'pointer' }}>
                                                            <td style={{ fontWeight: 'bold', color: '#94a3b8' }}>#{index + 1}</td>
                                                            <td style={{ color: '#fff', fontWeight: 'bold' }}>{item.playername}</td>
                                                            <td style={{ textAlign: 'right', color: '#e879f9', fontWeight: 'bold' }}>€ {Number(item.avg_market_value).toLocaleString()}</td>
                                                            <td style={{ textAlign: 'center', color: '#fff' }}>{item.baseoverallrating}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : statMode === 'liked-builds' && (
                                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                        <h2 style={{ color: '#a78bfa', margin: '0 0 20px 0', fontSize: '1.8em' }}>🏆 Community Favorite Builds</h2>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="modern-table">
                                                <thead><tr><th>Rank</th><th>Build Name</th><th>Architect</th><th>Target</th><th style={{textAlign: 'center'}}>OVR</th><th style={{textAlign: 'center'}}>Appreciation</th></tr></thead>
                                                <tbody>
                                                    {mostLikedBuilds.map((item, index) => (
                                                        <tr key={item.buildid}>
                                                            <td style={{ fontWeight: 'bold', color: '#94a3b8' }}>#{index + 1}</td>
                                                            <td style={{ color: '#a78bfa', fontWeight: 'bold' }}>{item.buildname}</td>
                                                            <td style={{ color: '#94a3b8' }}>{item.author}</td>
                                                            <td style={{ color: '#fff', fontWeight: 'bold' }}>{item.playername} <span style={{fontSize: '0.8em', color: '#64748b'}}>({item.positioncode})</span></td>
                                                            <td style={{ textAlign: 'center', color: '#fff' }}>{item.baseoverallrating}</td>
                                                            <td style={{ textAlign: 'center' }}><span style={{ background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', padding: '4px 12px', borderRadius: '6px', fontWeight: 'bold' }}>👍 {item.total_likes}</span></td>
                                                        </tr>
                                                    ))}
                                                    {mostLikedBuilds.length === 0 && (
                                                        <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No community builds have been favored yet.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
            </>
            )}
        </div>

      {/* --- AUTHENTICATION MODAL POPUP FOR GUESTS --- */}
      {showAuthModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div style={{ position: 'relative', width: '90%', maxWidth: '450px' }}>
            <button 
              onClick={() => setShowAuthModal(false)}
              style={{
                position: 'absolute', top: '15px', right: '15px', zIndex: 10,
                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '1.1em'
              }}
            >
              ✕
            </button>

            <div className="glass-panel" style={{ width: '100%', padding: '40px 35px', textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                <img src="/logo.png" alt="eFVerse Logo" style={{ width: '64px', height: '64px', borderRadius: '16px', boxShadow: '0 0 20px rgba(0, 242, 254, 0.4)', border: '1px solid rgba(0, 242, 254, 0.3)' }} />
                <h1 style={{ margin: 0, fontSize: '2.4em', background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '900', letterSpacing: '2px' }}>
                    eFVerse
                </h1>
              </div>

              {authModalPrompt && (
                <div style={{
                  marginBottom: '20px', padding: '10px 14px', background: 'rgba(0, 242, 254, 0.15)',
                  border: '1px solid rgba(0, 242, 254, 0.4)', borderRadius: '10px', color: '#00f2fe',
                  fontWeight: '600', fontSize: '0.85em', textAlign: 'center'
                }}>
                  🔒 {authModalPrompt}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', background: 'rgba(0,0,0,0.4)', padding: '5px', borderRadius: '10px' }}>
                <button onClick={() => { setView('login'); setMessage("") }} style={{flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '800', fontFamily: "'Outfit', sans-serif", fontSize: '0.9em', letterSpacing: '1px', transition: '0.3s', background: view === 'login' ? 'linear-gradient(135deg, #00f2fe, #4facfe)' : 'transparent', color: view === 'login' ? '#000' : '#94a3b8' }}>
                    LOGIN
                </button>
                <button onClick={() => { setView('register'); setMessage("") }} style={{flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '800', fontFamily: "'Outfit', sans-serif", fontSize: '0.9em', letterSpacing: '1px', transition: '0.3s', background: view === 'register' ? 'linear-gradient(135deg, #00f2fe, #4facfe)' : 'transparent', color: view === 'register' ? '#000' : '#94a3b8' }}>
                    REGISTER
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input className="input-modern" name="username" placeholder="Username or Email" onChange={handleChange} required style={{ fontSize: '1em' }} />
                
                {view === 'register' && (
                  <>
                    <input className="input-modern" name="email" type="email" placeholder="Email Address" onChange={handleChange} required style={{ fontSize: '1em' }} />
                    <div style={{ textAlign: 'left' }}>
                        <label style={{color: '#94a3b8', fontSize: '0.8em', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', display: 'block', fontWeight: '700'}}>Clearance Level</label>
                        <select className="input-modern" name="role" onChange={handleChange} value={formData.role}>
                            <option value="USER">Standard User</option>
                            <option value="ADMIN">System Administrator</option>
                        </select>
                    </div>
                  </>
                )}

                <input className="input-modern" name="password" type="password" placeholder="Password" onChange={handleChange} required style={{ fontSize: '1em' }} />

                <button type="submit" className="glowing-btn" style={{ width: '100%', marginTop: '5px', padding: '12px' }}>
                  {view === 'login' ? 'Sign In to eFVerse' : 'Create Account'}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 15px 0', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                <span style={{ color: '#94a3b8', fontSize: '0.7em', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>OR CONTINUE WITH</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <div id="googleSignInBtn"></div>
              </div>

              {message && (
                <div style={{ marginTop: '20px', padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85em', background: message.includes('Error') ? 'rgba(248, 113, 113, 0.1)' : 'rgba(74, 222, 128, 0.1)', color: message.includes('Error') ? '#f87171' : '#4ade80', border: `1px solid ${message.includes('Error') ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}` }}>
                    {message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App