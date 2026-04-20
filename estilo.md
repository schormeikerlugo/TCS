# Estilo UI — Graff Construction

Sistema de diseno documentado para replicar en otros proyectos.
Variante: fondo blanco con paleta azul.

---

## Paleta de colores

| Token | Oscuro (actual) | Claro / Azul (nueva variante) |
|-------|-----------------|-------------------------------|
| primary (fondo) | `#0a0a0a` | `#ffffff` |
| surface | `#111111` | `#f4f7fb` |
| texto principal | `#ffffff` | `#0f172a` |
| texto secundario | `rgba(255,255,255,0.4)` | `rgba(15,23,42,0.5)` |
| accent | `#e85d26` (naranja) | `#2563eb` (azul 600) |
| accent hover | `#d14a17` | `#1d4ed8` (azul 700) |
| muted | `#8a8a8a` | `#94a3b8` (slate 400) |
| glass bg | `rgba(255,255,255,0.03)` | `rgba(15,23,42,0.03)` |
| glass border | `rgba(255,255,255,0.06)` | `rgba(15,23,42,0.06)` |
| glass hover bg | `rgba(255,255,255,0.07)` | `rgba(15,23,42,0.06)` |
| glow | `rgba(232,93,38,0.12)` | `rgba(37,99,235,0.12)` |

---

## Tipografia

| Rol | Fuente | Pesos |
|-----|--------|-------|
| Titulos statement | `Playfair Display` (serif) | 400–900, italic |
| Cuerpo / UI | `Inter` (sans-serif) | 300–800 |
| Etiquetas / mono | `JetBrains Mono` | 300–500 |

### Jerarquia tipografica

| Elemento | Tamano | Peso | Estilo |
|----------|--------|------|--------|
| H1 hero (statement) | `clamp(3rem, 10vw, 9rem)` | 800 uppercase | Mezcla `.thin` (200) + `.serif-accent` (Playfair italic en accent) |
| H2 seccion | `clamp(2.5rem, 7vw, 6rem)` | 800 uppercase | Misma mezcla de pesos |
| Etiqueta seccion | `11px` | 600 | Mono, tracking `0.35em`, uppercase, con linea accent a la izquierda |
| Numero seccion | `11px` | 400 | Mono, tracking `0.3em`, `opacity 0.15`, esquina superior derecha |
| Cuerpo | `14–16px` | 400 | Inter, `leading-relaxed`, `opacity 0.5` |
| Subtitulos card | `18px` | 500 | Inter |
| Mono metadata | `11px` | 400 | JetBrains Mono, tracking ancho |

### Clases de tipografia statement

```css
.heading-statement {
  font-family: var(--font-sans);
  font-size: clamp(3rem, 10vw, 9rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 0.9;
  text-transform: uppercase;
}
.heading-statement .thin { font-weight: 200; }
.heading-statement .serif-accent {
  font-family: var(--font-serif);
  font-style: italic;
  text-transform: none;
  color: var(--color-accent);
}
.heading-statement .outline-text {
  -webkit-text-stroke: 1px currentColor;
  color: transparent;
}
```

---

## Glassmorphism

### Tarjeta glass standard
```css
background: rgba(fondo-invertido, 0.03);
backdrop-filter: blur(30px);
border: 1px solid rgba(fondo-invertido, 0.06);
border-radius: 16px; /* rounded-2xl */
```

### Hover (standard — 0.5s)
```css
background: rgba(fondo-invertido, 0.07);
border-color: rgba(fondo-invertido, 0.15);
transform: translateY(-8px);
box-shadow: 0 30px 60px -10px rgba(0,0,0,0.15); /* mas suave en fondo claro */
```

### Hover (fast — 0.2s)
```css
transform: translateY(-4px);
box-shadow: 0 16px 32px -8px rgba(0,0,0,0.1);
```

### Glass heavy (badges superpuestos)
```css
background: rgba(fondo-invertido, 0.06);
backdrop-filter: blur(40px);
border: 1px solid rgba(fondo-invertido, 0.12);
```

### Active state (para botones seleccionables)
```css
background: rgba(fondo-invertido, 0.07);
border-color: rgba(accent, 0.3);
```

---

## Elementos 3D (CSS puro)

### Cubo flotante
- 6 caras con `transform-style: preserve-3d`
- Bordes: `1px solid rgba(accent, 0.15)`
- Fondo: `rgba(accent, 0.03)`
- Animacion: `rotateX(25-35deg) rotateY(25-45deg) translateY(0 a -20px)` en 12s loop
- Tamanos: 60px (normal), 90px (lg)

### Plano flotante
- Rectangulo 120x180px
- `rotateX(55deg) rotateZ(45deg)`
- Animacion vertical suave 8s

### Piramide
- 3 divs con `clip-path: polygon(50% 0%, 0% 100%, 100% 100%)`
- Rotacion inversa 15s

### Anillo wireframe
- Circulo con doble borde
- `rotateX(70deg)`, animacion flotante 10s

