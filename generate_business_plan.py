#!/usr/bin/env python3
"""Generate ClearGround business plan PDF."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
import os
from datetime import datetime

# Colors
DARK = HexColor("#1a1a2e")
ACCENT = HexColor("#e94560")
ACCENT_LIGHT = HexColor("#fce4ec")
BLUE = HexColor("#0f3460")
BLUE_LIGHT = HexColor("#e8eaf6")
GRAY = HexColor("#6b7280")
GRAY_LIGHT = HexColor("#f3f4f6")
GREEN = HexColor("#059669")
GREEN_LIGHT = HexColor("#ecfdf5")
ORANGE = HexColor("#d97706")
ORANGE_LIGHT = HexColor("#fffbeb")
TEXT = HexColor("#1f2937")
TEXT_LIGHT = HexColor("#6b7280")

WIDTH, HEIGHT = A4

# Try to use Helvetica Neue or fall back to Helvetica
FONT = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
FONT_OBLIQUE = "Helvetica-Oblique"
FONT_BOLD_OBLIQUE = "Helvetica-BoldOblique"

# Styles
styles = {
    "title": ParagraphStyle(
        "title", fontName=FONT_BOLD, fontSize=28, leading=34,
        textColor=DARK, spaceAfter=6, alignment=TA_LEFT
    ),
    "subtitle": ParagraphStyle(
        "subtitle", fontName=FONT, fontSize=14, leading=20,
        textColor=GRAY, spaceAfter=24, alignment=TA_LEFT
    ),
    "h1": ParagraphStyle(
        "h1", fontName=FONT_BOLD, fontSize=20, leading=26,
        textColor=DARK, spaceBefore=24, spaceAfter=12, alignment=TA_LEFT
    ),
    "h2": ParagraphStyle(
        "h2", fontName=FONT_BOLD, fontSize=15, leading=20,
        textColor=BLUE, spaceBefore=18, spaceAfter=8, alignment=TA_LEFT
    ),
    "h3": ParagraphStyle(
        "h3", fontName=FONT_BOLD, fontSize=12, leading=16,
        textColor=DARK, spaceBefore=12, spaceAfter=6, alignment=TA_LEFT
    ),
    "body": ParagraphStyle(
        "body", fontName=FONT, fontSize=10, leading=15,
        textColor=TEXT, spaceAfter=8, alignment=TA_JUSTIFY
    ),
    "body_small": ParagraphStyle(
        "body_small", fontName=FONT, fontSize=9, leading=13,
        textColor=TEXT, spaceAfter=6, alignment=TA_JUSTIFY
    ),
    "bullet": ParagraphStyle(
        "bullet", fontName=FONT, fontSize=10, leading=15,
        textColor=TEXT, spaceAfter=4, leftIndent=20, bulletIndent=8,
        alignment=TA_LEFT
    ),
    "callout": ParagraphStyle(
        "callout", fontName=FONT_OBLIQUE, fontSize=11, leading=16,
        textColor=BLUE, spaceBefore=8, spaceAfter=8, alignment=TA_LEFT,
        leftIndent=16, rightIndent=16
    ),
    "bold_body": ParagraphStyle(
        "bold_body", fontName=FONT_BOLD, fontSize=10, leading=15,
        textColor=TEXT, spaceAfter=8, alignment=TA_LEFT
    ),
    "metric_big": ParagraphStyle(
        "metric_big", fontName=FONT_BOLD, fontSize=24, leading=28,
        textColor=ACCENT, spaceAfter=2, alignment=TA_CENTER
    ),
    "metric_label": ParagraphStyle(
        "metric_label", fontName=FONT, fontSize=9, leading=12,
        textColor=GRAY, spaceAfter=0, alignment=TA_CENTER
    ),
    "footer": ParagraphStyle(
        "footer", fontName=FONT, fontSize=8, leading=10,
        textColor=GRAY, alignment=TA_CENTER
    ),
    "table_header": ParagraphStyle(
        "table_header", fontName=FONT_BOLD, fontSize=9, leading=12,
        textColor=white, alignment=TA_LEFT
    ),
    "table_cell": ParagraphStyle(
        "table_cell", fontName=FONT, fontSize=9, leading=12,
        textColor=TEXT, alignment=TA_LEFT
    ),
    "table_cell_bold": ParagraphStyle(
        "table_cell_bold", fontName=FONT_BOLD, fontSize=9, leading=12,
        textColor=TEXT, alignment=TA_LEFT
    ),
    "cover_title": ParagraphStyle(
        "cover_title", fontName=FONT_BOLD, fontSize=36, leading=44,
        textColor=DARK, spaceAfter=12, alignment=TA_LEFT
    ),
    "cover_subtitle": ParagraphStyle(
        "cover_subtitle", fontName=FONT, fontSize=16, leading=22,
        textColor=GRAY, spaceAfter=8, alignment=TA_LEFT
    ),
    "cover_tagline": ParagraphStyle(
        "cover_tagline", fontName=FONT_OBLIQUE, fontSize=13, leading=18,
        textColor=ACCENT, spaceAfter=40, alignment=TA_LEFT
    ),
    "section_number": ParagraphStyle(
        "section_number", fontName=FONT_BOLD, fontSize=48, leading=52,
        textColor=HexColor("#e5e7eb"), spaceAfter=0, alignment=TA_LEFT
    ),
    "source_note": ParagraphStyle(
        "source_note", fontName=FONT_OBLIQUE, fontSize=8, leading=10,
        textColor=GRAY, spaceAfter=4, alignment=TA_LEFT
    ),
}


def make_colored_box(story, text, bg_color, text_style=None):
    """Add a colored background box with text."""
    if text_style is None:
        text_style = styles["callout"]
    data = [[Paragraph(text, text_style)]]
    t = Table(data, colWidths=[WIDTH - 60*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg_color),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))


def make_metric_row(story, metrics):
    """Create a row of big metric boxes."""
    col_width = (WIDTH - 60*mm) / len(metrics)
    data = []
    row1, row2 = [], []
    for value, label in metrics:
        row1.append(Paragraph(value, styles["metric_big"]))
        row2.append(Paragraph(label, styles["metric_label"]))
    data = [row1, row2]
    t = Table(data, colWidths=[col_width] * len(metrics))
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GRAY_LIGHT),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, 0), 12),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 12),
        ("TOPPADDING", (0, 1), (-1, 1), 0),
        ("LINEAFTER", (0, 0), (-2, -1), 1, white),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
    ]))
    story.append(t)
    story.append(Spacer(1, 12))


def make_table(story, headers, rows, col_widths=None):
    """Create a styled table."""
    avail_width = WIDTH - 60*mm
    if col_widths is None:
        col_widths = [avail_width / len(headers)] * len(headers)
    else:
        total = sum(col_widths)
        col_widths = [w / total * avail_width for w in col_widths]

    data = [[Paragraph(h, styles["table_header"]) for h in headers]]
    for row in rows:
        data.append([
            Paragraph(str(cell), styles["table_cell_bold"] if i == 0 else styles["table_cell"])
            for i, cell in enumerate(row)
        ])

    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), FONT_BOLD),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e5e7eb")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), GRAY_LIGHT))

    t.setStyle(TableStyle(style_cmds))
    story.append(t)
    story.append(Spacer(1, 12))


def add_page_number(canvas_obj, doc):
    """Add page number and footer line."""
    canvas_obj.saveState()
    canvas_obj.setStrokeColor(HexColor("#e5e7eb"))
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(30*mm, 18*mm, WIDTH - 30*mm, 18*mm)
    canvas_obj.setFont(FONT, 8)
    canvas_obj.setFillColor(GRAY)
    canvas_obj.drawString(30*mm, 12*mm, "ClearGround  |  CCC Impact BV  |  Confidential")
    canvas_obj.drawRightString(WIDTH - 30*mm, 12*mm, f"{doc.page}")
    canvas_obj.restoreState()


def build_pdf():
    output_path = os.path.expanduser("~/Documents/projects/tapwater/ClearGround_Business_Plan.pdf")
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=30*mm, rightMargin=30*mm,
        topMargin=25*mm, bottomMargin=25*mm
    )

    story = []

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 60))

    # Red accent bar
    accent_bar = Table([[""]], colWidths=[40*mm], rowHeights=[4])
    accent_bar.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ACCENT),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(accent_bar)
    story.append(Spacer(1, 20))

    story.append(Paragraph("ClearGround", styles["cover_title"]))
    story.append(Paragraph(
        "US Property Contamination Intelligence",
        styles["cover_subtitle"]
    ))
    story.append(Paragraph(
        '"Know what\'s in your ground before you buy it"',
        styles["cover_tagline"]
    ))

    story.append(Spacer(1, 20))

    # Key pitch points
    pitch_points = [
        ("$3B+", "US environmental due diligence market"),
        ("0", "Competitors at the intersection of consumer SEO + contamination API"),
        ("275K", "Programmatic pages from day one"),
        ("4x", "AI agent productivity multiplier (Anthropic internal measurement)"),
    ]
    for value, label in pitch_points:
        row_data = [[
            Paragraph(f'<font color="{ACCENT.hexval()}">{value}</font>', ParagraphStyle(
                "pv", fontName=FONT_BOLD, fontSize=18, leading=22, alignment=TA_RIGHT
            )),
            Paragraph(label, ParagraphStyle(
                "pl", fontName=FONT, fontSize=11, leading=16, textColor=GRAY, alignment=TA_LEFT
            ))
        ]]
        t = Table(row_data, colWidths=[35*mm, WIDTH - 95*mm])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(t)

    story.append(Spacer(1, 40))

    # Meta info
    story.append(Paragraph(
        f"CCC Impact BV  |  April 2026  |  Confidential",
        ParagraphStyle("meta", fontName=FONT, fontSize=10, textColor=GRAY, leading=14)
    ))
    story.append(Paragraph(
        "Prepared by Remy Pol",
        ParagraphStyle("meta2", fontName=FONT, fontSize=10, textColor=GRAY, leading=14)
    ))

    story.append(PageBreak())

    # =========================================================================
    # TABLE OF CONTENTS
    # =========================================================================
    story.append(Paragraph("Contents", styles["h1"]))
    story.append(Spacer(1, 8))

    toc_items = [
        ("1", "Executive Summary", "The opportunity in 60 seconds"),
        ("2", "Market Analysis", "Why contamination data, why now"),
        ("3", "Competitive Landscape", "Blue ocean analysis"),
        ("4", "The Product", "Three-layer platform strategy"),
        ("5", "Data Architecture", "Public data sources and the AI moat"),
        ("6", "The AI Thesis", "Why Mythos-class models change the economics"),
        ("7", "Financial Model", "Revenue projections and unit economics"),
        ("8", "Go-to-Market", "Phase-by-phase execution plan"),
        ("9", "Risks and Mitigations", "Honest assessment of what could go wrong"),
        ("10", "Why This, Why Now", "The case for commitment"),
    ]
    for num, title, desc in toc_items:
        row = [[
            Paragraph(num, ParagraphStyle("tn", fontName=FONT_BOLD, fontSize=11, textColor=ACCENT)),
            Paragraph(f'<b>{title}</b><br/><font color="{GRAY.hexval()}" size="9">{desc}</font>',
                      ParagraphStyle("td", fontName=FONT, fontSize=11, leading=16, textColor=DARK))
        ]]
        t = Table(row, colWidths=[12*mm, WIDTH - 72*mm])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, HexColor("#f3f4f6")),
        ]))
        story.append(t)

    story.append(PageBreak())

    # =========================================================================
    # 1. EXECUTIVE SUMMARY
    # =========================================================================
    story.append(Paragraph("1", styles["section_number"]))
    story.append(Paragraph("Executive Summary", styles["h1"]))

    make_colored_box(story,
        "Every US property transaction involves contamination risk, but no company provides "
        "continuous, property-level contamination scoring as both a consumer product and a B2B API. "
        "ClearGround fills this gap.",
        ACCENT_LIGHT,
        ParagraphStyle("cb", fontName=FONT_BOLD, fontSize=11, leading=16, textColor=DARK)
    )

    story.append(Paragraph(
        "ClearGround is a property contamination intelligence platform that cross-references "
        "15+ federal, state, and local environmental databases to generate a contamination risk "
        "score for any US property address. The platform serves three markets simultaneously:",
        styles["body"]
    ))

    bullets = [
        "<b>Consumer SEO surface</b> -- 275,000 programmatic pages covering every US ZIP code, city, "
        "county, and water utility. Monetized through affiliate partnerships (water filtration, home "
        "testing kits, insurance).",
        "<b>Property risk reports</b> -- detailed contamination analysis for individual addresses. "
        "Free basic score, paid detailed report ($29-99). Target: homebuyers, real estate agents, inspectors.",
        "<b>B2B API</b> -- RESTful property-level contamination risk data for real estate platforms, "
        "insurance underwriters, mortgage lenders, and environmental consultants. $2K-25K/month.",
    ]
    for b in bullets:
        story.append(Paragraph(f"\u2022  {b}", styles["bullet"]))

    story.append(Spacer(1, 8))

    make_metric_row(story, [
        ("$13-33K", "MRR by Month 12"),
        ("$95-270K", "MRR by Month 24"),
        ("< $4K", "Monthly operating costs"),
    ])

    story.append(Paragraph(
        "The timing is driven by three simultaneous regulatory forces: EPA PFAS drinking water "
        "regulations (effective 2026-2029), stricter lead pipe replacement rules, and insurance "
        "market hardening that is creating urgent demand for property-level contamination data. "
        "This is the same market dynamic that allowed First Street Foundation to build a $71M "
        "company providing flood risk scores -- but applied to the contamination data gap that "
        "nobody is filling.",
        styles["body"]
    ))

    story.append(PageBreak())

    # =========================================================================
    # 2. MARKET ANALYSIS
    # =========================================================================
    story.append(Paragraph("2", styles["section_number"]))
    story.append(Paragraph("Market Analysis", styles["h1"]))

    story.append(Paragraph("The contamination data gap", styles["h2"]))

    story.append(Paragraph(
        "The US environmental due diligence market exceeds $3 billion annually. Every commercial "
        "real estate transaction requires a Phase I Environmental Site Assessment. Residential "
        "buyers increasingly demand environmental risk information. Insurance companies are "
        "repricing policies based on contamination proximity. Yet the data infrastructure "
        "underlying all of this is fragmented, outdated, and inaccessible.",
        styles["body"]
    ))

    story.append(Paragraph(
        "Environmental data in the US is spread across 50+ federal databases, 50 different state "
        "systems, and thousands of county-level records -- all with different formats, different APIs, "
        "and different update schedules. No single platform cross-references all of these into a "
        "unified, property-level risk score.",
        styles["body"]
    ))

    story.append(Paragraph("Why now: Three regulatory catalysts", styles["h2"]))

    catalysts = [
        ("EPA PFAS Regulations (2026-2029)",
         "Maximum contaminant levels for 6 PFAS compounds in US drinking water. All 50,000+ water "
         "utilities must test and potentially remediate. Property owners near contamination sources "
         "face value depreciation. Creates massive demand for PFAS proximity data."),
        ("Lead and Copper Rule Improvements (2024)",
         "All lead service lines must be replaced within 10 years. 9.2 million US homes still have "
         "lead pipes. Homebuyers need to know lead risk at the property level."),
        ("Insurance market hardening",
         "Insurers are re-evaluating contamination-adjacent properties. The same pattern that drove "
         "flood risk data adoption (First Street Foundation) is now playing out for contamination risk."),
    ]
    for title, desc in catalysts:
        make_colored_box(story,
            f'<b>{title}</b><br/>{desc}',
            BLUE_LIGHT,
            ParagraphStyle("cat", fontName=FONT, fontSize=9.5, leading=14, textColor=DARK)
        )

    story.append(Paragraph("Target addressable market", styles["h2"]))

    make_table(story,
        ["Segment", "Market Size", "Our Target (Year 2)", "Revenue Model"],
        [
            ["Consumer SEO (affiliate)", "$1B+ water filter market", "500K monthly visitors", "$15-40K/mo affiliate"],
            ["Property reports", "$3B environmental due diligence", "5,000-15,000 reports/mo", "$30-80K/mo reports"],
            ["B2B API", "$500M+ property data market", "10-30 API customers", "$50-150K/mo API"],
            ["Government contracts", "$200M+ EPA/state budgets", "2-5 contracts", "Upside potential"],
        ],
        [2, 2.5, 2.5, 2.5]
    )

    story.append(PageBreak())

    # =========================================================================
    # 3. COMPETITIVE LANDSCAPE
    # =========================================================================
    story.append(Paragraph("3", styles["section_number"]))
    story.append(Paragraph("Competitive Landscape", styles["h1"]))

    make_colored_box(story,
        "Climate risk for properties is red ocean. Contamination risk is blue ocean. "
        "The critical distinction: well-funded competitors (First Street, CoreLogic, Cape Analytics) "
        "focus on climate/natural hazard risk. Nobody owns property-level contamination intelligence "
        "with both a consumer and B2B surface.",
        GREEN_LIGHT,
        ParagraphStyle("go", fontName=FONT_BOLD, fontSize=10, leading=15, textColor=DARK)
    )

    story.append(Paragraph("Direct competitors", styles["h2"]))

    make_table(story,
        ["Competitor", "What They Do", "Weakness", "Threat Level"],
        [
            ["EDR / Lightbox", "Environmental database reports for Phase I ESAs. $500-600/report",
             "Per-report model, no continuous monitoring. No consumer play. Reports are PDFs, not APIs. Legacy business.", "Medium"],
            ["First Street Foundation", "Flood, fire, wind, heat risk scores. Free consumer + paid API. $71M raised.",
             "Climate-focused only. Does NOT cover contamination, PFAS, Superfund, water quality.", "Low (different niche)"],
            ["CoreLogic", "$6B company. Property data for title, insurance, real estate.",
             "Generalist. Contamination is not a priority product line. Enterprise-only, no consumer.", "Low-Medium"],
            ["EPA/FEMA tools", "Free government databases (Envirofacts, Cleanups in My Community)",
             "Terrible UX. Fragmented across agencies. No cross-referencing. No property-level scoring.", "Very Low"],
            ["EnviroSite", "Environmental due diligence reports",
             "Old-school per-report model. No tech platform. No SEO surface.", "Low"],
        ],
        [1.5, 2.5, 3, 1.2]
    )

    story.append(Paragraph("The blue ocean position", styles["h2"]))

    story.append(Paragraph(
        "ClearGround occupies a position that no existing player covers: the intersection of "
        "<b>property-level contamination risk</b> (not climate risk), delivered as <b>both a "
        "consumer SEO product and a B2B API</b>, built on <b>autonomous AI agents</b> that can "
        "maintain 50-state data pipelines at a fraction of the cost of a human data team.",
        styles["body"]
    ))

    story.append(Paragraph(
        "The closest analogy is First Street Foundation's journey with flood risk. In 2015, flood "
        "data was fragmented across FEMA, state agencies, and local records. First Street built a "
        "unified platform, got adopted by Realtor.com and Redfin, and built a $71M company. "
        "Contamination data is in the same state today that flood data was in 2015. ClearGround "
        "is the First Street for contamination.",
        styles["body"]
    ))

    story.append(Paragraph("Defensibility layers", styles["h2"]))

    defenses = [
        "<b>Data aggregation moat:</b> 50-state data integration is painful and time-consuming. Each new state "
        "added makes the dataset more valuable and harder to replicate. Early mover advantage compounds daily.",
        "<b>SEO moat:</b> 275,000 pages of unique, data-rich content. Organic traffic is free and "
        "compounds. A VC-funded competitor would spend on sales teams, not SEO -- different acquisition channel.",
        "<b>AI cost advantage:</b> Autonomous agents maintain the data pipeline at ~10% of the cost of "
        "a human data team. This makes us structurally profitable at revenue levels where a traditional "
        "competitor would still be burning cash.",
    ]
    for d in defenses:
        story.append(Paragraph(f"\u2022  {d}", styles["bullet"]))

    story.append(PageBreak())

    # =========================================================================
    # 4. THE PRODUCT
    # =========================================================================
    story.append(Paragraph("4", styles["section_number"]))
    story.append(Paragraph("The Product", styles["h1"]))

    story.append(Paragraph(
        "ClearGround is a three-layer platform. Each layer builds on the previous one, "
        "creating multiple revenue streams from the same underlying dataset.",
        styles["body"]
    ))

    # Layer 1
    story.append(Paragraph("Layer 1: Consumer SEO Surface", styles["h2"]))
    make_colored_box(story,
        "<b>Purpose:</b> Free organic traffic. Brand building. Affiliate revenue.<br/>"
        "<b>Timeline:</b> Months 1-4<br/>"
        "<b>Revenue:</b> $3-8K MRR by month 6 (affiliate)",
        GRAY_LIGHT,
        ParagraphStyle("l1", fontName=FONT, fontSize=9.5, leading=14, textColor=DARK)
    )
    story.append(Paragraph(
        "Programmatic pages for every US ZIP code (41,000+), city (30,000+), county (3,100+), "
        "and water utility (150,000+). Each page contains unique, data-driven contamination risk "
        "information: nearby Superfund sites, PFAS likelihood, water utility compliance history, "
        "industrial facilities, underground storage tanks.",
        styles["body"]
    ))
    story.append(Paragraph(
        "This is an execution of the same playbook proven with TapWater.uk in the UK market, "
        "where programmatic water quality pages have achieved strong organic rankings and affiliate revenue. "
        "The US market has 5-10x the search volume and higher affiliate CPMs.",
        styles["body"]
    ))

    # Key keyword data
    story.append(Paragraph("Target keyword clusters", styles["h3"]))
    make_table(story,
        ["Keyword Cluster", "Est. US Monthly Searches", "Competition", "Monetization"],
        [
            ["\"is my tap water safe\"", "40,000+", "Low-Medium", "Water filter affiliate"],
            ["\"[city] water quality\"", "500,000+ (combined)", "Medium", "Filter + testing affiliate"],
            ["\"PFAS in water / PFAS near me\"", "90,000+", "Low (growing fast)", "Filter + insurance affiliate"],
            ["\"water quality by zip code\"", "25,000+", "Low", "Testing kit affiliate"],
            ["\"Superfund sites near me\"", "30,000+", "Very Low", "Insurance + testing"],
            ["\"PFAS contamination map [state]\"", "50,000+ (combined)", "Low", "Filter + insurance"],
        ],
        [2.5, 2, 1.5, 2]
    )

    # Layer 2
    story.append(Paragraph("Layer 2: Property Risk Reports", styles["h2"]))
    make_colored_box(story,
        "<b>Purpose:</b> Direct revenue. Lead qualification for B2B.<br/>"
        "<b>Timeline:</b> Months 4-8<br/>"
        "<b>Revenue:</b> $5-15K MRR by month 12",
        GRAY_LIGHT,
        ParagraphStyle("l2", fontName=FONT, fontSize=9.5, leading=14, textColor=DARK)
    )
    story.append(Paragraph(
        "Comprehensive contamination risk score for any US address. Free basic score drives "
        "traffic and email capture. Paid detailed report ($29-99) includes: contamination sources "
        "within radius, historical industrial use, water utility compliance details, PFAS likelihood, "
        "lead pipe probability, radon zone, and actionable recommendations.",
        styles["body"]
    ))

    # Layer 3
    story.append(Paragraph("Layer 3: B2B API", styles["h2"]))
    make_colored_box(story,
        "<b>Purpose:</b> High-value recurring revenue. Enterprise relationships.<br/>"
        "<b>Timeline:</b> Months 8-14<br/>"
        "<b>Revenue:</b> $50-150K MRR by month 24",
        GRAY_LIGHT,
        ParagraphStyle("l3", fontName=FONT, fontSize=9.5, leading=14, textColor=DARK)
    )
    story.append(Paragraph(
        "RESTful API providing property-level contamination risk data. Target customers: real estate "
        "platforms (Zillow, Redfin, Realtor.com), insurance underwriters, mortgage lenders, "
        "environmental consultants, proptech startups. Pricing: $2K-25K/month based on query volume. "
        "The pitch to these customers: \"You show flood risk from First Street. Your users also need "
        "contamination risk. We are the First Street for contamination.\"",
        styles["body"]
    ))

    story.append(PageBreak())

    # =========================================================================
    # 5. DATA ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("5", styles["section_number"]))
    story.append(Paragraph("Data Architecture", styles["h1"]))

    story.append(Paragraph(
        "All data sources are publicly available and free to access. The value is not in data "
        "exclusivity but in comprehensive aggregation, cross-referencing, geocoding to property "
        "level, and continuous updating. This is the moat.",
        styles["body"]
    ))

    make_table(story,
        ["Source", "Data", "Format", "Coverage"],
        [
            ["EPA ECHO", "Facility compliance, violations, inspections", "REST API", "All US"],
            ["EPA Superfund / CERCLIS", "Contaminated sites, cleanup status", "REST API + CSV", "All US"],
            ["EPA Brownfields", "Former industrial sites", "REST API", "All US"],
            ["EPA TRI", "Toxic Release Inventory per facility", "CSV downloads", "All US"],
            ["EPA SDWIS", "Safe Drinking Water violations", "REST API", "150K+ water systems"],
            ["USGS", "Groundwater quality measurements", "REST API", "All US"],
            ["State UST databases", "Underground storage tanks", "Varies by state", "50 states, 50 formats"],
            ["State PFAS results", "PFAS testing in water, soil", "Varies by state", "~30 states"],
            ["FEMA flood maps", "Flood zones (correlates with contamination spread)", "API + shapefiles", "All US"],
            ["Census / ACS", "Housing age, demographics (lead risk proxy)", "REST API", "All US"],
            ["DoD PFAS sites", "Military base contamination sites", "Published list", "700+ sites"],
            ["FAA airports", "PFAS from firefighting foam (AFFF)", "Database", "All US airports"],
            ["County assessor data", "Parcel boundaries, well vs. municipal water", "Per-county", "3,100+ counties"],
        ],
        [2, 3, 1.5, 1.5]
    )

    story.append(Paragraph("Technical stack", styles["h2"]))
    story.append(Paragraph(
        "The architecture mirrors the proven TapWater.uk stack, adapted for US scale:",
        styles["body"]
    ))

    tech_items = [
        "<b>Database:</b> Supabase (PostgreSQL + PostGIS) for spatial queries and property-level geocoding",
        "<b>Frontend:</b> Next.js on Vercel for programmatic page generation and API layer",
        "<b>ETL pipelines:</b> Python data ingestion, initially supervised, transitioning to autonomous agent-driven",
        "<b>Geocoding:</b> Property-level address matching using Census TIGER/Line + county parcel data",
        "<b>Scoring engine:</b> Multi-factor contamination risk score combining proximity, severity, "
        "source count, and regulatory status across all integrated databases",
    ]
    for item in tech_items:
        story.append(Paragraph(f"\u2022  {item}", styles["bullet"]))

    story.append(PageBreak())

    # =========================================================================
    # 6. THE AI THESIS
    # =========================================================================
    story.append(Paragraph("6", styles["section_number"]))
    story.append(Paragraph("The AI Thesis", styles["h1"]))
    story.append(Paragraph("Why next-generation models change the economics", styles["h2"]))

    make_colored_box(story,
        "Anthropic's Claude Mythos Preview system card (April 7, 2026) reveals a model that "
        "achieves 93.9% on SWE-bench Verified (real-world software engineering), can work "
        "autonomously for hours on complex tasks, and delivers a measured 4x productivity uplift "
        "for technical staff. When this capability class reaches the public API, it fundamentally "
        "changes what a solo operator can maintain.",
        ORANGE_LIGHT,
        ParagraphStyle("ai", fontName=FONT_BOLD, fontSize=10, leading=15, textColor=DARK)
    )

    story.append(Paragraph("What we build now vs. what changes with Mythos-class models", styles["h2"]))

    make_table(story,
        ["Task", "Current Model (Opus 4.6)", "With Mythos-Class Models"],
        [
            ["Federal data pipelines", "Fully capable. Well-documented APIs.", "Same. No change needed."],
            ["State data integration (50 states)", "Possible but requires significant supervision per state.",
             "Autonomous: describe the data source, agent figures out the format and builds the pipeline."],
            ["Continuous data monitoring", "Requires manual scheduling and error handling.",
             "Agents autonomously check all 50+ sources, process changes, flag anomalies."],
            ["County-level data (3,100+ counties)", "Impractical at scale with current supervision needs.",
             "Agents can independently tackle each county's unique format. Full coverage becomes feasible."],
            ["Cross-domain risk scoring", "Rule-based proximity calculations.",
             "AI-driven synthesis across disparate sources. Better scores than simple proximity."],
            ["Broken scraper repair", "Manual diagnosis and fix.",
             "Agents detect and autonomously repair broken data pipelines when source formats change."],
        ],
        [2, 3, 3.5]
    )

    story.append(Paragraph("The economic impact", styles["h2"]))

    story.append(Paragraph(
        "Without AI agents, maintaining 50-state data pipelines + a 275K-page site + a B2B API "
        "would require an estimated 5-8 full-time data engineers and content specialists. "
        "Annual cost: $600K-1.2M in salary alone.",
        styles["body"]
    ))
    story.append(Paragraph(
        "With Mythos-class AI agents, a single technical operator can maintain the same scope. "
        "This creates a structural cost advantage: ClearGround can be profitable at revenue levels "
        "where a traditionally-staffed competitor would still be burning cash.",
        styles["body"]
    ))

    make_metric_row(story, [
        ("5-8 FTEs", "Traditional team required"),
        ("1 person", "With AI agent leverage"),
        ("$600K+", "Annual cost savings"),
    ])

    story.append(Paragraph(
        "This is the thesis. The AI capability leap doesn't just make things faster -- it makes "
        "a category of business viable for a small team that was previously only viable for a "
        "well-funded company. We build the foundation now with current models, and deploy "
        "autonomous agents for full coverage when Mythos-class capabilities reach the public API.",
        styles["body"]
    ))

    story.append(PageBreak())

    # =========================================================================
    # 7. FINANCIAL MODEL
    # =========================================================================
    story.append(Paragraph("7", styles["section_number"]))
    story.append(Paragraph("Financial Model", styles["h1"]))

    story.append(Paragraph("Revenue projections", styles["h2"]))

    make_table(story,
        ["Revenue Stream", "Starts", "Month 12 MRR", "Month 24 MRR"],
        [
            ["Consumer SEO (affiliate)", "Month 4", "$3K - $8K", "$15K - $40K"],
            ["Property reports ($29-99)", "Month 6", "$5K - $15K", "$30K - $80K"],
            ["B2B API ($2K-25K/mo)", "Month 9", "$5K - $10K", "$50K - $150K"],
            ["Total MRR", "", "$13K - $33K", "$95K - $270K"],
        ],
        [2.5, 1.5, 2, 2]
    )

    story.append(Paragraph("Key assumptions", styles["h3"]))
    assumptions = [
        "US environmental/water quality keywords have 5-10x the search volume of UK equivalents",
        "Programmatic SEO playbook is proven (TapWater.uk demonstrates the model works)",
        "B2B pricing is conservative -- EDR charges $500-600 per single report; our API provides continuous access",
        "Property report conversion: 1-2% of visitors at $49 average price point",
        "B2B customer acquisition: 1-3 new customers per month starting month 9",
    ]
    for a in assumptions:
        story.append(Paragraph(f"\u2022  {a}", styles["bullet"]))

    story.append(Paragraph("Cost structure", styles["h2"]))

    make_table(story,
        ["Cost Item", "Monthly (Year 1)", "Notes"],
        [
            ["Supabase / Vercel hosting", "$200 - $500", "Proven stack from TapWater. Scales well."],
            ["Geocoding APIs", "$300 - $500", "Census geocoder is free. Supplementary services for edge cases."],
            ["Claude API (agent pipelines)", "$500 - $2,000", "Scales with data sources integrated."],
            ["Domain + misc. SaaS", "$100 - $200", "Registrar, email, monitoring."],
            ["Total monthly costs", "$1,100 - $3,200", "Excludes founder salary."],
        ],
        [2.5, 2, 4]
    )

    story.append(Spacer(1, 8))

    make_colored_box(story,
        "<b>Margin profile:</b> Data businesses have 80-90%+ gross margins once the pipeline is built. "
        "ClearGround's AI-driven maintenance model keeps costs nearly flat as revenue scales. "
        "Breakeven on operating costs is achievable within months 4-6. Profitable including "
        "reasonable founder salary by months 8-12.",
        GREEN_LIGHT,
        ParagraphStyle("margin", fontName=FONT, fontSize=10, leading=15, textColor=DARK)
    )

    story.append(PageBreak())

    # =========================================================================
    # 8. GO-TO-MARKET
    # =========================================================================
    story.append(Paragraph("8", styles["section_number"]))
    story.append(Paragraph("Go-to-Market", styles["h1"]))

    phases = [
        ("Phase 1: Foundation", "Weeks 1-8", "Build now", [
            "Federal data pipeline -- ingest EPA ECHO, Superfund, TRI, SDWIS, Brownfields, FEMA into PostGIS/Supabase",
            "Geocoding + contamination risk scoring engine -- property-level multi-factor score",
            "Next.js site architecture + programmatic SEO framework on Vercel",
            "First 5 state integrations (CA, TX, FL, NY, PA) -- largest real estate markets",
            "Deploy first 10,000+ ZIP code pages with real contamination data",
        ]),
        ("Phase 2: Traffic + First Revenue", "Weeks 8-16", "Build now", [
            "Scale to 275K programmatic pages -- all US ZIP codes, cities, counties, water utilities",
            "Affiliate monetization -- water filter partners, home testing kits, insurance comparison",
            "Basic property report -- free contamination score, paid detailed report ($29-99)",
            "Email capture -- \"Get notified when contamination risk changes at your address\"",
            "Begin SEO authority building with data-driven content + PR outreach to environmental journalists",
        ]),
        ("Phase 3: B2B + AI Scale", "Weeks 16-36", "Build when Mythos-class API available", [
            "Deploy autonomous agents to integrate remaining 45 state data systems",
            "Build continuous monitoring across all data sources",
            "Launch B2B API -- RESTful property-level contamination risk",
            "Outreach to proptech platforms, insurance insurtechs, real estate data aggregators",
            "Approach Zillow / Redfin / Realtor.com as contamination data provider (they already show flood risk)",
        ]),
        ("Phase 4: Expand + Compound", "Months 9-18", "Growth phase", [
            "Government contracts -- EPA, state environmental agencies, municipal planning",
            "White-label reports for real estate agents (branded contamination reports for buyers)",
            "International expansion -- EU PFAS regulations create same demand in Europe",
            "Adjacent data products -- air quality, soil contamination, industrial noise, EMF",
        ]),
    ]

    for title, timeline, status, items in phases:
        story.append(Paragraph(f"{title}", styles["h2"]))
        make_colored_box(story,
            f"<b>Timeline:</b> {timeline}  |  <b>Status:</b> {status}",
            BLUE_LIGHT,
            ParagraphStyle("ph", fontName=FONT, fontSize=9.5, leading=13, textColor=DARK)
        )
        for item in items:
            story.append(Paragraph(f"\u2022  {item}", styles["bullet"]))
        story.append(Spacer(1, 4))

    story.append(PageBreak())

    # =========================================================================
    # 9. RISKS AND MITIGATIONS
    # =========================================================================
    story.append(Paragraph("9", styles["section_number"]))
    story.append(Paragraph("Risks and Mitigations", styles["h1"]))

    story.append(Paragraph(
        "An honest assessment. These are real risks, not boilerplate.",
        styles["body"]
    ))

    make_table(story,
        ["Risk", "Severity", "Mitigation"],
        [
            ["CoreLogic or First Street enters contamination data",
             "High",
             "First-mover advantage compounds daily through SEO authority and data breadth. "
             "They would need 12+ months to build what we build in 6 with agents. "
             "Our cost structure also lets us undercut on API pricing."],
            ["Data quality / liability exposure",
             "High",
             "Clear disclaimers: \"Informational purposes only, not a substitute for Phase I ESA.\" "
             "Same legal approach as Zillow's Zestimate or First Street's flood scores. "
             "We present data, not professional assessments."],
            ["VC-funded startup enters the niche",
             "Medium",
             "Programmatic SEO moat is organic, not paid. VC-funded competitor would spend on enterprise sales, "
             "not SEO -- different market segment. Our AI cost advantage means we are profitable where they burn cash."],
            ["Scraper fragility (state sources change format)",
             "Medium",
             "Mythos-class agents can autonomously detect and fix broken scrapers. "
             "Monitoring + alerting pipeline catches breakage within hours."],
            ["EPA builds a better public tool",
             "Low",
             "Government tools are consistently poor UX. They do not cross-reference sources. "
             "Our value is synthesis + UX + property-level scoring, not raw data."],
            ["AI capability timeline uncertainty",
             "Medium",
             "Phase 1-2 (consumer SEO + reports) are achievable with current models. "
             "Mythos-class agents are needed only for Phase 3 scale (50-state coverage). "
             "The business is viable even if agent capabilities are delayed."],
        ],
        [2.5, 1, 5]
    )

    story.append(PageBreak())

    # =========================================================================
    # 10. WHY THIS, WHY NOW
    # =========================================================================
    story.append(Paragraph("10", styles["section_number"]))
    story.append(Paragraph("Why This, Why Now", styles["h1"]))

    story.append(Paragraph(
        "The case for ClearGround rests on five converging factors that create a narrow window of opportunity:",
        styles["body"]
    ))

    reasons = [
        ("Regulatory tailwind is unprecedented",
         "PFAS regulations, lead pipe rules, and insurance market hardening are creating simultaneous, "
         "urgent demand for contamination data. This is not a speculative market -- the regulatory deadlines "
         "are set and the compliance obligations are real. Companies and homeowners need this data now."),
        ("The data gap is real and verified",
         "No existing platform provides continuous, property-level contamination risk scoring with both "
         "a consumer surface and a B2B API. EDR/Lightbox sells $500 PDF reports to environmental "
         "consultants. There is no \"First Street for contamination.\" We have validated this gap."),
        ("We have a proven playbook",
         "TapWater.uk demonstrates that programmatic environmental data pages drive organic traffic "
         "and affiliate revenue. The architecture (Next.js + Supabase/PostGIS + Python ETL) is proven. "
         "The SEO methodology is proven. We are applying a validated model to a market 10-100x larger."),
        ("AI agents make this economically viable for a small team",
         "The Mythos system card documents a 4x productivity uplift and autonomous multi-hour task "
         "completion. This means one technical operator can maintain data infrastructure that traditionally "
         "requires 5-8 engineers. We have a structural cost advantage that makes us profitable where "
         "competitors burn cash."),
        ("First-mover advantage compounds",
         "Every day of data collection, every page indexed by Google, every state data source integrated "
         "makes the moat deeper. The SEO authority compounds. The data completeness compounds. "
         "A competitor starting 12 months later faces a 12-month SEO gap and a 12-month data gap. "
         "The window to establish this position is now."),
    ]

    for i, (title, desc) in enumerate(reasons, 1):
        story.append(Paragraph(f"{i}. {title}", styles["h3"]))
        story.append(Paragraph(desc, styles["body"]))

    story.append(Spacer(1, 16))

    # Final callout
    make_colored_box(story,
        "<b>The ask:</b> Dedicated founder time to execute Phase 1-2 (8-16 weeks) to validate "
        "US market traction. Initial investment is minimal -- hosting costs under $3K/month, "
        "no external funding required. Success criteria: 100K monthly organic visits and "
        "$10K MRR within 6 months, proving the model before scaling to Phase 3-4.",
        ACCENT_LIGHT,
        ParagraphStyle("ask", fontName=FONT, fontSize=11, leading=16, textColor=DARK)
    )

    story.append(Spacer(1, 30))

    story.append(HRFlowable(width="40%", thickness=1, color=HexColor("#e5e7eb")))
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        f"CCC Impact BV  |  April 2026",
        ParagraphStyle("end", fontName=FONT, fontSize=10, textColor=GRAY, alignment=TA_LEFT)
    ))
    story.append(Paragraph(
        "Contact: Remy Pol",
        ParagraphStyle("end2", fontName=FONT, fontSize=10, textColor=GRAY, alignment=TA_LEFT)
    ))

    # Build the PDF
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    return output_path


if __name__ == "__main__":
    path = build_pdf()
    print(f"PDF generated: {path}")
