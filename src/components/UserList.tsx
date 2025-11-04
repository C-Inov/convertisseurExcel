import React, { useEffect, useState } from "react";
import { userService, type User } from "../services/userService";
import { Trash2 } from "lucide-react";
import { useLocation } from "react-router-dom";

const UserList: React.FC = () => {
  const location = useLocation(); // 🔹 écoute la route
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await userService.getAllUsers();
        setUsers(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [location]);

  // ✅ Fonction asynchrone corrigée
  const handleDelete = async (id: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?"))
      return;

    try {
      await userService.deleteUser(id);
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;

  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full bg-white border rounded-lg shadow-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b">ID</th>
            <th className="py-2 px-4 border-b">Nom</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Rôle</th>
            <th className="py-2 px-4 border-b">Dernière connexion</th>
            <th className="py-2 px-4 border-b">Action</th>{" "}
            {/* ✅ ajout manquant */}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="text-center hover:bg-gray-50">
              <td className="py-2 px-4 border-b">{u.id}</td>
              <td className="py-2 px-4 border-b">{u.username}</td>
              <td className="py-2 px-4 border-b">{u.email}</td>
              <td className="py-2 px-4 border-b">
                <span className="px-3 py-1 rounded-full text-sm font-medium">
                  {u.role}
                </span>
              </td>
              <td className="py-2 px-4 border-b">
                {u.last_login ? new Date(u.last_login).toLocaleString() : "-"}
              </td>
              <td className="py-2 px-4 border-b">
                <button
                  onClick={() => handleDelete(u.id)}
                  className="text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <Trash2 size={16} /> Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;