### Tarjeta 3D con animacion continua (seccion Areas)
```javascript
// requestAnimationFrame loop
const rx = Math.sin(t) * 3;      // ±3 grados
const ry = Math.cos(t * 0.7) * 4; // ±4 grados
const ty = Math.sin(t * 0.5) * 6; // ±6px
```

### Tilt card (hover)
```css
.perspective-container { perspective: 1200px; }
.tilt-card:hover {
  transform: rotateY(-4deg) rotateX(2deg) translateZ(20px);
}
```

---

## Animaciones de scroll

### Sistema reveal (IntersectionObserver)
```
threshold: 0.08
rootMargin: '0px 0px -40px 0px'
Clase trigger: .reveal → .reveal.visible
```

| Variante | Transform inicial | Transform final |
|----------|-------------------|-----------------|
| default | `translateY(60px)` | `translateY(0)` |
| from-left | `translateX(-80px)` | `translateX(0)` |
| from-right | `translateX(80px)` | `translateX(0)` |
| scale-up | `scale(0.92)` | `scale(1)` |
| clip-up | `clip-path: inset(100% 0 0 0)` | `clip-path: inset(0)` |

- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` — 0.9s
- Stagger: `data-delay="1"` a `data-delay="8"` (incrementos de 0.1s)

### Scroll-driven (Process cards)
- Cards apiladas al centro con rotaciones (-3 a +3 grados)
- Se despliegan en abanico segun scroll progress
- `translateX` de ±45px (stacked) a ±480px (fanned)
- Progress calculado: `1 - rect.top / (vh * 3.95)`

---

## Elementos HUB futurista

### Numeros de seccion
- Formato: `01 / 08`
- Posicion: `absolute top-8 right-16`
- Font: mono 11px, `opacity 0.15`

### Geo divider
```css
height: 100px;
Linea horizontal: gradient(transparent → white/0.06 → accent/0.2 → white/0.06 → transparent)
Centro: caracter "+" en mono, accent con opacity 0.4
```

### Grid overlay
```css
background: grid 80x80px con lineas a opacity 0.025
Puntos accent en intersecciones (box-shadow)
```

### Crosshair lines
- Lineas decorativas 1px (horizontal y vertical)
- `gradient(transparent → white/0.04 → transparent)`

### Marquee
- Servicios en loop horizontal continuo (25s linear infinite)
- Separados por diamantes accent
- `opacity 0.15`, tracking `0.3em`, uppercase

---

## Layout y espaciado

| Propiedad | Valor |
|-----------|-------|
| Max width contenedor | `1440px` |
| Padding horizontal | `px-6` (mobile) → `px-10` (sm) → `px-16` (lg) |
| Padding vertical seccion | `py-20` (mobile) → `py-28` (lg) |
| Gap entre secciones | Geo dividers o full-bleed videos |
| Border radius cards | `rounded-xl` (12px) a `rounded-3xl` (24px) |
| Gap grid cards | `gap-4` (16px) |

### Patrones de layout

- **Hero**: Full viewport, contenido alineado al bottom-left
- **Seccion con imagen**: Grid 12 cols, imagen 7 cols + cards 5 cols
- **Seccion con lista**: Grid 2 cols, lista izquierda + imagen derecha
- **Cards grid**: 2 cols (sm) → 3 cols (lg) → 4 cols (xl)
- **Imagenes asimetricas**: Grid 5 cols, imagen grande 3 cols + pequena 2 cols con offset vertical

---

## Interactividad

### Cards de servicio
- Hover: borde accent, icono flecha cambia color, titulo cambia a accent
- Transicion: `0.2s ease-out`

### Botones de area (click to change)
- Click activa `active-area` (borde accent + glow)
- Cambia imagen con `opacity transition 500ms`
- Actualiza nombre de ciudad en overlay

### Formulario de contacto
- Inputs: fondo translucido, borde sutil
- Focus: `border-accent/50 + ring accent/20`
- Boton: accent solid con hover shadow + lift

### Navbar
- Transparente → glass on scroll (threshold: 100px)
- Underline animation en links (pseudo-element width 0→100%)
- Menu mobile: fullscreen overlay con backdrop-blur

---

## Videos full-bleed

- Posicion entre secciones como separadores visuales
- `autoplay muted loop playsinline`
- Gradientes: `from-primary via-transparent to-primary`
- Altura: `h-[50vh] min-h-[350px]` o `h-[40vh] min-h-[300px]`
- Ancho: `100vw` con `margin-left: calc(-50vw + 50%)`

---

## Responsive

| Breakpoint | Comportamiento |
|------------|---------------|
| Mobile (<768px) | Cards en 1-2 cols, 3D shapes ocultas, stat cards sin overlap, process cards en grid |
| Tablet (768-1024px) | 3D shapes visibles, grids 2-3 cols |
| Desktop (>1024px) | Layout completo, overlaps activos, process fan animation, area image con 3D float |

---
