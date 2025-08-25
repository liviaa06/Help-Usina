import showdown from 'showdown';

const App = {
    // STATE
    state: {
        articles: [],
        currentArticleId: null,
        currentView: 'dashboard', // 'dashboard', 'viewer', or 'editor'
        filters: {
            status: 'all',
            sortBy: 'updatedAt'
        }
    },

    // EDITOR INSTANCE
    easyMDE: null,

    // DOM ELEMENTS
    elements: {
        sidebar: document.getElementById('sidebar'),
        articleList: document.getElementById('article-list'),
        mainContent: document.getElementById('main-content'),
        viewer: document.getElementById('viewer'),
        editor: document.getElementById('editor'),
        dashboard: document.getElementById('dashboard'),
        articleGrid: document.getElementById('article-grid'),
        articleTitle: document.getElementById('article-title'),
        articleContent: document.getElementById('article-content'),
        articleTagsContainer: document.getElementById('article-tags-container'),
        articleLastUpdated: document.getElementById('article-last-updated'),
        welcomeMessage: document.getElementById('welcome-message'),
        editorForm: document.getElementById('editor-form'),
        editorTitle: document.getElementById('editor-title'),
        editorContent: document.getElementById('editor-content'),
        editorTags: document.getElementById('editor-tags'),
        editorStatus: document.getElementById('editor-status'),
        articleIdInput: document.getElementById('article-id'),
        newArticleBtn: document.getElementById('new-article-btn'),
        editArticleBtn: document.getElementById('edit-article-btn'),
        deleteArticleBtn: document.getElementById('delete-article-btn'),
        saveBtn: document.getElementById('save-btn'),
        cancelBtn: document.getElementById('cancel-btn'),
        searchInput: document.getElementById('search-input'),
        backToListBtn: document.getElementById('back-to-list-btn'),
        filterStatus: document.getElementById('filter-status'),
        sortBy: document.getElementById('sort-by'),
    },

    // INITIALIZATION
    init() {
        this.converter = new showdown.Converter({
            tables: true,
            strikethrough: true,
            tasklists: true,
            simpleLineBreaks: true,
        });
        this.loadArticles();
        this.initEditor();
        this.addEventListeners();
        this.render();
    },

    // EVENT LISTENERS
    addEventListeners() {
        this.elements.newArticleBtn.addEventListener('click', () => this.showEditor());
        this.elements.editArticleBtn.addEventListener('click', () => this.showEditor(this.state.currentArticleId));
        this.elements.deleteArticleBtn.addEventListener('click', () => this.deleteArticle());
        this.elements.editorForm.addEventListener('submit', (e) => this.handleSave(e));
        this.elements.cancelBtn.addEventListener('click', () => this.handleCancel());
        this.elements.articleList.addEventListener('click', (e) => this.handleArticleSelection(e));
        this.elements.articleGrid.addEventListener('click', (e) => this.handleArticleSelection(e));
        this.elements.searchInput.addEventListener('input', (e) => this.renderArticleList(e.target.value));
        this.elements.backToListBtn.addEventListener('click', () => this.showDashboard());
        this.elements.filterStatus.addEventListener('change', (e) => this.handleFilterChange('status', e.target.value));
        this.elements.sortBy.addEventListener('change', (e) => this.handleFilterChange('sortBy', e.target.value));
    },

    // DATA HANDLING
    loadArticles() {
        const articles = localStorage.getItem('kb-articles');
        this.state.articles = articles ? JSON.parse(articles) : [];
        // Add a sample article if the list is empty
        if (this.state.articles.length === 0) {
            this.addSampleArticle();
        }
    },

    saveArticles() {
        localStorage.setItem('kb-articles', JSON.stringify(this.state.articles));
    },

    addSampleArticle() {
        const now = new Date().toISOString();
        const sampleArticle = {
            id: crypto.randomUUID(),
            title: "Bem-vindo ao Help Livia!",
            content: `
# Bem-vindo!

Este é um artigo de exemplo para você começar.

## Recursos

Você pode usar **Markdown** para formatar seu texto. Por exemplo:

*   Listas de itens
*   **Texto em negrito**
*   *Texto em itálico*

\`\`\`javascript
// Blocos de código também são suportados
function helloWorld() {
  console.log("Olá, mundo!");
}
\`\`\`

Clique no botão **Editar Artigo** (ícone de lápis) para ver como este artigo é formatado e começar a criar o seu!
            `,
            tags: ["exemplo", "introdução"],
            status: "published",
            createdAt: now,
            updatedAt: now,
        };
        this.state.articles.push(sampleArticle);
        this.saveArticles();
        this.state.currentArticleId = null; // Start at dashboard
    },

    // STATE MUTATIONS & LOGIC
    setCurrentArticle(id) {
        this.state.currentArticleId = id;
        this.showViewer();
    },
    
    initEditor() {
        this.easyMDE = new EasyMDE({
            element: this.elements.editorContent,
            spellChecker: false,
            placeholder: "Comece a escrever seu artigo aqui...",
            status: ["lines", "words"],
             toolbar: [
                "bold", "italic", "heading", "|",
                "quote", "unordered-list", "ordered-list", "|",
                "link", "image", "code", "table", "|",
                "preview", "side-by-side", "fullscreen", "|",
                "guide"
            ]
        });
    },

    showEditor(id = null) {
        this.state.currentView = 'editor';
        if (id) {
            const article = this.state.articles.find(a => a.id === id);
            if(article) {
                this.elements.articleIdInput.value = article.id;
                this.elements.editorTitle.value = article.title;
                this.elements.editorTags.value = (article.tags || []).join(', ');
                this.elements.editorStatus.value = article.status || 'published';
                this.easyMDE.value(article.content);
            }
        } else {
            this.elements.editorForm.reset();
            this.elements.articleIdInput.value = '';
            this.elements.editorTags.value = '';
            this.elements.editorStatus.value = 'published';
            this.easyMDE.value('');
        }
        this.render();
    },

    showViewer() {
        this.state.currentView = 'viewer';
        this.render();
    },
    
    showDashboard() {
        this.state.currentArticleId = null;
        this.state.currentView = 'dashboard';
        this.render();
    },

    handleCancel() {
        if (this.state.currentArticleId) {
            this.showViewer();
        } else {
            this.showDashboard();
        }
    },
    
    handleSave(e) {
        e.preventDefault();
        const id = this.elements.articleIdInput.value;
        const title = this.elements.editorTitle.value.trim();
        const content = this.easyMDE.value().trim();
        const tags = this.elements.editorTags.value.split(',').map(tag => tag.trim()).filter(Boolean);
        const status = this.elements.editorStatus.value;
        const now = new Date().toISOString();

        if (!title || !content) {
            alert('Título e conteúdo são obrigatórios.');
            return;
        }

        if (id) { // Update existing
            const index = this.state.articles.findIndex(a => a.id === id);
            if (index > -1) {
                this.state.articles[index] = { 
                    ...this.state.articles[index], 
                    title, 
                    content,
                    tags,
                    status,
                    updatedAt: now,
                };
                 this.state.currentArticleId = id;
            }
        } else { // Create new
            const newArticle = {
                id: crypto.randomUUID(),
                title,
                content,
                tags,
                status,
                createdAt: now,
                updatedAt: now,
            };
            this.state.articles.unshift(newArticle);
            this.state.currentArticleId = newArticle.id;
        }
        
        this.saveArticles();
        this.showViewer();
    },
    
    deleteArticle() {
        if (!this.state.currentArticleId) return;
        
        const article = this.state.articles.find(a => a.id === this.state.currentArticleId);
        if (confirm(`Tem certeza que deseja excluir o artigo "${article.title}"?`)) {
            this.state.articles = this.state.articles.filter(a => a.id !== this.state.currentArticleId);
            this.state.currentArticleId = null;
            this.saveArticles();
            this.showDashboard();
        }
    },

    handleArticleSelection(e) {
        const card = e.target.closest('[data-id]');
        if (card) {
            this.setCurrentArticle(card.dataset.id);
        }
    },

    handleFilterChange(key, value) {
        this.state.filters[key] = value;
        this.render();
    },

    // RENDER FUNCTIONS
    render() {
        this.renderArticleList();
        this.renderMainContent();
    },

    renderArticleList(searchTerm = '') {
        this.elements.articleList.innerHTML = '';
        const filteredArticles = this.state.articles.filter(article => 
            article.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredArticles.length === 0) {
            this.elements.articleList.innerHTML = `<li class="empty-state">Nenhum artigo encontrado.</li>`;
        } else {
            filteredArticles.forEach(article => {
                const li = document.createElement('li');
                li.dataset.id = article.id;
                li.textContent = article.title;
                if (article.id === this.state.currentArticleId) {
                    li.classList.add('active');
                }
                this.elements.articleList.appendChild(li);
            });
        }
    },

    renderMainContent() {
        // Hide all views first
        this.elements.viewer.classList.remove('active');
        this.elements.editor.classList.remove('active');
        this.elements.dashboard.classList.remove('active');

        if (this.state.currentView === 'editor') {
            this.elements.editor.classList.add('active');
        } else if (this.state.currentView === 'viewer' && this.state.currentArticleId) {
            this.elements.viewer.classList.add('active');
            this.renderViewer();
        } else {
            this.elements.dashboard.classList.add('active');
            this.renderDashboard();
        }
    },

    renderViewer() {
        const article = this.state.articles.find(a => a.id === this.state.currentArticleId);
        if (article) {
            this.elements.articleTitle.textContent = article.title;
            this.elements.articleContent.innerHTML = this.converter.makeHtml(article.content);
            
            // Render tags
            this.elements.articleTagsContainer.innerHTML = (article.tags || [])
                .map(tag => `<span class="tag">${tag}</span>`).join('');

            // Render last updated
            const lastUpdated = new Date(article.updatedAt).toLocaleString('pt-BR');
            this.elements.articleLastUpdated.textContent = `Última atualização: ${lastUpdated}`;
        } else {
             // If for some reason article not found, go to dashboard
            this.showDashboard();
        }
    },

    renderDashboard() {
        this.elements.articleGrid.innerHTML = '';
        const { status, sortBy } = this.state.filters;

        // 1. Filter
        let filteredArticles = this.state.articles;
        if (status !== 'all') {
            filteredArticles = filteredArticles.filter(a => a.status === status);
        }
        
        // 2. Search (from sidebar input)
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredArticles = filteredArticles.filter(article => 
                article.title.toLowerCase().includes(searchTerm) ||
                article.content.toLowerCase().includes(searchTerm) ||
                (article.tags || []).some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // 3. Sort
        filteredArticles.sort((a, b) => {
            if (sortBy === 'title') {
                return a.title.localeCompare(b.title);
            }
            // For dates, newest first
            return new Date(b[sortBy]) - new Date(a[sortBy]);
        });
        
        if (this.state.articles.length === 0) {
            this.elements.welcomeMessage.classList.remove('hidden');
            this.elements.articleGrid.style.display = 'none';
        } else {
            this.elements.welcomeMessage.classList.add('hidden');
            this.elements.articleGrid.style.display = 'grid';
        }

        if (filteredArticles.length === 0) {
            this.elements.articleGrid.innerHTML = `<p>Nenhum artigo corresponde aos seus filtros.</p>`;
            return;
        }

        filteredArticles.forEach(article => {
            const card = document.createElement('div');
            card.className = 'article-card';
            card.dataset.id = article.id;

            const snippet = this.converter.makeHtml(article.content).replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';
            
            const tagsHTML = (article.tags || [])
                .map(tag => `<span class="tag">${tag}</span>`).join('');

            card.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${article.title}</h3>
                    <p class="card-meta">Criado em: ${new Date(article.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <p class="card-content-snippet">${snippet}</p>
                <div class="card-footer">
                    <div class="card-tags">${tagsHTML}</div>
                    <span class="card-status ${article.status}">${article.status === 'draft' ? 'Rascunho' : 'Publicado'}</span>
                </div>
            `;
            this.elements.articleGrid.appendChild(card);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());