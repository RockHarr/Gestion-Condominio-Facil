import React from 'react';
import type { Page, Notice } from '../../types';
import { NoticeType } from '../../types';
import { Card } from '../../components/common/Card';

export const NoticesScreen: React.FC<{ notices: Notice[]; onNavigate: (page: Page, params?: any) => void }> = ({ notices, onNavigate }) => {
    const typeColors: { [key in NoticeType]: string } = {
        [NoticeType.EMERGENCIA]: 'border-red-500',
        [NoticeType.MANTENIMIENTO]: 'border-yellow-500',
        [NoticeType.COMUNIDAD]: 'border-blue-500'
    };

    return (
        <div className="p-4 space-y-4">
            {notices.map(notice => (
                 <button
  key={notice.id}
  data-testid={`notice-item-${notice.id}`}
  onClick={() => onNavigate('notice-detail', { id: notice.id })}
  className="w-full text-left"
>

                    <Card className={`border-l-4 ${typeColors[notice.tipo]} ${!notice.leido && 'bg-blue-50 dark:bg-blue-900/20'}`}>
                        <div className="flex justify-between items-start">
                             <div>
                                 <p className="text-sm text-gray-500 dark:text-gray-400">{notice.tipo}</p>
                                 <h3 className={`font-bold text-lg ${!notice.leido ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{notice.titulo}</h3>
                             </div>
                             {!notice.leido && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1 ml-2"></div>}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{new Date(notice.fecha).toLocaleDateString('es-CL')}</p>
                    </Card>
                 </button>
            ))}
        </div>
    );
};
