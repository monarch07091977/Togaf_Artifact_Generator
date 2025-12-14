/**
 * Seed Capability Catalog and Maturity Model
 * 
 * This script seeds:
 * 1. TOGAF 5-level maturity model
 * 2. Industry-specific capability catalogs for:
 *    - Oil & Gas
 *    - Chemical
 *    - Manufacturing
 *    - Public Sector
 */

import { getDb } from "./db";
import { capabilityCatalog, maturityModels } from "../drizzle/schema";

const TOGAF_MATURITY_MODEL = {
  modelId: "TOGAF_5_LEVEL",
  name: "TOGAF 5-Level Maturity Model",
  description: "Standard TOGAF capability maturity model with 5 levels from Initial to Optimizing",
  levels: [
    {
      code: "initial",
      level: 1,
      label: "Initial",
      description: "Ad-hoc, unpredictable processes with no formal documentation or standards",
      color: "#ef4444", // red
      icon: "circle",
      characteristics: [
        "Processes are ad-hoc and chaotic",
        "Success depends on individual heroics",
        "No formal documentation",
        "Unpredictable outcomes"
      ]
    },
    {
      code: "developing",
      level: 2,
      label: "Developing",
      description: "Some repeatability with basic processes documented but not consistently followed",
      color: "#f97316", // orange
      icon: "triangle",
      characteristics: [
        "Basic processes documented",
        "Some repeatability achieved",
        "Inconsistent execution",
        "Limited governance"
      ]
    },
    {
      code: "defined",
      level: 3,
      label: "Defined",
      description: "Documented, standardized processes that are understood and followed organization-wide",
      color: "#eab308", // yellow
      icon: "square",
      characteristics: [
        "Processes fully documented",
        "Standards established",
        "Consistent execution",
        "Organization-wide adoption"
      ]
    },
    {
      code: "managed",
      level: 4,
      label: "Managed",
      description: "Processes are measured, monitored, and controlled with quantitative metrics",
      color: "#84cc16", // light green
      icon: "diamond",
      characteristics: [
        "Processes measured and monitored",
        "Quantitative metrics in place",
        "Performance controlled",
        "Data-driven decisions"
      ]
    },
    {
      code: "optimizing",
      level: 5,
      label: "Optimizing",
      description: "Continuous improvement culture with proactive optimization and innovation",
      color: "#22c55e", // dark green
      icon: "star",
      characteristics: [
        "Continuous improvement culture",
        "Proactive optimization",
        "Innovation encouraged",
        "Industry-leading practices"
      ]
    }
  ]
};

