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
      booking_started: "Persönliche Beratung gedrückt",
      contact_method_phone: "Telefon",
      contact_method_email: "E-Mail",
      contact_method_both: "Beides",
      details_collected: "Weitere Datenaufnahme",
      customer_type_b2b: "Geschäftskunde",
      customer_type_b2c: "Privatkunde",
      lead_created: "Lead erstellt",
      booking_cancelled: "Abgebrochen",
      dropped: "Vorzeitig ausgestiegen",
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

     const sortedNodes = [...data.nodes].sort((a, b) => {
       if (a.id === "lead_created") return -1;
       if (b.id === "lead_created") return 1;
       if (a.id === "dropped") return 1;
       if (b.id === "dropped") return -1;
       return 0;
     });

     const sortedNodeIndexMap = new Map(
       sortedNodes.map((node, idx) => [node.id, idx]),
     );

     // Prepare node data
     const nodeLabels = sortedNodes.map((node) => formatNodeLabel(node.id));
     const nodeColors = sortedNodes.map((node) => getNodeColor(node.id));

     // Prepare link data
     const linkSources = data.links.map(
       (link) => sortedNodeIndexMap.get(link.source)!,
     );
     const linkTargets = data.links.map(
       (link) => sortedNodeIndexMap.get(link.target)!,
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
           x: sortedNodes.map((node) => {
             if (node.id === "booking_started") return 0.05;

             if (node.id.startsWith("contact_method_")) return 0.25;

             if (node.id === "details_collected") return 0.45;

             if (node.id.startsWith("customer_type_")) return 0.65;

             if (node.id === "lead_created" || node.id === "dropped")
               return 1.0;

             return 0.5;
           }),
           y: sortedNodes.map((node) => {
             if (node.id === "lead_created") return 0.2; // higher (top)
             if (node.id === "dropped") return 0.8; // lower (bottom)
             return undefined; // let Plotly auto-place others
           }),
           label: nodeLabels,
           color: nodeColors,
           customdata: data.nodes.map((node, idx) => {
             // Calculate total value for each node
             const incoming = data.links
               .filter((link) => sortedNodeIndexMap.get(link.target) === idx)
               .reduce((sum, link) => sum + Number(link.value), 0);
             const outgoing = data.links
               .filter((link) => sortedNodeIndexMap.get(link.source) === idx)
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
      <h3 className={styles.title}>Flow der Beratungsgesuche</h3>
      <p className={styles.subtitle}>Vom Trigger bis zum Lead</p>
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
