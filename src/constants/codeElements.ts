/**
 * Constants for code element types, modifiers, and related configurations
 */

// Element Types
export const ElementType = {
  Module: "module",
  Function: "function",
  Loop: "loop",
  Branch: "branch",
  Variable: "variable",
} as const;

export type ElementType = typeof ElementType[keyof typeof ElementType];

// Modifiers
export const Modifier = {
  LoopIterations: "loop_iterations",
  BranchTrue: "branch_true",
  BranchFalse: "branch_false",
  // Selection modifiers - terminal selections
  Arguments: "arguments",
  ReturnValue: "return_value",
} as const;

export type Modifier = typeof Modifier[keyof typeof Modifier];

// Loop Types
export const LoopType = {
  For: "for",
  While: "while",
} as const;

export type LoopType = typeof LoopType[keyof typeof LoopType];

// Display name mappings
export const ELEMENT_TYPE_LABELS: Record<ElementType, string> = {
  [ElementType.Module]: "Module",
  [ElementType.Function]: "Function",
  [ElementType.Loop]: "Loop",
  [ElementType.Branch]: "Branch",
  [ElementType.Variable]: "Variable",
};

export const MODIFIER_LABELS: Record<Modifier, string> = {
  [Modifier.LoopIterations]: "Loop Iterations",
  [Modifier.BranchTrue]: "Branch True",
  [Modifier.BranchFalse]: "Branch False",
  [Modifier.Arguments]: "Arguments",
  [Modifier.ReturnValue]: "Return Value",
};

export const LOOP_TYPE_LABELS: Record<LoopType, string> = {
  [LoopType.For]: "for",
  [LoopType.While]: "while",
};

// Helper functions

/**
 * Navigation modifiers are used to traverse deeper into the scope tree
 */
export const isNavigationModifier = (modifier: Modifier): boolean => {
  const navModifiers: Modifier[] = [
    Modifier.LoopIterations,
    Modifier.BranchTrue,
    Modifier.BranchFalse,
  ];
  return navModifiers.includes(modifier);
};

/**
 * Selection modifiers are terminal and complete the target selection
 */
export const isSelectionModifier = (modifier: Modifier): boolean => {
  const selModifiers: Modifier[] = [Modifier.Arguments, Modifier.ReturnValue];
  return selModifiers.includes(modifier);
};

/**
 * Gets the display label for an element type
 */
export const getElementTypeLabel = (type: ElementType): string => {
  return ELEMENT_TYPE_LABELS[type];
};

/**
 * Gets the display label for a modifier
 */
export const getModifierLabel = (modifier: Modifier): string => {
  return MODIFIER_LABELS[modifier];
};
