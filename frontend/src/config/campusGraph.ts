import campusData from "./campusData.json";

export interface CampusNode {
  id: string;
  lat: number;
  lng: number;
}

export type CampusEdge = [string, string];

export interface CampusGraphData {
  nodes: CampusNode[];
  edges: CampusEdge[];
}

export const nodes: CampusNode[] = campusData.nodes as CampusNode[];
export const edges: CampusEdge[] = campusData.edges as CampusEdge[];

export const campusNodes = nodes;
export const campusEdges = edges;