// Oil & Gas Industry Capabilities
const OIL_GAS_CAPABILITIES = [
  // Upstream (Exploration & Production)
  {
    industry: "Oil & Gas",
    referenceId: "OG.UP.01",
    name: "Exploration & Appraisal",
    description: "Identify, evaluate, and assess hydrocarbon reserves through geological surveys, seismic analysis, and exploratory drilling",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Oil & Gas",
    referenceId: "OG.UP.02",
    name: "Field Development & Production",
    description: "Design, construct, and operate production facilities to extract oil and gas from proven reserves",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Oil & Gas",
    referenceId: "OG.UP.03",
    name: "Reservoir Management",
    description: "Optimize reservoir performance through monitoring, analysis, and enhanced recovery techniques",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Oil & Gas",
    referenceId: "OG.UP.04",
    name: "Well Operations & Maintenance",
    description: "Maintain well integrity, perform workovers, and ensure safe and efficient well operations",
    level: 1,
    parentReferenceId: null
  },
  
  // Midstream (Transportation & Storage)
  {
    industry: "Oil & Gas",
    referenceId: "OG.MS.01",
    name: "Pipeline Operations",
    description: "Transport crude oil, natural gas, and refined products through pipeline networks",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Oil & Gas",
    referenceId: "OG.MS.02",
    name: "Storage & Terminaling",
    description: "Store and handle petroleum products at terminals, tank farms, and storage facilities",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Oil & Gas",
    referenceId: "OG.MS.03",
    name: "Marine & Shipping Operations",
    description: "Manage tanker fleet, port operations, and maritime logistics for petroleum transport",
    level: 1,
    parentReferenceId: null
  },
  
  // Downstream (Refining & Marketing)
  {
    industry: "Oil & Gas",
    referenceId: "OG.DS.01",
    name: "Refining Operations",
    description: "Convert crude oil into refined products through distillation, cracking, and treatment processes",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Oil & Gas",
    referenceId: "OG.DS.02",
    name: "Product Blending & Quality Control",
    description: "Blend refined products to meet specifications and ensure quality compliance",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Oil & Gas",
    referenceId: "OG.DS.03",
    name: "Marketing & Distribution",
    description: "Market and distribute petroleum products to wholesale and retail customers",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Oil & Gas",
    referenceId: "OG.DS.04",
    name: "Retail Operations",
    description: "Operate retail fuel stations and convenience stores serving end consumers",
    level: 1,
    parentReferenceId: null
  },
  
  // Trading & Commercial
  {
    industry: "Oil & Gas",
    referenceId: "OG.TC.01",
    name: "Commodity Trading",
    description: "Trade crude oil, natural gas, and refined products in physical and financial markets",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Oil & Gas",
    referenceId: "OG.TC.02",
    name: "Risk Management",
    description: "Manage commodity price risk, currency risk, and operational risks through hedging and insurance",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Oil & Gas",
    referenceId: "OG.TC.03",
    name: "Supply Chain Optimization",
    description: "Optimize end-to-end supply chain from wellhead to customer delivery",
    level: 1,
    parentReferenceId: null
  },
  
  // HSE & Compliance
  {
    industry: "Oil & Gas",
    referenceId: "OG.HSE.01",
    name: "Health, Safety & Environment",
    description: "Ensure worker safety, process safety, and environmental protection across operations",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Oil & Gas",
    referenceId: "OG.HSE.02",
    name: "Regulatory Compliance",
    description: "Comply with petroleum industry regulations, permits, and reporting requirements",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Oil & Gas",
    referenceId: "OG.HSE.03",
    name: "Emergency Response & Crisis Management",
    description: "Prepare for and respond to oil spills, fires, and other emergencies",
    level: 1,
    parentReferenceId: null
  },
  
  // Asset Management
  {
    industry: "Oil & Gas",
    referenceId: "OG.AM.01",
    name: "Asset Integrity Management",
    description: "Maintain integrity of production facilities, pipelines, and equipment through inspection and maintenance",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Oil & Gas",
    referenceId: "OG.AM.02",
    name: "Capital Projects & Engineering",
    description: "Plan, design, and execute capital projects for new facilities and major upgrades",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Oil & Gas",
    referenceId: "OG.AM.03",
    name: "Decommissioning & Abandonment",
    description: "Safely decommission and abandon end-of-life wells, facilities, and infrastructure",
    level: 1,
    parentReferenceId: null
  }
];

