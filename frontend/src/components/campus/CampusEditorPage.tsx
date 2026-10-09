import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  Link as LinkIcon,
  MapPin,
  Move,
  Plus,
  Redo2,
  Save,
  Trash2,
  Undo2,
  Upload,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { campusMap } from "@/config/campusMap";
import {
  categoryColors,
  categoryLabels,
  type CampusLocation,
} from "@/config/campusLocations";
import type { CampusNode, CampusEdge } from "@/config/campusGraph";
import { buildGraph, haversine, shortestPath } from "@/lib/campusRouting";
import "./campus-editor.css";

interface EditorData {
  locations: Array<{
    id: string;
    lat: number | null;
    lng: number | null;
    nodeId: string | null;
  }>;
  nodes: CampusNode[];
  edges: CampusEdge[];
}

interface PlaceMeta {
  id: string;
  name: string;
  category: CampusLocation["category"];
}

const ALL_PLACES: PlaceMeta[] = [
  { id: "ac-auditorium", name: "AC Auditorium", category: "academic" },
  { id: "it-department", name: "IT Department", category: "academic" },
  { id: "has-block", name: "Has Block", category: "academic" },
  { id: "aiml-and-cse", name: "AI&ML and CSE", category: "academic" },
  { id: "ece-department", name: "ECE Department", category: "academic" },
  { id: "mechanical", name: "Mechanical", category: "academic" },
  { id: "open-auditorium", name: "Open Auditorium", category: "academic" },
  { id: "civil", name: "Civil", category: "academic" },
  { id: "bio-tec", name: "Bio Tec", category: "academic" },
  { id: "aids", name: "AI&DS", category: "academic" },
  { id: "eee", name: "EEE", category: "academic" },
  { id: "cse-department", name: "CSE Department", category: "academic" },
  { id: "boys-hostel", name: "Boys Hostel", category: "hostel" },
  { id: "girls-hostel", name: "Girls Hostel", category: "hostel" },
  { id: "canteen", name: "Canteen", category: "food" },
  { id: "parking", name: "Parking", category: "food" },
  { id: "sbi-bank-and-store", name: "SBI Bank and Store", category: "food" },
  { id: "basketball-ground", name: "Basketball Ground", category: "sports" },
  { id: "volleyball-ground", name: "Volleyball Ground", category: "sports" },
  { id: "arunai-center", name: "Arunai Center", category: "landmark" },
  { id: "temple", name: "Temple", category: "landmark" },
  { id: "arunai-gateway-and-library", name: "Arunai Gateway and Library", category: "landmark" },
  { id: "main-circle", name: "Main Circle", category: "landmark" },
  { id: "main-gate", name: "Main Gate", category: "gate" },
];

type ToolType = "select" | "add-place" | "add-node" | "link" | "attach" | "delete";

