// ============================================================
// TC Accounting System - Google Apps Script Backend
// Code.gs
// ============================================================

const COMPANIES = {
  V1: { name: 'บริษัท วี เรสซิเดนซ์ เพลซ 1 จำกัด', address: '888/1 ถ.พหลโยธิน', taxId: '0135559018014' },
  V2: { name: 'บริษัท วี เรสซิเดนซ์ เพลซ 2 จำกัด', address: '888/6 ถ.พหลโยธิน', taxId: '0135559018022' },
  V3: { name: 'บริษัท วี เรสซิเดนซ์ เพลซ 3 จำกัด', address: '777 ถ.พหลโยธิน',  taxId: '0135559018031' },
  V4: { name: 'บริษัท วี เรสซิเดนซ์ เพลซ 4 จำกัด', address: '777/3 ถ.พหลโยธิน', taxId: '0135559018049' }
};

const SHEETS = {
  ROOMS:        'ทะเบียนห้อง',
  BILLS:        'บิลรายห้อง',
  OTHER_INCOME: 'รายรับอื่นๆ',
  EXPENSES:     'รายจ่าย',
  SUMMARY:      'สรุปภาพรวม'
};

const ROOM_HEADERS = [
  'เลขห้อง','อาคาร','ประเภทห้อง','ชื่อผู้เช่า',
  'ราคา/เดือน','เงินประกัน','อัตราน้ำ','อัตราไฟ',
  'สถานะ','วันทำสัญญา','วันย้ายออก','หมายเหตุ'
];

const BILL_HEADERS = [
  'ID','เดือน','ห้อง','อาคาร','ผู้เช่า','ค่าห้อง',
  'วันจดน้ำก่อน','วันจดน้ำปัจจุบัน','หน่วยน้ำก่อน','หน่วยน้ำปัจจุบัน','หน่วยน้ำใช้','อัตราน้ำ','ค่าน้ำ',
  'วันจดไฟก่อน','วันจดไฟปัจจุบัน','หน่วยไฟก่อน','หน่วยไฟปัจจุบัน','หน่วยไฟใช้','อัตราไฟ','ค่าไฟ',
  'ค่าอื่นๆ','หมายเหตุบิล','รวม','สถานะ','วันที่ชำระ','เลขที่ใบกำกับ'
];

const OTHER_INCOME_HEADERS = [
  'ID','วันที่','อาคาร','ห้อง','ผู้เกี่ยวข้อง','หมวดหมู่','จำนวนเงิน','หมายเหตุ'
];

const EXPENSE_HEADERS = [
  'ID','วันที่','อาคาร','หมวดหมู่','ผู้รับเงิน','จำนวนเงิน','ภาษีหัก ณ ที่จ่าย','สุทธิ','หมายเหตุ'
];

const INCOME_CATEGORIES = [
  'ค่าห้อง','ค่าน้ำ','ค่าไฟ','ค่าจอดรถ','เครื่องซักผ้า',
  'คูปองอินเตอร์เน็ต','ค่าคีย์การ์ด','ค่าปรับ','ค่าทำความสะอาด',
  'จอง/ทำสัญญา','ดอกเบี้ย','ค่าต่อสัญญา','ค่าบริการ',
  'ค่าขยะ','ค่าส่วนกลาง','ค่าตกแต่ง','เงินมัดจำ','ค่าประกัน','อื่นๆ'
];

