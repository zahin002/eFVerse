// Official eFootball Reverse-Engineered Progression & Auto-Allocation Engine

// 1. Non-linear Growth Increment Function
export const getStatIncrement = (currentValue) => {
    if (currentValue < 80) return 2.0;
    if (currentValue < 90) return 1.5;
    return 1.0;
};

// 2. Point Level Cost Function
export const getLevelCost = (level) => {
    if (level <= 4) return 1;
    if (level <= 8) return 2;
    if (level <= 12) return 3;
    return 4;
};

// 3. Stat Group Category Definitions & Stat Multipliers
export const STAT_GROUPS = {
    shooting: {
        name: 'Shooting',
        effects: [
            { stat: 'finishing', weight: 1.0 },
            { stat: 'placekicking', weight: 1.0 },
            { stat: 'curl', weight: 1.0 }
        ]
    },
    passing: {
        name: 'Passing',
        effects: [
            { stat: 'lowpass', weight: 1.0 },
            { stat: 'loftedpass', weight: 1.0 }
        ]
    },
    dribbling: {
        name: 'Dribbling',
        effects: [
            { stat: 'ballcontrol', weight: 1.0 },
            { stat: 'dribbling', weight: 1.0 },
            { stat: 'tightpossession', weight: 1.0 }
        ]
    },
    dexterity: {
        name: 'Dexterity',
        effects: [
            { stat: 'offensiveawareness', weight: 1.0 },
            { stat: 'acceleration', weight: 1.0 },
            { stat: 'balance', weight: 1.0 }
        ]
    },
    lowerBody: {
        name: 'Lower Body Strength',
        effects: [
            { stat: 'speed', weight: 1.0 },
            { stat: 'kickingpower', weight: 1.0 },
            { stat: 'stamina', weight: 1.0 }
        ]
    },
    aerial: {
        name: 'Aerial Strength',
        effects: [
            { stat: 'heading', weight: 1.0 },
            { stat: 'jump', weight: 1.0 },
            { stat: 'physicalcontact', weight: 1.0 }
        ]
    },
    defending: {
        name: 'Defending',
        effects: [
            { stat: 'defensiveawareness', weight: 1.0 },
            { stat: 'defensiveengagement', weight: 1.0 },
            { stat: 'tackling', weight: 1.0 },
            { stat: 'aggression', weight: 1.0 }
        ]
    },
    gk1: {
        name: 'GK 1',
        effects: [
            { stat: 'gkawareness', weight: 1.0 },
            { stat: 'jump', weight: 1.0 }
        ]
    },
    gk2: {
        name: 'GK 2',
        effects: [
            { stat: 'gkparrying', weight: 1.0 },
            { stat: 'gkreach', weight: 1.0 }
        ]
    },
    gk3: {
        name: 'GK 3',
        effects: [
            { stat: 'gkcatching', weight: 1.0 },
            { stat: 'gkreflexes', weight: 1.0 }
        ]
    }
};

