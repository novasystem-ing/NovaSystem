/*
  build.js
  ---------------------------------------------------------------------------
  Genera todo el sitio estático (HTML) a partir de:
    - data/config.json     (nombre del negocio, teléfono, dominio, etc.)
    - data/productos.json  (catálogo de modelos)

  Uso:  node scripts/build.js   (o:  npm run build)

  La tienda se organiza por MARCA (brand): cada marca es una sección con su
  propia URL (/tienda/challenger/), y cada modelo es su propia página
  (/tienda/challenger/uhd-55kg85-bt-google-t2/) con su propio título,
  descripción y datos estructurados (schema.org/Product). Eso es lo que
  permite que Google indexe cada modelo por separado.

  El campo "categoria" del producto (Google TV / Android TV) se conserva
  como una etiqueta de "sistema" dentro de cada tarjeta y ficha de producto,
  útil cuando una misma marca vende modelos con distintos sistemas.

  NO edites los archivos HTML generados a mano: se sobrescriben cada vez que
  corres este script (de hecho, el script borra la carpeta /tienda antes de
  regenerarla, para no dejar páginas viejas huérfanas). Para cambiar
  contenido, edita este archivo (diseño/estructura) o data/productos.json y
  data/config.json (contenido).
---------------------------------------------------------------------------
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/config.json'), 'utf8'));
const productosRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/productos.json'), 'utf8'));

/* ============================================================
   UTILIDADES
============================================================ */
function slugify(text){
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function esc(str){
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ensureDir(dir){
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(relativePath, content){
  const fullPath = path.join(ROOT, relativePath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('  ->', relativePath);
}

function removeIfExists(relativePath){
  const fullPath = path.join(ROOT, relativePath);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
}

// Paleta cíclica para los "swatches" de marca
const PALETTE = ['#12306b', '#0f2555', '#1656C9', '#173a7a', '#0d1f47', '#144a8f', '#0b2d63', '#1c56b0'];
function colorFor(index){ return PALETTE[index % PALETTE.length]; }

/* ============================================================
   CARGA Y NORMALIZACIÓN DE PRODUCTOS
============================================================ */
const productos = Object.keys(productosRaw)
  .filter((key) => !key.startsWith('_')) // ignora claves de comentario como "_comentario"
  .map((key) => {
    const p = productosRaw[key];
    const marca = p.brand || p.marca || 'Genérico';
    return {
      modelo: p.modelo || key,
      slug: slugify(p.modelo || key),
      marca,
      marcaSlug: slugify(marca),
      sistema: p.categoria || '', // Google TV / Android TV / lo que sea, es informativo
      software: p.software || '',
      main: p.main || '',
      estado: p.estado || 'Disponible',
      precio: p.precio || '',
      valor: Number(p.valor) || 0,
      pdf: p.pdf || ''
    };
  });

// Agrupar por marca, preservando el orden de primera aparición
const marcasMap = new Map();
productos.forEach((p) => {
  if(!marcasMap.has(p.marcaSlug)){
    marcasMap.set(p.marcaSlug, { nombre: p.marca, slug: p.marcaSlug, productos: [] });
  }
  marcasMap.get(p.marcaSlug).productos.push(p);
});
const marcas = Array.from(marcasMap.values());

console.log(`Cargados ${productos.length} productos en ${marcas.length} marcas.`);

/* ============================================================
   ICONOS SVG REUTILIZABLES (inline, sin dependencias externas)
============================================================ */
const ICON_TV = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
const ICON_CHEVRON_RIGHT = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>';
const ICON_CHECK = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>';
const ICON_WHATSAPP = '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.6.1-.2.3-.7.9-.9 1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.5-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5s-.6-1.5-.8-2c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z"/><path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.8-1.5C8.4 21.5 10.2 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.6 0-3.2-.4-4.5-1.2l-.3-.2-3.2 1 1-3.2-.2-.3C4 14.9 3.6 13.5 3.6 12c0-4.6 3.8-8.4 8.4-8.4s8.4 3.8 8.4 8.4-3.8 8.4-8.4 8.4z"/></svg>';

/* ============================================================
   LOGO: usamos la imagen real en fondos claros (header) y el
   icono SVG en fondos oscuros (footer), porque el PNG tiene
   fondo blanco sólido y se vería mal sobre el navy del footer.
============================================================ */
const LOGO_IMG = '<img src="/assets/images/NOVA_LG.png" alt="' + esc(config.nombreNegocio) + '">';
const LOGO_SVG_DARK = `<svg class="brand-mark" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect width="64" height="64" rx="16" fill="#132A54"/>
  <path d="M14 40 L14 22 Q14 18 18 18 L46 18 Q50 18 50 22 L50 40" stroke="#17E3C4" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="32" cy="46" r="3.5" fill="#17E3C4"/>
</svg>`;

/* ============================================================
   PARTIALS COMPARTIDOS: <head>, header, nav móvil, footer
============================================================ */
function renderHead({ title, description, canonicalPath, schemas = [] }){
  const canonicalUrl = config.dominio.replace(/\/$/, '') + canonicalPath;
  const schemaScripts = schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');

  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonicalUrl}">

<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:locale" content="es_CO">

<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230B1B3A'/%3E%3Cpath d='M14 40 L14 22 Q14 18 18 18 L46 18 Q50 18 50 22 L50 40' stroke='%2317E3C4' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3Ccircle cx='32' cy='46' r='3.5' fill='%2317E3C4'/%3E%3C/svg%3E">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/styles.css">
${schemaScripts}`;
}

function renderHeader(){
  return `<header class="site-header">
  <div class="container header-inner">
    <a href="/" class="brand" aria-label="${esc(config.nombreNegocio)}, inicio">
      ${LOGO_IMG}
      <span class="brand-text"><strong>${esc(config.nombreNegocio.split(' ')[0])}</strong><span>${esc(config.nombreNegocio.split(' ').slice(1).join(' '))}</span></span>
    </a>

    <nav class="main-nav" aria-label="Navegación principal">
      <ul>
        <li><a href="/#nosotros">Nosotros</a></li>
        <li><a href="/#servicios">Servicios</a></li>
        <li><a href="/tienda/">Tienda</a></li>
        <li><a href="/#testimonios">Testimonios</a></li>
        <li><a href="/#faq">Preguntas</a></li>
        <li><a href="/#contacto">Contacto</a></li>
      </ul>
    </nav>

    <div class="header-cta">
      <a href="/#contacto" class="btn btn-primary btn-sm">Contáctanos</a>
    </div>

    <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="mobilePanel" aria-label="Abrir menú de navegación">
      <svg class="icon" id="navIconOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="22" height="22"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      <svg class="icon" id="navIconClose" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="22" height="22" style="display:none"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
    </button>
  </div>

  <div class="mobile-panel" id="mobilePanel">
    <ul>
      <li><a href="/#nosotros">Nosotros</a></li>
      <li><a href="/#servicios">Servicios</a></li>
      <li><a href="/tienda/">Tienda</a></li>
      <li><a href="/#testimonios">Testimonios</a></li>
      <li><a href="/#faq">Preguntas</a></li>
      <li><a href="/#contacto">Contacto</a></li>
    </ul>
    <a href="/#contacto" class="btn btn-primary btn-block">Contáctanos</a>
  </div>
</header>`;
}

function renderFooter(){
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="/" class="brand" aria-label="${esc(config.nombreNegocio)}, inicio">
          ${LOGO_SVG_DARK}
          <span class="brand-text"><strong>${esc(config.nombreNegocio.split(' ')[0])}</strong><span>${esc(config.nombreNegocio.split(' ').slice(1).join(' '))}</span></span>
        </a>
        <p>${esc(config.descripcionCorta)}</p>
      </div>

      <div class="footer-col">
        <h5>Navegación</h5>
        <ul>
          <li><a href="/#nosotros">Nosotros</a></li>
          <li><a href="/#servicios">Servicios</a></li>
          <li><a href="/tienda/">Tienda</a></li>
          <li><a href="/#testimonios">Testimonios</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h5>Marcas</h5>
        <ul>
          ${marcas.map((m) => `<li><a href="/tienda/${m.slug}/">${esc(m.nombre)}</a></li>`).join('\n          ')}
        </ul>
      </div>

      <div class="footer-col">
        <h5>Contacto</h5>
        <ul>
          <li><a href="https://wa.me/${config.telefonoWhatsApp}" target="_blank" rel="noopener">${formatPhone(config.telefonoWhatsApp)}</a></li>
          <li><a href="mailto:${config.correo}">${config.correo}</a></li>
          <li><a href="/#contacto">${esc(config.ciudad)}, ${esc(config.region)}</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <span>© <span id="year"></span> ${esc(config.nombreNegocio)}. Todos los derechos reservados.</span>
      <span>${esc(config.ciudad)}, Colombia</span>
    </div>
  </div>
</footer>`;
}

function formatPhone(raw){
  // 573148827097 -> 314 882 7097 (asume prefijo de país de 2 dígitos + 10 dígitos)
  const digits = raw.replace(/\D/g, '');
  const local = digits.slice(-10);
  return local.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
}

function baseScripts(extra = []){
  return ['/assets/js/main.js', ...extra]
    .map((src) => `<script src="${src}"></script>`)
    .join('\n');
}

/* ============================================================
   PÁGINA: INICIO (/)
============================================================ */
function renderHomePage(){
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "ElectronicsRepairShop",
    "name": config.nombreNegocio,
    "description": config.descripcionCorta,
    "telephone": '+' + config.telefonoWhatsApp,
    "email": config.correo,
    "areaServed": config.pais,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": config.ciudad,
      "addressRegion": config.region,
      "addressCountry": config.pais
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": config.horario.dias,
      "opens": config.horario.abre,
      "closes": config.horario.cierra
    },
    "priceRange": "$$"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_ITEMS.map((f) => ({
      "@type": "Question",
      "name": f.pregunta,
      "acceptedAnswer": { "@type": "Answer", "text": f.respuesta }
    }))
  };

  const marcasDestacadas = marcas.slice(0, 4).map((m, i) => `
        <a href="/tienda/${m.slug}/" class="category-card">
          <span class="swatch" style="background:${colorFor(i)}" aria-hidden="true">${esc(m.nombre.charAt(0))}</span>
          <strong>${esc(m.nombre)}</strong>
          <span>${m.productos.length} producto${m.productos.length === 1 ? '' : 's'}</span>
        </a>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
${renderHead({
    title: `${config.nombreNegocio} | Recuperación de TV bloqueado en el logo y software original`,
    description: `Especialistas en recuperación de televisores bloqueados en el logo, Android TV y Google TV. Soporte remoto y presencial con garantía en ${config.ciudad}, Colombia.`,
    canonicalPath: '/',
    schemas: [localBusinessSchema, faqSchema]
  })}
</head>
<body>
<a href="#main" class="skip-link">Saltar al contenido principal</a>

${renderHeader()}

<main id="main">

  <section class="hero" id="inicio">
    <div class="container hero-grid">
      <div class="hero-copy">
        <p class="eyebrow-label"><span class="status-dot" aria-hidden="true"></span> Servicio técnico especializado en Smart TV</p>
        <h1>Soluciones técnicas y software original para tu Smart TV</h1>
        <p class="lead">Especialistas en recuperación de televisores bloqueados en el logo, Android TV, Google TV y fallas de sistema. Soporte técnico remoto y presencial con máxima garantía.</p>
        <div class="hero-actions">
          <a href="https://wa.me/${config.telefonoWhatsApp}?text=${encodeURIComponent('Hola, mi TV quedó bloqueado en el logo, ¿me pueden ayudar?')}" class="btn btn-whatsapp" target="_blank" rel="noopener">
            ${ICON_WHATSAPP} WhatsApp ${formatPhone(config.telefonoWhatsApp)}
          </a>
          <a href="/tienda/" class="btn btn-outline">Ver tienda</a>
        </div>
        <div class="hero-stats">
          <div><strong>+1.200</strong><span>TV recuperados</span></div>
          <div><strong>24-48h</strong><span>Tiempo de respuesta</span></div>
          <div><strong>100%</strong><span>Software original</span></div>
        </div>
      </div>

      <div class="tv-wrap" aria-hidden="true">
        <div class="tv">
          <div class="tv-screen">
            <div class="tv-glow"></div>
            <svg class="tv-mark" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 40 L14 22 Q14 18 18 18 L46 18 Q50 18 50 22 L50 40" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
              <circle cx="32" cy="46" r="3.5" fill="currentColor"/>
            </svg>
            <span class="tv-brand">${esc(config.nombreNegocio.split(' ')[0].toUpperCase())}</span>
            <div class="tv-bar-track"><div class="tv-bar-fill" id="tvBarFill"></div></div>
            <span class="tv-status" id="tvStatus">Recuperando sistema… 0%</span>
            <div class="tv-check" id="tvCheck">${ICON_CHECK} Sistema recuperado</div>
          </div>
          <div class="tv-controls"><span></span><span></span><span></span></div>
        </div>
      </div>
    </div>
  </section>

  <div class="trust-strip">
    <div class="container">
      ${marcas.map((m) => `<span><strong>${esc(m.nombre)}</strong> · ${m.productos.length} modelo${m.productos.length === 1 ? '' : 's'}</span>`).join('\n      ')}
    </div>
  </div>

  <section class="pad-section" id="nosotros">
    <div class="container about-grid">
      <div class="about-visual reveal">
        <h3>Por qué elegir ${esc(config.nombreNegocio.split(' ')[0])}</h3>
        <ul class="about-list">
          <li>${ICON_CHECK} Software con licencia original, sin copias ni riesgos</li>
          <li>${ICON_CHECK} Diagnóstico y respuesta en menos de 48 horas</li>
          <li>${ICON_CHECK} Garantía por escrito en cada servicio realizado</li>
        </ul>
      </div>
      <div class="about-copy reveal">
        <p class="eyebrow-label">Sobre nosotros</p>
        <h2>Ingenieros dedicados a devolverle la vida a tu televisor</h2>
        <p>En ${esc(config.nombreNegocio)} nos dedicamos exclusivamente a la recuperación de televisores inteligentes: equipos atascados en el logo, con bucles de reinicio, fallas de firmware o sistemas Android TV y Google TV corruptos.</p>
        <p>Trabajamos de forma remota para todo el país y de forma presencial en ${esc(config.ciudad)} y sus alrededores.</p>
        <div class="about-metrics">
          <div><strong>7+</strong><span>Años de experiencia</span></div>
          <div><strong>+1.200</strong><span>Equipos recuperados</span></div>
          <div><strong>4.9/5</strong><span>Calificación de clientes</span></div>
        </div>
      </div>
    </div>
  </section>

  <section class="pad-section" id="servicios" style="background:var(--white)">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow-label">Servicios</p>
        <h2>Todo lo que tu Smart TV necesita para volver a encender</h2>
        <p>Desde el desbloqueo de logo hasta la instalación de sistema original, cada servicio incluye diagnóstico previo y garantía.</p>
      </div>
      <div class="services-grid">
        <article class="service-card">
          <div class="service-icon">${ICON_TV}</div>
          <h3>Desbloqueo de logo</h3>
          <p>Recuperamos televisores atascados en la pantalla de inicio o en bucle de reinicio.</p>
          <a href="https://wa.me/${config.telefonoWhatsApp}?text=${encodeURIComponent('Hola, quiero cotizar el desbloqueo de logo de mi TV')}" class="btn btn-outline btn-sm" target="_blank" rel="noopener">Solicitar por WhatsApp</a>
        </article>
        <article class="service-card">
          <div class="service-icon">${ICON_TV}</div>
          <h3>Software Android TV / Google TV</h3>
          <p>Venta e instalación de sistema operativo original y actualizado.</p>
          <a href="/tienda/" class="btn btn-outline btn-sm">Ver catálogo</a>
        </article>
        <article class="service-card">
          <div class="service-icon">${ICON_TV}</div>
          <h3>Soporte remoto</h3>
          <p>Diagnóstico y reparación a distancia, sin mover el televisor de casa. Cobertura nacional.</p>
          <a href="https://wa.me/${config.telefonoWhatsApp}?text=${encodeURIComponent('Hola, necesito soporte remoto para mi TV')}" class="btn btn-outline btn-sm" target="_blank" rel="noopener">Solicitar por WhatsApp</a>
        </article>
        <article class="service-card">
          <div class="service-icon">${ICON_TV}</div>
          <h3>Visita técnica a domicilio</h3>
          <p>Atención presencial en ${esc(config.ciudad)} y municipios cercanos.</p>
          <a href="https://wa.me/${config.telefonoWhatsApp}?text=${encodeURIComponent('Hola, quiero agendar una visita técnica a domicilio')}" class="btn btn-outline btn-sm" target="_blank" rel="noopener">Solicitar por WhatsApp</a>
        </article>
      </div>
    </div>
  </section>

  <section class="pad-section" style="background:var(--white)">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow-label">Tienda</p>
        <h2>Software original por marca</h2>
        <p>Cientos de modelos organizados por marca para que encuentres el software exacto que necesitas.</p>
      </div>
      <div class="category-grid">${marcasDestacadas}</div>
      <div style="margin-top:32px; text-align:center;">
        <a href="/tienda/" class="btn btn-primary">Ver todo el catálogo</a>
      </div>
    </div>
  </section>

  <section class="pad-section benefits-section" id="beneficios">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow-label" style="color:var(--cyan)">Beneficios</p>
        <h2>Ventajas de trabajar con ${esc(config.nombreNegocio.split(' ')[0])}</h2>
      </div>
      <div class="benefits-grid">
        <div class="benefit-item"><div class="service-icon">${ICON_CHECK}</div><div><h4>Software 100% original</h4><p>Licencias oficiales, sin copias que pongan en riesgo tu equipo.</p></div></div>
        <div class="benefit-item"><div class="service-icon">${ICON_CHECK}</div><div><h4>Atención rápida</h4><p>Diagnóstico el mismo día y solución en 24 a 48 horas.</p></div></div>
        <div class="benefit-item"><div class="service-icon">${ICON_CHECK}</div><div><h4>Garantía por escrito</h4><p>Respaldo formal sobre cada reparación y venta de software.</p></div></div>
        <div class="benefit-item"><div class="service-icon">${ICON_CHECK}</div><div><h4>Cobertura nacional remota</h4><p>Atendemos clientes en todo el país mediante conexión remota.</p></div></div>
        <div class="benefit-item"><div class="service-icon">${ICON_CHECK}</div><div><h4>Precios justos</h4><p>Cotización clara y transparente antes de iniciar cualquier trabajo.</p></div></div>
        <div class="benefit-item"><div class="service-icon">${ICON_CHECK}</div><div><h4>Técnicos certificados</h4><p>Ingenieros con experiencia comprobada en firmware de TV.</p></div></div>
      </div>
    </div>
  </section>

  <section class="pad-section" id="testimonios" style="background:var(--white)">
    <div class="container">
      <div class="section-head center">
        <p class="eyebrow-label">Testimonios</p>
        <h2>Lo que dicen nuestros clientes</h2>
      </div>
      <div class="testi-grid">
        <article class="testi-card">
          <p class="testi-quote">Mi TV se quedó pegado en el logo. Por WhatsApp me explicaron todo y en un día lo tenía funcionando de nuevo, sin salir de casa.</p>
          <div class="testi-person"><div class="avatar" style="background:var(--blue)">MJ</div><div><strong>María José Salazar</strong><span>${esc(config.ciudad)}, ${esc(config.region)}</span></div></div>
        </article>
        <article class="testi-card">
          <p class="testi-quote">Compré el software para un televisor genérico y quedó como nuevo. Excelente asesoría y muy buen precio.</p>
          <div class="testi-person"><div class="avatar" style="background:var(--blue-dark)">CR</div><div><strong>Carlos Ramírez</strong><span>Palmira, ${esc(config.region)}</span></div></div>
        </article>
        <article class="testi-card">
          <p class="testi-quote">Solicité la visita a domicilio y el técnico lo dejó funcionando el mismo día. Muy profesionales.</p>
          <div class="testi-person"><div class="avatar" style="background:var(--navy)">LT</div><div><strong>Luisa Torres</strong><span>${esc(config.ciudad)}, ${esc(config.region)}</span></div></div>
        </article>
      </div>
    </div>
  </section>

  <section class="pad-section" id="faq">
    <div class="container">
      <div class="section-head center">
        <p class="eyebrow-label">Preguntas frecuentes</p>
        <h2>Resolvemos tus dudas</h2>
      </div>
      <div class="faq-list">
        ${FAQ_ITEMS.map((f) => `<details class="faq-item">
          <summary>${esc(f.pregunta)}<span class="faq-plus">${ICON_CHEVRON_RIGHT}</span></summary>
          <div class="faq-body">${esc(f.respuesta)}</div>
        </details>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="pad-section" id="contacto" style="background:var(--white)">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow-label">Contacto</p>
        <h2>Cuéntanos qué le pasa a tu televisor</h2>
        <p>Responde el formulario o escríbenos directo por WhatsApp; te contactamos el mismo día hábil.</p>
      </div>
      <div class="contact-grid">
        <div class="form-card">
          <div class="form-success" id="formSuccess">${ICON_CHECK}<span>Mensaje enviado. Te contactaremos muy pronto.</span></div>
          <form id="contactForm" novalidate data-whatsapp="https://wa.me/${config.telefonoWhatsApp}">
            <div class="field" data-field="name">
              <label for="name">Nombre completo</label>
              <input type="text" id="name" name="name" placeholder="Escribe tu nombre" autocomplete="name">
              <p class="field-error">Escribe tu nombre completo.</p>
            </div>
            <div class="field" data-field="email">
              <label for="email">Correo electrónico</label>
              <input type="email" id="email" name="email" placeholder="tucorreo@ejemplo.com" autocomplete="email">
              <p class="field-error">Escribe un correo electrónico válido.</p>
            </div>
            <div class="field" data-field="phone">
              <label for="phone">Teléfono</label>
              <input type="tel" id="phone" name="phone" placeholder="Ej: 3148827097" autocomplete="tel">
              <p class="field-error">Escribe un número de teléfono válido (mínimo 7 dígitos).</p>
            </div>
            <div class="field" data-field="message">
              <label for="message">Mensaje</label>
              <textarea id="message" name="message" placeholder="Cuéntanos qué le sucede a tu televisor: marca, modelo y falla"></textarea>
              <p class="field-error">Cuéntanos brevemente qué le sucede a tu televisor.</p>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Enviar mensaje</button>
            <p class="form-note">Al enviar este formulario aceptas ser contactado vía correo, teléfono o WhatsApp.</p>
          </form>
        </div>
        <div class="contact-info-card">
          <div class="info-row"><div class="service-icon">${ICON_WHATSAPP}</div><div><h4>Teléfono / WhatsApp</h4><a href="https://wa.me/${config.telefonoWhatsApp}" target="_blank" rel="noopener">${formatPhone(config.telefonoWhatsApp)}</a></div></div>
          <div class="info-row"><div class="service-icon">${ICON_CHECK}</div><div><h4>Correo electrónico</h4><a href="mailto:${config.correo}">${config.correo}</a></div></div>
          <div class="info-row"><div class="service-icon">${ICON_TV}</div><div><h4>Ubicación</h4><p>${esc(config.ciudad)}, ${esc(config.region)}, Colombia<br>Servicio remoto a nivel nacional</p></div></div>
          <div class="map-frame">
            <iframe src="https://www.google.com/maps?q=${encodeURIComponent(config.ciudad + ', ' + config.region + ', Colombia')}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Ubicación aproximada de ${esc(config.nombreNegocio)}"></iframe>
          </div>
        </div>
      </div>
    </div>
  </section>

</main>

${renderFooter()}

${baseScripts()}
</body>
</html>`;
}

/* ============================================================
   PÁGINA: DIRECTORIO DE TIENDA (/tienda/)
============================================================ */
function renderTiendaIndex(){
  const cards = marcas.map((m, i) => `
        <a href="/tienda/${m.slug}/" class="category-card">
          <span class="swatch" style="background:${colorFor(i)}" aria-hidden="true">${esc(m.nombre.charAt(0))}</span>
          <strong>${esc(m.nombre)}</strong>
          <span>${m.productos.length} producto${m.productos.length === 1 ? '' : 's'}</span>
        </a>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
${renderHead({
    title: `Tienda de software para Smart TV | ${config.nombreNegocio}`,
    description: `Explora ${productos.length} productos de software original para Smart TV organizados por marca: ${marcas.map((m) => m.nombre).join(', ')}.`,
    canonicalPath: '/tienda/'
  })}
</head>
<body>
<a href="#main" class="skip-link">Saltar al contenido principal</a>
${renderHeader()}
<main id="main">
  <nav class="breadcrumbs container" aria-label="Ruta de navegación">
    <a href="/">Inicio</a><span class="sep">/</span><span class="current">Tienda</span>
  </nav>

  <section class="pad-section" style="padding-top:12px">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow-label">Tienda</p>
        <h1>Software original para Smart TV</h1>
        <p>${productos.length} productos organizados en ${marcas.length} marca${marcas.length === 1 ? '' : 's'}. Elige una para ver los modelos disponibles.</p>
      </div>
      <div class="category-grid">${cards}</div>
    </div>
  </section>
</main>
${renderFooter()}
${baseScripts()}
</body>
</html>`;
}

/* ============================================================
   PÁGINA: MARCA (/tienda/{marca}/)
============================================================ */
function renderBrandPage(marca){
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Software ${marca.nombre} - ${config.nombreNegocio}`,
    "itemListElement": marca.productos.map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": `${config.dominio}/tienda/${marca.slug}/${p.slug}/`
    }))
  };

  const cards = marca.productos.map((p) => productCardHTML(p)).join('\n        ');

  return `<!DOCTYPE html>
<html lang="es">
<head>
${renderHead({
    title: `Software para TV ${marca.nombre} | ${config.nombreNegocio}`,
    description: `${marca.productos.length} productos de software original para televisores ${marca.nombre}. Licencias con garantía y soporte técnico incluido.`,
    canonicalPath: `/tienda/${marca.slug}/`,
    schemas: [itemListSchema]
  })}
</head>
<body>
<a href="#main" class="skip-link">Saltar al contenido principal</a>
${renderHeader()}
<main id="main">
  <nav class="breadcrumbs container" aria-label="Ruta de navegación">
    <a href="/">Inicio</a><span class="sep">/</span><a href="/tienda/">Tienda</a><span class="sep">/</span><span class="current">${esc(marca.nombre)}</span>
  </nav>

  <section class="pad-section" style="padding-top:12px">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow-label">Marca</p>
        <h1>Software para TV ${esc(marca.nombre)}</h1>
        <p>${marca.productos.length} producto${marca.productos.length === 1 ? '' : 's'} disponible${marca.productos.length === 1 ? '' : 's'} de esta marca.</p>
      </div>
      <div class="products-grid">
        ${cards}
      </div>
    </div>
  </section>
</main>
${renderFooter()}
${baseScripts()}
</body>
</html>`;
}

