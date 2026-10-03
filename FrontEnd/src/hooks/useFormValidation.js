import { useState, useCallback } from 'react';

export function useFormValidation({
  initialValues = {},
  schema = null,
  onSubmit = null
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleChange = useCallback((fieldName, val) => {
    setValues((prev) => ({ ...prev, [fieldName]: val }));
    // Clear field-level error when user starts correcting
    setErrors((prev) => {
      if (prev[fieldName]) {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      }
      return prev;
    });
  }, []);

  const handleBlur = useCallback((fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    if (schema) {
      const result = schema(values);
      if (result.errors && result.errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: result.errors[fieldName] }));
      }
    }
  }, [schema, values]);

  const mapServerErrors = useCallback((errResponse) => {
    if (!errResponse) return;
    const data = errResponse.response?.data || errResponse;
    
    // Express-validator or Joi error array
    if (Array.isArray(data.errors)) {
      const fieldErrs = {};
      data.errors.forEach((e) => {
        if (e.field || e.param || e.path) {
          const k = e.field || e.param || e.path;
          fieldErrs[k] = e.message || e.msg;
        }
      });
      if (Object.keys(fieldErrs).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrs }));
      }
    }

    const msg = data.message || data.error || 'Operation failed due to server error.';
    setServerError(msg);
  }, []);

  const focusFirstError = useCallback((fieldErrors) => {
    const errorKeys = Object.keys(fieldErrors);
    if (errorKeys.length > 0) {
      const firstField = errorKeys[0];
      const elem = document.getElementsByName(firstField)[0] || document.getElementById(firstField);
      if (elem && typeof elem.focus === 'function') {
        elem.focus();
      }
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (submitting) return;

    setServerError(null);

    let currentSanitized = values;
    if (schema) {
      const result = schema(values);
      if (!result.isValid) {
        setErrors(result.errors || {});
        focusFirstError(result.errors || {});
        return;
      }
      currentSanitized = result.sanitized || values;
    }

    try {
      setSubmitting(true);
      if (onSubmit) {
        await onSubmit(currentSanitized);
      }
    } catch (err) {
      mapServerErrors(err);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, schema, values, onSubmit, focusFirstError, mapServerErrors]);

  const resetForm = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setSubmitting(false);
    setServerError(null);
  }, [initialValues]);

  return {
    values,
    setValues,
    errors,
    setErrors,
    touched,
    submitting,
    serverError,
    setServerError,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    mapServerErrors
  };
}
