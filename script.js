
/**
 * ============================================
 * HDPE PIPES WEBSITE - JAVASCRIPT FUNCTIONALITY
 * ============================================
 * This file contains all interactive features:
 * - Sticky header navigation
 * - Product image gallery with zoom
 * - Category carousel slider
 * - Image zoom overlay
 * - FAQ accordion
 * - Process tabs
 * - Quote request modal
 * - Datasheet download modal
 */

/**
 * STICKY HEADER MODULE
 * Manages the header that appears when scrolling down
 * Shows/hides header based on scroll position and direction
 */
const StickyHeader = (() => {
    const header = document.getElementById('stickyHeader');
    let lastScrollY = 0;
    let isVisible = false;
    let ticking = false;

    // Initialize event listeners
    function init() {
        if (!header) return;
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Throttle scroll events using requestAnimationFrame
    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }

    // Update header visibility based on scroll position
    function update() {
        const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
        const triggerPoint = window.innerHeight;
        const isScrollingDown = scrollY > lastScrollY;
        const isPastFirstFold = scrollY > triggerPoint;

        if (isPastFirstFold && isScrollingDown && !isVisible) {
            show();
        } else if ((!isPastFirstFold || !isScrollingDown) && isVisible) {
            hide();
        }

        lastScrollY = scrollY;
        ticking = false;
    }

    // Show sticky header with CSS class
    function show() {
        header.classList.add('visible');
        isVisible = true;
    }

    // Hide sticky header
    function hide() {
        header.classList.remove('visible');
        isVisible = false;
    }

    return { init };
})();

/**
 * PRODUCT GALLERY MODULE
 * Manages product image gallery with:
 * - Image navigation (prev/next buttons)
 * - Thumbnail selection
 * - Image zoom on hover
 */
const ProductGallery = (() => {
    const mainImage = document.getElementById('mainImage');
    const prevBtn = document.getElementById('prevImg');
    const nextBtn = document.getElementById('nextImg');
    const mainImageWrap = document.getElementById('mainImageWrap');
    const thumbStrip = document.getElementById('thumbStrip');
    const zoomLens = document.getElementById('zoomLens');
    const zoomResult = document.getElementById('zoomResult');

    // Zoom magnification level
    const ZOOM = 2.5;
    let currentIndex = 0;
    let images = [];

    // Initialize gallery functionality
    function init() {
        if (!mainImage || !thumbStrip) return;

        // Load all image URLs from thumbnails
        const thumbBtns = thumbStrip.querySelectorAll('.thumb-btn');
        thumbBtns.forEach((btn, i) => {
            images.push(btn.dataset.full || btn.querySelector('img').src);
            btn.addEventListener('click', () => goTo(i));
        });

        // Add navigation button listeners
        if (prevBtn) prevBtn.addEventListener('click', prev);
        if (nextBtn) nextBtn.addEventListener('click', next);

        // Add zoom lens listeners (hover to zoom)
        if (mainImageWrap && zoomLens && zoomResult) {
            mainImageWrap.addEventListener('mousemove', onZoomMove);
            mainImageWrap.addEventListener('mouseenter', onZoomEnter);
            mainImageWrap.addEventListener('mouseleave', onZoomLeave);
        }
    }

    // Show zoom lens and prepare zoomed image
    function onZoomEnter() {
        const lensW = mainImageWrap.offsetWidth / (ZOOM * 1.6);
        const lensH = mainImageWrap.offsetHeight / (ZOOM * 1.6);
        zoomLens.style.width = lensW + 'px';
        zoomLens.style.height = lensH + 'px';

        zoomResult.style.backgroundImage = 'url("' + images[currentIndex] + '")';
        const resultScale = 0.50;
        zoomResult.style.backgroundSize = (mainImageWrap.offsetWidth * ZOOM * resultScale) + 'px ' + (mainImageWrap.offsetHeight * ZOOM * resultScale) + 'px';
        zoomResult.classList.add('zoom-active');
    }

    // Update zoom position as mouse moves
    function onZoomMove(e) {
        const rect = mainImageWrap.getBoundingClientRect();
        const lensW = zoomLens.offsetWidth;
        const lensH = zoomLens.offsetHeight;

        let x = e.clientX - rect.left - lensW / 2;
        let y = e.clientY - rect.top - lensH / 2;

        x = Math.max(0, Math.min(x, rect.width - lensW));
        y = Math.max(0, Math.min(y, rect.height - lensH));

        zoomLens.style.left = x + 'px';
        zoomLens.style.top = y + 'px';

        const bgX = -(x * ZOOM * 0.50);
        const bgY = -(y * ZOOM * 0.50);
        zoomResult.style.backgroundPosition = bgX + 'px ' + bgY + 'px';
    }

    // Hide zoom on mouse leave
    function onZoomLeave() {
        zoomResult.classList.remove('zoom-active');
    }

    // Navigate to specific image
    function goTo(index) {
        currentIndex = (index + images.length) % images.length;
        mainImage.src = images[currentIndex];

        // Update zoom image if zoom is active
        if (zoomResult && zoomResult.classList.contains('zoom-active')) {
            zoomResult.style.backgroundImage = 'url("' + images[currentIndex] + '")';
        }
        updateThumbs();
    }

    // Navigate to previous image
    function prev() { goTo(currentIndex - 1); }
    
    // Navigate to next image
    function next() { goTo(currentIndex + 1); }

    // Update thumbnail active state
    function updateThumbs() {
        const thumbBtns = thumbStrip.querySelectorAll('.thumb-btn');
        thumbBtns.forEach((btn, i) => {
            btn.classList.toggle('active', i === currentIndex);
        });
    }

    return { init };
})();

