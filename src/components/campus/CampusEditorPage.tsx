import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Copy,
  Download,
  Link as LinkIcon,
  MapPin,
  PlusSquare,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { campusMap } from "@/config/campusMap";
import {
  type CampusLocation,
  campusLocations,
  categoryColors,
  categoryLabels,
} from "@/config/campusLocations";
import {
  type CampusEdge,
  type CampusGraphData,
  type CampusNode,
  campusEdges,
  campusNodes,
} from "@/config/campusGraph";
import "@/components/campus/campus-editor.css";

type EditorMode = "place_location" | "add_node" | "link_nodes" | "attach" | "delete";

const STORAGE_KEY = "campus_editor_data";

interface HistoryEntry {
  locations: CampusLocation[];
  nodes: CampusNode[];
  edges: CampusEdge[];
}

export function CampusEditorPage() {
  if (!import.meta.env.DEV) {
    return (
      <div className="p-8 text-center">
        <h2>404 - Not Found</h2>
      </div>
    );
  }

  // State: locations, nodes, edges
  const [locations, setLocations] = useState<CampusLocation[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Partial<CampusGraphData> & {
            locations?: CampusLocation[];
          };
          if (Array.isArray(parsed.locations)) return parsed.locations;
        } catch (e) {
          console.error("Failed to parse saved campus editor data:", e);
        }
      }
    }
    return campusLocations;
  });

  const [nodes, setNodes] = useState<CampusNode[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Partial<CampusGraphData>;
          if (Array.isArray(parsed.nodes)) return parsed.nodes;
        } catch (e) {
          console.error("Failed to parse saved campus editor nodes:", e);
        }
      }
    }
    return campusNodes;
  });

  const [edges, setEdges] = useState<CampusEdge[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Partial<CampusGraphData>;
          if (Array.isArray(parsed.edges)) return parsed.edges;
        } catch (e) {
          console.error("Failed to parse saved campus editor edges:", e);
        }
      }
    }
    return campusEdges;
  });

  // Undo history stack
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Toolbar mode
  const [mode, setMode] = useState<EditorMode>("place_location");
  const [selectedNodeForLink, setSelectedNodeForLink] = useState<string | null>(null);
  const [selectedLocationForAttach, setSelectedLocationForAttach] = useState<string | null>(null);

  // Dialog states
  const [pendingLocationClick, setPendingLocationClick] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedLocationIdToPlace, setSelectedLocationIdToPlace] = useState<string>("");
  const [createNodeAndAttach, setCreateNodeAndAttach] = useState<boolean>(true);

  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteInput, setPasteInput] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerLibRef = useRef<google.maps.MarkerLibrary | null>(null);
  const locationMarkersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(
    new Map(),
  );
  const nodeMarkersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const edgePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const attachmentPolylinesRef = useRef<google.maps.Polyline[]>([]);

  const [mapLoaded, setMapLoaded] = useState(false);

  // Save to sessionStorage whenever data changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dataToSave = { locations, nodes, edges };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [locations, nodes, edges]);

  // Push state to history before a mutation
  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-30), { locations, nodes, edges }]);
  }, [locations, nodes, edges]);

  // Undo function
  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last) {
        setLocations(last.locations);
        setNodes(last.nodes);
        setEdges(last.edges);
      }
      return prev.slice(0, -1);
    });
  }, []);

  // Helper to generate next sequential node ID: n1, n2, ...
  const getNextNodeId = useCallback(
    (currentNodes: CampusNode[] = nodes): string => {
      const numbers = currentNodes
        .map((n) => {
          const match = n.id.match(/^n(\d+)$/);
          return match ? parseInt(match[1]!, 10) : 0;
        })
        .filter((num) => !isNaN(num));
      const max = numbers.length > 0 ? Math.max(...numbers) : 0;
      return `n${max + 1}`;
    },
    [nodes],
  );

  // Initialize Google Map client-side only (same setup as CampusMap)
  useEffect(() => {
    if (!campusMap.apiKey.trim() || !mapContainerRef.current) return;
    let isCancelled = false;

    async function initEditorMap() {
      try {
        const { setOptions, importLibrary } = await import("@googlemaps/js-api-loader");
        setOptions({
          key: campusMap.apiKey,
          v: "weekly",
        });

        const [{ Map }, markerLib] = await Promise.all([
          importLibrary("maps") as Promise<google.maps.MapsLibrary>,
          importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
        ]);

        if (isCancelled || !mapContainerRef.current) return;

        const map = new Map(mapContainerRef.current, {
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
        markerLibRef.current = markerLib;
        setMapLoaded(true);
      } catch (err) {
        console.error("Failed to initialize Editor Google Map:", err);
      }
    }

    initEditorMap();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Handle Map clicks based on current mode
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const listener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      if (mode === "place_location") {
        setPendingLocationClick({ lat, lng });
        // Default to first location without coordinates if any
        const firstUnplaced = locations.find((l) => l.lat == null || l.lng == null);
        setSelectedLocationIdToPlace(firstUnplaced ? firstUnplaced.id : locations[0]?.id ?? "");
      } else if (mode === "add_node") {
        pushHistory();
        const newNodeId = getNextNodeId();
        setNodes((prev) => [...prev, { id: newNodeId, lat, lng }]);
        setFeedbackMessage(`Created node ${newNodeId}`);
      } else if (mode === "link_nodes") {
        setSelectedNodeForLink(null);
      } else if (mode === "attach") {
        setSelectedLocationForAttach(null);
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [mapLoaded, mode, locations, getNextNodeId, pushHistory]);

  // Render & Update Location Markers
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markerLibRef.current) return;
    const { AdvancedMarkerElement } = markerLibRef.current;
    const map = mapInstanceRef.current;

    const validLocations = locations.filter((loc) => loc.lat != null && loc.lng != null);
    const validIds = new Set(validLocations.map((l) => l.id));

    for (const loc of validLocations) {
      const isAttachSelected = selectedLocationForAttach === loc.id;

      const hitArea = document.createElement("div");
      hitArea.className = "campus-marker-hit-area";
      hitArea.style.position = "relative";
      hitArea.style.width = "0";
      hitArea.style.height = "0";
      hitArea.style.cursor = "pointer";
      hitArea.style.userSelect = "none";

      const touchTarget = document.createElement("div");
      touchTarget.style.position = "absolute";
      touchTarget.style.top = "-20px";
      touchTarget.style.left = "-20px";
      touchTarget.style.width = "40px";
      touchTarget.style.height = "40px";
      touchTarget.style.borderRadius = "50%";

      const dot = document.createElement("div");
      dot.style.position = "absolute";
      dot.style.top = "-10px";
      dot.style.left = "-10px";
      dot.style.width = "20px";
      dot.style.height = "20px";
      dot.style.borderRadius = "50%";
      dot.style.backgroundColor = categoryColors[loc.category] || "#8B1E2D";
      dot.style.border = isAttachSelected ? "3px solid #EAB308" : "2px solid #FFFFFF";
      dot.style.boxShadow = isAttachSelected
        ? "0 0 0 4px rgba(234, 179, 8, 0.5)"
        : "0 2px 4px rgba(0,0,0,0.35)";

      const label = document.createElement("div");
      label.textContent = loc.nodeId ? `${loc.name} [→${loc.nodeId}]` : loc.name;
      label.style.position = "absolute";
      label.style.top = "14px";
      label.style.left = "0";
      label.style.transform = "translateX(-50%)";
      label.style.fontSize = "12px";
      label.style.fontWeight = "600";
      label.style.color = "#FFFFFF";
      label.style.backgroundColor = isAttachSelected
        ? "rgba(234, 179, 8, 0.9)"
        : "rgba(31, 20, 22, 0.85)";
      label.style.padding = "2px 8px";
      label.style.borderRadius = "9999px";
      label.style.whiteSpace = "nowrap";

      hitArea.appendChild(touchTarget);
      hitArea.appendChild(dot);
      hitArea.appendChild(label);

      hitArea.addEventListener("click", (e) => {
        e.stopPropagation();
        if (mode === "attach") {
          setSelectedLocationForAttach(loc.id);
          setFeedbackMessage(`Selected "${loc.name}". Now click a path node to attach.`);
        } else if (mode === "delete") {
          pushHistory();
          setLocations((prev) =>
            prev.map((l) => (l.id === loc.id ? { ...l, lat: null, lng: null, nodeId: null } : l)),
          );
          setFeedbackMessage(`Removed coordinates for "${loc.name}".`);
        }
      });

      const existing = locationMarkersRef.current.get(loc.id);
      if (existing) {
        existing.position = { lat: loc.lat!, lng: loc.lng! };
        existing.content = hitArea;
        existing.zIndex = isAttachSelected ? 120 : 50;
      } else {
        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: loc.lat!, lng: loc.lng! },
          title: loc.name,
          content: hitArea,
          zIndex: isAttachSelected ? 120 : 50,
        });
        locationMarkersRef.current.set(loc.id, marker);
      }
    }

    locationMarkersRef.current.forEach((marker, id) => {
      if (!validIds.has(id)) {
        marker.map = null;
        locationMarkersRef.current.delete(id);
      }
    });
  }, [mapLoaded, locations, mode, selectedLocationForAttach, pushHistory]);

  // Render & Update Path Node Markers (small squares)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markerLibRef.current) return;
    const { AdvancedMarkerElement } = markerLibRef.current;
    const map = mapInstanceRef.current;

    const currentIds = new Set(nodes.map((n) => n.id));

    for (const node of nodes) {
      const isLinkSelected = selectedNodeForLink === node.id;

      const hitArea = document.createElement("div");
      hitArea.style.position = "relative";
      hitArea.style.width = "0";
      hitArea.style.height = "0";
      hitArea.style.cursor = "pointer";

      // 40px touch hit area
      const touchTarget = document.createElement("div");
      touchTarget.style.position = "absolute";
      touchTarget.style.top = "-20px";
      touchTarget.style.left = "-20px";
      touchTarget.style.width = "40px";
      touchTarget.style.height = "40px";

      // Small square for node
      const square = document.createElement("div");
      square.className = `campus-node-square ${isLinkSelected ? "is-selected" : ""}`;

      const label = document.createElement("div");
      label.className = "campus-node-label";
      label.textContent = node.id;

      hitArea.appendChild(touchTarget);
      hitArea.appendChild(square);
      hitArea.appendChild(label);

      hitArea.addEventListener("click", (e) => {
        e.stopPropagation();

        if (mode === "link_nodes") {
          if (!selectedNodeForLink) {
            setSelectedNodeForLink(node.id);
            setFeedbackMessage(`Selected ${node.id}. Click second node to link.`);
          } else if (selectedNodeForLink === node.id) {
            setSelectedNodeForLink(null);
          } else {
            // Create edge
            pushHistory();
            const a = selectedNodeForLink;
            const b = node.id;
            const exists = edges.some(
              ([e1, e2]) => (e1 === a && e2 === b) || (e1 === b && e2 === a),
            );
            if (!exists) {
              setEdges((prev) => [...prev, [a, b]]);
              setFeedbackMessage(`Linked ${a} ↔ ${b}`);
            }
            setSelectedNodeForLink(null);
          }
        } else if (mode === "attach" && selectedLocationForAttach) {
          pushHistory();
          const targetLocId = selectedLocationForAttach;
          setLocations((prev) =>
            prev.map((l) => (l.id === targetLocId ? { ...l, nodeId: node.id } : l)),
          );
          setSelectedLocationForAttach(null);
          setFeedbackMessage(`Attached location to node ${node.id}`);
        } else if (mode === "delete") {
          pushHistory();
          // Remove node, related edges, and location attachments
          setNodes((prev) => prev.filter((n) => n.id !== node.id));
          setEdges((prev) => prev.filter(([a, b]) => a !== node.id && b !== node.id));
          setLocations((prev) =>
            prev.map((l) => (l.nodeId === node.id ? { ...l, nodeId: null } : l)),
          );
          setFeedbackMessage(`Deleted node ${node.id}`);
        }
      });

      const existing = nodeMarkersRef.current.get(node.id);
      if (existing) {
        existing.position = { lat: node.lat, lng: node.lng };
        existing.content = hitArea;
        existing.zIndex = isLinkSelected ? 150 : 80;
      } else {
        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: node.lat, lng: node.lng },
          title: node.id,
          content: hitArea,
          zIndex: isLinkSelected ? 150 : 80,
        });
        nodeMarkersRef.current.set(node.id, marker);
      }
    }

    nodeMarkersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.map = null;
        nodeMarkersRef.current.delete(id);
      }
    });
  }, [mapLoaded, nodes, mode, selectedNodeForLink, selectedLocationForAttach, edges, pushHistory]);

  // Render & Update Edges (Polylines)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear old polylines
    edgePolylinesRef.current.forEach((p) => p.setMap(null));
    edgePolylinesRef.current = [];

    const nodesMap = new Map(nodes.map((n) => [n.id, n]));

    edges.forEach(([idA, idB]) => {
      const nodeA = nodesMap.get(idA);
      const nodeB = nodesMap.get(idB);
      if (!nodeA || !nodeB) return;

      const polyline = new google.maps.Polyline({
        path: [
          { lat: nodeA.lat, lng: nodeA.lng },
          { lat: nodeB.lat, lng: nodeB.lng },
        ],
        strokeColor: "#F59E0B",
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map,
      });

      polyline.addListener("click", () => {
        if (mode === "delete") {
          pushHistory();
          setEdges((prev) =>
            prev.filter(([a, b]) => !(a === idA && b === idB) && !(a === idB && b === idA)),
          );
          setFeedbackMessage(`Deleted edge ${idA} ↔ ${idB}`);
        }
      });

      edgePolylinesRef.current.push(polyline);
    });
  }, [mapLoaded, nodes, edges, mode, pushHistory]);

  // Render & Update Location -> Node Attachment lines
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    attachmentPolylinesRef.current.forEach((p) => p.setMap(null));
    attachmentPolylinesRef.current = [];

    const nodesMap = new Map(nodes.map((n) => [n.id, n]));

    locations.forEach((loc) => {
      if (!loc.nodeId || loc.lat == null || loc.lng == null) return;
      const targetNode = nodesMap.get(loc.nodeId);
      if (!targetNode) return;

      const line = new google.maps.Polyline({
        path: [
          { lat: loc.lat, lng: loc.lng },
          { lat: targetNode.lat, lng: targetNode.lng },
        ],
        strokeColor: "#10B981",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        map,
      });

      attachmentPolylinesRef.current.push(line);
    });
  }, [mapLoaded, locations, nodes]);

  // Confirm placing location dialog
  const handleConfirmPlaceLocation = () => {
    if (!pendingLocationClick || !selectedLocationIdToPlace) return;
    pushHistory();
    const { lat, lng } = pendingLocationClick;

    let attachedNodeId: string | null = null;

    if (createNodeAndAttach) {
      const newNodeId = getNextNodeId();
      setNodes((prev) => [...prev, { id: newNodeId, lat, lng }]);
      attachedNodeId = newNodeId;
    }

    setLocations((prev) =>
      prev.map((l) =>
        l.id === selectedLocationIdToPlace
          ? {
              ...l,
              lat,
              lng,
              nodeId: attachedNodeId ?? l.nodeId,
            }
          : l,
      ),
    );

    setFeedbackMessage(
      `Set coordinates for "${locations.find((l) => l.id === selectedLocationIdToPlace)?.name}"${attachedNodeId ? ` and attached to node ${attachedNodeId}` : ""}.`,
    );
    setPendingLocationClick(null);
  };

  // Warnings and Analysis Computations
  const analysis = useMemo(() => {
    const unattachedLocations = locations.filter((l) => l.lat != null && l.nodeId == null);
    const unplacedLocations = locations.filter((l) => l.lat == null || l.lng == null);

    const mainGate = locations.find((l) => l.id === "main-gate");
    const mainGateNodeId = mainGate?.nodeId ?? null;

    // Build adjacency list for edge graph
    const adj = new Map<string, Set<string>>();
    nodes.forEach((n) => adj.set(n.id, new Set()));
    edges.forEach(([a, b]) => {
      adj.get(a)?.add(b);
      adj.get(b)?.add(a);
    });

    // BFS from Main Gate node
    const reachable = new Set<string>();
    if (mainGateNodeId && adj.has(mainGateNodeId)) {
      const queue = [mainGateNodeId];
      reachable.add(mainGateNodeId);
      while (queue.length > 0) {
        const curr = queue.shift()!;
        const neighbors = adj.get(curr);
        if (neighbors) {
          for (const next of neighbors) {
            if (!reachable.has(next)) {
              reachable.add(next);
              queue.push(next);
            }
          }
        }
      }
    }

    const disconnectedNodes = nodes.filter((n) => !reachable.has(n.id));

    return {
      unattachedLocations,
      unplacedLocations,
      mainGateNodeId,
      disconnectedNodes,
    };
  }, [locations, nodes, edges]);

  // "Copy JSON" copies & triggers download of campus-data.json
  const handleCopyAndDownloadJson = () => {
    const exportData: CampusGraphData & {
      locations: Array<{
        id: string;
        lat: number | null;
        lng: number | null;
        nodeId: string | null;
      }>;
    } = {
      locations: locations.map((l) => ({
        id: l.id,
        lat: l.lat,
        lng: l.lng,
        nodeId: l.nodeId,
      })),
      nodes,
      edges,
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    // 1. Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonString).catch((e) => console.error(e));
    }

    // 2. Download campus-data.json
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "campus-data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedbackMessage("Copied to clipboard and downloaded campus-data.json!");
  };

  // "Paste JSON" restores state
  const handleRestoreJson = () => {
    try {
      const parsed = JSON.parse(pasteInput) as Partial<CampusGraphData> & {
        locations?: Array<{
          id: string;
          lat: number | null;
          lng: number | null;
          nodeId?: string | null;
        }>;
      };

      pushHistory();

      if (Array.isArray(parsed.nodes)) {
        setNodes(parsed.nodes);
      }
      if (Array.isArray(parsed.edges)) {
        setEdges(parsed.edges);
      }
      if (Array.isArray(parsed.locations)) {
        setLocations((prev) =>
          prev.map((l) => {
            const found = parsed.locations!.find((p) => p.id === l.id);
            if (found) {
              return {
                ...l,
                lat: found.lat ?? null,
                lng: found.lng ?? null,
                nodeId: found.nodeId ?? null,
              };
            }
            return l;
          }),
        );
      }

      setPasteModalOpen(false);
      setPasteInput("");
      setFeedbackMessage("Successfully restored campus graph data!");
    } catch (err) {
      alert("Invalid JSON format. Please verify the copied structure.");
    }
  };

  return (
    <div className="campus-editor-page">
      {/* Top Header & Toolbar */}
      <header className="campus-editor-header">
        <div className="campus-editor-title-group">
          <h1 className="campus-editor-title">Campus Map Editor</h1>
          <span className="campus-editor-badge">DEV ONLY</span>
        </div>

        {/* Toolbar Modes */}
        <div className="campus-editor-modes" role="toolbar" aria-label="Editor modes">
          <button
            type="button"
            className={`campus-mode-btn ${mode === "place_location" ? "is-active" : ""}`}
            onClick={() => setMode("place_location")}
          >
            <MapPin className="size-4" />
            <span>Place location</span>
          </button>
          <button
            type="button"
            className={`campus-mode-btn ${mode === "add_node" ? "is-active" : ""}`}
            onClick={() => setMode("add_node")}
          >
            <PlusSquare className="size-4" />
            <span>Add path node</span>
          </button>
          <button
            type="button"
            className={`campus-mode-btn ${mode === "link_nodes" ? "is-active" : ""}`}
            onClick={() => {
              setMode("link_nodes");
              setSelectedNodeForLink(null);
            }}
          >
            <ArrowRightLeft className="size-4" />
            <span>Link nodes</span>
          </button>
          <button
            type="button"
            className={`campus-mode-btn ${mode === "attach" ? "is-active" : ""}`}
            onClick={() => {
              setMode("attach");
              setSelectedLocationForAttach(null);
            }}
          >
            <LinkIcon className="size-4" />
            <span>Attach</span>
          </button>
          <button
            type="button"
            className={`campus-mode-btn ${mode === "delete" ? "is-active" : ""}`}
            onClick={() => setMode("delete")}
          >
            <Trash2 className="size-4" />
            <span>Delete</span>
          </button>
          <button
            type="button"
            className="campus-action-small-btn"
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo last action"
          >
            <RotateCcw className="size-4" />
            <span>Undo</span>
          </button>
        </div>

        {/* Data Actions */}
        <div className="campus-editor-actions">
          <button
            type="button"
            className="campus-action-small-btn primary"
            onClick={handleCopyAndDownloadJson}
          >
            <Download className="size-4" />
            <Copy className="size-4" />
            <span>Copy JSON</span>
          </button>
          <button
            type="button"
            className="campus-action-small-btn"
            onClick={() => setPasteModalOpen(true)}
          >
            <Upload className="size-4" />
            <span>Paste JSON</span>
          </button>
        </div>
      </header>

      {/* Workspace: Map + Inspector Sidebar */}
      <div className="campus-editor-workspace">
        {/* Map Area */}
        <div className="campus-editor-map-container">
          <div ref={mapContainerRef} className="campus-editor-map-canvas" />

          {/* Mode helper overlay */}
          <div className="campus-editor-status-banner">
            <strong>Mode:</strong>
            {mode === "place_location" && "Click map to set/update location coordinates"}
            {mode === "add_node" && "Click map to create path nodes (n1, n2...)"}
            {mode === "link_nodes" &&
              (selectedNodeForLink
                ? `Node ${selectedNodeForLink} selected. Click second node to connect.`
                : "Tap two nodes to create an edge")}
            {mode === "attach" &&
              (selectedLocationForAttach
                ? "Location selected. Click a node to attach."
                : "Tap a location, then tap a node to attach location.nodeId")}
            {mode === "delete" && "Click any node, edge, or location to remove it"}
          </div>

          {feedbackMessage && (
            <div
              style={{
                position: "absolute",
                bottom: 24,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(15, 118, 110, 0.95)",
                color: "#ffffff",
                padding: "8px 18px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                zIndex: 30,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              {feedbackMessage}
            </div>
          )}
        </div>

        {/* Sidebar Inspector & Warnings */}
        <aside className="campus-editor-sidebar">
          <div className="campus-editor-sidebar-header">
            <h2>Graph Inspector</h2>
          </div>

          <div className="campus-editor-sidebar-content">
            {/* Counts */}
            <div className="campus-editor-counts-grid">
              <div className="campus-count-card">
                <div className="number">
                  {locations.filter((l) => l.lat != null).length}/{locations.length}
                </div>
                <div className="label">Places</div>
              </div>
              <div className="campus-count-card">
                <div className="number">{nodes.length}</div>
                <div className="label">Nodes</div>
              </div>
              <div className="campus-count-card">
                <div className="number">{edges.length}</div>
                <div className="label">Edges</div>
              </div>
            </div>

            {/* Warnings */}
            <div className="campus-warnings-box">
              <h3 style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 700 }}>
                Connectivity & Validation
              </h3>

              {analysis.unattachedLocations.length > 0 && (
                <div className="campus-warning-item warning">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>{analysis.unattachedLocations.length} place(s) without nodeId:</strong>
                    <div style={{ marginTop: 2, fontSize: 11 }}>
                      {analysis.unattachedLocations.map((l) => l.name).join(", ")}
                    </div>
                  </div>
                </div>
              )}

              {!analysis.mainGateNodeId ? (
                <div className="campus-warning-item danger">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Main Gate not attached:</strong> Attach "Main Gate" to a node to check
                    route reachability.
                  </div>
                </div>
              ) : analysis.disconnectedNodes.length > 0 ? (
                <div className="campus-warning-item danger">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>
                      {analysis.disconnectedNodes.length} node(s) not connected to Main Gate:
                    </strong>
                    <div style={{ marginTop: 2, fontSize: 11 }}>
                      {analysis.disconnectedNodes.map((n) => n.id).join(", ")}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="campus-warning-item ok">
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                  <div>All {nodes.length} nodes are connected to Main Gate!</div>
                </div>
              )}
            </div>

            {/* Locations List */}
            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 700 }}>
                Campus Locations ({locations.length})
              </h3>
              <div className="campus-editor-list">
                {locations.map((loc) => (
                  <div
                    key={loc.id}
                    className={`campus-editor-list-item ${
                      selectedLocationForAttach === loc.id ? "is-selected" : ""
                    }`}
                    onClick={() => {
                      if (mode === "attach") {
                        setSelectedLocationForAttach(loc.id);
                        setFeedbackMessage(
                          `Selected "${loc.name}". Now click a path node on the map.`,
                        );
                      }
                    }}
                    style={{ cursor: mode === "attach" ? "pointer" : "default" }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{loc.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {categoryLabels[loc.category]}
                      </div>
                    </div>
                    <div>
                      {loc.nodeId ? (
                        <span className="campus-node-tag">→ {loc.nodeId}</span>
                      ) : (
                        <span
                          style={{ fontSize: 11, color: "var(--danger)", fontWeight: 600 }}
                          title="No path node attached"
                        >
                          Unattached
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Path Nodes List */}
            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 700 }}>
                Path Nodes ({nodes.length})
              </h3>
              <div className="campus-editor-list">
                {nodes.map((n) => (
                  <div key={n.id} className="campus-editor-list-item">
                    <span className="campus-node-tag">{n.id}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {n.lat.toFixed(6)}, {n.lng.toFixed(6)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Place Location Modal */}
      {pendingLocationClick && (
        <div className="campus-editor-modal-backdrop">
          <div className="campus-editor-modal">
            <h3>Place Location on Map</h3>
            <p>
              Coordinates: {pendingLocationClick.lat.toFixed(6)},{" "}
              {pendingLocationClick.lng.toFixed(6)}
            </p>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Choose Location:
              </label>
              <select
                className="campus-editor-select"
                value={selectedLocationIdToPlace}
                onChange={(e) => setSelectedLocationIdToPlace(e.target.value)}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.lat == null ? "(No coordinates yet)" : "(Has coordinates)"}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                id="create-node-chk"
                checked={createNodeAndAttach}
                onChange={(e) => setCreateNodeAndAttach(e.target.checked)}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
              <label htmlFor="create-node-chk" style={{ fontSize: 14, cursor: "pointer" }}>
                Create a path node here and attach it
              </label>
            </div>

            <div className="campus-editor-modal-actions">
              <button
                type="button"
                className="campus-action-small-btn"
                onClick={() => setPendingLocationClick(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="campus-action-small-btn primary"
                onClick={handleConfirmPlaceLocation}
              >
                Set Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste JSON Modal */}
      {pasteModalOpen && (
        <div className="campus-editor-modal-backdrop">
          <div className="campus-editor-modal">
            <h3>Paste Graph JSON</h3>
            <p>
              Paste previously exported campus data JSON (containing <code>locations</code>,{" "}
              <code>nodes</code>, and <code>edges</code>) to restore your session.
            </p>

            <textarea
              className="campus-editor-textarea"
              placeholder='{ "locations": [...], "nodes": [...], "edges": [...] }'
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
            />

            <div className="campus-editor-modal-actions">
              <button
                type="button"
                className="campus-action-small-btn"
                onClick={() => setPasteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="campus-action-small-btn primary"
                onClick={handleRestoreJson}
              >
                Restore / Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