// 4. Position Weight Matrix (W_pos_i)
export const POSITION_WEIGHTS = {
    CF: {
        offensiveawareness: 1.0, finishing: 1.0, speed: 0.8, acceleration: 0.8,
        dribbling: 0.7, ballcontrol: 0.7, physicalcontact: 0.6, kickingpower: 0.7,
        heading: 0.5, jump: 0.5, lowpass: 0.4, defensiveawareness: 0.1
    },
    SS: {
        offensiveawareness: 0.9, finishing: 0.9, dribbling: 0.9, ballcontrol: 0.9,
        tightpossession: 0.9, acceleration: 0.8, speed: 0.7, lowpass: 0.7, kickingpower: 0.6
    },
    LWF: {
        dribbling: 1.0, speed: 1.0, acceleration: 1.0, tightpossession: 0.9,
        ballcontrol: 0.8, finishing: 0.7, lowpass: 0.7, loftedpass: 0.6
    },
    RWF: {
        dribbling: 1.0, speed: 1.0, acceleration: 1.0, tightpossession: 0.9,
        ballcontrol: 0.8, finishing: 0.7, lowpass: 0.7, loftedpass: 0.6
    },
    AMF: {
        dribbling: 1.0, lowpass: 1.0, ballcontrol: 1.0, tightpossession: 0.9,
        offensiveawareness: 0.8, acceleration: 0.8, loftedpass: 0.8, finishing: 0.6, speed: 0.6
    },
    CMF: {
        lowpass: 1.0, ballcontrol: 0.9, stamina: 0.9, loftedpass: 0.8,
        defensiveawareness: 0.6, tackling: 0.6, speed: 0.6, acceleration: 0.6, physicalcontact: 0.5
    },
    DMF: {
        defensiveawareness: 1.0, tackling: 1.0, physicalcontact: 0.9, stamina: 0.8,
        lowpass: 0.7, defensiveengagement: 0.8, aggression: 0.7, speed: 0.5
    },
    LMF: {
        speed: 0.9, acceleration: 0.9, dribbling: 0.9, lowpass: 0.8,
        loftedpass: 0.8, stamina: 0.8, ballcontrol: 0.8
    },
    RMF: {
        speed: 0.9, acceleration: 0.9, dribbling: 0.9, lowpass: 0.8,
        loftedpass: 0.8, stamina: 0.8, ballcontrol: 0.8
    },
    CB: {
        defensiveawareness: 1.0, tackling: 1.0, physicalcontact: 0.9, heading: 0.8,
        jump: 0.8, defensiveengagement: 0.9, aggression: 0.8, speed: 0.5
    },
    LB: {
        speed: 0.9, acceleration: 0.9, tackling: 0.8, defensiveawareness: 0.8,
        stamina: 0.8, loftedpass: 0.7, lowpass: 0.6
    },
    RB: {
        speed: 0.9, acceleration: 0.9, tackling: 0.8, defensiveawareness: 0.8,
        stamina: 0.8, loftedpass: 0.7, lowpass: 0.6
    },
    GK: {
        gkreflexes: 1.0, gkreach: 1.0, gkparrying: 0.9, gkcatching: 0.9,
        gkawareness: 0.9, jump: 0.6
    }
};

export const DEFAULT_BASE_STATS = {
    offensiveawareness: 60,
    ballcontrol: 60,
    dribbling: 60,
    tightpossession: 60,
    lowpass: 60,
    loftedpass: 55,
    finishing: 60,
    heading: 65,
    placekicking: 68,
    curl: 72,
    defensiveawareness: 40,
    defensiveengagement: 50,
    tackling: 40,
    aggression: 40,
    gkawareness: 40,
    gkcatching: 40,
    gkparrying: 40,
    gkreflexes: 40,
    gkreach: 40,
    speed: 60,
    acceleration: 60,
    kickingpower: 60,
    jump: 60,
    physicalcontact: 60,
    balance: 60,
    stamina: 60
};

// 5. Calculate Stats given Base Stats + Group Level Allocations
export const calculateAllocatedStats = (baseStats = {}, allocations = {}) => {
    const calculated = { ...DEFAULT_BASE_STATS, ...(baseStats || {}) };

    Object.keys(DEFAULT_BASE_STATS).forEach(key => {
        const raw = calculated[key];
        if (raw === undefined || raw === null || isNaN(raw)) {
            calculated[key] = DEFAULT_BASE_STATS[key];
        } else {
            calculated[key] = typeof raw === 'number' ? raw : (parseInt(raw, 10) || DEFAULT_BASE_STATS[key]);
        }
    });

    Object.keys(allocations || {}).forEach(groupKey => {
        const levels = allocations[groupKey] || 0;
        const groupObj = STAT_GROUPS[groupKey];
        if (!groupObj || levels <= 0) return;

        groupObj.effects.forEach(({ stat, weight = 1.0 }) => {
            const currentVal = calculated[stat] !== undefined ? calculated[stat] : (DEFAULT_BASE_STATS[stat] || 60);
            calculated[stat] = currentVal + Math.round(levels * weight);
        });
    });

    return calculated;
};

