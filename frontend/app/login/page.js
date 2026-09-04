"use client";

import { useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const redirectByRole = (role) => {
    if (role === "admin") {
      window.location.href = "/administrator";
    } else if (role === "booker") {
      window.location.href = "/admin";
    } else if (role === "instructor") {
      window.location.href = "/instructor";
    } else if (role === "client") {
      window.location.href = "/client";
    } else {
      window.location.href = "/";
    }
  };
  const login = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      redirectByRole(res.data.user.role);
    } catch (err) {
      console.log(err.response?.data || err);
      alert(err.response?.data?.message || "Pogrešan email ili šifra");
    }
  };

  const googleLogin = async (credentialResponse) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/google`, {
        credential: credentialResponse.credential
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      redirectByRole(res.data.user.role);
    } catch (err) {
      console.log(err.response?.data || err);
      alert("Greška pri Google prijavi.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        <div className="bg-blue-700 text-white p-10 flex flex-col justify-between min-h-[520px]">
          <div>
            <a href="/" className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-white text-blue-700 flex items-center justify-center font-bold text-xl">
                ⛷
              </div>

              <div>
                <h1 className="text-2xl font-bold">Ski School</h1>
                <p className="text-blue-100 text-sm">Booking system</p>
              </div>
            </a>

            <h2 className="text-4xl font-bold leading-tight mb-4">
              Dobrodošli nazad
            </h2>

            <p className="text-blue-100 text-lg">
              Prijavite se i nastavite upravljanje časovima, zahtevima i
              rasporedom ski škole.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold">⛷️</p>
              <p className="text-xs text-blue-100 mt-1">Ski</p>
            </div>

            <div className="bg-white/15 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold">🏂</p>
              <p className="text-xs text-blue-100 mt-1">Snowboard</p>
            </div>

            <div className="bg-white/15 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold">🏔️</p>
              <p className="text-xs text-blue-100 mt-1">Planina</p>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 flex items-center">
          <div className="w-full">
            <p className="text-blue-600 font-semibold mb-2">Login</p>

            <h2 className="text-4xl font-bold text-slate-900 mb-3">
              Prijavite se
            </h2>

            <p className="text-slate-500 mb-8">
              Unesite email i šifru ili nastavite preko Google naloga.
            </p>

            <label className="text-sm font-semibold text-slate-600">
              Email
            </label>

            <input
              className="login-input mt-2 mb-4"
              type="email"
              placeholder="npr. marko@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="text-sm font-semibold text-slate-600">
              Šifra
            </label>

            <input
              className="login-input mt-2 mb-6"
              type="password"
              placeholder="Unesite šifru"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={login}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-bold shadow-lg"
            >
              Prijavi se
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-slate-400 text-sm">ili</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={googleLogin}
                onError={() => alert("Google login nije uspeo.")}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-5">
              <a
                href="/register"
                className="w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-800 p-4 rounded-2xl font-bold"
              >
                Registracija
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
        .login-input {
          width: 100%;
          border: 1px solid #dbeafe;
          padding: 15px;
          border-radius: 16px;
          outline: none;
          background: white;
          color: black;
        }

        .login-input::placeholder {
          color: #64748b;
          opacity: 1;
        }

        .login-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
      `}</style>
    </div>
  );
}