"""Rebuild the standalone HTML from the preserved visual shell and cost model."""
from pathlib import Path
import json
import re
import subprocess
from html import escape

ROOT = Path(__file__).parent
OUT = ROOT / 'kosztorys-bwp-2026-09-15.html'
SHELL = ROOT / 'visual-shell.html'
if not SHELL.exists():
    old = OUT.read_text(encoding='utf-8')
    SHELL.write_text(old[:old.index('    <section id="punkt-wyjscia">')], encoding='utf-8')
shell = SHELL.read_text(encoding='utf-8')
data = json.loads(subprocess.check_output(['node','-e',"const m=require('./cost-model.js'); const team=m.defaultEmployees(); console.log(JSON.stringify({B:m.defaults('B'),C:m.defaults('C'),team:team,b:m.calculate(Object.assign({},m.defaults('B'),{employees:team})),c:m.calculate(Object.assign({},m.defaults('C'),{employees:team}))}))"],cwd=ROOT,encoding='utf-8'))
d=data['B']
def pl(v): return f'{v:,.2f}'.replace(',', ' ').replace('.', ',')
def zl(v): return pl(v)+' zł'
def field(key,label,hint='',step='any'):
    val=d[key]
    return f'<div class="field"><label for="{key}">{label}</label><input data-param id="{key}" type="number" min="0" step="{step}" value="{val}" required><span class="hint">{hint}</span></div>'
def select(key,label,opts,hint=''):
    options=''.join(f'<option value="{v}"'+(' selected' if d[key]==v else '')+f'>{t}</option>' for v,t in opts)
    return f'<div class="field"><label for="{key}">{label}</label><select data-param id="{key}">{options}</select><span class="hint">{hint}</span></div>'
def result(label,key,note=''):
    return f'<article class="result-card"><span class="label">{label}</span><div class="result-big" data-money="{key}">{zl(data["b"][key])}</div><p class="result-sub">{note}</p></article>'
def hours(k):
    x=data[k]; return x['launchHours']+x['startPosts']*x['articleMinutes']/60+12*(x['upkeepHours']+x['monthlyPosts']*x['articleMinutes']/60)
def cash(k):
    x=data[k]; return x['domain']+(x['startPosts']+12*x['monthlyPosts'])*x['apiUnit']
def flat_year(k):
    x=data[k]; return x['launchHours']*x['rate']+x['domain']+x['startPosts']*x['flatUnit']+12*(x['upkeepHours']*x['rate']+x['monthlyPosts']*x['flatUnit'])
def head(n,title,text=''):
    return f'<div class="section-head"><div><p class="kicker">{n}</p><h2>{title}</h2></div><p class="section-intro">{text}</p></div>'
shell=shell.replace('Wersja robocza • kwoty dostawców do uzupełnienia','Model kosztowy • ceny i założenia 15.09.2026')
shell=shell.replace('<strong>52,2 h</strong><span>raportowana praca portalu 1 — dolna granica, nie pełny koszt</span>','<strong>250 zł / rbh</strong><span>stawka operatora; baza liczy zespół senior + junior</span>')
shell=shell.replace('<strong>B → C</strong><span>10–20 portali premium → 200–300 portali regularnych</span>','<strong>100 wpisów</strong><span>start portalu w B; C zakłada 60 i publikację bez czytania</span>')
shell=shell.replace('Kwoty Kie.ai, kredytów do fact-checku, domen, infrastruktury i pracy własnej pozostają zmiennymi w kalkulatorze.','Gotowy model jednostkowy: praca operatora + modele językowe + grafika + publikacja. Zmień liczbę wpisów, aby przeliczyć portal i całą sieć.')
shell=shell.replace('WERSJA ROBOCZA • BRAKUJĄCE KWOTY WYMAGAJĄ UZUPEŁNIENIA. ','SZACUNEK PLANISTYCZNY • ')
extra='''
    .controls-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
    .form-panel{position:static;margin:24px 0}.form-panel .field{margin:0;min-width:0}
    .calc .result-big{font-size:32px;letter-spacing:-.035em}
    details{margin:18px 0;border:1px solid var(--line);padding:18px;border-radius:12px;background:var(--white)}
    summary{cursor:pointer;font-weight:700;color:var(--navy)}details .controls-grid{margin-top:18px}
    button:disabled{opacity:.45;cursor:default}
    .calc-error{color:#a12519;font-weight:700}.table-wrap{margin:20px 0}
    .num{text-align:right;font-variant-numeric:tabular-nums}.estimate-intro{padding-bottom:36px}
    .cost-split{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:18px 0}
    .print-label{display:none}.actions a{text-decoration:none}
    .employee{padding:16px;margin:14px 0;border:1px solid var(--line);border-radius:12px;background:#fff}
    .employee-fields{display:grid;grid-template-columns:2fr 1.4fr 1fr 1fr 1fr;gap:12px}.employee .actions{margin-top:12px}
    .employee input,.employee select{min-width:0}.team-summary{margin:12px 0}
    @media(max-width:760px){.controls-grid,.employee-fields{grid-template-columns:1fr 1fr}}
    @media(max-width:520px){.controls-grid,.cost-split,.employee-fields{grid-template-columns:1fr}.calc .result-big{font-size:30px}}
    @media print{
      section,.calc{padding:22px 0}h2{font-size:25px}.hero-visual img{height:135px}
      .controls-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      .form-panel{break-inside:auto;margin:10px 0;padding:12px}.form-panel .field{display:block;width:auto;margin:0;break-inside:avoid}
      .field label{font-size:8pt}.field .hint{font-size:7pt}.field input,.field select{padding:4px;font-size:9pt}
      details{break-inside:auto;padding:10px;margin:10px 0}.calc .result-big{font-size:23px}
      .card,.result-card,.cost-split,.range-box{break-inside:avoid}.section-head{margin-bottom:12px}
      .table-wrap{overflow:visible}table{min-width:0}th,td{padding:7px;font-size:8pt}
      .grid-2,.grid-3{gap:10px}.hero-note{font-size:8pt}.calc-meta{font-size:8pt}
      .employee{break-inside:avoid}.employee-fields{grid-template-columns:repeat(3,minmax(0,1fr))}
      .grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}.estimate-intro{break-before:page}
      .estimate-intro .fact-big{font-size:27px!important}.card{padding:16px}
    }
'''
shell=shell.replace('</style>',extra+'</style>')

