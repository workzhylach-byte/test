(function () {
  'use strict';

  /* ---------- Мобильное меню ---------- */
  var header = document.querySelector('.header');
  var burger = header && header.querySelector('.burger');
  if (burger) {
    var setMenu = function (open) {
      header.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    };
    burger.addEventListener('click', function () {
      setMenu(!header.classList.contains('is-open'));
    });
    header.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* ---------- Активный пункт меню при прокрутке ---------- */
  var navLinks = document.querySelectorAll('.nav__link[href^="#"]');
  var sections = Array.prototype.map.call(
    document.querySelectorAll('.header .nav__link[href^="#"]'),
    function (a) { return document.querySelector(a.getAttribute('href')); }
  ).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- FAQ-аккордеон (открыт один пункт) ---------- */
  document.querySelectorAll('[data-accordion]').forEach(function (list) {
    var items = list.querySelectorAll('.faq-item');
    items.forEach(function (item) {
      var btn = item.querySelector('.faq-item__q');
      btn.addEventListener('click', function () {
        var willOpen = !item.classList.contains('is-open');
        items.forEach(function (other) {
          other.classList.remove('is-open');
          other.querySelector('.faq-item__q').setAttribute('aria-expanded', 'false');
        });
        if (willOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  });

  /* ---------- Модальное окно с формой ---------- */
  var modal = document.getElementById('lead-modal');
  var modalTitle = modal && modal.querySelector('.modal__title');
  var lastTrigger = null;

  function openModal(title, trigger) {
    if (!modal) return;
    lastTrigger = trigger || null;
    if (modalTitle) modalTitle.textContent = title || 'Получите консультацию';
    var src = modal.querySelector('input[name="source"]');
    if (src) src.value = title || 'Получите консультацию';
    modal.hidden = false;
    document.body.classList.add('is-locked');
    requestAnimationFrame(function () { modal.classList.add('is-open'); });
    setTimeout(function () {
      var first = modal.querySelector('.field');
      if (first) first.focus({ preventScroll: true });
    }, 250);
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    setTimeout(function () { modal.hidden = true; }, 300);
    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-modal]');
    if (trigger) { e.preventDefault(); openModal(trigger.getAttribute('data-modal'), trigger); return; }
    if (e.target.closest('[data-modal-close]')) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (!modal || modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') {                       // фокус не уходит из окна
      var f = modal.querySelectorAll('button, input, a[href]');
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Экраны: главная, «Спасибо» (#thanks), 404 (#not-found), статья (#article) ---------- */
  var VIEWS = { '#thanks': 'view-thanks', '#not-found': 'view-not-found', '#article': 'view-article' };
  var NAV_ACTIVE = { '#article': '#resources' };     // какой пункт меню подсвечивать на экране
  var home = document.getElementById('view-home');
  var current = 'home';

  // блок «Рекомендуемые ресурсы» на вспомогательных экранах — копия блока с главной
  var resSrc = document.getElementById('resources');
  document.querySelectorAll('.js-resources-slot').forEach(function (slot) {
    if (!resSrc || slot.firstElementChild) return;
    var copy = resSrc.cloneNode(true);
    copy.removeAttribute('id');
    copy.classList.add('resources--plain');
    copy.querySelectorAll('[data-reveal]').forEach(function (el) { el.removeAttribute('data-reveal'); el.removeAttribute('data-stagger'); el.style.removeProperty('--reveal-delay'); el.classList.remove('is-visible'); });
    slot.appendChild(copy);
  });

  function route() {
    var key = VIEWS[location.hash] ? location.hash : 'home';
    var changed = key !== current;
    current = key;
    if (home) home.hidden = key !== 'home';
    Object.keys(VIEWS).forEach(function (h) {
      var v = document.getElementById(VIEWS[h]);
      if (v) v.hidden = h !== key;
    });
    document.body.setAttribute('data-view', key === 'home' ? 'home' : key.slice(1));
    document.querySelectorAll('.nav__link').forEach(function (a) {
      var target = key === 'home' ? '#platform' : (NAV_ACTIVE[key] || '');
      a.classList.toggle('is-active', a.getAttribute('href') === target);
    });
    if (key !== 'home' && changed) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      var t = document.querySelector('#' + VIEWS[key] + ' h1');
      if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
    }
  }
  window.addEventListener('hashchange', route);
  route();
  window.asysRoute = route;

  // ссылки на разделы главной со вспомогательных экранов: вернуться на главную и прокрутить к разделу
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || current === 'home' || a.hasAttribute('data-modal')) return;
    var target = a.getAttribute('href');
    if (VIEWS[target] || target.indexOf('#art-') === 0) return;
    e.preventDefault();
    history.pushState(null, '', location.pathname + location.search);
    route();
    var el = target.length > 1 ? document.querySelector(target) : null;
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (el && target !== '#platform') setTimeout(function () { el.scrollIntoView(); }, 30);
  });

  /* ---------- Оглавление статьи: подсветка текущего раздела ---------- */
  var tocLinks = document.querySelectorAll('.toc__link');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var tocIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        tocLinks.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('.article__section').forEach(function (s) { tocIO.observe(s); });
  }
  tocLinks.forEach(function (l) {
    l.addEventListener('click', function (e) {
      e.preventDefault();
      var s = document.querySelector(l.getAttribute('href'));
      if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ---------- Формы заявки (в секции и в модальном окне) ---------- */
  document.querySelectorAll('.js-lead-form').forEach(function (form) {
    var status = form.querySelector('.form__status');
    var phone = form.querySelector('input[type="tel"]');

    if (phone) {
      phone.addEventListener('input', function () {
        phone.value = phone.value.replace(/[^\d+()\-\s]/g, '');
      });
    }

    form.querySelectorAll('.field, input[type="checkbox"]').forEach(function (el) {
      el.addEventListener('input', function () {
        el.classList.remove('is-invalid');
        var check = el.closest('.check');
        if (check) check.classList.remove('is-invalid');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (el) {
        var valid = el.type === 'checkbox' ? el.checked : el.checkValidity() && el.value.trim() !== '';
        if (!valid) {
          ok = false;
          if (el.type === 'checkbox') el.closest('.check').classList.add('is-invalid');
          else el.classList.add('is-invalid');
        }
      });
      if (!ok) {
        if (status) status.textContent = 'Заполните ФИО, корректный e-mail и подтвердите согласие на обработку данных.';
        return;
      }
      if (status) status.textContent = '';
      // TODO: подключить отправку (fetch на обработчик сервера / CRM)
      form.reset();
      if (form.closest('#lead-modal')) closeModal();
      location.hash = 'thanks';
    });
  });
})();

/* ==========================================================================
   Анимации и интерактив
   ========================================================================== */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;

  /* ---------- Появление при прокрутке ---------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  if (!reduce && 'IntersectionObserver' in window) {
    // задержки для элементов внутри одной сетки — «лесенка»
    var groups = new Map();
    document.querySelectorAll('[data-stagger]').forEach(function (el) {
      var parent = el.parentElement;
      var i = groups.get(parent) || 0;
      el.style.setProperty('--reveal-delay', (i * 0.09).toFixed(2) + 's');
      groups.set(parent, i + 1);
    });
    root.classList.add('js-motion');
    // после появления снимаем атрибут, чтобы задержка и переходы появления не мешали hover-эффектам
    var show = function (el) {
      el.classList.add('is-visible');
      var done = function (ev) {
        if (ev && ev.target !== el) return;
        el.removeAttribute('data-reveal');
        el.style.removeProperty('--reveal-delay');
        el.removeEventListener('transitionend', done);
      };
      el.addEventListener('transitionend', done);
      setTimeout(done, 1600);
    };
    var vh = window.innerHeight;
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        // показываем и то, что пролистали слишком быстро (переход по якорю, рывок колесом)
        if (e.isIntersecting || e.boundingClientRect.top < 0) { show(e.target); ro.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) {
      // то, что уже на первом экране, показываем сразу
      if (el.getBoundingClientRect().top < vh) show(el);
      else ro.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Шапка, прогресс, кнопка «наверх» ---------- */
  var header = document.querySelector('.header');
  var progress = document.querySelector('.scroll-progress');
  var toTop = document.querySelector('.to-top');
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
    if (header) {
      header.classList.toggle('is-scrolled', y > 20);
      if (y > 400 && y > lastY + 4) header.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 400) header.classList.remove('is-hidden');
    }
    if (toTop) toTop.classList.toggle('is-shown', y > window.innerHeight * 1.2);
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (toTop) toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  if (reduce || !finePointer) return;

  /* ---------- Подсветка под курсором (карточки направлений, CTA) ---------- */
  document.querySelectorAll('.sol-card, .cta-card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- 3D-наклон карточек CTA ---------- */
  document.querySelectorAll('.cta-card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'rotateY(' + (px * 8).toFixed(2) + 'deg) rotateX(' + (-py * 8).toFixed(2) + 'deg) translateY(-4px)';
    });
    card.addEventListener('pointerleave', function () { card.style.transform = ''; });
  });

  /* ---------- Параллакс схемы в hero ---------- */
  var hero = document.querySelector('.hero');
  var visual = document.querySelector('.hero__visual-inner');
  if (hero && visual) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      visual.style.transform = 'translate(' + (px * -14).toFixed(1) + 'px,' + (py * -10).toFixed(1) + 'px) rotateY(' + (px * 4).toFixed(2) + 'deg)';
    });
    hero.addEventListener('pointerleave', function () { visual.style.transform = ''; });
  }

  /* ---------- Магнитные кнопки ---------- */
  document.querySelectorAll('.hero__btn, .form__submit, .to-top').forEach(function (btn) {
    btn.addEventListener('pointermove', function (e) {
      var r = btn.getBoundingClientRect();
      var dx = (e.clientX - r.left - r.width / 2) * 0.15;
      var dy = (e.clientY - r.top - r.height / 2) * 0.25;
      btn.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + (dy - 2).toFixed(1) + 'px)';
    });
    btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
  });
})();
