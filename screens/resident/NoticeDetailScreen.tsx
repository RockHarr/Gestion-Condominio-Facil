import React from 'react';
import type { Notice } from '../../types';
import { NoticeType } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const NoticeDetailScreen: React.FC<{ notice: Notice; showToast: (message: string, type?: 'success' | 'error' | 'info') => void; }> = ({ notice, showToast }) => {
    const typeColors: { [key in NoticeType]: string } = {
        [NoticeType.EMERGENCIA]: 'text-red-600 dark:text-red-400',
        [NoticeType.MANTENIMIENTO]: 'text-yellow-600 dark:text-yellow-400',
        [NoticeType.COMUNIDAD]: 'text-blue-600 dark:text-blue-400'
    };

    return (
        <div className="p-4">
            <Card>
                <p className={`font-semibold ${typeColors[notice.tipo]}`}>{notice.tipo}</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{notice.titulo}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Publicado el {new Date(notice.fecha).toLocaleDateString('es-CL')}</p>
                <hr className="my-4 border-gray-200 dark:border-gray-700"/>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{notice.contenido}</p>
                <div className="mt-6">
                    <Button variant="secondary" onClick={() => showToast('Simulación de descarga de adjunto.', 'info')}>Descargar Adjunto</Button>
                </div>
            </Card>
        </div>
    );
};
