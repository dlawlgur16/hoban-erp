import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const useSsl =
  /sslmode=require/i.test(connectionString) || connectionString.includes("rds.amazonaws.com");
const cleanedUrl = useSsl
  ? connectionString.replace(/([?&])sslmode=[^&]+&?/g, "$1").replace(/[?&]$/, "")
  : connectionString;
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: cleanedUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  }),
});

// ──────────── 마스터 정의 ────────────

const CLIENTS = [
  { name: "삼성", code: "SAMSUNG" },
  { name: "호반", code: "HOBAN" },
] as const;

const SITES_BY_CLIENT: Record<
  string,
  ReadonlyArray<{ name: string; address?: string; contactName?: string }>
> = {
  SAMSUNG: [
    { name: "서초", address: "서울특별시 서초구 방배중앙로 181", contactName: "김동은 프로님" },
    { name: "용산", address: "서울특별시 용산구 한강대로 273", contactName: "김영진 프로님" },
    { name: "강남(은마)", address: "서울시 강남구 테헤란로", contactName: "안석현 프로님" },
    { name: "부산", address: "부산 부산진구 중앙대로 629-10", contactName: "정은희 팀장님" },
    { name: "민관합동", address: "서울특별시 영등포구 여의대방로67길", contactName: "온지트 박경민 팀장님" },
    { name: "리모델링", address: "광진구 자양4동", contactName: "이채원 매니저" },
  ],
  HOBAN: [
    { name: "본사(양재)", address: "서울 서초구 양재대로", contactName: "석준희 대리님" },
    { name: "남부사업소(광명)", address: "광명 아브뉴프랑광명", contactName: "손위립 차장님" },
    { name: "면목동캠프(상봉)", address: "서울 중랑구 상봉 홈플러스", contactName: "김종현 대리님" },
    { name: "자양동캠프", address: "서울 광진구 자양동 (빛나는바다)", contactName: "김종현 대리님" },
    { name: "프레스센터", address: "서울 중구", contactName: "—" },
  ],
};

const ITEMS = [
  { name: "미용티슈", category: "티슈", unit: "개", unitsPerBox: 30 },
  { name: "키친티슈", category: "티슈", unit: "개", unitsPerBox: 24 },
  { name: "물티슈", category: "티슈", unit: "개", unitsPerBox: 10 },
  { name: "종이컵 6.5온스", category: "종이컵", unit: "개", unitsPerBox: 1000 },
  { name: "종이컵 8온스", category: "종이컵", unit: "개", unitsPerBox: 1000 },
  { name: "종이컵 13온스", category: "종이컵", unit: "개", unitsPerBox: 1000 },
  { name: "쇼핑백", category: "쇼핑백", unit: "개", unitsPerBox: 150 },
  { name: "미니쇼핑백", category: "쇼핑백", unit: "개", unitsPerBox: 100 },
] as const;

const VENDORS = [
  { name: "하얀티슈", category: "티슈", contactName: "정영권 과장", phone: "010-7737-1091", address: "음성군", account: "신한은행 140-006-679580" },
  { name: "현대크린상사", category: "티슈", contactName: "정현숙 과장", phone: "010-5730-0955", address: "음성군", account: null },
  { name: "경기특수인쇄", category: "종이컵", contactName: "이은구 부장", phone: "010-3870-7391", address: "충북 음성군 금왕읍 멍심이길 268", account: null },
  { name: "솔리애드", category: "쇼핑백", contactName: null, phone: "010-3796-2178", address: "경기도 김포시 고촌읍 향산리 820번지", account: null },
  { name: "유경쇼핑백", category: "쇼핑백", contactName: "김병철 부장", phone: "010-8895-9758", address: null, account: "우리은행 1005-303-530501" },
  { name: "광주인쇄", category: "물티슈", contactName: "문혜영 대리", phone: "010-6555-9464", address: "광주광역시 광산구 평동산단로169번길", account: null },
  { name: "정원인쇄", category: "물티슈", contactName: null, phone: null, address: "부천시 원미구 부천로 136", account: null },
] as const;

const STOCK_LOCATIONS = [
  { name: "천지로지스", kind: "warehouse" },
  { name: "회사(지하)", kind: "onsite" },
  { name: "업체보관", kind: "vendor" },
] as const;

// ──────────── 시드 본체 ────────────

