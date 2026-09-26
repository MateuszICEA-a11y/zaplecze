/* Cytat eksperta: shortcode [k_quote_box] do zapisu i kopiowania oraz karta
   podglądu w edytorze. Przeniesione z dawnego edytor-script.ts. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Job, Section } from "./types";

/** Ten sam format bloku co step_expert w run.py i cw-expert.js. */
/* Wygląd cytatu na stronie niosą style inline – do CSS motywu WordPressa nie
   mamy dostępu. Świadomy duplikat: EXPERT_STYLE w cw-wp.js; kopiowanie ręczne
   i zapis Workera muszą dawać ten sam HTML. W samym edytorze renderujemy
   wersję bez stylów (sanitizer i tak zdejmuje atrybuty, a blok ma tu własny,
   ciemny styl) – docelowy wygląd widać dopiero w szkicu WordPressa. */
const EXPERT_STYLE = {
  quote: 'margin:28px 0;padding:24px 28px;background:#eef0ff;border:1px solid #dfe2fb;'
    + 'border-left:4px solid #5768ff;border-radius:12px;box-shadow:0 1px 2px #00062314',
  row: 'display:flex;gap:18px;align-items:flex-start',
  avatar: 'flex:0 0 56px;width:56px;height:56px;border-radius:50%;background:#5768ff;'
    + 'color:#ffffff;font-size:18px;font-weight:700;display:flex;align-items:center;'
    + 'justify-content:center',
  photo: 'flex:0 0 56px;width:56px;height:56px;border-radius:50%;object-fit:cover',
  body: 'flex:1 1 auto;min-width:0',
  label: 'display:block;margin-bottom:10px;color:#5768ff;font-size:12px;'
    + 'font-weight:700;letter-spacing:.08em;text-transform:uppercase',
  text: 'margin:0 0 14px;color:#000623;font-size:17px;line-height:1.7;font-style:italic',
  footer: 'margin:0;padding:0;border:0;background:transparent;color:#6e7181;'
    + 'font-size:14px;font-style:normal',
  name: 'color:#000623;font-weight:600',
};

/** Lustro shortcodeAttr / expertShortcode z cw-expert.js – „kopiuj cytat”
    i „kopiuj treść” dają dokładnie to, co zapis do WP. */
export function shortcodeAttr(value: string): string {
  return String(value ?? '').replace(/<[^>]*>/g, '').replace(/&quot;/g, '”').replace(/"/g, '”')
    .replace(/\[/g, '(').replace(/\]/g, ')').replace(/\s+/g, ' ').trim();
}
export function expertShortcode(expert: any): string {
  const link = /^https:\/\//i.test(expert.link ?? '') ? String(expert.link).trim() : '';
  const attrs: [string, string][] = [
    ['text', shortcodeAttr(expert.quote ?? '')],
    ['author_name', shortcodeAttr(expert.expert ?? '')],
    ['author_pos', shortcodeAttr([expert.role, 'ICEA'].filter(Boolean).join(', '))],
    ['author_link', link],
    ['author_link_nofollow', link ? 'false' : ''],
    ['author_img', /^https:\/\//i.test(expert.photo ?? '') ? String(expert.photo).trim() : ''],
  ];
  return `[k_quote_box ${attrs.filter(([, value]) => value).map(([key, value]) => `${key}="${value}"`).join(' ')}]`;
}

/** Podgląd karty cytatu w edytorze (styled=true to archiwalny format
    zapisu sprzed shortcodów – zostaje dla starych wpisów). */
export function expertBlockquote(expert: any, styled = false) {
  const s = (key: keyof typeof EXPERT_STYLE) => (styled ? ` style="${EXPERT_STYLE[key]}"` : '');
  const name = String(expert.expert ?? '').trim();
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2)
    .map((word: string) => word[0].toUpperCase()).join('');
  const sign = [expert.role, 'ICEA'].filter(Boolean).join(', ');
  const face = expert.photo
    ? `<img src="${expert.photo}" alt="${name}"${s('photo')} />`
    : (initials ? `<div${s('avatar')}>${initials}</div>` : '');
  return `<blockquote class="expert"${s('quote')}>`
    + `<div${s('row')}>${face}<div${s('body')}>`
    + `<span${s('label')}>Zdaniem eksperta</span>`
    + `<p${s('text')}>${expert.quote}</p>`
    + `<footer${s('footer')}>`
    + (name ? `<span${s('name')}>${name}</span>` : '')
    + (name && sign ? ` · ${sign}` : sign)
    + '</footer></div></div></blockquote>';
}

export function activeExpert(current: Job | null) {
  return current?.expert?.status === 'done' ? current.expert : null;
}

/** „Kopiuj treść" dokleja cytat eksperta do sekcji, w której ma stanąć –
    text_after w bazie zostaje czystym wynikiem pipeline'u. */
export function sectionCopyText(section: Section, job: Job | null) {
  const expert = activeExpert(job);
  const base = section.text_after ?? '';
  return expert && expert.slot === section.slot ? `${base}\n${expertShortcode(expert)}` : base;
}
