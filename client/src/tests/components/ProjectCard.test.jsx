import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProjectCard from '../../components/projects/ProjectCard';

const mockProject = {
  id: 1,
  titulo: 'E-commerce Platform',
  descripcion: 'A full-featured e-commerce solution with payment integration',
  categoria: 'web',
  tecnologias: ['React', 'Node.js', 'MySQL', 'Stripe'],
  estado: 'completado',
  fecha_inicio: '2024-01-01',
  fecha_fin: '2024-03-01',
  presupuesto: 15000.00,
  imagen_principal: 'ecommerce.jpg',
  cliente_nombre: 'Tech Solutions Inc.'
};

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('ProjectCard Component', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderProjectCard = (props = {}) => {
    return render(
      <TestWrapper>
        <ProjectCard
          project={mockProject}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          {...props}
        />
      </TestWrapper>
    );
  };

  it('renders project information correctly', () => {
    renderProjectCard();

    expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
    expect(screen.getByText(/A full-featured e-commerce solution/)).toBeInTheDocument();
    expect(screen.getByText('web')).toBeInTheDocument();
    expect(screen.getByText('completado')).toBeInTheDocument();
    expect(screen.getByText('$15,000.00')).toBeInTheDocument();
    expect(screen.getByText('Tech Solutions Inc.')).toBeInTheDocument();
  });

  it('displays technologies as badges', () => {
    renderProjectCard();

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('MySQL')).toBeInTheDocument();
    expect(screen.getByText('Stripe')).toBeInTheDocument();
  });

  it('shows project dates', () => {
    renderProjectCard();

    expect(screen.getByText(/01\/01\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/01\/03\/2024/)).toBeInTheDocument();
  });

  it('displays appropriate status styling', () => {
    renderProjectCard();

    const statusBadge = screen.getByText('completado');
    expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('shows different status colors for different states', () => {
    const projectInProgress = { ...mockProject, estado: 'en_progreso' };
    renderProjectCard({ project: projectInProgress });

    const statusBadge = screen.getByText('en_progreso');
    expect(statusBadge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('shows planned status styling', () => {
    const plannedProject = { ...mockProject, estado: 'planificado' };
    renderProjectCard({ project: plannedProject });

    const statusBadge = screen.getByText('planificado');
    expect(statusBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('handles edit button click', () => {
    renderProjectCard();

    const editButton = screen.getByLabelText(/editar proyecto/i);
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockProject);
  });

  it('handles delete button click', async () => {
    renderProjectCard();

    const deleteButton = screen.getByLabelText(/eliminar proyecto/i);
    fireEvent.click(deleteButton);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/¿estás seguro/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByText(/eliminar/i);
    fireEvent.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockProject.id);
  });

  it('cancels delete operation', async () => {
    renderProjectCard();

    const deleteButton = screen.getByLabelText(/eliminar proyecto/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/¿estás seguro/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByText(/cancelar/i);
    fireEvent.click(cancelButton);

    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('displays project image', () => {
    renderProjectCard();

    const image = screen.getByAltText('E-commerce Platform');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('ecommerce.jpg'));
  });

  it('handles missing image gracefully', () => {
    const projectWithoutImage = { ...mockProject, imagen_principal: null };
    renderProjectCard({ project: projectWithoutImage });

    const image = screen.getByAltText('E-commerce Platform');
    expect(image).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });

  it('truncates long descriptions', () => {
    const longDescription = 'This is a very long description that should be truncated after a certain number of characters to maintain the card layout and readability. It contains a lot of technical details about the project implementation.';
    const projectWithLongDesc = { ...mockProject, descripcion: longDescription };
    
    renderProjectCard({ project: projectWithLongDesc });

    const description = screen.getByText(/This is a very long description/);
    expect(description).toBeInTheDocument();
    // Should have truncation class
    expect(description).toHaveClass('line-clamp-3');
  });

  it('handles missing client name', () => {
    const projectWithoutClient = { ...mockProject, cliente_nombre: null };
    renderProjectCard({ project: projectWithoutClient });

    expect(screen.getByText('Cliente no asignado')).toBeInTheDocument();
  });

  it('displays correct category icon', () => {
    renderProjectCard();

    const webIcon = screen.getByTestId('category-icon');
    expect(webIcon).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    const expensiveProject = { ...mockProject, presupuesto: 123456.78 };
    renderProjectCard({ project: expensiveProject });

    expect(screen.getByText('$123,456.78')).toBeInTheDocument();
  });

  it('handles null end date for ongoing projects', () => {
    const ongoingProject = { ...mockProject, fecha_fin: null, estado: 'en_progreso' };
    renderProjectCard({ project: ongoingProject });

    expect(screen.getByText('En progreso')).toBeInTheDocument();
  });

  it('is accessible with proper ARIA labels', () => {
    renderProjectCard();

    expect(screen.getByRole('article')).toHaveAttribute('aria-label', expect.stringContaining('E-commerce Platform'));
    expect(screen.getByLabelText(/editar proyecto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/eliminar proyecto/i)).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    renderProjectCard();

    const editButton = screen.getByLabelText(/editar proyecto/i);
    const deleteButton = screen.getByLabelText(/eliminar proyecto/i);

    editButton.focus();
    expect(editButton).toHaveFocus();

    fireEvent.keyDown(editButton, { key: 'Tab' });
    expect(deleteButton).toHaveFocus();
  });
});