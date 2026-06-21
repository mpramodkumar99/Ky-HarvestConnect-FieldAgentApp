import { useColorScheme } from '@/hooks/use-color-scheme';

// FoxTail brand palette
// Primary: Harvest Green #2E7D32 | Accent: Saffron Gold #F4A300
// Earth Brown #7B4B2A | Peacock Blue #006D77 | Ivory White #FAF7F2

const LIGHT = {
  bg:              '#ffffff',
  bgScreen:        '#FAF7F2',
  bgMuted:         '#f5f0ea',
  bgSubtle:        '#ede8e0',
  border:          '#e0d8cc',
  borderLight:     '#ede8e0',
  borderMid:       '#c8bfb0',
  text:            '#1a1208',
  textSub:         '#3d2f1a',
  textMuted:       '#7a6a52',
  textFaint:       '#a89880',
  // Harvest Green — primary action
  primary:         '#2E7D32',
  primaryBg:       '#f1faf1',
  primaryBgStrong: '#dcf5dc',
  primaryText:     '#1b5e20',
  primaryBorder:   '#81c784',
  primaryLight:    '#a5d6a7',
  // Saffron Gold — accent / alerts / highlights
  accent:          '#F4A300',
  accentBg:        '#fff8e6',
  accentText:      '#7a4f00',
  accentBorder:    '#ffd966',
  // Earth Brown — secondary
  earth:           '#7B4B2A',
  earthBg:         '#fdf0e8',
  // Peacock Blue — info
  peacock:         '#006D77',
  peacockBg:       '#e6f4f5',
  // Status colors
  errorBg:         '#fff5f5',
  errorBorder:     '#fca5a5',
  errorText:       '#dc2626',
  errorTextDark:   '#991b1b',
  warningBg:       '#fffbeb',
  warningText:     '#92400e',
  warningTextDark: '#78350f',
  warningBorder:   '#fde68a',
};

const DARK = {
  bg:              '#1a1208',
  bgScreen:        '#0d0a04',
  bgMuted:         '#251c0e',
  bgSubtle:        '#332616',
  border:          '#3d2f1a',
  borderLight:     '#251c0e',
  borderMid:       '#4d3c24',
  text:            '#faf0e0',
  textSub:         '#e8d8b8',
  textMuted:       '#9a8060',
  textFaint:       '#6a5840',
  primary:         '#2E7D32',
  primaryBg:       '#0a1f0a',
  primaryBgStrong: '#0d2b0d',
  primaryText:     '#81c784',
  primaryBorder:   '#1b5e20',
  primaryLight:    '#a5d6a7',
  accent:          '#F4A300',
  accentBg:        '#1f1500',
  accentText:      '#ffd54f',
  accentBorder:    '#7a4f00',
  earth:           '#c4855a',
  earthBg:         '#1f0f06',
  peacock:         '#4db6c4',
  peacockBg:       '#00191d',
  errorBg:         '#2d0a0a',
  errorBorder:     '#7f1d1d',
  errorText:       '#f87171',
  errorTextDark:   '#fca5a5',
  warningBg:       '#1c1000',
  warningText:     '#fbbf24',
  warningTextDark: '#f59e0b',
  warningBorder:   '#92400e',
};

export type AppColors = typeof LIGHT;

export function useAppColors(): AppColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DARK : LIGHT;
}
