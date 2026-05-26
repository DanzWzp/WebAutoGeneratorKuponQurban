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
}

const COUPONS_PER_PAGE = 8;

// ============================================================
//  KOORDINAT ELEMEN  (mudah di-tweak)
//  Semua dalam milimeter relatif terhadap kupon (200mm x 33mm).
// ============================================================
const COUPON_W = 200;
const COUPON_H = 33;

const styles = StyleSheet.create({
  page: {
    paddingTop: "6mm",
    paddingBottom: "6mm",
    paddingHorizontal: "5mm",
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
  },
  coupon: {
    width: `${COUPON_W}mm`,
    height: `${COUPON_H}mm`,
    position: "relative",
    marginBottom: "2.4mm",
    borderWidth: 0.6,
    borderStyle: "dashed",
    borderColor: "#94a3b8",
    borderRadius: 4,
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
  // --- panel kiri (sapi) ---
  leftPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "40mm",
    height: "100%",
    backgroundColor: "#fffbeb",
    borderRightWidth: 0.6,
    borderRightStyle: "dashed",
    borderRightColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: "1mm",
  },
  panelLabel: {
    marginTop: "0.5mm",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#92400e",
    letterSpacing: 1,
  },
  // --- judul ---
  title: {
    position: "absolute",
    left: "44mm",
    top: "3mm",
    width: "62mm",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    lineHeight: 1.15,
  },
  subtitle: {
    position: "absolute",
    left: "44mm",
    top: "13mm",
    width: "62mm",
    fontSize: 6.5,
    color: "#64748b",
    lineHeight: 1.2,
  },
  // --- barcode ---
  barcode: {
    position: "absolute",
    left: "112mm",
    top: "3.5mm",
    width: "50mm",
    height: "12mm",
    objectFit: "fill",
  },
  kodeText: {
    position: "absolute",
    left: "112mm",
    top: "16mm",
    width: "50mm",
    fontSize: 9,
    fontFamily: "Courier-Bold",
    textAlign: "center",
    letterSpacing: 2,
    color: "#0f172a",
  },
  // --- field nama (pill) ---
  pill: {
    position: "absolute",
    left: "44mm",
    top: "22.5mm",
    width: "96mm",
    height: "7.5mm",
    borderWidth: 1.2,
    borderColor: "#000000",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: "3mm",
    paddingRight: "2mm",
  },
  pillLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  pillNameWrap: {
    flexGrow: 1,
    marginLeft: "1.5mm",
    borderBottomWidth: 0.8,
    borderBottomColor: "#000000",
    paddingBottom: "0.5mm",
  },
  pillName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  pillCap: {
    position: "absolute",
    left: "134mm",
    top: "22.5mm",
    width: "22mm",
    height: "7.5mm",
    backgroundColor: "#000000",
    borderRadius: 14,
  },
  // --- stub kanan ---
  stub: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "28mm",
    height: "100%",
  },
});

/** Sapi pakai kacamata hitam — versi vektor (tanpa file gambar). */
function CowFace() {
  return (
    <Svg width="36mm" height="29mm" viewBox="0 0 120 100">
      {/* tanduk */}
      <Polygon points="30,28 16,4 42,22" fill="#efe6d2" stroke="#d8c8a8" strokeWidth={1} />
      <Polygon points="90,28 104,4 78,22" fill="#efe6d2" stroke="#d8c8a8" strokeWidth={1} />
      {/* telinga */}
      <Ellipse cx={20} cy={48} rx={12} ry={8} fill="#c9ad86" />
      <Ellipse cx={100} cy={48} rx={12} ry={8} fill="#c9ad86" />
      {/* kepala */}
      <Ellipse cx={60} cy={58} rx={40} ry={34} fill="#d8c0a0" />
      {/* corak putih wajah */}
      <Ellipse cx={60} cy={45} rx={21} ry={17} fill="#f5efe2" />
      {/* moncong */}
      <Ellipse cx={60} cy={82} rx={23} ry={14} fill="#e7d3c0" />
      <Ellipse cx={51} cy={82} rx={3} ry={4.5} fill="#7c5e4e" />
      <Ellipse cx={69} cy={82} rx={3} ry={4.5} fill="#7c5e4e" />
      {/* kacamata hitam */}
      <Ellipse cx={46} cy={50} rx={15} ry={8.5} fill="#111827" />
      <Ellipse cx={75} cy={50} rx={15} ry={8.5} fill="#111827" />
      <Rect x={58} y={47} width={6} height={3.5} fill="#111827" />
    </Svg>
  );
}

