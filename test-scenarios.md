# Guide de Test - NYS Submissions Portal

## 🎯 Objectifs des tests

Vérifier les fonctionnalités complètes de soumission et gestion des projets :
- **A.** Soumission de fichiers avec validation (PDF, DOCX, ZIP, 25MB max)
- **B.** Soumission avec liens repository (GitHub/GitLab)
- **C.** Validation "au moins un élément requis" (fichier OU lien)
- **D.** Gestion des soumissions existantes (modification, suppression)
- **E.** Affichage des soumissions avec statuts et téléchargements

## 📧 Comptes de test

### 1. Compte avec projets (Scénario A)
- **Email**: `prof.avec.projets@test.com`
- **Mot de passe**: `TestPassword123!`
- **Résultat attendu**: Projets disponibles + soumissions possibles

### 2. Compte sans projet (Scénario B)  
- **Email**: `etudiant.sans.projet@test.com`
- **Mot de passe**: `TestPassword123!`
- **Résultat attendu**: Message "Aucun projet disponible" sans erreur

### 3. Test de soumission complète
- Utiliser n'importe quel compte avec enrollments
- **Résultat attendu**: Formulaire fonctionnel avec upload + liens

## 🧪 Étapes de test

### Test A : Soumission avec fichiers

1. **Accès au formulaire**
   - Aller sur `/etudiant/mes-projets`
   - Cliquer "Soumettre" sur le projet "SUBMIT-TEST"
   - Vérifier redirection vers `/etudiant/soumettre?project_id=5&class_id=X`

2. **Upload de fichiers**
   ✅ Formats acceptés : PDF, DOCX, ZIP uniquement
   ✅ Taille max : 25 MB
   ✅ Validation côté client immédiate
   ✅ Barre de progression visible
   ✅ Confirmation toast après upload
   ❌ Formats non autorisés rejetés (PNG, JPG, etc.)

3. **Soumission finale**
   ✅ Formulaire avec fichier uploadé se soumet
   ✅ Toast de confirmation "Soumission envoyée !"
   ✅ Redirection vers `/etudiant/mes-projets`

### Test B : Soumission avec liens

1. **Liens repository**
   ✅ Champs URL avec validation basique
   ✅ Liens GitHub/GitLab acceptés
   ✅ Soumission avec liens uniquement fonctionne
   ✅ Toast de confirmation

2. **Validation requise**
   ✅ Au moins un fichier OU un lien requis
   ❌ Soumission vide bloquée avec message clair
   ✅ Message : "Veuillez ajouter au moins un fichier ou un lien"

### Test C : Gestion des soumissions

1. **Page "Mes Soumissions"**
   - Aller sur `/etudiant/mes-soumissions`
   ✅ Liste des soumissions avec statuts colorés
   ✅ Informations : projet, classe, date, description
   ✅ Liens cliquables vers repositories
   ✅ Boutons de téléchargement pour fichiers

2. **Actions sur soumissions**
   ✅ Modification autorisée si statut = "Reçu"
   ✅ Suppression avec confirmation si statut = "Reçu"
   ❌ Actions bloquées pour autres statuts
   ✅ Actualisation automatique après action

### Test D : Sécurité et accès

1. **Contrôle d'accès**
   ✅ Étudiant non-inscrit ne peut pas soumettre
   ✅ Message d'erreur clair : "Not enrolled in this class"
   ✅ Redirection vers `/etudiant/mes-projets`

2. **Stockage sécurisé**
   ✅ Fichiers stockés dans bucket privé "submissions"
   ✅ Organisation par dossiers : `user_id/class_code/project_code/`
   ✅ Téléchargement sécurisé via signed URLs

## 🔧 Navigation et UX

### Intégration complète
✅ Navigation "Mes Soumissions" visible dans le header
✅ Liens cohérents entre "Mes Projets" et "Soumettre"
✅ Retour vers projets après soumission
✅ États de chargement et messages d'erreur clairs

## 🐛 Debugging

### Console logs à surveiller
```javascript
// Upload de fichier
"📤 Uploading file: filename.pdf"
"✅ File uploaded successfully: path/to/file"

// Soumission
"📝 Submitting project: P005 for class: 1"
"✅ Submission created with ID: 123"

// Téléchargement
"📥 Downloading file: filename.pdf"
"✅ Download initiated"

// Erreurs attendues
"❌ File too large: 26MB > 25MB limit"
"❌ Invalid file type: image/png not allowed"
"❌ Student not enrolled in class: 1"
```

### Network requests à vérifier
```
✅ POST /storage/v1/object/submissions/user_id/... → 200 (upload)
✅ POST /rest/v1/submissions → 201 (create submission)
✅ GET /rest/v1/submissions?student_id=... → 200 (list submissions)
✅ GET /storage/v1/object/sign/submissions/... → 200 (download)
```

## 📊 Critères de succès

| Fonctionnalité | Validation Client | Validation Serveur | UX | Sécurité |
|---------------|-------------------|-------------------|----|---------| 
| **Upload fichier** | ✅ Type + taille | ✅ RLS policies | ✅ Progress + toast | ✅ Bucket privé |
| **Liens repository** | ✅ Format URL | ✅ Champs optionnels | ✅ Validation inline | ✅ Sanitisation |
| **Soumission requise** | ✅ 1 élément min | ✅ Données complètes | ✅ Message clair | ✅ Validation double |
| **Gestion submissions** | ✅ Actions conditionnelles | ✅ Ownership check | ✅ Feedback immédiat | ✅ RLS stricte |

## 🎯 Test complet réussi si

1. **Soumission avec fichiers** : Upload sécurisé, validation, toast, redirection
2. **Soumission avec liens** : Validation URL, soumission successful 
3. **Validation requise** : Formulaire vide rejeté avec message explicite
4. **Gestion submissions** : Liste, modification, suppression selon statut
5. **Sécurité** : Accès contrôlé, stockage privé, téléchargement sécurisé
6. **Navigation** : Liens cohérents, états de chargement, retours appropriés

**✅ Toutes les fonctionnalités de soumission sont opérationnelles et sécurisées.**