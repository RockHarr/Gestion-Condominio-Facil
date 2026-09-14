import * as React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { dataService } from '../services/data';
import type { Amenity, Page, PageParams } from '../types';
import { Card, Button } from './Shared';
import Icons from './Icons';

interface AmenitiesManagerProps {
  onNavigate: (page: Page, params?: PageParams | null) => void;
}

export const AmenitiesManager: React.FC<AmenitiesManagerProps> = ({ onNavigate }) => {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    fetchAmenities();
  }, []);

  const fetchAmenities = async () => {
    try {
      setLoading(true);
      const data = await dataService.getAmenities();
      setAmenities(data);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      alert('Error al cargar los espacios comunes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (amenity?: Amenity) => {
    if (amenity) {
      setEditingAmenity(amenity);
      setName(amenity.name);
      setDescription(amenity.description || '');
      setCapacity(amenity.capacity?.toString() || '');
      setPhotoUrl(amenity.photoUrl || '');
    } else {
      setEditingAmenity(null);
      setName('');
      setDescription('');
      setCapacity('');
      setPhotoUrl('');
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amenityData = {
        name,
        description,
        capacity: capacity ? parseInt(capacity) : null,
        photo_url: photoUrl, // Map to DB column name
      };

      if (editingAmenity) {
        const { error } = await supabase
          .from('amenities')
          .update(amenityData)
          .eq('id', editingAmenity.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('amenities').insert([amenityData]);
        if (error) throw error;
      }

      setModalOpen(false);
      fetchAmenities();
    } catch (error) {
      console.error('Error saving amenity:', error);
      alert('Error al guardar el espacio común');
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        '¿Estás seguro de eliminar este espacio? Se borrarán todas las reservas asociadas.',
      )
    )
      return;

    try {
      const { error } = await supabase.from('amenities').delete().eq('id', id);

      if (error) throw error;
      fetchAmenities();
    } catch (error) {
      console.error('Error deleting amenity:', error);
      alert('Error al eliminar el espacio común');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-page pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => onNavigate('admin-dashboard')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Icons name="arrow-left" className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Espacios Comunes</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-7">
            Gestiona los quinchos, salas y áreas reservables.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shadow-lg shadow-blue-500/30">
          <Icons name="plus" className="w-4 h-4 mr-2" /> Nuevo Espacio
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {amenities.map((amenity) => (
            <Card
              key={amenity.id}
              className="group hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700"
            >
              <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 overflow-hidden relative">
                {amenity.photoUrl ? (
                  <img
                    src={amenity.photoUrl}
                    alt={amenity.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Icons name="photo" className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onNavigate('admin-reservation-types', { amenityId: amenity.id })}
                    className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-sm hover:bg-green-50 text-green-600"
                    title="Gestionar Tipos de Reserva"
                  >
                    <Icons name="clipboard-document-list" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenModal(amenity)}
                    className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-sm hover:bg-blue-50 text-blue-600"
                  >
                    <Icons name="pencil" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(amenity.id)}
                    className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-sm hover:bg-red-50 text-red-600"
                  >
                    <Icons name="trash" className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {amenity.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                {amenity.description || 'Sin descripción'}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1">
                  <Icons name="users" className="w-4 h-4 text-gray-400" />
                  <span>{amenity.capacity || 0} personas</span>
                </div>
              </div>
            </Card>
          ))}

          {amenities.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <Icons name="building-office" className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                No hay espacios creados
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Comienza creando el primer espacio común.
              </p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingAmenity ? 'Editar Espacio' : 'Nuevo Espacio'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <Icons name="xmark" className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                  placeholder="Ej: Quincho Norte"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                  placeholder="Detalles sobre el espacio..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacidad (Personas)
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL Foto (Opcional)
                </label>
                <input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-3"
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Guardar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
