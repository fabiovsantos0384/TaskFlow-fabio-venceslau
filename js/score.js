window.TaskFlowScore = {
  createPlayers(names) { return names.map((name,index)=>({id:index,name,score:0,correct:0,wrong:0,unanswered:0,answeredIds:[]})); },
  record(player,question,answer,timedOut=false) {
    if (player.answeredIds.includes(question.id)) return {recorded:false,points:0,correct:false};
    player.answeredIds.push(question.id);
    const correct = !timedOut && answer===question.answer;
    const points = correct ? window.TaskFlowGame.pointsFor(question.difficulty) : 0;
    player.score += points;
    if (correct) player.correct++; else if (timedOut) player.unanswered++; else player.wrong++;
    return {recorded:true,points,correct};
  },
  rank(players) { return [...players].sort((a,b)=>b.score-a.score); }
};
