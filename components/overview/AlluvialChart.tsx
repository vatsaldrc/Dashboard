"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { sankey, sankeyLeft } from "d3-sankey";
import styles from "./SankeyChart.module.scss"; // reuse same styles

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Node {
  id: string;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface AlluvialChartProps {
  data?: { nodes: Node[]; links: Link[] };
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const NODE_WIDTH = 20;
const NODE_PADDING = 22;
const BAND_OPACITY = 0.55; // default band fill opacity
const BAND_OPACITY_HOVER = 0.9; // hovered band
const BAND_OPACITY_DIMMED = 0.12; // all others while one is hovered

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

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_DATA = {
  nodes: COLUMN_ORDER.map((id) => ({ id })),
  links: [
    { source: "booking_started", target: "contact_method_phone", value: 320 },
    { source: "booking_started", target: "contact_method_email", value: 210 },
    { source: "booking_started", target: "contact_method_both", value: 95 },
    { source: "booking_started", target: "dropped", value: 75 },
    { source: "contact_method_phone", target: "details_collected", value: 260 },
    { source: "contact_method_phone", target: "dropped", value: 60 },
    { source: "contact_method_email", target: "details_collected", value: 180 },
    { source: "contact_method_email", target: "dropped", value: 30 },
    { source: "contact_method_both", target: "details_collected", value: 80 },
    { source: "contact_method_both", target: "dropped", value: 15 },
    { source: "details_collected", target: "customer_type_b2b", value: 290 },
    { source: "details_collected", target: "customer_type_b2c", value: 185 },
    { source: "details_collected", target: "dropped", value: 45 },
    { source: "customer_type_b2b", target: "lead_created", value: 240 },
    { source: "customer_type_b2b", target: "dropped", value: 50 },
    { source: "customer_type_b2c", target: "lead_created", value: 155 },
    { source: "customer_type_b2c", target: "dropped", value: 30 },
  ],
};

// ─── ALLUVIAL BAND PATH ───────────────────────────────────────────────────────
// Draws a straight-edged parallelogram band between two nodes.
// Unlike Sankey's bezier curve, this uses straight diagonal lines — the
// defining visual of an Alluvial diagram.
function alluvialBandPath(link: any): string {
  const x0 = link.source.x1;
  const x1 = link.target.x0;
  const half = link.width / 2;
  const cp = (x0 + x1) / 2; // cubic bezier control point x (midpoint)

  // Top edge: cubic bezier curve source-top -> target-top
  // Bottom edge: cubic bezier curve back target-bottom -> source-bottom
  return `
    M ${x0} ${link.y0 - half}
    C ${cp} ${link.y0 - half}, ${cp} ${link.y1 - half}, ${x1} ${link.y1 - half}
    L ${x1} ${link.y1 + half}
    C ${cp} ${link.y1 + half}, ${cp} ${link.y0 + half}, ${x0} ${link.y0 + half}
    Z
  `;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function AlluvialChart({ data = MOCK_DATA }: AlluvialChartProps) {
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

    // ── Prepare nodes/links ──────────────────────────────────────────────────
    const nodes = data.nodes.map((n) => ({ ...n }));
    const links = data.links.map((l) => ({
      source: l.source,
      target: l.target,
      value: Number(l.value),
    }));

    // ── d3-sankey layout (handles column placement & proportions) ────────────
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

    // ── Per-column: sort "dropped" last, restack from top ────────────────────
    d3.group(graph.nodes, (d) => d.x0).forEach((colNodes) => {
      colNodes.sort((a, b) => {
        if (a.id === "dropped") return 1;
        if (b.id === "dropped") return -1;
        return COLUMN_ORDER.indexOf(a.id) - COLUMN_ORDER.indexOf(b.id);
      });

      let y = 0;
      colNodes.forEach((node) => {
        const h = node.y1 - node.y0;
        node.y0 = y;
        node.y1 = y + h;
        y += h + NODE_PADDING;
      });
    });

    sankeyLayout.update(graph);

    // ── SVG group ────────────────────────────────────────────────────────────
    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // ── Gradient defs (source color → target color) ──────────────────────────
    const defs = svg.append("defs");
    graph.links.forEach((link, i) => {
      const src = link.source as any;
      const tgt = link.target as any;
      const grad = defs
        .append("linearGradient")
        .attr("id", `ag-${i}`)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", src.x1)
        .attr("x2", tgt.x0);
      grad
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", NODE_COLORS[src.id] || "#6366f1");
      grad
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", NODE_COLORS[tgt.id] || "#94a3b8");
    });

    // ── Bands (alluvial links) ───────────────────────────────────────────────
    // d3-sankey stores link offsets in y0 (source offset) and y1 (target offset)
    // relative to node.y0, and width = band thickness
    const bands = g
      .append("g")
      .attr("class", "bands")
      .selectAll("path")
      .data(graph.links)
      .join("path")
      .attr("d", (d) => alluvialBandPath(d))
      .attr("fill", (_, i) => `url(#ag-${i})`)
      .attr("opacity", BAND_OPACITY)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        // Dim all, highlight hovered
        bands.attr("opacity", BAND_OPACITY_DIMMED);
        d3.select(this).attr("opacity", BAND_OPACITY_HOVER);

        const src = (d as any).source;
        const tgt = (d as any).target;
        setTooltip({
          visible: true,
          x: event.offsetX,
          y: event.offsetY,
          html: `<b>${NODE_LABELS[src.id] ?? src.id}</b> → <b>${NODE_LABELS[tgt.id] ?? tgt.id}</b><br/>${Number((d as any).value).toLocaleString()} Nutzer`,
        });
      })
      .on("mousemove", function (event) {
        setTooltip((t) => ({ ...t, x: event.offsetX, y: event.offsetY }));
      })
      .on("mouseleave", function () {
        bands.attr("opacity", BAND_OPACITY);
        setTooltip((t) => ({ ...t, visible: false }));
      });

    // ── Nodes ────────────────────────────────────────────────────────────────
    const nodeGroups = g.append("g").selectAll("g").data(graph.nodes).join("g");

    nodeGroups
      .append("rect")
      .attr("x", (d) => (d as any).x0)
      .attr("y", (d) => (d as any).y0)
      .attr("width", (d) => (d as any).x1 - (d as any).x0)
      .attr("height", (d) => Math.max(1, (d as any).y1 - (d as any).y0))
      .attr("fill", (d) => NODE_COLORS[(d as any).id] || "#94a3b8")
      .attr("opacity", 1)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        const nd = d as any;
        const totalIn = d3.sum(nd.targetLinks, (l: any) => l.value);
        const totalOut = d3.sum(nd.sourceLinks, (l: any) => l.value);
        setTooltip({
          visible: true,
          x: event.offsetX,
          y: event.offsetY,
          html: `<b>${NODE_LABELS[nd.id] ?? nd.id}</b><br/>
            ${totalIn ? `Eingehend: ${totalIn.toLocaleString()}<br/>` : ""}
            ${totalOut ? `Ausgehend: ${totalOut.toLocaleString()}` : ""}`,
        });
      })
      .on("mousemove", function (event) {
        setTooltip((t) => ({ ...t, x: event.offsetX, y: event.offsetY }));
      })
      .on("mouseleave", function () {
        setTooltip((t) => ({ ...t, visible: false }));
      });

    // ── Node labels ──────────────────────────────────────────────────────────
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
        if (id === "dropped") return "var(--color-error, #f87171)";
        if (id === "lead_created") return "var(--color-success, #34d399)";
        return "var(--color-text-primary, #cbd5e1)";
      })
      .attr("font-size", 12)
      .attr("font-family", "var(--font-family, system-ui, sans-serif)")
      .attr("font-weight", 500)
      .style("pointer-events", "none")
      .text((d) => NODE_LABELS[(d as any).id] || (d as any).id);
  }, [data]);

  // ── Empty state ──────────────────────────────────────────────────────────────
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

      <div className={styles.chartWrapper}>
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ display: "block", overflow: "visible" }}
        />

        {tooltip.visible && (
          <div
            className={styles.tooltip}
            style={{ left: tooltip.x + 14, top: tooltip.y - 12 }}
            dangerouslySetInnerHTML={{ __html: tooltip.html }}
          />
        )}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {Object.entries(NODE_COLORS).map(([id, color]) => (
          <div key={id} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: color }} />
            <span className={styles.legendLabel}>{NODE_LABELS[id]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
