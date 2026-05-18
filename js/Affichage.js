class Affichage {
    constructor() {
        this.imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
        this.fallbackImage = 'https://placehold.co/500x750/032541/FFFFFF?text=Indisponible';
    }

    getImageUrl(path) {
        return path ? `${this.imageBaseUrl}${path}` : this.fallbackImage;
    }

    // ---- FAVORIS ----
    static getFavorites() {
        return JSON.parse(localStorage.getItem('lettreboite_favorites') || '[]');
    }

    static isFavorite(id) {
        return Affichage.getFavorites().some(f => f.id === id);
    }

    static toggleFavorite(item) {
        const favs = Affichage.getFavorites();
        const idx = favs.findIndex(f => f.id === item.id);
        if (idx === -1) {
            favs.push(item);
        } else {
            favs.splice(idx, 1);
        }
        localStorage.setItem('lettreboite_favorites', JSON.stringify(favs));
    }

    renderFavorites(containerId) {
        const favs = Affichage.getFavorites();
        const section = document.getElementById('favorites-section');
        if (section) section.style.display = favs.length ? 'block' : 'none';
        this.renderCards(favs, containerId, favs.length);
    }
    // ------------------

    renderCards(items, containerId, limit = 4) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        const displayedItems = items.slice(0, limit);

        displayedItems.forEach(item => {
            const title = item.title || item.name;
            const releaseDate = item.release_date || item.first_air_date || '';
            const rating = item.vote_average ? Math.round(item.vote_average * 10) + '%' : 'NR';
            const imageUrl = this.getImageUrl(item.poster_path);
            const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
            const isFav = Affichage.isFavorite(item.id);

            const card = document.createElement('article');
            card.className = 'movie-card';

            card.innerHTML = `
                <div class="card-image-wrapper">
                    <a href="focus.html?id=${item.id}&type=${mediaType}">
                        <img src="${imageUrl}" alt="${title}" loading="lazy">
                    </a>
                    <div class="rating-badge">
                        <span>${rating}</span>
                    </div>
                    <button class="fav-btn ${isFav ? 'active' : ''}" aria-label="Favoris">
                        <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
                    </button>
                </div>
                <div class="card-content">
                    <a href="focus.html?id=${item.id}&type=${mediaType}">
                        <h3>${title}</h3>
                    </a>
                    <p class="release-date">${releaseDate}</p>
                </div>
            `;

            card.querySelector('.fav-btn').addEventListener('click', () => {
                Affichage.toggleFavorite(item);
                const isNowFav = Affichage.isFavorite(item.id);
                const btn = card.querySelector('.fav-btn');
                btn.classList.toggle('active', isNowFav);
                btn.querySelector('i').className = `fa-${isNowFav ? 'solid' : 'regular'} fa-heart`;
                // Mise à jour section favoris si elle existe
                const favGrid = document.getElementById('favorites-grid');
                if (favGrid) this.renderFavorites('favorites-grid');
            });

            container.appendChild(card);
        });
    }

    renderTrailer(videos, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube')
                     || videos.find(v => v.site === 'YouTube');

        if (!trailer) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = `
            <div class="section-header">
                <h2>Bande annonce</h2>
            </div>
            <div class="trailer-wrapper">
                <iframe
                    src="https://www.youtube.com/embed/${trailer.key}"
                    title="${trailer.name}"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
                </iframe>
            </div>
        `;
    }

    renderCast(cast, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        
        const topCast = cast.slice(0, 8);

        topCast.forEach(actor => {
            const imageUrl = this.getImageUrl(actor.profile_path);
            const card = document.createElement('div');
            card.className = 'actor-card movie-card';

            card.innerHTML = `
                <a href="actor.html?id=${actor.id}">
                    <div class="card-image-wrapper actor-image">
                        <img src="${imageUrl}" alt="${actor.name}" loading="lazy">
                    </div>
                    <div class="card-content actor-info">
                        <h4>${actor.name}</h4>
                        <p class="release-date">${actor.character}</p>
                    </div>
                </a>
            `;
            container.appendChild(card);
        });
    }

    updateActorDetails(person) {
        const nameEl = document.getElementById('actor-name');
        const photoEl = document.getElementById('actor-photo');
        const birthdayEl = document.getElementById('actor-birthday');
        const birthplaceEl = document.getElementById('actor-birthplace');
        const knownForEl = document.getElementById('actor-known-for');
        const bioEl = document.getElementById('actor-biography');

        if (nameEl) nameEl.textContent = person.name || '';

        if (photoEl) {
            const imageUrl = this.getImageUrl(person.profile_path);
            photoEl.innerHTML = `<img src="${imageUrl}" alt="${person.name}">`;
        }

        if (birthdayEl && person.birthday) {
            birthdayEl.innerHTML = `<i class="fa-regular fa-calendar"></i> ${person.birthday}${person.deathday ? ' — ' + person.deathday : ''}`;
        }

        if (birthplaceEl && person.place_of_birth) {
            birthplaceEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${person.place_of_birth}`;
        }

        if (knownForEl && person.known_for_department) {
            knownForEl.innerHTML = `<i class="fa-solid fa-star"></i> Connu pour : ${person.known_for_department}`;
        }

        if (bioEl) {
            bioEl.textContent = person.biography || 'Aucune biographie disponible.';
        }
    }

    renderPersonCredits(credits, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Fusionner films + séries, dédoublonner, trier par popularité
        const all = [...(credits.cast || [])];
        const seen = new Set();
        const unique = all.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
        unique.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        this.renderCards(unique, containerId, Math.min(unique.length, 16));
    }

    displayError(message, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-message" style="color: red; padding: 20px;">
                <p>Oups ! ${message}</p>
            </div>
        `;
    }

    showLoader(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="loader" style="padding: 20px;">
                <p>Chargement en cours...</p>
            </div>
        `;
    }
    
    updateMediaDetails(data) {
        const titleEl = document.getElementById('media-title');
        const overviewEl = document.getElementById('media-overview');
        const posterEl = document.getElementById('media-poster');
        const ratingEl = document.getElementById('media-rating');
        const dateEl = document.getElementById('media-release-date');
        const genresEl = document.getElementById('media-genres');
        const runtimeEl = document.getElementById('media-runtime');

        if (titleEl) {
            const title = data.title || data.name;
            const yearStr = (data.release_date || data.first_air_date || '').split('-')[0];
            titleEl.innerHTML = `${title} <span class="year">(${yearStr})</span>`;
        }
        
        if (overviewEl) {
            overviewEl.textContent = data.overview || '';
        }
        
        if (posterEl) {
            const imageUrl = this.getImageUrl(data.poster_path);
            posterEl.innerHTML = `<img src="${imageUrl}" alt="Poster">`;
        }

        if (ratingEl) {
            const rating = data.vote_average ? Math.round(data.vote_average * 10) + '%' : 'NR';
            ratingEl.innerHTML = `<span>${rating}</span>`;
        }

        if (dateEl) {
            dateEl.textContent = data.release_date || data.first_air_date || '';
        }

        if (genresEl) {
            genresEl.textContent = data.genres ? data.genres.map(g => g.name).join(', ') : '';
        }
        
        if (runtimeEl) {
            if (data.runtime) {
                const hours = Math.floor(data.runtime / 60);
                const mins = data.runtime % 60;
                runtimeEl.textContent = `${hours}h ${mins}m`;
                runtimeEl.style.display = 'inline';
            } else if (data.episode_run_time && data.episode_run_time.length > 0) {
                runtimeEl.textContent = `${data.episode_run_time[0]}m`;
                runtimeEl.style.display = 'inline';
            } else {
                runtimeEl.style.display = 'none';
            }
        }
    }
}
