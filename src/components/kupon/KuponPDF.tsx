import type { ComponentType, ReactNode } from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Svg,
  Rect,
  Ellipse,
  Polygon,
} from "@react-pdf/renderer";

// Tipe <Text> SVG di react-pdf tidak mendeklarasikan fontSize/fontFamily
// (padahal berfungsi saat render). Bungkus dengan tipe lokal yang benar.
type SvgTextProps = {
  x: number;
  y: number;
  fill?: string;
  fontSize?: number;
  fontFamily?: string;
  textAnchor?: "start" | "middle" | "end";
  transform?: string;
  children?: ReactNode;
};
const SvgText = Text as unknown as ComponentType<SvgTextProps>;

export interface KuponPenerima {
  id: string;
  nama: string;
  kodeKupon: string;
  /** PNG dataURL barcode CODE128, di-generate di server SEBELUM render. */
  barcodeDataUrl: string;
}

interface KuponPDFProps {
  penerimaList: KuponPenerima[];
  /** Jika ada file public/template-kupon.jpg, dataURL-nya dipakai sbg background. */
  templateDataUrl?: string | null;
  /** Rasio (lebar/tinggi) template agar kupon tidak gepeng. Default desain vektor. */
  templateRatio?: number | null;
}

// ============================================================
//  GEOMETRI HALAMAN  (A4 portrait, satuan mm)
// ============================================================
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_H = 5;
const MARGIN_V = 8;
const GAP = 4; // jarak antar kupon (panduan gunting)
const CONTENT_W = PAGE_W - MARGIN_H * 2; // 200mm
const CONTENT_H = PAGE_H - MARGIN_V * 2; // 281mm

const DEFAULT_RATIO = 3.1; // rasio desain vektor bawaan (lebar:tinggi)

/** Hitung tinggi kupon & jumlah per halaman dari rasio template. */
function computeLayout(ratio: number) {
  const couponW = CONTENT_W;
  // Jaga agar tinggi masuk akal (tidak terlalu tipis / tinggi).
  const couponH = Math.min(95, Math.max(28, couponW / ratio));
  const perPage = Math.max(1, Math.floor((CONTENT_H + GAP) / (couponH + GAP)));
  return { couponW, couponH, perPage };
}

const styles = StyleSheet.create({
  page: {
    paddingTop: `${MARGIN_V}mm`,
    paddingBottom: `${MARGIN_V}mm`,
    paddingHorizontal: `${MARGIN_H}mm`,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
  },
  coupon: {
    width: `${CONTENT_W}mm`,
    position: "relative",
    marginBottom: `${GAP}mm`,
    borderWidth: 0.6,
    borderStyle: "dashed",
    borderColor: "#94a3b8",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  templateBg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "fill",
  },

  // ---------- OVERLAY UNTUK MODE TEMPLATE GAMBAR ----------
  // Posisi dalam persen (relatif thd gambar). Sesuaikan bila template berbeda.
  tplBarcode: {
    position: "absolute",
    left: "39.5%",
    top: "19%",
    width: "27%",
    height: "33%",
    objectFit: "fill",
  },
  tplKode: {
    position: "absolute",
    left: "39.5%",
    top: "55%",
    width: "27%",
    fontSize: 9,
    fontFamily: "Courier-Bold",
    textAlign: "center",
    letterSpacing: 2,
    color: "#0f172a",
  },
  tplName: {
    position: "absolute",
    left: "35.5%",
    top: "83.5%",
    width: "21.5%",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    maxLines: 1,
    textOverflow: "ellipsis",
  },

  // ---------- DESAIN VEKTOR BAWAAN ----------
  leftPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "25%",
    height: "100%",
    backgroundColor: "#fffbeb",
    borderRightWidth: 0.6,
    borderRightStyle: "dashed",
    borderRightColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  panelLabel: {
    marginTop: "2mm",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#92400e",
    letterSpacing: 2,
  },
  title: {
    position: "absolute",
    left: "28%",
    top: "12%",
    width: "42%",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    lineHeight: 1.25,
  },
  subtitle: {
    position: "absolute",
    left: "28%",
    top: "40%",
    width: "42%",
    fontSize: 8,
    color: "#64748b",
    lineHeight: 1.3,
  },
  barcode: {
    position: "absolute",
    left: "54%",
    top: "14%",
    width: "28%",
    height: "36%",
    objectFit: "fill",
  },
  kodeText: {
    position: "absolute",
    left: "54%",
    top: "54%",
    width: "28%",
    fontSize: 10,
    fontFamily: "Courier-Bold",
    textAlign: "center",
    letterSpacing: 2,
    color: "#0f172a",
  },
  pill: {
    position: "absolute",
    left: "28%",
    top: "70%",
    width: "50%",
    height: "20%",
    borderWidth: 1.4,
    borderColor: "#000000",
    borderRadius: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: "2.5%",
    paddingRight: "1.5%",
  },
  pillLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  pillNameWrap: {
    flexGrow: 1,
    marginLeft: "2mm",
    borderBottomWidth: 0.8,
    borderBottomColor: "#000000",
    paddingBottom: "1mm",
  },
  pillName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    maxLines: 1,
    textOverflow: "ellipsis",
  },
  pillCap: {
    position: "absolute",
    left: "74%",
    top: "70%",
    width: "9%",
    height: "20%",
    backgroundColor: "#000000",
    borderRadius: 40,
  },
  stub: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "17%",
    height: "100%",
  },
});

