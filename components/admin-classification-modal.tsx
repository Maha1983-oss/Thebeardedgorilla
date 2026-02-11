"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ClassificationItem {
  name: string;
  category: string;
}

interface AdminClassificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onSave: (classifications: Record<string, string>) => void;
}

const classificationCategories = [
  "Other Revenue",
  "Qual Revenue",
  "Quant Revenue",
  "Cost of Sales (Qual)",
  "Cost of Sales (Quant)",
  "Cost of Sales (Other)",
  "Cost of Sales",
  "Admin Cost",
  "Employment Cost",
  "Financing Cost",
  "Tax Cost",
];

export default function AdminClassificationModal({
  isOpen,
  onClose,
  categories,
  onSave,
}: AdminClassificationModalProps) {
  const [classificationItems, setClassificationItems] = useState<
    ClassificationItem[]
  >([]);
  const [saving, setSaving] = useState(false);

  // Initialize classification items when categories change
  useEffect(() => {
    if (categories && categories.length > 0) {
      const items = categories.map((category) => ({
        name: category,
        category: "", // Will be selected by admin
      }));
      setClassificationItems(items);
    }
  }, [categories]);

  const handleCategoryChange = (index: number, category: string) => {
    const updated = [...classificationItems];
    updated[index].category = category;
    setClassificationItems(updated);
  };

  const handleSave = async () => {
    // Check if all items have been classified
    const unclassified = classificationItems.filter((item) => !item.category);
    if (unclassified.length > 0) {
      toast.error("Please classify all categories", {
        description: `${unclassified.length} categories still need to be classified.`,
      });
      return;
    }

    setSaving(true);
    try {
      // Convert to classifications object
      const classifications: Record<string, string> = {};
      classificationItems.forEach((item) => {
        classifications[item.name] = item.category;
      });

      // Save to global classifications
      const response = await fetch("/api/global-classifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classifications }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save classifications");
      }

      toast.success("Classifications saved successfully!", {
        description: "All client2 users will now use these classifications.",
      });

      onSave(classifications);
      onClose();
    } catch (error: unknown) {
      console.error("Error saving classifications:", error);
      toast.error("Failed to save classifications", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    } finally {
      setSaving(false);
    }
  };

  const allClassified = classificationItems.every((item) => item.category);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Classify P&L Categories</DialogTitle>
          <DialogDescription>
            Please assign classification categories to all line items found in
            the P&L data. These classifications will be applied to all client2
            users automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Found {categories.length} categories that need classification:
          </p>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {classificationItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-3 border rounded-lg"
              >
                <div className="flex-1 font-medium text-sm">{item.name}</div>
                <select
                  value={item.category}
                  onChange={(e) => handleCategoryChange(idx, e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm min-w-[200px]"
                >
                  <option value="">Select classification...</option>
                  {classificationCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {!allClassified && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              ⚠️ Please classify all {classificationItems.length} categories
              before saving.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!allClassified || saving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Saving...
              </>
            ) : (
              "Save Classifications"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