/**
 * CATEGORY CAROUSEL MODULE
 * Carousel slider showing industry applications
 * Supports keyboard/touch navigation and responsive breakpoints
 */
const CategoryCarousel = (() => {
    const track = document.getElementById('catTrack');
    const prevBtn = document.getElementById('catPrev');
    const nextBtn = document.getElementById('catNext');
    const dotsContainer = document.getElementById('catDots');

    let currentIndex = 0;
    let cards = [];
    let visibleCount = 4; // Number of visible cards at once

    // Initialize carousel
    function init() {
        if (!track) return;

        cards = Array.from(track.querySelectorAll('.cat-card'));
        if (cards.length === 0) return;

        updateVisibleCount();
        buildDots();
        attachNavListeners();
        attachCardListeners();

        // Update on window resize
        window.addEventListener('resize', debounce(() => {
            updateVisibleCount();
            buildDots();
            goTo(Math.min(currentIndex, maxIndex()));
        }, 250), { passive: true });
    }

    // Determine how many cards to show based on screen width
    function updateVisibleCount() {
        const w = window.innerWidth;
        if (w >= 1440) visibleCount = 4;
        else if (w >= 1024) visibleCount = 3;
        else if (w >= 640) visibleCount = 2;
        else visibleCount = 1;
    }

    // Get maximum carousel index
    function maxIndex() {
        return Math.max(0, cards.length - visibleCount);
    }

    // Create navigation dots
    function buildDots() {
        if (!dotsContainer) return;

        while (dotsContainer.firstChild) {
            dotsContainer.removeChild(dotsContainer.firstChild);
        }
        const count = maxIndex() + 1;
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('button');
            dot.className = 'cat-dot' + (i === currentIndex ? ' active' : '');
            dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
            dot.dataset.dotIndex = i;
            dot.addEventListener('click', () => goTo(i));
            dotsContainer.appendChild(dot);
        }
    }

    // Add listeners to prev/next buttons
    function attachNavListeners() {
        if (prevBtn) prevBtn.addEventListener('click', prev);
        if (nextBtn) nextBtn.addEventListener('click', next);
    }

    // Open zoom overlay when card is clicked
    function attachCardListeners() {
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const zoomSrc = card.dataset.zoom;
                const titleEl = card.querySelector('h3');
                const title = titleEl ? titleEl.textContent : 'Image preview';
                if (zoomSrc) ZoomOverlay.open(zoomSrc, title);
            });
        });
    }

    // Navigate to previous slide
    function prev() { goTo(currentIndex - 1); }
    
    // Navigate to next slide
    function next() { goTo(currentIndex + 1); }

    // Navigate to specific index
    function goTo(index) {
        currentIndex = Math.max(0, Math.min(index, maxIndex()));
        applyTransform();
        updateDots();
    }

    // Apply CSS transform to move carousel
    function applyTransform() {
        if (cards.length === 0) return;
        const cardWidth = cards[0].offsetWidth;
        const gap = 20;
        const offset = currentIndex * (cardWidth + gap);
        track.style.transform = 'translateX(-' + offset + 'px)';
    }

    // Update dot active states
    function updateDots() {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll('.cat-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    return { init };
})();

