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

// Enterprise Support Capabilities (Cross-Industry)
const ENTERPRISE_CAPABILITIES = [
  // Financial Management
  {
    industry: "Enterprise",
    referenceId: "ES.FIN.01",
    name: "Financial Planning & Budgeting",
    description: "Develop financial plans, budgets, and forecasts to guide organizational financial decisions",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.FIN.02",
    name: "Accounts Payable & Receivable",
    description: "Manage vendor payments, customer invoicing, and cash collection processes",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.FIN.03",
    name: "General Ledger & Financial Reporting",
    description: "Maintain general ledger, prepare financial statements, and ensure compliance with accounting standards",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.FIN.04",
    name: "Treasury & Cash Management",
    description: "Manage cash flow, liquidity, investments, and banking relationships",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.FIN.05",
    name: "Financial Compliance & Audit",
    description: "Ensure compliance with financial regulations, support internal/external audits",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.FIN.06",
    name: "Tax Management",
    description: "Manage tax compliance, planning, and reporting across all jurisdictions",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.FIN.07",
    name: "Cost Accounting & Analysis",
    description: "Track costs, analyze profitability, and support pricing decisions",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.FIN.08",
    name: "Financial Risk Management",
    description: "Identify, assess, and mitigate financial risks including credit, market, and operational risks",
    level: 1,
    parentReferenceId: null
  },

  // Human Resources
  {
    industry: "Enterprise",
    referenceId: "ES.HR.01",
    name: "Talent Acquisition & Recruitment",
    description: "Attract, source, and hire qualified candidates to meet organizational staffing needs",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.HR.02",
    name: "Employee Onboarding & Offboarding",
    description: "Manage new hire orientation, integration, and employee exit processes",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.HR.03",
    name: "Performance Management",
    description: "Set goals, conduct performance reviews, and manage employee development plans",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.HR.04",
    name: "Learning & Development",
    description: "Design and deliver training programs to enhance employee skills and capabilities",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.HR.05",
    name: "Compensation & Benefits Administration",
    description: "Manage salary structures, incentive programs, and employee benefits",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.HR.06",
    name: "HR Analytics & Workforce Planning",
    description: "Analyze workforce data, forecast staffing needs, and support strategic workforce decisions",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.HR.07",
    name: "Employee Relations & Engagement",
    description: "Foster positive employee relations, manage conflicts, and drive employee engagement",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.HR.08",
    name: "HR Compliance & Policy Management",
    description: "Ensure compliance with labor laws, manage HR policies, and maintain employee records",
    level: 1,
    parentReferenceId: null
  },

  // Sales & Marketing
  {
    industry: "Enterprise",
    referenceId: "ES.SALES.01",
    name: "Sales Planning & Forecasting",
    description: "Develop sales strategies, set targets, and forecast revenue",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.SALES.02",
    name: "Lead Management & CRM",
    description: "Capture, qualify, and nurture sales leads through the sales funnel",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.SALES.03",
    name: "Opportunity Management",
    description: "Manage sales opportunities, proposals, and deal negotiations",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.SALES.04",
    name: "Marketing Campaign Management",
    description: "Plan, execute, and measure marketing campaigns across channels",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.SALES.05",
    name: "Customer Service & Support",
    description: "Provide customer assistance, resolve issues, and manage service requests",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.SALES.06",
    name: "Channel & Partner Management",
    description: "Manage relationships with distributors, resellers, and strategic partners",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.SALES.07",
    name: "Brand Management & Communications",
    description: "Build and protect brand identity, manage corporate communications",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.SALES.08",
    name: "Market Intelligence & Analytics",
    description: "Gather market insights, analyze customer behavior, and track competitive landscape",
    level: 1,
    parentReferenceId: null
  },

  // Information Technology
  {
    industry: "Enterprise",
    referenceId: "ES.IT.01",
    name: "IT Service Management",
    description: "Manage IT service delivery, incident resolution, and service desk operations",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.IT.02",
    name: "Application Development & Maintenance",
    description: "Develop, enhance, and maintain business applications and systems",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.IT.03",
    name: "Infrastructure & Operations",
    description: "Manage servers, networks, storage, and IT infrastructure operations",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.IT.04",
    name: "Cybersecurity & Information Security",
    description: "Protect information assets, manage security risks, and ensure compliance",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.IT.05",
    name: "Data Management & Analytics",
    description: "Manage data assets, ensure data quality, and enable analytics capabilities",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.IT.06",
    name: "Cloud Services & Architecture",
    description: "Design, implement, and manage cloud infrastructure and services",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.IT.07",
    name: "Enterprise Architecture",
    description: "Define IT strategy, architecture standards, and technology roadmaps",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.IT.08",
    name: "IT Vendor & Contract Management",
    description: "Manage relationships with IT vendors, software licenses, and service contracts",
    level: 1,
    parentReferenceId: null
  },

  // Procurement & Supply Chain
  {
    industry: "Enterprise",
    referenceId: "ES.PROC.01",
    name: "Strategic Sourcing",
    description: "Develop sourcing strategies, identify suppliers, and negotiate contracts",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.PROC.02",
    name: "Procurement Operations",
    description: "Process purchase requisitions, issue purchase orders, and manage procurement transactions",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.PROC.03",
    name: "Supplier Relationship Management",
    description: "Manage supplier performance, conduct evaluations, and foster strategic partnerships",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.PROC.04",
    name: "Contract Management",
    description: "Manage contract lifecycle from negotiation through execution and renewal",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.PROC.05",
    name: "Spend Analytics & Category Management",
    description: "Analyze spending patterns, manage procurement categories, and identify savings opportunities",
    level: 1,
    parentReferenceId: null
  },

  // Legal & Compliance
  {
    industry: "Enterprise",
    referenceId: "ES.LEGAL.01",
    name: "Legal Operations & Contract Review",
    description: "Provide legal counsel, review contracts, and manage legal documentation",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.LEGAL.02",
    name: "Regulatory Compliance Management",
    description: "Monitor regulatory changes, ensure compliance, and manage regulatory reporting",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.LEGAL.03",
    name: "Enterprise Risk Management",
    description: "Identify, assess, and mitigate enterprise risks across all business areas",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.LEGAL.04",
    name: "Intellectual Property Management",
    description: "Protect and manage patents, trademarks, copyrights, and trade secrets",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.LEGAL.05",
    name: "Corporate Governance",
    description: "Support board governance, manage corporate policies, and ensure ethical business practices",
    level: 1,
    parentReferenceId: null
  },

  // Corporate Strategy & Planning
  {
    industry: "Enterprise",
    referenceId: "ES.STRAT.01",
    name: "Strategic Planning & Execution",
    description: "Develop corporate strategy, set strategic objectives, and monitor execution",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.STRAT.02",
    name: "Business Performance Management",
    description: "Define KPIs, monitor business performance, and drive continuous improvement",
    level: 1,
    parentReferenceId: null
  },
  {
    industry: "Enterprise",
    referenceId: "ES.STRAT.03",
    name: "Portfolio & Program Management",
    description: "Manage project portfolios, prioritize investments, and oversee program delivery",
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

    // 6. Seed Enterprise Support Capabilities
    console.log(`[Seed] Inserting ${ENTERPRISE_CAPABILITIES.length} Enterprise Support capabilities...`);
    for (const cap of ENTERPRISE_CAPABILITIES) {
      await db.insert(capabilityCatalog).values(cap).onDuplicateKeyUpdate({
        set: {
          name: cap.name,
          description: cap.description,
          level: cap.level,
          parentReferenceId: cap.parentReferenceId,
        }
      });
    }
    console.log("[Seed] ✓ Enterprise Support capabilities inserted");

    console.log("[Seed] ✅ Capability catalog seeding completed successfully!");
    console.log(`[Seed] Total capabilities inserted: ${
      OIL_GAS_CAPABILITIES.length +
      CHEMICAL_CAPABILITIES.length +
      MANUFACTURING_CAPABILITIES.length +
      PUBLIC_SECTOR_CAPABILITIES.length +
      ENTERPRISE_CAPABILITIES.length
    }`);
    console.log(`[Seed]   - Oil & Gas: ${OIL_GAS_CAPABILITIES.length}`);
    console.log(`[Seed]   - Chemical: ${CHEMICAL_CAPABILITIES.length}`);
    console.log(`[Seed]   - Manufacturing: ${MANUFACTURING_CAPABILITIES.length}`);
    console.log(`[Seed]   - Public Sector: ${PUBLIC_SECTOR_CAPABILITIES.length}`);
    console.log(`[Seed]   - Enterprise Support: ${ENTERPRISE_CAPABILITIES.length}`);

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
