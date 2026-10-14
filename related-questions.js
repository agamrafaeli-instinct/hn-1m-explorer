(function(){
 'use strict';var request;
 function catalog(){return request||(request=fetch('stories/questions.json').then(function(r){if(!r.ok)throw new Error();return r.json();}).then(function(d){var map={};d.questions.forEach(function(x){map[x.id]=x.question;});return map;}).catch(function(e){request=null;throw e;}));}
 window.RelatedQuestions=function(root){
  return catalog().then(function(map){root.querySelectorAll('[data-related-question]').forEach(function(a){var q=map[a.dataset.relatedQuestion];if(q){a.textContent=q;a.setAttribute('aria-label',q+' ('+a.dataset.relatedQuestion.toUpperCase()+')');}});}).catch(function(){});
 };
})();
