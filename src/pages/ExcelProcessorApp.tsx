// import React, { useState, useEffect } from "react";
// import {
//   Upload,
//   Download,
//   History,
//   FileText,
//   CheckCircle,
//   XCircle,
//   Clock,
//   AlertCircle,
//   Trash2,
//   RefreshCw,
//   ArrowBigRightDash,
// } from "lucide-react";
// import { apiService, ApiError } from "../services/convertionService";
// import type {
//   FileHistoryRecord,
//   ProcessedRecord,
//   ExportFormat,
// } from "../services/convertionService";

// const ExcelProcessorApp: React.FC = () => {
//   const [activeTab, setActiveTab] = useState<"upload" | "history">("upload");
//   const [file, setFile] = useState<File | null>(null);
//   const [processing, setProcessing] = useState<boolean>(false);
//   const [uploadProgress, setUploadProgress] = useState<number>(0);
//   const [processedData, setProcessedData] = useState<ProcessedRecord[] | null>(
//     null
//   );
//   const [history, setHistory] = useState<FileHistoryRecord[]>([]);
//   const [validationErrors, setValidationErrors] = useState<string[]>([]);
//   const [validationSuccess, setValidationSuccess] = useState<boolean>(false);
//   const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
//   const [serverStatus, setServerStatus] = useState<
//     "unknown" | "online" | "offline"
//   >("unknown");

//   const [searchText, setSearchText] = useState<string>("");
//   const [startDate, setStartDate] = useState<string>("");
//   const [endDate, setEndDate] = useState<string>("");
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const itemsPerPage = 10;

//   const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
//   const [uploadFileName, setUploadFileName] = useState<string>("");

//   // Nouveaux états pour le choix de format
//   const [showFormatModal, setShowFormatModal] = useState<boolean>(false);
//   const [selectedFormat, setSelectedFormat] = useState<string>("xlsx");
//   const [exportFormats, setExportFormats] = useState<ExportFormat[]>([]);
//   const [downloadingFileId, setDownloadingFileId] = useState<string | null>(
//     null
//   );

//   // États pour les options CSV
//   const [showCsvOptionsModal, setShowCsvOptionsModal] =
//     useState<boolean>(false);
//   const [availableSheets, setAvailableSheets] = useState<string[]>([]);
//   const [csvOption, setCsvOption] = useState<"first" | "specific" | "combine">(
//     "first"
//   );
//   const [selectedSheet, setSelectedSheet] = useState<string>("");

//   // États pour la navigation entre les feuilles dans l'aperçu
//   const [currentSheetIndex, setCurrentSheetIndex] = useState<number>(0);

//   useEffect(() => {
//     checkServerStatus();
//     loadHistory();
//     loadExportFormats();
//   }, []);

//   const checkServerStatus = async (): Promise<void> => {
//     try {
//       const isOnline = await apiService.testConnection();
//       setServerStatus(isOnline ? "online" : "offline");
//     } catch {
//       setServerStatus("offline");
//     }
//   };

//   const loadHistory = async (): Promise<void> => {
//     setLoadingHistory(true);
//     try {
//       const historyData = await apiService.getHistory();
//       setHistory(historyData);
//       setCurrentPage(1);
//     } catch (error) {
//       console.error("Erreur lors du chargement de l'historique:", error);
//       if (error instanceof ApiError) {
//         setValidationErrors([error.message]);
//       }
//     } finally {
//       setLoadingHistory(false);
//     }
//   };

//   const loadExportFormats = async (): Promise<void> => {
//     try {
//       const formats = await apiService.getExportFormats();
//       setExportFormats(formats);
//     } catch (error) {
//       console.error("Erreur lors du chargement des formats:", error);
//     }
//   };

//   const filteredHistory = history.filter((entry) => {
//     const matchesText =
//       searchText === "" ||
//       entry.original_filename
//         .toLowerCase()
//         .includes(searchText.toLowerCase()) ||
//       entry.file_id.toLowerCase().includes(searchText.toLowerCase()) ||
//       (entry.processed_filename &&
//         entry.processed_filename
//           .toLowerCase()
//           .includes(searchText.toLowerCase()));

//     const fileDate = new Date(entry.upload_date);
//     const matchesDate =
//       (!startDate && !endDate) ||
//       (startDate && !endDate && fileDate >= new Date(startDate)) ||
//       (!startDate && endDate && fileDate <= new Date(endDate)) ||
//       (startDate &&
//         endDate &&
//         fileDate >= new Date(startDate) &&
//         fileDate <= new Date(endDate));

//     return matchesText && matchesDate;
//   });

//   const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const endIndex = startIndex + itemsPerPage;
//   const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchText, startDate, endDate]);

//   const handleFileUpload = (
//     event: React.ChangeEvent<HTMLInputElement>
//   ): void => {
//     const uploadedFile = event.target.files?.[0];
//     if (uploadedFile) {
//       setFile(uploadedFile);
//       setValidationErrors([]);
//       setValidationSuccess(false);
//       setProcessedData(null);
//       setUploadProgress(0);
//       const nameWithoutExt = uploadedFile.name.replace(/\.[^/.]+$/, "");
//       setUploadFileName(nameWithoutExt);
//     }
//   };

//   const openUploadModal = (): void => {
//     if (!file) return;
//     setShowUploadModal(true);
//   };

//   const processFile = async (): Promise<void> => {
//     if (!file || !uploadFileName.trim()) {
//       alert("Veuillez entrer un nom de fichier valide");
//       return;
//     }

