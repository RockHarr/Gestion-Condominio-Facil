import * as React from 'react';
import { Notice, Page, NoticeType } from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';

interface NoticesScreenProps {
    notices: Notice[];
    onNavigate: (page: Page, params?: any) => void;
}

export const NoticesScreen: React.FC<NoticesScreenProps> = ({ notices, onNavigate }) => {
    // Sort notices by date descending
    const sortedNotices = [...notices].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return (
        <div className="p-4 space-y-6 animate-page pb-24">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Mural de Avisos</h2>
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
                    {notices.length} Publicaciones
                </div>
            </div>

            <div className="grid gap-4">
                {sortedNotices.length > 0 ? sortedNotices.map(notice => (
                    <button
                        key={notice.id}
                        onClick={() => onNavigate('notice-detail', { id: notice.id })}
                        className="text-left group focus:outline-none"
                    >
                        <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-l-4 ${notice.tipo === NoticeType.EMERGENCIA ? 'border-l-red-500' :
                                notice.tipo === NoticeType.MANTENIMIENTO ? 'border-l-yellow-500' : 'border-l-blue-500'
                            }`}>
                            {/* Unread Indicator (simulated logic, could be real if we track read state) */}
                            {new Date(notice.fecha) > new Date(Date.now() - 86400000 * 2) && (
                                <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm animate-pulse"></div>
                            )}

                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl shrink-0 ${notice.tipo === NoticeType.EMERGENCIA ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                        notice.tipo === NoticeType.MANTENIMIENTO ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                    }`}>
                                    <Icons name={
                                        notice.tipo === NoticeType.EMERGENCIA ? 'exclamation-triangle' :
                                            notice.tipo === NoticeType.MANTENIMIENTO ? 'wrench-screwdriver' : 'information-circle'
                                    } className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            {notice.tipo}
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap ml-2">
                                            {new Date(notice.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                        {notice.titulo}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                                        {notice.contenido}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </button>
                )) : (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icons name="bell-slash" className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Todo tranquilo</h3>
                        <p className="text-gray-500 dark:text-gray-400">No hay avisos recientes en la comunidad.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

interface NoticeDetailScreenProps {
    notice: Notice;
}

export const NoticeDetailScreen: React.FC<NoticeDetailScreenProps> = ({ notice }) => {
    return (
        <div className="p-4 animate-page">
            <Card className="overflow-hidden">
                <div className={`-mx-6 -mt-6 px-6 py-4 mb-6 border-b ${notice.tipo === NoticeType.EMERGENCIA ? 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/50' :
                        notice.tipo === NoticeType.MANTENIMIENTO ? 'bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-900/50' : 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/50'
                    }`}>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${notice.tipo === NoticeType.EMERGENCIA ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                notice.tipo === NoticeType.MANTENIMIENTO ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            }`}>
                            {notice.tipo}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto flex items-center gap-1">
                            <Icons name="calendar" className="w-4 h-4" />
                            {new Date(notice.fecha).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">{notice.titulo}</h1>

                <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-base">
                        {notice.contenido}
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>Publicado por Administración</span>
                    <div className="flex gap-4">
                        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                            <Icons name="share" className="w-4 h-4" /> Compartir
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
