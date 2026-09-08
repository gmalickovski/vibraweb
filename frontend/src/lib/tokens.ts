// Design tokens — mirrors colors_and_type.css for use in inline styles
export const t = {
  night:    '#120A10',
  night2:   '#1C1016',
  plum:     '#2A1620',
  pb:       '#3A1E2B',   // plum-border
  gold:     '#FDB813',
  coral:    '#E85D04',
  magenta:  '#C0397B',
  wine:     '#581C3C',
  fg:       '#F3F4F6',
  fg2:      '#D1D5DB',
  fg3:      '#9CA3AF',
  fg4:      '#6B7280',
  paper:    '#FBF7F4',
  paper2:   '#F1E9E2',
  ink:      '#1C1016',
  ink2:     '#4A2F3B',
  success:  '#2EA36A',
  info:     '#8E7DDB',
  indigo:   '#6366F1',
  // Alternating section band, used from the "4 blocos" section onward.
  // Same palette as the hero backdrop — wine dominant, a touch of magenta —
  // but with the gold dialled well down (.58/.10/.06 there → .30/.08/.02
  // here). The linear layer underneath sets the band's edge tone, keeping it
  // clearly above the base night so each section start/end stays legible.
  bandPurple: [
    'radial-gradient(ellipse 70% 80% at 38% 50%, rgba(88,28,60,.07) 0%, transparent 64%)',
    'radial-gradient(ellipse 45% 40% at 16% 72%, rgba(192,57,123,.022) 0%, transparent 58%)',
    'radial-gradient(ellipse 50% 45% at 76% 28%, rgba(253,184,19,.008) 0%, transparent 58%)',
    'linear-gradient(180deg,#140B14 0%,#170D18 52%,#140B14 100%)',
  ].join(','),
  // Hairline that marks where one band meets the next.
  bandLine:   'rgba(192,57,123,.16)',
  gradCta:  'linear-gradient(90deg,#FDB813,#E85D04)',
  gradText: 'linear-gradient(90deg,#FDB813,#C0397B)',
  gradSun:  'linear-gradient(90deg,#FDB813,#E85D04 55%,#C0397B)',
  display:  "'Poppins', sans-serif",
  body:     "'Inter', sans-serif",
  mono:     "'JetBrains Mono', monospace",
} as const

export type Tokens = typeof t
