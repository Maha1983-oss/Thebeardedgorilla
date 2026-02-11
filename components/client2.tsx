"use client";
import { useState, useEffect } from "react";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useClient2Data } from "@/lib/hooks/use-csv-data";
import { useGlobalClassifications } from "@/lib/hooks/use-global-classifications";
import {
  useCashflowTransactions,
  useAddCashflowTransaction,
  useUpdateCashflowTransaction,
  useDeleteCashflowTransaction,
  usePipelineDeals,
  useAddPipelineDeal,
  useUpdatePipelineDeal,
  useDeletePipelineDeal,
  useProjects,
  useAddProject,
  useUpdateProject,
  useDeleteProject,
  useProjectCosts,
  useAddProjectCost,
  useUpdateProjectCost,
  useDeleteProjectCost,
  useClient2Settings,
  useSaveClient2Settings,
} from "@/lib/hooks/use-client2-data";

export default function PLDashboard() {
  const [activeTab, setActiveTab] = useState("pl");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<{
    type: string;
    message: string;
  } | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [unclassifiedItems, setUnclassifiedItems] = useState<
    { name: string; category: string }[]
  >([]);
  const [showClassificationModal, setShowClassificationModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [headcount, setHeadcount] = useState(0);

  // Use React Query hook for cached data (dedicated client2 endpoint)
  const { data: csvData, isLoading, error } = useClient2Data();

  // Load global classifications
  const {
    data: globalClassificationsData,
    isLoading: isLoadingGlobalClassifications,
  } = useGlobalClassifications();

  // Load all Client2 data from database
  const { data: cashTransactionsData = [] } = useCashflowTransactions();
  const { data: projectsData = [] } = useProjects();
  const { data: projectCostsData = [] } = useProjectCosts();
  const { data: dealsData = [] } = usePipelineDeals();
  const { data: settings } = useClient2Settings();

  // Mutations
  const addCashTransaction = useAddCashflowTransaction();
  const updateCashTransaction = useUpdateCashflowTransaction();
  const deleteCashTransaction = useDeleteCashflowTransaction();
  const addProject = useAddProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const addProjectCost = useAddProjectCost();
  const updateProjectCost = useUpdateProjectCost();
  const deleteProjectCost = useDeleteProjectCost();
  const addDeal = useAddPipelineDeal();
  const updateDeal = useUpdatePipelineDeal();
  const deleteDeal = useDeletePipelineDeal();
  const saveSettings = useSaveClient2Settings();

  // Projects state - use data from database
  const [projects, setProjects] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProjectMonth, setSelectedProjectMonth] = useState("all");
  const [newProject, setNewProject] = useState({
    date: "",
    clientProject: "",
    projectNumber: "",
    valueQuoted: "",
    quotedCurrency: "USD",
    valueSGD: "",
    numberOfStudies: "",
    purchaseOrder: "",
    fieldWorkStatus: "Not Started",
    fieldWorkStartDate: "",
    fieldWorkEndDate: "",
    reportStatus: "Not Started",
    invoiceStatus: "Not Issued",
    invoiceDate: "",
  });

  // Project Costs state
  const [projectCosts, setProjectCosts] = useState([]);
  const [showProjectCostModal, setShowProjectCostModal] = useState(false);
  const [editingProjectCost, setEditingProjectCost] = useState(null);
  const [selectedCostMonth, setSelectedCostMonth] = useState("all");
  const [newProjectCost, setNewProjectCost] = useState({
    monthYear: "",
    projectName: "",
    client: "",
    market: "",
    baseAmountUSD: "",
    dataUSD: "",
    totalAmountUSD: "",
    baseAmountSGD: "",
    dataSGD: "",
    totalAmountSGD: "",
    projectRevenue: "",
    costPercentage: "",
    status: "Pending",
  });

  // Cashflow state
  const [cashTransactions, setCashTransactions] = useState<any[]>([]);
  const [showCashModal, setShowCashModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [newTransaction, setNewTransaction] = useState({
    date: "",
    description: "",
    category: "",
    type: "inflow",
    amount: "",
  });
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);
  const [selectedMonthBreakdown, setSelectedMonthBreakdown] = useState(null);

  // Sankey Diagram / Bank Transactions state - SGD
  const [bankTransactions, setBankTransactions] = useState<any[]>([]);
  const [bankTransactionsFile, setBankTransactionsFile] = useState(null);
  const [processingBankTransactions, setProcessingBankTransactions] =
    useState(false);
  const [bankTransactionsStatus, setBankTransactionsStatus] = useState<{
    type: string;
    message: string;
  } | null>(null);
  const [bankOpeningBalance, setBankOpeningBalance] = useState(0);

  // USD Account state
  const [usdTransactions, setUsdTransactions] = useState<any[]>([]);
  const [usdTransactionsFile, setUsdTransactionsFile] = useState(null);
  const [processingUsdTransactions, setProcessingUsdTransactions] =
    useState(false);
  const [usdTransactionsStatus, setUsdTransactionsStatus] = useState<{
    type: string;
    message: string;
  } | null>(null);
  const [usdOpeningBalance, setUsdOpeningBalance] = useState(0);
  const [usdOpeningBalanceSGD, setUsdOpeningBalanceSGD] = useState(0);

  // Sankey diagram account selection
  const [selectedSankeyAccount, setSelectedSankeyAccount] = useState("SGD");

  const cashflowCategories = [
    "Sales Revenue",
    "Service Revenue",
    "Other Revenue",
    "Salaries & Wages",
    "Research Costs",
    "Office Expenses",
    "Marketing & Advertising",
    "Travel",
    "Subscriptions & Software",
    "Professional Services",
    "Bank Fees",
    "Interest Expense",
    "Loan Repayment",
    "Capital Investment",
    "Tax Payment",
    "Other Expenses",
  ];
  const [collapsedSections, setCollapsedSections] = useState({
    "Total Revenue": true,
    "Total Cost of Sales": true,
    "Total Admin Cost": true,
    "Total Employment Cost": true,
    "Total Financing Cost": true,
  });

  // EBITDA Adjustments state - stores monthly amounts for each line item
  const [ebitdaAdjustments, setEbitdaAdjustments] = useState({});
  const [showAdjustmentsModal, setShowAdjustmentsModal] = useState(false);

  // Pipeline state
  const [deals, setDeals] = useState<any[]>([]);
  const [showDealModal, setShowDealModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [sortColumn, setSortColumn] = useState("clientName");
  const [sortDirection, setSortDirection] = useState("asc");
  const [newDeal, setNewDeal] = useState({
    clientName: "",
    dealName: "",
    dealValue: "",
    stage: "Lead",
    probability: "10",
    expectedCloseDate: "",
    revenueBreakdown: [], // Array of {month: '01', year: '2025', amount: ''}
  });

  const [classifications, setClassifications] = useState<
    Record<string, string>
  >({
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
  });

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
  ];

  // Auto-process data when it's available
  useEffect(() => {
    if (csvData && !dataLoaded) {
      console.log("🚀 Auto-processing CSV data...");
      processData(csvData);
    }
  }, [csvData, dataLoaded]);

  // Handle loading and error states
  useEffect(() => {
    if (isLoading) {
      setStatus({ type: "info", message: "Loading P&L data from server..." });
      setProcessing(true);
    } else if (error) {
      setStatus({
        type: "error",
        message: `Error loading data: ${error.message}`,
      });
      setProcessing(false);
    }
  }, [isLoading, error]);

  // Load transaction data from API when available
  useEffect(() => {
    if (csvData?.sgd_transactions) {
      const sgdData = csvData.sgd_transactions as any;
      console.log("🔍 SGD Data received:", sgdData);
      if (sgdData.transactions && Array.isArray(sgdData.transactions)) {
        setBankTransactions(sgdData.transactions);
        setBankOpeningBalance(sgdData.openingBalance || 0);
        console.log(
          "✅ Loaded SGD transactions from database:",
          sgdData.transactions.length,
          "transactions"
        );
        console.log("📊 SGD Opening Balance:", sgdData.openingBalance);
        console.log("📝 Sample SGD transaction:", sgdData.transactions[0]);
      }
    }
    if (csvData?.usd_transactions) {
      const usdData = csvData.usd_transactions as any;
      console.log("🔍 USD Data received:", usdData);
      if (usdData.transactions && Array.isArray(usdData.transactions)) {
        setUsdTransactions(usdData.transactions);
        setUsdOpeningBalance(usdData.openingBalance || 0);
        setUsdOpeningBalanceSGD(usdData.openingBalanceSGD || 0);
        console.log(
          "✅ Loaded USD transactions from database:",
          usdData.transactions.length,
          "transactions"
        );
        console.log("📊 USD Opening Balance:", usdData.openingBalance);
        console.log("📊 USD Opening Balance (SGD):", usdData.openingBalanceSGD);
        console.log("📝 Sample USD transaction:", usdData.transactions[0]);
      }
    }
  }, [csvData]);

  // Load Client2 data from database (with stable reference checks)
  useEffect(() => {
    if (cashTransactionsData && cashTransactionsData.length > 0) {
      setCashTransactions(cashTransactionsData);
    }
  }, [JSON.stringify(cashTransactionsData)]);

  useEffect(() => {
    if (projectsData !== undefined) {
      setProjects(projectsData);
    }
  }, [JSON.stringify(projectsData)]);

  useEffect(() => {
    if (projectCostsData !== undefined) {
      setProjectCosts(projectCostsData);
    }
  }, [JSON.stringify(projectCostsData)]);

  useEffect(() => {
    if (dealsData !== undefined) {
      setDeals(dealsData);
    }
  }, [JSON.stringify(dealsData)]);

  // Load settings from database (with stable reference check)
  useEffect(() => {
    if (settings) {
      const newOpeningBalance =
        parseFloat(settings.cashflowOpeningBalance) || 0;
      if (openingBalance !== newOpeningBalance) {
        setOpeningBalance(newOpeningBalance);
      }
      if (
        settings.ebitdaAdjustments &&
        JSON.stringify(ebitdaAdjustments) !==
          JSON.stringify(settings.ebitdaAdjustments)
      ) {
        setEbitdaAdjustments(settings.ebitdaAdjustments);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // Note: Classifications are now hardcoded in the initial state
  // No need to load from global classifications

  // Auto-save opening balance to database
  useEffect(() => {
    if (
      settings &&
      openingBalance !== parseFloat(settings.cashflowOpeningBalance)
    ) {
      const timeoutId = setTimeout(() => {
        saveSettings.mutate({ cashflowOpeningBalance: String(openingBalance) });
      }, 1000); // Debounce 1 second
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openingBalance]);

  // Auto-save EBITDA adjustments to database
  useEffect(() => {
    if (
      settings &&
      JSON.stringify(ebitdaAdjustments) !==
        JSON.stringify(settings.ebitdaAdjustments)
    ) {
      const timeoutId = setTimeout(() => {
        saveSettings.mutate({ ebitdaAdjustments });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ebitdaAdjustments]);

  // Note: Classifications are now managed globally by admin, no auto-save needed

  const processData = async (data: any) => {
    setProcessing(true);
    setStatus({ type: "info", message: "Processing P&L data..." });

    try {
      console.log("📦 CSV Data received:", data);
      console.log("📁 Has pl_client2?", !!data.pl_client2);

      // Check if P&L data exists (Client 2)
      if (!data.pl_client2) {
        setStatus({
          type: "error",
          message:
            "No P&L data available. Please contact your administrator to upload data.",
        });
        setProcessing(false);
        return;
      }

      console.log("✅ P&L data exists, processing...");
      // Process the fetched P&L data
      await handleProcess(data.pl_client2);
      setDataLoaded(true);
    } catch (error: any) {
      console.error("❌ Error in processData:", error);
      setStatus({
        type: "error",
        message: `Error processing data: ${error.message}`,
      });
      setProcessing(false);
    }
  };

  const handleProcess = async (rawPlData: any) => {
    setProcessing(true);
    setStatus({ type: "info", message: "Processing..." });

    try {
      const Papa = await import("papaparse");

      console.log("🔍 Raw P&L Data received:", rawPlData);

      // Convert the raw data to CSV format for processing
      const csvText = Papa.unparse(rawPlData);
      const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });

      console.log("📊 Parsed data:", parsed.data);
      console.log("📋 Fields:", parsed.meta.fields);

      const accountColumn = parsed.meta.fields[0];
      const allColumns = parsed.meta.fields;
      const monthColumns = allColumns.slice(1, 13);

      const monthNames = [
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
      ];

      const months = monthColumns.map((col, idx) => ({
        columnName: col,
        displayName: monthNames[idx] || col,
      }));

      // Check for Net Profit/Loss row to determine actual vs forecast
      const netProfitRow = parsed.data.find((row) => {
        const lineItem = row[accountColumn];
        if (!lineItem) return false;
        const lower = lineItem.toLowerCase().trim();
        return (
          lower === "net profit/loss" ||
          lower === "net profit" ||
          lower === "net loss" ||
          lower === "net income"
        );
      });

      const monthStatus = months.map((month) => {
        if (netProfitRow) {
          const val = netProfitRow[month.columnName];
          if (!val) return "Forecast";
          const str = String(val).trim();
          const clean = str.replace(/[$,()]/g, "").replace(/\s/g, "");
          const num = parseFloat(clean) || 0;
          const value = str.includes("(") ? -Math.abs(num) : num;
          return value !== 0 ? "ACTUAL" : "Forecast";
        }
        return "Forecast";
      });

      const plData = parsed.data.filter((row) => {
        const lineItem = row[accountColumn];
        if (!lineItem || !lineItem.trim()) return false;
        const lower = lineItem.toLowerCase();
        if (
          lower === "gross profit" ||
          lower === "net income" ||
          lower === "net profit"
        )
          return false;

        const hasData = months.some((month) => {
          const val = parseValue(row[month.columnName]);
          return val !== 0;
        });

        return hasData;
      });

      // Auto-assign categories based on predefined classifications
      // No need to check for unclassified items - they will be auto-assigned or default to "Unclassified"
      console.log("✅ Processing complete. P&L Data rows:", plData.length);
      console.log("📊 Sample P&L row:", plData[0]);
      console.log(
        "🏷️ Classifications loaded:",
        Object.keys(classifications).length,
        "mappings"
      );
      console.log("📅 Months:", months.map((m) => m.displayName).join(", "));

      setDashboardData({ plData, accountColumn, months, monthStatus });
      setStatus({
        type: "success",
        message: "Processing complete! Categories auto-assigned.",
      });
      setProcessing(false);
    } catch (error) {
      console.error("Processing error:", error);
      setProcessing(false);
      setStatus({ type: "error", message: `Error: ${error.message}` });
    }
  };

  const handleSaveClassifications = () => {
    const newClassifications = { ...classifications };
    unclassifiedItems.forEach((item) => {
      if (item.category) {
        newClassifications[item.name] = item.category;
      }
    });
    setClassifications(newClassifications);
    setShowClassificationModal(false);
    setUnclassifiedItems([]);
    setStatus({ type: "success", message: "Classifications saved!" });
  };

  const formatCurrency = (amount) => {
    const absAmount = Math.abs(amount || 0);
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(absAmount);
    return amount < 0 ? `(${formatted})` : formatted;
  };

  const parseValue = (val) => {
    if (!val) return 0;
    const str = String(val).trim();
    const clean = str.replace(/[$,()]/g, "").replace(/\s/g, "");
    const num = parseFloat(clean) || 0;
    return str.includes("(") ? -Math.abs(num) : num;
  };

  const getClassifiedData = () => {
    if (!dashboardData) {
      console.log("⚠️ No dashboardData available");
      return null;
    }

    console.log("🔄 Getting classified data...");
    console.log("📋 Account column:", dashboardData.accountColumn);
    console.log("📊 P&L Data rows:", dashboardData.plData?.length);
    console.log(
      "🏷️ Available classifications:",
      Object.keys(classifications).length
    );

    const grouped = {};
    const unclassifiedItems = [];

    dashboardData.plData.forEach((row, idx) => {
      const lineItem = row[dashboardData.accountColumn];

      // Log first few items for debugging
      if (idx < 5) {
        console.log(`📝 Row ${idx}: "${lineItem}"`);
      }

      if (lineItem && lineItem.toLowerCase().startsWith("total")) {
        return;
      }

      const category = classifications[lineItem] || "Unclassified";

      if (category === "Unclassified") {
        unclassifiedItems.push(lineItem);
      }

      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(row);
    });

    console.log("🏷️ Grouped by category:", Object.keys(grouped));
    console.log("📊 Total line items processed:", dashboardData.plData.length);
    console.log("⚠️ Unclassified items:", unclassifiedItems.slice(0, 10)); // Show first 10 unclassified

    // Log some category details
    Object.keys(grouped).forEach((cat) => {
      console.log(`  - ${cat}: ${grouped[cat].length} items`);
    });

    // Add Pipeline Revenue for forecast months
    const pipelineRow = {
      [dashboardData.accountColumn]: "Pipeline Revenue (Forecast)",
    };
    dashboardData.months.forEach((month, idx) => {
      // Only add pipeline revenue to forecast months
      if (dashboardData.monthStatus[idx] === "Forecast") {
        // Extract month name and match with deals
        const monthName = month.displayName; // e.g., "November"
        const monthIndex = [
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
        ].indexOf(monthName);

        if (monthIndex !== -1) {
          const monthNumber = String(monthIndex + 1).padStart(2, "0"); // '01', '02', etc.

          // Get current year from the P&L or assume current year
          const currentYear = new Date().getFullYear();

          // Sum up weighted revenue from all deals for this month
          let totalWeightedRevenue = 0;
          deals.forEach((deal) => {
            if (deal.revenueBreakdown && deal.revenueBreakdown.length > 0) {
              const prob = parseFloat(deal.probability) || 0;

              deal.revenueBreakdown.forEach((rev) => {
                // Check if this revenue entry matches the current month
                if (
                  rev.month === monthNumber &&
                  rev.year === String(currentYear)
                ) {
                  const amount = parseFloat(rev.amount) || 0;
                  const weightedAmount = amount * (prob / 100);
                  totalWeightedRevenue += weightedAmount;
                }
              });
            }
          });

          pipelineRow[month.columnName] = totalWeightedRevenue;
        } else {
          pipelineRow[month.columnName] = 0;
        }
      } else {
        pipelineRow[month.columnName] = 0;
      }
    });

    // Add pipeline revenue to "Other Revenue" category
    if (!grouped["Other Revenue"]) {
      grouped["Other Revenue"] = [];
    }
    grouped["Other Revenue"].push(pipelineRow);

    const categoryOrder = [
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
      "Unclassified",
    ];

    const sorted = {};
    categoryOrder.forEach((cat) => {
      if (grouped[cat]) {
        sorted[cat] = grouped[cat];
      }
    });

    Object.keys(grouped).forEach((cat) => {
      if (!sorted[cat]) {
        sorted[cat] = grouped[cat];
      }
    });

    return sorted;
  };

  const classifiedData = getClassifiedData();

  const toggleSection = (section) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Pipeline functions
  const stages = [
    "Lead",
    "Qualified",
    "Proposal",
    "Negotiation",
    "Closed Won",
    "Closed Lost",
  ];

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  const handleAddDeal = () => {
    setEditingDeal(null);
    setNewDeal({
      clientName: "",
      dealName: "",
      dealValue: "",
      stage: "Lead",
      probability: "10",
      expectedCloseDate: "",
      revenueBreakdown: [],
    });
    setShowDealModal(true);
  };

  const handleEditDeal = (deal) => {
    setEditingDeal(deal);
    // Convert old format to new format if necessary
    let revenueBreakdown = deal.revenueBreakdown || [];
    if (
      revenueBreakdown.length > 0 &&
      revenueBreakdown[0].month &&
      !revenueBreakdown[0].year
    ) {
      // Old format: {month: 'YYYY-MM', amount: ''}
      // Convert to: {month: 'MM', year: 'YYYY', amount: ''}
      revenueBreakdown = revenueBreakdown.map((rev) => {
        if (rev.month && rev.month.includes("-")) {
          const [year, month] = rev.month.split("-");
          return { month, year, amount: rev.amount };
        }
        return rev;
      });
    }
    setNewDeal({
      ...deal,
      revenueBreakdown,
    });
    setShowDealModal(true);
  };

  const handleAddRevenueEntry = () => {
    setNewDeal({
      ...newDeal,
      revenueBreakdown: [
        ...newDeal.revenueBreakdown,
        { month: "", year: "", amount: "" },
      ],
    });
  };

  const handleRemoveRevenueEntry = (index) => {
    setNewDeal({
      ...newDeal,
      revenueBreakdown: newDeal.revenueBreakdown.filter((_, i) => i !== index),
    });
  };

  const handleUpdateRevenueEntry = (index, field, value) => {
    const updated = [...newDeal.revenueBreakdown];
    updated[index][field] = value;
    setNewDeal({ ...newDeal, revenueBreakdown: updated });
  };

  const handleSaveDeal = () => {
    if (!newDeal.clientName || !newDeal.dealName || !newDeal.dealValue) {
      alert(
        "Please fill in required fields: Client Name, Deal Name, and Deal Value"
      );
      return;
    }

    // Validate revenue breakdown exists
    if (!newDeal.revenueBreakdown || newDeal.revenueBreakdown.length === 0) {
      alert(
        "Please add at least one revenue breakdown entry to specify when revenue will be received."
      );
      return;
    }

    // Validate all revenue breakdown entries are complete
    const incompleteEntry = newDeal.revenueBreakdown.find(
      (entry) =>
        !entry.month ||
        !entry.year ||
        !entry.amount ||
        parseFloat(entry.amount) <= 0
    );

    if (incompleteEntry) {
      alert(
        "Please complete all revenue breakdown entries. Each entry must have a month, year, and amount greater than zero."
      );
      return;
    }

    // Validate revenue breakdown matches deal value
    const totalBreakdown = newDeal.revenueBreakdown.reduce((sum, entry) => {
      return sum + (parseFloat(entry.amount) || 0);
    }, 0);
    const dealValue = parseFloat(newDeal.dealValue) || 0;

    if (Math.abs(totalBreakdown - dealValue) > 0.01) {
      // Allow for small rounding differences
      alert(
        `Revenue Breakdown total (${formatCurrency(
          totalBreakdown
        )}) does not match Deal Value (${formatCurrency(
          dealValue
        )}). Please adjust the amounts.`
      );
      return;
    }

    if (editingDeal) {
      updateDeal.mutate({ ...newDeal, id: editingDeal.id });
    } else {
      addDeal.mutate(newDeal);
    }
    setShowDealModal(false);
    setEditingDeal(null);
    setNewDeal({
      clientName: "",
      dealName: "",
      dealValue: "",
      stage: "Lead",
      probability: "10",
      expectedCloseDate: "",
      revenueBreakdown: [],
    });
  };

  const handleDeleteDeal = (dealId) => {
    const dealToDelete = deals.find((d) => d.id === dealId);
    if (
      dealToDelete &&
      confirm(
        `Delete "${dealToDelete.dealName}" from ${dealToDelete.clientName}?`
      )
    ) {
      deleteDeal.mutate(dealId);
      setShowDealModal(false);
    }
  };

  const getPipelineMetrics = () => {
    const activDeals = deals.filter((d) => d.stage !== "Closed Lost");
    const totalValue = activDeals.reduce(
      (sum, deal) => sum + (parseFloat(deal.dealValue) || 0),
      0
    );
    const weightedValue = activDeals.reduce((sum, deal) => {
      const value = parseFloat(deal.dealValue) || 0;
      const prob = parseFloat(deal.probability) || 0;
      return sum + (value * prob) / 100;
    }, 0);
    const wonDeals = deals.filter((d) => d.stage === "Closed Won");
    const wonValue = wonDeals.reduce(
      (sum, deal) => sum + (parseFloat(deal.dealValue) || 0),
      0
    );

    return {
      totalValue,
      weightedValue,
      wonValue,
      activDeals: activDeals.length,
      wonDeals: wonDeals.length,
    };
  };

  const getFunnelData = () => {
    const funnelStages = [
      "Lead",
      "Qualified",
      "Proposal",
      "Negotiation",
      "Closed Won",
    ];
    const stageColors = {
      Lead: "bg-gray-400",
      Qualified: "bg-blue-400",
      Proposal: "bg-purple-400",
      Negotiation: "bg-amber-400",
      "Closed Won": "bg-green-400",
    };

    return funnelStages.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      const stageValue = stageDeals.reduce(
        (sum, deal) => sum + (parseFloat(deal.dealValue) || 0),
        0
      );
      const stageWeightedValue = stageDeals.reduce((sum, deal) => {
        const value = parseFloat(deal.dealValue) || 0;
        const prob = parseFloat(deal.probability) || 0;
        return sum + (value * prob) / 100;
      }, 0);

      return {
        stage,
        count: stageDeals.length,
        value: stageValue,
        weightedValue: stageWeightedValue,
        color: stageColors[stage],
      };
    });
  };

  const getMonthlyRevenue = () => {
    const monthlyData = {};

    deals.forEach((deal) => {
      if (deal.revenueBreakdown && deal.revenueBreakdown.length > 0) {
        const prob = parseFloat(deal.probability) || 0;

        deal.revenueBreakdown.forEach((rev) => {
          let monthKey;

          // Handle both formats
          if (rev.month && rev.year) {
            monthKey = `${rev.year}-${rev.month}`;
          } else if (rev.month && rev.month.includes("-")) {
            monthKey = rev.month;
          } else {
            return;
          }

          const amount = parseFloat(rev.amount) || 0;
          const weightedAmount = amount * (prob / 100);

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { full: 0, weighted: 0 };
          }

          monthlyData[monthKey].full += amount;
          monthlyData[monthKey].weighted += weightedAmount;
        });
      }
    });

    // Convert to array and sort by date
    return Object.keys(monthlyData)
      .sort()
      .map((key) => {
        const [year, month] = key.split("-");
        const monthName = months.find((m) => m.value === month)?.label || month;

        return {
          key,
          label: `${monthName.substring(0, 3)} ${year}`,
          fullLabel: `${monthName} ${year}`,
          full: monthlyData[key].full,
          weighted: monthlyData[key].weighted,
        };
      });
  };

  const pipelineMetrics = getPipelineMetrics();
  const funnelData = getFunnelData();
  const monthlyRevenue = getMonthlyRevenue();

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortedDeals = () => {
    const sorted = [...deals].sort((a, b) => {
      let aVal, bVal;

      switch (sortColumn) {
        case "clientName":
          aVal = a.clientName.toLowerCase();
          bVal = b.clientName.toLowerCase();
          break;
        case "dealName":
          aVal = a.dealName.toLowerCase();
          bVal = b.dealName.toLowerCase();
          break;
        case "dealValue":
          aVal = parseFloat(a.dealValue) || 0;
          bVal = parseFloat(b.dealValue) || 0;
          break;
        case "stage":
          const stageOrder = [
            "Lead",
            "Qualified",
            "Proposal",
            "Negotiation",
            "Closed Won",
            "Closed Lost",
          ];
          aVal = stageOrder.indexOf(a.stage);
          bVal = stageOrder.indexOf(b.stage);
          break;
        case "probability":
          aVal = parseFloat(a.probability) || 0;
          bVal = parseFloat(b.probability) || 0;
          break;
        case "weightedValue":
          aVal =
            ((parseFloat(a.dealValue) || 0) *
              (parseFloat(a.probability) || 0)) /
            100;
          bVal =
            ((parseFloat(b.dealValue) || 0) *
              (parseFloat(b.probability) || 0)) /
            100;
          break;
        case "expectedCloseDate":
          aVal = a.expectedCloseDate || "";
          bVal = b.expectedCloseDate || "";
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const sortedDeals = getSortedDeals();

  const handleBankTransactionsUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith(".csv")) {
      setBankTransactionsFile(file);
      setBankTransactionsStatus(null);
    } else {
      setBankTransactionsStatus({
        type: "error",
        message: "Please upload a CSV file",
      });
    }
  };

  const handleUsdTransactionsUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith(".csv")) {
      setUsdTransactionsFile(file);
      setUsdTransactionsStatus(null);
    } else {
      setUsdTransactionsStatus({
        type: "error",
        message: "Please upload a CSV file",
      });
    }
  };

  const handleProcessBankTransactions = async () => {
    if (!bankTransactionsFile) {
      setBankTransactionsStatus({
        type: "error",
        message: "Please upload a bank transactions CSV file",
      });
      return;
    }

    setProcessingBankTransactions(true);
    setBankTransactionsStatus({ type: "info", message: "Reading CSV file..." });

    try {
      const Papa = await import("papaparse");
      const text = await bankTransactionsFile.text();

      setBankTransactionsStatus({
        type: "info",
        message: "Parsing CSV data...",
      });

      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });

      console.log("Parsed data:", parsed);
      console.log("Headers:", parsed.meta.fields);
      console.log("Row count:", parsed.data.length);

      if (!parsed.data || parsed.data.length === 0) {
        throw new Error("No data found in CSV file");
      }

      setBankTransactionsStatus({
        type: "info",
        message: "Detecting columns...",
      });

      // Try to detect columns - common bank statement formats
      const headers = parsed.meta.fields;
      console.log("Looking for columns in:", headers);

      // Try to find date column
      const dateColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return lower.includes("date") || lower.includes("transaction date");
      });

      // Try to find description column
      const descColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return (
          lower.includes("description") ||
          lower.includes("particulars") ||
          lower.includes("details") ||
          lower.includes("narrative")
        );
      });

      // Try to find category column
      const categoryColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return lower.includes("category");
      });

      // Try to find contact column
      const contactColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return lower === "contact" || lower.includes("contact");
      });

      // Try to find amount columns
      const amountColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return lower.includes("amount") && !lower.includes("balance");
      });

      // For bank statements: Debit = money IN (inflow), Credit = money OUT (outflow)
      const debitColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return (
          lower === "debit" ||
          (lower.includes("debit") && !lower.includes("sgd"))
        );
      });

      const creditColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return (
          lower === "credit" ||
          (lower.includes("credit") && !lower.includes("sgd"))
        );
      });

      // Find SGD equivalent columns
      const debitSGDColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return lower.includes("debit") && lower.includes("sgd");
      });

      const creditSGDColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return lower.includes("credit") && lower.includes("sgd");
      });

      console.log("Detected columns:", {
        dateColumn,
        descColumn,
        categoryColumn,
        contactColumn,
        amountColumn,
        debitColumn,
        creditColumn,
        debitSGDColumn,
        creditSGDColumn,
      });
      console.log(
        "Note: Using bank statement convention - Debit = Inflow, Credit = Outflow"
      );

      if (!dateColumn || !descColumn) {
        throw new Error(
          `Missing required columns. Found: ${headers.join(
            ", "
          )}. Need Date and Description columns.`
        );
      }

      if (!categoryColumn) {
        console.warn(
          '⚠️ No Category column found. Transactions will be marked as "Uncategorized". Add a Category column for better grouping in the Sankey diagram.'
        );
      }

      if (!contactColumn) {
        console.warn(
          "⚠️ No Contact column found. Contact names will default to transaction descriptions. Add a Contact column to see detailed payee/recipient breakdown."
        );
      }

      if (!amountColumn && !debitColumn && !creditColumn) {
        throw new Error(
          "No amount columns found. Need either Amount column or Debit/Credit columns."
        );
      }

      setBankTransactionsStatus({
        type: "info",
        message: "Processing transactions...",
      });

      // Row 2 ALWAYS contains opening balance - extract it
      let extractedOpeningBalance = null;
      let startIndex = 1; // Always skip Row 2 (first data row)

      if (parsed.data.length > 0) {
        const firstRow = parsed.data[0]; // This is Row 2 (Row 1 is headers)

        console.log("=== PROCESSING ROW 2 AS OPENING BALANCE ===");
        console.log("Row 2 full data:", firstRow);

        // Extract the opening balance amount from Row 2
        // Debit (Source) = Positive balance, Credit (Source) = Negative balance
        if (debitColumn && creditColumn) {
          const debitValue = parseFloat(
            String(firstRow[debitColumn] || "0").replace(/[^0-9.-]/g, "")
          );
          const creditValue = parseFloat(
            String(firstRow[creditColumn] || "0").replace(/[^0-9.-]/g, "")
          );

          console.log(
            "Debit (Source) column value:",
            firstRow[debitColumn],
            "=> parsed:",
            debitValue
          );
          console.log(
            "Credit (Source) column value:",
            firstRow[creditColumn],
            "=> parsed:",
            creditValue
          );

          // If Debit has value = positive balance
          if (!isNaN(debitValue) && debitValue > 0) {
            extractedOpeningBalance = debitValue; // Positive balance
            console.log(
              "✓ POSITIVE opening balance from Debit (Source):",
              extractedOpeningBalance
            );
          }
          // If Credit has value = negative balance (overdrawn)
          else if (!isNaN(creditValue) && creditValue > 0) {
            extractedOpeningBalance = -creditValue; // Negative balance
            console.log(
              "✓ NEGATIVE opening balance from Credit (Source):",
              extractedOpeningBalance
            );
          } else {
            console.log("✗ No opening balance value found in Row 2");
          }
        } else if (amountColumn) {
          const amountValue = parseFloat(
            String(firstRow[amountColumn] || "0").replace(/[^0-9.-]/g, "")
          );
          console.log(
            "Amount column value:",
            firstRow[amountColumn],
            "=> parsed:",
            amountValue
          );
          if (!isNaN(amountValue) && amountValue !== 0) {
            extractedOpeningBalance = amountValue;
            console.log(
              "✓ Opening balance from Amount column:",
              extractedOpeningBalance
            );
          }
        }

        console.log("Final opening balance:", extractedOpeningBalance);
        console.log("===========================================");
      }

      const transactions = [];
      let skipped = 0;

      for (let i = startIndex; i < parsed.data.length; i++) {
        try {
          const row = parsed.data[i];
          const dateValue = row[dateColumn];
          const descValue = row[descColumn];
          const categoryValue = categoryColumn
            ? (row[categoryColumn] || "").trim()
            : "";
          const contactValue = contactColumn
            ? (row[contactColumn] || "").trim()
            : "";

          if (!dateValue || !descValue) {
            skipped++;
            continue;
          }

          // Parse date - handle various formats
          let parsedDate;
          try {
            // Try ISO format first
            parsedDate = new Date(dateValue);
            if (isNaN(parsedDate.getTime())) {
              // Try DD/MM/YYYY format
              const parts = dateValue.split("/");
              if (parts.length === 3) {
                parsedDate = new Date(parts[2], parts[1] - 1, parts[0]);
              }
            }
            if (isNaN(parsedDate.getTime())) {
              throw new Error("Invalid date");
            }
          } catch (e) {
            console.log(`Skipping row ${i}: invalid date ${dateValue}`);
            skipped++;
            continue;
          }

          const formattedDate = parsedDate.toISOString().split("T")[0];

          // Determine amount and type
          let amount = 0;
          let type = "inflow";

          if (debitColumn && creditColumn) {
            // For BANK STATEMENTS: Debit = Inflow (money IN), Credit = Outflow (money OUT)
            const debitValue = parseFloat(
              String(row[debitColumn] || "0").replace(/[^0-9.-]/g, "")
            );
            const creditValue = parseFloat(
              String(row[creditColumn] || "0").replace(/[^0-9.-]/g, "")
            );

            if (!isNaN(debitValue) && debitValue > 0) {
              amount = Math.abs(debitValue);
              type = "inflow"; // Debit = money coming IN
            } else if (!isNaN(creditValue) && creditValue > 0) {
              amount = Math.abs(creditValue);
              type = "outflow"; // Credit = money going OUT
            } else {
              skipped++;
              continue;
            }
          } else if (amountColumn) {
            // Single amount column (positive = credit, negative = debit)
            const amountValue = parseFloat(
              String(row[amountColumn] || "0").replace(/[^0-9.-]/g, "")
            );

            if (isNaN(amountValue) || amountValue === 0) {
              skipped++;
              continue;
            }

            if (amountValue > 0) {
              amount = amountValue;
              type = "inflow";
            } else {
              amount = Math.abs(amountValue);
              type = "outflow";
            }
          } else {
            skipped++;
            continue;
          }

          transactions.push({
            id: Date.now() + Math.random(),
            date: formattedDate,
            description: String(descValue).trim(),
            category: categoryValue || "Uncategorized",
            contact: contactValue || "",
            type: type,
            amount: amount.toFixed(2),
            amountSGD: amount.toFixed(2), // For SGD account, SGD amount is same as amount
          });
        } catch (rowError) {
          console.error(`Error processing row ${i}:`, rowError);
          skipped++;
        }
      }

      console.log(
        `Processed ${transactions.length} transactions, skipped ${skipped}`
      );

      if (transactions.length === 0 && !extractedOpeningBalance) {
        throw new Error("No valid transactions found in CSV");
      }

      // Set opening balance from Row 2
      if (extractedOpeningBalance !== null) {
        setBankOpeningBalance(extractedOpeningBalance);
      } else {
        // No balance found in Row 2
        console.warn(
          "⚠️ No opening balance value found in Row 2. Please enter manually."
        );
      }

      // Set the bank transactions (replace existing)
      setBankTransactions(transactions);

      let message = `Successfully imported ${transactions.length} transactions!`;
      if (extractedOpeningBalance !== null) {
        message += ` Opening balance: ${formatCurrency(
          extractedOpeningBalance
        )}.`;
      } else {
        message += ` ⚠️ No opening balance found in Row 2 - please enter manually.`;
      }
      if (!categoryColumn) {
        message += ` ⚠️ No Category column found - transactions marked as "Uncategorized".`;
      }
      if (!contactColumn) {
        message += ` ⚠️ No Contact column found - using descriptions for contact names.`;
      }
      if (skipped > 0) {
        message += ` (${skipped} rows skipped)`;
      }

      setBankTransactionsStatus({
        type: "success",
        message: message,
      });
      setProcessingBankTransactions(false);
      setBankTransactionsFile(null);
    } catch (error) {
      console.error("Processing error:", error);
      setProcessingBankTransactions(false);
      setBankTransactionsStatus({
        type: "error",
        message: `Error: ${error.message}. Check browser console for details.`,
      });
    }
  };

  const handleProcessUsdTransactions = async () => {
    if (!usdTransactionsFile) {
      setUsdTransactionsStatus({
        type: "error",
        message: "Please upload a bank transactions CSV file",
      });
      return;
    }

    setProcessingUsdTransactions(true);
    setUsdTransactionsStatus({ type: "info", message: "Reading CSV file..." });

    try {
      const Papa = await import("papaparse");
      const text = await usdTransactionsFile.text();

      setUsdTransactionsStatus({
        type: "info",
        message: "Parsing CSV data...",
      });

      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });

      console.log("Parsed data:", parsed);
      console.log("Headers:", parsed.meta.fields);
      console.log("Row count:", parsed.data.length);

      if (!parsed.data || parsed.data.length === 0) {
        throw new Error("No data found in CSV file");
      }

      setUsdTransactionsStatus({
        type: "info",
        message: "Detecting columns...",
      });

      const headers = parsed.meta.fields;
      console.log("Looking for columns in:", headers);

      const dateColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return lower.includes("date") || lower.includes("transaction date");
      });

      const descColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return (
          lower.includes("description") ||
          lower.includes("particulars") ||
          lower.includes("details") ||
          lower.includes("narrative")
        );
      });

      const categoryColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return lower.includes("category");
      });

      const contactColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return lower === "contact" || lower.includes("contact");
      });

      const amountColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return lower.includes("amount") && !lower.includes("balance");
      });

      const debitColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return (
          lower === "debit" ||
          (lower.includes("debit") && !lower.includes("sgd"))
        );
      });

      const creditColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return (
          lower === "credit" ||
          (lower.includes("credit") && !lower.includes("sgd"))
        );
      });

      // Find SGD equivalent columns
      const debitSGDColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return lower.includes("debit") && lower.includes("sgd");
      });

      const creditSGDColumn = headers.find((h) => {
        const lower = h.toLowerCase();
        return lower.includes("credit") && lower.includes("sgd");
      });

      console.log("Detected columns:", {
        dateColumn,
        descColumn,
        categoryColumn,
        contactColumn,
        amountColumn,
        debitColumn,
        creditColumn,
        debitSGDColumn,
        creditSGDColumn,
      });
      console.log(
        "Note: Using bank statement convention - Debit = Inflow, Credit = Outflow"
      );

      if (!dateColumn || !descColumn) {
        throw new Error(
          `Missing required columns. Found: ${headers.join(
            ", "
          )}. Need Date and Description columns.`
        );
      }

      if (!categoryColumn) {
        console.warn(
          '⚠️ No Category column found. Transactions will be marked as "Uncategorized". Add a Category column for better grouping in the Sankey diagram.'
        );
      }

      if (!contactColumn) {
        console.warn(
          "⚠️ No Contact column found. Contact names will default to transaction descriptions. Add a Contact column to see detailed payee/recipient breakdown."
        );
      }

      if (!amountColumn && !debitColumn && !creditColumn) {
        throw new Error(
          "No amount columns found. Need either Amount column or Debit/Credit columns."
        );
      }

      if (!debitSGDColumn || !creditSGDColumn) {
        console.warn(
          "⚠️ SGD equivalent columns not found. Combined SGD view will not include accurate conversion rates."
        );
      }

      setUsdTransactionsStatus({
        type: "info",
        message: "Processing transactions...",
      });

      let extractedOpeningBalance = null;
      let extractedOpeningBalanceSGD = null;
      let startIndex = 1;

      if (parsed.data.length > 0) {
        const firstRow = parsed.data[0];

        console.log("=== PROCESSING ROW 2 AS OPENING BALANCE ===");
        console.log("Row 2 full data:", firstRow);

        if (debitColumn && creditColumn) {
          const debitValue = parseFloat(
            String(firstRow[debitColumn] || "0").replace(/[^0-9.-]/g, "")
          );
          const creditValue = parseFloat(
            String(firstRow[creditColumn] || "0").replace(/[^0-9.-]/g, "")
          );

          console.log(
            "Debit (Source) column value:",
            firstRow[debitColumn],
            "=> parsed:",
            debitValue
          );
          console.log(
            "Credit (Source) column value:",
            firstRow[creditColumn],
            "=> parsed:",
            creditValue
          );

          if (!isNaN(debitValue) && debitValue > 0) {
            extractedOpeningBalance = debitValue;
            console.log(
              "✓ POSITIVE opening balance from Debit (Source):",
              extractedOpeningBalance
            );
          } else if (!isNaN(creditValue) && creditValue > 0) {
            extractedOpeningBalance = -creditValue;
            console.log(
              "✓ NEGATIVE opening balance from Credit (Source):",
              extractedOpeningBalance
            );
          } else {
            console.log("✗ No opening balance value found in Row 2");
          }

          // Also get SGD equivalent
          if (debitSGDColumn && creditSGDColumn) {
            const debitSGDValue = parseFloat(
              String(firstRow[debitSGDColumn] || "0").replace(/[^0-9.-]/g, "")
            );
            const creditSGDValue = parseFloat(
              String(firstRow[creditSGDColumn] || "0").replace(/[^0-9.-]/g, "")
            );

            console.log(
              "Debit (SGD) column value:",
              firstRow[debitSGDColumn],
              "=> parsed:",
              debitSGDValue
            );
            console.log(
              "Credit (SGD) column value:",
              firstRow[creditSGDColumn],
              "=> parsed:",
              creditSGDValue
            );

            if (!isNaN(debitSGDValue) && debitSGDValue > 0) {
              extractedOpeningBalanceSGD = debitSGDValue;
              console.log(
                "✓ POSITIVE SGD opening balance from Debit (SGD):",
                extractedOpeningBalanceSGD
              );
            } else if (!isNaN(creditSGDValue) && creditSGDValue > 0) {
              extractedOpeningBalanceSGD = -creditSGDValue;
              console.log(
                "✓ NEGATIVE SGD opening balance from Credit (SGD):",
                extractedOpeningBalanceSGD
              );
            }
          }
        } else if (amountColumn) {
          const amountValue = parseFloat(
            String(firstRow[amountColumn] || "0").replace(/[^0-9.-]/g, "")
          );
          console.log(
            "Amount column value:",
            firstRow[amountColumn],
            "=> parsed:",
            amountValue
          );
          if (!isNaN(amountValue) && amountValue !== 0) {
            extractedOpeningBalance = amountValue;
            console.log(
              "✓ Opening balance from Amount column:",
              extractedOpeningBalance
            );
          }
        }

        console.log("Final opening balance (USD):", extractedOpeningBalance);
        console.log("Final opening balance (SGD):", extractedOpeningBalanceSGD);
        console.log("===========================================");
      }

      const transactions = [];
      let skipped = 0;

      for (let i = startIndex; i < parsed.data.length; i++) {
        try {
          const row = parsed.data[i];
          const dateValue = row[dateColumn];
          const descValue = row[descColumn];
          const categoryValue = categoryColumn
            ? (row[categoryColumn] || "").trim()
            : "";
          const contactValue = contactColumn
            ? (row[contactColumn] || "").trim()
            : "";

          if (!dateValue || !descValue) {
            skipped++;
            continue;
          }

          let parsedDate;
          try {
            parsedDate = new Date(dateValue);
            if (isNaN(parsedDate.getTime())) {
              const parts = dateValue.split("/");
              if (parts.length === 3) {
                parsedDate = new Date(parts[2], parts[1] - 1, parts[0]);
              }
            }
            if (isNaN(parsedDate.getTime())) {
              throw new Error("Invalid date");
            }
          } catch (e) {
            console.log(`Skipping row ${i}: invalid date ${dateValue}`);
            skipped++;
            continue;
          }

          const formattedDate = parsedDate.toISOString().split("T")[0];

          let amount = 0;
          let amountSGD = 0;
          let type = "inflow";

          if (debitColumn && creditColumn) {
            const debitValue = parseFloat(
              String(row[debitColumn] || "0").replace(/[^0-9.-]/g, "")
            );
            const creditValue = parseFloat(
              String(row[creditColumn] || "0").replace(/[^0-9.-]/g, "")
            );

            // Get SGD equivalents if available
            const debitSGDValue = debitSGDColumn
              ? parseFloat(
                  String(row[debitSGDColumn] || "0").replace(/[^0-9.-]/g, "")
                )
              : 0;
            const creditSGDValue = creditSGDColumn
              ? parseFloat(
                  String(row[creditSGDColumn] || "0").replace(/[^0-9.-]/g, "")
                )
              : 0;

            if (!isNaN(debitValue) && debitValue > 0) {
              amount = Math.abs(debitValue);
              amountSGD = Math.abs(debitSGDValue);
              type = "inflow";
            } else if (!isNaN(creditValue) && creditValue > 0) {
              amount = Math.abs(creditValue);
              amountSGD = Math.abs(creditSGDValue);
              type = "outflow";
            } else {
              skipped++;
              continue;
            }
          } else if (amountColumn) {
            const amountValue = parseFloat(
              String(row[amountColumn] || "0").replace(/[^0-9.-]/g, "")
            );

            if (isNaN(amountValue) || amountValue === 0) {
              skipped++;
              continue;
            }

            if (amountValue > 0) {
              amount = amountValue;
              type = "inflow";
            } else {
              amount = Math.abs(amountValue);
              type = "outflow";
            }

            // Try to get SGD equivalent
            if (debitSGDColumn && creditSGDColumn) {
              const debitSGDValue = parseFloat(
                String(row[debitSGDColumn] || "0").replace(/[^0-9.-]/g, "")
              );
              const creditSGDValue = parseFloat(
                String(row[creditSGDColumn] || "0").replace(/[^0-9.-]/g, "")
              );
              amountSGD =
                type === "inflow"
                  ? Math.abs(debitSGDValue)
                  : Math.abs(creditSGDValue);
            }
          } else {
            skipped++;
            continue;
          }

          transactions.push({
            id: Date.now() + Math.random(),
            date: formattedDate,
            description: String(descValue).trim(),
            category: categoryValue || "Uncategorized",
            contact: contactValue || "",
            type: type,
            amount: amount.toFixed(2),
            amountSGD: amountSGD.toFixed(2),
          });
        } catch (rowError) {
          console.error(`Error processing row ${i}:`, rowError);
          skipped++;
        }
      }

      console.log(
        `Processed ${transactions.length} transactions, skipped ${skipped}`
      );

      if (transactions.length === 0 && !extractedOpeningBalance) {
        throw new Error("No valid transactions found in CSV");
      }

      if (extractedOpeningBalance !== null) {
        setUsdOpeningBalance(extractedOpeningBalance);
      } else {
        console.warn(
          "⚠️ No opening balance value found in Row 2. Please enter manually."
        );
      }

      if (extractedOpeningBalanceSGD !== null) {
        setUsdOpeningBalanceSGD(extractedOpeningBalanceSGD);
      } else if (
        extractedOpeningBalance !== null &&
        debitSGDColumn &&
        creditSGDColumn
      ) {
        console.warn(
          "⚠️ No SGD opening balance found, but SGD columns exist. Please check data."
        );
      }

      setUsdTransactions(transactions);

      let message = `Successfully imported ${transactions.length} transactions!`;
      if (extractedOpeningBalance !== null) {
        message += ` Opening balance: ${formatCurrency(
          extractedOpeningBalance
        )}.`;
      } else {
        message += ` ⚠️ No opening balance found in Row 2 - please enter manually.`;
      }
      if (!categoryColumn) {
        message += ` ⚠️ No Category column found - transactions marked as "Uncategorized".`;
      }
      if (!contactColumn) {
        message += ` ⚠️ No Contact column found - using descriptions for contact names.`;
      }
      if (!debitSGDColumn || !creditSGDColumn) {
        message += ` ⚠️ SGD equivalent columns not found - Combined SGD view may be inaccurate.`;
      }
      if (skipped > 0) {
        message += ` (${skipped} rows skipped)`;
      }

      setUsdTransactionsStatus({
        type: "success",
        message: message,
      });
      setProcessingUsdTransactions(false);
      setUsdTransactionsFile(null);
    } catch (error) {
      console.error("Processing error:", error);
      setProcessingUsdTransactions(false);
      setUsdTransactionsStatus({
        type: "error",
        message: `Error: ${error.message}. Check browser console for details.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              ADNA Research Pte Ltd
            </h1>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("pl")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "pl"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              P&L Dashboard
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "analytics"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("cashflow")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "cashflow"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Cashflow
            </button>
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "pipeline"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Pipeline Tracker
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "projects"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab("projectcosts")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "projectcosts"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Project Costs
            </button>
            <button
              onClick={() => setActiveTab("sankey")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "sankey"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Cashflow Sankey
            </button>
          </div>
        </div>

        {activeTab === "pl" && (
          <>
            <div className="max-w-2xl mx-auto mb-6">
              <div
                className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                  csvData?.pl_client2 ? "border-green-400" : "border-gray-200"
                }`}
              >
                <h3 className="text-lg font-semibold mb-4">P&L Data Status</h3>
                {csvData?.pl_client2 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">
                        P&L Data Available
                      </p>
                      <p className="text-xs text-green-600">
                        Data loaded from server
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-800">
                        No P&L Data Available
                      </p>
                      <p className="text-xs text-yellow-600">
                        Please contact your administrator to upload data
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 mt-4">
                <h3 className="text-lg font-semibold mb-4">Headcount</h3>
                <input
                  type="number"
                  value={headcount}
                  onChange={(e) => setHeadcount(Number(e.target.value))}
                  placeholder="Enter total headcount"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {status && (
              <div
                className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${
                  status.type === "success"
                    ? "bg-green-50"
                    : status.type === "error"
                    ? "bg-red-50"
                    : "bg-blue-50"
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

            <button
              onClick={() => csvData && processData(csvData)}
              disabled={processing || !csvData?.pl_client2}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 mb-6"
            >
              {processing ? "Processing..." : "Process P&L Data"}
            </button>

            {/* Classification modal removed - categories are now auto-assigned */}

            {classifiedData && (
              <>
                <div className="max-w-4xl mx-auto mb-6">
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-2 border border-blue-200 h-16 flex flex-col justify-between">
                      <h3 className="text-[10px] font-semibold text-blue-700">
                        YTD Qual Revenue
                      </h3>
                      <p className="text-base font-bold text-blue-900">
                        {(() => {
                          if (classifiedData["Qual Revenue"]) {
                            const total = classifiedData["Qual Revenue"].reduce(
                              (sum, row) =>
                                sum +
                                dashboardData.months.reduce(
                                  (monthSum, month) =>
                                    monthSum +
                                    parseValue(row[month.columnName]),
                                  0
                                ),
                              0
                            );
                            return formatCurrency(total);
                          }
                          return "$0.00";
                        })()}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-2 border border-purple-200 h-16 flex flex-col justify-between">
                      <h3 className="text-[10px] font-semibold text-purple-700">
                        YTD Quant Revenue
                      </h3>
                      <p className="text-base font-bold text-purple-900">
                        {(() => {
                          if (classifiedData["Quant Revenue"]) {
                            const total = classifiedData[
                              "Quant Revenue"
                            ].reduce(
                              (sum, row) =>
                                sum +
                                dashboardData.months.reduce(
                                  (monthSum, month) =>
                                    monthSum +
                                    parseValue(row[month.columnName]),
                                  0
                                ),
                              0
                            );
                            return formatCurrency(total);
                          }
                          return "$0.00";
                        })()}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-2 border border-green-200 h-16 flex flex-col justify-between">
                      <h3 className="text-[10px] font-semibold text-green-700">
                        Revenue per HC
                      </h3>
                      <p className="text-base font-bold text-green-900">
                        {(() => {
                          if (headcount > 0) {
                            const revenueCategories = [
                              "Other Revenue",
                              "Qual Revenue",
                              "Quant Revenue",
                            ];
                            const totalRevenue = revenueCategories.reduce(
                              (sum, cat) => {
                                if (classifiedData[cat]) {
                                  return (
                                    sum +
                                    classifiedData[cat].reduce(
                                      (catSum, row) =>
                                        catSum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        ),
                                      0
                                    )
                                  );
                                }
                                return sum;
                              },
                              0
                            );
                            return formatCurrency(totalRevenue / headcount);
                          }
                          return "-";
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow p-2 border border-amber-200 h-16 flex flex-col justify-between">
                      <h3 className="text-[10px] font-semibold text-amber-700">
                        GP per HC
                      </h3>
                      <p className="text-base font-bold text-amber-900">
                        {(() => {
                          if (headcount > 0) {
                            const revenueCategories = [
                              "Other Revenue",
                              "Qual Revenue",
                              "Quant Revenue",
                            ];
                            const totalRevenue = revenueCategories.reduce(
                              (sum, cat) => {
                                if (classifiedData[cat]) {
                                  return (
                                    sum +
                                    classifiedData[cat].reduce(
                                      (catSum, row) =>
                                        catSum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        ),
                                      0
                                    )
                                  );
                                }
                                return sum;
                              },
                              0
                            );

                            const costCategories = Object.keys(
                              classifiedData
                            ).filter((cat) => cat.startsWith("Cost of Sales"));
                            const totalCostOfSales = costCategories.reduce(
                              (sum, cat) => {
                                return (
                                  sum +
                                  classifiedData[cat].reduce(
                                    (catSum, row) =>
                                      catSum +
                                      dashboardData.months.reduce(
                                        (monthSum, month) =>
                                          monthSum +
                                          parseValue(row[month.columnName]),
                                        0
                                      ),
                                    0
                                  )
                                );
                              },
                              0
                            );

                            const grossProfit = totalRevenue - totalCostOfSales;
                            return formatCurrency(grossProfit / headcount);
                          }
                          return "-";
                        })()}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg shadow p-2 border border-rose-200 h-16 flex flex-col justify-between">
                      <h3 className="text-[10px] font-semibold text-rose-700">
                        Employment Cost per HC
                      </h3>
                      <p className="text-base font-bold text-rose-900">
                        {(() => {
                          if (
                            headcount > 0 &&
                            classifiedData["Employment Cost"]
                          ) {
                            const totalEmployment = classifiedData[
                              "Employment Cost"
                            ].reduce(
                              (sum, row) =>
                                sum +
                                dashboardData.months.reduce(
                                  (monthSum, month) =>
                                    monthSum +
                                    parseValue(row[month.columnName]),
                                  0
                                ),
                              0
                            );
                            return formatCurrency(totalEmployment / headcount);
                          }
                          return "-";
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg shadow p-2 border border-teal-200 h-16 flex flex-col justify-between">
                      <h3 className="text-[10px] font-semibold text-teal-700">
                        YTD Gross Profit
                      </h3>
                      <p className="text-base font-bold text-teal-900">
                        {(() => {
                          const revenueCategories = [
                            "Other Revenue",
                            "Qual Revenue",
                            "Quant Revenue",
                          ];
                          const totalRevenue = revenueCategories.reduce(
                            (sum, cat) => {
                              if (classifiedData[cat]) {
                                return (
                                  sum +
                                  classifiedData[cat].reduce(
                                    (catSum, row) =>
                                      catSum +
                                      dashboardData.months.reduce(
                                        (monthSum, month) =>
                                          monthSum +
                                          parseValue(row[month.columnName]),
                                        0
                                      ),
                                    0
                                  )
                                );
                              }
                              return sum;
                            },
                            0
                          );

                          const costCategories = Object.keys(
                            classifiedData
                          ).filter((cat) => cat.startsWith("Cost of Sales"));
                          const totalCostOfSales = costCategories.reduce(
                            (sum, cat) => {
                              return (
                                sum +
                                classifiedData[cat].reduce(
                                  (catSum, row) =>
                                    catSum +
                                    dashboardData.months.reduce(
                                      (monthSum, month) =>
                                        monthSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    ),
                                  0
                                )
                              );
                            },
                            0
                          );

                          const grossProfit = totalRevenue - totalCostOfSales;
                          const gpPercentage =
                            totalRevenue !== 0
                              ? ((grossProfit / totalRevenue) * 100).toFixed(1)
                              : "0.0";
                          return `${formatCurrency(
                            grossProfit
                          )} | ${gpPercentage}%`;
                        })()}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg shadow p-2 border border-emerald-200 h-16 flex flex-col justify-between">
                      <h3 className="text-[10px] font-semibold text-emerald-700">
                        YTD Net Profit
                      </h3>
                      <p className="text-base font-bold text-emerald-900">
                        {(() => {
                          const revenueCategories = [
                            "Other Revenue",
                            "Qual Revenue",
                            "Quant Revenue",
                          ];
                          const totalRevenue = revenueCategories.reduce(
                            (sum, cat) => {
                              if (classifiedData[cat]) {
                                return (
                                  sum +
                                  classifiedData[cat].reduce(
                                    (catSum, row) =>
                                      catSum +
                                      dashboardData.months.reduce(
                                        (monthSum, month) =>
                                          monthSum +
                                          parseValue(row[month.columnName]),
                                        0
                                      ),
                                    0
                                  )
                                );
                              }
                              return sum;
                            },
                            0
                          );

                          const costCategories = Object.keys(
                            classifiedData
                          ).filter((cat) => cat.startsWith("Cost of Sales"));
                          const totalCostOfSales = costCategories.reduce(
                            (sum, cat) => {
                              return (
                                sum +
                                classifiedData[cat].reduce(
                                  (catSum, row) =>
                                    catSum +
                                    dashboardData.months.reduce(
                                      (monthSum, month) =>
                                        monthSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    ),
                                  0
                                )
                              );
                            },
                            0
                          );

                          const grossProfit = totalRevenue - totalCostOfSales;

                          const opexCategories = [
                            "Admin Cost",
                            "Employment Cost",
                            "Financing Cost",
                          ];
                          const totalOpex = opexCategories.reduce(
                            (sum, cat) => {
                              if (classifiedData[cat]) {
                                return (
                                  sum +
                                  classifiedData[cat].reduce(
                                    (catSum, row) =>
                                      catSum +
                                      dashboardData.months.reduce(
                                        (monthSum, month) =>
                                          monthSum +
                                          parseValue(row[month.columnName]),
                                        0
                                      ),
                                    0
                                  )
                                );
                              }
                              return sum;
                            },
                            0
                          );

                          const netProfit = grossProfit - totalOpex;
                          const npPercentage =
                            totalRevenue !== 0
                              ? ((netProfit / totalRevenue) * 100).toFixed(1)
                              : "0.0";
                          return `${formatCurrency(
                            netProfit
                          )} | ${npPercentage}%`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">
                      Profit & Loss Statement (Classified)
                    </h2>
                    <button
                      onClick={() => setShowAdjustmentsModal(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm"
                    >
                      ⚙️ Manage EBITDA Adjustments
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b">
                          <th className="px-4 py-3 text-left text-sm font-semibold sticky left-0 bg-gray-100 z-20"></th>
                          {dashboardData.months.map((month, idx) => (
                            <th
                              key={month.columnName}
                              className="px-4 py-3 text-right text-sm font-semibold min-w-[80px]"
                            >
                              <div>{month.displayName}</div>
                              <div className="text-xs font-normal text-gray-600">
                                ({dashboardData.monthStatus[idx]})
                              </div>
                            </th>
                          ))}
                          <th className="px-4 py-3 text-right text-sm font-semibold bg-indigo-100 min-w-[80px]">
                            YTD Total
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold bg-indigo-100 min-w-[80px]">
                            GP %
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          className="bg-indigo-100 font-bold border-b-2 cursor-pointer hover:bg-indigo-200"
                          onClick={() => toggleSection("Total Revenue")}
                        >
                          <td className="px-4 py-3 text-sm sticky left-0 bg-indigo-100 z-10">
                            {collapsedSections["Total Revenue"] ? (
                              <ChevronRight className="w-4 h-4 inline mr-2" />
                            ) : (
                              <ChevronDown className="w-4 h-4 inline mr-2" />
                            )}
                            Total Revenue
                          </td>
                          {dashboardData.months.map((month) => {
                            const revenueCategories = [
                              "Other Revenue",
                              "Qual Revenue",
                              "Quant Revenue",
                            ];
                            const revenue = revenueCategories.reduce(
                              (sum, cat) => {
                                if (classifiedData[cat]) {
                                  return (
                                    sum +
                                    classifiedData[cat].reduce(
                                      (catSum, row) =>
                                        catSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    )
                                  );
                                }
                                return sum;
                              },
                              0
                            );

                            return (
                              <td
                                key={month.columnName}
                                className="px-4 py-3 text-right text-sm"
                              >
                                <span
                                  className={revenue < 0 ? "text-red-600" : ""}
                                >
                                  {formatCurrency(revenue)}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right text-sm bg-indigo-200 sticky right-0 z-10">
                            <span
                              className={(() => {
                                const revenueCategories = [
                                  "Other Revenue",
                                  "Qual Revenue",
                                  "Quant Revenue",
                                ];
                                const totalRevenue = revenueCategories.reduce(
                                  (sum, cat) => {
                                    if (classifiedData[cat]) {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            dashboardData.months.reduce(
                                              (monthSum, month) =>
                                                monthSum +
                                                parseValue(
                                                  row[month.columnName]
                                                ),
                                              0
                                            ),
                                          0
                                        )
                                      );
                                    }
                                    return sum;
                                  },
                                  0
                                );
                                return totalRevenue < 0 ? "text-red-600" : "";
                              })()}
                            >
                              {formatCurrency(
                                (() => {
                                  const revenueCategories = [
                                    "Other Revenue",
                                    "Qual Revenue",
                                    "Quant Revenue",
                                  ];
                                  return revenueCategories.reduce(
                                    (sum, cat) => {
                                      if (classifiedData[cat]) {
                                        return (
                                          sum +
                                          classifiedData[cat].reduce(
                                            (catSum, row) =>
                                              catSum +
                                              dashboardData.months.reduce(
                                                (monthSum, month) =>
                                                  monthSum +
                                                  parseValue(
                                                    row[month.columnName]
                                                  ),
                                                0
                                              ),
                                            0
                                          )
                                        );
                                      }
                                      return sum;
                                    },
                                    0
                                  );
                                })()
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm bg-indigo-200"></td>
                        </tr>

                        {!collapsedSections["Total Revenue"] &&
                          [
                            "Other Revenue",
                            "Qual Revenue",
                            "Quant Revenue",
                          ].map((category) => {
                            if (!classifiedData[category]) return null;
                            return classifiedData[category].map((row, idx) => {
                              const lineItem = row[dashboardData.accountColumn];
                              const ytdTotal = dashboardData.months.reduce(
                                (sum, month) =>
                                  sum + parseValue(row[month.columnName]),
                                0
                              );

                              const revenueCategories = [
                                "Other Revenue",
                                "Qual Revenue",
                                "Quant Revenue",
                              ];
                              const totalRevenue = revenueCategories.reduce(
                                (sum, cat) => {
                                  if (classifiedData[cat]) {
                                    return (
                                      sum +
                                      classifiedData[cat].reduce(
                                        (catSum, revRow) =>
                                          catSum +
                                          dashboardData.months.reduce(
                                            (monthSum, month) =>
                                              monthSum +
                                              parseValue(
                                                revRow[month.columnName]
                                              ),
                                            0
                                          ),
                                        0
                                      )
                                    );
                                  }
                                  return sum;
                                },
                                0
                              );
                              const revenuePercentage =
                                totalRevenue !== 0
                                  ? `${(
                                      (ytdTotal / totalRevenue) *
                                      100
                                    ).toFixed(1)}%`
                                  : "";

                              return (
                                <tr
                                  key={`${category}-${idx}`}
                                  className="border-b hover:bg-gray-50"
                                >
                                  <td className="px-4 py-3 text-sm pl-8 sticky left-0 bg-white z-10">
                                    {lineItem}
                                    {(() => {
                                      const adjustments =
                                        ebitdaAdjustments[lineItem];
                                      if (
                                        adjustments &&
                                        Object.values(adjustments).some(
                                          (val) => parseFloat(val) > 0
                                        )
                                      ) {
                                        return (
                                          <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                                            ADJ
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </td>
                                  {dashboardData.months.map((month) => {
                                    const value = parseValue(
                                      row[month.columnName]
                                    );
                                    return (
                                      <td
                                        key={month.columnName}
                                        className="px-4 py-3 text-right text-sm"
                                      >
                                        <span
                                          className={
                                            value < 0 ? "text-red-600" : ""
                                          }
                                        >
                                          {formatCurrency(value)}
                                        </span>
                                      </td>
                                    );
                                  })}
                                  <td className="px-4 py-3 text-right text-sm font-semibold bg-indigo-50 sticky right-0 z-10">
                                    <span
                                      className={
                                        ytdTotal < 0 ? "text-red-600" : ""
                                      }
                                    >
                                      {formatCurrency(ytdTotal)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm bg-indigo-50">
                                    <span>{revenuePercentage}</span>
                                  </td>
                                </tr>
                              );
                            });
                          })}

                        <tr
                          className="bg-orange-50 font-bold border-b-2 cursor-pointer hover:bg-orange-100"
                          onClick={() => toggleSection("Total Cost of Sales")}
                        >
                          <td className="px-4 py-3 text-sm sticky left-0 bg-orange-50 z-10">
                            {collapsedSections["Total Cost of Sales"] ? (
                              <ChevronRight className="w-4 h-4 inline mr-2" />
                            ) : (
                              <ChevronDown className="w-4 h-4 inline mr-2" />
                            )}
                            Total Cost of Sales
                          </td>
                          {dashboardData.months.map((month) => {
                            const costCategories = Object.keys(
                              classifiedData
                            ).filter((cat) => cat.startsWith("Cost of Sales"));
                            const costOfSales = costCategories.reduce(
                              (sum, cat) => {
                                return (
                                  sum +
                                  classifiedData[cat].reduce(
                                    (catSum, row) =>
                                      catSum +
                                      parseValue(row[month.columnName]),
                                    0
                                  )
                                );
                              },
                              0
                            );

                            return (
                              <td
                                key={month.columnName}
                                className="px-4 py-3 text-right text-sm"
                              >
                                <span
                                  className={
                                    costOfSales < 0 ? "text-red-600" : ""
                                  }
                                >
                                  {formatCurrency(costOfSales)}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right text-sm bg-orange-100 sticky right-0 z-10">
                            <span
                              className={(() => {
                                const costCategories = Object.keys(
                                  classifiedData
                                ).filter((cat) =>
                                  cat.startsWith("Cost of Sales")
                                );
                                const totalCostOfSales = costCategories.reduce(
                                  (sum, cat) => {
                                    return (
                                      sum +
                                      classifiedData[cat].reduce(
                                        (catSum, row) =>
                                          catSum +
                                          dashboardData.months.reduce(
                                            (monthSum, month) =>
                                              monthSum +
                                              parseValue(row[month.columnName]),
                                            0
                                          ),
                                        0
                                      )
                                    );
                                  },
                                  0
                                );
                                return totalCostOfSales < 0
                                  ? "text-red-600"
                                  : "";
                              })()}
                            >
                              {formatCurrency(
                                (() => {
                                  const costCategories = Object.keys(
                                    classifiedData
                                  ).filter((cat) =>
                                    cat.startsWith("Cost of Sales")
                                  );
                                  return costCategories.reduce((sum, cat) => {
                                    return (
                                      sum +
                                      classifiedData[cat].reduce(
                                        (catSum, row) =>
                                          catSum +
                                          dashboardData.months.reduce(
                                            (monthSum, month) =>
                                              monthSum +
                                              parseValue(row[month.columnName]),
                                            0
                                          ),
                                        0
                                      )
                                    );
                                  }, 0);
                                })()
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm bg-orange-100"></td>
                        </tr>

                        {!collapsedSections["Total Cost of Sales"] &&
                          Object.keys(classifiedData)
                            .filter((cat) => cat.startsWith("Cost of Sales"))
                            .map((category) => {
                              return classifiedData[category].map(
                                (row, idx) => {
                                  const lineItem =
                                    row[dashboardData.accountColumn];
                                  const ytdTotal = dashboardData.months.reduce(
                                    (sum, month) =>
                                      sum + parseValue(row[month.columnName]),
                                    0
                                  );

                                  let gpPercentage = "";
                                  if (
                                    lineItem === "Research Costs (Qual)" &&
                                    classifiedData["Qual Revenue"]
                                  ) {
                                    const qualRevenue = classifiedData[
                                      "Qual Revenue"
                                    ].reduce(
                                      (sum, revRow) =>
                                        sum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(
                                              revRow[month.columnName]
                                            ),
                                          0
                                        ),
                                      0
                                    );
                                    if (qualRevenue !== 0) {
                                      gpPercentage = `${(
                                        (ytdTotal / qualRevenue) *
                                        100
                                      ).toFixed(1)}%`;
                                    }
                                  } else if (
                                    lineItem === "Research Costs (Quant)" &&
                                    classifiedData["Quant Revenue"]
                                  ) {
                                    const quantRevenue = classifiedData[
                                      "Quant Revenue"
                                    ].reduce(
                                      (sum, revRow) =>
                                        sum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(
                                              revRow[month.columnName]
                                            ),
                                          0
                                        ),
                                      0
                                    );
                                    if (quantRevenue !== 0) {
                                      gpPercentage = `${(
                                        (ytdTotal / quantRevenue) *
                                        100
                                      ).toFixed(1)}%`;
                                    }
                                  }

                                  return (
                                    <tr
                                      key={`${category}-${idx}`}
                                      className="border-b hover:bg-gray-50"
                                    >
                                      <td className="px-4 py-3 text-sm pl-8 sticky left-0 bg-white z-10">
                                        {lineItem}
                                      </td>
                                      {dashboardData.months.map((month) => {
                                        const value = parseValue(
                                          row[month.columnName]
                                        );
                                        return (
                                          <td
                                            key={month.columnName}
                                            className="px-4 py-3 text-right text-sm"
                                          >
                                            <span
                                              className={
                                                value < 0 ? "text-red-600" : ""
                                              }
                                            >
                                              {formatCurrency(value)}
                                            </span>
                                          </td>
                                        );
                                      })}
                                      <td className="px-4 py-3 text-right text-sm font-semibold bg-indigo-50 sticky right-0 z-10">
                                        <span
                                          className={
                                            ytdTotal < 0 ? "text-red-600" : ""
                                          }
                                        >
                                          {formatCurrency(ytdTotal)}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-right text-sm bg-indigo-50">
                                        <span>{gpPercentage}</span>
                                      </td>
                                    </tr>
                                  );
                                }
                              );
                            })}

                        <tr className="bg-blue-100 font-bold border-b-2">
                          <td className="px-4 py-3 text-sm sticky left-0 bg-blue-100 z-10">
                            Gross Profit
                          </td>
                          {dashboardData.months.map((month) => {
                            const revenueCategories = [
                              "Other Revenue",
                              "Qual Revenue",
                              "Quant Revenue",
                            ];
                            const revenue = revenueCategories.reduce(
                              (sum, cat) => {
                                if (classifiedData[cat]) {
                                  return (
                                    sum +
                                    classifiedData[cat].reduce(
                                      (catSum, row) =>
                                        catSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    )
                                  );
                                }
                                return sum;
                              },
                              0
                            );

                            const costCategories = Object.keys(
                              classifiedData
                            ).filter((cat) => cat.startsWith("Cost of Sales"));
                            const costOfSales = costCategories.reduce(
                              (sum, cat) => {
                                return (
                                  sum +
                                  classifiedData[cat].reduce(
                                    (catSum, row) =>
                                      catSum +
                                      parseValue(row[month.columnName]),
                                    0
                                  )
                                );
                              },
                              0
                            );

                            const gp = revenue - costOfSales;
                            return (
                              <td
                                key={month.columnName}
                                className="px-4 py-3 text-right text-sm"
                              >
                                <span className={gp < 0 ? "text-red-600" : ""}>
                                  {formatCurrency(gp)}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right text-sm bg-blue-200 sticky right-0 z-10">
                            <span
                              className={(() => {
                                const revenueCategories = [
                                  "Other Revenue",
                                  "Qual Revenue",
                                  "Quant Revenue",
                                ];
                                const totalRevenue = revenueCategories.reduce(
                                  (sum, cat) => {
                                    if (classifiedData[cat]) {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            dashboardData.months.reduce(
                                              (monthSum, month) =>
                                                monthSum +
                                                parseValue(
                                                  row[month.columnName]
                                                ),
                                              0
                                            ),
                                          0
                                        )
                                      );
                                    }
                                    return sum;
                                  },
                                  0
                                );

                                const costCategories = Object.keys(
                                  classifiedData
                                ).filter((cat) =>
                                  cat.startsWith("Cost of Sales")
                                );
                                const totalCostOfSales = costCategories.reduce(
                                  (sum, cat) => {
                                    return (
                                      sum +
                                      classifiedData[cat].reduce(
                                        (catSum, row) =>
                                          catSum +
                                          dashboardData.months.reduce(
                                            (monthSum, month) =>
                                              monthSum +
                                              parseValue(row[month.columnName]),
                                            0
                                          ),
                                        0
                                      )
                                    );
                                  },
                                  0
                                );

                                const gpTotal = totalRevenue - totalCostOfSales;
                                return gpTotal < 0 ? "text-red-600" : "";
                              })()}
                            >
                              {formatCurrency(
                                (() => {
                                  const revenueCategories = [
                                    "Other Revenue",
                                    "Qual Revenue",
                                    "Quant Revenue",
                                  ];
                                  const totalRevenue = revenueCategories.reduce(
                                    (sum, cat) => {
                                      if (classifiedData[cat]) {
                                        return (
                                          sum +
                                          classifiedData[cat].reduce(
                                            (catSum, row) =>
                                              catSum +
                                              dashboardData.months.reduce(
                                                (monthSum, month) =>
                                                  monthSum +
                                                  parseValue(
                                                    row[month.columnName]
                                                  ),
                                                0
                                              ),
                                            0
                                          )
                                        );
                                      }
                                      return sum;
                                    },
                                    0
                                  );

                                  const costCategories = Object.keys(
                                    classifiedData
                                  ).filter((cat) =>
                                    cat.startsWith("Cost of Sales")
                                  );
                                  const totalCostOfSales =
                                    costCategories.reduce((sum, cat) => {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            dashboardData.months.reduce(
                                              (monthSum, month) =>
                                                monthSum +
                                                parseValue(
                                                  row[month.columnName]
                                                ),
                                              0
                                            ),
                                          0
                                        )
                                      );
                                    }, 0);

                                  return totalRevenue - totalCostOfSales;
                                })()
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm bg-blue-200 font-bold">
                            <span
                              className={(() => {
                                const revenueCategories = [
                                  "Other Revenue",
                                  "Qual Revenue",
                                  "Quant Revenue",
                                ];
                                const totalRevenue = revenueCategories.reduce(
                                  (sum, cat) => {
                                    if (classifiedData[cat]) {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            dashboardData.months.reduce(
                                              (monthSum, month) =>
                                                monthSum +
                                                parseValue(
                                                  row[month.columnName]
                                                ),
                                              0
                                            ),
                                          0
                                        )
                                      );
                                    }
                                    return sum;
                                  },
                                  0
                                );

                                const costCategories = Object.keys(
                                  classifiedData
                                ).filter((cat) =>
                                  cat.startsWith("Cost of Sales")
                                );
                                const totalCostOfSales = costCategories.reduce(
                                  (sum, cat) => {
                                    return (
                                      sum +
                                      classifiedData[cat].reduce(
                                        (catSum, row) =>
                                          catSum +
                                          dashboardData.months.reduce(
                                            (monthSum, month) =>
                                              monthSum +
                                              parseValue(row[month.columnName]),
                                            0
                                          ),
                                        0
                                      )
                                    );
                                  },
                                  0
                                );

                                const gpTotal = totalRevenue - totalCostOfSales;
                                const percentage =
                                  totalRevenue !== 0
                                    ? (gpTotal / totalRevenue) * 100
                                    : 0;
                                return gpTotal < 0 ? "text-red-600" : "";
                              })()}
                            >
                              {(() => {
                                const revenueCategories = [
                                  "Other Revenue",
                                  "Qual Revenue",
                                  "Quant Revenue",
                                ];
                                const totalRevenue = revenueCategories.reduce(
                                  (sum, cat) => {
                                    if (classifiedData[cat]) {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            dashboardData.months.reduce(
                                              (monthSum, month) =>
                                                monthSum +
                                                parseValue(
                                                  row[month.columnName]
                                                ),
                                              0
                                            ),
                                          0
                                        )
                                      );
                                    }
                                    return sum;
                                  },
                                  0
                                );

                                const costCategories = Object.keys(
                                  classifiedData
                                ).filter((cat) =>
                                  cat.startsWith("Cost of Sales")
                                );
                                const totalCostOfSales = costCategories.reduce(
                                  (sum, cat) => {
                                    return (
                                      sum +
                                      classifiedData[cat].reduce(
                                        (catSum, row) =>
                                          catSum +
                                          dashboardData.months.reduce(
                                            (monthSum, month) =>
                                              monthSum +
                                              parseValue(row[month.columnName]),
                                            0
                                          ),
                                        0
                                      )
                                    );
                                  },
                                  0
                                );

                                const gpTotal = totalRevenue - totalCostOfSales;
                                const percentage =
                                  totalRevenue !== 0
                                    ? (gpTotal / totalRevenue) * 100
                                    : 0;
                                return `${percentage.toFixed(1)}%`;
                              })()}
                            </span>
                          </td>
                        </tr>

                        {classifiedData["Admin Cost"] && (
                          <>
                            <tr
                              className="bg-purple-50 font-bold border-b-2 cursor-pointer hover:bg-purple-100"
                              onClick={() => toggleSection("Total Admin Cost")}
                            >
                              <td className="px-4 py-3 text-sm sticky left-0 bg-purple-50 z-10">
                                {collapsedSections["Total Admin Cost"] ? (
                                  <ChevronRight className="w-4 h-4 inline mr-2" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 inline mr-2" />
                                )}
                                Total Admin Cost
                              </td>
                              {dashboardData.months.map((month) => {
                                const total = classifiedData[
                                  "Admin Cost"
                                ].reduce(
                                  (sum, row) =>
                                    sum + parseValue(row[month.columnName]),
                                  0
                                );
                                return (
                                  <td
                                    key={month.columnName}
                                    className="px-4 py-3 text-right text-sm"
                                  >
                                    <span
                                      className={
                                        total < 0 ? "text-red-600" : ""
                                      }
                                    >
                                      {formatCurrency(total)}
                                    </span>
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3 text-right text-sm bg-purple-100 sticky right-0 z-10">
                                <span
                                  className={(() => {
                                    const total = classifiedData[
                                      "Admin Cost"
                                    ].reduce((sum, row) => {
                                      return (
                                        sum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        )
                                      );
                                    }, 0);
                                    return total < 0 ? "text-red-600" : "";
                                  })()}
                                >
                                  {formatCurrency(
                                    classifiedData["Admin Cost"].reduce(
                                      (sum, row) => {
                                        return (
                                          sum +
                                          dashboardData.months.reduce(
                                            (monthSum, month) =>
                                              monthSum +
                                              parseValue(row[month.columnName]),
                                            0
                                          )
                                        );
                                      },
                                      0
                                    )
                                  )}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-sm bg-purple-100"></td>
                            </tr>

                            {!collapsedSections["Total Admin Cost"] &&
                              classifiedData["Admin Cost"].map((row, idx) => {
                                const lineItem =
                                  row[dashboardData.accountColumn];
                                const ytdTotal = dashboardData.months.reduce(
                                  (sum, month) =>
                                    sum + parseValue(row[month.columnName]),
                                  0
                                );

                                return (
                                  <tr
                                    key={`admin-${idx}`}
                                    className="border-b hover:bg-gray-50"
                                  >
                                    <td className="px-4 py-3 text-sm pl-8 sticky left-0 bg-white z-10">
                                      {lineItem}
                                      {(() => {
                                        const adjustments =
                                          ebitdaAdjustments[lineItem];
                                        if (
                                          adjustments &&
                                          Object.values(adjustments).some(
                                            (val) => parseFloat(val) > 0
                                          )
                                        ) {
                                          return (
                                            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                                              ADJ
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </td>
                                    {dashboardData.months.map((month) => {
                                      const value = parseValue(
                                        row[month.columnName]
                                      );
                                      return (
                                        <td
                                          key={month.columnName}
                                          className="px-4 py-3 text-right text-sm"
                                        >
                                          <span
                                            className={
                                              value < 0 ? "text-red-600" : ""
                                            }
                                          >
                                            {formatCurrency(value)}
                                          </span>
                                        </td>
                                      );
                                    })}
                                    <td className="px-4 py-3 text-right text-sm font-semibold bg-indigo-50 sticky right-0 z-10">
                                      <span
                                        className={
                                          ytdTotal < 0 ? "text-red-600" : ""
                                        }
                                      >
                                        {formatCurrency(ytdTotal)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm bg-indigo-50"></td>
                                  </tr>
                                );
                              })}
                          </>
                        )}

                        {classifiedData["Employment Cost"] && (
                          <>
                            <tr
                              className="bg-purple-50 font-bold border-b-2 cursor-pointer hover:bg-purple-100"
                              onClick={() =>
                                toggleSection("Total Employment Cost")
                              }
                            >
                              <td className="px-4 py-3 text-sm sticky left-0 bg-purple-50 z-10">
                                {collapsedSections["Total Employment Cost"] ? (
                                  <ChevronRight className="w-4 h-4 inline mr-2" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 inline mr-2" />
                                )}
                                Total Employment Cost
                              </td>
                              {dashboardData.months.map((month) => {
                                const total = classifiedData[
                                  "Employment Cost"
                                ].reduce(
                                  (sum, row) =>
                                    sum + parseValue(row[month.columnName]),
                                  0
                                );
                                return (
                                  <td
                                    key={month.columnName}
                                    className="px-4 py-3 text-right text-sm"
                                  >
                                    <span
                                      className={
                                        total < 0 ? "text-red-600" : ""
                                      }
                                    >
                                      {formatCurrency(total)}
                                    </span>
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3 text-right text-sm bg-purple-100 sticky right-0 z-10">
                                <span
                                  className={(() => {
                                    const total = classifiedData[
                                      "Employment Cost"
                                    ].reduce((sum, row) => {
                                      return (
                                        sum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        )
                                      );
                                    }, 0);
                                    return total < 0 ? "text-red-600" : "";
                                  })()}
                                >
                                  {formatCurrency(
                                    classifiedData["Employment Cost"].reduce(
                                      (sum, row) => {
                                        return (
                                          sum +
                                          dashboardData.months.reduce(
                                            (monthSum, month) =>
                                              monthSum +
                                              parseValue(row[month.columnName]),
                                            0
                                          )
                                        );
                                      },
                                      0
                                    )
                                  )}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-sm bg-purple-100">
                                <span>
                                  {(() => {
                                    const revenueCategories = [
                                      "Other Revenue",
                                      "Qual Revenue",
                                      "Quant Revenue",
                                    ];
                                    const totalRevenue =
                                      revenueCategories.reduce((sum, cat) => {
                                        if (classifiedData[cat]) {
                                          return (
                                            sum +
                                            classifiedData[cat].reduce(
                                              (catSum, row) =>
                                                catSum +
                                                dashboardData.months.reduce(
                                                  (monthSum, month) =>
                                                    monthSum +
                                                    parseValue(
                                                      row[month.columnName]
                                                    ),
                                                  0
                                                ),
                                              0
                                            )
                                          );
                                        }
                                        return sum;
                                      }, 0);
                                    const totalEmployment = classifiedData[
                                      "Employment Cost"
                                    ].reduce((sum, row) => {
                                      return (
                                        sum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        )
                                      );
                                    }, 0);
                                    const percentage =
                                      totalRevenue !== 0
                                        ? (totalEmployment / totalRevenue) * 100
                                        : 0;
                                    return `${percentage.toFixed(1)}%`;
                                  })()}
                                </span>
                              </td>
                            </tr>

                            {!collapsedSections["Total Employment Cost"] &&
                              classifiedData["Employment Cost"].map(
                                (row, idx) => {
                                  const lineItem =
                                    row[dashboardData.accountColumn];
                                  const ytdTotal = dashboardData.months.reduce(
                                    (sum, month) =>
                                      sum + parseValue(row[month.columnName]),
                                    0
                                  );

                                  return (
                                    <tr
                                      key={`employment-${idx}`}
                                      className="border-b hover:bg-gray-50"
                                    >
                                      <td className="px-4 py-3 text-sm pl-8 sticky left-0 bg-white z-10">
                                        {lineItem}
                                        {(() => {
                                          const adjustments =
                                            ebitdaAdjustments[lineItem];
                                          if (
                                            adjustments &&
                                            Object.values(adjustments).some(
                                              (val) => parseFloat(val) > 0
                                            )
                                          ) {
                                            return (
                                              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                                                ADJ
                                              </span>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </td>
                                      {dashboardData.months.map((month) => {
                                        const value = parseValue(
                                          row[month.columnName]
                                        );
                                        return (
                                          <td
                                            key={month.columnName}
                                            className="px-4 py-3 text-right text-sm"
                                          >
                                            <span
                                              className={
                                                value < 0 ? "text-red-600" : ""
                                              }
                                            >
                                              {formatCurrency(value)}
                                            </span>
                                          </td>
                                        );
                                      })}
                                      <td className="px-4 py-3 text-right text-sm font-semibold bg-indigo-50 sticky right-0 z-10">
                                        <span
                                          className={
                                            ytdTotal < 0 ? "text-red-600" : ""
                                          }
                                        >
                                          {formatCurrency(ytdTotal)}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-right text-sm bg-indigo-50">
                                        <span>
                                          {(() => {
                                            const revenueCategories = [
                                              "Other Revenue",
                                              "Qual Revenue",
                                              "Quant Revenue",
                                            ];
                                            const totalRevenue =
                                              revenueCategories.reduce(
                                                (sum, cat) => {
                                                  if (classifiedData[cat]) {
                                                    return (
                                                      sum +
                                                      classifiedData[
                                                        cat
                                                      ].reduce(
                                                        (catSum, row) =>
                                                          catSum +
                                                          dashboardData.months.reduce(
                                                            (monthSum, month) =>
                                                              monthSum +
                                                              parseValue(
                                                                row[
                                                                  month
                                                                    .columnName
                                                                ]
                                                              ),
                                                            0
                                                          ),
                                                        0
                                                      )
                                                    );
                                                  }
                                                  return sum;
                                                },
                                                0
                                              );
                                            const percentage =
                                              totalRevenue !== 0
                                                ? (ytdTotal / totalRevenue) *
                                                  100
                                                : 0;
                                            return `${percentage.toFixed(1)}%`;
                                          })()}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                          </>
                        )}

                        {classifiedData["Financing Cost"] && (
                          <>
                            <tr
                              className="bg-purple-50 font-bold border-b-2 cursor-pointer hover:bg-purple-100"
                              onClick={() =>
                                toggleSection("Total Financing Cost")
                              }
                            >
                              <td className="px-4 py-3 text-sm sticky left-0 bg-purple-50 z-10">
                                {collapsedSections["Total Financing Cost"] ? (
                                  <ChevronRight className="w-4 h-4 inline mr-2" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 inline mr-2" />
                                )}
                                Total Financing Cost
                              </td>
                              {dashboardData.months.map((month) => {
                                const total = classifiedData[
                                  "Financing Cost"
                                ].reduce(
                                  (sum, row) =>
                                    sum + parseValue(row[month.columnName]),
                                  0
                                );
                                return (
                                  <td
                                    key={month.columnName}
                                    className="px-4 py-3 text-right text-sm"
                                  >
                                    <span
                                      className={
                                        total < 0 ? "text-red-600" : ""
                                      }
                                    >
                                      {formatCurrency(total)}
                                    </span>
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3 text-right text-sm bg-purple-100 sticky right-0 z-10">
                                <span
                                  className={(() => {
                                    const total = classifiedData[
                                      "Financing Cost"
                                    ].reduce((sum, row) => {
                                      return (
                                        sum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        )
                                      );
                                    }, 0);
                                    return total < 0 ? "text-red-600" : "";
                                  })()}
                                >
                                  {formatCurrency(
                                    classifiedData["Financing Cost"].reduce(
                                      (sum, row) => {
                                        return (
                                          sum +
                                          dashboardData.months.reduce(
                                            (monthSum, month) =>
                                              monthSum +
                                              parseValue(row[month.columnName]),
                                            0
                                          )
                                        );
                                      },
                                      0
                                    )
                                  )}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-sm bg-purple-100">
                                <span>
                                  {(() => {
                                    const revenueCategories = [
                                      "Other Revenue",
                                      "Qual Revenue",
                                      "Quant Revenue",
                                    ];
                                    const totalRevenue =
                                      revenueCategories.reduce((sum, cat) => {
                                        if (classifiedData[cat]) {
                                          return (
                                            sum +
                                            classifiedData[cat].reduce(
                                              (catSum, row) =>
                                                catSum +
                                                dashboardData.months.reduce(
                                                  (monthSum, month) =>
                                                    monthSum +
                                                    parseValue(
                                                      row[month.columnName]
                                                    ),
                                                  0
                                                ),
                                              0
                                            )
                                          );
                                        }
                                        return sum;
                                      }, 0);
                                    const totalFinancing = classifiedData[
                                      "Financing Cost"
                                    ].reduce((sum, row) => {
                                      return (
                                        sum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        )
                                      );
                                    }, 0);
                                    const percentage =
                                      totalRevenue !== 0
                                        ? (totalFinancing / totalRevenue) * 100
                                        : 0;
                                    return `${percentage.toFixed(1)}%`;
                                  })()}
                                </span>
                              </td>
                            </tr>

                            {!collapsedSections["Total Financing Cost"] &&
                              classifiedData["Financing Cost"].map(
                                (row, idx) => {
                                  const lineItem =
                                    row[dashboardData.accountColumn];
                                  const ytdTotal = dashboardData.months.reduce(
                                    (sum, month) =>
                                      sum + parseValue(row[month.columnName]),
                                    0
                                  );

                                  return (
                                    <tr
                                      key={`financing-${idx}`}
                                      className="border-b hover:bg-gray-50"
                                    >
                                      <td className="px-4 py-3 text-sm pl-8 sticky left-0 bg-white z-10">
                                        {lineItem}
                                        {(() => {
                                          const adjustments =
                                            ebitdaAdjustments[lineItem];
                                          if (
                                            adjustments &&
                                            Object.values(adjustments).some(
                                              (val) => parseFloat(val) > 0
                                            )
                                          ) {
                                            return (
                                              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                                                ADJ
                                              </span>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </td>
                                      {dashboardData.months.map((month) => {
                                        const value = parseValue(
                                          row[month.columnName]
                                        );
                                        return (
                                          <td
                                            key={month.columnName}
                                            className="px-4 py-3 text-right text-sm"
                                          >
                                            <span
                                              className={
                                                value < 0 ? "text-red-600" : ""
                                              }
                                            >
                                              {formatCurrency(value)}
                                            </span>
                                          </td>
                                        );
                                      })}
                                      <td className="px-4 py-3 text-right text-sm font-semibold bg-indigo-50 sticky right-0 z-10">
                                        <span
                                          className={
                                            ytdTotal < 0 ? "text-red-600" : ""
                                          }
                                        >
                                          {formatCurrency(ytdTotal)}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-right text-sm bg-indigo-50">
                                        <span>
                                          {(() => {
                                            const revenueCategories = [
                                              "Other Revenue",
                                              "Qual Revenue",
                                              "Quant Revenue",
                                            ];
                                            const totalRevenue =
                                              revenueCategories.reduce(
                                                (sum, cat) => {
                                                  if (classifiedData[cat]) {
                                                    return (
                                                      sum +
                                                      classifiedData[
                                                        cat
                                                      ].reduce(
                                                        (catSum, row) =>
                                                          catSum +
                                                          dashboardData.months.reduce(
                                                            (monthSum, month) =>
                                                              monthSum +
                                                              parseValue(
                                                                row[
                                                                  month
                                                                    .columnName
                                                                ]
                                                              ),
                                                            0
                                                          ),
                                                        0
                                                      )
                                                    );
                                                  }
                                                  return sum;
                                                },
                                                0
                                              );
                                            const percentage =
                                              totalRevenue !== 0
                                                ? (ytdTotal / totalRevenue) *
                                                  100
                                                : 0;
                                            return `${percentage.toFixed(1)}%`;
                                          })()}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                          </>
                        )}

                        <tr className="bg-purple-100 font-bold border-b-2">
                          <td className="px-4 py-3 text-sm sticky left-0 bg-purple-100 z-10">
                            Total Operating Expenses
                          </td>
                          {dashboardData.months.map((month) => {
                            const opexCategories = [
                              "Admin Cost",
                              "Employment Cost",
                              "Financing Cost",
                            ];
                            const opex = opexCategories.reduce((sum, cat) => {
                              if (classifiedData[cat]) {
                                return (
                                  sum +
                                  classifiedData[cat].reduce(
                                    (catSum, row) =>
                                      catSum +
                                      parseValue(row[month.columnName]),
                                    0
                                  )
                                );
                              }
                              return sum;
                            }, 0);

                            return (
                              <td
                                key={month.columnName}
                                className="px-4 py-3 text-right text-sm"
                              >
                                <span
                                  className={opex < 0 ? "text-red-600" : ""}
                                >
                                  {formatCurrency(opex)}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right text-sm bg-purple-200 sticky right-0 z-10">
                            <span
                              className={(() => {
                                const opexCategories = [
                                  "Admin Cost",
                                  "Employment Cost",
                                  "Financing Cost",
                                ];
                                const totalOpex = opexCategories.reduce(
                                  (sum, cat) => {
                                    if (classifiedData[cat]) {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            dashboardData.months.reduce(
                                              (monthSum, month) =>
                                                monthSum +
                                                parseValue(
                                                  row[month.columnName]
                                                ),
                                              0
                                            ),
                                          0
                                        )
                                      );
                                    }
                                    return sum;
                                  },
                                  0
                                );
                                return totalOpex < 0 ? "text-red-600" : "";
                              })()}
                            >
                              {formatCurrency(
                                (() => {
                                  const opexCategories = [
                                    "Admin Cost",
                                    "Employment Cost",
                                    "Financing Cost",
                                  ];
                                  return opexCategories.reduce((sum, cat) => {
                                    if (classifiedData[cat]) {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            dashboardData.months.reduce(
                                              (monthSum, month) =>
                                                monthSum +
                                                parseValue(
                                                  row[month.columnName]
                                                ),
                                              0
                                            ),
                                          0
                                        )
                                      );
                                    }
                                    return sum;
                                  }, 0);
                                })()
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm bg-purple-200">
                            <span>
                              {(() => {
                                const revenueCategories = [
                                  "Other Revenue",
                                  "Qual Revenue",
                                  "Quant Revenue",
                                ];
                                const totalRevenue = revenueCategories.reduce(
                                  (sum, cat) => {
                                    if (classifiedData[cat]) {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            dashboardData.months.reduce(
                                              (monthSum, month) =>
                                                monthSum +
                                                parseValue(
                                                  row[month.columnName]
                                                ),
                                              0
                                            ),
                                          0
                                        )
                                      );
                                    }
                                    return sum;
                                  },
                                  0
                                );
                                const opexCategories = [
                                  "Admin Cost",
                                  "Employment Cost",
                                  "Financing Cost",
                                ];
                                const totalOpex = opexCategories.reduce(
                                  (sum, cat) => {
                                    if (classifiedData[cat]) {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            dashboardData.months.reduce(
                                              (monthSum, month) =>
                                                monthSum +
                                                parseValue(
                                                  row[month.columnName]
                                                ),
                                              0
                                            ),
                                          0
                                        )
                                      );
                                    }
                                    return sum;
                                  },
                                  0
                                );
                                const percentage =
                                  totalRevenue !== 0
                                    ? (totalOpex / totalRevenue) * 100
                                    : 0;
                                return `${percentage.toFixed(1)}%`;
                              })()}
                            </span>
                          </td>
                        </tr>

                        <tr className="bg-green-100 font-bold border-b-2 border-green-300">
                          <td className="px-4 py-3 text-sm sticky left-0 bg-green-100 z-10">
                            Net Profit
                          </td>
                          {dashboardData.months.map((month) => {
                            const revenueCategories = [
                              "Other Revenue",
                              "Qual Revenue",
                              "Quant Revenue",
                            ];
                            const revenue = revenueCategories.reduce(
                              (sum, cat) => {
                                if (classifiedData[cat]) {
                                  return (
                                    sum +
                                    classifiedData[cat].reduce(
                                      (catSum, row) =>
                                        catSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    )
                                  );
                                }
                                return sum;
                              },
                              0
                            );

                            const costCategories = Object.keys(
                              classifiedData
                            ).filter((cat) => cat.startsWith("Cost of Sales"));
                            const costOfSales = costCategories.reduce(
                              (sum, cat) => {
                                return (
                                  sum +
                                  classifiedData[cat].reduce(
                                    (catSum, row) =>
                                      catSum +
                                      parseValue(row[month.columnName]),
                                    0
                                  )
                                );
                              },
                              0
                            );

                            const gp = revenue - costOfSales;

                            const opexCategories = [
                              "Admin Cost",
                              "Employment Cost",
                              "Financing Cost",
                            ];
                            const opex = opexCategories.reduce((sum, cat) => {
                              if (classifiedData[cat]) {
                                return (
                                  sum +
                                  classifiedData[cat].reduce(
                                    (catSum, row) =>
                                      catSum +
                                      parseValue(row[month.columnName]),
                                    0
                                  )
                                );
                              }
                              return sum;
                            }, 0);

                            const netProfit = gp - opex;

                            return (
                              <td
                                key={month.columnName}
                                className="px-4 py-3 text-right text-sm"
                              >
                                <span
                                  className={
                                    netProfit < 0 ? "text-red-600" : ""
                                  }
                                >
                                  {formatCurrency(netProfit)}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right text-sm bg-green-200 sticky right-0 z-10">
                            <span
                              className={(() => {
                                const revenueCategories = [
                                  "Other Revenue",
                                  "Qual Revenue",
                                  "Quant Revenue",
                                ];
                                const totalRevenue = revenueCategories.reduce(
                                  (sum, cat) => {
                                    if (classifiedData[cat]) {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            dashboardData.months.reduce(
                                              (monthSum, month) =>
                                                monthSum +
                                                parseValue(
                                                  row[month.columnName]
                                                ),
                                              0
                                            ),
                                          0
                                        )
                                      );
                                    }
                                    return sum;
                                  },
                                  0
                                );

                                const costCategories = Object.keys(
                                  classifiedData
                                ).filter((cat) =>
                                  cat.startsWith("Cost of Sales")
                                );
                                const totalCostOfSales = costCategories.reduce(
                                  (sum, cat) => {
                                    return (
                                      sum +
                                      classifiedData[cat].reduce(
                                        (catSum, row) =>
                                          catSum +
                                          dashboardData.months.reduce(
                                            (monthSum, month) =>
                                              monthSum +
                                              parseValue(row[month.columnName]),
                                            0
                                          ),
                                        0
                                      )
                                    );
                                  },
                                  0
                                );

                                const totalGP = totalRevenue - totalCostOfSales;

                                const opexCategories = [
                                  "Admin Cost",
                                  "Employment Cost",
                                  "Financing Cost",
                                ];
                                const totalOpex = opexCategories.reduce(
                                  (sum, cat) => {
                                    if (classifiedData[cat]) {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            dashboardData.months.reduce(
                                              (monthSum, month) =>
                                                monthSum +
                                                parseValue(
                                                  row[month.columnName]
                                                ),
                                              0
                                            ),
                                          0
                                        )
                                      );
                                    }
                                    return sum;
                                  },
                                  0
                                );

                                const netProfit = totalGP - totalOpex;
                                return netProfit < 0 ? "text-red-600" : "";
                              })()}
                            >
                              {formatCurrency(
                                (() => {
                                  const revenueCategories = [
                                    "Other Revenue",
                                    "Qual Revenue",
                                    "Quant Revenue",
                                  ];
                                  const totalRevenue = revenueCategories.reduce(
                                    (sum, cat) => {
                                      if (classifiedData[cat]) {
                                        return (
                                          sum +
                                          classifiedData[cat].reduce(
                                            (catSum, row) =>
                                              catSum +
                                              dashboardData.months.reduce(
                                                (monthSum, month) =>
                                                  monthSum +
                                                  parseValue(
                                                    row[month.columnName]
                                                  ),
                                                0
                                              ),
                                            0
                                          )
                                        );
                                      }
                                      return sum;
                                    },
                                    0
                                  );

                                  const costCategories = Object.keys(
                                    classifiedData
                                  ).filter((cat) =>
                                    cat.startsWith("Cost of Sales")
                                  );
                                  const totalCostOfSales =
                                    costCategories.reduce((sum, cat) => {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            dashboardData.months.reduce(
                                              (monthSum, month) =>
                                                monthSum +
                                                parseValue(
                                                  row[month.columnName]
                                                ),
                                              0
                                            ),
                                          0
                                        )
                                      );
                                    }, 0);

                                  const totalGP =
                                    totalRevenue - totalCostOfSales;

                                  const opexCategories = [
                                    "Admin Cost",
                                    "Employment Cost",
                                    "Financing Cost",
                                  ];
                                  const totalOpex = opexCategories.reduce(
                                    (sum, cat) => {
                                      if (classifiedData[cat]) {
                                        return (
                                          sum +
                                          classifiedData[cat].reduce(
                                            (catSum, row) =>
                                              catSum +
                                              dashboardData.months.reduce(
                                                (monthSum, month) =>
                                                  monthSum +
                                                  parseValue(
                                                    row[month.columnName]
                                                  ),
                                                0
                                              ),
                                            0
                                          )
                                        );
                                      }
                                      return sum;
                                    },
                                    0
                                  );

                                  return totalGP - totalOpex;
                                })()
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm bg-green-200 font-bold">
                            <span
                              className={(() => {
                                const revenueCategories = [
                                  "Other Revenue",
                                  "Qual Revenue",
                                  "Quant Revenue",
                                ];
                                const totalRevenue = revenueCategories.reduce(
                                  (sum, cat) => {
                                    if (classifiedData[cat]) {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            dashboardData.months.reduce(
                                              (monthSum, month) =>
                                                monthSum +
                                                parseValue(
                                                  row[month.columnName]
                                                ),
                                              0
                                            ),
                                          0
                                        )
                                      );
                                    }
                                    return sum;
                                  },
                                  0
                                );

                                const costCategories = Object.keys(
                                  classifiedData
                                ).filter((cat) =>
                                  cat.startsWith("Cost of Sales")
                                );
                                const totalCostOfSales = costCategories.reduce(
                                  (sum, cat) => {
                                    return (
                                      sum +
                                      classifiedData[cat].reduce(
                                        (catSum, row) =>
                                          catSum +
                                          dashboardData.months.reduce(
                                            (monthSum, month) =>
                                              monthSum +
                                              parseValue(row[month.columnName]),
                                            0
                                          ),
                                        0
                                      )
                                    );
                                  },
                                  0
                                );

                                const totalGP = totalRevenue - totalCostOfSales;

                                const opexCategories = [
                                  "Admin Cost",
                                  "Employment Cost",
                                  "Financing Cost",
                                ];
                                const totalOpex = opexCategories.reduce(
                                  (sum, cat) => {
                                    if (classifiedData[cat]) {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            dashboardData.months.reduce(
                                              (monthSum, month) =>
                                                monthSum +
                                                parseValue(
                                                  row[month.columnName]
                                                ),
                                              0
                                            ),
                                          0
                                        )
                                      );
                                    }
                                    return sum;
                                  },
                                  0
                                );

                                const netProfit = totalGP - totalOpex;
                                return netProfit < 0 ? "text-red-600" : "";
                              })()}
                            >
                              {(() => {
                                const revenueCategories = [
                                  "Other Revenue",
                                  "Qual Revenue",
                                  "Quant Revenue",
                                ];
                                const totalRevenue = revenueCategories.reduce(
                                  (sum, cat) => {
                                    if (classifiedData[cat]) {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            dashboardData.months.reduce(
                                              (monthSum, month) =>
                                                monthSum +
                                                parseValue(
                                                  row[month.columnName]
                                                ),
                                              0
                                            ),
                                          0
                                        )
                                      );
                                    }
                                    return sum;
                                  },
                                  0
                                );

                                const costCategories = Object.keys(
                                  classifiedData
                                ).filter((cat) =>
                                  cat.startsWith("Cost of Sales")
                                );
                                const totalCostOfSales = costCategories.reduce(
                                  (sum, cat) => {
                                    return (
                                      sum +
                                      classifiedData[cat].reduce(
                                        (catSum, row) =>
                                          catSum +
                                          dashboardData.months.reduce(
                                            (monthSum, month) =>
                                              monthSum +
                                              parseValue(row[month.columnName]),
                                            0
                                          ),
                                        0
                                      )
                                    );
                                  },
                                  0
                                );

                                const totalGP = totalRevenue - totalCostOfSales;

                                const opexCategories = [
                                  "Admin Cost",
                                  "Employment Cost",
                                  "Financing Cost",
                                ];
                                const totalOpex = opexCategories.reduce(
                                  (sum, cat) => {
                                    if (classifiedData[cat]) {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            dashboardData.months.reduce(
                                              (monthSum, month) =>
                                                monthSum +
                                                parseValue(
                                                  row[month.columnName]
                                                ),
                                              0
                                            ),
                                          0
                                        )
                                      );
                                    }
                                    return sum;
                                  },
                                  0
                                );

                                const netProfit = totalGP - totalOpex;
                                const percentage =
                                  totalRevenue !== 0
                                    ? (netProfit / totalRevenue) * 100
                                    : 0;
                                return `${percentage.toFixed(1)}%`;
                              })()}
                            </span>
                          </td>
                        </tr>

                        {/* EBITDA Adjustments Row */}
                        {(() => {
                          // Check if there are any adjustments with values > 0
                          const hasAdjustments = Object.keys(
                            ebitdaAdjustments
                          ).some((lineItem) => {
                            const adjustments = ebitdaAdjustments[lineItem];
                            return Object.values(adjustments || {}).some(
                              (val) => parseFloat(val) > 0
                            );
                          });

                          if (!hasAdjustments) return null;

                          return (
                            <>
                              <tr className="bg-amber-50 font-semibold border-b">
                                <td className="px-4 py-3 text-sm sticky left-0 bg-amber-50 z-10">
                                  + EBITDA Adjustments
                                </td>
                                {dashboardData.months.map((month) => {
                                  let adjustmentTotal = 0;
                                  Object.keys(ebitdaAdjustments).forEach(
                                    (lineItem) => {
                                      const monthAdjustments =
                                        ebitdaAdjustments[lineItem] || {};
                                      const monthValue =
                                        monthAdjustments[month.displayName] ||
                                        0;
                                      adjustmentTotal +=
                                        parseFloat(monthValue) || 0;
                                    }
                                  );

                                  return (
                                    <td
                                      key={month.columnName}
                                      className="px-4 py-3 text-right text-sm text-amber-700"
                                    >
                                      {formatCurrency(adjustmentTotal)}
                                    </td>
                                  );
                                })}
                                <td className="px-4 py-3 text-right text-sm bg-amber-100 sticky right-0 z-10 text-amber-700">
                                  {(() => {
                                    let totalAdjustments = 0;
                                    Object.keys(ebitdaAdjustments).forEach(
                                      (lineItem) => {
                                        const monthAdjustments =
                                          ebitdaAdjustments[lineItem] || {};
                                        dashboardData.months.forEach(
                                          (month) => {
                                            const monthValue =
                                              monthAdjustments[
                                                month.displayName
                                              ] || 0;
                                            totalAdjustments +=
                                              parseFloat(monthValue) || 0;
                                          }
                                        );
                                      }
                                    );
                                    return formatCurrency(totalAdjustments);
                                  })()}
                                </td>
                                <td className="px-4 py-3 text-right text-sm bg-amber-100"></td>
                              </tr>

                              {/* Adjusted Net Profit Row */}
                              <tr className="bg-blue-100 font-bold border-b-4 border-blue-300">
                                <td className="px-4 py-3 text-sm sticky left-0 bg-blue-100 z-10">
                                  Adjusted Net Profit
                                </td>
                                {dashboardData.months.map((month) => {
                                  const revenueCategories = [
                                    "Other Revenue",
                                    "Qual Revenue",
                                    "Quant Revenue",
                                  ];
                                  const revenue = revenueCategories.reduce(
                                    (sum, cat) => {
                                      if (classifiedData[cat]) {
                                        return (
                                          sum +
                                          classifiedData[cat].reduce(
                                            (catSum, row) =>
                                              catSum +
                                              parseValue(row[month.columnName]),
                                            0
                                          )
                                        );
                                      }
                                      return sum;
                                    },
                                    0
                                  );

                                  const costCategories = Object.keys(
                                    classifiedData
                                  ).filter((cat) =>
                                    cat.startsWith("Cost of Sales")
                                  );
                                  const costOfSales = costCategories.reduce(
                                    (sum, cat) => {
                                      return (
                                        sum +
                                        classifiedData[cat].reduce(
                                          (catSum, row) =>
                                            catSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        )
                                      );
                                    },
                                    0
                                  );

                                  const gp = revenue - costOfSales;

                                  const opexCategories = [
                                    "Admin Cost",
                                    "Employment Cost",
                                    "Financing Cost",
                                  ];
                                  const opex = opexCategories.reduce(
                                    (sum, cat) => {
                                      if (classifiedData[cat]) {
                                        return (
                                          sum +
                                          classifiedData[cat].reduce(
                                            (catSum, row) =>
                                              catSum +
                                              parseValue(row[month.columnName]),
                                            0
                                          )
                                        );
                                      }
                                      return sum;
                                    },
                                    0
                                  );

                                  const netProfit = gp - opex;

                                  // Add adjustments for this month
                                  let adjustmentTotal = 0;
                                  Object.keys(ebitdaAdjustments).forEach(
                                    (lineItem) => {
                                      const monthAdjustments =
                                        ebitdaAdjustments[lineItem] || {};
                                      const monthValue =
                                        monthAdjustments[month.displayName] ||
                                        0;
                                      adjustmentTotal +=
                                        parseFloat(monthValue) || 0;
                                    }
                                  );

                                  const adjustedNetProfit =
                                    netProfit + adjustmentTotal;

                                  return (
                                    <td
                                      key={month.columnName}
                                      className="px-4 py-3 text-right text-sm"
                                    >
                                      <span
                                        className={
                                          adjustedNetProfit < 0
                                            ? "text-red-600"
                                            : "text-blue-700"
                                        }
                                      >
                                        {formatCurrency(adjustedNetProfit)}
                                      </span>
                                    </td>
                                  );
                                })}
                                <td className="px-4 py-3 text-right text-sm bg-blue-200 sticky right-0 z-10">
                                  <span
                                    className={(() => {
                                      const revenueCategories = [
                                        "Other Revenue",
                                        "Qual Revenue",
                                        "Quant Revenue",
                                      ];
                                      const totalRevenue =
                                        revenueCategories.reduce((sum, cat) => {
                                          if (classifiedData[cat]) {
                                            return (
                                              sum +
                                              classifiedData[cat].reduce(
                                                (catSum, row) =>
                                                  catSum +
                                                  dashboardData.months.reduce(
                                                    (monthSum, month) =>
                                                      monthSum +
                                                      parseValue(
                                                        row[month.columnName]
                                                      ),
                                                    0
                                                  ),
                                                0
                                              )
                                            );
                                          }
                                          return sum;
                                        }, 0);

                                      const costCategories = Object.keys(
                                        classifiedData
                                      ).filter((cat) =>
                                        cat.startsWith("Cost of Sales")
                                      );
                                      const totalCostOfSales =
                                        costCategories.reduce((sum, cat) => {
                                          return (
                                            sum +
                                            classifiedData[cat].reduce(
                                              (catSum, row) =>
                                                catSum +
                                                dashboardData.months.reduce(
                                                  (monthSum, month) =>
                                                    monthSum +
                                                    parseValue(
                                                      row[month.columnName]
                                                    ),
                                                  0
                                                ),
                                              0
                                            )
                                          );
                                        }, 0);

                                      const totalGP =
                                        totalRevenue - totalCostOfSales;

                                      const opexCategories = [
                                        "Admin Cost",
                                        "Employment Cost",
                                        "Financing Cost",
                                      ];
                                      const totalOpex = opexCategories.reduce(
                                        (sum, cat) => {
                                          if (classifiedData[cat]) {
                                            return (
                                              sum +
                                              classifiedData[cat].reduce(
                                                (catSum, row) =>
                                                  catSum +
                                                  dashboardData.months.reduce(
                                                    (monthSum, month) =>
                                                      monthSum +
                                                      parseValue(
                                                        row[month.columnName]
                                                      ),
                                                    0
                                                  ),
                                                0
                                              )
                                            );
                                          }
                                          return sum;
                                        },
                                        0
                                      );

                                      const netProfit = totalGP - totalOpex;

                                      let totalAdjustments = 0;
                                      Object.keys(ebitdaAdjustments).forEach(
                                        (lineItem) => {
                                          const monthAdjustments =
                                            ebitdaAdjustments[lineItem] || {};
                                          dashboardData.months.forEach(
                                            (month) => {
                                              const monthValue =
                                                monthAdjustments[
                                                  month.displayName
                                                ] || 0;
                                              totalAdjustments +=
                                                parseFloat(monthValue) || 0;
                                            }
                                          );
                                        }
                                      );

                                      const adjustedNetProfit =
                                        netProfit + totalAdjustments;
                                      return adjustedNetProfit < 0
                                        ? "text-red-600"
                                        : "text-blue-700";
                                    })()}
                                  >
                                    {formatCurrency(
                                      (() => {
                                        const revenueCategories = [
                                          "Other Revenue",
                                          "Qual Revenue",
                                          "Quant Revenue",
                                        ];
                                        const totalRevenue =
                                          revenueCategories.reduce(
                                            (sum, cat) => {
                                              if (classifiedData[cat]) {
                                                return (
                                                  sum +
                                                  classifiedData[cat].reduce(
                                                    (catSum, row) =>
                                                      catSum +
                                                      dashboardData.months.reduce(
                                                        (monthSum, month) =>
                                                          monthSum +
                                                          parseValue(
                                                            row[
                                                              month.columnName
                                                            ]
                                                          ),
                                                        0
                                                      ),
                                                    0
                                                  )
                                                );
                                              }
                                              return sum;
                                            },
                                            0
                                          );

                                        const costCategories = Object.keys(
                                          classifiedData
                                        ).filter((cat) =>
                                          cat.startsWith("Cost of Sales")
                                        );
                                        const totalCostOfSales =
                                          costCategories.reduce((sum, cat) => {
                                            return (
                                              sum +
                                              classifiedData[cat].reduce(
                                                (catSum, row) =>
                                                  catSum +
                                                  dashboardData.months.reduce(
                                                    (monthSum, month) =>
                                                      monthSum +
                                                      parseValue(
                                                        row[month.columnName]
                                                      ),
                                                    0
                                                  ),
                                                0
                                              )
                                            );
                                          }, 0);

                                        const totalGP =
                                          totalRevenue - totalCostOfSales;

                                        const opexCategories = [
                                          "Admin Cost",
                                          "Employment Cost",
                                          "Financing Cost",
                                        ];
                                        const totalOpex = opexCategories.reduce(
                                          (sum, cat) => {
                                            if (classifiedData[cat]) {
                                              return (
                                                sum +
                                                classifiedData[cat].reduce(
                                                  (catSum, row) =>
                                                    catSum +
                                                    dashboardData.months.reduce(
                                                      (monthSum, month) =>
                                                        monthSum +
                                                        parseValue(
                                                          row[month.columnName]
                                                        ),
                                                      0
                                                    ),
                                                  0
                                                )
                                              );
                                            }
                                            return sum;
                                          },
                                          0
                                        );

                                        const netProfit = totalGP - totalOpex;

                                        let totalAdjustments = 0;
                                        Object.keys(ebitdaAdjustments).forEach(
                                          (lineItem) => {
                                            const monthAdjustments =
                                              ebitdaAdjustments[lineItem] || {};
                                            dashboardData.months.forEach(
                                              (month) => {
                                                const monthValue =
                                                  monthAdjustments[
                                                    month.displayName
                                                  ] || 0;
                                                totalAdjustments +=
                                                  parseFloat(monthValue) || 0;
                                              }
                                            );
                                          }
                                        );

                                        return netProfit + totalAdjustments;
                                      })()
                                    )}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right text-sm bg-blue-200 font-bold">
                                  <span
                                    className={(() => {
                                      const revenueCategories = [
                                        "Other Revenue",
                                        "Qual Revenue",
                                        "Quant Revenue",
                                      ];
                                      const totalRevenue =
                                        revenueCategories.reduce((sum, cat) => {
                                          if (classifiedData[cat]) {
                                            return (
                                              sum +
                                              classifiedData[cat].reduce(
                                                (catSum, row) =>
                                                  catSum +
                                                  dashboardData.months.reduce(
                                                    (monthSum, month) =>
                                                      monthSum +
                                                      parseValue(
                                                        row[month.columnName]
                                                      ),
                                                    0
                                                  ),
                                                0
                                              )
                                            );
                                          }
                                          return sum;
                                        }, 0);

                                      const costCategories = Object.keys(
                                        classifiedData
                                      ).filter((cat) =>
                                        cat.startsWith("Cost of Sales")
                                      );
                                      const totalCostOfSales =
                                        costCategories.reduce((sum, cat) => {
                                          return (
                                            sum +
                                            classifiedData[cat].reduce(
                                              (catSum, row) =>
                                                catSum +
                                                dashboardData.months.reduce(
                                                  (monthSum, month) =>
                                                    monthSum +
                                                    parseValue(
                                                      row[month.columnName]
                                                    ),
                                                  0
                                                ),
                                              0
                                            )
                                          );
                                        }, 0);

                                      const totalGP =
                                        totalRevenue - totalCostOfSales;

                                      const opexCategories = [
                                        "Admin Cost",
                                        "Employment Cost",
                                        "Financing Cost",
                                      ];
                                      const totalOpex = opexCategories.reduce(
                                        (sum, cat) => {
                                          if (classifiedData[cat]) {
                                            return (
                                              sum +
                                              classifiedData[cat].reduce(
                                                (catSum, row) =>
                                                  catSum +
                                                  dashboardData.months.reduce(
                                                    (monthSum, month) =>
                                                      monthSum +
                                                      parseValue(
                                                        row[month.columnName]
                                                      ),
                                                    0
                                                  ),
                                                0
                                              )
                                            );
                                          }
                                          return sum;
                                        },
                                        0
                                      );

                                      const netProfit = totalGP - totalOpex;

                                      let totalAdjustments = 0;
                                      Object.keys(ebitdaAdjustments).forEach(
                                        (lineItem) => {
                                          const monthAdjustments =
                                            ebitdaAdjustments[lineItem] || {};
                                          dashboardData.months.forEach(
                                            (month) => {
                                              const monthValue =
                                                monthAdjustments[
                                                  month.displayName
                                                ] || 0;
                                              totalAdjustments +=
                                                parseFloat(monthValue) || 0;
                                            }
                                          );
                                        }
                                      );

                                      const adjustedNetProfit =
                                        netProfit + totalAdjustments;
                                      return adjustedNetProfit < 0
                                        ? "text-red-600"
                                        : "text-blue-700";
                                    })()}
                                  >
                                    {(() => {
                                      const revenueCategories = [
                                        "Other Revenue",
                                        "Qual Revenue",
                                        "Quant Revenue",
                                      ];
                                      const totalRevenue =
                                        revenueCategories.reduce((sum, cat) => {
                                          if (classifiedData[cat]) {
                                            return (
                                              sum +
                                              classifiedData[cat].reduce(
                                                (catSum, row) =>
                                                  catSum +
                                                  dashboardData.months.reduce(
                                                    (monthSum, month) =>
                                                      monthSum +
                                                      parseValue(
                                                        row[month.columnName]
                                                      ),
                                                    0
                                                  ),
                                                0
                                              )
                                            );
                                          }
                                          return sum;
                                        }, 0);

                                      const costCategories = Object.keys(
                                        classifiedData
                                      ).filter((cat) =>
                                        cat.startsWith("Cost of Sales")
                                      );
                                      const totalCostOfSales =
                                        costCategories.reduce((sum, cat) => {
                                          return (
                                            sum +
                                            classifiedData[cat].reduce(
                                              (catSum, row) =>
                                                catSum +
                                                dashboardData.months.reduce(
                                                  (monthSum, month) =>
                                                    monthSum +
                                                    parseValue(
                                                      row[month.columnName]
                                                    ),
                                                  0
                                                ),
                                              0
                                            )
                                          );
                                        }, 0);

                                      const totalGP =
                                        totalRevenue - totalCostOfSales;

                                      const opexCategories = [
                                        "Admin Cost",
                                        "Employment Cost",
                                        "Financing Cost",
                                      ];
                                      const totalOpex = opexCategories.reduce(
                                        (sum, cat) => {
                                          if (classifiedData[cat]) {
                                            return (
                                              sum +
                                              classifiedData[cat].reduce(
                                                (catSum, row) =>
                                                  catSum +
                                                  dashboardData.months.reduce(
                                                    (monthSum, month) =>
                                                      monthSum +
                                                      parseValue(
                                                        row[month.columnName]
                                                      ),
                                                    0
                                                  ),
                                                0
                                              )
                                            );
                                          }
                                          return sum;
                                        },
                                        0
                                      );

                                      const netProfit = totalGP - totalOpex;

                                      let totalAdjustments = 0;
                                      Object.keys(ebitdaAdjustments).forEach(
                                        (lineItem) => {
                                          const monthAdjustments =
                                            ebitdaAdjustments[lineItem] || {};
                                          dashboardData.months.forEach(
                                            (month) => {
                                              const monthValue =
                                                monthAdjustments[
                                                  month.displayName
                                                ] || 0;
                                              totalAdjustments +=
                                                parseFloat(monthValue) || 0;
                                            }
                                          );
                                        }
                                      );

                                      const adjustedNetProfit =
                                        netProfit + totalAdjustments;
                                      const percentage =
                                        totalRevenue !== 0
                                          ? (adjustedNetProfit / totalRevenue) *
                                            100
                                          : 0;
                                      return `${percentage.toFixed(1)}%`;
                                    })()}
                                  </span>
                                </td>
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "analytics" && (
          <>
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>

              {!dashboardData ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-600 mb-2">
                    THIS IS OLD P&L CODE - IGNORE THIS
                  </p>
                  <p className="text-gray-500 text-sm">
                    This should not be visible
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Monthly Revenue Trend */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4">
                      Monthly Revenue Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={(() => {
                          if (!classifiedData) return [];
                          const revenueCategories = [
                            "Other Revenue",
                            "Qual Revenue",
                            "Quant Revenue",
                          ];

                          return dashboardData.months.map((month, idx) => {
                            const revenue = revenueCategories.reduce(
                              (sum, cat) => {
                                if (classifiedData[cat]) {
                                  return (
                                    sum +
                                    classifiedData[cat].reduce(
                                      (catSum, row) =>
                                        catSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    )
                                  );
                                }
                                return sum;
                              },
                              0
                            );

                            return {
                              month: month.displayName,
                              revenue: revenue,
                              status: dashboardData.monthStatus[idx],
                            };
                          });
                        })()}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#4F46E5"
                          strokeWidth={2}
                          name="Revenue"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Revenue Breakdown */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">
                          Revenue Breakdown (YTD)
                        </h3>
                        <span className="text-lg font-bold text-indigo-600">
                          {(() => {
                            if (!classifiedData) return formatCurrency(0);
                            const categories = [
                              "Other Revenue",
                              "Qual Revenue",
                              "Quant Revenue",
                            ];
                            const total = categories.reduce((sum, cat) => {
                              return (
                                sum +
                                (classifiedData[cat]
                                  ? classifiedData[cat].reduce(
                                      (catSum, row) =>
                                        catSum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        ),
                                      0
                                    )
                                  : 0)
                              );
                            }, 0);
                            return formatCurrency(total);
                          })()}
                        </span>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              if (!classifiedData) return [];
                              const categories = [
                                "Other Revenue",
                                "Qual Revenue",
                                "Quant Revenue",
                              ];
                              return categories
                                .map((cat) => {
                                  const total = classifiedData[cat]
                                    ? classifiedData[cat].reduce(
                                        (sum, row) =>
                                          sum +
                                          dashboardData.months.reduce(
                                            (monthSum, month) =>
                                              monthSum +
                                              parseValue(row[month.columnName]),
                                            0
                                          ),
                                        0
                                      )
                                    : 0;
                                  return {
                                    name: cat,
                                    value: total,
                                  };
                                })
                                .filter((item) => item.value > 0);
                            })()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => {
                              const percent = (
                                (entry.value / entry.payload.percent) *
                                100
                              ).toFixed(0);
                              return `${entry.name.replace(
                                " Revenue",
                                ""
                              )}: ${formatCurrency(entry.value)}`;
                            }}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            style={{ fontSize: "11px" }}
                          >
                            {(() => {
                              const COLORS = ["#10B981", "#8B5CF6", "#3B82F6"];
                              if (!classifiedData) return null;
                              const categories = [
                                "Other Revenue",
                                "Qual Revenue",
                                "Quant Revenue",
                              ];
                              return categories.map((cat, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ));
                            })()}
                          </Pie>
                          <Tooltip
                            formatter={(value) => formatCurrency(value)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">
                          Cost Breakdown (YTD)
                        </h3>
                        <span className="text-lg font-bold text-red-600">
                          {(() => {
                            if (!classifiedData) return formatCurrency(0);
                            const categories = [
                              "Admin Cost",
                              "Employment Cost",
                              "Financing Cost",
                            ];
                            const costCategories = Object.keys(
                              classifiedData
                            ).filter((cat) => cat.startsWith("Cost of Sales"));

                            let total = categories.reduce((sum, cat) => {
                              return (
                                sum +
                                (classifiedData[cat]
                                  ? classifiedData[cat].reduce(
                                      (catSum, row) =>
                                        catSum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        ),
                                      0
                                    )
                                  : 0)
                              );
                            }, 0);

                            total += costCategories.reduce((sum, cat) => {
                              return (
                                sum +
                                classifiedData[cat].reduce(
                                  (catSum, row) =>
                                    catSum +
                                    dashboardData.months.reduce(
                                      (monthSum, month) =>
                                        monthSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    ),
                                  0
                                )
                              );
                            }, 0);

                            return formatCurrency(total);
                          })()}
                        </span>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              if (!classifiedData) return [];
                              const categories = [
                                "Admin Cost",
                                "Employment Cost",
                                "Financing Cost",
                              ];
                              const costCategories = Object.keys(
                                classifiedData
                              ).filter((cat) =>
                                cat.startsWith("Cost of Sales")
                              );

                              const result = categories.map((cat) => {
                                const total = classifiedData[cat]
                                  ? classifiedData[cat].reduce(
                                      (sum, row) =>
                                        sum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        ),
                                      0
                                    )
                                  : 0;
                                return {
                                  name: cat,
                                  value: total,
                                };
                              });

                              // Add Cost of Sales as one item
                              const cosTotal = costCategories.reduce(
                                (sum, cat) => {
                                  return (
                                    sum +
                                    classifiedData[cat].reduce(
                                      (catSum, row) =>
                                        catSum +
                                        dashboardData.months.reduce(
                                          (monthSum, month) =>
                                            monthSum +
                                            parseValue(row[month.columnName]),
                                          0
                                        ),
                                      0
                                    )
                                  );
                                },
                                0
                              );

                              result.push({
                                name: "Cost of Sales",
                                value: cosTotal,
                              });

                              return result.filter((item) => item.value > 0);
                            })()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) =>
                              `${entry.name.replace(
                                " Cost",
                                ""
                              )}: ${formatCurrency(entry.value)}`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            style={{ fontSize: "11px" }}
                          >
                            {(() => {
                              const COLORS = [
                                "#F59E0B",
                                "#EF4444",
                                "#EC4899",
                                "#6366F1",
                              ];
                              if (!classifiedData) return null;
                              return [0, 1, 2, 3].map((index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ));
                            })()}
                          </Pie>
                          <Tooltip
                            formatter={(value) => formatCurrency(value)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Gross Profit and Net Profit Trend */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4">Profit Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={(() => {
                          if (!classifiedData) return [];
                          const revenueCategories = [
                            "Other Revenue",
                            "Qual Revenue",
                            "Quant Revenue",
                          ];
                          const costCategories = Object.keys(
                            classifiedData
                          ).filter((cat) => cat.startsWith("Cost of Sales"));
                          const opexCategories = [
                            "Admin Cost",
                            "Employment Cost",
                            "Financing Cost",
                          ];

                          return dashboardData.months.map((month, idx) => {
                            const revenue = revenueCategories.reduce(
                              (sum, cat) => {
                                if (classifiedData[cat]) {
                                  return (
                                    sum +
                                    classifiedData[cat].reduce(
                                      (catSum, row) =>
                                        catSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    )
                                  );
                                }
                                return sum;
                              },
                              0
                            );

                            const costOfSales = costCategories.reduce(
                              (sum, cat) => {
                                return (
                                  sum +
                                  classifiedData[cat].reduce(
                                    (catSum, row) =>
                                      catSum +
                                      parseValue(row[month.columnName]),
                                    0
                                  )
                                );
                              },
                              0
                            );

                            const opex = opexCategories.reduce((sum, cat) => {
                              if (classifiedData[cat]) {
                                return (
                                  sum +
                                  classifiedData[cat].reduce(
                                    (catSum, row) =>
                                      catSum +
                                      parseValue(row[month.columnName]),
                                    0
                                  )
                                );
                              }
                              return sum;
                            }, 0);

                            const gp = revenue - costOfSales;
                            const np = gp - opex;

                            return {
                              month: month.displayName,
                              grossProfit: gp,
                              netProfit: np,
                              revenue: revenue,
                            };
                          });
                        })()}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8B5CF6"
                          strokeWidth={2}
                          name="Revenue"
                        />
                        <Line
                          type="monotone"
                          dataKey="grossProfit"
                          stroke="#10B981"
                          strokeWidth={2}
                          name="Gross Profit"
                        />
                        <Line
                          type="monotone"
                          dataKey="netProfit"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          name="Net Profit"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Profit Margins */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4">
                      Profit Margins (%)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={(() => {
                          if (!classifiedData) return [];
                          const revenueCategories = [
                            "Other Revenue",
                            "Qual Revenue",
                            "Quant Revenue",
                          ];
                          const costCategories = Object.keys(
                            classifiedData
                          ).filter((cat) => cat.startsWith("Cost of Sales"));
                          const opexCategories = [
                            "Admin Cost",
                            "Employment Cost",
                            "Financing Cost",
                          ];

                          return dashboardData.months.map((month, idx) => {
                            const revenue = revenueCategories.reduce(
                              (sum, cat) => {
                                if (classifiedData[cat]) {
                                  return (
                                    sum +
                                    classifiedData[cat].reduce(
                                      (catSum, row) =>
                                        catSum +
                                        parseValue(row[month.columnName]),
                                      0
                                    )
                                  );
                                }
                                return sum;
                              },
                              0
                            );

                            const costOfSales = costCategories.reduce(
                              (sum, cat) => {
                                return (
                                  sum +
                                  classifiedData[cat].reduce(
                                    (catSum, row) =>
                                      catSum +
                                      parseValue(row[month.columnName]),
                                    0
                                  )
                                );
                              },
                              0
                            );

                            const opex = opexCategories.reduce((sum, cat) => {
                              if (classifiedData[cat]) {
                                return (
                                  sum +
                                  classifiedData[cat].reduce(
                                    (catSum, row) =>
                                      catSum +
                                      parseValue(row[month.columnName]),
                                    0
                                  )
                                );
                              }
                              return sum;
                            }, 0);

                            const gp = revenue - costOfSales;
                            const np = gp - opex;

                            const gpMargin =
                              revenue !== 0 ? (gp / revenue) * 100 : 0;
                            const npMargin =
                              revenue !== 0 ? (np / revenue) * 100 : 0;

                            return {
                              month: month.displayName,
                              gpMargin: parseFloat(gpMargin.toFixed(1)),
                              npMargin: parseFloat(npMargin.toFixed(1)),
                            };
                          });
                        })()}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Legend />
                        <Bar
                          dataKey="gpMargin"
                          fill="#10B981"
                          name="GP Margin %"
                        />
                        <Bar
                          dataKey="npMargin"
                          fill="#3B82F6"
                          name="NP Margin %"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Pipeline Analytics */}
            {deals.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <h2 className="text-2xl font-bold mb-6">Pipeline Analytics</h2>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4">Deals by Stage</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={funnelData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="stage"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar
                          dataKey="value"
                          fill="#8B5CF6"
                          name="Total Value"
                        />
                        <Bar
                          dataKey="weightedValue"
                          fill="#3B82F6"
                          name="Weighted Value"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4">
                      Expected Revenue by Month
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="label"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar
                          dataKey="full"
                          fill="#A78BFA"
                          name="Full Revenue"
                        />
                        <Bar
                          dataKey="weighted"
                          fill="#6366F1"
                          name="Weighted Revenue"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Cashflow Analytics */}
            {cashTransactions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold mb-6">Cashflow Analytics</h2>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4">Monthly Cashflow</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={(() => {
                          const monthlyData = {};

                          cashTransactions.forEach((transaction) => {
                            const date = new Date(transaction.date);
                            const monthKey = `${date.getFullYear()}-${String(
                              date.getMonth() + 1
                            ).padStart(2, "0")}`;

                            if (!monthlyData[monthKey]) {
                              monthlyData[monthKey] = { inflow: 0, outflow: 0 };
                            }

                            const amount = parseFloat(transaction.amount) || 0;
                            if (transaction.type === "inflow") {
                              monthlyData[monthKey].inflow += amount;
                            } else {
                              monthlyData[monthKey].outflow += amount;
                            }
                          });

                          return Object.keys(monthlyData)
                            .sort()
                            .map((key) => {
                              const [year, month] = key.split("-");
                              const monthNames = [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec",
                              ];
                              const monthName = monthNames[parseInt(month) - 1];

                              return {
                                month: `${monthName} ${year}`,
                                inflow: monthlyData[key].inflow,
                                outflow: -monthlyData[key].outflow,
                                net:
                                  monthlyData[key].inflow -
                                  monthlyData[key].outflow,
                              };
                            });
                        })()}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => formatCurrency(Math.abs(value))}
                        />
                        <Legend />
                        <Bar dataKey="inflow" fill="#10B981" name="Inflow" />
                        <Bar dataKey="outflow" fill="#EF4444" name="Outflow" />
                        <Bar dataKey="net" fill="#3B82F6" name="Net" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4">Balance Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={(() => {
                          const monthlyData = {};

                          cashTransactions.forEach((transaction) => {
                            const date = new Date(transaction.date);
                            const monthKey = `${date.getFullYear()}-${String(
                              date.getMonth() + 1
                            ).padStart(2, "0")}`;

                            if (!monthlyData[monthKey]) {
                              monthlyData[monthKey] = { inflow: 0, outflow: 0 };
                            }

                            const amount = parseFloat(transaction.amount) || 0;
                            if (transaction.type === "inflow") {
                              monthlyData[monthKey].inflow += amount;
                            } else {
                              monthlyData[monthKey].outflow += amount;
                            }
                          });

                          let runningBalance = openingBalance;

                          return Object.keys(monthlyData)
                            .sort()
                            .map((key) => {
                              const [year, month] = key.split("-");
                              const monthNames = [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec",
                              ];
                              const monthName = monthNames[parseInt(month) - 1];

                              const inflow = monthlyData[key].inflow;
                              const outflow = monthlyData[key].outflow;
                              runningBalance =
                                runningBalance + inflow - outflow;

                              return {
                                month: `${monthName} ${year}`,
                                balance: runningBalance,
                              };
                            });
                        })()}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="balance"
                          stroke="#6366F1"
                          strokeWidth={2}
                          name="Balance"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "pipeline" && (
          <>
            <div className="max-w-6xl mx-auto mb-6">
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-3 border border-blue-200">
                  <h3 className="text-xs font-semibold text-blue-700">
                    Total Pipeline Value
                  </h3>
                  <p className="text-xl font-bold text-blue-900">
                    {formatCurrency(pipelineMetrics.totalValue)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-3 border border-purple-200">
                  <h3 className="text-xs font-semibold text-purple-700">
                    Weighted Pipeline
                  </h3>
                  <p className="text-xl font-bold text-purple-900">
                    {formatCurrency(pipelineMetrics.weightedValue)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-3 border border-green-200">
                  <h3 className="text-xs font-semibold text-green-700">
                    Closed Won Value
                  </h3>
                  <p className="text-xl font-bold text-green-900">
                    {formatCurrency(pipelineMetrics.wonValue)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow p-3 border border-amber-200">
                  <h3 className="text-xs font-semibold text-amber-700">
                    Active Deals
                  </h3>
                  <p className="text-xl font-bold text-amber-900">
                    {pipelineMetrics.activDeals}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Pipeline Tracker</h2>
                <div>
                  <button
                    onClick={handleAddDeal}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    + Add Deal
                  </button>
                </div>
              </div>

              {deals.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-600 mb-2">No deals in pipeline yet</p>
                  <p className="text-gray-500 text-sm">
                    Click "Add Deal" to start tracking your sales pipeline
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th
                          onClick={() => handleSort("clientName")}
                          className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-200"
                        >
                          <div className="flex items-center gap-1">
                            Client
                            {sortColumn === "clientName" &&
                              (sortDirection === "asc" ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              ))}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("dealName")}
                          className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-200"
                        >
                          <div className="flex items-center gap-1">
                            Deal Name
                            {sortColumn === "dealName" &&
                              (sortDirection === "asc" ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              ))}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("dealValue")}
                          className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-200"
                        >
                          <div className="flex items-center justify-end gap-1">
                            Deal Value
                            {sortColumn === "dealValue" &&
                              (sortDirection === "asc" ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              ))}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("stage")}
                          className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-200"
                        >
                          <div className="flex items-center gap-1">
                            Stage
                            {sortColumn === "stage" &&
                              (sortDirection === "asc" ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              ))}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("probability")}
                          className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-200"
                        >
                          <div className="flex items-center justify-end gap-1">
                            Probability
                            {sortColumn === "probability" &&
                              (sortDirection === "asc" ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              ))}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("weightedValue")}
                          className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-200"
                        >
                          <div className="flex items-center justify-end gap-1">
                            Weighted Value
                            {sortColumn === "weightedValue" &&
                              (sortDirection === "asc" ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              ))}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("expectedCloseDate")}
                          className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-200"
                        >
                          <div className="flex items-center gap-1">
                            Close Date
                            {sortColumn === "expectedCloseDate" &&
                              (sortDirection === "asc" ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              ))}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Revenue Breakdown
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">
                          Edit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDeals.map((deal) => {
                        const value = parseFloat(deal.dealValue) || 0;
                        const prob = parseFloat(deal.probability) || 0;
                        const weighted = (value * prob) / 100;

                        return (
                          <tr
                            key={deal.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-sm">
                              {deal.clientName}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {deal.dealName}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {formatCurrency(value)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  deal.stage === "Lead"
                                    ? "bg-gray-200 text-gray-700"
                                    : deal.stage === "Qualified"
                                    ? "bg-blue-200 text-blue-700"
                                    : deal.stage === "Proposal"
                                    ? "bg-purple-200 text-purple-700"
                                    : deal.stage === "Negotiation"
                                    ? "bg-amber-200 text-amber-700"
                                    : deal.stage === "Closed Won"
                                    ? "bg-green-200 text-green-700"
                                    : "bg-red-200 text-red-700"
                                }`}
                              >
                                {deal.stage}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {prob}%
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">
                              {formatCurrency(weighted)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {deal.expectedCloseDate || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {deal.revenueBreakdown &&
                              deal.revenueBreakdown.length > 0 ? (
                                <div className="space-y-1">
                                  {deal.revenueBreakdown.map((rev, idx) => {
                                    // Handle both old format (month: 'YYYY-MM') and new format (month: 'MM', year: 'YYYY')
                                    let monthName, year;
                                    if (rev.month && rev.year) {
                                      // New format
                                      monthName =
                                        months.find(
                                          (m) => m.value === rev.month
                                        )?.label || rev.month;
                                      year = rev.year;
                                    } else if (
                                      rev.month &&
                                      rev.month.includes("-")
                                    ) {
                                      // Old format
                                      const [y, m] = rev.month.split("-");
                                      monthName =
                                        months.find((mo) => mo.value === m)
                                          ?.label || m;
                                      year = y;
                                    } else {
                                      return null;
                                    }

                                    if (!rev.amount) return null;

                                    const amount = parseFloat(rev.amount);
                                    const prob =
                                      parseFloat(deal.probability) || 0;
                                    const weightedAmount =
                                      amount * (prob / 100);

                                    return (
                                      <div key={idx} className="text-xs">
                                        <div className="font-semibold">
                                          {monthName} {year}:
                                        </div>
                                        <div className="text-gray-600 ml-2">
                                          Full: {formatCurrency(amount)}
                                        </div>
                                        <div className="text-indigo-600 ml-2">
                                          Weighted ({prob}%):{" "}
                                          {formatCurrency(weightedAmount)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <button
                                onClick={() => handleEditDeal(deal)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pipeline Funnel Chart */}
            {deals.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
                <h2 className="text-2xl font-bold mb-6">Pipeline Funnel</h2>

                <div className="max-w-4xl mx-auto relative overflow-visible">
                  {funnelData.map((stage, index) => {
                    // Calculate width percentage based on position in funnel
                    const maxWidth = 100;
                    const minWidth = 40;
                    const widthStep =
                      (maxWidth - minWidth) / (funnelData.length - 1);
                    const width = maxWidth - widthStep * index;

                    // Get deals for this stage
                    const stageDeals = deals.filter(
                      (d) => d.stage === stage.stage
                    );

                    // Place tooltip above for bottom stages to avoid overlap (e.g., Negotiation)
                    const placeAbove = index >= funnelData.length - 2;
                    const positionClass = placeAbove
                      ? "bottom-full mb-2"
                      : "top-full mt-2";

                    return (
                      <div key={stage.stage} className="mb-2 group relative">
                        <div
                          className="mx-auto transition-all duration-300 hover:scale-105 cursor-pointer relative group-hover:z-[150]"
                          style={{ width: `${width}%` }}
                        >
                          <div
                            className={`${stage.color} rounded-lg p-4 shadow-md`}
                          >
                            <div className="flex justify-between items-center text-white">
                              <div>
                                <div className="font-bold text-lg">
                                  {stage.stage}
                                </div>
                                <div className="text-sm opacity-90">
                                  {stage.count} deal
                                  {stage.count !== 1 ? "s" : ""}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-lg">
                                  {formatCurrency(stage.value)}
                                </div>
                                <div className="text-sm opacity-90">
                                  Weighted:{" "}
                                  {formatCurrency(stage.weightedValue)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tooltip on hover */}
                          {stageDeals.length > 0 && (
                            <div
                              className={`absolute left-1/2 -translate-x-1/2 ${positionClass} opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[1000] pointer-events-none`}
                            >
                              <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-4 min-w-[300px] max-w-[90vw] border border-gray-700">
                                <div className="font-bold text-sm mb-2 border-b border-gray-700 pb-2">
                                  {stage.stage} - Deals Breakdown
                                </div>
                                <div className="space-y-2">
                                  {stageDeals.map((deal) => (
                                    <div key={deal.id} className="text-xs py-1">
                                      <div className="font-semibold text-gray-200">
                                        {deal.clientName}
                                      </div>
                                      <div className="text-gray-400 ml-2">
                                        {deal.dealName}:{" "}
                                        <span className="text-white font-semibold">
                                          {formatCurrency(
                                            parseFloat(deal.dealValue) || 0
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Funnel Summary */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-sm text-gray-600 mb-1">
                      Total Pipeline Value
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(
                        funnelData.reduce((sum, s) => sum + s.value, 0)
                      )}
                    </div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4 text-center">
                    <div className="text-sm text-indigo-600 mb-1">
                      Weighted Pipeline
                    </div>
                    <div className="text-2xl font-bold text-indigo-900">
                      {formatCurrency(
                        funnelData.reduce((sum, s) => sum + s.weightedValue, 0)
                      )}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-sm text-green-600 mb-1">
                      Conversion Rate
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {(() => {
                        const totalDeals = funnelData.reduce(
                          (sum, s) => sum + s.count,
                          0
                        );
                        const wonDeals =
                          funnelData.find((s) => s.stage === "Closed Won")
                            ?.count || 0;
                        return totalDeals > 0
                          ? `${((wonDeals / totalDeals) * 100).toFixed(1)}%`
                          : "0%";
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Revenue Bar Chart */}
            {monthlyRevenue.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
                <h2 className="text-2xl font-bold mb-6">
                  Expected Revenue by Month
                </h2>

                <div className="space-y-3">
                  {monthlyRevenue.map((monthData) => {
                    const maxValue = Math.max(
                      ...monthlyRevenue.map((m) => m.full)
                    );
                    const fullWidth =
                      maxValue > 0 ? (monthData.full / maxValue) * 100 : 0;
                    const weightedWidth =
                      maxValue > 0 ? (monthData.weighted / maxValue) * 100 : 0;

                    return (
                      <div key={monthData.key} className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-700 w-24">
                            {monthData.label}
                          </span>
                          <div className="flex gap-4 text-xs text-gray-600">
                            <span>Full: {formatCurrency(monthData.full)}</span>
                            <span>
                              Weighted: {formatCurrency(monthData.weighted)}
                            </span>
                          </div>
                        </div>

                        <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                          {/* Full Revenue Bar (lighter) */}
                          <div
                            className="absolute top-0 left-0 h-full bg-indigo-200 transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${fullWidth}%` }}
                          >
                            {fullWidth > 15 && (
                              <span className="text-xs font-semibold text-indigo-800">
                                {formatCurrency(monthData.full)}
                              </span>
                            )}
                          </div>

                          {/* Weighted Revenue Bar (darker) */}
                          <div
                            className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${weightedWidth}%` }}
                          >
                            {weightedWidth > 15 && (
                              <span className="text-xs font-semibold text-white">
                                {formatCurrency(monthData.weighted)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-6 flex justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-indigo-200 rounded"></div>
                    <span className="text-gray-700">Full Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-indigo-500 rounded"></div>
                    <span className="text-gray-700">
                      Weighted Revenue (by probability)
                    </span>
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 rounded-lg p-4 text-center">
                    <div className="text-sm text-indigo-600 mb-1">
                      Total Expected Revenue
                    </div>
                    <div className="text-2xl font-bold text-indigo-900">
                      {formatCurrency(
                        monthlyRevenue.reduce((sum, m) => sum + m.full, 0)
                      )}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-sm text-purple-600 mb-1">
                      Total Weighted Revenue
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {formatCurrency(
                        monthlyRevenue.reduce((sum, m) => sum + m.weighted, 0)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "projects" && (
          <>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Project Tracker</h2>
                <button
                  onClick={() => {
                    setEditingProject(null);
                    setNewProject({
                      date: new Date().toISOString().split("T")[0],
                      clientProject: "",
                      projectNumber: "",
                      valueQuoted: "",
                      quotedCurrency: "USD",
                      valueSGD: "",
                      numberOfStudies: "",
                      purchaseOrder: "",
                      fieldWorkStatus: "Not Started",
                      fieldWorkStartDate: "",
                      fieldWorkEndDate: "",
                      reportStatus: "Not Started",
                      invoiceStatus: "Not Issued",
                      invoiceDate: "",
                    });
                    setShowProjectModal(true);
                  }}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  + Add Project
                </button>
              </div>

              {/* Monthly Tabs */}
              {projects.length > 0 && (
                <div className="mb-6">
                  <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-2">
                    <button
                      onClick={() => setSelectedProjectMonth("all")}
                      className={`px-4 py-2 font-semibold whitespace-nowrap transition-colors rounded-t-lg ${
                        selectedProjectMonth === "all"
                          ? "bg-indigo-600 text-white"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                      }`}
                    >
                      All Projects
                    </button>
                    {(() => {
                      // Get unique months from projects
                      const monthsSet = new Set();
                      projects.forEach((project) => {
                        if (project.date) {
                          const date = new Date(project.date);
                          const monthKey = `${date.getFullYear()}-${String(
                            date.getMonth() + 1
                          ).padStart(2, "0")}`;
                          monthsSet.add(monthKey);
                        }
                      });

                      const sortedMonths = Array.from(monthsSet).sort();
                      const monthNames = [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ];

                      return sortedMonths.map((monthKey) => {
                        const [year, month] = monthKey.split("-");
                        const monthName = monthNames[parseInt(month) - 1];
                        const monthProjects = projects.filter((p) => {
                          if (!p.date) return false;
                          const date = new Date(p.date);
                          const pMonthKey = `${date.getFullYear()}-${String(
                            date.getMonth() + 1
                          ).padStart(2, "0")}`;
                          return pMonthKey === monthKey;
                        });

                        return (
                          <button
                            key={monthKey}
                            onClick={() => setSelectedProjectMonth(monthKey)}
                            className={`px-4 py-2 font-semibold whitespace-nowrap transition-colors rounded-t-lg ${
                              selectedProjectMonth === monthKey
                                ? "bg-indigo-600 text-white"
                                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            }`}
                          >
                            {monthName} {year} ({monthProjects.length})
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {projects.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-600 mb-2">No projects yet</p>
                  <p className="text-gray-500 text-sm">
                    Click "Add Project" to start tracking projects
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b text-xs">
                        <th className="px-3 py-2 text-left font-semibold">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Client/Project
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Project #
                        </th>
                        <th className="px-3 py-2 text-right font-semibold">
                          Value
                        </th>
                        <th className="px-3 py-2 text-center font-semibold">
                          # Studies
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          PO
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Field Work
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          FW Dates
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Report
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Invoice
                        </th>
                        <th className="px-3 py-2 text-center font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Filter projects by selected month
                        let filteredProjects = projects;
                        if (selectedProjectMonth !== "all") {
                          filteredProjects = projects.filter((p) => {
                            if (!p.date) return false;
                            const date = new Date(p.date);
                            const monthKey = `${date.getFullYear()}-${String(
                              date.getMonth() + 1
                            ).padStart(2, "0")}`;
                            return monthKey === selectedProjectMonth;
                          });
                        }

                        if (filteredProjects.length === 0) {
                          return (
                            <tr>
                              <td
                                colSpan="11"
                                className="px-3 py-8 text-center text-gray-500"
                              >
                                No projects for this month
                              </td>
                            </tr>
                          );
                        }

                        return filteredProjects.map((project) => (
                          <tr
                            key={project.id}
                            className="border-b hover:bg-gray-50 text-sm"
                          >
                            <td className="px-3 py-2">{project.date}</td>
                            <td className="px-3 py-2 font-semibold">
                              {project.clientProject}
                            </td>
                            <td className="px-3 py-2">
                              {project.projectNumber}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="text-xs text-gray-600">
                                {project.quotedCurrency} {project.valueQuoted}
                              </div>
                              <div className="font-semibold">
                                {formatCurrency(
                                  parseFloat(project.valueSGD) || 0
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {project.numberOfStudies}
                            </td>
                            <td className="px-3 py-2">
                              {project.purchaseOrder || "-"}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  project.fieldWorkStatus === "Completed"
                                    ? "bg-green-200 text-green-700"
                                    : project.fieldWorkStatus === "In Progress"
                                    ? "bg-amber-200 text-amber-700"
                                    : project.fieldWorkStatus === "Pending"
                                    ? "bg-blue-200 text-blue-700"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {project.fieldWorkStatus}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {project.fieldWorkStartDate &&
                              project.fieldWorkEndDate ? (
                                <div>
                                  <div>{project.fieldWorkStartDate}</div>
                                  <div>{project.fieldWorkEndDate}</div>
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  project.reportStatus === "Completed"
                                    ? "bg-green-200 text-green-700"
                                    : project.reportStatus === "In Progress"
                                    ? "bg-amber-200 text-amber-700"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {project.reportStatus}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    project.invoiceStatus === "Paid"
                                      ? "bg-green-200 text-green-700"
                                      : project.invoiceStatus === "Issued"
                                      ? "bg-blue-200 text-blue-700"
                                      : "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  {project.invoiceStatus}
                                </span>
                                {project.invoiceDate && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {project.invoiceDate}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => {
                                  setEditingProject(project);
                                  setNewProject(project);
                                  setShowProjectModal(true);
                                }}
                                className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "projectcosts" && (
          <>
            <div className="max-w-6xl mx-auto mb-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-4 border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-700">
                    Total Project Revenue
                  </h3>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(
                      projectCosts.reduce(
                        (sum, p) => sum + (parseFloat(p.projectRevenue) || 0),
                        0
                      )
                    )}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-4 border border-purple-200">
                  <h3 className="text-sm font-semibold text-purple-700">
                    Total Project Costs
                  </h3>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(
                      projectCosts.reduce(
                        (sum, p) => sum + (parseFloat(p.totalAmountSGD) || 0),
                        0
                      )
                    )}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow p-4 border border-amber-200">
                  <h3 className="text-sm font-semibold text-amber-700">
                    Project Costs %
                  </h3>
                  <p className="text-2xl font-bold text-amber-900">
                    {(() => {
                      const totalRevenue = projectCosts.reduce(
                        (sum, p) => sum + (parseFloat(p.projectRevenue) || 0),
                        0
                      );
                      const totalCosts = projectCosts.reduce(
                        (sum, p) => sum + (parseFloat(p.totalAmountSGD) || 0),
                        0
                      );
                      const percentage =
                        totalRevenue > 0
                          ? (totalCosts / totalRevenue) * 100
                          : 0;
                      return `${percentage.toFixed(1)}%`;
                    })()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Project Costs Tracking</h2>
                <button
                  onClick={() => {
                    const today = new Date();
                    const monthYear = `${today.toLocaleString("default", {
                      month: "long",
                    })} / ${today.getFullYear()}`;
                    setEditingProjectCost(null);
                    setNewProjectCost({
                      monthYear: monthYear,
                      projectName: "",
                      client: "",
                      market: "",
                      baseAmountUSD: "",
                      dataUSD: "",
                      totalAmountUSD: "",
                      baseAmountSGD: "",
                      dataSGD: "",
                      totalAmountSGD: "",
                      projectRevenue: "",
                      costPercentage: "",
                      status: "Pending",
                    });
                    setShowProjectCostModal(true);
                  }}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  + Add Project Cost
                </button>
              </div>

              {/* Monthly Tabs */}
              {projectCosts.length > 0 && (
                <div className="mb-6">
                  <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-2">
                    <button
                      onClick={() => setSelectedCostMonth("all")}
                      className={`px-4 py-2 font-semibold whitespace-nowrap transition-colors rounded-t-lg ${
                        selectedCostMonth === "all"
                          ? "bg-indigo-600 text-white"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                      }`}
                    >
                      All Months
                    </button>
                    {(() => {
                      // Get unique months from project costs
                      const monthsSet = new Set();
                      projectCosts.forEach((pc) => {
                        if (pc.monthYear) {
                          monthsSet.add(pc.monthYear);
                        }
                      });

                      const sortedMonths = Array.from(monthsSet).sort(
                        (a, b) => {
                          const [monthA, yearA] = a.split(" / ");
                          const [monthB, yearB] = b.split(" / ");
                          const dateA = new Date(`${monthA} 1, ${yearA}`);
                          const dateB = new Date(`${monthB} 1, ${yearB}`);
                          return dateA - dateB;
                        }
                      );

                      return sortedMonths.map((monthKey) => {
                        const monthProjects = projectCosts.filter(
                          (pc) => pc.monthYear === monthKey
                        );

                        return (
                          <button
                            key={monthKey}
                            onClick={() => setSelectedCostMonth(monthKey)}
                            className={`px-4 py-2 font-semibold whitespace-nowrap transition-colors rounded-t-lg ${
                              selectedCostMonth === monthKey
                                ? "bg-indigo-600 text-white"
                                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            }`}
                          >
                            {monthKey} ({monthProjects.length})
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {projectCosts.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-600 mb-2">
                    No project costs tracked yet
                  </p>
                  <p className="text-gray-500 text-sm">
                    Click "Add Project Cost" to start tracking
                  </p>
                </div>
              ) : (
                <>
                  {/* Monthly Summary and Table */}
                  {(() => {
                    // Filter projects by selected month
                    let filteredProjects = projectCosts;
                    if (selectedCostMonth !== "all") {
                      filteredProjects = projectCosts.filter(
                        (pc) => pc.monthYear === selectedCostMonth
                      );
                    }

                    // Group by month for display
                    const groupedByMonth = {};
                    filteredProjects.forEach((pc) => {
                      if (!groupedByMonth[pc.monthYear]) {
                        groupedByMonth[pc.monthYear] = [];
                      }
                      groupedByMonth[pc.monthYear].push(pc);
                    });

                    const sortedMonths = Object.keys(groupedByMonth).sort(
                      (a, b) => {
                        const [monthA, yearA] = a.split(" / ");
                        const [monthB, yearB] = b.split(" / ");
                        const dateA = new Date(`${monthA} 1, ${yearA}`);
                        const dateB = new Date(`${monthB} 1, ${yearB}`);
                        return dateA - dateB;
                      }
                    );

                    return sortedMonths.map((month) => {
                      const monthProjects = groupedByMonth[month];

                      // Calculate totals
                      const totalUSD = monthProjects.reduce(
                        (sum, p) => sum + (parseFloat(p.totalAmountUSD) || 0),
                        0
                      );
                      const totalSGD = monthProjects.reduce(
                        (sum, p) => sum + (parseFloat(p.totalAmountSGD) || 0),
                        0
                      );
                      const totalRevenue = monthProjects.reduce(
                        (sum, p) => sum + (parseFloat(p.projectRevenue) || 0),
                        0
                      );
                      const avgCost =
                        totalRevenue > 0 ? (totalSGD / totalRevenue) * 100 : 0;

                      return (
                        <div key={month} className="mb-8">
                          {/* Month Header with Totals */}
                          <div className="bg-indigo-100 rounded-lg p-4 mb-4">
                            <div className="flex justify-between items-center">
                              <h3 className="text-xl font-bold text-indigo-900">
                                {month}
                              </h3>
                              <div className="flex gap-6 text-sm">
                                <div>
                                  <span className="text-indigo-700 font-semibold">
                                    Grand Total (USD):{" "}
                                  </span>
                                  <span className="text-indigo-900 font-bold">
                                    {formatCurrency(totalUSD)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-indigo-700 font-semibold">
                                    Grand Total (SGD):{" "}
                                  </span>
                                  <span className="text-indigo-900 font-bold">
                                    {formatCurrency(totalSGD)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-indigo-700 font-semibold">
                                    Project Revenue:{" "}
                                  </span>
                                  <span className="text-indigo-900 font-bold">
                                    {formatCurrency(totalRevenue)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-indigo-700 font-semibold">
                                    Avg Cost:{" "}
                                  </span>
                                  <span className="text-indigo-900 font-bold">
                                    {avgCost.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Projects Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-gray-100 border-b text-xs">
                                  <th className="px-3 py-2 text-left font-semibold">
                                    Project Name
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold">
                                    Client
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold">
                                    Market
                                  </th>
                                  <th className="px-3 py-2 text-right font-semibold">
                                    Base (USD)
                                  </th>
                                  <th className="px-3 py-2 text-right font-semibold">
                                    Data (USD)
                                  </th>
                                  <th className="px-3 py-2 text-right font-semibold">
                                    Total (USD)
                                  </th>
                                  <th className="px-3 py-2 text-right font-semibold">
                                    Base (SGD)
                                  </th>
                                  <th className="px-3 py-2 text-right font-semibold">
                                    Data (SGD)
                                  </th>
                                  <th className="px-3 py-2 text-right font-semibold">
                                    Total (SGD)
                                  </th>
                                  <th className="px-3 py-2 text-right font-semibold">
                                    Revenue
                                  </th>
                                  <th className="px-3 py-2 text-center font-semibold">
                                    Cost %
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold">
                                    Status
                                  </th>
                                  <th className="px-3 py-2 text-center font-semibold">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {monthProjects.map((project) => (
                                  <tr
                                    key={project.id}
                                    className="border-b hover:bg-gray-50 text-sm"
                                  >
                                    <td className="px-3 py-2 font-semibold">
                                      {project.projectName}
                                    </td>
                                    <td className="px-3 py-2">
                                      {project.client}
                                    </td>
                                    <td className="px-3 py-2">
                                      {project.market}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {parseFloat(
                                        project.baseAmountUSD || 0
                                      ).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {parseFloat(project.dataUSD || 0).toFixed(
                                        2
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold">
                                      {parseFloat(
                                        project.totalAmountUSD || 0
                                      ).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {parseFloat(
                                        project.baseAmountSGD || 0
                                      ).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {parseFloat(project.dataSGD || 0).toFixed(
                                        2
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold">
                                      {parseFloat(
                                        project.totalAmountSGD || 0
                                      ).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold">
                                      {formatCurrency(
                                        parseFloat(project.projectRevenue || 0)
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                          parseFloat(
                                            project.costPercentage || 0
                                          ) > 50
                                            ? "bg-red-200 text-red-700"
                                            : parseFloat(
                                                project.costPercentage || 0
                                              ) > 30
                                            ? "bg-amber-200 text-amber-700"
                                            : "bg-green-200 text-green-700"
                                        }`}
                                      >
                                        {project.costPercentage}%
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                          project.status === "Paid"
                                            ? "bg-green-200 text-green-700"
                                            : project.status === "Invoiced"
                                            ? "bg-blue-200 text-blue-700"
                                            : project.status === "N.A."
                                            ? "bg-gray-200 text-gray-700"
                                            : "bg-amber-200 text-amber-700"
                                        }`}
                                      >
                                        {project.status}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <button
                                        onClick={() => {
                                          setEditingProjectCost(project);
                                          setNewProjectCost(project);
                                          setShowProjectCostModal(true);
                                        }}
                                        className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium"
                                      >
                                        Edit
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </>
              )}
            </div>
          </>
        )}

        {activeTab === "sankey" && (
          <>
            {/* Data Info - SGD and USD transactions managed by admin */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">
                  Bank Transaction Data
                </h3>
              </div>
              <p className="text-sm text-blue-800 mb-2">
                SGD and USD bank transaction data is managed by the
                administrator through the Data Management page.
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  •{" "}
                  {bankTransactions.length > 0
                    ? `✓ SGD transactions loaded (${bankTransactions.length} transactions)`
                    : "⚠️ No SGD transaction data available"}
                </li>
                <li>
                  •{" "}
                  {usdTransactions.length > 0
                    ? `✓ USD transactions loaded (${usdTransactions.length} transactions)`
                    : "⚠️ No USD transaction data available"}
                </li>
                <li>
                  • Contact your administrator to upload or update bank
                  statement files
                </li>
              </ul>
            </div>
            {/* OLD UPLOAD UI REMOVED - Now managed by admin in data page */}
            <div className="hidden">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold mb-4">SGD</h2>
                <p className="text-gray-600 mb-2 text-sm">
                  Upload your bank statement CSV file to visualize cashflow
                  patterns.
                  <strong> Row 2 must contain opening balance.</strong>
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Row 2: Debit (Source) = positive balance | Credit (Source) =
                  negative balance
                </p>

                <div>
                  <div
                    className={`bg-white rounded-xl shadow-lg p-4 border-2 ${
                      bankTransactionsFile
                        ? "border-green-400"
                        : "border-gray-200"
                    } mb-4`}
                  >
                    {!bankTransactionsFile ? (
                      <label className="cursor-pointer block">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleBankTransactionsUpload}
                          className="hidden"
                        />
                        <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 text-center hover:bg-indigo-50">
                          <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-600">Upload CSV</p>
                          <p className="text-xs text-indigo-600 mt-1 font-semibold">
                            Debit = Inflow | Credit = Outflow
                          </p>
                        </div>
                      </label>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <p className="text-sm font-medium flex-1">
                          {bankTransactionsFile.name}
                        </p>
                        <button onClick={() => setBankTransactionsFile(null)}>
                          <X className="w-5 h-5 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>

                  {bankTransactionsStatus && (
                    <div
                      className={`rounded-lg p-4 mb-4 flex items-center gap-3 ${
                        bankTransactionsStatus.type === "success"
                          ? "bg-green-50"
                          : bankTransactionsStatus.type === "error"
                          ? "bg-red-50"
                          : "bg-blue-50"
                      }`}
                    >
                      {bankTransactionsStatus.type === "success" && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {bankTransactionsStatus.type === "error" && (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      {bankTransactionsStatus.type === "info" && (
                        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                      )}
                      <p className="text-sm font-medium">
                        {bankTransactionsStatus.message}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleProcessBankTransactions}
                    disabled={
                      processingBankTransactions || !bankTransactionsFile
                    }
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 mb-4 text-sm"
                  >
                    {processingBankTransactions
                      ? "Processing..."
                      : "Import Transactions"}
                  </button>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h3 className="text-xs font-semibold text-blue-900 mb-2">
                      💡 CSV Format
                    </h3>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>
                        • <strong>Row 1:</strong> Headers (Date, Description,
                        Debit, Credit)
                      </li>
                      <li>
                        • <strong>Row 2:</strong> Opening Balance
                      </li>
                      <li>
                        • <strong>Row 3+:</strong> Transactions
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* USD Upload Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold mb-4">USD</h2>
                <p className="text-gray-600 mb-2 text-sm">
                  Upload your bank statement CSV file to visualize cashflow
                  patterns.
                  <strong> Row 2 must contain opening balance.</strong>
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Row 2: Debit (Source) = positive balance | Credit (Source) =
                  negative balance
                </p>

                <div>
                  <div
                    className={`bg-white rounded-xl shadow-lg p-4 border-2 ${
                      usdTransactionsFile
                        ? "border-green-400"
                        : "border-gray-200"
                    } mb-4`}
                  >
                    {!usdTransactionsFile ? (
                      <label className="cursor-pointer block">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleUsdTransactionsUpload}
                          className="hidden"
                        />
                        <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 text-center hover:bg-indigo-50">
                          <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-600">Upload CSV</p>
                          <p className="text-xs text-indigo-600 mt-1 font-semibold">
                            Debit = Inflow | Credit = Outflow
                          </p>
                        </div>
                      </label>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <p className="text-sm font-medium flex-1">
                          {usdTransactionsFile.name}
                        </p>
                        <button onClick={() => setUsdTransactionsFile(null)}>
                          <X className="w-5 h-5 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>

                  {usdTransactionsStatus && (
                    <div
                      className={`rounded-lg p-4 mb-4 flex items-center gap-3 ${
                        usdTransactionsStatus.type === "success"
                          ? "bg-green-50"
                          : usdTransactionsStatus.type === "error"
                          ? "bg-red-50"
                          : "bg-blue-50"
                      }`}
                    >
                      {usdTransactionsStatus.type === "success" && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {usdTransactionsStatus.type === "error" && (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      {usdTransactionsStatus.type === "info" && (
                        <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                      )}
                      <p className="text-sm font-medium">
                        {usdTransactionsStatus.message}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleProcessUsdTransactions}
                    disabled={processingUsdTransactions || !usdTransactionsFile}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 mb-4 text-sm"
                  >
                    {processingUsdTransactions
                      ? "Processing..."
                      : "Import Transactions"}
                  </button>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h3 className="text-xs font-semibold text-blue-900 mb-2">
                      💡 CSV Format
                    </h3>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>
                        • <strong>Row 1:</strong> Headers (Date, Description,
                        Debit, Credit)
                      </li>
                      <li>
                        • <strong>Row 2:</strong> Opening Balance
                      </li>
                      <li>
                        • <strong>Row 3+:</strong> Transactions
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>{" "}
            {/* End hidden old upload UI */}
            {usdTransactions.length > 0 && (
              <>
                {/* Summary Cards */}
                <div className="max-w-6xl mx-auto mb-6">
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-3 border border-blue-200">
                      <h3 className="text-xs font-semibold text-blue-700 mb-1">
                        Opening Balance (USD)
                      </h3>
                      <input
                        type="number"
                        value={usdOpeningBalance}
                        onChange={(e) =>
                          setUsdOpeningBalance(parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-xl font-bold text-blue-900 bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-500 px-1"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        Click to edit
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-3 border border-green-200">
                      <h3 className="text-xs font-semibold text-green-700">
                        Total Inflows
                      </h3>
                      <p className="text-xl font-bold text-green-900">
                        {formatCurrency(
                          usdTransactions
                            .filter((t) => t.type === "inflow")
                            .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                        )}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-3 border border-red-200">
                      <h3 className="text-xs font-semibold text-red-700">
                        Total Outflows
                      </h3>
                      <p className="text-xl font-bold text-red-900">
                        {formatCurrency(
                          usdTransactions
                            .filter((t) => t.type === "outflow")
                            .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                        )}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-3 border border-purple-200">
                      <h3 className="text-xs font-semibold text-purple-700">
                        Closing Balance
                      </h3>
                      <p className="text-xl font-bold text-purple-900">
                        {formatCurrency(
                          usdOpeningBalance +
                            usdTransactions
                              .filter((t) => t.type === "inflow")
                              .reduce(
                                (sum, t) => sum + parseFloat(t.amount),
                                0
                              ) -
                            usdTransactions
                              .filter((t) => t.type === "outflow")
                              .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
            {bankTransactions.length > 0 && (
              <>
                {/* Summary Cards */}
                <div className="max-w-6xl mx-auto mb-6">
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-3 border border-blue-200">
                      <h3 className="text-xs font-semibold text-blue-700 mb-1">
                        Opening Balance (SGD)
                      </h3>
                      <input
                        type="number"
                        value={bankOpeningBalance}
                        onChange={(e) =>
                          setBankOpeningBalance(parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-xl font-bold text-blue-900 bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-500 px-1"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        Click to edit
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-3 border border-green-200">
                      <h3 className="text-xs font-semibold text-green-700">
                        Total Inflows
                      </h3>
                      <p className="text-xl font-bold text-green-900">
                        {formatCurrency(
                          bankTransactions
                            .filter((t) => t.type === "inflow")
                            .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                        )}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-3 border border-red-200">
                      <h3 className="text-xs font-semibold text-red-700">
                        Total Outflows
                      </h3>
                      <p className="text-xl font-bold text-red-900">
                        {formatCurrency(
                          bankTransactions
                            .filter((t) => t.type === "outflow")
                            .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                        )}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-3 border border-purple-200">
                      <h3 className="text-xs font-semibold text-purple-700">
                        Closing Balance
                      </h3>
                      <p className="text-xl font-bold text-purple-900">
                        {formatCurrency(
                          bankOpeningBalance +
                            bankTransactions
                              .filter((t) => t.type === "inflow")
                              .reduce(
                                (sum, t) => sum + parseFloat(t.amount),
                                0
                              ) -
                            bankTransactions
                              .filter((t) => t.type === "outflow")
                              .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {selectedSankeyAccount === "Combined"
                    ? "Combined view in SGD"
                    : `${selectedSankeyAccount} Account`}
                </h2>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700">
                    View Account:
                  </label>
                  <select
                    value={selectedSankeyAccount}
                    onChange={(e) => setSelectedSankeyAccount(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SGD">SGD Account</option>
                    <option value="USD">USD Account</option>
                    <option value="Combined">Combined SGD</option>
                  </select>
                </div>
              </div>

              {(() => {
                let currentTransactions = [];
                let currentOpeningBalance = 0;

                if (selectedSankeyAccount === "SGD") {
                  currentTransactions = bankTransactions;
                  currentOpeningBalance = bankOpeningBalance;
                } else if (selectedSankeyAccount === "USD") {
                  currentTransactions = usdTransactions;
                  currentOpeningBalance = usdOpeningBalance;
                } else if (selectedSankeyAccount === "Combined") {
                  // Combine both SGD and USD transactions
                  // For SGD transactions, use amount directly
                  // For USD transactions, use amountSGD
                  currentTransactions = [
                    ...bankTransactions.map((t) => ({
                      ...t,
                      effectiveAmount: t.amount,
                      source: "SGD",
                    })),
                    ...usdTransactions.map((t) => ({
                      ...t,
                      effectiveAmount: t.amountSGD || t.amount,
                      source: "USD",
                    })),
                  ];
                  // For combined balance, use SGD balance + USD balance in SGD equivalent
                  currentOpeningBalance =
                    bankOpeningBalance + usdOpeningBalanceSGD;
                }

                if (!currentTransactions || currentTransactions.length === 0) {
                  return (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-gray-600 mb-2">
                        No data available for{" "}
                        {selectedSankeyAccount === "Combined"
                          ? "combined"
                          : selectedSankeyAccount}{" "}
                        account
                      </p>
                      <p className="text-gray-500 text-sm">
                        Please upload and process bank transactions CSV files
                        above
                      </p>
                    </div>
                  );
                }

                return (
                  <>
                    <p className="text-gray-600 mb-6">
                      This diagram shows how cash flows through your{" "}
                      {selectedSankeyAccount === "Combined"
                        ? "combined SGD and USD (in SGD equivalent)"
                        : selectedSankeyAccount}{" "}
                      bank account
                      {selectedSankeyAccount === "Combined" ? "s" : ""}. Inflows
                      are grouped by category, then flow into a central pool.
                      Outflows are first grouped by category (like Salary,
                      Operating Expenses), then branched out to individual
                      contacts/payees within each category.
                    </p>

                    <div
                      className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 overflow-x-auto"
                      style={{ minHeight: "800px" }}
                    >
                      {(() => {
                        // Group transactions by category and contact
                        const inflowByCategory = {};
                        const outflowByCategory = {};

                        currentTransactions.forEach((transaction) => {
                          const type = transaction.type;
                          const category =
                            transaction.category || "Uncategorized";
                          const contact =
                            transaction.contact || transaction.description;
                          // Use effectiveAmount for combined view, otherwise use amount
                          const amount =
                            parseFloat(
                              transaction.effectiveAmount || transaction.amount
                            ) || 0;

                          if (type === "inflow") {
                            if (!inflowByCategory[category]) {
                              inflowByCategory[category] = {
                                total: 0,
                                items: [],
                              };
                            }
                            inflowByCategory[category].total += amount;
                            inflowByCategory[category].items.push({
                              contact,
                              amount,
                            });
                          } else {
                            if (!outflowByCategory[category]) {
                              outflowByCategory[category] = {
                                total: 0,
                                contacts: {},
                              };
                            }
                            outflowByCategory[category].total += amount;

                            if (
                              !outflowByCategory[category].contacts[contact]
                            ) {
                              outflowByCategory[category].contacts[contact] = 0;
                            }
                            outflowByCategory[category].contacts[contact] +=
                              amount;
                          }
                        });

                        const totalInflows = Object.values(
                          inflowByCategory
                        ).reduce((sum, cat) => sum + cat.total, 0);
                        const totalOutflows = Object.values(
                          outflowByCategory
                        ).reduce((sum, cat) => sum + cat.total, 0);
                        const netCashflow = totalInflows - totalOutflows;
                        const closingBalance =
                          currentOpeningBalance + netCashflow;

                        // Debug logging
                        console.log("💰 Sankey Calculations:", {
                          openingBalance: currentOpeningBalance,
                          totalInflows,
                          totalOutflows,
                          netCashflow,
                          closingBalance,
                          transactionCount: currentTransactions.length,
                        });

                        // Sort categories by amount
                        const sortedInflowCategories = Object.entries(
                          inflowByCategory
                        ).sort((a, b) => b[1].total - a[1].total);
                        const sortedOutflowCategories = Object.entries(
                          outflowByCategory
                        ).sort((a, b) => b[1].total - a[1].total);

                        return (
                          <div className="w-full max-w-full overflow-x-auto">
                            {/* Horizontal Layout - No wrapping */}
                            <div
                              className="flex items-start gap-4 lg:gap-8"
                              style={{ minWidth: "1200px" }}
                            >
                              {/* Column 1: Opening Balance & Inflow Sources */}
                              <div className="flex flex-col gap-4 min-w-[180px] flex-shrink-0">
                                {/* Opening Balance */}
                                <div className="bg-blue-500 text-white rounded-lg px-4 py-3 shadow-lg">
                                  <div className="text-xs font-semibold">
                                    Opening Balance
                                  </div>
                                  <div className="text-xl font-bold">
                                    {formatCurrency(currentOpeningBalance)}
                                  </div>
                                </div>

                                {/* Inflow Sources */}
                                <div className="space-y-2">
                                  <h3 className="text-sm font-bold text-gray-700">
                                    Cash Inflows
                                  </h3>
                                  {sortedInflowCategories.map(
                                    ([category, data]) => {
                                      const percentage =
                                        totalInflows > 0
                                          ? (
                                              (data.total / totalInflows) *
                                              100
                                            ).toFixed(1)
                                          : 0;
                                      return (
                                        <div
                                          key={category}
                                          className="bg-blue-100 border-l-4 border-blue-500 rounded px-3 py-2 shadow-sm"
                                        >
                                          <div
                                            className="text-xs font-semibold text-blue-900 truncate"
                                            title={category}
                                          >
                                            {category}
                                          </div>
                                          <div className="text-sm font-bold text-blue-900">
                                            {formatCurrency(data.total)}
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>

                              {/* Visual Flow Connector */}
                              <div className="flex items-center min-w-[50px] flex-shrink-0">
                                <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                                <div className="w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-indigo-500"></div>
                              </div>

                              {/* Column 2: Total Inflows Hub */}
                              <div className="min-w-[160px] flex-shrink-0">
                                <div className="bg-indigo-500 text-white rounded-lg px-6 py-4 shadow-xl">
                                  <div className="text-xs font-semibold">
                                    Total Inflows
                                  </div>
                                  <div className="text-2xl font-bold">
                                    {formatCurrency(totalInflows)}
                                  </div>
                                </div>
                              </div>

                              {/* Visual Flow Connector */}
                              <div className="flex items-center min-w-[50px] flex-shrink-0">
                                <div className="w-12 h-1 bg-gradient-to-r from-indigo-500 to-orange-400"></div>
                                <div className="w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-orange-400"></div>
                              </div>

                              {/* Column 3: Expense Categories */}
                              <div className="flex flex-col gap-3 min-w-[200px] flex-shrink-0">
                                <h3 className="text-sm font-bold text-gray-700">
                                  Expense Categories
                                </h3>
                                {sortedOutflowCategories.map(
                                  ([category, data]) => {
                                    const categoryPercentage =
                                      totalOutflows > 0
                                        ? (
                                            (data.total / totalOutflows) *
                                            100
                                          ).toFixed(1)
                                        : 0;

                                    return (
                                      <div
                                        key={category}
                                        className="bg-gradient-to-r from-orange-100 to-green-100 border-l-4 border-orange-500 rounded px-3 py-2 shadow-sm"
                                      >
                                        <div
                                          className="text-xs font-semibold text-gray-900 truncate"
                                          title={category}
                                        >
                                          {category}
                                        </div>
                                        <div className="text-sm font-bold text-gray-900">
                                          {formatCurrency(data.total)}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          {categoryPercentage}%
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>

                              {/* Visual Flow Connector */}
                              <div className="flex items-center min-w-[50px] flex-shrink-0">
                                <div className="w-12 h-1 bg-gradient-to-r from-green-400 to-purple-400"></div>
                                <div className="w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-purple-400"></div>
                              </div>

                              {/* Column 4: Individual Contacts/Payees */}
                              <div className="min-w-[300px] flex-shrink-0">
                                <h3 className="text-sm font-bold text-gray-700 mb-3">
                                  Individual Payees/Recipients
                                </h3>
                                <div className="space-y-3">
                                  {sortedOutflowCategories.map(
                                    ([category, data]) => {
                                      const sortedContacts = Object.entries(
                                        data.contacts
                                      ).sort((a, b) => b[1] - a[1]);

                                      return (
                                        <div
                                          key={category}
                                          className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                                        >
                                          <div className="text-xs font-bold text-gray-700 mb-2 pb-1 border-b border-gray-300">
                                            {category}
                                          </div>
                                          <div className="grid grid-cols-2 gap-2">
                                            {sortedContacts.map(
                                              ([contact, amount]) => {
                                                const categoryTotal =
                                                  data.total;
                                                const percentage =
                                                  categoryTotal > 0
                                                    ? (
                                                        (amount /
                                                          categoryTotal) *
                                                        100
                                                      ).toFixed(1)
                                                    : 0;
                                                return (
                                                  <div
                                                    key={contact}
                                                    className="bg-purple-50 border border-purple-200 rounded px-2 py-1"
                                                  >
                                                    <div
                                                      className="text-xs font-semibold text-purple-900 truncate"
                                                      title={contact}
                                                    >
                                                      {contact}
                                                    </div>
                                                    <div className="text-xs font-bold text-purple-900">
                                                      {formatCurrency(amount)}
                                                    </div>
                                                    <div className="text-xs text-purple-700">
                                                      {percentage}%
                                                    </div>
                                                  </div>
                                                );
                                              }
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Bottom Section: Closing Balance */}
                            <div className="mt-8 pt-6 border-t-2 border-gray-300">
                              <div className="flex justify-between items-center">
                                <div
                                  className={`${
                                    closingBalance >= 0
                                      ? "bg-purple-500"
                                      : "bg-red-600"
                                  } text-white rounded-xl px-8 py-4 shadow-xl`}
                                >
                                  <div className="text-sm font-semibold">
                                    Closing Balance
                                  </div>
                                  <div className="text-3xl font-bold">
                                    {formatCurrency(closingBalance)}
                                  </div>
                                  <div className="text-xs mt-1">
                                    {closingBalance >= currentOpeningBalance
                                      ? "↑"
                                      : "↓"}{" "}
                                    {formatCurrency(
                                      Math.abs(
                                        closingBalance - currentOpeningBalance
                                      )
                                    )}{" "}
                                    from opening
                                  </div>
                                </div>

                                {/* Summary Stats */}
                                <div className="flex gap-6">
                                  <div className="text-center">
                                    <div className="text-xs text-gray-600">
                                      Total Inflows
                                    </div>
                                    <div className="text-xl font-bold text-green-600">
                                      {formatCurrency(totalInflows)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {sortedInflowCategories.length} categories
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-gray-600">
                                      Total Outflows
                                    </div>
                                    <div className="text-xl font-bold text-red-600">
                                      {formatCurrency(totalOutflows)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {sortedOutflowCategories.length}{" "}
                                      categories
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-gray-600">
                                      Net Change
                                    </div>
                                    <div
                                      className={`text-xl font-bold ${
                                        netCashflow >= 0
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {netCashflow >= 0 ? "+" : ""}
                                      {formatCurrency(netCashflow)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {currentOpeningBalance > 0
                                        ? `${(
                                            (netCashflow /
                                              currentOpeningBalance) *
                                            100
                                          ).toFixed(1)}%`
                                        : "N/A"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                );
              })()}
            </div>
          </>
        )}

        {activeTab === "cashflow" && (
          <>
            <div className="max-w-6xl mx-auto mb-6">
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-3 border border-blue-200">
                  <h3 className="text-xs font-semibold text-blue-700">
                    Opening Balance
                  </h3>
                  <p className="text-xl font-bold text-blue-900">
                    {formatCurrency(openingBalance)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-3 border border-green-200">
                  <h3 className="text-xs font-semibold text-green-700">
                    Total Inflows
                  </h3>
                  <p className="text-xl font-bold text-green-900">
                    {formatCurrency(
                      cashTransactions
                        .filter((t) => t.type === "inflow")
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                    )}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-3 border border-red-200">
                  <h3 className="text-xs font-semibold text-red-700">
                    Total Outflows
                  </h3>
                  <p className="text-xl font-bold text-red-900">
                    {formatCurrency(
                      cashTransactions
                        .filter((t) => t.type === "outflow")
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                    )}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-3 border border-purple-200">
                  <h3 className="text-xs font-semibold text-purple-700">
                    Current Balance
                  </h3>
                  <p className="text-xl font-bold text-purple-900">
                    {formatCurrency(
                      openingBalance +
                        cashTransactions
                          .filter((t) => t.type === "inflow")
                          .reduce((sum, t) => sum + parseFloat(t.amount), 0) -
                        cashTransactions
                          .filter((t) => t.type === "outflow")
                          .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">Set Opening Balance</h2>
              <div className="max-w-md">
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) =>
                    setOpeningBalance(parseFloat(e.target.value) || 0)
                  }
                  placeholder="Enter opening balance"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6">Monthly Cashflow</h2>

              <div className="space-y-4">
                {(() => {
                  // Group transactions by month
                  const monthlyData = {};

                  cashTransactions.forEach((transaction) => {
                    const date = new Date(transaction.date);
                    const monthKey = `${date.getFullYear()}-${String(
                      date.getMonth() + 1
                    ).padStart(2, "0")}`;

                    if (!monthlyData[monthKey]) {
                      monthlyData[monthKey] = { inflow: 0, outflow: 0 };
                    }

                    const amount = parseFloat(transaction.amount) || 0;
                    if (transaction.type === "inflow") {
                      monthlyData[monthKey].inflow += amount;
                    } else {
                      monthlyData[monthKey].outflow += amount;
                    }
                  });

                  // Convert to sorted array with running balance
                  let runningBalance = openingBalance;
                  const sortedMonths = Object.keys(monthlyData)
                    .sort()
                    .map((key) => {
                      const [year, month] = key.split("-");
                      const monthNames = [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                      ];
                      const monthName = monthNames[parseInt(month) - 1];

                      const openingBal = runningBalance;
                      const inflow = monthlyData[key].inflow;
                      const outflow = monthlyData[key].outflow;
                      const closingBal = openingBal + inflow - outflow;
                      runningBalance = closingBal; // Carry forward to next month

                      return {
                        key,
                        label: `${monthName} ${year}`,
                        opening: openingBal,
                        inflow,
                        outflow,
                        closing: closingBal,
                        net: inflow - outflow,
                      };
                    });

                  // Find max value for scaling
                  const maxValue = Math.max(
                    ...sortedMonths.map((m) => Math.max(m.inflow, m.outflow))
                  );

                  return sortedMonths.map((monthData) => (
                    <div key={monthData.key} className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700 w-24">
                          {monthData.label}
                        </span>
                        <div className="flex gap-3 text-xs text-gray-600">
                          <span className="text-blue-600">
                            Open: {formatCurrency(monthData.opening)}
                          </span>
                          <span className="text-green-600">
                            In: {formatCurrency(monthData.inflow)}
                          </span>
                          <span className="text-red-600">
                            Out: {formatCurrency(monthData.outflow)}
                          </span>
                          <span
                            className={`font-semibold ${
                              monthData.closing >= 0
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            Close: {formatCurrency(monthData.closing)}
                          </span>
                        </div>
                      </div>

                      <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden">
                        {/* Center line for zero */}
                        <div className="absolute left-0 right-0 h-px bg-gray-400 top-1/2 z-10"></div>

                        {/* Inflow bar (top half) */}
                        <div
                          className="absolute left-0 bottom-1/2 bg-green-400 transition-all duration-500 flex items-end justify-center pb-1 cursor-pointer hover:bg-green-500"
                          style={{
                            width: `${
                              maxValue > 0
                                ? (monthData.inflow / maxValue) * 100
                                : 0
                            }%`,
                            height: "50%",
                          }}
                          onClick={() => {
                            setSelectedMonthBreakdown({
                              month: monthData.label,
                              monthKey: monthData.key,
                              type: "inflow",
                            });
                            setShowCategoryBreakdown(true);
                          }}
                          title="Click to see inflow breakdown"
                        >
                          {monthData.inflow > 0 && (
                            <span className="text-xs font-semibold text-green-900">
                              {formatCurrency(monthData.inflow)}
                            </span>
                          )}
                        </div>

                        {/* Outflow bar (bottom half) */}
                        <div
                          className="absolute left-0 top-1/2 bg-red-400 transition-all duration-500 flex items-start justify-center pt-1 cursor-pointer hover:bg-red-500"
                          style={{
                            width: `${
                              maxValue > 0
                                ? (monthData.outflow / maxValue) * 100
                                : 0
                            }%`,
                            height: "50%",
                          }}
                          onClick={() => {
                            setSelectedMonthBreakdown({
                              month: monthData.label,
                              monthKey: monthData.key,
                              type: "outflow",
                            });
                            setShowCategoryBreakdown(true);
                          }}
                          title="Click to see outflow breakdown"
                        >
                          {monthData.outflow > 0 && (
                            <span className="text-xs font-semibold text-red-900">
                              {formatCurrency(monthData.outflow)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Legend */}
              <div className="mt-6 flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span className="text-gray-700">Cash Inflow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-400 rounded"></div>
                  <span className="text-gray-700">Cash Outflow</span>
                </div>
              </div>

              {/* Monthly Summary Table */}
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">
                  Monthly Summary by Description
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="px-4 py-3 text-left text-sm font-semibold sticky left-0 bg-gray-100 z-10">
                          Description
                        </th>
                        {(() => {
                          const monthlyData = {};

                          cashTransactions.forEach((transaction) => {
                            const date = new Date(transaction.date);
                            const monthKey = `${date.getFullYear()}-${String(
                              date.getMonth() + 1
                            ).padStart(2, "0")}`;

                            if (!monthlyData[monthKey]) {
                              monthlyData[monthKey] = { inflow: 0, outflow: 0 };
                            }

                            const amount = parseFloat(transaction.amount) || 0;
                            if (transaction.type === "inflow") {
                              monthlyData[monthKey].inflow += amount;
                            } else {
                              monthlyData[monthKey].outflow += amount;
                            }
                          });

                          const sortedMonths = Object.keys(monthlyData).sort();

                          return sortedMonths.map((key) => {
                            const [year, month] = key.split("-");
                            const monthNames = [
                              "Jan",
                              "Feb",
                              "Mar",
                              "Apr",
                              "May",
                              "Jun",
                              "Jul",
                              "Aug",
                              "Sep",
                              "Oct",
                              "Nov",
                              "Dec",
                            ];
                            const monthName = monthNames[parseInt(month) - 1];

                            return (
                              <th
                                key={key}
                                className="px-4 py-3 text-center text-sm font-semibold min-w-[100px]"
                              >
                                <div>
                                  {monthName} {year}
                                </div>
                              </th>
                            );
                          });
                        })()}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Get all months
                        const monthlyData = {};

                        cashTransactions.forEach((transaction) => {
                          const date = new Date(transaction.date);
                          const monthKey = `${date.getFullYear()}-${String(
                            date.getMonth() + 1
                          ).padStart(2, "0")}`;

                          if (!monthlyData[monthKey]) {
                            monthlyData[monthKey] = {};
                          }

                          const description = transaction.description;
                          const type = transaction.type;

                          if (!monthlyData[monthKey][description]) {
                            monthlyData[monthKey][description] = {
                              inflow: 0,
                              outflow: 0,
                            };
                          }

                          const amount = parseFloat(transaction.amount) || 0;
                          if (type === "inflow") {
                            monthlyData[monthKey][description].inflow += amount;
                          } else {
                            monthlyData[monthKey][description].outflow +=
                              amount;
                          }
                        });

                        const sortedMonths = Object.keys(monthlyData).sort();

                        // Get all unique descriptions
                        const allDescriptions = new Set();
                        Object.values(monthlyData).forEach((monthData) => {
                          Object.keys(monthData).forEach((desc) =>
                            allDescriptions.add(desc)
                          );
                        });

                        const descriptionArray =
                          Array.from(allDescriptions).sort();

                        // Separate inflow and outflow descriptions
                        const inflowDescriptions = descriptionArray.filter(
                          (desc) => {
                            return sortedMonths.some(
                              (month) =>
                                monthlyData[month][desc] &&
                                monthlyData[month][desc].inflow > 0
                            );
                          }
                        );

                        const outflowDescriptions = descriptionArray.filter(
                          (desc) => {
                            return sortedMonths.some(
                              (month) =>
                                monthlyData[month][desc] &&
                                monthlyData[month][desc].outflow > 0
                            );
                          }
                        );

                        return (
                          <>
                            {/* Opening Balance Row */}
                            <tr className="bg-blue-50 font-bold border-t-2 border-blue-500">
                              <td className="px-4 py-3 text-sm sticky left-0 bg-blue-50 z-10">
                                Opening Balance
                              </td>
                              {(() => {
                                let runningBalance = openingBalance;

                                return sortedMonths.map((month) => {
                                  const monthOpening = runningBalance;

                                  // Calculate this month's net to get closing
                                  const inflow = Object.keys(
                                    monthlyData[month] || {}
                                  ).reduce((sum, desc) => {
                                    return (
                                      sum +
                                      (monthlyData[month][desc]?.inflow || 0)
                                    );
                                  }, 0);
                                  const outflow = Object.keys(
                                    monthlyData[month] || {}
                                  ).reduce((sum, desc) => {
                                    return (
                                      sum +
                                      (monthlyData[month][desc]?.outflow || 0)
                                    );
                                  }, 0);

                                  runningBalance =
                                    monthOpening + inflow - outflow;

                                  return (
                                    <td
                                      key={month}
                                      className="px-4 py-3 text-right text-sm"
                                    >
                                      <span className="text-blue-700">
                                        {formatCurrency(monthOpening)}
                                      </span>
                                    </td>
                                  );
                                });
                              })()}
                            </tr>

                            {/* Inflows Section */}
                            <tr className="bg-green-50 font-bold border-t-2 border-green-500">
                              <td
                                className="px-4 py-3 text-sm sticky left-0 bg-green-50 z-10"
                                colSpan={sortedMonths.length + 1}
                              >
                                CASH INFLOWS
                              </td>
                            </tr>

                            {inflowDescriptions.map((description) => {
                              return (
                                <tr
                                  key={`in-${description}`}
                                  className="border-b hover:bg-gray-50"
                                >
                                  <td className="px-4 py-3 text-sm pl-8 sticky left-0 bg-white z-10">
                                    {description}
                                  </td>
                                  {sortedMonths.map((month) => {
                                    const amount =
                                      monthlyData[month][description]?.inflow ||
                                      0;

                                    return (
                                      <td
                                        key={month}
                                        className="px-4 py-3 text-right text-sm"
                                      >
                                        {amount > 0 ? (
                                          <span className="text-green-600 font-medium">
                                            {formatCurrency(amount)}
                                          </span>
                                        ) : (
                                          <span className="text-gray-300">
                                            -
                                          </span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}

                            <tr className="bg-green-100 font-bold border-b-2">
                              <td className="px-4 py-3 text-sm sticky left-0 bg-green-100 z-10">
                                Total Inflows
                              </td>
                              {sortedMonths.map((month) => {
                                const total = Object.keys(
                                  monthlyData[month] || {}
                                ).reduce((sum, desc) => {
                                  return (
                                    sum +
                                    (monthlyData[month][desc]?.inflow || 0)
                                  );
                                }, 0);

                                return (
                                  <td
                                    key={month}
                                    className="px-4 py-3 text-right text-sm"
                                  >
                                    <span className="text-green-700">
                                      {formatCurrency(total)}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Outflows Section */}
                            <tr className="bg-red-50 font-bold border-t-2 border-red-500">
                              <td
                                className="px-4 py-3 text-sm sticky left-0 bg-red-50 z-10"
                                colSpan={sortedMonths.length + 1}
                              >
                                CASH OUTFLOWS
                              </td>
                            </tr>

                            {outflowDescriptions.map((description) => {
                              return (
                                <tr
                                  key={`out-${description}`}
                                  className="border-b hover:bg-gray-50"
                                >
                                  <td className="px-4 py-3 text-sm pl-8 sticky left-0 bg-white z-10">
                                    {description}
                                  </td>
                                  {sortedMonths.map((month) => {
                                    const amount =
                                      monthlyData[month][description]
                                        ?.outflow || 0;

                                    return (
                                      <td
                                        key={month}
                                        className="px-4 py-3 text-right text-sm"
                                      >
                                        {amount > 0 ? (
                                          <span className="text-red-600 font-medium">
                                            {formatCurrency(amount)}
                                          </span>
                                        ) : (
                                          <span className="text-gray-300">
                                            -
                                          </span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}

                            <tr className="bg-red-100 font-bold border-b-2">
                              <td className="px-4 py-3 text-sm sticky left-0 bg-red-100 z-10">
                                Total Outflows
                              </td>
                              {sortedMonths.map((month) => {
                                const total = Object.keys(
                                  monthlyData[month] || {}
                                ).reduce((sum, desc) => {
                                  return (
                                    sum +
                                    (monthlyData[month][desc]?.outflow || 0)
                                  );
                                }, 0);

                                return (
                                  <td
                                    key={month}
                                    className="px-4 py-3 text-right text-sm"
                                  >
                                    <span className="text-red-700">
                                      {formatCurrency(total)}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Net Cashflow */}
                            <tr className="bg-purple-100 font-bold border-t-2 border-purple-500">
                              <td className="px-4 py-3 text-sm sticky left-0 bg-purple-100 z-10">
                                Net Cashflow
                              </td>
                              {sortedMonths.map((month) => {
                                const inflow = Object.keys(
                                  monthlyData[month] || {}
                                ).reduce((sum, desc) => {
                                  return (
                                    sum +
                                    (monthlyData[month][desc]?.inflow || 0)
                                  );
                                }, 0);
                                const outflow = Object.keys(
                                  monthlyData[month] || {}
                                ).reduce((sum, desc) => {
                                  return (
                                    sum +
                                    (monthlyData[month][desc]?.outflow || 0)
                                  );
                                }, 0);
                                const net = inflow - outflow;

                                return (
                                  <td
                                    key={month}
                                    className="px-4 py-3 text-right text-sm"
                                  >
                                    <span
                                      className={
                                        net >= 0
                                          ? "text-green-700"
                                          : "text-red-700"
                                      }
                                    >
                                      {formatCurrency(net)}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Closing Balance Row */}
                            <tr className="bg-blue-100 font-bold border-t-4 border-blue-500">
                              <td className="px-4 py-3 text-sm sticky left-0 bg-blue-100 z-10">
                                Closing Balance
                              </td>
                              {(() => {
                                let runningBalance = openingBalance;

                                return sortedMonths.map((month) => {
                                  const inflow = Object.keys(
                                    monthlyData[month] || {}
                                  ).reduce((sum, desc) => {
                                    return (
                                      sum +
                                      (monthlyData[month][desc]?.inflow || 0)
                                    );
                                  }, 0);
                                  const outflow = Object.keys(
                                    monthlyData[month] || {}
                                  ).reduce((sum, desc) => {
                                    return (
                                      sum +
                                      (monthlyData[month][desc]?.outflow || 0)
                                    );
                                  }, 0);

                                  runningBalance =
                                    runningBalance + inflow - outflow;

                                  return (
                                    <td
                                      key={month}
                                      className="px-4 py-3 text-right text-sm"
                                    >
                                      <span
                                        className={
                                          runningBalance >= 0
                                            ? "text-blue-700"
                                            : "text-red-700"
                                        }
                                      >
                                        {formatCurrency(runningBalance)}
                                      </span>
                                    </td>
                                  );
                                });
                              })()}
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Set Opening Balance</h2>
              </div>
              <div className="max-w-md">
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) =>
                    setOpeningBalance(parseFloat(e.target.value) || 0)
                  }
                  placeholder="Enter opening balance"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Cash Transactions</h2>
                <button
                  onClick={() => {
                    setEditingTransaction(null);
                    setNewTransaction({
                      date: new Date().toISOString().split("T")[0],
                      description: "",
                      category: "",
                      type: "inflow",
                      amount: "",
                    });
                    setShowCashModal(true);
                  }}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  + Add Transaction
                </button>
              </div>

              {cashTransactions.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-600 mb-2">No transactions yet</p>
                  <p className="text-gray-500 text-sm">
                    Click "Add Transaction" to start tracking cashflow
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Type
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">
                          Balance
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let runningBalance = openingBalance;
                        const sortedTransactions = [...cashTransactions].sort(
                          (a, b) => new Date(a.date) - new Date(b.date)
                        );

                        return sortedTransactions.map((transaction) => {
                          const amount = parseFloat(transaction.amount);
                          if (transaction.type === "inflow") {
                            runningBalance += amount;
                          } else {
                            runningBalance -= amount;
                          }

                          return (
                            <tr
                              key={transaction.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="px-4 py-3 text-sm">
                                {transaction.date}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {transaction.description}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {transaction.category || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    transaction.type === "inflow"
                                      ? "bg-green-200 text-green-700"
                                      : "bg-red-200 text-red-700"
                                  }`}
                                >
                                  {transaction.type === "inflow"
                                    ? "Inflow"
                                    : "Outflow"}
                                </span>
                              </td>
                              <td
                                className={`px-4 py-3 text-sm text-right font-semibold ${
                                  transaction.type === "inflow"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {transaction.type === "inflow" ? "+" : "-"}
                                {formatCurrency(amount)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-semibold">
                                {formatCurrency(runningBalance)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => {
                                    setEditingTransaction(transaction);
                                    setNewTransaction(transaction);
                                    setShowCashModal(true);
                                  }}
                                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium mr-2"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    // Delete from database; list auto-refreshes via React Query
                                    deleteCashTransaction.mutate(
                                      transaction.id
                                    );
                                  }}
                                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {showCategoryBreakdown && selectedMonthBreakdown && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={() => setShowCategoryBreakdown(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-2">
                {selectedMonthBreakdown.type === "inflow"
                  ? "Cash Inflows"
                  : "Cash Outflows"}
              </h2>
              <p className="text-gray-600 mb-6">
                {selectedMonthBreakdown.month}
              </p>

              {(() => {
                // Filter transactions for this month and type
                const monthTransactions = cashTransactions.filter(
                  (transaction) => {
                    const date = new Date(transaction.date);
                    const monthKey = `${date.getFullYear()}-${String(
                      date.getMonth() + 1
                    ).padStart(2, "0")}`;
                    return (
                      monthKey === selectedMonthBreakdown.monthKey &&
                      transaction.type === selectedMonthBreakdown.type
                    );
                  }
                );

                // Group by category
                const categoryTotals = {};
                monthTransactions.forEach((transaction) => {
                  const category = transaction.category;
                  if (!categoryTotals[category]) {
                    categoryTotals[category] = {
                      total: 0,
                      transactions: [],
                    };
                  }
                  categoryTotals[category].total += parseFloat(
                    transaction.amount
                  );
                  categoryTotals[category].transactions.push(transaction);
                });

                // Sort by total amount (descending)
                const sortedCategories = Object.keys(categoryTotals).sort(
                  (a, b) => categoryTotals[b].total - categoryTotals[a].total
                );

                const grandTotal = sortedCategories.reduce(
                  (sum, cat) => sum + categoryTotals[cat].total,
                  0
                );

                return (
                  <>
                    <div className="space-y-4 mb-6">
                      {sortedCategories.map((category) => {
                        const categoryData = categoryTotals[category];
                        const percentage =
                          grandTotal > 0
                            ? (categoryData.total / grandTotal) * 100
                            : 0;

                        return (
                          <div
                            key={category}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-semibold text-gray-800">
                                {category}
                              </h3>
                              <div className="text-right">
                                <div
                                  className={`font-bold text-lg ${
                                    selectedMonthBreakdown.type === "inflow"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {formatCurrency(categoryData.total)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {percentage.toFixed(1)}% of total
                                </div>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                              <div
                                className={`h-2 rounded-full ${
                                  selectedMonthBreakdown.type === "inflow"
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>

                            {/* Transaction details */}
                            <div className="space-y-1">
                              {categoryData.transactions.map(
                                (transaction, idx) => (
                                  <div
                                    key={idx}
                                    className="text-sm text-gray-600 flex justify-between"
                                  >
                                    <span>
                                      {transaction.date}:{" "}
                                      {transaction.description}
                                    </span>
                                    <span className="font-medium">
                                      {formatCurrency(
                                        parseFloat(transaction.amount)
                                      )}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total */}
                    <div
                      className={`border-t-2 pt-4 flex justify-between items-center ${
                        selectedMonthBreakdown.type === "inflow"
                          ? "border-green-500"
                          : "border-red-500"
                      }`}
                    >
                      <span className="text-lg font-bold text-gray-800">
                        Total{" "}
                        {selectedMonthBreakdown.type === "inflow"
                          ? "Inflows"
                          : "Outflows"}
                      </span>
                      <span
                        className={`text-2xl font-bold ${
                          selectedMonthBreakdown.type === "inflow"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </>
                );
              })()}

              <div className="mt-6">
                <button
                  onClick={() => setShowCategoryBreakdown(false)}
                  className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cash Transaction Modal */}
        {showCashModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={() => setShowCashModal(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">
                {editingTransaction ? "Edit Transaction" : "Add Transaction"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={newTransaction.description}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Payment received from..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Category (recommended)
                  </label>
                  <select
                    value={newTransaction.category}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select category...</option>
                    {cashflowCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Type *
                  </label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        type: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="inflow">Inflow (Money In)</option>
                    <option value="outflow">Outflow (Money Out)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        amount: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="1000"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    if (
                      !newTransaction.date ||
                      !newTransaction.description ||
                      !newTransaction.amount
                    ) {
                      alert(
                        "Please fill in required fields: Date, Description, and Amount"
                      );
                      return;
                    }

                    const amount = parseFloat(newTransaction.amount);
                    if (isNaN(amount) || amount <= 0) {
                      alert("Please enter a valid amount greater than 0");
                      return;
                    }

                    if (editingTransaction) {
                      // Update existing transaction in database
                      updateCashTransaction.mutate({
                        ...newTransaction,
                        id: editingTransaction.id,
                      });
                    } else {
                      // Add new transaction to database
                      addCashTransaction.mutate(newTransaction);
                    }
                    setShowCashModal(false);
                    setEditingTransaction(null);
                    setNewTransaction({
                      date: "",
                      description: "",
                      category: "",
                      type: "inflow",
                      amount: "",
                    });
                  }}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700"
                >
                  {editingTransaction ? "Update" : "Add"} Transaction
                </button>
                <button
                  onClick={() => setShowCashModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Project Cost Modal */}
        {showProjectCostModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={() => setShowProjectCostModal(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">
                  {editingProjectCost
                    ? "Edit Project Cost"
                    : "Add New Project Cost"}
                </h2>
                {editingProjectCost && (
                  <button
                    onClick={() => {
                      if (
                        confirm(`Delete "${editingProjectCost.projectName}"?`)
                      ) {
                        deleteProjectCost.mutate(editingProjectCost.id);
                        setShowProjectCostModal(false);
                        setEditingProjectCost(null);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3">
                  <label className="block text-sm font-semibold mb-1">
                    Month / Year *
                  </label>
                  <input
                    type="month"
                    value={(() => {
                      // Convert "January / 2025" to "2025-01"
                      if (!newProjectCost.monthYear) return "";
                      const [monthName, year] =
                        newProjectCost.monthYear.split(" / ");
                      const monthIndex =
                        new Date(`${monthName} 1, 2000`).getMonth() + 1;
                      return `${year}-${String(monthIndex).padStart(2, "0")}`;
                    })()}
                    onChange={(e) => {
                      // Convert "2025-01" to "January / 2025"
                      if (!e.target.value) {
                        setNewProjectCost({ ...newProjectCost, monthYear: "" });
                        return;
                      }
                      const [year, month] = e.target.value.split("-");
                      const date = new Date(
                        parseInt(year),
                        parseInt(month) - 1
                      );
                      const monthName = date.toLocaleString("default", {
                        month: "long",
                      });
                      setNewProjectCost({
                        ...newProjectCost,
                        monthYear: `${monthName} / ${year}`,
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-sm font-semibold mb-1">
                    Project Name / Number *
                  </label>
                  <input
                    type="text"
                    value={newProjectCost.projectName}
                    onChange={(e) =>
                      setNewProjectCost({
                        ...newProjectCost,
                        projectName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Project Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Client *
                  </label>
                  <input
                    type="text"
                    value={newProjectCost.client}
                    onChange={(e) =>
                      setNewProjectCost({
                        ...newProjectCost,
                        client: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Client Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Market *
                  </label>
                  <select
                    value={newProjectCost.market}
                    onChange={(e) =>
                      setNewProjectCost({
                        ...newProjectCost,
                        market: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select Market...</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Thailand">Thailand</option>
                    <option value="Philippines">Philippines</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="Cambodia">Cambodia</option>
                    <option value="Myanmar">Myanmar</option>
                    <option value="Japan">Japan</option>
                    <option value="South Korea">South Korea</option>
                    <option value="China">China</option>
                    <option value="Hong Kong">Hong Kong</option>
                    <option value="Taiwan">Taiwan</option>
                    <option value="India">India</option>
                    <option value="Australia">Australia</option>
                    <option value="New Zealand">New Zealand</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Canada">Canada</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Mexico">Mexico</option>
                    <option value="UAE">UAE</option>
                    <option value="Dubai">Dubai</option>
                  </select>
                </div>

                <div></div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Base Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={newProjectCost.baseAmountUSD}
                    onChange={(e) => {
                      const baseUSD = parseFloat(e.target.value) || 0;
                      const dataUSD = parseFloat(newProjectCost.dataUSD) || 0;
                      setNewProjectCost({
                        ...newProjectCost,
                        baseAmountUSD: e.target.value,
                        totalAmountUSD: (baseUSD + dataUSD).toFixed(2),
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Data (USD)
                  </label>
                  <input
                    type="number"
                    value={newProjectCost.dataUSD}
                    onChange={(e) => {
                      const baseUSD =
                        parseFloat(newProjectCost.baseAmountUSD) || 0;
                      const dataUSD = parseFloat(e.target.value) || 0;
                      setNewProjectCost({
                        ...newProjectCost,
                        dataUSD: e.target.value,
                        totalAmountUSD: (baseUSD + dataUSD).toFixed(2),
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Total Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={newProjectCost.totalAmountUSD}
                    readOnly
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Base Amount (SGD) *
                  </label>
                  <input
                    type="number"
                    value={newProjectCost.baseAmountSGD}
                    onChange={(e) => {
                      const baseSGD = parseFloat(e.target.value) || 0;
                      const dataSGD = parseFloat(newProjectCost.dataSGD) || 0;
                      const totalSGD = baseSGD + dataSGD;
                      const revenue =
                        parseFloat(newProjectCost.projectRevenue) || 0;
                      const costPct =
                        revenue > 0
                          ? ((totalSGD / revenue) * 100).toFixed(0)
                          : "0";

                      setNewProjectCost({
                        ...newProjectCost,
                        baseAmountSGD: e.target.value,
                        totalAmountSGD: totalSGD.toFixed(2),
                        costPercentage: costPct,
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Data (SGD)
                  </label>
                  <input
                    type="number"
                    value={newProjectCost.dataSGD}
                    onChange={(e) => {
                      const baseSGD =
                        parseFloat(newProjectCost.baseAmountSGD) || 0;
                      const dataSGD = parseFloat(e.target.value) || 0;
                      const totalSGD = baseSGD + dataSGD;
                      const revenue =
                        parseFloat(newProjectCost.projectRevenue) || 0;
                      const costPct =
                        revenue > 0
                          ? ((totalSGD / revenue) * 100).toFixed(0)
                          : "0";

                      setNewProjectCost({
                        ...newProjectCost,
                        dataSGD: e.target.value,
                        totalAmountSGD: totalSGD.toFixed(2),
                        costPercentage: costPct,
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Total Amount (SGD)
                  </label>
                  <input
                    type="number"
                    value={newProjectCost.totalAmountSGD}
                    readOnly
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Project Revenue (SGD) *
                  </label>
                  <input
                    type="number"
                    value={newProjectCost.projectRevenue}
                    onChange={(e) => {
                      const revenue = parseFloat(e.target.value) || 0;
                      const totalSGD =
                        parseFloat(newProjectCost.totalAmountSGD) || 0;
                      const costPct =
                        revenue > 0
                          ? ((totalSGD / revenue) * 100).toFixed(0)
                          : "0";

                      setNewProjectCost({
                        ...newProjectCost,
                        projectRevenue: e.target.value,
                        costPercentage: costPct,
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Cost %
                  </label>
                  <input
                    type="text"
                    value={newProjectCost.costPercentage}
                    readOnly
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Status
                  </label>
                  <select
                    value={newProjectCost.status}
                    onChange={(e) =>
                      setNewProjectCost({
                        ...newProjectCost,
                        status: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Invoiced">Invoiced</option>
                    <option value="Paid">Paid</option>
                    <option value="N.A.">N.A.</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={async () => {
                    if (
                      !newProjectCost.monthYear ||
                      !newProjectCost.projectName ||
                      !newProjectCost.client ||
                      !newProjectCost.market ||
                      !newProjectCost.baseAmountSGD ||
                      !newProjectCost.projectRevenue
                    ) {
                      alert(
                        "Please fill in required fields: Month/Year, Project Name, Client, Market, Base Amount (SGD), and Project Revenue"
                      );
                      return;
                    }

                    const costPayload = {
                      monthYear: newProjectCost.monthYear,
                      projectName: newProjectCost.projectName,
                      client: newProjectCost.client,
                      market: newProjectCost.market,
                      baseAmountUSD: newProjectCost.baseAmountUSD,
                      dataUSD: newProjectCost.dataUSD,
                      totalAmountUSD: newProjectCost.totalAmountUSD,
                      baseAmountSGD: newProjectCost.baseAmountSGD,
                      dataSGD: newProjectCost.dataSGD,
                      totalAmountSGD: newProjectCost.totalAmountSGD,
                      projectRevenue: newProjectCost.projectRevenue,
                      costPercentage: newProjectCost.costPercentage,
                      status: newProjectCost.status,
                    } as any;

                    try {
                      if (editingProjectCost) {
                        await updateProjectCost.mutateAsync({
                          ...costPayload,
                          id: editingProjectCost.id,
                        });
                      } else {
                        await addProjectCost.mutateAsync(costPayload);
                      }
                      setShowProjectCostModal(false);
                      setEditingProjectCost(null);
                    } catch (e: any) {
                      alert(e?.message || "Failed to save project cost");
                      return;
                    }
                    setNewProjectCost({
                      monthYear: "",
                      projectName: "",
                      client: "",
                      market: "",
                      baseAmountUSD: "",
                      dataUSD: "",
                      totalAmountUSD: "",
                      baseAmountSGD: "",
                      dataSGD: "",
                      totalAmountSGD: "",
                      projectRevenue: "",
                      costPercentage: "",
                      status: "Pending",
                    });
                  }}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700"
                >
                  {editingProjectCost
                    ? "Update Project Cost"
                    : "Add Project Cost"}
                </button>
                <button
                  onClick={() => setShowProjectCostModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Project Modal */}
        {showProjectModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={() => setShowProjectModal(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">
                  {editingProject ? "Edit Project" : "Add New Project"}
                </h2>
                {editingProject && (
                  <button
                    onClick={() => {
                      if (
                        confirm(`Delete "${editingProject.clientProject}"?`)
                      ) {
                        deleteProject.mutate(editingProject.id);
                        setShowProjectModal(false);
                        setEditingProject(null);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newProject.date}
                    onChange={(e) =>
                      setNewProject({ ...newProject, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Project Number
                  </label>
                  <input
                    type="text"
                    value={newProject.projectNumber}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        projectNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="PRJ-001"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">
                    Client/Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProject.clientProject}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        clientProject: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Client Name - Project Description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Quoted Currency
                  </label>
                  <select
                    value={newProject.quotedCurrency}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        quotedCurrency: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="USD">USD</option>
                    <option value="SGD">SGD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Value (Quoted Currency) *
                  </label>
                  <input
                    type="number"
                    value={newProject.valueQuoted}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        valueQuoted: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="10000"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Value (SGD) *
                  </label>
                  <input
                    type="number"
                    value={newProject.valueSGD}
                    onChange={(e) =>
                      setNewProject({ ...newProject, valueSGD: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="13500"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Number of Studies
                  </label>
                  <input
                    type="number"
                    value={newProject.numberOfStudies}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        numberOfStudies: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="3"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">
                    Purchase Order
                  </label>
                  <input
                    type="text"
                    value={newProject.purchaseOrder}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        purchaseOrder: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="PO Number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Field Work Status
                  </label>
                  <select
                    value={newProject.fieldWorkStatus}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        fieldWorkStatus: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="N.A">N.A</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Report Status
                  </label>
                  <select
                    value={newProject.reportStatus}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        reportStatus: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="N.A">N.A</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Field Work Start Date
                  </label>
                  <input
                    type="date"
                    value={newProject.fieldWorkStartDate}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        fieldWorkStartDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Field Work End Date
                  </label>
                  <input
                    type="date"
                    value={newProject.fieldWorkEndDate}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        fieldWorkEndDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Invoice Status
                  </label>
                  <select
                    value={newProject.invoiceStatus}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        invoiceStatus: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="Not Issued">Not Issued</option>
                    <option value="Pending">Pending</option>
                    <option value="Issued">Issued</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={newProject.invoiceDate}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        invoiceDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={async () => {
                    if (
                      !newProject.date ||
                      !newProject.clientProject ||
                      !newProject.valueQuoted ||
                      !newProject.valueSGD
                    ) {
                      alert(
                        "Please fill in required fields: Date, Client/Project, Quoted Value, and SGD Value"
                      );
                      return;
                    }

                    const projectPayload = {
                      date: newProject.date,
                      clientProject: newProject.clientProject,
                      projectNumber: newProject.projectNumber,
                      valueQuoted: newProject.valueQuoted,
                      quotedCurrency: newProject.quotedCurrency,
                      valueSGD: newProject.valueSGD,
                      numberOfStudies: newProject.numberOfStudies,
                      purchaseOrder: newProject.purchaseOrder,
                      fieldWorkStatus: newProject.fieldWorkStatus,
                      fieldWorkStartDate: newProject.fieldWorkStartDate,
                      fieldWorkEndDate: newProject.fieldWorkEndDate,
                      reportStatus: newProject.reportStatus,
                      invoiceStatus: newProject.invoiceStatus,
                      invoiceDate: newProject.invoiceDate,
                    } as any;

                    try {
                      if (editingProject) {
                        await updateProject.mutateAsync({
                          ...projectPayload,
                          id: editingProject.id,
                        });
                      } else {
                        await addProject.mutateAsync(projectPayload);
                      }
                      setShowProjectModal(false);
                      setEditingProject(null);
                    } catch (e: any) {
                      alert(e?.message || "Failed to save project");
                      return;
                    }
                    setNewProject({
                      date: "",
                      clientProject: "",
                      projectNumber: "",
                      valueQuoted: "",
                      quotedCurrency: "USD",
                      valueSGD: "",
                      numberOfStudies: "",
                      purchaseOrder: "",
                      fieldWorkStatus: "Not Started",
                      fieldWorkStartDate: "",
                      fieldWorkEndDate: "",
                      reportStatus: "Not Started",
                      invoiceStatus: "Not Issued",
                      invoiceDate: "",
                    });
                  }}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700"
                >
                  {editingProject ? "Update Project" : "Add Project"}
                </button>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Deal Modal - Moved outside tab content */}
        {showDealModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={() => setShowDealModal(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">
                  {editingDeal ? "Edit Deal" : "Add New Deal"}
                </h2>
                {editingDeal && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDealToDelete(editingDeal);
                      setShowDeleteConfirm(true);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={newDeal.clientName}
                    onChange={(e) =>
                      setNewDeal({ ...newDeal, clientName: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Deal Name *
                  </label>
                  <input
                    type="text"
                    value={newDeal.dealName}
                    onChange={(e) =>
                      setNewDeal({ ...newDeal, dealName: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Project or deal name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Revenue Breakdown by Month
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
                    {newDeal.revenueBreakdown.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">
                        No revenue breakdown added yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {newDeal.revenueBreakdown.map((entry, idx) => (
                          <div
                            key={idx}
                            className="flex gap-2 items-start bg-white p-2 rounded border border-gray-200"
                          >
                            <div className="flex-1">
                              <label className="text-xs text-gray-600 block mb-1">
                                Month
                              </label>
                              <select
                                value={entry.month || ""}
                                onChange={(e) =>
                                  handleUpdateRevenueEntry(
                                    idx,
                                    "month",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="">Select...</option>
                                {months.map((m) => (
                                  <option key={m.value} value={m.value}>
                                    {m.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-gray-600 block mb-1">
                                Year
                              </label>
                              <select
                                value={entry.year || ""}
                                onChange={(e) =>
                                  handleUpdateRevenueEntry(
                                    idx,
                                    "year",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="">Select...</option>
                                {years.map((y) => (
                                  <option key={y} value={y}>
                                    {y}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-gray-600 block mb-1">
                                Amount ($)
                              </label>
                              <input
                                type="number"
                                value={entry.amount}
                                onChange={(e) =>
                                  handleUpdateRevenueEntry(
                                    idx,
                                    "amount",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="10000"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveRevenueEntry(idx)}
                              className="text-red-600 hover:text-red-800 px-2 mt-5"
                              title="Remove"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRevenueEntry}
                    className="w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-indigo-200 mb-2"
                  >
                    + Add Revenue Month
                  </button>

                  {/* Show breakdown total vs deal value */}
                  {newDeal.revenueBreakdown.length > 0 && newDeal.dealValue && (
                    <div
                      className={`p-3 rounded-lg text-sm ${(() => {
                        const total = newDeal.revenueBreakdown.reduce(
                          (sum, e) => sum + (parseFloat(e.amount) || 0),
                          0
                        );
                        const dealVal = parseFloat(newDeal.dealValue) || 0;
                        return Math.abs(total - dealVal) < 0.01
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200";
                      })()}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total Breakdown:</span>
                        <span>
                          {formatCurrency(
                            newDeal.revenueBreakdown.reduce(
                              (sum, e) => sum + (parseFloat(e.amount) || 0),
                              0
                            )
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="font-semibold">Deal Value:</span>
                        <span>
                          {formatCurrency(parseFloat(newDeal.dealValue) || 0)}
                        </span>
                      </div>
                      {(() => {
                        const total = newDeal.revenueBreakdown.reduce(
                          (sum, e) => sum + (parseFloat(e.amount) || 0),
                          0
                        );
                        const dealVal = parseFloat(newDeal.dealValue) || 0;
                        const diff = total - dealVal;
                        if (Math.abs(diff) < 0.01) {
                          return (
                            <div className="mt-2 text-green-700 font-semibold">
                              ✓ Amounts match
                            </div>
                          );
                        } else {
                          return (
                            <div className="mt-2 text-red-700 font-semibold">
                              ⚠ Difference: {formatCurrency(Math.abs(diff))}{" "}
                              {diff > 0 ? "over" : "under"}
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Deal Value ($) *
                    </label>
                    <input
                      type="number"
                      value={newDeal.dealValue}
                      onChange={(e) =>
                        setNewDeal({ ...newDeal, dealValue: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="100000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Expected Close Date
                    </label>
                    <input
                      type="date"
                      value={newDeal.expectedCloseDate || ""}
                      onChange={(e) =>
                        setNewDeal({
                          ...newDeal,
                          expectedCloseDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Stage
                    </label>
                    <select
                      value={newDeal.stage}
                      onChange={(e) =>
                        setNewDeal({ ...newDeal, stage: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      {stages.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Probability (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newDeal.probability}
                      onChange={(e) =>
                        setNewDeal({ ...newDeal, probability: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveDeal}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700"
                >
                  {editingDeal ? "Update Deal" : "Add Deal"}
                </button>
                <button
                  onClick={() => setShowDealModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && dealToDelete && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            style={{ zIndex: 10000 }}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Delete Deal?</h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete{" "}
                <strong>"{dealToDelete.dealName}"</strong> from{" "}
                <strong>{dealToDelete.clientName}</strong>?
                <br />
                <br />
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    deleteDeal.mutate(dealToDelete.id);
                    setShowDeleteConfirm(false);
                    setShowDealModal(false);
                    setDealToDelete(null);
                  }}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDealToDelete(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EBITDA Adjustments Modal */}
        {showAdjustmentsModal && classifiedData && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[10000]"
            onClick={() => setShowAdjustmentsModal(false)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-7xl"
              style={{
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Fixed Header */}
              <div className="p-6 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-2xl font-bold mb-2">
                  Manage EBITDA Adjustments
                </h2>
                <p className="text-gray-600 mb-3">
                  Enter manual adjustment amounts for each month. These are
                  typically one-time or non-recurring expenses that should be
                  added back to net profit.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h3 className="font-semibold text-blue-900 mb-1 text-sm">
                    💡 Common Adjustments Include:
                  </h3>
                  <p className="text-xs text-blue-800">
                    One-time legal fees, non-recurring consulting, restructuring
                    costs, one-time marketing campaigns, etc.
                  </p>
                </div>
              </div>

              {/* Scrollable Content */}
              <div
                className="p-6 flex-1 overflow-auto"
                style={{ minHeight: 0 }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-gray-100 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold border-b-2 border-gray-300 min-w-[200px] bg-gray-100">
                          Expense Item
                        </th>
                        {dashboardData.months.map((month) => (
                          <th
                            key={month.columnName}
                            className="px-2 py-2 text-center font-semibold border-b-2 border-gray-300 min-w-[100px] bg-gray-100"
                          >
                            <div className="text-xs">
                              {month.displayName.substring(0, 3)}
                            </div>
                          </th>
                        ))}
                        <th className="px-3 py-2 text-center font-semibold border-b-2 border-gray-300 min-w-[100px] bg-gray-100">
                          YTD Total
                        </th>
                        <th className="px-3 py-2 text-center font-semibold border-b-2 border-gray-300 min-w-[80px] bg-gray-100">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(classifiedData).map((category) => {
                        // Only show expense categories
                        if (category.includes("Revenue")) return null;

                        return classifiedData[category].map((row, idx) => {
                          const lineItem = row[dashboardData.accountColumn];
                          if (
                            !lineItem ||
                            lineItem.toLowerCase().startsWith("total")
                          )
                            return null;

                          const currentAdjustments =
                            ebitdaAdjustments[lineItem] || {};
                          const ytdTotal = dashboardData.months.reduce(
                            (sum, month) => {
                              const val =
                                currentAdjustments[month.displayName] || 0;
                              return sum + (parseFloat(val) || 0);
                            },
                            0
                          );

                          return (
                            <tr
                              key={`${category}-${idx}`}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="px-3 py-2 font-medium text-gray-700">
                                {lineItem}
                              </td>
                              {dashboardData.months.map((month) => (
                                <td
                                  key={month.columnName}
                                  className="px-2 py-2"
                                >
                                  <input
                                    type="number"
                                    value={
                                      currentAdjustments[month.displayName] ||
                                      ""
                                    }
                                    onChange={(e) => {
                                      const newAdjustments = {
                                        ...ebitdaAdjustments,
                                        [lineItem]: {
                                          ...currentAdjustments,
                                          [month.displayName]: e.target.value,
                                        },
                                      };
                                      setEbitdaAdjustments(newAdjustments);
                                    }}
                                    placeholder="0"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-right text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    step="0.01"
                                  />
                                </td>
                              ))}
                              <td className="px-3 py-2 text-right font-semibold text-amber-700">
                                {ytdTotal > 0 ? formatCurrency(ytdTotal) : "-"}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => {
                                    const newAdjustments = {
                                      ...ebitdaAdjustments,
                                    };
                                    delete newAdjustments[lineItem];
                                    setEbitdaAdjustments(newAdjustments);
                                  }}
                                  className="text-red-600 hover:text-red-800 text-xs px-2 py-1"
                                  title="Clear this row"
                                >
                                  Clear
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-900">
                      Total YTD Adjustments:
                    </span>
                    <span className="text-xl font-bold text-amber-700">
                      {(() => {
                        let total = 0;
                        Object.keys(ebitdaAdjustments).forEach((lineItem) => {
                          const monthAdjustments =
                            ebitdaAdjustments[lineItem] || {};
                          dashboardData.months.forEach((month) => {
                            const val =
                              monthAdjustments[month.displayName] || 0;
                            total += parseFloat(val) || 0;
                          });
                        });
                        return formatCurrency(total);
                      })()}
                    </span>
                  </div>
                  {(() => {
                    const itemsWithAdjustments = Object.keys(
                      ebitdaAdjustments
                    ).filter((lineItem) => {
                      const monthAdjustments =
                        ebitdaAdjustments[lineItem] || {};
                      return Object.values(monthAdjustments).some(
                        (val) => parseFloat(val) > 0
                      );
                    });

                    if (itemsWithAdjustments.length > 0) {
                      return (
                        <div className="mt-3 pt-3 border-t border-amber-300">
                          <p className="text-sm font-semibold text-amber-900 mb-2">
                            Items with Adjustments:
                          </p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {itemsWithAdjustments.map((lineItem) => {
                              const monthAdjustments =
                                ebitdaAdjustments[lineItem] || {};
                              const total = Object.values(
                                monthAdjustments
                              ).reduce(
                                (sum, val) => sum + (parseFloat(val) || 0),
                                0
                              );
                              return (
                                <div
                                  key={lineItem}
                                  className="text-sm text-amber-800 flex justify-between"
                                >
                                  <span>• {lineItem}</span>
                                  <span className="font-semibold">
                                    {formatCurrency(total)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAdjustmentsModal(false)}
                    className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700"
                  >
                    Save Adjustments
                  </button>
                  <button
                    onClick={() => {
                      setEbitdaAdjustments({});
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
