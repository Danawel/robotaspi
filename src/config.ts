// =============================================================
//  CONFIGURATION CENTRALE DU BLOG
//  C'est LE seul fichier à modifier pour personnaliser ton blog.
// =============================================================

export const SITE = {
  // Nom du blog (affiché partout)
  name: 'RobotAspi',

  // Slogan / description courte
  tagline: 'Robots aspirateurs : comparatifs, guides et bons plans pour une maison toujours propre',

  // Grand titre affiché en haut de la page d'accueil
  heroTitle: 'Le bon robot aspirateur pour une maison propre sans effort',

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
  author: 'Danaël',
};

// =============================================================
//  AFFILIATION AMAZON
// =============================================================
export const AMAZON = {
  // TON TAG Amazon Partenaires (Associates).
  // Tant que tu n'as pas ton compte, laisse ce placeholder :
  // les liens fonctionneront mais ne rapporteront rien.
  // Quand tu as ton vrai tag (ex: 'robotaspi-21'), remplace-le ici : tout se met à jour.
  tag: 'robotaspi05-21',

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
  gaMeasurementId: 'G-RVP1TRMD0C',
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
    url: 'https://maisonfraiche.pages.dev',
    emoji: '❄️',
  },
  {
    name: 'AirFryGuide',
    tagline: 'Air fryers : guides & recettes',
    product: 'Les meilleures friteuses sans huile',
    url: 'https://airfryguide.pages.dev',
    emoji: '🍟',
  },
];

// Construit une URL affiliée propre à partir d'un ASIN (identifiant produit Amazon)
export function amazonLink(asin: string): string {
  return `https://${AMAZON.domain}/dp/${asin}?tag=${AMAZON.tag}`;
}

// =============================================================
//  AUTEUR (affiché sur les articles et la page À propos)
//  Un auteur nommé rassure le lecteur et améliore le référencement.
//  Change le nom/bio si tu veux : c'est le seul endroit à modifier.
// =============================================================
export const AUTHOR = {
  name: 'Danaël',
  role: `Fondateur & rédacteur de ${SITE.name}`,
  avatarInitial: 'D',
  bio:
    "Fan de domotique et d'objets qui simplifient le quotidien, je passe au crible les robots aspirateurs. " +
    "Sur RobotAspi, je compare les modèles pour vous éviter les mauvaises surprises et les dépenses inutiles.",
};

// =============================================================
//  MENTIONS LÉGALES (éditeur + hébergeur)
//  Complète "editor" avec ton nom complet si tu le souhaites.
// =============================================================
export const LEGAL = {
  editor: 'Danaël',
  status: 'Éditeur individuel (particulier)',
  email: 'Danashopify0075@gmail.com',
  hostName: 'Cloudflare, Inc.',
  hostAddress: '101 Townsend Street, San Francisco, CA 94107, États-Unis',
  hostSite: 'https://www.cloudflare.com',
};