// 6. Compute OVR via Position-Aware Attribute Weighting Matrix
export const calculatePositionOVR = (trainedStats = {}, position = 'AMF', arg3 = null, arg4 = null) => {
    let bStats = null;
    let bOvr = null;

    if (typeof arg3 === 'object' && arg3 !== null) {
        bStats = arg3;
        bOvr = typeof arg4 === 'number' ? arg4 : (parseInt(arg4, 10) || null);
    } else if (typeof arg3 === 'number' || (typeof arg3 === 'string' && !isNaN(parseInt(arg3, 10)))) {
        bOvr = parseInt(arg3, 10);
    }

    const posStr = Array.isArray(position) ? position[0] : (typeof position === 'string' ? position : 'AMF');
    const posUpper = (posStr || 'AMF').toUpperCase().trim();
    const weights = POSITION_WEIGHTS[posUpper] || POSITION_WEIGHTS['AMF'];

    const tStats = { ...DEFAULT_BASE_STATS, ...(trainedStats || {}) };

    let sumTrained = 0;
    let sumWeights = 0;

    Object.keys(weights).forEach(statKey => {
        const w = weights[statKey] || 0.1;
        const val = typeof tStats[statKey] === 'number' ? tStats[statKey] : (parseInt(tStats[statKey], 10) || 60);
        sumTrained += val * w;
        sumWeights += w;
    });

    const scoreTrained = sumWeights > 0 ? (sumTrained / sumWeights) : 60;

    if (bStats && typeof bStats === 'object') {
        const defaultBStats = { ...DEFAULT_BASE_STATS, ...(bStats || {}) };
        let sumBase = 0;
        Object.keys(weights).forEach(statKey => {
            const w = weights[statKey] || 0.1;
            const val = typeof defaultBStats[statKey] === 'number' ? defaultBStats[statKey] : (parseInt(defaultBStats[statKey], 10) || 60);
            sumBase += val * w;
        });
        const scoreBase = sumWeights > 0 ? (sumBase / sumWeights) : 60;
        const delta = scoreTrained - scoreBase;

        if (bOvr !== null && bOvr > 0) {
            return Math.max(bOvr, bOvr + Math.round(delta));
        }
        return Math.round(scoreTrained);
    }

    if (bOvr !== null && bOvr > 0) {
        let sumDefaultBase = 0;
        Object.keys(weights).forEach(statKey => {
            const w = weights[statKey] || 0.1;
            const val = DEFAULT_BASE_STATS[statKey] || 60;
            sumDefaultBase += val * w;
        });
        const scoreDefaultBase = sumWeights > 0 ? (sumDefaultBase / sumWeights) : 60;
        const delta = scoreTrained - scoreDefaultBase;
        return Math.max(bOvr, bOvr + Math.round(delta));
    }

    return Math.round(scoreTrained);
};

// 7. Calculate Final Live OVR with Manager and Booster bonuses (capped at 105)
export const calculateFinalLiveOVR = ({
    calculatedOvr = 80,
    managerEffects = [],
    booster1 = 'none',
    booster2 = 'none',
    isTrendingCard = false
}) => {
    let managerOvrBonus = 0;
    if (managerEffects && Array.isArray(managerEffects) && managerEffects.length > 0) {
        const totalBoost = managerEffects.reduce((sum, eff) => sum + (parseInt(eff.boost || eff.boostvalue || eff.value, 10) || 0), 0);
        managerOvrBonus = Math.round(totalBoost * 0.5) || (totalBoost > 0 ? 2 : 0);
    }

    let boosterOvrBonus = 0;
    if (!isTrendingCard) {
        if (booster1 && booster1.toString().toLowerCase() !== 'none') boosterOvrBonus += 3;
        if (booster2 && booster2.toString().toLowerCase() !== 'none') boosterOvrBonus += 2;
    }

    const finalLiveOvr = Math.min(105, calculatedOvr + managerOvrBonus + boosterOvrBonus);
    return finalLiveOvr;
};

