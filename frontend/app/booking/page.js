"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function BookingPage() {
  const [step, setStep] = useState(1);

  // =====================================================
  // POLAZNIK
  // =====================================================

  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [clientAge, setClientAge] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [clientSkillLevel, setClientSkillLevel] =
    useState("pocetnik");

  const [firstTime, setFirstTime] = useState(false);

  // =====================================================
  // RODITELJ
  // =====================================================

  const [parentName, setParentName] = useState("");

  // =====================================================
  // ČAS
  // =====================================================

  const [lessonType, setLessonType] = useState("ski");

  const [lessonMode, setLessonMode] =
    useState("individual");

  const [numberOfLessons, setNumberOfLessons] =
    useState(1);

  const [groupPackage, setGroupPackage] =
    useState("2h");

  const [preferredDate, setPreferredDate] =
    useState("");

  const [preferredTime, setPreferredTime] =
    useState("");

  const [availableTimes, setAvailableTimes] =
    useState([]);

  const [loadingTimes, setLoadingTimes] =
    useState(false);

  const [note, setNote] = useState("");

  // =====================================================
  // AI PROCENA
  // =====================================================

  const [aiExperience, setAiExperience] =
    useState("Skijao/vozio sam nekoliko dana");

  const [aiUsesLift, setAiUsesLift] =
    useState(false);

  const [aiControlsSpeed, setAiControlsSpeed] =
    useState(false);

  const [aiParallelTurns, setAiParallelTurns] =
    useState(false);

  const [aiSlopeConfidence, setAiSlopeConfidence] =
    useState("Siguran sam samo na lakšim i plavim stazama");

  const [aiLoading, setAiLoading] =
    useState(false);

  const [aiAssessment, setAiAssessment] =
    useState(null);

  const isMinor =
    Number(clientAge) > 0 &&
    Number(clientAge) < 18;

  // =====================================================
  // PROMENA DISCIPLINE
  // resetujemo AI rezultat jer više ne odgovara disciplini
  // =====================================================

  const changeLessonType = (type) => {
    setLessonType(type);
    setAiAssessment(null);
  };

  // =====================================================
  // MAPIRANJE AI NIVOA NA POSTOJEĆU BAZU
  // =====================================================

  const mapAiLevelToApplication = (level) => {
    if (level === "beginner") {
      return "pocetnik";
    }

    if (level === "intermediate") {
      return "srednji";
    }

    if (level === "advanced") {
      return "napredni";
    }

    return "pocetnik";
  };

  const skillLevelText = (level) => {
    if (level === "pocetnik") {
      return "Početnik";
    }

    if (level === "srednji") {
      return "Srednji nivo";
    }

    if (level === "napredni") {
      return "Napredni";
    }

    return level;
  };

  const aiSkillLevelText = (level) => {
    if (level === "beginner") {
      return "Početnik";
    }

    if (level === "intermediate") {
      return "Srednji nivo";
    }

    if (level === "advanced") {
      return "Napredni";
    }

    return level;
  };

  // =====================================================
  // AI PROCENA NIVOA
  // =====================================================

  const getAiAssessment = async () => {
    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      setAiLoading(true);
      setAiAssessment(null);

      const iskustvoZaAI = firstTime
        ? lessonType === "ski"
          ? "Prvi put skijam i nemam prethodno iskustvo."
          : "Prvi put vozim snowboard i nemam prethodno iskustvo."
        : aiExperience;

      const res = await axios.post(
        `${API_URL}/api/ai/skill-assessment`,
        {
          disciplina: lessonType,

          iskustvo:
            iskustvoZaAI,

          koristi_zicaru:
            firstTime
              ? false
              : aiUsesLift,

          kontrolise_brzinu:
            firstTime
              ? false
              : aiControlsSpeed,

          paralelni_zavoji:
            firstTime
              ? false
              : aiParallelTurns,

          sigurnost_na_stazi:
            firstTime
              ? "Nemam prethodno iskustvo na stazi."
              : aiSlopeConfidence,
          godine: Number(clientAge)
        },
        {
          headers: {
            token
          }
        }
      );

      const procena =
        res.data.procena;

      setAiAssessment(procena);

      // AI procena automatski postavlja nivo
      setClientSkillLevel(
        mapAiLevelToApplication(
          procena.procenjeni_nivo
        )
      );

      // Ako je prvi put, mora individualno
      if (firstTime) {
        setLessonMode("individual");
      } else {
        setLessonMode(
          procena.preporuceni_tip_casa
        );
      }

    } catch (err) {
      console.log(
        "AI PROCENA ERROR:",
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        "Greška pri AI proceni nivoa."
      );
    } finally {
      setAiLoading(false);
    }
  };

  // =====================================================
  // NEXT STEP
  // =====================================================

  const nextStep = () => {
    // POLAZNIK
    if (step === 1) {
      if (
        !clientFirstName ||
        !clientLastName ||
        !clientAge ||
        !clientPhone
      ) {
        alert(
          "Popuni podatke o polazniku."
        );

        return;
      }

      if (
        Number(clientAge) <= 0 ||
        Number(clientAge) > 100
      ) {
        alert(
          "Unesite validne godine polaznika."
        );

        return;
      }
    }

    // RODITELJ
    if (step === 2 && isMinor) {
      if (!parentName) {
        alert(
          "Za maloletnog polaznika unesi ime roditelja/staratelja."
        );

        return;
      }
    }

    // AI
    if (step === 3) {
      if (!aiAssessment) {
        alert(
          "Prvo pokrenite AI procenu nivoa."
        );

        return;
      }
    }

    // ČAS
    if (step === 4) {
      if (!preferredDate) {
        alert(
          "Izaberi željeni datum."
        );

        return;
      }

      if (
        lessonMode === "individual" &&
        !preferredTime
      ) {
        alert(
          "Izaberi željeno vreme."
        );

        return;
      }
    }

    setStep(step + 1);
  };

  // =====================================================
  // AVAILABLE TIMES
  // =====================================================

  const getAvailableTimes = async () => {
    try {
      if (
        !preferredDate ||
        !lessonType ||
        !lessonMode
      ) {
        return;
      }

      setLoadingTimes(true);
      setPreferredTime("");

      const res = await axios.get(
        `${API_URL}/api/availability`,
        {
          params: {
            date: preferredDate,

            type: lessonType,

            mode: lessonMode,

            group_package:
              lessonMode === "group"
                ? groupPackage
                : undefined,

            number_of_lessons:
              lessonMode === "individual"
                ? numberOfLessons
                : undefined
          }
        }
      );

      setAvailableTimes(res.data);
    } catch (err) {
      console.log(
        err.response?.data || err
      );

      alert(
        "Greška pri učitavanju dostupnih termina."
      );
    } finally {
      setLoadingTimes(false);
    }
  };

  // =====================================================
  // AUTH
  // =====================================================

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    const user =
      localStorage.getItem("user");

    if (!token || !user) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/login";
    }
  }, []);

  // =====================================================
  // UČITAVANJE TERMINA
  // =====================================================

  useEffect(() => {
    if (!preferredDate) return;
    if (!lessonType) return;
    if (!lessonMode) return;

    if (
      lessonMode === "group" &&
      !groupPackage
    ) {
      return;
    }

    getAvailableTimes();
  }, [
    preferredDate,
    lessonType,
    lessonMode,
    groupPackage,
    numberOfLessons
  ]);

  // =====================================================
  // SLANJE ZAHTEVA
  // =====================================================

  const submitRequest = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      if (!aiAssessment?.id) {
        alert("AI procena nije pronađena. Ponovo izvršite procenu.");
        setStep(3);
        return;
      }

      await axios.post(
        `${API_URL}/api/lesson-requests`,
        {
          client_first_name: clientFirstName,
          client_last_name: clientLastName,
          client_age: Number(clientAge),
          client_phone: clientPhone,
          client_skill_level: clientSkillLevel,
          first_time: firstTime,

          parent_name: isMinor
            ? parentName
            : null,

          parent_phone: isMinor
            ? clientPhone
            : null,

          lesson_type: lessonType,
          lesson_mode: lessonMode,

          number_of_lessons:
            lessonMode === "group"
              ? groupPackage === "2h"
                ? 2
                : 4
              : Number(numberOfLessons),

          group_package:
            lessonMode === "group"
              ? groupPackage
              : null,

          preferred_date: preferredDate,

          preferred_time:
            lessonMode === "group"
              ? "10:00"
              : preferredTime,

          note,

          ai_procena_id: aiAssessment.id
        },
        {
          headers: {
            token
          }
        }
      );

      alert(
        "Zahtev je uspešno poslat. Kontaktiraćemo vas za potvrdu termina."
      );

      window.location.href = "/client";

    } catch (err) {
      console.log(
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        "Greška pri slanju zahteva."
      );
    }
  };

  // =====================================================
  // GROUP TEXT
  // =====================================================

  const groupPackageText = () => {
    if (groupPackage === "2h") {
      return "2 časa: 10:00–12:00";
    }

    if (
      groupPackage === "4h_no_lunch"
    ) {
      return "4 časa bez ručka: 10:00–14:00";
    }

    return "4 časa sa ručkom: 10:00–12:00, pauza, 14:00–16:00";
  };

  // =====================================================
  // STEP BUTTON
  // =====================================================

  const StepButton = ({
    number,
    title
  }) => (
    <div className="flex items-center gap-3">

      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= number
            ? "bg-blue-600 text-white"
            : "bg-slate-200 text-slate-500"
          }`}
      >
        {number}
      </div>

      <span
        className={
          step >= number
            ? "text-white font-semibold"
            : "text-blue-100"
        }
      >
        {title}
      </span>

    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 sm:px-6">

      {/* ================================================= */}
      {/* NAVBAR */}
      {/* ================================================= */}

      <nav className="max-w-6xl mx-auto flex items-center justify-between py-5">

        <a
          href="/"
          className="flex items-center gap-3"
        >

          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            ⛷
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Ski School
          </h1>

        </a>

        <a
          href="/"
          className="text-slate-600 font-bold"
        >
          Nazad
        </a>

      </nav>

      <main className="max-w-6xl mx-auto pb-16">

        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden">

          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr]">

            {/* ================================================= */}
            {/* SIDEBAR */}
            {/* ================================================= */}

            <aside className="bg-blue-600 text-white p-6 sm:p-8">

              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Rezervacija časa
              </h2>

              <p className="text-blue-100 mb-8">
                Popunite zahtev korak po korak.
                AI će vam pomoći u proceni nivoa,
                dok će menadžer potvrditi instruktora
                i termin.
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">

                <StepButton
                  number={1}
                  title="Polaznik"
                />

                <StepButton
                  number={2}
                  title="Roditelj"
                />

                <StepButton
                  number={3}
                  title="AI procena"
                />

                <StepButton
                  number={4}
                  title="Čas"
                />

                <StepButton
                  number={5}
                  title="Potvrda"
                />

              </div>

              <div className="mt-8 lg:mt-12 bg-white/15 rounded-3xl p-5">

                <div className="text-5xl mb-3">
                  🤖
                </div>

                <p className="font-semibold">
                  AI procena predstavlja preporuku.
                  Konačnu odluku o nivou i tipu časa
                  možete promeniti pre slanja zahteva.
                </p>

              </div>

            </aside>

            {/* ================================================= */}
            {/* CONTENT */}
            {/* ================================================= */}

            <section className="p-5 sm:p-8 md:p-10">

              {/* ================================================= */}
              {/* STEP 1 - POLAZNIK */}
              {/* ================================================= */}

              {step === 1 && (
                <div>

                  <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-slate-900">
                    Podaci o polazniku
                  </h2>

                  <p className="text-slate-500 mb-6">
                    Unesite osnovne podatke o osobi
                    koja ide na čas.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <input
                      className="input"
                      placeholder="Ime"
                      value={clientFirstName}
                      onChange={(e) =>
                        setClientFirstName(
                          e.target.value
                        )
                      }
                    />

                    <input
                      className="input"
                      placeholder="Prezime"
                      value={clientLastName}
                      onChange={(e) =>
                        setClientLastName(
                          e.target.value
                        )
                      }
                    />

                    <input
                      className="input"
                      type="number"
                      min="1"
                      max="100"
                      placeholder="Godine"
                      value={clientAge}
                      onChange={(e) =>
                        setClientAge(
                          e.target.value
                        )
                      }
                    />

                    <input
                      className="input"
                      placeholder="Kontakt telefon"
                      value={clientPhone}
                      onChange={(e) =>
                        setClientPhone(
                          e.target.value
                        )
                      }
                    />

                    <select
                      className="input md:col-span-2"
                      value={
                        firstTime
                          ? "yes"
                          : "no"
                      }
                      onChange={(e) => {
                        const value =
                          e.target.value === "yes";

                        setFirstTime(value);

                        if (value) {
                          setLessonMode(
                            "individual"
                          );
                        }

                        setAiAssessment(null);
                      }}
                    >

                      <option value="no">
                        Imam prethodno iskustvo
                      </option>

                      <option value="yes">
                        Prvi put skijam / vozim snowboard
                      </option>

                    </select>

                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-8">

                    <button
                      onClick={nextStep}
                      className="primary-btn"
                    >
                      Nastavi
                    </button>

                  </div>

                </div>
              )}

              {/* ================================================= */}
              {/* STEP 2 - RODITELJ */}
              {/* ================================================= */}

              {step === 2 && (
                <div>

                  {isMinor ? (
                    <>

                      <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-slate-900">
                        Podaci roditelja/staratelja
                      </h2>

                      <p className="text-slate-500 mb-6">
                        Pošto je polaznik maloletan,
                        unesite ime roditelja ili
                        staratelja.
                      </p>

                      <input
                        className="input mb-4"
                        placeholder="Ime i prezime roditelja/staratelja"
                        value={parentName}
                        onChange={(e) =>
                          setParentName(
                            e.target.value
                          )
                        }
                      />

                    </>
                  ) : (
                    <>

                      <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-slate-900">
                        Polaznik je punoletan
                      </h2>

                      <p className="text-slate-500 mb-6">
                        Podaci roditelja nisu potrebni.
                      </p>

                    </>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">

                    <button
                      onClick={() =>
                        setStep(1)
                      }
                      className="secondary-btn"
                    >
                      Nazad
                    </button>

                    <button
                      onClick={nextStep}
                      className="primary-btn"
                    >
                      Nastavi
                    </button>

                  </div>

                </div>
              )}

              {/* ================================================= */}
              {/* STEP 3 - AI PROCENA */}
              {/* ================================================= */}

              {step === 3 && (
                <div>

                  <div className="flex items-center gap-3 mb-2">

                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl">
                      🤖
                    </div>

                    <div>
                      <p className="text-blue-600 font-semibold">
                        AI pomoć pri izboru časa
                      </p>

                      <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                        Procena nivoa znanja
                      </h2>
                    </div>

                  </div>

                  <p className="text-slate-500 mb-7 mt-3">
                    Odgovorite na nekoliko kratkih
                    pitanja. AI će analizirati odgovore,
                    proceniti nivo znanja i preporučiti
                    odgovarajući oblik nastave.
                  </p>

                  {/* DISCIPLINA */}

                  <h3 className="font-bold text-lg mb-3">
                    Šta želite da vozite?
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <button
                      type="button"
                      onClick={() =>
                        changeLessonType("ski")
                      }
                      className={`choice-card ${lessonType === "ski"
                          ? "choice-active"
                          : ""
                        }`}
                    >
                      <span className="text-4xl">
                        ⛷️
                      </span>

                      <b>Skijanje</b>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        changeLessonType(
                          "snowboard"
                        )
                      }
                      className={`choice-card ${lessonType ===
                          "snowboard"
                          ? "choice-active"
                          : ""
                        }`}
                    >
                      <span className="text-4xl">
                        🏂
                      </span>

                      <b>Snowboard</b>
                    </button>

                  </div>

                  {firstTime ? (

                    <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5 mt-6">

                      <p className="font-bold text-blue-800">
                        Prvi put ste na skijama/snowboardu.
                      </p>

                      <p className="text-blue-700 mt-2">
                        Sistem će ovu informaciju
                        automatski proslediti AI modulu.
                      </p>

                    </div>

                  ) : (

                    <div className="space-y-5 mt-7">

                      {/* ISKUSTVO */}

                      <div>

                        <label className="question-label">
                          Koliko prethodnog iskustva imate?
                        </label>

                        <select
                          className="input"
                          value={aiExperience}
                          onChange={(e) => {
                            setAiExperience(
                              e.target.value
                            );

                            setAiAssessment(null);
                          }}
                        >

                          <option value="Skijao/vozio sam nekoliko dana">
                            Nekoliko dana
                          </option>

                          <option value="Imam jednu sezonu iskustva">
                            Oko jedne sezone
                          </option>

                          <option value="Imam više sezona iskustva">
                            Više sezona
                          </option>

                          <option value="Imam dugogodišnje iskustvo i redovno skijam ili vozim snowboard">
                            Dugogodišnje iskustvo
                          </option>

                        </select>

                      </div>

                      {/* ŽIČARA */}

                      <QuestionYesNo
                        question="Da li samostalno koristite žičaru?"
                        value={aiUsesLift}
                        onChange={(value) => {
                          setAiUsesLift(value);
                          setAiAssessment(null);
                        }}
                      />

                      {/* BRZINA */}

                      <QuestionYesNo
                        question="Da li možete sigurno da kontrolišete brzinu i zaustavljanje?"
                        value={aiControlsSpeed}
                        onChange={(value) => {
                          setAiControlsSpeed(
                            value
                          );

                          setAiAssessment(null);
                        }}
                      />

                      {/* PARALELNI ZAVOJI */}

                      <QuestionYesNo
                        question="Da li možete da izvodite paralelne zavoje?"
                        value={aiParallelTurns}
                        onChange={(value) => {
                          setAiParallelTurns(
                            value
                          );

                          setAiAssessment(null);
                        }}
                      />

                      {/* STAZE */}

                      <div>

                        <label className="question-label">
                          Na kakvim stazama se osećate sigurno?
                        </label>

                        <select
                          className="input"
                          value={
                            aiSlopeConfidence
                          }
                          onChange={(e) => {
                            setAiSlopeConfidence(
                              e.target.value
                            );

                            setAiAssessment(null);
                          }}
                        >

                          <option value="Siguran sam samo na lakšim i plavim stazama">
                            Samo lakše / plave staze
                          </option>

                          <option value="Siguran sam na plavim stazama, ali nisam potpuno siguran na crvenim">
                            Plave staze, nesiguran na crvenim
                          </option>

                          <option value="Siguran sam na plavim i crvenim stazama">
                            Plave i crvene staze
                          </option>

                          <option value="Siguran sam na svim stazama uključujući zahtevnije terene">
                            Sve staze i zahtevniji tereni
                          </option>

                        </select>

                      </div>

                    </div>
                  )}

                  {/* AI BUTTON */}

                  <button
                    type="button"
                    onClick={getAiAssessment}
                    disabled={aiLoading}
                    className="ai-btn mt-7"
                  >

                    {aiLoading
                      ? "AI analizira odgovore..."
                      : "🤖 Proceni moj nivo pomoću AI"}

                  </button>

                  {/* AI RESULT */}

                  {aiAssessment && (
                    <div className="ai-result mt-7">

                      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">

                        <div>

                          <p className="text-sm font-semibold text-blue-600">
                            AI analiza završena
                          </p>

                          <h3 className="text-2xl font-bold">
                            Vaša preporuka
                          </h3>

                        </div>

                        <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-sm">
                          ✓ Procena uspešna
                        </span>

                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div className="result-card">

                          <p className="result-label">
                            Procenjeni nivo
                          </p>

                          <p className="result-value">
                            {aiSkillLevelText(
                              aiAssessment.procenjeni_nivo
                            )}
                          </p>

                        </div>

                        <div className="result-card">

                          <p className="result-label">
                            Preporučeni oblik nastave
                          </p>

                          <p className="result-value">
                            {aiAssessment.preporuceni_tip_casa ===
                              "individual"
                              ? "Individualni čas"
                              : "Grupna nastava"}
                          </p>

                        </div>

                      </div>

                      <div className="bg-white rounded-2xl p-5 mt-4 border border-blue-100">

                        <p className="font-bold text-slate-800 mb-2">
                          Obrazloženje AI preporuke
                        </p>

                        <p className="text-slate-600 leading-7">
                          {
                            aiAssessment.obrazlozenje
                          }
                        </p>

                      </div>

                      {firstTime &&
                        aiAssessment.preporuceni_tip_casa ===
                        "group" && (

                          <div className="bg-amber-50 text-amber-800 p-4 rounded-2xl mt-4">
                            Pošto prvi put
                            skijate/vozite snowboard,
                            aplikacija će bez obzira na
                            AI preporuku koristiti
                            individualni čas.
                          </div>

                        )}

                      <p className="text-sm text-slate-500 mt-4">
                        AI preporuka je automatski
                        primenjena. Nivo i tip nastave
                        možete promeniti u sledećem
                        koraku.
                      </p>

                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 mt-8">

                    <button
                      onClick={() =>
                        setStep(2)
                      }
                      className="secondary-btn"
                    >
                      Nazad
                    </button>

                    <button
                      onClick={nextStep}
                      className="primary-btn"
                    >
                      Nastavi
                    </button>

                  </div>

                </div>
              )}

              {/* ================================================= */}
              {/* STEP 4 - ČAS */}
              {/* ================================================= */}

              {step === 4 && (
                <div>

                  <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-slate-900">
                    Izbor časa
                  </h2>

                  <p className="text-slate-500 mb-6">
                    AI preporuka je već primenjena,
                    ali ovde možete promeniti nivo
                    ili oblik nastave.
                  </p>

                  {/* AI SUMMARY */}

                  {aiAssessment && (
                    <div className="bg-blue-50 rounded-3xl p-5 mb-6">

                      <p className="font-bold text-blue-800">
                        🤖 AI je preporučio:{" "}
                        {aiSkillLevelText(
                          aiAssessment.procenjeni_nivo
                        )}
                        {" / "}
                        {aiAssessment.preporuceni_tip_casa ===
                          "individual"
                          ? "individualni čas"
                          : "grupnu nastavu"}
                      </p>

                    </div>
                  )}

                  {/* NIV0 */}

                  <div className="mb-5">

                    <label className="question-label">
                      Izabrani nivo
                    </label>

                    <select
                      className="input"
                      value={clientSkillLevel}
                      onChange={(e) =>
                        setClientSkillLevel(
                          e.target.value
                        )
                      }
                    >

                      <option value="pocetnik">
                        Početnik
                      </option>

                      <option value="srednji">
                        Srednji nivo
                      </option>

                      <option value="napredni">
                        Napredni
                      </option>

                    </select>

                  </div>

                  {/* DISCIPLINA */}

                  <div className="bg-slate-50 rounded-2xl p-4 mb-5">

                    <p className="text-sm text-slate-500">
                      Izabrana disciplina
                    </p>

                    <p className="font-bold text-lg mt-1">
                      {lessonType === "ski"
                        ? "⛷️ Skijanje"
                        : "🏂 Snowboard"}
                    </p>

                  </div>

                  {/* MODE */}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <button
                      type="button"
                      onClick={() =>
                        setLessonMode(
                          "individual"
                        )
                      }
                      className={`choice-card ${lessonMode ===
                          "individual"
                          ? "choice-active"
                          : ""
                        }`}
                    >
                      <span className="text-3xl">
                        👤
                      </span>

                      <b>Individualni čas</b>
                    </button>

                    {!firstTime && (
                      <button
                        type="button"
                        onClick={() =>
                          setLessonMode("group")
                        }
                        className={`choice-card ${lessonMode === "group"
                            ? "choice-active"
                            : ""
                          }`}
                      >
                        <span className="text-3xl">
                          👥
                        </span>

                        <b>Grupna nastava</b>
                      </button>
                    )}

                  </div>

                  {firstTime && (
                    <p className="text-blue-700 bg-blue-50 p-4 rounded-2xl mt-4">
                      Polaznici koji prvi put skijaju
                      ili voze snowboard mogu samo na
                      individualni čas.
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">

                    {lessonMode ===
                      "individual" ? (
                      <>

                        <select
                          className="input"
                          value={
                            numberOfLessons
                          }
                          onChange={(e) =>
                            setNumberOfLessons(
                              e.target.value
                            )
                          }
                        >

                          <option value={1}>
                            1 čas
                          </option>

                          <option value={2}>
                            2 časa
                          </option>

                          <option value={3}>
                            3 časa
                          </option>

                          <option value={4}>
                            4 časa
                          </option>

                          <option value={5}>
                            5 časova
                          </option>

                        </select>

                        <select
                          className="input"
                          value={preferredTime}
                          onChange={(e) =>
                            setPreferredTime(
                              e.target.value
                            )
                          }
                          disabled={
                            !preferredDate ||
                            loadingTimes
                          }
                        >

                          <option value="">

                            {loadingTimes
                              ? "Učitavanje termina..."
                              : !preferredDate
                                ? "Prvo izaberi datum"
                                : availableTimes.length ===
                                  0
                                  ? "Nema slobodnih termina"
                                  : "Izaberi slobodan termin"}

                          </option>

                          {availableTimes.map(
                            (time) => (
                              <option
                                key={
                                  time.start_time
                                }
                                value={
                                  time.start_time
                                }
                              >
                                {time.label}
                              </option>
                            )
                          )}

                        </select>

                      </>
                    ) : (

                      <select
                        className="input md:col-span-2"
                        value={groupPackage}
                        onChange={(e) =>
                          setGroupPackage(
                            e.target.value
                          )
                        }
                      >

                        <option value="2h">
                          Grupna 2 časa:
                          10:00–12:00
                        </option>

                        <option value="4h_no_lunch">
                          Grupna 4 časa bez
                          ručka: 10:00–14:00
                        </option>

                        <option value="4h_lunch">
                          Grupna 4 časa sa
                          ručkom: 10:00–12:00 i
                          14:00–16:00
                        </option>

                      </select>

                    )}

                    <input
                      className="input"
                      type="date"
                      value={preferredDate}
                      onChange={(e) =>
                        setPreferredDate(
                          e.target.value
                        )
                      }
                    />

                    <textarea
                      className="input md:col-span-2 min-h-28"
                      placeholder="Napomena"
                      value={note}
                      onChange={(e) =>
                        setNote(e.target.value)
                      }
                    />

                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-8">

                    <button
                      onClick={() =>
                        setStep(3)
                      }
                      className="secondary-btn"
                    >
                      Nazad
                    </button>

                    <button
                      onClick={nextStep}
                      className="primary-btn"
                    >
                      Nastavi
                    </button>

                  </div>

                </div>
              )}

              {/* ================================================= */}
              {/* STEP 5 - POTVRDA */}
              {/* ================================================= */}

              {step === 5 && (
                <div>

                  <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-slate-900">
                    Pregled i potvrda
                  </h2>

                  <p className="text-slate-500 mb-6">
                    Proverite podatke pre slanja
                    zahteva.
                  </p>

                  {/* AI INFO */}

                  {aiAssessment && (
                    <div className="bg-purple-50 border border-purple-100 rounded-3xl p-5 mb-5">

                      <p className="font-bold text-purple-800 mb-2">
                        🤖 AI procena
                      </p>

                      <p className="text-slate-700">
                        <b>AI nivo:</b>{" "}
                        {aiSkillLevelText(
                          aiAssessment.procenjeni_nivo
                        )}
                      </p>

                      <p className="text-slate-700">
                        <b>AI preporuka:</b>{" "}
                        {aiAssessment.preporuceni_tip_casa ===
                          "individual"
                          ? "Individualni čas"
                          : "Grupna nastava"}
                      </p>

                      <p className="text-slate-600 mt-3">
                        {
                          aiAssessment.obrazlozenje
                        }
                      </p>

                    </div>
                  )}

                  <div className="bg-blue-50 rounded-3xl p-5 sm:p-6 my-6 space-y-2 text-slate-700">

                    <p>
                      <b>Polaznik:</b>{" "}
                      {clientFirstName}{" "}
                      {clientLastName},{" "}
                      {clientAge} godina
                    </p>

                    <p>
                      <b>Kontakt telefon:</b>{" "}
                      {clientPhone}
                    </p>

                    {isMinor && (
                      <p>
                        <b>
                          Roditelj/staratelj:
                        </b>{" "}
                        {parentName}
                      </p>
                    )}

                    <p>
                      <b>Izabrani nivo:</b>{" "}
                      {skillLevelText(
                        clientSkillLevel
                      )}
                    </p>

                    <p>
                      <b>Prvi put:</b>{" "}
                      {firstTime
                        ? "Da"
                        : "Ne"}
                    </p>

                    <p>
                      <b>Disciplina:</b>{" "}
                      {lessonType === "ski"
                        ? "Skijanje"
                        : "Snowboard"}
                    </p>

                    <p>
                      <b>Nastava:</b>{" "}
                      {lessonMode === "group"
                        ? "Grupna"
                        : "Individualna"}
                    </p>

                    <p>
                      <b>Broj časova:</b>{" "}
                      {lessonMode === "group"
                        ? groupPackage ===
                          "2h"
                          ? 2
                          : 4
                        : numberOfLessons}
                    </p>

                    <p>
                      <b>Datum:</b>{" "}
                      {preferredDate}
                    </p>

                    <p>
                      <b>Vreme:</b>{" "}
                      {lessonMode === "group"
                        ? groupPackageText()
                        : preferredTime}
                    </p>

                    {note && (
                      <p>
                        <b>Napomena:</b>{" "}
                        {note}
                      </p>
                    )}

                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">

                    <button
                      onClick={() =>
                        setStep(4)
                      }
                      className="secondary-btn"
                    >
                      Nazad
                    </button>

                    <button
                      onClick={submitRequest}
                      className="primary-btn"
                    >
                      Pošalji zahtev
                    </button>

                  </div>

                </div>
              )}

            </section>

          </div>

        </div>

      </main>

      {/* ================================================= */}
      {/* CSS */}
      {/* ================================================= */}

      <style jsx>{`

        .input {
          width: 100%;
          border: 1px solid #dbeafe;
          padding: 15px;
          border-radius: 16px;
          outline: none;
          background: white;
          color: black;
          font-size: 16px;
        }

        .input::placeholder {
          color: #64748b;
          opacity: 1;
        }

        .input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .primary-btn {
          background: #2563eb;
          color: white;
          padding: 14px 24px;
          border-radius: 16px;
          font-weight: 700;
          width: 100%;
        }

        .primary-btn:hover {
          background: #1d4ed8;
        }

        .secondary-btn {
          background: white;
          color: #334155;
          border: 1px solid #dbeafe;
          padding: 14px 24px;
          border-radius: 16px;
          font-weight: 700;
          width: 100%;
        }

        .secondary-btn:hover {
          background: #f8fafc;
        }

        .choice-card {
          border: 2px solid #e0ecff;
          background: white;
          border-radius: 24px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #0f172a;
          transition: 0.2s;
        }

        .choice-card:hover {
          border-color: #93c5fd;
          background: #f8fbff;
        }

        .choice-active {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .question-label {
          display: block;
          font-weight: 700;
          color: #334155;
          margin-bottom: 10px;
        }

        .ai-btn {
          width: 100%;
          background: linear-gradient(
            135deg,
            #2563eb,
            #7c3aed
          );
          color: white;
          padding: 16px 24px;
          border-radius: 18px;
          font-weight: 800;
          font-size: 16px;
          box-shadow:
            0 10px 25px
            rgba(37, 99, 235, 0.2);
        }

        .ai-btn:hover {
          opacity: 0.95;
        }

        .ai-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ai-result {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 28px;
          padding: 24px;
        }

        .result-card {
          background: white;
          border: 1px solid #dbeafe;
          border-radius: 20px;
          padding: 18px;
        }

        .result-label {
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
        }

        .result-value {
          color: #1e3a8a;
          font-size: 21px;
          font-weight: 800;
          margin-top: 5px;
        }

      `}</style>

    </div>
  );
}


// =====================================================
// YES / NO KOMPONENTA ZA AI UPITNIK
// =====================================================

function QuestionYesNo({
  question,
  value,
  onChange
}) {
  return (
    <div>

      <label className="block font-bold text-slate-700 mb-3">
        {question}
      </label>

      <div className="grid grid-cols-2 gap-3">

        <button
          type="button"
          onClick={() =>
            onChange(true)
          }
          className={`border-2 rounded-2xl p-4 font-bold ${value === true
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-700"
            }`}
        >
          Da
        </button>

        <button
          type="button"
          onClick={() =>
            onChange(false)
          }
          className={`border-2 rounded-2xl p-4 font-bold ${value === false
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-700"
            }`}
        >
          Ne
        </button>

      </div>

    </div>
  );
}