# Publier My2-0 sur Google Play — guide pas à pas

> Application : **My2-0** · identifiant **`com.my2_0.app`** · Capacitor 8 (Android, `targetSdk 36`, `minSdk 24`).
> Le projet Android est dans `android/`. Le serveur (`Sante-2-0`) doit être déployé et configuré **avant** l'envoi (voir §6).

## 1. Une seule fois : la clé de signature

Google Play signe l'application avec sa propre clé (« Play App Signing ») ; vous ne signez que l'envoi avec une **clé d'upload**.

```powershell
# crée la clé d'upload (à garder EN LIEU SÛR, avec les mots de passe : sans elle, impossible de publier une mise à jour)
keytool -genkeypair -v -keystore C:\cles\my2-0-upload.jks -alias my2-0-upload -keyalg RSA -keysize 2048 -validity 10000
copy android\keystore.properties.example android\keystore.properties   # puis renseigner chemin et mots de passe
```
`android/keystore.properties` et `*.jks` sont ignorés par git : **ne les versionnez jamais**. Si vous perdez la clé d'upload, Google peut la réinitialiser (Play Console → Intégrité de l'application), mais c'est long.

## 2. À chaque version : construire le fichier `.aab`

1. Dans `android/version.properties` : augmentez **`versionCode`** (entier, +1 à chaque envoi) et mettez à jour `versionName` (ex. `1.0.1`).
2. Depuis la racine du projet front :

```powershell
node node_modules/@angular/cli/bin/ng.js build --configuration android   # web, avec https://my2-0.cloud/api
node node_modules/@capacitor/cli/bin/capacitor sync android               # copie le web + les plugins dans android/
cd android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"            # JDK 21 (Capacitor 8 exige Java 21 ; celui d'Android Studio convient)
.\gradlew.bat bundleRelease                                               # -> app\build\outputs\bundle\release\app-release.aab
```
3. Vérifiez : l'`.aab` est **signé** (le fichier `keystore.properties` existe), et le bundle web ne contient pas `localhost`
   (`Select-String -Path ..\dist\sante20\browser\*.js -Pattern "localhost:8"` ne doit rien renvoyer).
4. Essayez l'application sur un vrai téléphone avant d'envoyer (`npx cap run android`), en particulier : connexion, une compétition publique, le Check-in match (autorisation de position), les notifications, le changement de langue, la suppression de compte sur un compte de test.

## 3. Play Console : ce qu'il faut renseigner

Créez l'application (nom **My2-0**, langue par défaut **français**, ajoutez l'**anglais**), puis :

