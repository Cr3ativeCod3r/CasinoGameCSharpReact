
🧩 Crash Game

A web-based gambling game project featuring realtime functionality (SignalR), user authentication (JWT), and a frontend built with React (TypeScript, Zustand).

Preview Beta

<img width="2934" height="1440" alt="Image" src="https://github.com/user-attachments/assets/a067fe88-4302-40e1-a56f-c0ef456140ce" />
<img width="1786" height="1330" alt="Image" src="https://github.com/user-attachments/assets/4bc13df8-285e-4be0-8410-5b9405e0ee73" />


📚 Tech Stack

🔧 Backend (.NET Core)
	•	ASP.NET Core (.NET 9)
	•	Entity Framework Core with MySQL database
	•	ASP.NET Identity (registration, login, user management)
	•	JWT (JSON Web Tokens) – API and SignalR authorization
	•	SignalR – real-time communication (chat, crash game)
	•	CORS – support for frontend connections
	•	Swagger – interactive API documentation

💻 Frontend (React)
	•	React 19.x
	•	TypeScript
	•	Zustand – state management
	•	SignalR client (@microsoft/signalr) – real-time connection support
	•	Tailwind CSS / CSS Modules – UI styling

⸻

✨ Features

🔐 Authentication
	•	Registration and login using ASP.NET Identity
	•	JWT token generated and stored on the client side
	•	Secured API and realtime connections (optional)

💬 Chat
	•	Public message fetching (without login)
	•	Sending messages available only to logged-in users
	•	Real-time communication using SignalR

🧪 Misc
	•	Swagger (/swagger) for endpoint testing
	•	CORS configuration for communication with localhost:3000

⸻

🔄 How to Run

✅ Backend (C# .NET)
	1.	Configure appsettings.json:

"JwtSettings": {
  "Issuer": "YourIssuer",
  "Audience": "YourAudience",
  "SecretKey": "SuperSecretKey123!"
},
"ConnectionStrings": {
  "DefaultConnection": "server=localhost;user=root;password=;database=chatapp"
}