export function CampusEditorPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerLibRef = useRef<google.maps.MarkerLibrary | null>(null);
  const mapsLibRef = useRef<google.maps.MapsLibrary | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const isKeyConfigured = Boolean(campusMap.apiKey.trim());

  // Markers & polylines tracking
  const nodeMarkersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const placeMarkersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const edgePolylinesRef = useRef<Map<string, google.maps.Polyline>>(new Map());
  const edgeLabelsRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  // Editor State
  const [data, setData] = useState<EditorData>({ locations: [], nodes: [], edges: [] });
  const [history, setHistory] = useState<EditorData[]>([]);
  const [future, setFuture] = useState<EditorData[]>([]);

  // Tool & selection
  const [currentTool, setCurrentTool] = useState<ToolType>("select");
  const [selectedItem, setSelectedItem] = useState<{
    type: "node" | "place" | "edge";
    id: string;
    extra?: any;
  } | null>(null);
  const [linkStartNodeId, setLinkStartNodeId] = useState<string | null>(null);
  const [attachPlaceId, setAttachPlaceId] = useState<string | null>(null);

  // Toggles
  const [showNodes, setShowNodes] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showIds, setShowIds] = useState(true);
  const [showEdgeLengths, setShowEdgeLengths] = useState(false);

  // Side panels
  const [activeTab, setActiveTab] = useState<"validation" | "routing">("validation");

  // Route testing
  const [routeFrom, setRouteFrom] = useState("main-gate");
  const [routeTo, setRouteTo] = useState("");
  const [routeResult, setRouteResult] = useState<{ path: string[]; distance: number } | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [unreachableList, setUnreachableList] = useState<string[] | null>(null);

  // Modals & prompts
  const [pendingAddPlaceCoords, setPendingAddPlaceCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPlaceToAdd, setSelectedPlaceToAdd] = useState("");
  const [createNodeWithPlace, setCreateNodeWithPlace] = useState(true);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteJsonText, setPasteJsonText] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Warning modal for node delete
  const [pendingDeleteNodeId, setPendingDeleteNodeId] = useState<string | null>(null);

  // Initial load from campusData.json or localStorage
  useEffect(() => {
    async function loadInitialData() {
      try {
        const savedDraft = localStorage.getItem("kiosk_campus_editor_draft");
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.locations && parsed.nodes && parsed.edges) {
            setData(parsed);
            return;
          }
        }

        const initial = await import("@/config/campusData.json");
        const loaded = initial.default || initial;
        setData({
          locations: (loaded.locations as EditorData["locations"]) || [],
          nodes: (loaded.nodes as CampusNode[]) || [],
          edges: (loaded.edges as CampusEdge[]) || [],
        });
      } catch (err) {
        console.error("Failed to load initial campus data:", err);
      }
    }
    loadInitialData();
  }, []);

  // Sync draft to localStorage
  useEffect(() => {
    if (data.nodes.length > 0 || data.locations.length > 0) {
      localStorage.setItem("kiosk_campus_editor_draft", JSON.stringify(data));
    }
  }, [data]);

  // Push undo history (max 100 steps)
  const pushState = useCallback((nextData: EditorData) => {
    setHistory((prev) => {
      const updated = [...prev, data];
      if (updated.length > 100) updated.shift();
      return updated;
    });
    setFuture([]);
    setData(nextData);
  }, [data]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    if (previous) {
      setHistory((prev) => prev.slice(0, -1));
      setFuture((prev) => [data, ...prev]);
      setData(previous);
    }
  }, [history, data]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    if (next) {
      setFuture((prev) => prev.slice(1));
      setHistory((prev) => [...prev, data]);
      setData(next);
    }
  }, [future, data]);

  // Google Maps setup
  useEffect(() => {
    if (!mapContainerRef.current || !isKeyConfigured) return;
    let isCancelled = false;

    async function initEditorMap() {
      try {
        setOptions({
          key: campusMap.apiKey,
          v: "weekly",
        });

        const [mapsLib, markerLib] = await Promise.all([
          importLibrary("maps") as Promise<google.maps.MapsLibrary>,
          importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
        ]);

        if (isCancelled || !mapContainerRef.current) return;

        const map = new mapsLib.Map(mapContainerRef.current, {
          center: { lat: campusMap.center[0], lng: campusMap.center[1] },
          zoom: campusMap.zoom,
          minZoom: campusMap.minZoom,
          maxZoom: campusMap.maxZoom,
          mapTypeId: "satellite",
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: "greedy",
          keyboardShortcuts: false,
          mapId: campusMap.mapId || "DEMO_MAP_ID",
        });

        mapInstanceRef.current = map;
        mapsLibRef.current = mapsLib;
        markerLibRef.current = markerLib;
        setMapLoaded(true);
      } catch (err) {
        console.error("Failed to initialize Google Maps in editor:", err);
      }
    }

    initEditorMap();

    return () => {
      isCancelled = true;
      mapInstanceRef.current = null;
      mapsLibRef.current = null;
      markerLibRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Map click handling according to active tool
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const listener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const clickedLat = e.latLng.lat();
      const clickedLng = e.latLng.lng();

      if (currentTool === "add-node") {
        // Find next node ID
        const existingNumbers = data.nodes
          .map((n) => parseInt(n.id.replace(/^n/, ""), 10))
          .filter((n) => !isNaN(n));
        const nextNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
        const newNodeId = `n${nextNum}`;

        const nextNodes = [...data.nodes, { id: newNodeId, lat: clickedLat, lng: clickedLng }];
        pushState({ ...data, nodes: nextNodes });
        setSelectedItem({ type: "node", id: newNodeId });
      } else if (currentTool === "add-place") {
        setPendingAddPlaceCoords({ lat: clickedLat, lng: clickedLng });
      } else if (currentTool === "select") {
        setSelectedItem(null);
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [currentTool, data, pushState]);

  // Arrow keys nudge support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItem) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const delta = 0.00002;
        let dLat = 0;
        let dLng = 0;
        if (e.key === "ArrowUp") dLat = delta;
        if (e.key === "ArrowDown") dLat = -delta;
        if (e.key === "ArrowLeft") dLng = -delta;
        if (e.key === "ArrowRight") dLng = delta;

        if (selectedItem.type === "node") {
          const nextNodes = data.nodes.map((n) =>
            n.id === selectedItem.id ? { ...n, lat: n.lat + dLat, lng: n.lng + dLng } : n
          );
          pushState({ ...data, nodes: nextNodes });
        } else if (selectedItem.type === "place") {
          const nextLocations = data.locations.map((loc) =>
            loc.id === selectedItem.id && loc.lat != null && loc.lng != null
              ? { ...loc, lat: loc.lat + dLat, lng: loc.lng + dLng }
              : loc
          );
          pushState({ ...data, locations: nextLocations });
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedItem.type === "edge" && selectedItem.extra) {
          const [a, b] = selectedItem.extra;
          const nextEdges = data.edges.filter(
            ([eA, eB]) => !(eA === a && eB === b) && !(eA === b && eB === a)
          );
          pushState({ ...data, edges: nextEdges });
          setSelectedItem(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, data, pushState]);

  // Node delete with dependency check
  const handleDeleteNode = useCallback(
    (nodeId: string, force = false) => {
      const connectedEdges = data.edges.filter(([a, b]) => a === nodeId || b === nodeId);
      const attachedPlaces = data.locations.filter((l) => l.nodeId === nodeId);

      if (!force && (connectedEdges.length > 0 || attachedPlaces.length > 0)) {
        setPendingDeleteNodeId(nodeId);
        return;
      }

      const nextNodes = data.nodes.filter((n) => n.id !== nodeId);
      const nextEdges = data.edges.filter(([a, b]) => a !== nodeId && b !== nodeId);
      const nextLocations = data.locations.map((l) =>
        l.nodeId === nodeId ? { ...l, nodeId: null } : l
      );

      pushState({
        ...data,
        nodes: nextNodes,
        edges: nextEdges,
        locations: nextLocations,
      });
      setPendingDeleteNodeId(null);
      if (selectedItem?.id === nodeId) setSelectedItem(null);
    },
    [data, pushState, selectedItem]
  );

  // Render Edges
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const nodeCoordMap = new Map<string, { lat: number; lng: number }>();
    data.nodes.forEach((n) => nodeCoordMap.set(n.id, { lat: n.lat, lng: n.lng }));

    const currentEdgeKeys = new Set<string>();

    if (showEdges) {
      data.edges.forEach(([a, b]) => {
        const coordA = nodeCoordMap.get(a);
        const coordB = nodeCoordMap.get(b);
        if (!coordA || !coordB) return;

        const edgeKey = `${a}--${b}`;
        currentEdgeKeys.add(edgeKey);

        const isSelected =
          selectedItem?.type === "edge" &&
          ((selectedItem.extra?.[0] === a && selectedItem.extra?.[1] === b) ||
            (selectedItem.extra?.[0] === b && selectedItem.extra?.[1] === a));

        const isRouteEdge =
          routeResult &&
          routeResult.path.some((nodeId, i) => {
            const nextId = routeResult.path[i + 1];
            return (nodeId === a && nextId === b) || (nodeId === b && nextId === a);
          });

        let polyline = edgePolylinesRef.current.get(edgeKey);
        if (!polyline) {
          const newPolyline = new google.maps.Polyline({
            path: [coordA, coordB],
            map,
            strokeColor: isRouteEdge ? "#10B981" : isSelected ? "#EF4444" : "#FBBF24",
            strokeOpacity: 0.9,
            strokeWeight: isRouteEdge ? 6 : isSelected ? 4 : 3,
            clickable: true,
          });

          newPolyline.addListener("click", () => {
            if (currentTool === "delete") {
              const nextEdges = data.edges.filter(
                ([eA, eB]) => !(eA === a && eB === b) && !(eA === b && eB === a)
              );
              pushState({ ...data, edges: nextEdges });
            } else {
              setSelectedItem({ type: "edge", id: edgeKey, extra: [a, b] });
            }
          });

          edgePolylinesRef.current.set(edgeKey, newPolyline);
        } else {
          polyline.setPath([coordA, coordB]);
          polyline.setOptions({
            strokeColor: isRouteEdge ? "#10B981" : isSelected ? "#EF4444" : "#FBBF24",
            strokeWeight: isRouteEdge ? 6 : isSelected ? 4 : 3,
            zIndex: isRouteEdge ? 50 : isSelected ? 20 : 5,
          });
        }
      });
    }

    edgePolylinesRef.current.forEach((polyline, key) => {
      if (!currentEdgeKeys.has(key)) {
        polyline.setMap(null);
        edgePolylinesRef.current.delete(key);
      }
    });
  }, [mapLoaded, data.nodes, data.edges, showEdges, selectedItem, currentTool, routeResult, pushState]);

  // Render Nodes (Square dots with labels)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markerLibRef.current) return;
    const map = mapInstanceRef.current;
    const { AdvancedMarkerElement } = markerLibRef.current;
    const currentNodeIds = new Set<string>();

    if (showNodes) {
      data.nodes.forEach((node) => {
        currentNodeIds.add(node.id);
        const isSelected = selectedItem?.type === "node" && selectedItem.id === node.id;
        const isLinking = linkStartNodeId === node.id;

        const el = document.createElement("div");
        el.className = `campus-node-marker ${isSelected ? "is-selected" : ""} ${isLinking ? "is-linking" : ""}`;
        el.style.position = "relative";
        el.style.cursor = "pointer";

        // Hit box
        const hit = document.createElement("div");
        hit.style.position = "absolute";
        hit.style.top = "-14px";
        hit.style.left = "-14px";
        hit.style.width = "28px";
        hit.style.height = "28px";

        // Square dot
        const dot = document.createElement("div");
        dot.style.width = isSelected ? "14px" : "10px";
        dot.style.height = isSelected ? "14px" : "10px";
        dot.style.backgroundColor = isLinking ? "#3B82F6" : isSelected ? "#EF4444" : "#FBBF24";
        dot.style.border = "1.5px solid #111116";
        dot.style.borderRadius = "2px";
        dot.style.boxShadow = isSelected ? "0 0 0 3px rgba(239,68,68,0.5)" : "0 1px 3px rgba(0,0,0,0.4)";

        el.appendChild(hit);
        el.appendChild(dot);

        if (showIds) {
          const label = document.createElement("div");
          label.textContent = node.id;
          label.style.position = "absolute";
          label.style.top = "12px";
          label.style.left = "50%";
          label.style.transform = "translateX(-50%)";
          label.style.fontSize = "10px";
          label.style.fontWeight = "600";
          label.style.color = "#FFFFFF";
          label.style.backgroundColor = "rgba(0,0,0,0.75)";
          label.style.padding = "1px 4px";
          label.style.borderRadius = "3px";
          label.style.whiteSpace = "nowrap";
          el.appendChild(label);
        }

        el.addEventListener("click", (e) => {
          e.stopPropagation();

          if (currentTool === "link") {
            if (!linkStartNodeId) {
              setLinkStartNodeId(node.id);
            } else if (linkStartNodeId !== node.id) {
              const edgeExists = data.edges.some(
                ([a, b]) =>
                  (a === linkStartNodeId && b === node.id) || (a === node.id && b === linkStartNodeId)
              );
              if (!edgeExists) {
                const nextEdges: CampusEdge[] = [...data.edges, [linkStartNodeId, node.id]];
                pushState({ ...data, edges: nextEdges });
              }
              setLinkStartNodeId(null);
            }
          } else if (currentTool === "attach" && attachPlaceId) {
            const nextLocations = data.locations.map((loc) =>
              loc.id === attachPlaceId ? { ...loc, nodeId: node.id } : loc
            );
            pushState({ ...data, locations: nextLocations });
            setAttachPlaceId(null);
            setSelectedItem({ type: "place", id: attachPlaceId });
          } else if (currentTool === "delete") {
            handleDeleteNode(node.id);
          } else {
            setSelectedItem({ type: "node", id: node.id });
          }
        });

        let marker = nodeMarkersRef.current.get(node.id);
        if (!marker) {
          marker = new AdvancedMarkerElement({
            map,
            position: { lat: node.lat, lng: node.lng },
            content: el,
            title: node.id,
            gmpDraggable: currentTool === "select",
            zIndex: isSelected ? 40 : 10,
          });

          marker.addListener("dragend", () => {
            const pos = marker?.position;
            if (pos && typeof pos.lat === "number" && typeof pos.lng === "number") {
              const nextNodes = data.nodes.map((n) =>
                n.id === node.id ? { ...n, lat: pos.lat as number, lng: pos.lng as number } : n
              );
              pushState({ ...data, nodes: nextNodes });
            }
          });

          nodeMarkersRef.current.set(node.id, marker);
        } else {
          marker.position = { lat: node.lat, lng: node.lng };
          marker.content = el;
          marker.gmpDraggable = currentTool === "select";
          marker.zIndex = isSelected ? 40 : 10;
        }
      });
    }

    nodeMarkersRef.current.forEach((marker, id) => {
      if (!currentNodeIds.has(id)) {
        marker.map = null;
        nodeMarkersRef.current.delete(id);
      }
    });
  }, [
    mapLoaded,
    data.nodes,
    data.edges,
    data.locations,
    showNodes,
    showIds,
    selectedItem,
    linkStartNodeId,
    attachPlaceId,
    currentTool,
    pushState,
    handleDeleteNode,
  ]);

  // Render Places (Large colored round dots with names)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markerLibRef.current) return;
    const map = mapInstanceRef.current;
    const { AdvancedMarkerElement } = markerLibRef.current;
    const currentPlaceIds = new Set<string>();

    data.locations.forEach((loc) => {
      if (loc.lat == null || loc.lng == null) return;
      currentPlaceIds.add(loc.id);

      const placeMeta = ALL_PLACES.find((p) => p.id === loc.id);
      const isSelected = selectedItem?.type === "place" && selectedItem.id === loc.id;
      const isAttaching = attachPlaceId === loc.id;

      const hit = document.createElement("div");
      hit.style.position = "relative";
      hit.style.cursor = "pointer";

      // 40px hit area
      const touchArea = document.createElement("div");
      touchArea.style.position = "absolute";
      touchArea.style.top = "-20px";
      touchArea.style.left = "-20px";
      touchArea.style.width = "40px";
      touchArea.style.height = "40px";

      // Colored dot
      const dot = document.createElement("div");
      dot.style.position = "absolute";
      dot.style.top = isSelected ? "-14px" : "-10px";
      dot.style.left = isSelected ? "-14px" : "-10px";
      dot.style.width = isSelected ? "28px" : "20px";
      dot.style.height = isSelected ? "28px" : "20px";
      dot.style.borderRadius = "50%";
      dot.style.backgroundColor = placeMeta ? categoryColors[placeMeta.category] : "#8B1E2D";
      dot.style.border = isSelected ? "3px solid #FFFFFF" : "2px solid #FFFFFF";
      dot.style.boxShadow = isSelected ? "0 0 0 4px rgba(139,30,45,0.6)" : "0 2px 6px rgba(0,0,0,0.4)";

      hit.appendChild(touchArea);
      hit.appendChild(dot);

      if (showLabels && placeMeta) {
        const label = document.createElement("div");
        label.textContent = placeMeta.name;
        label.style.position = "absolute";
        label.style.top = "14px";
        label.style.left = "0";
        label.style.transform = "translateX(-50%)";
        label.style.fontSize = "12px";
        label.style.fontWeight = "600";
        label.style.color = "#FFFFFF";
        label.style.backgroundColor = isSelected ? "rgba(139,30,45,0.95)" : "rgba(20,20,28,0.85)";
        label.style.padding = "2px 8px";
        label.style.borderRadius = "9999px";
        label.style.whiteSpace = "nowrap";
        hit.appendChild(label);
      }

      hit.addEventListener("click", (e) => {
        e.stopPropagation();

        if (currentTool === "attach") {
          setAttachPlaceId(loc.id);
        } else if (currentTool === "delete") {
          const nextLocations = data.locations.map((l) =>
            l.id === loc.id ? { ...l, lat: null, lng: null, nodeId: null } : l
          );
          pushState({ ...data, locations: nextLocations });
          setSelectedItem(null);
        } else {
          setSelectedItem({ type: "place", id: loc.id });
        }
      });

      let marker = placeMarkersRef.current.get(loc.id);
      if (!marker) {
        marker = new AdvancedMarkerElement({
          map,
          position: { lat: loc.lat, lng: loc.lng },
          content: hit,
          title: placeMeta?.name || loc.id,
          gmpDraggable: currentTool === "select",
          zIndex: isSelected ? 30 : 15,
        });

        marker.addListener("dragend", () => {
          const pos = marker?.position;
          if (pos && typeof pos.lat === "number" && typeof pos.lng === "number") {
            const nextLocations = data.locations.map((l) =>
              l.id === loc.id ? { ...l, lat: pos.lat as number, lng: pos.lng as number } : l
            );
            pushState({ ...data, locations: nextLocations });
          }
        });

        placeMarkersRef.current.set(loc.id, marker);
      } else {
        marker.position = { lat: loc.lat, lng: loc.lng };
        marker.content = hit;
        marker.gmpDraggable = currentTool === "select";
        marker.zIndex = isSelected ? 30 : 15;
      }
    });

    placeMarkersRef.current.forEach((marker, id) => {
      if (!currentPlaceIds.has(id)) {
        marker.map = null;
        placeMarkersRef.current.delete(id);
      }
    });
  }, [mapLoaded, data.locations, showLabels, selectedItem, attachPlaceId, currentTool, pushState]);

  // Validation checks
  const validationIssues = useMemo(() => {
    const issues: Array<{
      type: "error" | "warning";
      title: string;
      desc: string;
      target: { type: "node" | "place" | "edge"; id: string; lat?: number; lng?: number };
    }> = [];

    const nodeIds = new Set(data.nodes.map((n) => n.id));
    const mainGateNodeId =
      data.locations.find((l) => l.id === "main-gate")?.nodeId || "n1";

    // 1. Place without a node
    data.locations.forEach((l) => {
      if (l.lat != null && l.lng != null && !l.nodeId) {
        const placeName = ALL_PLACES.find((p) => p.id === l.id)?.name || l.id;
        issues.push({
          type: "warning",
          title: `Place without attached node: ${placeName}`,
          desc: "Place has coordinates but no nodeId attached.",
          target: { type: "place", id: l.id, lat: l.lat, lng: l.lng },
        });
      }
    });

    // 2. Edges to missing nodes
    data.edges.forEach(([a, b]) => {
      if (!nodeIds.has(a) || !nodeIds.has(b)) {
        issues.push({
          type: "error",
          title: `Edge with missing node: ${a} <-> ${b}`,
          desc: `One or both endpoints do not exist in nodes array.`,
          target: { type: "edge", id: `${a}--${b}` },
        });
      }
    });

    // 3. Duplicate edges
    const seenEdges = new Set<string>();
    data.edges.forEach(([a, b]) => {
      const key = [a, b].sort().join("--");
      if (seenEdges.has(key)) {
        issues.push({
          type: "warning",
          title: `Duplicate edge: ${a} <-> ${b}`,
          desc: "Multiple edges connect the same two nodes.",
          target: { type: "edge", id: `${a}--${b}` },
        });
      }
      seenEdges.add(key);
    });

    // 4. Zero-length edges
    const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));
    data.edges.forEach(([a, b]) => {
      if (a === b) {
        issues.push({
          type: "error",
          title: `Self-loop edge on ${a}`,
          desc: "An edge connects a node to itself.",
          target: { type: "edge", id: `${a}--${b}` },
        });
      } else {
        const nA = nodeMap.get(a);
        const nB = nodeMap.get(b);
        if (nA && nB && haversine(nA.lat, nA.lng, nB.lat, nB.lng) < 0.1) {
          issues.push({
            type: "warning",
            title: `Zero-length edge: ${a} <-> ${b}`,
            desc: "Nodes have nearly identical coordinates.",
            target: { type: "edge", id: `${a}--${b}` },
          });
        }
      }
    });

    // 5. Node connectivity to Main Gate
    if (nodeIds.has(mainGateNodeId)) {
      const graph = buildGraph(data.nodes, data.edges);
      data.nodes.forEach((node) => {
        if (node.id === mainGateNodeId) return;
        const res = shortestPath(graph, mainGateNodeId, node.id);
        if (!res) {
          issues.push({
            type: "error",
            title: `Disconnected node: ${node.id}`,
            desc: `Cannot reach ${node.id} from Main Gate (${mainGateNodeId}).`,
            target: { type: "node", id: node.id, lat: node.lat, lng: node.lng },
          });
        }
      });
    }

    return issues;
  }, [data]);

  // Test single route
  const handleTestRoute = () => {
    setRouteError(null);
    setRouteResult(null);

    const fromPlace = data.locations.find((l) => l.id === routeFrom);
    const toPlace = data.locations.find((l) => l.id === routeTo);

    const startNode = fromPlace?.nodeId || routeFrom;
    const endNode = toPlace?.nodeId || routeTo;

    if (!startNode || !endNode) {
      setRouteError("Selected start or end location is not attached to a node.");
      return;
    }

    const graph = buildGraph(data.nodes, data.edges);
    const res = shortestPath(graph, startNode, endNode);

    if (!res) {
      setRouteError(`No path found between ${startNode} and ${endNode}.`);
    } else {
      setRouteResult(res);
    }
  };

  // Check all routes from Main Gate
  const handleCheckAll = () => {
    const mainGateLoc = data.locations.find((l) => l.id === "main-gate");
    const startNode = mainGateLoc?.nodeId || "n1";

    const graph = buildGraph(data.nodes, data.edges);
    const unreachable: string[] = [];

    data.locations.forEach((loc) => {
      const placeMeta = ALL_PLACES.find((p) => p.id === loc.id);
      const name = placeMeta?.name || loc.id;
      if (!loc.nodeId) {
        unreachable.push(`${name} (no node)`);
      } else {
        const res = shortestPath(graph, startNode, loc.nodeId);
        if (!res) {
          unreachable.push(`${name} (unreachable from ${startNode})`);
        }
      }
    });

    setUnreachableList(unreachable);
  };

  // Save to project via Vite plugin
  const handleSaveToProject = async () => {
    try {
      setSaveStatus("Saving...");
      const res = await fetch("/__campus-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (res.ok) {
        setSaveStatus("Saved to src/config/campusData.json!");
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus(`Save failed: ${json.error || "Server error"}`);
      }
    } catch (err: any) {
      setSaveStatus(`Network error: ${err.message}`);
    }
  };

  // Download JSON
  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "campusData.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Paste JSON
  const handleApplyPastedJson = () => {
    try {
      const parsed = JSON.parse(pasteJsonText);
      if (!parsed.locations || !parsed.nodes || !parsed.edges) {
        alert("Invalid format! Must contain locations, nodes, and edges arrays.");
        return;
      }
      pushState(parsed);
      setPasteModalOpen(false);
      setPasteJsonText("");
    } catch (err) {
      alert("Invalid JSON syntax.");
    }
  };

  // Add place confirmation
  const handleConfirmAddPlace = () => {
    if (!selectedPlaceToAdd || !pendingAddPlaceCoords) return;

    let nextNodeId: string | null = null;
    let nextNodes = data.nodes;

    if (createNodeWithPlace) {
      const existingNumbers = data.nodes
        .map((n) => parseInt(n.id.replace(/^n/, ""), 10))
        .filter((n) => !isNaN(n));
      const nextNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
      nextNodeId = `n${nextNum}`;
      nextNodes = [
        ...data.nodes,
        { id: nextNodeId, lat: pendingAddPlaceCoords.lat, lng: pendingAddPlaceCoords.lng },
      ];
    }

    const existingLocIndex = data.locations.findIndex((l) => l.id === selectedPlaceToAdd);
    let nextLocations = [...data.locations];

    if (existingLocIndex >= 0 && nextLocations[existingLocIndex]) {
      const existing = nextLocations[existingLocIndex];
      nextLocations[existingLocIndex] = {
        id: existing.id,
        lat: pendingAddPlaceCoords.lat,
        lng: pendingAddPlaceCoords.lng,
        nodeId: nextNodeId || existing.nodeId,
      };
    } else {
      nextLocations.push({
        id: selectedPlaceToAdd,
        lat: pendingAddPlaceCoords.lat,
        lng: pendingAddPlaceCoords.lng,
        nodeId: nextNodeId,
      });
    }

    pushState({
      ...data,
      nodes: nextNodes,
      locations: nextLocations,
    });

    setPendingAddPlaceCoords(null);
    setSelectedPlaceToAdd("");
    setCurrentTool("select");
  };

  // Places with no coordinates for the Add Place picker
  const placesWithoutCoords = ALL_PLACES.filter(
    (p) => !data.locations.some((l) => l.id === p.id && l.lat != null && l.lng != null)
  );

  return (
    <div className="campus-editor-root">
      {/* Header */}
      <header className="campus-editor-header">
        <div className="campus-editor-title">
          <a href="/campus" className="campus-editor-btn" title="Back to Campus Page">
            <ArrowLeft className="size-4" />
          </a>
          <h1>Campus Map Editor</h1>
          <span className="campus-editor-badge">DEV TOOL</span>
        </div>

        <div className="campus-editor-header-actions">
          {saveStatus && (
            <span style={{ fontSize: 12, color: "#10B981", marginRight: 8 }}>{saveStatus}</span>
          )}

          <button
            type="button"
            className="campus-editor-btn"
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="size-4" />
          </button>
          <button
            type="button"
            className="campus-editor-btn"
            onClick={handleRedo}
            disabled={future.length === 0}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="size-4" />
          </button>

          <button
            type="button"
            className="campus-editor-btn"
            onClick={() => setPasteModalOpen(true)}
            title="Paste JSON"
          >
            <Upload className="size-4" />
            <span>Paste JSON</span>
          </button>

          <button
            type="button"
            className="campus-editor-btn"
            onClick={handleDownloadJson}
            title="Download JSON"
          >
            <Download className="size-4" />
            <span>Download</span>
          </button>

          <button
            type="button"
            className="campus-editor-btn campus-editor-btn-primary"
            onClick={handleSaveToProject}
            title="Save to project (POST /__campus-save)"
          >
            <Save className="size-4" />
            <span>Save to project</span>
          </button>
        </div>
      </header>

      {/* Workspace */}
      <div className="campus-editor-body">
        {/* Toolbar */}
        <aside className="campus-editor-toolbar" role="toolbar" aria-label="Editor Tools">
          <button
            type="button"
            className={`campus-tool-btn ${currentTool === "select" ? "is-active" : ""}`}
            onClick={() => {
              setCurrentTool("select");
              setLinkStartNodeId(null);
              setAttachPlaceId(null);
            }}
            title="Select/Move (Drag items or nudge with arrows)"
          >
            <Move className="size-5" />
          </button>

          <button
            type="button"
            className={`campus-tool-btn ${currentTool === "add-place" ? "is-active" : ""}`}
            onClick={() => setCurrentTool("add-place")}
            title="Add place location (Click map to assign location to place)"
          >
            <MapPin className="size-5" />
          </button>

          <button
            type="button"
            className={`campus-tool-btn ${currentTool === "add-node" ? "is-active" : ""}`}
            onClick={() => setCurrentTool("add-node")}
            title="Add node (Click map to drop new path node)"
          >
            <Plus className="size-5" />
          </button>

          <button
            type="button"
            className={`campus-tool-btn ${currentTool === "link" ? "is-active" : ""}`}
            onClick={() => {
              setCurrentTool("link");
              setLinkStartNodeId(null);
            }}
            title="Link (Click Node A then Node B to create an edge)"
          >
            <LinkIcon className="size-5" />
          </button>

          <button
            type="button"
            className={`campus-tool-btn ${currentTool === "attach" ? "is-active" : ""}`}
            onClick={() => {
              setCurrentTool("attach");
              setAttachPlaceId(null);
            }}
            title="Attach (Click a place then a node to connect)"
          >
            <CheckCircle2 className="size-5" />
          </button>

          <div className="campus-tool-separator" />

          <button
            type="button"
            className={`campus-tool-btn ${currentTool === "delete" ? "is-active" : ""}`}
            onClick={() => setCurrentTool("delete")}
            title="Delete (Click node, edge or place to delete)"
          >
            <Trash2 className="size-5" />
          </button>
        </aside>

        {/* Map Stage */}
        <div className="campus-editor-map-wrapper">
          <div ref={mapContainerRef} className="campus-editor-map" />
          {!isKeyConfigured && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                color: "#F8FAFC",
                zIndex: 10,
                padding: 24,
                textAlign: "center",
              }}
            >
              <AlertTriangle className="size-10 text-amber-500" strokeWidth={1.5} />
              <h3 className="text-xl font-semibold">Google Maps Key Not Configured</h3>
              <p className="text-sm text-slate-300 max-w-md">
                Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to <code>.env</code> to load the campus editor map.
              </p>
            </div>
          )}

          {/* Toggles bar */}
          <div className="campus-editor-toggles">
            <label className="campus-toggle-label">
              <input
                type="checkbox"
                checked={showNodes}
                onChange={(e) => setShowNodes(e.target.checked)}
              />
              <span>Nodes</span>
            </label>
            <label className="campus-toggle-label">
              <input
                type="checkbox"
                checked={showEdges}
                onChange={(e) => setShowEdges(e.target.checked)}
              />
              <span>Edges</span>
            </label>
            <label className="campus-toggle-label">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
              />
              <span>Labels</span>
            </label>
            <label className="campus-toggle-label">
              <input
                type="checkbox"
                checked={showIds}
                onChange={(e) => setShowIds(e.target.checked)}
              />
              <span>IDs</span>
            </label>
            <label className="campus-toggle-label">
              <input
                type="checkbox"
                checked={showEdgeLengths}
                onChange={(e) => setShowEdgeLengths(e.target.checked)}
              />
              <span>Lengths</span>
            </label>
          </div>

          {/* Context info banner */}
          <div className="campus-editor-info-banner">
            <span>Tool: <strong>{currentTool.toUpperCase()}</strong></span>
            {linkStartNodeId && <span> | Linking from: <strong>{linkStartNodeId}</strong></span>}
            {attachPlaceId && <span> | Attaching place: <strong>{attachPlaceId}</strong></span>}
            {selectedItem && (
              <span> | Selected: <strong>{selectedItem.type} ({selectedItem.id})</strong></span>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="campus-editor-sidepanel">
          <div className="campus-panel-tabs">
            <button
              type="button"
              className={`campus-panel-tab ${activeTab === "validation" ? "is-active" : ""}`}
              onClick={() => setActiveTab("validation")}
            >
              Validation ({validationIssues.length})
            </button>
            <button
              type="button"
              className={`campus-panel-tab ${activeTab === "routing" ? "is-active" : ""}`}
              onClick={() => setActiveTab("routing")}
            >
              Route Tester
            </button>
          </div>

          <div className="campus-panel-content">
            {activeTab === "validation" ? (
              <>
                {validationIssues.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#10B981" }}>
                    <CheckCircle2 className="size-8" style={{ margin: "0 auto 8px" }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>All checks passed!</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF" }}>
                      Graph is fully connected and validated.
                    </p>
                  </div>
                ) : (
                  validationIssues.map((issue, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`campus-val-item is-${issue.type}`}
                      onClick={() => {
                        setSelectedItem(issue.target);
                        if (issue.target.lat && issue.target.lng && mapInstanceRef.current) {
                          mapInstanceRef.current.panTo({
                            lat: issue.target.lat,
                            lng: issue.target.lng,
                          });
                        }
                      }}
                    >
                      <div className="campus-val-title">{issue.title}</div>
                      <div className="campus-val-desc">{issue.desc}</div>
                    </button>
                  ))
                )}
              </>
            ) : (
              <div className="campus-route-tester">
                <div className="campus-route-form-group">
                  <label className="campus-route-label">From</label>
                  <select
                    className="campus-route-select"
                    value={routeFrom}
                    onChange={(e) => setRouteFrom(e.target.value)}
                  >
                    {ALL_PLACES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                    <optgroup label="Raw Nodes">
                      {data.nodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          Node {n.id}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="campus-route-form-group">
                  <label className="campus-route-label">To</label>
                  <select
                    className="campus-route-select"
                    value={routeTo}
                    onChange={(e) => setRouteTo(e.target.value)}
                  >
                    <option value="">Select destination...</option>
                    {ALL_PLACES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                    <optgroup label="Raw Nodes">
                      {data.nodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          Node {n.id}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    className="campus-editor-btn campus-editor-btn-primary"
                    style={{ flex: 1 }}
                    onClick={handleTestRoute}
                    disabled={!routeTo}
                  >
                    Test Route
                  </button>
                  <button
                    type="button"
                    className="campus-editor-btn"
                    onClick={handleCheckAll}
                    title="Check routes from Main Gate to all places"
                  >
                    Check All
                  </button>
                </div>

                {routeResult && (
                  <div className="campus-route-result">
                    <strong>Path Found: {Math.round(routeResult.distance)} metres</strong>
                    <span>{routeResult.path.join(" -> ")}</span>
                  </div>
                )}

                {routeError && <div className="campus-route-error">{routeError}</div>}

                {unreachableList && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#EF4444", marginBottom: 6 }}>
                      Unreachable from Main Gate ({unreachableList.length}):
                    </div>
                    {unreachableList.length === 0 ? (
                      <div style={{ color: "#10B981", fontSize: 12 }}>
                        All places are reachable from Main Gate!
                      </div>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#FCA5A5" }}>
                        {unreachableList.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Add Place Dialog */}
      {pendingAddPlaceCoords && (
        <div className="campus-modal-backdrop">
          <div className="campus-modal">
            <div className="campus-modal-header">
              <h2 className="campus-modal-title">Place Location on Map</h2>
            </div>
            <div className="campus-modal-body">
              <p style={{ margin: 0, fontSize: 13, color: "#9CA3AF" }}>
                Target coordinates: {pendingAddPlaceCoords.lat.toFixed(6)},{" "}
                {pendingAddPlaceCoords.lng.toFixed(6)}
              </p>

              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                <strong>Select Place:</strong>
                <select
                  className="campus-route-select"
                  value={selectedPlaceToAdd}
                  onChange={(e) => setSelectedPlaceToAdd(e.target.value)}
                >
                  <option value="">-- Choose place without coordinates --</option>
                  {placesWithoutCoords.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                  <optgroup label="Re-assign existing">
                    {ALL_PLACES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={createNodeWithPlace}
                  onChange={(e) => setCreateNodeWithPlace(e.target.checked)}
                />
                <span>Create a node here and attach it</span>
              </label>
            </div>
            <div className="campus-modal-footer">
              <button
                type="button"
                className="campus-editor-btn"
                onClick={() => setPendingAddPlaceCoords(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="campus-editor-btn campus-editor-btn-primary"
                onClick={handleConfirmAddPlace}
                disabled={!selectedPlaceToAdd}
              >
                Apply Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Dialog for Node Delete */}
      {pendingDeleteNodeId && (
        <div className="campus-modal-backdrop">
          <div className="campus-modal">
            <div className="campus-modal-header">
              <h2 className="campus-modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle className="size-5 text-amber-500" />
                <span>Delete Node {pendingDeleteNodeId}?</span>
              </h2>
            </div>
            <div className="campus-modal-body">
              <p style={{ margin: 0, fontSize: 13 }}>
                This node still has connected edges or attached places. Deleting it will remove all
                connected edges and detach any linked places.
              </p>
            </div>
            <div className="campus-modal-footer">
              <button
                type="button"
                className="campus-editor-btn"
                onClick={() => setPendingDeleteNodeId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="campus-editor-btn campus-editor-btn-primary"
                onClick={() => handleDeleteNode(pendingDeleteNodeId, true)}
              >
                Delete Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste JSON Modal */}
      {pasteModalOpen && (
        <div className="campus-modal-backdrop">
          <div className="campus-modal">
            <div className="campus-modal-header">
              <h2 className="campus-modal-title">Paste campusData.json</h2>
            </div>
            <div className="campus-modal-body">
              <textarea
                rows={10}
                value={pasteJsonText}
                onChange={(e) => setPasteJsonText(e.target.value)}
                placeholder='Paste JSON with { "locations": [...], "nodes": [...], "edges": [...] }'
                style={{
                  width: "100%",
                  background: "#111116",
                  color: "#FFFFFF",
                  border: "1px solid #323242",
                  borderRadius: 6,
                  padding: 10,
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              />
            </div>
            <div className="campus-modal-footer">
              <button
                type="button"
                className="campus-editor-btn"
                onClick={() => setPasteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="campus-editor-btn campus-editor-btn-primary"
                onClick={handleApplyPastedJson}
                disabled={!pasteJsonText.trim()}
              >
                Apply JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
