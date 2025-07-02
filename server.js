require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const fetch = require('node-fetch'); // npm install node-fetch@2

const app = express();
const PORT = process.env.PORT || 4000;
const projectRootPath = process.cwd();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(express.static(projectRootPath));

// Discord OAuth2 Config
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

// Rota para iniciar login Discord
app.get('/api/login', (req, res) => {
    const discordAuthUrl =
      `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code&scope=identify%20guilds`;
    res.redirect(discordAuthUrl);
});

// Callback OAuth2 do Discord
app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send('Código OAuth não fornecido');

    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('scope', 'identify guilds');

    try {
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            return res.status(400).send(`Erro no token: ${tokenData.error}`);
        }

        const accessToken = tokenData.access_token;

        const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const guilds = await guildsResponse.json();

        const isMember = guilds.some(g => g.id === GUILD_ID);

        if (isMember) {
            req.session.user = { accessToken, guilds };
            res.send(`
                <h1>Você está autorizado!</h1>
                <p>Bem-vindo ao checkout, seu acesso foi validado no Discord.</p>
                <a href="/processar-pagamento">Prosseguir para pagamento</a>
            `);
        } else {
            res.send(`
                <h1>Você precisa entrar no nosso servidor Discord</h1>
                <p><a href="https://discord.gg/seu-link-aqui" target="_blank">Clique aqui para entrar no servidor</a></p>
            `);
        }
    } catch (error) {
        console.error('Erro na autenticação Discord:', error);
        res.status(500).send(`Erro interno: ${error.message}`);
    }
});

// Protege rota pagamento
app.get('/processar-pagamento', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send(`
            <h1>Acesso negado</h1>
            <p>Você precisa fazer login com Discord para acessar esta página.</p>
            <a href="/api/login">Entrar com Discord</a>
        `);
    }
    res.send(`
        <h1>Processando pagamento...</h1>
        <p>Aqui vai a integração com sua plataforma de pagamento.</p>
    `);
});

// Rotas API simples
app.get('/api/user', (req, res) => {
    if (req.session.user) res.json({ loggedIn: true, user: req.session.user });
    else res.json({ loggedIn: false });
});
app.get('/api/logout', (req, res) => {
    req.session.destroy(() => { res.redirect('/'); });
});

// Serve arquivos estáticos e fallback para index.html
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).send('Endpoint de API não encontrado.');
    }
    const filePath = path.join(projectRootPath, req.path === '/' ? 'index.html' : req.path);
    res.sendFile(filePath, err => {
        if (err) {
            res.status(404).sendFile(path.join(projectRootPath, 'index.html'));
        }
    });
});

app.listen(PORT, () => {
    console.log(`[Servidor Web] Rodando na porta ${PORT}.`);
});