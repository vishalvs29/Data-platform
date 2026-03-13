/* ============================================================
   DRMINDIT ROUTER
   Simple hash-based routing
   ============================================================ */

const DrMinditRouter = {
    init() {
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            if (DrMinditData.platforms[hash]) {
                DrMinditState.switchPlatform(hash);
            } else if (hash === '' || hash === '/') {
                DrMinditState.switchPlatform(null);
            }
        });

        // Handle initial hash
        const initialHash = window.location.hash.replace('#', '');
        if (DrMinditData.platforms[initialHash]) {
            DrMinditState.currentPlatform = initialHash;
        }
    },

    render() {
        const container = document.getElementById('page-container');
        const nav = document.getElementById('bottom-nav');

        if (!container) return;

        // If no platform selected, show gateway
        if (!DrMinditState.currentPlatform) {
            container.innerHTML = DrMinditPages.gateway();
            if (nav) nav.classList.add('hidden');
            return;
        }

        let html = '';
        let showNav = true;

        switch (DrMinditState.currentPage) {
            case 'home':
                html = DrMinditPages.home();
                break;
            case 'explore':
                html = DrMinditPages.explore();
                break;
            case 'detail':
                html = DrMinditPages.detail();
                break;
            case 'active':
                html = DrMinditPages.active();
                showNav = false;
                break;
            case 'analytics':
                html = DrMinditPages.analytics();
                break;
            case 'profile':
                html = DrMinditPages.profile();
                break;
            case 'resilience':
                html = DrMinditPages.resilience();
                break;
            default:
                html = DrMinditPages.home();
        }

        // Handle calm now overlay
        if (DrMinditState.calmNowActive) {
            html += DrMinditComponents.calmNowOverlay();
            showNav = false;
        }

        // Handle mood check-in/out modals
        if (DrMinditState.showMoodCheckIn) {
            html += DrMinditComponents.moodCheckInModal();
        } else if (DrMinditState.showMoodCheckOut) {
            html += DrMinditComponents.moodCheckOutModal();
        }

        container.innerHTML = html;

        // Toggle nav visibility
        if (nav) {
            nav.classList.toggle('hidden', !showNav);
        }

        // Update nav active state
        this.updateNavState();

        // Scroll to top on page change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },


    updateNavState() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const page = item.dataset.page;
            item.classList.toggle('active', page === DrMinditState.currentPage);
        });
    }
};
