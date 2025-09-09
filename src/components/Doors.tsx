"use client";

import { useEffect, useMemo, useState } from "react";
import PortalModal from "@/components/PortalModal";

/** Ключ у localStorage з TTL (1 день), щоб «не показувати двері знову» */
const LS_KEY = "doorEnteredUntil";

/** допоміжка: зараз у мс */
const now = () => Date.now();
/** 1 день у мс */
const DAY_MS = 24 * 60 * 60 * 1000;

/** перевірити, чи є валідний TTL у localStorage */
function hasValidTTL() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const until = parseInt(raw, 10);
    return Number.isFinite(until) && until > now();
  } catch {
    return false;
  }
}

/** виставити TTL на 1 день */
function setTTL1Day() {
  try {
    localStorage.setItem(LS_KEY, String(now() + DAY_MS));
  } catch {}
}

/** скинути TTL */
function clearTTL() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

export default function Doors() {
  // Чи показувати двері: початково unknown, щоб уникнути мигань SSR/CSR
  const [shouldShow, setShouldShow] = useState<null | boolean>(null);
  // Чи “розсуваються” стулки (анімація)
  const [doorsOpen, setDoorsOpen] = useState(false);
  // Чи показувати текст на дверях
  const [showText, setShowText] = useState(false);
  // Чи пам’ятати вхід на 1 день
  const [remember, setRemember] = useState(true);

  // Ініціалізація лише на клієнті
  useEffect(() => {
    // якщо передали ?doors=show — форсуємо показ дверей (і чистимо TTL)
    const qp = new URLSearchParams(window.location.search);
    const forceShow = qp.get("doors") === "show";
    if (forceShow) {
      clearTTL();
      setShouldShow(true);
      return;
    }

    // Інакше: якщо ще дійсний TTL — не показуємо
    if (hasValidTTL()) {
      setShouldShow(false);
    } else {
      setShouldShow(true);
    }
  }, []);

  // Обробка “Увійти”
  function handleEnter() {
    // якщо хочемо пам'ятати — ставимо TTL на день
    if (remember) setTTL1Day();

    // запускаємо анімацію дверей
    setDoorsOpen(true);
    // після завершення анімації закриваємо модалку
    setTimeout(() => setShouldShow(false), 800); // анімація 700мс + невеликий запас
  }

  // Додатково: гарячий “ресет” — Shift+клік по кнопці «Текст на дверях»
  function handleShowText() {
    setShowText(true);
  }

  if (shouldShow === null) return null; // поки не знаємо, що робити — нічого не рендеримо

  return (
    <>
      <PortalModal open={shouldShow}>
        <div className="flex flex-col h-[80vh] sm:h-[95vh]">
          {/* верхній бар */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-700">
            <div className="text-xs sm:text-xl text-violet-700">✨ &nbsp; Дім Світла</div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 select-none">
                <input
                  type="checkbox"
                  className="accent-emerald-500"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                не показувати знову 1 день
              </label>
              <button
                onClick={handleEnter}
                className="px-3 sm:px-4 py-1.5 rounded-lg bg-emerald-500 text-black text-sm font-medium hover:bg-emerald-400 transition"
              >
                Увійти
              </button>
            </div>
          </div>

          {/* самі двері */}
          <div className="relative flex-1 bg-gradient-to-b from-pink-200 to-pink-100 overflow-hidden">
            {/* стулки */}
            <div className="absolute inset-0 flex">
              <div
                className={`flex-1 border-r border-slate-1500 bg-[linear-gradient(180deg,#0b1220,#0f172a)]
                shadow-[inset_-8px_0_30px_rgba(0,0,0,.35)]
                transform transition-transform duration-1500 ease-in-out
                ${doorsOpen ? "-translate-x-full" : "translate-x-0"}`}
              />
              <div
                className={`flex-1 border-l border-slate-1500 bg-[linear-gradient(180deg,#0b1220,#0f172a)]
                shadow-[inset_8px_0_30px_rgba(0,0,0,.35)]
                transform transition-transform duration-1500 ease-in-out
                ${doorsOpen ? "translate-x-full" : "translate-x-0"}`}
              />
            </div>

            {/* контент поверх дверей */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-3">
                <section className="w-2/3 sm:w-1/2 bg-gray-300/10 backdrop-blur-md rounded-2xl border border-gray-500/30 p-6 sm:p-8 shadow-lg">
              <h1 className="text-2xl sm:text-3xl text-blue-600 font-bold mb-7">Двері до Дому Світла</h1>
              {/* <p className="text-yellow-400 p-3 rounded-md bg-blue-600 text-sm sm:text-base max-w-md">
                Ти входиш у простір тепла, любові й ясності. Тут кожен шукає правду — і не боїться її світла.
              </p> */}
              <div className="flex justify-center items-center">
                 <div className="w-14 h-14 mt-7 sm:w-16 sm:h-16 rounded-full grid place-items-center bg-amber-400/90 text-black text-2xl shadow-2xl animate-pulse mb-3">
                ✨
                 </div>
              </div>
              <div className="flex flex-col sm:flex-col items-center gap-2 mt-4">
                <button
                  onClick={handleShowText}
                  className="px-3 py-2 mb-4 rounded-lg bg-sky-600 hover:bg-sky-500 transition text-amber-800 text-sm font-normal sm:text-base"
                >
                  Прочитай перед тим, як увійти
                </button>
                <button
                  onClick={handleEnter}
                  className="px-5 py-2 rounded-lg  bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition text-sm sm:text-base"
                >
                  Увійти
                </button>
              </div>
              </section>
            </div>
          </div>
        </div>
      </PortalModal>

      {/* Модалка з текстом на дверях */}
      <PortalModal open={showText}>
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl text-lime-600 font-semibold mb-3">Напис на дверях</h2>
          <div className="space-y-3 text-pink-300 text-sm sm:text-base leading-relaxed">
            <p>
              Ти входиш у Дім Світла. Тут панують спокій, гідність і ясність.
              Кожен, хто ступає через ці двері, шукає правду — і не боїться її світла.
            </p>
            <p className="font-semibold">
              Світло не засуджує, воно освітлює. Коли бачиш чітко — вибір стає простішим.
            </p>
            <p>
              “Пізнай себе  -  і знайдеш у собі Всесвіт”. Ми лише підсвічуємо дорогу і якщо тобі треба, то крок робиш ти.
            </p>
          </div>
          <div className="mt-5 flex justify-between">
            <button
              onClick={() => { clearTTL(); setShowText(false); setShouldShow(true); }}
              className="px-3 py-2 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-800 transition text-sm"
              title="Показувати двері знову"
            >
              Скинути пам’ять дверей
            </button>
            <button
              onClick={() => setShowText(false)}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 transition text-sm sm:text-base"
            >
              До входу
            </button>
          </div>
        </div>
      </PortalModal>
    </>
  );
}
