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
            { stat: 'dribbling', weight: 1.0 },
            { stat: 'tightpossession', weight: 1.0 },
            { stat: 'ballcontrol', weight: 1.0 }
        ]
    },
    dexterity: {
        name: 'Dexterity',
        effects: [
            { stat: 'acceleration', weight: 1.0 },
            { stat: 'balance', weight: 1.0 },
            { stat: 'offensiveawareness', weight: 1.0 }
        ]
    },
    lowerBody: {
        name: 'Lower Body Strength',
        effects: [
            { stat: 'speed', weight: 1.0 },
            { stat: 'stamina', weight: 1.0 },
            { stat: 'kickingpower', weight: 1.0 }
        ]
    },
    aerial: {
        name: 'Aerial Strength',
        effects: [
            { stat: 'jump', weight: 1.0 },
            { stat: 'heading', weight: 1.0 },
            { stat: 'physicalcontact', weight: 1.0 }
        ]
    },
    defending: {
        name: 'Defending',
        effects: [
            { stat: 'defensiveawareness', weight: 1.0 },
            { stat: 'tackling', weight: 1.0 },
            { stat: 'defensiveengagement', weight: 1.0 },
            { stat: 'aggression', weight: 1.0 }
        ]
    },
    gk1: {
        name: 'GK 1',
        effects: [
            { stat: 'gkawareness', weight: 1.0 },
            { stat: 'gkcatching', weight: 1.0 }
        ]
    },
    gk2: {
        name: 'GK 2',
        effects: [
            { stat: 'gkparrying', weight: 1.0 },
            { stat: 'gkreflexes', weight: 1.0 }
        ]
    },
    gk3: {
        name: 'GK 3',
        effects: [
            { stat: 'gkreach', weight: 1.0 },
            { stat: 'jump', weight: 1.0 }
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

// 5. Calculate Stats given Base Stats + Group Level Allocations
export const calculateAllocatedStats = (baseStats = {}, allocations = {}) => {
    const calculated = { ...(baseStats || {}) };

    Object.keys(allocations || {}).forEach(groupKey => {
        const levels = allocations[groupKey] || 0;
        const groupObj = STAT_GROUPS[groupKey];
        if (!groupObj || levels <= 0) return;

        groupObj.effects.forEach(({ stat, weight = 1.0 }) => {
            const rawVal = calculated[stat];
            const currentVal = typeof rawVal === 'number' ? rawVal : (parseInt(rawVal, 10) || 60);
            calculated[stat] = currentVal + Math.round(levels * weight);
        });
    });

    return calculated;
};

// 6. Compute OVR via Position Weight Matrix (Weighted Sum Baseline Subtraction Model)
// 6. Compute OVR via Position Weight Matrix & Progression Point Growth
export const calculatePositionOVR = (stats = {}, position = 'AMF', baseOvr = 80, maxOvr = 99, allocations = {}) => {
    const posStr = Array.isArray(position) ? position[0] : (typeof position === 'string' ? position : 'AMF');
    const posUpper = (posStr || 'AMF').toUpperCase().trim();

    const totalPointsAllocated = Object.keys(allocations).reduce((sum, k) => {
        const lvl = allocations[k] || 0;
        for (let i = 1; i <= lvl; i++) sum += getLevelCost(i);
        return sum;
    }, 0);

    const maxPoints = 62;
    const progressRatio = Math.min(1.0, Math.max(0, totalPointsAllocated / maxPoints));
    const ovrGain = Math.round(progressRatio * Math.max(1, (maxOvr - baseOvr)));

    return baseOvr + ovrGain;
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
