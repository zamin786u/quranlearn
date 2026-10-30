/* Quran Learn: core app. Everything is offline; data comes from js/data-*.js */
"use strict";
var APP_VERSION="1.0.0";
var $=function(i){return document.getElementById(i)};
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function ld(k,d){try{var v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}}
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function ico(n,c){return'<svg'+(c?' class="'+c+'"':'')+'><use href="#i-'+n+'"/></svg>'}
function indic(n){return String(n).replace(/\d/g,function(d){return"٠١٢٣٤٥٦٧٨٩"[d]})}

/* ---------- Quran data (Tanzil text, never typed in) ---------- */
function parse(txt){var m={};txt.split("\n").forEach(function(l){var x=/^(\d+)\|(\d+)\|(.+)$/.exec(l);if(x)m[x[1]+":"+x[2]]=x[3]});return m}
var Q={ar:parse(RAW.ar),ur:parse(RAW.ur),en:parse(RAW.en),sd:parse(RAW.sd)};
var cnt={ar:0};for(var _k in Q.ar)cnt.ar++;
RAW=null;
var NA=[0];(function(){for(var s=1;s<=114;s++){var n=0;while(Q.ar[s+":"+(n+1)])n++;NA[s]=n}})();
var TN={ur:"Urdu",en:"English",sd:"Sindhi"};
var TCRED={ur:"Fateh Muhammad Jalandhry",en:"Saheeh International",sd:"Taj Mehmood Amroti"};

/* Tanzil puts the Bismillah in front of Ayah 1 of most surahs. It is shown once as a heading, so it is
   removed from the Ayah 1 display only (not for Al-Fatihah, where it is Ayah 1, nor At-Tawbah). */
var BIS=(function(){var w=Q.ar["1:1"];return w})();
function AT(s,n){
  var t=Q.ar[s+":"+n];
  if(n!==1||s===1||s===9||!t)return t;
  var w=t.split(" "),k=w[0].replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,"");
  return(k==="بسم"&&w.length>4)?w.slice(4).join(" "):t;
}
function sname(s){return SM[s-1][1]}

/* ---------- state ---------- */
var st={theme:ld("ql_theme","system"),size:ld("ql_size",1.9),tr:ld("ql_tr",["ur"]),last:ld("ql_last",null)};
var saved=ld("ql_saved",[]),curS=1;
function sysDark(){
  try{if(window.Android&&Android.isDark)return !!Android.isDark()}catch(e){}
  return !!(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches);
}
function applyTheme(){
  var t=st.theme;
  if(t==="system")t=sysDark()?"dark":"light";
  document.documentElement.setAttribute("data-theme",t);
  document.documentElement.style.setProperty("--sz",st.size+"rem");
}
try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",applyTheme)}catch(e){}
document.addEventListener("visibilitychange",applyTheme);
applyTheme();

function isSaved(id){return saved.some(function(x){return x.id===id})}
function toggle(item){
  if(isSaved(item.id))saved=saved.filter(function(x){return x.id!==item.id});else saved.push(item);
  sv("ql_saved",saved);
}
var tt;function toast(m){var t=$("toast");t.textContent=m;t.classList.add("on");clearTimeout(tt);tt=setTimeout(function(){t.classList.remove("on")},1800)}
function copyText(t){
  try{
    var a=document.createElement("textarea");a.value=t;a.style.cssText="position:fixed;opacity:0";document.body.appendChild(a);a.select();
    var ok=document.execCommand("copy");document.body.removeChild(a);return ok;
  }catch(e){return false}
}
function ayahText(s,n){
  var t=AT(s,n)+" ﴿"+indic(n)+"﴾\n";
  st.tr.forEach(function(l){if(Q[l][s+":"+n])t+="\n"+Q[l][s+":"+n]});
  return t+"\n— "+sname(s)+" "+s+":"+n+" (Quran Learn)";
}

