(() => {
  const $ = id => document.getElementById(id);
  const screens = ['home','setup','how','game','results'];
  const state = {screen:'home',mode:'single',topic:'countries',difficulty:'easy',players:[],questions:[],index:0,turn:0,answered:false,timer:null,remaining:10,gameActive:false};
  const topicNames={countries:'Países e Capitais',general:'Conhecimentos Gerais',science:'Ciências e Natureza',history:'História',geography:'Geografia',math:'Matemática',technology:'Tecnologia e Informática',sports:'Esportes',cinema:'Cinema e Séries',literature:'Literatura e Língua Portuguesa',arts:'Arte e Música',world:'Curiosidades do Mundo',all:'Todos os temas'};
  const difficultyNames={easy:'Fácil',medium:'Médio',hard:'Difícil'};
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function showScreen(name){screens.forEach(s=>$(`${s}-screen`).classList.toggle('hidden',s!==name));state.screen=name;window.scrollTo({top:0,behavior:'smooth'});}
  function stopTimer(){if(state.timer){clearInterval(state.timer);state.timer=null;}}
  function selected(name){const item=document.querySelector(`input[name="${name}"]:checked`);return item?item.value:'';}
  function makeNameFields(){const count=Number($('player-count').value);$('player-names').innerHTML=Array.from({length:count},(_,i)=>`<input maxlength="24" data-player-name="${i}" placeholder="Nome do participante ${i+1}" aria-label="Nome do participante ${i+1}" value="${i===0?'Jogador 1':i===1?'Jogador 2':''}">`).join('');}
  function syncMode(){state.mode=selected('mode');$('players-field').classList.toggle('hidden',state.mode!=='multi');}
  function beginGame(){
    state.mode=selected('mode');state.topic=selected('topic');state.difficulty=selected('difficulty');$('setup-error').textContent='';
    let names=['Você'];
    if(state.mode==='multi'){
      names=[...document.querySelectorAll('[data-player-name]')].map((el,i)=>el.value.trim()||`Jogador ${i+1}`);
      if(names.some(n=>n.length>24)){ $('setup-error').textContent='Os nomes devem ter no máximo 24 caracteres.';return; }
      if(names.some(n=>!n.trim())){$('setup-error').textContent='Informe o nome de todos os participantes.';return;}
      if(new Set(names.map(n=>n.toLocaleLowerCase('pt-BR'))).size!==names.length){$('setup-error').textContent='Use nomes diferentes para cada participante.';return;}
    }
    const built=window.TaskFlowGame.buildQuestions(state.topic,state.difficulty);
    if(built.error){$('setup-error').textContent=built.error;return;}
    state.players=window.TaskFlowScore.createPlayers(names);state.questions=built.questions;state.index=0;state.turn=0;state.answered=false;state.gameActive=true;renderQuestion();showScreen('game');startTimer();
  }
  function currentQuestion(){return state.questions[state.index];}
  function currentPlayer(){return state.players[state.turn % state.players.length];}
  function renderQuestion(){
    const q=currentQuestion(),p=currentPlayer();state.answered=false;state.remaining=10;
    $('game-topic').textContent=`${topicNames[state.topic]} · ${difficultyNames[state.difficulty]}`;
    $('question-count').textContent=`Pergunta ${state.index+1} de ${state.questions.length}`;
    $('current-player').textContent=state.mode==='multi'?`Vez de ${p.name}`:'Modo individual';
    $('progress-bar').style.width=`${((state.index+1)/state.questions.length)*100}%`;
    $('question-text').textContent=q.question;$('points-label').textContent=`Resposta correta: +${window.TaskFlowGame.pointsFor(state.difficulty)} pontos`;
    $('feedback').className='feedback hidden';$('feedback').textContent='';$('next-button').disabled=true;$('next-button').textContent=state.index===state.questions.length-1?'Ver resultado →':'Próxima pergunta →';
    $('answer-options').innerHTML=q.options.map((option,i)=>`<button class="answer-option" data-answer="${esc(option)}"><span class="answer-letter">${String.fromCharCode(65+i)}</span><span>${esc(option)}</span></button>`).join('');
    $('answer-options').querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>submitAnswer(button.dataset.answer,false)));
    renderScoreStrip();updateTimerDisplay();
  }
  function renderScoreStrip(){ $('score-strip').innerHTML=state.players.map(p=>`<div class="score-chip">${esc(p.name)}: <b>${p.score} pts</b></div>`).join(''); }
  function startTimer(){stopTimer();state.remaining=10;updateTimerDisplay();state.timer=setInterval(()=>{if(state.answered||!state.gameActive){stopTimer();return;}state.remaining=Math.max(0,state.remaining-0.1);updateTimerDisplay();if(state.remaining<=0){state.remaining=0;stopTimer();submitAnswer(null,true);}},100);}
  function updateTimerDisplay(){const number=Math.ceil(state.remaining);$('timer-number').textContent=String(number);$('timer-bar').style.width=`${Math.max(0,state.remaining/10*100)}%`;$('timer-panel')?.classList.toggle('urgent',number<=3);}
  function submitAnswer(answer,timedOut){if(state.answered||!state.gameActive)return;state.answered=true;stopTimer();const q=currentQuestion(),p=currentPlayer();const result=window.TaskFlowScore.record(p,q,answer,timedOut);if(!result.recorded)return;
    const buttons=[...$('answer-options').querySelectorAll('[data-answer]')];buttons.forEach(button=>{button.disabled=true;if(button.dataset.answer===q.answer)button.classList.add('correct');else if(button.dataset.answer===answer&&!result.correct)button.classList.add('wrong');});
    const feedback=$('feedback');feedback.classList.remove('hidden','good','bad');
    if(timedOut){feedback.classList.add('bad');feedback.textContent=`Tempo esgotado! Você não respondeu a tempo e ganhou 0 pontos. Resposta correta: ${q.answer}.`;}
    else if(result.correct){feedback.classList.add('good');feedback.textContent=`Resposta correta! +${result.points} pontos para ${p.name}.`;}
    else{feedback.classList.add('bad');feedback.textContent=`Resposta incorreta. Você ganhou 0 pontos. Resposta correta: ${q.answer}.`;}
    $('next-button').disabled=false;renderScoreStrip();
  }
  function nextQuestion(){if(!state.answered)return;if(state.index>=state.questions.length-1){finishGame();return;}state.index++;if(state.mode==='multi')state.turn=(state.turn+1)%state.players.length;renderQuestion();startTimer();}
  function finishGame(){stopTimer();state.gameActive=false;const ranked=window.TaskFlowScore.rank(state.players);const best=ranked[0].score;const winners=ranked.filter(p=>p.score===best);$('result-heading').textContent=winners.length>1?'Empate!':(state.mode==='single'?'Partida concluída!':`Vitória de ${winners[0].name}!`);$('result-subtitle').textContent=`${topicNames[state.topic]} · ${difficultyNames[state.difficulty]} · ${state.questions.length} perguntas`;
    $('results-list').innerHTML=ranked.map((p,i)=>{const pct=Math.round(p.correct/state.questions.length*100);const badge=ranked.filter(x=>x.score===p.score).length>1?'Empate':(i===0?'Líder':'');return `<article class="result-card ${p.score===best?'winner':''}"><div class="result-rank">${p.score===best?'★':`#${i+1}`}</div><div><div class="result-name">${esc(p.name)}</div><div class="result-detail">${p.correct} acertos · ${p.wrong} erros · ${p.unanswered} sem resposta · ${pct}% de acertos</div>${badge?`<div class="result-badge">${badge}</div>`:''}</div><div class="result-points">${p.score}<small>pontos</small></div></article>`;}).join('');showScreen('results');}
  function resetToHome(){stopTimer();state.gameActive=false;state.players=[];state.questions=[];state.index=0;state.turn=0;showScreen('home');}
  $('play-button').addEventListener('click',()=>showScreen('setup'));$('how-button').addEventListener('click',()=>showScreen('how'));$('how-play-button').addEventListener('click',()=>showScreen('setup'));document.querySelectorAll('[data-back="home"]').forEach(b=>b.addEventListener('click',resetToHome));
  document.querySelectorAll('input[name="mode"]').forEach(el=>el.addEventListener('change',syncMode));$('player-count').addEventListener('change',makeNameFields);$('start-button').addEventListener('click',beginGame);$('next-button').addEventListener('click',nextQuestion);$('again-button').addEventListener('click',()=>showScreen('setup'));$('home-button').addEventListener('click',resetToHome);
  $('quit-button').addEventListener('click',()=>{$('modal').classList.remove('hidden');$('cancel-quit').focus();});$('cancel-quit').addEventListener('click',()=>$('modal').classList.add('hidden'));$('confirm-quit').addEventListener('click',()=>{$('modal').classList.add('hidden');resetToHome();});$('modal').addEventListener('click',e=>{if(e.target===$('modal'))$('modal').classList.add('hidden');});
  document.addEventListener('keydown',e=>{if(state.screen!=='game'||state.answered)return;if(['1','2','3','4'].includes(e.key)){const button=$('answer-options').querySelectorAll('[data-answer]')[Number(e.key)-1];button?.click();}});
  makeNameFields();syncMode();
})();
