"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function ClientPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [user, setUser] = useState(null);

  const [requests, setRequests] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);

  const [changeLessonId, setChangeLessonId] = useState(null);
  const [requestedDate, setRequestedDate] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [changeReason, setChangeReason] = useState("");

  // PROFIL
  const [profile, setProfile] = useState(null);

  const [editingProfile, setEditingProfile] =
    useState(false);

  const [profileName, setProfileName] =
    useState("");

  const [profileEmail, setProfileEmail] =
    useState("");

  // LOZINKA
  const [showPasswordForm, setShowPasswordForm] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");


  // ==========================================
  // PROFIL
  // ==========================================

  const getMyProfile = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/auth/profile",
        {
          headers: { token }
        }
      );

      setProfile(res.data);
      setProfileName(res.data.name || "");
      setProfileEmail(res.data.email || "");

    } catch (err) {
      console.log(
        err.response?.data || err
      );

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        logout();
      }
    }
  };


  const updateProfile = async () => {
    try {
      if (
        !profileName.trim() ||
        !profileEmail.trim()
      ) {
        alert("Ime i email su obavezni.");
        return;
      }

      const token =
        localStorage.getItem("token");

      const res = await axios.put(
        "http://localhost:5000/api/auth/profile",
        {
          name: profileName,
          email: profileEmail
        },
        {
          headers: { token }
        }
      );

      const updatedUser = {
        ...user,
        ...res.data.user
      };

      setProfile({
        ...profile,
        ...res.data.user
      });

      setUser(updatedUser);

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setEditingProfile(false);

      alert(res.data.message);

    } catch (err) {
      console.log(
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Greška pri izmeni profila."
      );
    }
  };


  const changePassword = async () => {
    try {
      if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        alert("Popuni sva polja.");
        return;
      }

      if (newPassword.length < 6) {
        alert(
          "Nova lozinka mora imati najmanje 6 karaktera."
        );
        return;
      }

      if (newPassword !== confirmPassword) {
        alert(
          "Nova lozinka i potvrda se ne podudaraju."
        );
        return;
      }

      const token =
        localStorage.getItem("token");

      const res = await axios.put(
        "http://localhost:5000/api/auth/change-password",
        {
          currentPassword,
          newPassword,
          confirmPassword
        },
        {
          headers: { token }
        }
      );

      alert(res.data.message);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);

    } catch (err) {
      console.log(
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Greška pri promeni lozinke."
      );
    }
  };


  // ==========================================
  // ZAHTEVI
  // ==========================================

  const getMyRequests = async () => {
    try {
      const token =
        localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/lesson-requests/my",
        {
          headers: { token }
        }
      );

      setRequests(res.data);

    } catch (err) {
      console.log(
        err.response?.data || err
      );
    }
  };


  // ==========================================
  // ČASOVI
  // ==========================================

  const getMyLessons = async () => {
    try {
      const token =
        localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/lessons/client/my",
        {
          headers: { token }
        }
      );

      setLessons(res.data);

    } catch (err) {
      console.log(
        err.response?.data || err
      );
    }
  };


  // ==========================================
  // ZAHTEVI ZA PROMENU TERMINA
  // ==========================================

  const getMyChangeRequests = async () => {
    try {
      const token =
        localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:5000/api/change-requests/my",
        {
          headers: { token }
        }
      );

      setChangeRequests(res.data);

    } catch (err) {
      console.log(
        err.response?.data || err
      );
    }
  };


  const sendChangeRequest = async (lessonId) => {
    try {
      if (
        !requestedDate ||
        !requestedTime ||
        !changeReason
      ) {
        alert(
          "Popuni datum, vreme i razlog promene."
        );
        return;
      }

      const token =
        localStorage.getItem("token");

      await axios.post(
        "http://localhost:5000/api/change-requests",
        {
          lesson_id: lessonId,
          requested_date: requestedDate,
          requested_time: requestedTime,
          reason: changeReason
        },
        {
          headers: { token }
        }
      );

      alert(
        "Zahtev za promenu termina je poslat."
      );

      setChangeLessonId(null);
      setRequestedDate("");
      setRequestedTime("");
      setChangeReason("");

      getMyChangeRequests();

    } catch (err) {
      console.log(
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Greška pri slanju zahteva za promenu."
      );
    }
  };


  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/";
  };


  // ==========================================
  // FORMATIRANJE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
      "sr-RS"
    );
  };


  const formatTime = (time) => {
    if (!time) return "";

    return time.slice(0, 5);
  };


  const packageLabel = (value) => {
    if (!value) return "/";

    if (value === "2h")
      return "Grupna 2h";

    if (value === "4h_no_lunch")
      return "Grupna 4h bez ručka";

    if (value === "4h_lunch")
      return "Grupna 4h sa ručkom";

    return value;
  };


  // ==========================================
  // AUTH
  // ==========================================

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    const savedUser =
      localStorage.getItem("user");

    if (!token || !savedUser) {
      window.location.href = "/login";
      return;
    }

    const parsedUser =
      JSON.parse(savedUser);

    if (parsedUser.role !== "client") {
      window.location.href = "/";
      return;
    }

    setUser(parsedUser);
    setCheckingAuth(false);

    getMyProfile();
    getMyRequests();
    getMyLessons();
    getMyChangeRequests();

  }, []);


  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600 font-semibold">
          Provera pristupa...
        </p>
      </div>
    );
  }


  const pendingCount =
    requests.filter(
      (request) =>
        request.status === "pending"
    ).length;


  const approvedCount =
    requests.filter(
      (request) =>
        request.status === "approved"
    ).length;


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 text-slate-900">

      {/* NAVBAR */}

      <nav className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6">

        <a
          href="/"
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            ⛷
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Ski School
          </h1>
        </a>


        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">

          <a
            href="/booking"
            className="bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold shadow text-center w-full sm:w-auto"
          >
            Zakaži čas
          </a>

          <button
            onClick={logout}
            className="bg-white text-slate-800 px-5 py-3 rounded-xl font-semibold shadow w-full sm:w-auto"
          >
            Logout
          </button>

        </div>

      </nav>


      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">

        {/* ================================= */}
        {/* WELCOME */}
        {/* ================================= */}

        <section className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-8 mb-8">

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-center">

            <div>

              <p className="text-blue-600 font-semibold mb-2">
                Client panel
              </p>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                Dobrodošli, {user?.name}
              </h2>

              <p className="text-slate-600 mt-4 text-base sm:text-lg max-w-2xl">
                Ovde možeš da pratiš svoje zahteve,
                potvrđene časove, svoj profil i detalje
                termina koje ti je ski škola dodelila.
              </p>


              <div className="flex flex-col sm:flex-row gap-3 mt-6">

                <a
                  href="/booking"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold text-center"
                >
                  Zakaži novi čas
                </a>

                <a
                  href="/"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-4 rounded-2xl font-bold text-center"
                >
                  Početna
                </a>

              </div>

            </div>


            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

              <div className="bg-blue-50 rounded-3xl p-5 text-center">

                <p className="text-3xl font-bold text-blue-700">
                  {lessons.length}
                </p>

                <p className="text-sm text-slate-500">
                  Časovi
                </p>

              </div>


              <div className="bg-yellow-50 rounded-3xl p-5 text-center">

                <p className="text-3xl font-bold text-yellow-700">
                  {pendingCount}
                </p>

                <p className="text-sm text-slate-500">
                  Pending
                </p>

              </div>


              <div className="bg-green-50 rounded-3xl p-5 text-center">

                <p className="text-3xl font-bold text-green-700">
                  {approvedCount}
                </p>

                <p className="text-sm text-slate-500">
                  Approved
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ================================= */}
        {/* MOJ PROFIL */}
        {/* ================================= */}

        <section className="bg-white rounded-[2rem] shadow p-6 mb-8">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

            <div>

              <h3 className="text-2xl font-bold">
                Moj profil
              </h3>

              <p className="text-slate-500">
                Pregled i upravljanje podacima
                korisničkog naloga.
              </p>

            </div>


            {!editingProfile && (
              <button
                onClick={() =>
                  setEditingProfile(true)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold"
              >
                Izmeni podatke
              </button>
            )}

          </div>


          {!editingProfile ? (

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="bg-slate-50 rounded-2xl p-5">

                <p className="text-sm text-slate-500 mb-1">
                  Ime i prezime
                </p>

                <p className="font-bold text-lg">
                  {profile?.name || "/"}
                </p>

              </div>


              <div className="bg-slate-50 rounded-2xl p-5">

                <p className="text-sm text-slate-500 mb-1">
                  Email
                </p>

                <p className="font-bold text-lg break-all">
                  {profile?.email || "/"}
                </p>

              </div>


              <div className="bg-slate-50 rounded-2xl p-5">

                <p className="text-sm text-slate-500 mb-1">
                  Uloga
                </p>

                <p className="font-bold text-lg">
                  Klijent
                </p>

              </div>


              <div className="bg-slate-50 rounded-2xl p-5">

                <p className="text-sm text-slate-500 mb-1">
                  Status naloga
                </p>

                <p
                  className={
                    profile?.is_active
                      ? "font-bold text-lg text-green-700"
                      : "font-bold text-lg text-red-700"
                  }
                >
                  {profile?.is_active
                    ? "Aktivan"
                    : "Deaktiviran"}
                </p>

              </div>

            </div>

          ) : (

            <div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block font-semibold mb-2">
                    Ime i prezime
                  </label>

                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) =>
                      setProfileName(
                        e.target.value
                      )
                    }
                    className="client-input"
                  />

                </div>


                <div>

                  <label className="block font-semibold mb-2">
                    Email
                  </label>

                  <input
                    type="email"
                    value={profileEmail}
                    disabled={
                      profile?.google_only
                    }
                    onChange={(e) =>
                      setProfileEmail(
                        e.target.value
                      )
                    }
                    className={
                      profile?.google_only
                        ? "client-input opacity-60 cursor-not-allowed"
                        : "client-input"
                    }
                  />

                  {profile?.google_only && (
                    <p className="text-sm text-slate-500 mt-2">
                      Email Google naloga nije moguće
                      menjati kroz aplikaciju.
                    </p>
                  )}

                </div>

              </div>


              <div className="flex flex-col sm:flex-row gap-3 mt-5">

                <button
                  onClick={updateProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold"
                >
                  Sačuvaj izmene
                </button>

                <button
                  onClick={() => {
                    setEditingProfile(false);

                    setProfileName(
                      profile?.name || ""
                    );

                    setProfileEmail(
                      profile?.email || ""
                    );
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-3 rounded-2xl font-bold"
                >
                  Otkaži
                </button>

              </div>

            </div>
          )}


          {/* PROMENA LOZINKE */}

          <div className="border-t border-slate-200 mt-8 pt-6">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div>

                <h4 className="text-xl font-bold">
                  Lozinka
                </h4>

                <p className="text-slate-500">
                  Promeni lozinku svog korisničkog
                  naloga.
                </p>

              </div>


              {!profile?.google_only &&
                !showPasswordForm && (

                  <button
                    onClick={() =>
                      setShowPasswordForm(
                        true
                      )
                    }
                    className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold"
                  >
                    Promeni lozinku
                  </button>

                )}

            </div>


            {profile?.google_only && (

              <div className="mt-4 bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl p-4">

                Ovaj nalog koristi Google prijavu.
                Lozinkom se upravlja preko Google
                naloga.

              </div>

            )}


            {showPasswordForm &&
              !profile?.google_only && (

                <div className="mt-5">

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div>

                      <label className="block font-semibold mb-2">
                        Trenutna lozinka
                      </label>

                      <input
                        type="password"
                        value={
                          currentPassword
                        }
                        onChange={(e) =>
                          setCurrentPassword(
                            e.target.value
                          )
                        }
                        className="client-input"
                      />

                    </div>


                    <div>

                      <label className="block font-semibold mb-2">
                        Nova lozinka
                      </label>

                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) =>
                          setNewPassword(
                            e.target.value
                          )
                        }
                        className="client-input"
                      />

                    </div>


                    <div>

                      <label className="block font-semibold mb-2">
                        Potvrdi novu lozinku
                      </label>

                      <input
                        type="password"
                        value={
                          confirmPassword
                        }
                        onChange={(e) =>
                          setConfirmPassword(
                            e.target.value
                          )
                        }
                        className="client-input"
                      />

                    </div>

                  </div>


                  <div className="flex flex-col sm:flex-row gap-3 mt-5">

                    <button
                      onClick={
                        changePassword
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold"
                    >
                      Sačuvaj novu lozinku
                    </button>


                    <button
                      onClick={() => {
                        setShowPasswordForm(
                          false
                        );

                        setCurrentPassword(
                          ""
                        );

                        setNewPassword("");

                        setConfirmPassword(
                          ""
                        );
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-3 rounded-2xl font-bold"
                    >
                      Otkaži
                    </button>

                  </div>

                </div>

              )}

          </div>

        </section>


        {/* ================================= */}
        {/* ZAKAZANI ČASOVI */}
        {/* ================================= */}

        <section className="bg-white rounded-[2rem] shadow p-6 mb-8">

          <div className="mb-5">

            <h3 className="text-2xl font-bold">
              Moji zakazani časovi
            </h3>

            <p className="text-slate-500">
              Potvrđeni časovi koje ti je ski
              škola dodelila.
            </p>

          </div>


          {lessons.length === 0 ? (

            <div className="bg-slate-50 rounded-3xl p-8 text-center text-slate-500">
              Još nemaš potvrđene časove.
            </div>

          ) : (

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

              {lessons.map((lesson) => (

                <div
                  key={lesson.id}
                  className="border border-slate-200 rounded-3xl p-4 sm:p-5 hover:shadow-md transition overflow-hidden"
                >

                  <div className="flex flex-col sm:flex-row sm:justify-between gap-4">

                    <div>

                      <div className="flex flex-wrap gap-2 mb-2">

                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {lesson.lesson_type}
                        </span>

                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {lesson.lesson_mode}
                        </span>

                      </div>


                      <h4 className="text-xl font-bold">
                        {lesson.client_first_name}{" "}
                        {lesson.client_last_name}
                      </h4>


                      <p className="text-slate-500">
                        Instruktor:{" "}
                        {lesson.instructor_name}
                      </p>

                    </div>


                    <div className="text-left sm:text-right">

                      <p className="font-bold text-blue-700">
                        {formatDate(
                          lesson.lesson_date
                        )}
                      </p>

                      <p className="text-slate-600">
                        {formatTime(
                          lesson.start_time
                        )}
                        –
                        {formatTime(
                          lesson.end_time
                        )}
                      </p>

                    </div>

                  </div>


                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">

                    <p>
                      <b>Status:</b>{" "}
                      {lesson.status}
                    </p>

                    <p>
                      <b>Paket:</b>{" "}
                      {packageLabel(
                        lesson.group_package
                      )}
                    </p>

                    <p>
                      <b>Nivo:</b>{" "}
                      {
                        lesson.client_skill_level
                      }
                    </p>

                    <p>
                      <b>Prvi put:</b>{" "}
                      {lesson.first_time
                        ? "Da"
                        : "Ne"}
                    </p>

                  </div>


                  {lesson.note && (

                    <p className="mt-4 bg-slate-50 rounded-2xl p-3 text-slate-700">
                      <b>Napomena:</b>{" "}
                      {lesson.note}
                    </p>

                  )}


                  {changeLessonId ===
                  lesson.id ? (

                    <div className="mt-5 bg-blue-50 rounded-3xl p-5">

                      <h5 className="font-bold mb-4">
                        Zahtev za promenu
                        termina
                      </h5>


                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                        <input
                          type="date"
                          className="client-input"
                          value={
                            requestedDate
                          }
                          onChange={(e) =>
                            setRequestedDate(
                              e.target.value
                            )
                          }
                        />


                        <input
                          type="time"
                          className="client-input"
                          value={
                            requestedTime
                          }
                          onChange={(e) =>
                            setRequestedTime(
                              e.target.value
                            )
                          }
                        />


                        <textarea
                          className="client-input md:col-span-2 min-h-24"
                          placeholder="Razlog promene termina"
                          value={changeReason}
                          onChange={(e) =>
                            setChangeReason(
                              e.target.value
                            )
                          }
                        />

                      </div>


                      <div className="flex flex-col sm:flex-row gap-3 mt-4">

                        <button
                          onClick={() =>
                            sendChangeRequest(
                              lesson.id
                            )
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold"
                        >
                          Pošalji zahtev
                        </button>


                        <button
                          onClick={() => {
                            setChangeLessonId(
                              null
                            );

                            setRequestedDate(
                              ""
                            );

                            setRequestedTime(
                              ""
                            );

                            setChangeReason(
                              ""
                            );
                          }}
                          className="bg-white border border-blue-200 text-blue-700 px-5 py-3 rounded-2xl font-bold"
                        >
                          Otkaži
                        </button>

                      </div>

                    </div>

                  ) : (

                    <button
                      onClick={() => {
                        setChangeLessonId(
                          lesson.id
                        );

                        setRequestedDate("");

                        setRequestedTime("");

                        setChangeReason("");
                      }}
                      className="mt-5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-3 rounded-2xl font-bold"
                    >
                      Zatraži promenu termina
                    </button>

                  )}

                </div>

              ))}

            </div>

          )}

        </section>


        {/* ================================= */}
        {/* PROMENE TERMINA */}
        {/* ================================= */}

        <section className="bg-white rounded-[2rem] shadow p-6 mb-8">

          <div className="mb-5">

            <h3 className="text-2xl font-bold">
              Moji zahtevi za promenu termina
            </h3>

            <p className="text-slate-500">
              Ovde vidiš status zahteva za
              promenu termina i odgovor bookera.
            </p>

          </div>


          {changeRequests.length === 0 ? (

            <div className="bg-slate-50 rounded-3xl p-8 text-center text-slate-500">
              Nemaš poslatih zahteva za
              promenu termina.
            </div>

          ) : (

            <div className="space-y-4">

              {changeRequests.map(
                (changeRequest) => (

                  <div
                    key={changeRequest.id}
                    className="border border-slate-200 rounded-3xl p-5"
                  >

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                      <div>

                        <span
                          className={`inline-block mb-2 px-3 py-1 rounded-full text-sm font-bold ${
                            changeRequest.status ===
                            "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : changeRequest.status ===
                                "approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {
                            changeRequest.status
                          }
                        </span>


                        <h4 className="text-xl font-bold">
                          Promena termina
                        </h4>


                        <p className="text-slate-500">
                          {
                            changeRequest.lesson_type
                          }
                        </p>

                      </div>

                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">

                      <div className="bg-slate-50 rounded-2xl p-4">

                        <p className="text-sm text-slate-500 mb-1">
                          Stari termin
                        </p>

                        <p className="font-bold">
                          {formatDate(
                            changeRequest.lesson_date
                          )}
                        </p>

                        <p className="text-slate-700">
                          {formatTime(
                            changeRequest.start_time
                          )}
                          –
                          {formatTime(
                            changeRequest.end_time
                          )}
                        </p>

                      </div>


                      <div className="bg-blue-50 rounded-2xl p-4">

                        <p className="text-sm text-slate-500 mb-1">
                          Traženi termin
                        </p>

                        <p className="font-bold">
                          {formatDate(
                            changeRequest.requested_date
                          )}
                        </p>

                        <p className="text-slate-700">
                          {formatTime(
                            changeRequest.requested_time
                          )}
                        </p>

                      </div>

                    </div>


                    <div className="mt-4 bg-slate-50 rounded-2xl p-4">

                      <p className="text-sm text-slate-500 mb-1">
                        Tvoj razlog
                      </p>

                      <p>
                        {changeRequest.reason}
                      </p>

                    </div>


                    {changeRequest.booker_response && (

                      <div className="mt-4 bg-green-50 rounded-2xl p-4">

                        <p className="text-sm text-slate-500 mb-1">
                          Odgovor bookera
                        </p>

                        <p>
                          {
                            changeRequest.booker_response
                          }
                        </p>

                      </div>

                    )}

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* ================================= */}
        {/* MOJI ZAHTEVI */}
        {/* ================================= */}

        <section className="bg-white rounded-[2rem] shadow p-6">

          <div className="mb-5">

            <h3 className="text-2xl font-bold">
              Moji zahtevi
            </h3>

            <p className="text-slate-500">
              Zahtevi koje si poslao ski školi
              i njihov trenutni status.
            </p>

          </div>


          {requests.length === 0 ? (

            <div className="bg-slate-50 rounded-3xl p-8 text-center text-slate-500">
              Još nemaš poslatih zahteva.
            </div>

          ) : (

            <div className="space-y-4">

              {requests.map((request) => (

                <div
                  key={request.id}
                  className="border border-slate-200 rounded-3xl p-5"
                >

                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                    <div>

                      <div className="flex flex-wrap gap-2 mb-2">

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            request.status ===
                            "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : request.status ===
                                "approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {request.status}
                        </span>


                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {
                            request.lesson_type
                          }
                        </span>


                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {
                            request.lesson_mode
                          }
                        </span>

                      </div>


                      <h4 className="text-xl font-bold">
                        {
                          request.client_first_name
                        }{" "}
                        {
                          request.client_last_name
                        }
                      </h4>


                      <p className="text-slate-500">
                        {request.client_age} godina
                        {" · "}
                        {
                          request.client_skill_level
                        }
                      </p>

                    </div>


                    <div className="text-left md:text-right text-slate-600">

                      <p>
                        <b>Željeni datum:</b>{" "}
                        {formatDate(
                          request.preferred_date
                        )}
                      </p>

                      <p>
                        <b>Željeno vreme:</b>{" "}
                        {formatTime(
                          request.preferred_time
                        )}
                      </p>

                    </div>

                  </div>


                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-700">

                    <p>
                      <b>Broj časova:</b>{" "}
                      {
                        request.number_of_lessons
                      }
                    </p>

                    <p>
                      <b>Paket:</b>{" "}
                      {packageLabel(
                        request.group_package
                      )}
                    </p>

                    <p>
                      <b>Prvi put:</b>{" "}
                      {request.first_time
                        ? "Da"
                        : "Ne"}
                    </p>


                    {request.parent_name && (

                      <p>
                        <b>Roditelj:</b>{" "}
                        {request.parent_name}
                      </p>

                    )}

                  </div>


                  {request.note && (

                    <p className="mt-4 bg-slate-50 rounded-2xl p-3 text-slate-700">
                      <b>Napomena:</b>{" "}
                      {request.note}
                    </p>

                  )}

                </div>

              ))}

            </div>

          )}

        </section>

      </main>


      <style jsx>{`
        .client-input {
          width: 100%;
          border: 1px solid #dbeafe;
          padding: 14px;
          border-radius: 16px;
          outline: none;
          background: white;
          color: black;
        }

        .client-input::placeholder {
          color: #64748b;
          opacity: 1;
        }

        .client-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .client-input:disabled {
          background: #f1f5f9;
        }
      `}</style>

    </div>
  );
}