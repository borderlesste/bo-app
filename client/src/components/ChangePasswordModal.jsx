import { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { changePassword } from '../api/axios';
import PropTypes from 'prop-types';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }

    try {
      const res = await changePassword({ oldPassword: formData.oldPassword, newPassword: formData.newPassword });
      setSuccess(res.data.message);
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(onClose, 2000); // Close modal after 2 seconds
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error al cambiar la contraseña.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md m-4">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Cambiar Contraseña</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Cerrar modal">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md"><p>{error}</p></div>}
            {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md"><p>{success}</p></div>}

            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input type="password" name="oldPassword" value={formData.oldPassword} onChange={handleChange} placeholder="Contraseña Actual" required className="w-full pl-10 pr-4 py-2 border rounded-lg" />
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} placeholder="Nueva Contraseña" required className="w-full pl-10 pr-4 py-2 border rounded-lg" />
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirmar Nueva Contraseña" required className="w-full pl-10 pr-4 py-2 border rounded-lg" />
            </div>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-slate-900/50 border-t flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded-lg">
              Cambiar Contraseña
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;

ChangePasswordModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
