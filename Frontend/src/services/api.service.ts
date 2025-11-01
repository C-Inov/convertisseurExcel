// Configuration de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Types pour les réponses de l'API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: string | string[];
}

export interface FileUploadResponse {
  message: string;
  file_id: string;
  record_count: number;
  sheets_processed: number;
  sheet_names: string[];
  data: ProcessedRecord[];
  warnings?: string[];
}

export interface ProcessedRecord {
  sheet_name: string;  // Ajout du nom de la feuille
  nom: string;
  prenom: string;
  numero: string;
  email: string;
  mot_de_passe?: string;
  created_at?: string;
}

export interface FileHistoryRecord {
  file_id: string;
  original_filename: string;
  processed_filename: string | null;
  upload_date: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  record_count: number;
  error_message: string | null;
}

export interface FileDetailsResponse {
  file_info: FileHistoryRecord;
  records: ProcessedRecord[];
}

export interface HistoryResponse {
  history: FileHistoryRecord[];
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
}

// Classe pour gérer les erreurs de l'API
export class ApiError extends Error {
  statusCode?: number;
  details?: string | string[];

  constructor(message: string, statusCode?: number, details?: string | string[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Service API
class ExcelProcessorApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Gère les erreurs des réponses HTTP
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status}`;
      let errorDetails: string | string[] | undefined;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        errorDetails = errorData.details;
      } catch {
        // Si la réponse n'est pas en JSON, utiliser le texte de statut
        errorMessage = response.statusText || errorMessage;
      }

      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    return response.json();
  }

  /**
   * Vérifie la santé du serveur
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return this.handleResponse<HealthCheckResponse>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Impossible de se connecter au serveur', undefined, String(error));
    }
  }

  /**
   * Upload et traite un fichier Excel
   */
  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void,
    customFileName?: string
  ): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Ajouter le nom personnalisé si fourni
      if (customFileName) {
        formData.append('custom_filename', customFileName);
      }

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        // Gérer la progression
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100;
              onProgress(progress);
            }
          });
        }

        // Gérer la réponse
        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (error) {
              reject(new ApiError('Erreur lors du parsing de la réponse', xhr.status));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(
                new ApiError(
                  errorData.error || `Erreur HTTP ${xhr.status}`,
                  xhr.status,
                  errorData.details
                )
              );
            } catch {
              reject(new ApiError(`Erreur HTTP ${xhr.status}`, xhr.status));
            }
          }
        });

        // Gérer les erreurs réseau
        xhr.addEventListener('error', () => {
          reject(new ApiError('Erreur réseau lors de l\'upload'));
        });

        // Gérer le timeout
        xhr.addEventListener('timeout', () => {
          reject(new ApiError('Le délai d\'attente de la requête a expiré'));
        });

        // Envoyer la requête
        xhr.open('POST', `${this.baseUrl}/upload`);
        xhr.timeout = 120000; // 2 minutes
        xhr.send(formData);
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erreur lors de l\'upload du fichier', undefined, String(error));
    }
  }

  /**
   * Télécharge un fichier traité
   */
  async downloadProcessedFile(fileId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/download/${fileId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        let errorMessage = `Erreur HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new ApiError(errorMessage, response.status);
      }

      return response.blob();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erreur lors du téléchargement', undefined, String(error));
    }
  }

  /**
   * Télécharge un fichier traité et déclenche le téléchargement dans le navigateur
   */
  async downloadProcessedFileAndSave(
    fileId: string, 
    filename?: string
  ): Promise<void> {
    try {
      const blob = await this.downloadProcessedFile(fileId);
      
      // Créer un lien de téléchargement temporaire
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `processed_${fileId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erreur lors du téléchargement', undefined, String(error));
    }
  }

  /**
   * Récupère l'historique des fichiers traités
   */
  async getHistory(): Promise<FileHistoryRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await this.handleResponse<HistoryResponse>(response);
      return data.history;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erreur lors de la récupération de l\'historique', undefined, String(error));
    }
  }

  /**
   * Récupère les détails d'un fichier spécifique
   */
  async getFileDetails(fileId: string): Promise<FileDetailsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/file/${fileId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return this.handleResponse<FileDetailsResponse>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erreur lors de la récupération des détails', undefined, String(error));
    }
  }

  /**
   * Supprime un fichier et ses enregistrements
   */
  async deleteFile(fileId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/file/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return this.handleResponse<{ message: string }>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erreur lors de la suppression', undefined, String(error));
    }
  }

  /**
   * Teste la connexion au serveur
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }
}

// Export de l'instance du service
export const apiService = new ExcelProcessorApiService();

// Export de la classe pour créer des instances personnalisées si nécessaire
export default ExcelProcessorApiService;




