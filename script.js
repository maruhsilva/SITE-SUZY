// ======================================================
// 1. INICIALIZAÇÃO E UI GERAL
// ======================================================

// Inicializa ícones Lucide
lucide.createIcons();

// --- Menu Mobile ---
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const menuLinks = mobileMenu.querySelectorAll('a');

if (menuBtn) {
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileMenu.classList.toggle('active');
    });
}

menuLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
    });
});

document.addEventListener('click', (e) => {
    if (mobileMenu && mobileMenu.classList.contains('active')) {
        if (!mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
            mobileMenu.classList.remove('active');
        }
    }
});

// --- Navbar Scroll Effect ---
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

// --- Scroll Reveal Animation ---
const revealElements = document.querySelectorAll('.reveal');
const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const elementVisible = 150;
    revealElements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;
        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('active');
        }
    });
};
window.addEventListener('scroll', revealOnScroll);
revealOnScroll(); // Dispara uma vez ao carregar

// ======================================================
// 2. MODAL FLIPBOOK (LIVRO INTERATIVO)
// ======================================================
const modal = document.getElementById('project-modal');
const closeModal = document.querySelector('.close-modal');
const projectCards = document.querySelectorAll('.project-card');
const bookContainer = document.querySelector('.book-container');

// Variável global do livro
let pageFlip = null;

// Função Renderiza Página do PDF para Canvas
const renderPageToCanvas = async (pdf, pageNumber, targetWidth, targetHeight) => {
    const page = await pdf.getPage(pageNumber);
    const unscaledViewport = page.getViewport({ scale: 1 });
    const scaleX = targetWidth / unscaledViewport.width;
    const scaleY = targetHeight / unscaledViewport.height;
    
    // Scale 1.5 para equilibrar qualidade e performance
    const scale = Math.min(scaleX, scaleY) * 1.5; 

    const viewport = page.getViewport({ scale: scale });
    const div = document.createElement('div');
    div.className = 'my-page';
    if(pageNumber === 1) div.setAttribute('data-density', 'hard'); // Capa dura
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    
    div.appendChild(canvas);

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    return div;
};

// Trava Scroll do Body
const toggleBodyScroll = (lock) => {
    if (lock) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
};