| Rubrique | Valeur |
|---|---|
| Catégorie | **Sports** (ou Outils) · application gratuite |
| E-mail de contact | `contact@my2-0.cloud` |
| **Politique de confidentialité** | `https://my2-0.cloud/privacy` |
| **Suppression de compte** (URL) | `https://my2-0.cloud/delete-account-info` (+ suppression possible dans l'app : Paramètres → Supprimer mon compte) |
| Public cible | **13 ans et plus** (13-17 et 18+). *Ne pas* cocher « destiné aux enfants » |
| Contient des publicités | **Oui** (publicités de partenaires affichées dans l'app) |
| Accès à l'application | Fournir un compte de test (identifiant + mot de passe) pour l'examen : un compte avec un groupe et une compétition |
| Contenu généré par les utilisateurs | Oui : messages, photos, vidéos. Mécanismes en place : **signaler**, **bloquer**, modération par l'administrateur, règles dans les conditions d'utilisation |
| Fonctions financières | L'application **ne traite aucun paiement** ; elle enregistre seulement cotisations/amendes (suivi). Répondre « non » aux prêts, paiements, cryptomonnaies |
| Application de santé | Non (malgré d'anciens libellés « Santé 2.0 », l'application est un outil de gestion sportive) |
| Permissions sensibles | **Localisation** (premier plan uniquement) — usage : « Check-in match », bouton déclenché par l'utilisateur. Pas de localisation en arrière-plan |

### Fiche « Sécurité des données » (Data safety)
Collectées : **Infos personnelles** (nom, e-mail, identifiant utilisateur, téléphone, adresse approximative = ville/quartier) ·
**Photos et vidéos** · **Messages** (messages dans l'application) · **Localisation** (approximative et précise, *facultative*, non partagée) ·
**Activité dans l'application** (présences, statistiques) · **Autres infos financières** (suivi de cotisations, sans moyen de paiement) ·
**Identifiants d'appareil** (jeton de notification).
Pour chaque type : « collectée », *chiffrée en transit : oui*, *l'utilisateur peut demander la suppression : oui*, finalité : fonctionnalités de l'application / sécurité.
**Partage avec des tiers : non** au sens Google (Firebase pour les notifications et Cloudinary pour l'hébergement des médias agissent comme prestataires pour votre compte). Les publicités ne reçoivent aucune donnée personnelle.

### Questionnaire de classification du contenu
Catégorie « réseau social / communication » : les utilisateurs peuvent échanger du texte et des médias ; pas de violence, pas de contenu sexuel, pas de jeux d'argent ni de substances. Résultat attendu : 12+ / Teen.

### Fiche de présentation
**Titre** (30 car. max) : `My2-0` · **Titre long** : `My2-0 — Clubs et compétitions`

*Description courte (80 car.)* — FR : `Gérez votre club, vos matchs et vos compétitions amateurs, simplement.` — EN : `Manage your amateur club, matches and competitions, simply.`

*Description complète — FR :*
> My2-0 est l'outil des clubs et organisateurs de sport amateur.
> • **Groupes** : membres, rôles, présences, cotisations et caisse, matchs amicaux.
> • **Compétitions** : championnats, coupes et tournois — tirage, calendrier, feuilles de match, classements, statistiques, palmarès, licences et rapports PDF.
> • **Mon espace** : vos équipes, vos matchs à gérer (arbitres, commissaires), votre carte joueur My2-0 à partager.
> • **Communauté** : annuaire de joueurs, moments forts vidéo, conversations de groupe, notifications de convocation et de résultats.
> • **Deux langues** : français et anglais.
> Gratuit. Aucun paiement n'est traité dans l'application.

*Description complète — EN :*
> My2-0 is the toolkit for amateur sports clubs and organisers.
> • **Groups**: members, roles, attendance, contributions and cash book, friendly matches.
> • **Competitions**: leagues, cups and tournaments — draw, schedule, match sheets, standings, statistics, honours, licences and PDF reports.
> • **My space**: your teams, the matches you manage (referees, commissioners), your shareable My2-0 player card.
> • **Community**: player directory, video highlights, group chats, call-up and result notifications.
> • **Two languages**: French and English.
> Free. No payment is processed in the app.

**Visuels** : icône 512×512 PNG · image de présentation 1024×500 · 2 à 8 captures d'écran téléphone (portrait, ≥ 1080 px) : accueil, compétition publique, composition d'équipe, carte joueur, classement. Faites-les en **français et en anglais**.

## 4. Mise en ligne
1. **Test interne** (jusqu'à 100 testeurs, immédiat) : vérifiez l'installation et les mises à jour.
2. **Test fermé** : un compte développeur *personnel* créé récemment doit en général faire tester l'application par **12 testeurs pendant 14 jours consécutifs** avant la production — vérifiez la règle en vigueur dans la Play Console.
3. **Production** : « Créer une version » → importer l'`.aab` → notes de version (FR + EN) → envoyer pour examen (quelques heures à quelques jours).

## 5. Contrôles faits sur l'application (avant d'envoyer)
- Permissions réduites au nécessaire (plus de stockage ni de démarrage automatique) ; sauvegarde cloud désactivée ; trafic non chiffré interdit.
- Plus d'adresse `localhost` dans le code livré (chat temps réel, affiches, QR codes utilisaient `localhost`).
- Jeton de connexion envoyé **uniquement** au serveur My2-0 ; durée **7 jours** (elle était de 1000 jours) ; déconnexion automatique à l'expiration.
- Blocage des tentatives de connexion répétées ; mots de passe de réinitialisation limités.
- Signalement / blocage de contenus et de personnes ; page de suppression de compte publique ; confirmation d'âge (13 ans) à l'inscription.
- Politique de confidentialité, conditions et sécurité **en français et en anglais** ; interface traduite (voir §7).

## 6. Côté serveur avant la sortie
- Définir les **variables d'environnement** (les valeurs de `application.yml` restent des valeurs de repli pour le développement) :
  `DB_PASSWORD`, `MAIL_PASSWORD`, `JWT_SECRET` (≥ 64 caractères aléatoires), `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
  `VAPID_PRIVATE_KEY`, `GEMINI_API_KEY`, `HUGGINGFACE_API_KEY`, optionnellement `JWT_EXPIRATION_SECONDS` (défaut 604800 = 7 jours).
- **Renouveler les secrets qui ont figuré dans le dépôt** (JWT, mot de passe base, Cloudinary, e-mail, Gemini, Hugging Face, VAPID) puis les retirer de l'historique ou considérer le dépôt comme exposé.
- `service-google.json` (compte de service Firebase) est dans `src/main/resources` : le sortir du dépôt et le charger depuis un chemin du serveur.
- HTTPS valide sur `my2-0.cloud` ; les routes `/privacy`, `/terms`, `/security`, `/delete-account-info` doivent répondre **sans connexion** (routes de l'application web).
- Redémarrer : les nouvelles tables (signalements, blocages) se créent seules.

## 7. Langues : état et limites
Tous les textes des gabarits ont été passés dans `assets/i18n/{fr,en}.json` (≈ 5 800 clés, parité fr/en vérifiée), les messages et libellés du code utilisent `t('clé')`, les dates et nombres suivent la langue (rechargement automatique au changement de langue), `<html lang>` suit la langue.
**Reste en français** (à traduire si besoin) : quelques libellés définis dans des constantes de composants évaluées au démarrage (listes d'étapes de tutoriels, certains menus de modules rares), les e-mails envoyés par le serveur, les PDF de rapports de groupe, et les textes saisis par les utilisateurs.

## 8. Plus tard : App Store (iOS)
Nécessite un Mac et un compte Apple Developer (99 $/an). Mêmes exigences de fond : **suppression de compte dans l'app** ✔, **contenu utilisateur modéré (signaler/bloquer)** ✔, politique de confidentialité ✔, « étiquettes de confidentialité » (même contenu que la fiche Data safety), ajout d'un `PrivacyInfo.xcprivacy`, description de l'usage de la localisation (`NSLocationWhenInUseUsageDescription`) et des notifications. `npx cap add ios` puis ouvrir `ios/App` dans Xcode.

## 9. Limites connues à décider avant ou juste après la sortie
- **Messages** : chiffrement AES-256-GCM implémenté ; il faut définir `CHAT_ENCRYPTION_KEY` sur le serveur (voir `Sante-2-0/docs/CHIFFREMENT_MESSAGES.md`) avant la sortie.
- **Âge** : l'inscription demande de confirmer avoir 13 ans (case à cocher) ; il n'y a pas de date de naissance obligatoire.
- **Secrets du dépôt** : voir §6, à renouveler.
- **`@PreAuthorize` hors module compétition/partenaires** : toujours inactifs (voir `Sante-2-0/docs/QUALITE_ET_ACCES.md`) ; les actions sensibles des groupes, finances, rôles et comptes sont protégées par des gardes explicites.
- **Publicités** : à déclarer « contient des publicités » ; elles proviennent de partenaires locaux, sans SDK publicitaire tiers.
