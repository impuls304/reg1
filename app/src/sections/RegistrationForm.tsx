import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Send, Shield } from 'lucide-react';
import type { RegistrationData, FormState, ValidationErrors } from '@/types/registration';
import { toast } from 'sonner';

interface RegistrationFormProps {
  formState: FormState;
  currentCount: number;
  maxParticipants: number;
  errors: ValidationErrors;
  pendingEmail: string;
  onSubmit: (data: RegistrationData) => Promise<boolean>;
  onVerify: (code: string) => Promise<boolean>;
  onResendCode: () => Promise<boolean>;
  onReset: () => void;
  setErrors: (errors: ValidationErrors) => void;
}

export function RegistrationForm({
  formState,
  currentCount,
  maxParticipants,
  errors,
  pendingEmail,
  onSubmit,
  onVerify,
  onResendCode,
  onReset,
  setErrors,
}: RegistrationFormProps) {
  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    honeypot: '',
    formStartTime: Date.now(),
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const isFull = currentCount >= maxParticipants;

  if (isFull || formState === 'closed') {
    return (
      <section className="w-full py-8 px-4">
        <div className="max-w-xl mx-auto">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Регистрация закрыта
              </h3>
              <p className="text-muted-foreground mb-6">
                К сожалению, все {maxParticipants} мест уже заняты. 
                Следите за нашими новостями для информации о будущих мероприятиях.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Обновить страницу
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update form start time if not set
    const data = {
      ...formData,
      formStartTime: formData.formStartTime || Date.now(),
    };

    const success = await onSubmit(data);
    if (success) {
      toast.success('Код подтверждения отправлен на ваш email');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setErrors({ code: 'Введите код подтверждения' });
      return;
    }

    const success = await onVerify(verificationCode);
    if (success) {
      toast.success('Регистрация успешно завершена!');
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    await onResendCode();
    toast.success('Новый код отправлен на ваш email');
    setIsResending(false);
  };

  // Success state
  if (formState === 'success') {
    return (
      <section className="w-full py-8 px-4">
        <div className="max-w-xl mx-auto">
          <Card className="border-primary/50 bg-primary/5 animate-fade-in">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 animate-pulse-gold">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Регистрация подтверждена!
              </h3>
              <p className="text-muted-foreground mb-6">
                Вы успешно зарегистрированы на презентацию сборника. 
                Подтверждение отправлено на email {pendingEmail}.
              </p>
              <div className="p-4 rounded-lg bg-card border border-border mb-6 text-left">
                <p className="text-sm text-muted-foreground mb-2">Детали мероприятия:</p>
                <p className="font-medium text-foreground">13 февраля 2026, 18:30</p>
                <p className="text-sm text-muted-foreground">Москва, ул. Воздвиженка, д. 9</p>
              </div>
              <Button onClick={onReset} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Зарегистрировать ещё одного участника
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // Code verification state
  if (formState === 'codeSent' || formState === 'verifying') {
    return (
      <section className="w-full py-8 px-4">
        <div className="max-w-xl mx-auto">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Подтверждение email
              </CardTitle>
              <CardDescription>
                Мы отправили 6-значный код подтверждения на {pendingEmail}.
                Код действителен 15 минут.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Код подтверждения</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerificationCode(value);
                      if (errors.code) setErrors({});
                    }}
                    className={`text-center text-2xl tracking-widest font-mono ${
                      errors.code ? 'border-destructive' : ''
                    }`}
                    autoFocus
                  />
                  {errors.code && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.code}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full gap-2"
                  disabled={formState === 'verifying' || verificationCode.length !== 6}
                >
                  {formState === 'verifying' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Проверка...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Подтвердить регистрацию
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                  >
                    {isResending ? 'Отправка...' : 'Отправить код повторно'}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // Initial registration form
  return (
    <section className="w-full py-8 px-4">
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Регистрация на мероприятие</CardTitle>
            <CardDescription>
              Заполните форму ниже для регистрации. После отправки вам придёт код подтверждения на email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot field - hidden from real users */}
              <div className="honeypot">
                <input
                  ref={honeypotRef}
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.honeypot}
                  onChange={(e) => handleInputChange('honeypot', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Иван"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={errors.firstName ? 'border-destructive' : ''}
                    disabled={formState === 'submitting'}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Иванов"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={errors.lastName ? 'border-destructive' : ''}
                    disabled={formState === 'submitting'}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ivan@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                  disabled={formState === 'submitting'}
                />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full gap-2"
                  disabled={formState === 'submitting'}
                >
                  {formState === 'submitting' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Получить код подтверждения
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
