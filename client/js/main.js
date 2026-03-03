const API_BASE = 'https://avance-barber-shop-production.up.railway.app';
const GOOGLE_CLIENT_ID = '152616246298-ri5h7nuciskm90933ptih312f595n7uv.apps.googleusercontent.com';

// Google user session
let googleUser = null;
let googleCredential = null;

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

    // --- 8. Google Sign-In ---
    const googleAuthSection = document.getElementById('google-auth-section');
    const userInfoSection = document.getElementById('user-info');
    const bookingForm = document.getElementById('booking-form');

    // Initialize Google Sign-In
    function initGoogleSignIn() {
        if (typeof google === 'undefined' || !google.accounts) {
            // GIS not loaded yet, retry
            setTimeout(initGoogleSignIn, 500);
            return;
        }

        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
            auto_select: false
        });

        google.accounts.id.renderButton(
            document.getElementById('google-signin-btn'),
            {
                theme: 'outline',
                size: 'large',
                width: 320,
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'center'
            }
        );
    }

    initGoogleSignIn();

    // Handle Google Sign-In callback
    async function handleGoogleSignIn(response) {
        googleCredential = response.credential;

        try {
            const res = await fetch(`${API_BASE}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: googleCredential })
            });
            const data = await res.json();

            if (data.ok) {
                googleUser = data.user;
                showBookingForm();
            } else {
                alert('Errore di autenticazione Google');
            }
        } catch (err) {
            console.error('Google auth error:', err);
            alert('Errore di connessione. Riprova.');
        }
    }

    function showBookingForm() {
        googleAuthSection.style.display = 'none';
        userInfoSection.style.display = 'flex';
        bookingForm.style.display = 'block';

        document.getElementById('user-avatar').src = googleUser.picture || '';
        document.getElementById('user-name').textContent = googleUser.name;
        document.getElementById('user-email').textContent = googleUser.email;

        // Pre-fill name from Google
        const nameInput = document.getElementById('name');
        if (!nameInput.value) {
            nameInput.value = googleUser.name;
        }
    }

    function hideBookingForm() {
        googleAuthSection.style.display = 'block';
        userInfoSection.style.display = 'none';
        bookingForm.style.display = 'none';
        googleUser = null;
        googleCredential = null;

        // Re-render Google button
        initGoogleSignIn();
    }

    // Sign out
    document.getElementById('signout-btn').addEventListener('click', () => {
        google.accounts.id.disableAutoSelect();
        hideBookingForm();
    });

    // --- 9. Booking System ---
    const dateInput = document.getElementById('booking-date');
    const slotSelect = document.getElementById('booking-slot');
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

        if (!googleCredential) {
            alert('Devi accedere con Google per prenotare');
            return;
        }

        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Attendere...';
        submitBtn.disabled = true;

        const formData = new FormData(bookingForm);
        const data = Object.fromEntries(formData.entries());
        data.googleCredential = googleCredential;

        try {
            const res = await fetch(`${API_BASE}/api/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (result.ok) {
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

    // --- 10. Modal Close Function ---
    window.closeModal = function () {
        modal.classList.remove('active');
        modalDetails.innerHTML = '';
    };
});