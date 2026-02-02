import { Mail, Phone, Building2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full py-12 px-4 border-t border-border mt-auto">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
          {/* Additional Info */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4">
              Дополнительная информация
            </h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Вход свободный по предварительной регистрации</li>
              <li>• Количество мест ограничено</li>
              <li>• После регистрации вы получите подтверждение на email</li>
              <li></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 Издательство «Юридическая литература». Все права защищены.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Презентация сборника «Потребительское банкротство в России: к 10-летию закона»
          </p>
        </div>
      </div>
    </footer>
  );
}
