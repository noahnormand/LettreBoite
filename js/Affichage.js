class Affichage {
    constructor() {
        this.imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
        this.fallbackImage = 'assets/placeholder.jpg';
    }

    getImageUrl(path) {
        return path ? `${this.imageBaseUrl}${path}` : this.fallbackImage;
    }

    renderCards(items, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        items.forEach(item => {
            const title = item.title || item.name;
            const releaseDate = item.release_date || item.first_air_date || '';
            const rating = item.vote_average ? Math.round(item.vote_average * 10) + '%' : 'NR';
            const imageUrl = this.getImageUrl(item.poster_path);
            const mediaType = item.media_type || (item.title ? 'movie' : 'tv');

            const card = document.createElement('article');
            card.className = 'movie-card';
            
            card.innerHTML = `
                <a href="focus.html?id=${item.id}&type=${mediaType}">
                    <div class="card-image-wrapper">
                        <img src="${imageUrl}" alt="${title}" loading="lazy">
                        <div class="rating-badge">
                            <span>${rating}</span>
                        </div>
                    </div>
                </a>
                <div class="card-content">
                    <a href="focus.html?id=${item.id}&type=${mediaType}">
                        <h3>${title}</h3>
                    </a>
                    <p class="release-date">${releaseDate}</p>
                </div>
            `;
            container.appendChild(card);
        });
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
                <div class="card-image-wrapper actor-image">
                    <img src="${imageUrl}" alt="${actor.name}" loading="lazy">
                </div>
                <div class="card-content actor-info">
                    <h4>${actor.name}</h4>
                    <p class="release-date">${actor.character}</p>
                </div>
            `;
            container.appendChild(card);
        });
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
