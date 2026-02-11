// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
  Download,
} from "lucide-react";
import { useCSVData } from "@/lib/hooks/use-csv-data";

export default function OrderUnifier() {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(null);
  const [downloadLinks, setDownloadLinks] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("financials");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSentimentCategory, setSelectedSentimentCategory] =
    useState(null);
  const [safetyBuffer, setSafetyBuffer] = useState(17.5);
  const [growthRate, setGrowthRate] = useState(0);
  const [currentInventory, setCurrentInventory] = useState({});
  const [expandedPLSections, setExpandedPLSections] = useState({
    revenue: false,
    otherIncome: false,
    discounts: false,
    cogs: false,
    opex: false,
    uncategorized: false,
  });

  // Use React Query hook for cached data
  const { data: csvData, isLoading, error } = useCSVData();

  // Auto-process data when it's available
  useEffect(() => {
    if (csvData && !dataLoaded) {
      processData(csvData);
    }
  }, [csvData, dataLoaded]);

  // Handle loading and error states
  useEffect(() => {
    if (isLoading) {
      setStatus({ type: "info", message: "Loading data from server..." });
      setProcessing(true);
    } else if (error) {
      setStatus({
        type: "error",
        message: `Error loading data: ${error.message}`,
      });
      setProcessing(false);
    }
  }, [isLoading, error]);

  const processData = async (data: any) => {
    setProcessing(true);
    setStatus({ type: "info", message: "Processing data..." });

    try {
      // Check if any data exists
      if (
        !data.shopify &&
        !data.tiktok &&
        !data.subscription &&
        !data.pl_client1
      ) {
        setStatus({
          type: "error",
          message:
            "No data available. Please contact your administrator to upload data.",
        });
        setProcessing(false);
        return;
      }

      // Process the fetched data
      await handleProcess(data);
      setDataLoaded(true);
    } catch (error: any) {
      setStatus({
        type: "error",
        message: `Error processing data: ${error.message}`,
      });
      setProcessing(false);
    }
  };

  const standardizeProductName = (rawName) => {
    const name = String(rawName).toLowerCase().trim();
    if (name.includes("28")) return "28-Pouch Pack";
    else if (name.includes("14")) return "14-Pouch Pack";
    else if (name.includes("7")) return "7-Pouch Pack";
    return rawName;
  };

  const autoClassifyPLLineItem = (lineItem) => {
    const name = String(lineItem).toLowerCase().trim();
    if (
      name.includes("shopify") &&
      (name.includes("sales") || name.includes("income"))
    )
      return "Shopify - Income";
    if (name.includes("shopify") && name.includes("refund"))
      return "Shopify Discounts";
    if (name.includes("shopify") && name.includes("discount"))
      return "Shopify Discounts";
    if (
      name.includes("tiktok") &&
      name.includes("shipping") &&
      name.includes("income")
    )
      return "TikTok - Income";
    if (name.includes("tiktok") && name.includes("shipping"))
      return "Cost of Goods Sold";
    if (name.includes("tiktok") && name.includes("refund"))
      return "TikTok Discounts";
    if (name.includes("tiktok") && name.includes("discount"))
      return "TikTok Discounts";
    if (name.includes("tiktok") && name.includes("commission"))
      return "Merchant Fees";
    if (name.includes("tiktok")) return "TikTok - Income";
    if (name.includes("cash back")) return "Other Income";
    if (name.includes("interest income")) return "Other Income";
    if (name.includes("other income")) return "Other Income";
    if (name.includes("cost of goods") || name.includes("cogs"))
      return "Cost of Goods Sold";
    if (name.includes("shipping supplies") && name.includes("cos"))
      return "Cost of Goods Sold";
    if (name.includes("dolphin international")) return "Cost of Goods Sold";
    if (name.includes("shippo")) return "Cost of Goods Sold";
    if (name.includes("shopify") && name.includes("fee"))
      return "Merchant Fees";
    if (name.includes("inward") && name.includes("shipping"))
      return "Inward Shipping";
    if (name.includes("outward") && name.includes("shipping"))
      return "Outward Shipping";
    if (name.includes("stride") || name.includes("logistics"))
      return "Outward Shipping";
    if (name.includes("shipping")) return "Outward Shipping";
    if (name.includes("marketing") || name.includes("advertising"))
      return "Marketing Expenses";
    if (
      name.includes("bank charges") ||
      (name.includes("bank") && name.includes("fees"))
    )
      return "Operating Expenses";
    if (name.includes("contractors")) return "Operating Expenses";
    if (name.includes("continuing education")) return "Operating Expenses";
    if (name.includes("legal") || name.includes("professional fees"))
      return "Operating Expenses";
    if (name.includes("meals") || name.includes("entertainment"))
      return "Operating Expenses";
    if (name.includes("office supplies")) return "Operating Expenses";
    if (name.includes("taxes") || name.includes("licenses"))
      return "Operating Expenses";
    if (name.includes("travel")) return "Operating Expenses";
    if (name.includes("operating") || name.includes("expense"))
      return "Operating Expenses";
    return "Uncategorized";
  };

  const normalizeShopify = (data) =>
    data.map((row) => ({
      Order_ID: row["Name"] || "",
      Created_At: row["Created at"] || "",
      Total:
        parseFloat(String(row["Total"] || "0").replace(/[^0-9.-]/g, "")) || 0,
      Product_Name: standardizeProductName(row["Lineitem name"] || ""),
      Quantity: parseInt(row["Lineitem quantity"] || "0") || 0,
      Platform: "Shopify",
      Year: row["Created at"] ? new Date(row["Created at"]).getFullYear() : "",
      Month: row["Created at"]
        ? new Date(row["Created at"]).toLocaleString("default", {
            month: "long",
          })
        : "",
      Customer_Email: row["Email"] || "",
    }));

  const normalizeTikTok = (data) =>
    data.map((row) => ({
      Order_ID: row["Order ID"] || "",
      Created_At: row["Created Time"] || "",
      Total:
        parseFloat(
          String(row["Order Amount"] || "0").replace(/[^0-9.-]/g, "")
        ) || 0,
      Product_Name: standardizeProductName(row["Seller SKU"] || ""),
      Quantity: parseInt(row["Quantity"] || "0") || 0,
      Platform: "TikTok",
      Year: row["Created Time"]
        ? new Date(row["Created Time"]).getFullYear()
        : "",
      Month: row["Created Time"]
        ? new Date(row["Created Time"]).toLocaleString("default", {
            month: "long",
          })
        : "",
      Customer_Email: row["Buyer Username"] || "",
    }));

  const handleProcess = async (data) => {
    setProcessing(true);
    setStatus({ type: "info", message: "Processing data..." });

    try {
      let masterData = [];
      let subscriptionData = null;
      let plData = null;

      // Process Shopify data
      if (data.shopify) {
        masterData = [...masterData, ...normalizeShopify(data.shopify)];
      }

      // Process TikTok data
      if (data.tiktok) {
        masterData = [...masterData, ...normalizeTikTok(data.tiktok)];
      }

      // Process Subscription data
      if (data.subscription) {
        subscriptionData = data.subscription;
      }

      // Process P&L data (Client 1)
      if (data.pl_client1) {
        const accountColumn = Object.keys(data.pl_client1[0])[0];

        plData = data.pl_client1.filter((row) => {
          const lineItem = row[accountColumn];
          if (!lineItem?.trim()) return false;

          const lowerLineItem = lineItem.toLowerCase();

          if (lowerLineItem.includes("distribution")) return false;
          if (lowerLineItem.includes("total for shopify sales")) return false;
          if (lowerLineItem.includes("total for tiktok sales")) return false;
          if (lowerLineItem.includes("total for merchant fees")) return false;
          if (lowerLineItem.includes("total for shipping")) return false;
          if (lowerLineItem.includes("total for cost of goods sold"))
            return false;
          if (lowerLineItem.includes("total for income")) return false;
          if (lowerLineItem.includes("gross profit")) return false;
          if (lowerLineItem.includes("total for expenses")) return false;
          if (lowerLineItem.includes("net operating income")) return false;
          if (lowerLineItem.includes("total for other income")) return false;
          if (lowerLineItem.includes("total for other expenses")) return false;
          if (lowerLineItem.includes("net other income")) return false;
          if (lowerLineItem.includes("net income")) return false;

          const hasData = Object.keys(row).some((key) => {
            if (key === accountColumn || key === "Total") return false;
            const value =
              parseFloat(String(row[key] || "0").replace(/[^0-9.-]/g, "")) || 0;
            return value !== 0;
          });

          return hasData;
        });

        const mappings = {};
        plData.forEach((row) => {
          const lineItem = row[accountColumn];
          if (lineItem?.trim() && !mappings[lineItem])
            mappings[lineItem] = autoClassifyPLLineItem(lineItem);
        });
        plData.accountColumn = accountColumn;
        plData.mappings = mappings;
      }

      // Generate CSV download link
      if (masterData.length > 0) {
        const Papa = await import("papaparse");
        const csvUrl = URL.createObjectURL(
          new Blob([Papa.unparse(masterData)], {
            type: "text/csv",
          })
        );
        setDownloadLinks({ csv: csvUrl });
      }

      setDashboardData({
        masterData,
        subscriptionData,
        plData,
      });
      setStatus({ type: "success", message: "Data loaded successfully!" });
      setProcessing(false);
    } catch (error) {
      setProcessing(false);
      setStatus({ type: "error", message: `Error: ${error.message}` });
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Green Ocean Opportunities Dashboard
            </h1>
          </div>
        </div>

        {status && (
          <div
            className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${
              status.type === "success"
                ? "bg-green-50 border border-green-200"
                : status.type === "error"
                ? "bg-red-50 border border-red-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            {status.type === "success" && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            {status.type === "error" && (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            {status.type === "info" && (
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            )}
            <p className="text-sm font-medium">{status.message}</p>
          </div>
        )}

        {!dataLoaded && !status && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-blue-800">
              Loading data from server...
            </p>
          </div>
        )}

        {downloadLinks && (
          <div className="bg-white rounded-xl p-6 mb-6 border-2 border-indigo-200">
            <h4 className="text-base font-semibold text-gray-900 mb-4">
              Download:
            </h4>
            <a
              href={downloadLinks.csv}
              download="Master_Orders.csv"
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Download CSV</span>
            </a>
          </div>
        )}

        <div className="text-sm text-gray-500 text-center mb-6">
          Upload files and click "Unify Orders" to see your dashboard with
          Financials and Monthly Metrics tabs
        </div>

        {dashboardData && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

            <div className="flex gap-2 mb-6 border-b overflow-x-auto sticky top-0 z-20 bg-white shadow-sm pb-2">
              <button
                onClick={() => setActiveTab("financials")}
                className={`px-4 py-2 font-medium whitespace-nowrap ${
                  activeTab === "financials"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-600"
                }`}
              >
                Financials
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`px-4 py-2 font-medium whitespace-nowrap ${
                  activeTab === "products"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-600"
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab("merchandise")}
                className={`px-4 py-2 font-medium whitespace-nowrap ${
                  activeTab === "merchandise"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-600"
                }`}
              >
                Merchandise
              </button>
              <button
                onClick={() => setActiveTab("clv")}
                className={`px-4 py-2 font-medium whitespace-nowrap ${
                  activeTab === "clv"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-600"
                }`}
              >
                CLV
              </button>
              <button
                onClick={() => setActiveTab("monthly")}
                className={`px-4 py-2 font-medium whitespace-nowrap ${
                  activeTab === "monthly"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-600"
                }`}
              >
                Monthly Metrics
              </button>
              <button
                onClick={() => setActiveTab("sentiments")}
                className={`px-4 py-2 font-medium whitespace-nowrap ${
                  activeTab === "sentiments"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-600"
                }`}
              >
                Sentiments
              </button>
              <button
                onClick={() => setActiveTab("inventory")}
                className={`px-4 py-2 font-medium whitespace-nowrap ${
                  activeTab === "inventory"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-600"
                }`}
              >
                Inventory
              </button>
            </div>

            {activeTab === "inventory" &&
              dashboardData.masterData &&
              dashboardData.masterData.length > 0 &&
              (() => {
                const today = new Date();
                const threeMonthsAgo = new Date(today);
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

                // Calculate past 3 months consumption by product
                const productConsumption = {};

                dashboardData.masterData.forEach((order) => {
                  if (!order.Created_At || !order.Product_Name) return;

                  const orderDate = new Date(order.Created_At);

                  // Only include orders from the last 3 months
                  if (orderDate >= threeMonthsAgo && orderDate <= today) {
                    const product = order.Product_Name;
                    const quantity = order.Quantity || 0;

                    if (!productConsumption[product]) {
                      productConsumption[product] = {
                        totalUnits: 0,
                        orders: 0,
                        revenue: 0,
                      };
                    }

                    productConsumption[product].totalUnits += quantity;
                    productConsumption[product].orders += 1;
                    productConsumption[product].revenue += order.Total || 0;
                  }
                });

                // Calculate forecasts for next 3 months
                const forecasts = Object.entries(productConsumption)
                  .map(([product, data]) => {
                    const avgMonthlyConsumption = data.totalUnits / 3; // Average over past 3 months
                    const baseForecast = avgMonthlyConsumption * 3;
                    const forecastWithBuffer =
                      baseForecast * (1 + safetyBuffer / 100);
                    const forecastNext3Months = Math.ceil(
                      forecastWithBuffer * (1 + growthRate / 100)
                    );

                    // Calculate pouches based on product pack size
                    let pouches = 0;
                    const productLower = product.toLowerCase();
                    if (productLower.includes("28")) {
                      pouches = forecastNext3Months * 28;
                    } else if (productLower.includes("14")) {
                      pouches = forecastNext3Months * 14;
                    } else if (productLower.includes("7")) {
                      pouches = forecastNext3Months * 7;
                    } else if (productLower.includes("3")) {
                      pouches = forecastNext3Months * 3;
                    }

                    return {
                      product,
                      past3MonthsTotal: data.totalUnits,
                      avgMonthlyConsumption: Math.ceil(avgMonthlyConsumption),
                      forecastNext3Months,
                      pouches,
                      orders: data.orders,
                    };
                  })
                  .sort(
                    (a, b) => b.forecastNext3Months - a.forecastNext3Months
                  );

                const totalForecastUnits = forecasts.reduce(
                  (sum, f) => sum + f.forecastNext3Months,
                  0
                );
                const totalPastUnits = forecasts.reduce(
                  (sum, f) => sum + f.past3MonthsTotal,
                  0
                );
                const totalPouches = forecasts.reduce(
                  (sum, f) => sum + f.pouches,
                  0
                );

                return (
                  <div>
                    <h3 className="text-xl font-semibold mb-6">
                      Inventory Forecast
                    </h3>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 mb-6">
                      <h4 className="text-lg font-semibold text-green-900 mb-3">
                        Forecast Methodology
                      </h4>
                      <p className="text-gray-700 mb-3">
                        This forecast analyzes order data from the past 3 months
                        to predict inventory needs for the next 3 months, broken
                        down into base need and safety stock. Enter your current
                        inventory in packs to see net order requirements in
                        pouches.
                      </p>
                      <div className="bg-white rounded-lg p-4 text-sm space-y-2">
                        <p className="font-mono text-green-700">
                          Base Need = [(Past 3 Months ÷ 3) × 3] × (1 + Growth %)
                        </p>
                        <p className="font-mono text-amber-700">
                          Safety Stock = Base Need × Safety %
                        </p>
                        <p className="font-mono text-blue-700">
                          Total Forecast = Base Need + Safety Stock
                        </p>
                        <p className="font-mono text-purple-700">
                          Net Order = Forecast Pouches - (Current Inventory
                          Packs × Pack Size)
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          The base need shows actual demand based on historical
                          consumption and growth expectations. Safety stock is
                          added as a {safetyBuffer}% buffer to protect against
                          stockouts. Enter current inventory in packs (e.g.,
                          "10" for 10 units of 7-Pouch Pack), and the system
                          converts to pouches to calculate net order
                          requirements.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-300 mb-6">
                      <h4 className="text-lg font-semibold text-indigo-900 mb-4">
                        Forecast Adjustments
                      </h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Safety Buffer: {safetyBuffer}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            step="0.5"
                            value={safetyBuffer}
                            onChange={(e) =>
                              setSafetyBuffer(parseFloat(e.target.value))
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0%</span>
                            <span>50%</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">
                            Add buffer to prevent stockouts and account for
                            demand variability
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expected Growth Rate: {growthRate > 0 ? "+" : ""}
                            {growthRate}%
                          </label>
                          <input
                            type="range"
                            min="-25"
                            max="300"
                            step="1"
                            value={growthRate}
                            onChange={(e) =>
                              setGrowthRate(parseFloat(e.target.value))
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>-25%</span>
                            <span>+300%</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">
                            Adjust for expected business growth or decline in
                            the next quarter
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setSafetyBuffer(17.5);
                            setGrowthRate(0);
                          }}
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Reset to Defaults (17.5% buffer, 0% growth)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4 mb-8">
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
                        <div className="text-xs opacity-90 mb-1">
                          Past 3 Months
                        </div>
                        <div className="text-xl font-bold mb-1">
                          {totalPastUnits.toLocaleString()}
                        </div>
                        <div className="text-xs opacity-80">
                          Total units sold
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
                        <div className="text-xs opacity-90 mb-1">Base Need</div>
                        <div className="text-xl font-bold mb-1">
                          {(() => {
                            const totalBaseNeed = forecasts.reduce((sum, f) => {
                              const avgMonthlyConsumption =
                                f.past3MonthsTotal / 3;
                              const baseForecast = avgMonthlyConsumption * 3;
                              const baseNeed = Math.ceil(
                                baseForecast * (1 + growthRate / 100)
                              );
                              return sum + baseNeed;
                            }, 0);
                            return totalBaseNeed.toLocaleString();
                          })()}
                        </div>
                        <div className="text-xs opacity-80">
                          Units without buffer
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white">
                        <div className="text-xs opacity-90 mb-1">
                          Safety Stock
                        </div>
                        <div className="text-xl font-bold mb-1">
                          {(() => {
                            const totalBaseNeed = forecasts.reduce((sum, f) => {
                              const avgMonthlyConsumption =
                                f.past3MonthsTotal / 3;
                              const baseForecast = avgMonthlyConsumption * 3;
                              const baseNeed = Math.ceil(
                                baseForecast * (1 + growthRate / 100)
                              );
                              return sum + baseNeed;
                            }, 0);
                            const totalSafetyStock =
                              totalForecastUnits - totalBaseNeed;
                            return totalSafetyStock.toLocaleString();
                          })()}
                        </div>
                        <div className="text-xs opacity-80">
                          {safetyBuffer}% buffer
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white">
                        <div className="text-xs opacity-90 mb-1">
                          Forecast Pouches
                        </div>
                        <div className="text-xl font-bold mb-1">
                          {totalPouches.toLocaleString()}
                        </div>
                        <div className="text-xs opacity-80">
                          Total pouches forecast
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-4 text-white">
                        <div className="text-xs opacity-90 mb-1">
                          Net Order Required
                        </div>
                        <div className="text-xl font-bold mb-1">
                          {(() => {
                            const totalCurrentInvPouches = forecasts.reduce(
                              (sum, f) => {
                                const currentInvPacks =
                                  currentInventory[f.product] || 0;
                                const productLower = f.product.toLowerCase();
                                let packSize = 0;
                                if (productLower.includes("28")) packSize = 28;
                                else if (productLower.includes("14"))
                                  packSize = 14;
                                else if (productLower.includes("7"))
                                  packSize = 7;
                                else if (productLower.includes("3"))
                                  packSize = 3;
                                return sum + currentInvPacks * packSize;
                              },
                              0
                            );
                            const totalNetOrder = Math.max(
                              0,
                              totalPouches - totalCurrentInvPouches
                            );
                            return totalNetOrder.toLocaleString();
                          })()}
                        </div>
                        <div className="text-xs opacity-80">
                          Pouches after current inventory
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border overflow-x-auto mb-6">
                      <table className="w-full">
                        <thead className="bg-gray-100 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                              Product
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                              Past 3 Months
                              <br />
                              Total Units
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                              Reorder
                              <br />
                              Frequency
                              <br />
                              (days)
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                              Avg Monthly
                              <br />
                              Consumption
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-green-50">
                              Base Need
                              <br />
                              (units)
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-amber-50">
                              Safety Stock
                              <br />
                              (units)
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-blue-50">
                              Forecast
                              <br />
                              Pouches
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-yellow-50">
                              Current
                              <br />
                              Inventory
                              <br />
                              (packs)
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-purple-50">
                              Net Order
                              <br />
                              Required
                              <br />
                              (pouches)
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-pink-50">
                              Net Order
                              <br />
                              Required
                              <br />
                              (packs)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {forecasts.map((item, idx) => {
                            const currentInvPacks =
                              currentInventory[item.product] || 0;

                            // Convert current inventory packs to pouches
                            let packSize = 0;
                            const productLower = item.product.toLowerCase();
                            if (productLower.includes("28")) packSize = 28;
                            else if (productLower.includes("14")) packSize = 14;
                            else if (productLower.includes("7")) packSize = 7;
                            else if (productLower.includes("3")) packSize = 3;

                            const currentInvPouches =
                              currentInvPacks * packSize;
                            const netOrderPouches = Math.max(
                              0,
                              item.pouches - currentInvPouches
                            );
                            const netOrderPacks =
                              packSize > 0
                                ? Math.ceil(netOrderPouches / packSize)
                                : 0;

                            // Calculate base need (without safety buffer)
                            const avgMonthlyConsumption =
                              item.past3MonthsTotal / 3;
                            const baseForecast = avgMonthlyConsumption * 3;
                            const baseNeed = Math.ceil(
                              baseForecast * (1 + growthRate / 100)
                            );
                            const safetyStock =
                              item.forecastNext3Months - baseNeed;

                            // Calculate reorder frequency (how long the forecast will last based on daily consumption)
                            const avgDailyConsumption =
                              item.past3MonthsTotal / 90;
                            const reorderFrequency =
                              avgDailyConsumption > 0
                                ? Math.round(
                                    item.forecastNext3Months /
                                      avgDailyConsumption
                                  )
                                : 0;

                            return (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {item.product}
                                </td>
                                <td className="px-4 py-3 text-sm text-center text-gray-700">
                                  {item.past3MonthsTotal.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-center font-medium text-indigo-700">
                                  {reorderFrequency > 0 ? (
                                    <span className="inline-flex items-center gap-1">
                                      {reorderFrequency}
                                      <span className="text-xs text-gray-500">
                                        days
                                      </span>
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-center text-gray-700">
                                  {item.avgMonthlyConsumption.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-center font-medium text-green-700 bg-green-50">
                                  {baseNeed.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-center font-medium text-amber-700 bg-amber-50">
                                  {safetyStock.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-center font-bold text-blue-700 bg-blue-50">
                                  {item.pouches > 0
                                    ? item.pouches.toLocaleString()
                                    : "-"}
                                </td>
                                <td className="px-4 py-3 text-sm text-center bg-yellow-50">
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentInventory[item.product] || ""}
                                    onChange={(e) =>
                                      setCurrentInventory({
                                        ...currentInventory,
                                        [item.product]:
                                          parseInt(e.target.value) || 0,
                                      })
                                    }
                                    placeholder="0"
                                    className="w-20 px-2 py-1 text-center border border-yellow-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                  />
                                </td>
                                <td className="px-4 py-3 text-sm text-center font-bold text-purple-700 bg-purple-50">
                                  {item.pouches > 0
                                    ? netOrderPouches.toLocaleString()
                                    : "-"}
                                </td>
                                <td className="px-4 py-3 text-sm text-center font-bold text-pink-700 bg-pink-50">
                                  {netOrderPacks > 0
                                    ? netOrderPacks.toLocaleString()
                                    : "-"}
                                </td>
                              </tr>
                            );
                          })}
                          {(() => {
                            const totalCurrentInvPouches = forecasts.reduce(
                              (sum, f) => {
                                const currentInvPacks =
                                  currentInventory[f.product] || 0;
                                const productLower = f.product.toLowerCase();
                                let packSize = 0;
                                if (productLower.includes("28")) packSize = 28;
                                else if (productLower.includes("14"))
                                  packSize = 14;
                                else if (productLower.includes("7"))
                                  packSize = 7;
                                else if (productLower.includes("3"))
                                  packSize = 3;
                                return sum + currentInvPacks * packSize;
                              },
                              0
                            );

                            const totalNetOrderPouches = forecasts.reduce(
                              (sum, f) => {
                                const currentInvPacks =
                                  currentInventory[f.product] || 0;
                                const productLower = f.product.toLowerCase();
                                let packSize = 0;
                                if (productLower.includes("28")) packSize = 28;
                                else if (productLower.includes("14"))
                                  packSize = 14;
                                else if (productLower.includes("7"))
                                  packSize = 7;
                                else if (productLower.includes("3"))
                                  packSize = 3;
                                const currentInvPouches =
                                  currentInvPacks * packSize;
                                return (
                                  sum +
                                  Math.max(0, f.pouches - currentInvPouches)
                                );
                              },
                              0
                            );

                            const totalNetOrderPacks = forecasts.reduce(
                              (sum, f) => {
                                const currentInvPacks =
                                  currentInventory[f.product] || 0;
                                const productLower = f.product.toLowerCase();
                                let packSize = 0;
                                if (productLower.includes("28")) packSize = 28;
                                else if (productLower.includes("14"))
                                  packSize = 14;
                                else if (productLower.includes("7"))
                                  packSize = 7;
                                else if (productLower.includes("3"))
                                  packSize = 3;
                                const currentInvPouches =
                                  currentInvPacks * packSize;
                                const netOrderPouches = Math.max(
                                  0,
                                  f.pouches - currentInvPouches
                                );
                                const netOrderPacks =
                                  packSize > 0
                                    ? Math.ceil(netOrderPouches / packSize)
                                    : 0;
                                return sum + netOrderPacks;
                              },
                              0
                            );

                            const totalCurrentInvPacks = forecasts.reduce(
                              (sum, f) =>
                                sum + (currentInventory[f.product] || 0),
                              0
                            );

                            const totalBaseNeed = forecasts.reduce((sum, f) => {
                              const avgMonthlyConsumption =
                                f.past3MonthsTotal / 3;
                              const baseForecast = avgMonthlyConsumption * 3;
                              const baseNeed = Math.ceil(
                                baseForecast * (1 + growthRate / 100)
                              );
                              return sum + baseNeed;
                            }, 0);

                            const totalSafetyStock =
                              totalForecastUnits - totalBaseNeed;

                            // Calculate weighted average reorder frequency
                            const totalDailyConsumption = totalPastUnits / 90;
                            const avgReorderFrequency =
                              totalDailyConsumption > 0
                                ? Math.round(
                                    totalForecastUnits / totalDailyConsumption
                                  )
                                : 0;

                            return (
                              <tr className="bg-indigo-600 text-white font-bold">
                                <td className="px-4 py-3 text-sm">TOTAL</td>
                                <td className="px-4 py-3 text-sm text-center">
                                  {totalPastUnits.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-center">
                                  {avgReorderFrequency > 0
                                    ? `${avgReorderFrequency} days`
                                    : "-"}
                                </td>
                                <td className="px-4 py-3 text-sm text-center">
                                  {Math.ceil(
                                    totalPastUnits / 3
                                  ).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-center bg-indigo-500">
                                  {totalBaseNeed.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-center bg-indigo-500">
                                  {totalSafetyStock.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-center">
                                  {totalPouches.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-center bg-indigo-500">
                                  {totalCurrentInvPacks.toLocaleString()} packs
                                  <br />
                                  <span className="text-xs opacity-90">
                                    ({totalCurrentInvPouches.toLocaleString()}{" "}
                                    pouches)
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-center bg-indigo-700">
                                  {totalNetOrderPouches.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-center bg-indigo-700">
                                  {totalNetOrderPacks.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-3">
                        Forecast Notes
                      </h4>
                      <div className="space-y-2 text-sm text-blue-800">
                        <p>
                          • <strong>Reorder Frequency:</strong> How many days
                          the forecasted inventory will last based on average
                          daily consumption (Forecast Units ÷ Daily
                          Consumption). This tells you when to place your next
                          supplier order.
                        </p>
                        <p>
                          • <strong>Base Need:</strong> Actual forecasted demand
                          based on historical consumption and growth rate
                          (without safety buffer)
                        </p>
                        <p>
                          • <strong>Safety Stock:</strong> Additional buffer (
                          {safetyBuffer}%) added to prevent stockouts and
                          account for demand variability
                        </p>
                        <p>
                          • <strong>Total Forecast:</strong> Base Need + Safety
                          Stock = Complete forecast with buffer protection
                        </p>
                        <p>
                          • <strong>Current Inventory:</strong> Enter your
                          current inventory in <strong>packs</strong> (e.g., if
                          you have 10 units of 7-Pouch Pack, enter "10"). The
                          system will automatically convert to pouches.
                        </p>
                        <p>
                          • <strong>Net Order Required:</strong> Forecast
                          Pouches minus Current Inventory (converted to pouches)
                          - shows the actual pouches you need to order
                        </p>
                        <p>
                          • <strong>Pouches Calculation:</strong> For pack
                          products, pouches are calculated by multiplying units
                          by pack size:
                          <br />
                          &nbsp;&nbsp;- 28-Pouch Pack × 28
                          <br />
                          &nbsp;&nbsp;- 14-Pouch Pack × 14
                          <br />
                          &nbsp;&nbsp;- 7-Pouch Pack × 7
                          <br />
                          &nbsp;&nbsp;- 3-Pouch Pack × 3
                        </p>
                        <p>
                          • Forecast assumes consistent demand patterns from the
                          past 3 months
                        </p>
                        <p>
                          • Seasonal variations and promotional activities may
                          impact actual consumption
                        </p>
                        <p>
                          • Review lead times with suppliers when placing orders
                        </p>
                        <p>
                          • Monitor actual vs. forecasted consumption weekly and
                          adjust parameters as needed
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            {activeTab === "inventory" &&
              (!dashboardData.masterData ||
                dashboardData.masterData.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  Please upload Shopify or TikTok order data to view inventory
                  forecast
                </div>
              )}

            {activeTab === "sentiments" &&
              dashboardData.subscriptionData &&
              dashboardData.subscriptionData.length > 0 &&
              (() => {
                const categorizeCancellationReason = (reason) => {
                  if (
                    !reason ||
                    reason.trim() === "" ||
                    reason.toLowerCase() === "null"
                  ) {
                    return "No Reasons Indicated";
                  }

                  const lowerReason = reason.toLowerCase().trim();

                  // Taste related - includes product satisfaction
                  if (
                    lowerReason.includes("taste") ||
                    lowerReason.includes("flavor") ||
                    lowerReason.includes("like the taste") ||
                    lowerReason.includes("don't like") ||
                    lowerReason.includes("didnt like") ||
                    lowerReason.includes("not a fan") ||
                    lowerReason.includes("dislike") ||
                    lowerReason.includes("doesn't taste") ||
                    lowerReason.includes("don't love") ||
                    lowerReason.includes("dont love") ||
                    lowerReason.includes("not satisfied") ||
                    lowerReason.includes("dissatisfied") ||
                    lowerReason.includes("disappointed") ||
                    lowerReason.includes("not good") ||
                    lowerReason.includes("doesn't work") ||
                    lowerReason.includes("didnt work") ||
                    lowerReason.includes("not effective") ||
                    lowerReason.includes("not for me") ||
                    lowerReason.includes("quality") ||
                    lowerReason.includes("not what i expected")
                  ) {
                    return "Taste";
                  }

                  // Price related
                  if (
                    lowerReason.includes("price") ||
                    lowerReason.includes("expensive") ||
                    lowerReason.includes("cost") ||
                    lowerReason.includes("afford") ||
                    lowerReason.includes("cheaper") ||
                    lowerReason.includes("too much money") ||
                    lowerReason.includes("budget") ||
                    lowerReason.includes("pricy") ||
                    lowerReason.includes("pricey")
                  ) {
                    return "Price";
                  }

                  // Ordered too many
                  if (
                    lowerReason.includes("too many") ||
                    lowerReason.includes("too much") ||
                    lowerReason.includes("have enough") ||
                    lowerReason.includes("stock up") ||
                    lowerReason.includes("too often") ||
                    lowerReason.includes("accumulated") ||
                    lowerReason.includes("piling up") ||
                    lowerReason.includes("excess") ||
                    lowerReason.includes("surplus") ||
                    lowerReason.includes("overstocked")
                  ) {
                    return "Ordered too Many";
                  }

                  // One time purchase
                  if (
                    lowerReason.includes("one time") ||
                    lowerReason.includes("just wanted to try") ||
                    lowerReason.includes("trial") ||
                    lowerReason.includes("just trying") ||
                    lowerReason.includes("test") ||
                    lowerReason.includes("try it out") ||
                    lowerReason.includes("see if i like") ||
                    lowerReason.includes("one-time") ||
                    lowerReason.includes("trying out") ||
                    lowerReason.includes("experiment")
                  ) {
                    return "One time Purchase";
                  }

                  // Wrong product
                  if (
                    lowerReason.includes("wrong") ||
                    lowerReason.includes("mistake") ||
                    lowerReason.includes("error") ||
                    lowerReason.includes("accidentally") ||
                    lowerReason.includes("incorrect") ||
                    lowerReason.includes("not what i wanted") ||
                    lowerReason.includes("by accident") ||
                    lowerReason.includes("didn't mean to")
                  ) {
                    return "Wrong Product";
                  }

                  // No longer needed / Changed circumstances
                  if (
                    lowerReason.includes("no longer need") ||
                    lowerReason.includes("don't need") ||
                    lowerReason.includes("not using") ||
                    lowerReason.includes("stopped using") ||
                    lowerReason.includes("no longer use") ||
                    lowerReason.includes("moving") ||
                    lowerReason.includes("changed") ||
                    lowerReason.includes("circumstance")
                  ) {
                    return "No Longer Needed";
                  }

                  // Delivery/Shipping issues
                  if (
                    lowerReason.includes("delivery") ||
                    lowerReason.includes("shipping") ||
                    lowerReason.includes("didn't arrive") ||
                    lowerReason.includes("late") ||
                    lowerReason.includes("never received")
                  ) {
                    return "Delivery Issues";
                  }

                  // Customer service
                  if (
                    lowerReason.includes("customer service") ||
                    lowerReason.includes("support") ||
                    lowerReason.includes("communication") ||
                    lowerReason.includes("response")
                  ) {
                    return "Customer Service";
                  }

                  // Found alternative
                  if (
                    lowerReason.includes("found") ||
                    lowerReason.includes("alternative") ||
                    lowerReason.includes("better option") ||
                    lowerReason.includes("competitor") ||
                    lowerReason.includes("switched to")
                  ) {
                    return "Found Alternative";
                  }

                  // If we get here and there's actual text, categorize as "Other"
                  return "Other";
                };

                const cancellationData = {};
                const allReasonsByCategory = {};

                dashboardData.subscriptionData.forEach((sub) => {
                  const reason = sub.cancellation_reason;
                  const category = categorizeCancellationReason(reason);

                  if (!cancellationData[category]) {
                    cancellationData[category] = 0;
                    allReasonsByCategory[category] = [];
                  }

                  cancellationData[category]++;

                  // Store all reasons with subscriber info
                  const reasonText =
                    reason &&
                    reason.trim() !== "" &&
                    reason.toLowerCase() !== "null"
                      ? reason
                      : "No reason provided";

                  allReasonsByCategory[category].push({
                    reason: reasonText,
                    email: sub.email || "Unknown",
                    cancelledOn: sub.cancelled_on || "Unknown",
                    orderPlacedDate: sub["order placed date"] || "Unknown",
                  });
                });

                const totalCancellations = Object.values(
                  cancellationData
                ).reduce((sum, count) => sum + count, 0);
                const sortedCategories = Object.entries(cancellationData).sort(
                  (a, b) => b[1] - a[1]
                );

                return (
                  <div>
                    {!selectedSentimentCategory ? (
                      <div>
                        <h3 className="text-xl font-semibold mb-6">
                          Cancellation Sentiment Analysis
                        </h3>

                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200 mb-6">
                          <h4 className="text-lg font-semibold text-indigo-900 mb-3">
                            Understanding Cancellations
                          </h4>
                          <p className="text-gray-700 mb-2">
                            This analysis categorizes subscription cancellation
                            reasons to help identify patterns and opportunities
                            for improvement.
                          </p>
                          <p className="text-sm text-indigo-700 mt-3">
                            <strong>Click on any category</strong> to see all
                            specific cancellation reasons in that category.
                          </p>
                          <div className="text-sm text-indigo-800 mt-2">
                            <strong>Total Cancellations Analyzed:</strong>{" "}
                            {totalCancellations}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mb-8">
                          {sortedCategories.map(([category, count], idx) => {
                            const percentage =
                              totalCancellations > 0
                                ? (count / totalCancellations) * 100
                                : 0;
                            const colors = [
                              "from-red-500 to-orange-600",
                              "from-blue-500 to-indigo-600",
                              "from-purple-500 to-pink-600",
                              "from-green-500 to-emerald-600",
                              "from-yellow-500 to-orange-500",
                              "from-gray-500 to-slate-600",
                            ];

                            return (
                              <div
                                key={category}
                                className={`bg-gradient-to-br ${
                                  colors[idx % colors.length]
                                } rounded-xl p-4 text-white cursor-pointer hover:shadow-xl transition-all transform hover:scale-105`}
                                onClick={() =>
                                  setSelectedSentimentCategory(category)
                                }
                              >
                                <div className="text-xs opacity-90 mb-1">
                                  {category}
                                </div>
                                <div className="text-xl font-bold mb-1">
                                  {count}
                                </div>
                                <div className="text-xs opacity-80 mb-2">
                                  {percentage.toFixed(1)}% of cancellations
                                </div>
                                <div className="text-xs opacity-90 font-semibold">
                                  Click to view details →
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-6 bg-blue-50 rounded-lg p-5 border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-3">
                            Actionable Insights
                          </h4>
                          <div className="space-y-2 text-sm text-blue-800">
                            {sortedCategories[0] &&
                              sortedCategories[0][0] === "Taste" && (
                                <p>
                                  • <strong>Taste Issues:</strong> Consider
                                  product reformulation, flavor variety, or
                                  better setting expectations about taste
                                  profile
                                </p>
                              )}
                            {sortedCategories[0] &&
                              sortedCategories[0][0] === "Price" && (
                                <p>
                                  • <strong>Price Concerns:</strong> Evaluate
                                  pricing strategy, consider value bundles, or
                                  emphasize product value proposition
                                </p>
                              )}
                            {sortedCategories[0] &&
                              sortedCategories[0][0] === "Ordered to Many" && (
                                <p>
                                  • <strong>Overstock:</strong> Offer flexible
                                  delivery schedules, skip options, or adjust
                                  default subscription frequency
                                </p>
                              )}
                            {sortedCategories[0] &&
                              sortedCategories[0][0] ===
                                "One time Purchase" && (
                                <p>
                                  • <strong>One-time Buyers:</strong> Improve
                                  onboarding to clarify subscription benefits
                                  and make cancellation process smoother for
                                  trial users
                                </p>
                              )}
                            {sortedCategories[0] &&
                              sortedCategories[0][0] === "Wrong Product" && (
                                <p>
                                  • <strong>Wrong Product:</strong> Improve
                                  product descriptions, add confirmation steps,
                                  or enhance customer support for product
                                  selection
                                </p>
                              )}
                            <p>
                              • Monitor sentiment trends over time to measure
                              impact of product or service improvements
                            </p>
                            <p>
                              • Consider implementing a win-back campaign
                              targeting specific cancellation reasons
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-4 mb-6">
                          <button
                            onClick={() => setSelectedSentimentCategory(null)}
                            className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2"
                          >
                            ← Back to Overview
                          </button>
                          <h3 className="text-xl font-semibold">
                            {selectedSentimentCategory}
                          </h3>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl p-4 mb-6 border border-indigo-300">
                          <div className="text-xl font-bold text-indigo-900 mb-1">
                            {cancellationData[selectedSentimentCategory]}{" "}
                            Cancellations
                          </div>
                          <div className="text-xs text-indigo-700">
                            {(
                              (cancellationData[selectedSentimentCategory] /
                                totalCancellations) *
                              100
                            ).toFixed(1)}
                            % of all cancellations
                          </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-100 border-b">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                    #
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                    Cancellation Reason
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                    Email
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                    Order Date
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                    Cancelled On
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {allReasonsByCategory[
                                  selectedSentimentCategory
                                ].map((item, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                      {idx + 1}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      {item.reason === "No reason provided" ? (
                                        <span className="italic text-gray-400">
                                          No reason provided
                                        </span>
                                      ) : (
                                        <span className="font-medium">
                                          "{item.reason}"
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                                      {item.email}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {item.orderPlacedDate !== "Unknown"
                                        ? new Date(
                                            item.orderPlacedDate
                                          ).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                          })
                                        : "Unknown"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {item.cancelledOn !== "Unknown"
                                        ? new Date(
                                            item.cancelledOn
                                          ).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                          })
                                        : "Unknown"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="mt-6 bg-indigo-50 rounded-lg p-5 border border-indigo-200">
                          <h4 className="font-semibold text-indigo-900 mb-2">
                            Category Summary
                          </h4>
                          <p className="text-sm text-indigo-800">
                            Showing all{" "}
                            {cancellationData[selectedSentimentCategory]}{" "}
                            cancellation reasons categorized as "
                            {selectedSentimentCategory}". Review these specific
                            reasons to identify common themes and potential
                            solutions.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            {activeTab === "sentiments" &&
              (!dashboardData.subscriptionData ||
                dashboardData.subscriptionData.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  Please upload subscription data to view sentiment analysis
                </div>
              )}

            {activeTab === "monthly" &&
              dashboardData.subscriptionData &&
              dashboardData.subscriptionData.length > 0 &&
              (() => {
                const activeSubscribers =
                  dashboardData.subscriptionData.filter(
                    (sub) => sub.status?.toLowerCase() === "active"
                  ) || [];
                const mrr = activeSubscribers.reduce(
                  (sum, sub) => sum + (parseFloat(sub["final price"]) || 0),
                  0
                );
                const arr = mrr * 12;

                const monthlyData = {};
                dashboardData.subscriptionData.forEach((sub) => {
                  const orderPlacedDate = sub["order placed date"];
                  if (orderPlacedDate) {
                    const date = new Date(orderPlacedDate);
                    if (!isNaN(date.getTime())) {
                      const month = `${date.getFullYear()}-${String(
                        date.getMonth() + 1
                      ).padStart(2, "0")}`;
                      if (!monthlyData[month])
                        monthlyData[month] = { newSubs: 0, revenue: 0 };
                      monthlyData[month].newSubs++;
                      monthlyData[month].revenue +=
                        parseFloat(sub.total_subscription_revenue) || 0;
                    }
                  }
                });

                const totalRevenue = Object.values(monthlyData).reduce(
                  (sum, m) => sum + m.revenue,
                  0
                );
                const avgMonthlyGMV =
                  Object.keys(monthlyData).length > 0
                    ? totalRevenue / Object.keys(monthlyData).length
                    : 0;
                const prices =
                  dashboardData.subscriptionData
                    .map((sub) => parseFloat(sub["final price"]) || 0)
                    .filter((p) => p > 0) || [];
                const avgSubscriptionPrice =
                  prices.length > 0
                    ? prices.reduce((sum, p) => sum + p, 0) / prices.length
                    : 0;

                return (
                  <div>
                    <h3 className="text-xl font-semibold mb-6">
                      Monthly Metrics
                    </h3>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
                        <div className="text-xs opacity-90 mb-1">
                          Current MRR
                        </div>
                        <div className="text-xl font-bold">
                          {formatCurrency(mrr)}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
                        <div className="text-xs opacity-90 mb-1">ARR</div>
                        <div className="text-xl font-bold">
                          {formatCurrency(arr)}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white">
                        <div className="text-xs opacity-90 mb-1">
                          Active Subscribers
                        </div>
                        <div className="text-xl font-bold">
                          {activeSubscribers.length}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-6">
                      {(() => {
                        const totalSubscribers =
                          dashboardData.subscriptionData.length;
                        const cancelledSubscribers =
                          dashboardData.subscriptionData.filter(
                            (sub) => sub.status?.toLowerCase() === "cancelled"
                          ).length;
                        const pausedSubscribers =
                          dashboardData.subscriptionData.filter(
                            (sub) => sub.status?.toLowerCase() === "paused"
                          ).length;

                        const retentionRate =
                          totalSubscribers > 0
                            ? (activeSubscribers.length / totalSubscribers) *
                              100
                            : 0;
                        const churnRate =
                          totalSubscribers > 0
                            ? (cancelledSubscribers / totalSubscribers) * 100
                            : 0;

                        // Calculate average subscription lifetime (in months)
                        let totalLifetimeMonths = 0;
                        let lifetimeCount = 0;

                        dashboardData.subscriptionData.forEach((sub) => {
                          const startDate = new Date(sub["order placed date"]);
                          let endDate = new Date();

                          if (
                            sub.cancelled_on &&
                            sub.cancelled_on !== "" &&
                            sub.cancelled_on !== "null"
                          ) {
                            endDate = new Date(sub.cancelled_on);
                          } else if (sub.status?.toLowerCase() !== "active") {
                            const payments =
                              parseInt(sub.total_number_of_payments) || 1;
                            endDate = new Date(startDate);
                            endDate.setMonth(endDate.getMonth() + payments);
                          }

                          if (
                            !isNaN(startDate.getTime()) &&
                            !isNaN(endDate.getTime())
                          ) {
                            const months = Math.max(
                              1,
                              (endDate - startDate) / (1000 * 60 * 60 * 24 * 30)
                            );
                            totalLifetimeMonths += months;
                            lifetimeCount++;
                          }
                        });

                        const avgLifetimeMonths =
                          lifetimeCount > 0
                            ? totalLifetimeMonths / lifetimeCount
                            : 0;

                        return (
                          <>
                            <div className="bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl p-4 text-white">
                              <div className="text-xs opacity-90 mb-1">
                                Retention Rate
                              </div>
                              <div className="text-xl font-bold">
                                {retentionRate.toFixed(1)}%
                              </div>
                              <div className="text-xs opacity-80 mt-1">
                                {activeSubscribers.length} active
                              </div>
                            </div>
                            <div className="bg-gradient-to-br from-red-400 to-rose-500 rounded-xl p-4 text-white">
                              <div className="text-xs opacity-90 mb-1">
                                Churn Rate
                              </div>
                              <div className="text-xl font-bold">
                                {churnRate.toFixed(1)}%
                              </div>
                              <div className="text-xs opacity-80 mt-1">
                                {cancelledSubscribers} cancelled
                              </div>
                            </div>
                            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-4 text-white">
                              <div className="text-xs opacity-90 mb-1">
                                Paused Rate
                              </div>
                              <div className="text-xl font-bold">
                                {totalSubscribers > 0
                                  ? (
                                      (pausedSubscribers / totalSubscribers) *
                                      100
                                    ).toFixed(1)
                                  : 0}
                                %
                              </div>
                              <div className="text-xs opacity-80 mt-1">
                                {pausedSubscribers} paused
                              </div>
                            </div>
                            <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl p-4 text-white">
                              <div className="text-xs opacity-90 mb-1">
                                Avg Lifetime
                              </div>
                              <div className="text-xl font-bold">
                                {avgLifetimeMonths.toFixed(1)} mo
                              </div>
                              <div className="text-xs opacity-80 mt-1">
                                Per subscriber
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="bg-green-50 rounded-lg p-5 border border-green-200 mb-6">
                      <h4 className="font-semibold text-green-900 mb-3">
                        MRR, ARR, and Subscription Health Formulas
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-white rounded p-3 border border-green-100">
                          <p className="font-semibold text-green-900 mb-1">
                            Current MRR (Monthly Recurring Revenue)
                          </p>
                          <p className="font-mono text-green-700 text-xs mb-2">
                            Current MRR = Sum of (Final Price × Active
                            Subscribers)
                          </p>
                          <p className="text-xs text-gray-600 mb-2">
                            Sum of monthly subscription prices for all currently
                            active subscribers
                          </p>
                          <p className="text-xs text-blue-600 italic">
                            Note: This is a snapshot of current MRR based on
                            subscribers with "Active" status right now, not
                            historical MRR from past months.
                          </p>
                        </div>
                        <div className="bg-white rounded p-3 border border-green-100">
                          <p className="font-semibold text-green-900 mb-1">
                            ARR (Annual Recurring Revenue)
                          </p>
                          <p className="font-mono text-green-700 text-xs mb-2">
                            ARR = Current MRR × 12
                          </p>
                          <p className="text-xs text-gray-600">
                            Current MRR multiplied by 12 months to project
                            annual revenue
                          </p>
                        </div>
                        <div className="bg-white rounded p-3 border border-green-100">
                          <p className="font-semibold text-green-900 mb-1">
                            Retention Rate
                          </p>
                          <p className="font-mono text-green-700 text-xs mb-2">
                            Retention Rate = (Active Subscribers ÷ Total
                            Subscribers) × 100
                          </p>
                          <p className="text-xs text-gray-600">
                            Percentage of all subscribers who remain active
                          </p>
                        </div>
                        <div className="bg-white rounded p-3 border border-green-100">
                          <p className="font-semibold text-green-900 mb-1">
                            Churn Rate
                          </p>
                          <p className="font-mono text-green-700 text-xs mb-2">
                            Churn Rate = (Cancelled Subscribers ÷ Total
                            Subscribers) × 100
                          </p>
                          <p className="text-xs text-gray-600">
                            Percentage of subscribers who have cancelled
                          </p>
                        </div>
                        <div className="bg-white rounded p-3 border border-green-100">
                          <p className="font-semibold text-green-900 mb-1">
                            Paused Rate
                          </p>
                          <p className="font-mono text-green-700 text-xs mb-2">
                            Paused Rate = (Paused Subscribers ÷ Total
                            Subscribers) × 100
                          </p>
                          <p className="text-xs text-gray-600">
                            Percentage of subscribers who have paused their
                            subscription
                          </p>
                        </div>
                        <div className="bg-white rounded p-3 border border-green-100">
                          <p className="font-semibold text-green-900 mb-1">
                            Average Lifetime
                          </p>
                          <p className="font-mono text-green-700 text-xs mb-2">
                            Avg Lifetime = Average(Subscription End Date - Start
                            Date)
                          </p>
                          <p className="text-xs text-gray-600">
                            Average duration in months from subscription start
                            to cancellation or current date
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto mb-8">
                      <h4 className="text-lg font-semibold mb-4">
                        Customer Type Analysis
                      </h4>
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th
                              className="px-4 py-3 text-left text-sm font-semibold"
                              rowSpan="2"
                            >
                              Month
                            </th>
                            <th
                              className="px-4 py-3 text-center text-sm font-semibold bg-green-50 border-b"
                              colSpan="5"
                            >
                              Ala Carte
                            </th>
                            <th
                              className="px-4 py-3 text-center text-sm font-semibold bg-blue-50 border-b"
                              colSpan="3"
                            >
                              Subscription
                            </th>
                            <th
                              className="px-4 py-3 text-center text-sm font-semibold bg-purple-50 border-b"
                              colSpan="3"
                            >
                              Combined
                            </th>
                          </tr>
                          <tr className="bg-gray-50">
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-green-50">
                              Customers
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-green-50">
                              Revenue
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-green-50 border-r">
                              AOV
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-blue-50">
                              Customers
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-blue-50">
                              Revenue
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-blue-50 border-r">
                              AOV
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-purple-50">
                              Customers
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-purple-50">
                              Revenue
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-purple-50">
                              Weighted AOV
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(() => {
                            // Build subscription data: all emails and their first subscription date
                            const allSubscriptionEmails = new Set();
                            const subscriptionFirstDate = {};

                            dashboardData.subscriptionData?.forEach((sub) => {
                              const email = sub.email?.toLowerCase().trim();
                              const orderDate = sub["order placed date"];
                              if (email && orderDate) {
                                allSubscriptionEmails.add(email);
                                const date = new Date(orderDate);
                                if (!isNaN(date.getTime())) {
                                  if (
                                    !subscriptionFirstDate[email] ||
                                    date < subscriptionFirstDate[email]
                                  ) {
                                    subscriptionFirstDate[email] = date;
                                  }
                                }
                              }
                            });

                            // Build first order dates for ALL customers from orders
                            const customerFirstOrderDate = {};
                            dashboardData.masterData?.forEach((order) => {
                              const email =
                                order.Customer_Email?.toLowerCase().trim();
                              const orderDate = order.Created_At;
                              if (email && orderDate && order.Total > 0) {
                                const date = new Date(orderDate);
                                if (!isNaN(date.getTime())) {
                                  if (
                                    !customerFirstOrderDate[email] ||
                                    date < customerFirstOrderDate[email]
                                  ) {
                                    customerFirstOrderDate[email] = date;
                                  }
                                }
                              }
                            });

                            const monthlyCustomerTypes = {};

                            // Process ALL orders from masterData (Shopify + TikTok)
                            dashboardData.masterData?.forEach((order) => {
                              if (!order.Created_At) return;
                              // Exclude giveaway orders (orders with $0 amount)
                              if (!order.Total || order.Total === 0) return;

                              const date = new Date(order.Created_At);
                              if (isNaN(date.getTime())) return;

                              const email =
                                order.Customer_Email?.toLowerCase().trim();
                              if (!email) return;

                              const monthKey = `${date.getFullYear()}-${String(
                                date.getMonth() + 1
                              ).padStart(2, "0")}`;

                              if (!monthlyCustomerTypes[monthKey]) {
                                monthlyCustomerTypes[monthKey] = {
                                  alaCarte: {
                                    customers: new Set(),
                                    revenue: 0,
                                    orders: 0,
                                  },
                                  subscription: {
                                    customers: new Set(),
                                    revenue: 0,
                                    orders: 0,
                                  },
                                };
                              }

                              // Check if this customer is a subscription customer
                              const isSubscriptionCustomer =
                                allSubscriptionEmails.has(email);

                              if (isSubscriptionCustomer) {
                                // Check if this customer became a NEW subscriber in this month
                                const firstSubDate =
                                  subscriptionFirstDate[email];
                                const firstSubMonthKey = `${firstSubDate.getFullYear()}-${String(
                                  firstSubDate.getMonth() + 1
                                ).padStart(2, "0")}`;
                                const isNewSubscriberThisMonth =
                                  firstSubMonthKey === monthKey;

                                if (isNewSubscriberThisMonth) {
                                  // This is a NEW subscriber in this month - count their orders
                                  monthlyCustomerTypes[
                                    monthKey
                                  ].subscription.customers.add(email);
                                  monthlyCustomerTypes[
                                    monthKey
                                  ].subscription.revenue += order.Total;
                                  monthlyCustomerTypes[
                                    monthKey
                                  ].subscription.orders += 1;
                                }
                              } else {
                                // This is a pure ala carte customer (never subscribed)
                                // Only count as NEW if this is their first order ever
                                const isFirstOrder =
                                  customerFirstOrderDate[email]?.getTime() ===
                                  date.getTime();

                                if (isFirstOrder) {
                                  monthlyCustomerTypes[
                                    monthKey
                                  ].alaCarte.customers.add(email);
                                }

                                monthlyCustomerTypes[
                                  monthKey
                                ].alaCarte.revenue += order.Total;
                                monthlyCustomerTypes[
                                  monthKey
                                ].alaCarte.orders += 1;
                              }
                            });

                            const sortedMonths = Object.keys(
                              monthlyCustomerTypes
                            )
                              .sort()
                              .reverse();

                            // Calculate totals
                            const allAlaCarteCustomers = new Set();
                            const allSubCustomers = new Set();
                            let totalAlaCarteRevenue = 0;
                            let totalAlaCarteOrders = 0;
                            let totalSubRevenue = 0;
                            let totalSubOrders = 0;

                            Object.values(monthlyCustomerTypes).forEach(
                              (data) => {
                                data.alaCarte.customers.forEach((c) =>
                                  allAlaCarteCustomers.add(c)
                                );
                                data.subscription.customers.forEach((c) =>
                                  allSubCustomers.add(c)
                                );
                                totalAlaCarteRevenue += data.alaCarte.revenue;
                                totalAlaCarteOrders += data.alaCarte.orders;
                                totalSubRevenue += data.subscription.revenue;
                                totalSubOrders += data.subscription.orders;
                              }
                            );

                            const rows = sortedMonths.map((monthKey, idx) => {
                              const data = monthlyCustomerTypes[monthKey];

                              const alaCarteCustomers =
                                data.alaCarte.customers.size;
                              const alaCarteRevenue = data.alaCarte.revenue;
                              const alaCarteAOV =
                                data.alaCarte.orders > 0
                                  ? alaCarteRevenue / data.alaCarte.orders
                                  : 0;

                              const subCustomers =
                                data.subscription.customers.size;
                              const subRevenue = data.subscription.revenue;
                              const subAOV =
                                data.subscription.orders > 0
                                  ? subRevenue / data.subscription.orders
                                  : 0;

                              const totalCustomers =
                                alaCarteCustomers + subCustomers;
                              const totalRevenue = alaCarteRevenue + subRevenue;
                              const totalOrders =
                                data.alaCarte.orders + data.subscription.orders;
                              const weightedAOV =
                                totalOrders > 0
                                  ? totalRevenue / totalOrders
                                  : 0;

                              const [year, month] = monthKey.split("-");
                              const monthName = new Date(
                                year,
                                parseInt(month) - 1
                              ).toLocaleString("default", {
                                month: "long",
                                year: "numeric",
                              });

                              return (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium">
                                    {monthName}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-center bg-green-50">
                                    {alaCarteCustomers}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-right bg-green-50">
                                    {formatCurrency(alaCarteRevenue)}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-right bg-green-50 border-r">
                                    {formatCurrency(alaCarteAOV)}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-center bg-blue-50">
                                    {subCustomers}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-right bg-blue-50">
                                    {formatCurrency(subRevenue)}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-right bg-blue-50 border-r">
                                    {formatCurrency(subAOV)}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-center font-medium bg-purple-50">
                                    {totalCustomers}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-right font-medium bg-purple-50">
                                    {formatCurrency(totalRevenue)}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-right font-medium bg-purple-50">
                                    {formatCurrency(weightedAOV)}
                                  </td>
                                </tr>
                              );
                            });

                            // Add total row
                            const totalAlaCarteAOV =
                              totalAlaCarteOrders > 0
                                ? totalAlaCarteRevenue / totalAlaCarteOrders
                                : 0;
                            const totalSubAOV =
                              totalSubOrders > 0
                                ? totalSubRevenue / totalSubOrders
                                : 0;
                            const grandTotalRevenue =
                              totalAlaCarteRevenue + totalSubRevenue;
                            const grandTotalOrders =
                              totalAlaCarteOrders + totalSubOrders;
                            const grandWeightedAOV =
                              grandTotalOrders > 0
                                ? grandTotalRevenue / grandTotalOrders
                                : 0;
                            const allUniqueCustomers = new Set([
                              ...allAlaCarteCustomers,
                              ...allSubCustomers,
                            ]);

                            rows.push(
                              <tr
                                key="total"
                                className="bg-indigo-600 text-white font-bold border-t-2"
                              >
                                <td className="px-4 py-3 text-sm">YTD TOTAL</td>
                                <td className="px-3 py-3 text-sm text-center">
                                  {allAlaCarteCustomers.size}
                                </td>
                                <td className="px-3 py-3 text-sm text-right">
                                  {formatCurrency(totalAlaCarteRevenue)}
                                </td>
                                <td className="px-3 py-3 text-sm text-right border-r">
                                  {formatCurrency(totalAlaCarteAOV)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                  {allSubCustomers.size}
                                </td>
                                <td className="px-3 py-3 text-sm text-right">
                                  {formatCurrency(totalSubRevenue)}
                                </td>
                                <td className="px-3 py-3 text-sm text-right border-r">
                                  {formatCurrency(totalSubAOV)}
                                </td>
                                <td className="px-3 py-3 text-sm text-center bg-indigo-700">
                                  {allUniqueCustomers.size}
                                </td>
                                <td className="px-3 py-3 text-sm text-right bg-indigo-700">
                                  {formatCurrency(grandTotalRevenue)}
                                </td>
                                <td className="px-3 py-3 text-sm text-right bg-indigo-700">
                                  {formatCurrency(grandWeightedAOV)}
                                </td>
                              </tr>
                            );

                            return rows;
                          })()}
                        </tbody>
                      </table>

                      <div className="mt-6 bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                        <h5 className="font-semibold text-indigo-900 mb-2">
                          Metric Definitions
                        </h5>
                        <div className="text-xs text-indigo-800 space-y-1">
                          <p className="bg-yellow-100 border border-yellow-300 rounded px-2 py-1 font-semibold text-yellow-900">
                            <strong>Important:</strong> All revenue comes from
                            Shopify/TikTok orders. Subscription CSV is only used
                            to identify subscription customers.
                          </p>
                          <p className="bg-blue-100 border border-blue-300 rounded px-2 py-1 font-semibold text-blue-900">
                            <strong>Cross-Matching:</strong> Orders are
                            categorized as "Subscription" if the customer email
                            appears in the subscription file, otherwise "Ala
                            Carte".
                          </p>
                          <p>
                            <strong>Ala Carte Customers:</strong> NEW customers
                            making their FIRST purchase who are NOT in the
                            subscription file
                          </p>
                          <p>
                            <strong>Subscription Customers:</strong> NEW
                            customers whose FIRST subscription start date (from
                            subscription CSV) is in that month - counts ALL
                            their orders in that month
                          </p>
                          <p>
                            <strong>Revenue:</strong> Sum of order Total values
                            from Shopify/TikTok for NEW customers in each
                            category
                          </p>
                          <p>
                            <strong>AOV (Average Order Value):</strong> Revenue
                            divided by number of orders
                          </p>
                          <p>
                            <strong>Weighted AOV:</strong> Combined revenue from
                            both customer types divided by total orders
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto mb-8">
                      <h4 className="text-lg font-semibold mb-4">
                        Cohort Analysis
                      </h4>
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              Cohort
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              Size
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              30-Day
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              60-Day
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              90-Day
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              Revenue
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(() => {
                            const cohorts = {};

                            dashboardData.subscriptionData.forEach((sub) => {
                              const orderPlacedDate = sub["order placed date"];
                              if (!orderPlacedDate) return;

                              const date = new Date(orderPlacedDate);
                              if (isNaN(date.getTime())) return;

                              const cohortMonth = `${date.getFullYear()}-${String(
                                date.getMonth() + 1
                              ).padStart(2, "0")}`;

                              if (!cohorts[cohortMonth]) {
                                cohorts[cohortMonth] = [];
                              }

                              cohorts[cohortMonth].push({
                                email: sub.email,
                                startDate: date,
                                status: sub.status,
                                cancelledOn: sub.cancelled_on,
                                pausedOn: sub.paused_on,
                                totalRevenue:
                                  parseFloat(sub.total_subscription_revenue) ||
                                  0,
                              });
                            });

                            return Object.keys(cohorts)
                              .sort()
                              .reverse()
                              .map((cohortMonth) => {
                                const cohortSubs = cohorts[cohortMonth];
                                const cohortSize = cohortSubs.length;
                                const totalRevenue = cohortSubs.reduce(
                                  (sum, sub) => sum + sub.totalRevenue,
                                  0
                                );

                                const cohortStartDate = new Date(
                                  cohortMonth + "-01"
                                );
                                const day30 = new Date(cohortStartDate);
                                day30.setDate(day30.getDate() + 30);
                                const day60 = new Date(cohortStartDate);
                                day60.setDate(day60.getDate() + 60);
                                const day90 = new Date(cohortStartDate);
                                day90.setDate(day90.getDate() + 90);

                                const activeAt30 = cohortSubs.filter((sub) => {
                                  if (sub.status?.toLowerCase() === "paused")
                                    return false;

                                  if (
                                    sub.cancelledOn &&
                                    sub.cancelledOn !== "" &&
                                    sub.cancelledOn !== "null"
                                  ) {
                                    const cancelDate = new Date(
                                      sub.cancelledOn
                                    );
                                    return (
                                      !isNaN(cancelDate.getTime()) &&
                                      cancelDate > day30
                                    );
                                  }
                                  if (
                                    sub.pausedOn &&
                                    sub.pausedOn !== "" &&
                                    sub.pausedOn !== "null"
                                  ) {
                                    const pauseDate = new Date(sub.pausedOn);
                                    return (
                                      !isNaN(pauseDate.getTime()) &&
                                      pauseDate > day30
                                    );
                                  }
                                  return sub.status?.toLowerCase() === "active";
                                }).length;

                                const activeAt60 = cohortSubs.filter((sub) => {
                                  if (sub.status?.toLowerCase() === "paused")
                                    return false;

                                  if (
                                    sub.cancelledOn &&
                                    sub.cancelledOn !== "" &&
                                    sub.cancelledOn !== "null"
                                  ) {
                                    const cancelDate = new Date(
                                      sub.cancelledOn
                                    );
                                    return (
                                      !isNaN(cancelDate.getTime()) &&
                                      cancelDate > day60
                                    );
                                  }
                                  if (
                                    sub.pausedOn &&
                                    sub.pausedOn !== "" &&
                                    sub.pausedOn !== "null"
                                  ) {
                                    const pauseDate = new Date(sub.pausedOn);
                                    return (
                                      !isNaN(pauseDate.getTime()) &&
                                      pauseDate > day60
                                    );
                                  }
                                  return sub.status?.toLowerCase() === "active";
                                }).length;

                                const activeAt90 = cohortSubs.filter((sub) => {
                                  if (sub.status?.toLowerCase() === "paused")
                                    return false;

                                  if (
                                    sub.cancelledOn &&
                                    sub.cancelledOn !== "" &&
                                    sub.cancelledOn !== "null"
                                  ) {
                                    const cancelDate = new Date(
                                      sub.cancelledOn
                                    );
                                    return (
                                      !isNaN(cancelDate.getTime()) &&
                                      cancelDate > day90
                                    );
                                  }
                                  if (
                                    sub.pausedOn &&
                                    sub.pausedOn !== "" &&
                                    sub.pausedOn !== "null"
                                  ) {
                                    const pauseDate = new Date(sub.pausedOn);
                                    return (
                                      !isNaN(pauseDate.getTime()) &&
                                      pauseDate > day90
                                    );
                                  }
                                  return sub.status?.toLowerCase() === "active";
                                }).length;

                                const retention30 =
                                  cohortSize > 0
                                    ? ((activeAt30 / cohortSize) * 100).toFixed(
                                        1
                                      )
                                    : "0.0";
                                const retention60 =
                                  cohortSize > 0
                                    ? ((activeAt60 / cohortSize) * 100).toFixed(
                                        1
                                      )
                                    : "0.0";
                                const retention90 =
                                  cohortSize > 0
                                    ? ((activeAt90 / cohortSize) * 100).toFixed(
                                        1
                                      )
                                    : "0.0";

                                return (
                                  <tr
                                    key={cohortMonth}
                                    className="hover:bg-gray-50"
                                  >
                                    <td className="px-4 py-3 text-sm font-medium">
                                      {cohortMonth}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {cohortSize}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                          parseFloat(retention30) >= 80
                                            ? "bg-green-100 text-green-800"
                                            : parseFloat(retention30) >= 60
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {retention30}%
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                          parseFloat(retention60) >= 70
                                            ? "bg-green-100 text-green-800"
                                            : parseFloat(retention60) >= 50
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {retention60}%
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                          parseFloat(retention90) >= 60
                                            ? "bg-green-100 text-green-800"
                                            : parseFloat(retention90) >= 40
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {retention90}%
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium">
                                      {formatCurrency(totalRevenue)}
                                    </td>
                                  </tr>
                                );
                              });
                          })()}
                        </tbody>
                      </table>

                      <div className="mt-6 bg-indigo-50 rounded p-4 border border-indigo-200">
                        <p className="mb-2 font-semibold text-indigo-900">
                          Understanding Cohort Analysis
                        </p>
                        <p className="text-xs text-gray-700 mb-3">
                          A cohort is a group of subscribers who started in the
                          same month. Cohort analysis tracks how each group
                          performs over time.
                        </p>
                        <div className="space-y-2 text-xs text-gray-600">
                          <p>
                            <strong>Cohort Month:</strong> The month when
                            subscribers started
                          </p>
                          <p>
                            <strong>Cohort Size:</strong> Total number of
                            subscribers who started in that month
                          </p>
                          <p>
                            <strong>30/60/90-Day Retention:</strong> Percentage
                            of the original cohort still active after specified
                            days
                          </p>
                          <p>
                            <strong>Revenue:</strong> Total revenue generated by
                            all subscribers in that cohort over their lifetime
                          </p>
                          <p className="pt-2 border-t border-indigo-200">
                            <strong>Note:</strong> Subscribers with "PAUSED"
                            status are treated as cancelled for retention
                            calculations, as they are not actively generating
                            revenue at the time of upload.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto mb-8">
                      <h4 className="text-lg font-semibold mb-4">
                        Customer Acquisition for CAC Analysis
                      </h4>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h5 className="font-semibold text-blue-900 mb-2">
                          Customer Acquisition Cost (CAC) Formula
                        </h5>
                        <p className="text-sm text-blue-800 mb-2">
                          <strong>
                            CAC = Total Marketing Expenses ÷ Number of New
                            Customers Acquired
                          </strong>
                        </p>
                        <p className="text-xs text-blue-700">
                          Monthly CAC is calculated using marketing expenses
                          from the Financials tab divided by new customers
                          acquired that month.
                        </p>
                      </div>
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              Month
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              New Customers
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              Cumulative Customers
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">
                              Growth Rate
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(() => {
                            const customerAcquisition = {};
                            const existingCustomers = new Set();

                            const marketingExpensesByMonth = {};
                            if (dashboardData.plData) {
                              const accountColumn =
                                dashboardData.plData.accountColumn;
                              const allColumns = Object.keys(
                                dashboardData.plData[0] || {}
                              );
                              const months = allColumns.slice(1, 13);

                              months.forEach((month) => {
                                let marketingExpenses = 0;
                                dashboardData.plData.forEach((row) => {
                                  const lineItem = row[accountColumn];
                                  if (!lineItem) return;
                                  const lowerLineItem = lineItem.toLowerCase();
                                  if (
                                    lowerLineItem.includes("marketing") ||
                                    lowerLineItem.includes("advertising")
                                  ) {
                                    const value =
                                      parseFloat(
                                        String(row[month] || "0").replace(
                                          /[^0-9.-]/g,
                                          ""
                                        )
                                      ) || 0;
                                    marketingExpenses += value;
                                  }
                                });
                                marketingExpensesByMonth[month] =
                                  marketingExpenses;
                              });
                            }

                            dashboardData.masterData?.forEach((order) => {
                              const orderDate = order.Created_At;
                              const customerId =
                                order.Customer_Email?.toLowerCase().trim();

                              if (orderDate && customerId) {
                                const date = new Date(orderDate);
                                if (!isNaN(date.getTime())) {
                                  const month = `${date.getFullYear()}-${String(
                                    date.getMonth() + 1
                                  ).padStart(2, "0")}`;

                                  if (!customerAcquisition[month]) {
                                    customerAcquisition[month] = {
                                      newCustomers: new Set(),
                                    };
                                  }

                                  if (!existingCustomers.has(customerId)) {
                                    customerAcquisition[month].newCustomers.add(
                                      customerId
                                    );
                                    existingCustomers.add(customerId);
                                  }
                                }
                              }
                            });

                            dashboardData.subscriptionData?.forEach((sub) => {
                              const orderPlacedDate = sub["order placed date"];
                              const email = sub.email?.toLowerCase().trim();

                              if (orderPlacedDate && email) {
                                const date = new Date(orderPlacedDate);
                                if (!isNaN(date.getTime())) {
                                  const month = `${date.getFullYear()}-${String(
                                    date.getMonth() + 1
                                  ).padStart(2, "0")}`;

                                  if (!customerAcquisition[month]) {
                                    customerAcquisition[month] = {
                                      newCustomers: new Set(),
                                    };
                                  }

                                  if (!existingCustomers.has(email)) {
                                    customerAcquisition[month].newCustomers.add(
                                      email
                                    );
                                    existingCustomers.add(email);
                                  }
                                }
                              }
                            });

                            const acquisitionMetrics = [];
                            let cumulativeCustomers = 0;
                            let previousNewCustomers = 0;

                            Object.keys(customerAcquisition)
                              .sort()
                              .forEach((month) => {
                                const data = customerAcquisition[month];
                                const newCustomersCount =
                                  data.newCustomers.size;
                                cumulativeCustomers += newCustomersCount;

                                const growthRate =
                                  previousNewCustomers > 0
                                    ? (
                                        ((newCustomersCount -
                                          previousNewCustomers) /
                                          previousNewCustomers) *
                                        100
                                      ).toFixed(1)
                                    : "0.0";

                                const marketingExpenses =
                                  marketingExpensesByMonth[month] || 0;
                                const cac =
                                  newCustomersCount > 0
                                    ? marketingExpenses / newCustomersCount
                                    : 0;

                                acquisitionMetrics.push({
                                  month,
                                  newCustomers: newCustomersCount,
                                  cumulativeCustomers,
                                  growthRate: growthRate + "%",
                                  cac: cac,
                                });

                                previousNewCustomers = newCustomersCount;
                              });

                            return acquisitionMetrics.map((metric, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium">
                                  {metric.month}
                                </td>
                                <td className="px-4 py-3 text-sm text-green-600 font-semibold">
                                  {metric.newCustomers}
                                </td>
                                <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                                  {metric.cumulativeCustomers}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span
                                    className={`${
                                      parseFloat(metric.growthRate) >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {metric.growthRate}
                                  </span>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>

                      <div className="mt-4 grid md:grid-cols-2 gap-4">
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                          <h5 className="font-semibold text-indigo-900 mb-3">
                            Overall Average CAC
                          </h5>
                          {(() => {
                            let totalMarketingExpenses = 0;
                            let totalNewCustomers = 0;

                            if (dashboardData.plData) {
                              const accountColumn =
                                dashboardData.plData.accountColumn;
                              const allColumns = Object.keys(
                                dashboardData.plData[0] || {}
                              );
                              const months = allColumns.slice(1, 13);

                              months.forEach((month) => {
                                dashboardData.plData.forEach((row) => {
                                  const lineItem = row[accountColumn];
                                  if (!lineItem) return;
                                  const lowerLineItem = lineItem.toLowerCase();
                                  if (
                                    lowerLineItem.includes("marketing") ||
                                    lowerLineItem.includes("advertising")
                                  ) {
                                    const value =
                                      parseFloat(
                                        String(row[month] || "0").replace(
                                          /[^0-9.-]/g,
                                          ""
                                        )
                                      ) || 0;
                                    totalMarketingExpenses += value;
                                  }
                                });
                              });
                            }

                            const existingCustomers = new Set();
                            dashboardData.masterData?.forEach((order) => {
                              const customerId =
                                order.Customer_Email?.toLowerCase().trim();
                              if (customerId) existingCustomers.add(customerId);
                            });
                            dashboardData.subscriptionData?.forEach((sub) => {
                              const email = sub.email?.toLowerCase().trim();
                              if (email) existingCustomers.add(email);
                            });

                            totalNewCustomers = existingCustomers.size;
                            const averageCAC =
                              totalNewCustomers > 0
                                ? totalMarketingExpenses / totalNewCustomers
                                : 0;

                            return (
                              <>
                                <div className="text-3xl font-bold text-indigo-900 mb-2">
                                  {averageCAC > 0
                                    ? formatCurrency(averageCAC)
                                    : "No data"}
                                </div>
                                <div className="text-sm text-indigo-700 space-y-1">
                                  <p>
                                    Total Marketing:{" "}
                                    {formatCurrency(totalMarketingExpenses)}
                                  </p>
                                  <p>Total Customers: {totalNewCustomers}</p>
                                  <p className="text-xs text-gray-600 mt-2">
                                    {averageCAC > 0
                                      ? `${formatCurrency(
                                          totalMarketingExpenses
                                        )} ÷ ${totalNewCustomers} customers`
                                      : "Upload P&L data to calculate CAC"}
                                  </p>
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h5 className="font-semibold text-yellow-900 mb-2">
                            CAC Analysis Note
                          </h5>
                          <p className="text-sm text-yellow-800 mb-3">
                            CAC calculation requires P&L data with Marketing
                            Expenses. Upload your P&L file to see accurate CAC
                            values.
                          </p>
                          <div className="text-xs text-yellow-700 space-y-1">
                            <p>
                              • <strong>Good CAC:</strong> Less than 1/3 of CLV
                            </p>
                            <p>
                              • <strong>Break-even CAC:</strong> Equal to CLV
                            </p>
                            <p>
                              • <strong>High CAC:</strong> Greater than CLV
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto mb-8">
                      <h4 className="text-lg font-semibold mb-4">
                        Monthly Repeat Purchase Rate by Channel
                      </h4>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 mb-4">
                        <h5 className="font-semibold text-purple-900 mb-2">
                          Understanding Repeat Purchase Rate
                        </h5>
                        <p className="text-sm text-purple-800 mb-2">
                          <strong>
                            Repeat Purchase Rate = (Repeat Customers ÷ Total
                            Customers) × 100
                          </strong>
                        </p>
                        <p className="text-xs text-purple-700">
                          For each month, this shows what percentage of
                          customers are repeat buyers (had purchased before).
                          Higher rates indicate stronger customer loyalty and
                          retention.
                        </p>
                      </div>
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th
                              className="px-4 py-3 text-left text-sm font-semibold"
                              rowSpan="2"
                            >
                              Month
                            </th>
                            <th
                              className="px-4 py-3 text-center text-sm font-semibold bg-green-50 border-b"
                              colSpan="4"
                            >
                              Shopify
                            </th>
                            <th
                              className="px-4 py-3 text-center text-sm font-semibold bg-blue-50 border-b"
                              colSpan="4"
                            >
                              TikTok
                            </th>
                            <th
                              className="px-4 py-3 text-center text-sm font-semibold bg-purple-50 border-b"
                              colSpan="4"
                            >
                              Overall
                            </th>
                          </tr>
                          <tr className="bg-gray-50">
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-green-50">
                              Total
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-green-50">
                              New
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-green-50">
                              Repeat
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-green-50 border-r">
                              Rate
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-blue-50">
                              Total
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-blue-50">
                              New
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-blue-50">
                              Repeat
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-blue-50 border-r">
                              Rate
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-purple-50">
                              Total
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-purple-50">
                              New
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-purple-50">
                              Repeat
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold bg-purple-50">
                              Rate
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(() => {
                            const monthlyRepeatData = {};

                            // Track customer first purchase by platform
                            const customerFirstPurchase = {
                              Shopify: {},
                              TikTok: {},
                              Overall: {},
                            };

                            // First pass: find first purchase date for each customer
                            dashboardData.masterData?.forEach((order) => {
                              const email =
                                order.Customer_Email?.toLowerCase().trim();
                              const orderDate = order.Created_At;
                              const platform = order.Platform;

                              if (email && orderDate && order.Total > 0) {
                                const date = new Date(orderDate);
                                if (!isNaN(date.getTime())) {
                                  // Track by platform
                                  if (
                                    !customerFirstPurchase[platform][email] ||
                                    date <
                                      customerFirstPurchase[platform][email]
                                  ) {
                                    customerFirstPurchase[platform][email] =
                                      date;
                                  }
                                  // Track overall
                                  if (
                                    !customerFirstPurchase.Overall[email] ||
                                    date < customerFirstPurchase.Overall[email]
                                  ) {
                                    customerFirstPurchase.Overall[email] = date;
                                  }
                                }
                              }
                            });

                            // Second pass: categorize each order as new or repeat
                            dashboardData.masterData?.forEach((order) => {
                              const email =
                                order.Customer_Email?.toLowerCase().trim();
                              const orderDate = order.Created_At;
                              const platform = order.Platform;

                              if (email && orderDate && order.Total > 0) {
                                const date = new Date(orderDate);
                                if (!isNaN(date.getTime())) {
                                  const monthKey = `${date.getFullYear()}-${String(
                                    date.getMonth() + 1
                                  ).padStart(2, "0")}`;

                                  if (!monthlyRepeatData[monthKey]) {
                                    monthlyRepeatData[monthKey] = {
                                      Shopify: {
                                        customers: new Set(),
                                        newCustomers: new Set(),
                                        repeatCustomers: new Set(),
                                      },
                                      TikTok: {
                                        customers: new Set(),
                                        newCustomers: new Set(),
                                        repeatCustomers: new Set(),
                                      },
                                      Overall: {
                                        customers: new Set(),
                                        newCustomers: new Set(),
                                        repeatCustomers: new Set(),
                                      },
                                    };
                                  }

                                  // Platform-specific tracking
                                  monthlyRepeatData[monthKey][
                                    platform
                                  ].customers.add(email);

                                  const firstPurchaseDate =
                                    customerFirstPurchase[platform][email];
                                  const firstPurchaseMonth = `${firstPurchaseDate.getFullYear()}-${String(
                                    firstPurchaseDate.getMonth() + 1
                                  ).padStart(2, "0")}`;

                                  if (firstPurchaseMonth === monthKey) {
                                    monthlyRepeatData[monthKey][
                                      platform
                                    ].newCustomers.add(email);
                                  } else {
                                    monthlyRepeatData[monthKey][
                                      platform
                                    ].repeatCustomers.add(email);
                                  }

                                  // Overall tracking
                                  monthlyRepeatData[
                                    monthKey
                                  ].Overall.customers.add(email);

                                  const overallFirstPurchaseDate =
                                    customerFirstPurchase.Overall[email];
                                  const overallFirstPurchaseMonth = `${overallFirstPurchaseDate.getFullYear()}-${String(
                                    overallFirstPurchaseDate.getMonth() + 1
                                  ).padStart(2, "0")}`;

                                  if (overallFirstPurchaseMonth === monthKey) {
                                    monthlyRepeatData[
                                      monthKey
                                    ].Overall.newCustomers.add(email);
                                  } else {
                                    monthlyRepeatData[
                                      monthKey
                                    ].Overall.repeatCustomers.add(email);
                                  }
                                }
                              }
                            });

                            const sortedMonths = Object.keys(monthlyRepeatData)
                              .sort()
                              .reverse();

                            const rows = sortedMonths.map((monthKey, idx) => {
                              const data = monthlyRepeatData[monthKey];

                              const [year, month] = monthKey.split("-");
                              const monthName = new Date(
                                year,
                                parseInt(month) - 1
                              ).toLocaleString("default", {
                                month: "long",
                                year: "numeric",
                              });

                              const shopifyTotal = data.Shopify.customers.size;
                              const shopifyNew = data.Shopify.newCustomers.size;
                              const shopifyRepeat =
                                data.Shopify.repeatCustomers.size;
                              const shopifyRate =
                                shopifyTotal > 0
                                  ? (shopifyRepeat / shopifyTotal) * 100
                                  : 0;

                              const tiktokTotal = data.TikTok.customers.size;
                              const tiktokNew = data.TikTok.newCustomers.size;
                              const tiktokRepeat =
                                data.TikTok.repeatCustomers.size;
                              const tiktokRate =
                                tiktokTotal > 0
                                  ? (tiktokRepeat / tiktokTotal) * 100
                                  : 0;

                              const overallTotal = data.Overall.customers.size;
                              const overallNew = data.Overall.newCustomers.size;
                              const overallRepeat =
                                data.Overall.repeatCustomers.size;
                              const overallRate =
                                overallTotal > 0
                                  ? (overallRepeat / overallTotal) * 100
                                  : 0;

                              return (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium">
                                    {monthName}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-center bg-green-50">
                                    {shopifyTotal}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-center bg-green-50">
                                    {shopifyNew}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-center bg-green-50">
                                    {shopifyRepeat}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-center bg-green-50 border-r">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        shopifyRate >= 30
                                          ? "bg-green-100 text-green-800"
                                          : shopifyRate >= 15
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {shopifyRate.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-sm text-center bg-blue-50">
                                    {tiktokTotal}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-center bg-blue-50">
                                    {tiktokNew}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-center bg-blue-50">
                                    {tiktokRepeat}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-center bg-blue-50 border-r">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        tiktokRate >= 30
                                          ? "bg-green-100 text-green-800"
                                          : tiktokRate >= 15
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {tiktokRate.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-sm text-center font-medium bg-purple-50">
                                    {overallTotal}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-center font-medium bg-purple-50">
                                    {overallNew}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-center font-medium bg-purple-50">
                                    {overallRepeat}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-center font-medium bg-purple-50">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        overallRate >= 30
                                          ? "bg-green-100 text-green-800"
                                          : overallRate >= 15
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {overallRate.toFixed(1)}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            });

                            // Add YTD total row
                            const ytdShopifyTotal = new Set();
                            const ytdShopifyNew = new Set();
                            const ytdShopifyRepeat = new Set();
                            const ytdTikTokTotal = new Set();
                            const ytdTikTokNew = new Set();
                            const ytdTikTokRepeat = new Set();
                            const ytdOverallTotal = new Set();
                            const ytdOverallNew = new Set();
                            const ytdOverallRepeat = new Set();

                            sortedMonths.forEach((monthKey) => {
                              const data = monthlyRepeatData[monthKey];
                              data.Shopify.customers.forEach((c) =>
                                ytdShopifyTotal.add(c)
                              );
                              data.Shopify.newCustomers.forEach((c) =>
                                ytdShopifyNew.add(c)
                              );
                              data.Shopify.repeatCustomers.forEach((c) =>
                                ytdShopifyRepeat.add(c)
                              );
                              data.TikTok.customers.forEach((c) =>
                                ytdTikTokTotal.add(c)
                              );
                              data.TikTok.newCustomers.forEach((c) =>
                                ytdTikTokNew.add(c)
                              );
                              data.TikTok.repeatCustomers.forEach((c) =>
                                ytdTikTokRepeat.add(c)
                              );
                              data.Overall.customers.forEach((c) =>
                                ytdOverallTotal.add(c)
                              );
                              data.Overall.newCustomers.forEach((c) =>
                                ytdOverallNew.add(c)
                              );
                              data.Overall.repeatCustomers.forEach((c) =>
                                ytdOverallRepeat.add(c)
                              );
                            });

                            const ytdShopifyRate =
                              ytdShopifyTotal.size > 0
                                ? (ytdShopifyRepeat.size /
                                    ytdShopifyTotal.size) *
                                  100
                                : 0;
                            const ytdTikTokRate =
                              ytdTikTokTotal.size > 0
                                ? (ytdTikTokRepeat.size / ytdTikTokTotal.size) *
                                  100
                                : 0;
                            const ytdOverallRate =
                              ytdOverallTotal.size > 0
                                ? (ytdOverallRepeat.size /
                                    ytdOverallTotal.size) *
                                  100
                                : 0;

                            rows.push(
                              <tr
                                key="ytd"
                                className="bg-indigo-600 text-white font-bold border-t-2"
                              >
                                <td className="px-4 py-3 text-sm">YTD TOTAL</td>
                                <td className="px-3 py-3 text-sm text-center">
                                  {ytdShopifyTotal.size}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                  {ytdShopifyNew.size}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                  {ytdShopifyRepeat.size}
                                </td>
                                <td className="px-3 py-3 text-sm text-center border-r bg-indigo-700">
                                  {ytdShopifyRate.toFixed(1)}%
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                  {ytdTikTokTotal.size}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                  {ytdTikTokNew.size}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                  {ytdTikTokRepeat.size}
                                </td>
                                <td className="px-3 py-3 text-sm text-center border-r bg-indigo-700">
                                  {ytdTikTokRate.toFixed(1)}%
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                  {ytdOverallTotal.size}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                  {ytdOverallNew.size}
                                </td>
                                <td className="px-3 py-3 text-sm text-center">
                                  {ytdOverallRepeat.size}
                                </td>
                                <td className="px-3 py-3 text-sm text-center bg-indigo-700">
                                  {ytdOverallRate.toFixed(1)}%
                                </td>
                              </tr>
                            );

                            return rows;
                          })()}
                        </tbody>
                      </table>

                      <div className="mt-6 bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <h5 className="font-semibold text-purple-900 mb-2">
                          Interpreting Repeat Purchase Rates
                        </h5>
                        <div className="text-xs text-purple-800 space-y-1">
                          <p>
                            • <strong>Total:</strong> Unique customers who
                            purchased in that month
                          </p>
                          <p>
                            • <strong>New:</strong> Customers making their first
                            purchase ever in that month
                          </p>
                          <p>
                            • <strong>Repeat:</strong> Customers who had
                            purchased before that month
                          </p>
                          <p>
                            • <strong>Rate:</strong> (Repeat ÷ Total) × 100 -
                            Higher is better
                          </p>
                          <p className="pt-2 border-t border-purple-200 mt-2">
                            <strong>Benchmarks:</strong> 30%+ is excellent,
                            15-30% is good, below 15% needs improvement
                          </p>
                          <p>
                            • YTD Total shows cumulative unique customers across
                            all months (not a sum of monthly totals)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            {activeTab === "monthly" &&
              (!dashboardData.subscriptionData ||
                dashboardData.subscriptionData.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  Please upload subscription data to view monthly metrics
                </div>
              )}

            {activeTab === "clv" &&
              dashboardData.subscriptionData &&
              dashboardData.subscriptionData.length > 0 &&
              (() => {
                const totalRevenue = dashboardData.subscriptionData.reduce(
                  (sum, sub) =>
                    sum + (parseFloat(sub.total_subscription_revenue) || 0),
                  0
                );
                const totalPayments = dashboardData.subscriptionData.reduce(
                  (sum, sub) =>
                    sum + (parseInt(sub.total_number_of_payments) || 0),
                  0
                );
                const uniqueCustomers = dashboardData.subscriptionData.length;
                const avgPurchaseValue =
                  totalPayments > 0 ? totalRevenue / totalPayments : 0;
                const purchaseFrequency =
                  uniqueCustomers > 0 ? totalPayments / uniqueCustomers : 0;

                let totalLifespanDays = 0;
                let lifespanCount = 0;

                dashboardData.subscriptionData.forEach((sub) => {
                  const startDate = new Date(sub["order placed date"]);
                  let endDate = new Date();

                  if (
                    sub.cancelled_on &&
                    sub.cancelled_on !== "" &&
                    sub.cancelled_on !== "null"
                  ) {
                    endDate = new Date(sub.cancelled_on);
                  } else if (sub.status?.toLowerCase() !== "active") {
                    const payments =
                      parseInt(sub.total_number_of_payments) || 1;
                    endDate = new Date(startDate);
                    endDate.setMonth(endDate.getMonth() + payments);
                  }

                  if (
                    !isNaN(startDate.getTime()) &&
                    !isNaN(endDate.getTime())
                  ) {
                    const lifespan = Math.max(
                      1,
                      Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24))
                    );
                    totalLifespanDays += lifespan;
                    lifespanCount++;
                  }
                });

                const avgLifespanDays =
                  lifespanCount > 0 ? totalLifespanDays / lifespanCount : 30;
                const avgLifespanMonths = avgLifespanDays / 30;
                const clv =
                  avgPurchaseValue * purchaseFrequency * avgLifespanMonths;

                // Calculate 3-year LTV
                const threeYearLTV = avgPurchaseValue * purchaseFrequency * 36;

                // Calculate GP (Gross Profit) and CAC from financials
                let grossProfit = 0;
                let totalMarketingExpenses = 0;
                if (dashboardData.plData) {
                  const accountColumn = dashboardData.plData.accountColumn;
                  const allColumns = Object.keys(dashboardData.plData[0] || {});
                  const months = allColumns.slice(1, 13);

                  const incomeCategories = [
                    "Shopify - Income",
                    "TikTok - Income",
                  ];
                  const discountCategories = [
                    "Shopify Discounts",
                    "TikTok Discounts",
                  ];
                  const merchantFeeCategories = ["Merchant Fees"];

                  const plMappings = dashboardData.plData.mappings || {};

                  const monthlyData = {};
                  months.forEach((month) => {
                    const categories = {};
                    dashboardData.plData.forEach((row) => {
                      const lineItem = row[accountColumn];
                      if (!lineItem) return;
                      const category = plMappings[lineItem] || "Uncategorized";
                      const value =
                        parseFloat(
                          String(row[month] || "0").replace(/[^0-9.-]/g, "")
                        ) || 0;
                      categories[category] =
                        (categories[category] || 0) + value;
                    });
                    monthlyData[month] = categories;
                  });

                  const totalGrossRevenue = months.reduce((sum, month) => {
                    return (
                      sum +
                      incomeCategories.reduce(
                        (catSum, cat) =>
                          catSum + (monthlyData[month]?.[cat] || 0),
                        0
                      )
                    );
                  }, 0);

                  const totalOtherIncome = months.reduce(
                    (sum, month) =>
                      sum + (monthlyData[month]?.["Other Income"] || 0),
                    0
                  );
                  const totalDiscounts = months.reduce((sum, month) => {
                    return (
                      sum +
                      discountCategories.reduce(
                        (catSum, cat) =>
                          catSum + (monthlyData[month]?.[cat] || 0),
                        0
                      )
                    );
                  }, 0);

                  const totalRevenue =
                    totalGrossRevenue + totalOtherIncome + totalDiscounts;

                  const totalCOGS = months.reduce(
                    (sum, month) =>
                      sum + (monthlyData[month]?.["Cost of Goods Sold"] || 0),
                    0
                  );
                  const totalInwardShipping = months.reduce(
                    (sum, month) =>
                      sum + (monthlyData[month]?.["Inward Shipping"] || 0),
                    0
                  );
                  const totalOutwardShipping = months.reduce(
                    (sum, month) =>
                      sum + (monthlyData[month]?.["Outward Shipping"] || 0),
                    0
                  );
                  const totalMerchantFees = months.reduce((sum, month) => {
                    return (
                      sum +
                      merchantFeeCategories.reduce(
                        (catSum, cat) =>
                          catSum + (monthlyData[month]?.[cat] || 0),
                        0
                      )
                    );
                  }, 0);

                  const totalCOGSWithShipping =
                    totalCOGS +
                    totalInwardShipping +
                    totalOutwardShipping +
                    totalMerchantFees;
                  grossProfit = totalRevenue - totalCOGSWithShipping;

                  // Calculate total marketing expenses for CAC
                  totalMarketingExpenses = months.reduce(
                    (sum, month) =>
                      sum + (monthlyData[month]?.["Marketing Expenses"] || 0),
                    0
                  );
                }

                // Calculate total new customers for CAC
                let totalNewCustomers = 0;
                if (dashboardData.masterData) {
                  const existingCustomers = new Set();
                  dashboardData.masterData.forEach((order) => {
                    const customerId = order.Customer_Email?.toLowerCase().trim();
                    if (customerId && order.Total > 0) existingCustomers.add(customerId);
                  });
                  totalNewCustomers = existingCustomers.size;
                }

                // Add subscription customers
                if (dashboardData.subscriptionData) {
                  const existingCustomers = new Set();
                  if (dashboardData.masterData) {
                    dashboardData.masterData.forEach((order) => {
                      const customerId = order.Customer_Email?.toLowerCase().trim();
                      if (customerId && order.Total > 0) existingCustomers.add(customerId);
                    });
                  }
                  dashboardData.subscriptionData.forEach((sub) => {
                    const email = sub.email?.toLowerCase().trim();
                    if (email) existingCustomers.add(email);
                  });
                  totalNewCustomers = existingCustomers.size;
                }

                const cac = totalNewCustomers > 0 ? totalMarketingExpenses / totalNewCustomers : 0;

                // Calculate ratios
                const ltvToGP = grossProfit > 0 ? clv / grossProfit : 0;
                const ltvToCAC = cac > 0 ? clv / cac : 0;

                return (
                  <div>
                    <h3 className="text-xl font-semibold mb-6">
                      Customer Lifetime Value Analysis
                    </h3>
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200 mb-6">
                      <h4 className="text-lg font-semibold text-indigo-900 mb-3">
                        How We Calculate CLV, LTV & Efficiency Ratios
                      </h4>
                      <p className="text-gray-700 mb-3">
                        Customer Lifetime Value (CLV) represents the total
                        revenue you can expect from a customer throughout their
                        relationship with your business. 3-Year LTV projects the
                        value if you retain customers for 3 years. The
                        efficiency ratios measure profitability and acquisition
                        effectiveness.
                      </p>
                      <div className="bg-white rounded-lg p-4 space-y-2">
                        <p className="font-mono text-sm text-indigo-600">
                          CLV = (Average Purchase Value) × (Purchase Frequency)
                          × (Average Customer Lifespan)
                        </p>
                        <p className="font-mono text-sm text-purple-600">
                          3-Year LTV = (Average Purchase Value) × (Purchase
                          Frequency) × 36 months
                        </p>
                        <p className="font-mono text-sm text-orange-600">
                          LTV : GP = CLV ÷ Gross Profit
                        </p>
                        <p className="font-mono text-sm text-blue-600">
                          LTV : CAC = CLV ÷ Customer Acquisition Cost
                        </p>
                        <div className="text-xs text-gray-600 mt-2 space-y-1">
                          <p>
                            • <strong>Average Purchase Value:</strong> Total
                            revenue ÷ Total number of payments
                          </p>
                          <p>
                            • <strong>Purchase Frequency:</strong> Total
                            payments ÷ Number of unique customers
                          </p>
                          <p>
                            • <strong>Average Customer Lifespan:</strong>{" "}
                            Average time between first order and cancellation
                            (in months)
                          </p>
                          <p>
                            • <strong>3-Year LTV:</strong> Projected value
                            assuming 36-month retention
                          </p>
                          <p>
                            • <strong>LTV : GP Ratio:</strong> How much customer
                            value you generate per dollar of gross profit
                          </p>
                          <p>
                            • <strong>LTV : CAC Ratio:</strong> How much
                            customer value you get per dollar spent on
                            acquisition
                          </p>
                          <p>
                            • <strong>CAC:</strong> Total Marketing Expenses ÷
                            Total New Customers
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid md:grid-cols-5 gap-4">
                        <div className="bg-white rounded-lg p-4 border-2 border-indigo-300">
                          <div className="text-sm text-indigo-700 mb-1">
                            Avg Purchase Value
                          </div>
                          <div className="text-2xl font-bold text-indigo-900">
                            {formatCurrency(avgPurchaseValue)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Per payment
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border-2 border-purple-300">
                          <div className="text-sm text-purple-700 mb-1">
                            Purchase Frequency
                          </div>
                          <div className="text-2xl font-bold text-purple-900">
                            {purchaseFrequency.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Payments per customer
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border-2 border-pink-300">
                          <div className="text-sm text-pink-700 mb-1">
                            Avg Lifespan
                          </div>
                          <div className="text-2xl font-bold text-pink-900">
                            {avgLifespanMonths.toFixed(1)} mo
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {avgLifespanDays.toFixed(0)} days
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-4 text-white">
                          <div className="text-sm opacity-90 mb-1">
                            Customer Lifetime Value
                          </div>
                          <div className="text-2xl font-bold">
                            {formatCurrency(clv)}
                          </div>
                          <div className="text-xs opacity-80 mt-1">
                            Actual CLV
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-4 text-white">
                          <div className="text-sm opacity-90 mb-1">
                            3-Year LTV
                          </div>
                          <div className="text-2xl font-bold">
                            {formatCurrency(threeYearLTV)}
                          </div>
                          <div className="text-xs opacity-80 mt-1">
                            36-month projection
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        {dashboardData.plData && grossProfit > 0 ? (
                          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-4 text-white">
                            <div className="text-sm opacity-90 mb-1">
                              LTV : GP Ratio
                            </div>
                            <div className="text-2xl font-bold">
                              {ltvToGP.toFixed(2)}x
                            </div>
                            <div className="text-xs opacity-80 mt-1">
                              {formatCurrency(clv)} CLV ÷{" "}
                              {formatCurrency(grossProfit)} GP
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg p-4 text-white">
                            <div className="text-sm opacity-90 mb-1">
                              LTV : GP Ratio
                            </div>
                            <div className="text-2xl font-bold">N/A</div>
                            <div className="text-xs opacity-80 mt-1">
                              Upload P&L data to calculate
                            </div>
                          </div>
                        )}
                        {dashboardData.plData &&
                        totalMarketingExpenses > 0 &&
                        totalNewCustomers > 0 ? (
                          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg p-4 text-white">
                            <div className="text-sm opacity-90 mb-1">
                              LTV : CAC Ratio
                            </div>
                            <div className="text-2xl font-bold">
                              {ltvToCAC.toFixed(2)}x
                            </div>
                            <div className="text-xs opacity-80 mt-1">
                              {formatCurrency(clv)} CLV ÷ {formatCurrency(cac)}{" "}
                              CAC
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg p-4 text-white">
                            <div className="text-sm opacity-90 mb-1">
                              LTV : CAC Ratio
                            </div>
                            <div className="text-2xl font-bold">N/A</div>
                            <div className="text-xs opacity-80 mt-1">
                              {!dashboardData.plData
                                ? "Upload P&L data to calculate"
                                : "Upload order data to calculate"}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                        <h4 className="text-lg font-semibold text-orange-900 mb-3">
                          Understanding LTV : GP and LTV : CAC Ratios
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-4 border border-orange-200">
                            <h5 className="font-semibold text-orange-900 mb-2">
                              LTV : GP Ratio
                            </h5>
                            {dashboardData.plData && grossProfit > 0 ? (
                              <>
                                <p className="text-sm text-gray-700 mb-2">
                                  <strong>{ltvToGP.toFixed(2)}x</strong> (
                                  {formatCurrency(clv)} ÷{" "}
                                  {formatCurrency(grossProfit)})
                                </p>
                                <p className="text-xs text-gray-600 mb-2">
                                  Shows how much customer lifetime value you
                                  generate for every dollar of gross profit.
                                  Higher ratios indicate better value creation
                                  from your profit base.
                                </p>
                                <div className="text-xs">
                                  <span
                                    className={`px-2 py-1 rounded ${
                                      ltvToGP >= 0.5
                                        ? "bg-green-100 text-green-800"
                                        : ltvToGP >= 0.33
                                        ? "bg-yellow-100 text-yellow-800"
                                        : ltvToGP >= 0.2
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {ltvToGP >= 0.5
                                      ? "Excellent (0.5x+)"
                                      : ltvToGP >= 0.33
                                      ? "Good (0.33-0.5x)"
                                      : ltvToGP >= 0.2
                                      ? "Fair (0.2-0.33x)"
                                      : "Needs Improvement (<0.2x)"}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-gray-600 italic">
                                Upload P&L data in the Financials tab to see
                                this ratio. LTV : GP shows how efficiently you
                                convert profit into customer value.
                              </p>
                            )}
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <h5 className="font-semibold text-blue-900 mb-2">
                              LTV : CAC Ratio
                            </h5>
                            {dashboardData.plData &&
                            totalMarketingExpenses > 0 &&
                            totalNewCustomers > 0 ? (
                              <>
                                <p className="text-sm text-gray-700 mb-2">
                                  <strong>{ltvToCAC.toFixed(2)}x</strong> (
                                  {formatCurrency(clv)} ÷ {formatCurrency(cac)})
                                </p>
                                <p className="text-xs text-gray-600 mb-2">
                                  The gold standard SaaS metric. Shows how much
                                  customer value you get for every dollar spent
                                  acquiring customers. Essential for sustainable
                                  growth.
                                </p>
                                <div className="text-xs">
                                  <span
                                    className={`px-2 py-1 rounded ${
                                      ltvToCAC >= 3
                                        ? "bg-green-100 text-green-800"
                                        : ltvToCAC >= 1
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {ltvToCAC >= 3
                                      ? "Excellent (3x+) - Healthy business"
                                      : ltvToCAC >= 1
                                      ? "Acceptable (1-3x) - Needs improvement"
                                      : "Critical (<1x) - Losing money"}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-gray-600 italic">
                                Upload P&L data and order data to see this
                                ratio. LTV : CAC is the most important metric
                                for measuring acquisition efficiency.
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-orange-200">
                          <p className="text-sm text-orange-800 mb-2">
                            <strong>Key Insights:</strong>
                          </p>
                          <div className="text-xs text-gray-700 space-y-1">
                            <p>
                              • <strong>LTV : GP</strong> measures profitability
                              efficiency - how well you convert profit into
                              customer relationships
                            </p>
                            <p>
                              • <strong>LTV : CAC</strong> is the holy grail
                              metric for sustainable growth - shows if you're
                              spending wisely on customer acquisition
                            </p>
                            <p>
                              • A 3:1 LTV:CAC ratio means every $1 spent on
                              marketing returns $3 in customer value - the
                              minimum for a healthy business
                            </p>
                            <p>
                              • If LTV : CAC is below 1x, you're losing money on
                              every customer acquired - immediate action needed
                            </p>
                            <p>
                              • Current CAC:{" "}
                              {cac > 0 ? formatCurrency(cac) : "N/A"} (Marketing
                              Expenses ÷ New Customers)
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                        <h4 className="text-lg font-semibold text-green-900 mb-3">
                          Understanding CLV vs 3-Year LTV
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-4 border border-indigo-200">
                            <h5 className="font-semibold text-indigo-900 mb-2">
                              CLV (Customer Lifetime Value)
                            </h5>
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>{formatCurrency(clv)}</strong>
                            </p>
                            <p className="text-xs text-gray-600">
                              Based on your actual average customer lifespan of{" "}
                              {avgLifespanMonths.toFixed(1)} months. This
                              reflects your current customer retention
                              performance.
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-green-200">
                            <h5 className="font-semibold text-green-900 mb-2">
                              3-Year LTV (Lifetime Value)
                            </h5>
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>{formatCurrency(threeYearLTV)}</strong>
                            </p>
                            <p className="text-xs text-gray-600">
                              Projected value if you retain customers for 36
                              months. This represents your potential revenue with
                              improved retention strategies.
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-green-200">
                          <p className="text-sm text-green-800">
                            <strong>Gap Analysis:</strong> The difference of{" "}
                            {formatCurrency(Math.abs(threeYearLTV - clv))}{" "}
                            represents{" "}
                            {threeYearLTV > clv
                              ? "potential upside"
                              : "current overperformance"}{" "}
                            if customer retention{" "}
                            {threeYearLTV > clv
                              ? "improves to 3 years"
                              : "maintains current levels"}
                            .
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            {activeTab === "clv" &&
              (!dashboardData.subscriptionData ||
                dashboardData.subscriptionData.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  Please upload subscription data to view CLV analysis
                </div>
              )}

            {activeTab === "merchandise" &&
              dashboardData.masterData &&
              dashboardData.masterData.length > 0 &&
              (() => {
                const monthlyMetrics = {};

                dashboardData.masterData.forEach((order) => {
                  if (!order.Created_At || !order.Year || !order.Month) return;

                  const monthKey = `${order.Year}-${String(
                    new Date(order.Created_At).getMonth() + 1
                  ).padStart(2, "0")}`;
                  const platform = order.Platform;

                  if (!monthlyMetrics[monthKey]) {
                    monthlyMetrics[monthKey] = {
                      month: `${order.Month} ${order.Year}`,
                      sortKey: monthKey,
                      Shopify: { gmv: 0, orders: 0, paidOrders: 0, aov: 0 },
                      TikTok: { gmv: 0, orders: 0, paidOrders: 0, aov: 0 },
                      Overall: { gmv: 0, orders: 0, paidOrders: 0, aov: 0 },
                    };
                  }

                  const revenue = order.Total || 0;
                  const isPaidOrder = revenue > 0;

                  monthlyMetrics[monthKey][platform].gmv += revenue;
                  monthlyMetrics[monthKey][platform].orders += 1;
                  if (isPaidOrder) {
                    monthlyMetrics[monthKey][platform].paidOrders += 1;
                  }
                  monthlyMetrics[monthKey].Overall.gmv += revenue;
                  monthlyMetrics[monthKey].Overall.orders += 1;
                  if (isPaidOrder) {
                    monthlyMetrics[monthKey].Overall.paidOrders += 1;
                  }
                });

                Object.values(monthlyMetrics).forEach((metric) => {
                  metric.Shopify.aov =
                    metric.Shopify.paidOrders > 0
                      ? metric.Shopify.gmv / metric.Shopify.paidOrders
                      : 0;
                  metric.TikTok.aov =
                    metric.TikTok.paidOrders > 0
                      ? metric.TikTok.gmv / metric.TikTok.paidOrders
                      : 0;
                  metric.Overall.aov =
                    metric.Overall.paidOrders > 0
                      ? metric.Overall.gmv / metric.Overall.paidOrders
                      : 0;
                });

                const sortedMetrics = Object.values(monthlyMetrics).sort(
                  (a, b) => b.sortKey.localeCompare(a.sortKey)
                );

                const totals = {
                  Shopify: { gmv: 0, orders: 0, paidOrders: 0, aov: 0 },
                  TikTok: { gmv: 0, orders: 0, paidOrders: 0, aov: 0 },
                  Overall: { gmv: 0, orders: 0, paidOrders: 0, aov: 0 },
                };

                sortedMetrics.forEach((metric) => {
                  totals.Shopify.gmv += metric.Shopify.gmv;
                  totals.Shopify.orders += metric.Shopify.orders;
                  totals.Shopify.paidOrders += metric.Shopify.paidOrders;
                  totals.TikTok.gmv += metric.TikTok.gmv;
                  totals.TikTok.orders += metric.TikTok.orders;
                  totals.TikTok.paidOrders += metric.TikTok.paidOrders;
                  totals.Overall.gmv += metric.Overall.gmv;
                  totals.Overall.orders += metric.Overall.orders;
                  totals.Overall.paidOrders += metric.Overall.paidOrders;
                });

                totals.Shopify.aov =
                  totals.Shopify.paidOrders > 0
                    ? totals.Shopify.gmv / totals.Shopify.paidOrders
                    : 0;
                totals.TikTok.aov =
                  totals.TikTok.paidOrders > 0
                    ? totals.TikTok.gmv / totals.TikTok.paidOrders
                    : 0;
                totals.Overall.aov =
                  totals.Overall.paidOrders > 0
                    ? totals.Overall.gmv / totals.Overall.paidOrders
                    : 0;

                return (
                  <div>
                    <h3 className="text-xl font-semibold mb-6">
                      Merchandise Metrics by Channel & Month
                    </h3>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
                        <div className="text-xs opacity-90 mb-1">
                          Shopify Performance
                        </div>
                        <div className="text-xl font-bold mb-1">
                          {formatCurrency(totals.Shopify.gmv)}
                        </div>
                        <div className="text-xs opacity-80">
                          {totals.Shopify.orders} orders •{" "}
                          {formatCurrency(totals.Shopify.aov)} AOV
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
                        <div className="text-xs opacity-90 mb-1">
                          TikTok Performance
                        </div>
                        <div className="text-xl font-bold mb-1">
                          {formatCurrency(totals.TikTok.gmv)}
                        </div>
                        <div className="text-xs opacity-80">
                          {totals.TikTok.orders} orders •{" "}
                          {formatCurrency(totals.TikTok.aov)} AOV
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white">
                        <div className="text-xs opacity-90 mb-1">
                          Overall Performance
                        </div>
                        <div className="text-xl font-bold mb-1">
                          {formatCurrency(totals.Overall.gmv)}
                        </div>
                        <div className="text-xs opacity-80">
                          {totals.Overall.orders} orders •{" "}
                          {formatCurrency(totals.Overall.aov)} AOV
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-3 text-left text-sm font-semibold border-r sticky left-0 bg-gray-100 z-10">
                              Month
                            </th>
                            <th
                              className="px-4 py-3 text-center text-sm font-semibold border-r bg-green-50"
                              colSpan="3"
                            >
                              Shopify
                            </th>
                            <th
                              className="px-4 py-3 text-center text-sm font-semibold border-r bg-blue-50"
                              colSpan="3"
                            >
                              TikTok
                            </th>
                            <th
                              className="px-4 py-3 text-center text-sm font-semibold bg-purple-50"
                              colSpan="3"
                            >
                              Overall
                            </th>
                          </tr>
                          <tr className="bg-gray-50">
                            <th className="sticky left-0 bg-gray-50 z-10"></th>
                            <th className="px-4 py-2 text-center text-xs font-semibold bg-green-50">
                              GMV
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold bg-green-50">
                              Orders
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold border-r bg-green-50">
                              AOV
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold bg-blue-50">
                              GMV
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold bg-blue-50">
                              Orders
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold border-r bg-blue-50">
                              AOV
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold bg-purple-50">
                              GMV
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold bg-purple-50">
                              Orders
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-semibold bg-purple-50">
                              AOV
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {sortedMetrics.map((metric, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium border-r sticky left-0 bg-white">
                                {metric.month}
                              </td>
                              <td className="px-4 py-3 text-sm text-right bg-green-50">
                                {formatCurrency(metric.Shopify.gmv)}
                              </td>
                              <td className="px-4 py-3 text-sm text-center bg-green-50">
                                {metric.Shopify.orders}
                              </td>
                              <td className="px-4 py-3 text-sm text-right border-r bg-green-50">
                                {formatCurrency(metric.Shopify.aov)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right bg-blue-50">
                                {formatCurrency(metric.TikTok.gmv)}
                              </td>
                              <td className="px-4 py-3 text-sm text-center bg-blue-50">
                                {metric.TikTok.orders}
                              </td>
                              <td className="px-4 py-3 text-sm text-right border-r bg-blue-50">
                                {formatCurrency(metric.TikTok.aov)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium bg-purple-50">
                                {formatCurrency(metric.Overall.gmv)}
                              </td>
                              <td className="px-4 py-3 text-sm text-center font-medium bg-purple-50">
                                {metric.Overall.orders}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium bg-purple-50">
                                {formatCurrency(metric.Overall.aov)}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-indigo-600 text-white font-bold">
                            <td className="px-4 py-3 text-sm border-r sticky left-0 bg-indigo-600 z-10">
                              TOTAL
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {formatCurrency(totals.Shopify.gmv)}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {totals.Shopify.orders}
                            </td>
                            <td className="px-4 py-3 text-sm text-right border-r">
                              {formatCurrency(totals.Shopify.aov)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {formatCurrency(totals.TikTok.gmv)}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {totals.TikTok.orders}
                            </td>
                            <td className="px-4 py-3 text-sm text-right border-r">
                              {formatCurrency(totals.TikTok.aov)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {formatCurrency(totals.Overall.gmv)}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {totals.Overall.orders}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {formatCurrency(totals.Overall.aov)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 bg-indigo-50 rounded-lg p-5 border border-indigo-200">
                      <h4 className="font-semibold text-indigo-900 mb-3">
                        Metric Definitions
                      </h4>
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-indigo-800">
                        <div>
                          <span className="font-semibold">
                            GMV (Gross Merchandise Value):
                          </span>{" "}
                          Total value of all orders before any deductions
                        </div>
                        <div>
                          <span className="font-semibold">Orders:</span> Total
                          number of orders placed
                        </div>
                        <div>
                          <span className="font-semibold">
                            AOV (Average Order Value):
                          </span>{" "}
                          GMV divided by number of paid orders
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-indigo-200">
                        <p className="text-xs text-indigo-700">
                          <strong>Note:</strong> AOV calculations exclude orders
                          with $0 amount (giveaways). These orders are counted
                          in the total order count but not included when
                          calculating average order value.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="bg-white rounded-lg p-5 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-4">
                          Channel Split
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Shopify</span>
                              <span className="font-semibold">
                                {(
                                  (totals.Shopify.gmv / totals.Overall.gmv) *
                                  100
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${
                                    (totals.Shopify.gmv / totals.Overall.gmv) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">TikTok</span>
                              <span className="font-semibold">
                                {(
                                  (totals.TikTok.gmv / totals.Overall.gmv) *
                                  100
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{
                                  width: `${
                                    (totals.TikTok.gmv / totals.Overall.gmv) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            {activeTab === "merchandise" &&
              (!dashboardData.masterData ||
                dashboardData.masterData.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  Please upload Shopify or TikTok order data to view merchandise
                  metrics
                </div>
              )}

            {activeTab === "products" &&
              dashboardData.masterData &&
              dashboardData.masterData.length > 0 &&
              (() => {
                const buildKPIs = (data) => {
                  const topProducts = {};
                  data.forEach((row) => {
                    const product = row.Product_Name || "Unknown";
                    if (!topProducts[product])
                      topProducts[product] = { revenue: 0, units: 0 };
                    topProducts[product].revenue += row.Total || 0;
                    topProducts[product].units += row.Quantity || 0;
                  });
                  return {
                    topProducts: Object.entries(topProducts)
                      .map(([name, data]) => ({ product: name, ...data }))
                      .sort((a, b) => b.revenue - a.revenue)
                      .slice(0, 50),
                  };
                };

                const kpis = buildKPIs(dashboardData.masterData);

                return (
                  <div>
                    {!selectedProduct ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">
                          Top Products by Revenue
                        </h3>
                        <div className="space-y-2">
                          {kpis.topProducts.slice(0, 20).map((product, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-2 hover:bg-indigo-50 cursor-pointer transition-colors border border-gray-200 hover:border-indigo-300"
                              onClick={() =>
                                setSelectedProduct(product.product)
                              }
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                                  {idx + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {product.product}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {product.units} units sold
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-lg text-gray-900">
                                  {formatCurrency(product.revenue)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatCurrency(
                                    product.revenue / product.units
                                  )}{" "}
                                  avg price
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-4 mb-6">
                          <button
                            onClick={() => setSelectedProduct(null)}
                            className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2"
                          >
                            ← Back to Products
                          </button>
                          <h3 className="text-xl font-semibold">
                            {selectedProduct}
                          </h3>
                        </div>
                        {(() => {
                          const productOrders = dashboardData.masterData.filter(
                            (order) => order.Product_Name === selectedProduct
                          );

                          const totalRevenue = productOrders.reduce(
                            (sum, order) => sum + (order.Total || 0),
                            0
                          );
                          const totalUnits = productOrders.reduce(
                            (sum, order) => sum + (order.Quantity || 0),
                            0
                          );
                          const avgUnitPrice =
                            totalUnits > 0 ? totalRevenue / totalUnits : 0;

                          const platformBreakdown = {};
                          productOrders.forEach((order) => {
                            const platform = order.Platform;
                            if (!platformBreakdown[platform]) {
                              platformBreakdown[platform] = {
                                revenue: 0,
                                orders: 0,
                                units: 0,
                              };
                            }
                            platformBreakdown[platform].revenue +=
                              order.Total || 0;
                            platformBreakdown[platform].orders += 1;
                            platformBreakdown[platform].units +=
                              order.Quantity || 0;
                          });

                          const monthlyTrend = {};
                          productOrders.forEach((order) => {
                            if (order.Created_At) {
                              const date = new Date(order.Created_At);
                              const monthKey = `${date.getFullYear()}-${String(
                                date.getMonth() + 1
                              ).padStart(2, "0")}`;
                              if (!monthlyTrend[monthKey]) {
                                monthlyTrend[monthKey] = {
                                  revenue: 0,
                                  orders: 0,
                                  units: 0,
                                };
                              }
                              monthlyTrend[monthKey].revenue +=
                                order.Total || 0;
                              monthlyTrend[monthKey].orders += 1;
                              monthlyTrend[monthKey].units +=
                                order.Quantity || 0;
                            }
                          });

                          const sortedMonths = Object.keys(monthlyTrend)
                            .sort()
                            .reverse();

                          return (
                            <div className="space-y-6">
                              <div className="grid md:grid-cols-4 gap-4">
                                <div className="bg-indigo-100 rounded-lg p-4">
                                  <div className="text-sm text-indigo-700 mb-1">
                                    Total Revenue
                                  </div>
                                  <div className="text-2xl font-bold text-indigo-900">
                                    {formatCurrency(totalRevenue)}
                                  </div>
                                </div>
                                <div className="bg-green-100 rounded-lg p-4">
                                  <div className="text-sm text-green-700 mb-1">
                                    Total Orders
                                  </div>
                                  <div className="text-2xl font-bold text-green-900">
                                    {productOrders.length}
                                  </div>
                                </div>
                                <div className="bg-purple-100 rounded-lg p-4">
                                  <div className="text-sm text-purple-700 mb-1">
                                    Total Units
                                  </div>
                                  <div className="text-2xl font-bold text-purple-900">
                                    {totalUnits}
                                  </div>
                                </div>
                                <div className="bg-orange-100 rounded-lg p-4">
                                  <div className="text-sm text-orange-700 mb-1">
                                    Avg Unit Price
                                  </div>
                                  <div className="text-2xl font-bold text-orange-900">
                                    {formatCurrency(avgUnitPrice)}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-lg font-semibold mb-4">
                                  Sales by Platform
                                </h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                  {Object.entries(platformBreakdown).map(
                                    ([platform, data]) => (
                                      <div
                                        key={platform}
                                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <h5 className="font-semibold text-gray-900">
                                            {platform}
                                          </h5>
                                          <div className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                                            {(
                                              (data.revenue / totalRevenue) *
                                              100
                                            ).toFixed(1)}
                                            % of revenue
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">
                                              Revenue:
                                            </span>
                                            <span className="font-semibold">
                                              {formatCurrency(data.revenue)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">
                                              Orders:
                                            </span>
                                            <span className="font-semibold">
                                              {data.orders}
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">
                                              Units:
                                            </span>
                                            <span className="font-semibold">
                                              {data.units}
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">
                                              AOV:
                                            </span>
                                            <span className="font-semibold">
                                              {formatCurrency(
                                                data.revenue / data.orders
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-lg font-semibold mb-4">
                                  Monthly Performance
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">
                                          Month
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold">
                                          Revenue
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold">
                                          Orders
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold">
                                          Units
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold">
                                          AOV
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold">
                                          Avg Unit Price
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {sortedMonths.map((monthKey) => {
                                        const data = monthlyTrend[monthKey];
                                        const [year, month] =
                                          monthKey.split("-");
                                        const monthName = new Date(
                                          year,
                                          parseInt(month) - 1
                                        ).toLocaleString("default", {
                                          month: "long",
                                          year: "numeric",
                                        });

                                        return (
                                          <tr
                                            key={monthKey}
                                            className="hover:bg-gray-50"
                                          >
                                            <td className="px-4 py-3 text-sm font-medium">
                                              {monthName}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-green-700">
                                              {formatCurrency(data.revenue)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center">
                                              {data.orders}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center">
                                              {data.units}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right">
                                              {formatCurrency(
                                                data.revenue / data.orders
                                              )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right">
                                              {formatCurrency(
                                                data.revenue / data.units
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-lg font-semibold mb-4">
                                  Recent Orders
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">
                                          Order ID
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">
                                          Date
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">
                                          Platform
                                        </th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold">
                                          Quantity
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold">
                                          Total
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {productOrders
                                        .sort(
                                          (a, b) =>
                                            new Date(b.Created_At) -
                                            new Date(a.Created_At)
                                        )
                                        .slice(0, 10)
                                        .map((order, idx) => (
                                          <tr
                                            key={idx}
                                            className="hover:bg-gray-50"
                                          >
                                            <td className="px-4 py-3 text-sm font-mono text-gray-600">
                                              {order.Order_ID}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                              {new Date(
                                                order.Created_At
                                              ).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                              })}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                              <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${
                                                  order.Platform === "Shopify"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-blue-100 text-blue-800"
                                                }`}
                                              >
                                                {order.Platform}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center">
                                              {order.Quantity}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold">
                                              {formatCurrency(order.Total)}
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })()}
            {activeTab === "products" &&
              (!dashboardData.masterData ||
                dashboardData.masterData.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  Please upload Shopify or TikTok order data to view product
                  metrics
                </div>
              )}

            {activeTab === "financials" &&
              dashboardData.plData &&
              (() => {
                const accountColumn = dashboardData.plData.accountColumn;
                const allColumns = Object.keys(dashboardData.plData[0] || {});
                // Take exactly the first 12 columns after the account column (January through December)
                const months = allColumns.slice(1, 13);

                const plMappings = dashboardData.plData.mappings || {};
                const monthlyData = {};
                months.forEach((month) => {
                  const categories = {};
                  dashboardData.plData.forEach((row) => {
                    const lineItem = row[accountColumn];
                    if (!lineItem) return;
                    const category = plMappings[lineItem] || "Uncategorized";
                    const value =
                      parseFloat(
                        String(row[month] || "0").replace(/[^0-9.-]/g, "")
                      ) || 0;
                    categories[category] = (categories[category] || 0) + value;
                  });
                  monthlyData[month] = categories;
                });

                const incomeCategories = [
                  "Shopify - Income",
                  "TikTok - Income",
                ];
                const discountCategories = [
                  "Shopify Discounts",
                  "TikTok Discounts",
                ];
                const merchantFeeCategories = ["Merchant Fees"];
                const expenseCategories = [
                  "Cost of Goods Sold",
                  "Inward Shipping",
                  "Outward Shipping",
                  "Merchant Fees",
                  "Marketing Expenses",
                  "Operating Expenses",
                ];

                const calculateYTDTotal = (categories) => {
                  return months.reduce((sum, month) => {
                    return (
                      sum +
                      categories.reduce(
                        (catSum, cat) =>
                          catSum + (monthlyData[month]?.[cat] || 0),
                        0
                      )
                    );
                  }, 0);
                };

                const totalGrossRevenue = calculateYTDTotal(incomeCategories);
                const totalOtherIncome = months.reduce(
                  (sum, month) =>
                    sum + (monthlyData[month]?.["Other Income"] || 0),
                  0
                );
                const totalDiscounts = calculateYTDTotal(discountCategories);
                const totalMerchantFees = calculateYTDTotal(
                  merchantFeeCategories
                );
                const totalRevenue =
                  totalGrossRevenue + totalOtherIncome + totalDiscounts;
                const totalCOGS = months.reduce(
                  (sum, month) =>
                    sum + (monthlyData[month]?.["Cost of Goods Sold"] || 0),
                  0
                );
                const totalInwardShipping = months.reduce(
                  (sum, month) =>
                    sum + (monthlyData[month]?.["Inward Shipping"] || 0),
                  0
                );
                const totalOutwardShipping = months.reduce(
                  (sum, month) =>
                    sum + (monthlyData[month]?.["Outward Shipping"] || 0),
                  0
                );
                const totalCOGSWithShipping =
                  totalCOGS +
                  totalInwardShipping +
                  totalOutwardShipping +
                  totalMerchantFees;
                const totalMarketing = months.reduce(
                  (sum, month) =>
                    sum + (monthlyData[month]?.["Marketing Expenses"] || 0),
                  0
                );
                const totalOperating = months.reduce(
                  (sum, month) =>
                    sum + (monthlyData[month]?.["Operating Expenses"] || 0),
                  0
                );
                const totalExpenses = calculateYTDTotal(expenseCategories);
                const grossProfit = totalRevenue - totalCOGSWithShipping;
                const netIncome = totalRevenue - totalExpenses;
                const grossMargin =
                  totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
                const netMargin =
                  totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

                return (
                  <div>
                    <h3 className="text-xl font-semibold mb-6">
                      Financial Performance
                    </h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg p-4 text-white">
                          <div className="text-xs opacity-90 mb-1">
                            Total Gross Revenue
                          </div>
                          <div className="text-xl font-bold">
                            {formatCurrency(totalGrossRevenue)}
                          </div>
                          <div className="text-xs opacity-80 mt-1">
                            Before discounts
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-4 text-white">
                          <div className="text-xs opacity-90 mb-1">
                            Total Net Revenue
                          </div>
                          <div className="text-xl font-bold">
                            {formatCurrency(totalRevenue)}
                          </div>
                          <div className="text-xs opacity-80 mt-1">
                            After discounts
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-4 text-white">
                          <div className="text-xs opacity-90 mb-1">
                            Gross Profit
                          </div>
                          <div className="text-xl font-bold">
                            {formatCurrency(grossProfit)}
                          </div>
                          <div className="text-xs opacity-80 mt-1">
                            {grossMargin.toFixed(1)}% margin
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-4 text-white">
                          <div className="text-xs opacity-90 mb-1">
                            Net Income
                          </div>
                          <div className="text-xl font-bold">
                            {formatCurrency(netIncome)}
                          </div>
                          <div className="text-xs opacity-80 mt-1">
                            {netMargin.toFixed(1)}% margin
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-3">
                          Revenue Breakdown
                        </h4>
                        <div className="space-y-2">
                          {incomeCategories.map((cat) => {
                            const value = months.reduce(
                              (s, m) => s + (monthlyData[m]?.[cat] || 0),
                              0
                            );
                            const percentage =
                              totalRevenue > 0
                                ? (value / totalRevenue) * 100
                                : 0;
                            return value > 0 ? (
                              <div key={cat}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-700">{cat}</span>
                                  <span className="font-semibold">
                                    {formatCurrency(value)} (
                                    {percentage.toFixed(1)}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="text-sm text-gray-600 mb-1">
                            Gross Margin
                          </div>
                          <div className="text-3xl font-bold text-gray-900">
                            {grossMargin.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            (Revenue - COGS) / Revenue
                          </div>
                          <div className="mt-2 text-xs">
                            <span
                              className={`px-2 py-1 rounded ${
                                grossMargin >= 60
                                  ? "bg-green-100 text-green-800"
                                  : grossMargin >= 40
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {grossMargin >= 60
                                ? "Excellent"
                                : grossMargin >= 40
                                ? "Good"
                                : "Needs Improvement"}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="text-sm text-gray-600 mb-1">
                            Net Margin
                          </div>
                          <div className="text-3xl font-bold text-gray-900">
                            {netMargin.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Net Income / Revenue
                          </div>
                          <div className="mt-2 text-xs">
                            <span
                              className={`px-2 py-1 rounded ${
                                netMargin >= 20
                                  ? "bg-green-100 text-green-800"
                                  : netMargin >= 10
                                  ? "bg-yellow-100 text-yellow-800"
                                  : netMargin >= 0
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {netMargin >= 20
                                ? "Excellent"
                                : netMargin >= 10
                                ? "Good"
                                : netMargin >= 0
                                ? "Break-even"
                                : "Loss"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold mb-4">
                          Profit & Loss Statement
                        </h4>
                        <div className="bg-white rounded-lg shadow-sm border">
                          <div
                            style={{
                              maxHeight: "600px",
                              overflow: "auto",
                              position: "relative",
                            }}
                          >
                            <table
                              className="w-full text-sm"
                              style={{ position: "relative" }}
                            >
                              <thead
                                style={{
                                  position: "sticky",
                                  top: 0,
                                  zIndex: 30,
                                }}
                              >
                                <tr
                                  className="border-b bg-gray-100"
                                  style={{ backgroundColor: "#f3f4f6" }}
                                >
                                  <th
                                    className="px-4 py-3 text-left font-semibold text-gray-900"
                                    style={{
                                      position: "sticky",
                                      left: 0,
                                      backgroundColor: "#f3f4f6",
                                      zIndex: 31,
                                    }}
                                  ></th>
                                  {months.map((month, index) => (
                                    <th
                                      key={month}
                                      className="px-3 py-3 text-right font-semibold text-gray-700 min-w-[100px]"
                                      style={{ backgroundColor: "#f3f4f6" }}
                                    >
                                      {
                                        [
                                          "January",
                                          "February",
                                          "March",
                                          "April",
                                          "May",
                                          "June",
                                          "July",
                                          "August",
                                          "September",
                                          "October",
                                          "November",
                                          "December",
                                        ][index]
                                      }
                                    </th>
                                  ))}
                                  <th
                                    className="px-3 py-3 text-right font-semibold text-indigo-900"
                                    style={{
                                      position: "sticky",
                                      right: 0,
                                      backgroundColor: "#e0e7ff",
                                      zIndex: 31,
                                    }}
                                  >
                                    YTD Total
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="bg-green-50">
                                  <td className="px-4 py-3 font-bold text-green-900 sticky left-0 bg-green-50 z-10">
                                    <button
                                      onClick={() =>
                                        setExpandedPLSections({
                                          ...expandedPLSections,
                                          revenue: !expandedPLSections.revenue,
                                        })
                                      }
                                      className="flex items-center gap-2 hover:text-green-700"
                                    >
                                      <span className="text-lg">
                                        {expandedPLSections.revenue ? "▼" : "▶"}
                                      </span>
                                      REVENUE
                                    </button>
                                  </td>
                                  {months.map((month) => (
                                    <td key={month}></td>
                                  ))}
                                  <td className="sticky right-0 bg-green-50"></td>
                                </tr>
                                {expandedPLSections.revenue &&
                                  dashboardData.plData.map((row, idx) => {
                                    const lineItem = row[accountColumn];
                                    if (!lineItem) return null;
                                    const category =
                                      plMappings[lineItem] || "Uncategorized";
                                    if (!incomeCategories.includes(category))
                                      return null;
                                    const ytdTotal = months.reduce(
                                      (s, m) =>
                                        s +
                                        (parseFloat(
                                          String(row[m] || "0").replace(
                                            /[^0-9.-]/g,
                                            ""
                                          )
                                        ) || 0),
                                      0
                                    );
                                    return ytdTotal !== 0 ? (
                                      <tr
                                        key={idx}
                                        className="border-b border-gray-100 hover:bg-gray-50"
                                      >
                                        <td className="px-4 py-3 pl-8 text-gray-700 sticky left-0 bg-white z-10">
                                          {lineItem}
                                        </td>
                                        {months.map((month) => (
                                          <td
                                            key={month}
                                            className="px-3 py-3 text-right text-gray-700"
                                          >
                                            {formatCurrency(
                                              parseFloat(
                                                String(
                                                  row[month] || "0"
                                                ).replace(/[^0-9.-]/g, "")
                                              ) || 0
                                            )}
                                          </td>
                                        ))}
                                        <td className="px-3 py-3 text-right bg-indigo-50 font-medium text-indigo-900 sticky right-0 z-10">
                                          {formatCurrency(ytdTotal)}
                                        </td>
                                      </tr>
                                    ) : null;
                                  })}
                                <tr className="bg-green-100 border-b border-green-200">
                                  <td className="px-4 py-3 font-bold text-green-900 sticky left-0 bg-green-100 z-10">
                                    TOTAL GROSS REVENUE
                                  </td>
                                  {months.map((month) => {
                                    const monthTotal = incomeCategories.reduce(
                                      (s, cat) =>
                                        s + (monthlyData[month]?.[cat] || 0),
                                      0
                                    );
                                    return (
                                      <td
                                        key={month}
                                        className="px-3 py-3 text-right font-bold text-green-900"
                                      >
                                        {formatCurrency(monthTotal)}
                                      </td>
                                    );
                                  })}
                                  <td className="px-3 py-3 text-right bg-green-200 font-bold text-green-900 sticky right-0 z-10">
                                    {formatCurrency(totalGrossRevenue)}
                                  </td>
                                </tr>
                                <tr className="bg-teal-50">
                                  <td className="px-4 py-3 font-bold text-teal-900 sticky left-0 bg-teal-50 z-10">
                                    <button
                                      onClick={() =>
                                        setExpandedPLSections({
                                          ...expandedPLSections,
                                          otherIncome:
                                            !expandedPLSections.otherIncome,
                                        })
                                      }
                                      className="flex items-center gap-2 hover:text-teal-700"
                                    >
                                      <span className="text-lg">
                                        {expandedPLSections.otherIncome
                                          ? "▼"
                                          : "▶"}
                                      </span>
                                      OTHER INCOME
                                    </button>
                                  </td>
                                  {months.map((month) => (
                                    <td key={month}></td>
                                  ))}
                                  <td className="sticky right-0 bg-teal-50"></td>
                                </tr>
                                {expandedPLSections.otherIncome &&
                                  dashboardData.plData.map((row, idx) => {
                                    const lineItem = row[accountColumn];
                                    if (!lineItem) return null;
                                    const category =
                                      plMappings[lineItem] || "Uncategorized";
                                    if (category !== "Other Income")
                                      return null;
                                    const ytdTotal = months.reduce(
                                      (s, m) =>
                                        s +
                                        (parseFloat(
                                          String(row[m] || "0").replace(
                                            /[^0-9.-]/g,
                                            ""
                                          )
                                        ) || 0),
                                      0
                                    );
                                    return ytdTotal !== 0 ? (
                                      <tr
                                        key={idx}
                                        className="border-b border-gray-100 hover:bg-gray-50"
                                      >
                                        <td className="px-4 py-3 pl-8 text-gray-700 sticky left-0 bg-white z-10">
                                          {lineItem}
                                        </td>
                                        {months.map((month) => (
                                          <td
                                            key={month}
                                            className="px-3 py-3 text-right text-gray-700"
                                          >
                                            {formatCurrency(
                                              parseFloat(
                                                String(
                                                  row[month] || "0"
                                                ).replace(/[^0-9.-]/g, "")
                                              ) || 0
                                            )}
                                          </td>
                                        ))}
                                        <td className="px-3 py-3 text-right bg-indigo-50 font-medium text-indigo-900 sticky right-0 z-10">
                                          {formatCurrency(ytdTotal)}
                                        </td>
                                      </tr>
                                    ) : null;
                                  })}
                                <tr className="bg-green-100 border-b-2 border-green-200">
                                  <td className="px-4 py-3 font-bold text-green-900 sticky left-0 bg-green-100 z-10">
                                    TOTAL REVENUE
                                  </td>
                                  {months.map((month) => {
                                    const monthTotal = incomeCategories.reduce(
                                      (s, cat) =>
                                        s + (monthlyData[month]?.[cat] || 0),
                                      0
                                    );
                                    const otherIncome =
                                      monthlyData[month]?.["Other Income"] || 0;
                                    return (
                                      <td
                                        key={month}
                                        className="px-3 py-3 text-right font-bold text-green-900"
                                      >
                                        {formatCurrency(
                                          monthTotal + otherIncome
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="px-3 py-3 text-right bg-green-200 font-bold text-green-900 sticky right-0 z-10">
                                    {formatCurrency(
                                      totalGrossRevenue + totalOtherIncome
                                    )}
                                  </td>
                                </tr>
                                <tr className="bg-yellow-50">
                                  <td className="px-4 py-3 font-bold text-yellow-900 sticky left-0 bg-yellow-50 z-10">
                                    <button
                                      onClick={() =>
                                        setExpandedPLSections({
                                          ...expandedPLSections,
                                          discounts:
                                            !expandedPLSections.discounts,
                                        })
                                      }
                                      className="flex items-center gap-2 hover:text-yellow-700"
                                    >
                                      <span className="text-lg">
                                        {expandedPLSections.discounts
                                          ? "▼"
                                          : "▶"}
                                      </span>
                                      DISCOUNTS
                                    </button>
                                  </td>
                                  {months.map((month) => (
                                    <td key={month}></td>
                                  ))}
                                  <td className="sticky right-0 bg-yellow-50"></td>
                                </tr>
                                {expandedPLSections.discounts &&
                                  dashboardData.plData.map((row, idx) => {
                                    const lineItem = row[accountColumn];
                                    if (!lineItem) return null;
                                    const category =
                                      plMappings[lineItem] || "Uncategorized";
                                    if (!discountCategories.includes(category))
                                      return null;
                                    const ytdTotal = months.reduce(
                                      (s, m) =>
                                        s +
                                        (parseFloat(
                                          String(row[m] || "0").replace(
                                            /[^0-9.-]/g,
                                            ""
                                          )
                                        ) || 0),
                                      0
                                    );
                                    return ytdTotal !== 0 ? (
                                      <tr
                                        key={idx}
                                        className="border-b border-gray-100 hover:bg-gray-50"
                                      >
                                        <td className="px-4 py-3 pl-8 text-gray-700 sticky left-0 bg-white z-10">
                                          {lineItem}
                                        </td>
                                        {months.map((month) => (
                                          <td
                                            key={month}
                                            className="px-3 py-3 text-right text-gray-700"
                                          >
                                            {formatCurrency(
                                              parseFloat(
                                                String(
                                                  row[month] || "0"
                                                ).replace(/[^0-9.-]/g, "")
                                              ) || 0
                                            )}
                                          </td>
                                        ))}
                                        <td className="px-3 py-3 text-right bg-indigo-50 font-medium text-indigo-900 sticky right-0 z-10">
                                          {formatCurrency(ytdTotal)}
                                        </td>
                                      </tr>
                                    ) : null;
                                  })}
                                <tr className="bg-green-200 border-b-2 border-green-300">
                                  <td className="px-4 py-3 font-bold text-green-900 sticky left-0 bg-green-200 z-10">
                                    NET REVENUE
                                  </td>
                                  {months.map((month) => {
                                    const grossRev = incomeCategories.reduce(
                                      (s, cat) =>
                                        s + (monthlyData[month]?.[cat] || 0),
                                      0
                                    );
                                    const otherIncome =
                                      monthlyData[month]?.["Other Income"] || 0;
                                    const disc = discountCategories.reduce(
                                      (s, cat) =>
                                        s + (monthlyData[month]?.[cat] || 0),
                                      0
                                    );
                                    return (
                                      <td
                                        key={month}
                                        className="px-3 py-3 text-right font-bold text-green-900"
                                      >
                                        {formatCurrency(
                                          grossRev + otherIncome + disc
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="px-3 py-3 text-right bg-green-300 font-bold text-green-900 sticky right-0 z-10">
                                    {formatCurrency(totalRevenue)}
                                  </td>
                                </tr>
                                <tr className="bg-orange-50">
                                  <td className="px-4 py-3 font-bold text-orange-900 sticky left-0 bg-orange-50 z-10">
                                    <button
                                      onClick={() =>
                                        setExpandedPLSections({
                                          ...expandedPLSections,
                                          cogs: !expandedPLSections.cogs,
                                        })
                                      }
                                      className="flex items-center gap-2 hover:text-orange-700"
                                    >
                                      <span className="text-lg">
                                        {expandedPLSections.cogs ? "▼" : "▶"}
                                      </span>
                                      COST OF GOODS SOLD
                                    </button>
                                  </td>
                                  {months.map((month) => (
                                    <td key={month}></td>
                                  ))}
                                  <td className="sticky right-0 bg-orange-50"></td>
                                </tr>
                                {expandedPLSections.cogs &&
                                  dashboardData.plData.map((row, idx) => {
                                    const lineItem = row[accountColumn];
                                    if (!lineItem) return null;
                                    const category =
                                      plMappings[lineItem] || "Uncategorized";
                                    if (
                                      category !== "Cost of Goods Sold" &&
                                      category !== "Inward Shipping" &&
                                      category !== "Outward Shipping"
                                    )
                                      return null;
                                    const ytdTotal = months.reduce(
                                      (s, m) =>
                                        s +
                                        (parseFloat(
                                          String(row[m] || "0").replace(
                                            /[^0-9.-]/g,
                                            ""
                                          )
                                        ) || 0),
                                      0
                                    );
                                    return ytdTotal !== 0 ? (
                                      <tr
                                        key={idx}
                                        className="border-b border-gray-100 hover:bg-gray-50"
                                      >
                                        <td className="px-4 py-3 pl-8 text-gray-700 sticky left-0 bg-white z-10">
                                          {lineItem}
                                        </td>
                                        {months.map((month) => (
                                          <td
                                            key={month}
                                            className="px-3 py-3 text-right text-gray-700"
                                          >
                                            {formatCurrency(
                                              parseFloat(
                                                String(
                                                  row[month] || "0"
                                                ).replace(/[^0-9.-]/g, "")
                                              ) || 0
                                            )}
                                          </td>
                                        ))}
                                        <td className="px-3 py-3 text-right bg-indigo-50 font-medium text-indigo-900 sticky right-0 z-10">
                                          {formatCurrency(ytdTotal)}
                                        </td>
                                      </tr>
                                    ) : null;
                                  })}
                                {expandedPLSections.cogs &&
                                  dashboardData.plData.map((row, idx) => {
                                    const lineItem = row[accountColumn];
                                    if (!lineItem) return null;
                                    const category =
                                      plMappings[lineItem] || "Uncategorized";
                                    if (
                                      !merchantFeeCategories.includes(category)
                                    )
                                      return null;
                                    const ytdTotal = months.reduce(
                                      (s, m) =>
                                        s +
                                        (parseFloat(
                                          String(row[m] || "0").replace(
                                            /[^0-9.-]/g,
                                            ""
                                          )
                                        ) || 0),
                                      0
                                    );
                                    return ytdTotal !== 0 ? (
                                      <tr
                                        key={idx}
                                        className="border-b border-gray-100 hover:bg-gray-50"
                                      >
                                        <td className="px-4 py-3 pl-8 text-gray-700 sticky left-0 bg-white z-10">
                                          {lineItem}
                                        </td>
                                        {months.map((month) => (
                                          <td
                                            key={month}
                                            className="px-3 py-3 text-right text-gray-700"
                                          >
                                            {formatCurrency(
                                              parseFloat(
                                                String(
                                                  row[month] || "0"
                                                ).replace(/[^0-9.-]/g, "")
                                              ) || 0
                                            )}
                                          </td>
                                        ))}
                                        <td className="px-3 py-3 text-right bg-indigo-50 font-medium text-indigo-900 sticky right-0 z-10">
                                          {formatCurrency(ytdTotal)}
                                        </td>
                                      </tr>
                                    ) : null;
                                  })}
                                <tr className="bg-orange-100 border-b-2 border-orange-200">
                                  <td className="px-4 py-3 font-bold text-orange-900 sticky left-0 bg-orange-100 z-10">
                                    TOTAL COST OF GOODS SOLD
                                  </td>
                                  {months.map((month) => {
                                    const cogs =
                                      (monthlyData[month]?.[
                                        "Cost of Goods Sold"
                                      ] || 0) +
                                      (monthlyData[month]?.[
                                        "Inward Shipping"
                                      ] || 0) +
                                      (monthlyData[month]?.[
                                        "Outward Shipping"
                                      ] || 0) +
                                      merchantFeeCategories.reduce(
                                        (s, cat) =>
                                          s + (monthlyData[month]?.[cat] || 0),
                                        0
                                      );
                                    return (
                                      <td
                                        key={month}
                                        className="px-3 py-3 text-right font-bold text-orange-900"
                                      >
                                        {formatCurrency(cogs)}
                                      </td>
                                    );
                                  })}
                                  <td className="px-3 py-3 text-right bg-orange-200 font-bold text-orange-900 sticky right-0 z-10">
                                    {formatCurrency(totalCOGSWithShipping)}
                                  </td>
                                </tr>
                                <tr className="bg-blue-100 border-b-2 border-blue-200">
                                  <td className="px-4 py-3 font-bold text-blue-900 sticky left-0 bg-blue-100 z-10">
                                    GROSS PROFIT
                                  </td>
                                  {months.map((month) => {
                                    const revenue = incomeCategories.reduce(
                                      (s, cat) =>
                                        s + (monthlyData[month]?.[cat] || 0),
                                      0
                                    );
                                    const otherIncome =
                                      monthlyData[month]?.["Other Income"] || 0;
                                    const disc = discountCategories.reduce(
                                      (s, cat) =>
                                        s + (monthlyData[month]?.[cat] || 0),
                                      0
                                    );
                                    const cogs =
                                      (monthlyData[month]?.[
                                        "Cost of Goods Sold"
                                      ] || 0) +
                                      (monthlyData[month]?.[
                                        "Inward Shipping"
                                      ] || 0) +
                                      (monthlyData[month]?.[
                                        "Outward Shipping"
                                      ] || 0) +
                                      merchantFeeCategories.reduce(
                                        (s, cat) =>
                                          s + (monthlyData[month]?.[cat] || 0),
                                        0
                                      );
                                    const gp =
                                      revenue + otherIncome + disc - cogs;
                                    return (
                                      <td
                                        key={month}
                                        className="px-3 py-3 text-right font-bold text-blue-900"
                                      >
                                        {formatCurrency(gp)}
                                      </td>
                                    );
                                  })}
                                  <td className="px-3 py-3 text-right bg-blue-200 font-bold text-blue-900 sticky right-0 z-10">
                                    {formatCurrency(grossProfit)}
                                  </td>
                                </tr>
                                <tr className="bg-red-50">
                                  <td className="px-4 py-3 font-bold text-red-900 sticky left-0 bg-red-50 z-10">
                                    <button
                                      onClick={() =>
                                        setExpandedPLSections({
                                          ...expandedPLSections,
                                          opex: !expandedPLSections.opex,
                                        })
                                      }
                                      className="flex items-center gap-2 hover:text-red-700"
                                    >
                                      <span className="text-lg">
                                        {expandedPLSections.opex ? "▼" : "▶"}
                                      </span>
                                      OPERATING EXPENSES
                                    </button>
                                  </td>
                                  {months.map((month) => (
                                    <td key={month}></td>
                                  ))}
                                  <td className="sticky right-0 bg-red-50"></td>
                                </tr>
                                {expandedPLSections.opex &&
                                  dashboardData.plData.map((row, idx) => {
                                    const lineItem = row[accountColumn];
                                    if (!lineItem) return null;
                                    const category =
                                      plMappings[lineItem] || "Uncategorized";
                                    if (
                                      category !== "Marketing Expenses" &&
                                      category !== "Operating Expenses"
                                    )
                                      return null;
                                    const ytdTotal = months.reduce(
                                      (s, m) =>
                                        s +
                                        (parseFloat(
                                          String(row[m] || "0").replace(
                                            /[^0-9.-]/g,
                                            ""
                                          )
                                        ) || 0),
                                      0
                                    );
                                    return ytdTotal !== 0 ? (
                                      <tr
                                        key={idx}
                                        className="border-b border-gray-100 hover:bg-gray-50"
                                      >
                                        <td className="px-4 py-3 pl-8 text-gray-700 sticky left-0 bg-white z-10">
                                          {lineItem}
                                        </td>
                                        {months.map((month) => (
                                          <td
                                            key={month}
                                            className="px-3 py-3 text-right text-gray-700"
                                          >
                                            {formatCurrency(
                                              parseFloat(
                                                String(
                                                  row[month] || "0"
                                                ).replace(/[^0-9.-]/g, "")
                                              ) || 0
                                            )}
                                          </td>
                                        ))}
                                        <td className="px-3 py-3 text-right bg-indigo-50 font-medium text-indigo-900 sticky right-0 z-10">
                                          {formatCurrency(ytdTotal)}
                                        </td>
                                      </tr>
                                    ) : null;
                                  })}
                                <tr className="bg-red-100 border-b-2 border-red-200">
                                  <td className="px-4 py-3 font-bold text-red-900 sticky left-0 bg-red-100 z-10">
                                    TOTAL EXPENSES
                                  </td>
                                  {months.map((month) => {
                                    const monthTotal = expenseCategories.reduce(
                                      (s, cat) =>
                                        s + (monthlyData[month]?.[cat] || 0),
                                      0
                                    );
                                    return (
                                      <td
                                        key={month}
                                        className="px-3 py-3 text-right font-bold text-red-900"
                                      >
                                        {formatCurrency(monthTotal)}
                                      </td>
                                    );
                                  })}
                                  <td className="px-3 py-3 text-right bg-red-200 font-bold text-red-900 sticky right-0 z-10">
                                    {formatCurrency(totalExpenses)}
                                  </td>
                                </tr>
                                <tr className="bg-gray-50">
                                  <td className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-gray-50 z-10">
                                    <button
                                      onClick={() =>
                                        setExpandedPLSections({
                                          ...expandedPLSections,
                                          uncategorized:
                                            !expandedPLSections.uncategorized,
                                        })
                                      }
                                      className="flex items-center gap-2 hover:text-gray-700"
                                    >
                                      <span className="text-lg">
                                        {expandedPLSections.uncategorized
                                          ? "▼"
                                          : "▶"}
                                      </span>
                                      UNCATEGORIZED ITEMS
                                    </button>
                                  </td>
                                  {months.map((month) => (
                                    <td key={month}></td>
                                  ))}
                                  <td className="sticky right-0 bg-gray-50"></td>
                                </tr>
                                {expandedPLSections.uncategorized &&
                                  dashboardData.plData.map((row, idx) => {
                                    const lineItem = row[accountColumn];
                                    if (!lineItem) return null;
                                    const category =
                                      plMappings[lineItem] || "Uncategorized";
                                    if (category !== "Uncategorized")
                                      return null;
                                    const ytdTotal = months.reduce(
                                      (s, m) =>
                                        s +
                                        (parseFloat(
                                          String(row[m] || "0").replace(
                                            /[^0-9.-]/g,
                                            ""
                                          )
                                        ) || 0),
                                      0
                                    );
                                    return ytdTotal !== 0 ? (
                                      <tr
                                        key={idx}
                                        className="border-b border-gray-100 hover:bg-gray-50"
                                      >
                                        <td className="px-4 py-3 pl-8 text-gray-700 sticky left-0 bg-white z-10">
                                          {lineItem}
                                        </td>
                                        {months.map((month) => (
                                          <td
                                            key={month}
                                            className="px-3 py-3 text-right text-gray-700"
                                          >
                                            {formatCurrency(
                                              parseFloat(
                                                String(
                                                  row[month] || "0"
                                                ).replace(/[^0-9.-]/g, "")
                                              ) || 0
                                            )}
                                          </td>
                                        ))}
                                        <td className="px-3 py-3 text-right bg-indigo-50 font-medium text-indigo-900 sticky right-0 z-10">
                                          {formatCurrency(ytdTotal)}
                                        </td>
                                      </tr>
                                    ) : null;
                                  })}
                                <tr className="bg-indigo-600 text-white border-b-2">
                                  <td className="px-4 py-3 font-bold sticky left-0 bg-indigo-600 z-10">
                                    NET INCOME
                                  </td>
                                  {months.map((month) => {
                                    const revenue = incomeCategories.reduce(
                                      (s, cat) =>
                                        s + (monthlyData[month]?.[cat] || 0),
                                      0
                                    );
                                    const otherIncome =
                                      monthlyData[month]?.["Other Income"] || 0;
                                    const disc = discountCategories.reduce(
                                      (s, cat) =>
                                        s + (monthlyData[month]?.[cat] || 0),
                                      0
                                    );
                                    const expenses = expenseCategories.reduce(
                                      (s, cat) =>
                                        s + (monthlyData[month]?.[cat] || 0),
                                      0
                                    );
                                    const ni =
                                      revenue + otherIncome + disc - expenses;
                                    return (
                                      <td
                                        key={month}
                                        className="px-3 py-3 text-right font-bold"
                                      >
                                        {ni < 0
                                          ? `(${formatCurrency(Math.abs(ni))})`
                                          : formatCurrency(ni)}
                                      </td>
                                    );
                                  })}
                                  <td className="px-3 py-3 text-right bg-indigo-700 font-bold sticky right-0 z-10">
                                    {netIncome < 0
                                      ? `(${formatCurrency(
                                          Math.abs(netIncome)
                                        )})`
                                      : formatCurrency(netIncome)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            {activeTab === "financials" && !dashboardData.plData && (
              <div className="text-center py-8 text-gray-500">
                Please upload P&L data to view financial metrics
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
