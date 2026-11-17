# VR Fast Food — À pleine bouche.

Refonte du site statique HTML/CSS/JavaScript : crème chaud, rouge profond, typographies Barlow Condensed et DM Sans, scène Three.js procédurale. Aucune étape de compilation ni dépendance à installer.

## Ouvrir l’aperçu

Dans ce dossier :

```sh
node serveur.mjs 4187
```

Ouvrir http://localhost:4187. Si ce port est occupé, choisir un autre numéro. Le serveur est réservé à l’aperçu local, écoute sur 127.0.0.1 et refuse les fichiers cachés. Pour héberger le site, publier `index.html`, `mentions-legales.html`, `css/`, `js/` et `assets/` sur un hébergement statique.

## Contenu authentique manquant

Le dépôt initial ne fournit **aucune donnée permettant de vérifier l’établissement**. « VR Fast Food » est le nom du projet, pas une identité juridique vérifiée. Les catégories viennent du projet initial et restent à confirmer. Aucun rapprochement avec un restaurant homonyme n’a été effectué.

À fournir : nom commercial confirmé, adresse, téléphone, e-mail, horaires, itinéraire, plats et compositions, prix, disponibilités, photos avec droit d’utilisation, numéro WhatsApp ou téléphone de commande et identité de l’éditeur/hébergeur. Les mentions légales restent à compléter.

Les anciens « Burger n° 1 » et prix à 0 € ont été retirés des données affichées. Les catégories vides montrent un état d’attente discret. Il n’existe aucun bouton de commande inopérant ni aucun plat fictif commandable.

## Publier la carte

Tout le contenu de la carte et les coordonnées se trouvent dans `js/data.js`. Ajouter uniquement des plats confirmés dans `plats` :

```js
{
  id: 'identifiant-unique',
  nom: 'Nom réel du plat',
  description: 'Composition confirmée par le restaurant',
  prix: 9.9, // Exemple de format, pas un prix du restaurant
  publie: true,
  disponible: true,
  photo: 'assets/plats/nom-du-plat.webp'
}
```

Un plat n’apparaît qu’avec `publie: true`. L’ajout nécessite un prix numérique fini strictement positif et `disponible` différent de `false`. Un prix manquant n’est jamais affiché comme 0 €. Les anciens articles inconnus ou non commandables sont retirés de la sélection au chargement.

Photos : format 4:3, 800 × 600 minimum, WebP/JPEG, environ 100–200 Ko si possible. Le texte « Photographie à venir » prend le relais si la photo manque ou échoue. Les photos ne sont ni générées ni substituées par des images qui prétendent représenter les vrais plats.

## Sélection et contact

La sélection est conservée dans `localStorage` (clé historique `vrff-commande`). Si le stockage est indisponible, elle fonctionne en mémoire. Quantités de 1 à 99, retrait, total calculé en centimes, vidage, focus clavier et fermeture par Échap/clic extérieur.

Configurer `site.commande.whatsapp` au format international et/ou `site.commande.telephone`. Sans numéro valide, un texte explique que la prise de commande est indisponible. WhatsApp **prépare** un message : le client doit l’envoyer puis attendre la confirmation du restaurant. Aucun paiement ni envoi automatique.

`site.contact` accepte `telephone`, `email`, `adresse` et `lienCarte`. Sans lien de carte, une recherche Google Maps est construite à partir de l’adresse renseignée. Les liens vides ne sont pas affichés. Les horaires sont une liste `{jour, heures}`.

## Scène 3D

`js/burger3d.js` : vraie géométrie Three.js, pain irrégulier et coloré par sommet, textures procédurales de pores et de grillé, sésame instancié, steak à relief, fromage déformé et salade ondulée. Trois éclairages, matériaux distincts, ombre de contact. Aucun modèle externe ni licence de modèle à gérer.

Le burger apparaît assemblé, s’ouvre légèrement puis se referme avec une interpolation sans rebond. Le bouton permet de rejouer la séquence. Parallaxe légère à la souris ; pas de rotation permanente.

- Import différé de Three.js, après proximité de la scène et disponibilité du navigateur.
- Pause hors écran et lorsque l’onglet est masqué ; arrêt aussi une fois la pose stabilisée.
- Résolution et détails adaptés au tactile/petit écran, adaptation supplémentaire si les premières images sont lentes.
- `prefers-reduced-motion` : pose assemblée fixe, aucune boucle, bouton de reprise masqué ; réaction aux changements du réglage.
- Économie de données, échec WebGL/import ou perte de contexte : visuel de secours, menu immédiatement utilisable.
- Aucun gestionnaire tactile ne bloque le défilement.

Le burger est une **composition illustrative**, pas un plat attesté de la carte. Son rendu reste procédural ; ce n’est pas un scan photographique.

## Ressources et licences

Tout est servi localement : Three.js 0.170.0 (MIT, `js/vendor/THREE-LICENSE.txt`), Barlow Condensed et DM Sans (SIL OFL, licences dans `assets/fonts/`). Pas de CDN, police externe, outil d’audience ou compte client. Les liens externes ne sont sollicités que lorsqu’un utilisateur les ouvre.

## Vérification

Voir `VERIFICATION.md` pour les contrôles réalisés et leurs limites. Les données de test ont été servies sur un serveur local distinct ; elles ne sont pas intégrées à `js/data.js` ni à l’aperçu livré.