main='''<section class="estimate-intro"><div class="wrap">'''+head('01 · gotowa estymacja','Koszt wpisu wynika głównie z czasu człowieka.','Ceny API sprawdzone u dostawców. Czas obsługi, zużycie tokenów i rezerwy są jawnymi założeniami, które można zmienić.')+f'''
<div class="grid-3"><article class="card"><span class="label">Wpis B · zespół senior + junior</span><div class="fact-big" style="font-size:42px">{zl(data['b']['unit'])}</div><p>15 min pracy przy średniej {zl(data['b']['effectiveRate'])}/rbh (senior 250 zł/rbh i junior 9 000 zł/mies. w proporcji 1:3) + API, fact-check i jedna grafika Nano Banana 2 1K. Bez udziału stałych kosztów sieci.</p></article>
<article class="card"><span class="label">Wpis B · wariant górny, 250 zł/rbh</span><div class="fact-big" style="font-size:42px">{zl(data['b']['flatUnit'])}</div><p>Ta sama praca, ale każda minuta po stawce operatora. Górna granica: tak kosztuje wpis, jeśli junior nie przejmie produkcji.</p></article>
<article class="card soft-orange"><span class="label">Wpis C · publikacja bez czytania</span><div class="fact-big" style="font-size:42px">{zl(data['c']['unit'])}</div><p>2 min człowieka na wyjątki + redakcja Sonnetem przez API. Kontrola jakości jest w nadzorze wspólnym (próbka 1 na 10), nie w czasie wpisu. Bez tego warunku C nie istnieje.</p></article></div>
<p class="assume">Powyżej: wartości bazowe (Nano Banana 2 1K, kurs budżetowy 4 PLN/USD). Bieżące wyniki po zmianach znajdują się w kalkulatorze. 15 min w B oznacza 5 min przygotowania, 7 min kontroli i korekty oraz 3 min publikacji; czas oczekiwania na model nie jest czasem pracy. Dodatkowy wpis dla klienta w B: {zl(data['b']['clientUnit'])} (+10 min na brief i link). To założenia do sprawdzenia na próbce, nie wynik pomiaru.</p>
</div></section>
<section id="kalkulator" class="calc"><div class="wrap">'''+head('02 · kalkulator','Wpis → portal → cała sieć.','B: 100 wpisów na start i 10 nowych miesięcznie, 15 min pracy na wpis. C: 60 wpisów na start, 6 miesięcznie, 2 min na wpis. Skrót z 04.09 zakładał w B 15 tekstów i 30 newsów miesięcznie; newsy z automatu są poza tym modelem.')+'''
<form class="form-panel" id="costForm"><div class="controls-grid">'''
main+=select('scenario','Profil sieci',[('B','B · premium'),('C','C · skala i API')],'Zmienia liczbę portali, wpisy, czas na wpis i założenia techniczne; zachowuje zespół, grafiki i ceny.')
main+=field('portals','Liczba portali','Dowolna liczba 1–1000. Brief: B 10–20, C 200–300.','1')
main+=select('route','Sposób redakcji',[('hybrid','Claude Code + zewnętrzne API'),('api','Cała produkcja treści przez API')],'Claude 100 USD/mies. pozostaje narzędziem operatora w obu wariantach.')
main+=field('startPosts','Wpisy na start / portal','B: około 100 (potwierdzone). C: 60.','1')+field('monthlyPosts','Nowe wpisy / portal / mies.','B: 10, C: 6. Jeden wpis miesięcznie nie utrzyma widoczności portalu.','1')+field('clientPosts','Dodatkowe wpisy dla klientów / mies.','Na portal; poza planem redakcyjnym. Jeśli wpis jest już w planie, nie wpisuj go drugi raz.','1')
main+=field('articleMinutes','Praca na jeden wpis (min)','B: 15 min (przygotowanie, kontrola, poprawki, publikacja). C: 2 min, tylko wyjątki z automatu; to warunek istnienia C.')+field('clientExtraMinutes','Dodatkowa obsługa klienta (min/wpis)','Założenie: 10 min ponad zwykły wpis.')
main+=select('imageModel','Model obrazu Kie.ai',[('nano','Nano Banana 2'),('gpt','GPT Image 2')],'„gpt2” przyjęto jako GPT Image 2.')+select('resolution','Rozdzielczość grafiki',[('1K','1K'),('2K','2K'),('4K','4K')])+field('images','Grafiki na wpis','Założenie: 1.','1')
main+='''</div><div id="teamEditor"><h3 style="margin-top:28px">Pracownicy i koszt pracy</h3><p class="assume">Dodaj osoby z różnymi kosztami. Waga 1 i 1 oznacza po połowie pracy; 2 i 1 oznacza 2/3 i 1/3. Ten podział stosujemy do wszystkich godzin projektu. Przy koszcie miesięcznym stawka wynika z kosztu podzielonego przez dostępne godziny; do projektu przypisujemy tylko jego udział, nie doliczamy całej pensji drugi raz.</p>
<div id="employeeList">'''+''.join(f'''<div class="employee"><div class="employee-fields">
<div class="field"><label for="employee-{i}-name">Pracownik</label><input id="employee-{i}-name" data-employee="name" value="{escape(e['name'])}"></div>
<div class="field"><label for="employee-{i}-costType">Sposób kosztu</label><select id="employee-{i}-costType" data-employee="costType"><option value="hourly"{' selected' if e['costType']=='hourly' else ''}>PLN / rbh</option><option value="monthly"{' selected' if e['costType']=='monthly' else ''}>PLN / miesiąc</option></select></div>
<div class="field"><label for="employee-{i}-cost">Koszt (PLN)</label><input id="employee-{i}-cost" type="number" min="0" step="any" data-employee="cost" value="{e['cost']}"></div>
<div class="field"><label for="employee-{i}-availableHours">Dostępne h/mies.</label><input id="employee-{i}-availableHours" type="number" min="0.01" step="any" data-employee="availableHours" value="{e['availableHours']}"></div>
<div class="field"><label for="employee-{i}-weight">Waga udziału</label><input id="employee-{i}-weight" type="number" min="0.01" step="any" data-employee="weight" value="{e['weight']}"></div>
</div><div class="actions"><button class="btn remove-employee" type="button">Usuń pracownika</button></div></div>''' for i,e in enumerate(data['team']))+'''</div>
<div class="actions"><button class="btn" id="addEmployee" type="button">Dodaj pracownika</button></div>
<p class="team-summary">Liczba pracowników: <strong id="employeeCount">'''+str(len(data['team']))+'''</strong>. Średnia stawka według udziału pracy: <strong data-money="effectiveRate">'''+zl(data['b']['effectiveRate'])+'''</strong>/rbh. Dostępność: <strong data-number="teamAvailableHours">'''+str(sum(e['availableHours'] for e in data['team']))+'''</strong> h/mies.</p>
<p class="assume">Baza: senior/operator 250 zł/rbh i junior SEO 9 000 zł/mies. pełnego kosztu (56 zł/rbh) w proporcji 1:3, jak w briefie (1 etat juniora). Usuń juniora, aby zobaczyć wariant górny: cała praca po 250 zł/rbh. Junior pracujący w Claude Code potrzebuje własnego seata; dolicz go w polu subskrypcji.</p></div>
<details><summary>Założenia portalu, pracy wspólnej i budżetu</summary><div class="controls-grid">'''
for args in [('fx','Kurs budżetowy PLN/USD','Założenie 4,00; nie bieżący kurs banku.'),('subUsd','Claude i subskrypcje (USD/mies.)','Wspólnie dla sieci; obecnie 100 USD (ustalenie). Drugi seat dla juniora nie jest w bazie; dolicz tutaj.'),('toolsMonthly','Narzędzia researchu (PLN/mies.)','B: 180 zł, SerpData i Workers; Senuto i DataForSEO w subskrypcjach firmowych. C: 2 500 zł, wyższe pakiety. Jak w skrócie z 04.09.'),('domain','Domena / pierwszy rok (PLN)','Rezerwa 100 zł, nie cena konkretnego rejestratora. Odnowienie roku 2 poza pierwszym rokiem.'),('hosting','Hosting na portal (PLN/mies.)','Obecnie Pages 0 zł. Nie wpisuj ponownie wydatku ujętego w infrastrukturze wspólnej.'),('sharedInfra','Infrastruktura wspólna (PLN/mies.)','B: 0 zł obecnie. C: rezerwa 200 zł na hosting i automatyzację; nie oferta dostawcy.'),('launchHours','Uruchomienie techniczne / portal (h)','B 8 h, C 3 h: nisza, plan, konfiguracja i testy. Produkcja wpisów jest liczona osobno.'),('upkeepHours','Obsługa techniczna / portal / mies. (h)','B 1 h, C 0,25 h. Bez pracy nad wpisami.'),('sharedSetupHours','Wspólne uruchomienie procesu (h)','B 36 h; C 240 h, w tym panel 108 h. Założenia, nie pomiary.'),('sharedUpkeepHours','Wspólny nadzór / mies. (h)','B 6 h. C 98 h: 18 h nadzoru + ok. 80 h próbkowej kontroli jakości (pół etatu redaktora QA). Bez pracy przypisanej do portali.'),('sharedStart','Wspólne zakupy jednorazowe (PLN)','Założono 0 zł; panel budowany wewnętrznie jest w godzinach.'),('retryPercent','Rezerwa zużycia API (%)','25% na ponowienia i dodatkowe generacje. Nie zwiększa czasu człowieka.'),('successPercent','Skuteczne portale (%)','50% to analiza wrażliwości, nie prognoza. Można sprawdzić np. 30% i 70%.')]: main+=field(*args)
main+='</div></details><details><summary>Modele językowe: cennik i zużycie na wpis</summary><p class="assume">Domyślnie Gemini 3.5 Flash do szkicu, Sonar do researchu i fact-checku, Sonnet 4.6 do redakcji przez API. Cenniki bez promocji i bez rabatów batch/cache. Rozliczenie bezpośrednio u dostawców; pośrednik może mieć inne stawki. Zużycie jest budżetem na wpis, nie pomiarem.</p><div class="controls-grid">'
for key,label,hint in [('writerIn','Szkic: tokeny wejściowe','16 000 łącznie: instrukcje i kontekst.'),('writerOut','Szkic: tokeny wyjściowe','8 000 łącznie z ewentualnym rozumowaniem.'),('writerInputPrice','Gemini: USD / 1 mln wejścia','Gemini 3.5 Flash: 1,50 USD.'),('writerOutputPrice','Gemini: USD / 1 mln wyjścia','Gemini 3.5 Flash: 9 USD.'),('researchIn','Research i fact-check: tokeny wejścia','12 000 łącznie dla obu zapytań.'),('researchOut','Research i fact-check: tokeny wyjścia','4 000 łącznie dla obu zapytań.'),('researchCalls','Zapytania Sonar na wpis','2: research + fact-check.'),('researchInputPrice','Sonar: USD / 1 mln wejścia','1 USD.'),('researchOutputPrice','Sonar: USD / 1 mln wyjścia','1 USD.'),('researchRequestPrice','Sonar: USD / zapytanie','0,008 USD; kontekst medium.'),('editorIn','Redakcja: tokeny wejściowe','12 000 na wpis.'),('editorOut','Redakcja: tokeny wyjściowe','4 000 na wpis.'),('editorInputPrice','Sonnet: USD / 1 mln wejścia','Sonnet 4.6: 3 USD.'),('editorOutputPrice','Sonnet: USD / 1 mln wyjścia','Sonnet 4.6: 15 USD.')]:main+=field(key,label,hint)
main+='</div></details><p class="form-note">Godziny techniczne nie obejmują produkcji wpisów. Koszt pracy wpisu jest liczony raz. Redakcja w Claude Code nie dostaje drugiej opłaty Sonnet API; wariant API tę opłatę dodaje.</p></form><p id="calcError" class="calc-error" role="alert"></p><p id="scopeStatus"></p><div class="grid-3">'
main+=result('Jeden gotowy wpis','unit','Koszt krańcowy: praca + modele + grafika.')+result('W tym praca człowieka','humanUnit','Bez ponownego doliczania etatu.')+result('W tym API i grafika','apiUnit','Z rezerwą na ponowienia.')
main+='</div><div class="grid-3">'+result('Dodatkowy wpis dla klienta','clientUnit','Z dodatkową obsługą linku i briefu.')+'<article class="result-card"><span class="label">Wrażliwość czasu obsługi</span><div class="result-big" id="unitRange"></div><p class="result-sub">Koszt wpisu przy 10–20 min pracy; pozostałe parametry bez zmian.</p></article>'+result('Wariant górny: 250 zł/rbh','flatUnit','Ten sam wpis, cała praca po stawce operatora, bez zespołu.')+'</div><div class="table-wrap"><table><thead><tr><th>Pozycja</th><th class="num">Bieżący wynik</th><th>Zakres</th></tr></thead><tbody>'
for label,key,note in [('Portal: start','startupPerPortal','Techniczne uruchomienie + domena rok 1 + wpisy startowe.'),('Portal: miesiąc','monthlyPerPortal','Obsługa + nowe wpisy + dodatkowe publikacje dla klientów + hosting.'),('Portal: 12 miesięcy, koszt dodatkowy','marginalYear','Start + 12 miesięcy; bez istniejącej warstwy wspólnej.'),('Portal: pełny koszt pierwszych 12 miesięcy','allocatedYear','Z udziałem w całym koszcie wspólnym.'),('Sieć: CAPEX','capex','Uruchomienie całej sieci i wspólnego procesu.'),('Sieć: OPEX miesięczny','opex','Pełna sieć, praca i wydatki.'),('Sieć: pierwsze 12 miesięcy','annual','CAPEX + 12 × OPEX.'),('Sieć: wydatki zewnętrzne w roku','annualCash','Modele, grafiki, subskrypcje, domeny i infrastruktura.'),('Sieć: wartość pracy wewnętrznej w roku','annualLabor','Koszt nakładu pracowników przy zadanej stawce.'),('Skuteczny portal: pełny koszt roku','perSuccess','Cały koszt sieci podzielony przez oczekiwaną liczbę skutecznych portali.')]:main+=f'<tr><td>{label}</td><td class="num" data-money="{key}">{zl(data["b"][key])}</td><td>{note}</td></tr>'
main+='''</tbody></table></div><p>Praca na start: <strong data-number="setupHours"></strong> h, czyli około <strong data-number="setupMonths"></strong> mies. przy pełnej dostępności zespołu <strong data-number="capacityHours"></strong> h/mies. i bez pracy bieżącej; realny kalendarz rolloutu jest dłuższy. Praca miesięczna całej sieci: <strong data-number="monthlyHours"></strong> h, czyli <strong id="fte"></strong> etatu przy 160 h/mies. Wpisy startowe: <strong data-number="initialArticleCount"></strong>; nowe miesięcznie: <strong data-number="monthlyArticleCount"></strong>.</p>
<div class="table-wrap"><table><thead><tr><th>Pracownik</th><th>Udział</th><th>h/mies. projektu</th><th>Praca / mies.</th><th>Dostępność</th></tr></thead><tbody id="employeeResults"></tbody></table></div><p id="teamStatus" class="note"></p>
<p id="capacityStatus" class="note"></p><p class="calc-meta">Kwoty bez doliczania VAT. Pierwszy rok oznacza uruchomienie i 12 pełnych miesięcy pracy całej sieci, nie kalendarzowy rollout. Praca wewnętrzna nie oznacza nowego przelewu, ale ma wartość kosztową. Wydatki i praca razem tworzą pełny koszt.</p>
<div class="actions"><button class="btn primary" id="csvBtn" type="button">Pobierz CSV</button><button class="btn" id="snapshotBtn" type="button">Zapisz tę wersję HTML</button><button class="btn" id="resetBtn" type="button">Przywróć założenia profilu</button></div>
</div></section>
<section><div class="wrap">'''+head('03 · ceny i jednostki','Skąd bierze się koszt modeli?','Cenniki odczytane 15.09.2026. Tokeny i rezerwa 25% są założeniami tego kosztorysu.')+'''
<div class="table-wrap"><table><thead><tr><th>Etap</th><th>Cena dostawcy</th><th>Budżet jednego wpisu</th></tr></thead><tbody>
<tr><td>Gemini 3.5 Flash</td><td>1,50 USD / 1 mln wejścia; 9 USD / 1 mln wyjścia</td><td>16 tys. wejścia + 8 tys. wyjścia = 0,096 USD. <a href="https://ai.google.dev/gemini-api/docs/pricing">Google</a></td></tr>
<tr><td>Sonar: research + fact-check</td><td>1 USD / 1 mln wejścia i wyjścia; 0,008 USD / zapytanie medium</td><td>12 tys. + 4 tys. tokenów, 2 zapytania = 0,032 USD. <a href="https://docs.perplexity.ai/docs/getting-started/pricing">Perplexity</a></td></tr>
<tr><td>Sonnet 4.6: redakcja</td><td>3 USD / 1 mln wejścia; 15 USD / 1 mln wyjścia</td><td>12 tys. + 4 tys. = 0,096 USD wyłącznie w wariancie API. <a href="https://platform.claude.com/docs/en/about-claude/pricing">Anthropic</a></td></tr>
<tr><td>Nano Banana 2 · Kie.ai</td><td>1K 0,04 USD · 2K 0,06 USD · 4K 0,09 USD</td><td>Domyślnie 1 obraz 1K. <a href="https://kie.ai/nano-banana-2">Kie.ai</a></td></tr>
<tr><td>GPT Image 2 · Kie.ai</td><td>1K 0,03 USD · 2K 0,05 USD · 4K 0,08 USD</td><td>Alternatywa dla Nano Banana, nie druga grafika. <a href="https://kie.ai/gpt-image-2">Kie.ai</a></td></tr>
</tbody></table></div>
<p class="formula">API wpisu = (szkic + research/fact-check + redakcja API, jeśli wybrana + grafiki) × (1 + rezerwa) × kurs<br>Wpis = API wpisu + minuty człowieka / 60 × stawka<br>Start portalu = uruchomienie techniczne × stawka + domena + liczba wpisów startowych × koszt wpisu<br>Miesiąc portalu = obsługa techniczna × stawka + hosting + nowe wpisy × koszt wpisu + dodatkowe wpisy klienta × ich koszt<br>Pełny rok sieci = wspólny start + N × start portalu + 12 × (koszty wspólne miesiąca + N × miesiąc portalu)</p>
<p class="assume">Cennik przyjęto konserwatywnie: Gemini 3.6–3.8 Flash kosztują 0,75/3,75 USD do końca 2026 (potem 1,50/7,50), a Sonnet 5 2/10 USD na stałe. Tańsze modele obniżają API wpisu o kilkadziesiąt groszy; nie zmienia to obrazu, bo koszt wpisu to w ponad 95% praca człowieka.</p>
<p class="assume">Przykład dotyczy wpisu około 1 200–1 800 słów z grafiką i kontrolą źródeł. Dłuższa treść, trudny temat lub więcej korekt podnoszą tokeny i czas operatora. Dodatkowe zapytania wyszukiwarki poza Sonar, prowizje pośredników i przewalutowania nie są osobnymi pozycjami domyślnymi; należy ująć je w parametrach/rezerwie, jeśli wystąpią. Nie zakładamy bezpłatnych kredytów ani promocyjnych limitów.</p>
</div></section>
<section><div class="wrap">'''+head('04 · zakres i skala','B i C różnią się organizacją produkcji.','Poniższe profile są założeniami planistycznymi. Można je zmienić w kalkulatorze.')+'''
<div class="table-wrap"><table><thead><tr><th>Blok pracy</th><th>B · premium</th><th>C · skala</th></tr></thead><tbody>
<tr><td>Nisza, silosy, plan i konfiguracja portalu</td><td>8 h na portal</td><td>3 h na portal po standaryzacji</td></tr>
<tr><td>Treści i publikacja</td><td>100 wpisów × 15 min = 25 h na portal, potem 10 wpisów/mies. = 2,5 h. Grafika, fact-check, QA i publikacja w czasie wpisu.</td><td>60 wpisów × 2 min = 2 h na portal, potem 6 wpisów/mies. Publikacja bez czytania; człowiek obsługuje wyjątki z automatu, jakość kontroluje próbka w nadzorze wspólnym.</td></tr>
<tr><td>Wspólna architektura, pipeline, dostęp</td><td>36 h: po 12 h na architekturę, skrypty, monitoring i dostęp (ostatni blok razem)</td><td>240 h: architektura 36 h, pipeline 96 h, panel 108 h</td></tr>
<tr><td>Obsługa techniczna i nadzór</td><td>1 h/portal/mies. + 6 h wspólnego nadzoru</td><td>0,25 h/portal/mies. + 98 h: 18 h nadzoru i ok. 80 h próbkowej kontroli jakości (pół etatu redaktora QA)</td></tr>
<tr><td>Integracja linkowania</td><td colspan="2">Linkowanie wewnętrzne i integracja z obecnym procesem w uruchomieniu; treści dla klientów liczone per publikacja.</td></tr>
<tr><td>Hosting, narzędzia i automatyzacja</td><td>Pages obecnie 0 zł; narzędzia researchu 180 zł/mies.</td><td>Rezerwa 200 zł/mies. na wspólną infrastrukturę (wymaga projektu architektury) + 2 500 zł/mies. wyższych pakietów Senuto/SerpData.</td></tr>
<tr><td>Poza modelem</td><td colspan="2">Newsy z automatu (w skrócie z 04.09: 30/mies. na portal po ok. 0,6 zł), recykling treści co 6 mies. (Content Watcher), odnowienia domen od roku 2, drugi seat Claude dla juniora, sędzia jakości LLM w C. Każda z tych pozycji jest poniżej 5% wyniku, ale razem podnoszą OPEX o kilka procent.</td></tr>
<tr><td>Wyłączenia</td><td colspan="2">Migracja starej sieci, premium za wygasłe domeny, zewnętrzne kontrakty SEO, niestandardowe funkcje i pełny wolumen starej sieci około 7 000 tekstów/mies. Scenariusz A wycenia Michał.</td></tr>
</tbody></table></div>
<p class="note">Wcześniejsze widełki godzinowe obejmowały niesprecyzowany zakres treści. Zastępujemy je modelem: praca techniczna + rzeczywista liczba wpisów × czas obsługi. Nie dodajemy kosztu 100 wpisów drugi raz do dawnego szacunku całego portalu.</p>
<div class="grid-2"><article class="card"><h3>Krzywa kosztu ma warunek.</h3><p>BusManiak: 52,2 h raportowanej pracy obejmuje również późniejsze zmiany; pełny koszt portalu nr 1 to ok. 110 h (skrót z 04.09). Nie jest to pomiar samego uruchomienia porównywalny 1:1.</p><p>B: 8 h konfiguracji + 25 h treści = 33 h na portal. C: 3 h + 2 h = 5 h, ale wyłącznie przy 2 min na wpis. Jeżeli zarząd wymaga czytania każdego tekstu przez człowieka, C liczy się jak B z tańszą konfiguracją: portal C w roku kosztuje wtedy ok. 70% portalu B zamiast ułamka i scenariusz C nie istnieje. Sprawdź to w kalkulatorze, ustawiając w C 15 min.</p></article>
<article class="card"><h3>Obsada i zarządzanie</h3><p>Baza liczy zespół z briefu: senior/operator (Mateusz) i 1 etat juniora SEO uczonego pracy z Claude Code. Junior przejmuje 3/4 godzin od miesiąca 3; wcześniej praca idzie po stawce seniora, co pokazuje wariant górny.</p><p>Panel C to 108 h, ujęte we wspólnych 240 h. Przejście B → C wymaga odjęcia ponownie użytej pracy. Etap uruchamiania wymaga dodatkowej pojemności ponad miesięczny nakład; liczba miesięcy przy pełnej dostępności jest w kalkulatorze.</p></article></div>
<p class="assume">Trafialność 30%, 50% i 70% to scenariusze, nie prognoza oparta na jednym sukcesie. Ocena po około 6 miesiącach. Założenie z wcześniejszej koncepcji: pierwsze linki dla klienta po 90 dniach i minimum 12 artykułach; miesięczny wolumen klienta w kalkulatorze dotyczy normalnej pracy dojrzałej sieci. Rollout z takim opóźnieniem będzie miał inny rozkład wydatków.</p>
</div></section>
<section><div class="wrap">'''+head('05 · krzywa kosztu i obsada','Portal numer 1, 10 i 100.','Pozycje 6 i 8 briefu. Portal 1 z pomiaru BusManiaka (skrót z 04.09); portal 10 i 100 z ustawień bazowych tego kalkulatora, bez udziału w kosztach wspólnych.')+f'''
<div class="table-wrap"><table><thead><tr><th>Portal</th><th>Godziny w 12 mies.</th><th>API, grafiki, domena</th><th class="num">Koszt w 12 mies.</th><th>Co musi być prawdą</th></tr></thead><tbody>
<tr><td>Numer 1 (BusManiak)</td><td>≈ 110</td><td>≈ 400 zł</td><td class="num">≈ 20 000 zł</td><td>znamy; 52,2 h w tickecie + proces, skrypty, motyw, redakcja</td></tr>
<tr><td>Numer 10 (B, baza)</td><td>≈ {pl(hours('b'))} ({pl(data['b']['effectiveRate'])} zł/rbh średnio)</td><td>≈ {zl(cash('b'))}</td><td class="num">{zl(data['b']['marginalYear'])}</td><td>CAPEX B zrobiony, junior samodzielny od miesiąca 3. Przy 250 zł/rbh dla całej pracy: {zl(flat_year('b'))}</td></tr>
<tr><td>Numer 100 (C, baza)</td><td>≈ {pl(hours('c'))}</td><td>≈ {zl(cash('c'))}</td><td class="num">{zl(data['c']['marginalYear'])}</td><td>fabryka, panel i bramki jakości działają; publikacja bez oka człowieka. Z udziałem kosztów wspólnych: {zl(data['c']['allocatedYear'])}</td></tr>
<tr><td>Numer 300</td><td>jak 100</td><td>jak 100</td><td class="num">{zl(data['c']['marginalYear'])}</td><td>od portalu 100 krzywa jest płaska</td></tr>
</tbody></table></div>
<div class="table-wrap"><table><thead><tr><th>Rola</th><th>Scenariusz B</th><th>Scenariusz C (ponad B)</th><th>Od kiedy</th></tr></thead><tbody>
<tr><td>Senior, architekt (Mateusz)</td><td>1/4 godzin projektu; w rozruchu więcej, bo junior się uczy</td><td>75–100% w miesiącach 7–14: architektura C, pipeline, panel</td><td>teraz</td></tr>
<tr><td>Junior SEO uczony pracy z Claude Code</td><td>1 etat (9 000 zł/mies. pełnego kosztu): 3/4 godzin projektu; własny seat Claude</td><td>2 etaty, ok. 125 portali na osobę z panelu</td><td>rekrutacja we wrześniu, samodzielność od miesiąca 3</td></tr>
<tr><td>Dev (ICEA lub zewnętrzny)</td><td>nie</td><td>panel i hosting poza limitem Pages: 108 h panelu w 240 h wspólnych; kolejka i hosting dodatkowo</td><td>po decyzji o C</td></tr>
<tr><td>Redaktor QA</td><td>nie, robi junior</td><td>pół etatu: próbka 1 na 10, eskalacje z automatu (80 h w nadzorze wspólnym)</td><td>miesiąc 10</td></tr>
</tbody></table></div>
<p class="assume">Godziny na start całej sieci (w kalkulatorze) nie są rozłożone w kalendarzu. B: {pl(data['b']['setupHours'])} h to ok. {pl(data['b']['setupMonths'])} mies. pełnej dostępności zespołu 320 h/mies.; z pracą bieżącą i nauką juniora realny rollout B to 6–9 miesięcy. Ryzyko obsady, nie budżetu: jeśli junior nie przejmie produkcji do miesiąca 4, koszt zbliża się do wariantu górnego.</p>
</div></section>
<section><div class="wrap">'''+head('06 · ograniczenia i decyzja','Limity są częścią planu produkcji.')+'''
<div class="grid-2"><article class="card"><h3>Claude i API</h3><p>Obecna subskrypcja Claude kosztuje 100 USD miesięcznie niezależnie od momentu uruchomienia portalu. Claude i Claude Code mają wspólne limity. Promocja wykorzystana przy BusManiaku nie jest podstawą planowania skali.</p><p>W profilu B redakcję rozliczamy w abonamencie. W C płatne API obsługuje także redakcję, a abonament pozostaje narzędziem operatora. Automatyzacja ma własne limity i wymaga kontroli błędów. <a href="https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan">Zasady Anthropic</a>.</p></article>
<article class="card"><h3>Cloudflare przy 200–300 portalach</h3><p>Pages ma limit 100 projektów na konto i 500 buildów miesięcznie na Free. Przy jednym projekcie na portal C wymaga innej architektury. Dokumentacja wskazuje Workers Static Assets albo Workers for Platforms.</p><p>Publikacje można grupować w buildy. Płatny plan Pages sam nie zwiększa limitu projektów. Rezerwa 200 zł/mies. nie jest gwarancją wystarczającego budżetu; sprawdzamy ją na wybranej architekturze. <a href="https://developers.cloudflare.com/pages/platform/limits/">Limity Cloudflare</a>.</p></article></div>
</div></section></main>
<footer class="footer"><div class="wrap"><h2>Najpierw pomiar kosztu jednego wpisu.</h2><p>Przyjęte 15 min na wpis i budżet tokenów należy zweryfikować na próbce 10–20 tekstów. Zapis rzeczywistego czasu operatora i zużycia modeli pozwoli zmienić kilka pól zamiast budować kosztorys od nowa.</p><p class="sources">Podstawa: brief BWP 2.0, skrót kosztorysu z 04.09 i ustalenia z Mateuszem. Stawka 250 zł/rbh operatora oraz około 100 wpisów na start w B są potwierdzone. Zespół senior + junior, 10 wpisów/mies. w B oraz 2 min na wpis w C są założeniami do obrony na przeglądzie. Ceny modeli mają odnośniki w tabeli. Pozostałe liczby są opisanymi założeniami planistycznymi, nie historycznymi wydatkami.</p></div></footer>
'''
scripts='\n<script>\n'+(ROOT/'cost-model.js').read_text(encoding='utf-8')+'\n</script>\n<script>\n'+(ROOT/'calculator-ui.js').read_text(encoding='utf-8')+'\n</script></body></html>'
OUT.write_text(shell+main+scripts,encoding='utf-8')
print(json.dumps({'html':str(OUT),'defaultUnitB':data['b']['unit'],'defaultUnitC':data['c']['unit'],'B':data['b'],'C':data['c']},ensure_ascii=False))
