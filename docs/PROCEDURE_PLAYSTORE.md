# Déployer My2-0 sur le Google Play Store — procédure complète

*Application : **My2-0** · identifiant `com.my2_0.app` · Android (Capacitor 8), `minSdk 24`, `targetSdk 36` · version actuelle `1.0.0` (code 1).*
*Ce document est la **procédure à suivre dans l'ordre**. Les textes longs de la fiche (descriptions complètes, fiche « Sécurité des données ») restent dans `docs/PUBLICATION_PLAYSTORE.md` : la procédure vous dit quand les y copier.*

> **Légende** — ☐ à cocher · 💻 sur votre PC · 🌐 dans la Play Console · 🖥️ sur le serveur · ⏳ délai d'attente imposé par Google

---

## 0. Ce qui se fait aujourd'hui, ce qui demande des jours

| Aujourd'hui (≈ 3-4 h) | Demande des jours |
|---|---|
| Vérifier le serveur de production · créer la clé de signature · construire l'application signée · créer le compte de test · créer le compte développeur et la fiche · envoyer en **test interne** | ⏳ Vérification d'identité du compte développeur (quelques heures à quelques jours) |
| | ⏳ **Test fermé : 12 testeurs pendant 14 jours consécutifs** pour un compte *personnel* récent (voir §8) |
| | ⏳ Examen de Google : quelques heures à ~7 jours (souvent plus long pour un premier envoi) |

**Conséquence** : comptez **environ 3 semaines** entre aujourd'hui et la publication si votre compte est personnel. Un compte *organisation* (avec numéro D-U-N-S) évite l'étape des 12 testeurs, mais demande plus de démarches.

---

## 1. Avant tout : le serveur de production doit être prêt 🖥️

L'application Android **appelle le serveur de production** : `https://my2-0.cloud/api` (et `wss://my2-0.cloud/ws` pour le chat). Si le serveur n'est pas à jour, l'application sera refusée ou plantera chez le relecteur de Google.

