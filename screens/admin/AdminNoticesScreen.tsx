import React from 'react';
import type { Page, Notice } from '../../types';
import { NoticeStatus } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import Icons from '../../components/Icons';

export const AdminNoticesScreen: React.FC<{ notices: Notice[], onNavigate: (page: Page, params?: any) => void }> = ({ notices, onNavigate }) => {
    const getStatusColors = (status: NoticeStatus) => {
        return status === NoticeStatus.PUBLICADO
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    };

    return (
        <div className="p-4 md:p-6 space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => onNavigate('admin-notice-create')} className="!w-auto">
                     <div className="flex items-center"><Icons name="plus" className="w-5 h-5 mr-2" /> Crear Aviso</div>
                </Button>
            </div>
            <Card>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notices.map(notice => (
                        <li key={notice.id}>
                            <button onClick={() => onNavigate('admin-notice-detail', { id: notice.id })} className="w-full text-left py-3 px-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{notice.titulo}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{notice.tipo} - {new Date(notice.fecha).toLocaleDateString('es-CL')}</p>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${getStatusColors(notice.status)}`}>
                                        {notice.status}
                                    </span>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
};
