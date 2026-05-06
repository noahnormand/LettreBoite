const api = new TMDBApi();
const affichage = new Affichage();

document.addEventListener('DOMContentLoaded', () => {
    // Hamburger menu toggle
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    const isHomePage = document.getElementById('trending-grid') !== null;
    const isFocusPage = document.getElementById('media-details') !== null;

    if (isHomePage) {
        initHome();
    } else if (isFocusPage) {
        initFocus();
    }
});

async function initHome() {
    affichage.showLoader('trending-grid');
    affichage.showLoader('series-grid');
    affichage.showLoader('movies-grid');

    try {
        const trendingResponse = await api.getTrending('day');
        affichage.renderCards(trendingResponse.results, 'trending-grid');

        const seriesResponse = await api.getSeries('popular');
        affichage.renderCards(seriesResponse.results, 'series-grid');

        const moviesResponse = await api.getMovies('popular');
        affichage.renderCards(moviesResponse.results, 'movies-grid');

        setupHomeListeners();
    } catch (error) {
        affichage.displayError('Impossible de charger les données.', 'trending-grid');
    }
}

function setupHomeListeners() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', async () => {
            const query = searchInput.value.trim();
            if (query) {
                affichage.showLoader('trending-grid');
                try {
                    const searchResponse = await api.search(query);
                    const titleEl = document.querySelector('#trending-section h2');
                    if (titleEl) titleEl.textContent = 'Résultats de recherche';
                    affichage.renderCards(searchResponse.results, 'trending-grid');
                } catch (error) {
                    affichage.displayError('Erreur lors de la recherche.', 'trending-grid');
                }
            }
        });
    }

    const timeToggles = document.querySelectorAll('#trending-section .toggle-btn');
    timeToggles.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            timeToggles.forEach(t => t.classList.remove('active'));
            const target = e.target;
            target.classList.add('active');
            
            const timeWindow = target.getAttribute('data-filter');
            affichage.showLoader('trending-grid');
            try {
                const trendingResponse = await api.getTrending(timeWindow);
                affichage.renderCards(trendingResponse.results, 'trending-grid');
            } catch (error) {
                affichage.displayError('Erreur de filtrage.', 'trending-grid');
            }
        });
    });

    const filterToggles = document.querySelectorAll('.filter-group .toggle-btn');
    filterToggles.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const group = e.target.closest('.toggle-group');
            group.querySelectorAll('.toggle-btn').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            const type = e.target.getAttribute('data-type');
            const filter = e.target.getAttribute('data-filter');
            const gridId = `${type}-grid`;
            
            affichage.showLoader(gridId);
            try {
                let response;
                if (type === 'series') {
                    response = await api.getSeries(filter);
                } else if (type === 'movies') {
                    response = await api.getMovies(filter);
                }
                affichage.renderCards(response.results, gridId);
            } catch (error) {
                affichage.displayError('Erreur de filtrage.', gridId);
            }
        });
    });
}

async function initFocus() {
    const urlParams = new URLSearchParams(window.location.search);
    const mediaId = urlParams.get('id');
    const mediaType = urlParams.get('type') || 'movie';

    if (!mediaId) return;

    try {
        const details = await api.getDetails(mediaId, mediaType);
        let validBannerPath = '';
        if (details.backdrop_path) {
            validBannerPath = `https://image.tmdb.org/t/p/w1920_and_h800_multi_faces${details.backdrop_path}`;
        } else {
            validBannerPath = 'assets/placeholder.jpg';
        }
        
        const bannerEl = document.querySelector('.focus-banner');
        if (bannerEl && details.backdrop_path) {
            bannerEl.style.backgroundImage = `url('${validBannerPath}')`;
        }

        affichage.updateMediaDetails(details);

        const credits = await api.getCredits(mediaId, mediaType);
        affichage.renderCast(credits.cast, 'cast-grid');
    } catch (error) {
        console.error(error);
    }
}
