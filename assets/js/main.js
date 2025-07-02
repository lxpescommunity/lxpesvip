document.addEventListener('DOMContentLoaded', () => {

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
            totalMembersEl.textContent = (data.approximate_member_count || 0).toLocaleString('pt-BR');
            onlineMembersEl.textContent = (data.approximate_presence_count || 0).toLocaleString('pt-BR');
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

    async function init() {
        await Promise.all([
            loadHTML('#header-placeholder', 'components/header.html'),
            loadHTML('#footer-placeholder', 'components/footer.html')
        ]);
        if (document.getElementById('main-content')) {
            const allSections = ['hero.html', 'status.html', 'features.html', 'how-to-install.html', 'patch-store.html'];
            try {
                const sectionPromises = allSections.map(section =>
                    fetch(`${pathPrefix}sections/${section}`).then(res => {
                        if (!res.ok) throw new Error(`Falha ao carregar seção: ${section} - Status: ${res.status}`);
                        return res.text();
                    })
                );
                const sectionHTMLs = await Promise.all(sectionPromises);
                mainContent.innerHTML = sectionHTMLs.join('');
                loadDiscordStats();
            } catch (error) {
                console.error('Erro fatal ao carregar as seções da página:', error);
                mainContent.innerHTML = `<p style="color:white; text-align: center; padding: 2rem;">Ocorreu um erro ao carregar o conteúdo. Tente novamente mais tarde.</p>`;
            }
        }
    }
    
    init();
});