# 🍽️ Summer Meal v2

>  [English](#english) ·  [Català](#català)

---

<a name="english"></a>
## 🇬🇧 English

A modern web application to manage and vote on daily summer meals within teams and organisations.

### 📋 Description

Summer Meal v2 is a Next.js 15 app that helps teams coordinate their daily lunches and dinners during the summer period. Users vote for their dietary preferences for the next day, view real-time results and browse the weekly menu.

### ✨ Features

#### 🗳️ Voting System
- **Daily voting**: Users vote for the next day's meals (deadline: 10:00 AM)
- **Multiple options**: Omnivore, Vegetarian, Vegan, Bring my own food, Won't come
- **Lunch & dinner**: Independent voting for both meals
- **Swipe gesture**: Slide left/right to switch between lunch and dinner
- **Vote editing**: Change your vote before the deadline
- **Vote on behalf**: Admins can vote for other team members

#### 📊 Results
- **Real-time dashboard**: Instant view of all votes
- **Date filtering**: Browse historical results
- **Summary counters**: Omnivores, vegetarians, vegans and bring-own totals
- **Name list**: See who voted for each option

#### 👨‍💼 Admin Panel
- **User management**: Invite new members via magic link, edit and delete
- **Menu configuration**: Create and edit dishes per day of the week
- **Results-first**: Admin panel opens directly on the results tab
- **Kitchen summary**: Ready-to-share text summary for the kitchen team

#### 🎨 User Experience
- **Custom avatars**: Each user has their own profile picture with automatic fallback
- **Slide animation**: Smooth transition when switching between meals
- **Magic Link auth**: Passwordless secure login via email
- **Responsive design**: Works perfectly on mobile, tablet and desktop

### 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js 15](https://nextjs.org/) | React framework (App Router) |
| [React 19](https://react.dev/) | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Static typing |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS |
| [Supabase](https://supabase.com/) | PostgreSQL database + Auth |
| [Lucide React](https://lucide.dev/) | Icon library |
| [Turbopack](https://turbo.build/pack) | Dev bundler |

### 🚀 Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/mcallejo-10/summer-meal-v2.git
cd summer-meal-v2

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 🗂️ Project Structure

```
summer-meal-v2/
├── src/
│   ├── app/
│   │   ├── admin/           # Admin panel
│   │   ├── api/avatar/      # Avatar API route with fallback
│   │   ├── auth/callback/   # Magic link auth callback
│   │   ├── login/           # Login page
│   │   ├── menus/           # Weekly menu viewer
│   │   ├── resultats/       # Results page
│   │   ├── votar/           # Voting page
│   │   └── page.tsx         # Home page
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client & helpers (browser)
│   │   ├── supabase-server.ts # Supabase SSR client
│   │   └── dates.ts         # Date & timezone helpers
│   └── middleware.ts        # Route protection (/admin)
├── public/
│   ├── avatars/             # User profile pictures
│   └── menu-personal-2026.png
└── package.json
```

### 👩‍💻 Author

**Miranda Callejo** — [@mcallejo-10](https://github.com/mcallejo-10)

---

<a name="català"></a>
## Català

Aplicació web per gestionar i votar els àpats diaris d'estiu en equips i organitzacions.

## 📋 Descripció

Summer Meal v2 és una aplicació desenvolupada amb Next.js 15 que permet als equips organitzar-se per als àpats diaris durant el període d'estiu. Els usuaris poden votar les seves preferències alimentàries per a l'endemà, veure resultats en temps real i consultar els menús disponibles.

## ✨ Funcionalitats

### 🗳️ Sistema de Votació
- **Votació diària**: Els usuaris voten per als àpats del dia següent (fins les 10:00h)
- **Múltiples opcions**: Omnívora, Vegetariana, Vegana, Porto el meu menjar, No vindré
- **Dinar i sopar**: Gestió separada dels dos àpats
- **Swipe gestual**: Canvi entre dinar i sopar lliscant la pantalla
- **Edició de vots**: Possibilitat de modificar l'elecció fins al límit horari
- **Votar per altri**: Els administradors poden votar en nom de companys

### 📊 Resultats
- **Dashboard en temps real**: Visualització instantània de tots els vots
- **Filtrat per data**: Consulta de resultats històrics
- **Resum per tipus d'àpat**: Comptadors per omnívors, vegetarians, vegans i porto menjar
- **Llista nominal**: Qui ha votat cada opció

### 👨‍💼 Panel d'Administració
- **Gestió d'usuaris**: Convidar nous membres via magic link, editar i eliminar
- **Configuració de menús**: Crear i editar plats per dia de la setmana
- **Resultats per defecte**: El panel obre directament a la pestanya de resultats
- **Resum de votacions**: Text preparat per compartir amb cuina

### 🎨 Experiència d'Usuari
- **Avatars personalitzats**: Cada usuari té la seva pròpia imatge de perfil amb fallback automàtic
- **Animació de slide**: Transició visual en canviar entre dinar i sopar
- **Autenticació Magic Link**: Login segur sense contrasenya via email
- **Disseny responsive**: Funciona perfectament en mòbils, tauletes i escriptori

## 🛠️ Tecnologies

- **[Next.js 15](https://nextjs.org/)** - Framework React amb App Router
- **[React 19](https://react.dev/)** - Biblioteca d'interfície d'usuari
- **[TypeScript](https://www.typescriptlang.org/)** - Tipatge estàtic
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Framework CSS utilitari
- **[Supabase](https://supabase.com/)** - Backend com a servei (BaaS) amb PostgreSQL + Auth
- **[Lucide React](https://lucide.dev/)** - Icones modernes
- **[Turbopack](https://turbo.build/pack)** - Bundler ultraràpid per a desenvolupament

## 🚀 Instal·lació i Configuració

### Prerequisits

- Node.js 18.0 o superior
- npm, yarn, pnpm o bun
- Compte a Supabase

### Configuració del Projecte

1. **Clona el repositori**
   ```bash
   git clone https://github.com/mcallejo-10/summer-meal-v2.git
   cd summer-meal-v2
   ```

2. **Instal·la les dependències**
   ```bash
   npm install
   ```

3. **Configura les variables d'entorn**
   
   Crea un fitxer `.env.local` a l'arrel del projecte:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=la_teva_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=la_teva_supabase_anon_key
   ```

4. **Configura la base de dades**
   
   Al teu projecte de Supabase, executa:

   ```sql
   -- Taula d'usuaris
   CREATE TABLE users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     email TEXT UNIQUE,
     is_admin BOOLEAN DEFAULT false,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
   );

   -- Taula de menús
   CREATE TABLE menus (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     day TEXT NOT NULL,
     meal_type TEXT NOT NULL CHECK (meal_type IN ('dinar', 'sopar')),
     dish_name TEXT NOT NULL,
     diet_type TEXT NOT NULL CHECK (diet_type IN ('omnivora', 'vegetariana', 'vegana')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
   );

   -- Taula de vots
   CREATE TABLE votes (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     voted_by UUID REFERENCES users(id),
     date DATE NOT NULL,
     choice TEXT NOT NULL CHECK (choice IN ('omnivora', 'vegetariana', 'vegana', 'porto_el_meu_menjar', 'no_vindré')),
     meal_type TEXT NOT NULL CHECK (meal_type IN ('dinar', 'sopar')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
     UNIQUE(user_id, date, meal_type)
   );
   ```

5. **Inicia el servidor de desenvolupament**
   ```bash
   npm run dev
   ```

6. **Obre l'aplicació**
   
   Navega a [http://localhost:3000](http://localhost:3000).

## 📱 Ús de l'Aplicació

### Per a Usuaris

1. **Accés**: Entra amb el magic link rebut per email
2. **Votació**: Tria dinar o sopar (o llisca per canviar), revisa les opcions de menú
3. **Selecció**: Vota la teva preferència alimentària per a l'endemà
4. **Confirmació**: Confirma el teu vot registrat
5. **Modificació**: Pots canviar el vot fins les 10:00h del dia

### Per a Administradors

1. **Gestió d'usuaris**: Convida nous membres de l'equip via email
2. **Configuració de menús**: Defineix els plats disponibles per dia
3. **Seguiment**: Supervisa els vots en temps real
4. **Resum**: Genera textos de resum per a la cuina

## 🗂️ Estructura del Projecte

```
summer-meal-v2/
├── src/
│   ├── app/
│   │   ├── admin/           # Panel d'administració
│   │   ├── api/avatar/      # API route per servir avatars amb fallback
│   │   ├── auth/callback/   # Callback d'autenticació magic link
│   │   ├── login/           # Pàgina de login
│   │   ├── menus/           # Visualització de menús setmanals
│   │   ├── resultats/       # Pàgina de resultats
│   │   ├── votar/           # Pàgina de votació
│   │   └── page.tsx         # Pàgina principal
│   ├── lib/
│   │   ├── supabase.ts      # Client i funcions de Supabase (browser)
│   │   ├── supabase-server.ts # Client Supabase SSR
│   │   └── dates.ts         # Helpers de dates i timezone
│   └── middleware.ts        # Protecció de rutes /admin
├── public/
│   ├── avatars/             # Imatges de perfil d'usuaris
│   └── menu-personal-2026.png  # Imatge del menú complet
├── README.md
└── package.json
```

## 🔧 Scripts

- `npm run dev` - Inicia el servidor de desenvolupament amb Turbopack
- `npm run build` - Construeix l'aplicació per a producció
- `npm run start` - Inicia el servidor de producció
- `npm run lint` - Executa el linter de codi

##  Autora

**Miranda Callejo** - [@mcallejo-10](https://github.com/mcallejo-10)

---

⭐ Fet amb ❤️ per a l'A-team
