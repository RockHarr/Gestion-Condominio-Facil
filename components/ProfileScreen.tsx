import React from 'react';
import type { User, Page, PageParams } from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';
import { authService } from '../services/auth';
import { getErrorMessage } from '../types';

interface ProfileScreenProps {
  user: User;
  onLogout: () => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
  onNavigate: (page: Page, params?: PageParams | null) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onLogout,
  onToggleTheme,
  theme,
  onNavigate,
}) => {
  return (
    <div className="p-4 space-y-4">
      <Card className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <Icons name="user" className="w-10 h-10 text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.nombre}</h2>
          <p className="text-gray-600 dark:text-gray-400">Unidad {user.unidad}</p>
        </div>
      </Card>

      <Card>
      <button
        onClick={onToggleTheme}
        className="flex justify-between items-center w-full p-2"
        role="switch"
        aria-checked={theme === 'dark'}
        aria-label="Alternar modo oscuro"
      >
          <span className="font-medium text-gray-800 dark:text-gray-200">Modo Oscuro</span>
          <div className="relative">
            <div
              className={`w-14 h-8 rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}
            ></div>
            <div
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`}
            ></div>
          </div>
        </button>
      </Card>

      <PasswordChangeSection />

      <Button onClick={onLogout} variant="danger">
        <div className="flex items-center justify-center">
          <Icons name="logout" className="w-5 h-5 mr-2" /> Cerrar Sesión
        </div>
      </Button>
    </div>
  );
};

const PasswordChangeSection: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; type: 'success' | 'error' } | null>(
    null,
  );

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (password.length < 6) {
      setMessage({ text: 'La contraseña debe tener al menos 6 caracteres.', type: 'error' });
      setLoading(false);
      return;
    }

    console.log('ProfileScreen: Attempting to update password...');
    try {
      const { error } = await authService.updatePassword(password);
      console.log('ProfileScreen: Update password result', error);

      if (error) {
        const errMsg = error.message || JSON.stringify(error);
        if (errMsg.includes('Timeout') || errMsg.includes('timed out')) {
          setMessage({
            text: '⏳ Tiempo agotado: La conexión es lenta. Intenta de nuevo.',
            type: 'error',
          });
        } else {
          setMessage({ text: '❌ Error: ' + errMsg, type: 'error' });
        }
      } else {
        setMessage({ text: 'Contraseña actualizada exitosamente.', type: 'success' });
        setPassword('');
        setTimeout(() => setIsOpen(false), 2000);
      }
    } catch (err: unknown) {
      console.error('ProfileScreen: Exception updating password', err);
      setMessage({ text: 'Error inesperado: ' + getErrorMessage(err), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Card>
        <button
          onClick={() => setIsOpen(true)}
          className="flex justify-between items-center w-full p-2 text-blue-600 dark:text-blue-400 font-medium"
        >
          <span>Cambiar Contraseña</span>
          <Icons name="chevronRight" className="w-5 h-5" />
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-2 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-900 dark:text-white">Nueva Contraseña</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <Icons name="close" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-3">
          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Nueva Contraseña
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa nueva contraseña"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {message && (
            <div
              className={`p-2 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
            >
              {message.text}
            </div>
          )}

          <Button type="submit" isLoading={loading} className="w-full">
            {loading ? 'Guardando...' : 'Guardar Nueva Contraseña'}
          </Button>
        </form>
      </div>
    </Card>
  );
};
