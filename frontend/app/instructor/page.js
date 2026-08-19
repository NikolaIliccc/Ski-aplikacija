"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function InstructorPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);

  const [lessons, setLessons] = useState([]);
  const [busyBlocks, setBusyBlocks] = useState([]);

  const [lessonFilter, setLessonFilter] = useState("upcoming");
  const [selectedLesson, setSelectedLesson] = useState(null);

  const [busyDate, setBusyDate] = useState("");
  const [busyStartTime, setBusyStartTime] = useState("");
  const [busyEndTime, setBusyEndTime] = useState("");
  const [busyReason, setBusyReason] = useState("");

  const getMyLessons = async () => {
    const token = localStorage.getItem("token");

    const res = await axios.get(
      "http://localhost:5000/api/lessons/my",
      {
        headers: { token }
      }
    );

    setLessons(res.data);
  };

  const getMyBusyBlocks = async () => {
    const token = localStorage.getItem("token");

    const res = await axios.get(
      "http://localhost:5000/api/unavailability/my",
      {
        headers: { token }
      }
    );

    setBusyBlocks(res.data);
  };

  const addBusyBlock = async () => {
    try {
      if (!busyDate || !busyStartTime || !busyEndTime) {
        alert("Unesi datum i vreme.");
        return;
      }

      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:5000/api/unavailability/my",
        {
          unavailable_date: busyDate,
          start_time: busyStartTime,
          end_time: busyEndTime,
          reason: busyReason
        },
        {
          headers: { token }
        }
      );

      alert("Zauzetost dodata.");

      setBusyDate("");
      setBusyStartTime("");
      setBusyEndTime("");
      setBusyReason("");

      getMyBusyBlocks();
    } catch (err) {
      console.log(err.response?.data || err);

      alert(
        err.response?.data?.message ||
        "Greška pri dodavanju zauzetosti."
      );
    }
  };

  const deleteBusyBlock = async (busyId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `http://localhost:5000/api/unavailability/my/${busyId}`,
        {
          headers: { token }
        }
      );

      getMyBusyBlocks();
    } catch (err) {
      console.log(err.response?.data || err);

      alert(
        err.response?.data?.message ||
        "Greška pri brisanju zauzetosti."
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/";
  };

  const formatDate = (date) => {
    if (!date) return "";

    const d = new Date(date);

    return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}.`;
  };

  const formatTime = (time) => {
    if (!time) return "";

    return time.slice(0, 5);
  };

  const getDateKey = (date) => {
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getHours = (start, end) => {
    if (!start || !end) return 0;

    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);

    return (eh * 60 + em - (sh * 60 + sm)) / 60;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      window.location.href = "/login";
      return;
    }

    const parsedUser = JSON.parse(savedUser);

    if (parsedUser.role !== "instructor") {
      window.location.href = "/";
      return;
    }

    setUser(parsedUser);
    setCheckingAuth(false);

    getMyLessons();
    getMyBusyBlocks();
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <p className="text-slate-600 font-semibold">
          Učitavanje...
        </p>
      </div>
    );
  }

  const today = getDateKey(new Date());

  const upcomingLessons = lessons.filter((lesson) => {
    return getDateKey(lesson.lesson_date) >= today;
  });

  const completedLessons = lessons.filter((lesson) => {
    return getDateKey(lesson.lesson_date) < today;
  });

  const todayLessons = lessons.filter((lesson) => {
    return getDateKey(lesson.lesson_date) === today;
  });

  let displayedLessons = upcomingLessons;

  if (lessonFilter === "today") {
    displayedLessons = todayLessons;
  }

  if (lessonFilter === "completed") {
    displayedLessons = completedLessons;
  }

  if (lessonFilter === "all") {
    displayedLessons = lessons;
  }

  const totalLessonHours = lessons.reduce((sum, lesson) => {
    return sum + getHours(lesson.start_time, lesson.end_time);
  }, 0);

  const totalBusyHours = busyBlocks.reduce((sum, busy) => {
    return sum + getHours(busy.start_time, busy.end_time);
  }, 0);

  const uniqueClients = [];

  lessons.forEach((lesson) => {
    const key = `${lesson.client_first_name}-${lesson.client_last_name}-${lesson.client_phone}`;

    const existing = uniqueClients.find((client) => client.key === key);

    if (!existing) {
      uniqueClients.push({
        key,
        name: `${lesson.client_first_name} ${lesson.client_last_name}`,
        phone:
          lesson.client_age < 18
            ? lesson.parent_phone
            : lesson.client_phone,
        parent: lesson.parent_name,
        count: 1,
        lastLesson: lesson.lesson_date
      });
    } else {
      existing.count += 1;

      if (
        new Date(lesson.lesson_date) >
        new Date(existing.lastLesson)
      ) {
        existing.lastLesson = lesson.lesson_date;
      }
    }
  });

  return (
    <div className="min-h-screen bg-blue-50 text-slate-900">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] min-h-screen">
        <aside className="bg-white border-r border-blue-100 p-4 sm:p-6 lg:min-h-screen">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
              ⛷
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Ski School
              </h1>

              <p className="text-slate-500 text-sm">
                Instructor panel
              </p>
            </div>
          </div>

          <nav className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <button
              onClick={() => setLessonFilter("upcoming")}
              className={`w-full text-left px-4 py-3 rounded-2xl font-semibold ${lessonFilter === "upcoming"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-blue-50"
                }`}
            >
              Naredni časovi
            </button>

            <button
              onClick={() => setLessonFilter("today")}
              className={`w-full text-left px-4 py-3 rounded-2xl font-semibold ${lessonFilter === "today"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-blue-50"
                }`}
            >
              Današnji časovi
            </button>

            <button
              onClick={() => setLessonFilter("completed")}
              className={`w-full text-left px-4 py-3 rounded-2xl font-semibold ${lessonFilter === "completed"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-blue-50"
                }`}
            >
              Istorija časova
            </button>

            <button
              onClick={() => setLessonFilter("all")}
              className={`w-full text-left px-4 py-3 rounded-2xl font-semibold ${lessonFilter === "all"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-blue-50"
                }`}
            >
              Svi časovi
            </button>
          </nav>

          <button
            onClick={logout}
            className="mt-10 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-3 rounded-2xl font-bold"
          >
            Logout
          </button>
        </aside>

        <main className="p-4 sm:p-6 lg:p-8">
          <section className="bg-white rounded-[2rem] overflow-hidden shadow mb-6">
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white p-8">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="w-28 h-28 rounded-full bg-white/20 overflow-hidden backdrop-blur flex items-center justify-center text-5xl">
                  {user?.image_url ? (
                    <img
                      src={user.image_url}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "🏂"
                  )}
                </div>

                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold">
                    {user?.name}
                  </h2>

                  <p className="text-blue-100 mt-2">
                    Instruktor ski škole
                  </p>

                  <p className="text-blue-50 mt-1">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 p-4 sm:p-6">
              <div className="bg-blue-50 rounded-3xl p-5">
                <p className="text-slate-500 text-sm">
                  Današnji časovi
                </p>

                <p className="text-3xl sm:text-4xl font-bold text-blue-700 mt-2">
                  {todayLessons.length}
                </p>
              </div>

              <div className="bg-green-50 rounded-3xl p-5">
                <p className="text-slate-500 text-sm">
                  Ukupno sati
                </p>

                <p className="text-4xl font-bold text-green-700 mt-2">
                  {totalLessonHours}
                </p>
              </div>

              <div className="bg-purple-50 rounded-3xl p-5">
                <p className="text-slate-500 text-sm">
                  Zauzeti sati
                </p>

                <p className="text-4xl font-bold text-purple-700 mt-2">
                  {totalBusyHours}
                </p>
              </div>

              <div className="bg-orange-50 rounded-3xl p-5">
                <p className="text-slate-500 text-sm">
                  Klijenti
                </p>

                <p className="text-4xl font-bold text-orange-700 mt-2">
                  {uniqueClients.length}
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4 sm:gap-6">
            <div className="space-y-6">
              <section className="bg-white rounded-[2rem] shadow p-6">
                <div className="mb-5">
                  <h3 className="text-2xl font-bold">
                    Časovi
                  </h3>

                  <p className="text-slate-500">
                    Pregled svih časova.
                  </p>
                </div>

                {displayedLessons.length === 0 ? (
                  <div className="bg-slate-50 rounded-3xl p-8 text-center text-slate-500">
                    Nema časova.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className="cursor-pointer border border-blue-100 rounded-3xl p-4 sm:p-5 hover:bg-blue-50 transition overflow-hidden"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <div className="flex gap-2 mb-2">
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                                {lesson.lesson_type}
                              </span>

                              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-bold">
                                {lesson.lesson_mode}
                              </span>
                            </div>

                            <h4 className="text-xl font-bold">
                              {lesson.client_first_name}{" "}
                              {lesson.client_last_name}
                            </h4>

                            <p className="text-slate-500">
                              {formatDate(lesson.lesson_date)}
                            </p>
                          </div>

                          <div className="text-left md:text-right">
                            <p className="font-bold text-blue-700">
                              {formatTime(lesson.start_time)} -{" "}
                              {formatTime(lesson.end_time)}
                            </p>

                            <p className="text-sm text-slate-500">
                              Klik za detalje
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-white rounded-[2rem] shadow p-6">
                <div className="mb-5">
                  <h3 className="text-2xl font-bold">
                    Istorija zauzetosti
                  </h3>

                  <p className="text-slate-500">
                    Pregled privatnih zauzetosti.
                  </p>
                </div>

                {busyBlocks.length === 0 ? (
                  <div className="bg-slate-50 rounded-3xl p-8 text-center text-slate-500">
                    Nema zauzetosti.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {busyBlocks.map((busy) => (
                      <div
                        key={busy.id}
                        className="border border-blue-100 rounded-3xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                      >
                        <div>
                          <p className="font-bold">
                            {formatDate(busy.unavailable_date)}
                          </p>

                          <p className="text-slate-600">
                            {formatTime(busy.start_time)} -{" "}
                            {formatTime(busy.end_time)}
                          </p>

                          <p className="text-sm text-slate-500">
                            {busy.reason || "Bez napomene"}
                          </p>
                        </div>

                        <button
                          onClick={() => deleteBusyBlock(busy.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-2xl font-bold"
                        >
                          Obriši
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <section className="bg-white rounded-[2rem] shadow p-6">
                <div className="mb-5">
                  <h3 className="text-2xl font-bold">
                    Dodaj zauzetost
                  </h3>

                  <p className="text-slate-500">
                    Označi da nisi dostupan.
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    type="date"
                    className="form-input"
                    value={busyDate}
                    onChange={(e) => setBusyDate(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="time"
                      className="form-input"
                      value={busyStartTime}
                      onChange={(e) => setBusyStartTime(e.target.value)}
                    />

                    <input
                      type="time"
                      className="form-input"
                      value={busyEndTime}
                      onChange={(e) => setBusyEndTime(e.target.value)}
                    />
                  </div>

                  <input
                    className="form-input"
                    placeholder="Razlog / napomena"
                    value={busyReason}
                    onChange={(e) => setBusyReason(e.target.value)}
                  />

                  <button
                    onClick={addBusyBlock}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-4 rounded-2xl font-bold"
                  >
                    Dodaj zauzetost
                  </button>
                </div>
              </section>

              <section className="bg-white rounded-[2rem] shadow p-6">
                <div className="mb-5">
                  <h3 className="text-2xl font-bold">
                    Moji klijenti
                  </h3>

                  <p className="text-slate-500">
                    Kontakti klijenata.
                  </p>
                </div>

                {uniqueClients.length === 0 ? (
                  <div className="bg-slate-50 rounded-3xl p-8 text-center text-slate-500">
                    Nema klijenata.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {uniqueClients.map((client) => (
                      <div
                        key={client.key}
                        className="border border-blue-100 rounded-3xl p-4"
                      >
                        <p className="font-bold">
                          {client.name}
                        </p>

                        <p className="text-slate-600">
                          {client.phone}
                        </p>

                        {client.parent && (
                          <p className="text-sm text-slate-500">
                            Roditelj: {client.parent}
                          </p>
                        )}

                        <div className="flex justify-between mt-3 text-sm">
                          <span>
                            Časova: <b>{client.count}</b>
                          </span>

                          <span>
                            Poslednji:{" "}
                            <b>{formatDate(client.lastLesson)}</b>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>

      {selectedLesson && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-[2rem] max-w-lg w-full p-5 sm:p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedLesson(null)}
              className="absolute top-5 right-5 text-slate-500 hover:text-black"
            >
              ✕
            </button>

            <h3 className="text-3xl font-bold mb-5">
              Detalji časa
            </h3>

            <div className="space-y-3 text-slate-700">
              <p>
                <b>Klijent:</b>{" "}
                {selectedLesson.client_first_name}{" "}
                {selectedLesson.client_last_name}
              </p>

              <p>
                <b>Telefon:</b>{" "}
                {selectedLesson.client_age < 18
                  ? selectedLesson.parent_phone
                  : selectedLesson.client_phone}
              </p>

              {selectedLesson.parent_name && (
                <p>
                  <b>Roditelj:</b>{" "}
                  {selectedLesson.parent_name}
                </p>
              )}

              <p>
                <b>Datum:</b>{" "}
                {formatDate(selectedLesson.lesson_date)}
              </p>

              <p>
                <b>Vreme:</b>{" "}
                {formatTime(selectedLesson.start_time)} -{" "}
                {formatTime(selectedLesson.end_time)}
              </p>

              <p>
                <b>Tip:</b> {selectedLesson.lesson_type}
              </p>

              <p>
                <b>Nivo:</b>{" "}
                {selectedLesson.client_skill_level}
              </p>

              <p>
                <b>Prvi put:</b>{" "}
                {selectedLesson.first_time ? "Da" : "Ne"}
              </p>

              {selectedLesson.note && (
                <p>
                  <b>Napomena:</b>{" "}
                  {selectedLesson.note}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .form-input {
          width: 100%;
          border: 1px solid #dbeafe;
          padding: 14px;
          border-radius: 16px;
          outline: none;
          background: white;
          color: black;
        }

        .form-input::placeholder {
          color: #64748b;
          opacity: 1;
        }

        .form-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
      `}</style>
    </div>
  );
}