export const POSITION_TARGET_PROFILES = {
    AMF: { shooting: 4, passing: 8, dribbling: 12, dexterity: 8, lowerBody: 7 },
    CMF: { passing: 10, dribbling: 8, dexterity: 6, lowerBody: 8, defending: 6 },
    DMF: { passing: 6, dribbling: 4, dexterity: 4, lowerBody: 8, aerial: 4, defending: 10 },
    CF:  { shooting: 12, dribbling: 8, dexterity: 8, lowerBody: 8, aerial: 4 },
    SS:  { shooting: 8, passing: 6, dribbling: 10, dexterity: 8, lowerBody: 6 },
    LWF: { shooting: 8, passing: 4, dribbling: 10, dexterity: 8, lowerBody: 8 },
    RWF: { shooting: 8, passing: 4, dribbling: 10, dexterity: 8, lowerBody: 8 },
    LMF: { passing: 8, dribbling: 8, dexterity: 8, lowerBody: 8, defending: 4 },
    RMF: { passing: 8, dribbling: 8, dexterity: 8, lowerBody: 8, defending: 4 },
    CB:  { lowerBody: 4, aerial: 8, defending: 12 },
    LB:  { passing: 4, dribbling: 4, dexterity: 8, lowerBody: 8, defending: 8 },
    RB:  { passing: 4, dribbling: 4, dexterity: 8, lowerBody: 8, defending: 8 },
    GK:  { gk1: 8, gk2: 8, gk3: 8 }
};

// 7. MAX OPTIMAL ALLOCATION SOLVER FOR POSITION
export const autoAllocatePoints = (baseStats = {}, position = 'AMF', totalPoints = 62) => {
    const posStr = Array.isArray(position) ? position[0] : (typeof position === 'string' ? position : 'AMF');
    const posUpper = (posStr || 'AMF').toUpperCase().trim();
    const targetProfile = POSITION_TARGET_PROFILES[posUpper] || POSITION_TARGET_PROFILES['AMF'];

    const allocations = {
        shooting: 0,
        passing: 0,
        dribbling: 0,
        dexterity: 0,
        lowerBody: 0,
        aerial: 0,
        defending: 0,
        gk1: 0,
        gk2: 0,
        gk3: 0
    };

    let pointsRemaining = totalPoints;

    // Step 1: Assign levels according to position profile template
    Object.keys(targetProfile).forEach(groupKey => {
        const targetLvl = targetProfile[groupKey] || 0;
        for (let lvl = 1; lvl <= targetLvl; lvl++) {
            const cost = getLevelCost(lvl);
            if (pointsRemaining >= cost) {
                allocations[groupKey] += 1;
                pointsRemaining -= cost;
            }
        }
    });

    // Step 2: Distribute any remaining points to highest priority groups for position
    const groupPriority = (posUpper === 'GK')
        ? ['gk1', 'gk2', 'gk3', 'passing', 'lowerBody']
        : ['dribbling', 'dexterity', 'passing', 'lowerBody', 'shooting', 'defending', 'aerial'];

    let canAllocate = true;
    while (canAllocate && pointsRemaining > 0) {
        canAllocate = false;
        for (const key of groupPriority) {
            const currentLvl = allocations[key] || 0;
            if (currentLvl < 16) {
                const cost = getLevelCost(currentLvl + 1);
                if (pointsRemaining >= cost) {
                    allocations[key] += 1;
                    pointsRemaining -= cost;
                    canAllocate = true;
                    break;
                }
            }
        }
    }

    return allocations;
};

// 8. Position Affinity Maps & Konami Out-Of-Position Rating Engine
export const POSITION_PRIMARY_MAP = {
    'AMF': ['AMF', 'CMF'],
    'CMF': ['CMF', 'AMF', 'DMF'],
    'CF':  ['CF', 'SS'],
    'SS':  ['SS', 'CF', 'AMF'],
    'LWF': ['LWF', 'RWF', 'SS'],
    'RWF': ['RWF', 'LWF', 'SS'],
    'LMF': ['LMF', 'RMF', 'AMF'],
    'RMF': ['RMF', 'LMF', 'AMF'],
    'DMF': ['DMF', 'CMF'],
    'CB':  ['CB'],
    'LB':  ['LB', 'RB'],
    'RB':  ['RB', 'LB'],
    'GK':  ['GK']
};

