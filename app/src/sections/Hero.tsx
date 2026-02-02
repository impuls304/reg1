import { Calendar, MapPin, Clock, Users } from 'lucide-react';

interface HeroProps {
  currentCount: number;
  maxParticipants: number;
}

export function Hero({ currentCount, maxParticipants }: HeroProps) {
  const isFull = currentCount >= maxParticipants;
  const progressPercent = Math.min((currentCount / maxParticipants) * 100, 100);

  return (
    <section className="w-full py-12 md:py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Event Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              Юридическое мероприятие
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-bold text-center mb-6 leading-tight">
          <span className="text-gold-gradient">
            Презентация сборника
          </span>
          <br />
          <span className="text-foreground mt-2 block text-2xl md:text-4xl">
            «Потребительское банкротство в России:
            <br />
            к 10-летию закона»
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-center text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Приглашаем принять участие в презентации уникального сборника, 
          посвящённого десятилетию закона о потребительском банкротстве
        </p>

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Дата</p>
              <p className="font-semibold text-foreground">13 февраля 2026 года</p>
              <p className="text-sm text-muted-foreground">Четверг</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Время</p>
              <p className="font-semibold text-foreground">18:30</p>
              <p className="text-sm text-muted-foreground">Сбор гостей с 18:00</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors md:col-span-2">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Место проведения</p>
              <p className="font-semibold text-foreground">Москва, ул. Воздвиженка, д. 9</p>
              <p className="text-sm text-muted-foreground">
                Конференц-зал «Аудиториум», зал «Библиотека»
              </p>
            </div>
          </div>
        </div>

        {/* Participants Counter */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Количество участников</p>
                <p className="text-sm text-muted-foreground">
                  {isFull 
                    ? 'Регистрация завершена' 
                    : `Осталось ${maxParticipants - currentCount} ${getSeatsWord(maxParticipants - currentCount)}`
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-bold ${isFull ? 'text-destructive' : 'text-primary'}`}>
                {currentCount}
              </span>
              <span className="text-muted-foreground"> / {maxParticipants}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isFull 
                  ? 'bg-destructive' 
                  : 'bg-gradient-to-r from-primary/80 to-primary'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {isFull && (
            <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
              <p className="text-destructive font-medium">
                К сожалению, все места заняты. Регистрация закрыта.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function getSeatsWord(count: number): string {
  if (count === 1) return 'место';
  if (count >= 2 && count <= 4) return 'места';
  return 'мест';
}
