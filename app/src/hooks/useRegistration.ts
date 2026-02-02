import { useState, useEffect, useCallback } from 'react';
import type { RegistrationData, FormState, ValidationErrors } from '@/types/registration';

// API URL - измените на свой домен в продакшене
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate name (only letters, spaces, hyphens)
const isValidName = (name: string): boolean => {
  const nameRegex = /^[\p{L}\s-]+$/u;
  return nameRegex.test(name) && name.length >= 2 && name.length <= 50;
};

export function useRegistration() {
  const [formState, setFormState] = useState<FormState>('initial');
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [maxParticipants, setMaxParticipants] = useState<number>(100);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [formStartTime, setFormStartTime] = useState<number>(Date.now());

  // Load current count from API on mount
  useEffect(() => {
    fetchAvailability();
  }, []);

  // Fetch availability from API
  const fetchAvailability = async () => {
    try {
      const response = await fetch(`${API_URL}/api/availability`);
      if (response.ok) {
        const data = await response.json();
        setCurrentCount(data.currentCount);
        setMaxParticipants(data.maxParticipants);
        if (!data.available) {
          setFormState('closed');
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки доступности:', error);
    }
  };

  // Validate form data
  const validateForm = (data: RegistrationData): boolean => {
    const newErrors: ValidationErrors = {};

    if (!data.firstName.trim()) {
      newErrors.firstName = 'Введите имя';
    } else if (!isValidName(data.firstName)) {
      newErrors.firstName = 'Имя должно содержать только буквы (2-50 символов)';
    }

    if (!data.lastName.trim()) {
      newErrors.lastName = 'Введите фамилию';
    } else if (!isValidName(data.lastName)) {
      newErrors.lastName = 'Фамилия должна содержать только буквы (2-50 символов)';
    }

    if (!data.email.trim()) {
      newErrors.email = 'Введите email';
    } else if (!isValidEmail(data.email)) {
      newErrors.email = 'Введите корректный email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit registration (send verification code)
  const submitRegistration = async (data: RegistrationData): Promise<boolean> => {
    // Check if registration is closed
    if (currentCount >= maxParticipants) {
      setFormState('closed');
      return false;
    }

    // Validate form
    if (!validateForm(data)) {
      return false;
    }

    setFormState('submitting');

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          honeypot: data.honeypot,
          formStartTime: data.formStartTime || formStartTime,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors({ email: result.error || 'Ошибка регистрации' });
        setFormState('initial');
        return false;
      }

      setPendingEmail(data.email);
      setFormState('codeSent');
      return true;
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      setErrors({ email: 'Ошибка соединения с сервером' });
      setFormState('initial');
      return false;
    }
  };

  // Verify code
  const verifyCode = async (code: string): Promise<boolean> => {
    setFormState('verifying');

    try {
      const response = await fetch(`${API_URL}/api/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: pendingEmail,
          code: code,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors({ code: result.error || 'Ошибка верификации' });
        setFormState('codeSent');
        return false;
      }

      // Update count after successful verification
      await fetchAvailability();
      setFormState('success');
      return true;
    } catch (error) {
      console.error('Ошибка при верификации:', error);
      setErrors({ code: 'Ошибка соединения с сервером' });
      setFormState('codeSent');
      return false;
    }
  };

  // Resend code
  const resendCode = async (): Promise<boolean> => {
    try {
      // Повторная отправка кода - просто вызываем регистрацию снова
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: '',
          lastName: '',
          email: pendingEmail,
          honeypot: '',
          formStartTime: Date.now(),
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Ошибка при повторной отправке кода:', error);
      return false;
    }
  };

  // Reset form
  const resetForm = () => {
    setFormState(currentCount >= maxParticipants ? 'closed' : 'initial');
    setErrors({});
    setPendingEmail('');
    setFormStartTime(Date.now());
    fetchAvailability();
  };

  return {
    formState,
    currentCount,
    maxParticipants,
    errors,
    pendingEmail,
    submitRegistration,
    verifyCode,
    resendCode,
    resetForm,
    setErrors,
  };
}
