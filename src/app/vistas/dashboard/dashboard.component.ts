import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SucursalesService } from '../../services/sucursales.service';
import { Sucursal } from '../../models/api.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private sucursalesService = inject(SucursalesService);

  // Lista de sucursales
  sucursales = signal<Sucursal[]>([]);
  isLoading = signal(false);

  // Control del modal
  mostrarModal = signal(false);
  modoEdicion = signal(false);

  // Formulario (propiedad normal para compatibilidad con ngModel)
  sucursalForm: Partial<Sucursal> = {
    nombre: '',
    direccion: '',
    telefono: '',
    horario: '',
    agente_id: null
  };

  ngOnInit(): void {
    this.cargarSucursales();
  }

  /**
   * Cargar sucursales desde la API
   */
  cargarSucursales(): void {
    this.isLoading.set(true);
    this.sucursalesService.getAll().subscribe({
      next: (sucursales) => {
        this.sucursales.set(sucursales);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar sucursales:', error);
        alert('Error al cargar sucursales');
        this.isLoading.set(false);
      }
    });
  }

  // Abrir modal para crear nueva sucursal
  abrirModalCrear(): void {
    this.modoEdicion.set(false);
    this.sucursalForm = {
      nombre: '',
      direccion: '',
      telefono: '',
      horario: '',
      agente_id: null
    };
    this.mostrarModal.set(true);
  }

  // Abrir modal para editar sucursal
  abrirModalEditar(sucursal: Sucursal): void {
    this.modoEdicion.set(true);
    this.sucursalForm = {
      id: sucursal.id,
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      telefono: sucursal.telefono,
      horario: sucursal.horario,
      agente_id: sucursal.agente_id
    };
    this.mostrarModal.set(true);
  }

  // Cerrar modal
  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  // Guardar sucursal (crear o actualizar)
  guardarSucursal(): void {
    const form = this.sucursalForm;

    if (!form.nombre || !form.direccion || !form.telefono) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    this.isLoading.set(true);

    if (this.modoEdicion() && form.id) {
      // Actualizar sucursal existente
      this.sucursalesService.update(form.id, form).subscribe({
        next: () => {
          this.cargarSucursales();
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error al actualizar sucursal:', error);
          alert(error.error?.message || 'Error al actualizar sucursal');
          this.isLoading.set(false);
        }
      });
    } else {
      // Crear nueva sucursal
      this.sucursalesService.create(form).subscribe({
        next: () => {
          this.cargarSucursales();
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error al crear sucursal:', error);
          alert(error.error?.message || 'Error al crear sucursal');
          this.isLoading.set(false);
        }
      });
    }
  }

  // Eliminar sucursal
  eliminarSucursal(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta sucursal?')) {
      this.isLoading.set(true);
      this.sucursalesService.delete(id).subscribe({
        next: () => {
          this.cargarSucursales();
        },
        error: (error) => {
          console.error('Error al eliminar sucursal:', error);
          alert(error.error?.message || 'Error al eliminar sucursal');
          this.isLoading.set(false);
        }
      });
    }
  }
}
