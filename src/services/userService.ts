// src/services/userService.ts
import axios from "axios";
import { authService } from "./authService";

const API_URL = import.meta.env.VITE_API_URL;

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  last_login: string;
}

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const token = authService.getToken();
    const response = await axios.get(`${API_URL}/Tableau_bord_admin`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
  async deleteUser(userId: number): Promise<void> {
    const token = authService.getToken();
    await axios.put(`${API_URL}/users/${userId}/delete`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
  
};