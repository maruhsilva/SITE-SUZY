// Inicializa ícones
lucide.createIcons();

// ======================================================
// 1. UI GERAL (Menu, Navbar, Scroll)
// ======================================================

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

const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

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
revealOnScroll();

// ======================================================
// 2. MODAL FLIPBOOK (LIVRO)
// ======================================================
const modal = document.getElementById('project-modal');
const closeModal = document.querySelector('.close-modal');
const projectCards = document.querySelectorAll('.project-card');
const bookContainer = document.querySelector('.book-container');
let pageFlip = null;

const renderPageToCanvas = async (pdf, pageNumber, targetWidth, targetHeight) => {
    const page = await pdf.getPage(pageNumber);
    const unscaledViewport = page.getViewport({ scale: 1 });
    const scaleX = targetWidth / unscaledViewport.width;
    const scaleY = targetHeight / unscaledViewport.height;
    const scale = Math.min(scaleX, scaleY) * 1.5; 
    const viewport = page.getViewport({ scale: scale });
    const div = document.createElement('div');
    div.className = 'my-page';
    if(pageNumber === 1) div.setAttribute('data-density', 'hard');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });
    canvas.width = viewport.width; canvas.height = viewport.height;
    canvas.style.width = "100%"; canvas.style.height = "100%";
    div.appendChild(canvas);
    await page.render({ canvasContext: context, viewport: viewport }).promise;
    return div;
};

const toggleBodyScroll = (lock) => {
    if (lock) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
};

projectCards.forEach(card => {
    card.addEventListener('click', async () => {
        const pdfUrl = card.getAttribute('data-pdf');
        const pagesAttr = card.getAttribute('data-pages');
        if (!pdfUrl) return;
        toggleBodyScroll(true);
        modal.style.display = "flex";
        if (pageFlip) { pageFlip.destroy(); pageFlip = null; }
        
        bookContainer.innerHTML = `<div class="loading-wrapper"><div class="loading-spinner"></div><div class="loading-text">Montando Livro...</div></div>`;
        bookContainer.style.transform = 'none';

        try {
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            const totalPdfPages = pdf.numPages;
            let pagesToRender = [];
            if (pagesAttr) {
                try { pagesToRender = JSON.parse(pagesAttr); } 
                catch (e) { for (let i = 1; i <= totalPdfPages; i++) pagesToRender.push(i); }
            } else {
                const maxPages = Math.min(totalPdfPages, 20);
                for (let i = 1; i <= maxPages; i++) pagesToRender.push(i);
            }

            const screenW = window.innerWidth; const screenH = window.innerHeight;
            const isMobile = screenW < 768;
            let bookWidth, bookHeight;
            if (isMobile) {
                bookWidth = Math.floor(screenW * 0.90);
                bookHeight = Math.floor(bookWidth * 1.41);
                if (bookHeight > (screenH * 0.75)) { bookHeight = Math.floor(screenH * 0.75); bookWidth = Math.floor(bookHeight / 1.41); }
            } else {
                bookHeight = Math.floor(screenH * 0.80); 
                bookWidth = Math.floor(bookHeight / 1.41); 
            }

            const bookElement = document.createElement('div');
            bookElement.id = 'book'; bookElement.className = 'book-content-hidden'; 
            bookContainer.appendChild(bookElement);

            for (const pageNum of pagesToRender) {
                if (pageNum <= totalPdfPages) {
                    const pageDiv = await renderPageToCanvas(pdf, pageNum, bookWidth, bookHeight);
                    bookElement.appendChild(pageDiv);
                }
            }

            const settings = { width: bookWidth, height: bookHeight, size: 'fixed', usePortrait: isMobile ? true : false, showCover: true, maxShadowOpacity: 0.5, mobileScrollSupport: false };
            pageFlip = new St.PageFlip(bookElement, settings);
            pageFlip.loadFromHTML(bookElement.querySelectorAll('.my-page'));

            setTimeout(() => {
                const spinner = bookContainer.querySelector('.loading-wrapper');
                if(spinner) spinner.remove();
                bookElement.classList.remove('book-content-hidden');
                bookElement.classList.add('book-content-visible');
            }, 500);

            if (!isMobile) {
                bookContainer.style.transform = `translateX(-${bookWidth / 2}px)`;
                pageFlip.on('flip', (e) => {
                    const lastIndex = pageFlip.getPageCount() - 1;
                    if (e.data === 0) bookContainer.style.transform = `translateX(-${bookWidth / 2}px)`;
                    else if (e.data === lastIndex) bookContainer.style.transform = `translateX(${bookWidth / 2}px)`;
                    else bookContainer.style.transform = `translateX(0px)`;
                });
            } else { bookContainer.style.transform = 'none'; }

        } catch (error) {
            console.error(error);
            bookContainer.innerHTML = `<div style="color:white; text-align:center;">Erro ao abrir.<br>${error.message}</div>`;
        }
    });
});

