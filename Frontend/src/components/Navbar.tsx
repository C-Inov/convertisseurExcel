// // src/components/Navbar.tsx
// import { useState, useRef, useEffect } from "react";
// import { Menu, X, ChevronDown } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// export default function Navbar() {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const { isAuthenticated, logout } = useAuth();
//   const navigate = useNavigate();

//   // 🔹 Ferme le menu déroulant si on clique à l’extérieur
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target as Node)
//       ) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   useEffect(() => {
//     setDropdownOpen(false);
//     setMenuOpen(false);
//   }, [isAuthenticated]);

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   return (
//     <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between h-16 items-center">
//           {/* Logo */}
//           <div
//             onClick={() => navigate("/")}
//             className="flex items-center space-x-2 cursor-pointer"
//           >
//             <img src="/logo.png" alt="Logo" className="h-8 w-8" />
//             <span className="text-xl font-semibold text-gray-800">
//               Excel Processor
//             </span>
//           </div>

//           {/* Section Desktop */}
//           <div className="hidden md:flex items-center space-x-4">
//             {!isAuthenticated ? (
//               <button
//                 onClick={() => navigate("/login")}
//                 className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
//               >
//                 Authentification
//               </button>
//             ) : (
//               <div className="relative" ref={dropdownRef}>
//                 <button
//                   onClick={() => setDropdownOpen(!dropdownOpen)}
//                   className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
//                 >
//                   Mon compte
//                   <ChevronDown className="ml-2 h-4 w-4" />
//                 </button>

//                 {dropdownOpen && (
//                   <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg py-2 z-10">
//                     <button
//                       onClick={() => {
//                         navigate("/register");
//                         setDropdownOpen(false);
//                       }}
//                       className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
//                     >
//                       Enregistrer un autre utilisateur
//                     </button>

//                     <button
//                       onClick={() => {
//                         navigate("/change-password");
//                         setDropdownOpen(false);
//                       }}
//                       className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
//                     >
//                       Modifier le mot de passe
//                     </button>

//                     <button
//                       onClick={handleLogout}
//                       className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
//                     >
//                       Se déconnecter
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Menu Mobile */}
//           <div className="md:hidden">
//             <button
//               onClick={() => setMenuOpen(!menuOpen)}
//               className="text-gray-800 focus:outline-none"
//             >
//               {menuOpen ? <X size={24} /> : <Menu size={24} />}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Menu Mobile déroulant */}
//       {menuOpen && (
//         <div className="md:hidden bg-white shadow-md border-t">
//           {!isAuthenticated ? (
//             <button
//               onClick={() => navigate("/login")}
//               className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
//             >
//               Authentification
//             </button>
//           ) : (
//             <>
//               <button
//                 onClick={() => {
//                   navigate("/register");
//                   setMenuOpen(false);
//                 }}
//                 className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
//               >
//                 Enregistrer un autre utilisateur
//               </button>
//               <button
//                 onClick={() => {
//                   navigate("/change-password");
//                   setMenuOpen(false);
//                 }}
//                 className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
//               >
//                 Modifier le mot de passe
//               </button>
//               <button
//                 onClick={handleLogout}
//                 className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
//               >
//                 Se déconnecter
//               </button>
//             </>
//           )}
//         </div>
//       )}
//     </nav>
//   );
// }

// src/components/Navbar.tsx
import { useState, useRef, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.role === "admin";

  // 🔹 Ferme le menu déroulant si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
    setMenuOpen(false);
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center space-x-2 cursor-pointer"
          >
            {/* <img src="/logo.png" alt="Logo" className="h-8 w-8" /> */}
            <span className="text-xl font-semibold text-gray-800">
              Excel Processor
            </span>
          </div>

          {/* Section Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {!isAuthenticated ? (
              <button
                onClick={() => navigate("/login")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                Authentification
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
                >
                  Mon compte
                  <ChevronDown className="ml-2 h-4 w-4" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg py-2 z-10">
                    {/* Bouton visible uniquement pour les admins */}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            navigate("/register");
                            setDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Enregistrer un autre utilisateur
                        </button>

                        <button
                          onClick={() => {
                            navigate("/Tableau_bord_admin");
                            setDropdownOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                            Tableau de bord admin
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        navigate("/change-password");
                        setDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Modifier le mot de passe
                    </button>

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Menu Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-800 focus:outline-none"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile déroulant */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-md border-t">
          {!isAuthenticated ? (
            <button
              onClick={() => navigate("/login")}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Authentification
            </button>
          ) : (
            <>
              {/* Bouton visible uniquement pour les admins */}
              {isAdmin && (
                <button
                  onClick={() => {
                    navigate("/register");
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Enregistrer un autre utilisateur
                </button>
              )}
              <button
                onClick={() => {
                  navigate("/change-password");
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Modifier le mot de passe
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
              >
                Se déconnecter
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
