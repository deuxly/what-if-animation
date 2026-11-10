import React from 'react';
import { defineEpisode, Timeline, LookDef, HudChip } from '../../engine';
import timeline from './timeline.json';
import { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17 } from './shots';

// The power's look, DENGAR (hear): the picture cools and dims a touch while Pip listens, a DENGAR chip blinks. The
// thought bubbles and sound rings are drawn in the shots.
const dengarLook: LookDef = {
  grade: (lv) => `saturate(${1 - 0.18 * lv}) hue-rotate(${-10 * lv}deg) brightness(${1 - 0.04 * lv})`,
  Overlay: ({ f }) => <HudChip f={f} label="DENGAR" icon="dot" />,
};

export const pikiranKeempat = defineEpisode('PikiranKeempat', {
  timeline: timeline as Timeline,
  shots: { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17 },
  looks: { dengar: dengarLook },
});