/* ---------- router ---------- */
var TABS={home:"home",quran:"quran",read:"quran",search:"quran",learn:"learn",grammar:"learn",quiz:"learn",assistant:"learn",saved:"saved",settings:"settings"};
var TITLES={home:"Quran Learn",quran:"Quran",search:"Search",learn:"Learn",grammar:"Arabic Grammar",quiz:"Test & Quiz",assistant:"Learning Assistant",saved:"Saved",settings:"Settings"};
var MAIN={home:1,quran:1,learn:1,saved:1,settings:1};
var VIEW={home:drawHome,quran:drawQuran,read:drawRead,search:drawSearch,saved:drawSaved,settings:drawSettings,
  quiz:function(){startQuiz(false)},learn:function(){},grammar:function(){},assistant:function(){}};
var scrollMem={},curKey="";
function go(n,replace){
  var h="#/"+n;
  if(h===location.hash){route();return}
  if(replace)location.replace(h);else location.hash=h;
}
function route(){
  var h=(location.hash||"#/home").slice(2),p=h.split("/"),name=p[0];
  if(!VIEW[name]){name="home";p=["home"];h="home"}
  if(curKey)scrollMem[curKey]=window.scrollY;
  curKey=h;
  document.querySelectorAll(".scr").forEach(function(s){s.classList.toggle("on",s.id===name)});
  document.querySelectorAll("nav button").forEach(function(b){b.setAttribute("aria-current",b.dataset.tab===TABS[name]?"page":"false")});
  $("back").hidden=!!MAIN[name];
  $("hsearch").hidden=(name==="search");
  $("ttl").textContent=TITLES[name]||"Quran Learn";
  VIEW[name](p);
  if(name!=="read")window.scrollTo(0,scrollMem[h]||0);
}
window.addEventListener("hashchange",route);
$("back").onclick=function(){if(history.length>1)history.back();else go("home",true)};
$("hsearch").onclick=function(){go("search")};
document.addEventListener("click",function(e){
  var t=e.target.closest("[data-go]");if(t){go(t.dataset.go);return}
  t=e.target.closest("[data-tab]");if(t)go(t.dataset.tab,true);
});

/* ---------- Home ---------- */
function dayIndex(){var d=new Date();return Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()))/864e5)}
function greet(){var h=new Date().getHours();return h<5?"Peace be with you":h<12?"Good morning":h<17?"Good afternoon":"Good evening"}
function drawHome(){
  var L=st.last,r=DAILY[dayIndex()%DAILY.length],ds=r[0],dn=r[1];
  var h='<div class="hero"><small>'+greet()+'</small><h2>Assalamu alaikum</h2><div class="bis" lang="ar">'+esc(BIS)+'</div>';
  if(L&&Q.ar[L.s+":"+L.a])h+='<button class="resume" data-read="'+L.s+"/"+L.a+'"><div><div class="l1">Continue reading</div><div class="l2">'+esc(sname(L.s))+" · Ayah "+L.a+'</div></div>'+ico("next")+'</button>';
  else h+='<button class="resume" data-read="1/1"><div><div class="l1">Start reading</div><div class="l2">Al-Fatihah · The Opening</div></div>'+ico("next")+'</button>';
  h+='</div><div class="tiles">'+
   '<button class="tile" data-go="quran"><span class="ar">القرآن</span><b>Quran</b><span class="s">114 surahs, offline</span></button>'+
   '<button class="tile" data-go="search"><span class="ar">بحث</span><b>Search</b><span class="s">Arabic, Urdu, English, Sindhi</span></button>'+
   '<button class="tile" data-go="learn"><span class="ar">تعلّم</span><b>Learn</b><span class="s">Grammar, quiz, assistant</span></button>'+
   '<button class="tile" data-go="saved"><span class="ar">المحفوظات</span><b>Saved</b><span class="s">'+saved.length+' item'+(saved.length===1?"":"s")+'</span></button></div>';
  var tl=st.tr[0]||"ur";
  h+='<div class="box dayc"><div class="lab">Ayah of the day</div><div class="ay" lang="ar" dir="rtl">'+esc(AT(ds,dn))+' <span class="end">﴿'+indic(dn)+'﴾</span></div>'+
   (Q[tl][ds+":"+dn]?'<div class="tr '+tl+'" '+(tl==="en"?"":'dir="rtl" lang="'+tl+'"')+'>'+esc(Q[tl][ds+":"+dn])+'</div>':"")+
   '<div class="row sp"><span class="tx"><b>'+esc(sname(ds))+" "+ds+":"+dn+'</b></span><button class="b sm" data-read="'+ds+"/"+dn+'">Read in context</button></div></div>';
  $("home").innerHTML=h;
}
document.addEventListener("click",function(e){var t=e.target.closest("[data-read]");if(t)go("read/"+t.dataset.read)});

