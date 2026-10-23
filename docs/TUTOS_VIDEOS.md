# Vidéos tutos My2-0 — état, production, scripts et prompts

## Où on en est

La page d'accueil annonce 6 vidéos et 2 PDF. **Un seul fichier existe** (`getting-started.mp4`). Les autres affichent maintenant « Bientôt disponible » au lieu d'un lien cassé. Dès qu'un fichier est ajouté, il faut l'ajouter à la liste `disponibles` de `src/app/shared/home/home.component.ts` pour que le tuto devienne cliquable.

| Fichier à déposer dans `src/assets/tutorials/` | Titre affiché | Durée visée | Couverture (déjà créée) |
|---|---|---|---|
| `getting-started.mp4` (existe déjà) | Premiers pas avec My2-0 | 2-3 min | `thumbnails/getting-started.svg` |
| `manage-members.mp4` | Ajouter et gérer les membres | 2-3 min | `thumbnails/members.svg` |
| `create-match.mp4` | Créer et planifier un match | 3 min | `thumbnails/match.svg` |
| `presences.mp4` | Enregistrer les présences et stats | 3-4 min | `thumbnails/presences.svg` |
| `match-amical.mp4` | Organiser un match amical | 2-3 min | `thumbnails/amical.svg` |
| `print-sheets.mp4` | Imprimer les fiches de match | 1-2 min | `thumbnails/print.svg` |
| `guide-complet-sante2.pdf` (fichier vide actuellement) | Guide complet | — | — |
| `guide-finances.pdf` (absent) | Gestion financière | — | — |

Les durées affichées sur les cartes (`5:30`, `4:15`…) sont des estimations : **corrigez-les dans le TS avec la vraie durée** une fois les vidéos faites. Les vidéos courtes (2-3 min) retiennent mieux l'attention que 5-7 min.

## Ce que je peux et ne peux pas faire

- **Couvertures** : générées (7 images vectorielles, sans texte donc valables en français et en anglais). Pour les remplacer par de vraies captures, déposez un `.jpg` ou `.svg` du même nom et changez l'extension dans le TS.
- **Vidéos** : je ne peux pas les produire. Une vidéo générée par IA ne montrerait pas votre vraie interface, ce qui est précisément ce qu'un tuto doit montrer. La méthode fiable est **l'enregistrement d'écran de l'application réelle** + une voix off (la vôtre ou une voix de synthèse).

## Méthode recommandée (la plus rapide)

1. **Préparer un groupe de démonstration** avec des données fictives propres (noms neutres, pas de vraies personnes). Utilisez la préprod pour ne rien risquer.
2. **Enregistrer l'écran** : sur téléphone, l'enregistreur d'écran intégré à Android (format vertical) ; sur PC, OBS Studio ou la barre de jeu Windows (`Win + G`) avec la fenêtre du navigateur en mode mobile (F12, appareil mobile).
3. **Écrire la voix off** (scripts ci-dessous), l'enregistrer au téléphone dans un endroit calme, ou la générer avec un outil de synthèse vocale.
4. **Monter** (CapCut, DaVinci Resolve ou Clipchamp) : recadrer, accélérer les temps d'attente, ajouter des sous-titres.
5. **Exporter** : MP4, H.264, 1280×720, 30 i/s, audio AAC, **moins de 15 Mo** (le site est servi depuis votre VPS). Pour une vidéo verticale, exportez en 720×1280.
6. Déposer le fichier dans `src/assets/tutorials/` avec le **nom exact** du tableau.

## Prompt maître (à coller dans un assistant IA pour écrire chaque script)

```text
Tu es scénariste de tutoriels vidéo pour une application de gestion de groupes sportifs
("My2-0") utilisée en Afrique francophone par des responsables de groupes de football entre amis.
Public : non technique, utilise surtout son téléphone Android, connexion parfois lente.
Écris le script d'un tutoriel de {DURÉE} sur : « {TITRE} ».
Format de sortie : un tableau avec 4 colonnes — N°, Durée (secondes), Ce qu'on voit à l'écran
(action précise : bouton, menu, champ), Voix off (phrase courte, ton chaleureux, tutoiement ou
vouvoiement selon {REGISTRE}).
Contraintes : 1 idée par scène, pas de jargon, nommer exactement les boutons et menus de
l'application, terminer par un résumé de 2 phrases et un appel à l'action.
Donne aussi : le titre de la vidéo, une description de 2 lignes, et 5 sous-titres clés.
Écris la voix off en français, puis en anglais.
```

## Scripts de base (à ajuster avec les libellés exacts de votre application)

### 1. Premiers pas (`getting-started.mp4`)
1. Écran d'accueil : appuyer sur « Créer un compte », remplir le formulaire, valider.
2. Se connecter, arriver sur le tableau de bord.
3. Créer son groupe : nom, discipline, ville, jour et heure des matchs.
4. Inviter les premiers membres par lien.
5. Résumé : groupe créé, membres invités, prochaine étape = créer un match.

### 2. Ajouter et gérer les membres (`manage-members.mp4`)
1. Menu Membres → Ajouter : nom, téléphone, poste.
2. Importer plusieurs membres depuis un fichier Excel.
3. Attribuer un rôle (trésorier, adjoint…) et une équipe.
4. **Archiver un membre qui part** (motif, date) et **enregistrer son retour** ; consulter l'historique.
5. Résumé : rien n'est supprimé, tout est conservé.

### 3. Créer et planifier un match (`create-match.mp4`)
1. Menu Matchs → Nouveau match : type (interne, amical), date, heure, lieu.
2. Composer les équipes (statique ou dynamique).
3. Envoyer la convocation : les membres reçoivent une notification.
4. Voir le calendrier du groupe.

### 4. Présences et stats (`presences.mp4`)
1. Ouvrir la fiche de présence du match.
2. Cocher « A joué », saisir buts, passes, penaltys, cartons.
3. Désigner le capitaine et l'homme du match ; indiquer ceux qui sont venus sans jouer.
4. Enregistrer : le score se calcule tout seul à partir des buts et des buts contre son camp.
5. Voir le classement et les statistiques mises à jour.

### 5. Match amical (`match-amical.mp4`)
1. Créer un match de type « Amical ».
2. Chercher le groupe adverse sur la plateforme, ou générer un lien d'invitation et l'envoyer par WhatsApp.
3. L'adversaire accepte ; le match apparaît dans les deux calendriers.
4. Saisir le score après le match.

### 6. Imprimer les fiches (`print-sheets.mp4`)
1. Ouvrir la fiche d'un match.
2. « Imprimer la fiche » ou « Télécharger PDF ».
3. Montrer le PDF : compositions, statistiques, espaces de signature.

## Pour les couvertures, si vous voulez des visuels plus personnalisés (prompt image)

```text
Couverture de vidéo tutoriel 16:9 pour une application de gestion de football amateur.
Style : illustration vectorielle plate, dégradé {COULEUR}, grands aplats, un pictogramme central
({SUJET}), coins arrondis, aucun texte, aucun logo de marque, ambiance moderne et chaleureuse,
contraste élevé pour rester lisible en petit format.
```