// Evento de Clique nos Projetos
projectCards.forEach(card => {
    card.addEventListener('click', async () => {
        const pdfUrl = card.getAttribute('data-pdf');
        const pagesAttr = card.getAttribute('data-pages'); // Pega as páginas escolhidas
        
        if (!pdfUrl) return;

        // 1. Abre Modal e Trava Scroll
        toggleBodyScroll(true);
        modal.style.display = "flex";

        // Limpa livro anterior se existir
        if (pageFlip) {
            pageFlip.destroy();
            pageFlip = null;
        }

        // 2. Injeta o SPINNER e limpa o container (Reseta tudo)
        bookContainer.innerHTML = `
            <div class="loading-wrapper">
                <div class="loading-spinner"></div>
                <div class="loading-text">Montando Livro...</div>
            </div>
        `;
        
        // Garante que o container esteja zerado de transformações
        bookContainer.style.transform = 'none';

        try {
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            const totalPdfPages = pdf.numPages;

            // 3. Lógica de Páginas Selecionadas
            let pagesToRender = [];
            if (pagesAttr) {
                try {
                    // Tenta ler o array [1, 2, 3] do HTML
                    pagesToRender = JSON.parse(pagesAttr);
                } catch (e) {
                    console.error("Erro ao ler data-pages. Usando padrão.");
                    for (let i = 1; i <= totalPdfPages; i++) pagesToRender.push(i);
                }
            } else {
                // Se não tem seleção, carrega até 20 páginas (limite de segurança)
                const maxPages = Math.min(totalPdfPages, 20);
                for (let i = 1; i <= maxPages; i++) pagesToRender.push(i);
            }

            // Definições de Tamanho Responsivo
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;
            const isMobile = screenW < 768;

            let bookWidth, bookHeight;

            if (isMobile) {
                // Mobile: 90% da largura da tela
                bookWidth = Math.floor(screenW * 0.90);
                bookHeight = Math.floor(bookWidth * 1.41);
                
                // Trava altura se passar da tela
                if (bookHeight > (screenH * 0.75)) {
                    bookHeight = Math.floor(screenH * 0.75);
                    bookWidth = Math.floor(bookHeight / 1.41);
                }
            } else {
                // PC: Altura fixa 80% da tela
                bookHeight = Math.floor(screenH * 0.80); 
                bookWidth = Math.floor(bookHeight / 1.41); 
            }

            // 4. CRIA O ELEMENTO DO LIVRO (Sem apagar o spinner!)
            const bookElement = document.createElement('div');
            bookElement.id = 'book';
            // Importante: book-content-hidden deve ter 'position: absolute' e 'opacity: 0' no CSS
            bookElement.className = 'book-content-hidden'; 
            
            // Adiciona o livro ao container (agora temos Spinner + Livro Oculto)
            bookContainer.appendChild(bookElement);

            // Renderiza as páginas dentro do elemento do livro
            for (const pageNum of pagesToRender) {
                if (pageNum <= totalPdfPages) {
                    const pageDiv = await renderPageToCanvas(pdf, pageNum, bookWidth, bookHeight);
                    bookElement.appendChild(pageDiv);
                }
            }

            // Configurações da biblioteca PageFlip
            const settings = {
                width: bookWidth,
                height: bookHeight,
                size: 'fixed',
                usePortrait: isMobile ? true : false,
                showCover: true,
                maxShadowOpacity: 0.5,
                mobileScrollSupport: false
            };

            pageFlip = new St.PageFlip(bookElement, settings);
            pageFlip.loadFromHTML(bookElement.querySelectorAll('.my-page'));

            // 5. TRANSIÇÃO: Remove Spinner e Mostra Livro
            setTimeout(() => {
                // Remove o spinner
                const spinner = bookContainer.querySelector('.loading-wrapper');
                if(spinner) spinner.remove();

                // Mostra o livro
                bookElement.classList.remove('book-content-hidden');
                bookElement.classList.add('book-content-visible');
            }, 500); // Delay visual

            // 6. Centralização (Apenas Desktop)
            if (!isMobile) {
                // Desloca para esquerda para centralizar capa
                bookContainer.style.transform = `translateX(-${bookWidth / 2}px)`;
                
                pageFlip.on('flip', (e) => {
                    const lastIndex = pageFlip.getPageCount() - 1;
                    if (e.data === 0) 
                        bookContainer.style.transform = `translateX(-${bookWidth / 2}px)`;
                    else if (e.data === lastIndex) 
                        bookContainer.style.transform = `translateX(${bookWidth / 2}px)`;
                    else 
                        bookContainer.style.transform = `translateX(0px)`;
                });
            } else {
                // Mobile: Sempre zerado
                bookContainer.style.transform = 'none';
            }

        } catch (error) {
            console.error(error);
            bookContainer.innerHTML = `<div style="color:white; text-align:center;">Erro ao abrir.<br>${error.message}</div>`;
        }
    });
});

// Função Fechar Modal
const closeBookModal = () => {
    modal.style.display = "none";
    toggleBodyScroll(false);
    if (pageFlip) {
        pageFlip.destroy();
        pageFlip = null;
    }
    bookContainer.innerHTML = '';
    bookContainer.style.transform = 'none';
};

if (closeModal) closeModal.addEventListener('click', closeBookModal);
window.addEventListener('click', (e) => {
    if (e.target == modal) closeBookModal();
});


// ======================================================
// 3. CHATBOT AVANÇADO (Árvore de Decisão)
// ======================================================
const triggerBtn = document.getElementById('wpp-trigger');
const chatWin = document.getElementById('chat-window');
const chatBodyDiv = document.getElementById('chat-body');
const chatOptsDiv = document.getElementById('chat-options');
const closeChatBtn = document.getElementById('close-chat');
const backBtn = document.getElementById('chat-back-btn');
const restartBtn = document.getElementById('chat-restart-btn');

// --- SEU TELEFONE AQUI ---
const PHONE_NUMBER = "55129822995090"; 

let currentStep = 'start';
let historyStack = [];

