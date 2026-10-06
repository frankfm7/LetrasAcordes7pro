import { ChevronLeft, User, Mail, Calendar, Music, Star, ListMusic } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ProfilePageProps {
  onBack: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { state } = useApp();

  const totalSongs = state.customSongs.length + 10; // Asumiendo 10 canciones predeterminadas
  const totalHymnals = state.customHymnals.length + 1; // Asumiendo 1 cancionero predeterminado

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Header con botón de volver */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Mi Perfil</h1>
      </div>

      {/* Tarjeta de perfil */}
      <div className="rounded-2xl p-6 mb-6 card-shadow-md" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-light)' }}>
            <User size={40} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">Usuario</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>usuario@cancionero7pro.com</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Mail size={18} style={{ color: 'var(--text-muted)' }} />
            <div className="flex-1">
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Email</div>
              <div className="text-sm font-medium">usuario@cancionero7pro.com</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
            <div className="flex-1">
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Miembro desde</div>
              <div className="text-sm font-medium">Enero 2026</div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="rounded-2xl p-6 mb-6 card-shadow-md" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-lg font-bold mb-4">Mis Estadísticas</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Music size={24} className="mx-auto mb-2" style={{ color: 'var(--accent)' }} />
            <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{totalSongs}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Canciones</div>
          </div>

          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Star size={24} className="mx-auto mb-2" style={{ color: 'var(--gold)' }} />
            <div className="text-2xl font-bold" style={{ color: 'var(--gold)' }}>{state.favorites.length}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Favoritos</div>
          </div>

          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Music size={24} className="mx-auto mb-2" style={{ color: 'var(--accent)' }} />
            <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{totalHymnals}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Cancioneros</div>
          </div>

          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <ListMusic size={24} className="mx-auto mb-2" style={{ color: 'var(--accent)' }} />
            <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{state.setlists.length}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Listas</div>
          </div>
        </div>
      </div>

      {/* Información de la app */}
      <div className="rounded-2xl p-6 card-shadow-md" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-lg font-bold mb-4">Acerca de Cancionero7Pro</h3>
        
        <div className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <p><strong>Versión:</strong> 1.0 Premium</p>
          <p><strong>Desarrollado por:</strong> Cancionero7Pro Team</p>
          <p><strong>Descripción:</strong> Gestión profesional de letras y acordes para músicos y cantantes</p>
          <p className="pt-2 text-xs">© 2026 Cancionero7Pro. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
