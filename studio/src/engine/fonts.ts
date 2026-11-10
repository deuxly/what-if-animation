import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';
import { loadFont as loadBricolage } from '@remotion/google-fonts/BricolageGrotesque';
import { loadFont as loadMono } from '@remotion/google-fonts/FragmentMono';
import { loadFont as loadHand } from '@remotion/google-fonts/Kalam';
import { STUDIO } from '../studio.config';

// Three faces: a heavy display face for the title card, a mono for on-screen readouts (timers, labels, chips),
// and a handwriting face for chalk and notes. The Google faces load at render time (they need a connection);
// a local title face from studio.config.ts loads from public/ and works offline.

// Offline fallback (a sandbox whose browser can't reach Google Fonts): with the files in public/fonts/, load them
// from there under the same family names; otherwise from Google Fonts as usual.
if (STUDIO.localFonts) {
  loadFont({ family: 'Bricolage Grotesque', url: staticFile('fonts/BricolageGrotesque.woff2'), weight: '200 800' });
  loadFont({ family: 'Fragment Mono', url: staticFile('fonts/FragmentMono-400.woff2'), weight: '400' });
  loadFont({ family: 'Kalam', url: staticFile('fonts/Kalam-400.woff2'), weight: '400' });
  loadFont({ family: 'Kalam', url: staticFile('fonts/Kalam-700.woff2'), weight: '700' });
} else {
  loadBricolage('normal', { weights: ['600', '700', '800'], subsets: ['latin'] });
  loadMono('normal', { weights: ['400'], subsets: ['latin'] });
  loadHand('normal', { weights: ['400', '700'], subsets: ['latin'] });
}
if (STUDIO.titleFont) loadFont({ family: STUDIO.titleFont.family, url: staticFile(STUDIO.titleFont.file), weight: STUDIO.titleFont.weight });

export const FONT = {
  title: STUDIO.titleFont ? STUDIO.titleFont.family : 'Bricolage Grotesque',
  ui: 'Fragment Mono',
  hand: 'Kalam',
};
