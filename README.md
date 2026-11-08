# tralha.

> o canivete suíço da sua vida — um app pessoal, modular e seu.

| Módulo | O que faz |
|---|---|
| **Cadê?** | Cataloga onde cada coisa está guardada. Caixas dentro de caixas, sem limite: *Caixa preta grande → Bolsinha verde → Cabo USB-C 15 cm*. A busca mostra o caminho inteiro. |
| **Sites** | Favoritos por categoria, com busca, filtros e fixados no topo. |
| **Cofre** | Senhas com criptografia **no navegador** (PBKDF2 + AES-GCM 256). O servidor só guarda texto cifrado; a senha mestra nunca sai do seu aparelho. Gerador de senhas, cópia que se apaga em 30s, tranca sozinho após 5 min. |

Extras: tema claro/escuro, backup/importação em JSON, instalável no celular (PWA), layout pensado para celular.

---

## Rodar no seu computador

```bash
npm install
npm run dev
```

Abra o endereço que aparecer (ex.: `http://localhost:5173`). Sem configurar nada, o app roda em **modo local**: os dados ficam só naquele navegador. Ótimo pra testar.

---

## Publicar de graça e acessar de qualquer lugar

São duas peças gratuitas:

- **Supabase** (banco + login) → guarda seus dados na nuvem e sincroniza entre dispositivos.
- **GitHub Pages** (ou Netlify / Vercel / Cloudflare Pages) → hospeda o site.

### 1. Criar o banco no Supabase (≈ 5 min)

1. Crie uma conta em [supabase.com](https://supabase.com) e um projeto novo (plano Free).
2. Vá em **SQL Editor → New query**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique **Run**.
3. Vá em **Project Settings → API** e copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   (essa chave é pública por natureza; quem protege seus dados são as regras RLS do schema.)
4. Para testar local com a nuvem: copie `.env.example` para `.env`, preencha os dois valores e rode `npm run dev`.
5. Crie sua conta pelo painel: **Authentication → Users → Add user** (e-mail + senha, marque "Auto Confirm"). O app não tem botão de cadastro, de propósito.
6. **Importante:** em **Authentication → Sign In / Providers**, deixe **Allow new users to sign up** desligado. Assim ninguém mais consegue criar conta no seu app.

> No projeto Free, o Supabase pausa projetos sem nenhum acesso por 7 dias. Basta entrar no painel e clicar em "Restore" — os dados não se perdem. Usando o app com frequência, isso não acontece.

### 2. Publicar no GitHub Pages

1. Crie um repositório no GitHub (pode ser **privado** se tiver GitHub Pro; no Free, o Pages exige repositório público — o código não tem nenhum segredo, então tudo bem).
2. Envie o código:
   ```bash
   git add -A && git commit -m "tralha: primeira versão"
   git remote add origin https://github.com/samukadias/personal_app.git
   git push -u origin main
   ```
3. No repositório: **Settings → Secrets and variables → Actions → aba Variables** e crie `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. **Settings → Pages → Source: GitHub Actions**.
5. A cada `git push`, o workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) publica em `https://samukadias.github.io/personal_app/`.
6. No Supabase, em **Authentication → URL Configuration**, coloque essa URL em **Site URL** (para o link de confirmação de e-mail voltar ao lugar certo).

**Alternativa:** Netlify ou Vercel → "Import from Git", comando `npm run build`, pasta `dist`, e as duas variáveis de ambiente. O `netlify.toml` já está pronto.

### 3. No celular

Abra a URL e use "Adicionar à tela de início". Vira um ícone de app.

---

## Dia a dia: testar no PC, depois publicar

Duas versões, duas branches:

| | Branch | Onde roda | Dados |
|---|---|---|---|
| **Teste (PC)** | `homologacao` | `npm run dev` → `http://localhost:5173` (etiqueta vermelha "versão de teste") | modo local, só no navegador do PC — sem `.env` |
| **Pública** | `main` | `https://samukadias.github.io/personal_app/` | Supabase (nuvem) |

Como a versão do PC roda sem `.env`, os testes **nunca mexem nos dados reais**.

```bash
# 1. trabalhar e testar no PC
git switch homologacao
npm run dev
# ...mexe, testa, gostou:
git add -A && git commit -m "o que mudou"

# 2. mandar pra versão pública
git switch main
git merge homologacao
git push            # o GitHub Actions publica sozinho em ~1 min
git switch homologacao
```

> Quer testar no PC contra a nuvem também? Crie um **segundo** projeto Supabase (o plano Free permite 2), rode o mesmo `schema.sql` nele e coloque as chaves dele no `.env`. Nunca use as chaves do projeto de produção no `.env`.

---

## Segurança, em português claro

- **Login** (Supabase) protege o acesso aos seus registros. Cada linha do banco só é visível para o dono (Row Level Security).
- **Cofre** tem uma segunda camada: tudo é cifrado no navegador com a senha mestra antes de ir para a nuvem. Nem o Supabase, nem quem tiver acesso ao banco, consegue ler suas senhas.
- **Esqueceu a senha mestra = perdeu o cofre.** Não existe recuperação, de propósito.
- Faça um **backup** de vez em quando em *Ajustes → Baixar backup* (as senhas continuam cifradas no arquivo).

---

## Criar um módulo novo

Toda informação é salva como um registro genérico `{ id, kind, data }` — módulo novo **não precisa mexer no banco**.

1. Crie `src/modules/livros/Livros.tsx`:
   ```tsx
   import { useCollection } from '../../lib/useCollection'

   type Livro = { titulo: string; lido: boolean }

   export default function Livros() {
     const { items, save, remove } = useCollection<Livro>('livro')
     // ...sua tela aqui. Reaproveite Button, Modal, Field, Empty de components/ui
   }
   ```
2. Registre em [`src/modules/registry.tsx`](src/modules/registry.tsx):
   ```tsx
   { id: 'livros', name: 'Livros', tagline: 'a pilha da cabeceira', color: 'var(--pink)', icon: <IconBox />, kind: 'livro', component: Livros },
   ```
3. Pronto: aparece no menu, na Home (com contador) e entra no backup.

Ideias: contas a pagar, garantias e notas fiscais, plantas (rega), livros/filmes, receitas, manutenção do carro, empréstimos ("emprestei a furadeira pro fulano").

---

## Estrutura

```
src/
  lib/            dados (store.ts), cache/hook (useCollection.ts), cripto, rotas, auth, tema
  components/     ícones desenhados à mão + UI (botão, modal, toasts…)
  modules/        um diretório por módulo + registry.tsx
  pages/          Início, Login, Ajustes
  styles.css      todo o visual (tokens no topo)
supabase/schema.sql
```

Stack: React 18 + TypeScript + Vite. Sem framework de CSS. Rotas com `#` para funcionar em qualquer hospedagem estática.
