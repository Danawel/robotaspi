// =============================================================
//  CONFIGURATION CENTRALE DU BLOG
//  C'est LE seul fichier à modifier pour personnaliser ton blog.
// =============================================================

export const SITE = {
  // Nom du blog (affiché partout)
  name: 'RobotAspi',

  // Slogan / description courte
  tagline: 'Robots aspirateurs : comparatifs, guides et bons plans pour une maison toujours propre',

  // Description longue (SEO, balise meta description de l'accueil)
  description:
    'RobotAspi publie chaque jour des guides, comparatifs et conseils pour bien choisir ' +
    'son robot aspirateur : robots laveurs, stations à vidange automatique, navigation laser, ' +
    'aspiration puissante et modèles pour poils d\'animaux. Bien choisir, comparer et économiser.',

  // URL FINALE du blog (Cloudflare Pages)
  url: 'https://robotaspi.pages.dev',

  // Langue
  lang: 'fr',

  // Auteur affiché
  author: 'La rédaction RobotAspi',
};

// =============================================================
//  AFFILIATION AMAZON
// =============================================================
export const AMAZON = {
  // TON TAG Amazon Partenaires (Associates).
  // Tant que tu n'as pas ton compte, laisse ce placeholder :
  // les liens fonctionneront mais ne rapporteront rien.
  // Quand tu as ton vrai tag (ex: 'robotaspi-21'), remplace-le ici : tout se met à jour.
  tag: 'robotaspi-21',

  // Domaine Amazon utilisé (France par défaut)
  domain: 'www.amazon.fr',

  // Mention légale obligatoire imposée par Amazon (affichée en haut de chaque article).
  disclosure:
    "En tant que Partenaire Amazon, je réalise un bénéfice sur les achats remplissant " +
    "les conditions requises. Ce guide contient des liens affiliés : si vous achetez via " +
    "l'un de ces liens, cela ne vous coûte pas plus cher et nous soutient.",
};

// =============================================================
//  STATISTIQUES DE VISITES (Cloudflare Web Analytics — gratuit)
//  Colle ici le "token" fourni par Cloudflare pour activer le compteur.
//  Laisse vide pour désactiver.
// =============================================================
export const ANALYTICS = {
  cloudflareToken: '',

  // Google Analytics 4 (GRATUIT) : compte les visites ET les clics sur les liens Amazon.
  // 1) Crée un compte sur https://analytics.google.com  2) Crée une propriété pour ton site
  // 3) Copie l'identifiant de mesure (format G-XXXXXXXXXX) et colle-le ci-dessous.
  // Laisse vide pour désactiver.
  gaMeasurementId: '',
};

// =============================================================
//  NOS AUTRES BLOGS (affichés en bas de chaque page)
//  Ajoute ici tes autres sites : ils se croisent pour envoyer
//  du trafic de l'un à l'autre. emoji = petite vignette.
// =============================================================
export const OTHER_BLOGS = [
  {
    name: 'MaisonFraîche',
    tagline: 'Clim, rafraîchisseurs & déshumidificateurs',
    product: 'Garder sa maison au frais l\'été',
    url: 'https://sage-chimera-00671a.netlify.app',
    emoji: '❄️',
  },
  {
    name: 'AirFryGuide',
    tagline: 'Air fryers : guides & recettes',
    product: 'Les meilleures friteuses sans huile',
    url: 'https://statuesque-lolly-d520d0.netlify.app',
    emoji: '🍟',
  },
];

// Construit une URL affiliée propre à partir d'un ASIN (identifiant produit Amazon)
export function amazonLink(asin: string): string {
  return `https://${AMAZON.domain}/dp/${asin}?tag=${AMAZON.tag}`;
}