/* ---------- Surah / Juz list ---------- */
var listMode=ld("ql_mode","S");
function drawQuran(){
  $("tS").classList.toggle("on",listMode==="S");$("tJ").classList.toggle("on",listMode==="J");
  var f=$("sflt");f.hidden=listMode!=="S";
  var h="";
  if(st.last&&Q.ar[st.last.s+":"+st.last.a])h+='<button class="sr" data-read="'+st.last.s+"/"+st.last.a+'" style="border-color:var(--gold)"><div class="nm"><small>Last read</small><b>'+esc(sname(st.last.s))+" · Ayah "+st.last.a+'</b></div>'+ico("next")+'</button>';
  if(listMode==="S"){
    var q=f.value.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06ff ]/g,""),c=0;
    for(var s=1;s<=114;s++){
      var m=SM[s-1];
      if(q&&String(s)!==q&&(m[1]+" "+m[2]).toLowerCase().replace(/[^a-z0-9 ]/g,"").indexOf(q)<0&&m[0].indexOf(q)<0)continue;
      c++;
      h+='<button class="sr" data-read="'+s+'/1"><span class="num"><span>'+s+'</span></span><span class="nm"><b>'+esc(m[1])+'</b><small>'+esc(m[2])+' · '+NA[s]+' ayat<span class="pl">'+(m[3]==="M"?"Meccan":"Medinan")+'</span></small></span><span class="arn" lang="ar">'+esc(m[0])+'</span></button>';
    }
    if(!c)h+='<div class="empty">No surah matches “'+esc(f.value)+'”.</div>';
  }else{
    JUZ.forEach(function(j,i){
      h+='<button class="sr" data-read="'+j[0]+"/"+j[1]+'"><span class="num"><span>'+(i+1)+'</span></span><span class="nm"><b>Juz '+(i+1)+'</b><small>Starts: '+esc(sname(j[0]))+' '+j[0]+':'+j[1]+'</small></span><span class="arn" lang="ar">'+esc(SM[j[0]-1][0])+'</span></button>';
    });
  }
  $("slist").innerHTML=h;
}
$("tS").onclick=function(){listMode="S";sv("ql_mode",listMode);drawQuran()};
$("tJ").onclick=function(){listMode="J";sv("ql_mode",listMode);drawQuran()};
$("sflt").addEventListener("input",drawQuran);

