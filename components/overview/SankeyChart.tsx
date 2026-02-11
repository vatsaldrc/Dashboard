"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import styles from "./SankeyChart.module.scss";

interface Node {
  id: string;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

export function BookingSankeyChart({
  data,
}: {
  data?: {
    nodes: Node[];
    links: Link[];
  };
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Function to format node labels for display
  const formatNodeLabel = (id: string): string => {
    const labelMap: Record<string, string> = {
      booking_started: "Booking Started",
      contact_method_phone: "Phone",
      contact_method_email: "Email",
      contact_method_both: "Both",
      details_collected: "Details Collected",
      customer_type_b2b: "B2B",
      customer_type_b2c: "B2C",
      lead_created: "Lead Created",
      booking_cancelled: "Cancelled",
      dropped: "Dropped",
    };

    return labelMap[id] || id;
  };

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const height = 600;
    const width = Math.max(svgRef.current.clientWidth, 1200);
    const margin = { top: 60, right: 100, bottom: 100, left: 100 };

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create sankey generator
    const sankeyGenerator = sankey<Node, Link>()
      .nodeWidth(30)
      .nodePadding(60)
      .extent([
        [0, 0],
        [
          width - margin.left - margin.right,
          height - margin.top - margin.bottom,
        ],
      ]);

    // Create index map for nodes
    const nodeById = new Map(data.nodes.map((d, i) => [d.id, i]));

    // Convert links to use indices instead of IDs
    const linksWithIndices = data.links.map((link) => ({
      source: nodeById.get(link.source)!,
      target: nodeById.get(link.target)!,
      value: Number(link.value), // BigInt to number
    }));

    const graphData = sankeyGenerator({
      nodes: data.nodes.map((d) => ({ ...d })),
      links: linksWithIndices,
    });

    const { nodes, links } = graphData;

    // Enhanced color scale based on node type
    const getNodeColor = (id: string): string => {
      if (id === "booking_started") return "#3b82f6"; // Blue for start
      if (id.startsWith("contact_method_")) return "#8b5cf6"; // Purple for contact methods
      if (id === "details_collected") return "#06b6d4"; // Cyan for details
      if (id.startsWith("customer_type_")) return "#f59e0b"; // Orange for customer types
      if (id === "lead_created") return "#10b981"; // Green for success
      if (id === "booking_cancelled") return "#ef4444"; // Red for cancelled
      if (id === "dropped") return "#6b7280"; // Gray for dropped
      return "#64748b"; // Default slate
    };

    // Draw links with gradient colors
    const defs = svg.append("defs");

    links.forEach((link, i) => {
      const gradientId = `gradient-${i}`;
      const gradient = defs
        .append("linearGradient")
        .attr("id", gradientId)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", link.source.x1!)
        .attr("x2", link.target.x0!);

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", getNodeColor(link.source.id));

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", getNodeColor(link.target.id));
    });

    // Draw links with gradient and wave effect
    g.append("g")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", (d, i) => `url(#gradient-${i})`)
      .attr("stroke-width", (d) => Math.max(1, d.width!))
      .attr("fill", "none")
      .attr("opacity", 0.5)
      .on("mouseenter", function () {
        d3.select(this)
          .attr("opacity", 0.8)
          .attr("stroke-width", (d: any) => Math.max(2, d.width! + 2));
      })
      .on("mouseleave", function () {
        d3.select(this)
          .attr("opacity", 0.5)
          .attr("stroke-width", (d: any) => Math.max(1, d.width!));
      })
      .append("title")
      .text(
        (d) =>
          `${formatNodeLabel(d.source.id)} → ${formatNodeLabel(d.target.id)}\n${d.value} users`,
      );

    // Draw nodes with better styling
    g.append("g")
      .selectAll("rect")
      .data(nodes)
      .join("rect")
      .attr("x", (d) => d.x0!)
      .attr("y", (d) => d.y0!)
      .attr("height", (d) => d.y1! - d.y0!)
      .attr("width", (d) => d.x1! - d.x0!)
      .attr("fill", (d) => getNodeColor(d.id))
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2)
      .attr("rx", 4) // Rounded corners
      .on("mouseenter", function () {
        d3.select(this).attr("opacity", 0.8);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", 1);
      })
      .append("title")
      .text((d) => `${formatNodeLabel(d.id)}\nTotal: ${d.value} users`);

    // Draw labels
    g.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("x", (d) => (d.x0! + d.x1!) / 2) // Center of the node
      .attr("y", (d) => d.y1! + 20) // Below the node
      .attr("text-anchor", "middle")
      .attr("fill", "#f1f5f9")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .style("pointer-events", "none")
      .text((d) => formatNodeLabel(d.id));

    // Add value count below the label
    g.append("g")
      .selectAll("text.value")
      .data(nodes)
      .join("text")
      .attr("class", "value")
      .attr("x", (d) => (d.x0! + d.x1!) / 2)
      .attr("y", (d) => d.y1! + 36) // Below the label
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .style("pointer-events", "none")
      .text((d) => `(${d.value})`);
  }, [data]);

  if (!data || data.nodes.length === 0) {
    return <div>Keine Sankey-Daten verfügbar</div>;
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Booking Flow Journey</h3>
      <p className={styles.subtitle}>From initial contact to final outcome</p>
      <div
        style={{
          height: 600,
          width: "100%",
          overflowX: "auto",
          overflowY: "auto",
        }}
      >
        <svg ref={svgRef} style={{ minWidth: "1200px", height: "100%" }} />
      </div>
    </div>
  );
}