export const POSITION_FULL_AFFINITY_MAP = {
    'AMF': ['LMF', 'RMF', 'SS'],
    'CMF': ['LMF', 'RMF', 'LB', 'RB'],
    'CF':  ['LWF', 'RWF'],
    'SS':  ['LWF', 'RWF'],
    'LWF': ['CF', 'LMF'],
    'RWF': ['CF', 'RMF'],
    'LMF': ['LWF', 'CMF', 'LB'],
    'RMF': ['RWF', 'CMF', 'RB'],
    'DMF': ['CB', 'LB', 'RB'],
    'CB':  ['LB', 'RB', 'DMF'],
    'LB':  ['LMF', 'CB'],
    'RB':  ['RMF', 'CB'],
    'GK':  []
};

export const POSITION_PARTIAL_AFFINITY_MAP = {
    'AMF': ['CF', 'LWF', 'RWF', 'DMF'],
    'CMF': ['CF', 'CB'],
    'CF':  ['AMF', 'LMF', 'RMF'],
    'SS':  ['CMF'],
    'LWF': ['AMF', 'CMF'],
    'RWF': ['AMF', 'CMF'],
    'LMF': ['CF', 'DMF'],
    'RMF': ['CF', 'DMF'],
    'DMF': ['AMF'],
    'CB':  ['GK'],
    'LB':  ['CMF'],
    'RB':  ['CMF'],
    'GK':  []
};

export const getAffinityTier = (primaryPosition = 'AMF', targetPosition = 'AMF', customPrimary = [], customSecondary = []) => {
    const cardPos = (primaryPosition || 'AMF').toUpperCase().trim();
    const tPos = (targetPosition || 'AMF').toUpperCase().trim();

    if (customPrimary && Array.isArray(customPrimary) && customPrimary.length > 0) {
        if (customPrimary.map(p => p.toUpperCase().trim()).includes(tPos)) return 'PRIMARY';
    } else if (POSITION_PRIMARY_MAP[cardPos]?.includes(tPos)) {
        return 'PRIMARY';
    }

    if (customSecondary && Array.isArray(customSecondary) && customSecondary.length > 0) {
        if (customSecondary.map(p => p.toUpperCase().trim()).includes(tPos)) return 'FULL';
    } else if (POSITION_FULL_AFFINITY_MAP[cardPos]?.includes(tPos)) {
        return 'FULL';
    }

    if (POSITION_PARTIAL_AFFINITY_MAP[cardPos]?.includes(tPos)) return 'PARTIAL';
    return 'NONE';
};

export const calculateEffectivePositionOVR = ({
    trainedStats = {},
    primaryPosition = 'AMF',
    targetPosition = 'AMF',
    baseOvr = 80,
    customPrimaryPositions = [],
    customSecondaryPositions = []
}) => {
    const cardPos = (primaryPosition || 'AMF').toUpperCase().trim();
    const targetPos = (targetPosition || 'AMF').toUpperCase().trim();

    if (cardPos === targetPos) {
        return calculatePositionOVR(trainedStats, targetPos, trainedStats, baseOvr);
    }

    const affinity = getAffinityTier(cardPos, targetPos, customPrimaryPositions, customSecondaryPositions);

    let affinityMultiplier = 1.0;
    if (affinity === 'PRIMARY') {
        affinityMultiplier = 1.0;
    } else if (affinity === 'FULL') {
        affinityMultiplier = 0.95;
    } else if (affinity === 'PARTIAL') {
        affinityMultiplier = 0.85;
    } else {
        if (targetPos === 'GK' && cardPos !== 'GK') {
            affinityMultiplier = 0.20;
        } else if (cardPos === 'GK' && targetPos !== 'GK') {
            affinityMultiplier = 0.40;
        } else {
            affinityMultiplier = 0.65;
        }
    }

    const penalizedStats = {};
    Object.keys(DEFAULT_BASE_STATS).forEach(statKey => {
        const val = typeof trainedStats[statKey] === 'number' ? trainedStats[statKey] : (parseInt(trainedStats[statKey], 10) || 60);
        penalizedStats[statKey] = Math.max(40, Math.round(val * affinityMultiplier));
    });

    const calculatedOvr = calculatePositionOVR(penalizedStats, targetPos, trainedStats, baseOvr);
    return Math.max(40, calculatedOvr);
};

