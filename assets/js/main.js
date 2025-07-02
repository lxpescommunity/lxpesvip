document.addEventListener('DOMContentLoaded', () => {

    const API_URL = 'http://localhost:4000/api';
    const pathPrefix = window.location.pathname.includes('/pages/') ? '../' : './';
    const mainContent = document.getElementById('main-content');

    const loadDiscordStats = async () => {
        const inviteCode = 'zgwGH5Zztu';
        const totalMembersEl = document.getElementById('discord-total-members');
        const onlineMembersEl = document.getElementById('discord-online-members');
        if (!totalMembersEl || !onlineMembersEl) return;
        try {
            const response = await fetch(`https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`);
            if (!response.ok) {
                throw new Error(`A resposta da rede não foi 'ok': ${response.statusText}`);
            }
            const data = await response.json();
            const totalMembers = data.approximate_member_count || 0;
            const onlineMembers = data.approximate_presence_count || 0;
            totalMembersEl.textContent = totalMembers.toLocaleString('pt-BR');
            totalMembersEl.dataset.finalValue = totalMembers;
            onlineMembersEl.textContent = onlineMembers.toLocaleString('pt-BR');
            onlineMembersEl.dataset.finalValue = onlineMembers;
        } catch (error) {
            console.error("Erro ao buscar dados do Discord:", error);
            totalMembersEl.textContent = "N/A";
            onlineMembersEl.textContent = "N/A";
        }
    };

    const loadHTML = async (selector, url) => {
        const element = document.querySelector(selector);
        if (!element) return;
        try {
            const response = await fetch(pathPrefix + url);
            if (!response.ok) throw new Error(`Componente não encontrado: ${url}`);
            let data = await response.text();
            element.innerHTML = data.replace(/\{\{BASE_PATH\}\}/g, pathPrefix);
        } catch (error) {
            console.error(`Erro ao carregar HTML para ${selector} (${url}):`, error);
        }
    };

    const initializeHeaderEffects = () => {
        const header = document.querySelector('.main-header');
        if (header) {
            window.addEventListener('scroll', () => {
                header.classList.toggle('scrolled', window.scrollY > 50);
            });
        }
    };

    const initializeHeroEffects = () => {
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            heroSection.addEventListener('mousemove', (e) => {
                const { clientX, clientY } = e;
                const { offsetWidth, offsetHeight } = heroSection;
                const speed = parseFloat(heroSection.dataset.speed || -2);
                const x = (clientX - offsetWidth / 2) / (offsetWidth / 2);
                const y = (clientY - offsetHeight / 2) / (offsetHeight / 2);
                heroSection.style.setProperty('--mouse-x', x * speed);
                heroSection.style.setProperty('--mouse-y', y * speed);
            });
            heroSection.addEventListener('mouseleave', () => {
                heroSection.style.setProperty('--mouse-x', 0);
                heroSection.style.setProperty('--mouse-y', 0);
            });
        }
    };

    const initializeBackToTopButton = () => {
        const backToTopButton = document.getElementById("back-to-top");
        if (backToTopButton) {
            window.addEventListener('scroll', () => {
                backToTopButton.classList.toggle('visible', window.scrollY > 300);
            });
            backToTopButton.addEventListener('click', e => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    };

    const initializeStatusbarAnimations = () => {
        const statusBar = document.querySelector('.status-bar');
        if (!statusBar) return;
        const animateValue = (element, start, end, duration, prefix = '') => {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const currentValue = Math.floor(progress * (end - start) + start);
                element.textContent = prefix + currentValue.toLocaleString('pt-BR');
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    element.textContent = prefix + end.toLocaleString('pt-BR');
                }
            };
            window.requestAnimationFrame(step);
        };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const statusItems = entry.target.querySelectorAll('.status-item');
                    statusItems.forEach(item => {
                        item.classList.add('is-visible');
                        const valueElement = item.querySelector('.status-value');
                        if (valueElement && !valueElement.dataset.animated) {
                            valueElement.dataset.animated = 'true';
                            let finalValue = 0;
                            let prefix = '';
                            if (valueElement.dataset.finalValue) {
                                finalValue = parseInt(valueElement.dataset.finalValue, 10);
                            } else {
                                const textContent = valueElement.textContent;
                                if (textContent.startsWith('+')) prefix = '+';
                                const numericPart = textContent.replace(/[^0-9kK]/g, '');
                                if (numericPart.toLowerCase().includes('k')) {
                                    finalValue = parseFloat(numericPart.replace(/[kK]/g, '')) * 1000;
                                } else {
                                    finalValue = parseInt(numericPart, 10);
                                }
                            }
                            if (!isNaN(finalValue) && finalValue > 0) {
                                animateValue(valueElement, 0, finalValue, 1500, prefix);
                            }
                        }
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.3
        });
        observer.observe(statusBar);
    };

    const initializeFeatureCardAnimations = () => {
        const featureCards = document.querySelectorAll('.feature-card');
        if (featureCards.length === 0) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });
        featureCards.forEach((card, index) => {
            card.style.transitionDelay = `${index * 100}ms`;
            observer.observe(card);
        });
    };

    const initializeNexusBall = () => {
        const heroSection = document.querySelector('.hero-section');
        const nexusBall = document.getElementById('nexus-ball');
        if (!heroSection || !nexusBall) return;
        const moveBall = (x, y) => {
            nexusBall.style.left = `${x}px`;
            nexusBall.style.top = `${y}px`;
            nexusBall.classList.add('active');
        };
        heroSection.addEventListener('mousemove', (e) => {
            moveBall(e.clientX, e.clientY);
        });
        heroSection.addEventListener('mouseleave', () => {
            nexusBall.classList.remove('active');
        });
        let touchTimeout;
        heroSection.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            moveBall(touch.clientX, touch.clientY);
            clearTimeout(touchTimeout);
            touchTimeout = setTimeout(() => {
                nexusBall.classList.remove('active');
            }, 800);
        }, { passive: true });
    };

    const addDynamicEventListeners = () => {
        document.body.addEventListener('click', e => {
            const accordionHeader = e.target.closest('.accordion-header');
            if (accordionHeader) {
                const accordion = accordionHeader.parentElement;
                accordion.classList.toggle('active');
                const content = accordionHeader.nextElementSibling;
                if (content) {
                    content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + "px";
                }
            }
        });
    };

    const initializeMobileMenu = () => {
        const menuToggle = document.getElementById('menu-toggle');
        const navWrapper = document.querySelector('.header-nav-wrapper');
        const navLinks = document.querySelectorAll('.header-nav a');
        if (menuToggle && navWrapper) {
            menuToggle.addEventListener('click', () => {
                navWrapper.classList.toggle('active');
                const icon = menuToggle.querySelector('i');
                if (navWrapper.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-xmark');
                } else {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            });
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (navWrapper.classList.contains('active')) {
                        navWrapper.classList.remove('active');
                        const icon = menuToggle.querySelector('i');
                        if (icon) {
                            icon.classList.remove('fa-xmark');
                            icon.classList.add('fa-bars');
                        }
                    }
                });
            });
        }
    };

    async function init() {
        await Promise.all([
            loadHTML('#header-placeholder', 'components/header.html'),
            loadHTML('#footer-placeholder', 'components/footer.html')
        ]);
        const allSections = ['hero.html', 'status.html', 'features.html', 'how-to-install.html', 'patch-store.html'];
        try {
            const sectionPromises = allSections.map(section =>
                fetch(`${pathPrefix}sections/${section}`).then(res => {
                    if (!res.ok) throw new Error(`Falha ao carregar seção: ${section} - Status: ${res.status}`);
                    return res.text();
                })
            );
            const sectionHTMLs = await Promise.all(sectionPromises);
            if (mainContent) {
                mainContent.innerHTML = sectionHTMLs.join('');
            } else {
                console.error("Elemento 'main-content' não encontrado.");
                return;
            }
            setTimeout(initializePageScripts, 0);
        } catch (error) {
            console.error('Erro fatal ao carregar as seções da página:', error);
            if (mainContent) {
                mainContent.innerHTML = `<p class="error-message">Ocorreu um erro ao carregar o conteúdo do site. Por favor, verifique sua conexão ou tente novamente mais tarde.</p>`;
            }
        }
    }

    async function initializePageScripts() {
        loadDiscordStats();
        initializeHeroEffects();
        initializeHeaderEffects();
        initializeBackToTopButton();
        initializeStatusbarAnimations();
        initializeFeatureCardAnimations();
        addDynamicEventListeners();
        initializeMobileMenu();
        initializeNexusBall();
        console.log("Site inicializado com sucesso!");
        document.body.classList.add('loaded');
    }

    init();
});
