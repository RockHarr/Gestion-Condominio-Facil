import * as React from 'react';
import { useState } from 'react';
import { Notice, NoticeStatus, NoticeType, Page } from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';

interface AdminNoticesScreenProps {
    notices: Notice[];
    onNavigate: (page: Page, params?: any) => void;
}

export const AdminNoticesScreen: React.FC<AdminNoticesScreenProps> = ({ notices, onNavigate }) => {
    const getStatusColors = (status: NoticeStatus) => {
        return status === NoticeStatus.PUBLICADO
            ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
            : 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
    };

    const getTypeIcon = (type: NoticeType) => {
        switch (type) {
            case NoticeType.EMERGENCIA: return 'exclamation-triangle';
            case NoticeType.MANTENCION: return 'wrench-screwdriver';
            case NoticeType.REUNION: return 'users';
            default: return 'information-circle';
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 animate-page pb-24">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mural de Avisos</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona las comunicaciones a la comunidad</p>
                </div>
                <Button onClick={() => onNavigate('admin-notice-create')} className="!w-auto shadow-lg shadow-blue-500/30">
                    <Icons name="plus" className="w-5 h-5 mr-2" /> Crear Aviso
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {notices.map(notice => (
                    <div key={notice.id} className="group relative">
                        <div
                            onClick={() => onNavigate('admin-notice-detail', { id: notice.id })}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 cursor-pointer h-full flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className={`p-2 rounded-lg ${notice.tipo === NoticeType.EMERGENCIA ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                        notice.tipo === NoticeType.MANTENCION ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                            notice.tipo === NoticeType.REUNION ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}>
                                    <Icons name={getTypeIcon(notice.tipo)} className="w-6 h-6" />
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusColors(notice.status)}`}>
                                    {notice.status}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {notice.titulo}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4 flex-1">
                                {notice.contenido}
                            </p>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Icons name="calendar" className="w-3 h-3" />
                                    {new Date(notice.fecha).toLocaleDateString('es-CL')}
                                </span>
                                <span className="font-medium uppercase tracking-wide">{notice.tipo}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {notices.length === 0 && (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Icons name="bell" className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay avisos</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Comienza creando un aviso para la comunidad.</p>
                </div>
            )}
        </div>
    );
};

interface AdminNoticeDetailScreenProps {
    notice: Notice;
    onApprove: (id: number) => void;
}

export const AdminNoticeDetailScreen: React.FC<AdminNoticeDetailScreenProps> = ({ notice, onApprove }) => {
    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 animate-page">
            <Card className="overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 border-b border-gray-100 dark:border-gray-700 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${notice.status === NoticeStatus.PUBLICADO
                                ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
                                }`}>
                                {notice.status}
                            </span>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{notice.tipo}</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">{notice.titulo}</h2>
                    </div>
                    <div className="text-right whitespace-nowrap">
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-end gap-1">
                            <Icons name="calendar" className="w-4 h-4" />
                            {new Date(notice.fecha).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
                        {notice.contenido}
                    </p>
                </div>
            </Card>

            {notice.status === NoticeStatus.BORRADOR && (
                <div className="fixed bottom-24 left-0 right-0 px-4 md:static md:p-0 flex justify-center">
                    <Button onClick={() => onApprove(notice.id)} className="w-full md:w-auto shadow-xl shadow-green-500/30 bg-green-600 hover:bg-green-700 focus:ring-green-500 text-lg py-3 px-8">
                        <Icons name="check-badge" className="w-6 h-6 mr-2" />
                        Aprobar y Publicar
                    </Button>
                </div>
            )}
        </div>
    );
};

interface AdminCreateNoticeScreenProps {
    onAddNotice: (notice: Omit<Notice, 'id' | 'fecha' | 'leido' | 'status'>) => void;
}

export const AdminCreateNoticeScreen: React.FC<AdminCreateNoticeScreenProps> = ({ onAddNotice }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState<NoticeType>(NoticeType.COMUNIDAD);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && content.trim()) {
            onAddNotice({ titulo: title, contenido: content, tipo: type });
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto animate-page">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Redactar Nuevo Aviso</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título del Aviso</label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                                placeholder="Ej: Corte de agua programado"
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4 font-medium"
                            />
                        </div>
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Aviso</label>
                            <select
                                id="type"
                                value={type}
                                onChange={e => setType(e.target.value as NoticeType)}
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4"
                            >
                                {Object.values(NoticeType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenido</label>
                            <textarea
                                id="content"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                rows={8}
                                required
                                placeholder="Escribe aquí el detalle del comunicado..."
                                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4 leading-relaxed"
                            />
                        </div>
                    </div>
                </Card>
                <div className="flex justify-end">
                    <Button type="submit" className="w-full md:w-auto shadow-lg shadow-blue-500/30">
                        <Icons name="document-plus" className="w-5 h-5 mr-2" />
                        Guardar Borrador
                    </Button>
                </div>
            </form>
        </div>
    );
};
