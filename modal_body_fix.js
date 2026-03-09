/* MODAL BODY SCROLL LOCK - Ported from Galinhas Project */

(function() {
    let scrollPosition = 0;

    function lockScroll() {
        scrollPosition = window.pageYOffset;
        document.documentElement.classList.add('modal-open');
        document.body.classList.add('modal-open');
        document.body.style.top = `-${scrollPosition}px`;
    }

    function unlockScroll() {
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        document.body.style.top = '';
        window.scrollTo(0, scrollPosition);
    }

    // Observer to detect when the overlay class changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('open')) {
                    lockScroll();
                } else {
                    unlockScroll();
                }
            }
        });
    });

    // Initialize observers
    document.addEventListener('DOMContentLoaded', () => {
        const ckOverlay = document.getElementById('ckOverlay');
        if (ckOverlay) {
            observer.observe(ckOverlay, { attributes: true });
        }
    });

    // Fallback for direct function calls if used
    window.forceLockScroll = lockScroll;
    window.forceUnlockScroll = unlockScroll;
})();