//     setProcessing(true);
//     setValidationErrors([]);
//     setValidationSuccess(false);
//     setUploadProgress(0);
//     setShowUploadModal(false);

//     try {
//       const result = await apiService.uploadFile(
//         file,
//         (progress) => {
//           setUploadProgress(Math.round(progress));
//         },
//         uploadFileName.trim()
//       );

//       setValidationSuccess(true);
//       setProcessedData(result.data);
//       setCurrentSheetIndex(0); // Réinitialiser à la première feuille
//       await loadHistory();
//       setProcessing(false);
//     } catch (error) {
//       setProcessing(false);
//       if (error instanceof ApiError) {
//         if (Array.isArray(error.details)) {
//           setValidationErrors(error.details);
//         } else if (typeof error.details === "string") {
//           setValidationErrors([error.message, error.details]);
//         } else {
//           setValidationErrors([error.message]);
//         }
//       } else {
//         setValidationErrors([
//           "Erreur inattendue lors du traitement du fichier",
//         ]);
//       }
//     }
//   };

//   const deleteHistoryFile = async (fileId: string): Promise<void> => {
//     if (!confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) {
//       return;
//     }
//     try {
//       await apiService.deleteFile(fileId);
//       await loadHistory();
//     } catch (error) {
//       if (error instanceof ApiError) {
//         alert(`Erreur: ${error.message}`);
//       }
//     }
//   };

//   const openFormatModal = async (fileId: string): Promise<void> => {
//     setDownloadingFileId(fileId);
//     setSelectedFormat("xlsx");
//     setShowFormatModal(true);

//     // Charger les feuilles disponibles pour ce fichier
//     try {
//       const sheets = await apiService.getFileSheets(fileId);
//       setAvailableSheets(sheets);
//       if (sheets.length > 0) {
//         setSelectedSheet(sheets[0]);
//       }
//     } catch (error) {
//       console.error("Erreur lors du chargement des feuilles:", error);
//       setAvailableSheets([]);
//     }
//   };

//   const handleFormatSelection = (format: string): void => {
//     setSelectedFormat(format);

//     // Si CSV est sélectionné et qu'il y a plusieurs feuilles, demander l'option
//     if (format === "csv" && availableSheets.length > 1) {
//       // Ne pas fermer le modal, juste passer en mode CSV options
//     }
//   };

//   const downloadWithFormat = async (): Promise<void> => {
//     if (!downloadingFileId) return;

//     // Si CSV et plusieurs feuilles, ouvrir le modal d'options CSV
//     if (selectedFormat === "csv" && availableSheets.length > 1) {
//       setShowFormatModal(false);
//       setShowCsvOptionsModal(true);
//       return;
//     }

//     // Sinon, télécharger directement
//     await performDownload();
//   };

//   const performDownload = async (): Promise<void> => {
//     if (!downloadingFileId) return;

//     try {
//       const entry = history.find((h) => h.file_id === downloadingFileId);
//       const filename = entry?.processed_filename || undefined;

//       let csvOptions = undefined;

//       if (selectedFormat === "csv") {
//         if (csvOption === "specific" && selectedSheet) {
//           csvOptions = { sheet: selectedSheet };
//         } else if (csvOption === "combine") {
//           csvOptions = { combine: true };
//         }
//       }

//       await apiService.downloadProcessedFileWithFormatAndSave(
//         downloadingFileId,
//         selectedFormat,
//         filename,
//         csvOptions
//       );

//       setShowFormatModal(false);
//       setShowCsvOptionsModal(false);
//       setDownloadingFileId(null);
//       setCsvOption("first");
//     } catch (error) {
//       console.error("Erreur lors du téléchargement:", error);
//       alert("Erreur lors du téléchargement du fichier");
//     }
//   };

//   const downloadProcessedFile = async (): Promise<void> => {
//     try {
//       const historyData = await apiService.getHistory();
//       const lastFile = historyData[0];
//       if (lastFile && lastFile.file_id) {
//         await openFormatModal(lastFile.file_id);
//       }
//     } catch (error) {
//       console.error("Erreur:", error);
//       alert("Erreur lors de la préparation du téléchargement");
//     }
//   };

//   const getStatusColor = (status: string): string => {
//     switch (status) {
//       case "success":
//         return "bg-green-100 text-green-800";
//       case "error":
//         return "bg-red-100 text-red-800";
//       case "processing":
//         return "bg-blue-100 text-blue-800";
//       case "pending":
//         return "bg-yellow-100 text-yellow-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   const getStatusLabel = (status: string): string => {
//     switch (status) {
//       case "success":
//         return "✓ Réussi";
//       case "error":
//         return "✗ Échec";
//       case "processing":
//         return "⏳ En cours";
//       case "pending":
//         return "⏸ En attente";
//       default:
//         return status;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
//       <div className="container mx-auto px-4 py-8">
//         <div className="bg-white rounded-lg shadow-xl overflow-hidden">
//           <div className="bg-gradient-to-r from-green-600 to-green-600 p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h1 className="text-3xl font-bold text-white flex items-center gap-3">
//                   <FileText className="w-8 h-8" />
//                   Traitement Automatisé de Fichiers Excel
//                 </h1>
//                 <p className="text-blue-100 mt-2">
//                   Génération automatique d'identifiants et validation des
//                   données
//                 </p>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div
//                   className={`px-3 py-1 rounded-full text-sm font-medium ${
//                     serverStatus === "online"
//                       ? "bg-blue-500 text-white"
//                       : serverStatus === "offline"
//                       ? "bg-red-500 text-white"
//                       : "bg-gray-500 text-white"
//                   }`}
//                 >
//                   {serverStatus === "online"
//                     ? "● En ligne"
//                     : serverStatus === "offline"
//                     ? "● Hors ligne"
//                     : "● Vérification..."}
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="border-b border-gray-200">
//             <div className="flex">
//               <button
//                 onClick={() => setActiveTab("upload")}
//                 className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
//                   activeTab === "upload"
//                     ? "bg-white text-green-600 border-b-2 border-green-600"
//                     : "bg-gray-50 text-gray-600 hover:bg-gray-100"
//                 }`}
//               >
//                 <Upload className="w-5 h-5" />
//                 Téléversement
//               </button>
//               <button
//                 onClick={() => setActiveTab("history")}
//                 className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
//                   activeTab === "history"
//                     ? "bg-white text-green-600 border-b-2 border-green-600"
//                     : "bg-gray-50 text-gray-600 hover:bg-gray-100"
//                 }`}
//               >
//                 <History className="w-5 h-5" />
//                 Historique
//               </button>
//             </div>
//           </div>

