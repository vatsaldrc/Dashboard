"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal, sankeyLeft } from "d3-sankey";
import styles from "./SankeyChart.module.scss";

interface Node {
  id: string;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface SankeyChartProps {
  data?: { nodes: Node[]; links: Link[] };
}

const NODE_WIDTH = 20;
const NODE_PADDING = 22;

const NODE_COLORS: Record<string, string> = {
  booking_started: "#3b82f6",
  contact_method_phone: "#8b5cf6",
  contact_method_email: "#a78bfa",
  contact_method_both: "#c4b5fd",
  details_collected: "#06b6d4",
  customer_type_b2b: "#f59e0b",
  customer_type_b2c: "#fb923c",
  lead_created: "#10b981",
  dropped: "#ef4444",
};

const NODE_LABELS: Record<string, string> = {
  booking_started: "Persönliche Beratung gedrückt",
  contact_method_phone: "Telefon",
  contact_method_email: "E-Mail",
  contact_method_both: "Beides",
  details_collected: "Weitere Datenaufnahme",
  customer_type_b2b: "Geschäftskunde",
  customer_type_b2c: "Privatkunde",
  lead_created: "Lead erstellt",
  dropped: "Vorzeitig ausgestiegen",
};

const COLUMN_ORDER = [
  "booking_started",
  "contact_method_phone",
  "contact_method_email",
  "contact_method_both",
  "details_collected",
  "customer_type_b2b",
  "customer_type_b2c",
  "lead_created",
  "dropped",
];

export default function SankeyChart({ data }: SankeyChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    html: "",
  });

  const WIDTH = 1100;
  const HEIGHT = 500;
  const MARGIN = { top: 40, right: 200, bottom: 20, left: 200 };

  useEffect(() => {
    if (!svgRef.current || !data?.nodes?.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const innerW = WIDTH - MARGIN.left - MARGIN.right;
    const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

    // Prepare nodes/links
    // Pass string IDs — d3-sankey resolves them via nodeId()
    const nodes = data.nodes.map((n) => ({ ...n }));
    const links = data.links.map((l) => ({
      source: l.source,
      target: l.target,
      value: Number(l.value),
    }));

    // d3-sankey layout
    const sankeyLayout = sankey<{ id: string }, { value: number }>()
      .nodeId((d) => d.id)
      .nodeWidth(NODE_WIDTH)
      .nodePadding(NODE_PADDING)
      .nodeAlign(sankeyLeft)
      .extent([
        [0, 0],
        [innerW, innerH],
      ]);

    const graph = sankeyLayout({ nodes, links });

    // Per-column: sort so "dropped" is last, then restack from top
    d3.group(graph.nodes, (d) => d.x0).forEach((colNodes) => {
      colNodes.sort((a, b) => {
        if (a.id === "dropped") return 1;
        if (b.id === "dropped") return -1;
        return COLUMN_ORDER.indexOf(a.id) - COLUMN_ORDER.indexOf(b.id);
      });

      let y = 0;
      colNodes.forEach((node) => {
        if (node.y0 == null || node.y1 == null) return; // guard
        const h = node.y1 - node.y0;
        node.y0 = y;
        node.y1 = y + h;
        y += h + NODE_PADDING;
      });
    });

    // Recompute link y-positions after manual restack
    sankeyLayout.update(graph);

    // SVG group
    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // Gradient defs for links
    const defs = svg.append("defs");
    graph.links.forEach((link, i) => {
      const srcNode = link.source as any;
      const tgtNode = link.target as any;
      const grad = defs
        .append("linearGradient")
        .attr("id", `sg-${i}`)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", srcNode.x1)
        .attr("x2", tgtNode.x0);
      grad
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", NODE_COLORS[srcNode.id] || "#6366f1")
        .attr("stop-opacity", 0.9);
      grad
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", NODE_COLORS[tgtNode.id] || "#94a3b8")
        .attr("stop-opacity", 0.7);
    });

    // ── Links ────────────────────────────────────────────────────────────────
    const linkPaths = g
      .append("g")
      .selectAll("path")
      .data(graph.links)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", (_, i) => `url(#sg-${i})`)
      .attr("stroke-width", (d) => Math.max(1, (d as any).width))
      .attr("fill", "none")
      .attr("opacity", 0.15)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .attr("opacity", 0.75)
          .attr("stroke-width", Math.max(1, (d as any).width) + 3);
        const src = (d as any).source;
        const tgt = (d as any).target;
        setTooltip({
          visible: true,
          x: event.offsetX,
          y: event.offsetY,
          html: `<b>${NODE_LABELS[src.id] ?? src.id}</b> → <b>${NODE_LABELS[tgt.id] ?? tgt.id}</b><br/>${Number((d as any).value).toLocaleString()} Users`,
        });
      })
      .on("mousemove", function (event) {
        setTooltip((t) => ({ ...t, x: event.offsetX, y: event.offsetY }));
      })
      .on("mouseleave", function (event, d) {
        d3.select(this)
          .attr("opacity", 0.3)
          .attr("stroke-width", Math.max(1, (d as any).width));
        setTooltip((t) => ({ ...t, visible: false }));
      });

    // Nodes
    const nodeGroups = g.append("g").selectAll("g").data(graph.nodes).join("g");

    nodeGroups
      .append("rect")
      .attr("x", (d) => (d as any).x0)
      .attr("y", (d) => (d as any).y0)
      .attr("width", (d) => (d as any).x1 - (d as any).x0)
      .attr("height", (d) => Math.max(1, (d as any).y1 - (d as any).y0))
      .attr("rx", 0)
      .attr("fill", (d) => NODE_COLORS[(d as any).id] || "#94a3b8")
      .attr("opacity", 0.9)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("opacity", 1);
        const nd = d as any;
        const totalIn = d3.sum(nd.targetLinks, (l: any) => l.value);
        const totalOut = d3.sum(nd.sourceLinks, (l: any) => l.value);
        setTooltip({
          visible: true,
          x: event.offsetX,
          y: event.offsetY,
            html: `<b>${NODE_LABELS[nd.id] ?? nd.id}</b><br/>
            ${totalOut ? `Users: ${totalOut.toLocaleString()}` : `Users: ${totalIn.toLocaleString()}`}`,
        });
      })
      .on("mousemove", function (event) {
        setTooltip((t) => ({ ...t, x: event.offsetX, y: event.offsetY }));
      })
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", 0.9);
        setTooltip((t) => ({ ...t, visible: false }));
      });

    // Node labels (outside the node bar)
    nodeGroups
      .append("text")
      .attr("x", (d) => (d as any).x1 + 10)
      .attr("y", (d) => {
        const nd = d as any;
        return (nd.y0 + nd.y1) / 2;
      })
      .attr("dy", "0.35em")
      .attr("text-anchor", "start")
      .attr("fill", (d) => {
        const id = (d as any).id;
        // if (id === "dropped") return "var(--color-error, #f87171)";
        // if (id === "lead_created") return "var(--color-success, #34d399)";
        return "var(--color-text-primary, #cbd5e1)";
      })
      .attr("font-size", 12)
      .attr("font-family", "var(--font-family, system-ui, sans-serif)")
      .attr("font-weight", 500)
      .style("pointer-events", "none")
      .text((d) => NODE_LABELS[(d as any).id] || (d as any).id);
  }, [data]);

  if (!data?.nodes?.length) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Flow der Beratungsgesuche</h3>
        <p className={styles.subtitle}>
          Keine Daten für den gewählten Zeitraum
        </p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Flow der Beratungsgesuche</h3>
      <p className={styles.subtitle}>Vom Trigger bis zum Lead</p>

      {/* Chart area */}
      <div className={styles.chartWrapper}>
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ display: "block", overflow: "visible" }}
        />

        {/* Tooltip */}
        {tooltip.visible && (
          <div
            className={styles.tooltip}
            style={{ left: tooltip.x + 14, top: tooltip.y - 12 }}
            dangerouslySetInnerHTML={{ __html: tooltip.html }}
          />
        )}
      </div>
    </div>
  );
}