/* ---------- Reader ---------- */
var readWanted=0;
function drawRead(p){
  var s=+p[1]||1,a=+p[2]||1;
  if(s<1||s>114)s=1;
  if(a<1||a>NA[s])a=1;
  curS=s;readWanted=a;
  renderReader(s,a,true);
}
function renderReader(s,a,mark){
  var m=SM[s-1],n=NA[s];
  $("ttl").textContent=m[1];
  var h='<div class="tools">';
  ["ur","en","sd"].forEach(function(l){h+='<button class="chip'+(st.tr.indexOf(l)>-1?" on":"")+'" data-tr="'+l+'">'+TN[l]+'</button>'});
  h+='<button class="chip" data-sz="-1" aria-label="Smaller text">A−</button><button class="chip" data-sz="1" aria-label="Larger text">A+</button>';
  h+='<select id="jump" aria-label="Go to ayah number" title="Go to ayah">';
  for(var i=1;i<=n;i++)h+='<option value="'+i+'"'+(i===a?" selected":"")+'>'+i+'</option>';
  h+='</select></div>';
  h+='<div class="sban"><div class="arn" lang="ar">'+esc(m[0])+'</div><b>'+esc(m[1])+'</b><small>'+esc(m[2])+' · '+(m[3]==="M"?"Meccan":"Medinan")+' · '+n+' ayat · Surah '+s+'</small></div>';
  if(s!==1&&s!==9)h+='<div class="bism" lang="ar">'+esc(BIS)+'</div>';
  for(var k=1;k<=n;k++){
    var id="a:"+s+":"+k,on=isSaved(id);
    h+='<article class="ac" id="a'+k+'" data-n="'+k+'"><div class="ah"><span class="num"><span>'+k+'</span></span><span class="sp"></span>'+
      '<button class="ib'+(on?" on":"")+'" data-act="bm" aria-label="Bookmark">'+ico(on?"mark":"mark-o")+'</button>'+
      '<button class="ib" data-act="cp" aria-label="Copy">'+ico("copy")+'</button>'+
      '<button class="ib" data-act="sh" aria-label="Share">'+ico("share")+'</button>'+
      '<button class="ib" data-act="lr" aria-label="Set as last read">'+ico("pin")+'</button></div>'+
      '<div class="ay" lang="ar" dir="rtl">'+esc(AT(s,k))+' <span class="end">﴿'+indic(k)+'﴾</span></div>';
    st.tr.forEach(function(l){var t=Q[l][s+":"+k];if(t)h+='<div class="tr '+l+'" '+(l==="en"?'lang="en"':'lang="'+l+'" dir="rtl"')+'><span class="tl">'+TN[l]+'</span>'+esc(t)+'</div>'});
    h+='</article>';
  }
  h+='<div class="sn">'+(s>1?'<button class="b alt" data-read="'+(s-1)+'/1">← '+esc(sname(s-1))+'</button>':'')+(s<114?'<button class="b" data-read="'+(s+1)+'/1">'+esc(sname(s+1))+' →</button>':'')+'</div>';
  if(st.tr.length)h+='<p class="tx" style="font-size:.78rem">Translations: '+st.tr.map(function(l){return TN[l]+" – "+TCRED[l]}).join("; ")+' (via Tanzil.net, non-commercial use).</p>';
  $("read").innerHTML=h;
  if(mark){if(a===1)window.scrollTo(0,0);else jumpTo(a,false)}
}
function jumpTo(a,smooth){
  var el=$("a"+a);if(!el)return;
  el.scrollIntoView({block:"start",behavior:smooth?"smooth":"auto"});
  el.classList.add("hl");setTimeout(function(){el.classList.remove("hl")},1600);
}
function topAyah(){
  var els=$("read").querySelectorAll(".ac"),lim=56+66;
  for(var i=0;i<els.length;i++){if(els[i].getBoundingClientRect().bottom>lim)return +els[i].dataset.n}
  return 1;
}
$("read").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  if(t.dataset.tr){
    var l=t.dataset.tr,i=st.tr.indexOf(l);if(i>-1)st.tr.splice(i,1);else st.tr.push(l);
    st.tr.sort(function(x,y){return["ur","en","sd"].indexOf(x)-["ur","en","sd"].indexOf(y)});
    sv("ql_tr",st.tr);var a=topAyah();renderReader(curS,a,true);return;
  }
  if(t.dataset.sz){
    st.size=Math.min(3.4,Math.max(1.4,Math.round((st.size+(+t.dataset.sz)*0.2)*10)/10));sv("ql_size",st.size);applyTheme();return;
  }
  var card=t.closest(".ac");if(!card||!t.dataset.act)return;
  var n=+card.dataset.n,id="a:"+curS+":"+n;
  if(t.dataset.act==="bm"){
    toggle({id:id,type:"ayah",title:sname(curS)+" "+curS+":"+n,body:AT(curS,n)});
    var on=isSaved(id);t.classList.toggle("on",on);t.innerHTML=ico(on?"mark":"mark-o");toast(on?"Bookmarked":"Bookmark removed");
  }else if(t.dataset.act==="cp"){toast(copyText(ayahText(curS,n))?"Copied":"Could not copy")}
  else if(t.dataset.act==="sh"){
    var tx=ayahText(curS,n);
    if(window.Android&&Android.share)Android.share(tx);else toast(copyText(tx)?"Copied to share":"Could not share");
  }else if(t.dataset.act==="lr"){setLast(curS,n);toast("Saved as last read: "+sname(curS)+" "+n)}
});
$("read").addEventListener("change",function(e){if(e.target.id==="jump")jumpTo(+e.target.value,false)});
function setLast(s,a){st.last={s:s,a:a};sv("ql_last",st.last)}
var scrT;
window.addEventListener("scroll",function(){
  if(!$("read").classList.contains("on"))return;
  clearTimeout(scrT);
  scrT=setTimeout(function(){var a=topAyah();if(!st.last||st.last.s!==curS||st.last.a!==a)setLast(curS,a)},700);
},{passive:true});

