/* ============================================================================
   Kinésithérapie Weber — traductions
   ----------------------------------------------------------------------------
   Le français est écrit en clair dans les pages HTML : c'est la langue de
   référence. Ce fichier ne contient que les autres langues.

   Pour corriger une phrase en luxembourgeois : on modifie ici, rien d'autre.
   Pour ajouter l'allemand ou l'anglais : on duplique le bloc « lb » avec le
   code de la langue, le bouton apparaît tout seul dans la navigation.

   ⚠ Les clés doivent correspondre exactement aux attributs data-i18n des
   pages. Le script `verifier-traductions.py` du dossier le contrôle.
   ============================================================================ */
window.NS_TRADUCTIONS = {

  lb: {
    libelle: 'Lëtzebuergesch',
    court: 'LB',
    dict: {

      /* ---------------------------------------------------------------
         Éléments communs : marque, navigation, bandeau, pied de page
         --------------------------------------------------------------- */
      'marque.sous': "Kinesitherapie",

      'bar.demo': "Demo-Maquette gemaach vun <strong>NS Development</strong> — Websäite-Kreatioun zu Lëtzebuerg",
      'bar.demo.bio': "Demo-Maquette gemaach vun <strong>NS Development</strong> — Websäite-Kreatioun zu Lëtzebuerg",
      'bar.demo.rdv': "Demo-Maquette gemaach vun <strong>NS Development</strong> — Websäite-Kreatioun zu Lëtzebuerg ; d'Rendez-vousen, déi hei geholl ginn, bleiwen an Ärem Browser.",

      'nav.accueil': "Haaptsäit",
      'nav.soins': "Behandlungen",
      'nav.cabinet': "De Cabinet",
      'nav.rdv': "Rendez-vous",
      'nav.nora': "Nora Weber",
      'nav.cta': "Termin huelen",
      'nav.menu': "Menü opmaachen",
      'nav.langue': "Sprooch wielen",

      'jour.lundi': "Méindeg",
      'jour.mardi': "Dënschdeg",
      'jour.mercredi': "Mëttwoch",
      'jour.jeudi': "Donneschdeg",
      'jour.vendredi': "Freideg",
      'jour.samedi': "Samschdeg",
      'jour.dimanche': "Sonndeg",
      'jour.ferme': "Zou",

      'pied.intro': "Cabinet fir Kinesitherapie vun der Nora Weber, zu Junglinster, Kanton Gréivemaacher. Orthopedesch Rehabilitatioun, Sport, lymphatesch Drainage, Atmung.",
      'pied.cabinet': "De Cabinet",
      'pied.infos': "Praktesch Infoen",
      'pied.contact': "Kontakt",
      'pied.horaires': "Ëffnungszäiten",
      'pied.horaires.liste':
        "<li>Méi – Mët &nbsp;8.00–12.00 · 13.30–18.30</li>" +
        "<li>Donneschdeg &nbsp;8.00–12.00 · 13.30–19.00</li>" +
        "<li>Freideg &nbsp;8.00–12.00 · 13.30–17.00</li>" +
        "<li>Samschdeg &nbsp;9.00–12.00</li>" +
        "<li>Sonndeg &nbsp;zou</li>",
      'pied.ns': "Realiséiert vun <b>NS&nbsp;Development</b>",

      /* ---------------------------------------------------------------
         Page d'accueil
         --------------------------------------------------------------- */
      'acc.titre': "Kinesitherapie Weber — Kinesitherapeutin · Junglinster, Lëtzebuerg",
      'acc.meta': "Cabinet fir Kinesitherapie vun der Nora Weber zu Junglinster. Orthopedesch Rehabilitatioun, Sportkinesitherapie, lymphatesch Drainage, Atmungstherapie. Rendez-vous online, 24 Stonnen op 24.",

      'acc.sur': "Junglinster · Groussherzogtum Lëtzebuerg",
      'acc.h1a': "Erëmfannen",
      'acc.h1b': "déi richteg Beweegung, ouni Péng.",
      'acc.chapeau': "Cabinet fir Kinesitherapie vun der <strong class='hl'>Nora Weber</strong>. Eng eenzeg Therapeutin, ee Patient op eemol, a wierklech Zäit fir ze verstoen, wou d'Péng hierkënnt, ier se behandelt gëtt.",
      'acc.cta1': "En Termin reservéieren",
      'acc.meta1': "Spezialisatiounsberäicher",
      'acc.meta2': "Sproochen am Cabinet",
      'acc.meta3': "fräi Terminer dës Woch",
      'acc.prochain': "nächste fräien Termin",

      'acc.alt.consultation': "Kinesitherapie-Séance: Evaluatioun vun der Kierperhaltung am Stoen an engem hellen Cabinet",
      'acc.alt.epaule': "Aarbecht un der Beweeglechkeet vun der Schëller mat enger Patientin",
      'acc.alt.taping': "Taping-Verband op der Schëller vun enger Sportlerin",
      'acc.alt.drainage': "Manuell lymphatesch Drainage bei enger leiender Patientin",
      'acc.alt.exercice': "Gefouert therapeutesch Übung am Cabinet",
      'acc.alt.bilan': "Ënnersuchung vun der Schëllerbeweeglechkeet, Patientin vun hanne gesinn",
      'acc.alt.seance': "Rehabilitatiounsséance op der Tabelle an engem hellen Cabinet",
      'acc.alt.facade': "Steefassad vum Cabinet fir Kinesitherapie Weber zu Junglinster",

      'acc.bande1': "Méi–Fre 8–18.30 Auer · Sa 9–12 Auer",
      'acc.bande2': "Parking virum Cabinet, ebenerdegen Zougang",
      'acc.bande3t': "CNS-konventionéiert",
      'acc.bande3': "Op medezinesch Verschreiwung, normale Remboursement",
      'acc.bande4t': "Hausbesich",
      'acc.bande4': "Fir Patienten, déi net kënne bei eis kommen",

      'acc.s1.oeil': "Wat ech behandelen",
      'acc.s1.titre': "Véier Spezialitéiten, eng eenzeg Aart a Weis ze schaffen",
      'acc.s1.texte': "Fir d'éischt de Bilan, duerno d'Behandlung. All Séance hält mat deem op, wat Dir doheem maache kënnt, well d'Rehabilitatioun net un der Dier vum Cabinet ophält.",
      'acc.s1.lien': "All d'Behandlungen am Detail",

      'acc.c1.tag': "Orthopedie · Traumatologie",
      'acc.c1.titre': "Orthopedesch Rehabilitatioun",
      'acc.c1.texte': "No enger Verstauchung, engem Broch oder enger Operatioun, Arthrose, Réck an Hals, déi wéi doen. Fir d'éischt d'Beweeglechkeet, duerno d'Kraaft, duerno d'Vertrauen an d'Beweegung.",
      'acc.c2.tag': "Sport",
      'acc.c2.titre': "Sportkinesitherapie",
      'acc.c2.texte': "Blessur, luesen Nei-Ufank, Preventioun, Taping. Egal ob Dir sonndes laft oder am Veräin spillt, d'Zil ass datselwecht: zréckkommen ouni Réckfall.",
      'acc.c3.tag': "Drainage · Onkologie",
      'acc.c3.titre': "Manuell lymphatesch Drainage",
      'acc.c3.texte': "Ödemer, schwéier Been, a virun allem d'Begleedung no enger Kriibsoperatioun: eng lues, mëll a reegelméisseg Aarbecht, wou Gedold esou vill zielt wéi Technik.",
      'acc.c4.tag': "Atmung",
      'acc.c4.titre': "Atmungsrehabilitatioun",
      'acc.c4.texte': "Erwuessener a Kanner: verschleimte Loftweeër, Bronchiolitis beim Puppelchen, Asthma, kuerzen Otem no enger Krankheet oder enger Operatioun.",

      'acc.s2.oeil': "De Geescht vum Cabinet",
      'acc.s2.titre': "E Cabinet, keng Kette",
      'acc.s2.chapeau': "Hei setzt Iech keen ënner eng Maschinn, wärend ee sech ëm dräi aner Patienten am Raum niewendru këmmert. Eng Séance, eng Persoun, Zäit.",
      'acc.s2.liste':
        "<li><strong>E komplette Bilan beim éischte Besuch</strong> — 45 Minutten, fir d'Geschicht vun der Péng ze verstoen, net just d'Plaz, wou et wéi deet.</li>" +
        "<li><strong>En erkläerte Behandlungsplang</strong> — Dir wësst, wéi vill Séancen, firwat, a wat mir uviséieren.</li>" +
        "<li><strong>Übungen mat heem</strong> — einfach, realistesch, un Ären Alldag ugepasst.</li>" +
        "<li><strong>E Kontakt mat Ärem Dokter</strong> — Bericht un de Verschreiwer, wann et néideg ass.</li>",

      'acc.s3.oeil': "Rendez-vous",
      'acc.s3.titre': "Den Agenda vum Cabinet, live",
      'acc.s3.chapeau': "De Planning op dëser Säit ass deen vum Cabinet. Wann e Patient reservéiert, verschwënnt den Termin direkt fir déi nächst. Kee Uruff ze maachen, keng duebel Reservatioun, kee Rappell ze geréieren.",
      'acc.s3.stat1': "Reservatioun op",
      'acc.s3.stat2': "Fräi Terminer op 7 Deeg",
      'acc.s3.cta': "Fräi Terminer kucken",

      'acc.s4.oeil': "De Cabinet",
      'acc.s4.titre': "Roueg, zu Junglinster",
      'acc.s4.chapeau': "E Steenhaus aus der Regioun, en helle Behandlungsraum, e Plateau fir d'Übungen. Ee parkt virdrun, ee geet ebenerdeg eran, an ee waart net.",
      'acc.s4.cta': "Praktesch Infoen an Uweisung",

      'acc.citation': "« Mäi Beruff ass net, eng Péng fir eng Stonn verschwanne ze loossen. Et ass, Iech e Kierper zréckzeginn, virun deem Dir keng Angscht méi hutt. »" +
        "<span class='quote__sig'>Nora Weber</span>",
      'acc.citation.lien': "Hire Wee an hir Expertise",

      'acc.cta.oeil': "Eng Péng, déi net fortgeet&nbsp;?",
      'acc.cta.titre': "Huelt elo den éischte Rendez-vous",
      'acc.cta.texte': "Wielt Äre Grond, Ären Termin, a schonn ass reservéiert. D'Bestätegung kritt Dir direkt. Ouni Ordonnance rufft Dir eis besser fir d'éischt un: mir soen Iech, wat ze maachen ass.",
      'acc.cta.b1': "Online reservéieren",
      'acc.cta.b2': "De Cabinet uruffen",

      /* ---------------------------------------------------------------
         Page « Les soins »
         --------------------------------------------------------------- */
      'soins.titre': "D'Behandlungen — Kinesitherapie Weber · Junglinster, Lëtzebuerg",
      'soins.meta': "Orthopedesch an traumatologesch Rehabilitatioun, Sportkinesitherapie, manuell lymphatesch Drainage no enger Kriibsoperatioun, Atmungsrehabilitatioun. Cabinet Weber zu Junglinster.",

      'soins.oeil': "D'Behandlungen",
      'soins.h1': "Wat mir zesumme behandele kënnen",
      'soins.chapeau': "Véier Beräicher, all CNS-konventionéiert an op medezinesch Verschreiwung iwwerholl. Wann Är Situatioun a keng Këscht passt, rufft un: mir weisen Iech de Wee, och wann en net an dëse Cabinet féiert.",

      'soins.alt1': "Mobilisatioun vun der Schëller vun enger Patientin, vun hanne gesinn",
      'soins.alt2': "Rosa Taping op der Schëller vun enger Patientin",
      'soins.alt3': "Manuell lymphatesch Drainage bei enger Patientin op der Tabelle",
      'soins.alt4': "Gefouert Atmungsübung am Cabinet",

      'soins.b1.tag': "01 — Orthopedie &amp; Traumatologie",
      'soins.b1.titre': "Orthopedesch Rehabilitatioun",
      'soins.b1.chapeau': "De gréissten Deel vun der Aarbecht am Cabinet. Alles wat mat Schanken, Gelenker, Muskelen a Sehnen ze dinn huet, no engem Accident, enger Operatioun, oder einfach no Joeren an enger schlechter Haltung.",
      'soins.b1.liste':
        "<li>No enger Operatioun: Hëft- oder Knéiprothes, Kräizband, Rotatorenmanschett, Wirbelsail</li>" +
        "<li>Verstauchungen, Bréch, Verrenkungen, Sehnenentzündungen</li>" +
        "<li>Réckwéi, chronesch Lombalgie, Ischias, Halswirbelbeschwéieren</li>" +
        "<li>Arthrose: d'Beweeglechkeet halen an d'Schübe berouegen</li>" +
        "<li>Haltungsrehabilitatioun an Aarbecht um Gangbild</li>",
      'soins.b1.note': "<strong class='hl'>Typesch Dauer:</strong> 45 Min. fir den éischte Bilan, duerno 30 Min. pro Séance.",

      'soins.b2.tag': "02 — Sport",
      'soins.b2.titre': "Sportkinesitherapie",
      'soins.b2.chapeau': "Sech blesséieren, dat passéiert. E Réckfall, well ee ze séier erëm ugefaang huet, dee léisst sech vermeiden. D'Aarbecht leeft an dräi Etappen: berouegen, opbauen, nach eng Kéier testen ier et zréck op de Terrain geet.",
      'soins.b2.liste':
        "<li>Akut Blessuren: Muskelfaserrass, Knëchelverstauchung, Werferschëller, Leeferknéi</li>" +
        "<li>Luesen Nei-Ufank no enger Blessur, mat kloere Krittäre fir de Retour an de Sport</li>" +
        "<li>Exzentresch Kräftegung a propriozeptiv Aarbecht</li>" +
        "<li>Taping a Strapping</li>" +
        "<li>Preventioun: Ongläichgewichter fannen, ier se eppes futti maachen</li>",
      'soins.b2.note': "<strong class='hl'>Gutt ze wëssen:</strong> Amateurveräin oder Sonndessport, de Protokoll ass dee selwechten. Wat sech ännert, ass d'Zäit, déi ee sech gëtt.",

      'soins.b3.tag': "03 — Drainage &amp; Onkologie",
      'soins.b3.titre': "Manuell lymphatesch Drainage",
      'soins.b3.chapeau': "Eng lues, ganz mëll, bal rouhereg Technik. Si verlaangt méi Reegelméissegkeet wéi Kraaft, an eng richteg Kenntnes vum lymphatesche Reseau.",
      'soins.b3.liste':
        "<li>Begleedung no enger Kriibsoperatioun, virun allem un der Broscht</li>" +
        "<li>Lymphödemer an den Äerm an de Been</li>" +
        "<li>Ödemer no enger Operatioun oder engem Trauma</li>" +
        "<li>Schwéier Been, venös Insuffizienz</li>" +
        "<li>Rotschléi fir Bandagen an Auto-Drainage doheem</li>",
      'soins.b3.note': "<strong class='hl'>Typesch Dauer:</strong> 60 Minutten. Dat ass eng Behandlung, déi ee net iwwert d'Knéi brécht.",

      'soins.b4.tag': "04 — Atmung",
      'soins.b4.titre': "Atmungsrehabilitatioun",
      'soins.b4.chapeau': "Beim Erwuessene wéi beim ganz Klengen. D'Zil ass einfach: fräi maachen, an duerno erëm léieren ouni Ustrengung ze otmen.",
      'soins.b4.liste':
        "<li>Bronchiolitis beim Puppelchen a verschleimte Loftweeër beim jonke Kand</li>" +
        "<li>Widderhuelend Bronchiten, COPD, Asthma</li>" +
        "<li>Otem erëmfannen no engem Spidolsopenthalt oder enger Operatioun</li>" +
        "<li>Kontrolléiert Otmen an effikassen Houscht léieren</li>",
      'soins.b4.note': "<strong class='hl'>Mat de Puppelcher:</strong> kuerz Séancen, Terminer moies fréi reservéiert, an ëmmer en Elterendeel derbäi.",

      'soins.etapes.oeil': "Wéi et ofleeft",
      'soins.etapes.titre': "Eng Betreiung a véier Etappen",
      'soins.e1.tag': "Etapp 1",
      'soins.e1.titre': "De Bilan",
      'soins.e1.texte': "45 Minutten. Är Geschicht, déi klinesch Ënnersuchung, d'Tester. Mir sichen d'Ursaach, net just de Symptom.",
      'soins.e2.tag': "Etapp 2",
      'soins.e2.titre': "De Plang",
      'soins.e2.texte': "Unzuel vu Séancen, Rhythmus, Ziler. Dir wësst, wou et higeet a wéi mir gesinn, datt mir do sinn.",
      'soins.e3.tag': "Etapp 3",
      'soins.e3.titre': "D'Séancen",
      'soins.e3.texte': "Manuell Therapie, Übungen, Erklärungen. An ëmmer eppes, wat Dir mat heemhuelt.",
      'soins.e4.tag': "Etapp 4",
      'soins.e4.titre': "D'Selbststännegkeet",
      'soins.e4.texte': "D'Enn vun der Behandlung ass de Moment, wou Dir mech net méi braucht. Dat ass d'Zil.",

      'soins.prat.oeil': "Verschreiwung &amp; Remboursement",
      'soins.prat.titre': "Déi praktesch Froen",
      'soins.prat.liste':
        "<li><strong>Et brauch eng Ordonnance.</strong> Kinesitherapie gëtt op Verschreiwung vun Ärem Hausdokter oder vun Ärem Spezialist gemaach. Bréngt se an déi éischt Séance mat.</li>" +
        "<li><strong>De Cabinet ass CNS-konventionéiert.</strong> D'Séancë ginn no den offiziellen Tariffer vun der Caisse nationale de santé iwwerholl. Den Detail gëtt Iech am Cabinet erkläert, ier et lassgeet.</li>" +
        "<li><strong>Hausbesich ginn et.</strong> Si si fir Patienten, déi net kënne bei eis kommen, op Uweisung vum Dokter.</li>" +
        "<li><strong>E verpassten Termin gëtt ugekënnegt.</strong> En Termin, deen den Dag virdrun ofgesot gëtt, geet un een aneren, dee waart.</li>",
      'soins.cta.titre': "Ass Är Ordonnance prett&nbsp;?",
      'soins.cta.texte': "Wielt direkt Ären Termin. Deen éischte Rendez-vous dauert 45 Minutten.",

      /* ---------------------------------------------------------------
         Page « Le cabinet »
         --------------------------------------------------------------- */
      'cab.titre': "De Cabinet — Kinesitherapie Weber · 21 rue de la Gare, Junglinster",
      'cab.meta': "Cabinet fir Kinesitherapie Weber, 21 rue de la Gare, L-6117 Junglinster . Ëffnungszäiten, Uweisung, Parking, éischte Besuch, Kontakt an Telefon.",

      'cab.oeil': "Praktesch Infoen",
      'cab.h1a': "Wëllkomm",
      'cab.h1b': "am Cabinet zu Junglinster.",
      'cab.chapeau': "E Steenhaus aus der Regioun, ewech vum Kaméidi, um Agank vum Duerf. Ee parkt virdrun, ee geet ebenerdeg eran, an ee fänkt op d'Zäit un.",
      'cab.itineraire': "Uweisung",
      'cab.alt.facade': "Steefassad vum Cabinet Kinesitherapie Weber, mat wäisse Fënsteren an donkele Lueden",

      'cab.h.oeil': "Ëffnungszäiten",
      'cab.h.titre': "Wéini ech consultéieren",
      'cab.h.note': " — D'Terminer um Enn vum Dag a samschdes ginn séier fort: reservéiert se am Viraus.",

      'cab.c.oeil': "Kontakt &amp; Uweisung",
      'cab.c.titre': "Wou Dir mech fannt",
      'cab.c.adresse': "Adress",
      'cab.c.adresse.v': "21, rue de la Gare<br>L-6117 Junglinster",
      'cab.c.tel': "Telefon vum Cabinet",
      'cab.c.mobile': "Handy",
      'cab.c.mail': "E-Mail",
      'cab.c.mail.v': "contact@kine-weber.lu",
      'cab.c.parking': "Parking",
      'cab.c.parking.v': "Gratis Plazen virum Cabinet, ouni Zäitbegrenzung",
      'cab.c.acces': "Zougänglechkeet",
      'cab.c.acces.v': "Ebenerdegen Agank, Behandlungsraum am Äerdgeschoss",

      'cab.map.oeil': "Higoen",
      'cab.map.titre': "Zu Junglinster, zwanzeg Minutten vun der Haaptstad",
      'cab.map.texte': "Junglinster ass den Haaptuert vu senger Gemeng, am Kanton Gréivemaacher. Vu Lëtzebuerg-Stad aus sinn et ongeféier zwanzeg Minutten iwwer d'N11.",
      'cab.map.iframe': "Kaart: 21 rue de la Gare, L-6117 Junglinster",
      'cab.map.note': "De Marker steet am Zentrum vu Junglinster. " +
        "<a href='https://www.google.com/maps/search/?api=1&query=21+rue+de+la+Gare+6117+Junglinster+Luxembourg' target='_blank' rel='noopener' style='color:var(--taupe-deep)'>A Google Maps opmaachen</a>",

      'cab.v.oeil': "Äre éischte Besuch",
      'cab.v.titre': "Wat Dir matbrénge musst",
      'cab.v.indispensable': "Onverzichtbar",
      'cab.v.utile': "Nëtzlech",
      'cab.v1.titre': "D'Ordonnance",
      'cab.v1.texte': "D'Verschreiwung vun Ärem Dokter, mat der Unzuel vu Séancen an der Zon, déi ze behandelen ass. Ouni si gëtt et keng CNS-Iwwernahm.",
      'cab.v2.titre': "Är Sozialversécherungskaart",
      'cab.v2.texte': "D'CNS-Kaart, fir d'Dossier direkt an der éischter Séance unzeleeën.",
      'cab.v3.titre': "Är Ënnersuchungen",
      'cab.v3.texte': "Röntgen, MRT, Operatiounsbericht. Och al: si erzielen eng Geschicht, déi déi klinesch Ënnersuchung eleng net seet.",
      'cab.v4.titre': "Bequem Kleeder",
      'cab.v4.texte': "Legging oder Shorts, e bequemt T-Shirt. Mir beweegen, testen a moossen.",

      'cab.cta.oeil': "Alles prett&nbsp;?",
      'cab.cta.titre': "Wielt Ären Termin",
      'cab.cta.texte': "Deen éischte Rendez-vous dauert 45 Minutten. Dir gesitt den eigentlechen Agenda vum Cabinet a reservéiert an dräi Klicken.",
      'cab.cta.b1': "Fräi Terminer kucken",

      /* ---------------------------------------------------------------
         Page « Nora Weber »
         --------------------------------------------------------------- */
      'bio.titre': "Nora Weber, Kinesitherapeutin — Wee an Expertise · Junglinster",
      'bio.meta': "Nora Weber, diploméiert Kinesitherapeutin zu Junglinster: Wee, Spezialisatiounen an Orthopedie, Sport, lymphatescher Drainage an Atmungsrehabilitatioun.",

      'bio.oeil': "D'Therapeutin",
      'bio.h1b': "Weber, Kinesitherapeutin.",
      'bio.chapeau': "Si huet hire Cabinet an hirem Duerf opgemaach, zu Junglinster, an net an der Stad. E bewosste Choix: mat de Leit vun hei schaffen, si iwwer laang Zäit begleeden, an dohinner fuere kënnen, wou een net méi selwer kënnt.",
      'bio.alt.portrait': "Portrait vun der Nora Weber, Kinesitherapeutin, an hirem Cabinet",
      'bio.alt.mains': "Grëff vun der manueller Therapie an enger Séance",
      'bio.meta1': "unerkannt Spezialisatiounen",
      'bio.meta2': "Member vun der Lëtzebuerger<br>Associatioun vun de Kinéen",

      'bio.f.oeil': "Hir Aart a Weis ze schaffen",
      'bio.f.titre': "Verstoen, ier behandelt gëtt",
      'bio.f.texte':
        "<p class='lead' style='max-width:none'>Vill Patienten kommen an de Cabinet mat enger Ordonnance, enger Plaz déi wéi deet, an engem fäerdege Saz: « ee sot mir, dat wier d'Alter ». D'Nora fänkt seelen mat der Behandlungstabelle un. Si fänkt mat Froen un.</p>" +
        "<p>Zënter wéini&nbsp;? No wat&nbsp;? Wat läscht, wat mécht et méi schlëmm&nbsp;? Wéi ee Beruff, wéi eng widderhuelend Beweegungen, wéi eng Positioun aacht Stonnen den Dag&nbsp;? Eng Schëller, déi riets klemmt, erzielt dacks eng Geschicht, déi soss anzwousch ufänkt. Deen éischte Rendez-vous dauert aus deem Grond fënnefavéierzeg Minutten: e schlampege Bilan hëlt ee ni méi op.</p>" +
        "<p>Eréischt duerno kënnt d'Behandlung: manuell Therapie, Mobilisatiounen, Übungen déi lues méi schwéier ginn, an ëmmer eppes fir doheem tëscht zwou Séancen. Well drësseg Minutten d'Woch am Cabinet net vill weien géint déi honnertaachtasechzeg Stonnen, déi eng Woch dauert.</p>" +
        "<p>Den Dag, wou Dir net méi braucht erëmzekommen, ass d'Aarbecht gelongen. Dat ass déi eenzeg Moossnam, déi zielt.</p>",

      'bio.p.oeil': "De Wee",
      'bio.p.titre': "Wou si hierkënnt",
      'bio.p1':
        "<em>2011</em>" +
        "<h3>Diplom an der Kinesitherapie</h3>" +
        "<p>Haute École vun der Provënz Léck, a Belsch — déi meescht Lëtzebuerger Kinesitherapeuten ausbilde sech a Belsch, an Däitschland oder a Frankräich, a loosse dann hiren Diplom am Groussherzogtum unerkennen.</p>",
      'bio.p2':
        "<em>2011 – 2016</em>" +
        "<h3>Éischt Joeren an enger Struktur</h3>" +
        "<p>Rehabilitatiounsservice an engem Spidol, duerno e Gemeinschaftscabinet — Spidol, Rehabilitatiounszentrum, Gemeinschaftscabinet&nbsp;: do baut sech d'Hand an de klinesche Bléck op.</p>",
      'bio.p3':
        "<em>2016 – 2020</em>" +
        "<h3>Zousätzlech Spezialisatiounen</h3>" +
        "<p>Manuell lymphatesch Drainage a Rehabilitatioun no enger Kriibsoperatioun, Sportkinesitherapie, Atmungsrehabilitatioun. Véier Kompetenzen, ënnerhale mat kontinuéierlecher Weiderbildung.</p>",
      'bio.p4':
        "<em>2021</em>" +
        "<h3>Opmaache vum Cabinet zu Junglinster</h3>" +
        "<p>E Steenhaus aus der Regioun, e Behandlungsraum, e Plateau fir d'Übungen. De Cabinet empfänkt op Rendez-vous, vu méindes bis freides.</p>",

      'bio.e.oeil': "Hir Expertise",
      'bio.e.titre': "Véier unerkannt Spezialisatiounen",
      'bio.e.texte': "Dës Kompetenze sinn déi, déi bei der Lëtzebuerger Associatioun vun de Kinesitherapeuten deklaréiert sinn, déi den offiziellen Annuaire vum Beruff féiert.",
      'bio.e1.titre': "Orthopedie &amp; Traumatologie",
      'bio.e1.texte': "No enger Operatioun, Verstauchungen, Bréch, Arthrose, schmerzhaft Wirbelsail. De Kär vun der Aarbecht am Cabinet.",
      'bio.e2.titre': "Atmungsrehabilitatioun",
      'bio.e2.texte': "Vum verschleimte Puppelchen bis zum Erwuessenen, deen no engem Spidolsopenthalt ausser Otem ass. Eng Spezialitéit, déi op dem Land wéineg Cabineten ubidden.",
      'bio.e3.titre': "Sportkinesitherapie",
      'bio.e3.texte': "Blessur, luesen Nei-Ufank, Preventioun an Taping, mat kloere Krittäre virum Retour op de Terrain.",
      'bio.e4.titre': "Lymphatesch Drainage &amp; Onkologie",
      'bio.e4.texte': "Manuell Drainage a Rehabilitatioun no enger Kriibsoperatioun. Eng laang, mëll, reegelméisseg Behandlung, déi esou vill Gedold wéi Technik verlaangt.",


      'bio.pr.oeil': "Wat hir wichteg ass",
      'bio.pr.titre': "Dräi Prinzipien, déi net réckelen",
      'bio.pr1.titre': "Ee Patient op eemol",
      'bio.pr1.texte': "Kee Raum, wou dräi Leit pedalen, wärend eng véiert op hir Rei waart. En reservéierten Termin ass e ganzen Termin.",
      'bio.pr2.titre': "Ëmmer erklären",
      'bio.pr2.texte': "E Patient, dee versteet, wat mat him lass ass, mécht seng Übungen. E Patient, deen net versteet, hält an der drëtter Séance op.",
      'bio.pr3.titre': "Wëssen, wéini ee weiderschéckt",
      'bio.pr3.texte': "Wann et keng Kinesitherapie ass, seet si et a schéckt weider un déi richteg Persoun. Ouni et ze verzéien.",

      'bio.citation': "« Ee behandelt keng Schëller. Ee behandelt een, deen un der Schëller wéi huet. »" +
        "<span class='quote__sig'>Nora Weber</span>",

      'bio.cta.oeil': "Sech kennen léieren",
      'bio.cta.titre': "Deen éischte Rendez-vous dauert 45 Minutten",
      'bio.cta.texte': "D'Zäit fir Är Geschicht ze erzielen, d'Ënnersuchung ze maachen, a mat engem Plang erauszegoen. Reservéiert direkt am Agenda vum Cabinet.",

      /* ---------------------------------------------------------------
         Page « Prendre rendez-vous »
         --------------------------------------------------------------- */
      'rdv.titre': "Rendez-vous huelen — Kinesitherapie Weber · Junglinster",
      'rdv.meta': "Reservéiert Är Kinesitherapie-Séance online, 24 Stonnen op 24, bei der Nora Weber zu Junglinster. Agenda live: schonn ergraffe Terminer verschwanne sofort.",

      'rdv.oeil': "Online-Reservatioun",
      'rdv.h1': "Den Agenda vum Cabinet, 24 Stonnen op 24 op",
      'rdv.chapeau': "Wat Dir hei gesitt, ass den eigentleche Planning vun der Nora Weber. Soubal en Termin reservéiert ass, verschwënnt en fir déi nächst Patienten.",
      'rdv.chapeau.a': "Et bleiwen",
      'rdv.chapeau.b': "fräi Terminer",
      'rdv.chapeau.c': "op déi nächst siwen Deeg.",

      'rdv.pro.titre': "Mäin Agenda — Säit vun der Therapeutin",
      'rdv.pro.texte': "Dat hei gesäit d'Nora op hirer Säit. All Reservatioun vun engem Patient kënnt hei live un, an all Annulatioun, déi hei gemaach gëtt, gëtt den Termin sofort erëm op der Säit fräi. Et ass dee selwechten Agenda, vun zwou Säite gesinn.",
      'rdv.note': "An der Online-Versioun geet d'Bestätegung och per E-Mail eraus, an de Rendez-vous gëtt automatesch an den Agenda vun der Therapeutin agedroen.",

      'rdv.q.oeil': "Ier Dir reservéiert",
      'rdv.q.titre': "Dräi Saachen ze wëssen",
      'rdv.q.liste':
        "<li><strong>Et brauch eng Ordonnance.</strong> Dir kënnt reservéieren, ouni se schonn ze hunn, mee bréngt se an déi éischt Séance mat.</li>" +
        "<li><strong>Deen éischte Rendez-vous dauert 45 Minutten.</strong> D'Follow-up-Séance dauert 30 Minutten, déi lymphatesch Drainage 60.</li>" +
        "<li><strong>Eng Annulatioun geschitt den Dag virdrun.</strong> En Termin, dee rechtzäiteg fräi gëtt, hëlleft engem anere Patient, dee waart.</li>"
    }
  }
};
