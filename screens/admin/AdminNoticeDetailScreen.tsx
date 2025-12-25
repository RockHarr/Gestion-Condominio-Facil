import React from 'react';
import type { Notice } from '../../types';
import { NoticeStatus } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const AdminNoticeDetailScreen: React.FC<{ notice: Notice, onApprove: (id: number) => void }> = ({ notice, onApprove }) => {
    return (
        <div className="p-4 md:p-6 space-y-4">
            <Card>
                <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{notice.titulo}</h2>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
                        notice.status === NoticeStatus.PUBLICADO
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                        {notice.status}
                    </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{notice.tipo} - Publicado el {new Date(notice.fecha).toLocaleDateString('es-CL')}</p>
                <hr className="my-4 border-gray-200 dark:border-gray-700"/>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{notice.contenido}</p>
            </Card>
            {notice.status === NoticeStatus.BORRADOR && (
                <Button onClick={() => onApprove(notice.id)}>
                    Aprobar y Publicar
                </Button>
            )}
        </div>
    );
};