//           <div className="p-8">
//             {activeTab === "upload" && (
//               <div className="space-y-6">
//                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                   <h3 className="font-semibold text-blue-900 mb-2">
//                     Format du fichier Excel requis :
//                   </h3>
//                   <ul className="text-sm text-blue-800 space-y-1">
//                     <li>
//                       • Colonnes obligatoires : <strong>Nom</strong>,{" "}
//                       <strong>Prenoms</strong>, <strong>Classe</strong>
//                     </li>
//                     <li>
//                       • Le système génèrera automatiquement :{" "}
//                       <strong>Email</strong>, <strong>pseudo</strong> et{" "}
//                       <strong>mot de passe</strong>
//                     </li>
//                   </ul>
//                 </div>

//                 <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
//                   <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
//                   <label className="cursor-pointer">
//                     <span className="text-lg font-semibold text-gray-700">
//                       Cliquez pour sélectionner un fichier Excel
//                     </span>
//                     <input
//                       type="file"
//                       accept=".xlsx,.xls"
//                       onChange={handleFileUpload}
//                       className="hidden"
//                       disabled={processing}
//                     />
//                   </label>
//                   {file && (
//                     <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded inline-block">
//                       <p className="text-green-800 font-medium">{file.name}</p>
//                     </div>
//                   )}
//                 </div>

//                 {file && !processedData && (
//                   <button
//                     onClick={openUploadModal}
//                     disabled={processing || serverStatus === "offline"}
//                     className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
//                   >
//                     {processing ? (
//                       <>
//                         <Clock className="w-5 h-5 animate-spin" />
//                         Traitement en cours... {uploadProgress}%
//                       </>
//                     ) : (
//                       <>
//                         <CheckCircle className="w-5 h-5" />
//                         Valider et Traiter le Fichier
//                       </>
//                     )}
//                   </button>
//                 )}

//                 {processing && uploadProgress > 0 && (
//                   <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
//                     <div
//                       className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 transition-all duration-300"
//                       style={{ width: `${uploadProgress}%` }}
//                     />
//                   </div>
//                 )}

//                 {validationErrors.length > 0 && (
//                   <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//                     <div className="flex items-start gap-3">
//                       <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
//                       <div className="flex-1">
//                         <h3 className="font-semibold text-red-900 mb-2">
//                           Erreurs de validation :
//                         </h3>
//                         <ul className="text-sm text-red-800 space-y-1">
//                           {validationErrors.map((error, index) => (
//                             <li key={index}>• {error}</li>
//                           ))}
//                         </ul>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {validationSuccess && processedData && (
//                   <div className="space-y-4">
//                     <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//                       <div className="flex items-start gap-3">
//                         <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
//                         <div>
//                           <h3 className="font-semibold text-green-900">
//                             Traitement réussi !
//                           </h3>
//                           <p className="text-green-800 mt-1">
//                             {processedData.length} enregistrement(s) traité(s)
//                             avec succès.
//                           </p>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
//                       <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
//                         <h3 className="font-semibold text-gray-900">
//                           Aperçu des données traitées
//                         </h3>
//                       </div>

//                       {/* Navigation entre les feuilles si plusieurs feuilles */}
//                       {(() => {
//                         const uniqueSheets = [
//                           ...new Set(processedData.map((d) => d.sheet_names)),
//                         ];
//                         if (uniqueSheets.length > 1) {
//                           return (
//                             <div className="bg-gray-100 border-b border-gray-200 px-4 py-3">
//                               <div className="flex items-center gap-2 overflow-x-auto">
//                                 <span className="text-sm font-medium text-gray-700 mr-2">
//                                   Feuilles:
//                                 </span>
//                                 {uniqueSheets.map((sheetName, index) => (
//                                   <button
//                                     key={sheetName}
//                                     onClick={() => setCurrentSheetIndex(index)}
//                                     className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
//                                       currentSheetIndex === index
//                                         ? "bg-blue-600 text-white shadow-md"
//                                         : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
//                                     }`}
//                                   >
//                                     {sheetName}
//                                   </button>
//                                 ))}
//                               </div>
//                             </div>
//                           );
//                         }
//                         return null;
//                       })()}

