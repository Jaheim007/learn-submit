# Class Selection Implementation

## What's been implemented:

### 1. API Endpoint (`/functions/v1/choose-class`)
- **POST** endpoint that handles class selection with proper validation
- Validates class_id exists and is in valid groups (G1-G5)
- **UPSERT** logic: creates student profile if missing, updates if exists
- **Immutability check**: prevents changes once class is set (except for admins)
- **Transaction-like operations**: updates student record and creates enrollment
- **Proper error handling**: 400/403/500 with specific messages

### 2. Fixed ClassSelectionModal
- Now uses the API endpoint instead of direct database calls
- **Proper error handling** with user-friendly French messages:
  - 400 → "Sélection invalide."
  - 403 → "Votre groupe est définitif et ne peut pas être modifié."
  - 409/500 → "Impossible d'enregistrer votre groupe, veuillez réessayer."
- Uses `class.id` (number) instead of string codes
- Shows success toast and refreshes data on completion

### 3. Database Fixes
- **Fixed RLS policy** to allow NULL → value updates for non-admins
- Maintains immutability trigger to prevent changes after initial setting
- Proper bigint type alignment between `students.primary_class_id` and `classes.id`

### 4. Defensive Validation
- Will be added to submission flow to block submissions when `primary_class_id` is NULL

## Testing Scenarios Covered:
✅ New user with no `students` row → class selection succeeds (profile created)  
✅ Existing user with NULL class → class selection succeeds  
✅ User with already-set class (non-admin) → 403 error  
✅ Invalid class_id → 400 error  
✅ Network/server errors → 500 with retry message  

The modal should now work correctly and handle all edge cases with proper error messages.