const closeBookModal = () => {
    modal.style.display = "none"; toggleBodyScroll(false);
    if (pageFlip) { pageFlip.destroy(); pageFlip = null; }
    bookContainer.innerHTML = ''; bookContainer.style.transform = 'none';
};
if (closeModal) closeModal.addEventListener('click', closeBookModal);
window.addEventListener('click', (e) => { if (e.target == modal) closeBookModal(); });


// ======================================================
// 3. CHATBOT FINAL (Perguntas Detalhadas)
// ======================================================
const triggerBtn = document.getElementById('wpp-trigger');
const chatWin = document.getElementById('chat-window');
const chatBodyDiv = document.getElementById('chat-body');
const chatOptsDiv = document.getElementById('chat-options');
const closeChatBtn = document.getElementById('close-chat');
const backBtn = document.getElementById('chat-back-btn');
const restartBtn = document.getElementById('chat-restart-btn');

// --- SEU TELEFONE AQUI ---
const PHONE_NUMBER = "5511999999999"; 

let currentStep = 'start';
let historyStack = [];
// Objeto que guarda TODAS as respostas
let userData = {
    name: '',
    type: '', 
    company: '',
    subject: '',
    details: ''
};

// --- ROTEIRO DETALHADO DO CHAT ---
const flow = {
    start: {
        text: "Olá! Bem-vindo ao Studio. Antes de começarmos, qual é o seu nome?",
        inputType: "text", 
        saveField: "name", 
        next: "ask_type"   
    },
    ask_type: {
        getText: () => `Prazer, ${userData.name}! Você é Pessoa Física ou Jurídica?`,
        buttons: [
            { label: "Pessoa Física", next: "menu_principal", saveVal: { type: "PF", company: "N/A" } },
            { label: "Pessoa Jurídica", next: "ask_company", saveVal: { type: "PJ" } }
        ]
    },
    ask_company: {
        text: "Entendi. Qual é o nome da sua empresa?",
        inputType: "text",
        saveField: "company",
        next: "menu_principal"
    },
    menu_principal: {
        text: "Certo! Como posso te ajudar hoje?",
        buttons: [
            { label: "Orçamento", next: "orcamento" },
            { label: "Dúvidas", next: "duvidas" },
            { label: "Falar no WhatsApp", next: "ask_details_general", saveVal: { subject: "Atendimento Geral" } }
        ]
    },
    orcamento: {
        text: "Ótimo. Qual o tipo de projeto?",
        // Cada botão leva para uma pergunta específica
        buttons: [
            { label: "Livro Completo", next: "ask_details_book", saveVal: { subject: "Orçamento de Livro" } },
            { label: "Revista/Catálogo", next: "ask_details_magazine", saveVal: { subject: "Orçamento de Revista" } },
            { label: "Capa", next: "ask_details_cover", saveVal: { subject: "Orçamento de Capa" } },
            { label: "Outros", next: "ask_details_general", saveVal: { subject: "Orçamento Personalizado" } }
        ]
    },
    duvidas: {
        text: "Qual sua dúvida principal?",
        buttons: [
            { label: "Prazos", next: "ask_details_deadline", saveVal: { subject: "Dúvida sobre Prazos" } },
            { label: "Pagamento", next: "ask_details_payment", saveVal: { subject: "Dúvida sobre Pagamento" } },
            { label: "Outros", next: "ask_details_general", saveVal: { subject: "Dúvida Geral" } }
        ]
    },

    // --- PERGUNTAS ESPECÍFICAS FINAIS ---
    
    // Pergunta para Livros
    ask_details_book: {
        text: "Para eu agilizar seu orçamento: Tem ideia da quantidade de páginas e se terá imagens?",
        inputType: "text",
        saveField: "details",
        isFinal: true
    },
    // Pergunta para Revistas
    ask_details_magazine: {
        text: "Revistas são ótimas! Você já possui o texto final e as fotos definidas?",
        inputType: "text",
        saveField: "details",
        isFinal: true
    },
    // Pergunta para Capas
    ask_details_cover: {
        text: "A capa é essencial. Você tem alguma referência de estilo ou uma sinopse breve?",
        inputType: "text",
        saveField: "details",
        isFinal: true
    },
    // Pergunta para Prazos
    ask_details_deadline: {
        text: "Entendi. Para quando você precisaria desse projeto pronto?",
        inputType: "text",
        saveField: "details",
        isFinal: true
    },
    // Pergunta para Pagamento
    ask_details_payment: {
        text: "Certo. Qual sua dúvida específica sobre valores ou formas de pagamento?",
        inputType: "text",
        saveField: "details",
        isFinal: true
    },
    // Pergunta Geral (fallback)
    ask_details_general: {
        text: "Pode me contar um pouco mais sobre o que você precisa?",
        inputType: "text",
        saveField: "details",
        isFinal: true
    }
};

