/* ============================================================
   DRMINDIT APP ENTRY POINT
   ============================================================ */

(function () {
    'use strict';

    // Subscribe router to state changes
    DrMinditState.subscribe(() => {
        DrMinditRouter.render();
    });

    // Set up navigation event listeners
    document.addEventListener('DOMContentLoaded', async () => {
        // Show loading state
        const app = document.getElementById('app');
        app.classList.add('loading-auth');

        // Initialize Auth and wait for profile sync
        if (window.DrMinditAuth) {
            await DrMinditAuth.init();
        }

        // Initialize Notifications
        if (window.DrMinditNotifications) {
            await DrMinditNotifications.init();
        }

        // Initialize Router
        if (window.DrMinditRouter) {
            DrMinditRouter.init();
        }

        // Bottom nav click handlers
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;

                if (page === 'calm') {
                    DrMinditState.startCalmNow();
                } else {
                    DrMinditState.navigateTo(page);
                }
            });
        });

        // Add ambient particles
        createAmbientParticles();

        // Remove loading state and Initial render
        app.classList.remove('loading-auth');
        DrMinditRouter.render();

        // Add smooth transition class to body
        document.body.classList.add('animate-fade-in');

        console.log('%c✦ DrMindit Premium Wellness', 'color: #14b8a6; font-size: 20px; font-weight: bold;');
        console.log('%cEnterprise Mental Health Platform', 'color: #94a3b8; font-size: 12px;');
        console.log('%cE2E Encrypted · No employer access · HIPAA-aligned', 'color: #22c55e; font-size: 11px;');

        // Check for notifications immediately and then every hour
        if (window.DrMinditNotifications) {
            DrMinditNotifications.checkAndNotify();
            setInterval(() => {
                DrMinditNotifications.checkAndNotify();
            }, 60 * 60 * 1000);
        }
    });

    // Create floating ambient particles
    function createAmbientParticles() {
        const particleContainer = document.createElement('div');
        particleContainer.className = 'ambient-particles';

        for (let i = 0; i < 12; i++) {
            const p = document.createElement('div');
            p.className = 'ambient-particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDelay = Math.random() * 8 + 's';
            p.style.animationDuration = (6 + Math.random() * 6) + 's';
            particleContainer.appendChild(p);
        }

        document.getElementById('app').prepend(particleContainer);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (DrMinditState.calmNowActive) {
                DrMinditState.closeCalmNow();
            } else if (DrMinditState.currentPage === 'active') {
                DrMinditState.stopSession();
            } else if (DrMinditState.currentPage === 'detail') {
                DrMinditState.goBack();
            }
        }

        // Space to toggle player
        if (e.key === ' ' && DrMinditState.currentPage === 'active') {
            e.preventDefault();
            DrMinditState.togglePlayer();
        }
    });

})();