/**
 * ZOOM OVERLAY MODULE
 * Full-screen image zoom with keyboard support
 */
const ZoomOverlay = (() => {
    const overlay = document.getElementById('zoomOverlay');
    const img = document.getElementById('zoomImg');
    const closeBtn = document.getElementById('zoomClose');
    let isOpen = false;

    // Initialize zoom overlay
    function init() {
        if (!overlay) return;
        if (closeBtn) closeBtn.addEventListener('click', close);
        // Close when clicking overlay background
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) close();
        });
    }

    // Open zoom overlay with image
    function open(src, alt) {
        if (!overlay || !img) return;
        img.src = src;
        img.alt = alt || 'Zoomed image';
        overlay.removeAttribute('hidden');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.classList.add('zoom-active');
            });
        });
        isOpen = true;
        document.body.style.overflow = 'hidden';
    }

    // Close zoom overlay
    function close() {
        if (!overlay) return;
        overlay.classList.remove('zoom-active');
        isOpen = false;
        document.body.style.overflow = '';
        setTimeout(() => {
            overlay.setAttribute('hidden', '');
            img.src = '';
        }, 280);
    }

    return { init, open, close };
})();

/**
 * FAQ ACCORDION MODULE
 * Expandable/collapsible FAQ items
 * Only one item open at a time
 */
const FAQ = (() => {
    function init() {
        const faqList = document.getElementById('faqList');
        if (!faqList) return;

        faqList.addEventListener('click', (e) => {
            const btn = e.target.closest('.faq-q');
            if (!btn) return;
            const item = btn.closest('.faq-item');
            const isCurrentlyOpen = item.classList.contains('open');

            // Close all other items
            faqList.querySelectorAll('.faq-item.open').forEach(el => {
                el.classList.remove('open');
                const q = el.querySelector('.faq-q');
                if (q) q.setAttribute('aria-expanded', 'false');
            });

            // Toggle current item
            if (!isCurrentlyOpen) {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    }

    return { init };
})();

/**
 * PROCESS TABS MODULE
 * Tab-based process steps display
 * Supports keyboard navigation
 */
const ProcessTabs = (() => {
    const panes = () => Array.from(document.querySelectorAll('.process-pane'));
    const tabs = () => Array.from(document.querySelectorAll('.process-tab'));

    // Navigate to specific step
    function goToIndex(index) {
        const allPanes = panes();
        const allTabs = tabs();
        if (!allPanes.length) return;
        const clamped = Math.max(0, Math.min(index, allPanes.length - 1));
        allPanes.forEach((p, i) => p.classList.toggle('active', i === clamped));
        allTabs.forEach((t, i) => t.classList.toggle('active', i === clamped));
    }

    // Get current active step index
    function currentIndex() {
        return panes().findIndex(p => p.classList.contains('active'));
    }

    // Initialize tab functionality
    function init() {
        const allTabs = tabs();
        if (allTabs.length === 0) return;

        // Tab click listeners
        allTabs.forEach((tab, i) => {
            tab.addEventListener('click', () => goToIndex(i));
        });

        // Mobile prev/next button listeners
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.process-mobile-btn[data-dir]');
            if (!btn) return;
            const dir = btn.dataset.dir;
            const idx = currentIndex();
            if (dir === 'prev') goToIndex(idx - 1);
            else if (dir === 'next') goToIndex(idx + 1);
        });
    }

    return { init };
})();

/**
 * QUOTE REQUEST MODAL MODULE
 * Modal form for requesting custom quotes
 * Validates user input before submission
 */
const QuoteModal = (() => {
    const overlay = document.getElementById('rqModalOverlay');
    const form = document.getElementById('rqForm');
    const body = document.getElementById('rqModalBody');
    const success = document.getElementById('rqModalSuccess');
    const errorEl = document.getElementById('rqError');

    // Initialize quote modal
    function init() {
        if (!overlay) return;

        // Open modal when any trigger button is clicked
        document.querySelectorAll('[data-rq-trigger]').forEach(btn => {
            btn.addEventListener('click', open);
        });

        // Close modal on overlay click or close button
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.closest('#rqModalClose') || e.target.closest('#rqSuccessClose')) close();
        });
        // Close with Escape key
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) close(); });

        // Handle form submission
        const submitBtn = document.getElementById('rqSubmitBtn');
        if (submitBtn) submitBtn.addEventListener('click', handleSubmit);
    }

    // Open modal
    function open() {
        overlay.removeAttribute('hidden');
        requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('rq-open')));
        document.body.style.overflow = 'hidden';
    }

    // Close modal
    function close() {
        overlay.classList.remove('rq-open');
        document.body.style.overflow = '';
        setTimeout(() => {
            overlay.setAttribute('hidden', '');
            body.hidden = false;
            success.hidden = true;
            if (form) {
                form.reset();
                errorEl.hidden = true;
                form.querySelectorAll('.rq-invalid').forEach(el => el.classList.remove('rq-invalid'));
            }
        }, 260);
    }

    // Validate and submit form
    function handleSubmit() {
        const name = document.getElementById('rqName');
        const email = document.getElementById('rqEmail');
        let valid = true;

        // Validate required fields
        [name, email].forEach(el => {
            el.classList.remove('rq-invalid');
            if (!el.value.trim()) { el.classList.add('rq-invalid'); valid = false; }
        });
        // Validate email format
        if (email.value && !email.value.includes('@')) { email.classList.add('rq-invalid'); valid = false; }

        if (!valid) { errorEl.hidden = false; return; }
        errorEl.hidden = true;
        // Show success message
        body.hidden = true;
        success.hidden = false;
    }

    return { init };
})();

