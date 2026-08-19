export const App = () => {
    return "Executei o desenvolvimento da tela de login"
const express = require('express')
const session = require('express-session')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.urlencoded({ extended: true }))
app.use(session({
    secret: 'troque-esta-chave',
    resave: false,
    saveUninitialized: false,
}))

// Simple hardcoded user
const AUTH_USER = { username: 'admin', password: 'password' }

// In-memory items store
let items = [
    { id: 1, name: 'Produto A', price: 9.9 },
    { id: 2, name: 'Produto B', price: 19.9 },
]
let nextId = 3

function requireAuth(req, res, next) {
    if (!req.session.user) return res.redirect('/login')
    next()
}

function renderPage(title, body, user) {
    return `<!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
            body{font-family:Arial,Helvetica,sans-serif;margin:20px}
            table{border-collapse:collapse;width:100%;max-width:800px}
            th,td{border:1px solid #ccc;padding:8px;text-align:left}
            form{margin-top:10px}
            .error{color:red}
            header nav a{margin-right:8px}
        </style>
    </head>
    <body>
        <header>
            <h1>Loja Online</h1>
            <nav>
                ${user ? '<a href="/items">Itens</a> | <a href="/items/new">Novo</a> | <a href="/logout">Sair</a>' : '<a href="/login">Login</a>'}
            </nav>
            <hr/>
        </header>
        ${body}
    </body>
    </html>`
}

// Routes
app.get('/', (req, res) => res.redirect('/items'))

app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/items')
    const body = `
        <h2>Login</h2>
        <form method="post" action="/login">
            <label>Usuário: <input name="username"></label><br>
            <label>Senha: <input type="password" name="password"></label><br>
            <button type="submit">Entrar</button>
        </form>`
    res.send(renderPage('Login', body, null))
})

app.post('/login', (req, res) => {
    const { username, password } = req.body
    if (username === AUTH_USER.username && password === AUTH_USER.password) {
        req.session.user = { username }
        return res.redirect('/items')
    }
    const body = `
        <h2>Login</h2>
        <form method="post" action="/login">
            <label>Usuário: <input name="username"></label><br>
            <label>Senha: <input type="password" name="password"></label><br>
            <button type="submit">Entrar</button>
        </form>
        <p class="error">Usuário ou senha inválidos</p>`
    res.send(renderPage('Login', body, null))
})

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'))
})

app.get('/items', requireAuth, (req, res) => {
    const rows = items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>R$ ${item.price.toFixed(2)}</td>
            <td>
                <a href="/items/${item.id}/edit">Editar</a>
                <form method="post" action="/items/${item.id}/delete" style="display:inline">
                    <button type="submit" onclick="return confirm('Excluir?')">Excluir</button>
                </form>
            </td>
        </tr>
    `).join('')
    const body = `
        <h2>Lista de Itens</h2>
        <a href="/items/new">Novo item</a>
        <table>
            <tr><th>Nome</th><th>Preço</th><th>Ações</th></tr>
            ${rows}
        </table>`
    res.send(renderPage('Itens', body, req.session.user))
})

app.get('/items/new', requireAuth, (req, res) => {
    const body = `
        <h2>Novo Item</h2>
        <form method="post" action="/items">
            <label>Nome: <input name="name"></label><br>
            <label>Preço: <input name="price"></label><br>
            <button type="submit">Salvar</button>
        </form>`
    res.send(renderPage('Novo Item', body, req.session.user))
})

app.post('/items', requireAuth, (req, res) => {
    const { name, price } = req.body
    items.push({ id: nextId++, name: name || 'Sem nome', price: parseFloat(price) || 0 })
    res.redirect('/items')
})

app.get('/items/:id/edit', requireAuth, (req, res) => {
    const id = Number(req.params.id)
    const item = items.find(i => i.id === id)
    if (!item) return res.redirect('/items')
    const body = `
        <h2>Editar Item</h2>
        <form method="post" action="/items/${item.id}/edit">
            <label>Nome: <input name="name" value="${item.name}"></label><br>
            <label>Preço: <input name="price" value="${item.price}"></label><br>
            <button type="submit">Salvar</button>
        </form>`
    res.send(renderPage('Editar Item', body, req.session.user))
})

app.post('/items/:id/edit', requireAuth, (req, res) => {
    const id = Number(req.params.id)
    const item = items.find(i => i.id === id)
    if (item) {
        item.name = req.body.name || item.name
        item.price = parseFloat(req.body.price) || item.price
    }
    res.redirect('/items')
})

app.post('/items/:id/delete', requireAuth, (req, res) => {
    const id = Number(req.params.id)
    items = items.filter(i => i.id !== id)
    res.redirect('/items')
})

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`))

module.exports = app