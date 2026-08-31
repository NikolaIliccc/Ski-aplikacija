"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function AdministratorPage() {
  const API = "http://localhost:5000";

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");

  const [users, setUsers] = useState([]);
  const [instructors, setInstructors] = useState([]);

  const [auditLogs, setAuditLogs] =
    useState([]);

  const [loadingAuditLogs, setLoadingAuditLogs] =
    useState(false);

  const [auditSearch, setAuditSearch] =
    useState("");

  const [auditRoleFilter, setAuditRoleFilter] =
    useState("all");

  const [auditActionFilter, setAuditActionFilter] =
    useState("all");

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingInstructors, setLoadingInstructors] = useState(false);

  // =====================================================
  // NOVI KORISNIK
  // =====================================================

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("client");

  // =====================================================
  // IZMENA KORISNIKA
  // =====================================================

  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState("");

  // =====================================================
  // RESET LOZINKE
  // =====================================================

  const [resetPasswordUserId, setResetPasswordUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // =====================================================
  // FILTER KORISNIKA
  // =====================================================

  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");

  // =====================================================
  // NOVI INSTRUKTOR
  // =====================================================

  const [newInstructorName, setNewInstructorName] = useState("");
  const [newInstructorEmail, setNewInstructorEmail] = useState("");
  const [newInstructorPassword, setNewInstructorPassword] = useState("");

  const [newInstructorSki, setNewInstructorSki] = useState(true);
  const [newInstructorSnowboard, setNewInstructorSnowboard] =
    useState(false);

  const [newInstructorExperience, setNewInstructorExperience] =
    useState("beginner");

  // =====================================================
  // IZMENA INSTRUKTORA
  // =====================================================

  const [editingInstructorId, setEditingInstructorId] = useState(null);

  const [editInstructorName, setEditInstructorName] = useState("");
  const [editInstructorEmail, setEditInstructorEmail] = useState("");

  const [editInstructorSki, setEditInstructorSki] = useState(false);
  const [editInstructorSnowboard, setEditInstructorSnowboard] =
    useState(false);

  const [editInstructorExperience, setEditInstructorExperience] =
    useState("beginner");

  const [editInstructorImageUrl, setEditInstructorImageUrl] =
    useState("");

  const [uploadingInstructorImage, setUploadingInstructorImage] =
    useState(false);

  // =====================================================
  // BRISANJE INSTRUKTORA
  // =====================================================

  const [deleteInstructorId, setDeleteInstructorId] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");

  // =====================================================
  // FILTER INSTRUKTORA
  // =====================================================

  const [instructorSearch, setInstructorSearch] = useState("");

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("token");
  };

  // =====================================================
  // GET USERS
  // =====================================================

  const getUsers = async () => {
    try {
      setLoadingUsers(true);

      const token = getToken();

      const res = await axios.get(`${API}/api/admin/users`, {
        headers: {
          token
        }
      });

      setUsers(res.data);
    } catch (err) {
      console.log(
        "GET USERS ERROR:",
        err.response?.data || err
      );

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/login";
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  // =====================================================
  // ADD USER
  // =====================================================

  const addUser = async () => {
    try {
      if (
        !newUserName.trim() ||
        !newUserEmail.trim() ||
        !newUserPassword
      ) {
        alert("Popunite ime, email i lozinku.");

        return;
      }

      if (newUserPassword.length < 6) {
        alert("Lozinka mora imati najmanje 6 karaktera.");

        return;
      }

      const token = getToken();

      await axios.post(
        `${API}/api/admin/users`,
        {
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role: newUserRole
        },
        {
          headers: {
            token
          }
        }
      );

      alert("Korisnik je uspešno dodat.");

      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("client");

      getUsers();
    } catch (err) {
      console.log(
        "ADD USER ERROR:",
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Greška pri dodavanju korisnika."
      );
    }
  };

  // =====================================================
  // START EDIT USER
  // =====================================================

  const startEditUser = (user) => {
    setEditingUserId(user.id);

    setEditUserName(user.name || "");
    setEditUserEmail(user.email || "");
    setEditUserRole(user.role || "client");

    setResetPasswordUserId(null);
  };

  // =====================================================
  // UPDATE USER
  // =====================================================

  const updateUser = async (userId) => {
    try {
      if (!editUserName.trim() || !editUserEmail.trim()) {
        alert("Ime i email su obavezni.");

        return;
      }

      const token = getToken();

      await axios.put(
        `${API}/api/admin/users/${userId}`,
        {
          name: editUserName.trim(),
          email: editUserEmail.trim(),
          role: editUserRole
        },
        {
          headers: {
            token
          }
        }
      );

      alert("Korisnik je uspešno izmenjen.");

      setEditingUserId(null);

      getUsers();
      getInstructors();
    } catch (err) {
      console.log(
        "UPDATE USER ERROR:",
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Greška pri izmeni korisnika."
      );
    }
  };

  // =====================================================
  // ACTIVATE / DEACTIVATE USER
  // =====================================================

  const toggleUserStatus = async (user) => {
    try {
      const newStatus = user.is_active === false;

      const actionText = newStatus
        ? "aktivirate"
        : "deaktivirate";

      const confirmed = window.confirm(
        `Da li želite da ${actionText} nalog korisnika ${user.name}?`
      );

      if (!confirmed) {
        return;
      }

      const token = getToken();

      await axios.patch(
        `${API}/api/admin/users/${user.id}/status`,
        {
          is_active: newStatus
        },
        {
          headers: {
            token
          }
        }
      );

      alert(
        newStatus
          ? "Korisnički nalog je aktiviran."
          : "Korisnički nalog je deaktiviran."
      );

      getUsers();
      getInstructors();
    } catch (err) {
      console.log(
        "STATUS USER ERROR:",
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        "Greška pri promeni statusa korisnika."
      );
    }
  };

  // =====================================================
  // RESET PASSWORD
  // =====================================================

  const resetUserPassword = async (userId) => {
    try {
      if (!newPassword) {
        alert("Unesite novu lozinku.");

        return;
      }

      if (newPassword.length < 6) {
        alert("Lozinka mora imati najmanje 6 karaktera.");

        return;
      }

      const token = getToken();

      await axios.patch(
        `${API}/api/admin/users/${userId}/password`,
        {
          password: newPassword
        },
        {
          headers: {
            token
          }
        }
      );

      alert("Lozinka je uspešno promenjena.");

      setResetPasswordUserId(null);
      setNewPassword("");
    } catch (err) {
      console.log(
        "RESET PASSWORD ERROR:",
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Greška pri promeni lozinke."
      );
    }
  };

  // =====================================================
  // DELETE USER
  // =====================================================

  const deleteUser = async (user) => {
    try {
      const confirmed = window.confirm(
        `Da li ste sigurni da želite da obrišete korisnika ${user.name}?`
      );

      if (!confirmed) {
        return;
      }

      const token = getToken();

      await axios.delete(
        `${API}/api/admin/users/${user.id}`,
        {
          headers: {
            token
          }
        }
      );

      alert("Korisnik je uspešno obrisan.");

      getUsers();
    } catch (err) {
      console.log(
        "DELETE USER ERROR:",
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Greška pri brisanju korisnika."
      );
    }
  };

  // =====================================================
  // GET INSTRUCTORS
  // =====================================================

  const getInstructors = async () => {
    try {
      setLoadingInstructors(true);

      const token = getToken();

      const res = await axios.get(
        `${API}/api/instructors`,
        {
          headers: {
            token
          }
        }
      );

      setInstructors(res.data);
    } catch (err) {
      console.log(
        "GET INSTRUCTORS ERROR:",
        err.response?.data || err
      );
    } finally {
      setLoadingInstructors(false);
    }
  };

  // =====================================================
  // ADD INSTRUCTOR
  // =====================================================

  const addInstructor = async () => {
    try {
      if (
        !newInstructorName.trim() ||
        !newInstructorEmail.trim() ||
        !newInstructorPassword
      ) {
        alert(
          "Popunite ime, email i lozinku instruktora."
        );

        return;
      }

      if (newInstructorPassword.length < 6) {
        alert("Lozinka mora imati najmanje 6 karaktera.");

        return;
      }

      if (
        !newInstructorSki &&
        !newInstructorSnowboard
      ) {
        alert(
          "Instruktor mora imati najmanje jednu licencu."
        );

        return;
      }

      const token = getToken();

      // 1. kreiranje korisničkog naloga sa instructor rolom
      const userRes = await axios.post(
        `${API}/api/admin/users`,
        {
          name: newInstructorName.trim(),
          email: newInstructorEmail.trim(),
          password: newInstructorPassword,
          role: "instructor"
        },
        {
          headers: {
            token
          }
        }
      );

      const userId = userRes.data.user.id;

      try {
        // 2. kreiranje instructor zapisa
        await axios.post(
          `${API}/api/instructors`,
          {
            user_id: userId,

            ski_license: newInstructorSki,

            snowboard_license:
              newInstructorSnowboard,

            experience_level:
              newInstructorExperience,

            image_url: null
          },
          {
            headers: {
              token
            }
          }
        );
      } catch (instructorErr) {
        // Ako kreiranje instructors zapisa ne uspe,
        // pokušavamo da obrišemo prethodno kreirani user
        try {
          await axios.delete(
            `${API}/api/admin/users/${userId}`,
            {
              headers: {
                token
              }
            }
          );
        } catch (cleanupErr) {
          console.log(
            "CLEANUP ERROR:",
            cleanupErr.response?.data || cleanupErr
          );
        }

        throw instructorErr;
      }

      alert("Instruktor je uspešno dodat.");

      setNewInstructorName("");
      setNewInstructorEmail("");
      setNewInstructorPassword("");

      setNewInstructorSki(true);
      setNewInstructorSnowboard(false);

      setNewInstructorExperience("beginner");

      getInstructors();
      getUsers();
    } catch (err) {
      console.log(
        "ADD INSTRUCTOR ERROR:",
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Greška pri dodavanju instruktora."
      );
    }
  };

  // =====================================================
  // START EDIT INSTRUCTOR
  // =====================================================

  const startEditInstructor = (instructor) => {
    setEditingInstructorId(instructor.id);

    setEditInstructorName(
      instructor.name || ""
    );

    setEditInstructorEmail(
      instructor.email || ""
    );

    setEditInstructorSki(
      instructor.ski_license === true
    );

    setEditInstructorSnowboard(
      instructor.snowboard_license === true
    );

    setEditInstructorExperience(
      instructor.experience_level || "beginner"
    );

    setEditInstructorImageUrl(
      instructor.image_url || ""
    );

    setDeleteInstructorId(null);
    setDeletePassword("");
  };

  // =====================================================
  // UPDATE INSTRUCTOR
  // =====================================================

  const updateInstructor = async (instructorId) => {
    try {
      if (
        !editInstructorName.trim() ||
        !editInstructorEmail.trim()
      ) {
        alert("Ime i email su obavezni.");

        return;
      }

      if (
        !editInstructorSki &&
        !editInstructorSnowboard
      ) {
        alert(
          "Instruktor mora imati najmanje jednu licencu."
        );

        return;
      }

      const token = getToken();

      await axios.put(
        `${API}/api/instructors/${instructorId}`,
        {
          name: editInstructorName.trim(),

          email: editInstructorEmail.trim(),

          ski_license:
            editInstructorSki,

          snowboard_license:
            editInstructorSnowboard,

          experience_level:
            editInstructorExperience,

          image_url:
            editInstructorImageUrl || null
        },
        {
          headers: {
            token
          }
        }
      );

      alert(
        "Instruktor je uspešno izmenjen."
      );

      setEditingInstructorId(null);

      getInstructors();
      getUsers();
    } catch (err) {
      console.log(
        "UPDATE INSTRUCTOR ERROR:",
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Greška pri izmeni instruktora."
      );
    }
  };

  // =====================================================
  // UPLOAD INSTRUCTOR IMAGE
  // =====================================================

  const uploadInstructorImage = async (
    instructorId,
    file
  ) => {
    try {
      if (!file) {
        return;
      }

      setUploadingInstructorImage(true);

      const token = getToken();

      const formData = new FormData();

      formData.append("image", file);

      const res = await axios.post(
        `${API}/api/upload/instructors/${instructorId}/image`,
        formData,
        {
          headers: {
            token,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setEditInstructorImageUrl(
        res.data.image_url
      );

      alert("Slika je uspešno uploadovana.");

      getInstructors();
    } catch (err) {
      console.log(
        "UPLOAD IMAGE ERROR:",
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        "Greška pri uploadu slike."
      );
    } finally {
      setUploadingInstructorImage(false);
    }
  };

  // =====================================================
  // DELETE INSTRUCTOR
  // =====================================================

  const deleteInstructor = async (instructorId) => {
    try {
      if (!deletePassword) {
        alert(
          "Unesite administratorsku lozinku."
        );

        return;
      }

      const token = getToken();

      await axios.delete(
        `${API}/api/instructors/${instructorId}`,
        {
          headers: {
            token
          },

          data: {
            password: deletePassword
          }
        }
      );

      alert("Instruktor je uspešno obrisan.");

      setDeleteInstructorId(null);
      setDeletePassword("");

      getInstructors();
      getUsers();
    } catch (err) {
      console.log(
        "DELETE INSTRUCTOR ERROR:",
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Greška pri brisanju instruktora."
      );
    }
  };

  const getAuditLogs = async () => {
    try {
      setLoadingAuditLogs(true);

      const token =
        getToken();

      const params = {};

      if (
        auditSearch.trim()
      ) {
        params.search =
          auditSearch.trim();
      }

      if (
        auditRoleFilter !== "all"
      ) {
        params.role =
          auditRoleFilter;
      }

      if (
        auditActionFilter !== "all"
      ) {
        params.action =
          auditActionFilter;
      }


      const res =
        await axios.get(
          `${API}/api/audit-logs`,
          {
            headers: {
              token
            },

            params
          }
        );


      setAuditLogs(
        res.data
      );

    } catch (err) {
      console.log(
        "AUDIT LOG ERROR:",
        err.response?.data || err
      );

      alert(
        err.response?.data?.message ||
        "Greška pri učitavanju aktivnosti."
      );

    } finally {
      setLoadingAuditLogs(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/";
  };

  // =====================================================
  // ROLE LABEL
  // =====================================================

  const roleLabel = (role) => {
    if (role === "client") {
      return "Klijent";
    }

    if (role === "instructor") {
      return "Instruktor";
    }

    if (role === "booker") {
      return "Menadžer";
    }

    if (role === "admin") {
      return "Administrator";
    }

    return role;
  };

  // =====================================================
  // AUDIT ACTION LABEL
  // =====================================================

  const auditActionLabel = (action) => {
    if (action === "REGISTER")
      return "Registracija";

    if (action === "LOGIN")
      return "Prijava";

    if (action === "GOOGLE_LOGIN")
      return "Google prijava";

    if (action === "UPDATE_PROFILE")
      return "Izmena profila";

    if (action === "CHANGE_PASSWORD")
      return "Promena lozinke";

    if (action === "CREATE_LESSON_REQUEST")
      return "Novi zahtev za čas";

    if (action === "APPROVE_LESSON_REQUEST")
      return "Odobren zahtev";

    if (action === "REJECT_LESSON_REQUEST")
      return "Odbijen zahtev";

    if (action === "CREATE_CHANGE_REQUEST")
      return "Zahtev za promenu termina";

    if (action === "APPROVE_CHANGE_REQUEST")
      return "Odobrena promena termina";

    if (action === "REJECT_CHANGE_REQUEST")
      return "Odbijena promena termina";

    return action;
  };


  const formatAuditDate = (date) => {
    if (!date) {
      return "/";
    }

    return new Date(date).toLocaleString("sr-RS");
  };

  // =====================================================
  // EXPERIENCE LABEL
  // =====================================================

  const levelLabel = (value) => {
    if (value === "beginner") {
      return "Nivo 1";
    }

    if (value === "intermediate") {
      return "Nivo 2";
    }

    if (value === "advanced") {
      return "Nivo 3";
    }

    return value;
  };

  // =====================================================
  // AUTH CHECK
  // =====================================================

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/login";

      return;
    }

    let user;

    try {
      user = JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/login";

      return;
    }

    if (user.role !== "admin") {
      window.location.href = "/";

      return;
    }

    const verifyAdmin = async () => {
      try {
        const res = await axios.get(
          `${API}/api/auth/verify`,
          {
            headers: {
              token
            }
          }
        );

        if (
          !res.data.user ||
          res.data.user.role !== "admin" ||
          res.data.user.is_active === false
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          window.location.href = "/login";

          return;
        }

        localStorage.setItem(
          "user",
          JSON.stringify(res.data.user)
        );

        setCheckingAuth(false);

        getUsers();
        getInstructors();
      } catch (err) {
        console.log(
          "ADMIN VERIFY ERROR:",
          err.response?.data || err
        );

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/login";
      }
    };

    verifyAdmin();
  }, []);

  // =====================================================
  // STATISTIKA
  // =====================================================

  const clientCount = users.filter(
    (user) => user.role === "client"
  ).length;

  const instructorCount = users.filter(
    (user) => user.role === "instructor"
  ).length;

  const managerCount = users.filter(
    (user) => user.role === "booker"
  ).length;

  const adminCount = users.filter(
    (user) => user.role === "admin"
  ).length;

  const activeUsersCount = users.filter(
    (user) => user.is_active !== false
  ).length;

  const inactiveUsersCount = users.filter(
    (user) => user.is_active === false
  ).length;

  // =====================================================
  // FILTER USERS
  // =====================================================

  const filteredUsers = users.filter((user) => {
    const search = userSearch.toLowerCase().trim();

    if (
      search &&
      !user.name?.toLowerCase().includes(search) &&
      !user.email?.toLowerCase().includes(search)
    ) {
      return false;
    }

    if (
      userRoleFilter !== "all" &&
      user.role !== userRoleFilter
    ) {
      return false;
    }

    if (
      userStatusFilter === "active" &&
      user.is_active === false
    ) {
      return false;
    }

    if (
      userStatusFilter === "inactive" &&
      user.is_active !== false
    ) {
      return false;
    }

    return true;
  });

  // =====================================================
  // FILTER INSTRUCTORS
  // =====================================================

  const filteredInstructors = instructors.filter(
    (instructor) => {
      const search = instructorSearch
        .toLowerCase()
        .trim();

      if (!search) {
        return true;
      }

      return (
        instructor.name
          ?.toLowerCase()
          .includes(search) ||
        instructor.email
          ?.toLowerCase()
          .includes(search)
      );
    }
  );

  // =====================================================
  // LOADING AUTH
  // =====================================================

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white shadow rounded-3xl px-10 py-8 text-center">
          <div className="text-4xl mb-4">🔐</div>

          <p className="text-slate-700 font-bold">
            Provera administratorskog pristupa...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] lg:min-h-screen">

        {/* ================================================= */}
        {/* SIDEBAR */}
        {/* ================================================= */}

        <aside className="bg-blue-700 text-white p-4 sm:p-6">

          <div className="flex items-center gap-3 mb-10">

            <div className="w-11 h-11 rounded-2xl bg-white text-blue-700 flex items-center justify-center font-bold text-xl">
              ⛷
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Ski School
              </h1>

              <p className="text-blue-100 text-sm">
                Administrator panel
              </p>
            </div>

          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3">

            <button
              onClick={() =>
                setActiveSection("overview")
              }
              className={`sidebar-button ${activeSection === "overview"
                ? "bg-white/20"
                : "hover:bg-white/10"
                }`}
            >
              Pregled sistema
            </button>
            <div className="mt-3 mb-1 px-4">
              <p className="text-xs uppercase tracking-wider text-blue-200 font-bold">
                Menadžerske funkcije
              </p>
            </div>

            <button
              onClick={() => {
                window.location.href = "/admin?section=requests";
              }}
              className="sidebar-button hover:bg-white/10"
            >
              Novi zahtevi
            </button>

            <button
              onClick={() => {
                window.location.href = "/admin?section=lessons";
              }}
              className="sidebar-button hover:bg-white/10"
            >
              Zakazani časovi
            </button>

            <button
              onClick={() => {
                window.location.href = "/admin?section=changeRequests";
              }}
              className="sidebar-button hover:bg-white/10"
            >
              Promene termina
            </button>

            <button
              onClick={() => {
                window.location.href = "/admin?section=calendar";
              }}
              className="sidebar-button hover:bg-white/10"
            >
              Kalendar
            </button>

            <div className="mt-5 mb-1 px-4">
              <p className="text-xs uppercase tracking-wider text-blue-200 font-bold">
                Administracija
              </p>
            </div>

            <button
              onClick={() =>
                setActiveSection("users")
              }
              className={`sidebar-button ${activeSection === "users"
                ? "bg-white/20"
                : "hover:bg-white/10"
                }`}
            >
              Korisnici
            </button>

            <button
              onClick={() =>
                setActiveSection("instructors")
              }
              className={`sidebar-button ${activeSection === "instructors"
                ? "bg-white/20"
                : "hover:bg-white/10"
                }`}
            >
              Instruktori
            </button>

            <button
              onClick={() => {
                setActiveSection("audit");
                getAuditLogs();
              }}
              className={`sidebar-button ${activeSection === "audit"
                ? "bg-white/20"
                : "hover:bg-white/10"
                }`}
            >
              Aktivnosti korisnika
            </button>

          </div>

          <div className="mt-10 bg-white/10 rounded-3xl p-4">

            <p className="text-sm text-blue-100">
              Prijavljeni ste kao
            </p>

            <p className="font-bold mt-1">
              Administrator
            </p>

          </div>

          <button
            onClick={logout}
            className="mt-5 w-full bg-white text-blue-700 rounded-2xl px-4 py-3 font-bold hover:bg-blue-50"
          >
            Logout
          </button>

        </aside>

        {/* ================================================= */}
        {/* MAIN */}
        {/* ================================================= */}

        <main className="p-4 sm:p-6 lg:p-10">

          <div className="mb-8">

            <p className="text-blue-600 font-semibold">
              Administracija sistema
            </p>

            <h2 className="text-3xl sm:text-4xl font-bold">
              Administrator panel
            </h2>

            <p className="text-slate-500 mt-2">
              Upravljanje korisnicima, nalozima,
              korisničkim ulogama i instruktorima.
            </p>

          </div>

          {/* ================================================= */}
          {/* OVERVIEW */}
          {/* ================================================= */}

          {activeSection === "overview" && (
            <section>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                <StatCard
                  number={users.length}
                  label="Ukupno korisnika"
                  className="text-blue-700"
                />

                <StatCard
                  number={clientCount}
                  label="Klijenti"
                  className="text-green-600"
                />

                <StatCard
                  number={instructorCount}
                  label="Instruktori"
                  className="text-purple-600"
                />

                <StatCard
                  number={managerCount}
                  label="Menadžeri"
                  className="text-orange-600"
                />

                <StatCard
                  number={adminCount}
                  label="Administratori"
                  className="text-red-600"
                />

                <StatCard
                  number={activeUsersCount}
                  label="Aktivni nalozi"
                  className="text-green-700"
                />

                <StatCard
                  number={inactiveUsersCount}
                  label="Deaktivirani"
                  className="text-red-500"
                />

                <StatCard
                  number={instructors.length}
                  label="Profili instruktora"
                  className="text-slate-800"
                />

              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-6">

                <div className="bg-white rounded-[2rem] shadow p-6">

                  <h3 className="text-2xl font-bold mb-3">
                    Upravljanje korisnicima
                  </h3>

                  <p className="text-slate-500 leading-7">
                    Administrator može da pregleda
                    korisnike, kreira nove naloge,
                    menja podatke i korisničke uloge,
                    aktivira ili deaktivira naloge i
                    resetuje njihove lozinke.
                  </p>

                  <button
                    onClick={() =>
                      setActiveSection("users")
                    }
                    className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold"
                  >
                    Otvori korisnike
                  </button>

                </div>

                <div className="bg-white rounded-[2rem] shadow p-6">

                  <h3 className="text-2xl font-bold mb-3">
                    Upravljanje instruktorima
                  </h3>

                  <p className="text-slate-500 leading-7">
                    Administrator dodaje instruktore,
                    menja njihove osnovne podatke,
                    licence, nivo iskustva i fotografiju
                    profila.
                  </p>

                  <button
                    onClick={() =>
                      setActiveSection("instructors")
                    }
                    className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold"
                  >
                    Otvori instruktore
                  </button>

                </div>

                <div className="bg-white rounded-[2rem] shadow p-6">

                  <h3 className="text-2xl font-bold mb-3">
                    Menadžerske funkcije
                  </h3>

                  <p className="text-slate-500 leading-7">
                    Administrator ima pristup svim funkcionalnostima
                    menadžera, uključujući obradu novih zahteva,
                    pregled i izmenu zakazanih časova, obradu zahteva
                    za promenu termina i pregled kalendara časova.
                  </p>

                  <button
                    onClick={() => {
                      window.location.href = "/admin?section=requests";
                    }}
                    className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold"
                  >
                    Otvori menadžerske funkcije
                  </button>

                </div>

              </div>

            </section>
          )}

          {/* ================================================= */}
          {/* USERS */}
          {/* ================================================= */}

          {activeSection === "users" && (
            <section>

              <div className="bg-white rounded-[2rem] shadow p-4 sm:p-6">

                <div className="mb-6">

                  <h3 className="text-2xl font-bold">
                    Korisnički nalozi
                  </h3>

                  <p className="text-slate-500 mt-1">
                    Pregled i administracija svih
                    registrovanih korisnika sistema.
                  </p>

                </div>

                {/* ADD USER */}

                <div className="bg-blue-50 rounded-3xl p-5 mb-7">

                  <h4 className="font-bold text-lg mb-4">
                    Dodaj novog korisnika
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">

                    <input
                      className="form-input"
                      placeholder="Ime i prezime"
                      value={newUserName}
                      onChange={(e) =>
                        setNewUserName(e.target.value)
                      }
                    />

                    <input
                      type="email"
                      className="form-input"
                      placeholder="Email"
                      value={newUserEmail}
                      onChange={(e) =>
                        setNewUserEmail(e.target.value)
                      }
                    />

                    <input
                      type="password"
                      className="form-input"
                      placeholder="Lozinka"
                      value={newUserPassword}
                      onChange={(e) =>
                        setNewUserPassword(
                          e.target.value
                        )
                      }
                    />

                    <select
                      className="form-input"
                      value={newUserRole}
                      onChange={(e) =>
                        setNewUserRole(e.target.value)
                      }
                    >

                      <option value="client">
                        Klijent
                      </option>

                      <option value="booker">
                        Menadžer
                      </option>

                      <option value="admin">
                        Administrator
                      </option>

                    </select>

                  </div>

                  <p className="text-sm text-slate-500 mt-3">
                    Instruktori se dodaju kroz posebnu
                    sekciju „Instruktori“ zbog licenci i
                    ostalih podataka.
                  </p>

                  <button
                    onClick={addUser}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold"
                  >
                    Dodaj korisnika
                  </button>

                </div>

                {/* FILTERS */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">

                  <input
                    className="form-input"
                    placeholder="Pretraži ime ili email..."
                    value={userSearch}
                    onChange={(e) =>
                      setUserSearch(e.target.value)
                    }
                  />

                  <select
                    className="form-input"
                    value={userRoleFilter}
                    onChange={(e) =>
                      setUserRoleFilter(e.target.value)
                    }
                  >

                    <option value="all">
                      Sve uloge
                    </option>

                    <option value="client">
                      Klijenti
                    </option>

                    <option value="instructor">
                      Instruktori
                    </option>

                    <option value="booker">
                      Menadžeri
                    </option>

                    <option value="admin">
                      Administratori
                    </option>

                  </select>

                  <select
                    className="form-input"
                    value={userStatusFilter}
                    onChange={(e) =>
                      setUserStatusFilter(e.target.value)
                    }
                  >

                    <option value="all">
                      Svi statusi
                    </option>

                    <option value="active">
                      Aktivni
                    </option>

                    <option value="inactive">
                      Deaktivirani
                    </option>

                  </select>

                </div>

                {loadingUsers ? (

                  <div className="empty-box">
                    Učitavanje korisnika...
                  </div>

                ) : filteredUsers.length === 0 ? (

                  <div className="empty-box">
                    Nema korisnika koji odgovaraju
                    izabranim filterima.
                  </div>

                ) : (

                  <div className="space-y-4">

                    {filteredUsers.map((user) => (

                      <div
                        key={user.id}
                        className="border border-slate-200 rounded-3xl p-5"
                      >

                        {editingUserId === user.id ? (

                          <div>

                            <h4 className="font-bold text-lg mb-4">
                              Izmena korisnika
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                              <input
                                className="form-input"
                                value={editUserName}
                                onChange={(e) =>
                                  setEditUserName(
                                    e.target.value
                                  )
                                }
                                placeholder="Ime"
                              />

                              <input
                                className="form-input"
                                value={editUserEmail}
                                onChange={(e) =>
                                  setEditUserEmail(
                                    e.target.value
                                  )
                                }
                                placeholder="Email"
                              />

                              {user.role === "instructor" ? (

                                <input
                                  className="form-input bg-slate-100"
                                  disabled
                                  value="Instruktor"
                                />

                              ) : (

                                <select
                                  className="form-input"
                                  value={editUserRole}
                                  onChange={(e) =>
                                    setEditUserRole(
                                      e.target.value
                                    )
                                  }
                                >

                                  <option value="client">
                                    Klijent
                                  </option>

                                  <option value="booker">
                                    Menadžer
                                  </option>

                                  <option value="admin">
                                    Administrator
                                  </option>

                                </select>

                              )}

                            </div>

                            {user.role === "instructor" && (
                              <p className="text-sm text-slate-500 mt-3">
                                Podaci i licence
                                instruktora menjaju se
                                kroz sekciju Instruktori.
                              </p>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 mt-4">

                              <button
                                onClick={() =>
                                  updateUser(user.id)
                                }
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold"
                              >
                                Sačuvaj izmene
                              </button>

                              <button
                                onClick={() =>
                                  setEditingUserId(null)
                                }
                                className="border border-blue-200 text-blue-700 px-5 py-3 rounded-2xl font-bold"
                              >
                                Otkaži
                              </button>

                            </div>

                          </div>

                        ) : (

                          <>

                            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

                              <div>

                                <div className="flex flex-wrap items-center gap-2">

                                  <h4 className="text-xl font-bold">
                                    {user.name}
                                  </h4>

                                  <span className="role-badge">
                                    {roleLabel(user.role)}
                                  </span>

                                  <span
                                    className={`status-badge ${user.is_active === false
                                      ? "bg-red-100 text-red-700"
                                      : "bg-green-100 text-green-700"
                                      }`}
                                  >
                                    {user.is_active === false
                                      ? "Deaktiviran"
                                      : "Aktivan"}
                                  </span>

                                </div>

                                <p className="text-slate-500 mt-2">
                                  {user.email}
                                </p>

                                <p className="text-xs text-slate-400 mt-1">
                                  ID korisnika: {user.id}
                                </p>

                              </div>

                              <div className="flex flex-wrap gap-2">

                                <button
                                  onClick={() =>
                                    startEditUser(user)
                                  }
                                  className="action-blue"
                                >
                                  Izmeni
                                </button>

                                <button
                                  onClick={() => {
                                    setResetPasswordUserId(
                                      user.id
                                    );

                                    setNewPassword("");

                                    setEditingUserId(null);
                                  }}
                                  className="action-dark"
                                >
                                  Reset lozinke
                                </button>

                                <button
                                  onClick={() =>
                                    toggleUserStatus(user)
                                  }
                                  className={
                                    user.is_active === false
                                      ? "action-green"
                                      : "action-orange"
                                  }
                                >
                                  {user.is_active === false
                                    ? "Aktiviraj"
                                    : "Deaktiviraj"}
                                </button>

                                {user.role !== "instructor" && (
                                  <button
                                    onClick={() =>
                                      deleteUser(user)
                                    }
                                    className="action-red"
                                  >
                                    Obriši
                                  </button>
                                )}

                              </div>

                            </div>

                            {resetPasswordUserId ===
                              user.id && (

                                <div className="mt-5 bg-slate-50 rounded-3xl p-5">

                                  <h5 className="font-bold mb-3">
                                    Postavi novu lozinku
                                  </h5>

                                  <div className="flex flex-col md:flex-row gap-3">

                                    <input
                                      type="password"
                                      className="form-input"
                                      placeholder="Nova lozinka"
                                      value={newPassword}
                                      onChange={(e) =>
                                        setNewPassword(
                                          e.target.value
                                        )
                                      }
                                    />

                                    <button
                                      onClick={() =>
                                        resetUserPassword(
                                          user.id
                                        )
                                      }
                                      className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold md:w-auto"
                                    >
                                      Promeni lozinku
                                    </button>

                                    <button
                                      onClick={() => {
                                        setResetPasswordUserId(
                                          null
                                        );

                                        setNewPassword("");
                                      }}
                                      className="border border-slate-300 px-5 py-3 rounded-2xl font-bold"
                                    >
                                      Otkaži
                                    </button>

                                  </div>

                                </div>

                              )}

                          </>

                        )}

                      </div>

                    ))}

                  </div>

                )}

              </div>

            </section>
          )}

          {/* ================================================= */}
          {/* INSTRUCTORS */}
          {/* ================================================= */}

          {activeSection === "instructors" && (
            <section>

              <div className="bg-white rounded-[2rem] shadow p-4 sm:p-6">

                <div className="mb-6">

                  <h3 className="text-2xl font-bold">
                    Instruktori
                  </h3>

                  <p className="text-slate-500 mt-1">
                    Dodavanje i administracija
                    instruktora, njihovih licenci,
                    nivoa iskustva i profilnih slika.
                  </p>

                </div>

                {/* ADD INSTRUCTOR */}

                <div className="bg-blue-50 rounded-3xl p-5 mb-7">

                  <h4 className="font-bold text-lg mb-4">
                    Dodaj novog instruktora
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                    <input
                      className="form-input"
                      placeholder="Ime i prezime"
                      value={newInstructorName}
                      onChange={(e) =>
                        setNewInstructorName(
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="email"
                      className="form-input"
                      placeholder="Email"
                      value={newInstructorEmail}
                      onChange={(e) =>
                        setNewInstructorEmail(
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="password"
                      className="form-input"
                      placeholder="Lozinka"
                      value={newInstructorPassword}
                      onChange={(e) =>
                        setNewInstructorPassword(
                          e.target.value
                        )
                      }
                    />

                    <select
                      className="form-input"
                      value={newInstructorExperience}
                      onChange={(e) =>
                        setNewInstructorExperience(
                          e.target.value
                        )
                      }
                    >

                      <option value="beginner">
                        Nivo 1
                      </option>

                      <option value="intermediate">
                        Nivo 2
                      </option>

                      <option value="advanced">
                        Nivo 3
                      </option>

                    </select>

                    <label className="checkbox-label">

                      <input
                        type="checkbox"
                        checked={newInstructorSki}
                        onChange={(e) =>
                          setNewInstructorSki(
                            e.target.checked
                          )
                        }
                      />

                      Ski licenca

                    </label>

                    <label className="checkbox-label">

                      <input
                        type="checkbox"
                        checked={newInstructorSnowboard}
                        onChange={(e) =>
                          setNewInstructorSnowboard(
                            e.target.checked
                          )
                        }
                      />

                      Snowboard licenca

                    </label>

                  </div>

                  <button
                    onClick={addInstructor}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold"
                  >
                    Dodaj instruktora
                  </button>

                </div>

                {/* SEARCH */}

                <input
                  className="form-input mb-6"
                  placeholder="Pretraži instruktora po imenu ili emailu..."
                  value={instructorSearch}
                  onChange={(e) =>
                    setInstructorSearch(
                      e.target.value
                    )
                  }
                />

                {/* LIST */}

                {loadingInstructors ? (

                  <div className="empty-box">
                    Učitavanje instruktora...
                  </div>

                ) : filteredInstructors.length === 0 ? (

                  <div className="empty-box">
                    Nema instruktora.
                  </div>

                ) : (

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                    {filteredInstructors.map(
                      (instructor) => (

                        <div
                          key={instructor.id}
                          className={`border rounded-3xl p-5 ${instructor.is_active === false
                            ? "border-red-200 bg-red-50/30"
                            : "border-slate-200 bg-white"
                            }`}
                        >

                          {editingInstructorId ===
                            instructor.id ? (

                            <div>

                              <h4 className="font-bold text-lg mb-4">
                                Izmena instruktora
                              </h4>

                              <input
                                className="form-input mb-3"
                                value={editInstructorName}
                                onChange={(e) =>
                                  setEditInstructorName(
                                    e.target.value
                                  )
                                }
                                placeholder="Ime instruktora"
                              />

                              <input
                                className="form-input mb-3"
                                value={editInstructorEmail}
                                onChange={(e) =>
                                  setEditInstructorEmail(
                                    e.target.value
                                  )
                                }
                                placeholder="Email"
                              />

                              <select
                                className="form-input mb-3"
                                value={
                                  editInstructorExperience
                                }
                                onChange={(e) =>
                                  setEditInstructorExperience(
                                    e.target.value
                                  )
                                }
                              >

                                <option value="beginner">
                                  Nivo 1
                                </option>

                                <option value="intermediate">
                                  Nivo 2
                                </option>

                                <option value="advanced">
                                  Nivo 3
                                </option>

                              </select>

                              <div className="mb-3">

                                <label className="text-sm font-semibold text-slate-600">
                                  Profilna slika
                                </label>

                                <input
                                  type="file"
                                  accept="image/*"
                                  className="form-input mt-2"
                                  onChange={(e) =>
                                    uploadInstructorImage(
                                      instructor.id,
                                      e.target.files?.[0]
                                    )
                                  }
                                />

                              </div>

                              {uploadingInstructorImage && (
                                <p className="text-sm text-blue-600 mb-3">
                                  Upload slike...
                                </p>
                              )}

                              <label className="checkbox-label mb-3">

                                <input
                                  type="checkbox"
                                  checked={
                                    editInstructorSki
                                  }
                                  onChange={(e) =>
                                    setEditInstructorSki(
                                      e.target.checked
                                    )
                                  }
                                />

                                Ski licenca

                              </label>

                              <label className="checkbox-label">

                                <input
                                  type="checkbox"
                                  checked={
                                    editInstructorSnowboard
                                  }
                                  onChange={(e) =>
                                    setEditInstructorSnowboard(
                                      e.target.checked
                                    )
                                  }
                                />

                                Snowboard licenca

                              </label>

                              <div className="flex flex-col sm:flex-row gap-3 mt-4">

                                <button
                                  onClick={() =>
                                    updateInstructor(
                                      instructor.id
                                    )
                                  }
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-2xl font-bold"
                                >
                                  Sačuvaj
                                </button>

                                <button
                                  onClick={() => {
                                    setEditingInstructorId(
                                      null
                                    );
                                  }}
                                  className="border border-blue-200 text-blue-700 px-4 py-3 rounded-2xl font-bold"
                                >
                                  Otkaži
                                </button>

                              </div>

                            </div>

                          ) : (

                            <>

                              <div className="flex items-start justify-between gap-3">

                                <div className="w-20 h-20 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-3xl">

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

                                <span
                                  className={`status-badge ${instructor.is_active ===
                                    false
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                    }`}
                                >
                                  {instructor.is_active ===
                                    false
                                    ? "Deaktiviran"
                                    : "Aktivan"}
                                </span>

                              </div>

                              <h4 className="text-xl font-bold mt-4">
                                {instructor.name}
                              </h4>

                              <p className="text-slate-500 text-sm mt-1">
                                {instructor.email}
                              </p>

                              <div className="flex flex-wrap gap-2 mt-4">

                                {instructor.ski_license && (
                                  <span className="tag-blue">
                                    Ski
                                  </span>
                                )}

                                {instructor.snowboard_license && (
                                  <span className="tag-purple">
                                    Snowboard
                                  </span>
                                )}

                                <span className="tag-gray">
                                  {levelLabel(
                                    instructor.experience_level
                                  )}
                                </span>

                              </div>

                              <div className="flex flex-col gap-3 mt-5">

                                <button
                                  onClick={() =>
                                    startEditInstructor(instructor)
                                  }
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-2xl font-bold"
                                >
                                  Izmeni instruktora
                                </button>

                                <button
                                  onClick={() => {
                                    setDeleteInstructorId(instructor.id);
                                    setDeletePassword("");
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-2xl font-bold"
                                >
                                  Obriši instruktora
                                </button>

                                {deleteInstructorId === instructor.id && (
                                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4">

                                    <p className="text-sm text-red-700 font-semibold mb-3">
                                      Za brisanje unesite svoju administratorsku lozinku.
                                    </p>

                                    <input
                                      type="password"
                                      className="form-input"
                                      placeholder="Administratorska lozinka"
                                      value={deletePassword}
                                      onChange={(e) =>
                                        setDeletePassword(e.target.value)
                                      }
                                    />

                                    <div className="flex flex-col sm:flex-row gap-2 mt-3">

                                      <button
                                        onClick={() =>
                                          deleteInstructor(instructor.id)
                                        }
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-2xl font-bold"
                                      >
                                        Potvrdi brisanje
                                      </button>

                                      <button
                                        onClick={() => {
                                          setDeleteInstructorId(null);
                                          setDeletePassword("");
                                        }}
                                        className="bg-white border border-red-200 text-red-600 px-4 py-3 rounded-2xl font-bold"
                                      >
                                        Otkaži
                                      </button>

                                    </div>

                                  </div>
                                )}

                              </div>

                            </>

                          )}

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

            </section>
          )}
          {/* ================================================= */}
          {/* AUDIT LOG */}
          {/* ================================================= */}

          {activeSection === "audit" && (
            <section>

              <div className="bg-white rounded-[2rem] shadow p-4 sm:p-6">

                <div className="mb-6">

                  <h3 className="text-2xl font-bold">
                    Aktivnosti korisnika
                  </h3>

                  <p className="text-slate-500 mt-1">
                    Evidencija važnih aktivnosti izvršenih
                    u informacionom sistemu.
                  </p>

                </div>


                {/* FILTERI */}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">

                  <input
                    className="form-input"
                    placeholder="Pretraži korisnika, email ili aktivnost..."
                    value={auditSearch}
                    onChange={(e) =>
                      setAuditSearch(
                        e.target.value
                      )
                    }
                  />


                  <select
                    className="form-input"
                    value={auditRoleFilter}
                    onChange={(e) =>
                      setAuditRoleFilter(
                        e.target.value
                      )
                    }
                  >

                    <option value="all">
                      Sve uloge
                    </option>

                    <option value="client">
                      Klijent
                    </option>

                    <option value="instructor">
                      Instruktor
                    </option>

                    <option value="booker">
                      Menadžer
                    </option>

                    <option value="admin">
                      Administrator
                    </option>

                  </select>


                  <select
                    className="form-input"
                    value={auditActionFilter}
                    onChange={(e) =>
                      setAuditActionFilter(
                        e.target.value
                      )
                    }
                  >

                    <option value="all">
                      Sve aktivnosti
                    </option>

                    <option value="REGISTER">
                      Registracija
                    </option>

                    <option value="LOGIN">
                      Prijava
                    </option>

                    <option value="GOOGLE_LOGIN">
                      Google prijava
                    </option>

                    <option value="UPDATE_PROFILE">
                      Izmena profila
                    </option>

                    <option value="CHANGE_PASSWORD">
                      Promena lozinke
                    </option>

                    <option value="CREATE_LESSON_REQUEST">
                      Novi zahtev za čas
                    </option>

                    <option value="APPROVE_LESSON_REQUEST">
                      Odobren zahtev
                    </option>

                    <option value="REJECT_LESSON_REQUEST">
                      Odbijen zahtev
                    </option>

                    <option value="CREATE_CHANGE_REQUEST">
                      Promena termina
                    </option>

                    <option value="APPROVE_CHANGE_REQUEST">
                      Odobrena promena
                    </option>

                    <option value="REJECT_CHANGE_REQUEST">
                      Odbijena promena
                    </option>

                  </select>


                  <button
                    onClick={getAuditLogs}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold"
                  >
                    Primeni filtere
                  </button>

                </div>


                {loadingAuditLogs ? (

                  <div className="empty-box">
                    Učitavanje aktivnosti...
                  </div>

                ) : auditLogs.length === 0 ? (

                  <div className="empty-box">
                    Nema evidentiranih aktivnosti.
                  </div>

                ) : (

                  <div className="space-y-3">

                    {auditLogs.map(
                      (log) => (

                        <div
                          key={log.id}
                          className="border border-slate-200 rounded-3xl p-5"
                        >

                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                            <div>

                              <div className="flex flex-wrap gap-2 items-center">

                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                                  {auditActionLabel(
                                    log.action
                                  )}
                                </span>


                                {log.user_role && (
                                  <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-semibold">
                                    {roleLabel(
                                      log.user_role
                                    )}
                                  </span>
                                )}

                              </div>


                              <h4 className="font-bold text-lg mt-3">

                                {log.user_name ||
                                  "Nepoznat korisnik"}

                              </h4>


                              {log.user_email && (
                                <p className="text-slate-500 text-sm mt-1">
                                  {log.user_email}
                                </p>
                              )}

                            </div>


                            <div className="text-left lg:text-right">

                              <p className="font-semibold text-slate-700">
                                {formatAuditDate(
                                  log.created_at
                                )}
                              </p>

                              <p className="text-xs text-slate-400 mt-1">
                                Log ID: {log.id}
                              </p>

                            </div>

                          </div>


                          {log.details && (
                            <div className="bg-slate-50 rounded-2xl p-4 mt-4">

                              <p className="text-sm text-slate-500 mb-1">
                                Opis aktivnosti
                              </p>

                              <p className="text-slate-700">
                                {log.details}
                              </p>

                            </div>
                          )}


                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm">

                            <div className="bg-slate-50 rounded-xl p-3">

                              <span className="text-slate-500">
                                Entitet:
                              </span>{" "}

                              <b>
                                {log.entity_type || "/"}
                              </b>

                            </div>


                            <div className="bg-slate-50 rounded-xl p-3">

                              <span className="text-slate-500">
                                ID entiteta:
                              </span>{" "}

                              <b>
                                {log.entity_id || "/"}
                              </b>

                            </div>


                            <div className="bg-slate-50 rounded-xl p-3">

                              <span className="text-slate-500">
                                IP:
                              </span>{" "}

                              <b>
                                {log.ip_address || "/"}
                              </b>

                            </div>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

            </section>
          )}
        </main>

      </div>

      {/* ================================================= */}
      {/* CSS */}
      {/* ================================================= */}

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

        .sidebar-button {
          width: 100%;
          text-align: left;
          border-radius: 16px;
          padding: 12px 16px;
          font-weight: 600;
        }

        .empty-box {
          background: #f8fafc;
          border-radius: 24px;
          padding: 32px;
          text-align: center;
          color: #64748b;
        }

        .role-badge {
          background: #dbeafe;
          color: #1d4ed8;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
        }

        .status-badge {
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
        }

        .action-blue {
          background: #2563eb;
          color: white;
          padding: 10px 15px;
          border-radius: 14px;
          font-weight: 700;
        }

        .action-blue:hover {
          background: #1d4ed8;
        }

        .action-dark {
          background: #334155;
          color: white;
          padding: 10px 15px;
          border-radius: 14px;
          font-weight: 700;
        }

        .action-dark:hover {
          background: #1e293b;
        }

        .action-orange {
          background: #f97316;
          color: white;
          padding: 10px 15px;
          border-radius: 14px;
          font-weight: 700;
        }

        .action-orange:hover {
          background: #ea580c;
        }

        .action-green {
          background: #16a34a;
          color: white;
          padding: 10px 15px;
          border-radius: 14px;
          font-weight: 700;
        }

        .action-green:hover {
          background: #15803d;
        }

        .action-red {
          background: #ef4444;
          color: white;
          padding: 10px 15px;
          border-radius: 14px;
          font-weight: 700;
        }

        .action-red:hover {
          background: #dc2626;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          border: 1px solid #dbeafe;
          border-radius: 16px;
          padding: 14px;
          color: #0f172a;
          font-weight: 600;
        }

        .tag-blue {
          background: #dbeafe;
          color: #1d4ed8;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
        }

        .tag-purple {
          background: #f3e8ff;
          color: #7e22ce;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
        }

        .tag-gray {
          background: #f1f5f9;
          color: #334155;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
        }

      `}</style>

    </div>
  );
}


// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  number,
  label,
  className = ""
}) {
  return (
    <div className="bg-white rounded-3xl shadow p-5">

      <p
        className={`text-3xl font-bold ${className}`}
      >
        {number}
      </p>

      <p className="text-sm text-slate-500 mt-1">
        {label}
      </p>

    </div>
  );
}