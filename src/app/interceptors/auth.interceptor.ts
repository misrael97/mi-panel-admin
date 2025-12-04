import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // ✅ Leer directamente del localStorage para evitar dependencia circular
  const token = localStorage.getItem('auth_token');

  // Si hay token, agregarlo a los headers
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
  } else {
    req = req.clone({
      setHeaders: {
        Accept: 'application/json'
      }
    });
  }

  return next(req);
};