// Chemical Industry Capabilities
const CHEMICAL_CAPABILITIES = [
  // R&D & Innovation
  {
    industry: "Chemical",
    referenceId: "CH.RD.01",
    name: "Product Research & Development",
    description: "Develop new chemical products, formulations, and applications through research and innovation",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Chemical",
    referenceId: "CH.RD.02",
    name: "Process Development & Scale-Up",
    description: "Develop and scale chemical processes from lab to pilot to commercial production",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Chemical",
    referenceId: "CH.RD.03",
    name: "Technical Service & Application Support",
    description: "Provide technical support to customers for product application and troubleshooting",
    level: 1,
    parentReferenceId: null
  },
  
  // Manufacturing Operations
  {
    industry: "Chemical",
    referenceId: "CH.MO.01",
    name: "Batch Manufacturing",
    description: "Produce chemicals in discrete batches for specialty and fine chemicals",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Chemical",
    referenceId: "CH.MO.02",
    name: "Continuous Manufacturing",
    description: "Operate continuous chemical processes for commodity and petrochemical production",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Chemical",
    referenceId: "CH.MO.03",
    name: "Formulation & Blending",
    description: "Blend and formulate chemical products to meet customer specifications",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Chemical",
    referenceId: "CH.MO.04",
    name: "Packaging & Filling",
    description: "Package chemical products in drums, totes, bulk containers, and retail packaging",
    level: 1,
    parentReferenceId: null
  },
  
  // Quality & Compliance
  {
    industry: "Chemical",
    referenceId: "CH.QC.01",
    name: "Quality Control & Testing",
    description: "Test raw materials, intermediates, and finished products to ensure quality specifications",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Chemical",
    referenceId: "CH.QC.02",
    name: "Regulatory Affairs",
    description: "Manage chemical registrations, REACH compliance, and regulatory submissions",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Chemical",
    referenceId: "CH.QC.03",
    name: "Product Stewardship",
    description: "Manage product safety data sheets, hazard communication, and responsible care programs",
    level: 1,
    parentReferenceId: null
  },
  
  // Supply Chain
  {
    industry: "Chemical",
    referenceId: "CH.SC.01",
    name: "Raw Material Procurement",
    description: "Source and procure chemical raw materials, intermediates, and packaging materials",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Chemical",
    referenceId: "CH.SC.02",
    name: "Production Planning & Scheduling",
    description: "Plan and schedule chemical production to meet demand and optimize asset utilization",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Chemical",
    referenceId: "CH.SC.03",
    name: "Warehouse & Inventory Management",
    description: "Manage chemical storage, inventory control, and material handling",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Chemical",
    referenceId: "CH.SC.04",
    name: "Logistics & Distribution",
    description: "Manage transportation and distribution of chemical products via truck, rail, and vessel",
    level: 1,
    parentReferenceId: null
  },
  
  // HSE & Process Safety
  {
    industry: "Chemical",
    referenceId: "CH.HSE.01",
    name: "Process Safety Management",
    description: "Manage process hazards, conduct HAZOP studies, and implement safety systems",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Chemical",
    referenceId: "CH.HSE.02",
    name: "Occupational Health & Safety",
    description: "Protect worker health and safety through hazard control, PPE, and safety training",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Chemical",
    referenceId: "CH.HSE.03",
    name: "Environmental Management",
    description: "Manage air emissions, wastewater, waste disposal, and environmental permits",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Chemical",
    referenceId: "CH.HSE.04",
    name: "Emergency Preparedness & Response",
    description: "Prepare for and respond to chemical spills, fires, and process upsets",
    level: 1,
    parentReferenceId: null
  },
  
  // Commercial & Customer Management
  {
    industry: "Chemical",
    referenceId: "CH.CM.01",
    name: "Sales & Account Management",
    description: "Manage customer relationships, negotiate contracts, and drive sales growth",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Chemical",
    referenceId: "CH.CM.02",
    name: "Pricing & Contract Management",
    description: "Set product pricing, manage contracts, and optimize commercial terms",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Chemical",
    referenceId: "CH.CM.03",
    name: "Market Intelligence & Strategy",
    description: "Analyze market trends, competitive dynamics, and develop market strategies",
    level: 1,
    parentReferenceId: null
  }
];

