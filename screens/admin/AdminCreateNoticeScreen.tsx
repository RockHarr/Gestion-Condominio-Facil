import React, { useState } from 'react';
import type { Notice } from '../../types';
import { NoticeType } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const AdminCreateNoticeScreen: React.FC<{ onAddNotice: (notice: Omit<Notice, 'id' | 'fecha' | 'leido' | 'status'>) => void }> = ({ onAddNotice }) => {
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
        <div className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <div>
                        <label htmlFor="title" className="block text_sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                     <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Aviso</label>
                        <select id="type" value={type} onChange={e => setType(e.target.value as NoticeType)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            {Object.values(NoticeType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contenido</label>
                        <textarea id="content" value={content} onChange={e => setContent(e.target.value)} rows={8} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                </Card>
                <Button type="submit">Guardar como Borrador</Button>
            </form>
        </div>
    );
};
