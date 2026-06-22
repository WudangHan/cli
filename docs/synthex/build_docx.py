#!/usr/bin/env python3
# Build a .docx (OOXML) directly from the authored HTML. No external deps.
import re, zipfile, sys
from html.parser import HTMLParser

SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/SEXTANT/sextant.html"
OUT = sys.argv[2] if len(sys.argv) > 2 else "/tmp/SEXTANT/Programme_SEXTANT.docx"

def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def runs_xml(runs, mono=False):
    out = []
    for text, b, i, br in runs:
        if br:
            out.append('<w:r><w:br/></w:r>')
            continue
        if text == "":
            continue
        rpr = []
        if mono:
            rpr.append('<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="18"/>')
        if b:
            rpr.append('<w:b/>')
        if i:
            rpr.append('<w:i/>')
        rpr_xml = f'<w:rPr>{"".join(rpr)}</w:rPr>' if rpr else ''
        out.append(f'<w:r>{rpr_xml}<w:t xml:space="preserve">{esc(text)}</w:t></w:r>')
    return "".join(out)

def para(runs, *, size=None, bold=False, align=None, mono=False,
         pagebreak=False, box=False, border_bottom=False, spacing_double=True,
         space_before=0, space_after=120):
    ppr = []
    if pagebreak:
        ppr.append('<w:pageBreakBefore/>')
    line = '<w:spacing w:line="480" w:lineRule="auto"' if spacing_double else '<w:spacing w:line="240" w:lineRule="auto"'
    line += f' w:before="{space_before}" w:after="{space_after}"/>'
    ppr.append(line)
    if align:
        ppr.append(f'<w:jc w:val="{align}"/>')
    bdr = []
    if box:
        ppr.append('<w:shd w:val="clear" w:fill="F4F4F4"/>')
        bdr = ['top','bottom','left','right']
    if border_bottom:
        bdr = ['bottom']
    if bdr:
        b = ''.join(f'<w:{s} w:val="single" w:sz="8" w:space="2" w:color="000000"/>' for s in bdr)
        ppr.append(f'<w:pBdr>{b}</w:pBdr>')
    # run-level defaults for whole paragraph (size/bold) via applying to each run
    rendered = []
    for text, rb, ri, brk in runs:
        rendered.append((text, rb or bold, ri, brk))
    inner = runs_xml(rendered, mono=mono)
    if size or bold:
        # wrap: apply size by injecting into each run's rPr -> simpler: re-render with size
        inner = render_sized(rendered, size, mono)
    ppr_xml = f'<w:pPr>{"".join(ppr)}</w:pPr>'
    return f'<w:p>{ppr_xml}{inner}</w:p>'

def render_sized(runs, size, mono):
    out = []
    for text, b, i, br in runs:
        if br:
            out.append('<w:r><w:br/></w:r>'); continue
        if text == "": continue
        rpr = []
        if mono:
            rpr.append('<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/>')
        if size:
            rpr.append(f'<w:sz w:val="{size}"/>')
        if b: rpr.append('<w:b/>')
        if i: rpr.append('<w:i/>')
        rpr_xml = f'<w:rPr>{"".join(rpr)}</w:rPr>' if rpr else ''
        out.append(f'<w:r>{rpr_xml}<w:t xml:space="preserve">{esc(text)}</w:t></w:r>')
    return "".join(out)

