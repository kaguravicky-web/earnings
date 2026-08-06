document.querySelectorAll('.page-tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.page-tab').forEach(x=>{
      const active=x===tab;
      x.classList.toggle('active',active);
      x.setAttribute('aria-selected',active?'true':'false');
    });
    document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('active',p.dataset.pane===tab.dataset.tab));
    window.scrollTo({top:0,behavior:'smooth'});
  });
});
