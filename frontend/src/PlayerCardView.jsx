import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ComparePlayers from './ComparePlayers'; 
import SmartSearch from './SmartSearch'; 
axios.defaults.withCredentials = true;


export default function PlayerCardView({ data, onBack, onTrain }) {
  if (!data) return <div>Loading...</div>;

  const { player, stats, baseoverallrating, cardtype, primaryposition, playerid, cardid } = data;

  const [currentUser, setCurrentUser] = useState(null);
  
  const [compareMode, setCompareMode] = useState(false);
  const [compareCardId, setCompareCardId] = useState(null);

  useEffect(() => {
      const storedUser = localStorage.getItem('user'); 
      if (storedUser) {
          try {
            setCurrentUser(JSON.parse(storedUser));
          } catch (error) {
            console.error("Error parsing user data from local storage", error);
          }
      }
  }, []);
  
  //History Data ---
  const [formHistory, setFormHistory] = useState([]);
  const [injuryHistory, setInjuryHistory] = useState([]); 
  const [marketHistory, setMarketHistory] = useState([]); 
  
  // Reviews ---
  const [reviews, setReviews] = useState([]); 
  const [showReviews, setShowReviews] = useState(false); 
  
  // Review Form
  const [reviewForm, setReviewForm] = useState({
      matchesPlayed: '', matchesWon: '', goals: '', assists: '', cleanSheets: '', averageRating: ''
  });

 
  const [similarPlayers, setSimilarPlayers] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // --- HELPER: Fetch Data ---
  const refreshAllData = () => {
    if (playerid) {
        axios.get(`http://localhost:5001/api/forms/history/${playerid}`).then(res => setFormHistory(res.data)).catch(console.error);
        axios.get(`http://localhost:5001/api/injuries/history/${playerid}`).then(res => setInjuryHistory(res.data)).catch(console.error);
        axios.get(`http://localhost:5001/api/players/history/${playerid}`).then(res => setMarketHistory(res.data)).catch(console.error);
    }
    if (cardid) {
        axios.get(`http://localhost:5001/api/reviews/${cardid}`)
             .then(res => {
                 setReviews(res.data);
             })
             .catch(err => console.error("Error fetching reviews:", err));
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [playerid, cardid]);

  // --- AUTO-FILL FORM (If User already reviewed) ---
  useEffect(() => {
      if (currentUser && reviews.length > 0) {
          const userId = currentUser.userid || currentUser.UserID || currentUser.id;
          const myReview = reviews.find(r => r.userid === userId || r.UserID === userId);

          if (myReview) {
              setReviewForm({
                  matchesPlayed: myReview.matchesplayed || myReview.MatchesPlayed,
                  matchesWon: myReview.matcheswon || myReview.MatchesWon,
                  goals: myReview.goals || myReview.Goals,
                  assists: myReview.assists || myReview.Assists,
                  cleanSheets: myReview.cleansheets || myReview.CleanSheets,
                  averageRating: myReview.averagerating || myReview.AverageRating
              });
          } else {
              setReviewForm({ matchesPlayed: '', matchesWon: '', goals: '', assists: '', cleanSheets: '', averageRating: '' });
          }
      }
  }, [currentUser, reviews]);

  // Submit Review ---
 const handleSubmitReview = async (e) => {
      e.preventDefault();
      
      if (!currentUser) return alert("Please Login to review.");

      console.log("Current User Object:", currentUser);
      
      const userIdToUse = currentUser.userid || currentUser.UserID || currentUser.id;

      if (!userIdToUse) {
          return alert("❌ Error: User ID is missing. Please Logout and Login again.");
      }

      if (!reviewForm.matchesPlayed || !reviewForm.averageRating) return alert("Matches & Rating required!");

      try {
          const payload = {
              userId: userIdToUse,
              cardId: cardid,
              matchesPlayed: parseInt(reviewForm.matchesPlayed),
              matchesWon: parseInt(reviewForm.matchesWon || 0),
              goals: parseInt(reviewForm.goals || 0),
              assists: parseInt(reviewForm.assists || 0),
              cleanSheets: parseInt(reviewForm.cleanSheets || 0),
              averageRating: parseFloat(reviewForm.averageRating)
          };

          console.log("Sending Payload:", payload);

          await axios.post('http://localhost:5001/api/reviews/add', payload);
          
          alert("✅ Review Saved!");
          refreshAllData(); 
      } catch (error) {
          console.error("Review failed:", error);
          alert("Error saving review: " + (error.response?.data?.error || error.message));
      }
  };

  // --- HANDLE COMPARE SELECT ---
  const handleCompareSelect = (otherCardId) => {
    setCompareCardId(otherCardId);
  };

  
  const handleFindSimilar = async () => {
      setLoadingSimilar(true);
      try {
          const result = await axios.get(`http://localhost:5001/api/players/similar/${cardid}`);
          setSimilarPlayers(result.data);
      } catch (err) {
          console.error("Failed to fetch similar players:", err);
      } finally {
          setLoadingSimilar(false);
      }
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
    const baseStyle = { padding: '30px', borderRadius: '15px', position: 'relative', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px' };
    switch (type) {
        case 'Legendary': return { ...baseStyle, background: 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)', border: '4px solid #fffacd', boxShadow: '0 0 30px rgba(255, 215, 0, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.5)', color: '#3e2723', textShadow: 'none' };
        case 'POTW': return { ...baseStyle, background: 'linear-gradient(135deg, #134e5e 0%, #71b280 50%, #00ff00 100%)', border: '3px solid #00ff00', boxShadow: '0 0 25px rgba(0, 255, 0, 0.7), inset 0 0 10px rgba(255, 255, 255, 0.3)' };
        default: return { ...baseStyle, background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', border: '2px solid #4ca1af', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' };
    }
  };

  const getStatColor = (val) => val >= 90 ? '#00ffff' : val >= 80 ? '#00ff00' : val >= 70 ? '#e6e600' : '#ff4d4d';
  const StatRow = ({ label, value }) => (<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9em' }}><span style={{ color: '#ccc' }}>{label}</span><span style={{ fontWeight: 'bold', color: 'black', backgroundColor: getStatColor(value), padding: '0 6px', borderRadius: '4px', minWidth: '30px', textAlign: 'center' }}>{value}</span></div>);
  const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });

  const currentUserId = currentUser ? (currentUser.userid || currentUser.UserID || currentUser.id) : null;
  const isEditing = currentUser && reviews.some(r => r.userid === currentUserId || r.UserID === currentUserId);

  return (
    <div style={{ background: '#0a0a0a', color: 'white', padding: '20px', borderRadius: '10px', maxWidth: '900px', margin: '0 auto' }}>
      
      {/**/}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <button onClick={onBack} style={{ padding: '8px 16px', background: '#333', color: 'white', border: 'none', cursor: 'pointer', borderRadius:'4px' }}>← Back to List</button>
          
          <div style={{display:'flex', gap:'10px'}}>
            {/* COMPARE BUTTON */}
            <button 
                onClick={() => setCompareMode(true)} 
                style={{ 
                    padding: '8px 16px', 
                    background: '#e0a800', 
                    color: 'black', 
                    border: 'none', 
                    cursor: 'pointer', 
                    borderRadius: '4px',
                    fontWeight: 'bold'
                }}
            >
                🔍 Compare Player
            </button>
            
            <button 
              onClick={() => setShowReviews(!showReviews)} 
              style={{ padding: '8px 16px', background: showReviews ? '#e0a800' : '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius:'4px', fontWeight:'bold' }}
            >
              {showReviews ? '📊 View Stats' : '⭐ User Reviews'}
            </button>
          </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        
        {/* LEFT COLUMN: Card & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={getCardStyle(cardtype)}>
             <h1 style={{ fontSize: '4.5em', margin: 0, lineHeight: 1, color: cardtype === 'Legendary' ? '#3e2723' : getStatColor(baseoverallrating), textShadow: cardtype === 'Legendary' ? 'none' : '0 0 10px rgba(0,0,0,0.8)' }}>{baseoverallrating}</h1>
             <h3 style={{ margin: '5px 0', fontSize: '1.5em', color: cardtype === 'Legendary' ? '#3e2723' : '#fff' }}>{primaryposition}</h3>
             <h2 style={{ margin: '15px 0 5px 0', fontSize: '1.8em', textAlign: 'center', color: cardtype === 'Legendary' ? '#3e2723' : '#fff' }}>{player.playername}</h2>
             <div style={{ marginTop: '20px', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8, color: cardtype === 'Legendary' ? '#3e2723' : '#aaa' }}>{cardtype} EDITION</div>

             {/* PROGRESSION BUTTON ADDED HERE */}
             <button 
                onClick={() => onTrain(data)}
                style={{ 
                    marginTop: '20px', 
                    padding: '12px 24px', 
                    background: cardtype === 'Legendary' ? '#3e2723' : '#7fb800', 
                    color: cardtype === 'Legendary' ? '#fff' : '#000', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}
              >
                ⚡ PLAYER PROGRESSION
             </button>
          </div>

          <div style={tableContainerStyle}>
             <h5 style={{ ...tableHeaderStyle, color: '#e0a800' }}>📈 Condition History</h5>
             {formHistory.length === 0 ? <div style={noDataStyle}>No history available.</div> : (
                <table style={tableStyle}>
                    <thead><tr><th style={thStyle}>FORM</th><th style={thStyle}>DATE</th><th style={{...thStyle, textAlign:'right'}}>STATUS</th></tr></thead>
                    <tbody>{formHistory.slice(0, 5).map(f => (
                        <tr key={f.formid} style={trStyle}>
                            <td style={{ padding: '8px 0', color: f.enddate ? '#aaa' : '#e0a800', fontWeight: '500' }}>{f.formname}</td>
                            <td style={{ padding: '8px 0', color: '#888' }}>{formatDate(f.startdate)}</td>
                            <td style={{ padding: '8px 0', textAlign:'right' }}>{f.enddate ? <span style={{color:'#666'}}>—</span> : <span style={activeBadgeStyle}>ACTIVE</span>}</td>
                        </tr>
                    ))}</tbody>
                </table>
             )}
          </div>

          <div style={tableContainerStyle}>
             <h5 style={{ ...tableHeaderStyle, color: '#ff4d4d' }}>🏥 Injury Record</h5>
             {injuryHistory.length === 0 ? <div style={noDataStyle}>Clean health record.</div> : (
                <table style={tableStyle}>
                    <thead><tr><th style={thStyle}>INJURY</th><th style={thStyle}>DATE</th><th style={{...thStyle, textAlign:'right'}}>STATUS</th></tr></thead>
                    <tbody>{injuryHistory.map(i => (
                        <tr key={i.injuryid} style={trStyle}>
                            <td style={{ padding: '8px 0', color: i.enddate ? '#aaa' : '#ffcccb', fontWeight: '500' }}>{i.injuryname}</td>
                            <td style={{ padding: '8px 0', color: '#888' }}>{formatDate(i.startdate)}</td>
                            <td style={{ padding: '8px 0', textAlign: 'right' }}>{i.enddate ? <span style={{color:'#666', fontSize:'0.9em'}}>Recovered</span> : <span style={injuredBadgeStyle}>INJURED</span>}</td>
                        </tr>
                    ))}</tbody>
                </table>
             )}
          </div>

          <div style={tableContainerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                <h5 style={{ margin: 0, color: '#4caf50', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing:'1px' }}>💰 Market Value</h5>
                <button onClick={refreshAllData} style={{ background: 'transparent', border: '1px solid #4caf50', color: '#4caf50', cursor: 'pointer', borderRadius: '4px', fontSize: '0.7em', padding: '2px 8px' }}>↻ Refresh</button>
            </div>
            {marketHistory.length === 0 ? <div style={noDataStyle}>No valuation data.</div> : (
                <table style={tableStyle}>
                    <thead><tr><th style={thStyle}>DATE</th><th style={{...thStyle, textAlign:'right'}}>VALUE ($)</th><th style={{...thStyle, textAlign:'right'}}>TREND</th></tr></thead>
                    <tbody>{marketHistory.slice(0, 5).map((m, index) => {
                        const next = marketHistory[index + 1];
                        const curr = parseFloat(m.basemarketvalue);
                        const prev = next ? parseFloat(next.basemarketvalue) : curr;
                        return (
                            <tr key={index} style={trStyle}>
                                <td style={{ padding: '8px 0', color: '#888' }}>{formatDate(m.startdate)}</td>
                                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: '#eee', fontSize:'1.0em' }}>${curr.toLocaleString()}</td>
                                <td style={{ padding: '8px 0', textAlign: 'right' }}>{index === marketHistory.length-1 ? <span style={{color:'#666', fontSize:'0.8em'}}>START</span> : curr > prev ? <span style={{color:'#4caf50'}}>▲</span> : curr < prev ? <span style={{color:'#ff4d4d'}}>▼</span> : <span style={{color:'#888'}}>-</span>}</td>
                            </tr>
                        );
                    })}</tbody>
                </table>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SWAPPABLE CONTENT */}
        <div>
           {!showReviews ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                   <div style={sectionStyle}><h4 style={headerStyle}>ATTACKING</h4><StatRow label="Off. Awareness" value={stats.offensiveawareness} /><StatRow label="Finishing" value={stats.finishing} /><StatRow label="Dribbling" value={stats.dribbling} /><StatRow label="Ball Control" value={stats.ballcontrol} /><StatRow label="Passing" value={stats.passing} /></div>
                   <div style={sectionStyle}><h4 style={headerStyle}>ATHLETICISM</h4><StatRow label="Speed" value={stats.speed} /><StatRow label="Acceleration" value={stats.acceleration} /><StatRow label="Kicking Power" value={stats.kickingpower} /><StatRow label="Stamina" value={stats.stamina} /><StatRow label="Balance" value={stats.balance} /></div>
                   <div style={sectionStyle}><h4 style={headerStyle}>DEFENDING</h4><StatRow label="Def. Awareness" value={stats.defensiveawareness} /><StatRow label="Tackling" value={stats.tackling} /><StatRow label="Aggression" value={stats.aggression} /><StatRow label="Physical Contact" value={stats.physicalcontact} /><StatRow label="Jump" value={stats.jump} /></div>
                   <div style={sectionStyle}><h4 style={headerStyle}>GOALKEEPER</h4><StatRow label="GK Awareness" value={stats.gkawareness} /><StatRow label="GK Reflexes" value={stats.gkreflexes} /><StatRow label="GK Reach" value={stats.gkreach} /></div>
                 </div>

                 {/*   SIMILAR PLAYERS SECTION  */}
                 <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, color: '#e0a800', letterSpacing: '1px' }}>🤝 SIMILAR PROFILES</h4>
                        <button 
                            onClick={handleFindSimilar}
                            disabled={loadingSimilar}
                            style={{ padding: '8px 16px', background: 'transparent', color: '#00c6ff', border: '1px solid #00c6ff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            {loadingSimilar ? 'Analyzing...' : '🔍 Find Matches'}
                        </button>
                    </div>

                    {similarPlayers.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
                            {similarPlayers.map(p => (
                                <div key={p.cardid} style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333', textAlign: 'center' }}>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#fff' }}>{p.playername}</h4>
                                    <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: getStatColor(p.baseoverallrating) }}>
                                        {p.baseoverallrating} OVR
                                    </div>
                                    <div style={{ fontSize: '0.8em', color: '#aaa', margin: '5px 0' }}>
                                        {p.cardtype} • {p.positioncode}
                                    </div>
                                    <div style={{ fontSize: '0.75em', color: '#888', background: '#111', padding: '4px', borderRadius: '4px', marginTop: '10px' }}>
                                        Variance: {Math.round(p.statdifference)} pts
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
                 {/*  ================================  */}

               </div>
           ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   
                   <div style={sectionStyle}>
                       <h4 style={{ ...headerStyle, color: '#007bff' }}>
                           {currentUser ? (isEditing ? `✏️ Update Your Review` : `✍️ Submit Review`) : '🔒 Login Required'}
                       </h4>
                       
                       {currentUser ? (
                           <form onSubmit={handleSubmitReview} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                               <div><label style={labelStyle}>Matches Played *</label><input type="number" style={inputStyle} value={reviewForm.matchesPlayed} onChange={e=>setReviewForm({...reviewForm, matchesPlayed: e.target.value})} required /></div>
                               <div><label style={labelStyle}>Matches Won</label><input type="number" style={inputStyle} value={reviewForm.matchesWon} onChange={e=>setReviewForm({...reviewForm, matchesWon: e.target.value})} /></div>
                               <div><label style={labelStyle}>Goals Scored</label><input type="number" style={inputStyle} value={reviewForm.goals} onChange={e=>setReviewForm({...reviewForm, goals: e.target.value})} /></div>
                               <div><label style={labelStyle}>Assists</label><input type="number" style={inputStyle} value={reviewForm.assists} onChange={e=>setReviewForm({...reviewForm, assists: e.target.value})} /></div>
                               <div><label style={labelStyle}>Clean Sheets</label><input type="number" style={inputStyle} value={reviewForm.cleanSheets} onChange={e=>setReviewForm({...reviewForm, cleanSheets: e.target.value})} /></div>
                               <div><label style={labelStyle}>Rating (0-10) *</label><input type="number" step="0.1" max="10" style={inputStyle} value={reviewForm.averageRating} onChange={e=>setReviewForm({...reviewForm, averageRating: e.target.value})} required /></div>
                               
                               <button type="submit" style={{ gridColumn: 'span 2', ...buttonStyle, background: '#007bff' }}>
                                   {isEditing ? 'Update Review' : 'Submit Review'}
                               </button>
                           </form>
                       ) : (
                           <div style={{color: '#aaa', fontStyle: 'italic', textAlign:'center', padding:'20px', border:'1px dashed #444', borderRadius:'8px'}}>
                               Please log in to submit a performance review for this card.
                           </div>
                       )}
                   </div>

                   <div style={tableContainerStyle}>
                       <h5 style={{ ...tableHeaderStyle, color: '#fff' }}>📝 Community Reviews ({reviews.length})</h5>
                       {reviews.length === 0 ? <div style={noDataStyle}>No reviews yet.</div> : (
                           <table style={tableStyle}>
                               <thead>
                                   <tr>
                                       <th style={thStyle}>USER</th>
                                       <th style={{...thStyle, textAlign:'center'}}>M</th>
                                       <th style={{...thStyle, textAlign:'center'}}>W</th>
                                       <th style={{...thStyle, textAlign:'center'}}>G</th>
                                       <th style={{...thStyle, textAlign:'center'}}>A</th>
                                       <th style={{...thStyle, textAlign:'center'}}>CS</th>
                                       <th style={{...thStyle, textAlign:'right'}}>RATING</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   {reviews.map((r, idx) => {
                                       const reviewUserId = r.userid || r.UserID;
                                       const isMine = currentUserId && reviewUserId === currentUserId;
                                       
                                       return (
                                           <tr key={idx} style={{...trStyle, background: isMine ? 'rgba(0, 123, 255, 0.1)' : 'transparent'}}>
                                               <td style={{padding:'8px 0', color: isMine ? '#007bff' : '#aaa', fontWeight: isMine ? 'bold' : 'normal'}}>
                                                   {r.username || r.Username || `User #${reviewUserId}`} {isMine ? '(You)' : ''}
                                               </td>
                                               <td style={{padding:'8px 0', textAlign:'center', fontWeight:'bold'}}>{r.matchesplayed || r.MatchesPlayed}</td>
                                               <td style={{padding:'8px 0', textAlign:'center'}}>{r.matcheswon || r.MatchesWon}</td>
                                               <td style={{padding:'8px 0', textAlign:'center', color:'#4caf50'}}>{r.goals || r.Goals}</td>
                                               <td style={{padding:'8px 0', textAlign:'center', color:'#2196f3'}}>{r.assists || r.Assists}</td>
                                               <td style={{padding:'8px 0', textAlign:'center'}}>{r.cleansheets || r.CleanSheets}</td>
                                               <td style={{padding:'8px 0', textAlign:'right', fontWeight:'bold', color: parseFloat(r.averagerating || r.AverageRating) >= 8 ? '#00ff00' : 'white'}}>
                                                   {r.averagerating || r.AverageRating}
                                               </td>
                                           </tr>
                                       );
                                   })}
                               </tbody>
                           </table>
                       )}
                   </div>
               </div>
           )}
        </div>
      </div>

  
      {compareMode && !compareCardId && (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: '#1a1a1a',
                padding: '30px',
                borderRadius: '10px',
                width: '95%',          
                maxWidth: '1200px',    
                maxHeight: '90vh',
                overflowY: 'auto',
                border: '1px solid #444'
            }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                    <div>
                        <h2 style={{margin:0, color:'#e0a800'}}>Select Player to Compare</h2>
                        <p style={{color: '#888', margin: '5px 0 0 0'}}>Use the filters below to find an opponent.</p>
                    </div>
                    <button 
                        onClick={() => setCompareMode(false)}
                        style={{
                            background: '#ff4d4d',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1em'
                        }}
                    >
                        CANCEL
                    </button>
                </div>
                
                <hr style={{ borderColor: '#333', marginBottom: '20px' }} />

               
                <SmartSearch onCardClick={handleCompareSelect} />

            </div>
        </div>
      )}
    </div>
  );
}

// Styles
const sectionStyle = { background: '#1a1a1a', padding: '15px', borderRadius: '8px' };
const headerStyle = { borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '12px', color: '#aaa', fontSize: '0.85em', letterSpacing: '1px', fontWeight:'600' };
const tableContainerStyle = { background: '#151515', padding: '15px', borderRadius: '8px', border: '1px solid #333' };
const tableHeaderStyle = { margin: '0 0 12px 0', borderBottom: '1px solid #333', paddingBottom: '8px', fontSize: '0.9em', textTransform: 'uppercase', letterSpacing:'1px' };
const tableStyle = { width: '100%', fontSize: '0.8em', borderCollapse: 'collapse' };
const thStyle = { color: '#666', textAlign: 'left', paddingBottom:'8px', fontWeight:'normal', fontSize:'0.85em' };
const trStyle = { borderTop: '1px solid #2a2a2a' };
const noDataStyle = { fontSize: '0.8em', color: '#666', fontStyle:'italic', padding:'10px 0' };
const activeBadgeStyle = { color: '#4dff4d', background: 'rgba(77, 255, 77, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight:'600', fontSize:'0.85em' };
const injuredBadgeStyle = { color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight:'600', fontSize:'0.85em' };
const inputStyle = { width: '100%', padding: '8px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '4px', marginBottom: '5px' };
const buttonStyle = { width: '100%', padding: '10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const labelStyle = { display: 'block', marginBottom: '4px', fontSize: '0.75em', color: '#aaa', textTransform: 'uppercase' };