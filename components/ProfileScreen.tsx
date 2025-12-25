import React from 'react';
import { User } from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';

interface ProfileScreenProps {
    user: User;
    onLogout: () => void;
    onToggleTheme: () => void;
    theme: 'light' | 'dark';
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout, onToggleTheme, theme }) => {
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
                <button onClick={onToggleTheme} className="flex justify-between items-center w-full p-2">
                    <span className="font-medium text-gray-800 dark:text-gray-200">Modo Oscuro</span>
                    <div className="relative">
                        <div className={`w-14 h-8 rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`}></div>
                    </div>
                </button>
            </Card>

            <Button onClick={onLogout} variant="danger">
                <div className="flex items-center justify-center">
                    <Icons name="logout" className="w-5 h-5 mr-2" /> Cerrar Sesión
                </div>
            </Button>
        </div>
    );
};
