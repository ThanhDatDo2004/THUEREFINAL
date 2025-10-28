/* NOTE:
   - Đừng dùng `@apply group` (không hợp lệ). Thay vào đó, thêm class `group` trực tiếp vào HTML.
   - Các nơi có group-hover (feature-icon, category-label, ...) cần cha có class `group`.
*/

.hero {
  @apply relative isolate overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-950 text-white;
}

.hero-pattern {
  @apply absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.4),_transparent_50%)]
         before:content-[''] before:absolute before:-inset-1
         before:bg-[conic-gradient(from_230deg,_rgba(59,130,246,0.3),_transparent_70%)]
         before:opacity-70 before:blur-3xl;
}

.hero-inner {
  @apply relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28;
}

.hero-grid {
  @apply grid gap-12 lg:grid-cols-[1.2fr,0.8fr] items-center;
}

.hero-copy {
  @apply space-y-8;
}

.hero-eyebrow {
  @apply inline-flex items-center text-sm font-bold tracking-widest uppercase text-orange-400
         bg-orange-500/20 backdrop-blur-sm border border-orange-400/30 px-4 py-2 rounded-full;
}

.hero-title {
  @apply text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight;
}

.hero-highlight {
  @apply bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent;
}

.hero-subtitle {
  @apply text-xl sm:text-2xl text-blue-100/90 max-w-2xl font-medium leading-relaxed;
}

.hero-actions {
  @apply flex flex-col sm:flex-row gap-5;
}

.hero-cta {
  @apply inline-flex items-center justify-center gap-2 rounded-xl
         bg-gradient-to-r from-orange-500 to-orange-600 text-white
         px-10 py-5 text-lg font-bold shadow-2xl shadow-orange-500/50
         transition hover:shadow-orange-500/70 hover:scale-105 transform;
}

.hero-ghost {
  @apply inline-flex items-center justify-center gap-2 rounded-xl
         border-2 border-blue-400/40 bg-blue-500/10 backdrop-blur-sm
         px-10 py-5 text-lg font-bold text-white transition
         hover:bg-blue-500/20 hover:border-blue-400/60;
}

.hero-badges {
  @apply flex flex-wrap gap-4 pt-6 text-base text-white;
}

.hero-badge {
  @apply inline-flex items-center gap-3 rounded-xl border-2 border-blue-400/30
         bg-blue-500/20 backdrop-blur-sm px-5 py-3 font-semibold;
}

.hero-stats {
  @apply grid grid-cols-2 md:grid-cols-4 gap-3 pt-6;
}

.hero-stat-card {
  @apply flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-5 shadow-sm shadow-black/10;
}

.hero-stat-value {
  @apply text-2xl font-semibold text-white;
}

.hero-stat-label {
  @apply text-xs uppercase tracking-wide text-white/70;
}

.hero-card {
  @apply relative rounded-2xl border-2 border-blue-400/30
         bg-gradient-to-br from-blue-500/10 to-slate-900/50
         backdrop-blur-xl p-8 shadow-2xl shadow-blue-900/40 space-y-6;
}

.hero-card-header {
  @apply space-y-4;
}

.hero-card-pill {
  @apply inline-flex items-center gap-2 rounded-lg bg-orange-500/30 border border-orange-400/50
         px-4 py-2 text-xs font-bold uppercase tracking-widest text-orange-300;
}

.hero-card-title {
  @apply text-2xl font-black text-white;
}

.hero-card-subtitle {
  @apply text-base text-blue-200/80 leading-relaxed;
}

.hero-shortcuts {
  @apply space-y-3;
}

.hero-shortcut {
  @apply flex items-center gap-4 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm
         px-5 py-4 transition hover:border-orange-400/60 hover:bg-orange-500/20 hover:scale-105 transform;
}

.hero-shortcut-icon {
  @apply flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg;
}

.hero-card-footer {
  @apply flex items-start gap-3 rounded-xl border-2 border-blue-400/20 bg-blue-500/10 px-5 py-4 text-sm text-blue-100;
}

.home-section {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20;
}

.section-header {
  @apply flex flex-col gap-5 mb-12;
}

.section-eyebrow {
  @apply text-sm font-black uppercase tracking-widest text-orange-600 flex items-center gap-2;
}

.section-title {
  @apply text-4xl sm:text-5xl font-black text-slate-900 leading-tight;
}

.section-actions {
  @apply mt-3;
}

.feature-grid {
  @apply grid gap-8 md:grid-cols-3;
}