function productCardHTML(p){
  const badge = p.estado.toLowerCase() === 'agotado'
    ? `<span class="product-badge agotado">Agotado</span>`
    : '';
  const sistemaTag = p.sistema ? `<span class="sys-tag">${esc(p.sistema)}</span>` : '';
  return `<article class="product-card">
          <a href="/tienda/${p.marcaSlug}/${p.slug}/" aria-label="Ver ${esc(p.modelo)}">
            <div class="product-media">${badge}${ICON_TV}</div>
          </a>
          <div class="product-body">
            ${sistemaTag}
            <h3><a href="/tienda/${p.marcaSlug}/${p.slug}/">${esc(p.modelo)}</a></h3>
            <p>Software: ${esc(p.software || 'consultar disponibilidad')}</p>
            <div class="product-price-row"><span class="product-price">$${esc(p.precio.replace(' COP',''))}<span>COP</span></span></div>
            <a href="/tienda/${p.marcaSlug}/${p.slug}/" class="btn btn-outline btn-sm btn-block">Ver detalles</a>
          </div>
        </article>`;
}

/* ============================================================
   PÁGINA: PRODUCTO (/tienda/{marca}/{producto}/)
============================================================ */
function renderProductPage(marca, producto){
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": producto.modelo,
    "description": `Software de recuperación / actualización para el televisor ${marca.nombre} modelo ${producto.modelo}.`,
    "brand": { "@type": "Brand", "name": marca.nombre },
    "sku": producto.slug,
    "offers": {
      "@type": "Offer",
      "priceCurrency": config.moneda,
      "price": producto.valor,
      "availability": producto.estado.toLowerCase() === 'agotado' ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "url": `${config.dominio}/tienda/${marca.slug}/${producto.slug}/`
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": config.dominio + "/" },
      { "@type": "ListItem", "position": 2, "name": "Tienda", "item": config.dominio + "/tienda/" },
      { "@type": "ListItem", "position": 3, "name": marca.nombre, "item": `${config.dominio}/tienda/${marca.slug}/` },
      { "@type": "ListItem", "position": 4, "name": producto.modelo, "item": `${config.dominio}/tienda/${marca.slug}/${producto.slug}/` }
    ]
  };

  const agotado = producto.estado.toLowerCase() === 'agotado';

  // Datos embebidos para checkout.js (evita tener que exponer/cargar todo el catálogo en el navegador)
  const productDataForClient = {
    modelo: producto.modelo,
    precio: producto.precio,
    estado: producto.estado,
    valor: producto.valor,
    nombreNegocio: config.nombreNegocio,
    telefonoWhatsApp: config.telefonoWhatsApp
  };

  const relacionados = marca.productos
    .filter((p) => p.slug !== producto.slug)
    .slice(0, 3)
    .map((p) => productCardHTML(p))
    .join('\n        ');

  return `<!DOCTYPE html>
<html lang="es">
<head>
${renderHead({
    title: `${producto.modelo} — Software TV ${marca.nombre} | ${config.nombreNegocio}`,
    description: `Software original para el televisor ${marca.nombre} modelo ${producto.modelo}${producto.sistema ? ' (' + producto.sistema + ')' : ''}. Precio ${producto.precio}. Entrega y soporte con garantía.`,
    canonicalPath: `/tienda/${marca.slug}/${producto.slug}/`,
    schemas: [productSchema, breadcrumbSchema]
  })}
</head>
<body>
<a href="#main" class="skip-link">Saltar al contenido principal</a>
${renderHeader()}
<main id="main">
  <nav class="breadcrumbs container" aria-label="Ruta de navegación">
    <a href="/">Inicio</a><span class="sep">/</span><a href="/tienda/">Tienda</a><span class="sep">/</span><a href="/tienda/${marca.slug}/">${esc(marca.nombre)}</a><span class="sep">/</span><span class="current">${esc(producto.modelo)}</span>
  </nav>

  <section class="pad-section" style="padding-top:12px">
    <div class="container">
      <div class="product-detail">
        <div class="product-detail-media" aria-hidden="true">${ICON_TV.replace('class="icon"','class="icon" style="width:96px;height:96px"')}</div>

        <div class="product-detail-info">
          <span class="cat-tag">${esc(marca.nombre)}</span>
          ${producto.sistema ? `<span class="sys-tag" style="margin-left:8px">${esc(producto.sistema)}</span>` : ''}
          <span class="status-tag${agotado ? ' agotado' : ''}" style="margin-left:8px">${esc(producto.estado)}</span>
          <h1>${esc(producto.modelo)}</h1>
          <p class="product-detail-price">$${esc(producto.precio.replace(' COP',''))} <span>COP</span></p>

          <table class="specs-table">
            <tbody>
              <tr><th>Modelo</th><td>${esc(producto.modelo)}</td></tr>
              <tr><th>Marca</th><td>${esc(marca.nombre)}</td></tr>
              ${producto.sistema ? `<tr><th>Sistema</th><td>${esc(producto.sistema)}</td></tr>` : ''}
              <tr><th>Software</th><td>${esc(producto.software || 'Consultar disponibilidad')}</td></tr>
              ${producto.main ? `<tr><th>Notas</th><td>${esc(producto.main)}</td></tr>` : ''}
              <tr><th>Estado</th><td>${esc(producto.estado)}</td></tr>
            </tbody>
          </table>

          <div class="purchase-actions">
            <div id="mp-button"></div>
            <a href="#" id="whatsappBtn" class="btn btn-whatsapp btn-block" target="_blank" rel="noopener">${ICON_WHATSAPP} Consultar por WhatsApp</a>
          </div>
        </div>
      </div>

      ${relacionados ? `<div class="related-products">
        <h2>Otros modelos de ${esc(marca.nombre)}</h2>
        <div class="products-grid">
          ${relacionados}
        </div>
      </div>` : ''}
    </div>
  </section>
</main>
${renderFooter()}

<script type="application/json" id="product-data">${JSON.stringify(productDataForClient)}</script>
${baseScripts(['/assets/js/checkout.js'])}
</body>
</html>`;
}

