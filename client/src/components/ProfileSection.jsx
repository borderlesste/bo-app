import { useState, useEffect } from 'react';
import { getClientProfile, updateClientProfile, changeClientPassword } from '../api/axios';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from '../hooks/useToast';
import { validateProfileForm, validatePasswordChangeForm, sanitizeInput } from '../utils/validators';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Calendar,
  Edit,
  Key,
  Save,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

const ProfileSection = () => {
  const { success, error: showError } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre: '',
    telefono: '',
    empresa: '',
    direccion: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Cargar perfil
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getClientProfile();
      
      if (response.data.success) {
        setProfile(response.data.data);
        setEditForm({
          nombre: response.data.data.nombre || '',
          telefono: response.data.data.telefono || '',
          empresa: response.data.data.empresa || '',
          direccion: response.data.data.direccion || ''
        });
      } else {
        setError('Error al cargar perfil');
      }
    } catch (err) {
      setError('Error al cargar perfil');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Manejar edición
  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditForm({
      nombre: profile.nombre || '',
      telefono: profile.telefono || '',
      empresa: profile.empresa || '',
      direccion: profile.direccion || ''
    });
  };

  const handleSaveProfile = async () => {
    try {
      setSaveLoading(true);
      
      // Sanitizar y validar datos
      const sanitizedForm = {
        nombre: sanitizeInput(editForm.nombre),
        telefono: sanitizeInput(editForm.telefono),
        empresa: sanitizeInput(editForm.empresa),
        direccion: sanitizeInput(editForm.direccion)
      };
      
      const validation = validateProfileForm(sanitizedForm);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        showError(firstError);
        return;
      }
      
      const response = await updateClientProfile(sanitizedForm);
      
      if (response.data.success) {
        setProfile(response.data.data);
        setEditForm(sanitizedForm);
        setEditing(false);
        success('Perfil actualizado exitosamente');
      } else {
        showError(response.data.message || 'Error al actualizar perfil');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar perfil';
      showError(errorMessage);
      console.error('Error updating profile:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  // Manejar cambio de contraseña
  const handlePasswordChange = async () => {
    try {
      setPasswordLoading(true);
      
      // Validar formulario
      const validation = validatePasswordChangeForm(passwordForm);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        showError(firstError);
        return;
      }

      const response = await changeClientPassword(passwordForm);
      
      if (response.data.success) {
        success('Contraseña actualizada exitosamente');
        setShowPasswordModal(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showError(response.data.message || 'Error al cambiar contraseña');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al cambiar contraseña';
      showError(errorMessage);
      console.error('Error changing password:', err);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toggle visibility de contraseñas
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
        <span className="ml-2">Cargando perfil...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-500 mb-4">
          <X className="w-12 h-12 mx-auto mb-2" />
          <p>{error}</p>
        </div>
        <Button onClick={fetchProfile} variant="outline">
          Reintentar
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h2>
          <p className="text-gray-600 dark:text-gray-300">Gestiona tu información personal</p>
        </div>
        <div className="flex space-x-2">
          {!editing ? (
            <>
              <Button onClick={handleEdit} variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Key className="w-4 h-4 mr-2" />
                    Cambiar Contraseña
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cambiar Contraseña</DialogTitle>
                  </DialogHeader>
                  <PasswordChangeModal
                    passwordForm={passwordForm}
                    setPasswordForm={setPasswordForm}
                    showPasswords={showPasswords}
                    togglePasswordVisibility={togglePasswordVisibility}
                    handlePasswordChange={handlePasswordChange}
                    passwordLoading={passwordLoading}
                    onClose={() => setShowPasswordModal(false)}
                  />
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <>
              <Button onClick={handleCancelEdit} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSaveProfile} disabled={saveLoading}>
                <Save className="w-4 h-4 mr-2" />
                {saveLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Información del perfil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información personal */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center mb-6">
            <User className="w-6 h-6 mr-3 text-blue-500" />
            <h3 className="text-lg font-semibold">Información Personal</h3>
          </div>

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <Label htmlFor="nombre">Nombre completo</Label>
              {editing ? (
                <Input
                  id="nombre"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  placeholder="Ingresa tu nombre completo"
                />
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{profile?.nombre || 'No especificado'}</span>
                </div>
              )}
            </div>

            {/* Email (no editable) */}
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="flex items-center p-3 bg-gray-100 rounded-lg">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-600">{profile?.email}</span>
                <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">No editable</span>
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              {editing ? (
                <Input
                  id="telefono"
                  value={editForm.telefono}
                  onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                  placeholder="Ingresa tu teléfono"
                />
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{profile?.telefono || 'No especificado'}</span>
                </div>
              )}
            </div>

            {/* Empresa */}
            <div>
              <Label htmlFor="empresa">Empresa</Label>
              {editing ? (
                <Input
                  id="empresa"
                  value={editForm.empresa}
                  onChange={(e) => setEditForm({ ...editForm, empresa: e.target.value })}
                  placeholder="Ingresa tu empresa"
                />
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Building className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{profile?.empresa || 'No especificado'}</span>
                </div>
              )}
            </div>

            {/* Dirección */}
            <div>
              <Label htmlFor="direccion">Dirección</Label>
              {editing ? (
                <Textarea
                  id="direccion"
                  value={editForm.direccion}
                  onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                  placeholder="Ingresa tu dirección"
                  rows={3}
                />
              ) : (
                <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 mr-2 mt-1 text-gray-400" />
                  <span>{profile?.direccion || 'No especificado'}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Información de cuenta */}
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <Calendar className="w-6 h-6 mr-3 text-green-500" />
            <h3 className="text-lg font-semibold">Información de Cuenta</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">ID de Cliente</Label>
              <div className="mt-1 text-lg font-mono text-blue-600">#{profile?.id}</div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium text-gray-600">Fecha de Registro</Label>
              <div className="mt-1 text-sm">
                {formatDate(profile?.fechaRegistro)}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Última Actualización</Label>
              <div className="mt-1 text-sm">
                {formatDate(profile?.ultimaActualizacion)}
              </div>
            </div>

            <Separator />

            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">Estado de la Cuenta</div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Activa
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Modal para cambio de contraseña
const PasswordChangeModal = ({
  passwordForm,
  setPasswordForm,
  showPasswords,
  togglePasswordVisibility,
  handlePasswordChange,
  passwordLoading,
  onClose
}) => {
  return (
    <div className="space-y-4">
      {/* Contraseña actual */}
      <div>
        <Label htmlFor="currentPassword">Contraseña actual</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showPasswords.current ? 'text' : 'password'}
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            placeholder="Ingresa tu contraseña actual"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('current')}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Nueva contraseña */}
      <div>
        <Label htmlFor="newPassword">Nueva contraseña</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPasswords.new ? 'text' : 'password'}
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            placeholder="Ingresa tu nueva contraseña"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('new')}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
      </div>

      {/* Confirmar contraseña */}
      <div>
        <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            placeholder="Confirma tu nueva contraseña"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('confirm')}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button onClick={onClose} variant="outline">
          Cancelar
        </Button>
        <Button onClick={handlePasswordChange} disabled={passwordLoading}>
          {passwordLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
        </Button>
      </div>
    </div>
  );
};

export default ProfileSection;