/* ---------- Search ---------- */
var IDX=null;
function anorm(x){return x.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,"").replace(/[\u0671\u0622\u0623\u0625]/g,"\u0627").replace(/\u0649/g,"\u064A").replace(/\u0629/g,"\u0647").replace(/[ىي]/g,"ي").replace(/ک/g,"ك").replace(/[ہھە]/g,"ه").replace(/ی/g,"ي").toLowerCase()}
function buildIdx(){
  IDX=[];
  for(var s=1;s<=114;s++)for(var a=1;a<=NA[s];a++){
    var k=s+":"+a;
    IDX.push({s:s,a:a,f:{ar:anorm(AT(s,a)),ur:anorm(Q.ur[k]||""),en:(Q.en[k]||"").toLowerCase(),sd:anorm(Q.sd[k]||"")}});
  }
}
var sT;
function drawSearch(){setTimeout(function(){$("sq").focus()},50);if($("sq").value)runSearch()}
$("sq").addEventListener("input",function(){clearTimeout(sT);sT=setTimeout(runSearch,220)});
function runSearch(){
  var raw=$("sq").value.trim(),out=$("sout");
  if(!raw){out.innerHTML="";$("shint").hidden=false;return}
  $("shint").hidden=true;
  var ref=/^(\d{1,3})\s*[:.\-]\s*(\d{1,3})$/.exec(raw);
  if(ref){
    var s=+ref[1],a=+ref[2];
    if(s>=1&&s<=114&&a>=1&&a<=NA[s]){out.innerHTML=resultHtml(s,a,"Reference",null);return}
    out.innerHTML='<div class="empty">No such ayah.</div>';return;
  }
  if(!IDX)buildIdx();
  var toks=anorm(raw).split(/\s+/).filter(Boolean),res=[],hits={ar:0,ur:0,en:0,sd:0},total=0;
  for(var i=0;i<IDX.length;i++){
    var r=IDX[i],tag=null;
    for(var f in r.f){
      var ok=true;for(var t=0;t<toks.length;t++)if(r.f[f].indexOf(toks[t])<0){ok=false;break}
      if(ok){tag=f;break}
    }
    if(tag){total++;if(res.length<50)res.push([r.s,r.a,tag])}
  }
  if(!total){out.innerHTML='<div class="empty">No results for “'+esc(raw)+'”.</div>';return}
  var h='<p class="tx">'+total+' result'+(total===1?"":"s")+(total>50?" (showing the first 50)":"")+'</p>';
  res.forEach(function(x){h+=resultHtml(x[0],x[1],x[2]==="ar"?"Arabic":TN[x[2]],toks)});
  out.innerHTML=h;
}
function hl(text,toks){
  var h=esc(text);
  toks.forEach(function(t){if(!t||/[\u0600-\u06ff]/.test(t))return;try{h=h.replace(new RegExp("("+t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","gi"),"<mark>$1</mark>")}catch(e){}});
  return h;
}
function resultHtml(s,a,tag,toks){
  var k=s+":"+a,h='<button class="sres" data-read="'+s+"/"+a+'"><div class="ref"><span>'+esc(sname(s))+" "+s+":"+a+'</span><span class="tag">'+esc(tag)+'</span></div><div class="ay" lang="ar" dir="rtl">'+esc(AT(s,a))+'</div>';
  var show=st.tr.length?st.tr:["en"];
  show.forEach(function(l){if(Q[l][k])h+='<div class="tr '+l+'" '+(l==="en"?"":'dir="rtl"')+'>'+(toks?hl(Q[l][k],toks):esc(Q[l][k]))+'</div>'});
  return h+'</button>';
}

/* ---------- Saved ---------- */
function drawSaved(){
  var el=$("sv");
  if(!saved.length){el.innerHTML='<div class="empty">Nothing saved yet.<br>Tap the bookmark on any ayah, or save a grammar lesson.</div>';return}
  var h="";
  [["ayah","Ayat"],["lesson","Grammar lessons"]].forEach(function(c){
    var L=saved.filter(function(x){return x.type===c[0]});if(!L.length)return;
    h+="<h3>"+c[1]+" ("+L.length+")</h3>";
    L.forEach(function(x){
      h+='<div class="box"><b>'+esc(x.title)+'</b>'+(x.body?'<div class="'+(x.type==="ayah"?"ay":"tx")+'" '+(x.type==="ayah"?'lang="ar" dir="rtl"':"")+'>'+esc(x.body)+'</div>':"")+
        '<div class="row"><button class="b sm" data-open="'+esc(x.id)+'">Open</button><button class="b sm alt" data-rm="'+esc(x.id)+'">Remove</button></div></div>';
    });
  });
  el.innerHTML=h;
}
$("sv").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  var o=t.dataset.open,r=t.dataset.rm;
  if(r){saved=saved.filter(function(x){return x.id!==r});sv("ql_saved",saved);drawSaved()}
  if(o){var p=o.split(":");if(p[0]==="a")go("read/"+p[1]+"/"+p[2]);else{openLesson(+p[1]);go("grammar")}}
});

/* ---------- Settings ---------- */
function drawSettings(){
  var th=[["system","Auto"],["light","Light"],["sepia","Sepia"],["dark","Dark"]];
  $("settings").innerHTML='<h2>Settings</h2>'+
   '<div class="box"><b>Theme</b><div class="seg3" style="margin-top:10px">'+th.map(function(x){return'<button class="swatch'+(st.theme===x[0]?" on":"")+'" data-th="'+x[0]+'">'+x[1]+'</button>'}).join("")+'</div></div>'+
   '<div class="box"><b>Arabic text size</b><div class="row"><input type="range" id="sz" min="1.4" max="3.4" step="0.1" value="'+st.size+'" aria-label="Arabic text size" style="flex:1"></div><div class="ay" lang="ar" dir="rtl">'+esc(AT(1,2))+'</div></div>'+
   '<div class="box"><b>Translations shown while reading</b><div class="row">'+["ur","en","sd"].map(function(l){return'<button class="chip'+(st.tr.indexOf(l)>-1?" on":"")+'" data-trs="'+l+'">'+TN[l]+'</button>'}).join("")+'</div></div>'+
   '<div class="box"><b>About</b><p class="tx">Quran Learn · version '+APP_VERSION+'. Works fully offline. No account, no ads, no tracking.</p></div>'+
   '<div class="box"><b>Sources</b><p class="tx">Quran text: <a href="https://tanzil.net" target="_blank" rel="noopener">Tanzil.net</a> (Simple, v1.1), Creative Commons Attribution 3.0, kept unchanged. Translations (Tanzil.net, non-commercial use only): Urdu – Fateh Muhammad Jalandhry; English – Saheeh International; Sindhi – Taj Mehmood Amroti.</p></div>'+
   '<div class="box"><b>Privacy</b><p class="tx">This app asks for no permissions and has no internet access. Your bookmarks, settings and quiz scores stay on this phone only.</p></div>'+
   '<button class="b alt" id="reset">Clear all my data</button><div class="ver">Quran Learn '+APP_VERSION+'</div>';
}
var rsT;
$("settings").addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  if(t.dataset.th){st.theme=t.dataset.th;sv("ql_theme",st.theme);applyTheme();drawSettings()}
  if(t.dataset.trs){var l=t.dataset.trs,i=st.tr.indexOf(l);if(i>-1)st.tr.splice(i,1);else st.tr.push(l);st.tr.sort(function(x,y){return["ur","en","sd"].indexOf(x)-["ur","en","sd"].indexOf(y)});sv("ql_tr",st.tr);drawSettings()}
  if(t.id==="reset"){
    if(!t.dataset.arm){t.dataset.arm="1";t.textContent="Tap again to delete everything";clearTimeout(rsT);rsT=setTimeout(function(){drawSettings()},4000);return}
    try{localStorage.clear()}catch(x){}
    st={theme:"system",size:1.9,tr:["ur"],last:null};saved=[];applyTheme();drawSettings();toast("All data cleared");
  }
});
$("settings").addEventListener("input",function(e){if(e.target.id==="sz"){st.size=+e.target.value;sv("ql_size",st.size);applyTheme()}});

function start(){if(location.hash.indexOf("#/")!==0)location.replace("#/home");route()}
