/* =============================================================
   NS Development — multilingue
   Langues du Luxembourg : FR · LX (Lëtzebuergesch, code ISO 'lb') · DE · EN · PT

   Fonctionnement : le dictionnaire est indexé par le texte français.
   Le script parcourt les textes de la page et remplace ceux qu'il
   trouve dans le dictionnaire. Rien à baliser dans le HTML.

   Pour ajouter une phrase : copier le texte français exact comme clé,
   puis donner les quatre traductions. Une clé absente reste en français.

   ⚠️ Les traductions luxembourgeoises (lb) sont à faire relire par un
   locuteur natif avant la mise en ligne. Elles sont marquées À RELIRE
   dans le suivi projet.
   ============================================================= */

const NS_LANGS = [
  { code:'fr', label:'FR', nom:'Français' },
  { code:'lb', label:'LX', nom:'Lëtzebuergesch' },   // code ISO 'lb', affiché LX au choix de Nelson
  { code:'de', label:'DE', nom:'Deutsch' },
  { code:'en', label:'EN', nom:'English' },
  { code:'pt', label:'PT', nom:'Português' }
];

const NS_I18N = {
  /* ---------- Navigation ---------- */
  "Services":            {lb:"Servicer",        de:"Leistungen",   en:"Services",     pt:"Serviços"},
  "Réalisations":        {lb:"Realisatiounen",  de:"Referenzen",   en:"Our work",     pt:"Realizações"},
  "Exemples":            {lb:"Beispiller",      de:"Beispiele",    en:"Examples",     pt:"Exemplos"},
  "Méthode":             {lb:"Method",          de:"Vorgehen",     en:"Method",       pt:"Método"},
  "Tarifs":              {lb:"Präisser",        de:"Preise",       en:"Pricing",      pt:"Preços"},
  "Simulateur":          {lb:"Simulateur",      de:"Rechner",      en:"Estimator",    pt:"Simulador"},
  "Contact":             {lb:"Kontakt",         de:"Kontakt",      en:"Contact",      pt:"Contacto"},
  "Espace client":       {lb:"Client-Beräich",  de:"Kundenbereich",en:"Client area",  pt:"Área cliente"},
  "Devis gratuit":       {lb:"Gratis Offert",   de:"Kostenlos anfragen", en:"Free quote", pt:"Orçamento grátis"},
  "Navigation":          {lb:"Navigatioun",     de:"Navigation",   en:"Navigation",   pt:"Navegação"},

  /* ---------- Hero ---------- */
  "Agence web · Luxembourg": {lb:"Web-Agence · Lëtzebuerg", de:"Webagentur · Luxemburg", en:"Web agency · Luxembourg", pt:"Agência web · Luxemburgo"},
  "Des sites web qui font": {lb:"Websäite déi Iech", de:"Webseiten, die Ihnen", en:"Websites that bring", pt:"Sites que trazem"},
  "venir vos clients.":     {lb:"Clientë bréngen.", de:"Kunden bringen.", en:"you customers.", pt:"clientes até si."},
  "NS Development crée des sites modernes, rapides et multilingues pour les commerçants, restaurants et indépendants du Luxembourg. Livrés vite, pensés pour vendre.":
    {lb:"NS Development mécht modern, séier a méisproocheg Websäite fir Geschäftsleit, Restauranten a Selbststänneger zu Lëtzebuerg. Séier geliwwert, gemaach fir ze verkafen.",
     de:"NS Development erstellt moderne, schnelle und mehrsprachige Webseiten für Händler, Restaurants und Selbstständige in Luxemburg. Schnell geliefert, zum Verkaufen gemacht.",
     en:"NS Development builds modern, fast and multilingual websites for shops, restaurants and self-employed professionals in Luxembourg. Delivered fast, designed to sell.",
     pt:"A NS Development cria sites modernos, rápidos e multilingues para comerciantes, restaurantes e independentes no Luxemburgo. Entregues depressa, pensados para vender."},
  "Demander un devis gratuit": {lb:"Gratis Offert ufroen", de:"Kostenloses Angebot", en:"Get a free quote", pt:"Pedir orçamento grátis"},
  "Voir des exemples":         {lb:"Beispiller kucken", de:"Beispiele ansehen", en:"See examples", pt:"Ver exemplos"},
  "Découvrir":                 {lb:"Entdecken", de:"Entdecken", en:"Discover", pt:"Descobrir"},
  "Luxembourgeois":            {lb:"Lëtzebuergesch", de:"Luxemburgisch", en:"Luxembourg-based", pt:"Luxemburguesa"},
  ", un interlocuteur direct":  {lb:", een direkte Kontakt", de:", ein direkter Ansprechpartner", en:", one direct contact", pt:", um contacto direto"},
  "Multilingue":               {lb:"Méisproocheg", de:"Mehrsprachig", en:"Multilingual", pt:"Multilingue"},
  "SEO local":                 {lb:"Lokal SEO", de:"Lokales SEO", en:"Local SEO", pt:"SEO local"},
  "pour être trouvé sur Google":{lb:"fir op Google fonnt ze ginn", de:"um bei Google gefunden zu werden", en:"to be found on Google", pt:"para ser encontrado no Google"},
  "Livraison rapide":          {lb:"Séier Liwwerung", de:"Schnelle Lieferung", en:"Fast delivery", pt:"Entrega rápida"},
  ", en jours plutôt qu'en mois":{lb:", an Deeg amplaz a Méint", de:", in Tagen statt Monaten", en:", in days rather than months", pt:", em dias e não meses"},

  /* ---------- Services ---------- */
  "Ce qu'on fait":  {lb:"Wat mir maachen", de:"Was wir tun", en:"What we do", pt:"O que fazemos"},
  "Tout pour votre présence en ligne": {lb:"Alles fir Är Online-Präsenz", de:"Alles für Ihren Online-Auftritt", en:"Everything for your online presence", pt:"Tudo para a sua presença online"},
  "Du site vitrine à la boutique en ligne, on gère la création, le contenu et le suivi. Vous vous concentrez sur votre métier.":
    {lb:"Vun der Visittekaart-Säit bis zum Online-Buttek: mir këmmeren eis ëm d'Erstellung, den Inhalt an d'Suivi. Dir konzentréiert Iech op Ären Handwierk.",
     de:"Von der Visitenkarten-Website bis zum Onlineshop: Wir übernehmen Erstellung, Inhalte und Betreuung. Sie konzentrieren sich auf Ihr Geschäft.",
     en:"From a showcase site to a full online shop, we handle the build, the content and the follow-up. You focus on your trade.",
     pt:"Do site vitrine à loja online, tratamos da criação, do conteúdo e do acompanhamento. Você concentra-se no seu ofício."},
  "Sites vitrines": {lb:"Visittekaart-Säiten", de:"Visitenkarten-Websites", en:"Showcase websites", pt:"Sites vitrine"},
  "Un site professionnel, moderne et responsive qui présente votre activité et inspire confiance dès la première seconde.":
    {lb:"Eng professionell, modern a responsiv Säit déi Är Aktivitéit weist a vun der éischter Sekonn u Vertrauen schaaft.",
     de:"Eine professionelle, moderne und responsive Website, die Ihr Angebot zeigt und ab der ersten Sekunde Vertrauen schafft.",
     en:"A professional, modern and responsive site that presents your business and builds trust from the first second.",
     pt:"Um site profissional, moderno e responsivo que apresenta a sua atividade e inspira confiança desde o primeiro segundo."},
  "E-commerce & réservation": {lb:"E-Commerce & Reservatioun", de:"E-Commerce & Buchung", en:"E-commerce & booking", pt:"E-commerce e reservas"},
  "Boutique en ligne, commande à emporter, prise de rendez-vous et paiement en ligne intégrés à votre site.":
    {lb:"Online-Buttek, Take-away-Bestellung, Rendez-vous a Bezuelung direkt op Ärer Säit.",
     de:"Onlineshop, Take-away-Bestellung, Terminbuchung und Online-Zahlung direkt auf Ihrer Website.",
     en:"Online shop, takeaway ordering, appointment booking and online payment built into your site.",
     pt:"Loja online, encomendas take-away, marcação de horários e pagamento online integrados no seu site."},
  "Référencement local (SEO)": {lb:"Lokal Referenzéierung (SEO)", de:"Lokale Suchmaschinenoptimierung", en:"Local SEO", pt:"Referenciação local (SEO)"},
  "On optimise votre site pour Google et Google Maps : vous apparaissez quand un client cherche « près de moi ».":
    {lb:"Mir optiméieren Är Säit fir Google a Google Maps: Dir erschéngt wann e Client „bei mir an der Noperschaft“ sicht.",
     de:"Wir optimieren Ihre Website für Google und Google Maps: Sie erscheinen, wenn jemand „in meiner Nähe“ sucht.",
     en:"We optimise your site for Google and Google Maps, so you show up when a customer searches “near me”.",
     pt:"Otimizamos o seu site para o Google e o Google Maps: aparece quando um cliente procura “perto de mim”."},
  "FR, DE, EN, PT : votre site parle à toutes les communautés du Luxembourg. Un vrai atout que peu d'agences maîtrisent.":
    {lb:"FR, DE, EN, PT: Är Säit schwätzt mat alle Communautéiten zu Lëtzebuerg. E richtegen Atout deen wéineg Agencen beherrschen.",
     de:"FR, DE, EN, PT: Ihre Website spricht alle Gemeinschaften Luxemburgs an. Ein echter Vorteil, den wenige Agenturen beherrschen.",
     en:"FR, DE, EN, PT: your site speaks to every community in Luxembourg. A real advantage few agencies master.",
     pt:"FR, DE, EN, PT: o seu site fala a todas as comunidades do Luxemburgo. Uma vantagem real que poucas agências dominam."},
  "Maintenance & hébergement": {lb:"Ënnerhalt & Hosting", de:"Wartung & Hosting", en:"Maintenance & hosting", pt:"Manutenção e alojamento"},
  "Votre site reste en ligne, à jour et sécurisé. On s'occupe de l'hébergement, des sauvegardes et des modifications.":
    {lb:"Är Säit bleift online, aktuell a séchert. Mir këmmeren eis ëm den Hosting, d'Backupen an d'Ännerungen.",
     de:"Ihre Website bleibt online, aktuell und sicher. Wir kümmern uns um Hosting, Backups und Änderungen.",
     en:"Your site stays online, up to date and secure. We handle hosting, backups and changes.",
     pt:"O seu site fica online, atualizado e seguro. Tratamos do alojamento, das cópias de segurança e das alterações."},
  "Identité & visuels": {lb:"Identitéit & Visuelen", de:"Identität & Design", en:"Brand & visuals", pt:"Identidade e visuais"},
  "Logo, contenus, photos et visuels pour vos réseaux sociaux. Une image cohérente et professionnelle sur tous les supports.":
    {lb:"Logo, Inhalter, Fotoen a Visuelen fir Är sozial Netzwierker. E kohärent a professionellt Bild op alle Supporten.",
     de:"Logo, Inhalte, Fotos und Grafiken für Ihre sozialen Netzwerke. Ein stimmiges, professionelles Bild auf allen Kanälen.",
     en:"Logo, content, photos and visuals for your social media. A consistent, professional image everywhere.",
     pt:"Logótipo, conteúdos, fotos e visuais para as suas redes sociais. Uma imagem coerente e profissional em todos os suportes."},

  /* ---------- Réalisations ---------- */
  "Des sites déjà en action": {lb:"Säiten déi schonn online sinn", de:"Websites, die bereits laufen", en:"Sites already live", pt:"Sites já em ação"},
  "Chaque projet est conçu sur-mesure, à l'image du client. Voici deux exemples récents.":
    {lb:"All Projet gëtt op Mooss gemaach, no dem Client säi Bild. Hei zwee rezent Beispiller.",
     de:"Jedes Projekt entsteht maßgeschneidert, im Bild des Kunden. Hier zwei aktuelle Beispiele.",
     en:"Every project is built bespoke, in the client's image. Here are two recent examples.",
     pt:"Cada projeto é feito à medida, à imagem do cliente. Aqui estão dois exemplos recentes."},
  "Site vitrine":  {lb:"Visittekaart-Säit", de:"Visitenkarten-Website", en:"Showcase site", pt:"Site vitrine"},
  "Formulaire":    {lb:"Formulaire", de:"Formular", en:"Contact form", pt:"Formulário"},
  "Animations":    {lb:"Animatiounen", de:"Animationen", en:"Animations", pt:"Animações"},
  "Réservation":   {lb:"Reservatioun", de:"Reservierung", en:"Booking", pt:"Reserva"},
  "Take-away":     {lb:"Take-away", de:"Take-away", en:"Takeaway", pt:"Take-away"},
  "Menu en ligne": {lb:"Menü online", de:"Online-Speisekarte", en:"Online menu", pt:"Menu online"},

  "Fiduciaire · Dudelange": {lb:"Fiduciaire · Diddeleng", de:"Treuhandbüro · Düdelingen", en:"Accountancy firm · Dudelange", pt:"Gabinete de contabilidade · Dudelange"},
  "Site vitrine élégant pour un cabinet comptable : services, présentation, formulaire de contact et carte. Design sombre et haut de gamme.":
    {lb:"Elegant Visittekaart-Säit fir e Comptabelbüro: Servicer, Presentatioun, Kontaktformulaire a Kaart. Däischtert an héichwäertegt Design.",
     de:"Elegante Website für ein Buchhaltungsbüro: Leistungen, Vorstellung, Kontaktformular und Karte. Dunkles, hochwertiges Design.",
     en:"An elegant showcase site for an accountancy firm: services, presentation, contact form and map. Dark, high-end design.",
     pt:"Site vitrine elegante para um gabinete de contabilidade: serviços, apresentação, formulário de contacto e mapa. Design escuro e topo de gama."},
  "Restaurant · Luxembourg-Merl": {lb:"Restaurant · Lëtzebuerg-Merl", de:"Restaurant · Luxemburg-Merl", en:"Restaurant · Luxembourg-Merl", pt:"Restaurante · Luxemburgo-Merl"},
  "Site restaurant immersif : carte en ligne, réservation, commande à emporter et bascule FR / EN. Pensé pour remplir la salle.":
    {lb:"Immersiv Restaurant-Säit: Kaart online, Reservatioun, Take-away a Wiessel FR / EN. Gemaach fir de Sall ze fëllen.",
     de:"Immersive Restaurant-Website: Online-Karte, Reservierung, Take-away und Umschaltung FR / EN. Gemacht, um den Saal zu füllen.",
     en:"An immersive restaurant site: online menu, booking, takeaway and FR / EN switching. Built to fill the room.",
     pt:"Site de restaurante imersivo: menu online, reservas, take-away e alternância FR / EN. Pensado para encher a sala."},

  /* ---------- Démos ---------- */
  "Exemples par métier": {lb:"Beispiller no Beruff", de:"Beispiele nach Branche", en:"Examples by trade", pt:"Exemplos por setor"},
  "À quoi votre site pourrait ressembler": {lb:"Wéi Är Säit kéint ausgesinn", de:"So könnte Ihre Website aussehen", en:"What your site could look like", pt:"Como poderia ser o seu site"},
  "Chaque métier a son ambiance. Voici des exemples de sites qu'on crée, à personnaliser entièrement à votre image. Cliquez pour explorer.":
    {lb:"All Beruff huet seng eege Stëmmung. Hei Beispiller vu Säiten déi mir maachen, komplett op Iech unzepassen. Klickt fir z'entdecken.",
     de:"Jede Branche hat ihre eigene Stimmung. Hier Beispiele unserer Websites, vollständig an Sie anpassbar. Klicken zum Entdecken.",
     en:"Every trade has its own mood. Here are examples of the sites we build, fully customisable to your image. Click to explore.",
     pt:"Cada setor tem o seu ambiente. Aqui estão exemplos de sites que criamos, totalmente personalizáveis à sua imagem. Clique para explorar."},
  "Restaurant": {lb:"Restaurant", de:"Restaurant", en:"Restaurant", pt:"Restaurante"},
  "Centre équestre": {lb:"Reitzenter", de:"Reitanlage", en:"Equestrian centre", pt:"Centro equestre"},
  "Sombre et cinématique : grandes photographies, défilement fluide et mise en page de magazine.":
    {lb:"Däischter a kinematesch: grouss Fotoen, flëssegt Scrollen an e Magazinn-Layout.",
     de:"Dunkel und filmisch: großformatige Fotografien, flüssiges Scrollen und Magazin-Layout.",
     en:"Dark and cinematic: full-bleed photography, fluid scrolling and a magazine layout.",
     pt:"Escuro e cinematográfico: fotografia em grande formato, deslocamento fluido e layout de revista."},
  "Photo plein cadre": {lb:"Foto iwwer de ganze Kader", de:"Vollformat-Foto", en:"Full-bleed photography", pt:"Fotografia em grande formato"},
  "Rendez-vous en ligne": {lb:"Rendez-vous online", de:"Online-Terminbuchung", en:"Online booking", pt:"Marcações online"},
  "Galerie de chevaux": {lb:"Päerdsgalerie", de:"Pferdegalerie", en:"Horse gallery", pt:"Galeria de cavalos"},
  "École de danse": {lb:"Danzschoul", de:"Tanzschule", en:"Dance school", pt:"Escola de dança"},
  "Clair et éditorial : photographies monochromes, planning de la semaine et réservation en un clic.":
    {lb:"Hell a redaktionell: monochrom Fotoen, Wochenplang a Reservatioun mat engem Klick.",
     de:"Hell und redaktionell: monochrome Fotografien, Wochenplan und Buchung mit einem Klick.",
     en:"Light and editorial: monochrome photography, weekly timetable and one-click booking.",
     pt:"Claro e editorial: fotografias monocromáticas, horário semanal e reserva num clique."},
  "Planning des cours": {lb:"Coursplang", de:"Kursplan", en:"Class timetable", pt:"Horário das aulas"},
  "Fiches professeurs": {lb:"Proffe-Fichen", de:"Lehrerprofile", en:"Teacher profiles", pt:"Perfis dos professores"},
  "Galerie plein écran": {lb:"Galerie op der ganzer Säit", de:"Vollbild-Galerie", en:"Full-screen gallery", pt:"Galeria em ecrã inteiro"},
  "Fitness & coachs": {lb:"Fitness & Coachen", de:"Fitness & Coaches", en:"Fitness & coaches", pt:"Fitness e treinadores"},
  "Garage & auto": {lb:"Garage & Auto", de:"Werkstatt & Auto", en:"Garage & cars", pt:"Garagem e automóvel"},
  "Agence immobilière": {lb:"Immobilienagence", de:"Immobilienagentur", en:"Estate agency", pt:"Agência imobiliária"},
  "Chaleureux et élégant : carte en ligne, réservation et ambiance de bistro.":
    {lb:"Waarm an elegant: Kaart online, Reservatioun a Bistro-Stëmmung.", de:"Warm und elegant: Online-Karte, Reservierung und Bistro-Atmosphäre.", en:"Warm and elegant: online menu, booking and bistro atmosphere.", pt:"Acolhedor e elegante: menu online, reservas e ambiente de bistrô."},
  "Brut et énergique : programmes, planning des cours et essai gratuit.":
    {lb:"Roh an energesch: Programmer, Coursesplang a gratis Test.", de:"Roh und energiegeladen: Programme, Kursplan und Probetraining.", en:"Raw and energetic: programmes, class schedule and free trial.", pt:"Cru e enérgico: programas, horário das aulas e aula grátis."},
  "Technique et premium : catalogue de véhicules et prise de rendez-vous.":
    {lb:"Technesch a premium: Gefierer-Katalog a Rendez-vousen.", de:"Technisch und hochwertig: Fahrzeugkatalog und Terminbuchung.", en:"Technical and premium: vehicle catalogue and appointment booking.", pt:"Técnico e premium: catálogo de veículos e marcação de horários."},
  "Raffiné et haut de gamme : annonces, estimation et capture de contacts.":
    {lb:"Raffinéiert an haut de gamme: Annoncen, Schätzung a Kontaktopnam.", de:"Edel und hochwertig: Angebote, Bewertung und Kontakterfassung.", en:"Refined and high-end: listings, valuation and lead capture.", pt:"Refinado e topo de gama: anúncios, avaliação e captação de contactos."},
  "Menu": {lb:"Menü", de:"Speisekarte", en:"Menu", pt:"Menu"},
  "Galerie": {lb:"Galerie", de:"Galerie", en:"Gallery", pt:"Galeria"},
  "Planning": {lb:"Plang", de:"Kursplan", en:"Schedule", pt:"Horário"},
  "Programmes": {lb:"Programmer", de:"Programme", en:"Programmes", pt:"Programas"},
  "Essai gratuit": {lb:"Gratis Test", de:"Probetraining", en:"Free trial", pt:"Aula grátis"},
  "Catalogue": {lb:"Katalog", de:"Katalog", en:"Catalogue", pt:"Catálogo"},
  "Prise de RDV": {lb:"Rendez-vous", de:"Terminbuchung", en:"Appointments", pt:"Marcações"},
  "Annonces": {lb:"Annoncen", de:"Angebote", en:"Listings", pt:"Anúncios"},
  "Estimation": {lb:"Schätzung", de:"Bewertung", en:"Valuation", pt:"Avaliação"},
  "Leads": {lb:"Leads", de:"Leads", en:"Leads", pt:"Leads"},
  "Voir la démo →": {lb:"Demo kucken →", de:"Demo ansehen →", en:"View demo →", pt:"Ver demo →"},
  "Fiduciaire & comptable": {lb:"Fiduciaire & Comptabel", de:"Treuhand & Buchhaltung", en:"Accountancy firm", pt:"Fiduciária & contabilidade"},
  "Table gastronomique : menus, carte photographiée, cave, et réservation en ligne qui bloque vraiment un service complet.":
    {lb:"Gastronomesch Tafel: Menüen, illustréiert Kaart, Wäikeller an eng Online-Reservatioun déi e vollen Service wierklech spaart.",
     de:"Gastronomisches Restaurant: Menüs, bebilderte Karte, Weinkeller und eine Online-Buchung, die einen ausgebuchten Service wirklich sperrt.",
     en:"Fine-dining restaurant: set menus, an illustrated à la carte, a wine cellar, and online booking that really turns away a full service.",
     pt:"Restaurante gastronómico: menus, carta ilustrada, cave de vinhos e reserva online que bloqueia mesmo um serviço cheio."},
  "Menus": {lb:"Menüen", de:"Menüs", en:"Set menus", pt:"Menus"},
  "Carte": {lb:"Kaart", de:"Speisekarte", en:"À la carte", pt:"Carta"},
  "Sobre et rassurant : présentation des services, prise de rendez-vous et contact.":
    {lb:"Nüchtern a berouegend: Presentatioun vun de Servicer, Rendez-vous a Kontakt.",
     de:"Schlicht und vertrauenswürdig: Leistungsübersicht, Terminbuchung und Kontakt.",
     en:"Understated and reassuring: services overview, appointment booking and contact.",
     pt:"Sóbrio e tranquilizador: apresentação dos serviços, marcação e contacto."},
  "Rendez-vous": {lb:"Rendez-vous", de:"Termine", en:"Appointments", pt:"Marcações"},

  /* ---------- Avant / après ---------- */
  "Refonte":             {lb:"Nei gemaach",     de:"Relaunch",     en:"Redesign",     pt:"Remodelação"},
  "Votre site a dix ans ? Ça se voit.": {lb:"Ass Är Säit zéng Joer al? Dat gesäit een.", de:"Ist Ihre Website zehn Jahre alt? Man sieht es.", en:"Is your site ten years old? It shows.", pt:"O seu site tem dez anos? Nota-se."},
  "Attrapez le curseur et faites-le glisser. À gauche, un site de restaurant comme il en existe encore beaucoup au Luxembourg. À droite, la même adresse une fois refaite. C'est une mise en situation, pas un client réel.": {lb:"Huelt de Curseur a zitt en. Lénks eng Restaurant-Säit, wéi et der zu Lëtzebuerg nach vill ginn. Riets déiselwecht Adress, nei gemaach. Dat ass e Beispill, kee richtege Client.", de:"Greifen Sie den Regler und ziehen Sie ihn. Links eine Restaurant-Website, wie es sie in Luxemburg noch viele gibt. Rechts dieselbe Adresse nach dem Relaunch. Ein Beispiel, kein echter Kunde.", en:"Grab the handle and slide it. On the left, a restaurant site of the kind still common in Luxembourg. On the right, the same address once rebuilt. This is a demonstration, not a real client.", pt:"Agarre o cursor e arraste-o. À esquerda, um site de restaurante como ainda existem muitos no Luxemburgo. À direita, o mesmo endereço depois de refeito. É uma demonstração, não um cliente real."},
  "Avant":               {lb:"Virdrun",         de:"Vorher",       en:"Before",       pt:"Antes"},
  "Après":               {lb:"Duerno",          de:"Nachher",      en:"After",        pt:"Depois"},
  "Lisible sur téléphone": {lb:"Liesbar um Handy", de:"Lesbar auf dem Handy", en:"Readable on a phone", pt:"Legível no telemóvel"},
  "Un site conçu à cette époque n'était pas prévu pour un écran de poche. C'est pourtant là que la plupart des gens vous découvrent aujourd'hui.": {lb:"Eng Säit aus där Zäit war net fir e klengen Ecran geduecht. Genau do entdecken d'Leit Iech awer haut.", de:"Eine Website aus dieser Zeit war nicht für einen kleinen Bildschirm gedacht. Genau dort entdecken die meisten Sie aber heute.", en:"A site built back then was never meant for a pocket screen. Yet that is where most people find you today.", pt:"Um site dessa época não foi pensado para um ecrã de bolso. No entanto, é aí que a maioria das pessoas o descobre hoje."},
  "Une table se réserve en trois clics, à toute heure. Plus de téléphone qui sonne en plein coup de feu pour une question d'horaire.": {lb:"En Dësch gëtt an dräi Klicks reservéiert, zu all Auerzäit. Kee Telefon méi, deen an der gréisster Häscht wéinst enger Fro iwwer d'Ouverturen klengelt.", de:"Ein Tisch ist in drei Klicks reserviert, rund um die Uhr. Kein Telefon mehr, das mitten im Ansturm wegen einer Öffnungszeit klingelt.", en:"A table is booked in three clicks, at any hour. No more phone ringing mid-service over a question about opening times.", pt:"Uma mesa reserva-se em três cliques, a qualquer hora. Sem telefone a tocar em plena azáfama por causa de um horário."},
  "Trouvable sur Google": {lb:"Op Google ze fannen", de:"Auf Google auffindbar", en:"Found on Google", pt:"Encontrável no Google"},
  "Structure, vitesse et fiche Google Maps reliée au site. Vous apparaissez quand quelqu'un cherche un restaurant à côté de chez lui.": {lb:"Struktur, Vitesse an eng Google-Maps-Fiche, déi mat der Säit verbonnen ass. Dir erschéngt, wann een e Restaurant an der Noperschaft sicht.", de:"Struktur, Geschwindigkeit und ein mit der Website verknüpfter Google-Maps-Eintrag. Sie erscheinen, wenn jemand ein Restaurant in der Nähe sucht.", en:"Structure, speed and a Google Maps listing linked to the site. You show up when someone looks for a restaurant nearby.", pt:"Estrutura, velocidade e ficha Google Maps ligada ao site. Aparece quando alguém procura um restaurante perto de si."},

  /* ---------- Espace client (section du site) ---------- */
  "Vous voyez ce que vous payez": {lb:"Dir gesitt, wat Dir bezuelt", de:"Sie sehen, wofür Sie zahlen", en:"You see what you pay for", pt:"Vê aquilo que paga"},
  "La plupart des agences livrent un site puis disparaissent, et vous ne savez plus ce que devient votre abonnement. Chez nous, chaque client reçoit un espace personnel. Vous y entrez quand vous voulez, depuis un ordinateur ou votre téléphone.": {lb:"Déi meescht Agencë liwweren eng Säit a verschwannen duerno, an Dir wësst net méi, wat aus Ärem Abonnement gëtt. Bei eis kritt all Client säin eegene Beräich. Dir kommt eran, wéini Dir wëllt, vum Computer oder vum Handy.", de:"Die meisten Agenturen liefern eine Website und verschwinden dann, und Sie wissen nicht mehr, was aus Ihrem Abonnement wird. Bei uns bekommt jeder Kunde einen persönlichen Bereich. Sie gehen hinein, wann Sie wollen, vom Computer oder vom Handy.", en:"Most agencies deliver a site and then vanish, and you no longer know what your subscription is doing. With us, every client gets a personal area. You go in whenever you like, from a computer or your phone.", pt:"A maioria das agências entrega um site e depois desaparece, e deixa de saber o que acontece à sua assinatura. Connosco, cada cliente recebe um espaço pessoal. Entra quando quiser, no computador ou no telemóvel."},
  "Vos chiffres":        {lb:"Är Zuelen",        de:"Ihre Zahlen",       en:"Your numbers",   pt:"Os seus números"},
  "Combien de personnes vous trouvent, d'où elles viennent, combien appellent ou demandent l'itinéraire.": {lb:"Wéi vill Leit Iech fannen, vu wou se kommen, wéi vill uruffen oder de Wee froen.", de:"Wie viele Menschen Sie finden, woher sie kommen, wie viele anrufen oder die Route abfragen.", en:"How many people find you, where they come from, how many call or ask for directions.", pt:"Quantas pessoas o encontram, de onde vêm, quantas telefonam ou pedem o itinerário."},
  "Vos factures":        {lb:"Är Rechnungen",    de:"Ihre Rechnungen",   en:"Your invoices",  pt:"As suas faturas"},
  "L'historique complet, téléchargeable, et la prochaine échéance. Aucune surprise sur le montant.": {lb:"De ganzen Historique zum Eroflueden, an déi nächst Echéance. Keng Iwwerraschung beim Betrag.", de:"Der vollständige Verlauf zum Herunterladen und die nächste Fälligkeit. Keine Überraschung beim Betrag.", en:"The full history, downloadable, and the next due date. No surprises on the amount.", pt:"O histórico completo, transferível, e o próximo vencimento. Sem surpresas no valor."},
  "Vos demandes":        {lb:"Är Ufroen",        de:"Ihre Anfragen",     en:"Your requests",  pt:"Os seus pedidos"},
  "Une modification à faire ? Vous l'écrivez ici et vous suivez son avancement, sans relancer personne.": {lb:"Eng Ännerung ze maachen? Dir schreift se hei eran a verfollegt, wéi wäit se ass, ouni datt Dir nofroe musst.", de:"Eine Änderung nötig? Sie schreiben sie hier hinein und verfolgen den Fortschritt, ohne jemandem hinterherzulaufen.", en:"Something to change? You write it here and follow its progress, without chasing anyone.", pt:"Uma alteração a fazer? Escreve-a aqui e acompanha o andamento, sem ter de insistir com ninguém."},
  "Vos documents":       {lb:"Är Dokumenter",    de:"Ihre Dokumente",    en:"Your documents", pt:"Os seus documentos"},
  "Contrat, devis, nom de domaine, accès Google. Tout est rangé au même endroit et reste à vous.": {lb:"Kontrakt, Offert, Domain-Numm, Google-Zougang. Alles läit op enger Plaz a bleift Ären.", de:"Vertrag, Angebot, Domainname, Google-Zugang. Alles liegt an einem Ort und bleibt Ihres.", en:"Contract, quote, domain name, Google access. Everything is filed in one place and stays yours.", pt:"Contrato, orçamento, nome de domínio, acesso Google. Está tudo no mesmo sítio e continua a ser seu."},
  "Essayer l'espace client": {lb:"De Client-Beräich probéieren", de:"Kundenbereich ausprobieren", en:"Try the client area", pt:"Experimentar a área de cliente"},
  "Démonstration libre, aucun compte à créer. Les données affichées sont fictives.": {lb:"Fräi Demo, kee Kont ze erstellen. D'ugewisen Donnéeë sinn erfonnt.", de:"Freie Demo, kein Konto nötig. Die angezeigten Daten sind erfunden.", en:"Open demo, no account to create. The data shown is fictitious.", pt:"Demonstração livre, sem criar conta. Os dados apresentados são fictícios."},

  /* ---------- Méthode ---------- */
  "Notre méthode": {lb:"Eis Method", de:"Unser Vorgehen", en:"Our method", pt:"O nosso método"},
  "De l'idée au site en ligne, en 4 étapes": {lb:"Vun der Iddi bis zur Säit online, a 4 Etappen", de:"Von der Idee zur Website in 4 Schritten", en:"From idea to live site in 4 steps", pt:"Da ideia ao site online, em 4 etapas"},
  "Un processus clair et rapide. Vous validez, on exécute.": {lb:"E klore a séiere Prozess. Dir bestätegt, mir maachen.", de:"Ein klarer, schneller Prozess. Sie geben frei, wir setzen um.", en:"A clear, fast process. You approve, we execute.", pt:"Um processo claro e rápido. Você valida, nós executamos."},
  "Découverte": {lb:"Entdeckung", de:"Kennenlernen", en:"Discovery", pt:"Descoberta"},
  "On comprend votre activité, vos clients et vos objectifs. Gratuit et sans engagement.":
    {lb:"Mir verstinn Är Aktivitéit, Är Clienten an Är Ziler. Gratis an ouni Engagement.", de:"Wir verstehen Ihr Geschäft, Ihre Kunden und Ihre Ziele. Kostenlos und unverbindlich.", en:"We get to know your business, your customers and your goals. Free, no commitment.", pt:"Compreendemos a sua atividade, os seus clientes e os seus objetivos. Grátis e sem compromisso."},
  "Design sur-mesure": {lb:"Design op Mooss", de:"Maßgeschneidertes Design", en:"Bespoke design", pt:"Design à medida"},
  "On conçoit une maquette moderne à votre image, que vous validez avant tout développement.":
    {lb:"Mir maachen e moderne Modell no Ärem Bild, dee Dir virum Entwécklung bestätegt.", de:"Wir entwerfen ein modernes Layout in Ihrem Stil, das Sie vor der Entwicklung freigeben.", en:"We design a modern mockup in your image, which you approve before any development.", pt:"Concebemos uma maqueta moderna à sua imagem, que valida antes de qualquer desenvolvimento."},
  "Développement rapide": {lb:"Séier Entwécklung", de:"Schnelle Umsetzung", en:"Fast development", pt:"Desenvolvimento rápido"},
  "Votre site est construit, optimisé et testé en quelques jours. Vous suivez l'avancement à chaque étape.":
    {lb:"Är Säit gëtt an e puer Deeg gebaut, optiméiert a getest. Dir verfollegt all Etapp.", de:"Ihre Website wird in wenigen Tagen gebaut, optimiert und getestet. Sie verfolgen jeden Schritt.", en:"Your site is built, optimised and tested within days. You follow every step.", pt:"O seu site é construído, otimizado e testado em poucos dias. Acompanha cada etapa."},
  "Mise en ligne & suivi": {lb:"Online-Stellung & Suivi", de:"Veröffentlichung & Betreuung", en:"Launch & follow-up", pt:"Publicação e acompanhamento"},
  "On publie, on référence, et on maintient votre site à jour grâce à l'abonnement.":
    {lb:"Mir publizéieren, referenzéieren an halen Är Säit aktuell duerch den Abonnement.", de:"Wir veröffentlichen, optimieren und halten Ihre Website über das Abo aktuell.", en:"We publish, index it, and keep your site up to date through the subscription.", pt:"Publicamos, referenciamos e mantemos o seu site atualizado através da subscrição."},

  /* ---------- Tarifs & simulateur ---------- */
  "Des prix clairs, sans surprise": {lb:"Kloer Präisser, ouni Iwwerraschung", de:"Klare Preise, keine Überraschungen", en:"Clear prices, no surprises", pt:"Preços claros, sem surpresas"},
  "Choisissez le type de site qui vous ressemble : vous voyez tout de suite une fourchette de prix. Le tarif exact, on l'établit ensemble, gratuitement.":
    {lb:"Wielt d'Zort Säit déi zu Iech passt: Dir gesitt direkt eng Präis-Fourchette. De genaue Tarif leeë mir zesummen fest, gratis.",
     de:"Wählen Sie den Website-Typ, der zu Ihnen passt: Sie sehen sofort eine Preisspanne. Den genauen Preis legen wir gemeinsam fest, kostenlos.",
     en:"Pick the kind of site that fits you: you see a price range right away. The exact price, we set together, free of charge.",
     pt:"Escolha o tipo de site que combina consigo: vê logo uma faixa de preço. O preço exato, definimos juntos, gratuitamente."},
  "Essentiel": {lb:"Essentiel", de:"Basis", en:"Essential", pt:"Essencial"},
  "Indépendants, artisans": {lb:"Selbststänneger, Handwierker", de:"Selbstständige, Handwerker", en:"Freelancers, craftspeople", pt:"Independentes, artesãos"},
  "à partir de": {lb:"vun", de:"ab", en:"from", pt:"a partir de"},
  "Le plus demandé": {lb:"Am meeschte gefrot", de:"Am beliebtesten", en:"Most popular", pt:"O mais pedido"},
  "Standard": {lb:"Standard", de:"Standard", en:"Standard", pt:"Standard"},
  "Commerces, restaurants": {lb:"Geschäfter, Restauranten", de:"Geschäfte, Restaurants", en:"Shops, restaurants", pt:"Comércios, restaurantes"},
  "Sur-mesure": {lb:"Op Mooss", de:"Maßgeschneidert", en:"Bespoke", pt:"À medida"},
  "E-commerce, projets avancés": {lb:"E-Commerce, fortgeschratt Projeten", de:"E-Commerce, anspruchsvolle Projekte", en:"E-commerce, advanced projects", pt:"E-commerce, projetos avançados"},
  "Composez votre site, voyez le prix": {lb:"Stellt Är Säit zesummen, kuckt de Präis", de:"Stellen Sie Ihre Website zusammen, sehen Sie den Preis", en:"Build your site, see the price", pt:"Componha o seu site, veja o preço"},
  "Quel type de site ?": {lb:"Wéi eng Zort Säit?", de:"Welche Art von Website?", en:"What kind of site?", pt:"Que tipo de site?"},
  "Quel type de site vous ressemble ?": {lb:"Wéi eng Zort Säit passt zu Iech?", de:"Welche Art von Website passt zu Ihnen?", en:"What kind of site fits you?", pt:"Que tipo de site combina consigo?"},
  "Estimation approximative": {lb:"Ongeféier Schätzung", de:"Ungefähre Schätzung", en:"Approximate estimate", pt:"Estimativa aproximada"},
  "hors TVA · fourchette indicative": {lb:"ouni TVA · indikativ Fourchette", de:"zzgl. MwSt. · Richtwert", en:"excl. VAT · indicative range", pt:"sem IVA · faixa indicativa"},
  "Puis un": {lb:"Duerno en", de:"Dann ein", en:"Then a", pt:"Depois uma"},
  "abonnement maintenance": {lb:"Ënnerhalts-Abonnement", de:"Wartungsabo", en:"maintenance subscription", pt:"subscrição de manutenção"},
  "Obtenir mon devis précis": {lb:"Meng genau Offert kréien", de:"Genaues Angebot erhalten", en:"Get my precise quote", pt:"Obter o meu orçamento exato"},
  "Une estimation pour vous donner un ordre d'idée, pas un devis. Le prix exact dépend de votre projet : on l'établit ensemble, gratuitement, lors d'un échange rapide.":
    {lb:"Eng Schätzung fir Iech en Iddi ze ginn, keng Offert. De genaue Präis hänkt vun Ärem Projet of: mir leeën en zesummen fest, gratis, bei engem kuerzen Austausch.",
     de:"Eine Schätzung, um Ihnen eine Vorstellung zu geben, kein Angebot. Der genaue Preis hängt von Ihrem Projekt ab: Wir legen ihn gemeinsam fest, kostenlos, in einem kurzen Gespräch.",
     en:"An estimate to give you a rough idea, not a quote. The exact price depends on your project: we set it together, free of charge, in a quick chat.",
     pt:"Uma estimativa para lhe dar uma ideia, não um orçamento. O preço exato depende do seu projeto: definimo-lo juntos, gratuitamente, numa conversa rápida."},
  "Que voulez-vous ajouter ?": {lb:"Wat wëllt Dir derbäisetzen?", de:"Was möchten Sie ergänzen?", en:"What would you like to add?", pt:"O que quer acrescentar?"},
  "Quel suivi après la mise en ligne ?": {lb:"Wéi ee Suivi no der Online-Stellung?", de:"Welche Betreuung nach dem Start?", en:"What follow-up after launch?", pt:"Que acompanhamento após a publicação?"},
  "Votre projet": {lb:"Äre Projet", de:"Ihr Projekt", en:"Your project", pt:"O seu projeto"},
  "hors TVA · prix ferme, valable 30 jours": {lb:"ouni TVA · feste Präis, 30 Deeg gëlteg", de:"zzgl. MwSt. · Festpreis, 30 Tage gültig", en:"excl. VAT · firm price, valid 30 days", pt:"sem IVA · preço firme, válido 30 dias"},
  "Puis": {lb:"Duerno", de:"Dann", en:"Then", pt:"Depois"},
  "/mois": {lb:"/Mount", de:"/Monat", en:"/month", pt:"/mês"},
  "pour l'hébergement, la sécurité et le support": {lb:"fir den Hosting, d'Sécherheet an de Support", de:"für Hosting, Sicherheit und Support", en:"for hosting, security and support", pt:"para alojamento, segurança e suporte"},
  /* Bloc aide de l'État (visible seulement quand AIDE_ETAT = true) */
  "🇱🇺 Aide de l'État · 70 %": {lb:"🇱🇺 Staatshëllef · 70 %", de:"🇱🇺 Staatliche Beihilfe · 70 %", en:"🇱🇺 State aid · 70%", pt:"🇱🇺 Apoio do Estado · 70 %"},
  "Votre projet dépasse 3 000 € HT : il est éligible au dispositif":
    {lb:"Äre Projet iwwerschreit 3 000 € ouni TVA: en ass berechtegt fir d'Programm",
     de:"Ihr Projekt übersteigt 3 000 € netto: Es ist förderfähig über das Programm",
     en:"Your project exceeds €3,000 excl. VAT, making it eligible for the",
     pt:"O seu projeto ultrapassa 3 000 € sem IVA: é elegível para o programa"},
  ", qui rembourse 70 % de la facture aux PME luxembourgeoises. Vous réglez la facture, l'État vous reverse":
    {lb:", dat 70 % vun der Rechnung u lëtzebuergesch KMUen zréckbezilt. Dir bezuelt d'Rechnung, de Staat iwwerweist Iech",
     de:", das luxemburgischen KMU 70 % der Rechnung erstattet. Sie begleichen die Rechnung, der Staat überweist Ihnen",
     en:" scheme, which reimburses 70% of the invoice to Luxembourg SMEs. You pay the invoice, the State pays you back",
     pt:", que reembolsa 70 % da fatura às PME luxemburguesas. Você paga a fatura, o Estado devolve-lhe"},
  ". Sous réserve d'éligibilité et de validation du dossier avant signature. On s'occupe du montage avec vous.":
    {lb:". Ënner Virbehalt vun der Berechtegung a vun der Validéierung vum Dossier virun der Ënnerschrëft. Mir maachen den Dossier mat Iech.",
     de:". Vorbehaltlich der Förderfähigkeit und der Genehmigung des Antrags vor Vertragsunterzeichnung. Wir stellen den Antrag gemeinsam mit Ihnen.",
     en:". Subject to eligibility and to the application being approved before signature. We handle the paperwork with you.",
     pt:". Sujeito a elegibilidade e à validação do processo antes da assinatura. Tratamos do processo consigo."},
  "Encore": {lb:"Nach", de:"Noch", en:"Just", pt:"Faltam"},
  "et votre projet passe le seuil des 3 000 € HT qui ouvre droit à":
    {lb:"an Äre Projet iwwerschreit d'Grenz vun 3 000 € ouni TVA déi Recht gëtt op",
     de:"und Ihr Projekt überschreitet die Schwelle von 3 000 € netto, die Anspruch gibt auf",
     en:"more and your project crosses the €3,000 excl. VAT threshold that unlocks",
     pt:"e o seu projeto ultrapassa o limiar de 3 000 € sem IVA que dá direito a"},
  "l'aide de l'État de 70 %": {lb:"d'Staatshëllef vun 70 %", de:"die staatliche Beihilfe von 70 %", en:"the 70% state aid", pt:"o apoio do Estado de 70 %"},
  ". Un site plus complet vous coûterait alors": {lb:". Eng méi komplett Säit géif Iech dann", de:". Eine umfassendere Website würde Sie dann", en:". A more complete site would then cost you", pt:". Um site mais completo custar-lhe-ia então"},
  "moins cher": {lb:"manner kaschten", de:"weniger kosten", en:"less", pt:"menos"},
  /* Titre du hero : ligne fixe + mots qui défilent */
  "Des sites web qui": {lb:"Websäiten déi", de:"Webseiten, die", en:"Websites that", pt:"Sites que"},
  "convertissent.": {lb:"konvertéieren.", de:"konvertieren.", en:"convert.", pt:"convertem."},
  "font vendre.": {lb:"verkafen.", de:"verkaufen.", en:"sell.", pt:"vendem."},
  "remplissent.": {lb:"fëllen.", de:"füllen.", en:"fill up.", pt:"enchem."},
  "rapportent.": {lb:"abréngen.", de:"sech lounen.", en:"pay off.", pt:"rendem."},
  "marquent.": {lb:"beandrocken.", de:"beeindrucken.", en:"stand out.", pt:"marcam."},
  "reste à votre charge": {lb:"bleift op Ärer Käschte", de:"verbleibt bei Ihnen", en:"your remaining cost", pt:"fica a seu cargo"},
  "Recevoir ce devis par email": {lb:"Dës Offert per E-Mail kréien", de:"Angebot per E-Mail erhalten", en:"Get this quote by email", pt:"Receber este orçamento por email"},
  "Estimation indicative basée sur notre grille tarifaire. Le devis définitif est établi après un échange de 15 minutes sur votre projet.":
    {lb:"Indikativ Schätzung op Basis vun eiser Präislëscht. Déi definitiv Offert gëtt no engem Gespréich vu 15 Minutten iwwer Äre Projet gemaach.",
     de:"Unverbindliche Schätzung auf Basis unserer Preisliste. Das endgültige Angebot entsteht nach einem 15-minütigen Gespräch über Ihr Projekt.",
     en:"Indicative estimate based on our price list. The final quote is issued after a 15-minute conversation about your project.",
     pt:"Estimativa indicativa baseada na nossa tabela de preços. O orçamento definitivo é feito após uma conversa de 15 minutos sobre o seu projeto."},

  /* ---------- Options du simulateur ---------- */
  "Une page, tout l'essentiel": {lb:"Eng Säit, alles Wesentlechs", de:"Eine Seite, alles Wesentliche", en:"One page, all the essentials", pt:"Uma página, o essencial"},
  "Vitrine": {lb:"Vitrine", de:"Vitrine", en:"Showcase", pt:"Vitrine"},
  "4 à 5 pages, galerie, services": {lb:"4 bis 5 Säiten, Galerie, Servicer", de:"4 bis 5 Seiten, Galerie, Leistungen", en:"4 to 5 pages, gallery, services", pt:"4 a 5 páginas, galeria, serviços"},
  "Pro": {lb:"Pro", de:"Pro", en:"Pro", pt:"Pro"},
  "8 à 10 pages, bilingue, SEO renforcé": {lb:"8 bis 10 Säiten, zweesproocheg, verstäerkt SEO", de:"8 bis 10 Seiten, zweisprachig, verstärktes SEO", en:"8 to 10 pages, bilingual, stronger SEO", pt:"8 a 10 páginas, bilingue, SEO reforçado"},
  "Boutique": {lb:"Buttek", de:"Shop", en:"Shop", pt:"Loja"},
  "Vente en ligne jusqu'à 50 produits": {lb:"Online-Verkaf bis 50 Produkter", de:"Onlineverkauf bis 50 Produkte", en:"Online sales up to 50 products", pt:"Venda online até 50 produtos"},
  "Signature": {lb:"Signature", de:"Signature", en:"Signature", pt:"Signature"},
  "Sur-mesure, catalogue, haut de gamme": {lb:"Op Mooss, Katalog, haut de gamme", de:"Maßgeschneidert, Katalog, Premium", en:"Bespoke, catalogue, high-end", pt:"À medida, catálogo, topo de gama"},
  "Langue supplémentaire": {lb:"Zousätzlech Sprooch", de:"Zusätzliche Sprache", en:"Additional language", pt:"Idioma adicional"},
  "Traduction comprise": {lb:"Iwwersetzung abegraff", de:"Übersetzung inklusive", en:"Translation included", pt:"Tradução incluída"},
  "Réservation en ligne": {lb:"Online-Reservatioun", de:"Online-Buchung", en:"Online booking", pt:"Reserva online"},
  "Table, rendez-vous, créneau": {lb:"Dësch, Rendez-vous, Zäitfënster", de:"Tisch, Termin, Zeitfenster", en:"Table, appointment, time slot", pt:"Mesa, marcação, horário"},
  "Paiement en ligne": {lb:"Online-Bezuelung", de:"Online-Zahlung", en:"Online payment", pt:"Pagamento online"},
  "Boutique et encaissement": {lb:"Buttek a Kassa", de:"Shop und Zahlungsabwicklung", en:"Shop and checkout", pt:"Loja e cobrança"},
  "Catalogue métier": {lb:"Beruffskatalog", de:"Branchenkatalog", en:"Trade catalogue", pt:"Catálogo profissional"},
  "Biens, véhicules, produits": {lb:"Immobilien, Gefierer, Produkter", de:"Immobilien, Fahrzeuge, Produkte", en:"Properties, vehicles, products", pt:"Imóveis, veículos, produtos"},
  "Rédaction des textes": {lb:"Texter schreiwen", de:"Texterstellung", en:"Copywriting", pt:"Redação dos textos"},
  "Vos 5 pages écrites par nous": {lb:"Är 5 Säite vun eis geschriwwen", de:"Ihre 5 Seiten von uns geschrieben", en:"Your 5 pages written by us", pt:"As suas 5 páginas escritas por nós"},
  "Shooting photo": {lb:"Foto-Shooting", de:"Fotoshooting", en:"Photo shoot", pt:"Sessão fotográfica"},
  "Une demi-journée sur place": {lb:"En halwen Dag op der Plaz", de:"Ein halber Tag vor Ort", en:"Half a day on site", pt:"Meio dia no local"},
  "Logo et identité": {lb:"Logo an Identitéit", de:"Logo und Identität", en:"Logo and brand", pt:"Logótipo e identidade"},
  "Création complète": {lb:"Komplett Kreatioun", de:"Komplette Gestaltung", en:"Full creation", pt:"Criação completa"},
  "SEO local avancé": {lb:"Fortgeschratt lokal SEO", de:"Erweitertes lokales SEO", en:"Advanced local SEO", pt:"SEO local avançado"},
  "Être trouvé sur votre commune": {lb:"An Ärer Gemeng fonnt ginn", de:"In Ihrer Gemeinde gefunden werden", en:"Be found in your municipality", pt:"Ser encontrado no seu concelho"},
  "Fiche Google Business": {lb:"Google-Business-Fiche", de:"Google-Unternehmensprofil", en:"Google Business profile", pt:"Ficha Google Business"},
  "Configurée et optimisée": {lb:"Konfiguréiert an optiméiert", de:"Eingerichtet und optimiert", en:"Set up and optimised", pt:"Configurada e otimizada"},
  "Blog / actualités": {lb:"Blog / Aktualitéiten", de:"Blog / Neuigkeiten", en:"Blog / news", pt:"Blogue / notícias"},
  "Publiez vos nouveautés": {lb:"Publizéiert Är Neiegkeeten", de:"Veröffentlichen Sie Ihre Neuigkeiten", en:"Publish your news", pt:"Publique as suas novidades"},
  "Galerie avancée": {lb:"Fortgeschratt Galerie", de:"Erweiterte Galerie", en:"Advanced gallery", pt:"Galeria avançada"},
  "Portfolio, avant/après": {lb:"Portfolio, virdrun/duerno", de:"Portfolio, vorher/nachher", en:"Portfolio, before/after", pt:"Portefólio, antes/depois"},
  "Hébergement, sécurité, sauvegardes, support": {lb:"Hosting, Sécherheet, Backupen, Support", de:"Hosting, Sicherheit, Backups, Support", en:"Hosting, security, backups, support", pt:"Alojamento, segurança, cópias, suporte"},
  /* Libellés composés générés par le simulateur */
  "Formule Essentiel": {lb:"Formule Essentiel", de:"Paket Basis", en:"Essential package", pt:"Pacote Essencial"},
  "Formule Vitrine":   {lb:"Formule Vitrine", de:"Paket Vitrine", en:"Showcase package", pt:"Pacote Vitrine"},
  "Formule Pro":       {lb:"Formule Pro", de:"Paket Pro", en:"Pro package", pt:"Pacote Pro"},
  "Formule Boutique":  {lb:"Formule Buttek", de:"Paket Shop", en:"Shop package", pt:"Pacote Loja"},
  "Formule Signature": {lb:"Formule Signature", de:"Paket Signature", en:"Signature package", pt:"Pacote Signature"},
  "abonnement Essentiel": {lb:"Abonnement Essentiel", de:"Abo Basis", en:"Essential subscription", pt:"subscrição Essencial"},
  "abonnement Confort":   {lb:"Abonnement Comfort", de:"Abo Komfort", en:"Comfort subscription", pt:"subscrição Conforto"},
  "abonnement Sérénité":  {lb:"Abonnement Serenitéit", de:"Abo Sorglos", en:"Serenity subscription", pt:"subscrição Serenidade"},
  "Confort": {lb:"Comfort", de:"Komfort", en:"Comfort", pt:"Conforto"},
  "+ modifications régulières, support prioritaire": {lb:"+ reegelméisseg Ännerungen, prioritäre Support", de:"+ regelmäßige Änderungen, bevorzugter Support", en:"+ regular changes, priority support", pt:"+ alterações regulares, suporte prioritário"},
  "Sérénité": {lb:"Serenitéit", de:"Sorglos", en:"Serenity", pt:"Serenidade"},
  "+ suivi SEO, statistiques, modifications illimitées": {lb:"+ SEO-Suivi, Statistiken, onbegrenzt Ännerungen", de:"+ SEO-Betreuung, Statistiken, unbegrenzte Änderungen", en:"+ SEO follow-up, statistics, unlimited changes", pt:"+ acompanhamento SEO, estatísticas, alterações ilimitadas"},

  /* ---------- Vérificateur de domaine ---------- */
  "Votre adresse web est-elle libre ?": {lb:"Ass Är Web-Adress fräi?", de:"Ist Ihre Web-Adresse frei?", en:"Is your web address available?", pt:"O seu endereço web está livre?"},
  "Tapez le nom de votre entreprise, on vérifie les extensions en direct. Si c'est libre, on s'occupe de le réserver à votre nom.":
    {lb:"Tippt den Numm vun Ärem Betrib, mir kucken d'Extensiounen live no. Wann et fräi ass, reservéiere mir et op Ären Numm.",
     de:"Geben Sie Ihren Firmennamen ein, wir prüfen die Endungen in Echtzeit. Ist sie frei, sichern wir sie auf Ihren Namen.",
     en:"Type your business name, we check the extensions live. If it's free, we reserve it in your name.",
     pt:"Escreva o nome da sua empresa, verificamos as extensões em direto. Se estiver livre, reservamo-la em seu nome."},
  "On teste .lu, .com, .be, .fr et .eu en un clic.": {lb:"Mir testen .lu, .com, .be, .fr an .eu op ee Klick.", de:"Wir prüfen .lu, .com, .be, .fr und .eu mit einem Klick.", en:"We test .lu, .com, .be, .fr and .eu in one click.", pt:"Testamos .lu, .com, .be, .fr e .eu num clique."},
  "Vérifier": {lb:"Kucken", de:"Prüfen", en:"Check", pt:"Verificar"},
  "Disponible": {lb:"Fräi", de:"Verfügbar", en:"Available", pt:"Disponível"},
  "Déjà pris": {lb:"Scho geholl", de:"Vergeben", en:"Taken", pt:"Ocupado"},
  "Vérification…": {lb:"Kucken…", de:"Prüfung…", en:"Checking…", pt:"A verificar…"},
  "À confirmer": {lb:"Ze bestätegen", de:"Zu bestätigen", en:"To confirm", pt:"A confirmar"},
  "Une extension est libre ?": {lb:"Eng Extensioun ass fräi?", de:"Eine Endung ist frei?", en:"An extension is free?", pt:"Uma extensão está livre?"},
  "On la réserve à votre nom": {lb:"Mir reservéieren se op Ären Numm", de:"Wir sichern sie auf Ihren Namen", en:"We reserve it in your name", pt:"Reservamo-la em seu nome"},
  "et on la gère pour vous, sans que vous ayez à créer de compte.": {lb:"a mir geréieren se fir Iech, ouni datt Dir e Kont musst uleeën.", de:"und verwalten sie für Sie, ganz ohne Konto.", en:"and manage it for you, with no account to create.", pt:"e gerimo-la por si, sem ter de criar conta."},
  "Réserver ce nom": {lb:"Dësen Numm reservéieren", de:"Diesen Namen sichern", en:"Reserve this name", pt:"Reservar este nome"},
  "Vérification indicative en temps réel. La disponibilité définitive est confirmée au moment de la réservation.":
    {lb:"Indikativ Kontroll an Echtzäit. Déi definitiv Disponibilitéit gëtt bei der Reservatioun bestätegt.",
     de:"Unverbindliche Echtzeit-Prüfung. Die endgültige Verfügbarkeit wird bei der Reservierung bestätigt.",
     en:"Indicative real-time check. Final availability is confirmed at the moment of reservation.",
     pt:"Verificação indicativa em tempo real. A disponibilidade definitiva é confirmada no momento da reserva."},

  /* ---------- À propos ---------- */
  "Qui sommes-nous": {lb:"Wie mir sinn", de:"Wer wir sind", en:"Who we are", pt:"Quem somos"},
  "Une agence web luxembourgeoise, à taille humaine": {lb:"Eng lëtzebuergesch Web-Agence op mënschlecher Gréisst", de:"Eine luxemburgische Webagentur mit menschlichem Maß", en:"A Luxembourg web agency on a human scale", pt:"Uma agência web luxemburguesa à escala humana"},
  "NS Development accompagne les commerçants luxembourgeois pour réussir en ligne. On parle votre langue, on connaît votre marché, et on va droit au but.":
    {lb:"NS Development begleet lëtzebuergesch Geschäftsleit fir online erfollegräich ze sinn. Mir schwätzen Är Sprooch, mir kennen Äre Marché, a mir kommen direkt op de Punkt.",
     de:"NS Development begleitet luxemburgische Händler zum Erfolg im Netz. Wir sprechen Ihre Sprache, kennen Ihren Markt und kommen direkt zur Sache.",
     en:"NS Development helps Luxembourg businesses succeed online. We speak your language, we know your market, and we get straight to the point.",
     pt:"A NS Development acompanha os comerciantes luxemburgueses para terem sucesso online. Falamos a sua língua, conhecemos o seu mercado e vamos direto ao assunto."},
  "Pas d'intermédiaire, pas de jargon : un contact direct, un travail soigné et un site qui vous ramène de vrais clients.":
    {lb:"Keen Tëschenhändler, kee Jargon: een direkte Kontakt, eng gepflegt Aarbecht an eng Säit déi Iech richteg Clientë bréngt.",
     de:"Kein Zwischenhändler, kein Fachjargon: direkter Kontakt, sorgfältige Arbeit und eine Website, die echte Kunden bringt.",
     en:"No middleman, no jargon: a direct contact, careful work and a site that brings you real customers.",
     pt:"Sem intermediários, sem jargão: um contacto direto, um trabalho cuidado e um site que lhe traz clientes reais."},
  "Votre contact — conseil & suivi": {lb:"Äre Kontakt — Berodung & Suivi", de:"Ihr Ansprechpartner — Beratung & Betreuung", en:"Your contact — advice & follow-up", pt:"O seu contacto — aconselhamento e acompanhamento"},

  /* ---------- À propos : version renforcée ---------- */
  "NS Development est une société luxembourgeoise, déclarée et autorisée à exercer. Pas une plateforme installée à l'autre bout du monde, pas d'intermédiaire : vous avez un interlocuteur, il connaît votre dossier, et il décroche.": {lb:"NS Development ass eng lëtzebuergesch Gesellschaft, ugemellt a mat enger Etablissementserlaabnis. Keng Plattform um anere Bout vun der Welt, keen Tëschemann: Dir hutt een Uspriechpartner, hie kennt Ären Dossier, an hien hieft of.", de:"NS Development ist eine luxemburgische Gesellschaft, angemeldet und mit Niederlassungsgenehmigung. Keine Plattform am anderen Ende der Welt, kein Zwischenhändler: Sie haben einen Ansprechpartner, er kennt Ihre Akte, und er geht ans Telefon.", en:"NS Development is a Luxembourg company, registered and licensed to trade. Not a platform on the other side of the world, and no middleman: you get one contact, he knows your file, and he picks up the phone.", pt:"A NS Development é uma sociedade luxemburguesa, registada e autorizada a exercer. Não é uma plataforma do outro lado do mundo nem um intermediário: tem um interlocutor, ele conhece o seu processo e atende."},
  "On travaille pour des commerçants, des restaurants et des indépendants d'ici. Des gens qui n'ont ni le temps ni l'envie d'apprendre le vocabulaire du web, et qui veulent surtout que le téléphone sonne et que les tables se remplissent.": {lb:"Mir schaffe fir Händler, Restauranten a Selbststänneger vun hei. Leit, déi weder d'Zäit nach d'Loscht hunn, de Web-Vokabulär ze léieren, a virun allem wëllen, datt den Telefon klengelt an d'Dëscher voll ginn.", de:"Wir arbeiten für Händler, Restaurants und Selbstständige von hier. Menschen, die weder Zeit noch Lust haben, das Web-Vokabular zu lernen, und vor allem wollen, dass das Telefon klingelt und die Tische voll werden.", en:"We work for local shopkeepers, restaurants and independents. People who have neither the time nor the appetite to learn web jargon, and who mainly want the phone to ring and the tables to fill up.", pt:"Trabalhamos para comerciantes, restaurantes e independentes daqui. Pessoas que não têm tempo nem vontade de aprender o vocabulário da web, e que querem sobretudo que o telefone toque e que as mesas se encham."},
  "Une fois le site en ligne, vous ne nous perdez pas de vue. Factures, statistiques et demandes de modification se suivent depuis votre espace client, sur le site comme sur votre téléphone.": {lb:"Wann d'Säit eemol online ass, verléiert Dir eis net aus den Aen. Rechnungen, Statistiken an Ännerungsufroe verfollegt Dir an Ärem Client-Beräich, op der Säit wéi um Handy.", de:"Sobald die Website online ist, verlieren Sie uns nicht aus den Augen. Rechnungen, Statistiken und Änderungswünsche verfolgen Sie in Ihrem Kundenbereich, auf der Website wie auf dem Handy.", en:"Once the site is live, you do not lose sight of us. Invoices, statistics and change requests are all tracked from your client area, on the site and on your phone.", pt:"Depois de o site estar online, não nos perde de vista. Faturas, estatísticas e pedidos de alteração seguem-se a partir da sua área de cliente, no site e no telemóvel."},
  "Société luxembourgeoise": {lb:"Lëtzebuerger Gesellschaft", de:"Luxemburgische Gesellschaft", en:"Luxembourg company", pt:"Sociedade luxemburguesa"},
  "Autorisation d'établissement": {lb:"Etablissementserlaabnis", de:"Niederlassungsgenehmigung", en:"Trading licence", pt:"Licença de estabelecimento"},
  "Serveurs au Luxembourg": {lb:"Server zu Lëtzebuerg", de:"Server in Luxemburg", en:"Servers in Luxembourg", pt:"Servidores no Luxemburgo"},
  "À Contern, pas ailleurs": {lb:"Zu Contern, soss néierens", de:"In Contern, sonst nirgends", en:"In Contern, nowhere else", pt:"Em Contern, e não noutro sítio"},
  "Les langues de vos clients": {lb:"D'Sprooche vun Äre Clienten", de:"Die Sprachen Ihrer Kunden", en:"Your customers' languages", pt:"As línguas dos seus clientes"},
  "Parler à Sam":        {lb:"Mam Sam schwätzen", de:"Mit Sam sprechen", en:"Talk to Sam",   pt:"Falar com o Sam"},

  /* ---------- Contact ---------- */
  "Parlons de votre projet": {lb:"Loosst eis iwwer Äre Projet schwätzen", de:"Sprechen wir über Ihr Projekt", en:"Let's talk about your project", pt:"Vamos falar do seu projeto"},
  "Un devis gratuit, sans engagement, sous 24 h. Dites-nous ce dont vous avez besoin.":
    {lb:"Eng gratis Offert, ouni Engagement, bannent 24 Stonnen. Sot eis wat Dir braucht.",
     de:"Ein kostenloses, unverbindliches Angebot innerhalb von 24 Stunden. Sagen Sie uns, was Sie brauchen.",
     en:"A free, no-commitment quote within 24 hours. Tell us what you need.",
     pt:"Um orçamento grátis, sem compromisso, em 24 h. Diga-nos do que precisa."},
  "Email": {lb:"E-Mail", de:"E-Mail", en:"Email", pt:"Email"},
  "Zone": {lb:"Zon", de:"Gebiet", en:"Area", pt:"Zona"},
  "Luxembourg & alentours": {lb:"Lëtzebuerg an Ëmgéigend", de:"Luxemburg und Umgebung", en:"Luxembourg & surroundings", pt:"Luxemburgo e arredores"},
  "Réponse": {lb:"Äntwert", de:"Antwort", en:"Response", pt:"Resposta"},
  "Sous 24 h ouvrées": {lb:"Bannent 24 Aarbechtsstonnen", de:"Innerhalb von 24 Werkstunden", en:"Within 24 working hours", pt:"Em 24 h úteis"},
  "Nom": {lb:"Numm", de:"Name", en:"Name", pt:"Nome"},
  "Téléphone": {lb:"Telefon", de:"Telefon", en:"Phone", pt:"Telefone"},
  "Type de projet": {lb:"Zort Projet", de:"Projektart", en:"Project type", pt:"Tipo de projeto"},
  "Choisir…": {lb:"Auswielen…", de:"Auswählen…", en:"Choose…", pt:"Escolher…"},
  "Site restaurant / réservation": {lb:"Restaurant-Säit / Reservatioun", de:"Restaurant-Website / Reservierung", en:"Restaurant site / booking", pt:"Site de restaurante / reservas"},
  "E-commerce / take-away": {lb:"E-Commerce / Take-away", de:"E-Commerce / Take-away", en:"E-commerce / takeaway", pt:"E-commerce / take-away"},
  "Refonte de site existant": {lb:"Iwwerschaffung vun enger bestehender Säit", de:"Relaunch einer bestehenden Website", en:"Redesign of an existing site", pt:"Renovação de site existente"},
  "Autre": {lb:"Anescht", de:"Sonstiges", en:"Other", pt:"Outro"},
  "Votre message": {lb:"Är Noriicht", de:"Ihre Nachricht", en:"Your message", pt:"A sua mensagem"},
  "Envoyer ma demande": {lb:"Meng Ufro schécken", de:"Anfrage senden", en:"Send my request", pt:"Enviar o meu pedido"},
  "✓ Merci ! Votre messagerie va s'ouvrir avec votre demande pré-remplie. Envoyez-la et on vous répond sous 24 h.":
    {lb:"✓ Merci! Är Messagerie geet op mat Ärer virausgefëllter Ufro. Schéckt se an mir äntweren bannent 24 Stonnen.",
     de:"✓ Danke! Ihr E-Mail-Programm öffnet sich mit der vorausgefüllten Anfrage. Senden Sie sie ab, wir antworten innerhalb von 24 Stunden.",
     en:"✓ Thank you! Your mail app will open with your request pre-filled. Send it and we'll reply within 24 hours.",
     pt:"✓ Obrigado! O seu email vai abrir com o pedido pré-preenchido. Envie-o e respondemos em 24 h."},
  "Une erreur est survenue. Écrivez-nous directement à info@nsdevelopment.lu":
    {lb:"Et ass e Feeler geschitt. Schreift eis direkt op info@nsdevelopment.lu",
     de:"Ein Fehler ist aufgetreten. Schreiben Sie uns direkt an info@nsdevelopment.lu",
     en:"Something went wrong. Write to us directly at info@nsdevelopment.lu",
     pt:"Ocorreu um erro. Escreva-nos diretamente para info@nsdevelopment.lu"},

  /* ---------- Footer ---------- */
  "Création de sites web modernes pour les commerçants, restaurants et indépendants du Luxembourg.":
    {lb:"Erstellung vu modernen Websäite fir Geschäftsleit, Restauranten a Selbststänneger zu Lëtzebuerg.",
     de:"Erstellung moderner Websites für Händler, Restaurants und Selbstständige in Luxemburg.",
     en:"Modern websites for shops, restaurants and self-employed professionals in Luxembourg.",
     pt:"Criação de sites modernos para comerciantes, restaurantes e independentes no Luxemburgo."},
  "© 2026 NS Development. Tous droits réservés.": {lb:"© 2026 NS Development. All Rechter virbehalen.", de:"© 2026 NS Development. Alle Rechte vorbehalten.", en:"© 2026 NS Development. All rights reserved.", pt:"© 2026 NS Development. Todos os direitos reservados."},
  "Mentions légales": {lb:"Impressum", de:"Impressum", en:"Legal notice", pt:"Menções legais"},
  "Confidentialité": {lb:"Dateschutz", de:"Datenschutz", en:"Privacy", pt:"Privacidade"}
};

