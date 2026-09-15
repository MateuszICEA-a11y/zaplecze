(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('costForm');
  const fields = [...form.querySelectorAll('[data-param]')];
  const money = n => new Intl.NumberFormat('pl-PL', {style:'currency',currency:'PLN',maximumFractionDigits:2}).format(n);
  const num = n => new Intl.NumberFormat('pl-PL',{maximumFractionDigits:2}).format(n);
  let current = null;
  function values() {
    const cfg=Object.fromEntries(fields.map(el => [el.id, el.tagName === 'SELECT' ? el.value : el.value.trim() === '' ? NaN : Number(el.value)]));
    cfg.rate=250;
    cfg.employees=[...$('employeeList').querySelectorAll('.employee')].map(row=>Object.fromEntries([...row.querySelectorAll('[data-employee]')].map(el=>[el.dataset.employee,['name','costType'].includes(el.dataset.employee)?el.value:el.value.trim()===''?NaN:Number(el.value)])));
    return cfg;
  }
  function refresh() {
    try {
      const cfg = values(), r = BwpCost.calculate(cfg);
      current = {cfg,r};
      document.querySelectorAll('[data-money]').forEach(el=>el.textContent=money(r[el.dataset.money]));
      document.querySelectorAll('[data-number]').forEach(el=>el.textContent=num(r[el.dataset.number]));
      $('unitRange').textContent = `${money(r.apiUnit+10/60*r.effectiveRate)}–${money(r.apiUnit+20/60*r.effectiveRate)}`;
      $('employeeCount').textContent=cfg.employees.length;
      $('employeeResults').replaceChildren();
      r.employeeBreakdown.forEach(person=>{
        const tr=document.createElement('tr');
        [person.name,num(person.share*100)+'%',num(person.monthlyHours),money(person.monthlyCost),num(person.availableHours)+' h'+(person.overloaded?' · przekroczona':'')].forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.appendChild(td);});
        $('employeeResults').appendChild(tr);
      });
      $('teamStatus').textContent=r.teamOverloaded?'Przy obecnym podziale zadań co najmniej jedna osoba przekracza dostępne godziny. Zmień udziały pracy, dostępność albo liczebność zespołu. Kwoty pokazują koszt wymaganego nakładu, nie potwierdzoną wykonalność.':'Miesięczny nakład mieści się w dostępności każdej osoby przy zadanym podziale pracy. Uruchomienie wymaga dodatkowo '+num(r.setupHours)+' h pracy zespołu, czyli około '+num(r.setupMonths)+' mies. przy pełnej dostępności '+num(r.capacityHours)+' h/mies. i zerowej pracy bieżącej; realny kalendarz jest dłuższy.';
      $('scopeStatus').textContent = `${cfg.portals} portali × ${cfg.startPosts} wpisów na start; miesięcznie ${cfg.monthlyPosts} zwykłych + ${cfg.clientPosts} dodatkowych wpisów dla klientów na portal. ${cfg.route==='api'?'Redakcja przez płatne API.':'Redakcja w abonamencie Claude.'}`;
      $('capacityStatus').textContent = cfg.portals>100 ? 'Ponad 100 portali: przy jednym projekcie na portal potrzebna jest zmiana architektury Pages. Rezerwa infrastruktury jest założeniem, nie ofertą. '+(cfg.route==='hybrid'?'Pojemność abonamentu Claude dla tej produkcji nie jest potwierdzona.':'API usuwa zależność produkcji od limitu sesji Claude, ale ma własne limity i koszty.') : 'Hosting obecnych portali statycznych: 0 zł. Pojemność abonamentu Claude trzeba zweryfikować poza promocją; koszt dodatkowych subskrypcji można zmienić poniżej.';
      $('fte').textContent=num(r.monthlyHours/160);
      $('calcError').textContent='';
      $('csvBtn').disabled=false;
      $('snapshotBtn').disabled=false;
      $('printBtn').disabled=false;
    } catch (error) {
      current=null;
      document.querySelectorAll('[data-money],[data-number]').forEach(el=>el.textContent='—');
      ['unitRange','scopeStatus','capacityStatus','fte','teamStatus'].forEach(id=>$(id).textContent='—');
      $('employeeResults').replaceChildren();
      $('calcError').textContent='Sprawdź pola: koszty muszą być nieujemne, liczby wpisów i portali całkowite, kurs dodatni, skuteczność 1–100%. Każdy pracownik wymaga nazwy, dodatniej dostępności i wagi udziału. Puste pole nie oznacza zera.';
      $('csvBtn').disabled=true;
      $('snapshotBtn').disabled=true;
      $('printBtn').disabled=true;
    }
  }
  const profileFields=['portals','route','startPosts','monthlyPosts','articleMinutes','launchHours','sharedSetupHours','upkeepHours','sharedUpkeepHours','sharedInfra','toolsMonthly'];
  $('scenario').addEventListener('change',()=>{
    const d=BwpCost.defaults($('scenario').value);
    profileFields.forEach(key=>$(key).value=d[key]);
    refresh();
  });
  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);
  form.addEventListener('submit',event=>event.preventDefault());
  let employeeId=Date.now();
  $('addEmployee').addEventListener('click',()=>{
    const copy=$('employeeList').querySelector('.employee').cloneNode(true);
    const defaults={name:'Pracownik '+($('employeeList').children.length+1),costType:'hourly',cost:250,availableHours:160,weight:1};
    const prefix='employee-'+(++employeeId)+'-';
    copy.querySelectorAll('[data-employee]').forEach(el=>{
      const key=el.dataset.employee, label=copy.querySelector(`label[for="${el.id}"]`);
      el.id=prefix+key;label.htmlFor=el.id;el.value=defaults[key];
    });
    $('employeeList').appendChild(copy);syncRemoveButtons();refresh();
  });
  function syncRemoveButtons(){const rows=$('employeeList').querySelectorAll('.employee');rows.forEach(row=>row.querySelector('.remove-employee').disabled=rows.length===1);}
  $('employeeList').addEventListener('click',event=>{
    if(event.target.matches('.remove-employee')&&$('employeeList').children.length>1){event.target.closest('.employee').remove();syncRemoveButtons();refresh();}
  });
  $('resetBtn').addEventListener('click',()=>{
    const d=BwpCost.defaults($('scenario').value);
    fields.forEach(el=>el.value=d[el.id]);refresh();
  });
  function download(text,type,name){
    const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');
    a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $('csvBtn').addEventListener('click',()=>{
    if(!current)return;
    const rows=[['BWP 2.0 – założenia i wyniki','Wartość'],['Data cenników','2026-09-15']];
    fields.forEach(el=>rows.push([form.querySelector(`label[for="${el.id}"]`).textContent,el.tagName==='SELECT'?el.selectedOptions[0].textContent:el.value]));
    current.cfg.employees.forEach((person,i)=>Object.entries(person).forEach(([key,value])=>rows.push(['Pracownik '+(i+1)+' '+key,value])));
    rows.push(['Średnia stawka zespołu PLN/rbh',current.r.effectiveRate]);rows.push(['Dostępność zespołu h/mies.',current.r.capacityHours]);
    const labels={unit:'Jeden wpis – koszt PLN',flatUnit:'Jeden wpis – wariant górny 250 zł/rbh PLN',setupMonths:'Sieć – miesiące uruchomienia przy pełnej dostępności',apiUnit:'Jeden wpis – API PLN',humanUnit:'Jeden wpis – praca PLN',clientUnit:'Wpis dla klienta – koszt PLN',startupPerPortal:'Portal – uruchomienie PLN',monthlyPerPortal:'Portal – miesiąc PLN',marginalYear:'Portal – rok bez kosztów wspólnych PLN',allocatedYear:'Portal – pełny koszt roku PLN',capex:'Sieć – CAPEX PLN',opex:'Sieć – OPEX miesięczny PLN',annual:'Sieć – koszt roku PLN',annualCash:'Sieć – wydatki zewnętrzne rok PLN',annualLabor:'Sieć – praca wewnętrzna rok PLN',setupHours:'Sieć – godziny startu',monthlyHours:'Sieć – godziny miesięcznie',perSuccess:'Pełny koszt roku na skuteczny portal PLN'};
    Object.entries(labels).forEach(([key,label])=>rows.push([label,String(current.r[key]).replace('.',',')]));
    rows.push(['Horyzont','Uruchomienie + 12 miesięcy działania całej sieci'],['Charakter','Szacunek; ceny bez doliczania VAT; kurs budżetowy. Nie jest ofertą.']);
    download('\ufeff'+rows.map(row=>row.map(v=>{let s=String(v);if(/^[=+@\-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(';')).join('\r\n'),'text/csv;charset=utf-8','bwp-kosztorys-'+current.cfg.scenario+'.csv');
  });
  $('snapshotBtn').addEventListener('click',()=>{
    if(!current)return;
    const copy=document.documentElement.cloneNode(true);
    [...fields,...form.querySelectorAll('[data-employee]')].forEach(el=>{
      const c=copy.querySelector('#'+el.id);
      if(el.tagName==='SELECT') [...c.options].forEach(o=>o.toggleAttribute('selected',o.value===el.value));
      else c.setAttribute('value',el.value);
    });
    download('<!doctype html>\n'+copy.outerHTML,'text/html;charset=utf-8','bwp-kosztorys-'+current.cfg.scenario+'.html');
  });
  let closed=[];
  window.addEventListener('beforeprint',()=>{closed=[...document.querySelectorAll('details:not([open])')];closed.forEach(el=>el.open=true);});
  window.addEventListener('afterprint',()=>closed.forEach(el=>el.open=false));
  $('printBtn').addEventListener('click',()=>window.print());
  syncRemoveButtons();refresh();
})();
