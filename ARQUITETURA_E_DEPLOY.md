# Arquitetura, Banco de Dados & Guia de Deploy Gratuito

Este documento apresenta a especificação técnica detalhada do **Espaço**: o funcionamento do banco de dados, o ciclo de vida e comunicação entre Frontend e Backend, e um guia completo de servidores e serviços 100% gratuitos para colocar a aplicação no ar para uso pessoal ou de um pequeno grupo.

---

## 🏛️ 1. Como Funciona a Aplicação Inteira

A aplicação utiliza uma arquitetura **Full-Stack moderna em TypeScript**, projetada para ser leve, ágil, altamente segura e compatível com navegadores móveis e desktop.

```
┌─────────────────────────────────────────────────────────────────┐
│                       CLIENTE (FRONTEND)                        │
│                                                                 │
│   React 19 SPA + TypeScript + Tailwind CSS v4 + Lucide Icons    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                 Provedores de Contexto                  │   │
│   │   • AuthProvider (Sessão, PIN de 4 dígitos, Tema)        │   │
│   │   • DataProvider (Check-ins, Sono, Impulsos, Diário...) │   │
│   └────────────────────────────┬────────────────────────────┘   │
│                                │                                │
│                     Armazenamento Local                         │
│                    (Local-First Storage)                        │
│                                │                                │
└────────────────────────────────┼────────────────────────────────┘
                                 │ Requisições HTTP
                                 │ (ex: /api/meditacao)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVIDOR (BACKEND)                        │
│                                                                 │
│   Node.js + Express + TypeScript (server.ts)                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                     Middlewares                         │   │
│   │   • Vite Dev Server (em ambiente de desenvolvimento)     │   │
│   │   • Servidor de Arquivos Estáticos dist/ (em produção)  │   │
│   └────────────────────────────┬────────────────────────────┘   │
│                                │                                │
│   ┌────────────────────────────┴────────────────────────────┐   │
│   │             Endpoint: GET /api/meditacao                │   │
│   │   1. Verifica Cache em Memória (TTL 30 min)             │   │
│   │   2. Se expirado: Web Scraper oficial na.org.br         │   │
│   │   3. Parser regex do Título, Citação, Texto e "Só p/ hj"│   │
│   │   4. Fallback resiliente caso o site esteja instável    │   │
│   └────────────────────────────┬────────────────────────────┘   │
└────────────────────────────────┼────────────────────────────────┘
                                 │ HTTPS Fetch diário
                                 ▼
         ┌───────────────────────────────────────────────┐
         │ Narcóticos Anônimos Brasil (na.org.br)        │
         │ https://www.na.org.br/meditacao/              │
         └───────────────────────────────────────────────┘
```

### 1.1 O Frontend (Cliente)
- **Framework & Ferramentas:** React 19 com TypeScript, gerenciado pelo Vite 8.
- **Camada Reativa de Estado:**
  - `AuthProvider`: Responsável por manter o estado do usuário logado (perfil local ou anônimo), controle de onboarding, preferências visuais (modo escuro/claro), módulos ativos e o estado do **bloqueio por PIN** de 4 dígitos.
  - `DataProvider`: Mantém em memória e sincroniza os registros de humor (`checkIns`), sono (`sleepEntries`), impulsos (`behaviorEntries`), anotações do diário (`journalEntries`) e períodos de recuperação (`recoveryPeriods`).
- **Comunicação entre Módulos:**
  - Quando o usuário lê a Meditação Diária de NA na aba de Jornada e clica em **"Refletir sobre isso no Diário"**, a aplicação realiza uma transição suave de rota para a aba `diario`, abrindo o modal de escrita com a tag `'reflexao'` e a citação do dia já formatadas.
- **Acessibilidade & Design Visual:**
  - Segue uma paleta calma baseada em tons de pedra natural (`stone-50` / `stone-900`) e toques de sálvia/esmeralda.
  - Todos os alvos de clique e toque respeitam o tamanho mínimo de **48x48px**.
  - Informações de humor e intensidade nunca utilizam apenas cores para expressar significado: sempre acompanham rótulos textuais claros e ícones representativos.

### 1.2 O Backend (Servidor)
- **Arquivo de entrada:** `server.ts` executado com `tsx` ou `node`.
- **Roteador Express:**
  - Em desenvolvimento: monta o middleware do Vite (`vite.middlewares`), garantindo que tanto a API quanto o frontend rodem na mesma porta (`3000`), eliminando problemas de CORS.
  - Em produção: entrega a compilação otimizada da pasta `dist/` e gerencia as rotas de API.
- **Endpoint Inteligente `/api/meditacao`:**
  - Faz a coleta diária e amigável da página de meditação de Narcóticos Anônimos (`https://www.na.org.br/meditacao/`).
  - **Cache em memória:** Armazena o resultado por 30 minutos ou durante o dia corrente. Isso evita sobrecarregar o portal do NA com requisições repetidas e garante respostas em menos de 10 milissegundos para o usuário.
  - **Parser estruturado:** Extrai cirurgicamente:
    - *Data do dia* (ex.: "6 de novembro")
    - *Título* (ex.: "Entendendo a humildade")
    - *Citação* (ex.: "A humildade resulta de sermos mais honestos conosco.")
    - *Fonte* (ex.: "Texto Básico, p. 40")
    - *Parágrafos de reflexão*
    - *Pensamento "Só por hoje"*
  - **Mecanismo de Fallback:** Se porventura o servidor de NA estiver em manutenção ou fora do ar, o backend retorna instantaneamente uma meditação edificante de reserva, evitando que o usuário encontre telas em branco ou erros.

