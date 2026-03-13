import { Navigate } from 'react-router-dom';

// Registration is now unified with login — redirect to login page
export default function StudentRegister() {
  return <Navigate to="/etudiant/login" replace />;
}