/**
 * DATASHEET DOWNLOAD MODAL MODULE
 * Modal form for downloading technical datasheets
 */
const DatasheetModal = (() => {
    const overlay = document.getElementById('dsModalOverlay');
    const form = document.getElementById('dsForm');
    const body = document.getElementById('dsModalBody');
    const success = document.getElementById('dsModalSuccess');
    const errorEl = document.getElementById('dsError');
    const triggerBtn = document.querySelector('.btn-specs-download');

    // Initialize datasheet modal
    function init() {
        if (!overlay) return;
        // Open modal when download button is clicked
        if (triggerBtn) triggerBtn.addEventListener('click', open);

        // Close on overlay click
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        // Close with Escape key
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

        // Close buttons
        overlay.addEventListener('click', (e) => {
            if (e.target.closest('#dsModalClose') || e.target.closest('#dsModalClose2') || e.target.closest('#dsSuccessClose')) close();
        });

        // Handle form submission
        const submitBtn = document.getElementById('dsSubmitBtn');
        if (submitBtn) submitBtn.addEventListener('click', handleSubmit);
    }

    // Open modal
    function open() {
        overlay.removeAttribute('hidden');
        requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('ds-open')));
        document.body.style.overflow = 'hidden';
    }

    // Close modal
    function close() {
        overlay.classList.remove('ds-open');
        document.body.style.overflow = '';
        setTimeout(() => {
            overlay.setAttribute('hidden', '');
            body.hidden = false;
            success.hidden = true;
            if (form) {
                form.reset();
                errorEl.hidden = true;
                form.querySelectorAll('.ds-invalid').forEach(el => el.classList.remove('ds-invalid'));
            }
        }, 260);
    }

    // Validate and submit form
    function handleSubmit() {
        const email = document.getElementById('dsEmail');
        email.classList.remove('ds-invalid');

        // Validate email
        if (!email.value.trim() || !email.value.includes('@')) {
            email.classList.add('ds-invalid');
            errorEl.hidden = false;
            return;
        }
        errorEl.hidden = true;
        // Show success message
        body.hidden = true;
        success.hidden = false;
    }

    return { init };
})();

/**
 * UTILITY FUNCTION
 * Debounce function to limit how often expensive operations run
 */
function debounce(fn, wait) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
    };
}

/**
 * INITIALIZATION
 * Initialize all modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    StickyHeader.init();
    ProductGallery.init();
    CategoryCarousel.init();
    ZoomOverlay.init();
    FAQ.init();
    ProcessTabs.init();
    QuoteModal.init();
    DatasheetModal.init();
});
