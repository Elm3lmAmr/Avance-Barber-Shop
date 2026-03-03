const API_BASE = 'https://avance-barber-shop-production.up.railway.app';

document.addEventListener('DOMContentLoaded', () => {

    // --- 0. Custom Luxury Cursor ---
    const cursorDot = document.getElementById('cursor-dot');
    const cursorOutline = document.getElementById('cursor-outline');

    // Track mouse movement
    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        // Slight delay on the outline for a smooth trailing effect
        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });

    // --- 1. UI: Header Scroll Effect ---
    const header = document.querySelector('.site-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- 2. UI: Mobile Hamburger Menu ---
    const mobileToggle = document.getElementById('mobile-toggle');
    const mainNav = document.getElementById('main-nav');

    mobileToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        const icon = mobileToggle.querySelector('i');
        if (mainNav.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // --- 3. UI: Scroll Reveal Animations ---
    const observerOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));

    // --- 4. BACKEND LOGIC: Booking System (Preserved) ---
    const dateInput = document.getElementById('booking-date');
    const slotSelect = document.getElementById('booking-slot');
    const bookingForm = document.getElementById('booking-form');
    const submitBtn = document.getElementById('submit-btn');
    const modal = document.getElementById('success-modal');

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

            // Assuming standard shop hours 10am to 5pm
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

        // UX: Change button state
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
                // Show Success Modal instead of plain text
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
            // Restore button
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    // --- 5. UI: Modal Close Function ---
    window.closeModal = function () {
        modal.classList.remove('active');
    };
});