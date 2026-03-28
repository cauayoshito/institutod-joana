# Instituto Social D'Joana — Site + Painel Admin

## Estrutura do Projeto

```
djoana/
├── index.html              ← Site público (frontend)
├── css/
│   └── style.css           ← Estilos do site
├── js/
│   ├── main.js             ← Interações do site (scroll, menu, etc)
│   ├── supabase-config.js  ← Configuração do Supabase (EDITAR AQUI)
│   └── site-data.js        ← Carrega dados dinâmicos no site
├── admin/
│   └── index.html          ← Painel administrativo completo
├── assets/
│   ├── images/             ← Imagens do site
│   └── logos/              ← Logos dos parceiros
├── setup.sql               ← SQL para configurar o banco
└── README.md               ← Este arquivo
```

---

## Configuração Passo a Passo

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Clique em **"New Project"**
3. Escolha um nome (ex: `djoana-site`)
4. Defina uma senha para o banco de dados
5. Selecione a região South America (São Paulo)
6. Aguarde a criação do projeto

### 2. Configurar o banco de dados

1. No painel do Supabase, vá em **SQL Editor** (menu lateral)
2. Clique em **"New query"**
3. Copie **todo** o conteúdo do arquivo `setup.sql` e cole no editor
4. Clique em **"Run"** (botão verde)
5. Deve aparecer "Success" — tabelas, políticas e storage criados

### 3. Conectar o site ao Supabase

1. No Supabase, vá em **Settings > API**
2. Copie a **Project URL** (ex: `https://abc123.supabase.co`)
3. Copie a **anon public key**
4. Abra o arquivo `js/supabase-config.js`
5. Substitua os valores:

```javascript
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "SUA-ANON-KEY-AQUI";
```

### 4. Criar usuário admin

1. No Supabase, vá em **Authentication > Users**
2. Clique em **"Add user" > "Create new user"**
3. Preencha email e senha (dados de acesso ao painel)
4. Marque **"Auto Confirm User"**
5. Clique em **"Create user"**

### 5. Testar localmente

**VS Code com Live Server:**
- Instale a extensão "Live Server"
- Clique direito no `index.html` > "Open with Live Server"
- Admin: `http://localhost:5500/admin/`

**Ou Python:**
```bash
cd djoana
python3 -m http.server 8000
# Site: http://localhost:8000
# Admin: http://localhost:8000/admin/
```

### 6. Deploy (Publicar)

**Recomendado: Netlify (grátis)**
1. Acesse [netlify.com](https://netlify.com)
2. Arraste a pasta `djoana/` para o painel
3. Pronto — site no ar em segundos
4. Configure domínio personalizado se desejar

---

## Como usar o Painel Admin

### Parcerias
- **Adicionar**: nome, descrição, logo, link e ordem de exibição
- **Editar**: alterar qualquer campo existente
- **Excluir**: com confirmação antes de deletar
- O carrossel do site atualiza automaticamente

### Notícias
- **Publicar**: título, descrição, tag, imagem e link
- A notícia mais recente aparece como destaque
- Máximo de 3 notícias exibidas no site

### Galeria
- **Upload**: arraste ou clique para enviar imagens
- **Legenda**: texto que aparece sobre a imagem
- **Ordem**: controla posição no grid

### Todas as alterações refletem imediatamente no site público.