//                       <div className="overflow-x-auto">
//                         <table className="w-full">
//                           <thead className="bg-gray-100">
//                             <tr>
//                               {(() => {
//                                 const uniqueSheets = [
//                                   ...new Set(
//                                     processedData.map((d) => d.sheet_names)
//                                   ),
//                                 ];
//                                 if (uniqueSheets.length > 1) {
//                                   return (
//                                     <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
//                                       Feuille
//                                     </th>
//                                   );
//                                 }
//                                 return null;
//                               })()}
//                               <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
//                                 Nom
//                               </th>
//                               <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
//                                 Prénoms
//                               </th>
//                               <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
//                                 Pseudo
//                               </th>
//                               <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
//                                 Email
//                               </th>
//                               <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
//                                 Mot de passe
//                               </th>
//                               <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
//                                 Classe
//                               </th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {(() => {
//                               const uniqueSheets = [
//                                 ...new Set(
//                                   processedData.map((d) => d.sheet_names)
//                                 ),
//                               ];
//                               let displayData = processedData;

//                               // Filtrer par feuille si plusieurs feuilles
//                               if (uniqueSheets.length > 1) {
//                                 const currentSheet =
//                                   uniqueSheets[currentSheetIndex];
//                                 displayData = processedData.filter(
//                                   (d) => d.sheet_names === currentSheet
//                                 );
//                               }

//                               return displayData
//                                 .slice(0, 10)
//                                 .map((row, index) => (
//                                   <tr
//                                     key={index}
//                                     className="border-t border-gray-200"
//                                   >
//                                     {uniqueSheets.length > 1 && (
//                                       <td className="px-4 py-3 text-sm text-purple-600 font-medium">
//                                         {row.sheet_names}
//                                       </td>
//                                     )}
//                                     <td className="px-4 py-3 text-sm text-gray-800">
//                                       {row.nom}
//                                     </td>
//                                     <td className="px-4 py-3 text-sm text-gray-800">
//                                       {row.prenoms}
//                                     </td>
//                                     <td className="px-4 py-3 text-sm text-gray-800">
//                                       {row.pseudo}
//                                     </td>
//                                     <td className="px-4 py-3 text-sm text-blue-600">
//                                       {row.email}
//                                     </td>
//                                     <td className="px-4 py-3 text-sm font-mono text-gray-600">
//                                       {row.mot_de_passe}
//                                     </td>
//                                     <td className="px-4 py-3 text-sm font-mono text-gray-600">
//                                       {row.classe}
//                                     </td>
//                                   </tr>
//                                 ));
//                             })()}
//                           </tbody>
//                         </table>
//                       </div>
//                       {(() => {
//                         const uniqueSheets = [
//                           ...new Set(processedData.map((d) => d.sheet_names)),
//                         ];
//                         let displayData = processedData;

//                         if (uniqueSheets.length > 1) {
//                           const currentSheet = uniqueSheets[currentSheetIndex];
//                           displayData = processedData.filter(
//                             (d) => d.sheet_names === currentSheet
//                           );
//                         }

//                         if (displayData.length > 10) {
//                           return (
//                             <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-sm text-gray-600 text-center">
//                               ... et {displayData.length - 10} autre(s)
//                               enregistrement(s) dans cette feuille
//                             </div>
//                           );
//                         }
//                         return null;
//                       })()}
//                     </div>

//                     <button
//                       onClick={downloadProcessedFile}
//                       className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
//                     >
//                       <Download className="w-5 h-5" />
//                       Télécharger le Fichier Traité
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}

//             {activeTab === "history" && (
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between mb-6">
//                   <h2 className="text-2xl font-bold text-gray-900">
//                     Historique des traitements
//                   </h2>
//                   <button
//                     onClick={loadHistory}
//                     disabled={loadingHistory}
//                     className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 disabled:opacity-50"
//                   >
//                     <RefreshCw
//                       className={`w-4 h-4 ${
//                         loadingHistory ? "animate-spin" : ""
//                       }`}
//                     />
//                     Actualiser
//                   </button>
//                 </div>

//                 <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
//                   <h3 className="font-semibold text-gray-900 mb-3">
//                     Filtres de recherche
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Rechercher par nom de fichier
//                       </label>
//                       <input
//                         type="text"
//                         placeholder="Nom du fichier..."
//                         value={searchText}
//                         onChange={(e) => setSearchText(e.target.value)}
//                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                       />
//                     </div>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Date de début
//                         </label>
//                         <input
//                           type="date"
//                           value={startDate}
//                           onChange={(e) => setStartDate(e.target.value)}
//                           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Date de fin
//                         </label>
//                         <input
//                           type="date"
//                           value={endDate}
//                           onChange={(e) => setEndDate(e.target.value)}
//                           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                   {(searchText || startDate || endDate) && (
//                     <button
//                       onClick={() => {
//                         setSearchText("");
//                         setStartDate("");
//                         setEndDate("");
//                       }}
//                       className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
//                     >
//                       Réinitialiser les filtres
//                     </button>
//                   )}
//                 </div>

//                 {loadingHistory ? (
//                   <div className="text-center py-12">
//                     <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4 animate-spin" />
//                     <p className="text-gray-600 text-lg">
//                       Chargement de l'historique...
//                     </p>
//                   </div>
//                 ) : filteredHistory.length === 0 ? (
//                   <div className="text-center py-12">
//                     <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
//                     <p className="text-gray-600 text-lg">
//                       {history.length === 0
//                         ? "Aucun fichier traité pour le moment"
//                         : "Aucun résultat ne correspond à vos critères de recherche"}
//                     </p>
//                   </div>
//                 ) : (
//                   <>
//                     <div className="text-sm text-gray-600">
//                       Affichage de {startIndex + 1} à{" "}
//                       {Math.min(endIndex, filteredHistory.length)} sur{" "}
//                       {filteredHistory.length} résultat(s)
//                     </div>

