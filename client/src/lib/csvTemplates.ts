/**
 * CSV Template Generation Utilities
 * Provides downloadable CSV templates for bulk entity import
 */

export type EntityType = 'businessCapability' | 'application' | 'businessProcess' | 'dataEntity' | 'requirement';

interface TemplateDefinition {
  headers: string[];
  sampleRows: string[][];
  filename: string;
}

const TEMPLATES: Record<EntityType, TemplateDefinition> = {
  businessCapability: {
    headers: ['name', 'description', 'level'],
    sampleRows: [
      ['Customer Management', 'Ability to manage customer information and relationships', '2'],
      ['Order Processing', 'Capability to process and fulfill customer orders', '3'],
      ['Financial Reporting', 'Generate financial reports and statements', '2'],
    ],
    filename: 'business_capabilities_template.csv',
  },
  application: {
    headers: ['name', 'description', 'lifecycle'],
    sampleRows: [
      ['CRM System', 'Customer relationship management platform', 'production'],
      ['ERP System', 'Enterprise resource planning system', 'production'],
      ['Analytics Platform', 'Business intelligence and analytics tool', 'development'],
    ],
    filename: 'applications_template.csv',
  },
  businessProcess: {
    headers: ['name', 'description'],
    sampleRows: [
      ['Customer Onboarding', 'Process for registering and onboarding new customers'],
      ['Order Fulfillment', 'End-to-end process for fulfilling customer orders'],
      ['Invoice Processing', 'Process for generating and sending invoices'],
    ],
    filename: 'business_processes_template.csv',
  },
  dataEntity: {
    headers: ['name', 'description', 'sensitivity'],
    sampleRows: [
      ['Customer', 'Customer master data', 'confidential'],
      ['Order', 'Order transaction data', 'internal'],
      ['Product', 'Product catalog information', 'public'],
    ],
    filename: 'data_entities_template.csv',
  },
  requirement: {
    headers: ['name', 'description', 'type', 'priority'],
    sampleRows: [
      ['User Authentication', 'System must support secure user authentication', 'functional', 'high'],
      ['Performance SLA', 'System must respond within 2 seconds', 'non-functional', 'high'],
      ['Data Encryption', 'All sensitive data must be encrypted at rest', 'technical', 'critical'],
    ],
    filename: 'requirements_template.csv',
  },
};

/**
 * Escape CSV field value
 */
function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Generate CSV content from template definition
 */
function generateCSVContent(template: TemplateDefinition): string {
  const lines: string[] = [];
  
  // Add headers
  lines.push(template.headers.map(escapeCSVField).join(','));
  
  // Add sample rows
  template.sampleRows.forEach(row => {
    lines.push(row.map(escapeCSVField).join(','));
  });
  
  return lines.join('\n');
}

/**
 * Download CSV template for entity type
 */
export function downloadTemplate(entityType: EntityType): void {
  const template = TEMPLATES[entityType];
  const csvContent = generateCSVContent(template);
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', template.filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Get template information for entity type
 */
export function getTemplateInfo(entityType: EntityType): {
  headers: string[];
  sampleCount: number;
  filename: string;
} {
  const template = TEMPLATES[entityType];
  return {
    headers: template.headers,
    sampleCount: template.sampleRows.length,
    filename: template.filename,
  };
}