const EXPENSE_CATEGORIES = [
  'ค่าไฟฟ้า V1','ค่าไฟฟ้า V2','ค่าไฟฟ้า V3','ค่าไฟฟ้า V4',
  'ค่าน้ำประปา V1','ค่าน้ำประปา V2','ค่าน้ำประปา V3','ค่าน้ำประปา V4',
  'เงินเดือน','ค่าแรงรายวัน','ค่าล่วงเวลา','ประกันสังคม',
  'กองทุนสำรองเลี้ยงชีพ','ค่าอาหารพนักงาน','ค่าเครื่องแบบ','สวัสดิการพนักงาน',
  'ค่าบำรุงลิฟท์ V1','ค่าบำรุงลิฟท์ V2','ค่าบำรุงลิฟท์ V3','ค่าบำรุงลิฟท์ V4',
  'ค่าบำรุงสระว่ายน้ำ','ค่าบำรุงสวน','ค่าสารเคมีสระว่ายน้ำ','ค่าปุ๋ย/ยาฆ่าแมลง',
  'ค่าเช่ารถตู้','ค่าน้ำมัน ฮน3748','ค่าน้ำมัน ฮพ5886',
  'ค่าซ่อม ฮน3748','ค่าซ่อม ฮพ5886','ค่าประกันรถ ฮน3748','ค่าประกันรถ ฮพ5886','ค่า พรบ รถ',
  'ภาษีเงินได้นิติบุคคล','ภาษีมูลค่าเพิ่ม','ภาษีหัก ณ ที่จ่าย',
  'ภาษีโรงเรือน/สิ่งปลูกสร้าง','ภาษีที่ดิน','ภาษีป้าย',
  'ค่าบัญชี/สอบบัญชี','ค่าธรรมเนียมธนาคาร V1','ค่าธรรมเนียมธนาคาร V2',
  'ค่าธรรมเนียมธนาคาร V3','ค่าธรรมเนียมธนาคาร V4',
  'ดอกเบี้ยจ่าย','ค่าที่ปรึกษากฎหมาย',
  'ค่าซ่อมแซม V1','ค่าซ่อมแซม V2','ค่าซ่อมแซม V3','ค่าซ่อมแซม V4',
  'ค่าวัสดุก่อสร้าง','ค่าสีทาอาคาร','ค่าอะไหล่/อุปกรณ์','ค่าเครื่องมือช่าง',
  'ค่าเครื่องเขียน/สำนักงาน','ค่าเช่าเครื่องถ่ายเอกสาร',
  'ค่าโทรศัพท์สำนักงาน','ค่าอินเตอร์เน็ตสำนักงาน','ค่าน้ำดื่ม/ชา/กาแฟ',
  'ค่าประกันภัยอาคาร','ค่าต่อใบอนุญาต',
  'ค่าทำความสะอาด','ค่ารักษาความปลอดภัย','ค่าขยะ',
  'ค่าโฆษณา/ประชาสัมพันธ์','ค่าป้ายโฆษณา',
  'เงินประกันคืน','ค่าเสื่อมราคา','อื่นๆ'
];

// ============================================================
// Entry Point
// ============================================================
function doGet(e) {
  try {
    const page = e && e.parameter && e.parameter.page;
    if (page === 'print') {
      return HtmlService.createTemplateFromFile('Print')
        .evaluate()
        .setTitle('TC พิมพ์เอกสาร')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('TC Accounting System')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return HtmlService.createHtmlOutput('<p>Error: ' + err.message + '</p>');
  }
}

// ============================================================
// Sheet Helpers
// ============================================================
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name);
}

function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length)
      .setBackground('#1a237e')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
  }
  return sh;
}

function sheetToObjects(sh, headers) {
  const data = sh.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
    return obj;
  });
}

function nextId(sh) {
  const last = sh.getLastRow();
  if (last <= 1) return 1;
  const ids = sh.getRange(2, 1, last - 1, 1).getValues().flat()
    .map(v => parseInt(v) || 0);
  return Math.max(...ids) + 1;
}

