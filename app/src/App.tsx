import { Toaster } from 'sonner';
import { Hero } from '@/sections/Hero';
import { RegistrationForm } from '@/sections/RegistrationForm';
import { Footer } from '@/sections/Footer';
import { useRegistration } from '@/hooks/useRegistration';
import './App.css';

function App() {
  const {
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
  } = useRegistration();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toaster 
        position="top-center" 
        richColors 
        closeButton
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          },
        }}
      />
      
      <main className="flex-1">
        <Hero 
          currentCount={currentCount} 
          maxParticipants={maxParticipants} 
        />
        
        <RegistrationForm
          formState={formState}
          currentCount={currentCount}
          maxParticipants={maxParticipants}
          errors={errors}
          pendingEmail={pendingEmail}
          onSubmit={submitRegistration}
          onVerify={verifyCode}
          onResendCode={resendCode}
          onReset={resetForm}
          setErrors={setErrors}
        />
      </main>

      <Footer />
    </div>
  );
}

export default App;
