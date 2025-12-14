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
import { Train } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
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
                placeholder="IvanovII"
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
              <Input
                id="password"
                type="password"
                placeholder="Введите свой пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
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