class Builder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks = []
        self.runs = []
        self.bold = 0
        self.italic = 0
        self.mode = None
        self.in_pre = False
        self.in_titlepage = False
        self.in_box = False
        self.pending_pagebreak = False
        # table
        self.in_table = False
        self.rows = []
        self.cur_row = None
        self.in_cell = False
        self.cell_header = False
        self.ncols = 0

    def cls(self, attrs):
        d = dict(attrs)
        return d.get('class', '')

    def handle_starttag(self, tag, attrs):
        c = self.cls(attrs)
        if tag == 'div':
            if 'titlepage' in c: self.in_titlepage = True
            if 'box' in c: self.in_box = True
            if 'pagebreak' in c and tag == 'div':
                self.pending_pagebreak = True
            return
        if tag in ('h1','h2','h3','h4','p','pre','blockquote'):
            self.mode = tag
            self.runs = []
            self._para_pagebreak = ('pagebreak' in c) or self.pending_pagebreak
            self.pending_pagebreak = False
            if tag == 'pre': self.in_pre = True
            if tag == 'blockquote': self.italic += 1
            return
        if tag == 'b' or tag == 'strong':
            self.bold += 1; return
        if tag == 'i' or tag == 'em':
            self.italic += 1; return
        if tag == 'br':
            self.runs.append(("", False, False, True)); return
        if tag == 'table':
            self.in_table = True; self.rows = []; return
        if tag == 'tr':
            self.cur_row = []; return
        if tag in ('td','th'):
            self.in_cell = True; self.cell_header = (tag == 'th'); self.runs = []; return

    def handle_endtag(self, tag):
        if tag == 'div':
            # box / titlepage end: we close on matching; simplistic (no nested)
            if self.in_box and tag == 'div':
                # only close box when we hit the box's closing div; approximate: keep until explicit
                pass
            return
        if tag in ('h1','h2','h3','h4','p','blockquote'):
            self._flush_para(tag)
            if tag == 'blockquote': self.italic -= 1
            self.mode = None
            return
        if tag == 'pre':
            self._flush_pre()
            self.in_pre = False; self.mode = None; return
        if tag in ('b','strong'):
            self.bold = max(0, self.bold-1); return
        if tag in ('i','em'):
            self.italic = max(0, self.italic-1); return
        if tag in ('td','th'):
            self.cur_row.append((self.cell_header, self.runs)); self.runs = []; self.in_cell = False; return
        if tag == 'tr':
            if self.cur_row: self.rows.append(self.cur_row); self.cur_row = None; return
        if tag == 'table':
            self._flush_table(); self.in_table = False; return

    def handle_data(self, data):
        if self.mode is None and not self.in_cell:
            return
        if self.in_pre:
            # preserve, convert newlines to breaks
            parts = data.split("\n")
            for k, seg in enumerate(parts):
                if k > 0:
                    self.runs.append(("", False, False, True))
                if seg != "":
                    self.runs.append((seg, self.bold>0, self.italic>0, False))
            return
        text = re.sub(r'\s+', ' ', data)
        if text == '':
            return
        self.runs.append((text, self.bold>0, self.italic>0, False))

    def _flush_para(self, tag):
        if tag == 'h1':
            self.blocks.append(para(self.runs, size=40, bold=True, align='center', space_after=200))
        elif tag == 'h2':
            self.blocks.append(para(self.runs, size=30, bold=True, border_bottom=True,
                                    pagebreak=getattr(self,'_para_pagebreak',False),
                                    space_before=240, space_after=120, spacing_double=False))
        elif tag == 'h3':
            self.blocks.append(para(self.runs, size=26, bold=True, space_before=160, space_after=80, spacing_double=False))
        elif tag == 'h4':
            self.blocks.append(para(self.runs, size=24, bold=True, space_before=120, space_after=40, spacing_double=False))
        elif tag == 'blockquote':
            self.blocks.append(para(self.runs, align='both'))
        else:  # p
            al = 'center' if self.in_titlepage else 'both'
            self.blocks.append(para(self.runs, align=al, box=self.in_box,
                                    pagebreak=getattr(self,'_para_pagebreak',False)))

    def _flush_pre(self):
        # single-spaced monospace block
        ppr = '<w:pPr><w:spacing w:line="240" w:lineRule="auto" w:after="120"/></w:pPr>'
        inner = render_sized([(t,False,False,br) for (t,b,i,br) in self.runs], 18, True)
        self.blocks.append(f'<w:p>{ppr}{inner}</w:p>')

    def _flush_table(self):
        if not self.rows: return
        ncols = max(len(r) for r in self.rows)
        grid = ''.join('<w:gridCol w:w="%d"/>' % int(9360/ncols) for _ in range(ncols))
        borders = ('<w:tblBorders>'
                   '<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
                   '<w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
                   '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
                   '<w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
                   '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
                   '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
                   '</w:tblBorders>')
        tblpr = f'<w:tblPr><w:tblW w:w="5000" w:type="pct"/>{borders}<w:tblLayout w:type="fixed"/></w:tblPr>'
        rows_xml = []
        for r in self.rows:
            cells = []
            for header, runs in r:
                shd = '<w:shd w:val="clear" w:fill="E8E8E8"/>' if header else ''
                tcpr = f'<w:tcPr><w:tcW w:w="{int(9360/ncols)}" w:type="dxa"/>{shd}</w:tcPr>'
                cppr = '<w:pPr><w:spacing w:line="240" w:lineRule="auto" w:after="20"/></w:pPr>'
                inner = render_sized([(t, b or header, i, br) for (t,b,i,br) in runs], 22, False)
                cells.append(f'<w:tc>{tcpr}<w:p>{cppr}{inner}</w:p></w:tc>')
            rows_xml.append(f'<w:tr>{"".join(cells)}</w:tr>')
        self.blocks.append(f'<w:tbl>{tblpr}<w:tblGrid>{grid}</w:tblGrid>{"".join(rows_xml)}</w:tbl>')
        # spacer paragraph
        self.blocks.append('<w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>')

    def handle_startendtag(self, tag, attrs):
        if tag == 'br':
            self.runs.append(("", False, False, True))
        if tag == 'div' and 'pagebreak' in self.cls(attrs):
            self.pending_pagebreak = True

# crude box close handling: split on </div> for box — instead, post-process by tracking
html = open(SRC, encoding='utf-8').read()
# Make box close detectable: replace closing div of box with sentinel handled in parser is complex;
# simpler: turn off box at each </div>. We approximate by closing box on first </div> after opening.
b = Builder()
# monkeypatch endtag for div to close box/titlepage
_orig_end = b.handle_endtag
def end2(tag):
    if tag == 'div':
        if b.in_box: b.in_box = False
        if b.in_titlepage: b.in_titlepage = False
        return
    return _orig_end(tag)
b.handle_endtag = end2
b.feed(html)

body = "".join(b.blocks)
sectpr = ('<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
          '<w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418" '
          'w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>')
document = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            f'<w:body>{body}{sectpr}</w:body></w:document>')

styles = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
          '<w:docDefaults><w:rPrDefault><w:rPr>'
          '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>'
          '<w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="fr-FR"/>'
          '</w:rPr></w:rPrDefault>'
          '<w:pPrDefault><w:pPr><w:spacing w:line="480" w:lineRule="auto"/></w:pPr></w:pPrDefault>'
          '</w:docDefaults>'
          '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>'
          '</w:styles>')

content_types = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                 '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                 '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                 '<Default Extension="xml" ContentType="application/xml"/>'
                 '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
                 '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
                 '</Types>')

rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
        '</Relationships>')

doc_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            '</Relationships>')

with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', content_types)
    z.writestr('_rels/.rels', rels)
    z.writestr('word/document.xml', document)
    z.writestr('word/styles.xml', styles)
    z.writestr('word/_rels/document.xml.rels', doc_rels)

print("OK ->", OUT)
print("blocks:", len(b.blocks), "tables rows parsed last:", )
