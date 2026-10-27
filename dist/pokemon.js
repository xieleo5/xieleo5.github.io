'use strict';
(() => {
const companions=[
 {
  "id": "eevee",
  "name": "Eevee",
  "number": "133",
  "zh": "伊布",
  "aliases": [],
  "acquisition": "starter"
 },
 {
  "id": "rowlet",
  "name": "Rowlet",
  "number": "722",
  "zh": "木木枭",
  "aliases": [
   "木木梟"
  ],
  "acquisition": "starter"
 },
 {
  "id": "spheal",
  "name": "Spheal",
  "number": "363",
  "zh": "海豹球",
  "aliases": [],
  "acquisition": "starter"
 },
 {
  "id": "fuecoco",
  "name": "Fuecoco",
  "number": "909",
  "zh": "呆火鳄",
  "aliases": [],
  "acquisition": "starter"
 },
 {
  "id": "ditto",
  "name": "Ditto",
  "number": "132",
  "zh": "百变怪",
  "aliases": [
   "百變怪"
  ],
  "acquisition": "starter"
 },
 {
  "id": "snorlax",
  "name": "Snorlax",
  "number": "143",
  "zh": "卡比兽",
  "aliases": [
   "卡比獸"
  ],
  "acquisition": "starter"
 },
 {
  "id": "fennekin",
  "name": "Fennekin",
  "number": "653",
  "zh": "火狐狸",
  "aliases": [],
  "acquisition": "starter"
 },
 {
  "id": "pikachu",
  "name": "Pikachu",
  "number": "025",
  "zh": "皮卡丘",
  "aliases": [],
  "acquisition": "starter"
 },
 {
  "id": "furret",
  "name": "Furret",
  "number": "162",
  "zh": "大尾立",
  "aliases": [],
  "acquisition": "starter"
 },
 {
  "id": "mimikyu",
  "name": "Mimikyu",
  "number": "778",
  "zh": "谜拟丘",
  "aliases": [
   "謎擬丘",
   "谜拟Q",
   "mimiq"
  ],
  "acquisition": "starter"
 },
 {
  "id": "dondozo",
  "name": "Dondozo",
  "number": "977",
  "zh": "吃吼霸",
  "aliases": [],
  "acquisition": "starter"
 },
 {
  "id": "tatsugiri",
  "name": "Tatsugiri",
  "number": "978",
  "zh": "米立龙",
  "aliases": [
   "米粒龙",
   "米立龍"
  ],
  "acquisition": "starter"
 },
 {
  "id": "koraidon",
  "name": "Koraidon",
  "number": "1007",
  "zh": "故勒顿",
  "aliases": [],
  "acquisition": "starter"
 },
 {
  "id": "serperior",
  "name": "Serperior",
  "number": "497",
  "zh": "君主蛇",
  "aliases": [],
  "acquisition": "starter"
 },
 {
  "id": "charizard",
  "name": "Charizard",
  "number": "006",
  "zh": "喷火龙",
  "aliases": [
   "噴火龍"
  ],
  "acquisition": "starter"
 },
 {
  "id": "comfey",
  "name": "Comfey",
  "number": "764",
  "zh": "花疗环环",
  "aliases": [
   "花療環環"
  ],
  "acquisition": "starter"
 },
 {
  "id": "swablu",
  "name": "Swablu",
  "number": "333",
  "zh": "青绵鸟",
  "aliases": [
   "青綿鳥"
  ],
  "acquisition": "starter"
 },
 {
  "id": "shiny-rayquaza",
  "name": "Shiny Rayquaza",
  "number": "384",
  "zh": "闪光裂空座",
  "aliases": [
   "Rayquaza",
   "裂空座",
   "闪光烈空坐",
   "烈空坐",
   "閃光裂空座"
  ],
  "acquisition": "starter"
 },
 {
  "id": "mareep",
  "name": "Mareep",
  "number": "179",
  "zh": "咩利羊",
  "aliases": [],
  "acquisition": "starter"
 },
 {
  "id": "teddiursa",
  "name": "Teddiursa",
  "number": "216",
  "zh": "熊宝宝",
  "aliases": [],
  "acquisition": "starter"
 },
 {
  "id": "kirlia",
  "name": "Kirlia",
  "number": "281",
  "zh": "奇鲁莉安",
  "aliases": [],
  "acquisition": "starter"
 },
 {
  "id": "pachirisu",
  "name": "Pachirisu",
  "number": "417",
  "zh": "帕奇利兹",
  "aliases": [],
  "acquisition": "starter"
 },
 {
  "id": "azumarill",
  "name": "Azumarill",
  "number": "184",
  "zh": "玛力露丽",
  "aliases": [
   "瑪力露麗"
  ],
  "acquisition": "starter"
 },
 {
  "id": "scizor",
  "name": "Scizor",
  "number": "212",
  "zh": "巨钳螳螂",
  "aliases": [
   "巨鉗螳螂"
  ],
  "acquisition": "starter"
 },
 {
  "id": "whimsicott",
  "name": "Whimsicott",
  "number": "547",
  "zh": "风妖精",
  "aliases": [
   "風妖精"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "zacian",
  "name": "Zacian",
  "number": "888",
  "zh": "苍响",
  "aliases": [
   "蒼響"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "ponyta",
  "name": "Ponyta",
  "number": "077",
  "zh": "小火马",
  "aliases": [
   "小火馬"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "jigglypuff",
  "name": "Jigglypuff",
  "number": "039",
  "zh": "胖丁",
  "aliases": [],
  "acquisition": "challenge"
 },
 {
  "id": "machamp",
  "name": "Machamp",
  "number": "068",
  "zh": "怪力",
  "aliases": [],
  "acquisition": "challenge"
 },
 {
  "id": "umbreon",
  "name": "Umbreon",
  "number": "197",
  "zh": "月亮伊布",
  "aliases": [
   "月伊布"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "squirtle",
  "name": "Squirtle",
  "number": "007",
  "zh": "杰尼龟",
  "aliases": [
   "傑尼龜"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "cosmog",
  "name": "Cosmog",
  "number": "789",
  "zh": "科斯莫古",
  "aliases": [
   "小星云",
   "小星雲",
   "Nebby"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "froakie",
  "name": "Froakie",
  "number": "656",
  "zh": "呱呱泡蛙",
  "aliases": [],
  "acquisition": "challenge"
 },
 {
  "id": "tornadus",
  "name": "Tornadus",
  "number": "641",
  "zh": "龙卷云",
  "aliases": [
   "龍捲雲"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "amoonguss",
  "name": "Amoonguss",
  "number": "591",
  "zh": "败露球菇",
  "aliases": [
   "敗露球菇"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "hydreigon",
  "name": "Hydreigon",
  "number": "635",
  "zh": "三首恶龙",
  "aliases": [
   "三首惡龍"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "flutter-mane",
  "name": "Flutter Mane",
  "number": "987",
  "zh": "振翼发",
  "aliases": [
   "震翼发",
   "振翼髮"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "oddish",
  "name": "Oddish",
  "number": "043",
  "zh": "走路草",
  "aliases": [],
  "acquisition": "challenge"
 },
 {
  "id": "xatu",
  "name": "Xatu",
  "number": "178",
  "zh": "天然鸟",
  "aliases": [
   "天然鳥"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "vanillite",
  "name": "Vanillite",
  "number": "582",
  "zh": "迷你冰",
  "aliases": [],
  "acquisition": "challenge"
 },
 {
  "id": "ferrothorn",
  "name": "Ferrothorn",
  "number": "598",
  "zh": "坚果哑铃",
  "aliases": [
   "堅果啞鈴"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "litwick",
  "name": "Litwick",
  "number": "607",
  "zh": "烛光灵",
  "aliases": [
   "燭光靈"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "gastly",
  "name": "Gastly",
  "number": "092",
  "zh": "鬼斯",
  "aliases": [],
  "acquisition": "challenge"
 },
 {
  "id": "elekid",
  "name": "Elekid",
  "number": "239",
  "zh": "电击怪",
  "aliases": [
   "電擊怪",
   "电击小子",
   "電擊小子"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "jirachi",
  "name": "Jirachi",
  "number": "385",
  "zh": "基拉祈",
  "aliases": [],
  "acquisition": "challenge"
 },
 {
  "id": "incineroar",
  "name": "Incineroar",
  "number": "727",
  "zh": "炽焰咆哮虎",
  "aliases": [
   "熾焰咆哮虎"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "chikorita",
  "name": "Chikorita",
  "number": "152",
  "zh": "菊草叶",
  "aliases": [
   "菊草葉"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "morpeko",
  "name": "Morpeko",
  "number": "877",
  "zh": "莫鲁贝可",
  "aliases": [
   "莫魯貝可"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "ogerpon-teal",
  "name": "Ogerpon (Teal Mask)",
  "number": "1017",
  "zh": "厄诡椪（青草面具）",
  "aliases": [
   "Ogerpon",
   "Teal Mask Ogerpon",
   "Ogerpon Teal Mask",
   "厄诡椪",
   "厄诡椪青草面具",
   "青草面具厄诡椪",
   "厄鬼椪"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "dragonair",
  "name": "Dragonair",
  "number": "148",
  "zh": "哈克龙",
  "aliases": [
   "哈克龍"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "exeggutor-alola",
  "name": "Alolan Exeggutor",
  "number": "103",
  "zh": "阿罗拉椰蛋树",
  "aliases": [
   "Exeggutor Alola",
   "Exeggutor",
   "椰蛋树阿罗拉",
   "椰蛋树",
   "阿羅拉椰蛋樹",
   "椰蛋樹"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "pelipper",
  "name": "Pelipper",
  "number": "279",
  "zh": "大嘴鸥",
  "aliases": [
   "大嘴鷗"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "rotom-wash",
  "name": "Wash Rotom",
  "number": "479",
  "zh": "冲洗洛托姆",
  "aliases": [
   "Rotom Wash",
   "Rotom",
   "洛托姆冲洗",
   "洛托姆",
   "清洗洛托姆"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "groudon",
  "name": "Groudon",
  "number": "383",
  "zh": "固拉多",
  "aliases": [],
  "acquisition": "challenge"
 },
 {
  "id": "kyogre",
  "name": "Kyogre",
  "number": "382",
  "zh": "盖欧卡",
  "aliases": [
   "蓋歐卡"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "zapdos",
  "name": "Zapdos",
  "number": "145",
  "zh": "闪电鸟",
  "aliases": [
   "閃電鳥"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "sinistcha",
  "name": "Sinistcha",
  "number": "1013",
  "zh": "来悲粗茶",
  "aliases": [
   "来杯粗茶",
   "來悲粗茶"
  ],
  "acquisition": "challenge"
 },
 {
  "id": "breloom",
  "name": "Breloom",
  "number": "286",
  "zh": "斗笠菇",
  "aliases": [],
  "acquisition": "challenge"
 },
 {
  "id": "metagross",
  "name": "Metagross",
  "number": "376",
  "zh": "巨金怪",
  "aliases": [],
  "acquisition": "challenge"
 },
 {
  "id": "espeon",
  "name": "Espeon",
  "number": "196",
  "zh": "太阳伊布",
  "aliases": [
   "太陽伊布"
  ],
  "acquisition": "challenge"
 }
];
companions.forEach(p=>{p.hint=p.acquisition==='starter'?'Collect this Pokémon in Guess who? or Pick & place, or win it in battle.':'Challenge this silhouette in Pokémon battle and win to collect it.';});
const floorOffsets={"eevee":1.364,"rowlet":0,"spheal":0,"fuecoco":0,"ditto":1.563,"snorlax":0,"fennekin":0,"pikachu":0,"furret":0,"mimikyu":0,"dondozo":19.348,"tatsugiri":5.455,"koraidon":0,"serperior":0,"charizard":0,"comfey":0,"swablu":20.139,"shiny-rayquaza":0,"mareep":0,"teddiursa":0,"kirlia":0,"pachirisu":0,"azumarill":0,"scizor":0,"whimsicott":1.563,"zacian":0,"ponyta":0,"jigglypuff":0,"machamp":0,"umbreon":0,"squirtle":0,"cosmog":11.927,"froakie":0,"tornadus":0,"amoonguss":3.793,"hydreigon":1.563,"flutter-mane":4.392,"oddish":0,"xatu":0,"vanillite":11.719,"ferrothorn":15.625,"litwick":0,"gastly":0,"elekid":0,"jirachi":10.69,"incineroar":0,"chikorita":0,"morpeko":0,"ogerpon-teal":0,"dragonair":0,"exeggutor-alola":0,"pelipper":0,"rotom-wash":28.125,"groudon":8.852,"kyogre":27.126,"zapdos":2.073,"sinistcha":0,"breloom":0,"metagross":0,"espeon":0,"tatsugiri-droopy":5.455,"tatsugiri-stretchy":5.455};
const tatsugiriForms=[{name:'Curly · 上弓姿态',art:'tatsugiri'},{name:'Droopy · 下垂姿态',art:'tatsugiri-droopy'},{name:'Stretchy · 平挺姿态',art:'tatsugiri-stretchy'}];
let displayedTatsugiri=0;
try{const form=Number(localStorage.getItem('yuqi-tatsugiri-form'));if(Number.isInteger(form)&&form>=0&&form<3)displayedTatsugiri=form;}catch{}
function artId(id){return id==='tatsugiri'?tatsugiriForms[displayedTatsugiri].art:id;}
const storageKey='yuqi-field-notes-v2';
let discovered=new Set();
try {
 const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');
 if(Array.isArray(saved)) discovered=new Set(saved.filter(id=>companions.some(p=>p.id===id)));
} catch {}
const modal=document.querySelector('#field-notes');
const toast=document.querySelector('#pokemon-toast');
const hint=document.querySelector('#dex-hint');
let toastTimer, selectedId=[...discovered].at(-1)||null;
function showDetail(id, reveal=false){
 const p=companions.find(p=>p.id===id);if(!p)return;
 const found=discovered.has(id), detail=document.querySelector('#shelf-detail');
 const image=detail.querySelector('img'), link=detail.querySelector('a');
 selectedId=id;
 document.querySelectorAll('.shelf-slot').forEach(slot=>slot.setAttribute('aria-pressed',String(slot.dataset.pokemon===id)));
 image.hidden=false;image.classList.toggle('undiscovered-art',!found);
 image.src='assets/menu-icons/'+artId(p.id)+'.png';
 detail.querySelector('h3').textContent=found?p.name+' · '+p.zh:'An undiscovered Pokémon';
 detail.querySelector('p').textContent=found?'No. '+p.number:p.hint;
 detail.querySelector('.shelf-challenge')?.remove();
 const challenge=document.createElement('button');challenge.type='button';challenge.className='shelf-challenge';challenge.textContent='Challenge this Pokémon →';
 challenge.onclick=()=>{modal.close();window.dispatchEvent(new CustomEvent('open-pokemon-arcade',{detail:{mode:'battle',opponentId:id}}));};
 detail.querySelector('p').after(challenge);
 detail.querySelector('.shelf-form-picker')?.remove();
 if(id==='tatsugiri'&&found){
  const label=document.createElement('label');label.className='shelf-form-picker';label.textContent='Display form ';
  const select=document.createElement('select');select.setAttribute('aria-label','Tatsugiri display form');
  tatsugiriForms.forEach((f,i)=>{const option=document.createElement('option');option.value=i;option.textContent=f.name;option.selected=i===displayedTatsugiri;select.append(option);});
  select.addEventListener('change',()=>{displayedTatsugiri=Number(select.value);try{localStorage.setItem('yuqi-tatsugiri-form',String(displayedTatsugiri));}catch{}renderCollection();});
  label.append(select);detail.querySelector('p').after(label);
 }
 link.hidden=!found;
 if(found){
  link.href='https://www.pokemoncenter.com/search/'+encodeURIComponent(p.name.toLowerCase());
  link.textContent='Browse '+p.name+' at Pokémon Center ↗';
 }

}
function makeSlot(p,inline=false){
 const found=discovered.has(p.id),slot=document.createElement('button');
 slot.type='button';slot.className='shelf-slot'+(found?' found':' empty');slot.dataset.pokemon=p.id;
 slot.setAttribute('aria-label',found?'View '+p.name:'Undiscovered Pokémon '+p.number);
 slot.setAttribute('aria-pressed',String(selectedId===p.id));slot.title=found?p.name+' · '+p.zh:'An undiscovered Pokémon';
 const image=document.createElement('img');image.src='assets/menu-icons/'+artId(p.id)+'.png';image.alt='';image.width=96;image.height=96;
 image.style.transform='translateY('+(floorOffsets[artId(p.id)]??floorOffsets[p.id])+'%)';if(!found)image.classList.add('undiscovered-art');slot.append(image);
 slot.addEventListener('click',()=>{if(inline)openCabinet();showDetail(p.id,true);});return slot;
}
function renderCollection(){
 const cabinet=document.querySelector('#pokemon-collection'),shelves=[];
 for(let i=0;i<companions.length;i+=4){
  const shelf=document.createElement('div');shelf.className='cabinet-shelf';companions.slice(i,i+4).forEach(p=>shelf.append(makeSlot(p)));shelves.push(shelf);
 }
 cabinet.replaceChildren(...shelves);
 document.querySelector('#inline-collection').replaceChildren(...companions.map(p=>makeSlot(p,true)));
 document.querySelector('#inline-count').textContent=discovered.size+' / '+companions.length;
 document.querySelector('#collection-count').textContent=discovered.size+' / '+companions.length+' on the shelf';
 if(selectedId)showDetail(selectedId);
}
function revealInlineShelf(){
 document.querySelector('#inline-shelf').hidden=false;
 try{localStorage.setItem('yuqi-arcade-shelf-visible','true');}catch{}
}
try{if(localStorage.getItem('yuqi-arcade-shelf-visible')==='true')revealInlineShelf();}catch{}
document.querySelector('#inline-shelf-open').addEventListener('click',openCabinet);

function openCabinet(){
 hint.textContent='';renderCollection();
 if(!modal.open)modal.showModal();
}

function discover(id, quiet=false){
 const p=companions.find(p=>p.id===id);if(!p)return;
 const fresh=!discovered.has(id);discovered.add(id);
 try{localStorage.setItem(storageKey,JSON.stringify([...discovered]));}catch{}
 renderCollection();showDetail(id);
 window.dispatchEvent(new Event('pokemon-collection-change'));
 if(quiet)return;
 toast.querySelector('img').src='assets/menu-icons/'+id+'.png';
 toast.querySelector('.encounter-name').textContent=(fresh?'Added to your shelf: ':'Hello again, ')+p.name+(fresh?'!':'');
 toast.querySelector('.encounter-count').textContent=discovered.size+' / '+companions.length+' discovered';
 toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.hidden=true;},4500);
}
document.querySelector('#view-shelf').addEventListener('click',()=>{toast.hidden=true;clearTimeout(toastTimer);openCabinet();});
document.querySelector('#close-dex').addEventListener('click',()=>modal.close());
modal.addEventListener('click',e=>{
 if(e.target!==modal)return;
 const r=modal.getBoundingClientRect();
 if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();
});
document.querySelector('#next-hint').addEventListener('click',()=>{
 const next=companions.find(p=>!discovered.has(p.id));
 hint.textContent=next?next.hint:'You found everyone. Thanks for exploring!';
});
document.querySelector('#dismiss-encounter').addEventListener('click',()=>{toast.hidden=true;clearTimeout(toastTimer);});
const secret=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let secretPosition=0;
document.addEventListener('keydown',e=>{
 if(modal.open||document.querySelector('#arcade-dialog')?.open||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;
 const k=e.key.length===1?e.key.toLowerCase():e.key;
 secretPosition=k===secret[secretPosition]?secretPosition+1:k===secret[0]?1:0;
 if(secretPosition===secret.length){window.dispatchEvent(new CustomEvent('open-pokemon-arcade'));secretPosition=0;}
});
window.PokemonCollection=Object.freeze({tatsugiriForm:()=>displayedTatsugiri,list:()=>companions.map(p=>({...p})),has:id=>discovered.has(id),count:()=>discovered.size,award:id=>discover(id,true),openShelf:openCabinet,revealShelf:revealInlineShelf});
renderCollection();
window.dispatchEvent(new Event('pokemon-ready'));
document.documentElement.classList.add('pokemon-ready');
})();
