require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const fetch = require('node-fetch');

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
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(express.static(projectRootPath));

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

app.get('/api/login', (req, res) => {
    const discordAuthUrl =
      `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code&scope=identify%20guilds`;
    res.redirect(discordAuthUrl);
});

app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).send('Erro: O código OAuth2 do Discord não foi fornecido.');
    }

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
            console.error('Erro ao obter token do Discord:', tokenData.error);
            return res.status(400).send(`Erro na autenticação: ${tokenData.error_description}`);
        }

        const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });

        const guilds = await guildsResponse.json();
        const isMember = Array.isArray(guilds) && guilds.some(g => g.id === GUILD_ID);

        if (isMember) {
            req.session.user = { loggedIn: true, guilds: guilds.map(g => g.id) };
            res.redirect('/');
        } else {
            res.redirect('/discord-required.html');
        }
    } catch (error) {
        console.error('Erro no fluxo de autenticação Discord:', error);
        res.status(500).send('Ocorreu um erro interno durante a autenticação. Tente novamente mais tarde.');
    }
});

app.get('/api/user/status', (req, res) => {
    if (req.session.user && req.session.user.loggedIn) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Não foi possível fazer logout.');
        }
        res.redirect('/');
    });
});

app.get('/tutoriais', (req, res) => {
    res.sendFile(path.join(projectRootPath, 'pages', 'tutoriais.html'));
});

app.get('/faq', (req, res) => {
    res.sendFile(path.join(projectRootPath, 'pages', 'faq.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(projectRootPath, 'index.html'));
});


app.listen(PORT, () => {
    console.log(`[Servidor Web] Rodando com sucesso na porta ${PORT}.`);
});