/* Đặt trong @layer để bảo toàn thứ tự và tránh cảnh báo */
@layer components {
  .feature-card {
    /* ĐÃ BỎ 'group' khỏi @apply */
    @apply flex flex-col gap-5 rounded-2xl border-2 border-slate-200 bg-white p-8
           shadow-xl shadow-slate-900/10 transition hover:-translate-y-2 hover:shadow-2xl hover:border-orange-400;
  }
}

.feature-icon {
  @apply h-16 w-16 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white
         flex items-center justify-center shadow-lg shadow-orange-500/40 transition
         group-hover:scale-110 transform;
}

.feature-title {
  @apply text-2xl font-bold text-slate-900;
}

.feature-description {
  @apply text-base leading-relaxed text-slate-600;
}

.categories-scroll {
  @apply flex gap-5 overflow-x-auto pb-4;
}

/* Đặt trong @layer và BỎ 'group' khỏi @apply */
@layer components {
  .category-pill {
    @apply min-w-[240px] rounded-xl border-2 border-slate-300
           bg-gradient-to-br from-white to-slate-50 px-6 py-5
           shadow-lg shadow-slate-900/10 transition hover:-translate-y-2
           hover:border-orange-500 hover:shadow-2xl hover:from-orange-50 hover:to-orange-100;
  }
}

.category-label {
  @apply text-lg font-bold text-slate-900 group-hover:text-orange-600;
}

.category-meta {
  @apply text-sm text-slate-600 mt-1;
}

.top-destination {
  @apply mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-800;
}

.top-destination-icon {
  @apply flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow;
}

.top-destination-list {
  @apply flex flex-wrap gap-x-6 gap-y-2;
}

.top-destination-item .city {
  @apply font-semibold;
}

.top-destination-item .detail {
  @apply text-emerald-700/80;
}

.featured-grid {
  @apply grid gap-8 md:grid-cols-2 lg:grid-cols-3;
}

.workflow-section {
  @apply bg-gradient-to-br from-blue-50 via-slate-50 to-orange-50 rounded-3xl border-2 border-slate-200;
}

.workflow-grid {
  @apply grid gap-8 md:grid-cols-3;
}

/* Đặt trong @layer và BỎ 'group' khỏi @apply */
@layer components {
  .workflow-step {
    @apply relative rounded-2xl border-2 border-slate-200 bg-white p-10
           shadow-xl shadow-slate-900/10 transition hover:-translate-y-2
           hover:shadow-2xl hover:border-blue-400;
  }
}

.workflow-step-number {
  @apply text-6xl font-black bg-gradient-to-br from-orange-400 to-orange-600 bg-clip-text text-transparent;
}

.workflow-step-title {
  @apply mt-5 text-2xl font-bold text-slate-900;
}

.workflow-step-description {
  @apply mt-3 text-base leading-relaxed text-slate-600;
}

.testimonials-section {
  @apply bg-slate-900 text-white rounded-[2.5rem];
}

.testimonial-grid {
  @apply grid gap-6 md:grid-cols-2;
}

.testimonial-card {
  @apply relative h-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur;
}

.testimonial-quote-icon {
  @apply mb-4 h-8 w-8 text-emerald-200;
}

.testimonial-quote {
  @apply text-base leading-relaxed text-white/90;
}

.testimonial-author {
  @apply mt-6 flex flex-col;
}

.testimonial-author .name {
  @apply font-semibold text-white;
}

.testimonial-author .role {
  @apply text-sm text-white/70;
}

.shop-invite {
  @apply relative;
}

.shop-invite-content {
  @apply flex flex-col gap-8 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-slate-800
         px-10 py-14 text-white shadow-2xl shadow-blue-900/40 border-2 border-blue-500/30
         lg:flex-row lg:items-center lg:justify-between;
}

.shop-invite-title {
  @apply text-4xl font-black leading-tight;
}

.shop-invite-subtitle {
  @apply mt-4 max-w-2xl text-lg text-blue-100 leading-relaxed;
}

.shop-invite-button {
  @apply inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600
         px-8 py-4 font-bold text-white shadow-2xl shadow-orange-500/50 transition
         hover:scale-105 hover:shadow-orange-500/70 transform;
}

.shop-form-wrapper {
  @apply pt-0;
}

.shop-form-card {
  @apply rounded-2xl border-2 border-slate-200 bg-white p-10 shadow-2xl shadow-slate-900/10;
}