/* ---------- Moteur ---------- */
(function(){
  const SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT']);
  let langue = localStorage.getItem('ns-lang') || 'fr';

  // Traduit une chaîne. Renvoie l'original si aucune traduction n'existe.
  window.nsT = function(txt){
    if(langue === 'fr') return txt;
    const e = NS_I18N[txt];
    return (e && e[langue]) ? e[langue] : txt;
  };

  /* Les titres en data-split sont découpés en <span> par le NS Motion Kit :
     leur texte n'existe plus comme un seul nœud. On les traite à part, en
     reconstruisant le découpage à l'identique après traduction. */
  function redecouper(el, texte){
    const mode = el.getAttribute('data-split') || 'words';
    const parts = mode === 'chars' ? texte.split('') : texte.split(' ');
    const cls = mode === 'chars' ? 'ns-char' : 'ns-word';
    el.textContent = '';
    el.classList.add('ns-split');
    parts.forEach((p,i)=>{
      const span = document.createElement('span');
      span.className = cls;
      if(mode === 'chars' && p === ' ') span.innerHTML = '&nbsp;';
      else span.textContent = p;
      span.style.transitionDelay = i * (mode === 'chars' ? 25 : 60) + 'ms';
      el.appendChild(span);
      if(mode !== 'chars') el.appendChild(document.createTextNode(' '));
    });
  }

  function memoriserSplit(racine){
    racine.querySelectorAll('[data-split]').forEach(el=>{
      if(!el.dataset.nsFrSplit) el.dataset.nsFrSplit = el.textContent.replace(/\s+/g,' ').trim();
    });
  }

  function appliquerSplit(){
    document.querySelectorAll('[data-split]').forEach(el=>{
      const fr = el.dataset.nsFrSplit;
      if(!fr) return;
      const cible = window.nsT(fr);
      if(el.textContent.replace(/\s+/g,' ').trim() !== cible) redecouper(el, cible);
    });
  }

  // Mémorise le texte français d'origine pour pouvoir revenir en arrière
  function memoriser(racine){
    memoriserSplit(racine);
    const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
    let n;
    while((n = w.nextNode())){
      if(SKIP.has(n.parentNode.nodeName)) continue;
      if(n.nodeValue.trim() && !n.nsFr) n.nsFr = n.nodeValue;
    }
    racine.querySelectorAll('[placeholder]').forEach(el=>{
      if(!el.dataset.nsFrPh) el.dataset.nsFrPh = el.placeholder;
    });
  }

  function appliquer(){
    appliquerSplit();
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while((n = w.nextNode())){
      if(SKIP.has(n.parentNode.nodeName) || !n.nsFr) continue;
      if(n.parentNode.closest && n.parentNode.closest('[data-split],[data-cycle]')) continue;
      const brut = n.nsFr.trim();
      if(!brut) continue;
      const trad = window.nsT(brut);
      if(trad !== brut) n.nodeValue = n.nsFr.replace(brut, trad);
      else n.nodeValue = n.nsFr;
    }
    document.querySelectorAll('[data-ns-fr-ph]').forEach(el=>{
      el.placeholder = window.nsT(el.dataset.nsFrPh);
    });
    // Mot défilant du hero (géré par ns-fx.js)
    const cy=document.querySelector('[data-cycle]');
    if(cy && cy._nsRetr) cy._nsRetr();
    document.documentElement.lang = langue;
    document.querySelectorAll('.lang-b').forEach(b=>{
      b.classList.toggle('on', b.dataset.lang === langue);
    });
  }

  /* Appelé par le simulateur après chaque régénération de son contenu :
     les nouveaux textes sont mémorisés en français puis traduits.
     Sans ça, un clic dans le simulateur ferait repasser ses libellés en français. */
  window.nsRetranslate = function(){
    memoriser(document.body);
    appliquer();
  };

  window.nsSetLang = function(code){
    langue = code;
    localStorage.setItem('ns-lang', code);
    window.nsRetranslate();
  };

  window.nsLangue = () => langue;

  document.addEventListener('DOMContentLoaded', ()=>{
    // Construit le sélecteur de langue
    const hote = document.getElementById('langSel');
    if(hote){
      hote.innerHTML = NS_LANGS.map(l =>
        '<button type="button" class="lang-b" data-lang="'+l.code+'" title="'+l.nom+'" aria-label="'+l.nom+'">'+l.label+'</button>'
      ).join('');
      hote.querySelectorAll('.lang-b').forEach(b=>{
        b.addEventListener('click', ()=> window.nsSetLang(b.dataset.lang));
      });
    }
    memoriser(document.body);
    if(langue !== 'fr') window.nsSetLang(langue); else appliquer();
  });
})();