// Manufacturing Industry Capabilities
const MANUFACTURING_CAPABILITIES = [
  // Product Development
  {
    industry: "Manufacturing",
    referenceId: "MF.PD.01",
    name: "Product Design & Engineering",
    description: "Design and engineer new products from concept through detailed design and prototyping",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Manufacturing",
    referenceId: "MF.PD.02",
    name: "New Product Introduction (NPI)",
    description: "Launch new products through pilot production, validation, and ramp-up to volume production",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Manufacturing",
    referenceId: "MF.PD.03",
    name: "Product Lifecycle Management",
    description: "Manage products through introduction, growth, maturity, and phase-out stages",
    level: 1,
    parentReferenceId: null
  },
  
  // Manufacturing Operations
  {
    industry: "Manufacturing",
    referenceId: "MF.MO.01",
    name: "Production Planning & Control",
    description: "Plan production schedules, allocate capacity, and control shop floor execution",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Manufacturing",
    referenceId: "MF.MO.02",
    name: "Fabrication & Machining",
    description: "Fabricate and machine components through cutting, forming, and material removal processes",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Manufacturing",
    referenceId: "MF.MO.03",
    name: "Assembly & Integration",
    description: "Assemble components and subassemblies into finished products",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Manufacturing",
    referenceId: "MF.MO.04",
    name: "Testing & Inspection",
    description: "Test and inspect products to ensure they meet quality and performance specifications",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Manufacturing",
    referenceId: "MF.MO.05",
    name: "Packaging & Shipping",
    description: "Package finished products and prepare for shipment to customers",
    level: 1,
    parentReferenceId: null
  },
  
  // Quality Management
  {
    industry: "Manufacturing",
    referenceId: "MF.QM.01",
    name: "Quality Planning & Standards",
    description: "Define quality standards, specifications, and inspection criteria for products and processes",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Manufacturing",
    referenceId: "MF.QM.02",
    name: "Statistical Process Control (SPC)",
    description: "Monitor and control manufacturing processes using statistical methods",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Manufacturing",
    referenceId: "MF.QM.03",
    name: "Nonconformance & Corrective Action",
    description: "Manage nonconforming products, root cause analysis, and corrective actions",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Manufacturing",
    referenceId: "MF.QM.04",
    name: "Supplier Quality Management",
    description: "Qualify suppliers, audit quality systems, and manage supplier performance",
    level: 1,
    parentReferenceId: null
  },
  
  // Supply Chain Management
  {
    industry: "Manufacturing",
    referenceId: "MF.SCM.01",
    name: "Demand Planning & Forecasting",
    description: "Forecast customer demand and plan inventory levels to meet service targets",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Manufacturing",
    referenceId: "MF.SCM.02",
    name: "Procurement & Sourcing",
    description: "Source and procure raw materials, components, and services from suppliers",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Manufacturing",
    referenceId: "MF.SCM.03",
    name: "Inventory Management",
    description: "Manage raw material, work-in-process, and finished goods inventory",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Manufacturing",
    referenceId: "MF.SCM.04",
    name: "Logistics & Distribution",
    description: "Manage warehousing, transportation, and distribution to customers",
    level: 1,
    parentReferenceId: null
  },
  
  // Maintenance & Engineering
  {
    industry: "Manufacturing",
    referenceId: "MF.ME.01",
    name: "Preventive & Predictive Maintenance",
    description: "Maintain production equipment through scheduled and condition-based maintenance",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Manufacturing",
    referenceId: "MF.ME.02",
    name: "Manufacturing Engineering",
    description: "Develop and optimize manufacturing processes, tooling, and work instructions",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Manufacturing",
    referenceId: "MF.ME.03",
    name: "Facilities & Utilities Management",
    description: "Manage factory facilities, utilities, and infrastructure",
    level: 1,
    parentReferenceId: null
  },
  
  // Continuous Improvement
  {
    industry: "Manufacturing",
    referenceId: "MF.CI.01",
    name: "Lean Manufacturing",
    description: "Eliminate waste and optimize flow through lean principles and practices",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Manufacturing",
    referenceId: "MF.CI.02",
    name: "Six Sigma & Process Improvement",
    description: "Reduce variation and improve quality through Six Sigma and process improvement projects",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Manufacturing",
    referenceId: "MF.CI.03",
    name: "Automation & Digitalization",
    description: "Implement automation, robotics, and digital manufacturing technologies",
    level: 1,
    parentReferenceId: null
  }
];

