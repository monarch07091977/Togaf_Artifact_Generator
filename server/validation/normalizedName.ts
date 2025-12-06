/**
 * Normalized Name Generation
 * 
 * Generates normalized names for EA entities to enable case-insensitive deduplication
 * and future organization-level merging.
 */

/**
 * Normalize a name for case-insensitive comparison and deduplication
 * 
 * Rules:
 * 1. Convert to lowercase
 * 2. Trim leading/trailing whitespace
 * 3. Collapse multiple spaces to single space
 * 4. Preserve hyphens and underscores (common in technical names)
 * 
 * @param name - Original name string
 * @returns Normalized name
 * 
 * @example
 * normalizeName("Customer Management") // "customer management"
 * normalizeName("  Order Processing  ") // "order processing"
 * normalizeName("PAYMENT-GATEWAY") // "payment-gateway"
 * normalizeName("Data   Warehouse") // "data warehouse"
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Collapse multiple spaces
}

/**
 * Normalize a name with strict rules (removes special characters except hyphens)
 * Use this for stricter deduplication where punctuation differences should be ignored
 * 
 * @param name - Original name string
 * @returns Strictly normalized name
 * 
 * @example
 * normalizeNameStrict("Customer Management!") // "customer management"
 * normalizeNameStrict("Order-Processing (v2)") // "order-processing v2"
 */
export function normalizeNameStrict(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars except word chars, spaces, hyphens
    .replace(/\s+/g, ' '); // Collapse multiple spaces
}

/**
 * Check if two names are equivalent after normalization
 * 
 * @param name1 - First name
 * @param name2 - Second name
 * @returns true if names are equivalent
 * 
 * @example
 * areNamesEquivalent("Customer Management", "customer management") // true
 * areNamesEquivalent("Order Processing", "order  processing") // true
 * areNamesEquivalent("Payment Gateway", "Payment-Gateway") // false (preserves hyphens)
 */
export function areNamesEquivalent(name1: string, name2: string): boolean {
  return normalizeName(name1) === normalizeName(name2);
}

/**
 * Generate a unique normalized name by appending a counter if needed
 * This is useful when you need to ensure uniqueness but want to preserve the original intent
 * 
 * @param baseName - Base name to normalize
 * @param existingNames - Set of existing normalized names
 * @returns Unique normalized name
 * 
 * @example
 * generateUniqueNormalizedName("Customer Management", new Set(["customer management"]))
 * // Returns "customer management 2"
 */
export function generateUniqueNormalizedName(
  baseName: string,
  existingNames: Set<string>
): string {
  const normalized = normalizeName(baseName);
  
  if (!existingNames.has(normalized)) {
    return normalized;
  }
  
  // Append counter if name exists
  let counter = 2;
  let uniqueName = `${normalized} ${counter}`;
  
  while (existingNames.has(uniqueName)) {
    counter++;
    uniqueName = `${normalized} ${counter}`;
  }
  
  return uniqueName;
}

/**
 * Validation error for duplicate normalized names
 */
export class DuplicateNameError extends Error {
  constructor(
    public normalizedName: string,
    public projectId: number,
    public entityType: string
  ) {
    super(
      `Duplicate ${entityType} name: "${normalizedName}" already exists in project ${projectId}. ` +
      `Please choose a different name.`
    );
    this.name = 'DuplicateNameError';
  }
}

/**
 * Extract the base name from a normalized name with counter
 * Useful for suggesting alternative names
 * 
 * @param normalizedName - Normalized name (possibly with counter)
 * @returns Base name without counter
 * 
 * @example
 * extractBaseName("customer management 2") // "customer management"
 * extractBaseName("order processing") // "order processing"
 */
export function extractBaseName(normalizedName: string): string {
  // Remove trailing " N" pattern where N is a number
  return normalizedName.replace(/\s+\d+$/, '');
}

/**
 * Suggest alternative names when a duplicate is found
 * 
 * @param baseName - Original name that caused duplicate
 * @param existingNames - Set of existing normalized names
 * @param count - Number of suggestions to generate
 * @returns Array of suggested alternative names
 * 
 * @example
 * suggestAlternativeNames("Customer Management", new Set(["customer management"]), 3)
 * // Returns ["customer management 2", "customer management 3", "customer management 4"]
 */
export function suggestAlternativeNames(
  baseName: string,
  existingNames: Set<string>,
  count: number = 3
): string[] {
  const normalized = normalizeName(baseName);
  const suggestions: string[] = [];
  
  let counter = 2;
  while (suggestions.length < count) {
    const suggestion = `${normalized} ${counter}`;
    if (!existingNames.has(suggestion)) {
      suggestions.push(suggestion);
    }
    counter++;
  }
  
  return suggestions;
}
