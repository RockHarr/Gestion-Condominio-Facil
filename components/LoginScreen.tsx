import React, { useState } from 'react';
import { authService } from '../services/auth';
import { Card, Button } from './Shared';

interface LoginScreenProps { }

export const LoginScreen: React.FC<LoginScreenProps> = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [usePassword, setUsePassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        let result;
        if (usePassword) {
            result = await authService.signInWithPassword(email, password);
        } else {
            result = await authService.signIn(email);
        }

        const { error } = result;

        if (error) {
            setMessage({ text: 'Error al iniciar sesión: ' + error.message, type: 'error' });
        } else {
            if (usePassword) {
                // Password login successful, auth state change will handle redirect
                setMessage({ text: 'Inicio de sesión exitoso.', type: 'success' });
            } else {
                setMessage({ text: '¡Enlace mágico enviado! Revisa tu correo.', type: 'success' });
            }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <Card className="w-full max-w-sm">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bienvenido</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {usePassword ? 'Ingresa tus credenciales' : 'Ingresa tu correo para continuar'}
                    </p>
                </div>
                <form onSubmit={handleLogin} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="sr-only">Correo Electrónico</label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        {usePassword && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <label htmlFor="password" className="sr-only">Contraseña</label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Contraseña"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        )}
                    </div>

                    {message && (
                        <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-3">
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Procesando...' : (usePassword ? 'Iniciar Sesión' : 'Enviar enlace de acceso')}
                        </Button>

                        <button
                            type="button"
                            onClick={() => {
                                setUsePassword(!usePassword);
                                setMessage(null);
                            }}
                            className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
                        >
                            {usePassword ? 'Usar enlace mágico (sin contraseña)' : 'Usar contraseña'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