async function main() {
  console.log("Resetting transaction tables...");
  // 트랜잭션성 데이터 모두 제거 후 다시 시드
  await prisma.vendorPayment.deleteMany();
  await prisma.clientReceipt.deleteMany();
  await prisma.deliveryLine.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.vendorOrderLine.deleteMany();
  await prisma.vendorOrder.deleteMany();
  await prisma.clientOrderLine.deleteMany();
  await prisma.clientOrder.deleteMany();
  await prisma.stockMovement.deleteMany();

  console.log("Upserting master data...");

  for (const c of CLIENTS) {
    await prisma.client.upsert({ where: { code: c.code }, create: c, update: c });
  }

  for (const code in SITES_BY_CLIENT) {
    const client = await prisma.client.findUnique({ where: { code } });
    if (!client) continue;
    for (const site of SITES_BY_CLIENT[code]) {
      await prisma.site.upsert({
        where: { clientId_name: { clientId: client.id, name: site.name } },
        create: {
          clientId: client.id,
          name: site.name,
          address: site.address ?? null,
          contactName: site.contactName ?? null,
        },
        update: { address: site.address ?? null, contactName: site.contactName ?? null },
      });
    }
  }

  for (const item of ITEMS) {
    await prisma.item.upsert({ where: { name: item.name }, create: item, update: item });
  }
  for (const v of VENDORS) {
    await prisma.vendor.upsert({ where: { name: v.name }, create: v, update: v });
  }
  for (const loc of STOCK_LOCATIONS) {
    await prisma.stockLocation.upsert({ where: { name: loc.name }, create: loc, update: loc });
  }

  // 마스터 ID 룩업
  const samsung = (await prisma.client.findUnique({ where: { code: "SAMSUNG" } }))!;
  const hoban = (await prisma.client.findUnique({ where: { code: "HOBAN" } }))!;
  const sitesAll = await prisma.site.findMany();
  const siteMap = new Map<string, number>(); // `${clientId}-${name}` → id
  for (const s of sitesAll) siteMap.set(`${s.clientId}-${s.name}`, s.id);
  const itemsAll = await prisma.item.findMany();
  const itemMap = new Map<string, number>();
  for (const it of itemsAll) itemMap.set(it.name, it.id);
  const vendorsAll = await prisma.vendor.findMany();
  const vendorMap = new Map<string, number>();
  for (const v of vendorsAll) vendorMap.set(v.name, v.id);
  const locationsAll = await prisma.stockLocation.findMany();
  const locMap = new Map<string, number>();
  for (const l of locationsAll) locMap.set(l.name, l.id);

  function siteId(clientId: number, name: string): number {
    const id = siteMap.get(`${clientId}-${name}`);
    if (!id) throw new Error(`Site not found: ${name} for client ${clientId}`);
    return id;
  }
  function itemId(name: string): number {
    const id = itemMap.get(name);
    if (!id) throw new Error(`Item not found: ${name}`);
    return id;
  }
  function vendorId(name: string): number {
    const id = vendorMap.get(name);
    if (!id) throw new Error(`Vendor not found: ${name}`);
    return id;
  }

  console.log("Seeding client orders...");

  // ──── 삼성 1차 발주 (4/1) — 대표님 4월 입고 시트 합계 참고 ────
  const samsung1 = await prisma.clientOrder.create({
    data: {
      clientId: samsung.id,
      roundNo: 1,
      roundLabel: "1차 발주",
      orderDate: new Date("2026-04-01"),
      taxInvoiceDate: new Date("2026-04-30"),
      memo: "4월 정기 발주",
      lines: {
        createMany: {
          data: [
            // 서초
            { siteId: siteId(samsung.id, "서초"), itemId: itemId("미용티슈"), qtyBoxes: 120, qtyUnits: 3600 },
            { siteId: siteId(samsung.id, "서초"), itemId: itemId("물티슈"), qtyBoxes: 80, qtyUnits: 800 },
            { siteId: siteId(samsung.id, "서초"), itemId: itemId("종이컵 6.5온스"), qtyBoxes: 25, qtyUnits: 25000 },
            { siteId: siteId(samsung.id, "서초"), itemId: itemId("종이컵 8온스"), qtyBoxes: 25, qtyUnits: 25000 },
            { siteId: siteId(samsung.id, "서초"), itemId: itemId("쇼핑백"), qtyBoxes: 5, qtyUnits: 750 },
            // 용산
            { siteId: siteId(samsung.id, "용산"), itemId: itemId("미용티슈"), qtyBoxes: 160, qtyUnits: 4800 },
            { siteId: siteId(samsung.id, "용산"), itemId: itemId("물티슈"), qtyBoxes: 80, qtyUnits: 800 },
            { siteId: siteId(samsung.id, "용산"), itemId: itemId("종이컵 6.5온스"), qtyBoxes: 30, qtyUnits: 30000 },
            { siteId: siteId(samsung.id, "용산"), itemId: itemId("종이컵 8온스"), qtyBoxes: 30, qtyUnits: 30000 },
            { siteId: siteId(samsung.id, "용산"), itemId: itemId("쇼핑백"), qtyBoxes: 8, qtyUnits: 1200 },
            // 강남(은마)
            { siteId: siteId(samsung.id, "강남(은마)"), itemId: itemId("미용티슈"), qtyBoxes: 80, qtyUnits: 2400 },
            { siteId: siteId(samsung.id, "강남(은마)"), itemId: itemId("물티슈"), qtyBoxes: 60, qtyUnits: 600 },
            { siteId: siteId(samsung.id, "강남(은마)"), itemId: itemId("종이컵 6.5온스"), qtyBoxes: 20, qtyUnits: 20000 },
            { siteId: siteId(samsung.id, "강남(은마)"), itemId: itemId("종이컵 8온스"), qtyBoxes: 20, qtyUnits: 20000 },
            { siteId: siteId(samsung.id, "강남(은마)"), itemId: itemId("쇼핑백"), qtyBoxes: 5, qtyUnits: 750 },
            // 부산
            { siteId: siteId(samsung.id, "부산"), itemId: itemId("미용티슈"), qtyBoxes: 60, qtyUnits: 1800 },
            { siteId: siteId(samsung.id, "부산"), itemId: itemId("물티슈"), qtyBoxes: 60, qtyUnits: 600 },
            { siteId: siteId(samsung.id, "부산"), itemId: itemId("종이컵 6.5온스"), qtyBoxes: 20, qtyUnits: 20000 },
            { siteId: siteId(samsung.id, "부산"), itemId: itemId("종이컵 8온스"), qtyBoxes: 20, qtyUnits: 20000 },
            { siteId: siteId(samsung.id, "부산"), itemId: itemId("쇼핑백"), qtyBoxes: 7, qtyUnits: 1050 },
            // 민관합동
            { siteId: siteId(samsung.id, "민관합동"), itemId: itemId("미용티슈"), qtyBoxes: 40, qtyUnits: 1200 },
            { siteId: siteId(samsung.id, "민관합동"), itemId: itemId("물티슈"), qtyBoxes: 40, qtyUnits: 400 },
            { siteId: siteId(samsung.id, "민관합동"), itemId: itemId("종이컵 6.5온스"), qtyBoxes: 15, qtyUnits: 15000 },
            { siteId: siteId(samsung.id, "민관합동"), itemId: itemId("종이컵 8온스"), qtyBoxes: 15, qtyUnits: 15000 },
            { siteId: siteId(samsung.id, "민관합동"), itemId: itemId("쇼핑백"), qtyBoxes: 5, qtyUnits: 750 },
            // 리모델링
            { siteId: siteId(samsung.id, "리모델링"), itemId: itemId("미용티슈"), qtyBoxes: 95, qtyUnits: 2850 },
            { siteId: siteId(samsung.id, "리모델링"), itemId: itemId("물티슈"), qtyBoxes: 18, qtyUnits: 180 },
            { siteId: siteId(samsung.id, "리모델링"), itemId: itemId("종이컵 6.5온스"), qtyBoxes: 3, qtyUnits: 3000 },
            { siteId: siteId(samsung.id, "리모델링"), itemId: itemId("종이컵 8온스"), qtyBoxes: 3, qtyUnits: 3000 },
            { siteId: siteId(samsung.id, "리모델링"), itemId: itemId("쇼핑백"), qtyBoxes: 5, qtyUnits: 750 },
          ],
        },
      },
    },
  });

  // 삼성 2차 발주 (5/8) — 5월 시작
  const samsung2 = await prisma.clientOrder.create({
    data: {
      clientId: samsung.id,
      roundNo: 2,
      roundLabel: "2차 발주",
      orderDate: new Date("2026-05-08"),
      memo: "5월 미용티슈/쇼핑백 추가",
      lines: {
        createMany: {
          data: [
            { siteId: siteId(samsung.id, "강남(은마)"), itemId: itemId("미용티슈"), qtyBoxes: 180, qtyUnits: 5400 },
            { siteId: siteId(samsung.id, "서초"), itemId: itemId("미용티슈"), qtyBoxes: 60, qtyUnits: 1800 },
            { siteId: siteId(samsung.id, "용산"), itemId: itemId("쇼핑백"), qtyBoxes: 10, qtyUnits: 1500 },
            { siteId: siteId(samsung.id, "리모델링"), itemId: itemId("쇼핑백"), qtyBoxes: 24, qtyUnits: 3600 },
          ],
        },
      },
    },
  });

  // ──── 호반 1차 발주 (3/17) — 26년도 호반 1차 발주 ────
  const hoban1 = await prisma.clientOrder.create({
    data: {
      clientId: hoban.id,
      roundNo: 1,
      roundLabel: "1차 발주",
      orderDate: new Date("2026-03-17"),
      taxInvoiceDate: new Date("2026-03-31"),
      memo: "3월 정기 (1차)",
      lines: {
        createMany: {
          data: [
            { siteId: siteId(hoban.id, "본사(양재)"), itemId: itemId("미용티슈"), qtyBoxes: 30, qtyUnits: 900 },
            { siteId: siteId(hoban.id, "본사(양재)"), itemId: itemId("물티슈"), qtyBoxes: 30, qtyUnits: 300 },
            { siteId: siteId(hoban.id, "본사(양재)"), itemId: itemId("종이컵 6.5온스"), qtyBoxes: 50, qtyUnits: 50000 },
            { siteId: siteId(hoban.id, "본사(양재)"), itemId: itemId("종이컵 13온스"), qtyBoxes: 20, qtyUnits: 20000 },
            { siteId: siteId(hoban.id, "본사(양재)"), itemId: itemId("쇼핑백"), qtyBoxes: 10, qtyUnits: 1500 },

            { siteId: siteId(hoban.id, "남부사업소(광명)"), itemId: itemId("미용티슈"), qtyBoxes: 10, qtyUnits: 300 },
            { siteId: siteId(hoban.id, "남부사업소(광명)"), itemId: itemId("쇼핑백"), qtyBoxes: 10, qtyUnits: 1500 },

            { siteId: siteId(hoban.id, "면목동캠프(상봉)"), itemId: itemId("미용티슈"), qtyBoxes: 60, qtyUnits: 1800 },
            { siteId: siteId(hoban.id, "면목동캠프(상봉)"), itemId: itemId("물티슈"), qtyBoxes: 60, qtyUnits: 600 },
            { siteId: siteId(hoban.id, "면목동캠프(상봉)"), itemId: itemId("종이컵 6.5온스"), qtyBoxes: 10, qtyUnits: 10000 },
            { siteId: siteId(hoban.id, "면목동캠프(상봉)"), itemId: itemId("종이컵 13온스"), qtyBoxes: 10, qtyUnits: 10000 },
            { siteId: siteId(hoban.id, "면목동캠프(상봉)"), itemId: itemId("쇼핑백"), qtyBoxes: 10, qtyUnits: 1500 },

            { siteId: siteId(hoban.id, "자양동캠프"), itemId: itemId("미용티슈"), qtyBoxes: 40, qtyUnits: 1200 },
            { siteId: siteId(hoban.id, "자양동캠프"), itemId: itemId("물티슈"), qtyBoxes: 40, qtyUnits: 400 },
            { siteId: siteId(hoban.id, "자양동캠프"), itemId: itemId("종이컵 6.5온스"), qtyBoxes: 50, qtyUnits: 50000 },
            { siteId: siteId(hoban.id, "자양동캠프"), itemId: itemId("종이컵 13온스"), qtyBoxes: 35, qtyUnits: 35000 },
            { siteId: siteId(hoban.id, "자양동캠프"), itemId: itemId("쇼핑백"), qtyBoxes: 12, qtyUnits: 1800 },

            { siteId: siteId(hoban.id, "프레스센터"), itemId: itemId("미용티슈"), qtyBoxes: 15, qtyUnits: 450 },
            { siteId: siteId(hoban.id, "프레스센터"), itemId: itemId("물티슈"), qtyBoxes: 15, qtyUnits: 150 },
            { siteId: siteId(hoban.id, "프레스센터"), itemId: itemId("쇼핑백"), qtyBoxes: 2, qtyUnits: 300 },
          ],
        },
      },
    },
  });

  // 호반 2차 발주 (4/14)
  const hoban2 = await prisma.clientOrder.create({
    data: {
      clientId: hoban.id,
      roundNo: 2,
      roundLabel: "2차 발주",
      orderDate: new Date("2026-04-14"),
      memo: "4월 보충 발주",
      lines: {
        createMany: {
          data: [
            { siteId: siteId(hoban.id, "본사(양재)"), itemId: itemId("물티슈"), qtyBoxes: 30, qtyUnits: 300 },
            { siteId: siteId(hoban.id, "자양동캠프"), itemId: itemId("물티슈"), qtyBoxes: 30, qtyUnits: 300 },
            { siteId: siteId(hoban.id, "면목동캠프(상봉)"), itemId: itemId("물티슈"), qtyBoxes: 30, qtyUnits: 300 },
          ],
        },
      },
    },
  });

  // 호반 3차 발주 (5/8) — 5월 각티슈 추가발주
  const hoban3 = await prisma.clientOrder.create({
    data: {
      clientId: hoban.id,
      roundNo: 3,
      roundLabel: "3차 발주",
      orderDate: new Date("2026-05-08"),
      memo: "5월 각티슈 추가",
      lines: {
        createMany: {
          data: [
            { siteId: siteId(hoban.id, "본사(양재)"), itemId: itemId("미용티슈"), qtyBoxes: 100, qtyUnits: 3000 },
            { siteId: siteId(hoban.id, "면목동캠프(상봉)"), itemId: itemId("미용티슈"), qtyBoxes: 60, qtyUnits: 1800 },
            { siteId: siteId(hoban.id, "자양동캠프"), itemId: itemId("미용티슈"), qtyBoxes: 40, qtyUnits: 1200 },
          ],
        },
      },
    },
  });

  console.log("Seeding deliveries...");

  // ──── 4월 입고(배송) — 대표님 엑셀 실데이터 ────
  const deliveries = [
    // 삼성
    {
      clientId: samsung.id,
      siteName: "강남(은마)",
      deliveryDate: "2026-04-09",
      clientContact: "안석현 프로님",
      courier: "천지로지스",
      memo: "강동구 천호대로 1077 래미안",
      lines: [
        { item: "미용티슈", boxes: 20 },
        { item: "물티슈", boxes: 20 },
        { item: "종이컵 6.5온스", boxes: 4 },
        { item: "종이컵 8온스", boxes: 4 },
        { item: "쇼핑백", boxes: 1 },
      ],
    },
    {
      clientId: samsung.id,
      siteName: "용산",
      deliveryDate: "2026-04-10",
      clientContact: "김영진 프로님",
      courier: "천지로지스",
      memo: "용산구 한강대로 273",
      lines: [
        { item: "미용티슈", boxes: 80 },
        { item: "물티슈", boxes: 80 },
        { item: "종이컵 6.5온스", boxes: 30 },
        { item: "종이컵 8온스", boxes: 30 },
        { item: "쇼핑백", boxes: 2 },
      ],
    },
    {
      clientId: samsung.id,
      siteName: "민관합동",
      deliveryDate: "2026-04-13",
      clientContact: "온지트 박경민 팀장님",
      courier: "천지로지스",
      memo: "여의대방로67길",
      lines: [
        { item: "미용티슈", boxes: 40 },
        { item: "물티슈", boxes: 40 },
        { item: "종이컵 6.5온스", boxes: 15 },
        { item: "종이컵 8온스", boxes: 15 },
        { item: "쇼핑백", boxes: 1 },
      ],
    },
    {
      clientId: samsung.id,
      siteName: "서초",
      deliveryDate: "2026-04-13",
      clientContact: "김동은 프로님",
      courier: "천지로지스",
      memo: "방배중앙로 181",
      lines: [
        { item: "미용티슈", boxes: 40 },
        { item: "물티슈", boxes: 40 },
        { item: "종이컵 6.5온스", boxes: 15 },
        { item: "종이컵 8온스", boxes: 15 },
        { item: "쇼핑백", boxes: 1 },
      ],
    },
    {
      clientId: samsung.id,
      siteName: "용산",
      deliveryDate: "2026-04-17",
      clientContact: "김영진 프로님",
      courier: "천지로지스",
      memo: "추가 쇼핑백 인도",
      lines: [{ item: "쇼핑백", boxes: 5 }],
    },
    {
      clientId: samsung.id,
      siteName: "부산",
      deliveryDate: "2026-04-18",
      clientContact: "정은희 팀장님",
      courier: "천지로지스",
      memo: "부산진구 중앙대로",
      lines: [
        { item: "미용티슈", boxes: 30 },
        { item: "물티슈", boxes: 30 },
        { item: "종이컵 6.5온스", boxes: 10 },
        { item: "종이컵 8온스", boxes: 10 },
        { item: "쇼핑백", boxes: 2 },
      ],
    },
    {
      clientId: samsung.id,
      siteName: "리모델링",
      deliveryDate: "2026-04-27",
      clientContact: "이채원 매니저",
      courier: "천지로지스",
      memo: "광진구 자양4동",
      lines: [
        { item: "미용티슈", boxes: 25 },
        { item: "물티슈", boxes: 20 },
        { item: "쇼핑백", boxes: 1 },
      ],
    },

    // 호반
    {
      clientId: hoban.id,
      siteName: "면목동캠프(상봉)",
      deliveryDate: "2026-04-02",
      clientContact: "김종현 대리님",
      courier: "천지로지스",
      lines: [{ item: "미용티슈", boxes: 20 }],
    },
    {
      clientId: hoban.id,
      siteName: "면목동캠프(상봉)",
      deliveryDate: "2026-04-08",
      clientContact: "김종현 대리님",
      courier: "천지로지스",
      lines: [
        { item: "미용티슈", boxes: 20 },
        { item: "종이컵 6.5온스", boxes: 5 },
        { item: "종이컵 13온스", boxes: 5 },
        { item: "쇼핑백", boxes: 5 },
      ],
    },
    {
      clientId: hoban.id,
      siteName: "남부사업소(광명)",
      deliveryDate: "2026-04-08",
      clientContact: "손위립 차장님",
      courier: "천지로지스",
      memo: "아브뉴프랑광명",
      lines: [{ item: "쇼핑백", boxes: 10 }],
    },
    {
      clientId: hoban.id,
      siteName: "본사(양재)",
      deliveryDate: "2026-04-10",
      clientContact: "석준희 대리님",
      courier: "천지로지스",
      lines: [
        { item: "미용티슈", boxes: 5 },
        { item: "종이컵 6.5온스", boxes: 50 },
        { item: "종이컵 13온스", boxes: 20 },
      ],
    },
    {
      clientId: hoban.id,
      siteName: "자양동캠프",
      deliveryDate: "2026-04-16",
      clientContact: "김종현 대리님",
      courier: "천지로지스",
      memo: "빛나는바다 자양점",
      lines: [
        { item: "물티슈", boxes: 20 },
        { item: "종이컵 6.5온스", boxes: 35 },
        { item: "종이컵 13온스", boxes: 25 },
        { item: "쇼핑백", boxes: 10 },
      ],
    },
    {
      clientId: hoban.id,
      siteName: "면목동캠프(상봉)",
      deliveryDate: "2026-04-16",
      clientContact: "김종현 대리님",
      courier: "천지로지스",
      lines: [{ item: "물티슈", boxes: 20 }],
    },
    {
      clientId: hoban.id,
      siteName: "본사(양재)",
      deliveryDate: "2026-04-16",
      clientContact: "석준희 대리님",
      courier: "천지로지스",
      lines: [{ item: "물티슈", boxes: 20 }],
    },
  ];

  // 시드 배송은 모두 천지로지스에서 출고된 것으로 가정
  const cheonjiId = locMap.get("천지로지스");
  if (!cheonjiId) throw new Error("천지로지스 location not found");

  for (const d of deliveries) {
    await prisma.delivery.create({
      data: {
        clientId: d.clientId,
        siteId: siteId(d.clientId, d.siteName),
        deliveryDate: new Date(d.deliveryDate),
        clientContact: d.clientContact ?? null,
        courier: d.courier ?? null,
        memo: d.memo ?? null,
        lines: {
          createMany: {
            data: d.lines.map((l) => ({
              itemId: itemId(l.item),
              qtyBoxes: l.boxes,
              qtyUnits: l.boxes * (ITEMS.find((i) => i.name === l.item)?.unitsPerBox ?? 1),
              fromLocationId: cheonjiId,
            })),
          },
        },
      },
    });
  }

  console.log("Seeding vendor orders...");

  // ──── 업체 발주 (5월) ────
  const samsungIsmaTissue = await prisma.vendorOrder.create({
    data: {
      vendorId: vendorId("하얀티슈"),
      relatedClientOrderId: samsung2.id,
      orderDate: new Date("2026-05-08"),
      memo: "삼성 강남(은마) 미용티슈 5,400개 (180박스)",
      lines: {
        create: [
          {
            itemId: itemId("미용티슈"),
            qtyBoxes: 180,
            qtyUnits: 5400,
            receivedDate: null,
          },
        ],
      },
    },
  });

  await prisma.vendorOrder.create({
    data: {
      vendorId: vendorId("유경쇼핑백"),
      relatedClientOrderId: samsung2.id,
      orderDate: new Date("2026-05-08"),
      memo: "삼성 용산/리모델링 쇼핑백 5,100개 (34박스)",
      lines: {
        create: [{ itemId: itemId("쇼핑백"), qtyBoxes: 34, qtyUnits: 5100, receivedDate: null }],
      },
    },
  });

  await prisma.vendorOrder.create({
    data: {
      vendorId: vendorId("하얀티슈"),
      relatedClientOrderId: hoban3.id,
      orderDate: new Date("2026-05-08"),
      memo: "호반 3차 미용티슈 (본사·면목·자양) 6,000개 (200박스)",
      lines: {
        create: [{ itemId: itemId("미용티슈"), qtyBoxes: 200, qtyUnits: 6000, receivedDate: null }],
      },
    },
  });

  console.log("Seeding payments & receipts...");

  // ──── 업체 정산 (5월) ────
  await prisma.vendorPayment.createMany({
    data: [
      {
        vendorId: vendorId("유경쇼핑백"),
        clientId: samsung.id,
        subject: "삼성 쇼핑백 5,100개 / 용산, 리모델링",
        amount: 4880700,
        vatIncluded: true,
        account: "우리은행 1005-303-530501",
        paidDate: new Date("2026-05-19"),
        memo: "5월19일 입금 완료",
      },
      {
        vendorId: vendorId("하얀티슈"),
        clientId: samsung.id,
        subject: "삼성 각티슈 5,400개 / 은마",
        amount: 2831400,
        vatIncluded: true,
        account: "신한은행 140-006-679580",
        scheduledDate: new Date("2026-05-30"),
        memo: "5월30일 선금 50% 예정",
      },
      {
        vendorId: vendorId("하얀티슈"),
        clientId: samsung.id,
        subject: "삼성 각티슈 5,100개 / 본사",
        amount: 2384250,
        vatIncluded: true,
        account: "신한은행 140-006-679580",
        scheduledDate: new Date("2026-05-30"),
        memo: "5월30일 선금 50% 예정",
      },
      {
        vendorId: vendorId("하얀티슈"),
        clientId: hoban.id,
        subject: "호반 각티슈(3차분)",
        amount: 2550240,
        vatIncluded: true,
        account: "신한은행 140-006-679580",
        scheduledDate: new Date("2026-05-30"),
        memo: "5월30일 잔금 50% 예정",
      },
    ],
  });

  // ──── 클라이언트 입금 ────
  await prisma.clientReceipt.createMany({
    data: [
      {
        clientId: samsung.id,
        clientOrderId: samsung1.id,
        subject: "4월 삼성 판촉물",
        amount: 37287900,
        receivedDate: new Date("2026-05-08"),
        memo: "전체 입금 완료",
      },
      {
        clientId: hoban.id,
        clientOrderId: hoban3.id,
        subject: "3차 각티슈",
        amount: 7552000,
        scheduledDate: new Date("2026-05-30"),
        memo: "5월말 입금 예정",
      },
    ],
  });

  // 통계 출력
  const counts = {
    clients: await prisma.client.count(),
    sites: await prisma.site.count(),
    items: await prisma.item.count(),
    vendors: await prisma.vendor.count(),
    locations: await prisma.stockLocation.count(),
    clientOrders: await prisma.clientOrder.count(),
    clientOrderLines: await prisma.clientOrderLine.count(),
    vendorOrders: await prisma.vendorOrder.count(),
    deliveries: await prisma.delivery.count(),
    deliveryLines: await prisma.deliveryLine.count(),
    vendorPayments: await prisma.vendorPayment.count(),
    clientReceipts: await prisma.clientReceipt.count(),
  };
  console.log("Seeded:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
