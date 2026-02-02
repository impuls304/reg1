export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  honeypot?: string;
  formStartTime?: number;
}

export interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  verificationCode: string;
  isVerified: boolean;
  registeredAt: string;
}

export type FormState = 
  | 'initial' 
  | 'submitting' 
  | 'codeSent' 
  | 'verifying' 
  | 'success' 
  | 'closed';

export interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  code?: string;
}
