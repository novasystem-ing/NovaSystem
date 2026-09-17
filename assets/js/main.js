(function(){
  "use strict";

  var yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Menú móvil ---------- */
  var navToggle = document.getElementById('navToggle');
  var mobilePanel = document.getElementById('mobilePanel');
  var iconOpen = document.getElementById('navIconOpen');
  var iconClose = document.getElementById('navIconClose');

  if(navToggle && mobilePanel){
    function closeMenu(){
      mobilePanel.classList.remove('open');
      navToggle.setAttribute('aria-expanded','false');
      if(iconOpen) iconOpen.style.display = 'block';
      if(iconClose) iconClose.style.display = 'none';
      document.body.style.overflow = '';
    }
    function openMenu(){
      mobilePanel.classList.add('open');
      navToggle.setAttribute('aria-expanded','true');
      if(iconOpen) iconOpen.style.display = 'none';
      if(iconClose) iconClose.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
    navToggle.addEventListener('click', function(){
      var isOpen = mobilePanel.classList.contains('open');
      isOpen ? closeMenu() : openMenu();
    });
    mobilePanel.querySelectorAll('a').forEach(function(link){
      link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') closeMenu();
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && revealEls.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- Animación TV del hero (solo existe en el home) ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var barFill = document.getElementById('tvBarFill');
  var statusEl = document.getElementById('tvStatus');
  var checkEl = document.getElementById('tvCheck');

  if(barFill && statusEl && checkEl){
    if(reduceMotion){
      barFill.style.width = '100%';
      statusEl.textContent = 'Sistema recuperado';
      checkEl.classList.add('show');
    } else {
      var progress = 0, direction = 1, holding = 0;
      function tick(){
        if(holding > 0){ holding--; return; }
        if(direction === 1){
          progress += 2;
          if(progress >= 100){
            progress = 100;
            statusEl.textContent = 'Sistema recuperado';
            checkEl.classList.add('show');
            holding = 45;
            direction = -1;
          } else {
            statusEl.textContent = 'Recuperando sistema… ' + progress + '%';
          }
        } else {
          checkEl.classList.remove('show');
          progress = 0;
          statusEl.textContent = 'Recuperando sistema… 0%';
          direction = 1;
          holding = 6;
        }
        barFill.style.width = progress + '%';
      }
      setInterval(tick, 55);
    }
  }

  /* ---------- Formulario de contacto (solo existe en el home) ---------- */
  var form = document.getElementById('contactForm');
  var successBox = document.getElementById('formSuccess');

  if(form){
    function setInvalid(fieldEl, invalid){ fieldEl.classList.toggle('invalid', invalid); }

    function validateForm(){
      var valid = true;

      var nameField = form.querySelector('[data-field="name"]');
      var nameOk = document.getElementById('name').value.trim().length >= 3;
      setInvalid(nameField, !nameOk); if(!nameOk) valid = false;

      var emailField = form.querySelector('[data-field="email"]');
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(document.getElementById('email').value.trim());
      setInvalid(emailField, !emailOk); if(!emailOk) valid = false;

      var phoneField = form.querySelector('[data-field="phone"]');
      var phoneOk = document.getElementById('phone').value.replace(/\D/g,'').length >= 7;
      setInvalid(phoneField, !phoneOk); if(!phoneOk) valid = false;

      var messageField = form.querySelector('[data-field="message"]');
      var messageOk = document.getElementById('message').value.trim().length >= 10;
      setInvalid(messageField, !messageOk); if(!messageOk) valid = false;

      return valid;
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(successBox) successBox.classList.remove('show');

      if(!validateForm()){
        var firstInvalid = form.querySelector('.field.invalid input, .field.invalid textarea');
        if(firstInvalid) firstInvalid.focus();
        return;
      }

      var name = document.getElementById('name').value.trim();
      var email = document.getElementById('email').value.trim();
      var phone = document.getElementById('phone').value.trim();
      var message = document.getElementById('message').value.trim();

      var waText = 'Hola, soy ' + name + '. Mi correo es ' + email + ' y mi teléfono ' + phone + '. Mensaje: ' + message;
      var waLink = form.getAttribute('data-whatsapp') + '?text=' + encodeURIComponent(waText);

      if(successBox) successBox.classList.add('show');
      form.reset();
      window.open(waLink, '_blank', 'noopener');
    });

    form.querySelectorAll('input, textarea').forEach(function(input){
      input.addEventListener('input', function(){
        var fieldEl = input.closest('.field');
        if(fieldEl) fieldEl.classList.remove('invalid');
      });
    });
  }

})();
