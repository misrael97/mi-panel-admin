import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../services/usuarios.service';
import { SucursalesService } from '../../services/sucursales.service';
import { Usuario, Sucursal } from '../../models/api.models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuariosComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  private sucursalesService = inject(SucursalesService);

  // Lista de usuarios
  usuarios = signal<Usuario[]>([]);
  sucursales = signal<Sucursal[]>([]);
  isLoading = signal(false);

  // Control del modal
  mostrarModal = signal(false);
  modoEdicion = signal(false);

  // Formulario (propiedad normal para compatibilidad con ngModel)
  usuarioForm: Partial<Usuario> & { password?: string } = {
    name: '',
    email: '',
    role_id: 2, // Agente por defecto
    sucursal_id: null
  };

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarSucursales();
  }

  /**
   * Cargar usuarios desde la API
   */
  cargarUsuarios(): void {
    this.isLoading.set(true);
    this.usuariosService.getAll().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        alert('Error al cargar usuarios');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Cargar sucursales desde la API
   */
  cargarSucursales(): void {
    this.sucursalesService.getAll().subscribe({
      next: (sucursales) => {
        this.sucursales.set(sucursales);
      },
      error: (error) => {
        console.error('Error al cargar sucursales:', error);
      }
    });
  }

  // Abrir modal para crear nuevo usuario
  abrirModalCrear(): void {
    this.modoEdicion.set(false);
    this.usuarioForm = {
      name: '',
      email: '',
      password: '',
      role_id: 2, // Siempre Agente
      sucursal_id: null
    };
    this.mostrarModal.set(true);
  }

  // Abrir modal para editar usuario
  abrirModalEditar(usuario: Usuario): void {
    this.modoEdicion.set(true);
    this.usuarioForm = {
      id: usuario.id,
      name: usuario.name,
      email: usuario.email,
      role_id: usuario.role_id,
      sucursal_id: usuario.sucursal_id
    };
    this.mostrarModal.set(true);
  }

  // Cerrar modal
  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  // Guardar usuario (crear o actualizar)
  guardarUsuario(): void {
    const form = this.usuarioForm;

    if (!form.name || !form.email) {
      alert('Por favor completa todos los campos');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      alert('Por favor ingresa un email válido');
      return;
    }

    // Validar password en creación
    if (!this.modoEdicion() && !form.password) {
      alert('Por favor ingresa una contraseña');
      return;
    }

    this.isLoading.set(true);

    if (this.modoEdicion() && form.id) {
      // Actualizar usuario existente
      const updateData: Partial<Usuario> = {
        name: form.name,
        email: form.email,
        role_id: form.role_id,
        sucursal_id: form.sucursal_id
      };

      this.usuariosService.update(form.id, updateData).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error al actualizar usuario:', error);
          alert(error.error?.message || 'Error al actualizar usuario');
          this.isLoading.set(false);
        }
      });
    } else {
      // Crear nuevo usuario
      const createData = {
        name: form.name!,
        email: form.email!,
        password: form.password!,
        role_id: form.role_id!,
        sucursal_id: form.sucursal_id
      };

      this.usuariosService.create(createData).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
          alert(error.error?.message || 'Error al crear usuario');
          this.isLoading.set(false);
        }
      });
    }
  }

  // Eliminar usuario
  eliminarUsuario(id: number): void {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      this.isLoading.set(true);
      this.usuariosService.delete(id).subscribe({
        next: () => {
          this.cargarUsuarios();
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
          alert(error.error?.message || 'Error al eliminar usuario');
          this.isLoading.set(false);
        }
      });
    }
  }

  // Obtener color del badge según el rol
  getRolColor(roleId: number): string {
    switch (roleId) {
      case 1: return 'bg-purple-100 text-purple-800'; // Administrador
      case 2: return 'bg-blue-100 text-blue-800';     // Agente
      case 3: return 'bg-green-100 text-green-800';   // Cliente
      case 4: return 'bg-yellow-100 text-yellow-800'; // Empleado
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Obtener nombre del rol
  getRolName(roleId: number): string {
    switch (roleId) {
      case 1: return 'Administrador';
      case 2: return 'Agente';
      case 3: return 'Cliente';
      case 4: return 'Empleado';
      default: return 'Desconocido';
    }
  }
}
