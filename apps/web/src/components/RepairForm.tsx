import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export interface YoutubeVideo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  url: string;
}

export interface DiagnosisResponse {
  id: string;
  problema_identificado: string;
  pasos_para_reparar: string[];
  palabras_clave_busqueda_youtube: string[];
  videos_recomendados?: YoutubeVideo[];
}

export const RepairForm: React.FC = () => {
  const { t } = useTranslation();
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const mutation = useMutation<DiagnosisResponse, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/repairs/diagnose`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al obtener el diagnóstico de reparación');
      }

      return response.json();
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const formData = new FormData();
    formData.append('description', description);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    mutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">
        {t('repair.title', 'Asistente de Reparación Fixpert-AI')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5" aria-label="repair-form">
        <div>
          <label
            htmlFor="repair-image"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            {t('repair.photoLabel', 'Capturar o subir foto del objeto dañado / mueble')}
          </label>
          <input
            id="repair-image"
            name="image"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Vista previa de reparación"
              className="mt-3 max-h-56 rounded-lg object-cover border border-slate-200"
            />
          )}
        </div>

        <div>
          <label
            htmlFor="repair-description"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            {t('repair.descriptionLabel', 'Describe el problema o lo que necesitas armar')}
          </label>
          <textarea
            id="repair-description"
            name="description"
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t(
              'repair.descriptionPlaceholder',
              'Ej: La pata de mi silla de madera se aflojó o necesito armar este estante...',
            )}
            className="w-full rounded-lg border border-slate-300 p-3 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !description.trim()}
          className="w-full py-3 px-5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {mutation.isPending
            ? t('repair.analyzing', 'Analizando con IA...')
            : t('repair.submit', 'Diagnosticar Reparación')}
        </button>
      </form>

      {mutation.isError && (
        <div role="alert" className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {mutation.error.message}
        </div>
      )}

      {mutation.isSuccess && mutation.data && (
        <div className="mt-6 space-y-4 border-t pt-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Problema Identificado</h3>
            <p className="text-slate-700 mt-1">{mutation.data.problema_identificado}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900">Pasos para Reparar</h3>
            <ol className="list-decimal list-inside space-y-1 mt-2 text-slate-700">
              {mutation.data.pasos_para_reparar.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