//                     <div className="space-y-3">
//                       {paginatedHistory.map((entry) => (
//                         <div
//                           key={entry.file_id}
//                           className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
//                         >
//                           <div className="flex items-center justify-between">
//                             <div className="flex items-center gap-4 flex-1">
//                               <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
//                                 <FileText className="w-6 h-6 text-blue-600" />
//                               </div>
//                               <div className="flex-1">
//                                 <div className="flex items-center gap-2 mb-1">
//                                   <h3 className="font-semibold text-blue-600">
//                                     {entry.original_filename}
//                                   </h3>
//                                   <ArrowBigRightDash />
//                                   <h3 className="font-semibold text-green-600">
//                                     {entry.processed_filename}
//                                   </h3>
//                                 </div>
//                                 <p className="text-sm text-gray-600">
//                                   {new Date(entry.upload_date).toLocaleString(
//                                     "fr-FR"
//                                   )}{" "}
//                                   • {entry.record_count} enregistrement(s)
//                                 </p>
//                                 {entry.error_message && (
//                                   <p className="text-sm text-red-600 mt-1">
//                                     Erreur: {entry.error_message}
//                                   </p>
//                                 )}
//                               </div>
//                             </div>
//                             <div className="flex items-center gap-3">
//                               <span
//                                 className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
//                                   entry.status
//                                 )}`}
//                               >
//                                 {getStatusLabel(entry.status)}
//                               </span>
//                               {entry.status === "success" &&
//                                 entry.processed_filename && (
//                                   <button
//                                     onClick={() =>
//                                       openFormatModal(entry.file_id)
//                                     }
//                                     className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
//                                     title="Télécharger"
//                                   >
//                                     <Download className="w-5 h-5" />
//                                   </button>
//                                 )}
//                               <button
//                                 onClick={() => deleteHistoryFile(entry.file_id)}
//                                 className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
//                                 title="Supprimer"
//                               >
//                                 <Trash2 className="w-5 h-5" />
//                               </button>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>

//                     {totalPages > 1 && (
//                       <div className="flex items-center justify-center gap-2 mt-6">
//                         <button
//                           onClick={() =>
//                             setCurrentPage((prev) => Math.max(1, prev - 1))
//                           }
//                           disabled={currentPage === 1}
//                           className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                         >
//                           Précédent
//                         </button>

//                         <div className="flex gap-2">
//                           {Array.from(
//                             { length: totalPages },
//                             (_, i) => i + 1
//                           ).map((page) => {
//                             if (
//                               page === 1 ||
//                               page === totalPages ||
//                               (page >= currentPage - 1 &&
//                                 page <= currentPage + 1)
//                             ) {
//                               return (
//                                 <button
//                                   key={page}
//                                   onClick={() => setCurrentPage(page)}
//                                   className={`px-4 py-2 rounded-lg transition-colors ${
//                                     currentPage === page
//                                       ? "bg-blue-600 text-white"
//                                       : "bg-white border border-gray-300 hover:bg-gray-50"
//                                   }`}
//                                 >
//                                   {page}
//                                 </button>
//                               );
//                             } else if (
//                               page === currentPage - 2 ||
//                               page === currentPage + 2
//                             ) {
//                               return (
//                                 <span key={page} className="px-2 py-2">
//                                   ...
//                                 </span>
//                               );
//                             }
//                             return null;
//                           })}
//                         </div>

//                         <button
//                           onClick={() =>
//                             setCurrentPage((prev) =>
//                               Math.min(totalPages, prev + 1)
//                             )
//                           }
//                           disabled={currentPage === totalPages}
//                           className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                         >
//                           Suivant
//                         </button>
//                       </div>
//                     )}
//                   </>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="mt-8 text-center text-gray-600 text-sm">
//           <p>
//             Application de traitement automatisé • Connecté au serveur backend
//           </p>
//         </div>
//       </div>

