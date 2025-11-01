// // src/pages/AuthPage.tsx
// import React, { useState } from "react";
// import { authService } from "../services/authService";
// import { useNavigate } from "react-router-dom";

// const AuthPage: React.FC = () => {
//   const [isLogin, setIsLogin] = useState(true);
//   const [formData, setFormData] = useState({
//     username: "",
//     email: "",
//     password: "",
//   });
//   const [message, setMessage] = useState("");
//   const navigate = useNavigate();

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setMessage("");

//     try {
//       if (isLogin) {
//         await authService.login({
//           email: formData.email,
//           password: formData.password,
//         });
//         setMessage("Connexion réussie !");
//       } else {
//         await authService.register({
//           username: formData.username,
//           email: formData.email,
//           password: formData.password,
//         });
//         setMessage("Inscription réussie !");
//       }

//       // Redirige après 1 seconde vers la page principale
//       setTimeout(() => {
//         navigate("/");
//       }, 1000);
//     } catch (error: any) {
//       setMessage(error.message);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
//       <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

//         {/* Logo */}
//         <div className="text-center mb-6">
//           <img
//             src="/logo.png"
//             alt="Logo"
//             className="mx-auto h-12 w-12"
//           />
//           <h2 className="text-2xl font-bold text-gray-800 mt-2">
//             {isLogin ? "Connexion" : "Inscription"}
//           </h2>
//           <p className="text-gray-500 text-sm">
//             {isLogin
//               ? "Bienvenue, connectez-vous pour continuer"
//               : "Créez un compte pour commencer"}
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           {!isLogin && (
//             <input
//               type="text"
//               name="username"
//               placeholder="Nom d'utilisateur"
//               value={formData.username}
//               onChange={handleChange}
//               className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
//               required
//             />
//           )}

//           <input
//             type="email"
//             name="email"
//             placeholder="Adresse email"
//             value={formData.email}
//             onChange={handleChange}
//             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
//             required
//           />

//           <input
//             type="password"
//             name="password"
//             placeholder="Mot de passe"
//             value={formData.password}
//             onChange={handleChange}
//             className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
//             required
//           />

//           <button
//             type="submit"
//             className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
//           >
//             {isLogin ? "Se connecter" : "S'inscrire"}
//           </button>
//         </form>

//         {message && (
//           <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
//         )}

//         <div className="text-center mt-6">
//           <button
//             onClick={() => setIsLogin(!isLogin)}
//             className="text-blue-600 hover:underline"
//           >
//             {isLogin
//               ? "Pas encore de compte ? S'inscrire"
//               : "Déjà inscrit ? Se connecter"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AuthPage;
