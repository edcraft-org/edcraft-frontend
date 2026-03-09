export type ParamType =
    | "integer"
    | "number"
    | "string"
    | "boolean"
    | "array"
    | "set"
    | "tuple"
    | "object"
    | "graph";

export const PARAM_TYPES: { value: ParamType; label: string }[] = [
    { value: "integer", label: "Integer" },
    { value: "number", label: "Number" },
    { value: "string", label: "String" },
    { value: "boolean", label: "Boolean" },
    { value: "array", label: "Array" },
    { value: "set", label: "Set" },
    { value: "tuple", label: "Tuple" },
    { value: "object", label: "Object" },
    { value: "graph", label: "Graph" },
];

export const FAKER_PROVIDERS = [
    { value: "name", label: "Full Name" },
    { value: "first_name", label: "First Name" },
    { value: "last_name", label: "Last Name" },
    { value: "address", label: "Address" },
    { value: "city", label: "City" },
    { value: "country", label: "Country" },
    { value: "street_address", label: "Street Address" },
    { value: "postcode", label: "Postcode" },
    { value: "state", label: "State" },
];

export const GRAPH_OUTPUT_FORMATS = [
    { value: "adjacency_list", label: "Adjacency List" },
    { value: "adjacency_matrix", label: "Adjacency Matrix" },
    { value: "edge_list", label: "Edge List" },
];
