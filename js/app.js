const api = new TMDBApi();
const affichage = new Affichage();

document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    const isHomePage = document.getElementById('trending-grid') !== null;
    const isFocusPage = document.getElementById('media-details') !== null;
    const isActorPage = document.getElementById('actor-details') !== null;

    if (isHomePage) {
        affichage.renderFavorites('favorites-grid');
        initHome();
    } else if (isFocusPage) {
        initFocus();
    } else if (isActorPage) {
        initActor();
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

// Stocke les derniers résultats de recherche pour le filtrage
let lastSearchResults = [];

function setupHomeListeners() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const searchFilters = document.getElementById('search-filters');

    if (searchBtn && searchInput) {
        const doSearch = async () => {
            const query = searchInput.value.trim();
            if (query) {
                affichage.showLoader('trending-grid');
                try {
                    const searchResponse = await api.search(query);
                    lastSearchResults = searchResponse.results;
                    const titleEl = document.querySelector('#trending-section h2');
                    if (titleEl) titleEl.textContent = 'Résultats de recherche';
                    // Afficher les filtres de recherche
                    if (searchFilters) searchFilters.style.display = 'flex';
                    // Réinitialiser le filtre sur "Tout"
                    document.querySelectorAll('#search-filters .toggle-btn').forEach(b => b.classList.remove('active'));
                    const allBtn = document.querySelector('#search-filters [data-type-filter="all"]');
                    if (allBtn) allBtn.classList.add('active');
                    affichage.renderCards(lastSearchResults, 'trending-grid', lastSearchResults.length);
                } catch (error) {
                    affichage.displayError('Erreur lors de la recherche.', 'trending-grid');
                }
            }
        };

        searchBtn.addEventListener('click', doSearch);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doSearch();
        });
    }

    // Filtres de type sur les résultats de recherche
    if (searchFilters) {
        searchFilters.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                searchFilters.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const typeFilter = e.target.getAttribute('data-type-filter');
                const filtered = typeFilter === 'all'
                    ? lastSearchResults
                    : lastSearchResults.filter(item => item.media_type === typeFilter);
                affichage.renderCards(filtered, 'trending-grid', filtered.length);
            });
        });
    }

    // Filtres tendances (jour/semaine)
    const timeToggles = document.querySelectorAll('#trending-section > .section-header .toggle-btn');
    timeToggles.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            timeToggles.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            const timeWindow = e.target.getAttribute('data-filter');
            affichage.showLoader('trending-grid');
            // Cacher les filtres de recherche
            const searchFilters = document.getElementById('search-filters');
            if (searchFilters) searchFilters.style.display = 'none';
            const titleEl = document.querySelector('#trending-section h2');
            if (titleEl) titleEl.textContent = 'Tendances';
            try {
                const trendingResponse = await api.getTrending(timeWindow);
                affichage.renderCards(trendingResponse.results, 'trending-grid');
            } catch (error) {
                affichage.displayError('Erreur de filtrage.', 'trending-grid');
            }
        });
    });

    // Filtres films/séries
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

    if (!mediaId) {
        affichage.displayError('Aucun identifiant de média trouvé dans l\'URL.', 'media-details');
        return;
    }

    try {
        const details = await api.getDetails(mediaId, mediaType);

        if (details.backdrop_path) {
            const bannerEl = document.querySelector('.focus-banner');
            if (bannerEl) bannerEl.style.backgroundImage =
                `url('https://image.tmdb.org/t/p/w1920_and_h800_multi_faces${details.backdrop_path}')`;
        }

        affichage.updateMediaDetails(details);

        const [credits, videosData] = await Promise.all([
            api.getCredits(mediaId, mediaType),
            api.getVideos(mediaId, mediaType)
        ]);

        affichage.renderCast(credits.cast, 'cast-grid');
        affichage.renderTrailer(videosData.results, 'trailer-container');
    } catch (error) {
        affichage.displayError('Impossible de charger les détails. Veuillez réessayer.', 'cast-grid');
    }
}

async function initActor() {
    const urlParams = new URLSearchParams(window.location.search);
    const actorId = urlParams.get('id');

    if (!actorId) {
        affichage.displayError('Aucun identifiant d\'acteur trouvé dans l\'URL.', 'actor-details');
        return;
    }

    try {
        const [person, credits] = await Promise.all([
            api.getPersonDetails(actorId),
            api.getPersonCredits(actorId)
        ]);

        affichage.updateActorDetails(person);
        affichage.renderPersonCredits(credits, 'actor-credits-grid');
    } catch (error) {
        affichage.displayError('Impossible de charger les données de cet acteur.', 'actor-details');
    }
}
