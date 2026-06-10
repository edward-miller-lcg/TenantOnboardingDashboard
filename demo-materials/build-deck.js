const pptxgen = require("pptxgenjs");
const path = require("path");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaUserShield, FaRoute, FaServer, FaKey, FaProjectDiagram,
  FaShieldAlt, FaSlidersH, FaClipboardCheck, FaRocket,
  FaTimesCircle, FaCheckCircle, FaQuestionCircle, FaCommentDots
} = require("react-icons/fa");

function renderIconSvg(IconComponent, color, size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// Ocean Gradient palette
const NAVY = "21295C";
const DEEP = "065A82";
const TEAL = "1C7293";
const ICE = "EAF2F6";
const WHITE = "FFFFFF";
const SLATE = "5B6B7A";

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
  pres.author = "Tenant Onboarding Dashboard";
  pres.title = "Tenant Onboarding Dashboard - Pilot Demo";

  // Pre-render icons
  const icAdmin = await iconToBase64Png(FaUserShield, "#FFFFFF", 256);
  const icWizard = await iconToBase64Png(FaRoute, "#FFFFFF", 256);
  const icApi = await iconToBase64Png(FaServer, "#FFFFFF", 256);
  const icKey = await iconToBase64Png(FaKey, "#FFFFFF", 256);
  const icPipeline = await iconToBase64Png(FaProjectDiagram, "#FFFFFF", 256);

  const icShield = await iconToBase64Png(FaShieldAlt, "#FFFFFF", 256);
  const icSliders = await iconToBase64Png(FaSlidersH, "#FFFFFF", 256);
  const icCheck = await iconToBase64Png(FaClipboardCheck, "#FFFFFF", 256);
  const icRocket = await iconToBase64Png(FaRocket, "#FFFFFF", 256);

  const icCross = await iconToBase64Png(FaTimesCircle, "#" + DEEP, 256);
  const icCheckTeal = await iconToBase64Png(FaCheckCircle, "#" + TEAL, 256);
  const icCheckNavy = await iconToBase64Png(FaCheckCircle, "#" + NAVY, 256);
  const icQuestion = await iconToBase64Png(FaQuestionCircle, "#" + DEEP, 256);
  const icRocketNavy = await iconToBase64Png(FaRocket, "#" + NAVY, 256);
  const icCommentWhite = await iconToBase64Png(FaCommentDots, "#FFFFFF", 256);

  // ===================== SLIDE 0: Title =====================
  let s0 = pres.addSlide();
  s0.background = { color: NAVY };

  s0.addText("Tenant Onboarding Dashboard", {
    x: 0.8, y: 2.4, w: 11.73, h: 1.2,
    fontFace: "Cambria", fontSize: 44, bold: true, color: WHITE, margin: 0
  });
  s0.addText("Pilot Demo Walkthrough", {
    x: 0.8, y: 3.5, w: 11.73, h: 0.7,
    fontFace: "Calibri", fontSize: 22, color: ICE, margin: 0
  });
  s0.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 4.35, w: 1.6, h: 0.04, fill: { color: TEAL }
  });
  s0.addText("Self-service onboarding from link generation to go-live", {
    x: 0.8, y: 4.6, w: 11.73, h: 0.5,
    fontFace: "Calibri", fontSize: 14, italic: true, color: "9FB3C8", margin: 0
  });

  // ===================== SLIDE 0.5: Problem / Goal =====================
  let sP = pres.addSlide();
  sP.background = { color: WHITE };

  sP.addText("Why This Matters", {
    x: 0.6, y: 0.35, w: 12.13, h: 0.8,
    fontFace: "Cambria", fontSize: 32, bold: true, color: NAVY, margin: 0
  });
  sP.addText("Moving from manual, ad-hoc onboarding to a guided self-service flow", {
    x: 0.6, y: 1.05, w: 12.13, h: 0.4,
    fontFace: "Calibri", fontSize: 14, color: SLATE, margin: 0
  });

  const colY = 2.1;
  const colW = 5.9;
  const colH = 4.6;
  const colGap = 0.5;
  const colX1 = 0.6;
  const colX2 = colX1 + colW + colGap;

  // Today (problem) column
  sP.addShape(pres.shapes.RECTANGLE, {
    x: colX1, y: colY, w: colW, h: 0.7, fill: { color: DEEP }
  });
  sP.addText("Onboarding Today", {
    x: colX1, y: colY, w: colW, h: 0.7,
    fontFace: "Calibri", fontSize: 18, bold: true, color: WHITE,
    align: "center", valign: "middle", margin: 0
  });
  sP.addShape(pres.shapes.RECTANGLE, {
    x: colX1, y: colY + 0.7, w: colW, h: colH - 0.7, fill: { color: ICE }
  });
  const todayItems = [
    "Manual emails and spreadsheets to collect facility, server, and credential details",
    "No standard validation of FHIR connectivity before go-live",
    "Code mappings (location/encounter types) negotiated ad hoc per tenant",
    "Limited visibility into where a tenant is in the process"
  ];
  todayItems.forEach((item, i) => {
    const iy = colY + 0.95 + i * 0.92;
    sP.addImage({ data: icCross, x: colX1 + 0.25, y: iy, w: 0.32, h: 0.32 });
    sP.addText(item, {
      x: colX1 + 0.7, y: iy - 0.05, w: colW - 0.95, h: 0.85,
      fontFace: "Calibri", fontSize: 12, color: NAVY, valign: "top", margin: 0
    });
  });

  // With dashboard (goal) column
  sP.addShape(pres.shapes.RECTANGLE, {
    x: colX2, y: colY, w: colW, h: 0.7, fill: { color: TEAL }
  });
  sP.addText("With the Onboarding Dashboard", {
    x: colX2, y: colY, w: colW, h: 0.7,
    fontFace: "Calibri", fontSize: 18, bold: true, color: WHITE,
    align: "center", valign: "middle", margin: 0
  });
  sP.addShape(pres.shapes.RECTANGLE, {
    x: colX2, y: colY + 0.7, w: colW, h: colH - 0.7, fill: { color: ICE }
  });
  const goalItems = [
    "Single guided link walks the tenant through every required step",
    "Built-in connection test validates FHIR connectivity before proceeding",
    "Structured location/encounter type mapping with reusable normalizations",
    "Progress dashboard shows exactly where each tenant stands"
  ];
  goalItems.forEach((item, i) => {
    const iy = colY + 0.95 + i * 0.92;
    sP.addImage({ data: icCheckTeal, x: colX2 + 0.25, y: iy, w: 0.32, h: 0.32 });
    sP.addText(item, {
      x: colX2 + 0.7, y: iy - 0.05, w: colW - 0.95, h: 0.85,
      fontFace: "Calibri", fontSize: 12, color: NAVY, valign: "top", margin: 0
    });
  });

  // ===================== SLIDE 1: Architecture =====================
  let s1 = pres.addSlide();
  s1.background = { color: WHITE };

  s1.addText("Architecture at a Glance", {
    x: 0.6, y: 0.35, w: 12.13, h: 0.8,
    fontFace: "Cambria", fontSize: 32, bold: true, color: NAVY, margin: 0
  });
  s1.addText("Tenant Onboarding Dashboard – component flow", {
    x: 0.6, y: 1.05, w: 12.13, h: 0.4,
    fontFace: "Calibri", fontSize: 14, color: SLATE, margin: 0
  });

  const boxY = 2.4;
  const boxH = 1.5;
  const boxW = 2.55;
  const gap = 0.55;
  const startX = 0.65;

  const mainBoxes = [
    { title: "Admin Portal", sub: "Generates tokenized\nonboarding link", icon: icAdmin, color: NAVY },
    { title: "Tenant Onboarding\nWizard", sub: "Guided multi-step\nAngular UI", icon: icWizard, color: DEEP },
    { title: "OnboardingService", sub: ".NET API – session,\nvalidation, mapping", icon: icApi, color: DEEP },
    { title: "LINK Normalization\nPipeline", sub: "Downstream data\nnormalization", icon: icPipeline, color: TEAL },
  ];

  mainBoxes.forEach((b, i) => {
    const x = startX + i * (boxW + gap);
    s1.addShape(pres.shapes.RECTANGLE, {
      x, y: boxY, w: boxW, h: boxH,
      fill: { color: b.color },
      shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 135, opacity: 0.18 }
    });
    s1.addImage({ data: b.icon, x: x + boxW / 2 - 0.22, y: boxY + 0.18, w: 0.44, h: 0.44 });
    s1.addText(b.title, {
      x: x + 0.08, y: boxY + 0.62, w: boxW - 0.16, h: 0.5,
      fontFace: "Calibri", fontSize: 13, bold: true, color: WHITE,
      align: "center", valign: "top", margin: 0
    });
    s1.addText(b.sub, {
      x: x + 0.08, y: boxY + boxH + 0.08, w: boxW - 0.16, h: 0.85,
      fontFace: "Calibri", fontSize: 10.5, color: SLATE,
      align: "center", valign: "top", margin: 0
    });

    // Arrow to next box
    if (i < mainBoxes.length - 1) {
      s1.addText("→", {
        x: x + boxW, y: boxY, w: gap, h: boxH,
        fontFace: "Calibri", fontSize: 24, bold: true, color: SLATE,
        align: "center", valign: "middle", margin: 0
      });
    }
  });

  // Keycloak box below OnboardingService (box index 2)
  const apiX = startX + 2 * (boxW + gap);
  const kcY = 5.55;
  const lineStartY = boxY + boxH + 0.85 + 0.08; // below the caption text
  s1.addShape(pres.shapes.LINE, {
    x: apiX + boxW / 2, y: lineStartY, w: 0, h: kcY - lineStartY,
    line: { color: SLATE, width: 1.5, endArrowType: "triangle", dashType: "dash" }
  });
  const kcW = 3.6;
  const kcX = apiX + boxW / 2 - kcW / 2;
  s1.addShape(pres.shapes.RECTANGLE, {
    x: kcX, y: kcY, w: kcW, h: 1.05,
    fill: { color: NAVY },
    shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 135, opacity: 0.18 }
  });
  s1.addImage({ data: icKey, x: kcX + 0.18, y: kcY + 0.27, w: 0.5, h: 0.5 });
  s1.addText([
    { text: "Keycloak – oauth.nhsnlink.org", options: { breakLine: true, bold: true } },
    { text: "Bearer token forwarding (today); client-credentials planned", options: {} }
  ], {
    x: kcX + 0.8, y: kcY + 0.08, w: kcW - 0.95, h: 0.9,
    fontFace: "Calibri", fontSize: 10.5, color: WHITE, valign: "middle", margin: 0
  });

  // ===================== SLIDE 2: Onboarding Journey =====================
  let s2 = pres.addSlide();
  s2.background = { color: WHITE };

  s2.addText("Tenant Onboarding Journey", {
    x: 0.6, y: 0.3, w: 12.13, h: 0.8,
    fontFace: "Cambria", fontSize: 32, bold: true, color: NAVY, margin: 0
  });
  s2.addText("Four phases from link generation to go-live", {
    x: 0.6, y: 1.0, w: 12.13, h: 0.4,
    fontFace: "Calibri", fontSize: 14, color: SLATE, margin: 0
  });

  const laneX = 0.6;
  const laneW = 12.13;
  const labelW = 2.3;
  const chipAreaX = laneX + labelW + 0.2;
  const chipAreaW = laneW - labelW - 0.2;

  const lanes = [
    {
      title: "Compliance Gate",
      icon: icShield, color: NAVY,
      chips: ["Compliance Attestation"]
    },
    {
      title: "Configuration",
      icon: icSliders, color: DEEP,
      chips: ["Facility Info", "Server Info", "Authorization", "Connection Test", "Patients of Interest", "Location / Encounter\nType Mapping"]
    },
    {
      title: "Validation",
      icon: icCheck, color: TEAL,
      chips: ["Test Reports", "Verify POI", "Normalizations\n(Code Map, Copy Property,\nConditional Transform)"]
    },
    {
      title: "Go-Live",
      icon: icRocket, color: NAVY,
      chips: ["Operations Dashboard"]
    },
  ];

  let y = 1.5;
  const laneH = 1.2;
  const laneGap = 0.15;

  lanes.forEach((lane) => {
    // Label block
    s2.addShape(pres.shapes.RECTANGLE, {
      x: laneX, y, w: labelW, h: laneH,
      fill: { color: lane.color }
    });
    s2.addImage({ data: lane.icon, x: laneX + 0.18, y: y + laneH / 2 - 0.22, w: 0.44, h: 0.44 });
    s2.addText(lane.title, {
      x: laneX + 0.7, y, w: labelW - 0.8, h: laneH,
      fontFace: "Calibri", fontSize: 14, bold: true, color: WHITE,
      align: "left", valign: "middle", margin: 0
    });

    // Lane background
    s2.addShape(pres.shapes.RECTANGLE, {
      x: chipAreaX, y, w: chipAreaW, h: laneH,
      fill: { color: ICE }
    });

    // Chips
    const n = lane.chips.length;
    const chipGap = 0.12;
    const chipW = (chipAreaW - 0.24 - chipGap * (n - 1)) / n;
    const chipH = laneH - 0.28;
    lane.chips.forEach((chip, i) => {
      const cx = chipAreaX + 0.12 + i * (chipW + chipGap);
      const cy = y + 0.14;
      s2.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx, y: cy, w: chipW, h: chipH,
        fill: { color: WHITE },
        line: { color: lane.color, width: 1.25 },
        rectRadius: 0.08,
        shadow: { type: "outer", color: "000000", blur: 3, offset: 1, angle: 135, opacity: 0.10 }
      });
      s2.addText(chip, {
        x: cx + 0.06, y: cy, w: chipW - 0.12, h: chipH,
        fontFace: "Calibri", fontSize: 10, bold: true, color: NAVY,
        align: "center", valign: "middle", margin: 0
      });
      if (i < n - 1) {
        s2.addText("→", {
          x: cx + chipW, y: cy, w: chipGap, h: chipH,
          fontFace: "Calibri", fontSize: 12, bold: true, color: SLATE,
          align: "center", valign: "middle", margin: 0
        });
      }
    });

    y += laneH + laneGap;
  });

  s2.addText("Note: Compliance Attestation must be completed before any configuration step is accessible.", {
    x: 0.6, y: y + 0.1, w: 12.13, h: 0.35,
    fontFace: "Calibri", fontSize: 10.5, italic: true, color: SLATE, margin: 0
  });

  // ===================== SLIDE 3: Status & Next Steps =====================
  let s3 = pres.addSlide();
  s3.background = { color: WHITE };

  s3.addText("Status & Next Steps", {
    x: 0.6, y: 0.35, w: 12.13, h: 0.8,
    fontFace: "Cambria", fontSize: 32, bold: true, color: NAVY, margin: 0
  });
  s3.addText("Where the dashboard stands today, and what's open for discussion", {
    x: 0.6, y: 1.05, w: 12.13, h: 0.4,
    fontFace: "Calibri", fontSize: 14, color: SLATE, margin: 0
  });

  const statColY = 2.1;
  const statColW = 5.9;
  const statColH = 4.6;
  const statColGap = 0.5;
  const statColX1 = 0.6;
  const statColX2 = statColX1 + statColW + statColGap;

  // Working today
  s3.addShape(pres.shapes.RECTANGLE, {
    x: statColX1, y: statColY, w: statColW, h: 0.7, fill: { color: TEAL }
  });
  s3.addText("Working End-to-End Today", {
    x: statColX1, y: statColY, w: statColW, h: 0.7,
    fontFace: "Calibri", fontSize: 18, bold: true, color: WHITE,
    align: "center", valign: "middle", margin: 0
  });
  s3.addShape(pres.shapes.RECTANGLE, {
    x: statColX1, y: statColY + 0.7, w: statColW, h: statColH - 0.7, fill: { color: ICE }
  });
  const workingItems = [
    "Full 12-step guided wizard, gated by compliance attestation and progress tracking",
    "Admin portal generates tokenized per-tenant onboarding links",
    "Frontend wired to OnboardingService API across all onboarding steps",
    "Normalization tooling (code map, copy property, conditional transform)",
    "Playwright E2E smoke suite wired into the ADO pipeline"
  ];
  workingItems.forEach((item, i) => {
    const iy = statColY + 0.95 + i * 0.74;
    s3.addImage({ data: icCheckNavy, x: statColX1 + 0.25, y: iy, w: 0.3, h: 0.3 });
    s3.addText(item, {
      x: statColX1 + 0.68, y: iy - 0.05, w: statColW - 0.93, h: 0.7,
      fontFace: "Calibri", fontSize: 11.5, color: NAVY, valign: "top", margin: 0
    });
  });

  // Open for discussion
  s3.addShape(pres.shapes.RECTANGLE, {
    x: statColX2, y: statColY, w: statColW, h: 0.7, fill: { color: DEEP }
  });
  s3.addText("Open for Discussion", {
    x: statColX2, y: statColY, w: statColW, h: 0.7,
    fontFace: "Calibri", fontSize: 18, bold: true, color: WHITE,
    align: "center", valign: "middle", margin: 0
  });
  s3.addShape(pres.shapes.RECTANGLE, {
    x: statColX2, y: statColY + 0.7, w: statColW, h: statColH - 0.7, fill: { color: ICE }
  });
  const openItems = [
    "Validate connection test against a real pilot tenant FHIR endpoint",
    "Move from bearer token forwarding to Keycloak client-credentials flow",
    "Confirm code map / encounter / location mappings cover pilot tenant's data",
    "Identify which tenant(s) and timeline for the pilot",
    "Prioritize remaining gaps surfaced during user testing"
  ];
  openItems.forEach((item, i) => {
    const iy = statColY + 0.95 + i * 0.74;
    s3.addImage({ data: icQuestion, x: statColX2 + 0.25, y: iy, w: 0.3, h: 0.3 });
    s3.addText(item, {
      x: statColX2 + 0.68, y: iy - 0.05, w: statColW - 0.93, h: 0.7,
      fontFace: "Calibri", fontSize: 11.5, color: NAVY, valign: "top", margin: 0
    });
  });

  // ===================== SLIDE 4: Discussion / Ask =====================
  let s4 = pres.addSlide();
  s4.background = { color: NAVY };

  s4.addImage({ data: icCommentWhite, x: 0.8, y: 0.7, w: 0.6, h: 0.6 });
  s4.addText("Discussion & Next Steps", {
    x: 1.6, y: 0.6, w: 11.0, h: 0.9,
    fontFace: "Cambria", fontSize: 32, bold: true, color: WHITE, valign: "middle", margin: 0
  });

  const askItems = [
    { title: "Pilot tenant", body: "Which tenant(s) should we onboard first, and by what target date?" },
    { title: "Feedback on the flow", body: "Does the step order and information collected match how your team currently gathers it?" },
    { title: "Sign-off to proceed", body: "Approval to run a live pilot session with the nominated tenant's IT contact." },
    { title: "Prioritization", body: "Which open items from the previous slide should be resolved before vs. after the pilot?" },
  ];

  let askY = 2.1;
  askItems.forEach((item) => {
    s4.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: askY, w: 0.06, h: 1.05, fill: { color: TEAL }
    });
    s4.addText(item.title, {
      x: 1.05, y: askY, w: 11.4, h: 0.45,
      fontFace: "Calibri", fontSize: 16, bold: true, color: WHITE, margin: 0
    });
    s4.addText(item.body, {
      x: 1.05, y: askY + 0.45, w: 11.4, h: 0.55,
      fontFace: "Calibri", fontSize: 13, color: "C7D6E5", margin: 0
    });
    askY += 1.25;
  });

  const outPath = path.join(__dirname, "Tenant-Onboarding-Demo-Slides.pptx");
  await pres.writeFile({ fileName: outPath });
  console.log("Wrote " + outPath);
}

main().catch(e => { console.error(e); process.exit(1); });