// ============================================================
// Initialize System
// ============================================================
function initializeSystem() {
  try {
    getOrCreateSheet(SHEETS.ROOMS, ROOM_HEADERS);
    getOrCreateSheet(SHEETS.BILLS, BILL_HEADERS);
    getOrCreateSheet(SHEETS.OTHER_INCOME, OTHER_INCOME_HEADERS);
    getOrCreateSheet(SHEETS.EXPENSES, EXPENSE_HEADERS);
    getOrCreateSheet(SHEETS.SUMMARY, ['เดือน','อาคาร','รายรับค่าห้อง','รายรับน้ำ','รายรับไฟ','รายรับอื่นๆ','รวมรายรับ','รายจ่าย','กำไร/ขาดทุน']);
    return { success: true, message: 'ระบบพร้อมใช้งาน' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function initializeRooms() {
  try {
    const sh = getSheet(SHEETS.ROOMS);
    if (!sh) return { success: false, message: 'ไม่พบ Sheet ทะเบียนห้อง' };
    if (sh.getLastRow() > 1) return { success: false, message: 'มีข้อมูลห้องแล้ว' };

    const types = ['สตูดิโอ','1 ห้องนอน','2 ห้องนอน','ร้านค้า'];
    const prices = { 'สตูดิโอ': 5500, '1 ห้องนอน': 7500, '2 ห้องนอน': 12000, 'ร้านค้า': 20000 };
    const rows = [];

    // V1: 9 floors × 9 rooms = 81
    for (let f = 1; f <= 9; f++) {
      for (let r = 1; r <= 9; r++) {
        const rm = `${f}0${r}`;
        const t = (f === 1 && r <= 2) ? 'ร้านค้า' : (r <= 3 ? '2 ห้องนอน' : r <= 6 ? '1 ห้องนอน' : 'สตูดิโอ');
        rows.push([rm,'V1',t,'',prices[t],prices[t]*2,18,7,'ว่าง','','','']);
      }
    }
    // V2: 7 floors × 11 rooms = 77
    for (let f = 1; f <= 7; f++) {
      for (let r = 1; r <= 11; r++) {
        const rm = r < 10 ? `${f}0${r}` : `${f}${r}`;
        const t = (f === 1 && r <= 3) ? 'ร้านค้า' : (r <= 3 ? '2 ห้องนอน' : r <= 7 ? '1 ห้องนอน' : 'สตูดิโอ');
        rows.push([rm,'V2',t,'',prices[t],prices[t]*2,18,7,'ว่าง','','','']);
      }
    }
    // V3: 6 floors × 13 rooms = 78
    for (let f = 1; f <= 6; f++) {
      for (let r = 1; r <= 13; r++) {
        const rm = r < 10 ? `${f}0${r}` : `${f}${r}`;
        const t = (f === 1 && r <= 4) ? 'ร้านค้า' : (r <= 4 ? '2 ห้องนอน' : r <= 8 ? '1 ห้องนอน' : 'สตูดิโอ');
        rows.push([rm,'V3',t,'',prices[t],prices[t]*2,18,7,'ว่าง','','','']);
      }
    }
    // V4: 4 floors × 19 rooms = 76
    for (let f = 1; f <= 4; f++) {
      for (let r = 1; r <= 19; r++) {
        const rm = r < 10 ? `${f}0${r}` : `${f}${r}`;
        const t = (f === 1 && r <= 5) ? 'ร้านค้า' : (r <= 5 ? '2 ห้องนอน' : r <= 11 ? '1 ห้องนอน' : 'สตูดิโอ');
        rows.push([rm,'V4',t,'',prices[t],prices[t]*2,18,7,'ว่าง','','','']);
      }
    }

    sh.getRange(2, 1, rows.length, ROOM_HEADERS.length).setValues(rows);
    return { success: true, message: `เพิ่มข้อมูล ${rows.length} ห้องสำเร็จ` };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ============================================================
// Load All Data (single call)
// ============================================================
function getAllData() {
  try {
    initializeSystem();
    return {
      rooms:       getRooms(),
      bills:       getBills(),
      otherIncome: getOtherIncome(),
      expenses:    getExpenses(),
      companies:   COMPANIES,
      incomeCategories:  INCOME_CATEGORIES,
      expenseCategories: EXPENSE_CATEGORIES,
      roomHeaders:  ROOM_HEADERS,
      billHeaders:  BILL_HEADERS
    };
  } catch (err) {
    return { rooms:[], bills:[], otherIncome:[], expenses:[], companies:{}, incomeCategories:[], expenseCategories:[] };
  }
}

// ============================================================
// Rooms CRUD
// ============================================================
function getRooms() {
  try {
    const sh = getSheet(SHEETS.ROOMS);
    if (!sh) return [];
    return sheetToObjects(sh, ROOM_HEADERS);
  } catch (err) { return []; }
}

function saveRoom(data) {
  try {
    const sh = getSheet(SHEETS.ROOMS);
    if (!sh) return { success: false, message: 'ไม่พบ Sheet' };
    const rows = sh.getDataRange().getValues();
    const roomIdx = rows.findIndex((r, i) => i > 0 && r[0] == data['เลขห้อง'] && r[1] == data['อาคาร']);
    const row = ROOM_HEADERS.map(h => data[h] !== undefined ? data[h] : '');
    if (roomIdx > 0) {
      sh.getRange(roomIdx + 1, 1, 1, row.length).setValues([row]);
      return { success: true, message: 'อัปเดตห้องสำเร็จ' };
    }
    sh.appendRow(row);
    return { success: true, message: 'เพิ่มห้องสำเร็จ' };
  } catch (err) { return { success: false, message: err.message }; }
}

function updateRoomStatus(roomNo, building, status, date, note) {
  try {
    const sh = getSheet(SHEETS.ROOMS);
    if (!sh) return { success: false, message: 'ไม่พบ Sheet' };
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] == roomNo && rows[i][1] == building) {
        sh.getRange(i + 1, 9).setValue(status);
        if (status === 'ทำสัญญา') sh.getRange(i + 1, 10).setValue(date);
        if (status === 'ย้ายออก')  sh.getRange(i + 1, 11).setValue(date);
        if (note) sh.getRange(i + 1, 12).setValue(note);
        return { success: true };
      }
    }
    return { success: false, message: 'ไม่พบห้อง' };
  } catch (err) { return { success: false, message: err.message }; }
}

function updateRoomTenant(roomNo, building, tenant) {
  try {
    const sh = getSheet(SHEETS.ROOMS);
    if (!sh) return { success: false, message: 'ไม่พบ Sheet' };
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] == roomNo && rows[i][1] == building) {
        sh.getRange(i + 1, 4).setValue(tenant);
        return { success: true };
      }
    }
    return { success: false, message: 'ไม่พบห้อง' };
  } catch (err) { return { success: false, message: err.message }; }
}

