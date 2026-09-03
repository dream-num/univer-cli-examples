#let navy = rgb("#173B57")
#let accent = rgb("#00A7A5")
#let green = rgb("#2EAD72")
#let pale = rgb("#EAF7F5")
#let muted = rgb("#5E7180")
#let rule = rgb("#C7D9DF")

#set page(
  paper: "a4",
  margin: (x: 46pt, top: 52pt, bottom: 48pt),
  header-ascent: 18pt,
  footer-descent: 18pt,
  header: align(right)[#text(size: 7.5pt, weight: "bold", fill: accent)[UNIVER CLI SDK  ·  PRODUCT BRIEF]],
  footer: [
    #line(length: 100%, stroke: (paint: rule, thickness: 0.5pt))
    #v(3pt)
    #align(left)[#text(size: 7.5pt, fill: muted)[LOCAL AUTHORING  ·  TYPST → UNIVER DOC]]
  ],
)

#set text(
  font: ("Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", "Arial"),
  size: 9.5pt,
  fill: navy,
)
#set par(leading: 0.68em, spacing: 0.72em)

#let section-title(body) = block(above: 8pt, below: 4pt)[
  #text(size: 12pt, weight: "bold", fill: navy)[#body]
  #v(2pt)
  #line(length: 100%, stroke: (paint: accent, thickness: 0.8pt))
]

#let summary(body) = block(width: 100%, fill: pale, inset: 10pt, radius: 3pt)[#body]
