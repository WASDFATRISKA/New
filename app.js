const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const KEY = "evolution_2_0_data";
const today = new Date();
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const parseDate = s => {const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
let data = JSON.parse(localStorage.getItem(KEY)||'{"workouts":[],"study":[]}');
let selectedDate = iso(today), monthCursor = new Date(today.getFullYear(),today.getMonth(),1), editingId = null, draftExercises = [];
const save = () => {localStorage.setItem(KEY,JSON.stringify(data));renderAll()};
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2100)}
function showPage(name){$$(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${name}`));$$(".tab").forEach(t=>t.classList.toggle("active",t.dataset.page===name));if(name==="training")renderCalendar()}
$$(".tab").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
$$("[data-go]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.go)));
$("#todayLabel").textContent=today.toLocaleDateString("ru-RU",{day:"numeric",month:"long"});
function renderCalendar(){
 const y=monthCursor.getFullYear(),m=monthCursor.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),offset=(first.getDay()+6)%7;
 $("#monthTitle").textContent=first.toLocaleDateString("ru-RU",{month:"long",year:"numeric"});
 const cells=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(x=>`<div class="cal-day">${x}</div>`);
 for(let i=0;i<offset;i++)cells.push('<div></div>');
 for(let d=1;d<=days;d++){const key=iso(new Date(y,m,d)),has=data.workouts.some(w=>w.date===key);cells.push(`<button class="cal-date ${key===selectedDate?"selected":""} ${key===iso(today)?"today":""} ${has?"has-workout":""}" data-date="${key}">${d}</button>`)}
 $("#calendar").innerHTML=cells.join("");
 $$(".cal-date").forEach(b=>b.addEventListener("click",()=>{selectedDate=b.dataset.date;closeEditor();renderCalendar();renderWorkoutList()}));
 $("#selectedDateTitle").textContent=parseDate(selectedDate).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"});
}
$("#prevMonth").onclick=()=>{monthCursor.setMonth(monthCursor.getMonth()-1);renderCalendar()};
$("#nextMonth").onclick=()=>{monthCursor.setMonth(monthCursor.getMonth()+1);renderCalendar()};
function renderWorkoutList(){
 const list=data.workouts.filter(w=>w.date===selectedDate).sort((a,b)=>a.created-b.created);
 $("#workoutCount").textContent=`${list.length} ${list.length===1?"запись":"записей"}`;
 $("#workoutList").innerHTML=list.length?list.map(w=>`<div class="workout-item"><div><b>${esc(w.name||"Тренировка")}</b><small>${w.exercises.length} упражн. · ${w.exercises.reduce((n,e)=>n+e.sets.length,0)} подходов</small></div><button data-edit="${w.id}">Открыть</button></div>`).join(""):'<div class="panel muted">На эту дату пока нет тренировок. Нажми «＋ День», чтобы создать запись.</div>';
 $$("[data-edit]").forEach(b=>b.onclick=()=>openEditor(b.dataset.edit));
}
function closeEditor(){$("#workoutEditor").classList.remove("open");editingId=null}
function openEditor(id=null){
 editingId=id;const w=id?data.workouts.find(x=>x.id===id):null;
 draftExercises=w?JSON.parse(JSON.stringify(w.exercises)):[];
 $("#editorTitle").textContent=w?"Редактировать тренировку":"Новая тренировка";
 $("#workoutDate").value=w?.date||selectedDate;$("#workoutName").value=w?.name||"";$("#workoutNotes").value=w?.notes||"";
 $("#deleteWorkout").style.display=w?"block":"none";
 $("#workoutEditor").classList.add("open");renderExerciseEditor();
 $("#workoutEditor").scrollIntoView({behavior:"smooth",block:"start"});
}
$("#newWorkout").onclick=()=>openEditor();
$("#closeEditor").onclick=closeEditor;
$("#addExercise").onclick=()=>{draftExercises.push({id:uid(),name:"",sets:[{weight:"",reps:"",rir:""}]});renderExerciseEditor()};
function renderExerciseEditor(){
 $("#exerciseEditor").innerHTML=draftExercises.map((e,ei)=>`<div class="exercise-card" data-ex="${e.id}">
 <div class="exercise-head"><input class="ex-name" placeholder="Название упражнения" value="${esc(e.name)}"><button class="text-btn remove-ex">Удалить</button></div>
 <div class="sets">${e.sets.map((s,si)=>`<div class="set-card" data-set="${si}">
 <div class="set-head"><span>ПОДХОД ${si+1}</span><button class="text-btn remove-set">Убрать</button></div>
 <div class="set-fields"><label>Вес, кг<input class="set-weight" type="number" min="0" step="0.5" placeholder="Напр. 70" value="${esc(s.weight)}"></label><label>Повторения<input class="set-reps" type="number" min="0" step="1" placeholder="Напр. 8" value="${esc(s.reps)}"></label></div>
 <label>RIR — повторения в запасе (необязательно)<input class="set-rir" type="number" min="0" max="10" step="1" placeholder="Напр. 2" value="${esc(s.rir)}"></label>
 </div>`).join("")}</div><button class="add-set">＋ Добавить подход</button></div>`).join("");
 $$(".exercise-card").forEach(card=>{
  const ex=draftExercises.find(x=>x.id===card.dataset.ex);
  card.querySelector(".ex-name").oninput=e=>ex.name=e.target.value;
  card.querySelector(".remove-ex").onclick=()=>{draftExercises=draftExercises.filter(x=>x.id!==ex.id);renderExerciseEditor()};
  card.querySelector(".add-set").onclick=()=>{ex.sets.push({weight:"",reps:"",rir:""});renderExerciseEditor()};
  card.querySelectorAll(".set-card").forEach(sc=>{
   const set=ex.sets[Number(sc.dataset.set)];
   sc.querySelector(".set-weight").oninput=e=>set.weight=e.target.value;
   sc.querySelector(".set-reps").oninput=e=>set.reps=e.target.value;
   sc.querySelector(".set-rir").oninput=e=>set.rir=e.target.value;
   sc.querySelector(".remove-set").onclick=()=>{if(ex.sets.length===1){toast("У упражнения должен остаться хотя бы один подход");return}ex.sets.splice(Number(sc.dataset.set),1);renderExerciseEditor()};
  });
 });
}
$("#saveWorkout").onclick=()=>{
 const date=$("#workoutDate").value;if(!date){toast("Укажи дату тренировки");return}
 const exercises=draftExercises.map(e=>({...e,name:e.name.trim(),sets:e.sets.filter(s=>s.weight!==""||s.reps!=="").map(s=>({...s}))})).filter(e=>e.name);
 const w={id:editingId||uid(),date,name:$("#workoutName").value.trim()||"Тренировка",notes:$("#workoutNotes").value.trim(),exercises,created:Date.now()};
 if(editingId)data.workouts=data.workouts.map(x=>x.id===editingId?w:x);else data.workouts.push(w);
 selectedDate=date;monthCursor=new Date(parseDate(date).getFullYear(),parseDate(date).getMonth(),1);closeEditor();save();renderCalendar();renderWorkoutList();toast("Тренировка сохранена");
};
$("#deleteWorkout").onclick=()=>{if(!editingId)return;if(confirm("Удалить эту тренировку?")){data.workouts=data.workouts.filter(w=>w.id!==editingId);closeEditor();save();renderWorkoutList();toast("Тренировка удалена")}};
function openStudy(){ $("#studyForm").classList.add("open");$("#studyDate").value=iso(today);$("#studyForm").scrollIntoView({behavior:"smooth",block:"center"})}
$("#addStudy").onclick=openStudy;$("#closeStudy").onclick=()=>$("#studyForm").classList.remove("open");
$("#saveStudy").onclick=()=>{
 const topic=$("#studyTopic").value.trim(),done=Number($("#studyDone").value||0),correct=Number($("#studyCorrect").value||0);
 if(!topic){toast("Укажи тему занятия");return}if(correct>done){toast("Правильных ответов не может быть больше решённых");return}
 data.study.push({id:uid(),date:$("#studyDate").value||iso(today),subject:$("#studySubject").value,topic,done,correct});
 $("#studyForm").classList.remove("open");$("#studyTopic").value="";$("#studyDone").value="";$("#studyCorrect").value="";save();toast("Занятие сохранено");
};
function getAnalysis(){
 const byName={};data.workouts.forEach(w=>w.exercises.forEach(e=>{const name=e.name.trim();if(!name)return;(byName[name]??=[]).push(...e.sets.filter(s=>s.weight!==""&&s.reps!=="").map(s=>({date:w.date,weight:Number(s.weight),reps:Number(s.reps),rir:s.rir===""?null:Number(s.rir)})))}));
 const results=[];
 Object.entries(byName).forEach(([name,sets])=>{sets.sort((a,b)=>a.date.localeCompare(b.date));const latestDate=sets.at(-1).date,last=sets.filter(s=>s.date===latestDate),previousDates=[...new Set(sets.slice(0,-last.length).map(s=>s.date))],prevDate=previousDates.at(-1),prev=prevDate?sets.filter(s=>s.date===prevDate):[];
  const maxLast=Math.max(...last.map(s=>s.weight)),maxPrev=prev.length?Math.max(...prev.map(s=>s.weight)):null,repLast=last.filter(s=>s.weight===maxLast).reduce((n,s)=>n+s.reps,0);
  let advice="Продолжай фиксировать подходы — пока недостаточно истории для сравнения.";
  if(prev.length){const oldTop=Math.max(...prev.map(s=>s.weight)),oldReps=prev.filter(s=>s.weight===oldTop).reduce((n,s)=>n+s.reps,0);
   if(maxLast>oldTop)advice=`Вес вырос с ${oldTop} до ${maxLast} кг. Закрепи новый вес и следи за техникой.`;
   else if(maxLast===oldTop&&repLast>oldReps)advice=`На том же максимальном весе суммарно больше повторений (${repLast} против ${oldReps}). Это положительная динамика.`;
   else if(maxLast===oldTop&&repLast===oldReps)advice="Результат стабилен. Попробуй добавить 1 повторение суммарно, если техника и восстановление хорошие.";
   else advice="Результат снизился относительно прошлой записи. Не спеши повышать вес: оцени сон, стресс, отдых и самочувствие.";
  }
  results.push({name,latestDate,maxLast,repLast,advice,sets:last});
 });
 return results.sort((a,b)=>b.latestDate.localeCompare(a.latestDate));
}
function renderStats(){
 const analysis=getAnalysis(),totalExercises=data.workouts.reduce((n,w)=>n+w.exercises.length,0);
 $("#statsWorkouts").textContent=data.workouts.length;$("#statsExercises").textContent=totalExercises;
 $("#exerciseStats").innerHTML=analysis.length?analysis.map(a=>`<div class="small-row"><div><b>${esc(a.name)}</b><small>${parseDate(a.latestDate).toLocaleDateString("ru-RU")} · ${a.sets.length} подходов</small><small>${esc(a.advice)}</small></div><b>${a.maxLast} кг</b></div>`).join(""):'<p class="muted">Добавь тренировку, чтобы увидеть динамику.</p>';
 const total=data.study.reduce((n,s)=>n+s.done,0),correct=data.study.reduce((n,s)=>n+s.correct,0);
 $("#examStats").innerHTML=`<div class="small-row"><span>Занятий</span><b>${data.study.length}</b></div><div class="small-row"><span>Решено заданий</span><b>${total}</b></div><div class="small-row"><span>Правильных ответов</span><b>${correct}</b></div><div class="small-row"><span>Точность</span><b>${total?Math.round(correct/total*100):0}%</b></div>`;
 const latest=analysis[0];$("#homeRecommendation").innerHTML=latest?`<div class="ai-label">АВТОАНАЛИЗ · ${esc(latest.name.toUpperCase())}</div><p>${esc(latest.advice)}</p><small class="muted">Это ориентир по журналу, а не медицинская или гарантированная тренировочная рекомендация.</small>`:'<div class="ai-label">АВТОАНАЛИЗ</div><p>Добавь первую тренировку — здесь появятся рекомендации по нагрузке.</p>';
}
function renderStudy(){
 const counts={Математика:0,Русский:0,Информатика:0};data.study.forEach(s=>counts[s.subject]=(counts[s.subject]||0)+1);
 $("#mathCount").textContent=`${counts.Математика} занятий`;$("#rusCount").textContent=`${counts.Русский} занятий`;$("#infoCount").textContent=`${counts.Информатика} занятий`;
 $("#studyList").innerHTML=data.study.length?[...data.study].sort((a,b)=>b.date.localeCompare(a.date)).map(s=>`<div class="study-item"><div><b>${esc(s.subject)} · ${esc(s.topic)}</b><small>${parseDate(s.date).toLocaleDateString("ru-RU")} · ${s.correct}/${s.done} правильно</small></div><div class="score">${s.done?Math.round(s.correct/s.done*100):0}%</div></div>`).join(""):'<div class="panel muted">Пока нет занятий. Добавь первое, чтобы вести историю подготовки.</div>';
 $("#homeStudy").textContent=data.study.length;
}
function renderAll(){renderWorkoutList();renderStudy();renderStats();$("#homeWorkouts").textContent=data.workouts.length}
$("#exportData").onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="evolution-backup.json";a.click();URL.revokeObjectURL(a.href);toast("Экспорт подготовлен")};
$("#clearData").onclick=()=>{if(confirm("Удалить все тренировки и занятия? Это нельзя отменить.")){data={workouts:[],study:[]};save();toast("Данные очищены")}};
renderCalendar();renderAll();
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