// ============================================================
// Bills CRUD
// ============================================================
function getBills() {
  try {
    const sh = getSheet(SHEETS.BILLS);
    if (!sh) return [];
    return sheetToObjects(sh, BILL_HEADERS);
  } catch (err) { return []; }
}

function saveBill(data) {
  try {
    const sh = getSheet(SHEETS.BILLS);
    if (!sh) return { success: false, message: 'ไม่พบ Sheet' };

    // Check duplicate bill same room+month
    const existing = sh.getDataRange().getValues();
    for (let i = 1; i < existing.length; i++) {
      if (existing[i][1] == data['เดือน'] && existing[i][2] == data['ห้อง'] && existing[i][3] == data['อาคาร']) {
        return { success: false, message: 'มีบิลห้องนี้ในเดือนนี้แล้ว' };
      }
    }

    const id = nextId(sh);
    const month = data['เดือน'] || '';
    const invNo = month.replace('-','') + data['อาคาร'] + data['ห้อง'];
    data['ID'] = id;
    data['เลขที่ใบกำกับ'] = invNo;
    data['สถานะ'] = data['สถานะ'] || 'รอชำระ';

    const row = BILL_HEADERS.map(h => data[h] !== undefined ? data[h] : '');
    sh.appendRow(row);
    return { success: true, id: id, invNo: invNo, message: 'บันทึกบิลสำเร็จ' };
  } catch (err) { return { success: false, message: err.message }; }
}

function updateBillStatus(billId, status, payDate) {
  try {
    const sh = getSheet(SHEETS.BILLS);
    if (!sh) return { success: false, message: 'ไม่พบ Sheet' };
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] == billId) {
        const statusCol = BILL_HEADERS.indexOf('สถานะ') + 1;
        const payCol    = BILL_HEADERS.indexOf('วันที่ชำระ') + 1;
        sh.getRange(i + 1, statusCol).setValue(status);
        sh.getRange(i + 1, payCol).setValue(payDate || new Date());
        // Auto-save to other income if paid
        if (status === 'ชำระแล้ว') {
          const bill = {};
          BILL_HEADERS.forEach((h, j) => { bill[h] = rows[i][j]; });
          bill['สถานะ'] = status;
          bill['วันที่ชำระ'] = payDate || new Date();
          _autoSaveIncomeFromBill(bill);
        }
        return { success: true };
      }
    }
    return { success: false, message: 'ไม่พบบิล ID: ' + billId };
  } catch (err) { return { success: false, message: err.message }; }
}

