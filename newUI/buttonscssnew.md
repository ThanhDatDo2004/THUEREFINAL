.btn {
  @apply inline-flex items-center justify-center rounded-xl px-6 py-3 font-bold transition-all transform;
}
.btn-primary {
  @apply btn bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40 hover:shadow-xl hover:shadow-orange-500/50 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100;
}
.btn-danger {
  @apply btn bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-500/40 hover:shadow-xl hover:shadow-rose-500/50 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100;
}
.btn-outline {
  @apply btn border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400;
}
.btn-link {
  @apply text-orange-600 hover:text-orange-700 font-bold;
}
.filter-toggle {
  @apply flex items-center space-x-2 text-slate-600 hover:text-orange-600 font-bold mb-4;
}
