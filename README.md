# 🧩 Crash Game

Projekt webowej aplikacji gry hazardowej z funkcjonalnościami realtime (SignalR), autoryzacją użytkowników (JWT) oraz frontendem w React (TypeScript, MobX).

---

## 📚 Stack technologiczny

### 🔧 Backend (.NET Core)
- **ASP.NET Core** (.NET 9)
- **Entity Framework Core** z bazą danych MySQL
- **ASP.NET Identity** (rejestracja, logowanie, zarządzanie użytkownikami)
- **JWT** (JSON Web Tokens) – autoryzacja API i SignalR
- **SignalR** – komunikacja w czasie rzeczywistym (chat)
- **CORS** – obsługa połączeń z frontendu
- **Swagger** – interaktywna dokumentacja API

### 💻 Frontend (React)
- **React 19.x**
- **TypeScript**
- **MobX** – zarządzanie stanem aplikacji
- **SignalR client** (`@microsoft/signalr`) – obsługa połączeń realtime
- **Tailwind CSS / CSS Modules** – stylowanie UI

---

## ✨ Funkcjonalności

### 🔐 Uwierzytelnianie
- Rejestracja i logowanie z użyciem ASP.NET Identity
- Token JWT generowany i przechowywany po stronie klienta
- Zabezpieczone API i połączenia realtime (opcjonalne)

### 💬 Czat
- Pobieranie wiadomości publicznie (bez logowania)
- Wysyłanie wiadomości tylko dla zalogowanych użytkowników
- Komunikacja realtime z użyciem SignalR

### 🧪 Inne
- Swagger (`/swagger`) z testowaniem endpointów
- Konfiguracja CORS dla komunikacji z `localhost:3000`

---

## 🔄 Jak uruchomić

### ✅ Backend (C# .NET)
1. Skonfiguruj `appsettings.json`:

```json
"JwtSettings": {
  "Issuer": "YourIssuer",
  "Audience": "YourAudience",
  "SecretKey": "SuperSecretKey123!"
},
"ConnectionStrings": {
  "DefaultConnection": "server=localhost;user=root;password=;database=chatapp"
}