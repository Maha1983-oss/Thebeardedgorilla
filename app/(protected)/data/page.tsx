"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useCSVStatus } from "@/lib/hooks/use-csv-data";
import { useUser } from "@/lib/hooks/use-user";
import { clearCache } from "@/lib/cache";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UploadStatus {
  shopify: boolean;
  tiktok: boolean;
  subscription: boolean;
  pl_client1: boolean;
  pl_client2: boolean;
  sgd_transactions: boolean;
  usd_transactions: boolean;
  pl_client3: boolean;
  cashflow_client3: boolean;
  pipeline_client3: boolean;
  sgd_sankey_client3: boolean;
  usd_sankey_client3: boolean;
}

export default function DataUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [currentUpload, setCurrentUpload] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);
  const router = useRouter();

  // Use React Query hooks for user and CSV status
  const { data: session, isLoading: isLoadingUser } = useUser();
  const { data: uploadStatus, refetch: refetchStatus } = useCSVStatus();

  // Default status while loading
  const status = uploadStatus || {
    shopify: false,
    tiktok: false,
    subscription: false,
    pl_client1: false,
    pl_client2: false,
    sgd_transactions: false,
    usd_transactions: false,
    pl_client3: false,
    cashflow_client3: false,
    pipeline_client3: false,
    sgd_sankey_client3: false,
    usd_sankey_client3: false,
  };

  useEffect(() => {
    // Redirect if not admin
    if (!isLoadingUser && session && session.role !== "admin") {
      router.push("/unauthorized");
    }
  }, [session, isLoadingUser, router]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Invalid file type", {
        description: `Please upload a valid CSV file for ${fileType}`,
      });
      return;
    }

    setUploading(true);
    setCurrentUpload(fileType);

    try {
      const Papa = await import("papaparse");
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

      // Check JSON size to decide if we need chunked upload
      const jsonPayload = JSON.stringify({
        fileType,
        data: parsed.data,
      });
      const jsonSizeMB = new Blob([jsonPayload]).size / (1024 * 1024);

      let responseData;

      // Use chunked upload if file is > 3.5MB (to be safe)
      if (jsonSizeMB > 3.5) {
        toast.info("Large file detected, using chunked upload...", {
          description: `File size: ${jsonSizeMB.toFixed(2)}MB`,
        });

        // Generate unique upload ID
        const uploadId = `${fileType}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`;

        // Split data into chunks (each chunk should be < 3MB when stringified)
        const chunkSize = Math.ceil(
          parsed.data.length / Math.ceil(jsonSizeMB / 3)
        );
        const chunks: any[][] = [];

        for (let i = 0; i < parsed.data.length; i += chunkSize) {
          chunks.push(parsed.data.slice(i, i + chunkSize));
        }

        const totalChunks = chunks.length;

        // Upload chunks sequentially
        for (let i = 0; i < chunks.length; i++) {
          const chunkPayload = JSON.stringify({
            uploadId,
            chunkIndex: i,
            totalChunks,
            fileType,
            chunkData: chunks[i],
          });

          const chunkResponse = await fetch("/api/csv-data/chunk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: chunkPayload,
          });

          if (!chunkResponse.ok) {
            const errorData = await chunkResponse.json().catch(() => ({}));
            throw new Error(
              errorData.error ||
                `Failed to upload chunk ${i + 1}/${totalChunks}`
            );
          }

          const chunkResult = await chunkResponse.json();

          // Update progress
          toast.info(`Uploading... ${i + 1}/${totalChunks} chunks`, {
            description: `Processing chunk ${i + 1} of ${totalChunks}`,
          });

          // If all chunks are received, the server has already processed the data
          if (chunkResult.complete) {
            responseData = chunkResult;
            break;
          }
        }
      } else {
        // Normal upload for smaller files
        const response = await fetch("/api/csv-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: jsonPayload,
        });

        if (!response.ok) {
          // Handle 413 (Payload Too Large) - fallback to chunked upload
          if (response.status === 413) {
            toast.info("File too large, retrying with chunked upload...");
            // Retry with chunked upload (recursive call would be cleaner, but let's inline it)
            const uploadId = `${fileType}-${Date.now()}-${Math.random()
              .toString(36)
              .substring(7)}`;
            const chunkSize = Math.ceil(
              parsed.data.length / Math.ceil(jsonSizeMB / 3)
            );
            const chunks: any[][] = [];

            for (let i = 0; i < parsed.data.length; i += chunkSize) {
              chunks.push(parsed.data.slice(i, i + chunkSize));
            }

            for (let i = 0; i < chunks.length; i++) {
              const chunkResponse = await fetch("/api/csv-data/chunk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  uploadId,
                  chunkIndex: i,
                  totalChunks: chunks.length,
                  fileType,
                  chunkData: chunks[i],
                }),
              });

              const chunkResult = await chunkResponse.json();
              if (chunkResult.complete) {
                responseData = chunkResult;
                break;
              }
            }
          } else {
            // Other errors
            let errorMessage = "Upload failed";
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              errorMessage =
                response.statusText || `Server error (${response.status})`;
            }
            throw new Error(errorMessage);
          }
        } else {
          responseData = await response.json();
        }
      }

      // Clear cache and refetch status
      clearCache("csv-data");
      clearCache("csv-status");

      // Clear client2 dedicated cache if client2 data was uploaded
      if (
        fileType === "pl_client2" ||
        fileType === "sgd_transactions" ||
        fileType === "usd_transactions"
      ) {
        clearCache("csv-data-client2");
      }

      // Clear client3 dedicated cache if client3 data was uploaded
      if (
        fileType === "pl_client3" ||
        fileType === "cashflow_client3" ||
        fileType === "pipeline_client3" ||
        fileType === "sgd_sankey_client3" ||
        fileType === "usd_sankey_client3"
      ) {
        clearCache("csv-data-client3");
      }

      refetchStatus();

      // Auto-assign classifications for pl_client2 using predefined mappings
      if (
        fileType === "pl_client2" &&
        responseData.extractedCategories?.length > 0
      ) {
        // Predefined classification mappings
        const predefinedClassifications: Record<string, string> = {
          // ADNA Research classifications
          "Other Revenue": "Other Revenue",
          "Research Revenue - Qualitative": "Qual Revenue",
          "Research Revenue - Quantitative": "Quant Revenue",
          "Research Costs (Qual)": "Cost of Sales (Qual)",
          "Research Costs (Quant)": "Cost of Sales (Quant)",
          "Translation Costs": "Cost of Sales (Quant)",
          Others: "Cost of Sales (Other)",
          "AWS (Server Costs)": "Cost of Sales",
          Advertising: "Admin Cost",
          "Bank Fees": "Admin Cost",
          "Bank Revaluations": "Admin Cost",
          "Consulting & Accounting": "Admin Cost",
          "Corporate Secretarial Fees": "Admin Cost",
          Entertainment: "Admin Cost",
          "Freight & Courier": "Admin Cost",
          "General Expenses": "Admin Cost",
          "Legal expenses": "Admin Cost",
          "Office Expenses": "Admin Cost",
          "Printing & Stationery": "Admin Cost",
          "Realised Currency Gains": "Admin Cost",
          Depreciation: "Admin Cost",
          "Stripe Fees T": "Admin Cost",
          Subscriptions: "Admin Cost",
          "Travel - International": "Admin Cost",
          "Travel - National": "Admin Cost",
          "Unrealised Currency Gains": "Admin Cost",
          Website: "Admin Cost",
          Server: "Admin Cost",
          "CDAC/SINDA/MENDAKI/Others": "Employment Cost",
          Commission: "Employment Cost",
          "CPF - Indirect Team": "Employment Cost",
          "CPF - Research Team": "Employment Cost",
          "Employee SDL": "Employment Cost",
          Insurance: "Employment Cost",
          "Salaries - Indirect Team": "Employment Cost",
          "Salaries - Research Team": "Employment Cost",
          "Salaries - Tech Team": "Employment Cost",
          "Salaries - Sales and Marketing": "Employment Cost",
          "Salaries - Account Servicing": "Employment Cost",
          Bonuses: "Employment Cost",
          Senor: "Employment Cost",
          "Interest Expense": "Financing Cost",

          // E-commerce classifications (if Client2 also uses this data)
          "Shopify Sales": "Other Revenue",
          "Shopify Discounts": "Other Revenue",
          "Shopify Refunds": "Other Revenue",
          "Shopify Shipping Income": "Other Revenue",
          "TikTok Sales": "Other Revenue",
          "TikTok Discounts": "Other Revenue",
          "TikTok Refunds": "Other Revenue",
          "TikTok Shipping Income": "Other Revenue",
          "Cost of Goods Sold": "Cost of Sales",
          "Shopify Fees": "Admin Cost",
          "TikTok Commissions": "Admin Cost",
          "Dolphin International": "Cost of Sales",
          Shippo: "Cost of Sales",
          "TikTok Shipping": "Cost of Sales",
          "Shipping Supplies - COS": "Cost of Sales",
          "Advertising & Marketing": "Admin Cost",
          "Computer and Software Expenses": "Admin Cost",
          Contractors: "Admin Cost",
          "Cash back": "Other Revenue",
          "Interest Income": "Other Revenue",
          "Automobile Expenses": "Admin Cost",
          "Continuing Education": "Admin Cost",
          "Legal & Professional Fees": "Admin Cost",
          "Meals & Entertainment": "Admin Cost",
          "Office Supplies": "Admin Cost",
          "Taxes and Licenses": "Admin Cost",
          TBD: "Admin Cost",
          Travel: "Admin Cost",
        };

        // Auto-save classifications to global database
        try {
          const classificationResponse = await fetch(
            "/api/global-classifications",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                classifications: predefinedClassifications,
              }),
            }
          );

          if (classificationResponse.ok) {
            toast.success("Upload successful!", {
              description: `${getFileLabel(
                fileType
              )} has been uploaded. Categories auto-assigned.`,
            });
          } else {
            throw new Error("Failed to save classifications");
          }
        } catch (error) {
          console.error("Error saving classifications:", error);
          toast.warning("Upload successful but classifications not saved", {
            description: `${getFileLabel(
              fileType
            )} has been uploaded but auto-classification failed.`,
          });
        }
      } else {
        toast.success("Upload successful!", {
          description: `${getFileLabel(
            fileType
          )} has been uploaded and is now available.`,
        });
      }
    } catch (error: unknown) {
      console.error("Upload error:", error);
      toast.error("Upload failed", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while uploading.",
      });
    } finally {
      setUploading(false);
      setCurrentUpload("");
      // Reset file input
      event.target.value = "";
    }
  };

  const getFileLabel = (key: string) => {
    const labels: Record<string, string> = {
      shopify: "Shopify Orders",
      tiktok: "TikTok Orders",
      subscription: "Subscriptions",
      pl_client1: "P&L - LiquidPlus",
      pl_client2: "P&L - ADNA Research",
      sgd_transactions: "SGD Bank Transactions",
      usd_transactions: "USD Bank Transactions",
      pl_client3: "P&L Statement - Client 3",
      cashflow_client3: "Cashflow - Client 3",
      pipeline_client3: "Pipeline - Client 3",
      sgd_sankey_client3: "SGD Cashflow Analysis - Client 3",
      usd_sankey_client3: "USD Cashflow Analysis - Client 3",
    };
    return labels[key] || key;
  };

  const getFileDescription = (key: string) => {
    const descriptions: Record<string, string> = {
      shopify: "Upload order data from Shopify platform",
      tiktok: "Upload order data from TikTok Shop",
      subscription: "Upload subscription customer data",
      pl_client1: "Upload profit & loss data for LiquidPlus",
      pl_client2: "Upload profit & loss data for ADNA Research",
      sgd_transactions:
        "Upload SGD bank statement for cashflow visualization (ADNA Research)",
      usd_transactions:
        "Upload USD bank statement for cashflow visualization (ADNA Research)",
      pl_client3: "Upload office-wise profit & loss data",
      cashflow_client3: "Upload office-wise cashflow data",
      pipeline_client3: "Upload sales pipeline with opportunities",
      sgd_sankey_client3: "Upload SGD bank statement for cashflow analysis",
      usd_sankey_client3: "Upload USD bank statement for cashflow analysis",
    };
    return descriptions[key] || "";
  };

  // Classification functions removed - now auto-assigned

  if (!session) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
      </div>
    );
  }

  // Organize by client for better UX
  // To add a new client: Add a new object here with unique clientName, clientCode, color, and files
  const clientDataSections = [
    {
      clientName: "LiquidPlus",
      clientCode: "Client 1",
      color: "blue",
      description: "E-commerce business tracking Shopify & TikTok sales",
      files: [
        { key: "shopify", icon: "📦", label: "Shopify Orders" },
        { key: "tiktok", icon: "🎵", label: "TikTok Orders" },
        { key: "subscription", icon: "💎", label: "Subscriptions" },
        { key: "pl_client1", icon: "📊", label: "P&L Statement" },
      ],
    },
    {
      clientName: "ADNA Research",
      clientCode: "Client 2",
      color: "purple",
      description: "Research company with qualitative & quantitative services",
      files: [
        { key: "pl_client2", icon: "📈", label: "P&L Statement" },
        { key: "sgd_transactions", icon: "💰", label: "SGD Bank Transactions" },
        { key: "usd_transactions", icon: "💵", label: "USD Bank Transactions" },
      ],
    },
    {
      clientName: "Client 3",
      clientCode: "Client 3",
      color: "green",
      description:
        "Multi-office operations with comprehensive financial tracking",
      files: [
        { key: "pl_client3", icon: "📊", label: "P&L Statement" },
        { key: "cashflow_client3", icon: "💸", label: "Cashflow" },
        { key: "pipeline_client3", icon: "🎯", label: "Pipeline" },
        {
          key: "sgd_sankey_client3",
          icon: "💰",
          label: "SGD Cashflow Analysis",
        },
        {
          key: "usd_sankey_client3",
          icon: "💵",
          label: "USD Cashflow Analysis",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <FileText className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage CSV data files for all clients
          </p>
        </div>
      </div>

      {/* Tabs for Client Navigation */}
      <Tabs defaultValue={clientDataSections[0]?.clientCode} className="w-full">
        <TabsList className="bg-muted p-1 rounded-lg">
          {clientDataSections.map((section) => {
            const uploadedCount = section.files.filter(
              (f) => status[f.key as keyof UploadStatus]
            ).length;
            const totalCount = section.files.length;

            return (
              <TabsTrigger
                key={section.clientCode}
                value={section.clientCode}
                className="data-[state=active]:bg-background relative"
              >
                {section.clientName}
                <Badge
                  variant={
                    uploadedCount === totalCount ? "default" : "secondary"
                  }
                  className="ml-2"
                >
                  {uploadedCount}/{totalCount}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {clientDataSections.map((section) => (
          <TabsContent
            key={section.clientCode}
            value={section.clientCode}
            className="mt-6 space-y-4"
          >
            {/* Client Description */}
            <div className="text-center mb-6">
              <Badge
                variant="outline"
                className={`mb-2 ${
                  section.color === "blue"
                    ? "border-blue-400 text-blue-700"
                    : section.color === "purple"
                    ? "border-purple-400 text-purple-700"
                    : "border-green-400 text-green-700"
                }`}
              >
                {section.clientCode}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            </div>

            {/* File Upload Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.files.map((file) => (
                <Card
                  key={file.key}
                  className={`transition-all hover:shadow-lg ${
                    status[file.key as keyof UploadStatus]
                      ? "border-green-500 shadow-md bg-green-50"
                      : "border-border hover:border-gray-400"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{file.icon}</span>
                        <div>
                          <CardTitle className="text-base">
                            {file.label}
                          </CardTitle>
                          {status[file.key as keyof UploadStatus] && (
                            <Badge
                              variant="default"
                              className="bg-green-600 mt-1"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-xs mt-2">
                      {getFileDescription(file.key)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileUpload(e, file.key)}
                        disabled={uploading}
                        className="hidden"
                      />
                      <Button
                        variant={
                          status[file.key as keyof UploadStatus]
                            ? "outline"
                            : "default"
                        }
                        size="sm"
                        className="w-full"
                        disabled={uploading}
                        asChild
                      >
                        <div>
                          {uploading && currentUpload === file.key ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3 mr-2" />
                              {status[file.key as keyof UploadStatus]
                                ? "Re-upload"
                                : "Upload CSV"}
                            </>
                          )}
                        </div>
                      </Button>
                    </label>
                    {status[file.key as keyof UploadStatus] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={uploading}
                        onClick={() => {
                          setPendingDeleteKey(file.key);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove CSV</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this CSV file? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setPendingDeleteKey(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!pendingDeleteKey) return;
                try {
                  const res = await fetch(
                    `/api/csv-data?fileType=${pendingDeleteKey}`,
                    {
                      method: "DELETE",
                    }
                  );
                  if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Delete failed");
                  }
                  clearCache("csv-data");
                  clearCache("csv-status");
                  if (
                    pendingDeleteKey === "pl_client2" ||
                    pendingDeleteKey === "sgd_transactions" ||
                    pendingDeleteKey === "usd_transactions"
                  ) {
                    clearCache("csv-data-client2");
                  }
                  refetchStatus();
                  toast.success("File removed", {
                    description: `${getFileLabel(
                      pendingDeleteKey
                    )} has been removed.`,
                  });
                } catch (err: unknown) {
                  toast.error("Delete failed", {
                    description:
                      err instanceof Error ? err.message : "Unexpected error",
                  });
                } finally {
                  setDeleteDialogOpen(false);
                  setPendingDeleteKey(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Classification modal removed - categories are now auto-assigned */}
    </div>
  );
}
