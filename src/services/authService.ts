// src/services/authService.ts
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"; // adapte selon ton backend

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: string;
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_URL}/login`, data);
      localStorage.setItem("token", response.data.token);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erreur de connexion");
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_URL}/register`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erreur d'inscription");
    }
  },

  async modifipassword(
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      await axios.post(
        `${API_URL}/change_password`,
        { old_password: oldPassword, new_password: newPassword },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Erreur lors de la modification du mot de passe"
      );
    }
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getToken() {
    return localStorage.getItem("token");
  },

  isAuthenticated() {
    return !!localStorage.getItem("token");
  },
};