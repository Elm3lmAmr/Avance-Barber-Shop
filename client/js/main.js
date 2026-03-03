const API_BASE = 'https://avance-barber-shop-production.up.railway.app';

document.addEventListener('DOMContentLoaded', () => {

    // --- 0. Preloader ---
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => preloader.remove(), 600);
        }, 800);
    });

    // --- 1. Custom Luxury Cursor ---
    const cursorDot = document.getElementById('cursor-dot');
    const cursorOutline = document.getElementById('cursor-outline');

    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });

    // --- 2. Header Scroll Effect ---
    const header = document.querySelector('.site-header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    // --- 3. Mobile Hamburger Menu ---
    const mobileToggle = document.getElementById('mobile-toggle');
    const mainNav = document.getElementById('main-nav');

    mobileToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        const icon = mobileToggle.querySelector('i');
        if (mainNav.classList.contains('active')) {
            icon.classList.replace('fa-bars', 'fa-times');
        } else {
            icon.classList.replace('fa-times', 'fa-bars');
        }
    });

    // --- 4. Scroll Reveal Animations (all types) ---
    const observerOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .scale-in').forEach(el => observer.observe(el));

    // --- 5. Smooth Scroll with Header Offset ---
    const headerHeight = 90;

    document.querySelectorAll('a[href^="#"], .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('#')) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();

            // Close mobile nav if open
            mainNav.classList.remove('active');
            const icon = mobileToggle.querySelector('i');
            icon.classList.replace('fa-times', 'fa-bars');

            const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    // --- 6. Testimonials Carousel ---
    const slides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    let currentSlide = 0;
    let carouselInterval;

    function goToSlide(index) {
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        currentSlide = index;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    function nextSlide() {
        goToSlide((currentSlide + 1) % slides.length);
    }

    function startCarousel() {
        carouselInterval = setInterval(nextSlide, 5000);
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            clearInterval(carouselInterval);
            goToSlide(parseInt(dot.dataset.index));
            startCarousel();
        });
    });

    if (slides.length > 0) startCarousel();

    // --- 7. Back to Top Button ---
    const backToTop = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.scrollY > 400);
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- 8. Booking System ---
    const dateInput = document.getElementById('booking-date');
    const slotSelect = document.getElementById('booking-slot');
    const bookingForm = document.getElementById('booking-form');
    const submitBtn = document.getElementById('submit-btn');
    const modal = document.getElementById('success-modal');
    const modalDetails = document.getElementById('modal-details');

    // Restrict date picker to today and future dates
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);

    // Fetch Slots when Date changes
    dateInput.addEventListener('change', async (e) => {
        const date = e.target.value;
        slotSelect.innerHTML = '<option>Caricamento orari...</option>';
        slotSelect.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/api/slots?date=${date}`);
            const bookedSlots = await res.json();

            const allSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
            slotSelect.innerHTML = '<option value="">Scegli l\'orario</option>';

            allSlots.forEach(slot => {
                const isBooked = bookedSlots.includes(slot);
                const option = document.createElement('option');
                option.value = slot;
                option.disabled = isBooked;
                option.textContent = isBooked ? `${slot} (Prenotato)` : slot;
                slotSelect.appendChild(option);
            });
            slotSelect.disabled = false;
        } catch (err) {
            console.error("Error fetching slots", err);
            slotSelect.innerHTML = '<option value="">Errore di connessione</option>';
        }
    });

    // Submit Booking
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Attendere...';
        submitBtn.disabled = true;

        const formData = new FormData(bookingForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch(`${API_BASE}/api/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (result.ok) {
                // Populate modal with booking details
                const dateFormatted = new Date(data.date + 'T00:00:00').toLocaleDateString('it-IT', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });
                modalDetails.innerHTML = `
                    <div class="detail-row">
                        <span class="detail-label">Servizio</span>
                        <span class="detail-value">${data.service || '—'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Data</span>
                        <span class="detail-value">${dateFormatted}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Orario</span>
                        <span class="detail-value">${data.slot}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Nome</span>
                        <span class="detail-value">${data.name}</span>
                    </div>
                `;

                modal.classList.add('active');
                bookingForm.reset();
                slotSelect.innerHTML = '<option value="" disabled selected hidden>Seleziona prima la data</option>';
                slotSelect.disabled = true;
            } else {
                alert("Attenzione: " + result.message);
            }
        } catch (err) {
            alert("Errore del server. Riprova più tardi.");
        } finally {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    // --- 9. Modal Close Function ---
    window.closeModal = function () {
        modal.classList.remove('active');
        modalDetails.innerHTML = '';
    };
});