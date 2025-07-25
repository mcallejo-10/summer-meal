# 🍽️ Summer Meal v2

Una aplicación web moderna para gestionar y votar las comidas diarias de verano en equipos y organizaciones.

## 📋 Descripción

Summer Meal v2 es una aplicación desarrollada con Next.js 15 que permite a los equipos organizarse para las comidas diarias durante el período de verano. Los usuarios pueden votar por sus preferencias alimentarias para el día siguiente, ver resultados en tiempo real y gestionar menús disponibles.

## ✨ Características Principales

### 🗳️ Sistema de Votación
- **Votación diaria**: Los usuarios votan para las comidas del día siguiente
- **Múltiples opciones**: Omnívora, Vegetariana, Vegana, Traer comida propia, No venir
- **Soporte para dinar y sopar**: Gestión separada de comidas de mediodía y cena
- **Edición de votos**: Posibilidad de modificar la elección hasta la fecha límite
- **Timezone-safe**: Sistema robusto de manejo de fechas que evita problemas de zona horaria

### 📊 Visualización de Resultados
- **Dashboard en tiempo real**: Visualización instantánea de todos los votos
- **Filtrado por fecha**: Consulta de resultados históricos
- **Estadísticas por tipo de comida**: Conteo automático por cada opción
- **Interfaz responsiva**: Adaptada para dispositivos móviles y desktop

### 👨‍💼 Panel de Administración
- **Gestión de usuarios**: Añadir, editar y eliminar usuarios del sistema
- **Configuración de menús**: Crear menús específicos por día de la semana
- **Roles de administrador**: Control de acceso y permisos
- **Generación de resúmenes**: Exportación de datos para planificación

### 🎨 Experiencia de Usuario
- **Avatares personalizados**: Cada usuario tiene su propia imagen de perfil
- **Interfaz intuitiva**: Diseño limpio y fácil de usar
- **Feedback visual**: Confirmaciones y estados de carga claros
- **Responsive design**: Funciona perfectamente en móviles, tablets y escritorio

## 🛠️ Tecnologías Utilizadas

- **[Next.js 15](https://nextjs.org/)** - Framework React con App Router
- **[React 19](https://react.dev/)** - Biblioteca de interfaz de usuario
- **[TypeScript](https://www.typescriptlang.org/)** - Tipado estático
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework de CSS utilitario
- **[Supabase](https://supabase.com/)** - Backend como servicio (BaaS) con PostgreSQL
- **[Lucide React](https://lucide.dev/)** - Iconos modernos
- **[Turbopack](https://turbo.build/pack)** - Bundler ultrarrápido para desarrollo

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18.0 o superior
- npm, yarn, pnpm o bun
- Cuenta en Supabase

### Configuración del Proyecto

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/mcallejo-10/summer-meal-v2.git
   cd summer-meal-v2
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   # o
   yarn install
   # o
   pnpm install
   # o
   bun install
   ```

3. **Configura las variables de entorno**
   
   Crea un archivo `.env.local` en la raíz del proyecto:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

4. **Configura la base de datos**
   
   En tu proyecto de Supabase, ejecuta las siguientes tablas:

   ```sql
   -- Tabla de usuarios
   CREATE TABLE users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     email TEXT UNIQUE,
     is_admin BOOLEAN DEFAULT false,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
   );

   -- Tabla de menús
   CREATE TABLE menus (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     day TEXT NOT NULL,
     meal_type TEXT NOT NULL CHECK (meal_type IN ('dinar', 'sopar')),
     dish_name TEXT NOT NULL,
     diet_type TEXT NOT NULL CHECK (diet_type IN ('omnivora', 'vegetariana', 'vegana')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
   );

   -- Tabla de votos
   CREATE TABLE votes (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     date DATE NOT NULL,
     choice TEXT NOT NULL CHECK (choice IN ('omnivora', 'vegetariana', 'vegana', 'porto_el_meu_menjar', 'no_vindré')),
     meal_type TEXT NOT NULL CHECK (meal_type IN ('dinar', 'sopar')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
     UNIQUE(user_id, date, meal_type)
   );
   ```

5. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   # o
   yarn dev
   # o
   pnpm dev
   # o
   bun dev
   ```

6. **Abre la aplicación**
   
   Navega a [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📱 Uso de la Aplicación

### Para Usuarios Regulares

1. **Acceso**: Entra en la aplicación y selecciona tu nombre de usuario
2. **Votación**: Elige entre dinar o sopar, revisa las opciones del menú disponible
3. **Selección**: Vota por tu preferencia alimentaria para el día siguiente
4. **Confirmación**: Recibe confirmación de tu voto registrado
5. **Modificación**: Puedes cambiar tu voto hasta el momento establecido

### Para Administradores

1. **Gestión de usuarios**: Añade nuevos miembros del equipo
2. **Configuración de menús**: Define los platos disponibles por día
3. **Monitoreo**: Supervisa los votos en tiempo real
4. **Reportes**: Genera resúmenes para planificación de compras

## 🗂️ Estructura del Proyecto

```
summer-meal-v2/
├── src/
│   ├── app/                 # App Router de Next.js
│   │   ├── admin/          # Panel de administración
│   │   ├── resultats/      # Página de resultados
│   │   ├── votar/          # Página de votación
│   │   ├── menus/          # Gestión de menús
│   │   └── page.tsx        # Página principal
│   ├── lib/
│   │   └── supabase.ts     # Cliente y funciones de Supabase
│   └── components/         # Componentes reutilizables
├── public/
│   └── avatars/           # Imágenes de perfil de usuarios
├── README.md
└── package.json
```

## 🔧 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo con Turbopack
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter de código

## 🤝 Contribución

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autor

**Miranda Callejo** - [@mcallejo-10](https://github.com/mcallejo-10)

## 🙏 Agradecimientos

- Al equipo de Next.js por el increíble framework
- A Supabase por proporcionar una excelente plataforma BaaS
- A la comunidad de desarrolladores por las herramientas open source

---

⭐ Si este proyecto te resulta útil, ¡no olvides darle una estrella en GitHub!
