# ACEBA · Site institucional com painel administrativo

Site institucional da Associação Comunitária Estiva Buris de Abrantes, com frontend público em HTML/CSS/JS puro e painel administrativo integrado ao Supabase.

## Stack

- HTML, CSS e JavaScript puro
- Não usa Next, Vite, bundler ou `.env.local`
- Supabase via CDN global no HTML
- Supabase Auth para login administrativo
- Supabase Database com RLS para dados públicos e gestão interna
- Supabase Storage opcional para hospedar logos, fotos e documentos
- Sem build obrigatório. Pode ser publicado em Netlify, Vercel, GitHub Pages, S3, Hostinger ou Apache

## Estrutura

```text
aceba-site-v2/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   └── supabase-client.js
├── admin/
│   ├── login.html
│   ├── dashboard.html
│   ├── admin.css
│   └── admin.js
├── supabase/
│   └── schema.sql
└── assets/
    ├── images/
    └── logos/
```

## Como funciona

O site público continua com conteúdo estático como fallback. Quando `js/supabase-client.js` estiver configurado, o `js/main.js` busca dados ativos no Supabase e substitui partes do site:

- Parceiros: tabela `partners`
- Galeria: tabela `gallery_images`
- Documentos de transparência: tabela `transparency_documents`
- Configurações: tabela `site_settings`

Se o Supabase estiver sem credenciais, fora do ar ou sem registros ativos, o site não quebra.

## Configurar Supabase

1. Crie um projeto em https://supabase.com.
2. Abra o SQL Editor.
3. Rode o arquivo `supabase/schema.sql`.
4. Em Authentication, crie um usuário admin com e-mail e senha.
5. Copie o ID do usuário criado em `auth.users`.
6. Insira esse usuário na tabela `admin_users`:

```sql
insert into public.admin_users (id, email)
values ('COLE_AQUI_O_ID_DO_USUARIO_AUTH', 'admin@aceba.org.br');
```

7. Em Project Settings > API, copie:
- Project URL
- anon public key

8. Cole os valores em `js/supabase-client.js`:

```js
const SUPABASE_URL = "https://seu-projeto.supabase.co";
const SUPABASE_ANON_KEY = "sua-anon-key";
```

Não coloque `service_role_key` no frontend.

## Acessar o painel

Depois de configurar o Supabase:

```text
/admin/login.html
```

O painel permite gerenciar:

- Parceiros
- Projetos
- Galeria
- Transparência
- Configurações do site

Campos de configurações disponíveis:

- `phone`
- `whatsapp`
- `email`
- `instagram`
- `facebook`
- `pix_key`
- `address`

Use o WhatsApp no formato numérico com DDI, por exemplo `5571997364451`.

## Segurança

O schema ativa RLS em todas as tabelas.

- Tabelas públicas leem apenas registros `is_active = true`
- Usuários autenticados só escrevem se estiverem cadastrados em `admin_users`
- `site_settings` tem leitura pública porque contém dados institucionais exibidos no site
- A chave `anon` pode ficar no frontend; a chave `service_role` nunca deve ser publicada

## Storage

O `schema.sql` cria três buckets públicos:

- `logos`
- `gallery`
- `documents`

O painel usa campos de URL para imagens e documentos. Suba os arquivos no Storage do Supabase, copie a URL pública e cole no campo correspondente do admin.

## Como testar localmente

```bash
cd aceba-site-v2
python3 -m http.server 8000
```

Acesse:

```text
http://localhost:8000
http://localhost:8000/admin/login.html
```

Abrir `index.html` direto por `file://` pode funcionar para o site estático, mas o admin e os scripts do Supabase funcionam melhor via servidor local.

## Checklist antes de publicar

- [ ] Rodar `supabase/schema.sql` no projeto final
- [ ] Criar o usuário admin no Supabase Auth
- [ ] Inserir o usuário na tabela `admin_users`
- [ ] Colar `SUPABASE_URL` e `SUPABASE_ANON_KEY`
- [ ] Cadastrar parceiros reais
- [ ] Cadastrar fotos oficiais da galeria
- [ ] Cadastrar documentos de transparência quando estiverem prontos
- [ ] Revisar telefone, WhatsApp, e-mail, Instagram, chave Pix e endereço em Configurações
- [ ] Atualizar domínio final em canonical, Open Graph e imagens sociais
- [ ] Confirmar depoimentos reais e autorizações de uso
- [ ] Testar login, logout e bloqueio de acesso sem sessão
- [ ] Testar site público com Supabase configurado e sem Supabase configurado

## Observações

O formulário de contato envia a mensagem pelo WhatsApp oficial da ACEBA. Não há backend próprio para mensagens nesta fase.

O conteúdo público atual não foi removido. Ele permanece como base institucional e fallback para a integração dinâmica.
