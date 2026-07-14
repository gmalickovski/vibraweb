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
  gradCta:  'linear-gradient(90deg,#FDB813,#E85D04)',
  gradText: 'linear-gradient(90deg,#FDB813,#C0397B)',
  gradSun:  'linear-gradient(90deg,#FDB813,#E85D04 55%,#C0397B)',
  display:  "'Poppins', sans-serif",
  body:     "'Inter', sans-serif",
  mono:     "'JetBrains Mono', monospace",
} as const

export type Tokens = typeof t
