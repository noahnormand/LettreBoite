class TMDBApi {
    constructor() {
        this.apiKey = '0dde7858f9e02bd7ac76b47d569bc963';
        this.baseUrl = 'https://api.themoviedb.org/3';
        this.language = 'fr-FR';
    }

    async fetchAPI(endpoint, params = {}) {
        try {
            const url = new URL(`${this.baseUrl}${endpoint}`);
            url.searchParams.append('api_key', this.apiKey);
            url.searchParams.append('language', this.language);

            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('TMDBApi Fetch Error:', error);
            throw error;
        }
    }

    async getTrending(timeWindow = 'day') {
        return this.fetchAPI(`/trending/all/${timeWindow}`);
    }

    async getMovies(filter = 'popular') {
        return this.fetchAPI(`/movie/${filter}`);
    }

    async getSeries(filter = 'popular') {
        return this.fetchAPI(`/tv/${filter}`);
    }

    async search(query) {
        return this.fetchAPI('/search/multi', {query});
    }

    async getDetails(id, type) {
        return this.fetchAPI(`/${type}/${id}`);
    }

    async getCredits(id, type) {
        return this.fetchAPI(`/${type}/${id}/credits`);
    }

 