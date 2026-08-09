// Complete Official eFootball 2026 Player Boosters System & Categories

export const BOOSTER_CATEGORIES = {
    POTW: { name: 'POTW (Form Based)', color: '#22c55e', maxBoost: 3 },
    STANDARD: { name: 'Standard (Always Active)', color: '#38bdf8', maxBoost: 2 },
    TOTAL_PACKAGE: { name: 'Total Package (Full Team)', color: '#eab308', maxBoost: 3 },
    SPECIAL: { name: 'Special / Named (Big Time)', color: '#a855f7', maxBoost: 4 }
};

export const EFOOTBALL_BOOSTERS = [
    {
        name: 'Accuracy',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Midfielder, Forward',
        primaryPositions: ['AMF', 'CMF', 'CF', 'SS'],
        stats: ['kickingpower', 'finishing', 'lowpass', 'loftedpass'],
        description: 'Standard Booster: Kicking Power, Finishing, Low Pass, Lofted Pass'
    },
    {
        name: 'Aerial',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Defender, Midfielder, Forward',
        primaryPositions: ['CB', 'DMF', 'CF', 'CMF'],
        stats: ['finishing', 'physicalcontact', 'jump', 'heading'],
        description: 'Standard Booster: Finishing, Physical Contact, Jump, Heading'
    },
    {
        name: 'Aerial Block',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Defender',
        primaryPositions: ['CB', 'DMF'],
        stats: ['defensiveawareness', 'physicalcontact', 'heading', 'jump'],
        description: 'Standard Booster: Defensive Awareness, Physical Contact, Heading, Jump'
    },
    {
        name: 'Agility',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Midfielder, Forward',
        primaryPositions: ['AMF', 'CF', 'LWF', 'RWF'],
        stats: ['speed', 'stamina', 'balance', 'acceleration'],
        description: 'Standard Booster: Speed, Stamina, Balance, Acceleration'
    },
    {
        name: 'Balancer',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Midfielder',
        primaryPositions: ['CMF', 'DMF'],
        stats: ['defensiveawareness', 'stamina', 'acceleration', 'offensiveawareness'],
        description: 'Standard Booster: Defensive Awareness, Stamina, Acceleration, Offensive Awareness'
    },
    {
        name: 'Ball Protection',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Midfielder, Forward',
        primaryPositions: ['CMF', 'AMF', 'CF'],
        stats: ['balance', 'tightpossession', 'physicalcontact', 'ballcontrol'],
        description: 'Standard Booster: Balance, Tight Possession, Physical Contact, Ball Control'
    },
    {
        name: 'Ball-carrying',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Midfielder, Forward',
        primaryPositions: ['AMF', 'CMF', 'LWF', 'RWF'],
        stats: ['tightpossession', 'speed', 'balance', 'dribbling'],
        description: 'Standard Booster: Tight Possession, Speed, Balance, Dribbling'
    },
    {
        name: 'Breakthrough',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Forward',
        primaryPositions: ['CF', 'SS', 'LWF', 'RWF'],
        stats: ['kickingpower', 'physicalcontact', 'dribbling', 'speed'],
        description: 'Standard Booster: Kicking Power, Physical Contact, Dribbling, Speed'
    },
    {
        name: 'Counter',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Midfielder, Defender',
        primaryPositions: ['DMF', 'CMF'],
        stats: ['lowpass', 'defensiveengagement', 'tackling', 'physicalcontact'],
        description: 'Standard Booster: Low Pass, Defensive Engagement, Tackling, Physical Contact'
    },
    {
        name: 'Crossing',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Midfielder, Defender',
        primaryPositions: ['LWF', 'RWF', 'LB', 'RB', 'LMF', 'RMF'],
        stats: ['loftedpass', 'curl', 'stamina', 'speed'],
        description: 'Standard Booster: Lofted Pass, Curl, Stamina, Speed'
    },
    {
        name: 'Defending',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Defender, Midfielder',
        primaryPositions: ['CB', 'DMF', 'LB', 'RB'],
        stats: ['jump', 'acceleration', 'tackling', 'defensiveawareness'],
        description: 'Standard Booster: Jump, Acceleration, Tackling, Defensive Awareness'
    },
    {
        name: 'Duelling',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Defender',
        primaryPositions: ['CB', 'DMF'],
        stats: ['speed', 'stamina', 'tackling', 'defensiveawareness'],
        description: 'Standard Booster: Speed, Stamina, Tackling, Defensive Awareness'
    },
    {
        name: 'Fantasista',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Forward, Midfielder',
        primaryPositions: ['LWF', 'RWF', 'CF', 'SS', 'AMF'],
        stats: ['finishing', 'ballcontrol', 'dribbling', 'balance'],
        description: 'Standard Booster: Finishing, Ball Control, Dribbling, Balance'
    },
    {
        name: 'Free-kick Taking',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Midfielder, Forward',
        primaryPositions: ['AMF', 'CMF', 'SS', 'CF'],
        stats: ['finishing', 'curl', 'placekicking', 'kickingpower'],
        description: 'Standard Booster: Finishing, Curl, Place Kicking, Kicking Power'
    },
    {
        name: 'Goalkeeping',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Goalkeeper',
        primaryPositions: ['GK'],
        stats: ['gkparrying', 'gkcatching', 'gkawareness', 'gkreflexes'],
        description: 'Standard Booster: GK Parrying, GK Catching, GK Awareness, GK Reflexes'
    },
    {
        name: 'Hard Worker',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Midfielder, Defender',
        primaryPositions: ['CMF', 'DMF', 'LB', 'RB'],
        stats: ['stamina', 'aggression', 'physicalcontact', 'acceleration'],
        description: 'Standard Booster: Stamina, Aggression, Physical Contact, Acceleration'
    },
    {
        name: 'Off the Ball',
        category: 'POTW',
        color: '#22c55e',
        useCase: 'Forward',
        primaryPositions: ['CF', 'SS', 'LWF', 'RWF'],
        stats: ['offensiveawareness', 'acceleration', 'stamina', 'speed'],
        description: 'POTW Booster: Offensive Awareness, Acceleration, Stamina, Speed'
    },
    {
        name: 'Offence Creator',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Midfielder, Forward',
        primaryPositions: ['AMF', 'CMF', 'SS'],
        stats: ['kickingpower', 'offensiveawareness', 'ballcontrol', 'lowpass'],
        description: 'Standard Booster: Kicking Power, Offensive Awareness, Ball Control, Low Pass'
    },
    {
        name: 'Passing',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Midfielder, Forward',
        primaryPositions: ['AMF', 'CMF', 'LWF', 'RWF', 'SS'],
        stats: ['lowpass', 'loftedpass', 'curl', 'kickingpower'],
        description: 'Standard Booster: Low Pass, Lofted Pass, Curl, Kicking Power'
    },
    {
        name: 'Physicality',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Defender',
        primaryPositions: ['CB', 'LB', 'RB', 'DMF'],
        stats: ['physicalcontact', 'balance', 'stamina', 'jump'],
        description: 'Standard Booster: Physical Contact, Balance, Stamina, Jump'
    },
    {
        name: 'Rebuilding',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Defender, Midfielder',
        primaryPositions: ['DMF', 'CMF', 'CB'],
        stats: ['defensiveawareness', 'lowpass', 'defensiveengagement', 'aggression'],
        description: 'Standard Booster: Defensive Awareness, Low Pass, Defensive Engagement, Aggression'
    },
    {
        name: 'Regista',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Midfielder',
        primaryPositions: ['DMF', 'CMF'],
        stats: ['lowpass', 'tightpossession', 'tackling', 'defensiveawareness'],
        description: 'Standard Booster: Low Pass, Tight Possession, Tackling, Defensive Awareness'
    },
    {
        name: 'Saving',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Goalkeeper',
        primaryPositions: ['GK'],
        stats: ['gkreflexes', 'gkparrying', 'gkawareness', 'gkreach'],
        description: 'Standard Booster: GK Reflexes, GK Parrying, GK Awareness, GK Reach'
    },
    {
        name: 'Shooting',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Forward',
        primaryPositions: ['CF', 'SS', 'AMF'],
        stats: ['finishing', 'physicalcontact', 'ballcontrol', 'kickingpower'],
        description: 'Standard Booster: Finishing, Physical Contact, Ball Control, Kicking Power'
    },
    {
        name: 'Shutdown',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Defender',
        primaryPositions: ['CB', 'LB', 'RB', 'DMF'],
        stats: ['tackling', 'speed', 'defensiveawareness', 'defensiveengagement'],
        description: 'Standard Booster: Tackling, Speed, Defensive Awareness, Defensive Engagement'
    },
    {
        name: 'Stealing',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Midfielder, Defender',
        primaryPositions: ['DMF', 'CMF'],
        stats: ['tackling', 'aggression', 'physicalcontact', 'acceleration'],
        description: 'Standard Booster: Tackling, Aggression, Physical Contact, Acceleration'
    },
    {
        name: 'Strength',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Forward, Defender',
        primaryPositions: ['CF', 'CB', 'SS'],
        stats: ['kickingpower', 'jump', 'physicalcontact', 'speed'],
        description: 'Standard Booster: Kicking Power, Jump, Physical Contact, Speed'
    },
    {
        name: 'Striker’s Instinct',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Forward',
        primaryPositions: ['CF', 'SS', 'AMF'],
        stats: ['offensiveawareness', 'ballcontrol', 'acceleration', 'finishing'],
        description: 'Standard Booster: Offensive Awareness, Ball Control, Acceleration, Finishing'
    },
    {
        name: 'Technique',
        category: 'STANDARD',
        color: '#38bdf8',
        useCase: 'Midfielder, Forward',
        primaryPositions: ['LWF', 'RWF', 'AMF', 'SS', 'CMF', 'CF'],
        stats: ['lowpass', 'tightpossession', 'dribbling', 'ballcontrol'],
        description: 'Standard Booster: Low Pass, Tight Possession, Dribbling, Ball Control'
    },

    // Total Package Boosters (Yellow/Brown #eab308)
    {
        name: 'Total Package',
        category: 'TOTAL_PACKAGE',
        color: '#eab308',
        useCase: 'Full Team League Booster',
        primaryPositions: ['AMF', 'CMF', 'CF', 'CB'],
        stats: ['offensiveawareness', 'ballcontrol', 'speed', 'stamina'],
        description: 'Total Package: Boosts stats up to +3 depending on full league squad'
    },

    // Special / Named Boosters (Purple #a855f7 - Reserved for Big Time / Epic)
    {
        name: 'Son of God',
        category: 'SPECIAL',
        color: '#a855f7',
        useCase: 'Big Time Messi / Legend',
        primaryPositions: ['CF', 'SS', 'AMF'],
        stats: ['finishing', 'offensiveawareness', 'kickingpower', 'dribbling'],
        description: 'Special Booster +4: Finishing, Offensive Awareness, Kicking Power, Dribbling'
    },
    {
        name: 'King of Football',
        category: 'SPECIAL',
        color: '#a855f7',
        useCase: 'Big Time Pele / Legend',
        primaryPositions: ['AMF', 'SS', 'CF'],
        stats: ['ballcontrol', 'dribbling', 'tightpossession', 'lowpass'],
        description: 'Special Booster +4: Ball Control, Dribbling, Tight Possession, Low Pass'
    },
    {
        name: 'Bearer of Fate',
        category: 'SPECIAL',
        color: '#a855f7',
        useCase: 'Big Time Neymar / Legend',
        primaryPositions: ['CF', 'CB', 'CMF'],
        stats: ['speed', 'acceleration', 'physicalcontact', 'stamina'],
        description: 'Special Booster +4: Speed, Acceleration, Physical Contact, Stamina'
    },
    {
        name: 'Natural Born',
        category: 'SPECIAL',
        color: '#a855f7',
        useCase: 'Big Time Suarez / Legend',
        primaryPositions: ['CF', 'SS'],
        stats: ['offensiveawareness', 'finishing', 'kickingpower', 'physicalcontact'],
        description: 'Special Booster +4: Offensive Awareness, Finishing, Kicking Power, Physical Contact'
    },
    {
        name: 'Magical',
        category: 'SPECIAL',
        color: '#a855f7',
        useCase: 'Big Time Ronaldinho / Legend',
        primaryPositions: ['LWF', 'AMF', 'SS'],
        stats: ['dribbling', 'ballcontrol', 'tightpossession', 'balance'],
        description: 'Special Booster +4: Dribbling, Ball Control, Tight Possession, Balance'
    }
];

export const getBoosterByName = (name) => {
    if (!name) return null;
    const cleanName = name.toLowerCase().replace(/\+\d+/, '').trim();
    return EFOOTBALL_BOOSTERS.find(b => b.name.toLowerCase() === cleanName) || null;
};

export const getBoosterCategoryColor = (name, isBooster2 = false) => {
    if (!name || name.toLowerCase() === 'none') return '#334155';
    const b = getBoosterByName(name);
    if (b) {
        if (b.category === 'STANDARD' && isBooster2) {
            return '#f97316'; // Orange for Booster 2 (matches eFootball / Image 1)
        }
        return b.color;
    }
    
    const clean = name.toLowerCase();
    if (clean.includes('son of god') || clean.includes('king of') || clean.includes('bearer') || clean.includes('natural born') || clean.includes('magical')) {
        return '#a855f7'; // Purple
    }
    if (clean.includes('potw')) {
        return '#22c55e'; // Green
    }
    if (clean.includes('total package') || clean.includes('league')) {
        return '#eab308'; // Yellow/Brown
    }
    return isBooster2 ? '#f97316' : '#38bdf8';
};