☐ Le **dernier jar** est déployé sur la production (voir `Sante-2-0/docs/MISE_EN_PRODUCTION.md`) et démarre sans erreur ; la base a été **sauvegardée** avant.
☐ Les **variables d'environnement** sont en place (secrets renouvelés, `CHAT_ENCRYPTION_KEY`, `FIREBASE_CREDENTIALS_PATH`…).
☐ Contrôles depuis votre PC (chaque commande doit répondre comme indiqué) :
```powershell
curl.exe -s -o NUL -w "%{http_code}`n" https://my2-0.cloud/api/auth/me          # 401 attendu (le serveur répond, non connecté)
curl.exe -s -o NUL -w "%{http_code}`n" https://my2-0.cloud/privacy              # 200
curl.exe -s -o NUL -w "%{http_code}`n" https://my2-0.cloud/terms                # 200
curl.exe -s -o NUL -w "%{http_code}`n" https://my2-0.cloud/delete-account-info  # 200
```
⚠️ Votre nginx contient aussi `api.my2-0.cloud`. L'application utilise **`my2-0.cloud/api`** : vérifiez que **cette** adresse répond bien (le premier contrôle ci-dessus).
☐ Les pages **/privacy**, **/terms**, **/delete-account-info** s'ouvrent **sans être connecté** (Google les ouvre dans un navigateur).
☐ **Suppression de compte** testée : *Paramètres → Supprimer mon compte* fonctionne sur un compte de test.
☐ **Aucune donnée de démonstration** en production : pas de comptes `demo.*`, pas de compétitions `[DEMO]`/`[TEST]`, pas de paramètre `app.demo.*` dans la configuration.

---

## 2. Le compte de test pour Google 🖥️ + 🌐

Google ouvre votre application avec **un compte que vous lui fournissez** : sans lui, l'application est refusée (« accès impossible »). Ce compte doit tout montrer **sans que le relecteur ait à créer quoi que ce soit**.

### 2.1 Créer le compte (sur l'application de production)
☐ Créez un compte **normal** via l'inscription : identifiant `reviewer.google` (ou équivalent), e-mail dédié que vous contrôlez, **mot de passe fort** (≥ 12 caractères) unique pour cet usage.
☐ Avec ce compte, **créez un groupe** « Club de démonstration » : **non public** (pour ne pas apparaître dans l'annuaire), quelques **membres fictifs** (noms inventés, pas de vraies personnes), un exercice en cours, 2-3 matchs avec présences et statistiques.
☐ **Créez une compétition** « Coupe de démonstration » **non publique**, avec 4 équipes fictives et quelques résultats, pour que le relecteur voie le tirage, le classement et la feuille de match.
☐ Vérifiez en vous connectant **avec ce compte, sur un téléphone** : il voit son groupe, sa compétition, ses statistiques, la carte joueur, les notifications.

### 2.2 À préparer pour la Play Console
```
Identifiant : reviewer.google
Mot de passe : ********
Instructions : Se connecter avec ces identifiants. Le compte est responsable d'un club
de démonstration avec une compétition d'exemple. Les menus Matchs, Compétitions, Mon espace
et Ma carte sont accessibles depuis la barre du bas. La permission de localisation sert
uniquement au « Check-in match », déclenché par un bouton. Aucun paiement n'est effectué
dans l'application. Suppression de compte : Paramètres → Supprimer mon compte.
```
☐ **Ne pas activer** de double authentification ni de blocage sur ce compte. Désactivez-le (ou changez son mot de passe) quand l'application est approuvée.

---

## 3. Le compte développeur Google Play 🌐

☐ Allez sur **play.google.com/console** → créer un compte développeur → **frais uniques de 25 $** (carte bancaire).
☐ Choisissez le **type de compte** :
 - **Personnel** : simple, mais **test fermé obligatoire** (12 testeurs / 14 jours, voir §8).
 - **Organisation** (entreprise/association) : numéro **D-U-N-S** requis (gratuit mais plusieurs jours) ; les exigences de test sont différentes.
☐ **Vérification d'identité** : pièce d'identité, adresse, téléphone. ⏳ Tant qu'elle n'est pas terminée, vous ne pouvez pas publier.
☐ Renseignez le **nom du développeur** (public) et l'**e-mail de contact** (public : `contact@my2-0.cloud`).
⚠️ Les informations de contact du développeur sont **visibles du public** sur la page de l'application.

---

## 4. La clé de signature (une seule fois) 💻

Google signe l'application distribuée avec **sa** clé (*Play App Signing*) ; vous signez seulement vos envois avec une **clé d'upload**.

```powershell
$keytool = "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
mkdir C:\cles
& $keytool -genkeypair -v -keystore C:\cles\my2-0-upload.jks -alias my2-0-upload -keyalg RSA -keysize 2048 -validity 10000
```
☐ Répondez aux questions (nom, organisation…) et **choisissez deux mots de passe** (fichier et clé).
☐ **Sauvegardez** `my2-0-upload.jks` **et** les mots de passe dans **deux endroits** (gestionnaire de mots de passe + support hors ordinateur). Sans cette clé, impossible de publier une mise à jour sans passer par une réinitialisation auprès de Google (longue).
☐ Créez `android\keystore.properties` (jamais versionné) :
```powershell
cd E:\Users\vkadjo\projet\sante20\android
copy keystore.properties.example keystore.properties
notepad keystore.properties     # storeFile=C:/cles/my2-0-upload.jks, storePassword=…, keyAlias=my2-0-upload, keyPassword=…
```
⚠️ **Si `keystore.properties` est absent, la construction réussit mais le fichier n'est PAS signé** — Google le refusera. Le contrôle du §5.3 est obligatoire.

---

## 5. Construire l'application (`.aab`) 💻

⚠️ Le fichier `app-release.aab` déjà présent date du **21 octobre** : il ne contient **ni** les nouveaux écrans (classements, archivage, annuaire, page de groupe…) **ni** les traductions récentes. **Reconstruisez-le.**

### 5.1 Numéro de version
Dans `android\version.properties` :
- première publication : `versionCode=1`, `versionName=1.0.0` (inchangés) ;
- **chaque envoi suivant** : augmenter `versionCode` de **1** (obligatoire : Google refuse un code déjà utilisé) et adapter `versionName` (`1.0.1`…).
☐ Si vous avez déjà téléversé un `.aab` de code 1 dans la console, passez à `versionCode=2`.

### 5.2 Construction
```powershell
cd E:\Users\vkadjo\projet\sante20
node node_modules/@angular/cli/bin/ng.js build --configuration android      # web avec https://my2-0.cloud/api
node node_modules/@capacitor/cli/bin/capacitor sync android                  # copie le web et les plugins dans android/
cd android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"               # JDK 21 exigé par Capacitor 8
.\gradlew.bat bundleRelease                                                  # → app\build\outputs\bundle\release\app-release.aab
```
☐ Le build se termine par **BUILD SUCCESSFUL**. (Environ 3 à 6 minutes.)

### 5.3 Contrôles obligatoires avant d'envoyer
```powershell
cd E:\Users\vkadjo\projet\sante20
# 1) Aucune adresse locale ne doit rester dans le bundle web
Select-String -Path dist\sante20\browser\*.js -Pattern "localhost:8" -List      # ne doit rien afficher

