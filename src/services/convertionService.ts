// Configuration de l'API
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
  sheet_names: string;
  nom: string;
  prenoms: string;
  pseudo: string;
  email: string;
  mot_de_passe?: string;
  classe: string;
  created_at?: string;
}

export interface FileHistoryRecord {
  file_id: string;
  original_filename: string;
  processed_filename: string | null;
  upload_date: string;
  status: "pending" | "processing" | "success" | "error";
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

export interface ExportFormat {
  value: string;
  label: string;
  description: string;
  icon: string;
}

export interface ExportFormatsResponse {
  formats: ExportFormat[];
}

// Classe pour gérer les erreurs de l'API
export class ApiError extends Error {
  statusCode?: number;
  details?: string | string[];

  constructor(
    message: string,
    statusCode?: number,
    details?: string | string[]
  ) {
    super(message);
    this.name = "ApiError";
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
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return this.handleResponse<HealthCheckResponse>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        "Impossible de se connecter au serveur",
        undefined,
        String(error)
      );
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
      formData.append("file", file);

      if (customFileName) {
        formData.append("custom_filename", customFileName);
      }

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        if (onProgress) {
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100;
              onProgress(progress);
            }
          });
        }

        xhr.addEventListener("load", async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              console.log("📊 Réponse complète de l'upload:", data);
              console.log("📋 Feuilles reçues:", data.sheet_names);
              console.log("🔢 Nombre de feuilles:", data.sheets_processed);
              console.log("📝 Données reçues:", data.data);
              resolve(data);
            } catch (error) {
              reject(
                new ApiError("Erreur lors du parsing de la réponse", xhr.status)
              );
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

        xhr.addEventListener("error", () => {
          reject(new ApiError("Erreur réseau lors de l'upload"));
        });

        xhr.addEventListener("timeout", () => {
          reject(new ApiError("Le délai d'attente de la requête a expiré"));
        });

        xhr.open("POST", `${this.baseUrl}/upload`);
        xhr.timeout = 120000;
        xhr.send(formData);
      });
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        "Erreur lors de l'upload du fichier",
        undefined,
        String(error)
      );
    }
  }

  /**
   * Télécharge un fichier traité
   */
  async downloadProcessedFile(fileId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/download/${fileId}`, {
        method: "GET",
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
      throw new ApiError(
        "Erreur lors du téléchargement",
        undefined,
        String(error)
      );
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

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `processed_${fileId}.xlsx`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        "Erreur lors du téléchargement",
        undefined,
        String(error)
      );
    }
  }

  /**
   * Récupère l'historique des fichiers traités
   */
  async getHistory(): Promise<FileHistoryRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/history`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await this.handleResponse<HistoryResponse>(response);
      return data.history;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        "Erreur lors de la récupération de l'historique",
        undefined,
        String(error)
      );
    }
  }

  /**
   * Récupère les détails d'un fichier spécifique
   */
  async getFileDetails(fileId: string): Promise<FileDetailsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/file/${fileId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return this.handleResponse<FileDetailsResponse>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        "Erreur lors de la récupération des détails",
        undefined,
        String(error)
      );
    }
  }

  /**
   * Supprime un fichier et ses enregistrements
   */
  async deleteFile(fileId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/file/${fileId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return this.handleResponse<{ message: string }>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        "Erreur lors de la suppression",
        undefined,
        String(error)
      );
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

  /**
   * Récupère les formats d'export disponibles
   */
  async getExportFormats(): Promise<ExportFormat[]> {
    try {
      const response = await fetch(`${this.baseUrl}/export-formats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await this.handleResponse<ExportFormatsResponse>(response);
      return data.formats;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        "Erreur lors de la récupération des formats",
        undefined,
        String(error)
      );
    }
  }

  /**
   * Récupère la liste des feuilles d'un fichier Excel
   */
  async getFileSheets(fileId: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/file/${fileId}/sheets`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await this.handleResponse<{
        sheets: string[];
        count: number;
      }>(response);
      return data.sheets;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        "Erreur lors de la récupération des feuilles",
        undefined,
        String(error)
      );
    }
  }

  /**
   * Télécharge un fichier traité dans un format spécifique
   */
  async downloadProcessedFileWithFormat(
    fileId: string,
    format: string,
    csvOptions?: { sheet?: string; combine?: boolean }
  ): Promise<Blob> {
    try {
      let url = `${this.baseUrl}/download/${fileId}/${format}`;

      // Ajouter les paramètres CSV si nécessaire
      if (format === "csv" && csvOptions) {
        const params = new URLSearchParams();
        if (csvOptions.sheet) {
          params.append("sheet", csvOptions.sheet);
        }
        if (csvOptions.combine) {
          params.append("combine", "true");
        }
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }

      const response = await fetch(url, {
        method: "GET",
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
      throw new ApiError(
        "Erreur lors du téléchargement",
        undefined,
        String(error)
      );
    }
  }

  /**
   * Télécharge un fichier traité dans un format spécifique et déclenche le téléchargement
   */
  async downloadProcessedFileWithFormatAndSave(
    fileId: string,
    format: string,
    filename?: string,
    csvOptions?: { sheet?: string; combine?: boolean }
  ): Promise<void> {
    try {
      const blob = await this.downloadProcessedFileWithFormat(
        fileId,
        format,
        csvOptions
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      if (filename) {
        let baseName = filename.replace(/\.[^/.]+$/, "");

        // Si une feuille spécifique est sélectionnée pour CSV, ajouter son nom
        if (format === "csv" && csvOptions?.sheet) {
          baseName += `_${csvOptions.sheet}`;
        } else if (format === "csv" && csvOptions?.combine) {
          baseName += "_combined";
        }

        link.download = `${baseName}.${format}`;
      } else {
        link.download = `processed_${fileId}.${format}`;
      }

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        "Erreur lors du téléchargement",
        undefined,
        String(error)
      );
    }
  }
}

// Export de l'instance du service
export const apiService = new ExcelProcessorApiService();

// Export de la classe pour créer des instances personnalisées si nécessaire
export default ExcelProcessorApiService;
