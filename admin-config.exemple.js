/* =============================================================
   Coordonnées bancaires de NS Development — MODÈLE

   Ce fichier-ci est versionné et ne contient rien de sensible.
   Copiez-le en `admin-config.js` (ignoré par git) et remplissez les
   vraies valeurs. C'est ce fichier-là que lit l'espace admin pour
   composer le pied de page des devis et des factures.

       cp admin-config.exemple.js admin-config.js

   Pourquoi ne pas laisser l'IBAN dans le code : `espace-client-admin.html`
   est un fichier statique. Le jour où le site part sur nsdevelopment.lu,
   tout ce qui est écrit dedans devient lisible par n'importe qui via
   « afficher le code source ». L'IBAN n'est pas un secret — il figure sur
   chaque facture — mais il n'a rien à faire en libre-service sur le web :
   c'est ce qui alimente les faux virements et les tentatives de
   prélèvement.
   ============================================================= */
window.NS_BANQUE = {
  iban: 'LU00 0000 0000 0000 0000',
  bic:  'XXXXXXXX'
};
