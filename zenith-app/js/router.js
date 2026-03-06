/* ============================================================
   ZENITH ROUTER
   Simple hash-based routing
   ============================================================ */

const ZenithRouter = {
    render() {
        const container = document.getElementById('page-container');
        const nav = document.getElementById('bottom-nav');

        if (!container) return;

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

        // Scroll to top on page change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    updateNavState() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const page = item.dataset.page;
            item.classList.toggle('active', page === ZenithState.currentPage);
        });
    }
};
