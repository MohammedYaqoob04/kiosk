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
  type Point,
} from "@/config/campusMap";
import {
  campusLocations,
  categoryColors,
  categoryLabels,
  type CampusCategory,
  type CampusLocation,
} from "@/config/campusLocations";
import { useCampusMap, defaultCampusMap, type CampusMapData } from "@/lib/useCampusMap";
import { CampusMapStage } from "@/components/campus/CampusMapStage";
import { pointerToMapCoordinates, findNearestNode, roundCoordinate } from "@/lib/campusGeometry";
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

  const { mapData: savedMapData, saveMap, resetToDefault } = useCampusMap();

  // --- Active state ---
  const [locations, setLocations] = useState<CampusLocation[]>(() => savedMapData.locations);
  const [junctions, setJunctions] = useState<Record<string, Point>>(() => savedMapData.junctions);
  const [edges, setEdges] = useState<[string, string][]>(() => savedMapData.edges);
  const [mapImage, setMapImage] = useState<string>(() => savedMapData.image);
  const [mapWidth, setMapWidth] = useState<number>(() => savedMapData.width);
  const [mapHeight, setMapHeight] = useState<number>(() => savedMapData.height);
  const [mapVersion, setMapVersion] = useState<number | string>(() => savedMapData.version);

  // History for Undo
  const [history, setHistory] = useState<HistoryState[]>([]);

  // Sync draft state with saved map if history is empty
  useEffect(() => {
    if (history.length === 0) {
      setLocations(savedMapData.locations);
      setJunctions(savedMapData.junctions);
      setEdges(savedMapData.edges);
      setMapImage(savedMapData.image);
      setMapWidth(savedMapData.width);
      setMapHeight(savedMapData.height);
      setMapVersion(savedMapData.version);
    }
  }, [savedMapData, history.length]);

  // Preview kiosk mode toggle
  const [previewKioskMode, setPreviewKioskMode] = useState(false);

  // Dimension mismatch safety banner
  const [dimensionMismatch, setDimensionMismatch] = useState<{
    naturalWidth: number;
    naturalHeight: number;
  } | null>(null);

  // Image size change dialog
  const [imageSizeDialog, setImageSizeDialog] = useState<{
    isOpen: boolean;
    dataUrl: string;
    newWidth: number;
    newHeight: number;
    oldWidth: number;
    oldHeight: number;
  } | null>(null);

  // Manual Transform fields
  const [transformScaleX, setTransformScaleX] = useState<number>(1);
  const [transformScaleY, setTransformScaleY] = useState<number>(1);
  const [transformOffsetX, setTransformOffsetX] = useState<number>(0);
  const [transformOffsetY, setTransformOffsetY] = useState<number>(0);

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

  // Image upload ref and stage SVG ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorSvgRef = useRef<SVGSVGElement | null>(null);

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
  const getStageCoords = useCallback(
    (e: React.PointerEvent | React.MouseEvent | { clientX: number; clientY: number }): Point => {
      if (!editorSvgRef.current) return [0, 0];
      const pt = pointerToMapCoordinates(e, editorSvgRef.current);
      return [pt.x, pt.y];
    },
    [],
  );

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
      const [x, y] = getStageCoords(e);
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
      const [x, y] = getStageCoords(e);

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
      } else if (mode === "attach" && selectedLocationForAttach) {
        const nearest = findNearestNode({ x, y }, junctions);
        if (nearest) {
          handleAttachPlaceToNode(selectedLocationForAttach, nearest.nodeId);
          setSelectedLocationForAttach(null);
          setMode("drag");
        } else {
          setSelectedLocationForAttach(null);
          showToast("info", "Attachment selection cancelled.");
        }
      } else if (mode === "link_nodes" && selectedNodeForLink) {
        setSelectedNodeForLink(null);
        showToast("info", "Node linking cancelled.");
      }
    },
    [
      mode,
      selectedId,
      selectedType,
      selectedNodeForLink,
      selectedLocationForAttach,
      junctions,
      getStageCoords,
      handleAddJunction,
      handleAttachPlaceToNode,
      pushHistory,
      showToast,
    ],
  );

  // --- Junction Pin Click Handler ---
  const handleJunctionPinClick = useCallback(
    (jId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();

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
    (locId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();

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

  // Draft map data computed object
  const draftMapData = useMemo<CampusMapData>(
    () => ({
      width: mapWidth,
      height: mapHeight,
      image: mapImage,
      version: mapVersion,
      locations,
      junctions,
      edges,
      ringCenter: savedMapData.ringCenter ?? RING_CENTER,
      ringRadius: savedMapData.ringRadius ?? RING_RADIUS,
    }),
    [
      mapWidth,
      mapHeight,
      mapImage,
      mapVersion,
      locations,
      junctions,
      edges,
      savedMapData.ringCenter,
      savedMapData.ringRadius,
    ],
  );

  const versionedDraftImageSrc = useMemo(() => {
    if (!mapImage) return "/assets/campus-map.jpg?v=1";
    if (mapImage.startsWith("data:") || mapImage.startsWith("blob:")) {
      return mapImage;
    }
    const sep = mapImage.includes("?") ? "&" : "?";
    return `${mapImage}${sep}v=${mapVersion}`;
  }, [mapImage, mapVersion]);

  // Attach place to nearest node helper
  const handleAttachToNearestNode = useCallback(
    (placeId: string) => {
      const place = locations.find((l) => l.id === placeId);
      if (!place) return;
      const nearest = findNearestNode({ x: place.x, y: place.y }, junctions);
      if (nearest) {
        handleAttachPlaceToNode(placeId, nearest.nodeId);
        showToast(
          "success",
          `Connected "${place.name}" to nearest node "${nearest.nodeId}" (${nearest.distance}px away).`,
        );
      } else {
        showToast("error", "No path nodes found to attach to.");
      }
    },
    [locations, junctions, handleAttachPlaceToNode, showToast],
  );

  // Manual transform helper (scale proportionally or offset)
  const handleApplyTransform = useCallback(() => {
    if (
      transformScaleX === 1 &&
      transformScaleY === 1 &&
      transformOffsetX === 0 &&
      transformOffsetY === 0
    ) {
      showToast("info", "No transform values to apply.");
      return;
    }
    pushHistory();
    setLocations((prev) =>
      prev.map((l) => {
        const newX = roundCoordinate(l.x * transformScaleX + transformOffsetX);
        const newY = roundCoordinate(l.y * transformScaleY + transformOffsetY);
        return { ...l, x: newX, y: newY, lat: newY, lng: newX };
      }),
    );
    setJunctions((prev) => {
      const updated: Record<string, Point> = {};
      for (const [id, pt] of Object.entries(prev)) {
        updated[id] = [
          roundCoordinate(pt[0] * transformScaleX + transformOffsetX),
          roundCoordinate(pt[1] * transformScaleY + transformOffsetY),
        ];
      }
      return updated;
    });
    showToast(
      "success",
      `Applied transform: Scale (${transformScaleX}, ${transformScaleY}), Offset (${transformOffsetX}px, ${transformOffsetY}px).`,
    );
  }, [
    transformScaleX,
    transformScaleY,
    transformOffsetX,
    transformOffsetY,
    pushHistory,
    showToast,
  ]);

  const handleAdjustPlaceCoord = useCallback(
    (axis: "x" | "y", delta: number) => {
      if (!selectedPlace) return;
      pushHistory();
      const currentVal = selectedPlace[axis];
      const maxVal = axis === "x" ? mapWidth : mapHeight;
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
    [selectedPlace, mapWidth, mapHeight, pushHistory],
  );

  const handleAdjustJunctionCoord = useCallback(
    (axis: 0 | 1, delta: number) => {
      if (!selectedJunction) return;
      pushHistory();
      const pt = selectedJunction.point;
      const maxVal = axis === 0 ? mapWidth : mapHeight;
      const newVal = Math.max(0, Math.min(maxVal, pt[axis] + delta));
      const nextPt: Point = axis === 0 ? [newVal, pt[1]] : [pt[0], newVal];

      setJunctions((prev) => ({
        ...prev,
        [selectedJunction.id]: nextPt,
      }));
    },
    [selectedJunction, mapWidth, mapHeight, pushHistory],
  );

  const handleAddPlace = useCallback(() => {
    pushHistory();
    const newId = `l${Date.now().toString(36)}`;
    const centerX = Math.round(mapWidth / 2);
    const centerY = Math.round(mapHeight / 2);
    const newPlace: CampusLocation = {
      id: newId,
      name: "New Campus Location",
      category: "academic",
      x: centerX,
      y: centerY,
      lat: centerY,
      lng: centerX,
      nodeId: Object.keys(junctions)[0] ?? "mid",
      description: "",
    };
    setLocations((prev) => [newPlace, ...prev]);
    setSelectedType("place");
    setSelectedId(newId);
    setActiveTab("places");
    showToast("info", "New place added at center. Drag or edit coordinates to place it.");
  }, [junctions, mapWidth, mapHeight, pushHistory, showToast]);

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

  // --- Base Map Image Upload with Dimension Safety ---
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
        if (!dataUrl) return;

        const img = new Image();
        img.onload = () => {
          const realWidth = img.naturalWidth;
          const realHeight = img.naturalHeight;
          const prevWidth = mapWidth;
          const prevHeight = mapHeight;

          if (realWidth !== prevWidth || realHeight !== prevHeight) {
            setImageSizeDialog({
              isOpen: true,
              dataUrl,
              newWidth: realWidth,
              newHeight: realHeight,
              oldWidth: prevWidth,
              oldHeight: prevHeight,
            });
          } else {
            pushHistory();
            setMapImage(dataUrl);
            setMapWidth(realWidth);
            setMapHeight(realHeight);
            setMapVersion(Date.now());
            setDimensionMismatch(null);
            showToast("success", `Custom base map image uploaded (${realWidth} × ${realHeight}px)!`);
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [mapWidth, mapHeight, pushHistory, showToast],
  );

  const handleConfirmScaleProportionally = useCallback(() => {
    if (!imageSizeDialog) return;
    const { dataUrl, newWidth, newHeight, oldWidth, oldHeight } = imageSizeDialog;
    pushHistory();
    const sx = newWidth / oldWidth;
    const sy = newHeight / oldHeight;

    setLocations((prev) =>
      prev.map((l) => {
        const nx = roundCoordinate(l.x * sx);
        const ny = roundCoordinate(l.y * sy);
        return { ...l, x: nx, y: ny, lat: ny, lng: nx };
      }),
    );
    setJunctions((prev) => {
      const updated: Record<string, Point> = {};
      for (const [id, pt] of Object.entries(prev)) {
        updated[id] = [roundCoordinate(pt[0] * sx), roundCoordinate(pt[1] * sy)];
      }
      return updated;
    });
    setMapImage(dataUrl);
    setMapWidth(newWidth);
    setMapHeight(newHeight);
    setMapVersion(Date.now());
    setDimensionMismatch(null);
    setImageSizeDialog(null);
    showToast("info", "Map image updated and coordinates scaled proportionally. Pins must be checked.");
  }, [imageSizeDialog, pushHistory, showToast]);

  const handleConfirmKeepPixelPositions = useCallback(() => {
    if (!imageSizeDialog) return;
    const { dataUrl, newWidth, newHeight } = imageSizeDialog;
    pushHistory();
    setMapImage(dataUrl);
    setMapWidth(newWidth);
    setMapHeight(newHeight);
    setMapVersion(Date.now());
    setDimensionMismatch(null);
    setImageSizeDialog(null);
    showToast("info", "Map image updated keeping pixel coordinates. Pins must be checked.");
  }, [imageSizeDialog, pushHistory, showToast]);

  const handleResetImage = useCallback(() => {
    setMapImage("/assets/campus-map.jpg");
    setMapWidth(W);
    setMapHeight(H);
    setMapVersion(Date.now());
    setDimensionMismatch(null);
    showToast("info", "Reverted to default campus map image.");
  }, [showToast]);

  // --- Submit Changes (Publishes exact draft coordinates) ---
  const handleSubmitChanges = useCallback(async () => {
    await saveMap(draftMapData);
    showToast("success", "Changes submitted & published! Kiosk and editor are synchronized.");
  }, [draftMapData, saveMap, showToast]);

  // --- Reset All Defaults ---
  const handleResetAllDefaults = useCallback(() => {
    if (
      !window.confirm(
        "Are you sure you want to revert all place names, notes, nodes, edges, and map image to code defaults?",
      )
    ) {
      return;
    }
    resetToDefault();
    setLocations([...defaultCampusMap.locations]);
    setJunctions({ ...defaultCampusMap.junctions });
    setEdges([...defaultCampusMap.edges]);
    setMapImage(defaultCampusMap.image);
    setMapWidth(defaultCampusMap.width);
    setMapHeight(defaultCampusMap.height);
    setMapVersion(Date.now());
    setSelectedId(defaultCampusMap.locations[0]?.id ?? null);
    setSelectedNodeForLink(null);
    setSelectedLocationForAttach(null);
    setDimensionMismatch(null);
    showToast("info", "All data reset to code defaults.");
  }, [resetToDefault, showToast]);

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
              <button
                type="button"
                className={`campus-stage-toggle-chip ${previewKioskMode ? "is-active" : ""}`}
                onClick={() => setPreviewKioskMode((v) => !v)}
                title="Preview map exactly as it will display on the touch kiosk"
              >
                <Eye className="size-3.5" />
                <span>Preview as kiosk</span>
              </button>
            </div>
          </div>

          {/* Map Canvas Viewport */}
          <div
            className="campus-editor-canvas-viewport"
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "auto",
              padding: "16px",
            }}
          >
            {/* Dimension Mismatch Warning Banner */}
            {dimensionMismatch && (
              <div
                className="mb-3 w-full max-w-4xl rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 shadow-sm flex items-center justify-between gap-3 text-sm z-10"
                role="alert"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-5 text-amber-600 flex-shrink-0" />
                  <span>
                    <strong>Dimension Mismatch Warning:</strong> Displayed image natural size (
                    {dimensionMismatch.naturalWidth} × {dimensionMismatch.naturalHeight}px) differs
                    from map dimensions ({mapWidth} × {mapHeight}px). Pins must be checked.
                  </span>
                </div>
                <button
                  type="button"
                  className="campus-action-small-btn whitespace-nowrap"
                  onClick={() => {
                    setMapWidth(dimensionMismatch.naturalWidth);
                    setMapHeight(dimensionMismatch.naturalHeight);
                    setDimensionMismatch(null);
                    showToast("info", "Map dimensions updated to match image size.");
                  }}
                >
                  Match Image Size
                </button>
              </div>
            )}

            {previewKioskMode ? (
              /* Preview as Kiosk Panel */
              <div
                className="campus-editor-kiosk-preview-frame w-full h-full flex items-center justify-center"
                style={{ maxHeight: "85vh" }}
              >
                <CampusMapStage
                  mapData={draftMapData}
                  versionedImageSrc={versionedDraftImageSrc}
                  version={mapVersion}
                  selectedId={selectedId}
                  onSelectLocation={(loc) => setSelectedId(loc.id)}
                  showPins={true}
                  showNodes={false}
                  showEdges={false}
                  showRing={false}
                  showLabels={showLabels}
                />
              </div>
            ) : (
              /* Editor Canvas using CampusMapStage */
              <div
                className={`campus-editor-stage-outer mode-${mode} w-full h-full flex items-center justify-center`}
                style={{ maxHeight: "85vh" }}
              >
                <CampusMapStage
                  svgRef={editorSvgRef}
                  mapData={draftMapData}
                  versionedImageSrc={versionedDraftImageSrc}
                  version={mapVersion}
                  selectedId={selectedId}
                  selectedType={selectedType}
                  selectedNodeForLink={selectedNodeForLink}
                  selectedLocationForAttach={selectedLocationForAttach}
                  showPins={true}
                  showNodes={showJunctions}
                  showEdges={showEdges}
                  showRing={showEdges}
                  showLabels={showLabels}
                  onSelectLocation={(loc) => handlePlacePinClick(loc.id)}
                  onSelectJunction={(jId) => handleJunctionPinClick(jId)}
                  onPinPointerDown={handlePointerDownItem}
                  onSvgPointerMove={handlePointerMove}
                  onSvgPointerUp={handlePointerUp}
                  onSvgClick={handleStageClick}
                  onEdgeClick={(a, b) => {
                    if (mode === "delete") {
                      handleDeleteEdge(a, b);
                    }
                  }}
                  onImageSizeCheck={(natW, natH) => {
                    if (natW !== mapWidth || natH !== mapHeight) {
                      setDimensionMismatch({ naturalWidth: natW, naturalHeight: natH });
                    } else {
                      setDimensionMismatch(null);
                    }
                  }}
                  customOverlayChildren={
                    <>
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
                            pointerEvents="none"
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
                              pointerEvents="none"
                            />
                          );
                        })()}
                    </>
                  }
                />
              </div>
            )}
          </div>

          {/* Bottom Status Bar */}
          <div className="campus-editor-stage-statusbar">
            <div className="campus-editor-stage-statusbar-info">
              <span>
                <strong>Canvas:</strong> {mapWidth} × {mapHeight} px
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
                          Coordinate X (0..{mapWidth})
                        </label>
                        <input
                          id="place-x-input"
                          type="number"
                          min={0}
                          max={mapWidth}
                          className="campus-editor-input"
                          value={selectedPlace.x}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              handleUpdatePlace({ x: roundCoordinate(val), lng: roundCoordinate(val) });
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
                          Coordinate Y (0..{mapHeight})
                        </label>
                        <input
                          id="place-y-input"
                          type="number"
                          min={0}
                          max={mapHeight}
                          className="campus-editor-input"
                          value={selectedPlace.y}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              handleUpdatePlace({ y: roundCoordinate(val), lat: roundCoordinate(val) });
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
                        <button
                          type="button"
                          className="campus-action-small-btn"
                          title="Automatically attach to nearest node"
                          onClick={() => handleAttachToNearestNode(selectedPlace.id)}
                        >
                          <Crosshair className="size-3.5" />
                          <span>Nearest</span>
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
                      Coordinates on canvas ({mapWidth} × {mapHeight}):
                    </p>

                    <div className="campus-coords-row">
                      <div className="campus-editor-field-group">
                        <label className="campus-editor-label" htmlFor="junc-x-input">
                          Coordinate X (0..{mapWidth})
                        </label>
                        <input
                          id="junc-x-input"
                          type="number"
                          min={0}
                          max={mapWidth}
                          className="campus-editor-input"
                          value={selectedJunction.point[0]}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              pushHistory();
                              setJunctions((prev) => ({
                                ...prev,
                                [selectedJunction.id]: [roundCoordinate(val), selectedJunction.point[1]],
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
                          Coordinate Y (0..{mapHeight})
                        </label>
                        <input
                          id="junc-y-input"
                          type="number"
                          min={0}
                          max={mapHeight}
                          className="campus-editor-input"
                          value={selectedJunction.point[1]}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              pushHistory();
                              setJunctions((prev) => ({
                                ...prev,
                                [selectedJunction.id]: [selectedJunction.point[0], roundCoordinate(val)],
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
                      <div>
                        <span className="font-medium block">
                          {isCustomBaseMap ? "Custom Uploaded Image" : "Default Map Asset"}
                        </span>
                        <span className="text-muted-foreground block text-[11px]">
                          Dimensions: {mapWidth} × {mapHeight} px
                        </span>
                      </div>
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

                  {/* Explicit Scale & Offset Transforms */}
                  <div className="mt-3 pt-3 border-t">
                    <label className="text-xs font-semibold text-text block mb-1">
                      Scale & Offset Transforms
                    </label>
                    <p className="text-[11px] text-muted-foreground mb-2">
                      Transform all place and node coordinates proportionally or shift by offset:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-0.5">Scale X</label>
                        <input
                          type="number"
                          step="0.05"
                          className="campus-editor-input"
                          value={transformScaleX}
                          onChange={(e) => setTransformScaleX(parseFloat(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-0.5">Scale Y</label>
                        <input
                          type="number"
                          step="0.05"
                          className="campus-editor-input"
                          value={transformScaleY}
                          onChange={(e) => setTransformScaleY(parseFloat(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-0.5">Offset X (px)</label>
                        <input
                          type="number"
                          step="1"
                          className="campus-editor-input"
                          value={transformOffsetX}
                          onChange={(e) => setTransformOffsetX(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-0.5">Offset Y (px)</label>
                        <input
                          type="number"
                          step="1"
                          className="campus-editor-input"
                          value={transformOffsetY}
                          onChange={(e) => setTransformOffsetY(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="campus-action-small-btn mt-2.5 w-full justify-center"
                      onClick={handleApplyTransform}
                    >
                      Apply Transform
                    </button>
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

      {/* Image Size Safety Dialog */}
      {imageSizeDialog && (
        <div
          className="campus-editor-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="img-size-dialog-title"
        >
          <div className="campus-editor-modal" style={{ maxWidth: "460px" }}>
            <div className="campus-editor-modal-header">
              <h3 id="img-size-dialog-title" className="text-base font-bold text-foreground">
                Map Image Dimensions Changed
              </h3>
              <button
                type="button"
                onClick={() => setImageSizeDialog(null)}
                className="hover:opacity-75"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              The new image size is{" "}
              <strong>
                {imageSizeDialog.newWidth} × {imageSizeDialog.newHeight} px
              </strong>
              , differing from previous map dimensions (
              <strong>
                {imageSizeDialog.oldWidth} × {imageSizeDialog.oldHeight} px
              </strong>
              ).
            </p>

            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs my-2">
              ⚠️ <strong>Warning:</strong> Pins and junction nodes must be verified after resizing the
              base map. Choose how existing coordinates should be handled:
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                className="campus-action-small-btn primary w-full justify-center py-2"
                onClick={handleConfirmScaleProportionally}
              >
                Scale Proportionally
              </button>
              <button
                type="button"
                className="campus-action-small-btn w-full justify-center py-2"
                onClick={handleConfirmKeepPixelPositions}
              >
                Keep Exact Pixel Positions
              </button>
              <button
                type="button"
                className="campus-action-small-btn w-full justify-center"
                onClick={() => setImageSizeDialog(null)}
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