---

## 🗄️ 2. Como Funciona o Banco de Dados

O aplicativo adota o paradigma **Local-First por padrão** (privacidade e autonomia absolutas), mas foi desenhado com um modelo de dados relacional que pode ser facilmente plugado em bancos como **Supabase** ou **PostgreSQL**.

### 2.1 Modelo Local-First (Como está implementado agora)
No modelo atual, a persistência é gerenciada pelo serviço `src/services/storage.ts`:
1. **Armazenamento no Navegador:** Os dados residem exclusivamente no armazenamento do dispositivo (`localStorage`), serializados em estruturas JSON tipadas.
2. **Isolamento Total:** Nenhum registro de humor, sono, diário íntimo ou recaída trafega pela rede ou fica armazenado em servidores externos de terceiros.
3. **Exportação & Portabilidade:** O usuário tem controle total dos dados através dos botões de exportação em formato aberto (**JSON completo** e **CSV de check-ins**).
4. **Exclusão Completa:** O usuário pode a qualquer momento clicar em *"Apagar todos os dados deste dispositivo"*, realizando um expurgo irreversível de todas as chaves.

---

### 2.2 Modelagem de Dados Relacional (Para Supabase / PostgreSQL)

Caso você queira sincronizar seus dados entre o celular, tablet e computador via internet com uma conta própria, o banco de dados relacional deve seguir rigorosamente a estrutura abaixo:

```
┌─────────────────┐       ┌──────────────────────┐
│    profiles     │──────<│   user_preferences   │
└────────┬────────┘       └──────────────────────┘
         │
         ├───────────────<┌──────────────────────┐
         │                │      check_ins       │
         │                └──────────────────────┘
         │
         ├───────────────<┌──────────────────────┐
         │                │    sleep_entries     │
         │                └──────────────────────┘
         │
         ├───────────────<┌──────────────────────┐
         │                │ behavior_categories  │
         │                └──────────┬───────────┘
         │                           │
         │                           └─────────<┌────────────────────┐
         ├─────────────────────────────────────<│  behavior_entries  │
         │                                      └────────────────────┘
         │
         ├───────────────<┌──────────────────────┐
         │                │   journal_entries    │
         │                └──────────────────────┘
         │
         └───────────────<┌──────────────────────┐
                          │   recovery_periods   │
                          └──────────────────────┘
```

#### Script SQL Completo (PostgreSQL com Row Level Security)
Copie e cole este script no painel SQL do **Supabase** ou em qualquer instância PostgreSQL:

```sql
-- Extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PERFIS DE USUÁRIO
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. PREFERÊNCIAS DO USUÁRIO
CREATE TABLE public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    timezone TEXT DEFAULT 'America/Sao_Paulo' NOT NULL,
    active_modules JSONB DEFAULT '{"mood": true, "sleep": true, "behaviors": true, "journal": true, "recovery": true}'::jsonb NOT NULL,
    notifications_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    notification_time TEXT DEFAULT '20:00',
    pin_code TEXT,
    privacy_blur_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    theme TEXT DEFAULT 'light' NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. CHECK-INS DE HUMOR, ENERGIA E EMOÇÕES
CREATE TABLE public.check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    mood SMALLINT NOT NULL CHECK (mood >= 1 AND mood <= 5),
    energy SMALLINT CHECK (energy >= 1 AND energy <= 5),
    anxiety SMALLINT CHECK (anxiety >= 1 AND anxiety <= 5),
    emotions TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (user_id, date)
);

-- 4. REGISTROS DE SONO
CREATE TABLE public.sleep_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
    perceived_quality SMALLINT NOT NULL CHECK (perceived_quality >= 1 AND perceived_quality <= 5),
    bedtime TEXT,
    wake_time TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (user_id, date)
);

-- 5. CATEGORIAS DE IMPULSOS
CREATE TABLE public.behavior_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_custom BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. REGISTROS DE IMPULSOS E COMPORTAMENTOS
CREATE TABLE public.behavior_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.behavior_categories(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    urge_intensity SMALLINT NOT NULL CHECK (urge_intensity >= 0 AND urge_intensity <= 10),
    behavior_occurrence TEXT NOT NULL CHECK (behavior_occurrence IN ('nao_ocorreu', 'uma_vez', 'repetidamente', 'prefiro_nao_informar')),
    perceived_control TEXT NOT NULL CHECK (perceived_control IN ('controle', 'alguma_dificuldade', 'perda_controle', 'nao_sei_avaliar')),
    triggers TEXT,
    consequences TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. DIÁRIO PESSOAL
CREATE TABLE public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    tag TEXT DEFAULT 'livre' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. JORNADA DE RECUPERAÇÃO (MÚLTIPLOS PERÍODOS HISTÓRICOS PRESERVADOS)
CREATE TABLE public.recovery_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    label TEXT DEFAULT 'Minha jornada' NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. TERMO DE CONSENTIMENTO ÉTICO E PRIVACIDADE
CREATE TABLE public.consent_records (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    accepted_terms BOOLEAN NOT NULL,
    accepted_privacy BOOLEAN NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- SEGURANÇA MÁXIMA: ROW LEVEL SECURITY (RLS)
-- Garante que NENHUM usuário acesse dados de outro, mesmo que tente via API.
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: O usuário só pode ver e alterar os registros onde user_id = auth.uid()
CREATE POLICY "Acesso apenas ao próprio perfil" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Acesso apenas às próprias preferências" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Acesso apenas aos próprios check-ins" ON public.check_ins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Acesso apenas ao próprio sono" ON public.sleep_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Acesso apenas às próprias categorias" ON public.behavior_categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Acesso apenas aos próprios impulsos" ON public.behavior_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Acesso apenas ao próprio diário" ON public.journal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Acesso apenas aos próprios períodos de recuperação" ON public.recovery_periods FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Acesso apenas ao próprio consentimento" ON public.consent_records FOR ALL USING (auth.uid() = user_id);
```