//       {/* Modal d'upload */}
//       {showUploadModal && (
//         <div
//           onClick={() => setShowUploadModal(false)}
//           className="fixed inset-0 bg-black/75 bg-opacity-10 flex items-center justify-center z-50 p-4"
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6"
//           >
//             <h3 className="text-xl font-bold text-gray-900 mb-4">
//               Nom du fichier à traiter
//             </h3>
//             <p className="text-sm text-gray-600 mb-4">
//               Donnez un nom à ce fichier qui sera enregistré dans le système
//             </p>
//             <div className="mb-6">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Nom du fichier (sans extension)
//               </label>
//               <input
//                 type="text"
//                 value={uploadFileName}
//                 onChange={(e) => setUploadFileName(e.target.value)}
//                 onKeyPress={(e) => {
//                   if (e.key === "Enter") {
//                     processFile();
//                   }
//                 }}
//                 placeholder="Ex: employes_janvier_2025"
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                 autoFocus
//               />
//               <p className="text-xs text-gray-500 mt-1">
//                 L'extension .xlsx sera ajoutée automatiquement
//               </p>
//             </div>
//             <div className="flex gap-3">
//               <button
//                 onClick={() => {
//                   setShowUploadModal(false);
//                 }}
//                 className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
//               >
//                 Annuler
//               </button>
//               <button
//                 onClick={processFile}
//                 disabled={!uploadFileName.trim()}
//                 className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
//               >
//                 <CheckCircle className="w-4 h-4" />
//                 Traiter
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Modal de choix de format */}
//       {showFormatModal && (
//         <div
//           onClick={() => setShowFormatModal(false)}
//           className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50 p-4"
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6"
//           >
//             <h3 className="text-2xl font-bold text-gray-900 mb-2">
//               Choisir le format de téléchargement
//             </h3>
//             <p className="text-sm text-gray-600 mb-6">
//               Sélectionnez le format dans lequel vous souhaitez télécharger
//               votre fichier traité
//             </p>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
//               {exportFormats.map((format) => (
//                 <button
//                   key={format.value}
//                   onClick={() => handleFormatSelection(format.value)}
//                   className={`p-4 rounded-lg border-2 transition-all text-left ${
//                     selectedFormat === format.value
//                       ? "border-blue-500 bg-blue-50"
//                       : "border-gray-200 hover:border-gray-300 bg-white"
//                   }`}
//                 >
//                   <div className="flex items-start gap-3">
//                     <div className="text-3xl">{format.icon}</div>
//                     <div className="flex-1">
//                       <div className="flex items-center gap-2 mb-1">
//                         <h4 className="font-semibold text-gray-900">
//                           {format.label}
//                         </h4>
//                         {selectedFormat === format.value && (
//                           <CheckCircle className="w-5 h-5 text-blue-600" />
//                         )}
//                       </div>
//                       <p className="text-sm text-gray-600">
//                         {format.description}
//                       </p>
//                     </div>
//                   </div>
//                 </button>
//               ))}
//             </div>

//             {selectedFormat === "csv" && availableSheets.length > 1 && (
//               <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
//                 <div className="flex items-start gap-2">
//                   <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
//                   <div className="text-sm text-blue-800">
//                     <strong>Info:</strong> Ce fichier contient{" "}
//                     {availableSheets.length} feuilles. Vous pourrez choisir
//                     comment les exporter après avoir cliqué sur Télécharger.
//                   </div>
//                 </div>
//               </div>
//             )}

//             {selectedFormat === "xlsb" && (
//               <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
//                 <div className="flex items-start gap-2">
//                   <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
//                   <div className="text-sm text-blue-800">
//                     <strong>Info:</strong> Le format XLSB sera téléchargé en
//                     XLSX (compatibilité).
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div className="flex gap-3">
//               <button
//                 onClick={() => {
//                   setShowFormatModal(false);
//                   setDownloadingFileId(null);
//                 }}
//                 className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
//               >
//                 Annuler
//               </button>
//               <button
//                 onClick={downloadWithFormat}
//                 className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium flex items-center justify-center gap-2"
//               >
//                 <Download className="w-5 h-5" />
//                 Télécharger en {selectedFormat.toUpperCase()}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Modal d'options CSV */}
//       {showCsvOptionsModal && (
//         <div
//           onClick={() => setShowCsvOptionsModal(false)}
//           className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center"
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
//           >
//             <h2 className="text-xl font-bold mb-4">Options CSV</h2>

//             <select
//               className="w-full border p-2 rounded mb-4"
//               value={csvOption}
//               onChange={(e) =>
//                 setCsvOption(e.target.value as "first" | "specific" | "combine")
//               }
//             >
//               <option value="first">Première feuille</option>
//               <option value="specific">Feuille spécifique</option>
//               <option value="combine">Combiner toutes les feuilles</option>
//             </select>

//             {/* si specific, on montre le select des feuilles */}
//             {csvOption === "specific" && (
//               <select
//                 className="w-full border p-2 rounded mb-4"
//                 value={selectedSheet}
//                 onChange={(e) => setSelectedSheet(e.target.value)}
//               >
//                 {availableSheets.map((sheet) => (
//                   <option key={sheet} value={sheet}>
//                     {sheet}
//                   </option>
//                 ))}
//               </select>
//             )}

