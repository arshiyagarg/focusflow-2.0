import { useEffect, useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  Eye, 
  Loader2, 
  FileDown, 
  X, 
  Search, 
  Clock, 
  FileText, 
  Link as LinkIcon, 
  PlayCircle,
  Hash,
  ArrowLeft,
  ChevronLeft
} from "lucide-react";
import { jsPDF } from "jspdf";

import { useContentOutputStore } from "@/store/useContentOutput";
import { useUploadStore } from "@/store/useUploadStore";
import { htmlToPlainText, urlToFileName } from "@/lib/utils";
import { contentToPlainText } from "@/store/contentforlearninghistory";
import { Button } from "@/components/ui/button";
import { useStudyStore } from "@/store/useStudyTemp";
import { useFocusTracker } from "@/hooks/useFocusTracker";

type ViewMode = "grid" | "detail";

export const MyLearningHistory = () => {
  const { contentOutputs = [], getMyContentOutputs } = useContentOutputStore();
  const { startSession, endSession } = useStudyStore();
  const { getBlobContent } = useUploadStore();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDownloadingId, setIsDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    getMyContentOutputs();
  }, [getMyContentOutputs]);

  // ---------------- VIEW ----------------

  useFocusTracker(isPreviewOpen);
  
  const handleView = async (output: any) => {
    if (output.status !== "READY" || !output.processedBlobName) return;
  const filteredOutputs = useMemo(() => {
    if (!Array.isArray(contentOutputs)) return [];
    return contentOutputs.filter((o: any) => 
      urlToFileName(o.rawStorageRef || "").toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a: any, b: any) => {
      const dateA = a.processedAt ? new Date(a.processedAt).getTime() : 0;
      const dateB = b.processedAt ? new Date(b.processedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [contentOutputs, searchQuery]);

  const fetchContent = async (output: any) => {
    if (output.status !== "READY" || !output.processedBlobName) return "";
    try {
      const response = await getBlobContent("text", output.processedBlobName);
      return contentToPlainText(response);
    } catch (err) {
      console.error("Fetch failed", err);
      return "";
    }
  };

  const handleView = async (output: any) => {
    console.log("[Learning History] Starting session for history item");
    await startSession(output.contentId); // Start session in backend

    setActiveId(output.contentId);
    setLoadingId(output.contentId);
    setPreviewText("");
    setViewMode("detail");

    const text = await fetchContent(output);
    setPreviewText(text);
    setLoadingId(null);
  };

  const generatePDF = (text: string, filename: string) => {
    if (!text) return;
    const pdf = new jsPDF();
    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(htmlToPlainText(text), 180);
    pdf.text(lines, 15, 20);
    pdf.save(`${filename}.pdf`);
  };

  const handleDownload = async (output: any) => {
    const filename = `focusflow-${urlToFileName(output.rawStorageRef || output.contentId)}`;
    
    if (activeId === output.contentId && previewText) {
      generatePDF(previewText, filename);
      return;
    }

    setIsDownloadingId(output.contentId);
    const text = await fetchContent(output);
    if (text) {
      generatePDF(text, filename);
    }
    setIsDownloadingId(null);
  };

  const handleBack = async () => {
    console.log("[Learning History] Ending session and returning to grid");
    await endSession(); // End session in backend
    setViewMode("grid");
    setPreviewText("");
    setActiveId(null);
    setLoadingId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "READY": return "bg-green-100 text-green-700 border-green-200";
      case "PROCESSING": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-stone-100 text-stone-600 border-stone-200";
    }
  };

  const getTypeIcon = (ref: string) => {
    const lower = (ref || "").toLowerCase();
    if (lower.includes('.pdf')) return <FileText className="w-4 h-4 text-orange-500" />;
    if (lower.startsWith('http')) return <LinkIcon className="w-4 h-4 text-blue-500" />;
    if (lower.includes('video')) return <PlayCircle className="w-4 h-4 text-red-500" />;
    return <FileText className="w-4 h-4 text-stone-500" />;
  };

  if (viewMode === "detail") {
    const activeItem = contentOutputs.find(o => o.contentId === activeId);
    const filename = activeItem ? urlToFileName(activeItem.rawStorageRef || "") : "Summary";


    return (
      <div className="flex flex-col h-[calc(100vh-180px)] glass-card overflow-hidden animate-fade-in">
        {/* Fixed Detail Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-background/50 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              className="rounded-full hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h3 className="text-xl font-bold truncate max-w-[300px]" title={filename}>
                {filename}
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Detail View</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(activeItem)}
              className="gap-2 text-xs font-bold"
              disabled={loadingId !== null || !previewText}
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 leading-relaxed custom-scrollbar">
          {loadingId ? (
            <div className="flex flex-col items-center justify-center gap-4 h-full text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm font-medium animate-pulse">Retrieving your insights...</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-4">
              <div className="prose prose-stone dark:prose-invert max-w-none prose-p:leading-relaxed">
                <div className="whitespace-pre-wrap font-sans text-foreground/90 text-lg">
                  {previewText}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-gradient">Learning History</h2>
          <p className="text-sm text-muted-foreground mt-1">Review and manage your processed materials</p>
        </div>

        <div className="relative group max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search by filename..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none"
          />
        </div>
      </div>

      {/* Grid of Content */}
      {filteredOutputs.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4 border-dashed border-2">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Hash className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg">No records found</h3>
            <p className="text-muted-foreground text-sm">Upload some content to your labs to get started.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOutputs.map((o: any) => (
            <div 
              key={o.contentId} 
              className="glass-card p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-lg bg-background border border-border shadow-sm">
                    {getTypeIcon(o.rawStorageRef)}
                  </div>
                  <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(o.status)}`}>
                    {o.status}
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors" title={urlToFileName(o.rawStorageRef || "")}>
                    {urlToFileName(o.rawStorageRef || "")}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {o.processedAt ? formatDistanceToNow(new Date(o.processedAt), { addSuffix: true }) : "N/A"}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                {o.status === "READY" ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 gap-2 text-xs font-bold hover:bg-primary/5 hover:text-primary"
                    onClick={() => handleView(o)}
                    disabled={isDownloadingId === o.contentId}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Summary
                  </Button>
                ) : (
                  <div className="flex-1 flex justify-center py-2 text-[10px] font-bold text-muted-foreground bg-muted/30 rounded-lg animate-pulse">
                    PROCESSING...
                  </div>
                )}
                
                {o.status === "READY" && (
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-muted-foreground hover:text-green-600 hover:bg-green-50"
                    onClick={() => handleDownload(o)}
                    disabled={isDownloadingId === o.contentId}
                  >
                    {isDownloadingId === o.contentId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyLearningHistory;
