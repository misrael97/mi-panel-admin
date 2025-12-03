import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.currentUser();
  
  // Verificar si hay un usuario autenticado
  if (!user) {
    console.log('🛡️ AdminGuard - No hay usuario autenticado');
    return true; // Permitir acceso a la página de login
  }
  
  // Verificar si el usuario es administrador (role_id = 1)
  if (user.role_id === 1) {
    console.log('🛡️ AdminGuard - ✅ Usuario es administrador, acceso permitido');
    return true;
  }
  
  // Si no es administrador, redirigir según su rol
  console.log('🛡️ AdminGuard - ❌ Usuario no es administrador, role_id:', user.role_id);
  
  // Cerrar sesión y redirigir al login con mensaje de error
  authService.logout();
  alert('Acceso denegado. Solo los administradores pueden acceder a este panel.');
  
  return false;
};
