# POT-Web2 — Design Reference
> constellation floating on black velvet
> Bu dosya sadece POT-Web2 projesi için tasarım referansıdır. Dala stilinden başladı;
> tipografi apple-design skill'inden alındı.

**Theme:** dark — saf siyah zemin. Tasarımın anlamı karanlıkta parlayan parçacıklardan gelir.
2026-10-09'da açık tema ve "gece sahneleri + inci içerik" karışık tema denendi. Kullanıcı
ikisini de "tasarım anlamını yitirdi" diyerek reddetti ve koyu temaya geri dönüldü.
Açık ya da karışık tema önerme.

## Colors
Bileşenler yalnız anlamlı tokenları kullanır (css/style.css `:root`).

| Token | Value | Role |
|-------|-------|------|
| `--color-canvas` | `#000000` | Page background, every section |
| `--color-ink` | `#ffffff` | Headlines, body, icons, nav active, chart actual line |
| `--color-ink-muted` | `#bdbdbd` | Secondary text (`.t-muted`), bullets, legend |
| `--color-ink-faint` | `#9a9a9a` | Inactive nav, form labels, axis labels, footer meta |
| `--color-accent` | `#c4b5ff` (lavanta) | Labels above headings, links, chart forecast line, focus ring |
| `--color-electric-iris` | `#8052ff` | Brand violet: selection, input focus, chart peak markers |
| `--color-hairline` | `rgba(255,255,255,.18)` | Input underlines, pill outlines |
| `--logo-filter` | `invert(1)` | Black POT logo shown white |
| `--particles` | white→lavender→orchid→violet→blue→cyan→teal | 9 particle shades top→bottom, read by js/particles.js |
| `--glass-edge` | light-edge shadows | Liquid glass button edge |

Sarı/amber (eski Saffron Spark `#ffb829`) kullanıcı tarafından reddedildi, UI'da da
parçacıklarda da hiçbir yerde kullanılmaz.

## Typography
> 2026-10-09: Tipografi Dala stilinden değil, POT-Web'deki **apple-design** skill'inden alındı.

- Typeface: sistem yazı tipi — `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, "Helvetica Neue", sans-serif` (Apple'da SF Pro, Windows'ta Segoe UI). Web font yüklenmez.
- Hierarchy = weight + size + leading birlikte. Başlıklar 600, gövde 400.
- Tracking boyuta göre: büyük metin negatif, gövde 0, küçük versal etiket geniş (0.14em).
- Leading boyutla ters orantılı: büyük başlık sıkı, gövde 1.6.
- Boyutlar `rem` cinsinden (kullanıcının yazı boyutu ayarına uyar). `font-optical-sizing: auto`.

| Role (class) | Size | Line Height | Letter Spacing | Weight |
|------|------|-------------|----------------|--------|
| display (`.t-display`) | clamp(2.5rem, 6vw, 4.5rem) | 1.04 | -0.025em | 600 |
| title (`.t-heading-lg`) | clamp(1.75rem, 3.5vw, 2.5rem) | 1.12 | -0.018em | 600 |
| heading (`.t-heading`) | 1.375rem | 1.3 | -0.008em | 600 |
| listing (`.t-heading-2xs`) | clamp(1.1875rem, 1.5vw, 1.4375rem) | 1.32 | -0.011em | 600 |
| lead (`.t-heading-xs`) | clamp(1.1875rem, 1.9vw, 1.5rem) | 1.45 | -0.006em | 400 |
| eyebrow (`.t-label`) | 0.8125rem, UPPERCASE | 1.2 | 0.14em | 600 |
| body (`.t-body`) | 1.0625rem | 1.6 | 0 | 400 |
| caption | 0.8125rem | 1.45 | 0.012em | 400 |

## Spacing & Shape
- Base unit 6px: 6, 12, 18, 24, 30, 36, 60, 96, 120
- Radius: 24px (nav, cards, buttons), 9999px (tags)
- Page max-width 1280px; section gap 60–120px; element gap 6–18px

