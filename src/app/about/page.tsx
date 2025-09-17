
import React, {JSX} from "react";

export const metadata = {
  title: "Про нас — Дім Світла",
  description: "Розгорнуте послання про єдність релігій, мир і духовний розвиток.",
};

export default function AboutPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-zinc-900 text-white antialiased">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold">Про нас</h1>

        {/* Ukrainian */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Послання українською</h2>
          <p>
            Існує поняття — єдність релігій. Настав час усім пророкам і синам
            Божим, яких нам посилав Господь, зібратися разом під одним дахом.
          </p>
          <p>
            Всевишній для всіх один, і всі перед Ним рівні без винятку —
            незалежно від кольору шкіри чи походження. Чому ж, попри
            досягнення у XXI столітті, людство досі воює, а інколи навіть
            виправдовує насильство вірою?
          </p>
          <p>
            Ми віримо: настав час завершити ці руйнівні гонки і відмежувати
            деструктивні впливи, що сіють хаос. Ми не прагнемо осуду — ми
            пропонуємо зцілення, відновлення і простір для любові.
          </p>
          <p>
            Дім Світла — це простір миру, духовного зростання і єдності. Ми
            думаємо про майбутнє дітей і планети. Ми запрошуємо всіх світлих і
            небайдужих приєднатись, щоб разом творити нову історію.
          </p>
        </section>

        {/* English */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Message in English</h2>
          <p>
            There is a profound truth — the unity of religions. The time has
            come for all prophets and sons of God, sent to us by the Creator, to
            be gathered under one roof.
          </p>
          <p>
            The Almighty is One for all, and all are equal before Him —
            regardless of skin color or origin. Yet, despite the progress of the
            21st century, humanity still wages wars, sometimes even under the
            banner of faith.
          </p>
          <p>
            We believe it is time to end these destructive pursuits and to
            overcome the forces that spread chaos. We do not seek judgment — we
            seek healing, renewal, and a space for love.
          </p>
          <p>
            The House of Light is a space of peace, spiritual growth, and unity.
            We care for the future of our children and our planet. We invite all
            bright and compassionate souls to join us in creating a new story
            together.
          </p>
        </section>

        <footer className="pt-10 text-center text-zinc-400 text-sm">
           <p>
             Ми команда творців, які об’єдналися для створення нового бачення світу.
             Тут кожен є Світлом, яке розширює горизонти. 🌌
           </p>
          З любов’ю ♥️☀️ — Команда Космо-Котяр
        </footer>
      </div>
    </main>
  );
}

                