// Public Sector Capabilities
const PUBLIC_SECTOR_CAPABILITIES = [
  // Citizen Services
  {
    industry: "Public Sector",
    referenceId: "PS.CS.01",
    name: "Citizen Engagement & Communication",
    description: "Engage with citizens through multiple channels and provide information about government services",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.CS.02",
    name: "Licensing & Permitting",
    description: "Issue licenses, permits, and certifications for businesses and individuals",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.CS.03",
    name: "Benefits Administration",
    description: "Administer social benefits, welfare programs, and public assistance",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.CS.04",
    name: "Public Records Management",
    description: "Maintain and provide access to public records, vital statistics, and government documents",
    level: 1,
    parentReferenceId: null
  },
  
  // Policy & Regulation
  {
    industry: "Public Sector",
    referenceId: "PS.PR.01",
    name: "Policy Development & Analysis",
    description: "Develop, analyze, and recommend public policies to address societal needs",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.PR.02",
    name: "Legislative Affairs",
    description: "Draft legislation, support legislative processes, and track bill status",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.PR.03",
    name: "Regulatory Compliance & Enforcement",
    description: "Enforce regulations, conduct inspections, and ensure compliance with laws",
    level: 1,
    parentReferenceId: null
  },
  
  // Public Safety & Emergency Services
  {
    industry: "Public Sector",
    referenceId: "PS.PS.01",
    name: "Law Enforcement",
    description: "Maintain public order, prevent crime, and enforce laws through police services",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.PS.02",
    name: "Fire & Rescue Services",
    description: "Provide fire suppression, rescue, and emergency medical services",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.PS.03",
    name: "Emergency Management",
    description: "Prepare for, respond to, and recover from natural disasters and emergencies",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.PS.04",
    name: "Homeland Security & Border Control",
    description: "Protect national security, manage borders, and prevent terrorism",
    level: 1,
    parentReferenceId: null
  },
  
  // Infrastructure & Public Works
  {
    industry: "Public Sector",
    referenceId: "PS.IPW.01",
    name: "Transportation Infrastructure",
    description: "Plan, build, and maintain roads, bridges, and public transportation systems",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.IPW.02",
    name: "Water & Wastewater Management",
    description: "Provide clean water supply and wastewater treatment services",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.IPW.03",
    name: "Waste Management & Recycling",
    description: "Collect, dispose, and recycle solid waste and manage landfills",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.IPW.04",
    name: "Parks & Recreation",
    description: "Maintain public parks, recreational facilities, and community programs",
    level: 1,
    parentReferenceId: null
  },
  
  // Education & Health Services
  {
    industry: "Public Sector",
    referenceId: "PS.EHS.01",
    name: "Public Education Administration",
    description: "Administer public schools, develop curriculum, and manage educational programs",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.EHS.02",
    name: "Public Health Services",
    description: "Provide public health programs, disease prevention, and health education",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.EHS.03",
    name: "Healthcare Facilities Management",
    description: "Operate public hospitals, clinics, and healthcare facilities",
    level: 1,
    parentReferenceId: null
  },
  
  // Financial Management
  {
    industry: "Public Sector",
    referenceId: "PS.FM.01",
    name: "Budgeting & Financial Planning",
    description: "Develop annual budgets, financial plans, and allocate public funds",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.FM.02",
    name: "Revenue Collection & Tax Administration",
    description: "Collect taxes, fees, and other government revenues",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.FM.03",
    name: "Procurement & Contract Management",
    description: "Procure goods and services through competitive bidding and manage contracts",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.FM.04",
    name: "Financial Reporting & Audit",
    description: "Prepare financial statements, conduct audits, and ensure fiscal accountability",
    level: 1,
    parentReferenceId: null
  },
  
  // Digital Government
  {
    industry: "Public Sector",
    referenceId: "PS.DG.01",
    name: "E-Government Services",
    description: "Provide online government services, portals, and digital transactions",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.DG.02",
    name: "Data Management & Analytics",
    description: "Manage government data, perform analytics, and support evidence-based decision making",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Public Sector",
    referenceId: "PS.DG.03",
    name: "Cybersecurity & Privacy",
    description: "Protect government systems and citizen data from cyber threats",
    level: 1,
    parentReferenceId: null
  }
];