---

## ☁️ 3. Opções de Servidores Gratuitos (Uso Pessoal ou Pequeno Grupo)

Você pode colocar este aplicativo no ar **com custo zero real** (sem pegadinhas de cartão de crédito expirando em 30 dias). Abaixo estão as melhores arquiteturas gratuitas disponíveis no mercado:

### 🌟 Recomendação 1: Tudo em Um no Render.com (Mais Simples)
O **Render** é atualmente a plataforma mais amigável para hospedar aplicações Node.js full-stack com Express e Vite.

| Recurso | Detalhes no Plano Gratuito |
| :--- | :--- |
| **Tipo de Serviço** | Web Service (Node.js) |
| **Limite Gratuito** | 750 horas/mês (suficiente para manter 1 app online 24/7) |
| **SSL / HTTPS** | Automático e gratuito |
| **Domínio** | Seu-app.onrender.com (ou domínio próprio grátis) |
| **Comportamento** | Entra em modo de repouso após 15 min de inatividade e acorda em cerca de 30-40 segundos no primeiro acesso |

#### Como fazer deploy no Render em 5 minutos:
1. Suba o código do projeto para um repositório seu no **GitHub** (público ou privado).
2. Acesse [render.com](https://render.com) e crie sua conta gratuita com o GitHub.
3. Clique em **New +** > **Web Service**.
4. Conecte o repositório do seu projeto.
5. Preencha as configurações:
   - **Name:** `espaco-app`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** `Free`
6. Clique em **Create Web Service**. Pronto! O Render compilará o front e o back e fornecerá uma URL pública HTTPS.

---

### 🌟 Recomendação 2: Vercel / Netlify + Supabase (Sem Lentidão ao Acordar)
Se você não quiser esperar os 30 segundos de "cold start" do Render:
- **Frontend + API:** Hospedado na **Vercel** ou **Netlify** (plano gratuito ilimitado para uso pessoal, deploy com 1 clique a partir do GitHub, resposta global instantânea em CDN sem nunca "dormir").
- **Banco de Dados & Autenticação:** **Supabase** (plano gratuito com 500MB de PostgreSQL, autenticação completa e backups).

---

### 🗃️ Tabela Comparativa de Bancos de Dados Gratuitos em Nuvem

| Provedor | Tipo | Limite Gratuito Permanente | Ideal Para |
| :--- | :--- | :--- | :--- |
| **Local-First (Atual)** | Navegador (`localStorage`) | **Ilimitado** (dentro do dispositivo) | Uso estritamente individual no próprio celular/PC. Privacidade 100%. |
| **Supabase** | PostgreSQL + Auth | **500 MB** de banco + 50.000 usuários ativos/mês | Sincronizar entre celular e PC, autenticação com e-mail/senha. |
| **Neon.tech** | Serverless Postgres | **0.5 GB** de armazenamento + branch de banco | Desenvolvedores que querem Postgres puro e rápido. |
| **Turso** | libSQL / SQLite na nuvem | **9 GB** de armazenamento + 1 bilhão de leituras/mês | Projetos com volume de leitura alto e latência baixíssima. |

---

## 🔒 4. Resumo de Segurança & Boas Práticas

1. **Variáveis de Ambiente:** Nunca envie chaves sensíveis para o GitHub. Use o arquivo `.env` local e configure as variáveis no painel da plataforma de hospedagem.
2. **Backups Periódicos:** Como o aplicativo possui uma função nativa de **Exportar Tudo (JSON)** na aba de Perfil, faça o download do seu backup regularmente para garantir a custódia total dos seus registros.
3. **Bloqueio por PIN:** Caso compartilhe o computador ou celular com outras pessoas, ative o PIN de 4 dígitos na aba de Perfil para evitar que curiosos vejam seu diário ou impulsos.
