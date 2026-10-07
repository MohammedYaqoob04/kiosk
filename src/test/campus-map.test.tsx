import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CampusMap } from "@/components/campus/CampusMap";
import { CampusMapStage } from "@/components/campus/CampusMapStage";
import { getActiveCampusLocations } from "@/config/campusLocations";
import { defaultCampusMap } from "@/lib/useCampusMap";
import {
  pointerToMapCoordinates,
  imageToPercent,
  percentToImage,
  validateCampusMap,
} from "@/lib/campusGeometry";

describe("CampusMap Component", () => {
  it("does not render junction nodes or workflow networks", () => {
    const locations = getActiveCampusLocations();
    const onSelect = () => {};

    const { container } = render(
      <CampusMap locations={locations} selectedId={null} onSelect={onSelect} />,
    );

    // Verify junction nodes are NOT rendered
    const junctionNodes = container.querySelectorAll(".campus-junction-node");
    expect(junctionNodes.length).toBe(0);

    const junctionBoxes = container.querySelectorAll(".campus-junction-box");
    expect(junctionBoxes.length).toBe(0);
  });

  it("renders place markers with exact pixel coordinates matching campus-editor", () => {
    const locations = getActiveCampusLocations();
    const onSelect = () => {};

    const { container } = render(
      <CampusMap locations={locations} selectedId="l11" onSelect={onSelect} />,
    );

    // AI&DS location
    const aidsLoc = locations.find((l) => l.name === "AI&DS");
    expect(aidsLoc).toBeDefined();

    const markerWrappers = container.querySelectorAll(".campus-marker-wrapper");
    expect(markerWrappers.length).toBeGreaterThan(0);

    // Look for AI&DS marker
    const aidsBtn = screen.getByRole("button", { name: "AI&DS" });
    expect(aidsBtn).toBeDefined();

    const aidsWrapper = aidsBtn.closest(".campus-marker-wrapper") as HTMLElement;
    expect(aidsWrapper).not.toBeNull();
    expect(aidsWrapper.style.left).toBe(`${aidsLoc!.x}px`);
    expect(aidsWrapper.style.top).toBe(`${aidsLoc!.y}px`);
  });

  it("has Zoom In, Zoom Out, and Reset View controls", () => {
    const locations = getActiveCampusLocations();
    render(<CampusMap locations={locations} selectedId={null} onSelect={() => {}} />);

    expect(screen.getByRole("button", { name: /zoom in/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /zoom out/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /reset view/i })).toBeDefined();
  });

  it("calls onSelect when place marker is clicked", () => {
    const locations = getActiveCampusLocations();
    let selectedLoc = null;
    const onSelect = (loc: any) => {
      selectedLoc = loc;
    };

    render(<CampusMap locations={locations} selectedId={null} onSelect={onSelect} />);

    const marker = screen.getByRole("button", { name: "AI&DS" });
    fireEvent.click(marker);

    expect(selectedLoc).not.toBeNull();
    expect((selectedLoc as any).name).toBe("AI&DS");
  });
});

