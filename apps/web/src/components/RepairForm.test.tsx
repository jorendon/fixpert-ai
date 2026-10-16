import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RepairForm } from './RepairForm';

// Mock de react-i18next para pruebas unitarias
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue?: string) => defaultValue || _key,
  }),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe('RepairForm Component', () => {
  it('renderiza correctamente los campos multimodales (cámara, descripción y botón)', () => {
    renderWithProviders(<RepairForm />);

    // Verifica el encabezado
    expect(
      screen.getByRole('heading', { name: /Asistente de Reparación Fixpert-AI/i }),
    ).toBeInTheDocument();

    // Verifica el input de captura de cámara con atributo capture="environment"
    const fileInput = screen.getByLabelText(
      /Capturar o subir foto del objeto dañado/i,
    ) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', 'image/*');
    expect(fileInput).toHaveAttribute('capture', 'environment');

    // Verifica el textarea de descripción
    const textarea = screen.getByLabelText(
      /Describe el problema o lo que necesitas armar/i,
    );
    expect(textarea).toBeInTheDocument();

    // Verifica que el botón de envío inicia deshabilitado cuando no hay texto
    const submitButton = screen.getByRole('button', {
      name: /Diagnosticar Reparación/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it('habilita el botón de envío cuando el usuario ingresa una descripción', () => {
    renderWithProviders(<RepairForm />);

    const textarea = screen.getByLabelText(
      /Describe el problema o lo que necesitas armar/i,
    );
    const submitButton = screen.getByRole('button', {
      name: /Diagnosticar Reparación/i,
    });

    fireEvent.change(textarea, {
      target: { value: 'Necesito ajustar la puerta del armario' },
    });

    expect(submitButton).not.toBeDisabled();
  });
});
