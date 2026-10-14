(function(){
 'use strict';
 var rows=null,loading=null,root,input,list,note,clear,retry;
 function el(tag,text){var e=document.createElement(tag);if(text)e.textContent=text;return e;}
 function query(){return new URLSearchParams(location.hash.split('?')[1]||'').get('storyq')||'';}
 function render(){
  if(!rows)return;var q=input.value.trim().toLocaleLowerCase(),found=rows.filter(function(x){return x.question.toLocaleLowerCase().includes(q);});list.replaceChildren();
  found.forEach(function(x){var li=el('li'),a=el('a',x.question);a.href='#/c/'+x.id;a.style.cssText='display:flex;align-items:center;min-height:44px;padding:8px 0;color:inherit;text-decoration:underline';li.appendChild(a);list.appendChild(li);});
  note.textContent=found.length?found.length+' of '+rows.length+' published questions.':'No question matches this search.';clear.hidden=!input.value;retry.hidden=true;
 }
 function load(){if(rows){render();return Promise.resolve();}if(loading)return loading;note.textContent='Loading published questions...';retry.hidden=true;
  loading=fetch('stories/questions.json').then(function(r){if(!r.ok)throw new Error();return r.json();}).then(function(d){if(!Array.isArray(d.questions))throw new Error();rows=d.questions;render();}).catch(function(){note.textContent='Could not load the question list. Try again.';retry.hidden=false;}).finally(function(){loading=null;});return loading;
 }
 function sync(){if(!root)return;var q=query();input.value=q;clear.hidden=!q;if(new URLSearchParams(location.hash.split('?')[1]||'').has('storyq')){root.open=true;return load();}else if(rows)render();}
 function setQuery(){var p=new URLSearchParams();p.set('beat','sg_shelf');p.set('storyq',input.value.slice(0,120));history.replaceState(null,'','#/saga?'+p.toString());render();}
 window.QuestionFinderInit=function(){
  if(root)return sync();var shelf=document.getElementById('sg_shelf');if(!shelf)return;
  root=el('details');root.id='sg_questions';root.style.cssText='font-size:16px;margin:18px 0';var summary=el('summary','Find another published question');summary.style.cssText='min-height:44px;display:flex;align-items:center;cursor:pointer;text-decoration:underline';root.appendChild(summary);
  var label=el('label','Search published questions');label.htmlFor='sg_storyq';input=el('input');input.id='sg_storyq';input.type='search';input.maxLength=120;input.style.cssText='display:block;box-sizing:border-box;width:100%;min-height:44px;font:inherit;margin:8px 0;padding:8px';root.append(label,input);
  note=el('p');note.id='sg_question_count';note.setAttribute('role','status');note.setAttribute('aria-live','polite');clear=el('button','Clear search');clear.type='button';clear.className='pg_share';clear.hidden=true;clear.onclick=function(){input.value='';setQuery();input.focus();};retry=el('button','Retry question list');retry.type='button';retry.className='pg_share';retry.hidden=true;retry.onclick=load;
  list=el('ul');list.id='sg_question_list';list.style.cssText='list-style:none;padding:0';var share=el('button','Share this search');share.type='button';share.className='pg_share';share.dataset.share='finder';share.disabled=true;window.PreparePageShare().then(function(){share.disabled=false;}).catch(function(){share.textContent='Retry sharing';share.disabled=false;});root.append(note,clear,retry,share,list,el('p','Questions from the published story files. Open a question for its answer, sources and limits.'));
  shelf.insertBefore(root,shelf.querySelector('.sg_steps'));root.addEventListener('toggle',function(){if(root.open)load();});input.addEventListener('input',setQuery);return sync();
 };
 addEventListener('hashchange',sync);
})();
