"use client";

import { useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    try {
      if (!name || !email || !password) {
        alert("Popuni sva polja.");
        return;
      }

      await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
        role: "client"
      });

      const loginRes = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password
      });

      localStorage.setItem("token", loginRes.data.token);
      localStorage.setItem("user", JSON.stringify(loginRes.data.user));

      window.location.href = "/client";
    } catch (err) {
      console.log(err.response?.data || err);

      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Greška pri registraciji."
      );
    }
  };

  const googleLogin = async (credentialResponse) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/google", {
        credential: credentialResponse.credential
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      window.location.href = "/client";
    } catch (err) {
      console.log(err.response?.data || err);
      alert("Greška pri Google registraciji.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        <div className="bg-blue-700 text-white p-10 flex flex-col justify-between min-h-[560px]">
          <div>
            <a href="/" className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-white text-blue-700 flex items-center justify-center font-bold text-xl">
                ⛷
              </div>

              <div>
                <h1 className="text-2xl font-bold">Ski School</h1>
                <p className="text-blue-100 text-sm">Client nalog</p>
              </div>
            </a>

            <h2 className="text-4xl font-bold leading-tight mb-4">
              Napravi svoj nalog
            </h2>

            <p className="text-blue-100 text-lg">
              Registruj se i prati svoje zahteve, potvrđene časove i promene termina.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold">📅</p>
              <p className="text-xs text-blue-100 mt-1">Termini</p>
            </div>

            <div className="bg-white/15 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold">⛷️</p>
              <p className="text-xs text-blue-100 mt-1">Časovi</p>
            </div>

            <div className="bg-white/15 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold">🏂</p>
              <p className="text-xs text-blue-100 mt-1">Snowboard</p>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 flex items-center">
          <div className="w-full">
            <p className="text-blue-600 font-semibold mb-2">
              Registracija
            </p>

            <h2 className="text-4xl font-bold text-slate-900 mb-3">
              Kreiraj nalog
            </h2>

            <p className="text-slate-500 mb-8">
              Unesi podatke ili nastavi preko Google naloga.
            </p>

            <label className="text-sm font-semibold text-slate-600">
              Ime i prezime
            </label>

            <input
              className="register-input mt-2 mb-4"
              placeholder="npr. Marko Petrović"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label className="text-sm font-semibold text-slate-600">
              Email
            </label>

            <input
              className="register-input mt-2 mb-4"
              type="email"
              placeholder="npr. marko@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="text-sm font-semibold text-slate-600">
              Šifra
            </label>

            <input
              className="register-input mt-2 mb-6"
              type="password"
              placeholder="Unesite šifru"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={register}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-bold shadow-lg"
            >
              Registruj se
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-slate-400 text-sm">ili</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={googleLogin}
                onError={() => alert("Google registracija nije uspela.")}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-5">
              <a
                href="/login"
                className="w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-800 p-4 rounded-2xl font-bold"
              >
                Već imam nalog
              </a>

              <a
                href="/"
                className="w-full text-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 p-4 rounded-2xl font-bold"
              >
                Početna
              </a>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .register-input {
          width: 100%;
          border: 1px solid #dbeafe;
          padding: 15px;
          border-radius: 16px;
          outline: none;
          background: white;
          color: black;
        }

        .register-input::placeholder {
          color: #64748b;
          opacity: 1;
        }

        .register-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
      `}</style>
    </div>
  );
}
