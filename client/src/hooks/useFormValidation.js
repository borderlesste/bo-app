import { useState, useCallback, useEffect } from 'react';
import { debounce } from '../utils/validators';

const useFormValidation = (initialValues = {}, validationSchema = {}, options = {}) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceTime = 300,
    enableReinitialize = false
  } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reinitialize form when initialValues change
  useEffect(() => {
    if (enableReinitialize) {
      setValues(initialValues);
      setErrors({});
      setTouched({});
    }
  }, [initialValues, enableReinitialize]);

  // Validate a single field
  const validateField = useCallback(async (name, value, allValues = values) => {
    if (!validationSchema[name]) return null;

    const rules = validationSchema[name];
    
    for (const rule of rules) {
      try {
        const result = await rule(value, allValues);
        if (result !== true) {
          return result;
        }
      } catch (error) {
        return error.message || 'Error de validación';
      }
    }
    
    return null;
  }, [validationSchema, values]);

  // Validate all fields
  const validateForm = useCallback(async (valuesToValidate = values) => {
    setIsValidating(true);
    const newErrors = {};

    for (const [fieldName, fieldRules] of Object.entries(validationSchema)) {
      if (fieldRules && fieldRules.length > 0) {
        const error = await validateField(fieldName, valuesToValidate[fieldName], valuesToValidate);
        if (error) {
          newErrors[fieldName] = error;
        }
      }
    }

    setIsValidating(false);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validationSchema, values, validateField]);

  // Debounced validation for onChange
  const debouncedValidateField = useCallback(
    debounce(async (name, value, allValues) => {
      const error = await validateField(name, value, allValues);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }, debounceTime),
    [validateField, debounceTime]
  );

  // Handle field value change
  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setValues(prev => {
      const newValues = { ...prev, [name]: fieldValue };

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [name]: null
        }));
      }

      // Validate on change if enabled
      if (validateOnChange && validationSchema[name]) {
        debouncedValidateField(name, fieldValue, newValues);
      }

      return newValues;
    });
  }, [errors, validateOnChange, validationSchema, debouncedValidateField]);

  // Handle field blur
  const handleBlur = useCallback(async (event) => {
    const { name } = event.target;
    
    setTouched(prev => ({ ...prev, [name]: true }));

    if (validateOnBlur && validationSchema[name]) {
      const error = await validateField(name, values[name], values);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [validateOnBlur, validationSchema, validateField, values]);

  // Handle form submission
  const handleSubmit = useCallback(async (onSubmit) => {
    return async (event) => {
      if (event) {
        event.preventDefault();
      }

      // Mark all fields as touched
      const allFieldNames = Object.keys(validationSchema);
      setTouched(allFieldNames.reduce((acc, name) => ({ ...acc, [name]: true }), {}));

      // Validate entire form
      const isValid = await validateForm(values);

      if (isValid) {
        setIsSubmitting(true);
        try {
          await onSubmit(values, { setFieldError: setFieldError });
        } catch (error) {
          console.error('Form submission error:', error);
        } finally {
          setIsSubmitting(false);
        }
      }
    };
  }, [validationSchema, validateForm, values]);

  // Set field error manually
  const setFieldError = useCallback((fieldName, errorMessage) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: errorMessage
    }));
  }, []);

  // Set field value manually
  const setFieldValue = useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error if exists
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  }, [errors]);

  // Reset form
  const resetForm = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Get field props for easy integration
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    onChange: handleChange,
    onBlur: handleBlur,
    error: touched[name] ? errors[name] : null,
    hasError: touched[name] && !!errors[name]
  }), [values, handleChange, handleBlur, touched, errors]);

  // Check if form is valid
  const isValid = Object.keys(errors).every(key => !errors[key]);
  const hasErrors = Object.keys(errors).some(key => errors[key]);

  return {
    values,
    errors,
    touched,
    isValidating,
    isSubmitting,
    isValid,
    hasErrors,
    handleChange,
    handleBlur,
    handleSubmit,
    validateForm,
    validateField,
    setFieldError,
    setFieldValue,
    resetForm,
    getFieldProps
  };
};

export default useFormValidation;