function addMsg(text, type) {
    const div = document.createElement('div');
    div.className = `chat-msg msg-${type}`;
    div.textContent = text;
    chatBodyDiv.appendChild(div);
    chatBodyDiv.scrollTop = chatBodyDiv.scrollHeight;
}

function loadStep(stepName, isBackNav = false) {
    const step = flow[stepName];
    
    if (!isBackNav && stepName !== 'start' && currentStep !== stepName) {
        historyStack.push(currentStep);
    }
    if (stepName === 'start') {
        historyStack = [];
        userData = { name: '', type: '', company: '', subject: '', details: '' };
    }
    
    currentStep = stepName;
    if(backBtn) backBtn.style.display = historyStack.length > 0 ? 'flex' : 'none';

    const botText = step.getText ? step.getText() : step.text;
    setTimeout(() => addMsg(botText, 'bot'), 300);

    chatOptsDiv.innerHTML = '';

    if (step.inputType === "text") {
        createInputField(step);
    } else {
        createButtons(step);
    }
}

function createInputField(step) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'chat-input';
    input.placeholder = "Digite aqui...";
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendBtn.click();
    });

    const sendBtn = document.createElement('button');
    sendBtn.className = 'chat-send-btn';
    sendBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>`;

    sendBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = input.value.trim();
        if (value === "") return; 

        if (step.saveField) userData[step.saveField] = value;

        addMsg(value, 'user'); 
        
        if (step.isFinal) {
            finishChat();
        } else {
            loadStep(step.next);
        }
    });

    wrapper.appendChild(input);
    wrapper.appendChild(sendBtn);
    chatOptsDiv.appendChild(wrapper);
    setTimeout(() => input.focus(), 400);
}

function createButtons(step) {
    step.buttons.forEach(btnData => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = btnData.label;
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            addMsg(btnData.label, 'user');

            if (btnData.saveVal) {
                Object.assign(userData, btnData.saveVal);
            }
            
            if (btnData.next) {
                loadStep(btnData.next);
            }
        });
        chatOptsDiv.appendChild(btn);
    });
}

function finishChat() {
    setTimeout(() => {
        addMsg("Perfeito! Abrindo seu WhatsApp...", 'bot');
        
        const finalMessage = 
            `*Olá! Vim pelo Chat do Site.*\n` +
            `---------------------------\n` +
            `*Nome:* ${userData.name}\n` +
            `*Perfil:* ${userData.type}\n` +
            (userData.company !== "N/A" ? `*Empresa:* ${userData.company}\n` : "") +
            `\n*ASSUNTO:* ${userData.subject}\n` +
            `*DETALHES:* ${userData.details}`;

        const link = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(finalMessage)}`;
        
        setTimeout(() => {
            window.open(link, '_blank');
        }, 1000);
    }, 500);
}

if (triggerBtn) {
    triggerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = chatWin.classList.contains('show-chat');
        if (isOpen) chatWin.classList.remove('show-chat');
        else {
            chatWin.classList.add('show-chat');
            if (chatBodyDiv.children.length === 0) loadStep('start');
        }
    });
}

if (backBtn) {
    backBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (historyStack.length > 0) {
            const previousStep = historyStack.pop();
            if(chatBodyDiv.lastChild) chatBodyDiv.lastChild.remove(); 
            if(chatBodyDiv.lastChild) chatBodyDiv.lastChild.remove();
            loadStep(previousStep, true);
        }
    });
}

if (restartBtn) {
    restartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chatBodyDiv.innerHTML = ''; 
        loadStep('start');
    });
}

if (closeChatBtn) {
    closeChatBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chatWin.classList.remove('show-chat');
    });
}

document.addEventListener('click', (e) => {
    if (chatWin && chatWin.classList.contains('show-chat')) {
        if (!chatWin.contains(e.target) && !triggerBtn.contains(e.target)) {
            chatWin.classList.remove('show-chat');
        }
    }
});