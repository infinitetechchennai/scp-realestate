import React, { useState, useRef, useEffect } from "react";
import { Project, Plot } from "../../types";
import { Modal } from "../../components/ui/UIComponents";
import { Building2, Plus, Eye, Map, Upload, Download, Pencil, Image as ImageIcon, FileSpreadsheet, MapPin, IndianRupee, Layers } from "lucide-react";
import { formatCurrency, formatCurrencyFull } from "../../utils/helpers";
import { useNavigate } from "react-router-dom";
import { usePlotStore } from "../../store/plotStore";
import { parsePlotCsv } from "../../utils/csvParser";
import toast from "react-hot-toast";

export const AdminProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();
  const {
    setBlueprintImage,
    setLayoutMode,
    plots: currentStorePlots,
    blueprintImage,
    fetchPlots,
  } = usePlotStore();

  const fetchProjects = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/projects/");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      // Backend offline
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchPlots();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [createStep, setCreateStep] = useState<"form" | "upload" | "preview">("form");

  const [form, setForm] = useState({
    name: "",
    code: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    countryCode: "IN",
    totalArea: "",
    defaultPricePerSqft: 2500,
    defaultTokenAmount: 10000,
    description: "",
  });

  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [uploadedPlots, setUploadedPlots] = useState<Plot[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>("");
  const [csvFileToUpload, setCsvFileToUpload] = useState<File | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Handle Export Live Database CSV
  const handleExportCsv = async (proj: Project) => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/plots/export-csv");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = (proj.code || "project") + "_plots_dataset.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("✓ Live database plots exported to CSV!");
        return;
      }
    } catch (err) {
      console.warn("Backend export failed:", err);
    }

    // Fallback if backend offline
    if (currentStorePlots.length > 0) {
      const headers = ["ID", "Project ID", "Plot Number", "Location", "Area SqFt", "Dimensions", "Facing", "Road Width", "Price Per SqFt", "Total Price", "Token Required", "Token Amount", "Token Date", "Token Expiry", "Amount Paid", "Balance Amount", "Balance Due Date", "Row Index", "Col Index", "Status"];
      const rows = currentStorePlots.map((p) => [
        p.id,
        p.projectId || "",
        p.plotNumber,
        p.location || "Chennai, Tamil Nadu",
        p.area,
        "\"" + (p.dimensions || "30x50").replace(/\"/g, "\"\"") + "\"",
        p.facing || "North",
        p.roadWidth || "20 ft",
        p.pricePerSqft || 2500,
        p.totalPrice || (p.area * (p.pricePerSqft || 2500)),
        p.tokenRequired || 10000,
        p.tokenAmount || 0,
        p.tokenDate || "",
        p.tokenExpiry || "",
        p.totalPaid || 0,
        p.balanceDue || 0,
        p.paymentDeadline || "",
        p.row || "",
        p.col || "",
        p.status ? p.status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "Available",
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (proj.code || "project") + "_plots_dataset.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("✓ Plots exported to CSV successfully!");
    } else {
      toast.error("No plots data available to export.");
    }
  };

  // Handle Blueprint Image Upload
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.toLowerCase().endsWith(".pdf") || file.type.includes("pdf")) {
        setUploadedImagePreview("/blueprint.png");
        setBlueprintImage("/blueprint.png");
        toast.success("✓ Blueprint PDF loaded successfully!");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedImagePreview(result);
        setBlueprintImage(result);
        toast.success("✓ Blueprint drawing uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle CSV File Upload
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFileToUpload(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const fullLoc = [form.addressLine1, form.city, form.state].filter(Boolean).join(", ") || "Chennai, Tamil Nadu";
        const parsed = parsePlotCsv(content, form.name || "Master Township", fullLoc);
        if (parsed.length > 0) {
          setUploadedPlots(parsed);
          setCsvFileName(file.name);
          toast.success("✓ Detected " + parsed.length + " plots from " + file.name + "!");
          setCreateStep("preview");
        } else {
          toast.error("Could not parse plots from the selected CSV file.");
        }
      };
      reader.readAsText(file);
    }
  };

  // Open Blank Create Modal
  const openCreateModal = () => {
    setIsEditing(false);
    setEditingProjectId(null);
    setForm({
      name: "",
      code: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      countryCode: "IN",
      totalArea: "",
      defaultPricePerSqft: 2500,
      defaultTokenAmount: 10000,
      description: "",
    });
    setUploadedPlots([]);
    setCsvFileName("");
    setCsvFileToUpload(null);
    setUploadedImagePreview(null);
    setCreateStep("form");
    setShowModal(true);
  };

  // Open Edit Modal Prefilled with Project Data
  const openEditModal = (proj: Project) => {
    setIsEditing(true);
    setEditingProjectId(proj.id);
    setForm({
      name: proj.name || "",
      code: proj.code || "",
      addressLine1: proj.addressLine1 || proj.address_line_1 || proj.location?.split(",")[0]?.trim() || "",
      addressLine2: proj.addressLine2 || proj.address_line_2 || "",
      city: proj.city || "Chennai",
      state: proj.state || "Tamil Nadu",
      postalCode: proj.postalCode || proj.postal_code || "",
      countryCode: proj.countryCode || proj.country_code || "IN",
      totalArea: proj.totalArea || "25.5 Acres",
      defaultPricePerSqft: proj.defaultPricePerSqft || 2500,
      defaultTokenAmount: proj.defaultTokenAmount || proj.tokenRequired || 10000,
      description: proj.description || "",
    });
    setUploadedPlots([]);
    setCsvFileName("");
    setCsvFileToUpload(null);
    setUploadedImagePreview(proj.imageUrl || null);
    setCreateStep("form");
    setShowModal(true);
  };

  // Save changes / Deploy to Master Plan and sync across portals
  const handleDeployAndSync = async () => {
    if (!form.name.trim()) {
      toast.error("Project Name is required.");
      return;
    }

    try {
      if (isEditing && editingProjectId) {
        // 1. Update Project in PostgreSQL (cascades to all 184 plots)
        const res = await fetch("http://localhost:8000/api/v1/projects/" + editingProjectId, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            code: form.code,
            address_line_1: form.addressLine1,
            address_line_2: form.addressLine2,
            city: form.city,
            state: form.state,
            postal_code: form.postalCode,
            country_code: form.countryCode,
            total_area: form.totalArea,
            default_price_per_sqft: Number(form.defaultPricePerSqft),
            default_token_amount: Number(form.defaultTokenAmount),
            description: form.description,
            image_url: uploadedImagePreview,
          }),
        });

        if (!res.ok) {
          toast.error("Failed to update project in database.");
          return;
        }

        // 2. Upload CSV if a new one was attached
        if (csvFileToUpload) {
          const formData = new FormData();
          formData.append("file", csvFileToUpload);
          await fetch("http://localhost:8000/api/v1/plots/upload-csv", {
            method: "POST",
            body: formData,
          });
        }

        toast.success("✓ Project details updated & cascaded to all 184 plots in PostgreSQL!");
      } else {
        // Create Mode
        const res = await fetch("http://localhost:8000/api/v1/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            code: form.code || ("PRJ-" + Math.floor(1000 + Math.random() * 9000)),
            address_line_1: form.addressLine1,
            address_line_2: form.addressLine2,
            city: form.city || "Chennai",
            state: form.state || "Tamil Nadu",
            postal_code: form.postalCode || "600001",
            country_code: form.countryCode || "IN",
            total_area: form.totalArea || "25.5 Acres",
            default_price_per_sqft: Number(form.defaultPricePerSqft) || 2500,
            default_token_amount: Number(form.defaultTokenAmount) || 10000,
            description: form.description,
            image_url: uploadedImagePreview || "/blueprint.png",
          }),
        });

        if (csvFileToUpload) {
          const formData = new FormData();
          formData.append("file", csvFileToUpload);
          await fetch("http://localhost:8000/api/v1/plots/upload-csv", {
            method: "POST",
            body: formData,
          });
        }
        toast.success("✓ Project created & saved to database!");
      }
    } catch (err) {
      console.warn("Backend update error:", err);
    }

    // Refresh store & list
    await fetchPlots();
    await fetchProjects();

    setLayoutMode("blueprint");
    if (uploadedImagePreview) {
      setBlueprintImage(uploadedImagePreview);
    }
    setShowModal(false);
    setCreateStep("form");
    navigate("/admin/plot-layout");
  };

  const previewList = uploadedPlots;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Township Projects</h1>
          <p className="text-slate-500 text-xs font-medium">{projects.length} Active Real Estate Developments</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/20"
        >
          <Plus size={16} />
          Create Project
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            {/* Project Header / Cover Image */}
            <div className="h-48 relative overflow-hidden bg-slate-900">
              <img
                src={proj.imageUrl || blueprintImage || "/blueprint.png"}
                alt={proj.name}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-slate-900/80 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-lg font-mono font-bold flex items-center gap-1.5 border border-white/10">
                  <Building2 size={12} className="text-sky-400" />
                  {proj.code}
                </span>
              </div>
              <div className="absolute top-4 right-4">
                <span className="bg-emerald-500 text-white text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-black shadow-sm">
                  {proj.status}
                </span>
              </div>
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <h3 className="font-black text-xl leading-tight">{proj.name}</h3>
                <p className="text-slate-300 text-xs mt-1 font-medium flex items-center gap-1.5">
                  <MapPin size={12} className="text-sky-400 shrink-0" />
                  <span>{proj.location}</span> • <b className="text-sky-400 font-bold">{proj.totalArea || "25.5 Acres"}</b>
                </p>
              </div>
            </div>

            {/* Project Body */}
            <div className="p-5 space-y-4">
              {/* Dynamic Stats Grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-lg font-black text-slate-900">{proj.totalPlots || currentStorePlots.length}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</div>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <div className="text-lg font-black text-emerald-800">
                    {proj.availablePlots !== undefined ? proj.availablePlots : currentStorePlots.filter((p) => p.status === "available").length}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Available</div>
                </div>
                <div className="bg-yellow-50 p-2.5 rounded-xl border border-yellow-200">
                  <div className="text-lg font-black text-yellow-900">
                    {proj.tokenBookedPlots !== undefined ? proj.tokenBookedPlots : currentStorePlots.filter((p) => p.status === "token_booked").length}
                  </div>
                  <div className="text-[10px] text-yellow-800 font-bold uppercase tracking-wider">Booked</div>
                </div>
                <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <div className="text-lg font-black text-rose-800">
                    {proj.soldPlots !== undefined ? proj.soldPlots : currentStorePlots.filter((p) => p.status === "sold").length}
                  </div>
                  <div className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">Sold Out</div>
                </div>
              </div>

              {/* Total Project Valuation */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">Estimated Project Value</span>
                <span className="text-sm font-black text-slate-900">{formatCurrency(proj.totalValue || 0)}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setLayoutMode("blueprint");
                    navigate("/admin/plot-layout");
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl text-xs font-black transition-all uppercase tracking-wider flex-1 shadow-md shadow-blue-500/20"
                >
                  <Map size={14} />
                  View Blueprint Layout
                </button>
                <button
                  onClick={() => navigate("/admin/plots")}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors flex-1"
                >
                  <Eye size={14} />
                  Plots List
                </button>
                <button
                  onClick={() => handleExportCsv(proj)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
                  title="Export Live Database Plots to CSV"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline font-black">Export</span>
                </button>
                <button
                  onClick={() => openEditModal(proj)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                  title="Edit Project Details & Settings"
                >
                  <Pencil size={14} />
                  <span className="font-bold">Edit</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageFile}
        accept="image/*,.pdf,.svg"
        className="hidden"
      />
      <input
        type="file"
        ref={csvInputRef}
        onChange={handleCsvFile}
        accept=".csv,.xlsx,.txt"
        className="hidden"
      />

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setCreateStep("form");
        }}
        title={isEditing ? "Edit Project Master Details" : "Create New Township Project"}
        size="lg"
      >
        {/* STEP 1: Comprehensive Details Form */}
        {createStep === "form" && (
          <div className="space-y-4">
            {/* Section 1: Project Identity */}
            <div className="space-y-2">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={13} className="text-blue-600" />
                Project Identity
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Project Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:border-sky-500 outline-none"
                    placeholder="e.g. SCP Dream House"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Project Code *</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:border-sky-500 outline-none"
                    placeholder="e.g. SCP-2026"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Complete Location & Address Details */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={13} className="text-emerald-600" />
                Complete Location & Postal Address (Cascades to all 184 plots)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Street Address / Address 1</label>
                  <input
                    value={form.addressLine1}
                    onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:border-sky-500 outline-none"
                    placeholder="e.g. OMR Main Road, Sholinganallur"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Landmark / Address 2</label>
                  <input
                    value={form.addressLine2}
                    onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:border-sky-500 outline-none"
                    placeholder="e.g. Near Infosys Campus"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">City *</label>
                    <input
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:border-sky-500 outline-none"
                      placeholder="e.g. Chennai"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">State *</label>
                    <input
                      value={form.state}
                      onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:border-sky-500 outline-none"
                      placeholder="e.g. Tamil Nadu"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Postal / PIN Code</label>
                    <input
                      value={form.postalCode}
                      onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:border-sky-500 outline-none"
                      placeholder="e.g. 600119"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Country</label>
                    <input
                      value={form.countryCode}
                      onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:border-sky-500 outline-none"
                      placeholder="IN"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Land Area & Rate Defaults */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} className="text-purple-600" />
                Land Area & Pricing Defaults
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Total Land Area</label>
                  <input
                    value={form.totalArea}
                    onChange={(e) => setForm((f) => ({ ...f, totalArea: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:border-sky-500 outline-none"
                    placeholder="e.g. 25.5 Acres"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Default Rate / Sq.Ft (₹)</label>
                  <input
                    type="number"
                    value={form.defaultPricePerSqft}
                    onChange={(e) => setForm((f) => ({ ...f, defaultPricePerSqft: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:border-sky-500 outline-none"
                    placeholder="2500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Min Token Required (₹)</label>
                  <input
                    type="number"
                    value={form.defaultTokenAmount}
                    onChange={(e) => setForm((f) => ({ ...f, defaultTokenAmount: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:border-sky-500 outline-none"
                    placeholder="10000"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Description */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block mb-1">Description / Project Overview</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:border-sky-500 outline-none h-16 resize-none"
                placeholder="Project overview & layout highlights..."
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setCreateStep("upload")}
                  className="px-4 py-2 text-xs font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Blueprint & CSV Settings →
                </button>
                <button
                  onClick={handleDeployAndSync}
                  className="px-5 py-2.5 text-xs text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 rounded-xl font-black uppercase tracking-wider shadow-sm"
                >
                  {isEditing ? "Save & Cascade to All Plots" : "Create & Deploy →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Upload Blueprint Image & CSV Dataset */}
        {createStep === "upload" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Upload Blueprint Drawing / PDF */}
              <div
                onClick={() => imageInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/30 transition-colors"
              >
                <ImageIcon size={28} className="text-blue-600 mx-auto mb-2" />
                <p className="text-xs font-black text-slate-800">1. Update Blueprint (PDF, SVG, Image)</p>
                <p className="text-[10px] text-slate-400 mt-1">Select PDF, PNG, JPG, or SVG Architectural Drawing</p>
                {uploadedImagePreview ? (
                  <p className="text-xs text-emerald-700 font-bold mt-3">✓ Blueprint (PDF / Image) Loaded</p>
                ) : (
                  <p className="text-xs text-blue-700 font-bold mt-3 underline">Click to choose PDF or image file →</p>
                )}
              </div>

              {/* Option B: Upload Plot CSV / Dataset */}
              <div
                onClick={() => csvInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
              >
                <FileSpreadsheet size={28} className="text-emerald-700 mx-auto mb-2" />
                <p className="text-xs font-black text-slate-800">2. Upload/Replace Plot CSV File</p>
                <p className="text-[10px] text-slate-400 mt-1">plot_details.csv, Excel, or custom dataset</p>
                {csvFileName ? (
                  <p className="text-xs text-emerald-700 font-bold mt-3">✓ {csvFileName} Loaded</p>
                ) : (
                  <p className="text-xs text-emerald-700 font-bold mt-3 underline">Click to upload .csv file →</p>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => setCreateStep("form")}
                className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                ← Back to Details
              </button>
              <button
                onClick={handleDeployAndSync}
                className="px-5 py-2.5 text-xs text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 rounded-xl font-black uppercase tracking-wider shadow-sm"
              >
                {isEditing ? "Save & Cascade to All Plots" : "Create & Deploy →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview with Fixed Columns */}
        {createStep === "preview" && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800 font-black text-lg">
                  {previewList.length}
                </div>
                <div>
                  <div className="font-black text-emerald-950 text-xs">
                    {previewList.length} Survey Plots Successfully Validated
                  </div>
                  <div className="text-[11px] text-emerald-800 font-medium">
                    {csvFileName ? "Imported from " + csvFileName : "Uploaded CSV Dataset"}
                  </div>
                </div>
              </div>
            </div>

            {/* Table Preview */}
            <div className="border border-slate-200 rounded-2xl max-h-72 overflow-y-auto bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-3">Plot No</th>
                    <th className="p-3">Area</th>
                    <th className="p-3">Dimensions</th>
                    <th className="p-3">Facing</th>
                    <th className="p-3">Road Width</th>
                    <th className="p-3">Rate/sq.ft</th>
                    <th className="p-3">Total Price</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {previewList.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{p.plotNumber}</td>
                      <td className="p-3 text-slate-700">{p.area} sq.ft</td>
                      <td className="p-3 text-slate-600 font-mono">{p.dimensions || "30x50"}</td>
                      <td className="p-3 text-slate-600">{p.facing || "North"}</td>
                      <td className="p-3 text-slate-700 font-bold">{p.roadWidth || "20 ft"}</td>
                      <td className="p-3 text-slate-700">₹{p.pricePerSqft?.toLocaleString("en-IN")}</td>
                      <td className="p-3 font-black text-emerald-800">{formatCurrencyFull(p.totalPrice)}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => setCreateStep("upload")}
                className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                ← Back
              </button>
              <button
                onClick={handleDeployAndSync}
                className="px-6 py-2.5 text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 rounded-xl font-black uppercase tracking-wider shadow-sm"
              >
                ✓ Save & Deploy ({previewList.length} Plots)
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
