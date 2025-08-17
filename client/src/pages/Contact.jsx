
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { getConfig } from '../api/axios';



const initialState = { nombre: '', email: '', mensaje: '' };

const Contact = () => {
  const [form, setForm] = useState(initialState);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const [errores, setErrores] = useState({});
  const [contactInfo, setContactInfo] = useState({
    email: 'borderlesstechno7@gmail.com',
    phone: '+52 55 1234 5678',
    address: 'Ciudad de México, México'
  });

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await getConfig();
        if (response.data) {
          const config = response.data;
          setContactInfo({
            email: config.COMPANY_EMAIL || 'borderlesstechno7@gmail.com',
            phone: config.COMPANY_PHONE || '+52 55 1234 5678',
            address: config.COMPANY_ADDRESS || 'Ciudad de México, México'
          });
        }
      } catch (error) {
        // Keep default values if API fails
        console.log('Using default contact info - API not available');
      }
    };

    fetchContactInfo();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!form.nombre) nuevosErrores.nombre = 'El nombre es obligatorio.';
    if (!form.email) {
      nuevosErrores.email = 'El email es obligatorio.';
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) {
      nuevosErrores.email = 'Introduce un email válido.';
    }
    if (!form.mensaje) nuevosErrores.mensaje = 'El mensaje es obligatorio.';
    return nuevosErrores;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nuevosErrores = validar();
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) {
      setError('Por favor, corrige los errores.');
      return;
    }
    setError("");
    setEnviado(false);
    try {
      await api.post('/contacto', form);
      setEnviado(true);
      setForm(initialState);
    } catch (err) {
      setError("Hubo un error al enviar el mensaje. Inténtalo de nuevo más tarde.");
    }
  };

  return (
    <section className="py-12 px-4 md:px-0 max-w-lg mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-indigo-700 dark:text-indigo-300 text-center">Contacto</h2>
      <form className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium mb-1">Nombre <span className="text-red-500">*</span></label>
          <input type="text" id="nombre" name="nombre" value={form.nombre} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white" required />
          {errores.nombre && <span className="text-red-600 text-sm">{errores.nombre}</span>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
          <input type="email" id="email" name="email" value={form.email} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white" required />
          {errores.email && <span className="text-red-600 text-sm">{errores.email}</span>}
        </div>
        <div>
          <label htmlFor="mensaje" className="block text-sm font-medium mb-1">Mensaje <span className="text-red-500">*</span></label>
          <textarea id="mensaje" name="mensaje" rows={4} value={form.mensaje} onChange={handleChange} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white" required></textarea>
          {errores.mensaje && <span className="text-red-600 text-sm">{errores.mensaje}</span>}
        </div>
        {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
        {enviado && <p className="text-green-600 dark:text-green-400">¡Mensaje enviado correctamente!</p>}
        <button type="submit" className="w-full bg-indigo-700 text-white font-semibold py-3 rounded hover:bg-indigo-800 transition-colors duration-200">Enviar mensaje</button>
      </form>
      <div className="mt-8 text-center text-gray-600 dark:text-gray-300">
        <p><strong>Email:</strong> {contactInfo.email}</p>
        <p><strong>Teléfono:</strong> {contactInfo.phone}</p>
        <p><strong>Dirección:</strong> {contactInfo.address}</p>
      </div>
    </section>
  );
};

export default Contact;