describe("Campus Map Geometry & Validation Tests", () => {
  it("pointer-to-image conversion with a transformed rect", () => {
    // Mock SVG element with getScreenCTM returning a transformed matrix (scale 0.5, translate 100, 50)
    // Screen X = svgX * 0.5 + 100 => svgX = (Screen X - 100) / 0.5
    // Screen Y = svgY * 0.5 + 50  => svgY = (Screen Y - 50) / 0.5
    const mockSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    const a = 0.5, b = 0, c = 0, d = 0.5, e = 100, f = 50;
    const det = a * d - b * c; // 0.25

    const mockMatrix = {
      a, b, c, d, e, f,
      inverse: () => ({
        a: d / det, // 2
        b: -b / det, // 0
        c: -c / det, // 0
        d: a / det, // 2
        e: (c * f - d * e) / det, // -200
        f: (b * e - a * f) / det, // -100
      }),
    };

    mockSvg.getScreenCTM = () => mockMatrix as any;

    if (!mockSvg.createSVGPoint) {
      mockSvg.createSVGPoint = () => ({
        x: 0,
        y: 0,
        matrixTransform(m: any) {
          return {
            x: this.x * m.a + this.y * m.c + m.e,
            y: this.x * m.b + this.y * m.d + m.f,
          };
        },
      } as any);
    }

    // Pointer at (250, 150)
    // Inverse: x = (250 - 100) * 2 = 300, y = (150 - 50) * 2 = 200
    const coords = pointerToMapCoordinates({ clientX: 250, clientY: 150 }, mockSvg);
    expect(coords.x).toBe(300);
    expect(coords.y).toBe(200);

    // Pointer with fractional result rounds to at most 1 decimal
    // Pointer at (250.35, 150.15) => x = (250.35 - 100) * 2 = 300.7, y = (150.15 - 50) * 2 = 200.3
    const fracCoords = pointerToMapCoordinates({ clientX: 250.35, clientY: 150.15 }, mockSvg);
    expect(fracCoords.x).toBe(300.7);
    expect(fracCoords.y).toBe(200.3);
  });

  it("image to percent round trip within 0.1px", () => {
    const W = 900;
    const H = 810;
    const testPoints = [
      { x: 100, y: 150 },
      { x: 450.5, y: 405.2 },
      { x: 789.3, y: 654.7 },
      { x: 0, y: 0 },
      { x: W, y: H },
    ];

    for (const pt of testPoints) {
      const { xPercent, yPercent } = imageToPercent(pt.x, pt.y, W, H);
      const roundTrip = percentToImage(xPercent, yPercent, W, H);

      const diffX = Math.abs(roundTrip.x - pt.x);
      const diffY = Math.abs(roundTrip.y - pt.y);

      expect(diffX).toBeLessThanOrEqual(0.1);
      expect(diffY).toBeLessThanOrEqual(0.1);
    }
  });

  it("wrapper aspect equals W/H", () => {
    const testData = {
      ...defaultCampusMap,
      width: 1200,
      height: 750,
    };

    const { container } = render(
      <CampusMapStage
        mapData={testData}
        versionedImageSrc="/assets/campus-map.jpg?v=1"
        version={1}
      />,
    );

    const wrapper = container.querySelector(".campus-map-stage-wrapper") as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.style.aspectRatio).toBe("1200 / 750");

    // Also check image fills wrapper exactly
    const img = wrapper.querySelector("img") as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.style.objectFit).toBe("fill");
    expect(img.style.width).toBe("100%");
    expect(img.style.height).toBe("100%");
  });

  it("validateCampusMap still passes", () => {
    expect(validateCampusMap(defaultCampusMap)).toBe(true);

    // Valid custom map
    const customValid = {
      width: 1000,
      height: 800,
      image: "data:image/png;base64,abc",
      locations: [
        { id: "p1", name: "Place 1", x: 100, y: 200, category: "academic" },
      ],
      junctions: {
        j1: [100, 200],
      },
      edges: [["j1", "j1"]],
    };
    expect(validateCampusMap(customValid)).toBe(true);

    // Invalid: missing width/height
    expect(validateCampusMap({ ...customValid, width: -1 })).toBe(false);
    expect(validateCampusMap({ ...customValid, height: 0 })).toBe(false);
    // Invalid: missing image
    expect(validateCampusMap({ ...customValid, image: "" })).toBe(false);
    // Invalid: non-array locations
    expect(validateCampusMap({ ...customValid, locations: "not-an-array" })).toBe(false);
    // Invalid: null / primitives
    expect(validateCampusMap(null)).toBe(false);
    expect(validateCampusMap(undefined)).toBe(false);
    expect(validateCampusMap("string")).toBe(false);
  });
});

