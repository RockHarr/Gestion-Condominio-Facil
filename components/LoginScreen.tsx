import React, { useState } from 'react';
import { User } from '../types';
import { Card, Button } from './Shared';

interface LoginScreenProps {
    onLogin: (user: User) => void;
    users: User[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, users }) => {
    const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id.toString() || '');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const user = users.find(u => u.id.toString() === selectedUserId);
        if (user) {
            onLogin(user);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <Card className="w-full max-w-sm">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bienvenido</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Selecciona un usuario para continuar</p>
                </div>
                <form onSubmit={handleLogin} className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="user-select" className="sr-only">Seleccionar Usuario</label>
                        <select
                            id="user-select"
                            data-testid="select-usuario"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.nombre} ({user.role === 'admin' ? 'Admin' : user.unidad})</option>
                            ))}
                        </select>
                    </div>
                    <Button type="submit" data-testid="btn-ingresar">
                        Ingresar
                    </Button>
                </form>
            </Card>
        </div>
    );
};
