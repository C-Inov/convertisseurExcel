//src/pages/AdminDashboard.tsx
import React from "react";
import UserList from "../components/UserList";

const AdminDashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">
        Tableau de bord administrateur
      </h1>
      <UserList />
    </div>
  );
};

export default AdminDashboard;