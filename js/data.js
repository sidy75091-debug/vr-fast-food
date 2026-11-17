/* Only enter restaurant-confirmed information here.
   A dish is shown only with publie: true; it is selectable only with a finite prix > 0.
   Example shape (not live data):
   {id: 'unique-id', nom: 'Nom confirmé', description: 'Composition confirmée',
    prix: 9.9, publie: true, disponible: true, photo: 'assets/plats/nom.webp'}
   The category names below are inherited from the original project, pending validation.
*/
window.VR_DATA = {
  site: {
    nom: 'VR Fast Food',
    commande: {whatsapp: '', telephone: ''},
    contact: {telephone: '', email: '', adresse: '', lienCarte: ''},
    reseaux: {}, horaires: []
  },
  categories: [
    {id: 'burgers', nom: 'Burgers', plats: []},
    {id: 'menus', nom: 'Menus', plats: []},
    {id: 'accompagnements', nom: 'Accompagnements', plats: []},
    {id: 'boissons', nom: 'Boissons', plats: []},
    {id: 'desserts', nom: 'Desserts', plats: []}
  ]
};