//             <button
//               onClick={performDownload}
//               className="w-full bg-green-600 text-white py-2 rounded"
//             >
//               Télécharger
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ExcelProcessorApp;

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
import { apiService, ApiError } from "../services/convertionService";
import type {
  FileHistoryRecord,
  ProcessedRecord,
  ExportFormat,
} from "../services/convertionService";

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

  const [searchText, setSearchText] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadFileName, setUploadFileName] = useState<string>("");

  // Nouveaux états pour le choix de format
  const [showFormatModal, setShowFormatModal] = useState<boolean>(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("xlsx");
  const [exportFormats, setExportFormats] = useState<ExportFormat[]>([]);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(
    null
  );

  // États pour les options CSV
  const [showCsvOptionsModal, setShowCsvOptionsModal] =
    useState<boolean>(false);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [csvOption, setCsvOption] = useState<"first" | "specific" | "combine">(
    "first"
  );
  const [selectedSheet, setSelectedSheet] = useState<string>("");

  // États pour la navigation entre les feuilles dans l'aperçu
  const [currentSheetIndex, setCurrentSheetIndex] = useState<number>(0);

  useEffect(() => {
    checkServerStatus();
    loadHistory();
    loadExportFormats();
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
      setCurrentPage(1);
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error);
      if (error instanceof ApiError) {
        setValidationErrors([error.message]);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadExportFormats = async (): Promise<void> => {
    try {
      const formats = await apiService.getExportFormats();
      setExportFormats(formats);
    } catch (error) {
      console.error("Erreur lors du chargement des formats:", error);
    }
  };

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

    const fileDate = new Date(entry.upload_date);
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

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

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
      const result = await apiService.uploadFile(
        file,
        (progress) => {
          setUploadProgress(Math.round(progress));
        },
        uploadFileName.trim()
      );

      setValidationSuccess(true);
      setProcessedData(result.data);
      setCurrentSheetIndex(0); // Réinitialiser à la première feuille
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

  const openFormatModal = async (fileId: string): Promise<void> => {
    setDownloadingFileId(fileId);
    setSelectedFormat("xlsx");
    setShowFormatModal(true);

    // Charger les feuilles disponibles pour ce fichier
    try {
      const sheets = await apiService.getFileSheets(fileId);
      setAvailableSheets(sheets);
      if (sheets.length > 0) {
        setSelectedSheet(sheets[0]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des feuilles:", error);
      setAvailableSheets([]);
    }
  };

  const handleFormatSelection = (format: string): void => {
    setSelectedFormat(format);

    // Si CSV est sélectionné et qu'il y a plusieurs feuilles, demander l'option
    if (format === "csv" && availableSheets.length > 1) {
      // Ne pas fermer le modal, juste passer en mode CSV options
    }
  };

  const downloadWithFormat = async (): Promise<void> => {
    if (!downloadingFileId) return;

    // Si CSV et plusieurs feuilles, ouvrir le modal d'options CSV
    if (selectedFormat === "csv" && availableSheets.length > 1) {
      setShowFormatModal(false);
      setShowCsvOptionsModal(true);
      return;
    }

    // Sinon, télécharger directement
    await performDownload();
  };

  const performDownload = async (): Promise<void> => {
    if (!downloadingFileId) return;

    try {
      const entry = history.find((h) => h.file_id === downloadingFileId);
      const filename = entry?.processed_filename || undefined;

      let csvOptions = undefined;

      if (selectedFormat === "csv") {
        if (csvOption === "specific" && selectedSheet) {
          csvOptions = { sheet: selectedSheet };
        } else if (csvOption === "combine") {
          csvOptions = { combine: true };
        }
      }

      await apiService.downloadProcessedFileWithFormatAndSave(
        downloadingFileId,
        selectedFormat,
        filename,
        csvOptions
      );

      setShowFormatModal(false);
      setShowCsvOptionsModal(false);
      setDownloadingFileId(null);
      setCsvOption("first");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      alert("Erreur lors du téléchargement du fichier");
    }
  };

  const downloadProcessedFile = async (): Promise<void> => {
    try {
      const historyData = await apiService.getHistory();
      const lastFile = historyData[0];
      if (lastFile && lastFile.file_id) {
        await openFormatModal(lastFile.file_id);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la préparation du téléchargement");
    }
  };


useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!processedData) return;
    
    const uniqueSheets = [...new Set(processedData.map((d) => d.sheet_names))];
    if (uniqueSheets.length <= 1) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setCurrentSheetIndex(prev => Math.max(0, prev - 1));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setCurrentSheetIndex(prev => Math.min(uniqueSheets.length - 1, prev + 1));
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [processedData]);


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
                      • Colonnes obligatoires : <strong>Nom</strong>,{" "}
                      <strong>Prénoms</strong>, <strong>Classe</strong>
                    </li>
                    <li>
                      • Le système génèrera automatiquement :{" "}
                      <strong>Email</strong>, <strong>Pseudo</strong> et{" "}
                      <strong>Mot de passe</strong>
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
            {processedData.length} enregistrement(s) traité(s) sur {[...new Set(processedData.map(d => d.sheet_names))].length} feuille(s).
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">
                          Aperçu des données traitées
                        </h3>
                      </div>

                      {/* Navigation entre les feuilles si plusieurs feuilles */}
                      {(() => {
                        const uniqueSheets = [
                          ...new Set(processedData.map((d) => d.sheet_names)),
                        ];
                        if (uniqueSheets.length > 1) {
                          return (
                            <div className="bg-gray-100 border-b border-gray-200 px-4 py-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                  Feuille {currentSheetIndex + 1} sur{" "}
                                  {uniqueSheets.length}:
                                </span>

                                <div className="flex items-center gap-2">
                                  {/* Bouton précédent */}
                                  <button
                                    onClick={() =>
                                      setCurrentSheetIndex((prev) =>
                                        Math.max(0, prev - 1)
                                      )
                                    }
                                    disabled={currentSheetIndex === 0}
                                    className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    title="Feuille précédente"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                      />
                                    </svg>
                                  </button>

                                  {/* Sélecteur de feuilles */}
                                  <div className="flex items-center gap-1">
                                    {uniqueSheets.map((sheetName, index) => (
                                      <button
                                        key={sheetName}
                                        onClick={() =>
                                          setCurrentSheetIndex(index)
                                        }
                                        className={`px-3 py-1 rounded-lg font-medium text-sm transition-all min-w-[80px] ${
                                          currentSheetIndex === index
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                                        }`}
                                        title={sheetName}
                                      >
                                        {sheetName.length > 8
                                          ? `${sheetName.substring(0, 8)}...`
                                          : sheetName}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Bouton suivant */}
                                  <button
                                    onClick={() =>
                                      setCurrentSheetIndex((prev) =>
                                        Math.min(
                                          uniqueSheets.length - 1,
                                          prev + 1
                                        )
                                      )
                                    }
                                    disabled={
                                      currentSheetIndex ===
                                      uniqueSheets.length - 1
                                    }
                                    className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    title="Feuille suivante"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                      />
                                    </svg>
                                  </button>
                                </div>

                                {/* Indicateur de données */}
                                <span className="text-sm text-gray-600">
                                  {(() => {
                                    const currentSheet =
                                      uniqueSheets[currentSheetIndex];
                                    const sheetData = processedData.filter(
                                      (d) => d.sheet_names === currentSheet
                                    );
                                    return `${sheetData.length} enregistrement(s)`;
                                  })()}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              {(() => {
                                const uniqueSheets = [
                                  ...new Set(
                                    processedData.map((d) => d.sheet_names)
                                  ),
                                ];
                                if (uniqueSheets.length > 1) {
                                  return (
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                      Feuille
                                    </th>
                                  );
                                }
                                return null;
                              })()}
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Nom
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Prénoms
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Pseudo
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Email
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Mot de passe
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Classe
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const uniqueSheets = [
                                ...new Set(
                                  processedData.map((d) => d.sheet_names)
                                ),
                              ];
                              let displayData = processedData;

                              // Filtrer par feuille si plusieurs feuilles
                              if (uniqueSheets.length > 1) {
                                const currentSheet =
                                  uniqueSheets[currentSheetIndex];
                                displayData = processedData.filter(
                                  (d) => d.sheet_names === currentSheet
                                );
                              }

                              return displayData
                                .slice(0, 10)
                                .map((row, index) => (
                                  <tr
                                    key={index}
                                    className="border-t border-gray-200"
                                  >
                                    {uniqueSheets.length > 1 && (
                                      <td className="px-4 py-3 text-sm text-purple-600 font-medium">
                                        {row.sheet_names}
                                      </td>
                                    )}
                                    <td className="px-4 py-3 text-sm text-gray-800">
                                      {row.nom}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-800">
                                      {row.prenoms}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-800">
                                      {row.pseudo}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-blue-600">
                                      {row.email}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                                      {row.mot_de_passe}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                                      {row.classe}
                                    </td>
                                  </tr>
                                ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                      {(() => {
                        const uniqueSheets = [
                          ...new Set(processedData.map((d) => d.sheet_names)),
                        ];
                        let displayData = processedData;

                        if (uniqueSheets.length > 1) {
                          const currentSheet = uniqueSheets[currentSheetIndex];
                          displayData = processedData.filter(
                            (d) => d.sheet_names === currentSheet
                          );
                        }

                        if (displayData.length > 10) {
                          return (
                            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-sm text-gray-600 text-center">
                              ... et {displayData.length - 10} autre(s)
                              enregistrement(s) dans cette feuille
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <button
                      onClick={downloadProcessedFile}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Télécharger le Fichier Traité
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
                    <div className="text-sm text-gray-600">
                      Affichage de {startIndex + 1} à{" "}
                      {Math.min(endIndex, filteredHistory.length)} sur{" "}
                      {filteredHistory.length} résultat(s)
                    </div>

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
                                    onClick={() =>
                                      openFormatModal(entry.file_id)
                                    }
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

      {/* Modal d'upload */}
      {showUploadModal && (
        <div
          onClick={() => setShowUploadModal(false)}
          className="fixed inset-0 bg-black/75 bg-opacity-10 flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6"
          >
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

      {/* Modal de choix de format */}
      {showFormatModal && (
        <div
          onClick={() => setShowFormatModal(false)}
          className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Choisir le format de téléchargement
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Sélectionnez le format dans lequel vous souhaitez télécharger
              votre fichier traité
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {exportFormats.map((format) => (
                <button
                  key={format.value}
                  onClick={() => handleFormatSelection(format.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedFormat === format.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{format.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {format.label}
                        </h4>
                        {selectedFormat === format.value && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {format.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedFormat === "csv" && availableSheets.length > 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>Info:</strong> Ce fichier contient{" "}
                    {availableSheets.length} feuilles. Vous pourrez choisir
                    comment les exporter après avoir cliqué sur Télécharger.
                  </div>
                </div>
              </div>
            )}

            {selectedFormat === "xlsb" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>Info:</strong> Le format XLSB sera téléchargé en
                    XLSX (compatibilité).
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFormatModal(false);
                  setDownloadingFileId(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={downloadWithFormat}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Télécharger en {selectedFormat.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'options CSV */}
      {showCsvOptionsModal && (
        <div
          onClick={() => setShowCsvOptionsModal(false)}
          className="fixed inset-0 bg-black/75 bg-opacity-50 flex items-center justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">Options CSV</h2>

            <select
              className="w-full border p-2 rounded mb-4"
              value={csvOption}
              onChange={(e) =>
                setCsvOption(e.target.value as "first" | "specific" | "combine")
              }
            >
              <option value="first">Première feuille</option>
              <option value="specific">Feuille spécifique</option>
              <option value="combine">Combiner toutes les feuilles</option>
            </select>

            {/* si specific, on montre le select des feuilles */}
            {csvOption === "specific" && (
              <select
                className="w-full border p-2 rounded mb-4"
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
              >
                {availableSheets.map((sheet) => (
                  <option key={sheet} value={sheet}>
                    {sheet}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={performDownload}
              className="w-full bg-green-600 text-white py-2 rounded"
            >
              Télécharger
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelProcessorApp;
