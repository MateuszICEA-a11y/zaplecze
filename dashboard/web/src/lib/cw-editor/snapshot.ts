/* Migawki treści dokumentu edytora wpisu – czytane z DOM-u dokumentu
   ([data-ed-doc]), który do czasu przepisania buduje legacy/edytor-script.ts. */
import { docProse } from "./sanitize";
import type { Entry, Job } from "./types";

const docRoot = () => document.querySelector<HTMLElement>("[data-ed-doc]");

export const WORD_RE = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu;
export const countWords = (text: string) => (text.match(WORD_RE) ?? []).length;

/** Docelowa treść całego wpisu, niezależna od tego, jak sekcje są akurat
    pokazane. Sekcja w trybie „zmiany" ma w DOM-ie listę różnic, a nie tekst –
    liczenie wprost z ekranu gubiło jej nagłówki, akapity i linki, a słowa
    liczyło podwójnie (wersja przed i po naraz). Dlatego metryki idą z kopii:
    tekst z podglądu, a przy widoku różnic – wersja, która wejdzie na stronę. */
export function docSnapshot(job: Job | null) {
  const box = document.createElement("div");
  const root = docRoot();
  if (!root) return box;
  for (const node of root.querySelectorAll<HTMLElement>(".ed-doc-section, .ed-faq-head")) {
    // Nagłówek bloku FAQ to nie sekcja, a bez niego podgląd całości gubił
    // granicę między artykułem a pytaniami.
    if (node.classList.contains("ed-faq-head")) {
      const faqHeading = document.createElement("h2");
      faqHeading.textContent = node.querySelector("h2")?.textContent ?? "FAQ";
      box.append(faqHeading);
      continue;
    }
    const isFaq = node.classList.contains("ed-doc-faq");
    // Pytanie FAQ siedzi w H3 – szukanie samych H2 zostawiało w podglądzie
    // odpowiedzi bez pytań, przez co blok FAQ wyglądał na nieobecny.
    const title = node.querySelector(".ed-sec-head h1, .ed-sec-head h2, .ed-sec-head h3")?.textContent ?? "";
    if (title) {
      const level = node.classList.contains("ed-doc-intro") ? "h1" : isFaq ? "h3" : "h2";
      const heading = document.createElement(level);
      heading.textContent = title;
      box.append(heading);
    }
    const body = node.querySelector(".ed-doc-body");
    // Cytat eksperta stoi w sekcji OBOK treści (.ed-doc-expert, dokłada go
    // applyExpertToDoc) – bez jawnego zabrania podgląd całości i eksport
    // gubiły zaakceptowaną wypowiedź.
    const expertNode = node.querySelector(".ed-doc-expert");
    if (body) {
      box.append(body.cloneNode(true));
      if (expertNode) box.append(expertNode.cloneNode(true));
      continue;
    }
    const section = job?.sections?.find((row) => row.slot === Number(node.dataset.slot));
    if (!section) continue;
    // Odrzucona propozycja = na stronie zostaje dotychczasowy tekst.
    const html = section.decision === "rejected" ? section.text_before : section.text_after;
    box.append(docProse(html ?? section.text_before ?? ""));
    if (expertNode) box.append(expertNode.cloneNode(true));
  }
  return box;
}

export type DocMetrics = { words: number; headings: number; paragraphs: number; internal: number; external: number; text: string };

export function docMetrics(entry: Entry | null, job: Job | null): DocMetrics {
  const snapshot = docSnapshot(job);
  const text = snapshot.textContent ?? "";
  const ownHost = (() => {
    try {
      return new URL(entry?.url ?? "").hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();
  const links = [...snapshot.querySelectorAll<HTMLAnchorElement>("a[href]")];
  const internal = links.filter((link) => link.hostname.replace(/^www\./, "") === ownHost).length;
  return {
    words: countWords(text),
    headings: snapshot.querySelectorAll("h2, h3, h4").length,
    paragraphs: snapshot.querySelectorAll("p").length,
    internal,
    external: links.length - internal,
    text,
  };
}

/** Treść wpisu sprzed przebiegu – po niej poznajemy, które frazy dołożyła
    propozycja, a które były w tekście od początku. */
export function docBaselineText(job: Job | null) {
  const box = document.createElement("div");
  const root = docRoot();
  if (!root) return "";
  for (const node of root.querySelectorAll<HTMLElement>(".ed-doc-section")) {
    const section = job?.sections?.find((row) => row.slot === Number(node.dataset.slot));
    if (section) {
      box.append(document.createTextNode(` ${section.title_before ?? ""} `));
      box.append(docProse(section.text_before ?? ""));
      continue;
    }
    box.append(document.createTextNode(` ${node.querySelector(".ed-sec-head")?.textContent ?? ""} `));
    const body = node.querySelector(".ed-doc-body");
    if (body) box.append(body.cloneNode(true));
  }
  return box.textContent ?? "";
}

/** Kopia dokumentu bez atrybutów interfejsu – czyste tagi i linki (podgląd
    całości, schowek pod Google Docs, plik .doc). */
export function previewSnapshot(job: Job | null) {
  const box = docSnapshot(job);
  box.querySelectorAll("*").forEach((node) => {
    const keep = new Map<string, string>();
    // `style` zostaje wszędzie: karty (ekspert, CTA) i infografika niosą
    // wygląd inline – bez niego podgląd i eksport do Docs pokazują goły
    // tekst. Wartości są już po sanityzacji (STYLE_SAFE w sanitizeInto).
    const held =
      node.tagName === "A"
        ? ["href", "style"]
        : // Bez src obraz znikał z podglądu i z eksportu .doc – wstawiona
          // infografika (i zdjęcie eksperta) wyglądały na nieobecne.
          node.tagName === "IMG"
          ? ["src", "alt", "style"]
          : ["style"];
    for (const name of held) {
      const value = node.getAttribute(name);
      if (value) keep.set(name, value);
    }
    [...node.attributes].forEach((attr) => node.removeAttribute(attr.name));
    keep.forEach((value, name) => node.setAttribute(name, value));
  });
  return box;
}
