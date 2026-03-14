
        class RecipeFinder {
            constructor() {
                this.apiBase = 'https://www.themealdb.com/api/json/v1/1/';
                this.init();
            }

            init() {
                this.searchInput = document.getElementById('searchInput');
                this.searchBtn = document.getElementById('searchBtn');
                this.recipesContainer = document.getElementById('recipesContainer');
                this.modal = document.getElementById('recipeModal');
                this.modalTitle = document.getElementById('modalTitle');
                this.modalImage = document.getElementById('modalImage');
                this.modalIngredients = document.getElementById('modalIngredients');
                this.modalInstructions = document.getElementById('modalInstructions');
                this.modalClose = document.getElementById('modalClose');

                this.bindEvents();
                this.loadFeaturedRecipes();
            }

            bindEvents() {
                this.searchBtn.addEventListener('click', () => this.searchRecipes());
                this.searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.searchRecipes();
                    }
                });
                this.modalClose.addEventListener('click', () => this.closeModal());
                this.modal.addEventListener('click', (e) => {
                    if (e.target === this.modal) this.closeModal();
                });

                // Keyboard navigation
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                        this.closeModal();
                    }
                });

                // Voice search support
                if ('webkitSpeechRecognition' in window) {
                    const recognition = new webkitSpeechRecognition();
                    recognition.continuous = false;
                    recognition.interimResults = false;
                    recognition.lang = 'en-US';

                    this.searchInput.addEventListener('focus', () => {
                        setTimeout(() => {
                            const micBtn = document.createElement('button');
                            micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                            micBtn.className = 'mic-btn';
                            micBtn.style.cssText = `
                                position: absolute; right: 95px; top: 50%; transform: translateY(-50%);
                                background: rgba(34,197,94,0.9); color: white; border: none;
                                width: 50px; height: 50px; border-radius: 50%; cursor: pointer;
                                display: flex; align-items: center; justify-content: center;
                                font-size: 1.2rem; box-shadow: 0 8px 25px rgba(34,197,94,0.4);
                                backdrop-filter: blur(10px); transition: all 0.3s ease;
                            `;
                            micBtn.onclick = () => recognition.start();
                            if (!document.querySelector('.mic-btn')) {
                                this.searchInput.parentNode.appendChild(micBtn);
                            }
                        }, 500);
                    });

                    recognition.onresult = (event) => {
                        this.searchInput.value = event.results[0][0].transcript;
                        this.searchRecipes();
                    };
                }
            }

            async searchRecipes() {
                const query = this.searchInput.value.trim();
                if (!query) {
                    this.searchInput.focus();
                    this.showEmptyState('What would you like to cook today?');
                    return;
                }

                this.showLoading('🔍 Searching for "' + query + '"...');
                
                try {
                    // Try search by name first
                    let data = await this.fetchData('search.php?s=' + encodeURIComponent(query));
                    
                    // If no results, try by first letter
                    if (!data.meals || data.meals.length === 0) {
                        data = await this.fetchData('search.php?f=' + query.charAt(0).toLowerCase());
                    }
                    
                    // If still no results, try category
                    if (!data.meals || data.meals.length === 0) {
                        data = await this.fetchData('filter.php?i=' + encodeURIComponent(query));
                    }

                    if (data.meals && data.meals.length > 0) {
                        this.displayRecipes(data.meals.slice(0, 12));
                    } else {
                        this.showEmptyState(`No recipes found for "${query}". Try "Chicken", "Pizza", "Pasta", or "Curry"!`);
                    }
                } catch (error) {
                    console.error('Search error:', error);
                    this.showError('Oops! Connection issue. Please check your internet and try again.');
                }
            }

            async fetchData(endpoint) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                const response = await fetch(this.apiBase + endpoint, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return await response.json();
            }

            async loadFeaturedRecipes() {
                this.showLoading('🍽️ Loading delicious recipes...');
                try {
                    // Load multiple categories for better variety
                    const categories = ['Beef', 'Chicken', 'Dessert', 'Pasta', 'Seafood'];
                    let allRecipes = [];
                    
                                        for (const cat of categories) {
                        try {
                            const data = await this.fetchData(`filter.php?c=${cat}`);
                            if (data.meals) {
                                allRecipes = allRecipes.concat(data.meals.slice(0, 3));
                            }
                        } catch (e) {
                            console.warn(`Failed to load ${cat} recipes:`, e);
                        }
                    }
                    
                    // Shuffle and limit to 12 recipes
                    allRecipes = this.shuffleArray(allRecipes).slice(0, 12);
                    this.displayRecipes(allRecipes);
                } catch (error) {
                    console.error('Error loading featured recipes:', error);
                    this.loadFallbackRecipes();
                }
            }

            shuffleArray(array) {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                return array;
            }

            loadFallbackRecipes() {
                const fallbackRecipes = [
                    {idMeal: '52854', strMeal: 'Chicken Alfredo', strMealThumb: 'https://www.themealdb.com/images/media/meals/y8bxvy1515386478.jpg'},
                    {idMeal: '52891', strMeal: 'Meatballs', strMealThumb: 'https://www.themealdb.com/images/media/meals/lx1vki1515441079.jpg'},
                    {idMeal: '53065', strMeal: 'Pork knuckle', strMealThumb: 'https://www.themealdb.com/images/media/meals/mru67t1614352124.jpg'},
                    {idMeal: '52874', strMeal: 'Pepper Steak', strMealThumb: 'https://www.themealdb.com/images/media/meals/xv9slk1568306474.jpg'},
                    {idMeal: '53049', strMeal: 'Kumpir', strMealThumb: 'https://www.themealdb.com/images/media/meals/xttqrj1582921824.jpg'},
                    {idMeal: '52893', strMeal: 'Moussaka', strMealThumb: 'https://www.themealdb.com/images/media/meals/ctpqbx1582445981.jpg'}
                ];
                this.displayRecipes(fallbackRecipes);
            }

            displayRecipes(recipes) {
                this.recipesContainer.innerHTML = `
                    <div class="recipes-grid" role="list">
                        ${recipes.map((recipe, index) => `
                            <article class="recipe-card" 
                                     data-id="${recipe.idMeal}" 
                                     tabindex="0" 
                                     role="button" 
                                     aria-label="View ${recipe.strMeal} recipe"
                                     style="animation-delay: ${index * 0.1}s">
                                <img src="${recipe.strMealThumb || 'https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg'}" 
                                     alt="${recipe.strMeal}" 
                                     class="recipe-image" 
                                     loading="lazy"
                                     onerror="this.src='https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg'">
                                <div class="recipe-content">
                                    <h3 class="recipe-title">${recipe.strMeal}</h3>
                                    <div class="recipe-category">
                                        <i class="fas fa-tag" aria-hidden="true"></i>
                                        ${recipe.strCategory || '🍽️ Delicious'}
                                    </div>
                                    <button class="view-btn" 
                                            onclick="recipeFinder.showRecipeDetails('${recipe.idMeal}')" 
                                            aria-label="View full recipe for ${recipe.strMeal}">
                                        <i class="fas fa-eye"></i>
                                        <span>View Recipe</span>
                                    </button>
                                </div>
                            </article>
                        `).join('')}
                    </div>
                `;

                // Add keyboard support
                document.querySelectorAll('.recipe-card').forEach((card, index) => {
                    card.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            const id = card.dataset.id;
                            this.showRecipeDetails(id);
                        }
                    });
                    card.addEventListener('click', () => {
                        const id = card.dataset.id;
                        this.showRecipeDetails(id);
                    });
                });
            }

            async showRecipeDetails(id) {
                try {
                    this.modal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    this.showLoadingModal();

                    const data = await this.fetchData(`lookup.php?i=${id}`);
                    
                    if (data.meals && data.meals.length > 0) {
                        const recipe = data.meals[0];
                        this.populateModal(recipe);
                    } else {
                        this.closeModal();
                        this.showError('Recipe not found. Please try searching again.');
                    }
                } catch (error) {
                    console.error('Error loading recipe:', error);
                    this.closeModal();
                    this.showError('Failed to load recipe details. Please try again.');
                }
            }

            populateModal(recipe) {
                this.modalTitle.textContent = recipe.strMeal;
                this.modalImage.src = recipe.strMealThumb;
                this.modalImage.alt = recipe.strMeal;

                // Better ingredient extraction
                const ingredients = [];
                for (let i = 1; i <= 20; i++) {
                    const ingredient = recipe[`strIngredient${i}`]?.trim();
                    const measure = recipe[`strMeasure${i}`]?.trim();
                    if (ingredient && ingredient !== '' && ingredient !== null && ingredient !== ' ') {
                        ingredients.push({
                            name: ingredient,
                            measure: measure || ''
                        });
                    }
                }

                this.modalIngredients.innerHTML = ingredients.map(ing => `
                    <div class="ingredient" role="listitem" tabindex="0">
                        <i class="fas fa-check-circle" style="color: var(--bubblegum-pink); margin-right: 12px;"></i>
                        ${ing.measure ? `${ing.measure} ${ing.name}` : ing.name}
                    </div>
                `).join('');

                // Format instructions with better readability
                let instructions = recipe.strInstructions
                    ?.replace(/\r\n|\r|\n/g, '<br><br>')
                    .replace(/\. /g, '.<br><br>')
                    .trim() || 'Detailed instructions not available. Use your creativity! ✨';

                this.modalInstructions.innerHTML = instructions;

                this.modalClose.focus();
            }

            showLoading(message = 'Loading delicious recipes...') {
                this.recipesContainer.innerHTML = `
                    <div class="loading" role="status" aria-live="polite">
                        <div class="spinner" aria-hidden="true"></div>
                        <h3 style="font-size: 1.5rem; margin-bottom: 15px; color: var(--text-primary);">${message}</h3>
                        <p style="opacity: 0.8;">Just a moment... 🍳✨</p>
                    </div>
                `;
            }

            showLoadingModal() {
                this.modalTitle.textContent = 'Loading...';
                this.modalIngredients.innerHTML = `
                    <div style="text-align: center; padding: 50px; color: var(--text-secondary);">
                        <div class="spinner" style="margin: 0 auto 20px; width: 50px; height: 50px;"></div>
                        <p>Loading recipe details...</p>
                    </div>
                `;
            }

            showEmptyState(message) {
                this.recipesContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search" aria-hidden="true"></i>
                        <h3>No recipes found</h3>
                        <p style="font-size: 1.15rem; margin-bottom: 30px;">${message}</p>
                        <div style="display: flex; flex-direction: column; gap: 15px; align-items: center; max-width: 400px; margin: 0 auto;">
                            <button class="view-btn" style="max-width: 300px;" onclick="recipeFinder.loadFeaturedRecipes()">
                                <i class="fas fa-fire" aria-hidden="true"></i> Show Featured Recipes
                            </button>
                            <button class="view-btn" style="max-width: 300px; background: var(--secondary-gradient);" onclick="recipeFinder.searchInput.focus(); recipeFinder.searchInput.value='chicken'; recipeFinder.searchRecipes();">
                                <i class="fas fa-magic" aria-hidden="true"></i> Quick Search: Chicken
                            </button>
                            <button class="view-btn" style="max-width: 300px; background: linear-gradient(135deg, #10b981, #34d399);" onclick="recipeFinder.searchInput.focus(); recipeFinder.searchInput.value='pizza'; recipeFinder.searchRecipes();">
                                <i class="fas fa-pizza-slice" aria-hidden="true"></i> Quick Search: Pizza
                            </button>
                        </div>
                    </div>
                `;
            }

            showError(message) {
                this.recipesContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle" style="color: var(--cherry-rose); font-size: 8rem;" aria-hidden="true"></i>
                        <h3>Oops! Something went wrong</h3>
                        <p style="font-size: 1.15rem; margin-bottom: 30px;">${message}</p>
                        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                            <button class="view-btn" style="max-width: 250px;" onclick="recipeFinder.loadFeaturedRecipes()">
                                <i class="fas fa-fire" aria-hidden="true"></i> Load Featured
                            </button>
                            <button class="view-btn" style="max-width: 250px; background: var(--secondary-gradient);" onclick="recipeFinder.searchInput.focus()">
                                <i class="fas fa-search" aria-hidden="true"></i> Try Another Search
                            </button>
                        </div>
                    </div>
                `;
            }

            closeModal() {
                this.modal.classList.remove('active');
                document.body.style.overflow = 'auto';
                this.searchInput.focus();
            }
        }

        // Global reference
        let recipeFinder;

        // Initialize when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            recipeFinder = new RecipeFinder();
            
            // Smooth scrolling
            document.documentElement.style.scrollBehavior = 'smooth';
            
            // Auto-focus search
            setTimeout(() => {
                document.getElementById('searchInput').focus();
            }, 300);

            // PWA features
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(() => {
                    // Ignore service worker errors
                });
            }

            // Add some particles effect
            this.addParticles();
        });

        // Particles effect for extra wow factor
        function addParticles() {
            const particles = document.createElement('canvas');
            particles.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none; z-index: -1; opacity: 0.6;
            `;
            document.body.appendChild(particles);
            
            const ctx = particles.getContext('2d');
            particles.width = window.innerWidth;
            particles.height = window.innerHeight;
            
            let animationId;
            function animate() {
                ctx.clearRect(0, 0, particles.width, particles.height);
                ctx.fillStyle = 'rgba(251, 113, 133, 0.1)';
                for (let i = 0; i < 50; i++) {
                    const x = (i * 137.5) % particles.width;
                    const y = (i * 239.7) % particles.height;
                    ctx.beginPath();
                    ctx.arc(x, y, Math.sin(Date.now() * 0.001 + i) * 2 + 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                animationId = requestAnimationFrame(animate);
            }
            animate();
            
            window.addEventListener('resize', () => {
                particles.width = window.innerWidth;
                particles.height = window.innerHeight;
            });
        }
    