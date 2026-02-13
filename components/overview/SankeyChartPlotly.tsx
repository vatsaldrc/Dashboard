"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import styles from "./SankeyChart.module.scss";
import Plot from "react-plotly.js";
// Dynamic import to avoid SSR issues with Plotly
// const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Node {
  id: string;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

export function BookingSankeyChartPlotly({
  data,
}: {
  data?: {
    nodes: Node[];
    links: Link[];
  };
}) {
  // Function to format node labels for display
  const formatNodeLabel = (id: string): string => {
    const labelMap: Record<string, string> = {
      start: "↓",
      booking_started: "Booking Started",
      contact_method_phone: "Phone",
      contact_method_email: "Email",
      contact_method_both: "Both",
      details_collected: "Details Collected",
      customer_type_b2b: "Business (B2B)",
      customer_type_b2c: "Private (B2C)",
      lead_created: "Lead Created",
      booking_cancelled: "Cancelled",
      dropped: "Dropped Off",
    };
    return labelMap[id] || id;
  };

  const getNodeColor = (id: string): string => {
    if (id === "booking_started") return "#3b82f6"; // Blue - starting point
    if (id.startsWith("contact_method_")) return "#8b5cf6"; // Purple
    if (id === "details_collected") return "#06b6d4"; // Cyan
    if (id.startsWith("customer_type_")) return "#f59e0b"; // Amber
    if (id === "lead_created") return "#10b981"; // Green
    if (id === "booking_cancelled") return "#ef4444"; // Red
    if (id === "dropped") return "#6b7280"; // Gray
    return "#64748b";
  };

   const plotlyData = useMemo(() => {
     if (!data || data.nodes.length === 0) return null;

     // Create node index mapping
     const nodeIndexMap = new Map(
       data.nodes.map((node, idx) => [node.id, idx]),
     );

     // Prepare node data
     const nodeLabels = data.nodes.map((node) => formatNodeLabel(node.id));
     const nodeColors = data.nodes.map((node) => getNodeColor(node.id));

     // Prepare link data
     const linkSources = data.links.map(
       (link) => nodeIndexMap.get(link.source)!,
     );
     const linkTargets = data.links.map(
       (link) => nodeIndexMap.get(link.target)!,
     );
     const linkValues = data.links.map((link) => Number(link.value));

     // Link colors - lighter version of source node color with transparency
     const linkColors = data.links.map((link) => {
       const sourceColor = getNodeColor(link.source);
       // Add 40% transparency
       return sourceColor + "66";
     });

     return [
       {
         type: "sankey",
         orientation: "h",
         node: {
           pad: 20, // Reduced padding for better spacing
           thickness: 25, // Slightly thinner nodes
           line: {
             color: "#1e293b",
             width: 1,
           },
           label: nodeLabels,
           color: nodeColors,
           customdata: data.nodes.map((node, idx) => {
             // Calculate total value for each node
             const incoming = data.links
               .filter((link) => nodeIndexMap.get(link.target) === idx)
               .reduce((sum, link) => sum + Number(link.value), 0);
             const outgoing = data.links
               .filter((link) => nodeIndexMap.get(link.source) === idx)
               .reduce((sum, link) => sum + Number(link.value), 0);
             return Math.max(incoming, outgoing) || 0;
           }),
           hovertemplate:
             "<b>%{label}</b><br>Total: %{customdata} users<extra></extra>",
         },
         link: {
           source: linkSources,
           target: linkTargets,
           value: linkValues,
           color: linkColors,
           hovertemplate:
             "<b>%{source.label}</b> → <b>%{target.label}</b><br>Users: %{value}<extra></extra>",
         },
       },
     ];
   }, [data]);

  if (!data || data.nodes.length === 0 || !plotlyData) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Booking Flow Journey</h3>
        <p className={styles.subtitle}>
          No data available for the selected date range
        </p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Buchungsfluss-Reise</h3>
      <p className={styles.subtitle}>Vom Erstkontakt bis zum Endergebnis</p>
      <div
        style={{
          height: 600,
          width: "100%",
          overflowX: "auto",
        }}
      >
        <Plot
          data={plotlyData as any}
          layout={{
            width: 1200,
            height: 600,
            font: {
              size: 12,
              color: "#f1f5f9",
              family: "system-ui, -apple-system, sans-serif",
            },
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            margin: { t: 40, b: 40, l: 100, r: 200 },
          }}
          config={{
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ["lasso2d", "select2d"],
            responsive: true,
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
