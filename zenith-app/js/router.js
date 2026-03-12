/* ============================================================
   ZENITH ROUTER
   Simple hash-based routing
   ============================================================ */

const ZenithRouter = {
    init() {
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            if (ZenithData.platforms[hash]) {
                ZenithState.switchPlatform(hash);
            } else if (hash === '' || hash === '/') {
                ZenithState.switchPlatform(null);
            }
        });

        // Handle initial hash
        const initialHash = window.location.hash.replace('#', '');
        if (ZenithData.platforms[initialHash]) {
            ZenithState.currentPlatform = initialHash;
        }
    },

    render() {
        const container = document.getElementById('page-container');
        const nav = document.getElementById('bottom-nav');

        if (!container) return;

        // If no platform selected, show gateway
        if (!ZenithState.currentPlatform) {
            container.innerHTML = ZenithPages.gateway();
            if (nav) nav.classList.add('hidden');
            return;
        }

        let html = '';
        let showNav = true;

        switch (ZenithState.currentPage) {
            case 'home':
                html = ZenithPages.home();
                break;
            case 'explore':
                html = ZenithPages.explore();
                break;
            case 'detail':
                html = ZenithPages.detail();
                break;
            case 'active':
                html = ZenithPages.active();
                showNav = false;
                break;
            case 'insights':
                html = ZenithPages.insights();
                break;
            case 'analytics':
                html = ZenithPages.analytics();
                break;
            case 'profile':
                html = ZenithPages.profile();
                break;
            case 'resilience':
                html = ZenithPages.resilience();
                break;
            default:
                html = ZenithPages.home();
        }

        // Handle calm now overlay
        if (ZenithState.calmNowActive) {
            html += ZenithComponents.calmNowOverlay();
            showNav = false;
        }

        // Handle mood check-in/out modals
        if (ZenithState.showMoodCheckIn) {
            html += ZenithComponents.moodCheckInModal();
        } else if (ZenithState.showMoodCheckOut) {
            html += ZenithComponents.moodCheckOutModal();
        }

        container.innerHTML = html;

        // Toggle nav visibility
        if (nav) {
            nav.classList.toggle('hidden', !showNav);
        }

        // Update nav active state
        this.updateNavState();
        this.updateNavBranding();

        // Scroll to top on page change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    updateNavBranding() {
        const platformBar = document.getElementById('nav-platform-bar');
        const iconEl = document.getElementById('nav-platform-icon');
        const nameEl = document.getElementById('nav-platform-name');

        if (!platformBar || !iconEl || !nameEl) return;

        const platform = ZenithData.platforms[ZenithState.currentPlatform];
        if (platform) {
            iconEl.textContent = platform.icon;
            nameEl.textContent = platform.title;
            platformBar.style.borderTop = `2px solid ${platform.themeColor}`;
            platformBar.style.color = platform.themeColor;
        } else {
            iconEl.textContent = '✦';
            nameEl.textContent = 'Zenith';
            platformBar.style.borderTop = 'none';
            platformBar.style.color = 'var(--text-muted)';
        }
    },

    updateNavState() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const page = item.dataset.page;
            item.classList.toggle('active', page === ZenithState.currentPage);
        });
    }
};
