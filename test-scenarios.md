# Guide de Test - NYS Submissions Portal

## 🎯 Objectifs des tests

Vérifier les 3 scénarios d'acceptance criteria :
- **A.** Utilisateur avec classes + projets → affichage normal
- **B.** Utilisateur sans projet → message neutre uniquement  
- **C.** Erreur serveur/DB → message clair + bouton réessayer

## 📧 Comptes de test

### 1. Compte avec projets (Scénario A)
- **Email**: `prof.avec.projets@test.com`
- **Mot de passe**: `TestPassword123!`
- **Résultat attendu**: Liste des classes et projets, statuts de soumission

### 2. Compte sans projet (Scénario B)  
- **Email**: `etudiant.sans.projet@test.com`
- **Mot de passe**: `TestPassword123!`
- **Résultat attendu**: Message "Aucun projet disponible" sans erreur rouge

### 3. Test d'erreur serveur (Scénario C)
- Utiliser n'importe quel compte + déconnecter internet temporairement
- **Résultat attendu**: Message "Service temporairement indisponible" + bouton "Réessayer"

## 🧪 Étapes de test

### Test A : Utilisateur avec projets

1. **Connexion**
   - Aller sur `/auth`
   - Se connecter avec `prof.avec.projets@test.com`
   - Vérifier la redirection vers `/etudiant/mes-projets`

2. **Affichage des projets**
   ✅ Header "Mes Projets" affiché  
   ✅ Classes disponibles (WEBDEV101, REACT201, etc.)  
   ✅ Projets listés avec codes (P001, P002, etc.)  
   ✅ Dates d'échéance formatées  
   ✅ Statuts de soumission (badges colorés)  
   ✅ Boutons "Soumettre" fonctionnels  
   ❌ Aucun toast d'erreur rouge

3. **Filtrage par classe**
   ✅ Boutons de filtre visibles si >1 classe
   ✅ Filtrage fonctionne correctement
   ✅ URL mise à jour avec `?class=X`

### Test B : Utilisateur sans projet

1. **Connexion**
   - Se connecter avec `etudiant.sans.projet@test.com`

2. **État vide**
   ✅ Header "Mes Projets" affiché  
   ✅ Message "Aucun projet disponible"  
   ✅ Sous-message "Vous n'êtes inscrit à aucune classe"  
   ❌ **CRITIQUE**: Aucun toast d'erreur rouge  
   ❌ **CRITIQUE**: Aucun message d'erreur rouge sur la page

### Test C : Erreur serveur

1. **Simulation d'erreur**
   - Se connecter normalement
   - Ouvrir DevTools → Network → Cocher "Offline"  
   - Rafraîchir la page ou cliquer "Réessayer"

2. **Gestion d'erreur**
   ✅ Message "Service temporairement indisponible"  
   ✅ Bouton "Réessayer" visible et fonctionnel  
   ✅ Icône d'avertissement (triangle jaune)  
   ✅ Compteur de tentatives affiché  
   ✅ Animation de chargement pendant retry

3. **Récupération**
   - Décocher "Offline" dans DevTools
   - Cliquer "Réessayer"  
   ✅ Retour à l'état normal

## 🔧 Commandes utiles

```bash
# Vérifier l'état de la base de données
npx supabase status

# Voir les logs en temps réel  
npx supabase logs

# Reset des données de test
npx supabase db reset
```

## 🐛 Debugging

### Console logs à surveiller

```javascript
// Logs normaux (succès)
"🔍 Fetching student data for user: xxx"
"✅ Student found: xxx" 
"📚 Enrollments data: [...]"
"🎓 Student classes: [...]"

// Logs d'état vide (normal)
"ℹ️ No student profile found"
"📚 Enrollments data: []"

// Logs d'erreur (à investiguer)
"❌ Error fetching student: xxx"
"💥 Error fetching student data: xxx"
```

### Network requests à vérifier

```
✅ GET /students?select=id&user_id=eq.xxx → 200
✅ GET /enrollments?select=...&student_id=eq.xxx → 200 (peut être [])
✅ GET /class_projects?select=...&class_id=in(...) → 200 (peut être [])
```

## 📊 Critères de succès

| Scénario | Toast d'erreur | Message d'erreur | Bouton retry | Données affichées |
|----------|---------------|------------------|--------------|-------------------|
| A (avec projets) | ❌ Aucun | ❌ Aucun | ❌ Non visible | ✅ Classes + Projets |
| B (sans projet) | ❌ **AUCUN** | ❌ **AUCUN** | ❌ Non visible | ✅ Message neutre |
| C (erreur serveur) | ✅ Optionnel | ✅ Message clair | ✅ Visible | ❌ Aucune |

**🎯 Test réussi si** : Scénarios A et B ne montrent **JAMAIS** d'erreur rouge, seul le scénario C montre des erreurs.