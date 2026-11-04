/**
 * UnoCSS bkms 令牌注册（供 uno.config.ts 消费）。
 * 值全部指向 src/theme/tokens.css 定义的 --bkms-*，不写字面量色值。
 * 已知限制：纯 var() 字符串不支持 /50 alpha 修饰符，半透明用 color-mix 显式写。
 */
const bkmsShades: Record<string, number> = {
  brand: 7,
  neutral: 10,
  success: 7,
  warning: 7,
  danger: 7,
  purple: 7,
  cyan: 7,
  navy: 5,
};

export const bkmsColorTokens: Record<string, string> = {
  'nav-indicator-1': 'var(--bkms-nav-indicator-1)',
  'nav-indicator-2': 'var(--bkms-nav-indicator-2)',
  'nav-indicator-3': 'var(--bkms-nav-indicator-3)',
  'text-title': 'var(--bkms-text-title)',
  'text-body': 'var(--bkms-text-body)',
  'text-secondary': 'var(--bkms-text-secondary)',
  'text-disabled': 'var(--bkms-text-disabled)',
  'text-brand': 'var(--bkms-text-brand)',
  'text-inverse': 'var(--bkms-text-inverse)',
  'line-light': 'var(--bkms-line-light)',
  'line-default': 'var(--bkms-line-default)',
  'line-input': 'var(--bkms-line-input)',
  'line-hover': 'var(--bkms-line-hover)',
  'line-active': 'var(--bkms-line-active)',
  'line-danger': 'var(--bkms-line-danger)',
  'bg-page': 'var(--bkms-bg-page)',
  'bg-hover': 'var(--bkms-bg-hover)',
  'bg-subtle': 'var(--bkms-bg-subtle)',
  'bg-head': 'var(--bkms-bg-head)',
  'bg-title': 'var(--bkms-bg-title)',
  'bg-disabled': 'var(--bkms-bg-disabled)',
  'bg-card': 'var(--bkms-bg-card)',
  'bg-active': 'var(--bkms-bg-active)',
  'bg-active-hover': 'var(--bkms-bg-active-hover)',
  'bg-brand-soft': 'var(--bkms-bg-brand-soft)',
  'bg-success': 'var(--bkms-bg-success)',
  'bg-success-soft': 'var(--bkms-bg-success-soft)',
  'bg-warning': 'var(--bkms-bg-warning)',
  'bg-warning-soft': 'var(--bkms-bg-warning-soft)',
  'bg-danger': 'var(--bkms-bg-danger)',
  'bg-danger-soft': 'var(--bkms-bg-danger-soft)',
  'shadow-card': 'var(--bkms-shadow-card)',
  'shadow-hover': 'var(--bkms-shadow-hover)',
  'shadow-header': 'var(--bkms-shadow-header)',
  'shadow-popover': 'var(--bkms-shadow-popover)',
  'shadow-dialog': 'var(--bkms-shadow-dialog)',
  'shadow-button': 'var(--bkms-shadow-button)',
};

for (const [name, max] of Object.entries(bkmsShades)) {
  for (let i = 1; i <= max; i++) bkmsColorTokens[`${name}-${i}`] = `var(--bkms-${name}-${i})`;
}
