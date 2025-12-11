// Inicializa os ícones da biblioteca Lucide
lucide.createIcons();

// --- Elementos do Menu ---
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const menuLinks = mobileMenu.querySelectorAll('a');

// 1. Abrir/Fechar ao clicar no botão hamburguer
menuBtn.addEventListener('click', (e) => {
    // Impede que o clique no botão dispare o evento de "fechar ao clicar fora" imediatamente
    e.stopPropagation(); 
    mobileMenu.classList.toggle('active');
});

// 2. Fechar o menu ao clicar em um link interno
menuLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
    });
});

// 3. NOVO: Fechar ao clicar fora do menu
document.addEventListener('click', (e) => {
    // Verifica se o menu está aberto
    if (mobileMenu.classList.contains('active')) {
        // Se o local clicado (target) NÃO estiver dentro do menu
        // E também NÃO for o próprio botão de abrir
        if (!mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
            mobileMenu.classList.remove('active');
        }
    }
});

// --- Navbar com Sombra ao Rolar ---
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// --- Scroll Reveal Animation (Elementos aparecendo ao rolar) ---
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
revealOnScroll(); // Executa uma vez ao carregar para mostrar o que já está na tela

// --- MODAL (Lightbox dos Projetos) ---
const modal = document.getElementById('project-modal');
const closeModal = document.querySelector('.close-modal');
const projectCards = document.querySelectorAll('.project-card');

// Elementos internos do modal para preencher
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');

// Abrir Modal
projectCards.forEach(card => {
    card.addEventListener('click', () => {
        const title = card.getAttribute('data-title');
        const desc = card.getAttribute('data-desc');
        const img = card.getAttribute('data-img');

        modalTitle.textContent = title;
        modalDesc.textContent = desc;
        modalImg.src = img;

        modal.style.display = "block";
    });
});

// Fechar Modal no X
if (closeModal) {
    closeModal.addEventListener('click', () => {
        modal.style.display = "none";
    });
}

// Fechar Modal ao clicar fora da janela branca (fundo escuro)
window.addEventListener('click', (e) => {
    if (e.target == modal) {
        modal.style.display = "none";
    }
});