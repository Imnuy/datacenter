const SHEET_NAME = "ชีต1";

function doGet(e) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    const headers = data.shift();
    const result = data.map(row => {
        let obj = {};
        headers.forEach((h, i) => {
            // รหัส (column index 0) ให้ pad เป็น 5 หลักเสมอ
            if (i === 0 && row[i] !== '') {
                obj[h] = String(row[i]).padStart(5, '0');
            } else {
                obj[h] = row[i];
            }
        });
        return obj;
    });

    return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = JSON.parse(e.postData.contents);

    const action = data.action;

    // Mapping fields from frontend to sheet columns
    // hospcode -> col A
    // hosname  -> col B
    // wat      -> col C
    // total    -> col D
    // smoking  -> col E
    // ip       -> col G

    if (action === "add") {
        sheet.appendRow([
            "'" + String(data["hospcode"]), // A: รหัส
            data["hosname"],               // B: ชื่อรพ.สต.
            data["wat"],                   // C: วัด
            data["total"],                 // D: จำนวนพระ
            data["smoking"],               // E: จำนวนพระสูบบุหรี่
            new Date(),                    // F: วันที่อัพเดต
            data["ip"] || ""               // G: ip address
        ]);
    }

    if (action === "update") {
        const rows = sheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
            // ค้นหาด้วย hospcode (A) และ วัด (C)
            if (String(rows[i][0]) === String(data["hospcode"]) && String(rows[i][2]) === String(data["wat"])) {
                sheet.getRange(i + 1, 2).setValue(data["hosname"]);
                sheet.getRange(i + 1, 3).setValue(data["wat"]);
                sheet.getRange(i + 1, 4).setValue(data["total"]);
                sheet.getRange(i + 1, 5).setValue(data["smoking"]);
                sheet.getRange(i + 1, 6).setValue(new Date()); // F: วันที่อัพเดต
                sheet.getRange(i + 1, 7).setValue(data["ip"] || ""); // G: ip address
                break;
            }
        }
    }

    if (action === "delete") {
        const rows = sheet.getDataRange().getValues();
        for (let i = rows.length - 1; i >= 1; i--) {
            if (String(rows[i][0]) === String(data["hospcode"]) && String(rows[i][2]) === String(data["wat"])) {
                sheet.deleteRow(i + 1);
                break;
            }
        }
    }

    return ContentService
        .createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
}