# 2) Le fichier est bien signé avec VOTRE clé
& "C:\Program Files\Android\Android Studio\jbr\bin\jarsigner.exe" -verify -verbose -certs android\app\build\outputs\bundle\release\app-release.aab | Select-String "jar verified|no manifest|unsigned"
```
☐ Le premier contrôle ne renvoie rien. ☐ Le second affiche **jar verified** (et **pas** « jar is unsigned »).
☐ Notez la **taille** du fichier (~30 Mo) et gardez une copie datée du `.aab` envoyé.

### 5.4 Essayer sur un vrai téléphone
```powershell
cd E:\Users\vkadjo\projet\sante20
npx cap run android          # téléphone branché, débogage USB activé
```
À tester **à la main**, avec le compte de test :
☐ Connexion / déconnexion · ☐ liste des groupes · ☐ une compétition publique · ☐ une compétition gérée (compositions, saisie d'un match)
☐ **Check-in match** (la demande de localisation apparaît **seulement** quand on appuie sur le bouton)
☐ **Notifications** : autoriser, recevoir une notification de test · ☐ **changement de langue** FR ↔ EN
☐ Chat : envoyer un message · ☐ **Signaler** un contenu et **bloquer** un utilisateur
☐ **Supprimer le compte** sur un compte jetable · ☐ ouverture avec **connexion lente** (pas de plantage)

---

## 6. Créer l'application dans la Play Console 🌐

☐ **Créer une application** : nom **My2-0** · langue par défaut **français (France)** · **Application** (pas Jeu) · **Gratuite** · cocher les déclarations (règles du programme, lois d'exportation américaines).
☐ Ajoutez l'**anglais** comme seconde langue de la fiche (*Fiche → Gérer les traductions*).

### 6.1 « Contenu de l'application » — à remplir **en entier** (tableau de bord → *Configurer l'application*)

| Rubrique | Que répondre |
|---|---|
| **Règles de confidentialité** | `https://my2-0.cloud/privacy` |
| **Accès à l'application** | *Toutes ou certaines fonctionnalités sont limitées* → ajouter les identifiants du §2.2 avec les instructions |
| **Annonces** | **Oui, contient des annonces** (publicités de partenaires locaux, sans SDK publicitaire tiers) |
| **Classification du contenu** | Catégorie **réseau social / communication** : échanges de texte et de médias, **pas** de violence, de contenu sexuel, de jeux d'argent ni de substances. Résultat attendu : *12+ / Teen* |
| **Public cible** | **13 ans et plus** (13-15, 16-17, 18+). **Ne pas** cocher « destiné aux enfants » |
| **Application d'actualités** | Non |
| **Fonctions financières** | **Aucune** : l'application ne traite pas de paiement (suivi de cotisations et d'amendes uniquement). Répondre « non » aux prêts, paiements, cryptomonnaies |
| **Santé** | Non (outil de gestion sportive) |
| **Suppression du compte** | URL : `https://my2-0.cloud/delete-account-info` ; indiquer aussi que la suppression est possible **dans l'application** (*Paramètres → Supprimer mon compte*) |
| **Contenu généré par les utilisateurs** | **Oui** (messages, photos, vidéos). Mécanismes : **signaler**, **bloquer**, modération par l'administrateur, règles dans les conditions d'utilisation |
| **Permissions sensibles — Localisation** | Premier plan uniquement ; usage : **Check-in match**, déclenché par l'utilisateur ; **pas** de localisation en arrière-plan |

### 6.2 Sécurité des données (*Data safety*) — la rubrique la plus souvent refusée
Remplissez-la en recopiant le contenu de `docs/PUBLICATION_PLAYSTORE.md` §3 « Fiche *Sécurité des données* ». Principe : **tout ce que l'application collecte doit y figurer** et correspondre à la politique de confidentialité.
- Collectées : infos personnelles (nom, e-mail, identifiant, téléphone, ville/quartier) · photos et vidéos · messages · localisation (facultative) · activité dans l'application · suivi de cotisations · jeton de notification.
- Pour chaque type : **chiffré en transit : oui** · **suppression demandable : oui** · **partage avec des tiers : non** (Firebase et Cloudinary agissent comme prestataires).
⚠️ Une incohérence entre cette fiche, la politique de confidentialité et le comportement réel de l'application est l'une des **causes de rejet les plus fréquentes**.