function _autoSaveIncomeFromBill(bill) {
  // Internal: save income entries from paid bill (no try/catch - caller handles)
  const payDate = bill['วันที่ชำระ'] || new Date();
  const room   = bill['ห้อง'];
  const bld    = bill['อาคาร'];
  const tenant = bill['ผู้เช่า'];
  const entries = [
    { cat: 'ค่าห้อง', amt: parseFloat(bill['ค่าห้อง']) || 0 },
    { cat: 'ค่าน้ำ',  amt: parseFloat(bill['ค่าน้ำ'])  || 0 },
    { cat: 'ค่าไฟ',   amt: parseFloat(bill['ค่าไฟ'])   || 0 }
  ];
  if (parseFloat(bill['ค่าอื่นๆ']) > 0) {
    entries.push({ cat: 'อื่นๆ', amt: parseFloat(bill['ค่าอื่นๆ']) });
  }
  const sh = getSheet(SHEETS.OTHER_INCOME);
  if (!sh) return;
  entries.forEach(e => {
    if (e.amt > 0) {
      const id = nextId(sh);
      sh.appendRow([id, payDate, bld, room, tenant, e.cat, e.amt, `บิลเดือน ${bill['เดือน']}`]);
    }
  });
}

function deleteBill(billId) {
  try {
    const sh = getSheet(SHEETS.BILLS);
    if (!sh) return { success: false, message: 'ไม่พบ Sheet' };
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] == billId) {
        sh.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, message: 'ไม่พบบิล' };
  } catch (err) { return { success: false, message: err.message }; }
}

// ============================================================
// Overdue Bills
// ============================================================
function getOverdueBills() {
  try {
    const bills = getBills();
    const overdue = bills.filter(b => b['สถานะ'] === 'รอชำระ' || b['สถานะ'] === 'ค้างชำระ');
    const total = overdue.reduce((s, b) => s + (parseFloat(b['รวม']) || 0), 0);
    return { bills: overdue, count: overdue.length, total: total };
  } catch (err) { return { bills: [], count: 0, total: 0 }; }
}

// ============================================================
// Other Income CRUD
// ============================================================
function getOtherIncome() {
  try {
    const sh = getSheet(SHEETS.OTHER_INCOME);
    if (!sh) return [];
    return sheetToObjects(sh, OTHER_INCOME_HEADERS);
  } catch (err) { return []; }
}

function saveOtherIncome(data) {
  try {
    const sh = getSheet(SHEETS.OTHER_INCOME);
    if (!sh) return { success: false, message: 'ไม่พบ Sheet' };
    const id = nextId(sh);
    data['ID'] = id;
    const row = OTHER_INCOME_HEADERS.map(h => data[h] !== undefined ? data[h] : '');
    sh.appendRow(row);
    return { success: true, id: id };
  } catch (err) { return { success: false, message: err.message }; }
}

function deleteOtherIncome(id) {
  try {
    const sh = getSheet(SHEETS.OTHER_INCOME);
    if (!sh) return { success: false, message: 'ไม่พบ Sheet' };
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] == id) { sh.deleteRow(i + 1); return { success: true }; }
    }
    return { success: false, message: 'ไม่พบรายการ' };
  } catch (err) { return { success: false, message: err.message }; }
}

// ============================================================
// Expenses CRUD
// ============================================================
function getExpenses() {
  try {
    const sh = getSheet(SHEETS.EXPENSES);
    if (!sh) return [];
    return sheetToObjects(sh, EXPENSE_HEADERS);
  } catch (err) { return []; }
}

function saveExpense(data) {
  try {
    const sh = getSheet(SHEETS.EXPENSES);
    if (!sh) return { success: false, message: 'ไม่พบ Sheet' };
    const id = nextId(sh);
    data['ID'] = id;
    const amt  = parseFloat(data['จำนวนเงิน']) || 0;
    const tax  = parseFloat(data['ภาษีหัก ณ ที่จ่าย']) || 0;
    data['สุทธิ'] = amt - tax;
    const row = EXPENSE_HEADERS.map(h => data[h] !== undefined ? data[h] : '');
    sh.appendRow(row);
    return { success: true, id: id };
  } catch (err) { return { success: false, message: err.message }; }
}

function deleteExpense(id) {
  try {
    const sh = getSheet(SHEETS.EXPENSES);
    if (!sh) return { success: false, message: 'ไม่พบ Sheet' };
    const rows = sh.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] == id) { sh.deleteRow(i + 1); return { success: true }; }
    }
    return { success: false, message: 'ไม่พบรายการ' };
  } catch (err) { return { success: false, message: err.message }; }
}

