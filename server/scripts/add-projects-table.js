// scripts/add-projects-table.js
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db.js');

async function addProjectsTable() {
  console.log('🚀 Agregando tabla de proyectos...');
  
  try {
    // Crear tabla
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS proyectos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT NOT NULL,
        imagen VARCHAR(500) NULL,
        url VARCHAR(500) NULL,
        demo VARCHAR(500) NULL,
        tecnologias JSON NULL,
        categoria VARCHAR(100) NOT NULL DEFAULT 'web',
        estado ENUM('Activo', 'Inactivo', 'Pendiente') NOT NULL DEFAULT 'Activo',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabla de proyectos creada correctamente');
    
    // Insertar datos de ejemplo
    const projects = [
      {
        nombre: 'Landing Page Corporativa',
        descripcion: 'Sitio web moderno y responsivo para empresa de tecnología con diseño atractivo y funcionalidades avanzadas.',
        imagen: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=400&q=80',
        url: 'https://github.com/borderlesstechno/corporate-landing',
        demo: 'https://corporate-landing-demo.vercel.app',
        tecnologias: '["React", "Tailwind CSS", "Framer Motion", "Vite"]',
        categoria: 'web'
      },
      {
        nombre: 'E-commerce Personalizado',
        descripcion: 'Tienda online completa con pasarela de pagos integrada, panel de administración y gestión de inventarios.',
        imagen: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80',
        url: 'https://github.com/borderlesstechno/ecommerce-custom',
        demo: 'https://ecommerce-demo.vercel.app',
        tecnologias: '["Next.js", "Stripe", "MongoDB", "Node.js"]',
        categoria: 'web'
      },
      {
        nombre: 'App de Reservas',
        descripcion: 'Aplicación web para gestión de reservas en tiempo real con notificaciones automáticas y calendario integrado.',
        imagen: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
        url: 'https://github.com/borderlesstechno/booking-app',
        demo: 'https://booking-app-demo.vercel.app',
        tecnologias: '["React", "Node.js", "Socket.io", "Express"]',
        categoria: 'app'
      },
      {
        nombre: 'Sistema de Gestión Interna',
        descripcion: 'Plataforma completa para gestión de tareas, proyectos y recursos empresariales con dashboard avanzado.',
        imagen: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80',
        url: 'https://github.com/borderlesstechno/task-management',
        demo: 'https://task-mgmt-demo.vercel.app',
        tecnologias: '["React", "Express", "PostgreSQL", "JWT"]',
        categoria: 'system'
      },
      {
        nombre: 'Portfolio Profesional',
        descripcion: 'Sitio web personalizado para mostrar proyectos y habilidades profesionales con animaciones avanzadas.',
        imagen: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
        url: 'https://github.com/borderlesstechno/portfolio-pro',
        demo: 'https://portfolio-pro-demo.vercel.app',
        tecnologias: '["Vue.js", "Nuxt.js", "GSAP", "CSS3"]',
        categoria: 'web'
      },
      {
        nombre: 'API de Servicios Empresariales',
        descripcion: 'API REST completa para integración de servicios empresariales con documentación automática.',
        imagen: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
        url: 'https://github.com/borderlesstechno/enterprise-api',
        demo: 'https://api-docs-demo.vercel.app',
        tecnologias: '["Node.js", "Express", "MongoDB", "Swagger"]',
        categoria: 'api'
      }
    ];
    
    for (const project of projects) {
      await pool.execute(
        'INSERT INTO proyectos (nombre, descripcion, imagen, url, demo, tecnologias, categoria) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [project.nombre, project.descripcion, project.imagen, project.url, project.demo, project.tecnologias, project.categoria]
      );
    }
    
    // Verificar que se insertaron los datos
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM proyectos');
    console.log(`📊 Se insertaron ${rows[0].count} proyectos de ejemplo`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear tabla de proyectos:', error.message);
    process.exit(1);
  }
}

addProjectsTable();