// =====================================================================
//  GÉNÉRATEUR D'ARTICLE QUOTIDIEN (via l'API Claude)
//  Produit 1 guide/comparatif/article de ~2500 mots optimisé SEO,
//  intègre les produits Amazon, et enregistre un fichier Markdown.
//
//  Utilisation :
//    node scripts/generate-article.mjs          -> 1 article daté d'aujourd'hui
//    node scripts/generate-article.mjs --batch  -> 5 articles (pour créer un stock)
//
//  Prérequis : une clé API Anthropic dans la variable ANTHROPIC_API_KEY.
// =====================================================================

import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'src', 'content', 'articles');

// Modèle utilisé. claude-opus-5 = qualité maximale.
// Pour réduire fortement le coût par article, remplace par 'claude-sonnet-5'.
const MODEL = 'claude-sonnet-5';

const client = new Anthropic(); // lit automatiquement ANTHROPIC_API_KEY

// ---- Utilitaires -----------------------------------------------------

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // retire les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 70);
}

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function loadJSON(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

// Normalise un texte pour comparaison (minuscules, sans accents ni ponctuation).
function normText(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Marques concurrentes à ne jamais citer si elles n'ont pas de fiche dans l'article.
const COMPETITOR_BRANDS = [
  'philips', 'tefal', 'seb', 'rowenta', 'delonghi', 'russell hobbs', 'proscenic',
  'aigostar', 'aeg', 'electrolux', 'samsung', 'lg', 'whirlpool', 'irobot', 'roomba',
  'roborock', 'dreame', 'ecovacs', 'dyson', 'xiaomi', 'eufy', 'shark', 'daewoo',
  'klarstein', 'trotec', 'inventor', 'midea', 'daikin', 'ariston', 'olimpia', 'cosori',
  'ninja', 'moulinex', 'temprium', 'rowenta', 'hoover', 'bissell',
];

// Contrôle de cohérence texte <-> fiches produits.
// Renvoie la liste des problèmes (vide = tout est cohérent).
function coherenceProblems(body, featured) {
  const nbody = normText(body);
  const problems = [];
  // 1) Chaque fiche produit DOIT être nommée dans le texte.
  for (const p of featured) {
    const cands = [p.shortName, p.name].filter(Boolean).map(normText);
    if (!cands.some((c) => c && nbody.includes(c))) {
      problems.push(`fiche jamais citée dans le texte : « ${p.shortName || p.name} »`);
    }
  }
  // 2) Aucune marque concurrente sans fiche ne doit apparaître dans le texte.
  const featuredText = normText(featured.map((p) => `${p.name} ${p.shortName || ''}`).join(' '));
  for (const b of COMPETITOR_BRANDS) {
    const nb = normText(b);
    if (!featuredText.includes(nb) && new RegExp(`(^| )${nb}( |$)`).test(nbody)) {
      problems.push(`marque citée sans fiche produit : « ${b} »`);
    }
  }
  return problems;
}

// Trouve le prochain sujet non encore rédigé
function nextTopic(topics) {
  const existing = new Set(fs.readdirSync(ARTICLES_DIR).map((f) => f.replace(/\.md$/, '')));
  return topics.find((t) => !existing.has(slugify(t.title)));
}

// Combien de sujets restent à rédiger
function remainingCount(topics) {
  const existing = new Set(fs.readdirSync(ARTICLES_DIR).map((f) => f.replace(/\.md$/, '')));
  return topics.filter((t) => !existing.has(slugify(t.title))).length;
}

// ---- Réappro automatique de sujets (le blog ne tombe jamais à court) ----
async function replenishTopics(existingTopics, howMany = 20) {
  const products = loadJSON('src/data/products.json').products;
  const asins = products.map((p) => `${p.asin} = ${p.shortName} (${p.bestFor})`).join('\n');
  const existingTitles = existingTopics.map((t) => t.title).join('\n');

  const prompt = `Tu génères des idées d'articles pour un blog français nommé RobotAspi, spécialisé dans les robots aspirateurs de maison : robots aspirateurs laveurs, stations à vidange automatique, navigation laser (LiDAR), aspiration puissante, entretien et modèles adaptés aux poils d'animaux.

Propose ${howMany} NOUVEAUX sujets d'articles, DIFFÉRENTS de ceux déjà traités ci-dessous, à fort potentiel SEO (questions que les gens tapent sur Google).

SUJETS DÉJÀ TRAITÉS (ne pas répéter) :
${existingTitles}

PRODUITS DISPONIBLES (utilise leurs ASIN dans le champ "products" quand c'est pertinent) :
${asins}

Réponds UNIQUEMENT avec un tableau JSON valide (aucun texte autour, aucune balise de code). Chaque élément a exactement cette forme :
{"title": "…", "type": "guide|comparatif|article", "keywords": ["…","…","…"], "products": ["ASIN", "…"]}
Le champ "products" peut être vide [] pour les sujets généraux (réglementation, entretien, conseils).`;

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 4000,
    system: 'Tu es un expert SEO francophone. Tu réponds toujours par du JSON strict, sans commentaire.',
    messages: [{ role: 'user', content: prompt }],
  });
  const message = await stream.finalMessage();
  let raw = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  raw = raw.replace(/^```(json)?/i, '').replace(/```$/,'').trim();

  let fresh;
  try {
    fresh = JSON.parse(raw);
  } catch (e) {
    console.error('⚠️  Impossible de parser les nouveaux sujets, réappro ignorée.');
    return existingTopics;
  }

  // Dédoublonnage par slug de titre
  const seen = new Set(existingTopics.map((t) => slugify(t.title)));
  const added = fresh.filter((t) => t && t.title && !seen.has(slugify(t.title)));
  const merged = existingTopics.concat(added);
  fs.writeFileSync(path.join(ROOT, 'scripts/topics.json'), JSON.stringify(merged, null, 2) + '\n', 'utf8');
  console.log(`🔄 Réappro : ${added.length} nouveaux sujets ajoutés (total ${merged.length}).`);
  return merged;
}