export async function seedCapabilityCatalog() {
  const db = await getDb();
  if (!db) {
    console.error("[Seed] Database not available");
    return;
  }

  try {
    console.log("[Seed] Starting capability catalog and maturity model seeding...");

    // 1. Seed TOGAF Maturity Model
    console.log("[Seed] Inserting TOGAF 5-Level Maturity Model...");
    await db.insert(maturityModels).values(TOGAF_MATURITY_MODEL).onDuplicateKeyUpdate({
      set: {
        name: TOGAF_MATURITY_MODEL.name,
        description: TOGAF_MATURITY_MODEL.description,
        levels: TOGAF_MATURITY_MODEL.levels as any,
      }
    });
    console.log("[Seed] ✓ Maturity model inserted");

    // 2. Seed Oil & Gas Capabilities
    console.log(`[Seed] Inserting ${OIL_GAS_CAPABILITIES.length} Oil & Gas capabilities...`);
    for (const cap of OIL_GAS_CAPABILITIES) {
      await db.insert(capabilityCatalog).values(cap).onDuplicateKeyUpdate({
        set: {
          name: cap.name,
          description: cap.description,
          level: cap.level,
          parentReferenceId: cap.parentReferenceId,
        }
      });
    }
    console.log("[Seed] ✓ Oil & Gas capabilities inserted");

    // 3. Seed Chemical Capabilities
    console.log(`[Seed] Inserting ${CHEMICAL_CAPABILITIES.length} Chemical capabilities...`);
    for (const cap of CHEMICAL_CAPABILITIES) {
      await db.insert(capabilityCatalog).values(cap).onDuplicateKeyUpdate({
        set: {
          name: cap.name,
          description: cap.description,
          level: cap.level,
          parentReferenceId: cap.parentReferenceId,
        }
      });
    }
    console.log("[Seed] ✓ Chemical capabilities inserted");

    // 4. Seed Manufacturing Capabilities
    console.log(`[Seed] Inserting ${MANUFACTURING_CAPABILITIES.length} Manufacturing capabilities...`);
    for (const cap of MANUFACTURING_CAPABILITIES) {
      await db.insert(capabilityCatalog).values(cap).onDuplicateKeyUpdate({
        set: {
          name: cap.name,
          description: cap.description,
          level: cap.level,
          parentReferenceId: cap.parentReferenceId,
        }
      });
    }
    console.log("[Seed] ✓ Manufacturing capabilities inserted");

    // 5. Seed Public Sector Capabilities
    console.log(`[Seed] Inserting ${PUBLIC_SECTOR_CAPABILITIES.length} Public Sector capabilities...`);
    for (const cap of PUBLIC_SECTOR_CAPABILITIES) {
      await db.insert(capabilityCatalog).values(cap).onDuplicateKeyUpdate({
        set: {
          name: cap.name,
          description: cap.description,
          level: cap.level,
          parentReferenceId: cap.parentReferenceId,
        }
      });
    }
    console.log("[Seed] ✓ Public Sector capabilities inserted");

    console.log("[Seed] ✅ Capability catalog seeding completed successfully!");
    console.log(`[Seed] Total capabilities inserted: ${
      OIL_GAS_CAPABILITIES.length +
      CHEMICAL_CAPABILITIES.length +
      MANUFACTURING_CAPABILITIES.length +
      PUBLIC_SECTOR_CAPABILITIES.length
    }`);

  } catch (error) {
    console.error("[Seed] Error seeding capability catalog:", error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCapabilityCatalog()
    .then(() => {
      console.log("[Seed] Script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("[Seed] Script failed:", error);
      process.exit(1);
    });
}
