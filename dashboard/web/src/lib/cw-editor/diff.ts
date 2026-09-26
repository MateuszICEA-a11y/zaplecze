/* Różnice między wersjami sekcji: udział zmiany, diff słowny (przejazd
   redaktorski) i raport linków. Przeniesione z legacy/edytor-script.ts. */
import type { Section } from "./types";

export type Opcode = { op: string; before: string; after: string };

/** Ile treści sekcji objęła zmiana – przy gruntownym przepisaniu diff inline
    przestaje być czytelny i lepiej od razu pokazać wersję „po". */
export function changeRatio(section: Section) {
  const opcodes = section.diff?.opcodes ?? [];
  const changed = opcodes.filter((op) => op.op !== "equal").reduce((sum, op) => sum + Math.max(op.before.length, op.after.length), 0);
  const total = opcodes.reduce((sum, op) => sum + Math.max(op.before.length, op.after.length), 0);
  return total ? changed / total : 0;
}

/** Diff słowny liczony w przeglądarce – pipeline dostarcza opcode'y z difflib,
    ale przejazd redaktorski wraca z Workera jako dwa brzmienia tekstu.
    Porównujemy prozę (bez znaczników): korekta stylu zmienia słowa, nie HTML,
    a diff po tagach byłby nieczytelny. */
const DIFF_TOKEN_LIMIT = 3000;

function diffTokens(html: string | null) {
  const doc = new DOMParser().parseFromString(html ?? "", "text/html");
  const text = (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  // Zachowujemy spacje przy słowach, żeby scalony tekst czytał się normalnie.
  return text ? text.split(/(?<=\s)/) : [];
}

export function wordDiff(before: string | null, after: string | null): Opcode[] {
  const a = diffTokens(before);
  const b = diffTokens(after);
  if (!a.length && !b.length) return [];
  // Przy monstrualnej sekcji rezygnujemy z LCS (macierz rośnie kwadratowo)
  // i pokazujemy oba brzmienia jako jedną zmianę – bez cichego przycinania.
  if (a.length > DIFF_TOKEN_LIMIT || b.length > DIFF_TOKEN_LIMIT) {
    return [{ op: "replace", before: a.join(""), after: b.join("") }];
  }

  // Najdłuższy wspólny podciąg – tabela długości, potem odczyt wstecz.
  const width = b.length + 1;
  const table = new Int32Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * width + j] = a[i] === b[j] ? table[(i + 1) * width + j + 1] + 1 : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
    }
  }

  const opcodes: Opcode[] = [];
  const push = (op: string, before: string, after: string) => {
    const last = opcodes.at(-1);
    if (last && last.op === op) {
      last.before += before;
      last.after += after;
    } else opcodes.push({ op, before, after });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push("equal", a[i], b[j]);
      i++;
      j++;
    } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) {
      push("delete", a[i], "");
      i++;
    } else {
      push("insert", "", b[j]);
      j++;
    }
  }
  while (i < a.length) push("delete", a[i++], "");
  while (j < b.length) push("insert", "", b[j++]);
  return opcodes;
}

/* ---------- raport linków w sekcji ----------
   Model przy przepisywaniu potrafi zgubić istniejące linki wewnętrzne –
   lista pokazuje wprost, które adresy doszły, a które zniknęły, żeby decyzja
   o sekcji nie wymagała porównywania HTML-a ręcznie. */

export type LinkRef = { href: string; text: string };

function extractLinks(html: string | null): LinkRef[] {
  const doc = new DOMParser().parseFromString(html ?? "", "text/html");
  return [...doc.querySelectorAll<HTMLAnchorElement>("a[href]")].map((link) => ({
    href: link.getAttribute("href") ?? "",
    text: link.textContent?.trim() ?? "",
  }));
}

export function sectionLinkDiff(section: Section) {
  const before = extractLinks(section.text_before);
  const after = extractLinks(section.text_after);
  const beforeSet = new Set(before.map((link) => link.href));
  const afterSet = new Set(after.map((link) => link.href));
  return {
    added: after.filter((link) => !beforeSet.has(link.href)),
    removed: before.filter((link) => !afterSet.has(link.href)),
  };
}
