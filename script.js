// Inicializa ícones
lucide.createIcons();

// --- Lógica do Menu (Mantida) ---
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const menuLinks = mobileMenu.querySelectorAll('a');

menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileMenu.classList.toggle('active');
});

menuLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
    });
});

document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('active')) {
        if (!mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
            mobileMenu.classList.remove('active');
        }
    }
});

// --- Navbar Scroll ---
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

// --- Scroll Reveal ---
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
// --- MODAL COM FLIPBOOK (Capa e Contracapa Centralizadas) ---
// ======================================================
const modal = document.getElementById('project-modal');
const closeModal = document.querySelector('.close-modal');
const projectCards = document.querySelectorAll('.project-card');
const bookContainer = document.querySelector('.book-container');

// 1. GUARDA O HTML DAS PÁGINAS
const originalBookContent = document.getElementById('book').innerHTML;
bookContainer.innerHTML = ''; 

let pageFlip = null;

projectCards.forEach(card => {
    card.addEventListener('click', () => {
        const title = card.getAttribute('data-title');
        
        modal.style.display = "flex"; 

        if (pageFlip) {
            pageFlip.destroy();
            pageFlip = null;
        }

        bookContainer.innerHTML = `<div id="book"></div>`;
        const newBookElement = document.getElementById('book');
        newBookElement.innerHTML = originalBookContent;

        const newTitleDisplay = newBookElement.querySelector('#book-title-display');
        if(newTitleDisplay) newTitleDisplay.textContent = title;

        // CÁLCULOS DE TAMANHO
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const isMobile = screenW < 768;

        let pageWidth = isMobile ? Math.floor(screenW * 0.8) : 350; 
        let pageHeight = isMobile ? Math.floor(screenH * 0.6) : 500;

        const settings = {
            width: pageWidth,
            height: pageHeight,
            size: 'fixed',
            usePortrait: isMobile ? true : false, 
            showCover: true,
            maxShadowOpacity: 0.5,
            mobileScrollSupport: false
        };

        // Conta quantas páginas existem no total (para saber qual é a última)
        const totalPages = newBookElement.querySelectorAll('.my-page').length;

        // Delay para garantir renderização
        setTimeout(() => {
            pageFlip = new St.PageFlip(newBookElement, settings);
            pageFlip.loadFromHTML(newBookElement.querySelectorAll('.my-page'));

            // --- LÓGICA DE CENTRALIZAR (Só PC) ---
            if (!isMobile) {
                // Estado Inicial (Capa): Move para a esquerda
                bookContainer.style.transform = `translateX(-${pageWidth / 2}px)`;

                // Evento ao virar página
                pageFlip.on('flip', (e) => {
                    const currentPageIndex = e.data; // Índice da página atual (0, 1, 2...)
                    const lastPageIndex = totalPages - 1; // Índice da última página (ex: 5)

                    // 1. SE FOR A CAPA (Índice 0) -> Empurra para ESQUERDA
                    if (currentPageIndex === 0) {
                        bookContainer.style.transform = `translateX(-${pageWidth / 2}px)`;
                    } 
                    // 2. SE FOR A CONTRACAPA (Última Página) -> Empurra para DIREITA
                    else if (currentPageIndex === lastPageIndex) {
                        bookContainer.style.transform = `translateX(${pageWidth / 2}px)`;
                    }
                    // 3. SE FOR MIOLO -> Centraliza (Zero)
                    else {
                        bookContainer.style.transform = `translateX(0px)`;
                    }
                });
            } else {
                // Mobile: Sempre centralizado normal
                bookContainer.style.transform = `none`;
            }

        }, 50);
    });
});

const closeBookModal = () => {
    modal.style.display = "none";
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