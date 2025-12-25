import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import Icons from '../../components/Icons';

export const CreateTicketScreen: React.FC<{ onAddTicket: (ticket: { titulo: string; descripcion: string; foto?: string; }) => void }> = ({ onAddTicket }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState<string | undefined>(undefined);
    const [photoName, setPhotoName] = useState('');

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && description.trim()) {
            onAddTicket({ titulo: title, descripcion: description, foto: photo });
        }
    };

    return (
        <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={5} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adjuntar foto (opcional)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <Icons name="camera" className="mx-auto h-12 w-12 text-gray-400"/>
                                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                        <span>Subir un archivo</span>
                                        <input id="file-upload" name="file-upload" type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange}/>
                                    </label>
                                    <p className="pl-1">o arrastrar y soltar</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                            </div>
                        </div>
                        {photoName && <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">Archivo seleccionado: {photoName}</p>}
                    </div>
                </Card>
                <Button type="submit">Enviar Ticket</Button>
            </form>
        </div>
    );
};
