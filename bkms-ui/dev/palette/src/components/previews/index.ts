import type { Component } from 'vue';

import type { Token } from '../../util/tokens';
import BackgroundPreview from './BackgroundPreview.vue';
import LinePreview from './LinePreview.vue';
import ShadowPreview from './ShadowPreview.vue';
import TextPreview from './TextPreview.vue';

interface PreviewRule {
  match: (token: Token) => boolean;
  component: Component;
}

const rules: PreviewRule[] = [
  { match: token => token.kind === 'shadow', component: ShadowPreview },
  { match: token => token.name.startsWith('--bkms-text-'), component: TextPreview },
  { match: token => token.name.startsWith('--bkms-line-'), component: LinePreview },
  { match: token => token.name.startsWith('--bkms-bg-'), component: BackgroundPreview },
];

export function previewFor(token: Token): Component | null {
  return rules.find(rule => rule.match(token))?.component ?? null;
}