/** Sapi pakai kacamata hitam — versi vektor (tanpa file gambar). */
function CowFace() {
  return (
    <Svg width="42mm" height="35mm" viewBox="0 0 120 100">
      <Polygon points="30,28 16,4 42,22" fill="#efe6d2" stroke="#d8c8a8" strokeWidth={1} />
      <Polygon points="90,28 104,4 78,22" fill="#efe6d2" stroke="#d8c8a8" strokeWidth={1} />
      <Ellipse cx={20} cy={48} rx={12} ry={8} fill="#c9ad86" />
      <Ellipse cx={100} cy={48} rx={12} ry={8} fill="#c9ad86" />
      <Ellipse cx={60} cy={58} rx={40} ry={34} fill="#d8c0a0" />
      <Ellipse cx={60} cy={45} rx={21} ry={17} fill="#f5efe2" />
      <Ellipse cx={60} cy={82} rx={23} ry={14} fill="#e7d3c0" />
      <Ellipse cx={51} cy={82} rx={3} ry={4.5} fill="#7c5e4e" />
      <Ellipse cx={69} cy={82} rx={3} ry={4.5} fill="#7c5e4e" />
      <Ellipse cx={46} cy={50} rx={15} ry={8.5} fill="#111827" />
      <Ellipse cx={75} cy={50} rx={15} ry={8.5} fill="#111827" />
      <Rect x={58} y={47} width={6} height={3.5} fill="#111827" />
    </Svg>
  );
}

/** Stub hitam "Ayo, Ambil Daging!" dengan lubang gantungan. */
function Stub() {
  return (
    <Svg style={styles.stub} viewBox="0 0 34 65">
      <Rect x={0} y={0} width={34} height={65} fill="#0b0b0b" />
      <Rect
        x={13}
        y={4}
        width={8}
        height={13}
        rx={4}
        fill="none"
        stroke="#ffffff"
        strokeWidth={1.2}
      />
      <SvgText
        x={13}
        y={36}
        fill="#facc15"
        fontSize={5.2}
        fontFamily="Helvetica-BoldOblique"
        textAnchor="middle"
        transform="rotate(-90 13 36)"
      >
        Ayo, Ambil Daging!
      </SvgText>
      <SvgText
        x={28}
        y={36}
        fill="#ffffff"
        fontSize={2.3}
        fontFamily="Helvetica-Bold"
        textAnchor="middle"
        transform="rotate(-90 28 36)"
      >
        KUPON PENGAMBILAN DAGING KURBAN
      </SvgText>
    </Svg>
  );
}

function Kupon({
  p,
  couponH,
  templateDataUrl,
}: {
  p: KuponPenerima;
  couponH: number;
  templateDataUrl?: string | null;
}) {
  const useTemplate = Boolean(templateDataUrl);

  return (
    <View style={[styles.coupon, { height: `${couponH}mm` }]} wrap={false}>
      {useTemplate ? (
        <>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={templateDataUrl!} style={styles.templateBg} />
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={p.barcodeDataUrl} style={styles.tplBarcode} />
          <Text style={styles.tplKode}>{p.kodeKupon}</Text>
          <Text style={styles.tplName}>{p.nama.toUpperCase()}</Text>
        </>
      ) : (
        <>
          <View style={styles.leftPanel}>
            <CowFace />
            <Text style={styles.panelLabel}>KURBAN</Text>
          </View>
          <Text style={styles.title}>KUPON PENGAMBILAN DAGING KURBAN</Text>
          <Text style={styles.subtitle}>
            Tunjukkan kupon ini saat pengambilan daging kurban.
          </Text>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={p.barcodeDataUrl} style={styles.barcode} />
          <Text style={styles.kodeText}>{p.kodeKupon}</Text>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>NAMA PENERIMA :</Text>
            <View style={styles.pillNameWrap}>
              <Text style={styles.pillName}>{p.nama.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.pillCap} />
          <Stub />
        </>
      )}
    </View>
  );
}

export function KuponPDF({
  penerimaList,
  templateDataUrl,
  templateRatio,
}: KuponPDFProps) {
  const ratio =
    templateDataUrl && templateRatio && templateRatio > 0
      ? templateRatio
      : DEFAULT_RATIO;
  const { couponH, perPage } = computeLayout(ratio);

  const pages: KuponPenerima[][] = [];
  for (let i = 0; i < penerimaList.length; i += perPage) {
    pages.push(penerimaList.slice(i, i + perPage));
  }
  if (pages.length === 0) pages.push([]);

  return (
    <Document
      title="Kupon Kurban"
      author="Generator Kupon Kurban"
      subject="Kupon Pengambilan Daging Kurban"
    >
      {pages.map((pagePenerima, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          {pagePenerima.map((p) => (
            <Kupon
              key={p.id}
              p={p}
              couponH={couponH}
              templateDataUrl={templateDataUrl}
            />
          ))}
        </Page>
      ))}
    </Document>
  );
}