// ---- Génération d'un article ----------------------------------------

async function generateOne(topic, dateISO) {
  const allProducts = loadJSON('src/data/products.json').products;
  const featured = allProducts.filter((p) => (topic.products || []).includes(p.asin));

  const productContext = featured.length
    ? featured
        .map(
          (p) =>
            `- ${p.name} : ${p.capacity}, ${p.power}, idéal pour ${p.bestFor}, prix indicatif ${p.priceHint}. ${p.highlight}`
        )
        .join('\n')
    : '(aucun produit spécifique à mentionner nommément dans cet article)';

  const system =
    "Tu es un rédacteur web francophone expert en robots aspirateurs et entretien de la maison, spécialisé dans les " +
    "robots aspirateurs laveurs, les stations à vidange automatique, la navigation laser (LiDAR) et par caméra, " +
    "l'aspiration (mesurée en pascals/Pa), les brosses anti-enchevêtrement et l'entretien du logement, " +
    "ainsi que dans le référencement naturel (SEO). " +
    "Tu maîtrises le choix selon le type de sol (parquet, carrelage, tapis), la surface et les étages, la puissance " +
    "d'aspiration, l'autonomie de la batterie, la gestion des poils d'animaux, les applications de contrôle et " +
    "l'entretien courant. Tu écris pour un blog grand public : ton clair, concret, utile, sans blabla ni promesses " +
    "exagérées. Tu ne mens jamais sur les caractéristiques d'un produit et tu n'inventes pas de prix précis.";

  const allowedNames = featured.map((p) => p.name).join(' | ') || '(aucun modèle précis)';

  const user = `Rédige un article de blog en français d'environ 2500 mots.

TITRE : « ${topic.title} »
TYPE : ${topic.type}
MOTS-CLÉS SEO à intégrer naturellement : ${(topic.keywords || []).join(', ')}

PRODUITS AUTORISÉS — ce sont les SEULS modèles que tu as le droit de nommer, avec leur nom EXACT :
${productContext}

RÈGLES ABSOLUES DE COHÉRENCE (impératif, l'article sera rejeté sinon) :
- Nomme CHACUN de ces produits au moins une fois, en reprenant EXACTEMENT son nom : ${allowedNames}.
- N'invente JAMAIS d'autre modèle, référence ou numéro (ex : « X 3000 », « Y Pro »). Interdiction de citer une marque ou un modèle concurrent précis absent de la liste ci-dessus.
- Pour évoquer des alternatives, reste générique : « un modèle d'entrée de gamme », « un appareil premium », sans nom de marque.
- Si tu fais un tableau comparatif, il doit contenir EXACTEMENT ces produits (mêmes noms), et aucun autre.
- N'utilise que les caractéristiques fournies ci-dessus ; n'invente pas de specs ni de prix précis.

CONSIGNES DE RÉDACTION :
- Commence directement par un paragraphe d'introduction accrocheur (PAS de titre H1, il est déjà géré).
- Structure avec des sous-titres en Markdown : ## pour les grandes sections, ### pour les sous-sections.
- Inclus un tableau comparatif en Markdown des produits autorisés si le sujet s'y prête.
- Utilise des listes à puces pour aérer.
- Style pédagogique, phrases claires, paragraphes courts.
- N'écris PAS de section "où acheter" ni de lien : des encarts produits avec liens seront ajoutés automatiquement à la fin.
- Termine par une courte conclusion pratique.
- Vise ~2500 mots, riche et complet.
- Réponds UNIQUEMENT avec le corps de l'article en Markdown (aucune balise de code, aucun commentaire, pas de frontmatter).`;

  // Appelle le modèle. `reminder` = rappel supplémentaire ajouté en cas de 2e tentative.
  async function runModel(reminder) {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      system,
      messages: [{ role: 'user', content: user + reminder }],
    });
    const message = await stream.finalMessage();
    return message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
  }

  // 1re écriture, puis contrôle de cohérence texte <-> fiches produits.
  let body = await runModel('');
  let problems = coherenceProblems(body, featured);
  if (problems.length) {
    console.log(`♻️  Incohérence détectée → 2e tentative stricte (${problems.join(' ; ')})`);
    body = await runModel(
      `\n\nIMPORTANT : ta version précédente a oublié des modèles imposés ou nommé des modèles interdits. ` +
        `Recommence en ne nommant QUE : ${allowedNames}. N'invente aucun autre modèle ni marque.`
    );
    problems = coherenceProblems(body, featured);
  }
  // Toujours incohérent après 2 essais : on BLOQUE la publication (aucun fichier écrit).
  if (problems.length) {
    throw new Error(
      `PUBLICATION BLOQUÉE — incohérence texte/fiches pour « ${topic.title} » : ${problems.join(' ; ')}`
    );
  }

  // Génère une meta-description courte (< 160 caractères) à partir du 1er paragraphe
  const firstPara = body.split('\n').find((l) => l.trim().length > 40) || topic.title;
  const description = firstPara.replace(/[#*_>`]/g, '').trim().slice(0, 155);

  const slug = slugify(topic.title);
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(topic.title)}`,
    `description: ${JSON.stringify(description)}`,
    `pubDate: ${dateISO}`,
    `type: ${topic.type}`,
    `products: ${JSON.stringify(topic.products || [])}`,
    `keywords: ${JSON.stringify(topic.keywords || [])}`,
    '---',
    '',
  ].join('\n');

  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  fs.writeFileSync(filePath, frontmatter + body + '\n', 'utf8');
  console.log(`✅ Article créé : ${slug}.md  (${body.split(/\s+/).length} mots, publié le ${dateISO})`);
  return filePath;
}

// ---- Programme principal --------------------------------------------

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ La variable ANTHROPIC_API_KEY n\'est pas définie. Ajoute ta clé API Anthropic.');
    process.exit(1);
  }

  fs.mkdirSync(ARTICLES_DIR, { recursive: true }); // s'assure que le dossier existe
  let topics = loadJSON('scripts/topics.json');
  const batch = process.argv.includes('--batch');
  const count = batch ? 5 : 1;

  // Si la réserve de sujets est basse, le blog en génère lui-même (100% autonome).
  if (remainingCount(topics) < count + 3) {
    console.log('ℹ️  Réserve de sujets basse : génération automatique de nouveaux sujets…');
    topics = await replenishTopics(topics);
  }

  for (let i = 0; i < count; i++) {
    let topic = nextTopic(topics);
    if (!topic) {
      // Dernier filet de sécurité : on réapprovisionne à la volée puis on réessaie.
      topics = await replenishTopics(topics);
      topic = nextTopic(topics);
      if (!topic) {
        console.log('ℹ️  Aucun sujet disponible même après réappro. On s\'arrête.');
        break;
      }
    }
    // En mode batch, on échelonne les dates pour publier 1 par jour.
    await generateOne(topic, todayISO(batch ? i : 0));
  }
}

main().catch((err) => {
  console.error('Erreur :', err);
  process.exit(1);
});
