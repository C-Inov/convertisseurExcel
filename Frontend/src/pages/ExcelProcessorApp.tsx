import React, { useState, useEffect } from "react";
import {
  Upload,
  Download,
  History,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  RefreshCw,
  ArrowBigRightDash,
} from "lucide-react";
import { apiService, ApiError } from "../services/api.service";
import type {
  FileHistoryRecord,
  ProcessedRecord,
} from "../services/api.service";

const ExcelProcessorApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"upload" | "history">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processedData, setProcessedData] = useState<ProcessedRecord[] | null>(
    null
  );
  const [history, setHistory] = useState<FileHistoryRecord[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationSuccess, setValidationSuccess] = useState<boolean>(false);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<
    "unknown" | "online" | "offline"
  >("unknown");

  // Filtres et pagination
  const [searchText, setSearchText] = useState<string>("");
  // const [searchDate, setSearchDate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Modal pour le nom de fichier à l'upload
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadFileName, setUploadFileName] = useState<string>("");

  useEffect(() => {
    checkServerStatus();
    loadHistory();
  }, []);

  useEffect(() => {
    checkServerStatus();
    loadHistory();
  }, []);

  const checkServerStatus = async (): Promise<void> => {
    try {
      const isOnline = await apiService.testConnection();
      setServerStatus(isOnline ? "online" : "offline");
    } catch {
      setServerStatus("offline");
    }
  };

  const loadHistory = async (): Promise<void> => {
    setLoadingHistory(true);
    try {
      const historyData = await apiService.getHistory();
      setHistory(historyData);
      setCurrentPage(1); // Réinitialiser à la première page lors du rechargement
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error);
      if (error instanceof ApiError) {
        setValidationErrors([error.message]);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filtrer l'historique
  // const filteredHistory = history.filter((entry) => {
  //   const matchesText =
  //     searchText === "" ||
  //     entry.original_filename
  //       .toLowerCase()
  //       .includes(searchText.toLowerCase()) ||
  //     entry.file_id.toLowerCase().includes(searchText.toLowerCase());

  //   const matchesDate =
  //     searchDate === "" ||
  //     new Date(entry.upload_date).toLocaleDateString("fr-FR") ===
  //       new Date(searchDate).toLocaleDateString("fr-FR");

  //   return matchesText && matchesDate;
  // });

  const filteredHistory = history.filter((entry) => {
    const matchesText =
      searchText === "" ||
      entry.original_filename
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      entry.file_id.toLowerCase().includes(searchText.toLowerCase()) ||
      (entry.processed_filename &&
        entry.processed_filename
          .toLowerCase()
          .includes(searchText.toLowerCase()));

    // Conversion de la date du fichier
    const fileDate = new Date(entry.upload_date);

    // Vérifie si la date est comprise entre startDate et endDate (si présentes)
    const matchesDate =
      (!startDate && !endDate) ||
      (startDate && !endDate && fileDate >= new Date(startDate)) ||
      (!startDate && endDate && fileDate <= new Date(endDate)) ||
      (startDate &&
        endDate &&
        fileDate >= new Date(startDate) &&
        fileDate <= new Date(endDate));

    return matchesText && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  // Réinitialiser à la page 1 si les filtres changent
  // useEffect(() => {
  //   setCurrentPage(1);
  // }, [searchText, searchDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, startDate, endDate]);

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setValidationErrors([]);
      setValidationSuccess(false);
      setProcessedData(null);
      setUploadProgress(0);

      // Pré-remplir le nom sans extension
      const nameWithoutExt = uploadedFile.name.replace(/\.[^/.]+$/, "");
      setUploadFileName(nameWithoutExt);
    }
  };

  const openUploadModal = (): void => {
    if (!file) return;
    setShowUploadModal(true);
  };

  const processFile = async (): Promise<void> => {
    if (!file || !uploadFileName.trim()) {
      alert("Veuillez entrer un nom de fichier valide");
      return;
    }

    setProcessing(true);
    setValidationErrors([]);
    setValidationSuccess(false);
    setUploadProgress(0);
    setShowUploadModal(false);

    try {
      // Upload le fichier avec le nom personnalisé
      const result = await apiService.uploadFile(
        file,
        (progress) => {
          setUploadProgress(Math.round(progress));
        },
        uploadFileName.trim()
      );

      setValidationSuccess(true);
      setProcessedData(result.data);

      // Recharger l'historique
      await loadHistory();

      setProcessing(false);
    } catch (error) {
      setProcessing(false);

      if (error instanceof ApiError) {
        if (Array.isArray(error.details)) {
          setValidationErrors(error.details);
        } else if (typeof error.details === "string") {
          setValidationErrors([error.message, error.details]);
        } else {
          setValidationErrors([error.message]);
        }
      } else {
        setValidationErrors([
          "Erreur inattendue lors du traitement du fichier",
        ]);
      }
    }
  };

  const deleteHistoryFile = async (fileId: string): Promise<void> => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) {
      return;
    }

    try {
      await apiService.deleteFile(fileId);
      await loadHistory();
    } catch (error) {
      if (error instanceof ApiError) {
        alert(`Erreur: ${error.message}`);
      }
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "success":
        return "✓ Réussi";
      case "error":
        return "✗ Échec";
      case "processing":
        return "⏳ En cours";
      case "pending":
        return "⏸ En attente";
      default:
        return status;
    }
  };

  const downloadProcessedFile = async () => {
    try {
      const historyData = await apiService.getHistory();
      const lastFile = historyData[0];
      if (lastFile && lastFile.file_id) {
        await apiService.downloadProcessedFileAndSave(
          lastFile.file_id,
          lastFile.processed_filename || undefined
        );
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      alert("Erreur lors du téléchargement du fichier");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-600 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <FileText className="w-8 h-8" />
                  Traitement Automatisé de Fichiers Excel
                </h1>
                <p className="text-blue-100 mt-2">
                  Génération automatique d'identifiants et validation des
                  données
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    serverStatus === "online"
                      ? "bg-blue-500 text-white"
                      : serverStatus === "offline"
                      ? "bg-red-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {serverStatus === "online"
                    ? "● En ligne"
                    : serverStatus === "offline"
                    ? "● Hors ligne"
                    : "● Vérification..."}
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("upload")}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
                  activeTab === "upload"
                    ? "bg-white text-green-600 border-b-2 border-green-600"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Upload className="w-5 h-5" />
                Téléversement
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
                  activeTab === "history"
                    ? "bg-white text-green-600 border-b-2 border-green-600"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <History className="w-5 h-5" />
                Historique
              </button>
            </div>
          </div>

          <div className="p-8">
            {activeTab === "upload" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Format du fichier Excel requis :
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                      • Colonnes obligatoires : <strong>nom</strong>,{" "}
                      <strong>prenom</strong>, <strong>numero</strong>
                    </li>
                    <li>
                      • Le système génèrera automatiquement :{" "}
                      <strong>email</strong> et <strong>mot_de_passe</strong>
                    </li>
                    <li>
                      • Format de numéro : 8 à 15 chiffres (avec ou sans
                      indicatif)
                    </li>
                  </ul>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <label className="cursor-pointer">
                    <span className="text-lg font-semibold text-gray-700">
                      Cliquez pour sélectionner un fichier Excel
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={processing}
                    />
                  </label>
                  {file && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded inline-block">
                      <p className="text-green-800 font-medium">{file.name}</p>
                    </div>
                  )}
                </div>

                {file && !processedData && (
                  <button
                    onClick={openUploadModal}
                    disabled={processing || serverStatus === "offline"}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Clock className="w-5 h-5 animate-spin" />
                        Traitement en cours... {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Valider et Traiter le Fichier
                      </>
                    )}
                  </button>
                )}

                {processing && uploadProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                {validationErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900 mb-2">
                          Erreurs de validation :
                        </h3>
                        <ul className="text-sm text-red-800 space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {validationSuccess && processedData && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-green-900">
                            Traitement réussi !
                          </h3>
                          <p className="text-green-800 mt-1">
                            {processedData.length} enregistrement(s) traité(s)
                            avec succès.
                          </p>
                          {/* Afficher le nombre de feuilles traitées */}
                          {processedData[0]?.sheet_name && (
                            <p className="text-green-700 text-sm mt-1">
                              Feuilles traitées :{" "}
                              {[
                                ...new Set(
                                  processedData.map((d) => d.sheet_name)
                                ),
                              ].join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Afficher les avertissements s'il y en a */}
                    {validationErrors.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-yellow-900 mb-2">
                              Avertissements (certaines feuilles n'ont pas pu
                              être traitées) :
                            </h3>
                            <ul className="text-sm text-yellow-800 space-y-1">
                              {validationErrors.map((error, index) => (
                                <li key={index}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">
                          Aperçu des données traitées (toutes feuilles
                          confondues)
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Feuille
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Nom
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Prénom
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Numéro
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Email
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Mot de passe
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {processedData.slice(0, 10).map((row, index) => (
                              <tr
                                key={index}
                                className="border-t border-gray-200"
                              >
                                <td className="px-4 py-3 text-sm text-purple-600 font-medium">
                                  {row.sheet_name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800">
                                  {row.nom}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800">
                                  {row.prenom}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800">
                                  {row.numero}
                                </td>
                                <td className="px-4 py-3 text-sm text-blue-600">
                                  {row.email}
                                </td>
                                <td className="px-4 py-3 text-sm font-mono text-gray-600">
                                  {row.mot_de_passe}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {processedData.length > 10 && (
                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-sm text-gray-600 text-center">
                          ... et {processedData.length - 10} autre(s)
                          enregistrement(s)
                        </div>
                      )}
                    </div>

                    <button
                      onClick={downloadProcessedFile}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Télécharger le Fichier Traité (Toutes les feuilles)
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Historique des traitements
                  </h2>
                  <button
                    onClick={loadHistory}
                    disabled={loadingHistory}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        loadingHistory ? "animate-spin" : ""
                      }`}
                    />
                    Actualiser
                  </button>
                </div>

                {/* Filtres */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Filtres de recherche
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rechercher par nom de fichier
                      </label>
                      <input
                        type="text"
                        placeholder="Nom du fichier..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filtrer par date
                      </label>
                      <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div> */}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date de début
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date de fin
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  {/* {(searchText || searchDate) && (
                    <button
                      onClick={() => {
                        setSearchText("");
                        setSearchDate("");
                      }}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Réinitialiser les filtres
                    </button>
                  )} */}
                  {(searchText || startDate || endDate) && (
                    <button
                      onClick={() => {
                        setSearchText("");
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>

                {/* Résultats */}
                {loadingHistory ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4 animate-spin" />
                    <p className="text-gray-600 text-lg">
                      Chargement de l'historique...
                    </p>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 text-lg">
                      {history.length === 0
                        ? "Aucun fichier traité pour le moment"
                        : "Aucun résultat ne correspond à vos critères de recherche"}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Info pagination */}
                    <div className="text-sm text-gray-600">
                      Affichage de {startIndex + 1} à{" "}
                      {Math.min(endIndex, filteredHistory.length)} sur{" "}
                      {filteredHistory.length} résultat(s)
                    </div>

                    {/* Liste des fichiers */}
                    <div className="space-y-3">
                      {paginatedHistory.map((entry) => (
                        <div
                          key={entry.file_id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-blue-600">
                                    {entry.original_filename}
                                  </h3>
                                  <ArrowBigRightDash />
                                  <h3 className="font-semibold text-green-600">
                                    {entry.processed_filename}
                                  </h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {new Date(entry.upload_date).toLocaleString(
                                    "fr-FR"
                                  )}{" "}
                                  • {entry.record_count} enregistrement(s)
                                </p>
                                {entry.error_message && (
                                  <p className="text-sm text-red-600 mt-1">
                                    Erreur: {entry.error_message}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                  entry.status
                                )}`}
                              >
                                {getStatusLabel(entry.status)}
                              </span>
                              {entry.status === "success" &&
                                entry.processed_filename && (
                                  <button
                                    className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                    title="Télécharger"
                                  >
                                    <Download className="w-5 h-5" />
                                  </button>
                                )}
                              <button
                                onClick={() => deleteHistoryFile(entry.file_id)}
                                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
                          disabled={currentPage === 1}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Précédent
                        </button>

                        <div className="flex gap-2">
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((page) => {
                            // Afficher seulement quelques pages autour de la page actuelle
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 &&
                                page <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-4 py-2 rounded-lg transition-colors ${
                                    currentPage === page
                                      ? "bg-blue-600 text-white"
                                      : "bg-white border border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            } else if (
                              page === currentPage - 2 ||
                              page === currentPage + 2
                            ) {
                              return (
                                <span key={page} className="px-2 py-2">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>

                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(totalPages, prev + 1)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Suivant
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>
            Application de traitement automatisé • Connecté au serveur backend
          </p>
        </div>
      </div>

      {/* Modal d'upload - Nom du fichier */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Nom du fichier à traiter
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Donnez un nom à ce fichier qui sera enregistré dans le système
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du fichier (sans extension)
              </label>
              <input
                type="text"
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    processFile();
                  }
                }}
                placeholder="Ex: employes_janvier_2025"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                L'extension .xlsx sera ajoutée automatiquement
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={processFile}
                disabled={!uploadFileName.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Traiter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelProcessorApp;
