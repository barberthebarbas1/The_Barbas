(() => {
	const TRACK = document.querySelector('.carousel__track');
	const SLIDES = Array.from(document.querySelectorAll('.carousel__slide'));
	const DOTS = Array.from(document.querySelectorAll('.carousel__indicator'));
	if (!TRACK || SLIDES.length === 0) return;

	let currentIndex = 0;
	const slideCount = SLIDES.length;
	const AUTO_DELAY = 3500;
	const HERO_SHOW_DELAY = 600; // ms after slide becomes active
	const HERO_HIDE_BEFORE = 500; // ms before slide auto-advances to hide text
	let timer = null;
	let heroTimer = null;
	let isDragging = false;
	let startX = 0;
	let currentTranslate = 0;
	let prevTranslate = 0;
	let animationFrame = null;

	const setPosition = (index, animate = true) => {
		const width = TRACK.clientWidth;
		const x = -index * width;
		TRACK.style.transition = animate ? '' : 'none';
		// use transform to move
		TRACK.style.transform = `translateX(${x}px)`;
		currentIndex = index;
		updateDots();
		manageHeroText();
	};

	const updateDots = () => {
		DOTS.forEach((d, i) => {
			const pressed = i === currentIndex;
			d.classList.toggle('active', pressed);
			d.setAttribute('aria-pressed', String(pressed));
		});
	};

	const next = () => setPosition((currentIndex + 1) % slideCount);
	const prev = () => setPosition((currentIndex - 1 + slideCount) % slideCount);

	// Autoplay
	function startAuto() {
		stopAuto();
		timer = setInterval(() => next(), AUTO_DELAY);
		// if hero text is visible on first slide, schedule its hide before next
		manageHeroText();
	}
	function stopAuto(){ if (timer) { clearInterval(timer); timer = null } }

	// Pointer / touch handling for swipe
	function getEventX(e){ return e.touches ? e.touches[0].clientX : e.clientX }

	function onPointerDown(e){
		isDragging = true;
		startX = getEventX(e);
		prevTranslate = -currentIndex * TRACK.clientWidth;
		TRACK.style.transition = 'none';
		stopAuto();
		document.addEventListener('pointermove', onPointerMove, {passive:true});
		document.addEventListener('pointerup', onPointerUp);
		document.addEventListener('touchmove', onPointerMove, {passive:true});
		document.addEventListener('touchend', onPointerUp);
	}

	function onPointerMove(e){
		if (!isDragging) return;
		const x = getEventX(e);
		const dx = x - startX;
		currentTranslate = prevTranslate + dx;
		TRACK.style.transform = `translateX(${currentTranslate}px)`;
	}

	function onPointerUp(){
		if (!isDragging) return;
		isDragging = false;
		const movedBy = currentTranslate - prevTranslate;
		const threshold = TRACK.clientWidth * 0.15;
		if (movedBy < -threshold) {
			next();
		} else if (movedBy > threshold) {
			prev();
		} else {
			setPosition(currentIndex);
		}
		startAuto();
		document.removeEventListener('pointermove', onPointerMove);
		document.removeEventListener('pointerup', onPointerUp);
		document.removeEventListener('touchmove', onPointerMove);
		document.removeEventListener('touchend', onPointerUp);
	}

	// Indicator clicks
	DOTS.forEach(dot => dot.addEventListener('click', (e) => {
		const to = Number(dot.getAttribute('data-slide-to')) || 0;
		setPosition(to);
		startAuto();
	}));

	// Hero text control: handle multiple hero texts inside slides
	const HEROES = Array.from(document.querySelectorAll('.hero-text'));

	function clearHeroTimers(){ if (heroTimer){ clearTimeout(heroTimer); heroTimer = null } }

	function manageHeroText(){
		clearHeroTimers();
		if (HEROES.length === 0) return;
		// hide all first
		HEROES.forEach(h => h.classList.remove('visible'));
		// find hero for current slide (if any)
		const hero = HEROES[currentIndex];
		if (!hero) return;
		// show after delay
		heroTimer = setTimeout(() => {
			hero.classList.add('visible');
			// schedule hide before the next auto advance
			if (timer){
				const hideIn = AUTO_DELAY - HERO_HIDE_BEFORE;
				heroTimer = setTimeout(() => hero.classList.remove('visible'), hideIn);
			}
		}, HERO_SHOW_DELAY);
	}

	// Resize: ensure position stays correct
	window.addEventListener('resize', () => setPosition(currentIndex, false));

	// Initialize
	// ensure track width is stable by waiting next frame
	requestAnimationFrame(() => setPosition(0, false));
	// pointerdown on track for swipe
	TRACK.addEventListener('pointerdown', onPointerDown);
	TRACK.addEventListener('touchstart', onPointerDown, {passive:true});

	// pause when user focuses an indicator
	DOTS.forEach(d => d.addEventListener('focus', stopAuto));
	DOTS.forEach(d => d.addEventListener('blur', startAuto));

	// start autoplay
	startAuto();

})();

// Menú hamburguesa
document.addEventListener('DOMContentLoaded', () => {
	const hamburger = document.getElementById('hamburger');
	const navLinks = document.getElementById('navLinks');
	if (!hamburger || !navLinks) return;

	hamburger.addEventListener('click', (e) => {
		e.stopPropagation();
		hamburger.classList.toggle('active');
		navLinks.classList.toggle('active');
	});

	// Cerrar menú al hacer clic en un enlace
	const navItems = document.querySelectorAll('.nav-links a');
	navItems.forEach(item => {
		item.addEventListener('click', () => {
			hamburger.classList.remove('active');
			navLinks.classList.remove('active');
		});
	});

	// Cerrar menú al hacer clic fuera
	document.addEventListener('click', (e) => {
		if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
			hamburger.classList.remove('active');
			navLinks.classList.remove('active');
		}
	});
});

// footer small scripts
document.addEventListener('DOMContentLoaded', () => {
	const yearEl = document.getElementById('year');
	if (yearEl) yearEl.textContent = new Date().getFullYear();
	const form = document.querySelector('.footer-form');
	if (form){
		form.addEventListener('submit', (e)=>{
			e.preventDefault();
			// simple feedback (could be enhanced)
			alert('Gracias, su correo ha sido recibido');
			form.reset();
		})
	}
});
