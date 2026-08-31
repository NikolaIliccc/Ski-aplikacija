"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const [instructors, setInstructors] = useState([]);
  const [instructorStart, setInstructorStart] = useState(0);
  const instructorsPerPage = 4;

  useEffect(() => {
    const getPublicInstructors = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/instructors/public");
        setInstructors(res.data);
      } catch (err) {
        console.log(err.response?.data || err);
      }
    };

    getPublicInstructors();
  }, []);

  const instructorRole = (instructor) => {
    if (instructor.ski_license && instructor.snowboard_license) {
      return "Ski & Snowboard instruktor";
    }

    if (instructor.ski_license) {
      return "Ski instruktor";
    }

    return "Snowboard instruktor";
  };

  const levelLabel = (value) => {
    if (value === "beginner") return "Nivo 1";
    if (value === "intermediate") return "Nivo 2";
    if (value === "advanced") return "Nivo 3";
    return value;
  };

  const visibleInstructors = instructors.slice(
    instructorStart,
    instructorStart + instructorsPerPage
  );

  const nextInstructors = () => {
    if (
      instructorStart + instructorsPerPage >=
      instructors.length
    ) {
      setInstructorStart(0);
    } else {
      setInstructorStart(
        instructorStart + instructorsPerPage
      );
    }
  };

  const previousInstructors = () => {
    if (instructorStart === 0) {
      const lastPageStart =
        Math.floor(
          (instructors.length - 1) /
          instructorsPerPage
        ) * instructorsPerPage;

      setInstructorStart(lastPageStart);
    } else {
      setInstructorStart(
        Math.max(
          0,
          instructorStart - instructorsPerPage
        )
      );
    }
  };

  const goToBooking = () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return;
    }

    window.location.href = "/booking";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 text-slate-900">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
              ⛷
            </div>

            <h1 className="text-xl sm:text-2xl font-bold">
              Ski School
            </h1>
          </a>

          <div className="hidden lg:flex gap-8 text-slate-700 font-semibold">
            <a href="/" className="hover:text-blue-600">Početna</a>
            <a href="#casovi" className="hover:text-blue-600">Časovi</a>
            <a href="#instruktori" className="hover:text-blue-600">Instruktori</a>
            <a href="#faq" className="hover:text-blue-600">FAQ</a>
            <a href="/login" className="hover:text-blue-600">Login</a>
          </div>

          <button
            onClick={goToBooking}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 rounded-2xl font-bold shadow text-sm sm:text-base"
          >
            Zakaži
          </button>
        </div>

        <div className="lg:hidden mt-4 flex gap-2 overflow-x-auto pb-2 text-sm font-semibold">
          <a href="#casovi" className="bg-white px-4 py-2 rounded-xl shadow whitespace-nowrap">
            Časovi
          </a>

          <a href="#instruktori" className="bg-white px-4 py-2 rounded-xl shadow whitespace-nowrap">
            Instruktori
          </a>

          <a href="#faq" className="bg-white px-4 py-2 rounded-xl shadow whitespace-nowrap">
            FAQ
          </a>

          <a href="/login" className="bg-white px-4 py-2 rounded-xl shadow whitespace-nowrap">
            Login
          </a>

          <a href="/register" className="bg-white px-4 py-2 rounded-xl shadow whitespace-nowrap">
            Registracija
          </a>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-8 pb-20">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center min-h-[auto] lg:min-h-[560px]">
          <div>
            <p className="text-blue-600 font-bold mb-4">
              Ski & Snowboard škola
            </p>

            <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight">
              Nauči. Napreduj.
              <span className="text-blue-600 block">
                Uživaj u skijanju!
              </span>
            </h2>

            <p className="text-slate-600 text-lg mt-6 max-w-xl">
              Zakažite ski ili snowboard čas za decu i odrasle.
              Individualni časovi, grupna nastava i licencirani instruktori.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={goToBooking}
                className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-4 rounded-2xl font-bold shadow-lg text-center"
              >
                Zakaži termin
              </button>

              <a
                href="/register"
                className="bg-white hover:bg-slate-50 text-slate-900 px-7 py-4 rounded-2xl font-bold shadow text-center"
              >
                Registracija
              </a>

              <a
                href="/login"
                className="text-blue-600 px-7 py-4 rounded-2xl font-bold text-center"
              >
                Login →
              </a>
            </div>
          </div>

          <div className="relative rounded-[2rem] bg-white shadow-2xl p-5 overflow-hidden">
            <div className="h-[300px] sm:h-[440px] rounded-[1.5rem] bg-gradient-to-br from-blue-200 via-blue-500 to-blue-700 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-white" />

              <div className="text-center text-white p-8 relative">
                <div className="text-8xl mb-6">⛷️</div>

                <h3 className="text-4xl font-bold">
                  Ski avantura počinje ovde
                </h3>

                <p className="mt-4 text-blue-50">
                  Izaberite tip časa, datum i slobodan termin.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="casovi" className="mt-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl sm:text-4xl font-bold">Naši časovi</h3>
            <div className="w-12 h-1 bg-blue-600 rounded-full mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {[
              ["⛷️", "Ski časovi", "Za početnike i napredne. Sve uzraste i nivoe."],
              ["🏂", "Snowboard časovi", "Nauči osnove ili usavrši svoju tehniku."],
              ["👤", "Individualni časovi", "Prilagođeni samo tebi. Brži napredak."],
              ["👥", "Grupni časovi", "Uči i napreduj uz zabavu i druženje."]
            ].map((item) => (
              <div
                key={item[1]}
                className="bg-white rounded-3xl shadow p-7 text-center hover:-translate-y-1 transition"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl mb-5">
                  {item[0]}
                </div>

                <h4 className="font-bold text-xl">{item[1]}</h4>

                <p className="text-slate-500 mt-3 text-sm leading-relaxed">
                  {item[2]}
                </p>

                <button
                  onClick={goToBooking}
                  className="inline-block mt-5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-5 py-2 rounded-xl font-bold"
                >
                  Saznaj više →
                </button>
              </div>
            ))}
          </div>
        </section>

        <section id="instruktori" className="mt-20">

          <div className="text-center mb-8">
            <h3 className="text-4xl font-bold">
              Naši instruktori
            </h3>

            <div className="w-12 h-1 bg-blue-600 rounded-full mx-auto mt-3" />
          </div>

          {instructors.length === 0 ? (

            <div className="bg-white rounded-3xl shadow p-8 text-center text-slate-500">
              Instruktori će uskoro biti prikazani.
            </div>

          ) : (

            <div>

              <div className="relative">

                {instructors.length > 4 && (
                  <button
                    onClick={previousInstructors}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 sm:-translate-x-5 z-10 w-12 h-12 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-3xl text-blue-700 hover:bg-blue-50"
                    aria-label="Prethodni instruktori"
                  >
                    ‹
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                  {visibleInstructors.map((instructor) => (

                    <div
                      key={instructor.id}
                      className="bg-white rounded-3xl shadow p-6 text-center hover:-translate-y-1 transition"
                    >

                      <div className="w-24 h-24 mx-auto rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-5xl mb-4">

                        {instructor.image_url ? (

                          <img
                            src={instructor.image_url}
                            alt={instructor.name}
                            className="w-full h-full object-cover"
                          />

                        ) : (

                          "👨‍🏫"

                        )}

                      </div>

                      <h4 className="text-xl font-bold">
                        {instructor.name}
                      </h4>

                      <p className="text-slate-500 mt-1">
                        {instructorRole(instructor)}
                      </p>

                      <div className="text-yellow-400 mt-3">
                        ★★★★★
                      </div>

                      <div className="flex flex-wrap justify-center gap-2 mt-4">

                        {instructor.ski_license && (
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                            Ski
                          </span>
                        )}

                        {instructor.snowboard_license && (
                          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                            Snowboard
                          </span>
                        )}

                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                          {levelLabel(
                            instructor.experience_level
                          )}
                        </span>

                      </div>

                    </div>

                  ))}

                </div>

                {instructors.length > 4 && (
                  <button
                    onClick={nextInstructors}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 sm:translate-x-5 z-10 w-12 h-12 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-3xl text-blue-700 hover:bg-blue-50"
                    aria-label="Sledeći instruktori"
                  >
                    ›
                  </button>
                )}

              </div>

              {instructors.length > 4 && (

                <div className="flex justify-center gap-2 mt-6">

                  {Array.from({
                    length: Math.ceil(
                      instructors.length /
                      instructorsPerPage
                    )
                  }).map((_, index) => (

                    <button
                      key={index}
                      onClick={() =>
                        setInstructorStart(
                          index * instructorsPerPage
                        )
                      }
                      className={`w-3 h-3 rounded-full ${Math.floor(
                        instructorStart /
                        instructorsPerPage
                      ) === index
                          ? "bg-blue-600"
                          : "bg-slate-300"
                        }`}
                      aria-label={`Stranica instruktora ${index + 1
                        }`}
                    />

                  ))}

                </div>

              )}

            </div>

          )}

        </section>  

        <section id="faq" className="mt-20">
          <div className="text-center mb-8">
            <h3 className="text-4xl font-bold">Često postavljena pitanja</h3>
            <div className="w-12 h-1 bg-blue-600 rounded-full mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              ["Da li je potrebna oprema?", "Ako nemate svoju opremu, možemo vas uputiti gde da je iznajmite."],
              ["Da li su časovi za početnike?", "Da, individualni časovi su idealni za početnike i decu."],
              ["Kako funkcionišu časovi za decu?", "Roditelj popunjava podatke, a instruktor radi prema nivou deteta."],
              ["Šta ako je loše vreme?", "Booker može promeniti termin u dogovoru sa vama."],
              ["Kako mogu da promenim termin?", "U client panelu možete poslati zahtev za promenu termina."],
              ["Gde se održavaju časovi?", "Lokacija se dogovara prema ski školi i dostupnim stazama."]
            ].map((faq) => (
              <div
                key={faq[0]}
                className="bg-white rounded-2xl shadow p-5"
              >
                <h4 className="font-bold">{faq[0]}</h4>
                <p className="text-slate-500 text-sm mt-2">{faq[1]}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-blue-950 text-white mt-10">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-xl">
                ⛷
              </div>

              <h3 className="text-xl sm:text-2xl font-bold">
                Ski School
              </h3>
            </div>

            <p className="text-blue-100">
              Vaša avantura na snegu počinje ovde.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Brzi linkovi</h4>
            <div className="space-y-2 text-blue-100">
              <p>Početna</p>
              <p>Časovi</p>
              <p>Instruktori</p>
              <p>Kontakt</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4">Podrška</h4>
            <div className="space-y-2 text-blue-100">
              <p>Česta pitanja</p>
              <p>Promena termina</p>
              <p>Registracija</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4">Kontakt</h4>
            <div className="space-y-2 text-blue-100">
              <p>+381 60 123 4567</p>
              <p>info@skischool.rs</p>
              <p>Kopaonik, Srbija</p>
            </div>
          </div>
        </div>

        <div className="text-center text-sm sm:text-base text-blue-200 border-t border-blue-900 py-5 px-4">
          © 2026 Ski School. Sva prava zadržana.
        </div>
      </footer>
    </div>
  );
}
