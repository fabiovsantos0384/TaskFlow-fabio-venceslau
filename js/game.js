window.TaskFlowGame = {
  QUESTIONS_PER_GAME: 10,
  SECONDS_PER_QUESTION: 10,
  pointsFor(difficulty) { return ({easy:10,medium:20,hard:30})[difficulty] || 0; },
  shuffle(items) {
    const copy = [...items];
    for (let i=copy.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]]; }
    return copy;
  },
  buildQuestions(topic,difficulty) {
    const filtered = (window.QUIZ_QUESTIONS || []).filter(q=>(topic==='all' || q.topic===topic) && q.difficulty===difficulty && Array.isArray(q.options) && q.options.length===4 && q.options.filter(o=>o===q.answer).length===1);
    if (filtered.length < this.QUESTIONS_PER_GAME) return {error:`Há apenas ${filtered.length} perguntas válidas para esta combinação. São necessárias ${this.QUESTIONS_PER_GAME}.`,questions:[]};
    return {questions:this.shuffle(filtered).slice(0,this.QUESTIONS_PER_GAME).map(q=>({...q,options:this.shuffle(q.options)}))};
  }
};
