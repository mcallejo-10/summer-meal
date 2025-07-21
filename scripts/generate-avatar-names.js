// Script para generar nombres de archivos de avatar
// Ejecuta: node scripts/generate-avatar-names.js

const normalizeUserName = (name) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^a-z0-9\s]/g, "") // Quitar caracteres especiales
    .replace(/\s+/g, "-") // Espacios por guiones
    .trim();
};

// Ejemplos de nombres (reemplaza con tus usuarios reales)
const userNames = [
  "Marc",
  "Jordi",
  "Alba",
  "Marianela",
  "Selene",
  "Júlia",
  "Mónica",
  "Marta",
  "Mario",
  "Toni",
  "Juan",
  "Cathe",
  "Gisela",
  "Debbie",
  "Cristina",
  "Jorge",
  "Mina",
  "Meritxell"
];

console.log("=== NOMBRES DE ARCHIVOS DE AVATAR ===\n");
console.log("Coloca las imágenes en public/avatars/ con estos nombres:\n");

userNames.forEach(name => {
  const normalizedName = normalizeUserName(name);
  console.log(`${name} → ${normalizedName}.jpg`);
});

console.log(`\nImagen por defecto: default.jpg`);
console.log("\n=== INSTRUCCIONES ===");
console.log("1. Guarda las fotos como archivos .jpg");
console.log("2. Recomendado: 64x64 píxeles mínimo");
console.log("3. Peso: máximo 50KB por imagen");
console.log("4. Si no tienes foto de alguien, se usará default.jpg");