/* ============================================================
   FAQ (contenido compartido entre home y schema)
============================================================ */
const FAQ_ITEMS = [
  { pregunta: '¿Qué significa que un televisor esté bloqueado en el logo?', respuesta: 'Ocurre cuando el televisor se queda encendido mostrando únicamente el logo de la marca, sin avanzar al sistema operativo. Suele deberse a una actualización fallida, corrupción del firmware o un corte de energía durante el arranque.' },
  { pregunta: '¿Cuánto tiempo toma la recuperación?', respuesta: 'La mayoría de los casos se resuelven entre 24 y 48 horas después del diagnóstico. El tiempo exacto depende del modelo y la disponibilidad del software original.' },
  { pregunta: '¿El servicio es remoto o presencial?', respuesta: 'Ofrecemos ambas modalidades. El soporte remoto cubre todo el país, y la visita técnica presencial está disponible en ' + config.ciudad + ' y municipios cercanos.' },
  { pregunta: '¿El software que venden es original y legal?', respuesta: 'Sí. Utilizamos únicamente firmware y licencias originales, sin modificaciones que comprometan la seguridad del equipo.' },
  { pregunta: '¿Cómo recibo el software después de pagar?', respuesta: 'Después de confirmado el pago te contactamos por WhatsApp o correo con el archivo y las instrucciones de instalación, o coordinamos la instalación remota si la necesitas.' },
  { pregunta: '¿Ofrecen garantía?', respuesta: 'Sí, cada servicio se entrega con garantía por escrito sobre el trabajo realizado.' }
];

