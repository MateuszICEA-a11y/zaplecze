const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
(async()=>{
 const targets=await(await fetch('http://127.0.0.1:9347/json')).json();
 const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 async function navigate(file){
   const loaded=new Promise(resolve=>{const h=e=>{if(JSON.parse(e.data).method==='Page.loadEventFired'){ws.removeEventListener('message',h);resolve();}};ws.addEventListener('message',h);});
   await send('Page.navigate',{url:pathToFileURL(path.join(__dirname,file)).href});await loaded;
   await evaluate('Promise.all([...document.images].map(i=>i.decode()))');
 }
 await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await navigate('kosztorys-bwp-2026-09-15.html');
 console.log(await evaluate(`(async()=>{
 const $=id=>document.getElementById(id),money=k=>document.querySelector('[data-money="'+k+'"]').textContent.replace(/\\s/g,'');
 const check=(ok,label)=>{if(!ok)throw Error(label);},set=(el,v)=>{el.value=v;el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));};
 check($('calcError').textContent==='','Initial render');check(money('unit')==='27,01zł','Base unit');check(money('annual')==='140311,69zł','Base annual');check(money('flatUnit')==='63,34zł','Flat-rate variant');check(document.querySelectorAll('.employee').length===2,'Two default employees');
 check($('teamStatus').textContent.startsWith('Miesięczny nakład mieści'),'Startup cannot trigger monthly overload');
 const capex=money('capex');set($('monthlyPosts'),2);check(money('capex')===capex,'Monthly count leaves CAPEX');check(money('opex')==='3588,79zł','Regular post decrement');set($('monthlyPosts'),10);
 set($('clientPosts'),1);check(money('opex')==='7497,12zł','Client post increment');set($('clientPosts'),0);
 $('addEmployee').click();let second=$('employeeList').children[2];set(second.querySelector('[data-employee="cost"]'),100);
 check(money('effectiveRate')==='103,75zł','Three different rates');check(money('unit')==='26,78zł','Weighted unit');
 set(second.querySelector('[data-employee="costType"]'),'monthly');set(second.querySelector('[data-employee="cost"]'),16000);check(money('effectiveRate')==='103,75zł','Monthly conversion');
 set($('imageModel'),'gpt');check(money('unit')==='26,73zł','Image price');set($('scenario'),'C');check($('employeeList').children.length===3,'Keep employees');check(money('unit')==='4,73zł','Profile C: 2 min + API');check($('articleMinutes').value==='2'&&$('toolsMonthly').value==='2500','Profile C fields');
 set($('portals'),'');check($('csvBtn').disabled&&money('annual')==='—','Blank invalid');set($('portals'),250);
 set(second.querySelector('[data-employee="availableHours"]'),0);check($('csvBtn').disabled,'Zero availability invalid');set(second.querySelector('[data-employee="availableHours"]'),160);
 const orig=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;window.__downloadBlobs=[];
 URL.createObjectURL=blob=>{window.__downloadBlobs.push(blob);return orig(blob);};HTMLAnchorElement.prototype.click=function(){};
 $('csvBtn').click();$('snapshotBtn').click();URL.createObjectURL=orig;HTMLAnchorElement.prototype.click=click;
 const csv=await window.__downloadBlobs[0].text();check(csv.includes('Pracownik 3 cost')&&csv.includes('CAPEX')&&csv.includes('16000')&&csv.includes('wariant górny'),'CSV content');
 return {checks:'passed',snapshotAnnual:money('annual')};})()`));
 fs.writeFileSync(path.join(__dirname,'qa-snapshot.html'),await evaluate('window.__downloadBlobs[1].text()'));
 const expected=await evaluate('document.querySelector(\'[data-money="annual"]\').textContent');
 await navigate('qa-snapshot.html');assert.equal(await evaluate('document.querySelector(\'[data-money="annual"]\').textContent'),expected);
 assert.equal(await evaluate('document.querySelectorAll(".employee").length'),3);assert.equal(await evaluate('document.getElementById("scenario").value'),'C');
 console.log('CSV + HTML round trip passed');await navigate('kosztorys-bwp-2026-09-15.html');
 for(const [label,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:label==='mobile'});
   assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,label+' overflow');
   await evaluate('document.documentElement.style.scrollBehavior="auto";window.scrollTo(0,document.getElementById("teamEditor").getBoundingClientRect().top+window.scrollY-20)');
   fs.writeFileSync(path.join(__dirname,label+'.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await evaluate('window.dispatchEvent(new Event("beforeprint"))');
 fs.writeFileSync(path.join(__dirname,'kosztorys-bwp-2026-09-15.pdf'),Buffer.from((await send('Page.printToPDF',{printBackground:true,preferCSSPageSize:true})).data,'base64'));
 await evaluate('window.dispatchEvent(new Event("afterprint"))');console.log('Desktop/mobile + PDF exported');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
