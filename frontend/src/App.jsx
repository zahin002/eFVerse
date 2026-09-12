import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import AdminPanel from './AdminPanel'
import PlayerCardView from './PlayerCardView';
import SmartSearch from './SmartSearch';
import ManagerDetailView from './ManagerDetailView';
import SquadBuilder from './SquadBuilder';
import CardTrainer from './CardTrainer';
import { getManagerPhotoUrl } from './badgeAssetEngine';
import { FaLongArrowAltRight } from "react-icons/fa";

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
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

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

    // Automatically fetch statistics when statMode changes (e.g. from routing, back/forward, direct link)
    useEffect(() => {
        if (!statMode) return;
        if (statMode === 'top-rated') fetchStats();
        else if (statMode === 'top-scorers') fetchTopScorers();
        else if (statMode === 'injury-prone') fetchInjuryStats();
        else if (statMode === 'consistent') fetchConsistencyStats();
        else if (statMode === 'recent-forms') fetchRecentForms();
        else if (statMode === 'market-value') fetchMarketStats();
        else if (statMode === 'liked-builds') fetchMostLikedBuilds();
    }, [statMode]);

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
    e.preventDefault();
    setMessage("Processing...");

    const endpoint = view === 'login' ? '/api/auth/login' : '/api/auth/register';
    const apiUrl = `http://localhost:5001${endpoint}`;

    try {
        const response = await axios.post(apiUrl, formData);
        setMessage(response.data.message);

        if (view === 'login') {
            const userData = response.data.user || response.data;

            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setShowAuthModal(false);

            // Redirect based on role
            if (userData.role === 'ADMIN') {
                setView('adminDashboard'); // Switch view state to Admin Dashboard
            } else {
                setView('home'); // Switch view state to Standard User view
            }
        }
    } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        setMessage("Error: " + errorMsg);
    }
};
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

    // ============================================
    // CENTRAL ROUTER & BROWSER HISTORY ENGINE
    // ============================================
    const navigate = useCallback((path, replace = false) => {
        if (!path) return;
        const currentPath = window.location.pathname;
        if (currentPath !== path) {
            if (replace) {
                window.history.replaceState({ path }, '', path);
            } else {
                window.history.pushState({ path }, '', path);
            }
        }
    }, []);

    const applyRoute = useCallback(async (pathname) => {
        const path = (pathname || window.location.pathname || '/').toLowerCase();

        // 1. Squad Builder (/squad-builder, /squad-builder/pitch, /squad-builder/edit/:id)
        if (path === '/squad-builder' || path.startsWith('/squad-builder/')) {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) {
                setAuthModalPrompt("Please sign in to build and save custom tactical squads.");
                setShowAuthModal(true);
                setShowSquadBuilder(false);
                setUserTab('cards');
                window.history.replaceState({ path: '/' }, '', '/');
                return;
            }
            setSelectedCard(null);
            setSelectedManager(null);
            setTrainingCard(null);
            setStatMode(null);
            setShowSquadBuilder(true);
            return;
        }

        // 2. Player Card View (/card/:id or /card/:id/compare/:otherId)
        if (path.startsWith('/card/')) {
            const cardId = path.split('/card/')[1]?.split('/')[0];
            if (cardId) {
                setShowSquadBuilder(false);
                setSelectedManager(null);
                setTrainingCard(null);
                setStatMode(null);
                try {
                    const res = await axios.get(`http://localhost:5001/api/players/view-card/${cardId}`);
                    setSelectedCard(res.data);
                } catch (err) {
                    console.error("Error loading card route:", err);
                }
            }
            return;
        }

        // 3. Manager Detail View (/manager/:id)
        if (path.startsWith('/manager/')) {
            const mgrId = path.split('/manager/')[1]?.split('/')[0];
            if (mgrId) {
                setShowSquadBuilder(false);
                setSelectedCard(null);
                setTrainingCard(null);
                setStatMode(null);
                try {
                    const res = await axios.get('http://localhost:5001/api/managers/list');
                    const found = res.data.find(m => String(m.managerid) === String(mgrId));
                    if (found) {
                        setSelectedManager(found);
                    }
                } catch (err) {
                    console.error("Error loading manager route:", err);
                }
            }
            return;
        }

        // 4. Card Trainer (/train/:id)
        if (path.startsWith('/train/')) {
            const cardId = path.split('/train/')[1]?.split('/')[0];
            if (cardId) {
                setShowSquadBuilder(false);
                setSelectedManager(null);
                setStatMode(null);
                try {
                    const res = await axios.get(`http://localhost:5001/api/players/view-card/${cardId}`);
                    setTrainingCard(res.data);
                } catch (err) {
                    console.error("Error loading training route:", err);
                }
            }
            return;
        }

        // 5. Tactical Managers tab (/managers)
        if (path === '/managers') {
            setShowSquadBuilder(false);
            setSelectedCard(null);
            setSelectedManager(null);
            setTrainingCard(null);
            setStatMode(null);
            setUserTab('managers');
            return;
        }

        // 6. Admin Panel (/admin or /admin/:tab)
        if (path.startsWith('/admin')) {
            setShowSquadBuilder(false);
            setSelectedCard(null);
            setSelectedManager(null);
            setTrainingCard(null);
            setStatMode(null);
            return;
        }

        // 8. Default / Home / Cards Gallery (/ or /cards)
        setShowSquadBuilder(false);
        setSelectedCard(null);
        setSelectedManager(null);
        setTrainingCard(null);
        setStatMode(null);
        setUserTab('cards');
    }, []);

    // PopState listener for Browser Back / Forward buttons
    useEffect(() => {
        const handlePopState = () => {
            applyRoute(window.location.pathname);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [applyRoute]);

    // Initial mount routing
    useEffect(() => {
        const initialPath = window.location.pathname;
        if (initialPath && initialPath !== '/') {
            applyRoute(initialPath);
        } else {
            window.history.replaceState({ path: '/' }, '', '/');
        }
    }, [applyRoute]);

    const handleCardClick = async (cardId) => {
        if (!cardId || cardId === 'null' || cardId === 'undefined') {
            alert("This player does not have a configured card registry entry.");
            return;
        }
        try {
            const res = await axios.get(`http://localhost:5001/api/players/view-card/${cardId}`);
            setSelectedCard(res.data);
            navigate(`/card/${cardId}`);
        } catch (err) {
            console.error("Error loading card details", err);
        }
    };

    const handleManagerClick = (mgr) => {
        if (!mgr || !mgr.managerid) return;
        setSelectedManager(mgr);
        navigate(`/manager/${mgr.managerid}`);
    };

    const handleOpenSquadBuilder = () => {
        if (!user) {
            setAuthModalPrompt("Please sign in to build and save custom tactical squads.");
            setShowAuthModal(true);
            return;
        }
        setShowSquadBuilder(true);
        navigate('/squad-builder');
    };

    const handleTabChange = (tab) => {
        setUserTab(tab);
        setStatMode(null);
        if (tab === 'cards') navigate('/cards');
        else if (tab === 'managers') navigate('/managers');
    };

    const handleStatSelect = (mode) => {
        setStatMode(mode);
        navigate(`/stats/${mode}`);
    };

    const handleGoHome = () => {
        setSelectedCard(null);
        setSelectedManager(null);
        setTrainingCard(null);
        setShowSquadBuilder(false);
        setStatMode(null);
        setUserTab('cards');
        navigate('/');
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
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
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

    .glowing-btn-ghost {
        background: transparent;
        color: #fff;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
        border: 2px solid rgba(255,255,255,0.2);
        border-radius: 12px;
        padding: 14px 32px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: 'Outfit', sans-serif;
        font-size: 0.95em;
    }
    .glowing-btn-ghost:hover {
        border-color: rgba(0, 242, 254, 0.6);
        color: #00f2fe;
        background: rgba(0, 242, 254, 0.05);
        box-shadow: 0 0 20px rgba(0, 242, 254, 0.15);
        transform: translateY(-2px);
    }

    /* HERO SECTION */
    .hero-section {
        position: relative;
        padding: 80px 5vw 60px;
        margin: -40px -5vw 0;
        overflow: hidden;
        text-align: center;
    }
    .hero-section::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,242,254,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 20% 100%, rgba(79,172,254,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 100%, rgba(167,139,250,0.08) 0%, transparent 60%);
        pointer-events: none;
        z-index: 0;
    }
    .hero-section > * { position: relative; z-index: 1; }

    .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(0, 242, 254, 0.08);
        border: 1px solid rgba(0, 242, 254, 0.25);
        border-radius: 999px;
        padding: 6px 18px;
        font-size: 0.82em;
        font-weight: 700;
        color: #00f2fe;
        letter-spacing: 0.5px;
        margin-bottom: 28px;
        text-transform: uppercase;
    }

    .hero-title {
        font-size: clamp(2.4em, 5vw, 4em);
        font-weight: 900;
        line-height: 1.1;
        margin: 0 auto 20px;
        max-width: 820px;
        background: linear-gradient(135deg, #ffffff 0%, #c8e6ff 50%, #00f2fe 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -1px;
    }

    .hero-subtitle {
        font-size: 1.15em;
        color: #94a3b8;
        margin: 0 auto 36px;
        max-width: 560px;
        line-height: 1.6;
        font-weight: 400;
    }

    .hero-ctas {
        display: flex;
        gap: 16px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 56px;
    }

    /* STAT TICKER */
    .stat-ticker {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 0;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 16px;
        overflow: hidden;
        max-width: 820px;
        margin: 0 auto;
    }
    .stat-ticker-item {
        flex: 1;
        min-width: 140px;
        padding: 20px 24px;
        text-align: center;
        border-right: 1px solid rgba(255,255,255,0.06);
        position: relative;
    }
    .stat-ticker-item:last-child { border-right: none; }
    .stat-ticker-value {
        font-size: 1.9em;
        font-weight: 900;
        line-height: 1;
        margin-bottom: 6px;
    }
    .stat-ticker-label {
        font-size: 0.72em;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
    }

    /* SECTION HEADER */
    .section-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 20px;
    }
    .section-header-bar {
        width: 4px;
        height: 28px;
        border-radius: 2px;
        flex-shrink: 0;
    }
    .section-header h3 {
        margin: 0;
        font-size: 1.35em;
        font-weight: 800;
        letter-spacing: -0.3px;
    }
    .section-header-count {
        margin-left: auto;
        font-size: 0.8em;
        color: #64748b;
        font-weight: 600;
        background: rgba(255,255,255,0.05);
        padding: 4px 12px;
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,0.07);
    }

    /* CARD TILES */
    .card-tile {
        cursor: pointer;
        border-radius: 18px;
        padding: 0;
        position: relative;
        overflow: hidden;
        transition: transform 0.3s cubic-bezier(0.25,0.8,0.25,1), box-shadow 0.3s ease;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        min-width: 168px;
        max-width: 190px;
    }
    .card-tile:hover {
        transform: translateY(-10px) scale(1.03);
    }
    .card-tile::after {
        content: '';
        position: absolute;
        top: 0; left: -75%;
        width: 50%; height: 100%;
        background: linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent);
        transform: skewX(-20deg);
        transition: left 0.6s ease;
        pointer-events: none;
    }
    .card-tile:hover::after { left: 130%; }

    .card-tile-legendary {
        background: linear-gradient(160deg, #1a1200 0%, #2c1f00 40%, #1a1200 100%);
        border: 1px solid rgba(255, 200, 0, 0.35);
        box-shadow: 0 4px 24px rgba(255,180,0,0.18), inset 0 1px 0 rgba(255,220,0,0.1);
    }
    .card-tile-legendary:hover {
        box-shadow: 0 16px 48px rgba(255,180,0,0.4), 0 0 0 1px rgba(255,200,0,0.5);
    }
    .card-tile-potw {
        background: linear-gradient(160deg, #001a0f 0%, #002818 40%, #001a0f 100%);
        border: 1px solid rgba(0, 255, 135, 0.3);
        box-shadow: 0 4px 24px rgba(0,255,135,0.15), inset 0 1px 0 rgba(0,255,135,0.08);
    }
    .card-tile-potw:hover {
        box-shadow: 0 16px 48px rgba(0,255,135,0.35), 0 0 0 1px rgba(0,255,135,0.5);
    }
    .card-tile-standard {
        background: linear-gradient(160deg, #080d16 0%, #0d1629 40%, #080d16 100%);
        border: 1px solid rgba(0, 180, 254, 0.2);
        box-shadow: 0 4px 20px rgba(0,140,200,0.12), inset 0 1px 0 rgba(0,200,255,0.06);
    }
    .card-tile-standard:hover {
        box-shadow: 0 16px 40px rgba(0,200,255,0.25), 0 0 0 1px rgba(0,200,255,0.4);
    }

    .card-tile-inner {
        padding: 18px 18px 16px;
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    .card-tile-type-badge {
        font-size: 0.62em;
        font-weight: 800;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        padding: 3px 8px;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: 12px;
        align-self: flex-start;
    }

    .card-tile-ovr {
        font-size: 3.4em;
        font-weight: 900;
        line-height: 1;
        letter-spacing: -2px;
        margin-bottom: 4px;
    }

    .card-tile-pos {
        font-size: 0.78em;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        opacity: 0.6;
        margin-bottom: 14px;
    }

    .card-tile-name {
        font-size: 0.92em;
        font-weight: 800;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 0;
        line-height: 1.2;
    }

    .card-tile-footer {
        margin-top: 14px;
        padding-top: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.72em;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.8px;
    }

    /* CARD GRID SCROLL CONTAINER */
    .card-scroll-row {
        display: flex;
        gap: 16px;
        overflow-x: auto;
        padding: 8px 2px 16px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.1) transparent;
    }
    .card-scroll-row::-webkit-scrollbar { height: 4px; }
    .card-scroll-row::-webkit-scrollbar-track { background: transparent; }
    .card-scroll-row::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

    /* SEARCH SEE ALL */
    .see-all-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        color: #94a3b8;
        border-radius: 999px;
        padding: 10px 22px;
        font-size: 0.85em;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.25s ease;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        font-family: 'Outfit', sans-serif;
    }
    .see-all-btn:hover {
        background: rgba(0,242,254,0.08);
        border-color: rgba(0,242,254,0.3);
        color: #00f2fe;
        transform: translateX(4px);
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

    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
    }
    @keyframes pulseGlow {
        0%, 100% { opacity: 0.5; }
        50%       { opacity: 1; }
    }
    .animate-fadeinup { animation: fadeInUp 0.6s ease both; }
    .animate-fadein   { animation: fadeIn 0.4s ease both; }
  `;

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
                        <img src="/logo.png" alt="eFVerse Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0, 242, 254, 0.45))', transition: 'transform 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
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
                    <SquadBuilder
                        currentUser={user}
                        onBack={() => {
                            if (window.history.length > 1) window.history.back();
                            else handleGoHome();
                        }}
                    />
                ) : trainingCard ? (
                    <CardTrainer
                        card={trainingCard}
                        onBack={() => {
                            if (window.history.length > 1) window.history.back();
                            else handleGoHome();
                        }}
                        onComplete={() => {
                            setTrainingCard(null);
                            axios.get('http://localhost:5001/api/players/list-cards').then(res => setAllCards(res.data));
                            if (window.history.length > 1) window.history.back();
                            else handleGoHome();
                        }}
                    />
                ) : selectedCard ? (
                    <PlayerCardView
                        data={selectedCard}
                        onBack={() => {
                            if (window.history.length > 1) window.history.back();
                            else handleGoHome();
                        }}
                        onSelectCard={handleCardClick}
                        onTrain={(cardData) => {
                            setTrainingCard(cardData);
                            const id = cardData.cardid || cardData.CardID;
                            navigate(`/train/${id}`);
                        }}
                    />
                ) : selectedManager ? (
                    <ManagerDetailView
                        data={selectedManager}
                        onBack={() => {
                            if (window.history.length > 1) window.history.back();
                            else handleGoHome();
                        }}
                    />
                ) : (
                    <>
                        {user?.role === 'ADMIN' && (
                            <div className="glass-panel" style={{ padding: '30px' }}>
                                <AdminPanel />
                            </div>
                        )}

                        {(!user || user.role === 'USER') && (
                            <>

                                {/* ===================== CINEMATIC HERO SECTION ===================== */}
                                <div className="hero-section animate-fadeinup">
                                    {/* Floating orbs */}
                                    <div style={{ position: 'absolute', top: '10%', left: '5%', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(0,242,254,0.08) 0%, transparent 70%)', borderRadius: '50%', animation: 'pulseGlow 4s ease-in-out infinite', pointerEvents: 'none' }} />
                                    <div style={{ position: 'absolute', bottom: '10%', right: '8%', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)', borderRadius: '50%', animation: 'pulseGlow 5s ease-in-out infinite 1s', pointerEvents: 'none' }} />

                                    <div className="hero-badge"> eFootball Squad Building Platform</div>

                                    <h1 className="hero-title">
                                        eFVerse
                                    </h1>
                                    <p className="hero-subtitle">
                                        Explore player cards, build tactical squads, track progression builds 
                                    </p>

                                    <div className="hero-ctas">
                                        <button className="glowing-btn" style={{ fontSize: '1em', padding: '16px 36px', borderRadius: '14px' }} onClick={() => handleTabChange('cards')}>
                                             Browse All Cards
                                        </button>
                                        <button className="glowing-btn-ghost" onClick={handleOpenSquadBuilder}>
                                             Build Your Squad
                                        </button>
                                    </div>

                                    {/* LIVE STAT TICKER */}
                                    <div className="stat-ticker">
                                        <div className="stat-ticker-item">
                                            <div className="stat-ticker-value" style={{ color: '#00f2fe' }}>{allCards.length}</div>
                                            <div className="stat-ticker-label"> Total Cards</div>
                                        </div>
                                        <div className="stat-ticker-item">
                                            <div className="stat-ticker-value" style={{ color: '#ffd700' }}>{allCards.filter(c => c.cardtype === 'Legendary').length}</div>
                                            <div className="stat-ticker-label"> Legendary</div>
                                        </div>
                                        <div className="stat-ticker-item">
                                            <div className="stat-ticker-value" style={{ color: '#00ff87' }}>{allCards.filter(c => c.cardtype === 'POTW').length}</div>
                                            <div className="stat-ticker-label"> POTW</div>
                                        </div>
                                        {/* <div className="stat-ticker-item">
                                            <div className="stat-ticker-value" style={{ color: '#a78bfa' }}>{allCards.length > 0 ? Math.max(...allCards.map(c => parseInt(c.baseoverallrating) || 0)) : '—'}</div>
                                            <div className="stat-ticker-label"> Top OVR</div>
                                        </div> */}
                                    </div>
                                </div>

                                {/* ===================== PILL NAVIGATION ===================== */}
                                <div style={{ display: 'flex', gap: '12px', margin: '48px 0 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px', flexWrap: 'wrap' }}>
                                    <button className={`nav-pill ${userTab === 'cards' ? 'active' : 'inactive'}`} onClick={() => handleTabChange('cards')}>Player Database</button>
                                    <button className={`nav-pill ${userTab === 'managers' ? 'active' : 'inactive'}`} onClick={() => handleTabChange('managers')}>Manager Registry</button>
                                </div>

                                {/* ===================== TAB CONTENT: CARDS ===================== */}
                                {userTab === 'cards' && (
                                    <div className="animate-fadein">

                                        {/* LOADING STATE */}
                                        {loadingCards ? (
                                            <div className="glass-panel" style={{ padding: '80px 30px', textAlign: 'center', color: '#00f2fe', borderRadius: '20px', border: '1px solid rgba(0, 242, 254, 0.15)', width: '100%', marginBottom: '40px' }}>
                                                <div style={{ fontSize: '3em', marginBottom: '16px' }}>⚽</div>
                                                <h3 style={{ color: '#fff', fontSize: '1.4em', fontWeight: '900', margin: '0 0 8px 0' }}>Loading eFVerse Database...</h3>
                                                <p style={{ margin: 0, fontSize: '0.95em', color: '#94a3b8' }}>Fetching eFootball player card collections...</p>
                                            </div>
                                        ) : allCards.length === 0 ? (
                                            <div className="glass-panel" style={{ padding: '60px 30px', textAlign: 'center', color: '#64748b', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)', width: '100%', marginBottom: '40px' }}>
                                                <div style={{ fontSize: '2.5em', marginBottom: '12px' }}>⚽</div>
                                                <h3 style={{ color: '#e2e8f0', fontSize: '1.3em', fontWeight: '800', margin: '0 0 8px 0' }}>No Player Cards Found</h3>
                                                <p style={{ margin: 0, fontSize: '0.95em', color: '#94a3b8' }}>Featured card collections will appear here once player data is loaded.</p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                                                {/* ── TOP GLOBAL FILTER & SORT TOOLBAR ── */}
                                                <div className="glass-panel" style={{
                                                    padding: '16px 24px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    gap: '16px',
                                                    flexWrap: 'wrap',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    borderRadius: '16px',
                                                    background: 'rgba(10, 16, 28, 0.7)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                       
                                                        <div>
                                                            <div style={{ fontSize: '0.95em', fontWeight: '800', color: '#fff', letterSpacing: '0.5px' }}>
                                                                PLAYER CARD CATALOG
                                                            </div>
                                                            {/* <div style={{ fontSize: '0.78em', color: '#94a3b8' }}>
                                                                Showing {allCards.filter(c => c.cardid).length} configured player cards
                                                            </div> */}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '0.78em', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Type:</span>
                                                            <select
                                                                className="input-modern"
                                                                value={cardFilter}
                                                                onChange={e => setCardFilter(e.target.value)}
                                                                style={{ width: 'auto', padding: '9px 16px', fontSize: '0.85em', borderRadius: '10px' }}
                                                            >
                                                                <option value="all">All Card Types</option>
                                                                <option value="Legendary"> Legendary Stars</option>
                                                                <option value="POTW"> Player of the Week</option>
                                                                <option value="Standard"> Standard Cards</option>
                                                                <option value="cards_only">Configured Cards Only</option>
                                                                <option value="no_cards">Unconfigured Players</option>
                                                            </select>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '0.78em', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Sort:</span>
                                                            <select
                                                                className="input-modern"
                                                                value={cardSort}
                                                                onChange={e => setCardSort(e.target.value)}
                                                                style={{ width: 'auto', padding: '9px 16px', fontSize: '0.85em', borderRadius: '10px' }}
                                                            >
                                                                <option value="default">Default Order</option>
                                                                <option value="ovr_desc">Rating: High → Low</option>
                                                                <option value="ovr_asc">Rating: Low → High</option>
                                                                <option value="name_asc">Player Name: A → Z</option>
                                                                <option value="name_desc">Player Name: Z → A</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ── LEGENDARY COLLECTION ── */}
                                                {allCards.filter(c => c.cardtype === 'Legendary').length > 0 && (
                                                    <div className="animate-fadeinup" style={{ animationDelay: '0.1s' }}>
                                                        <div className="section-header">
                                                            <div className="section-header-bar" style={{ background: 'linear-gradient(180deg, #FFD700, #B8860B)' }} />
                                                            <h3 style={{ color: '#FFD700' }}> Legendary Stars</h3>
                                                            <span className="section-header-count">{allCards.filter(c => c.cardtype === 'Legendary').length} cards</span>
                                                        </div>
                                                        <div className="card-scroll-row">
                                                            {allCards.filter(c => c.cardtype === 'Legendary').map((card, idx) => (
                                                                <div key={card.cardid || `leg-${idx}`} className="card-tile card-tile-legendary" onClick={() => handleCardClick(card.cardid)}>
                                                                    <div className="card-tile-inner">
                                                                        <span className="card-tile-type-badge" style={{ background: 'rgba(255,200,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,200,0,0.3)' }}>LEGENDARY</span>
                                                                        <div className="card-tile-ovr" style={{ color: '#FFD700', textShadow: '0 0 20px rgba(255,200,0,0.4)' }}>{card.baseoverallrating || '—'}</div>
                                                                        <div className="card-tile-pos" style={{ color: '#FFD700' }}>{card.positioncode || card.player?.primaryposition || 'N/A'}</div>
                                                                        <div className="card-tile-name">{card.player?.playername || 'Unknown Player'}</div>
                                                                        <div className="card-tile-footer" style={{ borderTop: '1px solid rgba(255,200,0,0.15)', color: '#FFD700' }}>
                                                                            <span>View Stats</span>
                                                                            <span><FaLongArrowAltRight /></span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ── POTW COLLECTION ── */}
                                                {allCards.filter(c => c.cardtype === 'POTW').length > 0 && (
                                                    <div className="animate-fadeinup" style={{ animationDelay: '0.2s' }}>
                                                        <div className="section-header">
                                                            <div className="section-header-bar" style={{ background: 'linear-gradient(180deg, #00FF87, #00A855)' }} />
                                                            <h3 style={{ color: '#00FF87' }}> Player of the Week</h3>
                                                            <span className="section-header-count">{allCards.filter(c => c.cardtype === 'POTW').length} cards</span>
                                                        </div>
                                                        <div className="card-scroll-row">
                                                            {allCards.filter(c => c.cardtype === 'POTW').map((card, idx) => (
                                                                <div key={card.cardid || `potw-${idx}`} className="card-tile card-tile-potw" onClick={() => handleCardClick(card.cardid)}>
                                                                    <div className="card-tile-inner">
                                                                        <span className="card-tile-type-badge" style={{ background: 'rgba(0,255,135,0.12)', color: '#00FF87', border: '1px solid rgba(0,255,135,0.3)' }}>POTW</span>
                                                                        <div className="card-tile-ovr" style={{ color: '#00FF87', textShadow: '0 0 20px rgba(0,255,135,0.4)' }}>{card.baseoverallrating || '—'}</div>
                                                                        <div className="card-tile-pos" style={{ color: '#00FF87' }}>{card.positioncode || card.player?.primaryposition || 'N/A'}</div>
                                                                        <div className="card-tile-name">{card.player?.playername || 'Unknown Player'}</div>
                                                                        <div className="card-tile-footer" style={{ borderTop: '1px solid rgba(0,255,135,0.15)', color: '#00FF87' }}>
                                                                            <span>View Stats</span>
                                                                            <span>→</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ── STANDARD CARDS COLLECTION ── */}
                                                {allCards.filter(c => c.cardtype === 'Standard' || (!c.cardtype && c.cardid)).length > 0 && (
                                                    <div className="animate-fadeinup" style={{ animationDelay: '0.3s' }}>
                                                        <div className="section-header" style={{ marginBottom: '16px' }}>
                                                            <div className="section-header-bar" style={{ background: 'linear-gradient(180deg, #00f2fe, #4facfe)' }} />
                                                            <h3 style={{ color: '#00f2fe' }}> Standard Player Cards</h3>
                                                            <span className="section-header-count">{allCards.filter(c => c.cardtype === 'Standard' || (!c.cardtype && c.cardid)).length} cards</span>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: '16px' }}>
                                                            {allCards.filter(c => c.cardtype === 'Standard' || (!c.cardtype && c.cardid)).map((card, idx) => (
                                                                <div key={card.cardid || `std-${idx}`} className="card-tile card-tile-standard" onClick={() => handleCardClick(card.cardid)} style={{ maxWidth: '100%' }}>
                                                                    <div className="card-tile-inner">
                                                                        <span className="card-tile-type-badge" style={{ background: 'rgba(0,200,255,0.1)', color: '#00f2fe', border: '1px solid rgba(0,200,255,0.25)' }}>STANDARD</span>
                                                                        <div className="card-tile-ovr" style={{ color: '#00f2fe', textShadow: '0 0 20px rgba(0,242,254,0.4)' }}>{card.baseoverallrating || '—'}</div>
                                                                        <div className="card-tile-pos" style={{ color: '#00f2fe' }}>{card.positioncode || card.player?.primaryposition || 'N/A'}</div>
                                                                        <div className="card-tile-name">{card.player?.playername || 'Unknown Player'}</div>
                                                                        <div className="card-tile-footer" style={{ borderTop: '1px solid rgba(0,242,254,0.15)', color: '#00f2fe' }}>
                                                                            <span>View Stats</span>
                                                                            <span> <FaLongArrowAltRight /></span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ── UNCONFIGURED PLAYERS (WHEN FILTERED) ── */}
                                                {/* {allCards.filter(c => !c.cardid).length > 0 && (
                                                    <div className="animate-fadeinup" style={{ animationDelay: '0.3s' }}>
                                                        <div className="section-header" style={{ marginBottom: '16px' }}>
                                                            <div className="section-header-bar" style={{ background: 'linear-gradient(180deg, #94a3b8, #64748b)' }} />
                                                            <h3 style={{ color: '#94a3b8' }}>👤 Unconfigured Database Players</h3>
                                                            <span className="section-header-count">{allCards.filter(c => !c.cardid).length} players</span>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: '16px' }}>
                                                            {allCards.filter(c => !c.cardid).map((card, idx) => (
                                                                <div key={`unconf-${idx}`} className="card-tile" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px dashed rgba(255,255,255,0.15)', cursor: 'default', maxWidth: '100%' }}>
                                                                    <div className="card-tile-inner">
                                                                        <span className="card-tile-type-badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>NO CARD</span>
                                                                        <div className="card-tile-ovr" style={{ color: '#64748b' }}>—</div>
                                                                        <div className="card-tile-pos" style={{ color: '#64748b' }}>{card.player?.primaryposition || 'N/A'}</div>
                                                                        <div className="card-tile-name">{card.player?.playername || 'Unknown Player'}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )} */}

                                                {/* ── SMART SEARCH (BELOW THE FOLD) ── */}
                                                <div className="animate-fadeinup" style={{ animationDelay: '0.4s' }}>
                                                    <div className="section-header" style={{ marginBottom: '16px' }}>
                                                        <div className="section-header-bar" style={{ background: 'linear-gradient(180deg, #a78bfa, #7c3aed)' }} />
                                                        <h3 style={{ color: '#a78bfa' }}> Smart Search Intelligence</h3>
                                                    </div>
                                                    <div className="glass-panel" style={{ padding: '28px' }}>
                                                        <SmartSearch onCardClick={handleCardClick} />
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
                                                        <div key={mgr.managerid} onClick={() => handleManagerClick(mgr)} className="glass-panel player-card" style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: '#121620', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', transition: 'all 0.3s ease' }}>
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
                            </>
                        )}
                    </>
                )}
            </div>

            {/* --- AUTHENTICATION MODAL POPUP FOR GUESTS --- */}
            {showAuthModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000, padding: '16px', overflowY: 'auto'
                }} onClick={e => e.target === e.currentTarget && setShowAuthModal(false)}>

                    <div style={{
                        position: 'relative', width: '100%', maxWidth: '420px',
                        maxHeight: 'calc(100vh - 32px)',
                        display: 'flex', flexDirection: 'column',
                    }}>
                        {/* Sticky close button — always visible */}
                        <button
                            onClick={() => setShowAuthModal(false)}
                            style={{
                                position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                                color: '#94a3b8', width: '30px', height: '30px', borderRadius: '50%',
                                cursor: 'pointer', fontWeight: 'bold', fontSize: '1em',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,77,77,0.15)'; e.currentTarget.style.color = '#ff4d4d'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
                        >✕</button>

                        {/* Scrollable card body */}
                        <div className="glass-panel" style={{
                            width: '100%', overflowY: 'auto',
                            padding: '28px 28px 24px',
                            textAlign: 'center', fontFamily: "'Outfit', sans-serif",
                            borderRadius: '20px',
                        }}>
                            {/* Compact logo + brand row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
                                <img src="/logo.png" alt="eFVerse Logo" style={{ width: '42px', height: '42px', objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(0,242,254,0.45))', flexShrink: 0 }} />
                                <h1 style={{ margin: 0, fontSize: '1.7em', background: 'linear-gradient(135deg, #00f2fe, #4facfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '900', letterSpacing: '1.5px' }}>
                                    eFVerse
                                </h1>
                            </div>

                            {authModalPrompt && (
                                <div style={{
                                    marginBottom: '14px', padding: '8px 12px',
                                    background: 'rgba(0,242,254,0.1)', border: '1px solid rgba(0,242,254,0.3)',
                                    borderRadius: '8px', color: '#00f2fe', fontWeight: '600',
                                    fontSize: '0.8em', textAlign: 'center', lineHeight: '1.4'
                                }}>
                                     {authModalPrompt}
                                </div>
                            )}

                            {/* Login / Register tabs */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '10px' }}>
                                <button onClick={() => { setView('login'); setMessage("") }} style={{ flex: 1, padding: '9px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '800', fontFamily: "'Outfit', sans-serif", fontSize: '0.85em', letterSpacing: '1px', transition: '0.3s', background: view === 'login' ? 'linear-gradient(135deg, #00f2fe, #4facfe)' : 'transparent', color: view === 'login' ? '#000' : '#94a3b8' }}>
                                    LOGIN
                                </button>
                                <button onClick={() => { setView('register'); setMessage("") }} style={{ flex: 1, padding: '9px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '800', fontFamily: "'Outfit', sans-serif", fontSize: '0.85em', letterSpacing: '1px', transition: '0.3s', background: view === 'register' ? 'linear-gradient(135deg, #00f2fe, #4facfe)' : 'transparent', color: view === 'register' ? '#000' : '#94a3b8' }}>
                                    REGISTER
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input className="input-modern" name="username" placeholder="Username" onChange={handleChange} required style={{ fontSize: '0.95em', padding: '11px 14px' }} />

                                {view === 'register' && (
                                    <>
                                        <input className="input-modern" name="email" type="email" placeholder="Email Address" onChange={handleChange} required style={{ fontSize: '0.95em', padding: '11px 14px' }} />
                                        {/* <div style={{ textAlign: 'left' }}>
                                            <label style={{ color: '#64748b', fontSize: '0.72em', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', display: 'block', fontWeight: '700' }}>Clearance Level</label>
                                            <select className="input-modern" name="role" onChange={handleChange} value={formData.role} style={{ fontSize: '0.95em', padding: '11px 14px' }}>
                                                <option value="USER">Standard User</option>
                                                <option value="ADMIN">System Administrator</option>
                                            </select>
                                        </div> */}
                                    </>
                                )}

                                <input className="input-modern" name="password" type="password" placeholder="Password" onChange={handleChange} required style={{ fontSize: '0.95em', padding: '11px 14px' }} />

                                <button type="submit" className="glowing-btn" style={{ width: '100%', marginTop: '4px', padding: '11px', fontSize: '0.95em' }}>
                                    {view === 'login' ? 'Sign In to eFVerse' : 'Create Account'}
                                </button>
                            </form>

                            {message && (
                                <div style={{ marginTop: '10px', padding: '9px 12px', borderRadius: '8px', fontWeight: '600', fontSize: '0.82em', background: message.includes('Error') ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)', color: message.includes('Error') ? '#f87171' : '#4ade80', border: `1px solid ${message.includes('Error') ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}` }}>
                                    {message}
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0 10px', gap: '10px' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                                <span style={{ color: '#475569', fontSize: '0.68em', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>OR CONTINUE WITH</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                <div id="googleSignInBtn" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App