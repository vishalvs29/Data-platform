/* ============================================================
   ZENITH APP ENTRY POINT
   ============================================================ */

(function () {
    'use strict';

    // Subscribe router to state changes
    ZenithState.subscribe(() => {
        ZenithRouter.render();
    });

    // Set up navigation event listeners
    document.addEventListener('DOMContentLoaded', () => {
        // Bottom nav click handlers
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;

                if (page === 'calm') {
                    ZenithState.startCalmNow();
                } else {
                    ZenithState.navigateTo(page);
                }
            });
        });

        // Add ambient particles
        createAmbientParticles();

        // Initial render
        ZenithRouter.render();

        // Add smooth transition class to body
        document.body.classList.add('animate-fade-in');

        console.log('%c✦ Zenith Premium Wellness', 'color: #14b8a6; font-size: 20px; font-weight: bold;');
        console.log('%cEnterprise Mental Health Platform', 'color: #94a3b8; font-size: 12px;');
        console.log('%cE2E Encrypted · No employer access · HIPAA-aligned', 'color: #22c55e; font-size: 11px;');
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
            if (ZenithState.calmNowActive) {
                ZenithState.closeCalmNow();
            } else if (ZenithState.currentPage === 'active') {
                ZenithState.stopSession();
            } else if (ZenithState.currentPage === 'detail') {
                ZenithState.goBack();
            }
        }

        // Space to toggle player
        if (e.key === ' ' && ZenithState.currentPage === 'active') {
            e.preventDefault();
            ZenithState.togglePlayer();
        }
    });

})();
