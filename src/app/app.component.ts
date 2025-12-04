import { ChangeDetectionStrategy, Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './vistas/dashboard/dashboard.component';
import { UsuariosComponent } from './vistas/usuarios/usuarios.component';
import { AuthService } from './services/auth.service';

// Definición de la interfaz para los elementos del menú
interface NavItem {
  id: string;
  name: string;
  icon: string; // Placeholder para iconos (usaremos Lucide/SVG)
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DashboardComponent, UsuariosComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private authService = inject(AuthService);
  private countdownInterval: any;

  // Estado de Autenticación (usando el servicio)
  isAuthenticated = this.authService.isAuthenticated;
  requires2FA = this.authService.requires2FA;

  username = signal('');
  password = signal('');
  twoFactorCode = signal('');
  loginError = signal('');
  isLoading = signal(false);
  resendCountdown = signal(0);

  // Estado para controlar si la barra lateral está abierta o cerrada
  isSidebarOpen = signal(true);
  // Estado para rastrear la sección activa
  activeSection = signal<string>('Dashboard');

  // Detectar si estamos en un dispositivo móvil (usando un breakpoint aproximado)
  isMobile = signal(window.innerWidth < 768);

  // Inicialización de los elementos del menú
  navItems: NavItem[] = [
    {
      id: 'Dashboard',
      name: 'Sucursales',
      icon: '<path d="M21 8a2 2 0 0 0-2-2h-4.66a2 2 0 0 1-1.41-.59l-.82-.82A2 2 0 0 0 10.66 4H8a2 2 0 0 0-2 2v2H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2z"/>' // Icono: Folder (Sucursales)
    },
    {
      id: 'Users',
      name: 'Usuarios',
      icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' // Icono: Users
    }
  ];

  constructor() {
    // Escucha el evento de redimensionamiento de la ventana para actualizar isMobile
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 768);
      // Cierra la barra lateral en móvil si se abre la vista de escritorio
      if (!this.isMobile() && !this.isSidebarOpen()) {
        this.isSidebarOpen.set(true);
      }
    });
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  // Título dinámico para el encabezado
  activeSectionTitle = computed(() => {
    return this.navItems.find(item => item.id === this.activeSection())?.name || 'Panel Administrativo';
  });

  // Iniciales del usuario autenticado
  userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user || !user.name) return 'AD';

    const names = user.name.trim().split(' ');
    if (names.length === 1) {
      // Si solo hay un nombre, tomar las dos primeras letras
      return names[0].substring(0, 2).toUpperCase();
    } else {
      // Si hay dos o más nombres, tomar la primera letra de cada uno
      return (names[0][0] + names[1][0]).toUpperCase();
    }
  });

  // Función para alternar la barra lateral
  toggleSidebar(): void {
    this.isSidebarOpen.update(value => !value);
  }

  // Función para cambiar la sección activa
  setActiveSection(section: string): void {
    this.activeSection.set(section);
    // Cierra el sidebar automáticamente en móvil después de hacer clic
    if (this.isMobile()) {
      this.isSidebarOpen.set(false);
    }
  }

  // Iniciar contador para reenvío
  private startResendCountdown(): void {
    this.resendCountdown.set(60);
    this.countdownInterval = setInterval(() => {
      const current = this.resendCountdown();
      if (current > 0) {
        this.resendCountdown.set(current - 1);
      } else {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  // Lógica de Autenticación usando el servicio
  login(event: Event): void {
    event.preventDefault();
    this.loginError.set('');
    this.isLoading.set(true);

    const email = this.username();
    const password = this.password();

    if (!email || !password) {
      this.loginError.set('Por favor ingresa email y contraseña');
      this.isLoading.set(false);
      return;
    }

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        console.log('Login response:', response);

        // Verificar si requiere 2FA
        if ('requires_2fa' in response && response.requires_2fa) {
          console.log('2FA requerido');
          this.password.set(''); // Limpiar password
          this.isLoading.set(false);
          this.startResendCountdown(); // Iniciar contador
        } else {
          // Login exitoso sin 2FA
          this.username.set('');
          this.password.set('');
          this.isLoading.set(false);
        }
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.loginError.set(error.error?.error || error.error?.message || 'Credenciales inválidas');
        this.password.set('');
        this.isLoading.set(false);
      }
    });
  }

  // Verificar código 2FA
  verify2FA(event: Event): void {
    event.preventDefault();
    this.loginError.set('');
    this.isLoading.set(true);

    const code = this.twoFactorCode();
    const email = this.authService.userEmail();

    if (!code || code.length !== 6) {
      this.loginError.set('Por favor ingresa el código de 6 dígitos');
      this.isLoading.set(false);
      return;
    }

    this.authService.verify2FA({ email, code }).subscribe({
      next: (response) => {
        console.log('2FA verificado exitosamente:', response);
        this.username.set('');
        this.twoFactorCode.set('');
        this.isLoading.set(false);
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
        }
      },
      error: (error) => {
        console.error('Error en verificación 2FA:', error);
        this.loginError.set(error.error?.error || 'Código inválido o expirado');
        this.twoFactorCode.set('');
        this.isLoading.set(false);
      }
    });
  }

  // Reenviar código 2FA
  resend2FA(): void {
    if (this.resendCountdown() > 0) {
      alert(`Espera ${this.resendCountdown()} segundos para reenviar`);
      return;
    }

    this.loginError.set('');
    this.isLoading.set(true);
    const email = this.authService.userEmail();

    this.authService.resend2FA(email).subscribe({
      next: (response) => {
        console.log('Código reenviado:', response);
        alert(response.message);
        this.isLoading.set(false);
        this.startResendCountdown(); // Reiniciar contador
      },
      error: (error) => {
        console.error('Error al reenviar código:', error);
        this.loginError.set('Error al reenviar código');
        this.isLoading.set(false);
      }
    });
  }

  // Función de cerrar sesión
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.activeSection.set('Dashboard');
        this.isSidebarOpen.set(true);
      },
      error: (error) => {
        console.error('Error en logout:', error);
        // Limpiar sesión de todos modos
        this.authService.clearSession();
        this.activeSection.set('Dashboard');
        this.isSidebarOpen.set(true);
      }
    });
  }
}
