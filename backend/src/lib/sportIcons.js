const SPORT_ICONS = {
  Football:        '⚽',
  Basketball:      '🏀',
  Rugby:           '🏉',
  Volleyball:      '🏐',
  Hockey:          '🏒',
  Boxing:          '🥊',
  MMA:             '🥋',
  CrossFit:        '🏋️',
  Swimming:        '🏊',
  Surfing:         '🏄',
  Rowing:          '🚣',
  Running:         '🏃',
  'Trail Running': '🥾',
  Cycling:         '🚴',
  Triathlon:       '🏅',
  Skiing:          '⛷️',
  Tennis:          '🎾',
  Golf:            '⛳',
  Gymnastics:      '🤸',
  Yoga:            '🧘',
  'Rock Climbing': '🧗',
  Hiking:          '🥾',
};

const DEFAULT_ICON = '🏅';

function iconForSport(name) {
  return SPORT_ICONS[name] || DEFAULT_ICON;
}

module.exports = { SPORT_ICONS, DEFAULT_ICON, iconForSport };