### 6.3 La fiche de présentation (*Fiche Play Store principale*)
☐ **Nom** (30 car.) : `My2-0` · **Description courte** (80 car.) :
 FR : `Gérez votre club, vos matchs et vos compétitions amateurs, simplement.`
 EN : `Manage your amateur club, matches and competitions, simply.`
☐ **Description complète** : FR et EN dans `docs/PUBLICATION_PLAYSTORE.md` §3.
☐ **Éléments graphiques** :

| Élément | Format | Remarque |
|---|---|---|
| **Icône** | PNG 512 × 512, ≤ 1 Mo, sans transparence | utilisez `src/assets/icon.png` redimensionné |
| **Image de présentation** | PNG/JPG **1024 × 500** | sans texte important près des bords |
| **Captures d'écran téléphone** | **2 à 8**, portrait, côté court ≥ 1080 px | accueil, compétition publique, composition d'équipe, carte joueur, classement ; **en français et en anglais** |

☐ **Catégorie** : Sports · **Contact** : `contact@my2-0.cloud` · **Site web** : `https://my2-0.cloud`

---

## 7. Envoyer le fichier et tester en interne 🌐

☐ *Tester et publier → Test interne → Créer une version* ; à la première fois, **accepter Play App Signing** (recommandé).
☐ Importer `app-release.aab` ; Google vérifie la signature et affiche les avertissements éventuels (ne publiez pas tant qu'il reste une **erreur**).
☐ **Notes de version** : `<fr-FR>Première version de My2-0.</fr-FR><en-US>First release of My2-0.</en-US>`
☐ *Testeurs* : créez une liste (vos e-mails Google) → **Enregistrer** → *Publier la version*.
☐ Récupérez le **lien d'inscription au test**, ouvrez-le sur un téléphone **avec un compte Google testeur**, installez depuis le Play Store et **refaites les tests du §5.4** sur cette version installée.

---

## 8. Test fermé : les 12 testeurs ⏳ (compte personnel récent)

Si votre compte personnel a été créé récemment, Google exige un **test fermé avec au moins 12 testeurs, restés inscrits 14 jours consécutifs**, avant de pouvoir demander la production. ⚠️ Vérifiez la règle exacte dans la console (*Tableau de bord → « Obtenir l'accès à la production »*), elle évolue.

☐ Recrutez **15 à 20 personnes** (marge pour les désistements) : amis, membres de vos groupes, organisateurs du programme pilote. Besoin : **un compte Google** (Gmail) et un **téléphone Android**.
☐ *Test fermé → Créer une piste → Créer une version* : importez le même `.aab`.
☐ Ajoutez les **adresses Gmail** des testeurs (ou un Google Groupe), publiez, envoyez-leur le **lien d'inscription**.
☐ Demandez-leur d'**installer et de garder** l'application installée pendant 14 jours, et de l'ouvrir de temps en temps. Un testeur qui se désinscrit ne compte plus.
☐ Suivez le **compteur** dans la console (nombre de testeurs, jours écoulés). Corrigez les retours : toute correction = **nouveau `versionCode`** et nouvel envoi sur la même piste.
☐ Au bout de 14 jours : *Tableau de bord → Postuler pour l'accès à la production*, répondre au questionnaire (comment vous avez recruté les testeurs, retours reçus, ce que vous avez corrigé).

---

## 9. Publier en production 🌐

☐ *Production → Créer une version* → importer le **dernier `.aab`** (ou « Ajouter depuis la bibliothèque »).
☐ **Pays** : *Pays/régions* → ajoutez d'abord **Cameroun** (et les pays francophones visés) ; vous pourrez élargir plus tard.
☐ **Notes de version** FR et EN (voir le modèle du §7).
☐ **Déploiement progressif** conseillé : démarrez à **20 %** pendant quelques jours, surveillez les plantages, puis passez à 100 %.
☐ *Vérifier la version* : aucun **bloquant** ne doit rester (déclarations manquantes, signature, permissions).
☐ **Envoyer pour examen**. ⏳ Un premier examen prend quelques heures à plusieurs jours. Activez la **publication gérée** si vous voulez choisir le moment de la mise en ligne après approbation.

---

## 10. Après l'approbation

☐ Ouvrez la **page publique** de l'application, installez-la depuis le Play Store, connectez-vous avec un compte réel.
☐ **Désactivez ou changez le mot de passe** du compte de test Google (§2.2).
☐ Mettez le **lien du Play Store** sur la page d'accueil, la page pilote, vos réseaux et le signature mail.
☐ Surveillez chaque jour pendant 2 semaines : *Qualité → Android vitals* (plantages, ANR), *Avis*, *Statistiques d'installation*. Répondez à **tous les avis** (en 48 h si possible).
☐ **Ne perdez pas** : la clé d'upload, `keystore.properties`, les mots de passe, le compte développeur (et son e-mail de récupération).

### Publier une mise à jour (à chaque fois)
1. Corriger/ajouter dans le code, **tester**.
2. `versionCode` **+1** et `versionName` dans `android\version.properties`.
3. Refaire §5.2 et §5.3.
4. *Production → Créer une version* → importer → notes de version → déploiement progressif → examen.
5. Le **serveur doit rester compatible** avec les anciennes versions installées : déployez le serveur **avant** l'application, et évitez de supprimer ou renommer une route utilisée par une version déjà publiée.

### En cas de problème grave après la sortie
- **Suspendre le déploiement** (*Production → Gérer la version → Suspendre le déploiement*) pour arrêter la diffusion d'une version défectueuse.
- Une version publiée **ne se retire pas** : on publie une **version corrigée** avec un `versionCode` plus élevé.
- Problème côté serveur : corriger le serveur (rapide) plutôt que l'application ; c'est pourquoi le serveur doit être déployable indépendamment (scripts `Sante-2-0/deploy/`, dont `05-rollback.sh`).

---

## 11. Si Google refuse l'application

Un refus arrive par e-mail avec le **motif** et un lien vers la rubrique concernée. Causes fréquentes et réponse :

| Motif | Quoi faire |
|---|---|
| **Accès à l'application impossible** | Vérifier le compte de test (mot de passe, groupe non vide) ; refaire la saisie des instructions ; tester le compte sur un téléphone neuf |
| **Données non conformes (Data safety)** | Faire correspondre la fiche, la politique de confidentialité et le comportement réel ; ajouter toute donnée oubliée (localisation, photos, messages) |
| **Suppression de compte** | Vérifier l'URL `delete-account-info` (accessible sans connexion) et le chemin dans l'application |
| **Contenu généré par les utilisateurs** | Montrer les mécanismes de **signalement**, **blocage** et **modération** (captures dans la réponse) |
| **Permissions** | Justifier la localisation (**Check-in match**, au premier plan, sur action de l'utilisateur) ; retirer toute permission inutile |
| **Plantage au lancement** | Vérifier que le **serveur de production répond** ; relire le rapport de plantage de la console |
| **Métadonnées trompeuses** | Retirer toute promesse non tenue de la description (« gratuit », « officiel »…) |

Après correction : *Corriger les problèmes → Envoyer pour examen*. Un refus n'est **pas définitif**.

---

## 12. Check-list finale

**Serveur** ☐ dernier jar en production · ☐ sauvegarde faite · ☐ `/api/auth/me` = 401 · ☐ pages légales = 200 · ☐ pas de données de démonstration
**Compte de test** ☐ créé · ☐ groupe et compétition non publics · ☐ testé sur téléphone · ☐ instructions rédigées
**Build** ☐ `keystore.properties` renseigné · ☐ `versionCode` augmenté · ☐ `ng build --configuration android` OK · ☐ pas de `localhost` · ☐ `jarsigner` = *jar verified* · ☐ essai sur téléphone réel
**Console** ☐ compte vérifié · ☐ toutes les rubriques « Contenu de l'application » vertes · ☐ fiche FR + EN · ☐ icône, bannière, captures · ☐ Data safety cohérente
**Tests** ☐ interne OK · ☐ fermé : 12 testeurs × 14 jours · ☐ postulé à la production
**Production** ☐ pays choisis · ☐ déploiement progressif · ☐ envoyé pour examen
**Après** ☐ compte de test désactivé · ☐ surveillance quotidienne · ☐ clé et mots de passe sauvegardés en deux endroits