// Fluxo de Conversa
const flow = {
    start: {
        text: "Olá! Sou a assistente da designer. Sobre o que gostaria de falar?",
        buttons: [
            { label: "Orçamento", next: "orcamento" },
            { label: "Dúvidas", next: "duvidas" },
            { label: "Falar no WhatsApp", whatsapp: "Olá, vim pelo site." }
        ]
    },
    orcamento: {
        text: "Legal! Qual o tipo de projeto?",
        buttons: [
            { label: "Livro Completo", whatsapp: "Olá, quero orçamento para Diagramação de Livro." },
            { label: "Revista/Catálogo", whatsapp: "Olá, quero orçamento para Revista." },
            { label: "Capa", whatsapp: "Olá, quero orçamento para uma Capa." },
            { label: "Outros", whatsapp: "Olá, quero orçamento para um projeto personalizado." }
        ]
    },
    duvidas: {
        text: "Qual sua dúvida principal?",
        buttons: [
            { label: "Prazos de Entrega", whatsapp: "Olá, tenho dúvidas sobre prazos." },
            { label: "Formas de Pagamento", whatsapp: "Olá, tenho dúvidas sobre pagamento." },
            { label: "Outros Assuntos", whatsapp: "Olá, tenho uma dúvida geral." }
        ]
    }
};

// Funções do Chat
function addMsg(text, type) {
    const div = document.createElement('div');
    div.className = `chat-msg msg-${type}`; // msg-bot ou msg-user
    div.textContent = text;
    chatBodyDiv.appendChild(div);
    chatBodyDiv.scrollTop = chatBodyDiv.scrollHeight;
}

function loadStep(stepName, isBackNav = false) {
    const step = flow[stepName];
    
    // Salva histórico se não for voltar e não for o início
    if (!isBackNav && stepName !== 'start' && currentStep !== stepName) {
        historyStack.push(currentStep);
    }
    if (stepName === 'start') historyStack = [];
    
    currentStep = stepName;
    
    // Mostra/Esconde botão Voltar
    if(backBtn) {
        backBtn.style.display = historyStack.length > 0 ? 'flex' : 'none';
    }

    // Mensagem do Bot (Delay para naturalidade)
    setTimeout(() => addMsg(step.text, 'bot'), 300);

    // Botões
    chatOptsDiv.innerHTML = '';
    step.buttons.forEach(btnData => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = btnData.label;
        
        // CORREÇÃO AQUI: Adicionado 'e' e 'e.stopPropagation()'
        // Isso impede que o clique no botão seja lido pelo 'document.click'
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            addMsg(btnData.label, 'user');
            
            if (btnData.next) {
                loadStep(btnData.next);
            } else if (btnData.whatsapp) {
                setTimeout(() => {
                    addMsg("Abrindo WhatsApp...", 'bot');
                    const link = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(btnData.whatsapp)}`;
                    window.open(link, '_blank');
                }, 500);
            }
        });
        chatOptsDiv.appendChild(btn);
    });
}

// Eventos do Chat
if (triggerBtn) {
    triggerBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Impede fechar ao clicar no botão
        const isOpen = chatWin.classList.contains('show-chat');
        
        if (isOpen) {
            chatWin.classList.remove('show-chat');
        } else {
            chatWin.classList.add('show-chat');
            // Verifica se está vazio contando os filhos (ignora espaços em branco)
            if (chatBodyDiv.children.length === 0) {
                loadStep('start');
            }
        }
    });
}

if (backBtn) {
    backBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Previne fechamento
        if (historyStack.length > 0) {
            const previousStep = historyStack.pop();
            // Remove as 2 últimas mensagens (User + Bot) para limpar a tela
            if(chatBodyDiv.lastChild) chatBodyDiv.lastChild.remove();
            if(chatBodyDiv.lastChild) chatBodyDiv.lastChild.remove();
            loadStep(previousStep, true);
        }
    });
}

if (restartBtn) {
    restartBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Previne fechamento
        chatBodyDiv.innerHTML = ''; 
        loadStep('start');
    });
}

if (closeChatBtn) {
    closeChatBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Previne fechamento
        chatWin.classList.remove('show-chat');
    });
}

// Fechar Chat ao clicar fora
document.addEventListener('click', (e) => {
    if (chatWin && chatWin.classList.contains('show-chat')) {
        // Se clicar dentro do chat, não faz nada
        if (chatWin.contains(e.target) || triggerBtn.contains(e.target)) {
            return;
        }
        // Se clicou fora, fecha
        chatWin.classList.remove('show-chat');
    }
});