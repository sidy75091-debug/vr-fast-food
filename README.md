# VR Fast Food — site vitrine

Fast-food présenté comme un univers de jeu vidéo, en version lumineuse : fond crème, rouge tomate, jaune soleil, orange, touches de menthe. Burger 3D en vedette, menu façon « écran de sélection », commande en quelques gestes.

Site statique : HTML, CSS et JavaScript sans étape de construction ni paquet à installer.

## Lancer l'aperçu

    node serveur.mjs

Puis ouvrir http://localhost:4173 (autre port : `node serveur.mjs 8080`). N'importe quel hébergement statique convient pour la mise en ligne : il suffit d'envoyer le dossier tel quel (`serveur.mjs` et ce README ne sont pas nécessaires en ligne).

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `js/data.js` | **Tout le contenu** : coordonnées, horaires, réseaux, catégories, plats, prix, photos |
| `index.html` | Structure de la page, textes d'accueil, pictogrammes, illustration de secours du burger |
| `css/style.css` | Direction artistique (couleurs et réglages en haut du fichier, section « Jetons ») |
| `js/main.js` | Onglets, cartes, « Ma commande », infos pratiques, apparitions au défilement |
| `js/burger3d.js` | Burger 3D de l'accueil (Three.js, construit en code) |
| `mentions-legales.html` | Page légale à compléter |
| `assets/plats/` | Dossier des photos des plats |

## Contenu à remplir

Le site a été créé sans données existantes : rien n'a été inventé. `js/data.js` contient donc des **emplacements** :

- plats nommés « Burger n° 1 », « Menu n° 2 »… avec un prix à `0` (affiché « 0,00 € ») ;
- coordonnées, horaires et réseaux vides, affichés « À compléter » sur la page ;
- numéro de commande vide : le panneau « Ma commande » indique que l'envoi n'est pas encore activé.

À renseigner avant la mise en ligne :

1. `site.commande.whatsapp` et/ou `site.commande.telephone` — active le bouton « Envoyer sur WhatsApp » (message pré-rempli avec la commande, que le client envoie lui-même) et/ou « Appeler ».
2. `site.contact`, `site.reseaux`, `site.horaires`.
3. `categories` : noms, descriptions, prix, `populaire: true` pour les plats à mettre en avant (badge + onglet « Populaires »).
4. `mentions-legales.html`.

Les cinq catégories (Burgers, Menus, Accompagnements, Boissons, Desserts) sont des exemples : on peut en ajouter, en retirer ou les renommer, les onglets et le bandeau défilant suivent. Icônes disponibles : `burger`, `menu`, `frites`, `boisson`, `dessert`.

## Ajouter les photos des plats

1. Déposer l'image dans `assets/plats/` (format 4:3, par exemple 800 × 600 px, WebP ou JPEG, sujet centré).
2. Dans `js/data.js`, renseigner le champ `photo` du plat :

       { id: 'burger-1', nom: '…', prix: 9.9, populaire: true, photo: 'assets/plats/burger-1.webp' }

C'est tout : la carte et la vignette du panier affichent la photo, recadrée pour remplir l'emplacement. Tant que `photo` est vide — ou si le fichier est introuvable — la carte garde le pictogramme de la catégorie et la mention « Photo à venir ». Dans le code, l'emplacement est l'élément `.card__media` (attribut `data-photo-slot`), généré par `photoSlot()` dans `js/main.js`.

## Burger 3D

- Scène construite en code dans `js/burger3d.js` : pain, salade, oignons, tomates, fromage, steak, pain, plus quelques ingrédients qui flottent autour. Aucun fichier 3D, aucune photo.
- Réglages utiles : `GAP` (écart entre les ingrédients), les couleurs passées à `std(0x…)`, la vitesse de rotation dans `update()`.
- Un clic sur le burger le referme un instant.
- Pour le remplacer par une vraie image ou un modèle : tout se passe dans le bloc `#burgerStage` de `index.html`. L'illustration SVG `.stage__fallback` sert d'image de secours et peut être remplacée par une `<img>`.

Adaptations automatiques :

| Situation | Comportement |
| --- | --- |
| Petit écran ou écran tactile | Résolution plafonnée, pas d'ombres portées, moins d'objets |
| Appareil qui peine | Résolution et ombres réduites après quelques secondes |
| Burger hors de l'écran, onglet masqué | Rendu en pause |
| « Réduire les animations » activé | Image 3D fixe ; plus de défilement, d'inclinaison ni d'apparitions animées |
| Pas de WebGL, économie de données, bibliothèque injoignable | Illustration SVG du burger |

## Services externes

- Polices *Lilita One* et *Nunito* : feuille de style Bunny Fonts (`fonts.bunny.net`), qui fait charger les fichiers de police depuis jsDelivr (`cdn.jsdelivr.net`).
- Three.js 0.170 : jsDelivr (`cdn.jsdelivr.net`), chargé seulement quand le burger 3D peut s'afficher.

Pour tout héberger soi-même : copier les polices et `three.module.min.js` dans le projet, puis modifier les deux balises `<link>` de police et la constante `THREE_URL` en haut de `js/burger3d.js`.

## Vérifications effectuées

Dans Chromium, en 1360 × 800 et en 375 × 812 (tailles simulées, pas de téléphone physique) :

- burger 3D affiché, aucune erreur dans la console, pas de défilement horizontal ;
- onglets à la souris et au clavier (flèches, Début, Fin), flèches précédent/suivant ;
- ajout, quantités, retrait, vidage de la commande ; conservation après rechargement ;
- panneau « Ma commande » : ouverture, fermeture par bouton, clic à l'extérieur et Échap, retour du focus ;
- liens WhatsApp et téléphone générés quand un numéro est renseigné ;
- photo de plat affichée, et retour au pictogramme si le fichier manque ;
- ancres de navigation, page des mentions légales, menu mobile.

Non vérifié : le réglage système « Réduire les animations » (seul le rendu fixe du burger a été testé en simulant ce réglage), Safari et Firefox, un vrai téléphone.
