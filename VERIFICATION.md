# Vérifications — 17 novembre 2026

Contrôles dans le navigateur Chromium intégré, aux formats ordinateur 1440 × 1000 et téléphone simulé 390 × 844 / 375 × 812.

- Accueil, scène WebGL, navigation mobile, ancres et onglets au clavier : vérifiés.
- Aucun débordement horizontal constaté aux dimensions contrôlées.
- Aucune erreur de console sur la page principale lors du contrôle.
- Panier testé sur une page locale isolée : ajout, incrément, retrait, total (2 × 9,90 € + 4,50 € = 24,30 €), persistance après rechargement, vidage, fermeture par Échap et retour du focus.
- Prix zéro non commandable et plat non publié masqué : vérifiés avec les données isolées.
- Liens téléphone et WhatsApp générés et inspectés, sans appel ni envoi. Lien de carte sans configuration corrigé et vérifié.
- Image manquante : remplacement par le texte discret vérifié.
- WebGL désactivé par simulation : secours affiché et menu utilisable.
- Préférence de mouvement réduit simulée : scène fixe, bouton de reprise masqué et zéro callback d’animation.
- Pause hors écran : compteur de callbacks stable pendant deux observations séparées.

Limites : aucun téléphone physique, Safari ou Firefox testé. Le réglage système de mouvement réduit a été simulé, pas modifié. La pause lorsque l’onglet est masqué et la récupération après perte de contexte sont implémentées mais n’ont pas fait l’objet d’une validation instrumentée complète. Aucun envoi réel, paiement ou traitement de commande n’existe dans le site. Aucun renseignement commercial n’a pu être authentifié depuis le dépôt fourni.

Les données de test ne sont pas présentes dans la carte livrée. Le burger est une composition procédurale illustrative, pas un scan ni une photographie d’un plat réel du restaurant.