// ============================================================
// Reports / Summary
// ============================================================
function getMonthlyReport(month) {
  try {
    const bills       = getBills().filter(b => b['เดือน'] === month);
    const otherIncome = getOtherIncome().filter(i => {
      const d = i['วันที่'];
      if (!d) return false;
      const dt = (d instanceof Date) ? d : new Date(d);
      return Utilities.formatDate(dt, 'Asia/Bangkok', 'yyyy-MM') === month;
    });
    const expenses = getExpenses().filter(e => {
      const d = e['วันที่'];
      if (!d) return false;
      const dt = (d instanceof Date) ? d : new Date(d);
      return Utilities.formatDate(dt, 'Asia/Bangkok', 'yyyy-MM') === month;
    });

    const paidBills = bills.filter(b => b['สถานะ'] === 'ชำระแล้ว');
    const summary = { V1:{}, V2:{}, V3:{}, V4:{} };
    ['V1','V2','V3','V4'].forEach(v => {
      const vb = paidBills.filter(b => b['อาคาร'] === v);
      summary[v] = {
        rent:  vb.reduce((s,b) => s + (parseFloat(b['ค่าห้อง'])||0), 0),
        water: vb.reduce((s,b) => s + (parseFloat(b['ค่าน้ำ'])||0), 0),
        elec:  vb.reduce((s,b) => s + (parseFloat(b['ค่าไฟ'])||0), 0),
        other: vb.reduce((s,b) => s + (parseFloat(b['ค่าอื่นๆ'])||0), 0)
      };
      summary[v].totalIncome = summary[v].rent + summary[v].water + summary[v].elec + summary[v].other;
    });
    const totalExpense = expenses.reduce((s,e) => s + (parseFloat(e['จำนวนเงิน'])||0), 0);
    const totalOtherInc = otherIncome.reduce((s,i) => s + (parseFloat(i['จำนวนเงิน'])||0), 0);
    const grandIncome = ['V1','V2','V3','V4'].reduce((s,v) => s + summary[v].totalIncome, 0) + totalOtherInc;
    return {
      month, summary, bills, otherIncome, expenses,
      totalExpense, totalOtherIncome: totalOtherInc,
      grandIncome, netProfit: grandIncome - totalExpense,
      overdueCount: bills.filter(b => b['สถานะ'] === 'รอชำระ').length
    };
  } catch (err) { return { month, summary:{}, bills:[], otherIncome:[], expenses:[], totalExpense:0, grandIncome:0, netProfit:0 }; }
}

function getFullReport(filters) {
  try {
    filters = filters || {};
    let bills = getBills();
    let income = getOtherIncome();
    let expenses = getExpenses();
    if (filters.building) {
      bills    = bills.filter(b => b['อาคาร'] === filters.building);
      income   = income.filter(i => i['อาคาร'] === filters.building);
      expenses = expenses.filter(e => e['อาคาร'] === filters.building);
    }
    if (filters.month) {
      bills    = bills.filter(b => b['เดือน'] === filters.month);
      const mf = r => { const d = r['วันที่']; if(!d) return false; const dt=(d instanceof Date)?d:new Date(d); return Utilities.formatDate(dt,'Asia/Bangkok','yyyy-MM')===filters.month; };
      income   = income.filter(mf);
      expenses = expenses.filter(mf);
    }
    if (filters.status) bills = bills.filter(b => b['สถานะ'] === filters.status);
    return { bills, income, expenses };
  } catch (err) { return { bills:[], income:[], expenses:[] }; }
}

// ============================================================
// Print Data
// ============================================================
function getPrintData(billIds) {
  try {
    if (!billIds || !billIds.length) return [];
    const bills = getBills();
    const rooms = getRooms();
    const roomMap = {};
    rooms.forEach(r => { roomMap[r['อาคาร'] + '-' + r['เลขห้อง']] = r; });
    return bills
      .filter(b => billIds.includes(String(b['ID'])))
      .map(b => {
        const key = b['อาคาร'] + '-' + b['ห้อง'];
        const room = roomMap[key] || {};
        const co = COMPANIES[b['อาคาร']] || {};
        return { ...b, roomData: room, company: co };
      });
  } catch (err) { return []; }
}

function getConfig() {
  try {
    return { companies: COMPANIES, incomeCategories: INCOME_CATEGORIES, expenseCategories: EXPENSE_CATEGORIES };
  } catch (err) { return { companies:{}, incomeCategories:[], expenseCategories:[] }; }
}

function getAvailableMonths() {
  try {
    const bills = getBills();
    const months = [...new Set(bills.map(b => b['เดือน']).filter(Boolean))].sort().reverse();
    return months.length ? months : [Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM')];
  } catch (err) { return []; }
}
