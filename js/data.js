/* =====================================================================
   VR FAST FOOD — CONTENU DU SITE
   ---------------------------------------------------------------------
   Tout le contenu modifiable est ici : coordonnées, horaires, catégories,
   plats, prix et photos. Aucun autre fichier n'est à toucher pour mettre
   le site à jour.

   ⚠ Les valeurs ci-dessous sont des EMPLACEMENTS À REMPLIR :
     - noms du type « Burger n° 1 », descriptions « à compléter » ;
     - prix à 0 (affichés « 0,00 € ») ;
     - coordonnées, horaires et réseaux vides (affichés « À compléter »).

   PHOTOS : déposer l'image dans assets/plats/ puis indiquer son chemin
   dans le champ « photo » du plat, par exemple :
       photo: 'assets/plats/burger-1.webp'
   Tant que « photo » est vide, la carte affiche un pictogramme.
   Format conseillé : 4:3, 800 × 600 px, WebP ou JPEG.
   ===================================================================== */

window.VR_DATA = {

  site: {
    nom: 'VR Fast Food',

    /* Envoi de la commande depuis « Ma commande ».
       - whatsapp : numéro au format international, sans « + » ni espaces (ex. 33612345678).
       - telephone : numéro à appeler pour commander (ex. 01 23 45 67 89).
       Si les deux sont vides, le panier indique que l'envoi n'est pas encore configuré. */
    commande: {
      whatsapp: '',
      telephone: ''
    },

    contact: {
      telephone: '',
      email: '',
      adresse: '',      // une ou plusieurs lignes séparées par \n
      lienCarte: ''     // lien Google Maps / Plans (facultatif : sinon généré depuis l'adresse)
    },

    reseaux: {
      instagram: '',    // adresse complète du profil, ex. https://www.instagram.com/…
      facebook: '',
      tiktok: '',
      snapchat: ''
    },

    /* Laisser « heures » vide tant que l'horaire n'est pas connu.
       Exemples de valeurs : '11h30 – 14h30 · 18h30 – 22h30' ou 'Fermé'. */
    horaires: [
      { jour: 'Lundi',    heures: '' },
      { jour: 'Mardi',    heures: '' },
      { jour: 'Mercredi', heures: '' },
      { jour: 'Jeudi',    heures: '' },
      { jour: 'Vendredi', heures: '' },
      { jour: 'Samedi',   heures: '' },
      { jour: 'Dimanche', heures: '' }
    ]
  },

  /* Catégories = « niveaux » de l'écran de sélection.
     icone : burger | menu | frites | boisson | dessert
     Chaque plat : id unique, nom, description, prix (nombre, en euros),
     populaire (true/false), photo (chemin ou vide). */
  categories: [
    {
      id: 'burgers',
      nom: 'Burgers',
      icone: 'burger',
      plats: [
        { id: 'burger-1', nom: 'Burger n° 1', description: 'Description du burger à compléter.', prix: 0, populaire: true,  photo: '' },
        { id: 'burger-2', nom: 'Burger n° 2', description: 'Description du burger à compléter.', prix: 0, populaire: true,  photo: '' },
        { id: 'burger-3', nom: 'Burger n° 3', description: 'Description du burger à compléter.', prix: 0, populaire: false, photo: '' },
        { id: 'burger-4', nom: 'Burger n° 4', description: 'Description du burger à compléter.', prix: 0, populaire: false, photo: '' },
        { id: 'burger-5', nom: 'Burger n° 5', description: 'Description du burger à compléter.', prix: 0, populaire: false, photo: '' },
        { id: 'burger-6', nom: 'Burger n° 6', description: 'Description du burger à compléter.', prix: 0, populaire: false, photo: '' }
      ]
    },
    {
      id: 'menus',
      nom: 'Menus',
      icone: 'menu',
      plats: [
        { id: 'menu-1', nom: 'Menu n° 1', description: 'Composition du menu à compléter.', prix: 0, populaire: true,  photo: '' },
        { id: 'menu-2', nom: 'Menu n° 2', description: 'Composition du menu à compléter.', prix: 0, populaire: false, photo: '' },
        { id: 'menu-3', nom: 'Menu n° 3', description: 'Composition du menu à compléter.', prix: 0, populaire: false, photo: '' }
      ]
    },
    {
      id: 'accompagnements',
      nom: 'Accompagnements',
      icone: 'frites',
      plats: [
        { id: 'accompagnement-1', nom: 'Accompagnement n° 1', description: 'Description à compléter.', prix: 0, populaire: true,  photo: '' },
        { id: 'accompagnement-2', nom: 'Accompagnement n° 2', description: 'Description à compléter.', prix: 0, populaire: false, photo: '' },
        { id: 'accompagnement-3', nom: 'Accompagnement n° 3', description: 'Description à compléter.', prix: 0, populaire: false, photo: '' },
        { id: 'accompagnement-4', nom: 'Accompagnement n° 4', description: 'Description à compléter.', prix: 0, populaire: false, photo: '' }
      ]
    },
    {
      id: 'boissons',
      nom: 'Boissons',
      icone: 'boisson',
      plats: [
        { id: 'boisson-1', nom: 'Boisson n° 1', description: 'Description à compléter.', prix: 0, populaire: false, photo: '' },
        { id: 'boisson-2', nom: 'Boisson n° 2', description: 'Description à compléter.', prix: 0, populaire: false, photo: '' },
        { id: 'boisson-3', nom: 'Boisson n° 3', description: 'Description à compléter.', prix: 0, populaire: false, photo: '' },
        { id: 'boisson-4', nom: 'Boisson n° 4', description: 'Description à compléter.', prix: 0, populaire: false, photo: '' }
      ]
    },
    {
      id: 'desserts',
      nom: 'Desserts',
      icone: 'dessert',
      plats: [
        { id: 'dessert-1', nom: 'Dessert n° 1', description: 'Description à compléter.', prix: 0, populaire: true,  photo: '' },
        { id: 'dessert-2', nom: 'Dessert n° 2', description: 'Description à compléter.', prix: 0, populaire: false, photo: '' },
        { id: 'dessert-3', nom: 'Dessert n° 3', description: 'Description à compléter.', prix: 0, populaire: false, photo: '' }
      ]
    }
  ]
};
