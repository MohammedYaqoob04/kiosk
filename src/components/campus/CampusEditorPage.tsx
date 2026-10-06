import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRightLeft,
  Check,
  Copy,
  Crosshair,
  Download,
  Eye,
  FileCode,
  Image as ImageIcon,
  ImagePlus,
  Link2,
  Move,
  Network,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Unlink,
  Upload,
  X,
} from "lucide-react";
import {
  BASE_EDGES,
  H,
  JUNCTIONS,
  RING_CENTER,
  RING_RADIUS,
  W,
  getActiveEdges,
  getActiveJunctions,
  resetCampusEdges,
  resetCampusJunctions,
  saveCampusEdges,
  saveCampusJunctions,
  type Point,
} from "@/config/campusMap";
import {
  campusLocations,
  categoryColors,
  categoryLabels,
  getActiveBaseMapImage,
  getActiveCampusLocations,
  resetBaseMapImage,
  resetCampusLocations,
  saveBaseMapImage,
  saveCampusLocations,
  type CampusCategory,
  type CampusLocation,
} from "@/config/campusLocations";
import "@/components/campus/campus-editor.css";

const ALL_CATEGORIES: CampusCategory[] = [
  "academic",
  "hostel",
  "service",
  "sport",
  "landmark",
  "gate",
];

export type EditorMode =
  | "drag"
  | "add_node"
  | "link_nodes"
  | "attach"
  | "delete"
  | "click_to_move";

interface HistoryState {
  locations: CampusLocation[];
  junctions: Record<string, Point>;
  edges: [string, string][];
}