/* ============================================================
   SITEMAP Y ROBOTS
============================================================ */
function renderSitemap(urls){
  const entries = urls.map((u) => `  <url><loc>${config.dominio}${u}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function renderRobots(){
  return `User-agent: *
Allow: /

Sitemap: ${config.dominio}/sitemap.xml
`;
}

/* ============================================================
   EJECUCIÓN
============================================================ */
function build(){
  console.log('Generando sitio...');

  // Borra la tienda generada anteriormente para no dejar páginas huérfanas
  // (por ejemplo si una marca o modelo cambió de nombre/slug).
  removeIfExists('tienda');

  const urls = ['/', '/tienda/'];

  writeFile('index.html', renderHomePage());
  writeFile('tienda/index.html', renderTiendaIndex());

  marcas.forEach((marca) => {
    urls.push(`/tienda/${marca.slug}/`);
    writeFile(`tienda/${marca.slug}/index.html`, renderBrandPage(marca));

    marca.productos.forEach((producto) => {
      urls.push(`/tienda/${marca.slug}/${producto.slug}/`);
      writeFile(`tienda/${marca.slug}/${producto.slug}/index.html`, renderProductPage(marca, producto));
    });
  });

  writeFile('sitemap.xml', renderSitemap(urls));
  writeFile('robots.txt', renderRobots());

  console.log(`\nListo. ${urls.length} URLs generadas (1 por marca y 1 por producto).`);
}

build();
