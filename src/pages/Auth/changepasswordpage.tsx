import React, { useState } from "react";
import { authService } from "../../services/authService";
import { useNavigate } from "react-router-dom";

const ChangePasswordPage: React.FC = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword ) {
      setMessage("⚠️ Les mots de passe ne correspondent pas.");
      return;
    }
    if ( !newPassword ) {
      setMessage("⚠️ Veuillez entrer votre ancien mot de passe.");
      return;
    }

    try {
      setLoading(true);
      await authService.modifipassword(oldPassword, newPassword);
      setMessage("✅ Mot de passe modifié avec succès !");
      setTimeout(() => navigate("/"), 1000);
    } catch (error: any) {
      setMessage("❌ Erreur lors de la modification du mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-6 mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Modifier le mot de passe
      </h2>

      {message && (
        <div
          className={`mb-4 p-2 rounded text-center ${
            message.includes("✅")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Ancien mot de passe
          </label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-indigo-200"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-indigo-200"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Confirmer le nouveau mot de passe
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-indigo-200"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Modification..." : "Modifier le mot de passe"}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordPage;