import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { uploadProjectImage } from '../api/axios';

const ImageUpload = ({ 
  onImageUploaded, 
  currentImage = null, 
  placeholder = "Seleccionar imagen",
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB
  className = ""
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImage);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validaciones
    if (file.size > maxSize) {
      setError(`El archivo es demasiado grande. Máximo ${Math.round(maxSize / 1024 / 1024)}MB permitido.`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Crear preview local
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);

      // Subir archivo al servidor
      const formData = new FormData();
      formData.append('image', file);

      const response = await uploadProjectImage(formData);
      
      if (response.data.success) {
        const imageUrl = response.data.data.url;
        setPreviewUrl(imageUrl);
        onImageUploaded?.(imageUrl);
      } else {
        throw new Error(response.data.message || 'Error al subir imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error.response?.data?.message || 'Error al subir la imagen');
      setPreviewUrl(currentImage); // Restaurar imagen anterior
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setError('');
    onImageUploaded?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {/* Preview area or upload button */}
      <div className="relative">
        {previewUrl ? (
          // Image preview
          <div className="relative group">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
            />
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleFileSelect}
                  disabled={uploading}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Upload className="w-4 h-4 inline mr-1" />
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={uploading}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  Eliminar
                </button>
              </div>
            </div>

            {/* Loading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-75 rounded-lg flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="mt-2 text-sm text-gray-600 dark:text-gray-300">Subiendo...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Upload button
          <button
            type="button"
            onClick={handleFileSelect}
            disabled={uploading}
            className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="mt-2 text-sm">Subiendo...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ImageIcon className="w-12 h-12 mb-2" />
                <span className="text-sm font-medium">{placeholder}</span>
                <span className="text-xs text-gray-400 mt-1">
                  PNG, JPG, GIF, WebP hasta {formatFileSize(maxSize)}
                </span>
              </div>
            )}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg flex items-center text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Upload instructions */}
      {!previewUrl && !error && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Haz clic para seleccionar una imagen o arrastra y suelta aquí
        </p>
      )}
    </div>
  );
};

ImageUpload.propTypes = {
  onImageUploaded: PropTypes.func,
  currentImage: PropTypes.string,
  placeholder: PropTypes.string,
  accept: PropTypes.string,
  maxSize: PropTypes.number,
  className: PropTypes.string
};

export default ImageUpload;