// src/components/LoginPage.tsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Train, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("user");
  const [password, setPassword] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const success = login(username, password);
    
    if (!success) {
      setError("Неверный логин или пароль");
    }
  };

  return (
    <div className="relative h-full w-full bg-white flex items-center justify-center overflow-hidden">
      {/* Background pattern with faint railway icons */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="railway-pattern"
              x="0"
              y="0"
              width="200"
              height="200"
              patternUnits="userSpaceOnUse"
            >
              {/* Train outline */}
              <rect
                x="40"
                y="70"
                width="120"
                height="50"
                fill="none"
                stroke="#000"
                strokeWidth="2"
              />
              <rect
                x="50"
                y="60"
                width="60"
                height="20"
                fill="none"
                stroke="#000"
                strokeWidth="2"
              />
              <circle
                cx="70"
                cy="125"
                r="8"
                fill="none"
                stroke="#000"
                strokeWidth="2"
              />
              <circle
                cx="130"
                cy="125"
                r="8"
                fill="none"
                stroke="#000"
                strokeWidth="2"
              />
              {/* Rails */}
              <line
                x1="10"
                y1="140"
                x2="190"
                y2="140"
                stroke="#000"
                strokeWidth="1.5"
              />
              <line
                x1="10"
                y1="150"
                x2="190"
                y2="150"
                stroke="#000"
                strokeWidth="1.5"
              />
              <line
                x1="30"
                y1="140"
                x2="30"
                y2="150"
                stroke="#000"
                strokeWidth="1"
              />
              <line
                x1="70"
                y1="140"
                x2="70"
                y2="150"
                stroke="#000"
                strokeWidth="1"
              />
              <line
                x1="110"
                y1="140"
                x2="110"
                y2="150"
                stroke="#000"
                strokeWidth="1"
              />
              <line
                x1="150"
                y1="140"
                x2="150"
                y2="150"
                stroke="#000"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#railway-pattern)"
          />
        </svg>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md mx-4 shadow-lg relative z-10">
        <CardHeader className="space-y-3">
          <div className="flex justify-center mb-2">
            <div className="bg-blue-600 p-3 rounded-full">
              <Train className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-center">
            Режимные карты для локомотивов
          </CardTitle>
          <p className="text-center text-gray-600">
            Войдите в систему, чтобы продолжить
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-gray-600 pl-3"
              >
                Логин
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Введите логин"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-gray-600 pl-3"
              >
                Пароль
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Войти
            </Button>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
}