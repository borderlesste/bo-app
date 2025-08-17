import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock API responses for testing
export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    const { email, password } = req.body;
    
    if (email === 'admin@test.com' && password === 'password123') {
      return res(
        ctx.json({
          success: true,
          user: {
            id: 1,
            nombre: 'Admin User',
            email: 'admin@test.com',
            rol: 'admin'
          },
          token: 'mock-jwt-token'
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({
        success: false,
        error: 'Credenciales inválidas'
      })
    );
  }),

  rest.post('/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: 'Usuario registrado exitosamente'
      })
    );
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      })
    );
  }),

  // Projects endpoints
  rest.get('/api/projects', (req, res, ctx) => {
    const page = parseInt(req.url.searchParams.get('page')) || 1;
    const limit = parseInt(req.url.searchParams.get('limit')) || 10;
    const categoria = req.url.searchParams.get('categoria');
    const search = req.url.searchParams.get('search');

    let mockProjects = [
      {
        id: 1,
        titulo: 'E-commerce Platform',
        descripcion: 'A full-featured e-commerce solution',
        categoria: 'web',
        tecnologias: ['React', 'Node.js', 'MySQL'],
        estado: 'completado',
        fecha_inicio: '2024-01-01',
        fecha_fin: '2024-03-01',
        presupuesto: 15000.00,
        imagen_principal: 'ecommerce.jpg'
      },
      {
        id: 2,
        titulo: 'Mobile Banking App',
        descripcion: 'Secure mobile banking application',
        categoria: 'mobile',
        tecnologias: ['React Native', 'Node.js'],
        estado: 'en_progreso',
        fecha_inicio: '2024-02-01',
        fecha_fin: null,
        presupuesto: 25000.00,
        imagen_principal: 'banking.jpg'
      },
      {
        id: 3,
        titulo: 'Corporate Website',
        descripcion: 'Professional corporate website',
        categoria: 'web',
        tecnologias: ['React', 'TailwindCSS'],
        estado: 'planificado',
        fecha_inicio: '2024-04-01',
        fecha_fin: null,
        presupuesto: 8000.00,
        imagen_principal: 'corporate.jpg'
      }
    ];

    // Apply filters
    if (categoria) {
      mockProjects = mockProjects.filter(p => p.categoria === categoria);
    }

    if (search) {
      mockProjects = mockProjects.filter(p => 
        p.titulo.toLowerCase().includes(search.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const total = mockProjects.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProjects = mockProjects.slice(startIndex, endIndex);

    return res(
      ctx.json({
        success: true,
        data: paginatedProjects,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    );
  }),

  rest.get('/api/projects/:id', (req, res, ctx) => {
    const { id } = req.params;
    const projectId = parseInt(id);

    if (projectId === 1) {
      return res(
        ctx.json({
          success: true,
          data: {
            id: 1,
            titulo: 'E-commerce Platform',
            descripcion: 'A full-featured e-commerce solution',
            categoria: 'web',
            tecnologias: ['React', 'Node.js', 'MySQL'],
            estado: 'completado',
            fecha_inicio: '2024-01-01',
            fecha_fin: '2024-03-01',
            presupuesto: 15000.00,
            imagen_principal: 'ecommerce.jpg'
          }
        })
      );
    }

    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        error: 'Proyecto no encontrado'
      })
    );
  }),

  rest.post('/api/projects', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: 'Proyecto creado exitosamente',
        data: {
          id: Date.now(),
          ...req.body
        }
      })
    );
  }),

  rest.put('/api/projects/:id', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: 'Proyecto actualizado exitosamente'
      })
    );
  }),

  rest.delete('/api/projects/:id', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: 'Proyecto eliminado exitosamente'
      })
    );
  }),

  // Dashboard endpoints
  rest.get('/api/admin/stats', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          totalProjects: 15,
          activeProjects: 8,
          completedProjects: 7,
          totalUsers: 25,
          totalRevenue: 125000.00,
          monthlyRevenue: 15000.00,
          averageProjectValue: 8333.33
        }
      })
    );
  }),

  rest.get('/api/admin/charts', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          monthlyProjects: [
            { month: 'Ene', completed: 2, started: 3 },
            { month: 'Feb', completed: 1, started: 2 },
            { month: 'Mar', completed: 3, started: 1 },
            { month: 'Abr', completed: 1, started: 4 }
          ],
          projectsByCategory: [
            { categoria: 'web', count: 8 },
            { categoria: 'mobile', count: 4 },
            { categoria: 'desktop', count: 2 },
            { categoria: 'consulting', count: 1 }
          ],
          revenueByMonth: [
            { month: 'Ene', revenue: 25000 },
            { month: 'Feb', revenue: 18000 },
            { month: 'Mar', revenue: 32000 },
            { month: 'Abr', revenue: 28000 }
          ]
        }
      })
    );
  }),

  // Notifications endpoints
  rest.get('/api/notifications', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: [
          {
            id: 1,
            titulo: 'Nuevo proyecto asignado',
            mensaje: 'Se te ha asignado el proyecto E-commerce Platform',
            tipo: 'info',
            leida: false,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            titulo: 'Proyecto completado',
            mensaje: 'El proyecto Mobile Banking App ha sido completado',
            tipo: 'success',
            leida: true,
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      })
    );
  }),

  rest.get('/api/notifications/unread-count', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        count: 3
      })
    );
  }),

  // Health check
  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected'
        }
      })
    );
  })
];

export const server = setupServer(...handlers);