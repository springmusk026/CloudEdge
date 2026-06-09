// Minimal i18n — admin UI string translations
const translations: Record<string, Record<string, string>> = {
  en: {
    'dashboard': 'Dashboard', 'posts': 'Posts', 'media': 'Media', 'comments': 'Comments',
    'newsletter': 'Newsletter', 'tags': 'Tags', 'users': 'Users', 'analytics': 'Analytics',
    'settings': 'Settings', 'customize': 'Customize', 'activity': 'Activity', 'health': 'Health',
    'new_post': 'New Post', 'save_draft': 'Save Draft', 'publish': 'Publish', 'delete': 'Delete',
    'sign_out': 'Sign out', 'sign_in': 'Sign In', 'search': 'Search', 'all_statuses': 'All statuses',
    'featured': 'Featured', 'scheduled': 'Scheduled', 'published': 'Published', 'draft': 'Draft',
    'archived': 'Archived', 'approve': 'Approve', 'spam': 'Spam', 'loading': 'Loading...',
  },
  es: {
    'dashboard': 'Panel', 'posts': 'Entradas', 'media': 'Medios', 'comments': 'Comentarios',
    'newsletter': 'Boletín', 'tags': 'Etiquetas', 'users': 'Usuarios', 'analytics': 'Analítica',
    'settings': 'Ajustes', 'customize': 'Personalizar', 'activity': 'Actividad', 'health': 'Salud',
    'new_post': 'Nueva entrada', 'save_draft': 'Guardar borrador', 'publish': 'Publicar', 'delete': 'Eliminar',
    'sign_out': 'Cerrar sesión', 'sign_in': 'Iniciar sesión', 'search': 'Buscar', 'all_statuses': 'Todos',
    'featured': 'Destacado', 'scheduled': 'Programado', 'published': 'Publicado', 'draft': 'Borrador',
    'archived': 'Archivado', 'approve': 'Aprobar', 'spam': 'Spam', 'loading': 'Cargando...',
  },
  fr: {
    'dashboard': 'Tableau de bord', 'posts': 'Articles', 'media': 'Médias', 'comments': 'Commentaires',
    'newsletter': 'Newsletter', 'tags': 'Tags', 'users': 'Utilisateurs', 'analytics': 'Analytique',
    'settings': 'Paramètres', 'customize': 'Personnaliser', 'activity': 'Activité', 'health': 'Santé',
    'new_post': 'Nouvel article', 'save_draft': 'Enregistrer', 'publish': 'Publier', 'delete': 'Supprimer',
    'sign_out': 'Déconnexion', 'sign_in': 'Connexion', 'search': 'Rechercher', 'all_statuses': 'Tous',
    'featured': 'Vedette', 'scheduled': 'Planifié', 'published': 'Publié', 'draft': 'Brouillon',
    'archived': 'Archivé', 'approve': 'Approuver', 'spam': 'Spam', 'loading': 'Chargement...',
  },
};

let currentLocale = localStorage.getItem('cloudedge-locale') || 'en';

export function setLocale(locale: string) {
  currentLocale = locale;
  localStorage.setItem('cloudedge-locale', locale);
}

export function getLocale() { return currentLocale; }
export function getLocales() { return Object.keys(translations); }

export function t(key: string): string {
  return translations[currentLocale]?.[key] || translations.en[key] || key;
}
