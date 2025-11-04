// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ExcelProcessorApp from "./pages/ExcelProcessorApp";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/Auth/loginPage";
import RegisterPage from "./pages/Auth/register";
import { AuthProvider } from "./context/AuthContext";
import AdminDashboard from "./pages/AdminDashboard";
import ChangePasswordPage from "./pages/Auth/changepasswordpage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="bg-gray-50 min-h-screen">
          <Navbar />
          <div className="pt-20 px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <ExcelProcessorApp />
                  </ProtectedRoute>
                }
              />
              <Route>
                <Route
                  path="/Tableau_bord_admin"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <ChangePasswordPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
