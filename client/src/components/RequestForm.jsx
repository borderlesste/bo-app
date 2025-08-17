import { useState } from 'react';
import PropTypes from 'prop-types';
import api from '../api/axios';

const initialState = {
  servicio: "",
  descripcion: "",
};

function RequestForm({ onSubmit }) {
  const [form, setForm] = useState(initialState);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const [errores, setErrores] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!form.servicio) nuevosErrores.servicio = 'Selecciona un servicio.';
    if (!form.descripcion) nuevosErrores.descripcion = 'La descripción es obligatoria.';
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
      const response = await api.post('/api/orders', form);
      setEnviado(true);
      setForm(initialState);
      if (onSubmit) onSubmit(response.data);
    } catch (err) {
      setError("Hubo un error al enviar la solicitud. Inténtalo de nuevo más tarde.");
    }
  };

  return (
    <section className="min-h-screen py-12 px-4 md:px-0 flex justify-center items-center relative overflow-hidden">
      {/* Fondo con gradiente y elementos decorativos */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"></div>
      
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-br from-slate-200/20 to-blue-200/20 rounded-full blur-2xl"></div>
      
      {/* Contenedor principal con efecto glassmorphism */}
      <div className="relative z-10 w-full max-w-lg">
        <div className="backdrop-blur-xl bg-white/30 dark:bg-slate-800/30 rounded-2xl border border-white/20 dark:border-slate-700/20 shadow-2xl p-8">
          <form
            onSubmit={handleSubmit}
            aria-label="Formulario de solicitud de proyecto"
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light text-slate-800 dark:text-slate-200 mb-2">
                Solicita tu proyecto
              </h2>
              <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="servicio" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Servicio <span className="text-red-500">*</span>
                </label>
                <select
                  name="servicio"
                  id="servicio"
                  value={form.servicio || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl backdrop-blur-sm bg-white/50 dark:bg-slate-700/50 border border-white/30 dark:border-slate-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 text-slate-800 dark:text-slate-200"
                  required
                >
                  <option value="">Selecciona un servicio</option>
                  <option value="desarrollo-web">Desarrollo Web</option>
                  <option value="aplicaciones-a-medida">Aplicaciones a Medida</option>
                  <option value="e-commerce">E-commerce</option>
                  <option value="integraciones-y-apis">Integraciones y APIs</option>
                  <option value="soporte-y-mantenimiento">Soporte y Mantenimiento</option>
                </select>
                {errores.servicio && <span className="text-red-500 text-sm mt-1 block">{errores.servicio}</span>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="descripcion" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Descripción del proyecto <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl backdrop-blur-sm bg-white/50 dark:bg-slate-700/50 border border-white/30 dark:border-slate-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-400 text-slate-800 dark:text-slate-200 resize-none"
                  rows={4}
                  required
                ></textarea>
                {errores.descripcion && <span className="text-red-500 text-sm mt-1 block">{errores.descripcion}</span>}
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-100/50 dark:bg-red-900/20 border border-red-200/30 dark:border-red-800/30 backdrop-blur-sm">
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {enviado && (
              <div className="p-4 rounded-xl bg-green-100/50 dark:bg-green-900/20 border border-green-200/30 dark:border-green-800/30 backdrop-blur-sm">
                <p className="text-green-700 dark:text-green-400 text-sm">¡Solicitud enviada correctamente!</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium shadow-lg hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transform hover:scale-[1.01] transition-all duration-200 backdrop-blur-sm"
            >
              Enviar solicitud
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default RequestForm;

RequestForm.propTypes = {
  onSubmit: PropTypes.func,
};