/** Stub hitam "Ayo, Ambil Daging!" dengan lubang gantungan. */
function Stub() {
  return (
    <Svg style={styles.stub} viewBox="0 0 28 33">
      <Rect x={0} y={0} width={28} height={33} fill="#0b0b0b" />
      {/* lubang oval (gantungan) */}
      <Rect
        x={10}
        y={2.6}
        width={8}
        height={11}
        rx={4}
        fill="none"
        stroke="#ffffff"
        strokeWidth={1.2}
      />
      {/* teks kuning vertikal */}
      <Text
        x={11}
        y={24}
        fill="#facc15"
        fontSize={4.4}
        fontFamily="Helvetica-BoldOblique"
        textAnchor="middle"
        transform="rotate(-90 11 24)"
      >
        Ayo, Ambil Daging!
      </Text>
      {/* teks putih kecil vertikal */}
      <Text
        x={23}
        y={24}
        fill="#ffffff"
        fontSize={2}
        fontFamily="Helvetica-Bold"
        textAnchor="middle"
        transform="rotate(-90 23 24)"
      >
        KUPON PENGAMBILAN DAGING KURBAN
      </Text>
    </Svg>
  );
}

function Kupon({
  p,
  templateDataUrl,
}: {
  p: KuponPenerima;
  templateDataUrl?: string | null;
}) {
  const useTemplate = Boolean(templateDataUrl);

  return (
    <View style={styles.coupon} wrap={false}>
      {useTemplate ? (
        // --- MODE TEMPLATE GAMBAR ---
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={templateDataUrl!} style={styles.templateBg} />
      ) : (
        // --- MODE DESAIN VEKTOR BAWAAN ---
        <>
          <View style={styles.leftPanel}>
            <CowFace />
            <Text style={styles.panelLabel}>KURBAN</Text>
          </View>
          <Text style={styles.title}>
            KUPON PENGAMBILAN{"\n"}DAGING KURBAN
          </Text>
          <Text style={styles.subtitle}>
            Tunjukkan kupon ini saat{"\n"}pengambilan daging.
          </Text>
          <Stub />
        </>
      )}

      {/* Overlay (selalu dirender, baik mode template maupun vektor) */}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={p.barcodeDataUrl} style={styles.barcode} />
      <Text style={styles.kodeText}>{p.kodeKupon}</Text>

      {!useTemplate && (
        <>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>NAMA PENERIMA :</Text>
            <View style={styles.pillNameWrap}>
              <Text style={styles.pillName}>{p.nama.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.pillCap} />
        </>
      )}

      {useTemplate && (
        // Untuk template gambar, hanya overlay nama pada garis yang sudah ada.
        // Sesuaikan koordinat di styles.tplName bila perlu setelah uji cetak.
        <Text style={stylesTpl.tplName}>{p.nama.toUpperCase()}</Text>
      )}
    </View>
  );
}

// Koordinat khusus saat memakai template gambar (template-kupon.jpg).
// Sesuaikan setelah generate PDF uji dengan nama panjang & pendek.
const stylesTpl = StyleSheet.create({
  tplName: {
    position: "absolute",
    left: "23%",
    top: "82%",
    width: "32%",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
});

export function KuponPDF({ penerimaList, templateDataUrl }: KuponPDFProps) {
  const pages: KuponPenerima[][] = [];
  for (let i = 0; i < penerimaList.length; i += COUPONS_PER_PAGE) {
    pages.push(penerimaList.slice(i, i + COUPONS_PER_PAGE));
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
            <Kupon key={p.id} p={p} templateDataUrl={templateDataUrl} />
          ))}
        </Page>
      ))}
    </Document>
  );
}
