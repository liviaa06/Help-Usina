import * as showdown from 'showdown';

const App = {
    // STATE
    state: {
        articles: [],
        currentArticleId: null,
        currentView: 'viewer', // 'viewer' or 'editor'
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
        articleTitle: document.getElementById('article-title'),
        articleContent: document.getElementById('article-content'),
        welcomeMessage: document.getElementById('welcome-message'),
        editorForm: document.getElementById('editor-form'),
        editorTitle: document.getElementById('editor-title'),
        editorContent: document.getElementById('editor-content'),
        articleIdInput: document.getElementById('article-id'),
        newArticleBtn: document.getElementById('new-article-btn'),
        editArticleBtn: document.getElementById('edit-article-btn'),
        deleteArticleBtn: document.getElementById('delete-article-btn'),
        saveBtn: document.getElementById('save-btn'),
        cancelBtn: document.getElementById('cancel-btn'),
        searchInput: document.getElementById('search-input'),
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
        this.elements.cancelBtn.addEventListener('click', () => this.showViewer());
        this.elements.articleList.addEventListener('click', (e) => this.handleArticleSelection(e));
        this.elements.searchInput.addEventListener('input', (e) => this.renderArticleList(e.target.value));
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
            `
        };
        this.state.articles.push(sampleArticle);
        this.saveArticles();
        this.state.currentArticleId = sampleArticle.id;
    },

    // STATE MUTATIONS & LOGIC
    setCurrentArticle(id) {
        this.state.currentArticleId = id;
        this.showViewer();
        this.render();
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
                this.easyMDE.value(article.content);
            }
        } else {
            this.elements.editorForm.reset();
            this.elements.articleIdInput.value = '';
            this.easyMDE.value('');
        }
        this.render();
    },

    showViewer() {
        this.state.currentView = 'viewer';
        this.render();
    },
    
    handleSave(e) {
        e.preventDefault();
        const id = this.elements.articleIdInput.value;
        const title = this.elements.editorTitle.value.trim();
        const content = this.easyMDE.value().trim();

        if (!title || !content) {
            alert('Título e conteúdo são obrigatórios.');
            return;
        }

        if (id) { // Update existing
            const index = this.state.articles.findIndex(a => a.id === id);
            if (index > -1) {
                this.state.articles[index] = { ...this.state.articles[index], title, content };
            }
        } else { // Create new
            const newArticle = {
                id: crypto.randomUUID(),
                title,
                content
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
            this.render();
        }
    },

    handleArticleSelection(e) {
        if (e.target && e.target.closest('li')) {
            const id = e.target.closest('li').dataset.id;
            this.setCurrentArticle(id);
        }
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
        if (this.state.currentView === 'editor') {
            this.elements.viewer.classList.remove('active');
            this.elements.editor.classList.add('active');
        } else { // viewer
            this.elements.editor.classList.remove('active');
            this.elements.viewer.classList.add('active');

            const article = this.state.articles.find(a => a.id === this.state.currentArticleId);
            if (article) {
                this.elements.welcomeMessage.style.display = 'none';
                this.elements.articleTitle.style.display = 'block';
                this.elements.articleContent.style.display = 'block';
                this.elements.editArticleBtn.style.display = 'inline-flex';
                this.elements.deleteArticleBtn.style.display = 'inline-flex';
                
                this.elements.articleTitle.textContent = article.title;
                this.elements.articleContent.innerHTML = this.converter.makeHtml(article.content);
            } else {
                this.elements.welcomeMessage.style.display = 'flex';
                this.elements.articleTitle.style.display = 'none';
                this.elements.articleContent.style.display = 'none';
                this.elements.editArticleBtn.style.display = 'none';
                this.elements.deleteArticleBtn.style.display = 'none';
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());