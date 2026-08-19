"use client";

import { useState } from "react";

export default function LessonsCalendar({ lessons }) {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const formatTime = (time) => {
    if (!time) return "";
    return time.slice(0, 5);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("sr-RS", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const packageLabel = (value) => {
    if (!value) return "/";
    if (value === "2h") return "Grupna 2h";
    if (value === "4h_no_lunch") return "Grupna 4h bez ručka";
    if (value === "4h_lunch") return "Grupna 4h sa ručkom";
    return value;
  };

  const instructors = [
    ...new Set(lessons.map((lesson) => lesson.instructor_name))
  ];

  const filteredLessons = lessons.filter((lesson) => {
    if (
      instructorFilter !== "all" &&
      lesson.instructor_name !== instructorFilter
    ) {
      return false;
    }

    if (typeFilter !== "all" && lesson.lesson_type !== typeFilter) {
      return false;
    }

    return true;
  });

  const sortedLessons = [...filteredLessons].sort((a, b) => {
    const dateA = new Date(`${a.lesson_date.split("T")[0]}T${a.start_time}`);
    const dateB = new Date(`${b.lesson_date.split("T")[0]}T${b.start_time}`);

    return dateA - dateB;
  });

  const groupedLessons = sortedLessons.reduce((groups, lesson) => {
    const date = lesson.lesson_date.split("T")[0];

    if (!groups[date]) {
      groups[date] = [];
    }

    groups[date].push(lesson);

    return groups;
  }, {});

  return (
    <div className="bg-white rounded-[2rem] shadow p-6">
      <div className="mb-5">
        <h3 className="text-2xl font-bold">
          Kalendar časova
        </h3>

        <p className="text-slate-500">
          Pregled zakazanih časova po datumima, instruktorima i tipu časa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <select
          className="calendar-input"
          value={instructorFilter}
          onChange={(e) => setInstructorFilter(e.target.value)}
        >
          <option value="all">Svi instruktori</option>

          {instructors.map((instructor) => (
            <option key={instructor} value={instructor}>
              {instructor}
            </option>
          ))}
        </select>

        <select
          className="calendar-input"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">Svi tipovi</option>
          <option value="ski">Ski</option>
          <option value="snowboard">Snowboard</option>
        </select>
      </div>

      {sortedLessons.length === 0 ? (
        <div className="bg-slate-50 rounded-3xl p-8 text-center text-slate-500">
          Nema časova za izabrane filtere.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedLessons).map((date) => (
            <div
              key={date}
              className="border border-slate-200 rounded-3xl overflow-hidden"
            >
              <div className="bg-blue-50 px-5 py-4">
                <h4 className="font-bold text-blue-700 capitalize">
                  {formatDate(date)}
                </h4>
              </div>

              <div className="divide-y divide-slate-100">
                {groupedLessons[date].map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className="w-full text-left p-5 hover:bg-slate-50 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-slate-900">
                          {formatTime(lesson.start_time)}–{formatTime(lesson.end_time)}
                        </p>

                        <p className="text-slate-700">
                          {lesson.client_first_name} {lesson.client_last_name}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {lesson.lesson_type}
                        </span>

                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {lesson.lesson_mode}
                        </span>

                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {lesson.instructor_name}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedLesson && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl font-bold">
                  {selectedLesson.client_first_name} {selectedLesson.client_last_name}
                </h3>

                <p className="text-slate-500">
                  {formatDate(selectedLesson.lesson_date.split("T")[0])}
                </p>
              </div>

              <button
                onClick={() => setSelectedLesson(null)}
                className="bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-slate-700">
              <p>
                <b>Vreme:</b> {formatTime(selectedLesson.start_time)}–{formatTime(selectedLesson.end_time)}
              </p>

              <p>
                <b>Instruktor:</b> {selectedLesson.instructor_name}
              </p>

              <p>
                <b>Tip:</b> {selectedLesson.lesson_type}
              </p>

              <p>
                <b>Nastava:</b> {selectedLesson.lesson_mode}
              </p>

              <p>
                <b>Paket:</b> {packageLabel(selectedLesson.group_package)}
              </p>

              <p>
                <b>Polaznik:</b> {selectedLesson.client_age} godina, {selectedLesson.client_skill_level}
              </p>

              <p>
                <b>Telefon:</b> {selectedLesson.client_phone}
              </p>

              <p>
                <b>Prvi put:</b> {selectedLesson.first_time ? "Da" : "Ne"}
              </p>

              {selectedLesson.client_age < 18 && (
                <>
                  <p>
                    <b>Roditelj:</b> {selectedLesson.parent_name}
                  </p>

                  <p>
                    <b>Telefon roditelja:</b> {selectedLesson.parent_phone}
                  </p>
                </>
              )}

              {selectedLesson.note && (
                <p className="bg-slate-50 rounded-2xl p-3 mt-3">
                  <b>Napomena:</b> {selectedLesson.note}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .calendar-input {
          width: 100%;
          border: 1px solid #dbeafe;
          padding: 14px;
          border-radius: 16px;
          outline: none;
          background: white;
          color: black;
        }

        .calendar-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
      `}</style>
    </div>
  );
}