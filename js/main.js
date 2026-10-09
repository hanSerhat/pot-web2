/* ==========================================================================
   POT — Arayüz davranışları
   Navigasyon, mobil menü, kaydırma animasyonları, S.S.S. ve iletişim formu
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Navigasyon arka planı ---------- */
  var nav = doc.querySelector('[data-nav]');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobil menü ---------- */
  var toggle = doc.querySelector('.nav__toggle');
  var menu = doc.getElementById('mobile-menu');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    root.classList.toggle('menu-open', open);
  }

  toggle.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 1081px)').addEventListener('change', function (e) {
    if (e.matches) setMenu(false);
  });

  /* ---------- Menü harf animasyonu ----------
     Bağlantı metni harflere bölünür; basınca harfler sırayla yukarı
     yuvarlanır ve alttaki kopyaları yerine gelir (Dala gibi). */
  function splitChars(link) {
    var text = link.textContent.trim(), i = 0;
    link.setAttribute('aria-label', text);
    link.textContent = '';
    text.split(' ').forEach(function (word, w) {
      if (w) link.appendChild(doc.createTextNode(' '));
      var wordEl = doc.createElement('span');
      wordEl.className = 'split-word';
      wordEl.setAttribute('aria-hidden', 'true');
      Array.from(word).forEach(function (ch) {
        var c = doc.createElement('span');
        c.className = 'split-char';
        c.style.setProperty('--i', i++);
        c.textContent = ch;
        wordEl.appendChild(c);
      });
      link.appendChild(wordEl);
    });
  }

  // Animasyonu baştan oynatır; aktif bölümün bağlantısı oynamaz
  function rollChars(link) {
    if (link.classList.contains('is-active')) return;
    link.classList.remove('is-rolling');
    void link.offsetWidth;
    link.classList.add('is-rolling');
  }

  if (!reduceMotion) {
    doc.querySelectorAll('.nav__link, .mobile-menu__link').forEach(function (link) {
      splitChars(link);
      link.addEventListener('pointerdown', function () { rollChars(link); });
      link.addEventListener('animationend', function (e) {
        if (e.target === link.lastElementChild.lastElementChild) link.classList.remove('is-rolling');
      });
    });
  }

  /* ---------- Aktif bölüm vurgusu ---------- */
  var links = Array.prototype.slice.call(doc.querySelectorAll('.nav__link, .mobile-menu__link'));
  var sections = ['top', 'product_1', 'product_2', 'faq', 'contact']
    .map(function (id) { return doc.getElementById(id); })
    .filter(Boolean);

  function setActive(id) {
    links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + id); });
  }

  if ('IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navIO.observe(s); });
  }

  /* ---------- Kaydırınca beliren öğeler ---------- */
  var revealEls = doc.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- S.S.S. akordeon ---------- */
  doc.querySelectorAll('.faq__item').forEach(function (item) {
    var btn = item.querySelector('.faq__q');
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      item.classList.toggle('is-open', open);
    });
  });

  /* ---------- İletişim formu ---------- */
  var form = doc.querySelector('[data-contact-form]');
  if (!form) return;

  var status = form.querySelector('[data-form-status]');
  var submitBtn = form.querySelector('button[type="submit"]');
  var submitLabel = form.querySelector('[data-submit-label]');
  var success = doc.querySelector('[data-form-success]');
  var EMAIL = 'info@pot-ai.com';

  // Ürünlerdeki "Bilgi Al" butonu formdaki çözümü önceden seçer
  doc.querySelectorAll('[data-solution]').forEach(function (a) {
    a.addEventListener('click', function () {
      var value = a.getAttribute('data-solution');
      form.querySelectorAll('input[name="solution"]').forEach(function (r) { r.checked = r.value === value; });
    });
  });

  form.querySelectorAll('.input').forEach(function (input) {
    input.addEventListener('input', function () { input.classList.remove('is-invalid'); });
  });

  function validate() {
    var firstInvalid = null;
    form.querySelectorAll('.input[required], .input[type="email"]').forEach(function (input) {
      var ok = input.checkValidity();
      input.classList.toggle('is-invalid', !ok);
      if (!ok && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) {
      status.textContent = firstInvalid.type === 'email' && firstInvalid.value
        ? 'Lütfen geçerli bir e-posta adresi girin.'
        : 'Lütfen zorunlu alanları doldurun.';
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  function showError(data) {
    var body = [
      'Ad Soyad: ' + data.name,
      'Kurum: ' + (data.company || '-'),
      'E-posta: ' + data.email,
      'Telefon: ' + (data.phone || '-'),
      'Bilgi İstenilen Çözüm: ' + data.solution,
      '',
      data.message || ''
    ].join('\n');
    var mail = doc.createElement('a');
    mail.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('POT — ' + data.solution) + '&body=' + encodeURIComponent(body);
    mail.textContent = EMAIL;

    status.textContent = 'Mesajınız şu an gönderilemedi. Dilerseniz doğrudan ';
    status.appendChild(mail);
    status.appendChild(doc.createTextNode(' adresine e-posta gönderebilirsiniz.'));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.textContent = '';
    if (!validate()) return;

    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = String(value).trim(); });

    // Bot tuzağı doluysa sessizce başarılı görün
    if (data.website) { form.hidden = true; success.hidden = false; return; }

    submitBtn.disabled = true;
    submitLabel.textContent = 'Gönderiliyor…';

    fetch(form.getAttribute('data-endpoint'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('İstek başarısız (' + res.status + ')');
        form.reset();
        form.hidden = true;
        success.hidden = false;
      })
      .catch(function () { showError(data); })
      .then(function () {
        submitBtn.disabled = false;
        submitLabel.textContent = 'Gönder';
      });
  });
})();