export function CampusEditorPage() {
  if (!import.meta.env.DEV) {
    return (
      <div className="flex min-h-svh items-center justify-center p-8 text-center">
        <div>
          <h2 className="text-2xl font-bold">404 - Not Found</h2>
          <p className="mt-2 text-muted-foreground">Editor is only available in development mode.</p>
        </div>
      </div>
    );
  }

  // --- Active state ---
  const [locations, setLocations] = useState<CampusLocation[]>(() => getActiveCampusLocations());
  const [junctions, setJunctions] = useState<Record<string, Point>>(() => getActiveJunctions());
  const [edges, setEdges] = useState<[string, string][]>(() => getActiveEdges());
  const [mapImage, setMapImage] = useState<string>(() => getActiveBaseMapImage());

  // History for Undo
  const [history, setHistory] = useState<HistoryState[]>([]);

  // Selection
  const [selectedType, setSelectedType] = useState<"place" | "junction">("place");
  const [selectedId, setSelectedId] = useState<string | null>(() => locations[0]?.id ?? null);

  // Editor mode
  const [mode, setMode] = useState<EditorMode>("drag");

  // Multi-step mode targets
  const [selectedNodeForLink, setSelectedNodeForLink] = useState<string | null>(null);
  const [selectedLocationForAttach, setSelectedLocationForAttach] = useState<string | null>(null);

  // View toggles
  const [showJunctions, setShowJunctions] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [activeTab, setActiveTab] = useState<"places" | "junctions" | "image">("places");

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [junctionSearchQuery, setJunctionSearchQuery] = useState("");

  // Connect-to-neighbor select helper in junction card
  const [newNeighborTarget, setNewNeighborTarget] = useState<string>("");

  // Dragging & Cursor tracker
  const [draggingItem, setDraggingItem] = useState<{
    type: "place" | "junction";
    id: string;
  } | null>(null);
  const [cursorCoords, setCursorCoords] = useState<Point | null>(null);

  // Feedback banner
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Export code modal
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportTab, setExportTab] = useState<"locations" | "junctions" | "edges" | "json">("locations");
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteInput, setPasteInput] = useState("");

  // Image upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  }, []);

  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-30), { locations, junctions, edges }]);
  }, [locations, junctions, edges]);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last) {
        setLocations(last.locations);
        setJunctions(last.junctions);
        setEdges(last.edges);
      }
      return prev.slice(0, -1);
    });
    setSelectedNodeForLink(null);
    setSelectedLocationForAttach(null);
    showToast("info", "Undid previous change.");
  }, [showToast]);

  // Mode switcher with feedback
  const handleSetMode = useCallback(
    (newMode: EditorMode) => {
      setMode(newMode);
      setSelectedNodeForLink(null);
      setSelectedLocationForAttach(null);

      switch (newMode) {
        case "add_node":
          showToast("info", "Add Node Mode: Click anywhere on the map stage to drop a new navigation node.");
          break;
        case "link_nodes":
          showToast("info", "Link Nodes Mode: Click first node, then click second node to connect/disconnect.");
          break;
        case "attach":
          showToast("info", "Connect Place to Node: Click a place pin, then click a path junction node to connect.");
          break;
        case "delete":
          showToast("info", "Delete Mode: Click any junction node, path edge, or place pin to delete.");
          break;
        case "click_to_move":
          showToast("info", "Click to Move: Click on the map to relocate the currently selected item.");
          break;
        case "drag":
        default:
          break;
      }
    },
    [showToast],
  );

  // --- Node ID generator ---
  const getNextJunctionId = useCallback((currentJunctions: Record<string, Point>): string => {
    const keys = Object.keys(currentJunctions);
    const numbers = keys
      .map((k) => {
        const match = k.match(/^[jn]?(\d+)$/i);
        return match ? parseInt(match[1]!, 10) : null;
      })
      .filter((n): n is number => n !== null);
    let nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : keys.length + 1;
    let candidate = `j${nextNum}`;
    while (currentJunctions[candidate]) {
      nextNum += 1;
      candidate = `j${nextNum}`;
    }
    return candidate;
  }, []);

  // --- Add Node / Junction ---
  const handleAddJunction = useCallback(
    (point: Point = [450, 405]) => {
      pushHistory();
      const newId = getNextJunctionId(junctions);
      setJunctions((prev) => ({
        ...prev,
        [newId]: point,
      }));
      setSelectedType("junction");
      setSelectedId(newId);
      setActiveTab("junctions");
      showToast("success", `Created navigation node "${newId}" at (${point[0]}, ${point[1]}).`);
    },
    [junctions, getNextJunctionId, pushHistory, showToast],
  );

  // --- Remove Node / Junction Option ---
  const handleDeleteJunction = useCallback(
    (junctionId: string) => {
      pushHistory();
      // Remove junction
      setJunctions((prev) => {
        const next = { ...prev };
        delete next[junctionId];
        return next;
      });
      // Remove all edges connected to this node
      setEdges((prev) => prev.filter(([a, b]) => a !== junctionId && b !== junctionId));
      // Detach any places pointing to this node
      setLocations((prev) =>
        prev.map((loc) => (loc.nodeId === junctionId ? { ...loc, nodeId: null } : loc)),
      );
      if (selectedId === junctionId) {
        setSelectedId(null);
      }
      if (selectedNodeForLink === junctionId) {
        setSelectedNodeForLink(null);
      }
      showToast("info", `Removed junction node "${junctionId}" and cleared its connected edges.`);
    },
    [selectedId, selectedNodeForLink, pushHistory, showToast],
  );

  // --- Link Node to Node (Edges) ---
  const handleToggleEdge = useCallback(
    (nodeA: string, nodeB: string) => {
      if (nodeA === nodeB) return;
      pushHistory();
      const exists = edges.some(
        ([a, b]) => (a === nodeA && b === nodeB) || (a === nodeB && b === nodeA),
      );
      if (exists) {
        setEdges((prev) =>
          prev.filter(([a, b]) => !(a === nodeA && b === nodeB) && !(a === nodeB && b === nodeA)),
        );
        showToast("info", `Disconnected nodes ${nodeA} ↔ ${nodeB}.`);
      } else {
        setEdges((prev) => [...prev, [nodeA, nodeB]]);
        showToast("success", `Connected nodes ${nodeA} ↔ ${nodeB} with path edge.`);
      }
    },
    [edges, pushHistory, showToast],
  );

  const handleDeleteEdge = useCallback(
    (nodeA: string, nodeB: string) => {
      pushHistory();
      setEdges((prev) =>
        prev.filter(([a, b]) => !(a === nodeA && b === nodeB) && !(a === nodeB && b === nodeA)),
      );
      showToast("info", `Deleted edge ${nodeA} ↔ ${nodeB}.`);
    },
    [pushHistory, showToast],
  );

  // --- Connection with Node to Placenodes (Attach Place to Node) ---
  const handleAttachPlaceToNode = useCallback(
    (placeId: string, nodeId: string) => {
      pushHistory();
      const place = locations.find((l) => l.id === placeId);
      setLocations((prev) =>
        prev.map((l) => (l.id === placeId ? { ...l, nodeId } : l)),
      );
      showToast(
        "success",
        `Connected "${place?.name ?? placeId}" to path junction node "${nodeId}".`,
      );
    },
    [locations, pushHistory, showToast],
  );

  const handleDetachPlace = useCallback(
    (placeId: string) => {
      pushHistory();
      const place = locations.find((l) => l.id === placeId);
      setLocations((prev) =>
        prev.map((l) => (l.id === placeId ? { ...l, nodeId: null } : l)),
      );
      showToast("info", `Detached "${place?.name ?? placeId}" from path junction.`);
    },
    [locations, pushHistory, showToast],
  );

  // --- Coordinate calculations & drag handling ---
  const getStageCoords = useCallback((clientX: number, clientY: number): Point => {
    if (!stageRef.current) return [0, 0];
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(W, ((clientX - rect.left) / rect.width) * W)));
    const y = Math.round(Math.max(0, Math.min(H, ((clientY - rect.top) / rect.height) * H)));
    return [x, y];
  }, []);

  const handlePointerDownItem = useCallback(
    (type: "place" | "junction", id: string, e: ReactPointerEvent) => {
      // In modes other than "drag", let onClick handle tool actions
      if (mode !== "drag") {
        return;
      }

      e.stopPropagation();
      e.preventDefault();
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}

      pushHistory();
      setDraggingItem({ type, id });
      setSelectedId(id);
      setSelectedType(type);
      if (type === "place") {
        setActiveTab("places");
      } else {
        setActiveTab("junctions");
      }
    },
    [mode, pushHistory],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const [x, y] = getStageCoords(e.clientX, e.clientY);
      setCursorCoords([x, y]);

      if (!draggingItem) return;

      if (draggingItem.type === "place") {
        setLocations((prev) =>
          prev.map((loc) => (loc.id === draggingItem.id ? { ...loc, x, y, lat: y, lng: x } : loc)),
        );
      } else if (draggingItem.type === "junction") {
        setJunctions((prev) => ({
          ...prev,
          [draggingItem.id]: [x, y],
        }));
      }
    },
    [draggingItem, getStageCoords],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent) => {
      if (draggingItem) {
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
        setDraggingItem(null);
      }
    },
    [draggingItem],
  );

  // --- Stage Background Click Handler ---
  const handleStageClick = useCallback(
    (e: React.MouseEvent) => {
      const [x, y] = getStageCoords(e.clientX, e.clientY);

      if (mode === "add_node") {
        handleAddJunction([x, y]);
      } else if (mode === "click_to_move" && selectedId) {
        pushHistory();
        if (selectedType === "place") {
          setLocations((prev) =>
            prev.map((loc) => (loc.id === selectedId ? { ...loc, x, y, lat: y, lng: x } : loc)),
          );
          showToast("success", `Relocated place to (${x}, ${y})`);
        } else if (selectedType === "junction") {
          setJunctions((prev) => ({
            ...prev,
            [selectedId]: [x, y],
          }));
          showToast("success", `Relocated junction ${selectedId} to (${x}, ${y})`);
        }
      } else if (mode === "link_nodes" && selectedNodeForLink) {
        setSelectedNodeForLink(null);
        showToast("info", "Node linking cancelled.");
      } else if (mode === "attach" && selectedLocationForAttach) {
        setSelectedLocationForAttach(null);
        showToast("info", "Attachment selection cancelled.");
      }
    },
    [
      mode,
      selectedId,
      selectedType,
      selectedNodeForLink,
      selectedLocationForAttach,
      getStageCoords,
      handleAddJunction,
      pushHistory,
      showToast,
    ],
  );

  // --- Junction Pin Click Handler ---
  const handleJunctionPinClick = useCallback(
    (jId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      if (mode === "link_nodes") {
        if (!selectedNodeForLink) {
          setSelectedNodeForLink(jId);
          showToast("info", `Selected node "${jId}". Now click a second node to connect/disconnect.`);
        } else if (selectedNodeForLink === jId) {
          setSelectedNodeForLink(null);
          showToast("info", `Deselected node "${jId}".`);
        } else {
          handleToggleEdge(selectedNodeForLink, jId);
          setSelectedNodeForLink(null);
        }
      } else if (mode === "attach") {
        if (selectedLocationForAttach) {
          handleAttachPlaceToNode(selectedLocationForAttach, jId);
          setSelectedLocationForAttach(null);
        } else if (selectedType === "place" && selectedId) {
          handleAttachPlaceToNode(selectedId, jId);
        } else {
          showToast("info", `Click a place pin first, then click this node to connect them.`);
        }
      } else if (mode === "delete") {
        handleDeleteJunction(jId);
      } else {
        setSelectedId(jId);
        setSelectedType("junction");
        setActiveTab("junctions");
      }
    },
    [
      mode,
      selectedNodeForLink,
      selectedLocationForAttach,
      selectedType,
      selectedId,
      handleToggleEdge,
      handleAttachPlaceToNode,
      handleDeleteJunction,
      showToast,
    ],
  );

  // --- Place Pin Click Handler ---
  const handlePlacePinClick = useCallback(
    (locId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      if (mode === "attach") {
        setSelectedLocationForAttach(locId);
        setSelectedType("place");
        setSelectedId(locId);
        const loc = locations.find((l) => l.id === locId);
        showToast("info", `Selected place "${loc?.name}". Now click a junction node to connect.`);
      } else if (mode === "delete") {
        pushHistory();
        setLocations((prev) => prev.filter((l) => l.id !== locId));
        if (selectedId === locId) {
          setSelectedId(null);
        }
        showToast("info", "Place removed.");
      } else {
        setSelectedId(locId);
        setSelectedType("place");
        setActiveTab("places");
      }
    },
    [mode, locations, selectedId, pushHistory, showToast],
  );

  // --- Selected Place & Selected Junction ---
  const selectedPlace = useMemo(
    () => (selectedType === "place" ? locations.find((l) => l.id === selectedId) ?? null : null),
    [locations, selectedId, selectedType],
  );

  const selectedJunction = useMemo(() => {
    if (selectedType !== "junction" || !selectedId || !junctions[selectedId]) {
      return null;
    }
    return { id: selectedId, point: junctions[selectedId]! };
  }, [junctions, selectedId, selectedType]);

  // Connected neighbors of selected junction
  const selectedJunctionNeighbors = useMemo(() => {
    if (!selectedJunction) return [];
    const res: string[] = [];
    edges.forEach(([a, b]) => {
      if (a === selectedJunction.id && junctions[b]) res.push(b);
      if (b === selectedJunction.id && junctions[a]) res.push(a);
    });
    return Array.from(new Set(res));
  }, [selectedJunction, edges, junctions]);

  // Places attached to selected junction
  const selectedJunctionPlaces = useMemo(() => {
    if (!selectedJunction) return [];
    return locations.filter((loc) => loc.nodeId === selectedJunction.id);
  }, [selectedJunction, locations]);

  const handleUpdatePlace = useCallback(
    (fields: Partial<CampusLocation>) => {
      if (!selectedPlace) return;
      pushHistory();
      setLocations((prev) =>
        prev.map((loc) => (loc.id === selectedPlace.id ? { ...loc, ...fields } : loc)),
      );
    },
    [selectedPlace, pushHistory],
  );

  const handleAdjustPlaceCoord = useCallback(
    (axis: "x" | "y", delta: number) => {
      if (!selectedPlace) return;
      pushHistory();
      const currentVal = selectedPlace[axis];
      const maxVal = axis === "x" ? W : H;
      const newVal = Math.max(0, Math.min(maxVal, currentVal + delta));

      setLocations((prev) =>
        prev.map((loc) => {
          if (loc.id !== selectedPlace.id) return loc;
          if (axis === "x") {
            return { ...loc, x: newVal, lng: newVal };
          }
          return { ...loc, y: newVal, lat: newVal };
        }),
      );
    },
    [selectedPlace, pushHistory],
  );

  const handleAdjustJunctionCoord = useCallback(
    (axis: 0 | 1, delta: number) => {
      if (!selectedJunction) return;
      pushHistory();
      const pt = selectedJunction.point;
      const maxVal = axis === 0 ? W : H;
      const newVal = Math.max(0, Math.min(maxVal, pt[axis] + delta));
      const nextPt: Point = axis === 0 ? [newVal, pt[1]] : [pt[0], newVal];

      setJunctions((prev) => ({
        ...prev,
        [selectedJunction.id]: nextPt,
      }));
    },
    [selectedJunction, pushHistory],
  );

  const handleAddPlace = useCallback(() => {
    pushHistory();
    const newId = `l${Date.now().toString(36)}`;
    const newPlace: CampusLocation = {
      id: newId,
      name: "New Campus Location",
      category: "academic",
      x: 450,
      y: 405,
      lat: 405,
      lng: 450,
      nodeId: Object.keys(junctions)[0] ?? "mid",
      description: "",
    };
    setLocations((prev) => [newPlace, ...prev]);
    setSelectedType("place");
    setSelectedId(newId);
    setActiveTab("places");
    showToast("info", "New place added at center. Drag or edit coordinates to place it.");
  }, [junctions, pushHistory, showToast]);

  const handleDeletePlace = useCallback(
    (id: string) => {
      pushHistory();
      setLocations((prev) => prev.filter((l) => l.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
      showToast("info", "Place removed.");
    },
    [selectedId, pushHistory, showToast],
  );

  // --- Base Map Image Upload ---
  const handleImageFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showToast("error", "Please choose a valid image file (PNG, JPG, SVG, WEBP).");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setMapImage(dataUrl);
          saveBaseMapImage(dataUrl);
          showToast("success", "Custom base map image uploaded and applied to navigation!");
        }
      };
      reader.readAsDataURL(file);
    },
    [showToast],
  );

  const handleResetImage = useCallback(() => {
    resetBaseMapImage();
    setMapImage("/assets/campus-map.jpg");
    showToast("info", "Reverted to default campus map image.");
  }, [showToast]);

  // --- Submit Changes ---
  const handleSubmitChanges = useCallback(() => {
    saveCampusLocations(locations);
    saveCampusJunctions(junctions);
    saveCampusEdges(edges);
    showToast("success", "Changes submitted! Offline campus navigation (/campus) is updated.");
  }, [locations, junctions, edges, showToast]);

  // --- Reset All Defaults ---
  const handleResetAllDefaults = useCallback(() => {
    if (
      !window.confirm(
        "Are you sure you want to revert all place names, notes, nodes, edges, and map image to code defaults?",
      )
    ) {
      return;
    }
    resetCampusLocations();
    resetCampusJunctions();
    resetCampusEdges();
    resetBaseMapImage();
    setLocations([...campusLocations]);
    setJunctions({ ...JUNCTIONS });
    setEdges([...BASE_EDGES]);
    setMapImage("/assets/campus-map.jpg");
    setSelectedId(campusLocations[0]?.id ?? null);
    setSelectedNodeForLink(null);
    setSelectedLocationForAttach(null);
    showToast("info", "All data reset to code defaults.");
  }, [showToast]);

  // Filtered places list for sidebar
  const filteredPlaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return locations.filter((loc) => {
      const matchesSearch =
        !q ||
        loc.name.toLowerCase().includes(q) ||
        (loc.description && loc.description.toLowerCase().includes(q));
      const matchesCat = categoryFilter === "all" || loc.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [locations, searchQuery, categoryFilter]);

  // Filtered junctions list for sidebar
  const filteredJunctions = useMemo(() => {
    const q = junctionSearchQuery.trim().toLowerCase();
    return Object.entries(junctions).filter(([jId]) => !q || jId.toLowerCase().includes(q));
  }, [junctions, junctionSearchQuery]);

  // Code export content
  const exportLocationsCode = useMemo(() => {
    return `export const campusLocations: CampusLocation[] = ${JSON.stringify(locations, null, 2)};`;
  }, [locations]);

  const exportJunctionsCode = useMemo(() => {
    return `export const JUNCTIONS: Record<string, Point> = ${JSON.stringify(junctions, null, 2)};`;
  }, [junctions]);

  const exportEdgesCode = useMemo(() => {
    return `export const BASE_EDGES: [string, string][] = ${JSON.stringify(edges, null, 2)};`;
  }, [edges]);

  const exportJsonCode = useMemo(() => {
    return JSON.stringify({ locations, junctions, edges }, null, 2);
  }, [locations, junctions, edges]);

  const handleCopyCode = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text);
      showToast("success", "Copied to clipboard!");
    },
    [showToast],
  );

  const handleDownloadJson = useCallback(() => {
    const blob = new Blob([exportJsonCode], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "campus-navigation-data.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Downloaded campus-navigation-data.json");
  }, [exportJsonCode, showToast]);

  const handleRestoreJson = useCallback(() => {
    try {
      const parsed = JSON.parse(pasteInput) as {
        locations?: CampusLocation[];
        junctions?: Record<string, Point>;
        edges?: [string, string][];
      };

      pushHistory();

      if (parsed.locations && Array.isArray(parsed.locations)) {
        setLocations(parsed.locations);
      }
      if (parsed.junctions && typeof parsed.junctions === "object") {
        setJunctions(parsed.junctions);
      }
      if (parsed.edges && Array.isArray(parsed.edges)) {
        setEdges(parsed.edges);
      }

      setPasteModalOpen(false);
      setPasteInput("");
      showToast("success", "Restored campus navigation data from JSON!");
    } catch {
      showToast("error", "Invalid JSON format. Please verify the copied structure.");
    }
  }, [pasteInput, pushHistory, showToast]);

  const isCustomBaseMap = mapImage !== "/assets/campus-map.jpg";

  return (
    <div className="campus-editor-page">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/svg+xml"
        style={{ display: "none" }}
        onChange={handleImageFileChange}
      />

      {/* Header Toolbar */}
      <header className="campus-editor-header">
        <div className="campus-editor-title-group">
          <Link
            to="/campus"
            className="campus-action-small-btn"
            title="Return to Live Campus Navigation"
          >
            <ArrowLeft className="size-4" />
            <span>Campus</span>
          </Link>
          <h1 className="campus-editor-title">Campus Map Editor</h1>
          <span className="campus-editor-badge">DEV ONLY</span>
          <span className="campus-editor-subtext">Offline SVG & Image Navigation</span>
        </div>

        <div className="campus-editor-actions">
          <button
            type="button"
            className="campus-action-small-btn"
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo last change"
          >
            <RotateCcw className="size-4" />
            <span>Undo ({history.length})</span>
          </button>

          <button
            type="button"
            className="campus-action-small-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload a new base map image (PNG/JPG/WEBP/SVG)"
          >
            <ImagePlus className="size-4" />
            <span>Upload Base Map</span>
          </button>

          {isCustomBaseMap && (
            <button
              type="button"
              className="campus-action-small-btn"
              onClick={handleResetImage}
              title="Revert base map to default /assets/campus-map.jpg"
            >
              <span>Reset Image</span>
            </button>
          )}

          <button
            type="button"
            className="campus-action-small-btn"
            onClick={() => setExportModalOpen(true)}
            title="Export updated TypeScript code or JSON"
          >
            <FileCode className="size-4" />
            <span>Export Code</span>
          </button>

          <button
            type="button"
            className="campus-action-small-btn"
            onClick={() => setPasteModalOpen(true)}
            title="Paste and restore JSON data"
          >
            <Upload className="size-4" />
            <span>Paste JSON</span>
          </button>

          <button
            type="button"
            className="campus-action-small-btn primary"
            onClick={handleSubmitChanges}
            title="Save and publish changes to the offline kiosk navigation"
          >
            <Save className="size-4" />
            <span>Submit Changes</span>
          </button>
        </div>
      </header>

      {/* Feedback Toast */}
      {toast && (
        <div className={`campus-editor-feedback-toast ${toast.type}`} role="status">
          {toast.type === "success" && <Check className="size-4" />}
          {toast.type === "error" && <AlertCircle className="size-4" />}
          {toast.type === "info" && <Eye className="size-4" />}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-75"
            aria-label="Dismiss toast"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="campus-editor-workspace">
        {/* Left Map Area */}
        <div className="campus-editor-map-container">
          {/* Stage Top Control Bar */}
          <div className="campus-editor-stage-toolbar">
            <div className="campus-stage-toolbar-group">
              <strong>Tools:</strong>
              <button
                type="button"
                className={`campus-stage-mode-btn ${mode === "drag" ? "is-active" : ""}`}
                onClick={() => handleSetMode("drag")}
                title="Drag pins or nodes directly on the canvas"
              >
                <Move className="size-3.5" />
                <span>Drag to Adjust</span>
              </button>

              <button
                type="button"
                className={`campus-stage-mode-btn ${mode === "add_node" ? "is-active" : ""}`}
                onClick={() => handleSetMode("add_node")}
                title="Click anywhere on the map to add a new path junction node"
              >
                <Plus className="size-3.5" />
                <span>Add Node</span>
              </button>

              <button
                type="button"
                className={`campus-stage-mode-btn ${mode === "link_nodes" ? "is-active" : ""}`}
                onClick={() => handleSetMode("link_nodes")}
                title="Click two nodes sequentially to connect or disconnect them"
              >
                <ArrowRightLeft className="size-3.5" />
                <span>Link Nodes</span>
              </button>

              <button
                type="button"
                className={`campus-stage-mode-btn ${mode === "attach" ? "is-active" : ""}`}
                onClick={() => handleSetMode("attach")}
                title="Click a place, then click a node to connect place to path node"
              >
                <Link2 className="size-3.5" />
                <span>Connect to Place</span>
              </button>

              <button
                type="button"
                className={`campus-stage-mode-btn ${mode === "delete" ? "is-active" : ""}`}
                onClick={() => handleSetMode("delete")}
                title="Click any node, edge, or place pin to delete it"
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </button>

              <button
                type="button"
                className={`campus-stage-mode-btn ${mode === "click_to_move" ? "is-active" : ""}`}
                onClick={() => handleSetMode("click_to_move")}
                title="Click map to reposition currently selected item"
              >
                <Crosshair className="size-3.5" />
                <span>Move Selected</span>
              </button>
            </div>

            <div className="campus-stage-toolbar-group">
              <button
                type="button"
                className={`campus-stage-toggle-chip ${showJunctions ? "is-active" : ""}`}
                onClick={() => setShowJunctions((v) => !v)}
              >
                <span>Nodes ({Object.keys(junctions).length})</span>
              </button>
              <button
                type="button"
                className={`campus-stage-toggle-chip ${showEdges ? "is-active" : ""}`}
                onClick={() => setShowEdges((v) => !v)}
              >
                <span>Edges ({edges.length})</span>
              </button>
              <button
                type="button"
                className={`campus-stage-toggle-chip ${showLabels ? "is-active" : ""}`}
                onClick={() => setShowLabels((v) => !v)}
              >
                <span>Labels</span>
              </button>
            </div>
          </div>

          {/* Map Canvas Viewport */}
          <div
            className="campus-editor-canvas-viewport"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div
              ref={stageRef}
              className={`campus-editor-stage mode-${mode}`}
              onClick={handleStageClick}
            >
              {/* Base Map Image */}
              <img
                src={mapImage}
                alt="Offline Campus Navigation Base Map"
                className="campus-editor-stage-img"
              />

              {/* SVG Path Lines Layer */}
              <svg
                className="campus-editor-stage-svg"
                viewBox={`0 0 ${W} ${H}`}
                aria-hidden="true"
              >
                {/* Ring Circle */}
                {showEdges && (
                  <circle
                    cx={RING_CENTER[0]}
                    cy={RING_CENTER[1]}
                    r={RING_RADIUS}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    opacity="0.75"
                  />
                )}

                {/* Path Edges */}
                {showEdges &&
                  edges.map(([a, b]) => {
                    const ptA = junctions[a];
                    const ptB = junctions[b];
                    if (!ptA || !ptB) return null;
                    return (
                      <line
                        key={`${a}-${b}`}
                        x1={ptA[0]}
                        y1={ptA[1]}
                        x2={ptB[0]}
                        y2={ptB[1]}
                        stroke="#F59E0B"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className={`campus-editor-edge-line ${mode === "delete" ? "mode-delete" : ""}`}
                        style={{
                          pointerEvents: mode === "delete" ? "stroke" : "none",
                        }}
                        onClick={(e) => {
                          if (mode === "delete") {
                            e.stopPropagation();
                            handleDeleteEdge(a, b);
                          }
                        }}
                        opacity="0.85"
                      />
                    );
                  })}

                {/* Dotted lines from places to attached junction node */}
                {locations.map((loc) => {
                  if (!loc.nodeId || !junctions[loc.nodeId]) return null;
                  const jPt = junctions[loc.nodeId]!;
                  const isSelected = loc.id === selectedId && selectedType === "place";
                  const isAttachStart = selectedLocationForAttach === loc.id;
                  return (
                    <line
                      key={`attach-${loc.id}`}
                      x1={loc.x}
                      y1={loc.y}
                      x2={jPt[0]}
                      y2={jPt[1]}
                      stroke={isAttachStart ? "#10B981" : isSelected ? "#8B1E2D" : "#10B981"}
                      strokeWidth={isAttachStart ? "3" : isSelected ? "2.5" : "1.5"}
                      strokeDasharray="4 4"
                      opacity={isAttachStart ? "1" : isSelected ? "0.9" : "0.5"}
                    />
                  );
                })}

                {/* Interactive Linking Preview Line */}
                {mode === "link_nodes" &&
                  selectedNodeForLink &&
                  junctions[selectedNodeForLink] &&
                  cursorCoords && (
                    <line
                      x1={junctions[selectedNodeForLink]![0]}
                      y1={junctions[selectedNodeForLink]![1]}
                      x2={cursorCoords[0]}
                      y2={cursorCoords[1]}
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeDasharray="5 5"
                      opacity="0.9"
                    />
                  )}

                {/* Interactive Place Attach Preview Line */}
                {mode === "attach" &&
                  selectedLocationForAttach &&
                  cursorCoords &&
                  (() => {
                    const loc = locations.find((l) => l.id === selectedLocationForAttach);
                    if (!loc) return null;
                    return (
                      <line
                        x1={loc.x}
                        y1={loc.y}
                        x2={cursorCoords[0]}
                        y2={cursorCoords[1]}
                        stroke="#10B981"
                        strokeWidth="2.5"
                        strokeDasharray="5 5"
                        opacity="0.9"
                      />
                    );
                  })()}
              </svg>

              {/* Navigation Junction Nodes */}
              {showJunctions &&
                Object.entries(junctions).map(([jId, pt]) => {
                  const isSelected = selectedId === jId && selectedType === "junction";
                  const isDragging = draggingItem?.id === jId && draggingItem?.type === "junction";
                  const isLinkStart = selectedNodeForLink === jId;

                  return (
                    <div
                      key={`j-${jId}`}
                      className={`campus-editor-junction-pin ${isSelected ? "is-selected" : ""} ${
                        isDragging ? "is-dragging" : ""
                      } ${isLinkStart ? "is-link-start" : ""}`}
                      style={{
                        left: `${(pt[0] / W) * 100}%`,
                        top: `${(pt[1] / H) * 100}%`,
                      }}
                      onPointerDown={(e) => handlePointerDownItem("junction", jId, e)}
                      onClick={(e) => handleJunctionPinClick(jId, e)}
                      title={`Junction Node: ${jId}`}
                    >
                      <div className="campus-editor-junction-box" />
                      {showLabels && (
                        <div className="campus-editor-junction-label">
                          {jId} ({pt[0]},{pt[1]})
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Places Location Pins */}
              {locations.map((loc) => {
                const isSelected = loc.id === selectedId && selectedType === "place";
                const isDragging = draggingItem?.id === loc.id && draggingItem?.type === "place";
                const isAttachStart = selectedLocationForAttach === loc.id;
                const catColor = categoryColors[loc.category] || "#8B1E2D";

                return (
                  <div
                    key={loc.id}
                    className={`campus-editor-place-pin ${isSelected ? "is-selected" : ""} ${
                      isDragging ? "is-dragging" : ""
                    } ${isAttachStart ? "is-attach-start" : ""}`}
                    style={{
                      left: `${(loc.x / W) * 100}%`,
                      top: `${(loc.y / H) * 100}%`,
                    }}
                    onPointerDown={(e) => handlePointerDownItem("place", loc.id, e)}
                    onClick={(e) => handlePlacePinClick(loc.id, e)}
                    title={loc.name}
                  >
                    <div
                      className="campus-editor-pin-dot"
                      style={{ backgroundColor: catColor }}
                    />
                    {showLabels && (
                      <div className="campus-editor-pin-label">
                        {loc.name} {loc.nodeId ? `[→${loc.nodeId}]` : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Status Bar */}
          <div className="campus-editor-stage-statusbar">
            <div className="campus-editor-stage-statusbar-info">
              <span>
                <strong>Canvas:</strong> {W} × {H} px
              </span>
              {cursorCoords && (
                <span>
                  <strong>Cursor:</strong> X: {cursorCoords[0]}, Y: {cursorCoords[1]}
                </span>
              )}
              {selectedPlace && (
                <span>
                  <strong>Selected Place:</strong> {selectedPlace.name} (X: {selectedPlace.x}, Y:{" "}
                  {selectedPlace.y})
                </span>
              )}
              {selectedJunction && (
                <span>
                  <strong>Selected Junction:</strong> {selectedJunction.id} (X:{" "}
                  {selectedJunction.point[0]}, Y: {selectedJunction.point[1]})
                </span>
              )}
            </div>
            <div>
              {mode === "add_node" && (
                <span className="text-accent font-semibold">
                  Click on canvas to add a new navigation node
                </span>
              )}
              {mode === "link_nodes" && (
                <span className="text-amber-700 font-semibold">
                  {selectedNodeForLink
                    ? `Click second node to connect/disconnect with "${selectedNodeForLink}"`
                    : "Click a first node to start linking"}
                </span>
              )}
              {mode === "attach" && (
                <span className="text-emerald-700 font-semibold">
                  {selectedLocationForAttach
                    ? `Click a junction node to attach "${locations.find((l) => l.id === selectedLocationForAttach)?.name}"`
                    : "Click a place pin first to connect it to a node"}
                </span>
              )}
              {mode === "delete" && (
                <span className="text-red-700 font-semibold">
                  Click any node, edge, or place pin to delete
                </span>
              )}
              {mode === "click_to_move" && (
                <span className="text-amber-700 font-semibold">
                  Click map to reposition selected item
                </span>
              )}
              {mode === "drag" && <span>Drag any pin or node to reposition</span>}
            </div>
          </div>
        </div>

        {/* Right Sidebar Inspector */}
        <aside className="campus-editor-sidebar">
          {/* Tabs */}
          <div className="campus-editor-tabs-bar">
            <button
              type="button"
              className={`campus-editor-tab-btn ${activeTab === "places" ? "is-active" : ""}`}
              onClick={() => setActiveTab("places")}
            >
              <span>Places ({locations.length})</span>
            </button>
            <button
              type="button"
              className={`campus-editor-tab-btn ${activeTab === "junctions" ? "is-active" : ""}`}
              onClick={() => setActiveTab("junctions")}
            >
              <Network className="size-4" />
              <span>Nodes ({Object.keys(junctions).length})</span>
            </button>
            <button
              type="button"
              className={`campus-editor-tab-btn ${activeTab === "image" ? "is-active" : ""}`}
              onClick={() => setActiveTab("image")}
            >
              <ImageIcon className="size-4" />
              <span>Base Map</span>
            </button>
          </div>

          {/* Sidebar Body */}
          <div className="campus-editor-sidebar-body">
            {/* TAB 1: PLACES */}
            {activeTab === "places" && (
              <>
                {/* Selected Place Detail Form */}
                {selectedPlace ? (
                  <div className="campus-editor-card">
                    <div className="campus-editor-card-header">
                      <h3 className="campus-editor-card-title">Edit Place Details</h3>
                      <button
                        type="button"
                        className="text-xs text-red-700 hover:underline inline-flex items-center gap-1 font-semibold"
                        onClick={() => handleDeletePlace(selectedPlace.id)}
                      >
                        <Trash2 className="size-3.5" />
                        <span>Delete Place</span>
                      </button>
                    </div>

                    {/* Place Name */}
                    <div className="campus-editor-field-group">
                      <label className="campus-editor-label" htmlFor="place-name-input">
                        Place Name
                      </label>
                      <input
                        id="place-name-input"
                        type="text"
                        className="campus-editor-input"
                        value={selectedPlace.name}
                        onChange={(e) => handleUpdatePlace({ name: e.target.value })}
                        placeholder="e.g. Mechanical Department"
                      />
                    </div>

                    {/* Category */}
                    <div className="campus-editor-field-group">
                      <label className="campus-editor-label" htmlFor="place-cat-select">
                        Category
                      </label>
                      <select
                        id="place-cat-select"
                        className="campus-editor-select"
                        value={selectedPlace.category}
                        onChange={(e) =>
                          handleUpdatePlace({ category: e.target.value as CampusCategory })
                        }
                      >
                        {ALL_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {categoryLabels[cat]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Notes / Description */}
                    <div className="campus-editor-field-group">
                      <label className="campus-editor-label" htmlFor="place-notes-textarea">
                        <span>Notes / Visitor Directions</span>
                        <span className="text-xs text-muted-foreground font-normal">Optional</span>
                      </label>
                      <textarea
                        id="place-notes-textarea"
                        className="campus-editor-textarea"
                        value={selectedPlace.description ?? ""}
                        onChange={(e) => handleUpdatePlace({ description: e.target.value })}
                        placeholder="Add notes, entrance details, floor, or nearby landmark..."
                      />
                    </div>

                    {/* Coordinates Adjustment */}
                    <div className="campus-coords-row">
                      <div className="campus-editor-field-group">
                        <label className="campus-editor-label" htmlFor="place-x-input">
                          Coordinate X (0..{W})
                        </label>
                        <input
                          id="place-x-input"
                          type="number"
                          min={0}
                          max={W}
                          className="campus-editor-input"
                          value={selectedPlace.x}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              handleUpdatePlace({ x: val, lng: val });
                            }
                          }}
                        />
                        <div className="campus-coord-steppers">
                          <button
                            type="button"
                            className="campus-step-btn"
                            onClick={() => handleAdjustPlaceCoord("x", -5)}
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            className="campus-step-btn"
                            onClick={() => handleAdjustPlaceCoord("x", -1)}
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            className="campus-step-btn"
                            onClick={() => handleAdjustPlaceCoord("x", +1)}
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            className="campus-step-btn"
                            onClick={() => handleAdjustPlaceCoord("x", +5)}
                          >
                            +5
                          </button>
                        </div>
                      </div>

                      <div className="campus-editor-field-group">
                        <label className="campus-editor-label" htmlFor="place-y-input">
                          Coordinate Y (0..{H})
                        </label>
                        <input
                          id="place-y-input"
                          type="number"
                          min={0}
                          max={H}
                          className="campus-editor-input"
                          value={selectedPlace.y}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              handleUpdatePlace({ y: val, lat: val });
                            }
                          }}
                        />
                        <div className="campus-coord-steppers">
                          <button
                            type="button"
                            className="campus-step-btn"
                            onClick={() => handleAdjustPlaceCoord("y", -5)}
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            className="campus-step-btn"
                            onClick={() => handleAdjustPlaceCoord("y", -1)}
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            className="campus-step-btn"
                            onClick={() => handleAdjustPlaceCoord("y", +1)}
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            className="campus-step-btn"
                            onClick={() => handleAdjustPlaceCoord("y", +5)}
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Connected Navigation Junction (Node to Place Connection) */}
                    <div className="campus-editor-field-group mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="campus-editor-label m-0" htmlFor="place-junction-select">
                          Connected Path Junction Node
                        </label>
                        {selectedPlace.nodeId && (
                          <button
                            type="button"
                            className="text-xs text-red-700 hover:underline inline-flex items-center gap-1"
                            onClick={() => handleDetachPlace(selectedPlace.id)}
                          >
                            <Unlink className="size-3" />
                            <span>Detach</span>
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <select
                          id="place-junction-select"
                          className="campus-editor-select flex-1"
                          value={selectedPlace.nodeId ?? ""}
                          onChange={(e) => handleUpdatePlace({ nodeId: e.target.value || null })}
                        >
                          <option value="">-- No Connected Node --</option>
                          {Object.keys(junctions).map((jId) => (
                            <option key={jId} value={jId}>
                              Node: {jId} ({junctions[jId]?.[0]}, {junctions[jId]?.[1]})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="campus-action-small-btn"
                          title="Click on a node on the map stage to connect this place"
                          onClick={() => {
                            setSelectedLocationForAttach(selectedPlace.id);
                            handleSetMode("attach");
                          }}
                        >
                          <Link2 className="size-3.5" />
                          <span>Attach</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg text-center text-muted-foreground text-sm">
                    Select a place on the map or from the list below to edit its name, notes, and
                    coordinates.
                  </div>
                )}

                {/* Places Search & List Header */}
                <div className="flex items-center justify-between gap-2 mt-2">
                  <h4 className="text-sm font-semibold">Campus Places ({locations.length})</h4>
                  <button
                    type="button"
                    className="campus-action-small-btn primary"
                    onClick={handleAddPlace}
                  >
                    <Plus className="size-4" />
                    <span>Add Place</span>
                  </button>
                </div>

                {/* Search & Category Filter */}
                <div className="campus-editor-search-box">
                  <div className="relative flex-1">
                    <Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      className="campus-editor-input pl-9"
                      placeholder="Search places or notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className="campus-editor-select w-36 text-xs"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    {ALL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Places Scrollable List */}
                <div className="campus-editor-places-scroll">
                  {filteredPlaces.map((loc) => {
                    const isSelected = loc.id === selectedId && selectedType === "place";
                    const catColor = categoryColors[loc.category] || "#8B1E2D";

                    return (
                      <button
                        key={loc.id}
                        type="button"
                        className={`campus-editor-place-item ${isSelected ? "is-selected" : ""}`}
                        onClick={() => {
                          setSelectedId(loc.id);
                          setSelectedType("place");
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="size-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: catColor }}
                          />
                          <div className="campus-editor-place-meta">
                            <span className="campus-editor-place-name">{loc.name}</span>
                            <span className="campus-editor-place-sub">
                              {categoryLabels[loc.category]} · {loc.nodeId ? `→ node ${loc.nodeId}` : "Unattached"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 text-xs font-mono text-muted-foreground">
                          {loc.x}, {loc.y}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* TAB 2: JUNCTIONS / NODES */}
            {activeTab === "junctions" && (
              <>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-sm font-semibold">Path Nodes ({Object.keys(junctions).length})</h4>
                  <button
                    type="button"
                    className="campus-action-small-btn primary"
                    onClick={() => handleAddJunction()}
                    title="Add a new junction node"
                  >
                    <Plus className="size-4" />
                    <span>Add Node</span>
                  </button>
                </div>

                {selectedJunction ? (
                  <div className="campus-editor-card">
                    <div className="campus-editor-card-header">
                      <h3 className="campus-editor-card-title">
                        Node: <span className="font-mono text-accent">{selectedJunction.id}</span>
                      </h3>
                      {/* Remove Junction Option */}
                      <button
                        type="button"
                        className="campus-danger-button"
                        onClick={() => handleDeleteJunction(selectedJunction.id)}
                        title="Remove junction node and disconnect all its edges"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Remove Junction</span>
                      </button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Coordinates on canvas ({W} × {H}):
                    </p>

                    <div className="campus-coords-row">
                      <div className="campus-editor-field-group">
                        <label className="campus-editor-label" htmlFor="junc-x-input">
                          Coordinate X (0..{W})
                        </label>
                        <input
                          id="junc-x-input"
                          type="number"
                          min={0}
                          max={W}
                          className="campus-editor-input"
                          value={selectedJunction.point[0]}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              pushHistory();
                              setJunctions((prev) => ({
                                ...prev,
                                [selectedJunction.id]: [val, selectedJunction.point[1]],
                              }));
                            }
                          }}
                        />
                        <div className="campus-coord-steppers">
                          <button
                            type="button"
                            className="campus-step-btn"
                            onClick={() => handleAdjustJunctionCoord(0, -5)}
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            className="campus-step-btn"
                            onClick={() => handleAdjustJunctionCoord(0, -1)}
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            className="campus-step-btn"
                            onClick={() => handleAdjustJunctionCoord(0, +1)}
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            className="campus-step-btn"
                            onClick={() => handleAdjustJunctionCoord(0, +5)}
                          >
                            +5
                          </button>
                        </div>
                      </div>

                      <div className="campus-editor-field-group">
                        <label className="campus-editor-label" htmlFor="junc-y-input">
                          Coordinate Y (0..{H})
                        </label>
                        <input
                          id="junc-y-input"
                          type="number"
                          min={0}
                          max={H}
                          className="campus-editor-input"
                          value={selectedJunction.point[1]}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              pushHistory();
                              setJunctions((prev) => ({
                                ...prev,
                                [selectedJunction.id]: [selectedJunction.point[0], val],
                              }));
                            }
                          }}
                        />
                        <div className="campus-coord-steppers">
                          <button
                            type="button"
                            className="campus-step-btn"
                            onClick={() => handleAdjustJunctionCoord(1, -5)}
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            className="campus-step-btn"
                            onClick={() => handleAdjustJunctionCoord(1, -1)}
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            className="campus-step-btn"
                            onClick={() => handleAdjustJunctionCoord(1, +1)}
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            className="campus-step-btn"
                            onClick={() => handleAdjustJunctionCoord(1, +5)}
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Connected Neighbor Nodes (Edges) */}
                    <div className="campus-editor-field-group mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">
                          Connected Node Edges ({selectedJunctionNeighbors.length})
                        </span>
                        <button
                          type="button"
                          className="text-xs text-accent hover:underline inline-flex items-center gap-1 font-semibold"
                          onClick={() => {
                            setSelectedNodeForLink(selectedJunction.id);
                            handleSetMode("link_nodes");
                          }}
                        >
                          <ArrowRightLeft className="size-3" />
                          <span>Link on Map</span>
                        </button>
                      </div>

                      {selectedJunctionNeighbors.length > 0 ? (
                        <div className="campus-neighbors-container">
                          {selectedJunctionNeighbors.map((neighborId) => (
                            <div key={neighborId} className="campus-neighbor-chip">
                              <span className="campus-neighbor-chip-id">
                                ↔ Node: {neighborId}
                              </span>
                              <button
                                type="button"
                                className="campus-neighbor-remove-btn"
                                onClick={() => handleToggleEdge(selectedJunction.id, neighborId)}
                                title={`Disconnect from ${neighborId}`}
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground p-2 bg-surface-2 rounded border">
                          No connected edges yet. Link this node to other nodes to build routes.
                        </div>
                      )}

                      {/* Connect to another node selector */}
                      <div className="flex gap-2 mt-2">
                        <select
                          className="campus-editor-select flex-1 text-xs"
                          value={newNeighborTarget}
                          onChange={(e) => setNewNeighborTarget(e.target.value)}
                        >
                          <option value="">-- Connect to another node --</option>
                          {Object.keys(junctions)
                            .filter((id) => id !== selectedJunction.id && !selectedJunctionNeighbors.includes(id))
                            .map((id) => (
                              <option key={id} value={id}>
                                Node: {id}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          className="campus-action-small-btn"
                          disabled={!newNeighborTarget}
                          onClick={() => {
                            if (newNeighborTarget) {
                              handleToggleEdge(selectedJunction.id, newNeighborTarget);
                              setNewNeighborTarget("");
                            }
                          }}
                        >
                          <span>Connect</span>
                        </button>
                      </div>
                    </div>

                    {/* Attached Campus Places */}
                    <div className="campus-editor-field-group mt-3">
                      <span className="text-xs font-semibold block mb-1">
                        Attached Campus Places ({selectedJunctionPlaces.length})
                      </span>
                      {selectedJunctionPlaces.length > 0 ? (
                        <div className="flex flex-col gap-1 max-h-36 overflow-auto">
                          {selectedJunctionPlaces.map((place) => (
                            <div
                              key={place.id}
                              className="text-xs p-1.5 bg-surface-2 rounded border flex items-center justify-between"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className="size-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: categoryColors[place.category] || "#8B1E2D" }}
                                />
                                <span className="font-semibold truncate">{place.name}</span>
                              </div>
                              <button
                                type="button"
                                className="text-red-700 hover:underline text-[11px] ml-2 flex-shrink-0"
                                onClick={() => handleDetachPlace(place.id)}
                              >
                                Detach
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground p-2 bg-surface-2 rounded border">
                          No places currently route through this junction.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg text-center text-muted-foreground text-sm">
                    Select a path junction from the map or list to adjust coordinates or manage connections.
                  </div>
                )}

                {/* Search Junctions */}
                <div className="relative mt-2">
                  <Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    className="campus-editor-input pl-9"
                    placeholder="Search junction nodes..."
                    value={junctionSearchQuery}
                    onChange={(e) => setJunctionSearchQuery(e.target.value)}
                  />
                </div>

                {/* Junctions List */}
                <div className="campus-editor-places-scroll mt-2">
                  {filteredJunctions.map(([jId, pt]) => {
                    const isSelected = selectedId === jId && selectedType === "junction";
                    const isLinkStart = selectedNodeForLink === jId;
                    return (
                      <button
                        key={jId}
                        type="button"
                        className={`campus-editor-place-item ${isSelected ? "is-selected" : ""} ${
                          isLinkStart ? "is-link-start" : ""
                        }`}
                        onClick={() => {
                          setSelectedId(jId);
                          setSelectedType("junction");
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="size-3 bg-amber-500 rounded-sm flex-shrink-0" />
                          <span className="font-semibold font-mono">{jId}</span>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          {pt[0]}, {pt[1]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* TAB 3: BASE MAP IMAGE */}
            {activeTab === "image" && (
              <div className="flex flex-col gap-4">
                <div className="campus-editor-card">
                  <h3 className="campus-editor-card-title">Base Map Image Configuration</h3>
                  <p className="text-xs text-muted-foreground">
                    Replace the offline campus map image. The uploaded file is saved locally and will be
                    used by the main kiosk navigation page (/campus).
                  </p>

                  <div
                    className="campus-editor-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-6 text-accent" />
                    <h4>Upload New Base Map Image</h4>
                    <p>PNG, JPG, WEBP, or SVG · Recommended 900 × 810 or similar aspect ratio</p>
                    <button
                      type="button"
                      className="campus-action-small-btn primary mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <ImagePlus className="size-4" />
                      <span>Select File</span>
                    </button>
                  </div>

                  <div className="mt-2">
                    <label className="text-xs font-semibold text-text block mb-1">
                      Current Base Map Status
                    </label>
                    <div className="p-3 bg-surface-2 rounded-lg border text-xs flex items-center justify-between">
                      <span>{isCustomBaseMap ? "Custom Uploaded Image" : "Default Map Asset"}</span>
                      {isCustomBaseMap && (
                        <button
                          type="button"
                          className="text-red-700 hover:underline font-semibold"
                          onClick={handleResetImage}
                        >
                          Revert to Default
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="campus-editor-img-preview mt-2">
                    <img src={mapImage} alt="Map preview" />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions inside Sidebar */}
            <div className="mt-auto pt-4 border-t flex flex-col gap-2">
              <button
                type="button"
                className="campus-action-small-btn primary w-full justify-center"
                onClick={handleSubmitChanges}
              >
                <Save className="size-4" />
                <span>Submit & Publish Changes</span>
              </button>

              <button
                type="button"
                className="campus-action-small-btn outline-danger w-full justify-center"
                onClick={handleResetAllDefaults}
              >
                <RotateCcw className="size-4" />
                <span>Reset All to Code Defaults</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Export Code Modal */}
      {exportModalOpen && (
        <div className="campus-editor-modal-backdrop" onClick={() => setExportModalOpen(false)}>
          <div className="campus-editor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="campus-editor-modal-header">
              <h3>Export Campus Navigation Data</h3>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="hover:opacity-75"
                aria-label="Close export modal"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex border-b gap-2">
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-semibold rounded-t ${
                  exportTab === "locations" ? "bg-accent text-white" : "bg-surface-2"
                }`}
                onClick={() => setExportTab("locations")}
              >
                campusLocations.ts ({locations.length})
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-semibold rounded-t ${
                  exportTab === "junctions" ? "bg-accent text-white" : "bg-surface-2"
                }`}
                onClick={() => setExportTab("junctions")}
              >
                campusMap.ts (JUNCTIONS)
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-semibold rounded-t ${
                  exportTab === "edges" ? "bg-accent text-white" : "bg-surface-2"
                }`}
                onClick={() => setExportTab("edges")}
              >
                BASE_EDGES ({edges.length})
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-semibold rounded-t ${
                  exportTab === "json" ? "bg-accent text-white" : "bg-surface-2"
                }`}
                onClick={() => setExportTab("json")}
              >
                JSON Backup
              </button>
            </div>

            <pre className="campus-editor-code-pre">
              {exportTab === "locations" && exportLocationsCode}
              {exportTab === "junctions" && exportJunctionsCode}
              {exportTab === "edges" && exportEdgesCode}
              {exportTab === "json" && exportJsonCode}
            </pre>

            <div className="campus-editor-modal-actions">
              <button
                type="button"
                className="campus-action-small-btn"
                onClick={() =>
                  handleCopyCode(
                    exportTab === "locations"
                      ? exportLocationsCode
                      : exportTab === "junctions"
                      ? exportJunctionsCode
                      : exportTab === "edges"
                      ? exportEdgesCode
                      : exportJsonCode,
                  )
                }
              >
                <Copy className="size-4" />
                <span>Copy Code</span>
              </button>

              <button
                type="button"
                className="campus-action-small-btn primary"
                onClick={handleDownloadJson}
              >
                <Download className="size-4" />
                <span>Download JSON</span>
              </button>

              <button
                type="button"
                className="campus-action-small-btn"
                onClick={() => setExportModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste JSON Restore Modal */}
      {pasteModalOpen && (
        <div className="campus-editor-modal-backdrop" onClick={() => setPasteModalOpen(false)}>
          <div className="campus-editor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="campus-editor-modal-header">
              <h3>Paste Campus JSON Data</h3>
              <button
                type="button"
                onClick={() => setPasteModalOpen(false)}
                className="hover:opacity-75"
                aria-label="Close paste modal"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Paste the exported JSON data containing <code>locations</code>, <code>junctions</code>, and/or <code>edges</code> to restore them.
            </p>

            <textarea
              className="campus-editor-textarea font-mono text-xs"
              style={{ minHeight: "220px" }}
              placeholder='{"locations": [...], "junctions": {...}, "edges": [...]}'
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
            />

            <div className="campus-editor-modal-actions">
              <button
                type="button"
                className="campus-action-small-btn primary"
                onClick={handleRestoreJson}
                disabled={!pasteInput.trim()}
              >
                <span>Restore Data</span>
              </button>
              <button
                type="button"
                className="campus-action-small-btn"
                onClick={() => setPasteModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
