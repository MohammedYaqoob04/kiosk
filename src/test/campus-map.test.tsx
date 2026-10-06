import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CampusMap } from "@/components/campus/CampusMap";
import { getActiveCampusLocations } from "@/config/campusLocations";

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