## Components
- **Primary Button (Liquid Glass, 2026-10-09):** şeffaf cam hap; 56px yükseklik, 32px yatay boşluk, 14px 500 koyu (Ink) metin (versal değil). Arkadaki içerik `#container-glass` SVG filtresiyle bükülür (backdrop-filter, sadece Chromium), kenarlar bileşenin açık tema gölgeleriyle çizilir (köşelerde koyu kırılma, içten hafif gölge). Hover 1.05 büyür, basınca 0.97. Kaynak: shadcn `LiquidButton`, düz CSS'e çevrildi (`.btn` + `::before`/`::after`).
- **Logo:** siyah POT logosu `invert(1)` ile beyaz. Referans logosu `brightness(0) invert(1)` ile beyaz.
- **Hero Constellation:** animated field of outlined triangles (1.4px stroke) forming the K2 mountain.
- **Section Headline Block:** title headline left; body Ink or Ink Muted; optional small Accent uppercase label above (not on solution sections).
- **Navigation:** transparent at top, solid black on scroll. Logo left, links 14px regular weight, normal case — not uppercase (Ink Faint inactive, Ink active). No border.
- **Ambient Particle Field:** scattered low-opacity outlined triangles across background.
- **Solution Art:** each solution's visual area holds a particle drawing next to its chart (same engine as the K2 peak line), on the outer edge: Elektrik Yükü → electricity distribution pole (crossarms, insulators, transformer, short wires fading into space) left of the chart; Üretim → wind turbine with slowly rotating blades right of the chart. Art and chart share a baseline (art is taller); columns 2fr:3fr. Under 900px the art stacks above the chart. No "Çözüm 01/02" labels.
- **K2 zirve çizgisi (2026-10-14):** K2 bölümündeki parçacık "K2" yazısı fazla göze battığı için kaldırıldı; ardından denenen kuşbakışı topografik harita da beğenilmedi. Şimdiki figür (`data-constellation="peak"`): soldan alçaktan başlayıp iniş çıkışlarla tırmanan, sağa yakın bir noktada keskin zirve yapıp hafifçe inen tek parçacık çizgisi. Renk yüksekliğe göre: dipte teal, ortada violet, zirvede beyaz. Zirvenin üstünde işaret yok (üçgen denendi, kullanıcı kaldırttı). Görününce soldan sağa çizilir (2.6 sn). Bölüm etiketi "K2" metin olarak kalır.
- **Referans etiketi:** "REFERANSLAR" (çoğul).
- **Soru işareti (2026-10-14):** S.S.S. ve iletişim `.ask` sarmalayıcısında; arkalarında parçacıklardan büyük bir "?" var (`data-constellation="question"`). Diğer figürlerden yumuşak: opaklık ×0.55, yavaş yay (stiff 0.035), renkler lavantadan maviye, nokta camgöbeği. Alan görününce kıvrımın tepesinden başlayıp kalemle yazılır gibi oluşur (2.8 sn), nokta en son gelir; sonra noktası etrafında ±2.5° yavaşça sallanır. Masaüstünde sol 6 kolonda, S.S.S. başlığının altından formun sonuna uzanır. Mobilde (2026-10-14, kullanıcı isteği) başlıkların arkasında: üstten hizalı, 1.34 kat büyük, opaklık ×0.5; kıvrım S.S.S. başlığının arkasından başlar, nokta "Sorunuz mu var?" başlığının üstüne iner. (Önce iki bölüm arasında kendi alanında denendi.)
- **S.S.S. akordeonu:** aynı anda en fazla bir cevap açık. Başka soruya basınca o açılır, önceki kapanır; açık olana basınca kapanır. Hepsi kapalı başlar, açık olanın artısı çarpıya döner.
- **Charts:** white solid actual line, lavender dashed POT forecast, violet triangles on each period's forecast peak; drawn left to right with a scan line when scrolled into view (js/charts.js).

## Mobil (≤900px) — hangi figür metnin arkasında
- **Dağ:** giriş tam ekran; dağ 1.35 kat büyütülüp ortalanır (yanlar kırpılır), başlık ve buton önde.
- **Direk / türbin:** kendi alanlarında, metnin üstünde durur. 2026-10-09'da metnin arkasına almak
  denendi, kullanıcı eski hâlini tercih etti.
- **K2 zirve çizgisi (2026-10-14):** metnin arkasında; metinle aynı grid hücresinde, canvas %60 opak.
- **Soru işareti (2026-10-14):** S.S.S. ve "Sorunuz mu var?" başlıklarının arkasında (bkz. Components).

## Motion — menü harfleri (2026-10-09, kaynak: dala.craftedbygc.com)
- `.nav__link` ve `.mobile-menu__link` metni harflere bölünür (main.js `splitChars`). Basınca
  (pointerdown) harfler sırayla yukarı yuvarlanır, bir satır altındaki `text-shadow` kopyası
  yerine gelir (0.5s, power1.out, harf başına 35ms). Aktif bölümün linki oynamaz.
- Menü linkleri bölüme normal yumuşak kaydırmayla gider. Dala'nın geçiş perdesi ve hover
  zıplaması denendi, kullanıcı istemedi: ekleme.
- `prefers-reduced-motion: reduce` açıksa harf animasyonu çalışmaz.

## Do
- Accent only for small things (labels, links, focus); buttons are liquid glass, not violet fills
- Typography rules: see the Typography section (apple-design scale)
- Pure black for every section background
- 24px radius consistently
- Particle constellation is the only hero imagery

## Don't
- No violet large surfaces/sections
- No fixed letter-spacing for all sizes
- No cards with borders/shadows/fills — float on black with whitespace
- No default link blue; links Accent or Ink
- No yellow / amber anywhere (UI or particles)
- No gradients on UI components (only logo + particles); liquid glass button shadows are the one exception
- No multiple filled buttons near each other
- No shadows / elevation, no borders/dividers (except the liquid glass button edge)

## Layout
Full-bleed sections on black, content max ~1280px. Hero: two-column, headline + body + CTA left, particle K2 mountain right. Subsequent sections zigzag (visual-left/text-right, then reversed). Generous 60–120px gaps. No card grids, no pricing tables, no multi-column feature blocks. Extremely spacious — one or two elements per viewport.

## CSS Custom Properties
```css
:root {
  /* Renk tokenları: css/style.css (:root) */
  /* Tipografi tokenları: css/style.css (apple-design ölçeği) */
  --spacing-6: 6px; --spacing-12: 12px; --spacing-18: 18px; --spacing-24: 24px; --spacing-30: 30px;
  --spacing-36: 36px; --spacing-60: 60px; --spacing-96: 96px; --spacing-120: 120px;
  --page-max-width: 1280px;
  --radius-3xl: 24px; --radius-full: 9999px;
}
```
