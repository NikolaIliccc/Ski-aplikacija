"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import LessonsCalendar from "../../components/LessonsCalendar";

export default function AdminPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeSection, setActiveSection] = useState("requests");
  const [requestTypeFilter, setRequestTypeFilter] = useState("all");
  const [requestModeFilter, setRequestModeFilter] = useState("all");

  const [lessonInstructorFilter, setLessonInstructorFilter] = useState("all");
  const [lessonTypeFilter, setLessonTypeFilter] = useState("all");
  const [lessonDateFilter, setLessonDateFilter] = useState("");

  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editInstructorId, setEditInstructorId] = useState("");
  const [editLessonDate, setEditLessonDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");

  const [requests, setRequests] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [availableInstructors, setAvailableInstructors] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [bookerResponse, setBookerResponse] = useState("");

  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [lessonDate, setLessonDate] = useState("");
  const [startTime, setStartTime] = useState("");

  const getRequests = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:5000/api/lesson-requests", {
      headers: { token }
    });
    setRequests(res.data);
  };

  const getLessons = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:5000/api/lessons", {
      headers: { token }
    });
    setLessons(res.data);
  };
  const getChangeRequests = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/change-requests",
        {
          headers: { token }
        }
      );

      setChangeRequests(res.data);
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  const approveChangeRequest = async (changeRequestId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `http://localhost:5000/api/change-requests/${changeRequestId}/approve`,
        {
          booker_response:
            bookerResponse || "Promena termina je odobrena."
        },
        {
          headers: { token }
        }
      );

      alert("Promena termina je odobrena.");

      setBookerResponse("");

      getChangeRequests();
      getLessons();
    } catch (err) {
      console.log(err.response?.data || err);

      alert(
        err.response?.data?.message ||
        "Greška pri odobravanju promene termina."
      );
    }
  };

  const rejectChangeRequest = async (changeRequestId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `http://localhost:5000/api/change-requests/${changeRequestId}/reject`,
        {
          booker_response:
            bookerResponse || "Promena termina nije moguća."
        },
        {
          headers: { token }
        }
      );

      alert("Zahtev za promenu je odbijen.");

      setBookerResponse("");

      getChangeRequests();
    } catch (err) {
      console.log(err.response?.data || err);

      alert(
        err.response?.data?.message ||
        "Greška pri odbijanju zahteva."
      );
    }
  };
  const getInstructors = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:5000/api/instructors", {
      headers: { token }
    });

    setInstructors(res.data);

    if (res.data.length > 0) {
      setSelectedInstructor(res.data[0].id);
    }
  };

  const getAvailableInstructorsForRequest = async (request) => {
    try {
      const token = localStorage.getItem("token");

      const startTime = request.preferred_time.slice(0, 5);

      let endTime = "11:00";

      if (request.lesson_mode === "individual") {
        const startHour = Number(startTime.split(":")[0]);
        const lessonCount = Number(request.number_of_lessons) || 1;
        endTime = `${String(startHour + lessonCount).padStart(2, "0")}:00`;
      }

      if (request.lesson_mode === "group") {
        if (request.group_package === "2h") endTime = "12:00";
        if (request.group_package === "4h_no_lunch") endTime = "14:00";
        if (request.group_package === "4h_lunch") endTime = "16:00";
      }

      const date = request.preferred_date.split("T")[0];

      const res = await axios.get("http://localhost:5000/api/available-instructors", {
        headers: { token },
        params: {
          lesson_type: request.lesson_type,
          lesson_date: date,
          start_time: startTime,
          end_time: endTime
        }
      });

      setAvailableInstructors(res.data);

      if (res.data.length > 0) {
        setSelectedInstructor(res.data[0].id);
      } else {
        setSelectedInstructor("");
      }
    } catch (err) {
      console.log(err.response?.data || err);
      alert("Greška pri učitavanju dostupnih instruktora.");
    }
  };

  const approveRequest = async (request) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `http://localhost:5000/api/lesson-requests/${request.id}/approve`,
        {
          instructor_id: Number(selectedInstructor),
          lesson_date: getDateForBackend(request.preferred_date),
          start_time: request.preferred_time.slice(0, 5)
        },
        {
          headers: { token }
        }
      );

      alert("Zahtev je odobren i čas je zakazan.");

      getRequests();
      getLessons();
    } catch (err) {
      console.log(err.response?.data || err);

      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Greška pri odobravanju zahteva."
      );
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `http://localhost:5000/api/lesson-requests/${requestId}/reject`,
        {},
        { headers: { token } }
      );

      alert("Zahtev je odbijen.");
      getRequests();
    } catch (err) {
      console.log(err.response?.data || err);
      alert("Greška pri odbijanju zahteva.");
    }
  };

  const cancelLesson = async (lessonId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(`http://localhost:5000/api/lessons/${lessonId}`, {
        headers: { token }
      });

      alert("Čas je otkazan i obrisan.");
      getLessons();
    } catch (err) {
      console.log(err.response?.data || err);

      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Greška pri otkazivanju časa."
      );
    }
  };

  const startEditLesson = (lesson) => {
    setEditingLessonId(lesson.id);
    setEditInstructorId(lesson.instructor_id);
    setEditLessonDate(lesson.lesson_date.split("T")[0]);
    setEditStartTime(lesson.start_time);
  };

  const updateLesson = async (lessonId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/lessons/${lessonId}`,
        {
          instructor_id: Number(editInstructorId),
          lesson_date: editLessonDate,
          start_time: editStartTime
        },
        {
          headers: { token }
        }
      );

      alert("Čas je uspešno izmenjen.");

      setEditingLessonId(null);
      setEditInstructorId("");
      setEditLessonDate("");
      setEditStartTime("");

      getLessons();
    } catch (err) {
      console.log(err.response?.data || err);

      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Greška pri izmeni časa."
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

    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    return `${day}. ${month}. ${year}.`;
  };

  const formatTime = (time) => {
    if (!time) return "";

    return time.slice(0, 5);
  };
  const getDateForBackend = (date) => {
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const packageLabel = (value) => {
    if (!value) return "/";
    if (value === "2h") return "Grupna 2h: 10:00–12:00";
    if (value === "4h_no_lunch") return "Grupna 4h bez ručka: 10:00–14:00";
    if (value === "4h_lunch") return "Grupna 4h sa ručkom: 10:00–12:00 + 14:00–16:00";
    return value;
  };
  const levelLabel = (value) => {
    if (value === "beginner") return "Nivo 1";
    if (value === "intermediate") return "Nivo 2";
    if (value === "advanced") return "Nivo 3";
    return value;
  };
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      window.location.href = "/login";
      return;
    }

    const user = JSON.parse(savedUser);

    if (user.role !== "admin" && user.role !== "booker") {
      window.location.href = "/";
      return;
    }

    setCheckingAuth(false);

    getRequests();
    getLessons();
    getInstructors();
    getChangeRequests();
  }, []);

  const pendingRequests = requests.filter((request) => {
    if (request.status !== "pending") return false;

    if (
      requestTypeFilter !== "all" &&
      request.lesson_type !== requestTypeFilter
    ) {
      return false;
    }

    if (
      requestModeFilter !== "all" &&
      request.lesson_mode !== requestModeFilter
    ) {
      return false;
    }

    return true;
  });

  const filteredLessons = lessons.filter((lesson) => {
    if (
      lessonInstructorFilter !== "all" &&
      lesson.instructor_name !== lessonInstructorFilter
    ) {
      return false;
    }

    if (
      lessonTypeFilter !== "all" &&
      lesson.lesson_type !== lessonTypeFilter
    ) {
      return false;
    }

    if (
      lessonDateFilter &&
      lesson.lesson_date.split("T")[0] !== lessonDateFilter
    ) {
      return false;
    }

    return true;
  });

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600 font-semibold">Provera pristupa...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] lg:min-h-screen">
        <aside className="bg-blue-700 text-white p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-2xl bg-white text-blue-700 flex items-center justify-center font-bold text-xl">
              ⛷
            </div>

            <div>
              <h1 className="text-2xl font-bold">Ski School</h1>
              <p className="text-blue-100 text-sm">Booker panel</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3">
            <button
              onClick={() => setActiveSection("requests")}
              className={`w-full text-left rounded-2xl px-4 py-3 font-semibold ${activeSection === "requests" ? "bg-white/20" : "hover:bg-white/10"
                }`}
            >
              Novi zahtevi
            </button>

            <button
              onClick={() => setActiveSection("lessons")}
              className={`w-full text-left rounded-2xl px-4 py-3 font-semibold ${activeSection === "lessons" ? "bg-white/20" : "hover:bg-white/10"
                }`}
            >
              Zakazani časovi
            </button>

            <button
              onClick={() => setActiveSection("changeRequests")}
              className={`w-full text-left rounded-2xl px-4 py-3 font-semibold ${activeSection === "changeRequests"
                ? "bg-white/20"
                : "hover:bg-white/10"
                }`}
            >
              Promene termina
            </button>

            <button
              onClick={() => setActiveSection("calendar")}
              className={`w-full text-left rounded-2xl px-4 py-3 font-semibold ${activeSection === "calendar" ? "bg-white/20" : "hover:bg-white/10"
                }`}
            >
              Kalendar
            </button>
          </div>

          <button
            onClick={logout}
            className="mt-10 w-full bg-white text-blue-700 rounded-2xl px-4 py-3 font-bold"
          >
            Logout
          </button>
        </aside>

        <main className="p-4 sm:p-6 lg:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <p className="text-blue-600 font-semibold">Dobrodošli nazad</p>
              <h2 className="text-3xl sm:text-4xl font-bold">Pregled ski škole</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-3xl shadow p-5 text-center">
                <p className="text-3xl font-bold text-blue-700">
                  {pendingRequests.length}
                </p>
                <p className="text-sm text-slate-500">Za rešavanje</p>
              </div>

              <div className="bg-white rounded-3xl shadow p-5 text-center">
                <p className="text-3xl font-bold text-green-600">{lessons.length}</p>
                <p className="text-sm text-slate-500">Časovi</p>
              </div>

              <div className="bg-white rounded-3xl shadow p-5 text-center">
                <p className="text-3xl font-bold text-slate-800">{instructors.length}</p>
                <p className="text-sm text-slate-500">Instruktori</p>
              </div>
            </div>
          </div>

          {activeSection === "requests" && (
            <section>
              <div className="bg-white rounded-[2rem] shadow p-4 sm:p-6">
                <div className="mb-5">
                  <h3 className="text-2xl font-bold">Zahtevi koje treba rešiti</h3>
                  <p className="text-slate-500">
                    Ovde se prikazuju samo novi zahtevi koje booker treba da odobri ili odbije.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
                    <select
                      className="form-input"
                      value={requestTypeFilter}
                      onChange={(e) => setRequestTypeFilter(e.target.value)}
                    >
                      <option value="all">Svi tipovi</option>
                      <option value="ski">Ski</option>
                      <option value="snowboard">Snowboard</option>
                    </select>

                    <select
                      className="form-input"
                      value={requestModeFilter}
                      onChange={(e) => setRequestModeFilter(e.target.value)}
                    >
                      <option value="all">Svi modovi</option>
                      <option value="individual">Individualni</option>
                      <option value="group">Grupni</option>
                    </select>
                  </div>
                </div>

                {pendingRequests.length === 0 ? (
                  <div className="bg-slate-50 rounded-3xl p-8 text-center text-slate-500">
                    Nema novih zahteva za rešavanje.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="border border-slate-200 rounded-3xl p-5">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
                                pending
                              </span>

                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                {request.lesson_type}
                              </span>

                              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-semibold">
                                {request.lesson_mode}
                              </span>
                            </div>

                            <h4 className="text-xl font-bold">
                              {request.client_first_name} {request.client_last_name}
                            </h4>

                            <p className="text-slate-500">
                              {request.client_age} godina · {request.client_skill_level}
                            </p>
                          </div>

                          <div className="text-left md:text-right text-slate-600">
                            <p><b>Željeni datum:</b> {formatDate(request.preferred_date)}</p>
                            <p><b>Željeno vreme:</b> {request.preferred_time}</p>
                            <p><b>ID:</b> {request.id}</p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-700">
                          <p><b>Telefon:</b> {request.client_phone}</p>
                          <p><b>Prvi put:</b> {request.first_time ? "Da" : "Ne"}</p>
                          <p><b>Broj časova:</b> {request.number_of_lessons}</p>
                          <p><b>Paket:</b> {packageLabel(request.group_package)}</p>

                          {request.client_age < 18 && (
                            <>
                              <p><b>Roditelj:</b> {request.parent_name}</p>
                              <p><b>Telefon roditelja:</b> {request.parent_phone}</p>
                            </>
                          )}
                        </div>

                        {request.note && (
                          <p className="mt-4 bg-slate-50 rounded-2xl p-3 text-slate-700">
                            <b>Napomena:</b> {request.note}
                          </p>
                        )}

                        <div className="mt-5 bg-blue-50 rounded-3xl p-5">
                          <h5 className="font-bold mb-4">Odobri i dodeli instruktora</h5>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

                            <div>
                              <button
                                onClick={() => getAvailableInstructorsForRequest(request)}
                                className="mb-3 bg-white border border-blue-200 text-blue-700 px-4 py-2 rounded-2xl font-bold"
                              >
                                Prikaži dostupne instruktore
                              </button>

                              <select
                                className="form-input"
                                value={selectedInstructor}
                                onChange={(e) => setSelectedInstructor(e.target.value)}
                              >
                                <option value="">Izaberi instruktora</option>

                                {availableInstructors.map((instructor) => (
                                  <option key={instructor.id} value={instructor.id}>
                                    {instructor.name}
                                    {instructor.ski_license ? " · ski" : ""}
                                    {instructor.snowboard_license ? " · snowboard" : ""}
                                  </option>
                                ))}
                              </select>

                              {availableInstructors.length === 0 && (
                                <p className="text-sm text-red-600 mt-2">
                                  Nema dostupnih instruktora za ovaj termin.
                                </p>
                              )}
                            </div>

                            <input
                              disabled
                              className="form-input bg-slate-100"
                              value={`Datum: ${formatDate(request.preferred_date)}`}
                            />

                            <input
                              disabled
                              className="form-input bg-slate-100"
                              value={`Vreme: ${request.preferred_time?.slice(0, 5)}`}
                            />
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 mt-4">
                            <button
                              onClick={() => approveRequest(request)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold"
                            >
                              Odobri zahtev
                            </button>

                            <button
                              onClick={() => rejectRequest(request.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-bold"
                            >
                              Odbij zahtev
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
          {activeSection === "calendar" && (
            <section>
              <LessonsCalendar lessons={lessons} />
            </section>
          )}
          {activeSection === "lessons" && (
            <section>
              <div className="bg-white rounded-[2rem] shadow p-6">
                <div className="mb-5">
                  <h3 className="text-2xl font-bold">Zakazani časovi</h3>
                  <p className="text-slate-500">Pregled svih aktivnih zakazanih časova.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
                    <select
                      className="form-input"
                      value={lessonInstructorFilter}
                      onChange={(e) => setLessonInstructorFilter(e.target.value)}
                    >
                      <option value="all">Svi instruktori</option>

                      {instructors.map((instructor) => (
                        <option
                          key={instructor.id}
                          value={instructor.name}
                        >
                          {instructor.name}
                        </option>
                      ))}
                    </select>

                    <select
                      className="form-input"
                      value={lessonTypeFilter}
                      onChange={(e) => setLessonTypeFilter(e.target.value)}
                    >
                      <option value="all">Svi tipovi</option>
                      <option value="ski">Ski</option>
                      <option value="snowboard">Snowboard</option>
                    </select>

                    <input
                      type="date"
                      className="form-input"
                      value={lessonDateFilter}
                      onChange={(e) => setLessonDateFilter(e.target.value)}
                    />
                  </div>
                </div>

                {filteredLessons.length === 0 ? (
                  <div className="bg-slate-50 rounded-3xl p-8 text-center text-slate-500">
                    Nema zakazanih časova.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    {filteredLessons.map((lesson) => (
                      <div key={lesson.id} className="border border-slate-200 rounded-3xl p-4 sm:p-5 hover:shadow-md transition bg-white overflow-hidden">
                        <div className="flex justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                {lesson.lesson_type}
                              </span>

                              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-semibold">
                                {lesson.lesson_mode}
                              </span>
                            </div>

                            <h4 className="text-xl font-bold">
                              {lesson.client_first_name} {lesson.client_last_name}
                            </h4>

                            <p className="text-slate-500">
                              {lesson.client_age} godina · {lesson.client_skill_level}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-blue-700">{formatDate(lesson.lesson_date)}</p>
                            <p className="text-slate-600">{lesson.start_time}–{lesson.end_time}</p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">
                          <p><b>Telefon:</b> {lesson.client_phone}</p>
                          <p><b>Instruktor:</b> {lesson.instructor_name}</p>
                          <p><b>Prvi put:</b> {lesson.first_time ? "Da" : "Ne"}</p>
                          <p><b>Paket:</b> {packageLabel(lesson.group_package)}</p>

                          {lesson.client_age < 18 && (
                            <>
                              <p><b>Roditelj:</b> {lesson.parent_name}</p>
                              <p><b>Telefon roditelja:</b> {lesson.parent_phone}</p>
                            </>
                          )}
                        </div>

                        {lesson.note && (
                          <p className="mt-4 bg-slate-50 rounded-2xl p-3 text-slate-700">
                            <b>Napomena:</b> {lesson.note}
                          </p>
                        )}

                        {editingLessonId === lesson.id ? (
                          <div className="mt-5 bg-blue-50 rounded-3xl p-5">
                            <h5 className="font-bold mb-4">
                              Izmeni čas
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <select
                                className="form-input"
                                value={editInstructorId}
                                onChange={(e) => setEditInstructorId(e.target.value)}
                              >
                                {instructors.map((instructor) => (
                                  <option
                                    key={instructor.id}
                                    value={instructor.id}
                                  >
                                    {instructor.name}
                                    {instructor.ski_license ? " · ski" : ""}
                                    {instructor.snowboard_license ? " · snowboard" : ""}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="date"
                                className="form-input"
                                value={editLessonDate}
                                onChange={(e) => setEditLessonDate(e.target.value)}
                              />

                              <input
                                type="time"
                                className="form-input"
                                value={editStartTime}
                                onChange={(e) => setEditStartTime(e.target.value)}
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-4">
                              <button
                                onClick={() => updateLesson(lesson.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold"
                              >
                                Sačuvaj izmene
                              </button>

                              <button
                                onClick={() => {
                                  setEditingLessonId(null);
                                  setEditInstructorId("");
                                  setEditLessonDate("");
                                  setEditStartTime("");
                                }}
                                className="bg-white border border-blue-200 text-blue-700 px-5 py-3 rounded-2xl font-bold"
                              >
                                Otkaži izmenu
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-3 mt-5">
                            <button
                              onClick={() => startEditLesson(lesson)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold"
                            >
                              Izmeni čas
                            </button>

                            <button
                              onClick={() => cancelLesson(lesson.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-bold"
                            >
                              Otkaži čas
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
          {activeSection === "changeRequests" && (
            <section>
              <div className="bg-white rounded-[2rem] shadow p-6">
                <div className="mb-5">
                  <h3 className="text-2xl font-bold">
                    Zahtevi za promenu termina
                  </h3>

                  <p className="text-slate-500">
                    Klijenti mogu tražiti promenu datuma ili vremena časa.
                  </p>
                </div>

                {changeRequests.length === 0 ? (
                  <div className="bg-slate-50 rounded-3xl p-8 text-center text-slate-500">
                    Nema zahteva za promenu termina.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {changeRequests.map((changeRequest) => (
                      <div
                        key={changeRequest.id}
                        className="border border-blue-100 rounded-3xl p-5"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div>
                            <h4 className="font-bold text-xl">
                              {changeRequest.client_first_name}{" "}
                              {changeRequest.client_last_name}
                            </h4>

                            <p className="text-slate-500">
                              {changeRequest.lesson_type}
                            </p>
                          </div>

                          <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-bold">
                            {changeRequest.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                          <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-sm text-slate-500 mb-1">
                              Trenutni termin
                            </p>

                            <p className="font-bold">
                              {formatDate(changeRequest.lesson_date)}
                            </p>

                            <p className="text-slate-700">
                              {formatTime(changeRequest.start_time)} -{" "}
                              {formatTime(changeRequest.end_time)}
                            </p>
                          </div>

                          <div className="bg-blue-50 rounded-2xl p-4">
                            <p className="text-sm text-slate-500 mb-1">
                              Traženi termin
                            </p>

                            <p className="font-bold">
                              {formatDate(changeRequest.requested_date)}
                            </p>

                            <p className="text-slate-700">
                              {formatTime(changeRequest.requested_time)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 bg-slate-50 rounded-2xl p-4">
                          <p className="text-sm text-slate-500 mb-1">
                            Razlog klijenta
                          </p>

                          <p>{changeRequest.reason}</p>
                        </div>

                        {changeRequest.status === "pending" && (
                          <>
                            <textarea
                              className="form-input mt-4 min-h-24"
                              placeholder="Odgovor bookera"
                              value={bookerResponse}
                              onChange={(e) =>
                                setBookerResponse(e.target.value)
                              }
                            />

                            <div className="flex flex-col sm:flex-row gap-3 mt-4">
                              <button
                                onClick={() =>
                                  approveChangeRequest(changeRequest.id)
                                }
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold"
                              >
                                Odobri promenu
                              </button>

                              <button
                                onClick={() =>
                                  rejectChangeRequest(changeRequest.id)
                                }
                                className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-bold"
                              >
                                Odbij zahtev
                              </button>
                            </div>
                          </>
                        )}

                        {changeRequest.booker_response && (
                          <div className="mt-4 bg-green-50 rounded-2xl p-4">
                            <p className="text-sm text-slate-500 mb-1">
                              Odgovor bookera
                            </p>

                            <p>{changeRequest.booker_response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>

      <style jsx>{`
        .form-input {
          width: 100%;
          border: 1px solid #dbeafe;
          padding: 14px;
          border-radius: 16px;
          outline: none;
          background: white;
          color: black;
          font-size: 16px;
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