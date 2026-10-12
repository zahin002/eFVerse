// eFootball 27 Official Defensive Playing Styles

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

export const DEFENSIVE_PLAYSTYLE_DETAILS = {
  'Front Line Pressure': {
    name: 'Front Line Pressure',
    positions: 'CF/WF/SS',
    overview: 'Players will actively pressure the opposing keeper and defenders to force errors.'
  },
  'Front Line Poacher': {
    name: 'Front Line Poacher',
    positions: 'CF/SS',
    overview: 'Players will close passing lanes up high to force interceptions.'
  },
  'Attack Outlet': {
    name: 'Attack Outlet',
    positions: 'CF/SS',
    overview: 'Players will stay high up the pitch and not track back as often to conserve energy for when it matters the most.'
  },
  'Pass Disruptor': {
    name: 'Pass Disruptor',
    positions: 'AMF',
    overview: 'Players will focus on closing passing lanes and aggressively go for interceptions.'
  },
  'Box-to-Box': {
    name: 'Box-to-Box',
    positions: 'CMF/DMF',
    overview: 'True to the role, players will participate in both attack and defense.'
  },
  'All Action Defender': {
    name: 'All Action Defender',
    positions: 'DMF',
    overview: 'Like Kanté, players will stay active in defense by covering the whole field and tracking back more efficiently. The best style for CMFs.'
  },
  'Anchor Man': {
    name: 'Anchor Man',
    positions: 'CMF/DMF',
    overview: 'Players will position themselves as your secondary line of defense from the center.'
  },
  'Covering Role': {
    name: 'Covering Role',
    positions: 'CMF/DMF/CB/FB',
    overview: 'Players will actively cover the spaces left by their teammates and challenge attackers. Ideal for those looking to secure themselves while pressuring.'
  },
  'High Line Master': {
    name: 'High Line Master',
    positions: 'CB',
    overview: 'Players will make an effort to hold their positions and preserve your team’s shape on defense.'
  },
  'The Destroyer': {
    name: 'The Destroyer',
    positions: 'CB',
    overview: 'Players will excel when pursuing and disarming attackers via physicality.'
  },
  'Sweeper GK': {
    name: 'Sweeper GK',
    positions: 'GK',
    overview: 'Keepers will challenge players on the run by rushing and often position themselves up high.'
  },
  'Offensive GK': {
    name: 'Offensive GK',
    positions: 'GK',
    overview: 'Your number one will often move up to help with the build-up.'
  },
  'Defensive GK': {
    name: 'Defensive GK',
    positions: 'GK',
    overview: 'Keepers will stay close to the goal line and prioritize positioning over aggression. Demands help from the backline to close out shots or stop deep runs.'
  }
};

export const getDefensivePlaystyleInfo = (name) => {
  if (!name) return null;
  return DEFENSIVE_PLAYSTYLE_DETAILS[name] || null;
};
